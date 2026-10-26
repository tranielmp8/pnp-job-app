// Every function here takes the signed-in user's id and filters on it.
import { randomUUID } from 'node:crypto';
import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { resume } from '#lib/server/db/schema.ts';
import { getStorage } from '#lib/server/storage/index.ts';

export type Resume = typeof resume.$inferSelect;

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPT = '.pdf,.docx,.png,.jpg,.jpeg,.webp';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Detects the real type from the file's first bytes; the browser-sent type is not trusted. */
function sniff(bytes: Uint8Array, fileName: string): { mime: string; ext: string } | null {
	const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
	const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));

	if (starts(0x25, 0x50, 0x44, 0x46)) return { mime: 'application/pdf', ext: 'pdf' };
	if (starts(0x89, 0x50, 0x4e, 0x47)) return { mime: 'image/png', ext: 'png' };
	if (starts(0xff, 0xd8, 0xff)) return { mime: 'image/jpeg', ext: 'jpg' };
	if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
	// DOCX is a zip; require the extension too since any zip starts this way.
	if (starts(0x50, 0x4b, 0x03, 0x04) && /\.docx$/i.test(fileName)) {
		return { mime: DOCX_MIME, ext: 'docx' };
	}
	return null;
}

export class ResumeError extends Error {}

export function listResumes(userId: string) {
	return db
		.select()
		.from(resume)
		.where(eq(resume.userId, userId))
		.orderBy(desc(resume.isDefault), desc(resume.uploadedAt));
}

export async function getResume(userId: string, id: number): Promise<Resume | null> {
	const [row] = await db
		.select()
		.from(resume)
		.where(and(eq(resume.id, id), eq(resume.userId, userId)));
	return row ?? null;
}

export async function getDefaultResumeId(userId: string): Promise<number | null> {
	const [row] = await db
		.select({ id: resume.id })
		.from(resume)
		.where(and(eq(resume.userId, userId), eq(resume.isDefault, true)));
	return row?.id ?? null;
}

/** A user's first resume becomes their default. */
async function isFirst(userId: string) {
	const [{ n }] = await db.select({ n: count() }).from(resume).where(eq(resume.userId, userId));
	return n === 0;
}

export async function addLink(userId: string, label: string, rawUrl: string) {
	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch {
		throw new ResumeError('Enter a full link, starting with https://');
	}
	if (url.protocol !== 'https:') throw new ResumeError('The link must start with https://');
	if (rawUrl.length > 2000) throw new ResumeError('That link is too long.');

	const [row] = await db
		.insert(resume)
		.values({ userId, label, kind: 'link', url: url.href, isDefault: await isFirst(userId) })
		.returning();
	return row;
}

export async function addFile(userId: string, label: string, file: File) {
	const storage = getStorage();
	if (!storage) throw new ResumeError('File uploads are not enabled yet. Add a link instead.');
	if (file.size === 0) throw new ResumeError('Choose a file to upload.');
	if (file.size > MAX_FILE_BYTES) throw new ResumeError('Files must be 5 MB or smaller.');

	const bytes = new Uint8Array(await file.arrayBuffer());
	const type = sniff(bytes, file.name);
	if (!type) throw new ResumeError('Upload a PDF, Word (.docx), PNG, JPG or WebP file.');

	const storageKey = `resumes/${userId}/${randomUUID()}.${type.ext}`;
	await storage.put(storageKey, bytes, type.mime);

	try {
		const [row] = await db
			.insert(resume)
			.values({
				userId,
				label,
				kind: 'file',
				fileName: file.name.slice(0, 255),
				storageKey,
				mimeType: type.mime,
				sizeBytes: file.size,
				isDefault: await isFirst(userId)
			})
			.returning();
		return row;
	} catch (e) {
		await storage.delete(storageKey).catch(() => {});
		throw e;
	}
}

export async function setDefault(userId: string, id: number): Promise<boolean> {
	return db.transaction(async (tx) => {
		const [target] = await tx
			.select({ id: resume.id })
			.from(resume)
			.where(and(eq(resume.id, id), eq(resume.userId, userId)));
		if (!target) return false;
		await tx.update(resume).set({ isDefault: false }).where(eq(resume.userId, userId));
		await tx
			.update(resume)
			.set({ isDefault: true })
			.where(and(eq(resume.id, id), eq(resume.userId, userId)));
		return true;
	});
}

export async function deleteResume(userId: string, id: number): Promise<boolean> {
	const [row] = await db
		.delete(resume)
		.where(and(eq(resume.id, id), eq(resume.userId, userId)))
		.returning();
	if (!row) return false;

	if (row.storageKey) await getStorage()?.delete(row.storageKey);

	// Keep a default if any resumes are left.
	if (row.isDefault) {
		const [next] = await db
			.select({ id: resume.id })
			.from(resume)
			.where(eq(resume.userId, userId))
			.orderBy(desc(resume.uploadedAt))
			.limit(1);
		if (next) await setDefault(userId, next.id);
	}
	return true;
}

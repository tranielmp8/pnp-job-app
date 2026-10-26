// Every function here takes the signed-in user's id and filters on it, so one
// user can never read or change another user's applications.
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { application, applicationStatus, job } from '#lib/server/db/schema.ts';
import { getDefaultResumeId, getResume } from '#lib/server/resumes.ts';

export type ApplicationStatus = (typeof applicationStatus.enumValues)[number];
export const STATUSES = applicationStatus.enumValues;

export function isStatus(value: unknown): value is ApplicationStatus {
	return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

/** The user's application for this job, matched by dedupe hash so reposts count too. */
async function findForJob(userId: string, jobId: number) {
	const [row] = await db
		.select({ app: application, dedupeHash: job.dedupeHash, applyUrl: job.applyUrl })
		.from(job)
		.leftJoin(
			application,
			and(eq(application.userId, userId), eq(application.dedupeHash, job.dedupeHash))
		)
		.where(eq(job.id, jobId));
	return row ?? null;
}

/**
 * Records that the user applied. Already-applied (or further along) stays as is;
 * a "saved" entry is promoted to "applied". Returns the job's apply URL.
 */
export async function markApplied(userId: string, jobId: number): Promise<string | null> {
	const found = await findForJob(userId, jobId);
	if (!found) return null;
	// The user's default resume is attached to new applications.
	const resumeId = await getDefaultResumeId(userId);

	if (found.app) {
		if (found.app.status === 'saved') {
			await db
				.update(application)
				.set({
					status: 'applied',
					appliedAt: new Date(),
					resumeId: found.app.resumeId ?? resumeId
				})
				.where(and(eq(application.id, found.app.id), eq(application.userId, userId)));
		}
	} else {
		await db
			.insert(application)
			.values({
				userId,
				jobId,
				dedupeHash: found.dedupeHash,
				status: 'applied',
				appliedAt: new Date(),
				resumeId
			})
			.onConflictDoNothing();
	}
	return found.applyUrl;
}

/** Saves the job for later. No-op if the user already has any entry for it. */
export async function saveJob(userId: string, jobId: number): Promise<boolean> {
	const found = await findForJob(userId, jobId);
	if (!found) return false;
	if (!found.app) {
		await db
			.insert(application)
			.values({ userId, jobId, dedupeHash: found.dedupeHash, status: 'saved' })
			.onConflictDoNothing();
	}
	return true;
}

/** Removes a "saved" entry. Applied entries are kept; remove those from the tracker. */
export async function unsaveJob(userId: string, jobId: number): Promise<void> {
	const found = await findForJob(userId, jobId);
	if (found?.app?.status === 'saved') {
		await db
			.delete(application)
			.where(and(eq(application.id, found.app.id), eq(application.userId, userId)));
	}
}

export async function listApplications(userId: string, status?: ApplicationStatus) {
	return db
		.select({
			id: application.id,
			status: application.status,
			notes: application.notes,
			resumeId: application.resumeId,
			appliedAt: application.appliedAt,
			createdAt: application.createdAt,
			updatedAt: application.updatedAt,
			job: {
				id: job.id,
				title: job.title,
				company: job.company,
				city: job.city,
				state: job.state,
				isRemote: job.isRemote,
				applyUrl: job.applyUrl,
				source: job.source
			}
		})
		.from(application)
		.innerJoin(job, eq(job.id, application.jobId))
		.where(
			status
				? and(eq(application.userId, userId), eq(application.status, status))
				: eq(application.userId, userId)
		)
		.orderBy(desc(sql`coalesce(${application.appliedAt}, ${application.createdAt})`));
}

export async function countByStatus(userId: string): Promise<Record<ApplicationStatus, number>> {
	const rows = await db
		.select({ status: application.status, n: count() })
		.from(application)
		.where(eq(application.userId, userId))
		.groupBy(application.status);
	const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
		ApplicationStatus,
		number
	>;
	for (const r of rows) counts[r.status] = r.n;
	return counts;
}

export async function updateApplication(
	userId: string,
	id: number,
	changes: { status?: ApplicationStatus; notes?: string | null; resumeId?: number | null }
): Promise<boolean> {
	// A resume can only be attached if it belongs to the same user.
	if (changes.resumeId != null && !(await getResume(userId, changes.resumeId))) return false;

	const set: Partial<typeof application.$inferInsert> = { ...changes };
	// Moving out of "saved" for the first time stamps the applied date.
	if (changes.status && changes.status !== 'saved') {
		set.appliedAt = sql`coalesce(${application.appliedAt}, now())` as unknown as Date;
	}
	const rows = await db
		.update(application)
		.set(set)
		.where(and(eq(application.id, id), eq(application.userId, userId)))
		.returning({ id: application.id });
	return rows.length > 0;
}

export async function deleteApplication(userId: string, id: number): Promise<boolean> {
	const rows = await db
		.delete(application)
		.where(and(eq(application.id, id), eq(application.userId, userId)))
		.returning({ id: application.id });
	return rows.length > 0;
}

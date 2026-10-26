import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getResume } from '#lib/server/resumes.ts';
import { getStorage } from '#lib/server/storage/index.ts';

// Streams an uploaded resume to its owner only.
export const GET: RequestHandler = async ({ params, locals, url }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) error(404, 'Not found');

	const row = await getResume(locals.user!.id, id);
	if (!row || row.kind !== 'file' || !row.storageKey || !row.mimeType) error(404, 'Not found');

	const body = await getStorage()?.get(row.storageKey);
	if (!body) error(404, 'File not available');

	const inline =
		url.searchParams.get('download') !== '1' &&
		(row.mimeType === 'application/pdf' || row.mimeType.startsWith('image/'));
	const name = (row.fileName ?? `resume-${row.id}`).replace(/["\r\n]/g, '');

	const headers = new Headers({
		'Content-Type': row.mimeType,
		'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
		'Cache-Control': 'private, no-store',
		'X-Content-Type-Options': 'nosniff'
	});
	// Uploaded content can't run scripts even if opened directly. Not for PDFs:
	// Chrome refuses to render a PDF under a sandbox CSP.
	if (row.mimeType !== 'application/pdf') {
		headers.set('Content-Security-Policy', "sandbox; default-src 'none'; img-src 'self'");
	}
	return new Response(body, { headers });
};

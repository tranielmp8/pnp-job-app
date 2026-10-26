// Client-safe helpers for resume links.

/**
 * Turns a Google Drive / Docs share link into its embeddable `/preview` URL.
 * Returns null for anything else (those just open in a new tab).
 * The file must be shared as "Anyone with the link" for the preview to load.
 */
export function toEmbedUrl(raw: string | null | undefined): string | null {
	if (!raw) return null;
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		return null;
	}
	if (url.protocol !== 'https:') return null;

	if (url.hostname === 'drive.google.com') {
		const id = url.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] ?? url.searchParams.get('id');
		return id && /^[\w-]+$/.test(id) ? `https://drive.google.com/file/d/${id}/preview` : null;
	}
	if (url.hostname === 'docs.google.com') {
		const m = url.pathname.match(/^\/(document|presentation|spreadsheets)\/d\/([\w-]+)/);
		return m ? `https://docs.google.com/${m[1]}/d/${m[2]}/preview` : null;
	}
	return null;
}

export type ResumeViewKind = 'embed' | 'pdf' | 'image' | 'download' | 'external';

export function viewKind(r: {
	kind: string;
	url: string | null;
	mimeType: string | null;
}): ResumeViewKind {
	if (r.kind === 'link') return toEmbedUrl(r.url) ? 'embed' : 'external';
	if (r.mimeType === 'application/pdf') return 'pdf';
	if (r.mimeType?.startsWith('image/')) return 'image';
	return 'download';
}

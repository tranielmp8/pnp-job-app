import { createHash } from 'node:crypto';
import { US_STATE_OPTIONS } from '#lib/states.ts';

export const US_STATES: Record<string, string> = Object.fromEntries(US_STATE_OPTIONS);

const STATE_BY_NAME = new Map(
	Object.entries(US_STATES).map(([code, name]) => [name.toLowerCase(), code])
);

/** Accepts `TX`, `tx` or `Texas` and returns `TX`; anything else returns null. */
export function toStateCode(value: string | null | undefined): string | null {
	if (!value) return null;
	const v = value.trim();
	if (v.toUpperCase() in US_STATES) return v.toUpperCase();
	return STATE_BY_NAME.get(v.toLowerCase()) ?? null;
}

const REMOTE_RE = /\b(remote|work from home|wfh|telecommute)\b/i;

export function looksRemote(...text: (string | null | undefined)[]): boolean {
	return text.some((t) => t && REMOTE_RE.test(t));
}

const squash = (s: string | null | undefined) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Same posting from different providers should produce the same hash. Company
 * suffixes like "Inc" / "LLC" vary between boards, so they're dropped.
 */
export function dedupeHash(
	company: string | null,
	title: string,
	city: string | null,
	state: string | null
): string {
	const co = squash(company?.replace(/\b(inc|llc|ltd|corp|corporation|co)\b\.?/gi, ''));
	const key = [co, squash(title), squash(city), squash(state)].join('|');
	return createHash('sha1').update(key).digest('hex');
}

/** Provider links end up in href/redirects, so only plain http(s) URLs are allowed. */
export function isHttpUrl(value: string | null | undefined): boolean {
	if (!value) return false;
	try {
		const { protocol } = new URL(value);
		return protocol === 'https:' || protocol === 'http:';
	} catch {
		return false;
	}
}

export const toInt = (n: unknown): number | null =>
	typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : null;

export function toDate(value: unknown): Date | null {
	if (typeof value !== 'string' && typeof value !== 'number') return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

import { RAPIDAPI_KEY } from '$app/env/private';
import type { JobProvider, NormalizedJob } from './types.ts';
import { dedupeHash, looksRemote, toDate, toInt, toStateCode } from './normalize.ts';

// https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
interface JSearchJob {
	job_id: string;
	job_title: string;
	employer_name?: string;
	job_city?: string | null;
	job_state?: string | null;
	job_country?: string | null;
	job_is_remote?: boolean;
	job_min_salary?: number | null;
	job_max_salary?: number | null;
	job_salary_period?: string | null;
	job_description?: string;
	job_apply_link: string;
	job_posted_at_datetime_utc?: string | null;
}

const HOST = 'jsearch.p.rapidapi.com';

// Salaries are stored as yearly amounts.
const PER_YEAR: Record<string, number> = { HOUR: 2080, DAY: 260, WEEK: 52, MONTH: 12, YEAR: 1 };
const yearly = (n: number | null | undefined, period: string | null | undefined) =>
	toInt(typeof n === 'number' ? n * (PER_YEAR[period?.toUpperCase() ?? 'YEAR'] ?? 1) : null);

export const jsearch: JobProvider = {
	source: 'jsearch',
	label: 'JSearch',
	enabled: Boolean(RAPIDAPI_KEY),

	async search(q) {
		// JSearch takes a single natural-language query, e.g. "nurse in Austin, TX".
		const where = [q.city, q.state].filter(Boolean).join(', ');
		const query = [q.keywords || 'jobs', where && `in ${where}`].filter(Boolean).join(' ');
		const params = new URLSearchParams({
			query,
			page: String(q.page),
			num_pages: '1',
			country: 'us'
		});
		if (q.remoteOnly) params.set('work_from_home', 'true');

		const res = await fetch(`https://${HOST}/search-v2?${params}`, {
			headers: { 'x-rapidapi-key': RAPIDAPI_KEY!, 'x-rapidapi-host': HOST },
			signal: AbortSignal.timeout(15_000)
		});
		if (!res.ok) {
			const msg = (await res.json().catch(() => null))?.message;
			throw new Error(`JSearch responded ${res.status}${msg ? `: ${msg}` : ''}`);
		}
		const body = (await res.json()) as { data?: { jobs?: JSearchJob[] } };

		return (body.data?.jobs ?? []).map((j): NormalizedJob => {
			const state = toStateCode(j.job_state);
			const city = j.job_city ?? null;
			const company = j.employer_name ?? null;
			return {
				source: 'jsearch',
				externalId: j.job_id,
				dedupeHash: dedupeHash(company, j.job_title, city, state),
				title: j.job_title,
				company,
				city,
				state,
				country: j.job_country ?? null,
				isRemote: Boolean(j.job_is_remote) || looksRemote(j.job_title),
				salaryMin: yearly(j.job_min_salary, j.job_salary_period),
				salaryMax: yearly(j.job_max_salary, j.job_salary_period),
				description: j.job_description ?? null,
				applyUrl: j.job_apply_link,
				postedAt: toDate(j.job_posted_at_datetime_utc)
			};
		});
	}
};

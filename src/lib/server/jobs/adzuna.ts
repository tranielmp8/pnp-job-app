import { ADZUNA_APP_ID, ADZUNA_API_KEY } from '$app/env/private';
import type { JobProvider, NormalizedJob } from './types.ts';
import { dedupeHash, looksRemote, toDate, toInt, toStateCode, US_STATES } from './normalize.ts';

// https://developer.adzuna.com/docs/search
interface AdzunaJob {
	id: string;
	title: string;
	description?: string;
	redirect_url: string;
	created?: string;
	salary_min?: number;
	salary_max?: number;
	company?: { display_name?: string };
	// area is [country, state, county, city?]
	location?: { display_name?: string; area?: string[] };
}

export const adzuna: JobProvider = {
	source: 'adzuna',
	label: 'Adzuna',
	enabled: Boolean(ADZUNA_APP_ID && ADZUNA_API_KEY),

	async search(q) {
		const params = new URLSearchParams({
			app_id: ADZUNA_APP_ID!,
			app_key: ADZUNA_API_KEY!,
			results_per_page: '20',
			'content-type': 'application/json'
		});
		const what = [q.keywords, q.remoteOnly ? 'remote' : ''].filter(Boolean).join(' ');
		if (what) params.set('what', what);
		const where = [q.city, q.state ? US_STATES[q.state] : ''].filter(Boolean).join(', ');
		if (where) params.set('where', where);

		const res = await fetch(`https://api.adzuna.com/v1/api/jobs/us/search/${q.page}?${params}`, {
			signal: AbortSignal.timeout(10_000)
		});
		if (!res.ok) throw new Error(`Adzuna responded ${res.status}`);
		const body = (await res.json()) as { results?: AdzunaJob[] };

		return (body.results ?? []).map((j): NormalizedJob => {
			const area = j.location?.area ?? [];
			const state = toStateCode(area[1]);
			const city = area[3] ?? null;
			const company = j.company?.display_name ?? null;
			return {
				source: 'adzuna',
				externalId: String(j.id),
				dedupeHash: dedupeHash(company, j.title, city, state),
				title: j.title,
				company,
				city,
				state,
				country: area[0] ?? 'US',
				isRemote: looksRemote(j.title, j.description, j.location?.display_name),
				salaryMin: toInt(j.salary_min),
				salaryMax: toInt(j.salary_max),
				description: j.description ?? null,
				applyUrl: j.redirect_url,
				postedAt: toDate(j.created)
			};
		});
	}
};

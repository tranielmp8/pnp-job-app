import type { PageServerLoad } from './$types';
import { enabledProviders, searchJobs, type JobQuery } from '#lib/server/jobs/index.ts';
import { toStateCode } from '#lib/server/jobs/normalize.ts';

export const load: PageServerLoad = async ({ url, locals }) => {
	const p = url.searchParams;
	const query: JobQuery = {
		keywords: (p.get('q') ?? '').trim().slice(0, 200),
		city: (p.get('city') ?? '').trim().slice(0, 100),
		state: toStateCode(p.get('state')) ?? '',
		remoteOnly: p.get('remote') === '1',
		page: Math.min(Math.max(Number(p.get('page')) || 1, 1), 20)
	};
	const showApplied = p.get('showApplied') === '1';

	const providers = enabledProviders();
	const hasSearch = Boolean(query.keywords || query.city || query.state || query.remoteOnly);

	if (!hasSearch || !providers.length) {
		return {
			query,
			showApplied,
			providers,
			searched: false,
			jobs: [],
			hiddenCount: 0,
			providerCount: 0,
			errors: []
		};
	}

	const { jobs: all, errors } = await searchJobs(query, locals.user!.id);
	// Jobs the user already applied to are hidden unless they ask to see them. Saved ones stay.
	const isApplied = (s: string | null) => s !== null && s !== 'saved';
	const jobs = showApplied ? all : all.filter((j) => !isApplied(j.applicationStatus));

	return {
		query,
		showApplied,
		providers,
		searched: true,
		jobs,
		hiddenCount: all.length - jobs.length,
		// Pagination follows the provider page, not the filtered list.
		providerCount: all.length,
		errors
	};
};

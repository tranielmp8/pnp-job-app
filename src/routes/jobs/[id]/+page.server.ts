import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getJob } from '#lib/server/jobs/index.ts';
import { isHttpUrl } from '#lib/server/jobs/normalize.ts';
import { markApplied, saveJob, unsaveJob } from '#lib/server/applications.ts';

function jobId(raw: string): number {
	const id = Number(raw);
	if (!Number.isInteger(id) || id <= 0) error(404, 'Job not found');
	return id;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const job = await getJob(jobId(params.id), locals.user!.id);
	if (!job) error(404, 'Job not found');
	return { job };
};

export const actions: Actions = {
	// "Apply" = record it + open the posting. With JS the browser opens the link
	// itself; without JS this form posts in a new tab and we redirect it there.
	apply: async ({ params, locals, request }) => {
		const url = await markApplied(locals.user!.id, jobId(params.id));
		if (!url) error(404, 'Job not found');
		if (request.headers.get('x-sveltekit-action') === 'true') return { applied: true };
		if (!isHttpUrl(url)) error(400, 'This job has no valid application link');
		redirect(303, url, { external: true });
	},

	save: async ({ params, locals }) => {
		if (!(await saveJob(locals.user!.id, jobId(params.id)))) error(404, 'Job not found');
		return { saved: true };
	},

	unsave: async ({ params, locals }) => {
		await unsaveJob(locals.user!.id, jobId(params.id));
		return { saved: false };
	}
};

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	countByStatus,
	deleteApplication,
	isStatus,
	listApplications,
	updateApplication
} from '#lib/server/applications.ts';
import { listResumes } from '#lib/server/resumes.ts';

export const load: PageServerLoad = async ({ url, locals }) => {
	const userId = locals.user!.id;
	const raw = url.searchParams.get('status');
	const status = isStatus(raw) ? raw : undefined;

	const [applications, counts, resumes] = await Promise.all([
		listApplications(userId, status),
		countByStatus(userId),
		listResumes(userId)
	]);
	return {
		applications,
		counts,
		status: status ?? null,
		resumes: resumes.map((r) => ({ id: r.id, label: r.label }))
	};
};

function readId(form: FormData): number | null {
	const id = Number(form.get('id'));
	return Number.isInteger(id) && id > 0 ? id : null;
}

export const actions: Actions = {
	status: async ({ request, locals }) => {
		const form = await request.formData();
		const id = readId(form);
		const status = form.get('status');
		if (!id || !isStatus(status)) return fail(400, { message: 'Invalid status.' });
		if (!(await updateApplication(locals.user!.id, id, { status }))) {
			return fail(404, { message: 'Application not found.' });
		}
		return { updated: id };
	},

	notes: async ({ request, locals }) => {
		const form = await request.formData();
		const id = readId(form);
		const notes = (form.get('notes')?.toString() ?? '').trim().slice(0, 5000);
		if (!id) return fail(400, { message: 'Invalid application.' });
		if (!(await updateApplication(locals.user!.id, id, { notes: notes || null }))) {
			return fail(404, { message: 'Application not found.' });
		}
		return { notesSaved: id };
	},

	resume: async ({ request, locals }) => {
		const form = await request.formData();
		const id = readId(form);
		const raw = form.get('resumeId')?.toString() ?? '';
		const resumeId = raw === '' ? null : Number(raw);
		if (!id || (resumeId !== null && !(Number.isInteger(resumeId) && resumeId > 0))) {
			return fail(400, { message: 'Invalid resume.' });
		}
		if (!(await updateApplication(locals.user!.id, id, { resumeId }))) {
			return fail(404, { message: 'Application or resume not found.' });
		}
		return { updated: id };
	},

	remove: async ({ request, locals }) => {
		const id = readId(await request.formData());
		if (!id) return fail(400, { message: 'Invalid application.' });
		if (!(await deleteApplication(locals.user!.id, id))) {
			return fail(404, { message: 'Application not found.' });
		}
		return { removed: id };
	}
};

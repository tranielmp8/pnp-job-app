import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	ACCEPT,
	addFile,
	addLink,
	deleteResume,
	listResumes,
	MAX_FILE_BYTES,
	ResumeError,
	setDefault
} from '#lib/server/resumes.ts';
import { uploadsEnabled } from '#lib/server/storage/index.ts';

export const load: PageServerLoad = async ({ locals, url }) => {
	const resumes = await listResumes(locals.user!.id);
	const viewId = Number(url.searchParams.get('view'));
	const selected =
		resumes.find((r) => r.id === viewId) ?? resumes.find((r) => r.isDefault) ?? resumes[0] ?? null;

	return {
		resumes,
		selectedId: selected?.id ?? null,
		uploadsEnabled: uploadsEnabled(),
		accept: ACCEPT,
		maxMb: MAX_FILE_BYTES / 1024 / 1024
	};
};

const readLabel = (form: FormData, fallback: string) =>
	(form.get('label')?.toString().trim() || fallback).slice(0, 100);

const readId = (form: FormData) => {
	const id = Number(form.get('id'));
	return Number.isInteger(id) && id > 0 ? id : null;
};

export const actions: Actions = {
	addLink: async ({ request, locals }) => {
		const form = await request.formData();
		const url = form.get('url')?.toString().trim() ?? '';
		const label = readLabel(form, 'My resume');
		try {
			const row = await addLink(locals.user!.id, label, url);
			return { added: row.id };
		} catch (e) {
			if (e instanceof ResumeError)
				return fail(400, { action: 'addLink', message: e.message, url, label });
			throw e;
		}
	},

	upload: async ({ request, locals }) => {
		const form = await request.formData();
		const file = form.get('file');
		if (!(file instanceof File))
			return fail(400, { action: 'upload', message: 'Choose a file to upload.' });
		const label = readLabel(form, file.name.replace(/\.[^.]+$/, '') || 'My resume');
		try {
			const row = await addFile(locals.user!.id, label, file);
			return { added: row.id };
		} catch (e) {
			if (e instanceof ResumeError)
				return fail(400, { action: 'upload', message: e.message, label });
			throw e;
		}
	},

	setDefault: async ({ request, locals }) => {
		const id = readId(await request.formData());
		if (!id || !(await setDefault(locals.user!.id, id))) {
			return fail(404, { message: 'Resume not found.' });
		}
		return { defaultSet: id };
	},

	delete: async ({ request, locals }) => {
		const id = readId(await request.formData());
		if (!id || !(await deleteResume(locals.user!.id, id))) {
			return fail(404, { message: 'Resume not found.' });
		}
		return { deleted: id };
	}
};

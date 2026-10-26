import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '#lib/server/auth.ts';
import { safeRedirect } from '#lib/server/redirect.ts';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) {
		redirect(302, safeRedirect(url.searchParams.get('redirectTo')));
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { email, message: 'Email and password are required.' });
		}

		try {
			await auth.api.signInEmail({ body: { email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { email, message: 'Invalid email or password.' });
			}
			return fail(500, { email, message: 'Unexpected error. Please try again.' });
		}

		redirect(303, safeRedirect(url.searchParams.get('redirectTo')));
	}
};

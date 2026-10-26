import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '#lib/server/auth.ts';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) {
		redirect(302, '/jobs');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';
		const email = formData.get('email')?.toString().trim() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';

		if (!name || !email || !password || !confirmPassword) {
			return fail(400, { name, email, message: 'All fields are required.' });
		}
		if (password.length < 8) {
			return fail(400, { name, email, message: 'Password must be at least 8 characters.' });
		}
		if (password !== confirmPassword) {
			return fail(400, { name, email, message: "Passwords don't match." });
		}

		try {
			await auth.api.signUpEmail({ body: { name, email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { name, email, message: error.message || 'Sign up failed.' });
			}
			return fail(500, { name, email, message: 'Unexpected error. Please try again.' });
		}

		redirect(303, '/jobs');
	}
};

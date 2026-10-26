import type { Handle } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { auth } from '#lib/server/auth.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

// Guarding here (not in a layout load) also covers form actions and +server endpoints.
const PROTECTED = ['/jobs', '/applications', '/resume', '/logout'];

const handleGuard: Handle = ({ event, resolve }) => {
	const path = event.url.pathname;
	const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));

	if (isProtected && !event.locals.user) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(path + event.url.search)}`);
	}

	return resolve(event);
};

export const handle: Handle = sequence(handleBetterAuth, handleGuard);

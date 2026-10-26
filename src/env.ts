import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'The database connection string.' },
	ORIGIN: {
		description: 'The app origin (base URL), e.g. `http://localhost:5173`.'
	},
	BETTER_AUTH_SECRET: {
		description:
			'Secret used to sign tokens. For production use 32 characters generated with high entropy. See [Better Auth installation](https://www.better-auth.com/docs/installation).'
	},
	JOB_PROVIDERS: {
		schema: (value) =>
			(value || 'jsearch')
				.split(',')
				.map((s) => s.trim().toLowerCase())
				.filter(Boolean),
		description: 'Comma-separated job providers to use: `jsearch`, `adzuna`. Defaults to `jsearch`.'
	},
	RAPIDAPI_KEY: {
		schema: optional,
		description: 'RapidAPI key for the JSearch job API. JSearch is skipped when unset.'
	},
	ADZUNA_APP_ID: {
		schema: optional,
		description: 'Adzuna API app id. Adzuna is skipped when unset.'
	},
	ADZUNA_API_KEY: {
		schema: optional,
		description: 'Adzuna API app key. Adzuna is skipped when unset.'
	},
	STORAGE_DRIVER: {
		schema: (value) => {
			const v = (value || 'none').trim().toLowerCase();
			if (v !== 'none' && v !== 'local') {
				throw new Error(`STORAGE_DRIVER must be "none" or "local" (got "${value}")`);
			}
			return v as 'none' | 'local';
		},
		description:
			'Where uploaded resume files go. `none` (default): uploads off, link-only. `local`: files in UPLOAD_DIR. An `s3` driver will be added when the bucket exists.'
	},
	UPLOAD_DIR: {
		schema: (value) => value || './uploads',
		description:
			'Directory where uploaded resumes are stored. Mount a persistent volume here in Coolify.'
	}
});

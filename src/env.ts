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
			if (v !== 'none' && v !== 'local' && v !== 's3') {
				throw new Error(`STORAGE_DRIVER must be "none", "local" or "s3" (got "${value}")`);
			}
			return v as 'none' | 'local' | 's3';
		},
		description:
			'Where uploaded resume files go. `none` (default): uploads off, link-only. `local`: files in UPLOAD_DIR (needs a persistent disk, so not on Netlify). `s3`: an S3-compatible bucket such as a Railway bucket.'
	},
	UPLOAD_DIR: {
		schema: (value) => value || './uploads',
		description: 'Directory for uploaded resumes when STORAGE_DRIVER=local.'
	},
	S3_BUCKET: {
		schema: optional,
		description: 'Bucket name, for STORAGE_DRIVER=s3.'
	},
	S3_ENDPOINT: {
		schema: optional,
		description: 'S3 endpoint URL, e.g. the Railway bucket endpoint. For STORAGE_DRIVER=s3.'
	},
	S3_REGION: {
		schema: (value) => value || 'auto',
		description: 'S3 region. Defaults to `auto`.'
	},
	S3_ACCESS_KEY_ID: {
		schema: optional,
		description: 'S3 access key id, for STORAGE_DRIVER=s3.'
	},
	S3_SECRET_ACCESS_KEY: {
		schema: optional,
		description: 'S3 secret access key, for STORAGE_DRIVER=s3.'
	},
	S3_FORCE_PATH_STYLE: {
		schema: (value) => value === 'true',
		description:
			'Set to `true` if the provider needs path-style URLs (e.g. MinIO). Defaults to `false`.'
	}
});

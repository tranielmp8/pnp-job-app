import {
	pgTable,
	pgEnum,
	serial,
	integer,
	text,
	boolean,
	timestamp,
	index,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export * from './auth.schema';

// ---------------------------------------------------------------------------
// Shared listing cache. Jobs are public data pulled from providers, so they are
// NOT owned by a user. Anything personal lives in the user-scoped tables below.
// ---------------------------------------------------------------------------

export const jobSource = pgEnum('job_source', ['jsearch', 'adzuna']);

export const job = pgTable(
	'job',
	{
		id: serial('id').primaryKey(),
		source: jobSource('source').notNull(),
		externalId: text('external_id').notNull(),
		// Normalized company + title + location, used to collapse the same posting
		// arriving from more than one provider.
		dedupeHash: text('dedupe_hash').notNull(),
		title: text('title').notNull(),
		company: text('company'),
		city: text('city'),
		state: text('state'),
		country: text('country'),
		isRemote: boolean('is_remote').notNull().default(false),
		salaryMin: integer('salary_min'),
		salaryMax: integer('salary_max'),
		description: text('description'),
		applyUrl: text('apply_url').notNull(),
		postedAt: timestamp('posted_at'),
		fetchedAt: timestamp('fetched_at').defaultNow().notNull()
	},
	(t) => [
		uniqueIndex('job_source_external_idx').on(t.source, t.externalId),
		index('job_dedupe_hash_idx').on(t.dedupeHash),
		index('job_location_idx').on(t.state, t.city),
		index('job_posted_at_idx').on(t.postedAt)
	]
);

// ---------------------------------------------------------------------------
// User-scoped tables. Every row carries user_id; every query must filter on it.
// ---------------------------------------------------------------------------

// 'link' = external URL (e.g. Google Drive). 'file' = uploaded to the storage driver.
export const resumeKind = pgEnum('resume_kind', ['link', 'file']);

export const resume = pgTable(
	'resume',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		kind: resumeKind('kind').notNull().default('link'),
		// kind = 'link'
		url: text('url'),
		// kind = 'file'
		fileName: text('file_name'),
		storageKey: text('storage_key').unique(),
		mimeType: text('mime_type'),
		sizeBytes: integer('size_bytes'),
		isDefault: boolean('is_default').notNull().default(false),
		uploadedAt: timestamp('uploaded_at').defaultNow().notNull()
	},
	(t) => [index('resume_user_idx').on(t.userId)]
);

export const applicationStatus = pgEnum('application_status', [
	'saved',
	'applied',
	'interviewing',
	'offer',
	'rejected'
]);

export const application = pgTable(
	'application',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		jobId: integer('job_id')
			.notNull()
			.references(() => job.id, { onDelete: 'cascade' }),
		// Copied from job.dedupe_hash so "already applied" also matches the same
		// posting re-listed under a different provider / external id.
		dedupeHash: text('dedupe_hash').notNull(),
		status: applicationStatus('status').notNull().default('saved'),
		resumeId: integer('resume_id').references(() => resume.id, { onDelete: 'set null' }),
		notes: text('notes'),
		appliedAt: timestamp('applied_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(t) => [
		uniqueIndex('application_user_job_idx').on(t.userId, t.jobId),
		uniqueIndex('application_user_dedupe_idx').on(t.userId, t.dedupeHash),
		index('application_user_status_idx').on(t.userId, t.status)
	]
);

export const savedSearch = pgTable(
	'saved_search',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		keywords: text('keywords'),
		city: text('city'),
		state: text('state'),
		remoteOnly: boolean('remote_only').notNull().default(false),
		lastRunAt: timestamp('last_run_at'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [index('saved_search_user_idx').on(t.userId)]
);

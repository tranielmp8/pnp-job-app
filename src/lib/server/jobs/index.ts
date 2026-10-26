import { and, eq, inArray, sql } from 'drizzle-orm';
import { JOB_PROVIDERS } from '$app/env/private';
import { db } from '#lib/server/db/index.ts';
import { application, job } from '#lib/server/db/schema.ts';
import { adzuna } from './adzuna.ts';
import { jsearch } from './jsearch.ts';
import type { JobQuery, JobSource, NormalizedJob } from './types.ts';
import { isHttpUrl } from './normalize.ts';

export type { JobQuery } from './types.ts';

// JSearch first: when the same posting comes from both, its direct apply link wins.
// JOB_PROVIDERS picks which ones run; a provider also needs its API keys set.
const PROVIDERS = [jsearch, adzuna].filter((p) => JOB_PROVIDERS.includes(p.source));

// Provider quotas are small, so identical searches reuse recent results.
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, { at: number; jobIds: number[]; errors: ProviderError[] }>();

export interface ProviderError {
	source: JobSource;
	label: string;
	message: string;
}

export type JobRow = typeof job.$inferSelect;
export type JobResult = JobRow & { applicationStatus: string | null };

export function enabledProviders() {
	return PROVIDERS.filter((p) => p.enabled).map((p) => p.label);
}

export async function searchJobs(
	q: JobQuery,
	userId: string
): Promise<{ jobs: JobResult[]; errors: ProviderError[] }> {
	const key = JSON.stringify(q);
	let entry = cache.get(key);

	if (!entry || Date.now() - entry.at > CACHE_TTL_MS) {
		entry = await fetchFromProviders(q);
		cache.delete(key);
		cache.set(key, entry);
		if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
	}

	const rows = entry.jobIds.length
		? await db.select().from(job).where(inArray(job.id, entry.jobIds))
		: [];
	const byId = new Map(rows.map((r) => [r.id, r]));
	const ordered = entry.jobIds.map((id) => byId.get(id)).filter((r) => r !== undefined);

	return { jobs: await withApplicationStatus(ordered, userId), errors: entry.errors };
}

async function fetchFromProviders(q: JobQuery) {
	const active = PROVIDERS.filter((p) => p.enabled);
	const settled = await Promise.allSettled(active.map((p) => p.search(q)));

	const errors: ProviderError[] = [];
	const found: NormalizedJob[] = [];
	settled.forEach((r, i) => {
		const p = active[i];
		if (r.status === 'fulfilled') found.push(...r.value);
		else {
			console.error(`[jobs] ${p.label} search failed:`, r.reason);
			errors.push({
				source: p.source,
				label: p.label,
				message: String(r.reason?.message ?? r.reason)
			});
		}
	});

	// Collapse cross-provider duplicates, keeping the first (highest-priority) one.
	const seen = new Set<string>();
	const unique = found.filter((j) => {
		if (q.remoteOnly && !j.isRemote) return false;
		if (!isHttpUrl(j.applyUrl)) return false;
		const idKey = `${j.source}:${j.externalId}`;
		if (seen.has(j.dedupeHash) || seen.has(idKey)) return false;
		seen.add(j.dedupeHash).add(idKey);
		return true;
	});

	const jobIds = unique.length ? await upsertJobs(unique) : [];
	return { at: Date.now(), jobIds, errors };
}

async function upsertJobs(jobs: NormalizedJob[]): Promise<number[]> {
	const excluded = (col: string) => sql.raw(`excluded.${col}`);
	const rows = await db
		.insert(job)
		.values(jobs)
		.onConflictDoUpdate({
			target: [job.source, job.externalId],
			set: {
				dedupeHash: excluded('dedupe_hash'),
				title: excluded('title'),
				company: excluded('company'),
				city: excluded('city'),
				state: excluded('state'),
				country: excluded('country'),
				isRemote: excluded('is_remote'),
				salaryMin: excluded('salary_min'),
				salaryMax: excluded('salary_max'),
				description: excluded('description'),
				applyUrl: excluded('apply_url'),
				postedAt: excluded('posted_at'),
				fetchedAt: sql`now()`
			}
		})
		.returning({ id: job.id });
	return rows.map((r) => r.id);
}

/** Attaches the current user's application status, matched by job id or dedupe hash. */
async function withApplicationStatus(rows: JobRow[], userId: string): Promise<JobResult[]> {
	if (!rows.length) return [];
	const apps = await db
		.select({
			jobId: application.jobId,
			dedupeHash: application.dedupeHash,
			status: application.status
		})
		.from(application)
		.where(
			and(
				eq(application.userId, userId),
				inArray(
					application.dedupeHash,
					rows.map((r) => r.dedupeHash)
				)
			)
		);
	const byHash = new Map(apps.map((a) => [a.dedupeHash, a.status]));
	return rows.map((r) => ({ ...r, applicationStatus: byHash.get(r.dedupeHash) ?? null }));
}

export async function getJob(id: number, userId: string): Promise<JobResult | null> {
	const [row] = await db.select().from(job).where(eq(job.id, id));
	if (!row) return null;
	const [withStatus] = await withApplicationStatus([row], userId);
	return withStatus;
}

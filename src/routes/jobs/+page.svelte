<script lang="ts">
	import { page } from '$app/state';
	import { formatLocation, formatSalary, timeAgo, SOURCE_LABELS } from '#lib/format.ts';
	import { US_STATE_OPTIONS } from '#lib/states.ts';
	import JobActions from '#lib/components/JobActions.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function paramHref(key: string, value: string | null) {
		const params = new URLSearchParams(page.url.search);
		if (value === null) params.delete(key);
		else params.set(key, value);
		return `?${params}`;
	}
	const pageHref = (n: number) => paramHref('page', String(n));
</script>

<h1 class="text-2xl font-bold tracking-tight">Search jobs</h1>

<form method="get" class="card mt-4 grid gap-3 p-4 md:grid-cols-12">
	<label class="md:col-span-4">
		<span class="field-label">Keywords</span>
		<input
			name="q"
			value={data.query.keywords}
			placeholder="e.g. frontend developer"
			class="input"
		/>
	</label>
	<label class="md:col-span-3">
		<span class="field-label">City</span>
		<input name="city" value={data.query.city} placeholder="e.g. Austin" class="input" />
	</label>
	<label class="md:col-span-2">
		<span class="field-label">State</span>
		<select name="state" class="input">
			<option value="">Any</option>
			{#each US_STATE_OPTIONS as [code, name] (code)}
				<option value={code} selected={data.query.state === code}>{name}</option>
			{/each}
		</select>
	</label>
	<label class="flex items-center gap-2 self-end pb-2.5 md:col-span-1">
		<input
			type="checkbox"
			name="remote"
			value="1"
			checked={data.query.remoteOnly}
			class="checkbox"
		/>
		<span class="text-sm font-medium">Remote</span>
	</label>
	<button class="btn-primary self-end md:col-span-2">Search</button>
</form>

{#if !data.providers.length}
	<p class="notice mt-6">No job providers are configured. Add API keys to <code>.env</code>.</p>
{/if}

{#each data.errors as err (err.source)}
	<p class="notice mt-4">
		{err.label} results are unavailable right now ({err.message}).
	</p>
{/each}

{#if data.searched}
	<p class="mt-6 text-sm text-muted">
		{data.jobs.length} result{data.jobs.length === 1 ? '' : 's'} · page {data.query.page}
		{#if data.hiddenCount}
			· {data.hiddenCount} you already applied to hidden ·
			<a href={paramHref('showApplied', '1')} class="link">show them</a>
		{:else if data.showApplied}
			· <a href={paramHref('showApplied', null)} class="link">hide jobs I applied to</a>
		{/if}
	</p>

	<ul class="mt-3 space-y-3">
		{#each data.jobs as job (job.id)}
			{@const salary = formatSalary(job.salaryMin, job.salaryMax)}
			<li
				class="card p-4 transition hover:border-primary/40 {job.applicationStatus &&
				job.applicationStatus !== 'saved'
					? 'opacity-70'
					: ''}"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0">
						<a href="/jobs/{job.id}" class="text-lg font-semibold hover:text-primary">{job.title}</a
						>
						<p class="text-sm font-medium text-fg/80">{job.company ?? 'Unknown company'}</p>
						<p class="mt-1 text-sm text-muted">
							{formatLocation(job)}
							{#if salary}· {salary}{/if}
							{#if job.postedAt}· {timeAgo(job.postedAt)}{/if}
						</p>
					</div>
					<div class="flex shrink-0 flex-col items-end gap-1.5">
						{#if job.applicationStatus && job.applicationStatus !== 'saved'}
							<span class="badge badge-applied">Already applied</span>
						{/if}
						<span class="text-xs text-muted">via {SOURCE_LABELS[job.source]}</span>
					</div>
				</div>
				<div class="mt-3 border-t border-line pt-3">
					<JobActions {job} size="sm" />
				</div>
			</li>
		{:else}
			<li class="card p-6 text-center text-muted">
				No jobs found. Try broader keywords or a different location.
			</li>
		{/each}
	</ul>

	<nav class="mt-6 flex justify-between">
		{#if data.query.page > 1}
			<a href={pageHref(data.query.page - 1)} class="link">← Previous</a>
		{:else}
			<span></span>
		{/if}
		{#if data.providerCount}
			<a href={pageHref(data.query.page + 1)} class="link">Next →</a>
		{/if}
	</nav>
{:else if data.providers.length}
	<p class="mt-6 text-muted">
		Enter keywords, a location or check Remote to search {data.providers.join(' and ')}.
	</p>
{/if}

<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatLocation, timeAgo } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const LABELS = {
		saved: 'Saved',
		applied: 'Applied',
		interviewing: 'Interviewing',
		offer: 'Offer',
		rejected: 'Rejected'
	} as const;
	const STATUSES = Object.keys(LABELS) as (keyof typeof LABELS)[];

	let total = $derived(Object.values(data.counts).reduce((a, b) => a + b, 0));

	const STATUS_STYLE: Record<string, string> = {
		saved: 'badge-saved',
		applied: 'badge-applied',
		interviewing: 'bg-mark text-highlight',
		offer: 'badge-applied',
		rejected: 'bg-cream text-muted'
	};

	const keepValues = () => {
		return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) =>
			update({ reset: false });
	};
</script>

<svelte:head>
	<title>Applications · YoureHired</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight">Applications</h1>
<p class="mt-1 text-muted">Every job you've saved or applied to, in one place.</p>

<nav class="mt-5 flex flex-wrap gap-2" aria-label="Filter by status">
	<a
		href="/applications"
		aria-current={data.status === null ? 'page' : undefined}
		class="rounded-full border px-3 py-1 text-sm font-medium transition {data.status === null
			? 'border-primary bg-mark text-primary'
			: 'border-line text-muted hover:text-fg'}">All <span class="opacity-70">{total}</span></a
	>
	{#each STATUSES as s (s)}
		<a
			href="/applications?status={s}"
			aria-current={data.status === s ? 'page' : undefined}
			class="rounded-full border px-3 py-1 text-sm font-medium transition {data.status === s
				? 'border-primary bg-mark text-primary'
				: 'border-line text-muted hover:text-fg'}"
			>{LABELS[s]} <span class="opacity-70">{data.counts[s]}</span></a
		>
	{/each}
</nav>

{#if form?.message}
	<p class="mt-4 text-sm text-danger">{form.message}</p>
{/if}

<ul class="mt-5 space-y-3">
	{#each data.applications as app (app.id)}
		<li class="card p-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="min-w-0">
					<a href="/jobs/{app.job.id}" class="font-semibold hover:text-primary">{app.job.title}</a>
					<p class="text-sm font-medium text-fg/80">{app.job.company ?? 'Unknown company'}</p>
					<p class="mt-1 text-sm text-muted">
						{formatLocation(app.job)}
						{#if app.appliedAt}
							· Applied {timeAgo(app.appliedAt)?.toLowerCase()}
						{:else}
							· Saved {timeAgo(app.createdAt)?.toLowerCase()}
						{/if}
					</p>
				</div>

				<div class="flex items-center gap-2">
					<span class="badge {STATUS_STYLE[app.status]}">{LABELS[app.status]}</span>
					<form method="post" action="?/status" use:enhance={keepValues}>
						<input type="hidden" name="id" value={app.id} />
						<label class="sr-only" for="status-{app.id}">Status</label>
						<select
							id="status-{app.id}"
							name="status"
							class="input mt-0 py-1 pr-8 text-sm"
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							{#each STATUSES as s (s)}
								<option value={s} selected={app.status === s}>{LABELS[s]}</option>
							{/each}
						</select>
						<noscript><button class="link text-sm">Update</button></noscript>
					</form>
				</div>
			</div>

			{#if app.status !== 'saved'}
				<form
					method="post"
					action="?/resume"
					use:enhance={keepValues}
					class="mt-3 flex flex-wrap items-center gap-2 text-sm"
				>
					<input type="hidden" name="id" value={app.id} />
					<label for="resume-{app.id}" class="text-muted">Resume sent:</label>
					{#if data.resumes.length}
						<select
							id="resume-{app.id}"
							name="resumeId"
							class="input mt-0 w-auto py-1 pr-8 text-sm"
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							<option value="" selected={app.resumeId === null}>Not set</option>
							{#each data.resumes as r (r.id)}
								<option value={r.id} selected={app.resumeId === r.id}>{r.label}</option>
							{/each}
						</select>
						{#if app.resumeId}
							<a href="/resume?view={app.resumeId}" class="link">View</a>
						{/if}
						<noscript><button class="link">Update</button></noscript>
					{:else}
						<a href="/resume" class="link">Add a resume</a>
					{/if}
				</form>
			{/if}

			<details class="mt-3 border-t border-line pt-3" open={Boolean(app.notes)}>
				<summary class="cursor-pointer text-sm font-medium text-muted hover:text-primary">
					Notes
				</summary>
				<form method="post" action="?/notes" use:enhance={keepValues} class="mt-2 space-y-2">
					<input type="hidden" name="id" value={app.id} />
					<textarea
						name="notes"
						rows="3"
						maxlength="5000"
						placeholder="Recruiter name, interview dates, follow-ups…"
						class="input mt-0 text-sm">{app.notes ?? ''}</textarea
					>
					<div class="flex items-center justify-between gap-3">
						<div class="flex items-center gap-3">
							<button class="btn-primary py-1 text-sm">Save notes</button>
							{#if form?.notesSaved === app.id}
								<span class="text-sm text-success" role="status">Saved</span>
							{/if}
						</div>
						<div class="flex items-center gap-4">
							<a
								href={app.job.applyUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="link text-sm">Posting ↗</a
							>
							<button
								formaction="?/remove"
								class="text-sm text-muted hover:text-danger"
								onclick={(e) => {
									if (!confirm(`Remove "${app.job.title}" from your applications?`)) {
										e.preventDefault();
									}
								}}>Remove</button
							>
						</div>
					</div>
				</form>
			</details>
		</li>
	{:else}
		<li class="card p-8 text-center">
			<p class="text-muted">
				{data.status ? `No applications marked “${LABELS[data.status]}”.` : 'No applications yet.'}
			</p>
			<a href="/jobs" class="btn-primary mt-4">Search jobs</a>
		</li>
	{/each}
</ul>

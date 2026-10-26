<script lang="ts">
	import { formatLocation, formatSalary, timeAgo, SOURCE_LABELS } from '#lib/format.ts';
	import JobActions from '#lib/components/JobActions.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let job = $derived(data.job);
	let salary = $derived(formatSalary(job.salaryMin, job.salaryMax));
</script>

<svelte:head>
	<title>{job.title} · YoureHired</title>
</svelte:head>

<a
	href="/jobs"
	onclick={(e) => {
		if (history.length > 1) {
			e.preventDefault();
			history.back();
		}
	}}
	class="link text-sm">← Back to results</a
>

<article class="card mt-4 p-6 sm:p-8">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">{job.title}</h1>
			<p class="font-medium text-fg/80">{job.company ?? 'Unknown company'}</p>
			<p class="mt-1 text-sm text-muted">
				{formatLocation(job)}
				{#if salary}· {salary}{/if}
				{#if job.postedAt}· Posted {timeAgo(job.postedAt)?.toLowerCase()}{/if}
				· via {SOURCE_LABELS[job.source]}
			</p>
		</div>
		<div class="flex items-center gap-3">
			{#if job.applicationStatus && job.applicationStatus !== 'saved'}
				<span class="badge badge-applied text-sm">Already applied</span>
			{/if}
			<JobActions {job} />
		</div>
	</div>

	{#if !job.applicationStatus || job.applicationStatus === 'saved'}
		<p class="mt-3 text-xs text-muted">
			Apply opens the posting in a new tab and adds it to your Applications.
		</p>
	{/if}

	{#if job.description}
		<!-- Rendered as plain text on purpose: provider HTML is untrusted. -->
		<!-- prettier-ignore -->
		<div class="mt-6 text-sm leading-relaxed whitespace-pre-line text-fg/90">{job.description}</div>
		{#if job.source === 'adzuna'}
			<p class="mt-4 text-xs text-muted">
				Adzuna only provides a preview; see the full posting for details.
			</p>
		{/if}
	{/if}
</article>

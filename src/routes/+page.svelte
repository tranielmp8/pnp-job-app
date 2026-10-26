<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const FEATURES = [
		{
			title: 'Search everywhere',
			body: 'Listings from major job boards in one place, filtered by keywords, city, state or remote.'
		},
		{
			title: 'Never double-apply',
			body: 'Every application is recorded, so jobs you already applied to are flagged, even when they’re re-posted.'
		},
		{
			title: 'Your resume, on hand',
			body: 'Keep your resume versions in one place and see which one you sent to each job.'
		}
	];
</script>

<section
	class="relative overflow-hidden rounded-3xl px-6 py-16 text-center text-on-dark sm:px-12 sm:py-20"
	style="background-image: var(--pnp-gradient-brand)"
>
	<div
		class="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-3xl"
	></div>
	<h1 class="relative text-4xl font-extrabold tracking-tight sm:text-5xl">
		Find jobs. Track every application.
	</h1>
	<p class="relative mx-auto mt-4 max-w-2xl text-lg text-on-dark-muted">
		Search listings from multiple job boards, filter by city, state or remote, and never apply to
		the same job twice.
	</p>
	<div class="relative mt-8">
		<a
			href={data.user ? '/jobs' : '/signup'}
			class="inline-flex rounded-lg bg-white px-6 py-3 font-semibold text-[#7c2608] shadow-lg transition hover:bg-[#fed7aa]"
			>{data.user ? 'Search jobs' : 'Get started'}</a
		>
	</div>
</section>

<section class="mt-10 grid gap-4 sm:grid-cols-3">
	{#each FEATURES as f (f.title)}
		<div class="card p-5">
			<div
				class="mb-3 h-1 w-10 rounded-full"
				style="background-image: var(--pnp-gradient-text)"
			></div>
			<h2 class="font-semibold">{f.title}</h2>
			<p class="mt-1 text-sm text-muted">{f.body}</p>
		</div>
	{/each}
</section>

<script lang="ts">
	import { enhance } from '$app/forms';

	let {
		job,
		size = 'md'
	}: {
		job: { id: number; applyUrl: string; applicationStatus: string | null };
		size?: 'sm' | 'md';
	} = $props();

	let applied = $derived(job.applicationStatus !== null && job.applicationStatus !== 'saved');
	let saved = $derived(job.applicationStatus === 'saved');
	let busy = $state(false);

	const sm = $derived(size === 'sm');
</script>

<div class="flex flex-wrap items-center gap-2">
	{#if applied}
		<a
			href={job.applyUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="link {sm ? 'text-sm' : ''}">Open posting ↗</a
		>
	{:else}
		<form
			method="post"
			action="/jobs/{job.id}?/{saved ? 'unsave' : 'save'}"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<button
				disabled={busy}
				aria-pressed={saved}
				class="rounded-lg border px-3 font-medium transition disabled:opacity-60 {sm
					? 'py-1 text-sm'
					: 'py-2'} {saved
					? 'border-primary bg-mark text-primary'
					: 'border-line text-muted hover:border-primary hover:text-primary'}"
			>
				{saved ? '★ Saved' : '☆ Save'}
			</button>
		</form>

		<!-- With JS: open the posting right away (still inside the click, so it isn't
		     popup-blocked) and record the application in the background. -->
		<form
			method="post"
			action="/jobs/{job.id}?/apply"
			target="_blank"
			use:enhance={() => {
				window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<button disabled={busy} class="btn-primary disabled:opacity-60 {sm ? 'py-1 text-sm' : ''}">
				Apply ↗
			</button>
		</form>
	{/if}
</div>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { timeAgo } from '#lib/format.ts';
	import { toEmbedUrl, viewKind } from '#lib/resume-links.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let tab = $state<'link' | 'upload'>('link');
	let selected = $derived(data.resumes.find((r) => r.id === data.selectedId) ?? null);
	let kind = $derived(selected ? viewKind(selected) : null);

	const fileHref = (id: number) => `/resume/${id}/file`;
	const openHref = (r: { id: number; kind: string; url: string | null }) =>
		r.kind === 'link' ? (r.url ?? '#') : fileHref(r.id);

	const KIND_LABEL: Record<string, string> = {
		'application/pdf': 'PDF',
		'image/png': 'Image',
		'image/jpeg': 'Image',
		'image/webp': 'Image'
	};
	const typeLabel = (r: { kind: string; url: string | null; mimeType: string | null }) =>
		r.kind === 'link'
			? toEmbedUrl(r.url)
				? 'Google link'
				: 'Link'
			: (KIND_LABEL[r.mimeType ?? ''] ?? 'Word doc');
</script>

<svelte:head>
	<title>Resume · YoureHired</title>
</svelte:head>

<h1 class="text-2xl font-bold tracking-tight">Resume</h1>
<p class="mt-1 text-muted">
	Keep your resume versions here. Your default is attached automatically when you apply.
</p>

{#if form?.message && !form.action}
	<p class="mt-4 text-sm text-danger">{form.message}</p>
{/if}

<div class="mt-6 grid gap-6 lg:grid-cols-5">
	<div class="space-y-6 lg:col-span-2">
		<!-- List -->
		<ul class="space-y-2">
			{#each data.resumes as r (r.id)}
				<li class="card p-3 {r.id === data.selectedId ? 'border-primary ring-2 ring-mark' : ''}">
					<div class="flex items-start justify-between gap-2">
						<a href="?view={r.id}" class="min-w-0" data-sveltekit-noscroll>
							<p class="truncate font-semibold hover:text-primary">{r.label}</p>
							<p class="text-xs text-muted">
								{typeLabel(r)} · added {timeAgo(r.uploadedAt)?.toLowerCase()}
							</p>
						</a>
						{#if r.isDefault}
							<span class="badge badge-saved shrink-0">Default</span>
						{/if}
					</div>
					<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
						<a href={openHref(r)} target="_blank" rel="noopener noreferrer" class="link">Open ↗</a>
						{#if !r.isDefault}
							<form method="post" action="?/setDefault" use:enhance>
								<input type="hidden" name="id" value={r.id} />
								<button class="link">Make default</button>
							</form>
						{/if}
						<form
							method="post"
							action="?/delete"
							use:enhance={({ cancel }) => {
								if (!confirm(`Delete "${r.label}"?`)) cancel();
							}}
						>
							<input type="hidden" name="id" value={r.id} />
							<button class="text-muted hover:text-danger">Delete</button>
						</form>
					</div>
				</li>
			{:else}
				<li class="card p-6 text-center text-sm text-muted">No resumes yet. Add one below.</li>
			{/each}
		</ul>

		<!-- Add -->
		<section class="card p-4">
			<h2 class="font-semibold">Add a resume</h2>
			<div class="mt-3 flex gap-1 rounded-lg bg-cream p-1 text-sm" role="tablist">
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'link'}
					onclick={() => (tab = 'link')}
					class="flex-1 rounded-md px-3 py-1.5 font-medium transition {tab === 'link'
						? 'bg-surface text-primary shadow-sm'
						: 'text-muted hover:text-fg'}">Link</button
				>
				<button
					type="button"
					role="tab"
					aria-selected={tab === 'upload'}
					onclick={() => (tab = 'upload')}
					class="flex-1 rounded-md px-3 py-1.5 font-medium transition {tab === 'upload'
						? 'bg-surface text-primary shadow-sm'
						: 'text-muted hover:text-fg'}">Upload file</button
				>
			</div>

			{#if tab === 'link'}
				<form method="post" action="?/addLink" use:enhance class="mt-4 space-y-3">
					<label class="block">
						<span class="field-label">Name</span>
						<input
							name="label"
							placeholder="e.g. Frontend resume"
							value={form?.action === 'addLink' ? (form.label ?? '') : ''}
							class="input"
						/>
					</label>
					<label class="block">
						<span class="field-label">Link</span>
						<input
							name="url"
							type="url"
							required
							placeholder="https://drive.google.com/file/d/…"
							value={form?.action === 'addLink' ? (form.url ?? '') : ''}
							class="input"
						/>
					</label>
					<p class="text-xs text-muted">
						Google Drive or Docs: set sharing to <strong>Anyone with the link</strong> so the preview
						can load.
					</p>
					{#if form?.action === 'addLink' && form.message}
						<p class="text-sm text-danger">{form.message}</p>
					{/if}
					<button class="btn-primary w-full">Add link</button>
				</form>
			{:else if data.uploadsEnabled}
				<form
					method="post"
					action="?/upload"
					enctype="multipart/form-data"
					use:enhance
					class="mt-4 space-y-3"
				>
					<label class="block">
						<span class="field-label">Name</span>
						<input name="label" placeholder="Defaults to the file name" class="input" />
					</label>
					<label class="block">
						<span class="field-label">File</span>
						<input
							name="file"
							type="file"
							required
							accept={data.accept}
							class="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-mark file:px-3 file:py-2 file:font-medium file:text-primary"
						/>
					</label>
					<p class="text-xs text-muted">
						PDF, Word (.docx), PNG, JPG or WebP · up to {data.maxMb} MB
					</p>
					{#if form?.action === 'upload' && form.message}
						<p class="text-sm text-danger">{form.message}</p>
					{/if}
					<button class="btn-primary w-full">Upload</button>
				</form>
			{:else}
				<p class="notice mt-4">
					File uploads will be turned on once storage is set up. For now, add a Google Drive link.
				</p>
			{/if}
		</section>
	</div>

	<!-- Viewer -->
	<section class="card flex min-h-[32rem] flex-col overflow-hidden lg:col-span-3">
		{#if selected}
			<div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
				<p class="truncate font-semibold">{selected.label}</p>
				<a
					href={kind === 'download' ? `${fileHref(selected.id)}?download=1` : openHref(selected)}
					target="_blank"
					rel="noopener noreferrer"
					class="link shrink-0 text-sm">{kind === 'download' ? 'Download' : 'Open in new tab ↗'}</a
				>
			</div>
			<div class="flex flex-1 bg-cream">
				{#if kind === 'embed'}
					<iframe
						src={toEmbedUrl(selected.url)}
						title={selected.label}
						class="h-[70vh] min-h-[30rem] w-full flex-1 border-0"
						allow="autoplay"
						referrerpolicy="no-referrer"
					></iframe>
				{:else if kind === 'pdf'}
					<iframe
						src={fileHref(selected.id)}
						title={selected.label}
						class="h-[70vh] min-h-[30rem] w-full flex-1 border-0"
					></iframe>
				{:else if kind === 'image'}
					<div class="flex flex-1 items-start justify-center overflow-auto p-4">
						<img src={fileHref(selected.id)} alt={selected.label} class="max-w-full shadow-md" />
					</div>
				{:else}
					<div class="m-auto max-w-sm p-6 text-center text-sm text-muted">
						{#if kind === 'download'}
							Word documents can't be previewed in the browser. Use <strong>Download</strong> to open
							it.
						{:else}
							This link can't be previewed here. Use <strong>Open in new tab</strong> to view it.
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="m-auto p-6 text-center text-muted">Your resume preview will show here.</div>
		{/if}
	</section>
</div>

<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const NAV = [
		{ href: '/jobs', label: 'Jobs' },
		{ href: '/applications', label: 'Applications' },
		{ href: '/resume', label: 'Resume' }
	];

	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>YoureHired</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<header class="sticky top-0 z-20 border-b border-line bg-nav backdrop-blur">
		<nav class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
			<a href="/" class="text-gradient text-xl font-extrabold tracking-tight">YoureHired</a>
			{#if data.user}
				<div class="flex gap-1">
					{#each NAV as item (item.href)}
						<a
							href={item.href}
							aria-current={isActive(item.href) ? 'page' : undefined}
							class="rounded-lg px-3 py-1.5 text-sm font-medium transition {isActive(item.href)
								? 'bg-mark text-primary'
								: 'text-muted hover:text-fg'}">{item.label}</a
						>
					{/each}
				</div>
			{/if}
			<div class="ml-auto flex items-center gap-3">
				{#if data.user}
					<span class="hidden text-sm text-muted sm:inline">{data.user.name}</span>
					<form method="post" action="/logout">
						<button class="text-sm font-medium text-muted hover:text-primary">Log out</button>
					</form>
				{:else}
					<a href="/login" class="text-sm font-medium text-muted hover:text-primary">Log in</a>
					<a href="/signup" class="btn-primary py-1.5 text-sm">Sign up</a>
				{/if}
				<ThemeToggle />
			</div>
		</nav>
	</header>

	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
		{@render children()}
	</main>

	<footer class="bg-footer text-on-dark-muted">
		<div class="mx-auto max-w-5xl px-4 py-6 text-sm">
			YoureHired · a <span class="font-semibold text-on-dark">PrideNPurpose</span> app
		</div>
	</footer>
</div>

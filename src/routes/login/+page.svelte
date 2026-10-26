<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthField from '#lib/components/AuthField.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<div class="flex min-h-[calc(100vh-14rem)] items-center justify-center py-6">
	<div class="auth-card">
		<h1 class="mb-8 text-center text-3xl font-bold tracking-tight">Log in</h1>
		<form method="post" use:enhance class="space-y-5">
			<AuthField
				label="Email"
				type="email"
				name="email"
				autocomplete="email"
				required
				value={form?.email ?? ''}
			/>
			<AuthField
				label="Password"
				type="password"
				name="password"
				autocomplete="current-password"
				required
			/>
			{#if form?.message}
				<p class="text-sm text-danger">{form.message}</p>
			{/if}
			<button class="btn-primary w-full py-3 text-base">Log in</button>
		</form>
		<p class="mt-6 text-center text-sm text-muted">
			No account? <a href="/signup" class="link">Sign up</a>
		</p>
	</div>
</div>

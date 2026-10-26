<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthField from '#lib/components/AuthField.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let mismatch = $derived(confirmPassword !== '' && password !== confirmPassword);
</script>

<div class="flex min-h-[calc(100vh-14rem)] items-center justify-center py-6">
	<div class="auth-card">
		<h1 class="mb-8 text-center text-3xl font-bold tracking-tight">Create an account</h1>
		<form
			method="post"
			use:enhance={({ cancel }) => {
				if (password !== confirmPassword) cancel();
			}}
			class="space-y-5"
		>
			<AuthField label="Name" name="name" autocomplete="name" required value={form?.name ?? ''} />
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
				autocomplete="new-password"
				minlength={8}
				required
				oninput={(e) => (password = e.currentTarget.value)}
			/>
			<AuthField
				label="Confirm password"
				type="password"
				name="confirmPassword"
				autocomplete="new-password"
				minlength={8}
				required
				aria-invalid={mismatch}
				aria-describedby="confirm-password-error"
				oninput={(e) => (confirmPassword = e.currentTarget.value)}
			/>
			{#if mismatch}
				<p id="confirm-password-error" class="text-sm text-danger">Passwords don't match.</p>
			{/if}
			{#if form?.message}
				<p class="text-sm text-danger">{form.message}</p>
			{/if}
			<button class="btn-primary w-full py-3 text-base">Sign up</button>
		</form>
		<p class="mt-6 text-center text-sm text-muted">
			Already have an account? <a href="/login" class="link">Log in</a>
		</p>
	</div>
</div>

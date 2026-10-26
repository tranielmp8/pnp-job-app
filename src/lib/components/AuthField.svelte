<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { label, ...rest }: { label: string } & HTMLInputAttributes = $props();
</script>

<label class="block">
	<span class="field-label">{label}</span>
	<input {...rest} class="input" />
</label>

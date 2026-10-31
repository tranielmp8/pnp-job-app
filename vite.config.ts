import tailwindcss from '@tailwindcss/vite';
import netlifyAdapter from '@sveltejs/adapter-netlify';
import nodeAdapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Deployed on Netlify. The Dockerfile sets ADAPTER=node to build a plain
			// Node server instead (kept for a possible VPS/Coolify deploy later).
			adapter: process.env.ADAPTER === 'node' ? nodeAdapter() : netlifyAdapter()
		})
	]
});

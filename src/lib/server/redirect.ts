// Only allow same-site relative paths, so ?redirectTo= can't send users off-site.
export function safeRedirect(target: string | null | undefined, fallback = '/jobs'): string {
	if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
		return fallback;
	}
	return target;
}

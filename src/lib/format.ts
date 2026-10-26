export function formatLocation(j: {
	city: string | null;
	state: string | null;
	isRemote: boolean;
}): string {
	const place = [j.city, j.state].filter(Boolean).join(', ');
	if (j.isRemote) return place ? `Remote · ${place}` : 'Remote';
	return place || 'Location not listed';
}

const usd = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0
});

export function formatSalary(min: number | null, max: number | null): string | null {
	if (min && max && min !== max) return `${usd.format(min)} – ${usd.format(max)}`;
	if (min || max) return usd.format((min || max)!);
	return null;
}

export function timeAgo(date: Date | string | null): string | null {
	if (!date) return null;
	const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
	if (days <= 0) return 'Today';
	if (days === 1) return 'Yesterday';
	if (days < 30) return `${days} days ago`;
	const months = Math.floor(days / 30);
	return months === 1 ? '1 month ago' : `${months} months ago`;
}

export const SOURCE_LABELS: Record<string, string> = { jsearch: 'JSearch', adzuna: 'Adzuna' };

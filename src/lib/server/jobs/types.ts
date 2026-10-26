export type JobSource = 'jsearch' | 'adzuna';

export interface JobQuery {
	keywords: string;
	city: string;
	/** Two-letter state code, e.g. `TX`. */
	state: string;
	remoteOnly: boolean;
	page: number;
}

/** A listing in provider-neutral form, ready to upsert into the `job` table. */
export interface NormalizedJob {
	source: JobSource;
	externalId: string;
	dedupeHash: string;
	title: string;
	company: string | null;
	city: string | null;
	state: string | null;
	country: string | null;
	isRemote: boolean;
	salaryMin: number | null;
	salaryMax: number | null;
	description: string | null;
	applyUrl: string;
	postedAt: Date | null;
}

export interface JobProvider {
	source: JobSource;
	label: string;
	/** False when the provider's API keys aren't configured. */
	enabled: boolean;
	search(query: JobQuery): Promise<NormalizedJob[]>;
}

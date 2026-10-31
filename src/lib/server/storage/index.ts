// Pluggable file storage for uploaded resumes. The app only talks to
// `StorageDriver`; adding another backend means writing one more driver here
// and adding it to `getStorage()` — nothing else changes.
import {
	STORAGE_DRIVER,
	UPLOAD_DIR,
	S3_BUCKET,
	S3_ENDPOINT,
	S3_REGION,
	S3_ACCESS_KEY_ID,
	S3_SECRET_ACCESS_KEY,
	S3_FORCE_PATH_STYLE
} from '$app/env/private';
import { localDriver } from './local.ts';
import { s3Driver } from './s3.ts';

export interface StorageDriver {
	name: string;
	put(key: string, data: Uint8Array, contentType: string): Promise<void>;
	/** Returns null when the object doesn't exist. */
	get(key: string): Promise<ReadableStream<Uint8Array> | null>;
	delete(key: string): Promise<void>;
}

let driver: StorageDriver | null | undefined;

function createDriver(): StorageDriver | null {
	if (STORAGE_DRIVER === 'local') return localDriver(UPLOAD_DIR);
	if (STORAGE_DRIVER === 's3') {
		if (!S3_BUCKET || !S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
			throw new Error(
				'STORAGE_DRIVER=s3 needs S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY'
			);
		}
		return s3Driver({
			bucket: S3_BUCKET,
			endpoint: S3_ENDPOINT,
			region: S3_REGION,
			accessKeyId: S3_ACCESS_KEY_ID,
			secretAccessKey: S3_SECRET_ACCESS_KEY,
			forcePathStyle: S3_FORCE_PATH_STYLE
		});
	}
	return null;
}

/** The configured driver, or null when uploads are turned off (`STORAGE_DRIVER=none`). */
export function getStorage(): StorageDriver | null {
	if (driver === undefined) driver = createDriver();
	return driver;
}

export const uploadsEnabled = () => getStorage() !== null;

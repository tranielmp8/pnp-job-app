// Pluggable file storage for uploaded resumes. The app only talks to
// `StorageDriver`; adding a bucket later means writing one more driver here
// (e.g. `s3.ts` for an S3-compatible bucket like MinIO on Coolify) and adding
// it to `getStorage()` — nothing else changes.
import { STORAGE_DRIVER, UPLOAD_DIR } from '$app/env/private';
import { localDriver } from './local.ts';

export interface StorageDriver {
	name: string;
	put(key: string, data: Uint8Array, contentType: string): Promise<void>;
	/** Returns null when the object doesn't exist. */
	get(key: string): Promise<ReadableStream<Uint8Array> | null>;
	delete(key: string): Promise<void>;
}

let driver: StorageDriver | null | undefined;

/** The configured driver, or null when uploads are turned off (`STORAGE_DRIVER=none`). */
export function getStorage(): StorageDriver | null {
	if (driver === undefined) {
		driver = STORAGE_DRIVER === 'local' ? localDriver(UPLOAD_DIR) : null;
	}
	return driver;
}

export const uploadsEnabled = () => getStorage() !== null;

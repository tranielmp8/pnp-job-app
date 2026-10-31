import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	NoSuchKey
} from '@aws-sdk/client-s3';
import type { StorageDriver } from './index.ts';

export interface S3Config {
	bucket: string;
	endpoint: string;
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
	forcePathStyle: boolean;
}

/** Stores files in an S3-compatible bucket (Railway bucket, MinIO, R2, AWS S3, ...). */
export function s3Driver(config: S3Config): StorageDriver {
	const client = new S3Client({
		endpoint: config.endpoint,
		region: config.region,
		forcePathStyle: config.forcePathStyle,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey
		}
	});
	const Bucket = config.bucket;

	return {
		name: 's3',

		async put(key, data, contentType) {
			await client.send(
				new PutObjectCommand({ Bucket, Key: key, Body: data, ContentType: contentType })
			);
		},

		async get(key) {
			try {
				const res = await client.send(new GetObjectCommand({ Bucket, Key: key }));
				return res.Body ? res.Body.transformToWebStream() : null;
			} catch (err) {
				if (err instanceof NoSuchKey) return null;
				throw err;
			}
		},

		async delete(key) {
			// S3 deletes are idempotent: deleting a missing key is not an error.
			await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
		}
	};
}

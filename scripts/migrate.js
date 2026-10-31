// Applies pending SQL migrations from ./drizzle, then exits.
// Runs on every container start (see Dockerfile) before the app boots.
// Already-applied migrations are tracked in the database and skipped.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('[migrate] DATABASE_URL is not set');
	process.exit(1);
}

const client = postgres(url, { max: 1, onnotice: () => {} });

try {
	await migrate(drizzle(client), { migrationsFolder: './drizzle' });
	console.log('[migrate] database is up to date');
} catch (err) {
	console.error('[migrate] failed:', err);
	process.exitCode = 1;
} finally {
	await client.end();
}

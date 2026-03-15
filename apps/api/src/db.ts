import { getPooledDb, resolveConnectionString, type AppDb } from '@workspace/db';
import type { QueryResultRow } from 'pg';
import type { WorkerEnv } from './env';

export type Database = AppDb;

const dbResources = new Map<string, ReturnType<typeof getPooledDb>>();

export function getDatabaseUrl(env?: WorkerEnv) {
	return resolveConnectionString(
		env?.HYPERDRIVE?.connectionString ?? env?.CONTROL_PLANE_DATABASE_URL ?? env?.DATABASE_URL,
	);
}

function getDbResources(env?: WorkerEnv) {
	const connectionString = getDatabaseUrl(env);
	const existing = dbResources.get(connectionString);

	if (existing) {
		return existing;
	}

	const next = getPooledDb(connectionString);
	dbResources.set(connectionString, next);
	return next;
}

export const pool = getDbResources().pool;
export const db = getDbResources().db;

export function createDb(env: WorkerEnv): Database {
	return getDbResources(env).db;
}

export async function closeDbConnections() {
	const resources = [...dbResources.values()];
	dbResources.clear();

	await Promise.all(resources.map(({ pool: currentPool }) => currentPool.end()));
}

export async function query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T[]> {
	const res = await getDbResources().pool.query<T>(text, params);
	return res.rows;
}

import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

import { resolveAuth } from './auth';
import type { Database } from './db';
import type { WorkerEnv } from './env';

export async function createContext(opts: FetchCreateContextFnOptions, env: WorkerEnv, db: Database) {
	const auth = await resolveAuth(opts.req, env, db);

	return {
		req: opts.req,
		env,
		db,
		auth,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;

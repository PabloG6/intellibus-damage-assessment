import { drizzle } from "drizzle-orm/node-postgres";
import { Effect } from "effect";
import type { Client } from "pg";
import { createDbClient, type AppDb } from "./client";
import { schema } from "./db-schema";

interface DbResource {
  client: Client;
  db: AppDb;
}

const makeDbResource = (connectionString: string) =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: async (): Promise<DbResource> => {
        const client = createDbClient(connectionString);
        await client.connect();

        return {
          client,
          db: drizzle(client, { schema }),
        };
      },
      catch: (error) => error,
    }),
    ({ client }) =>
      Effect.promise(async () => {
        await client.end();
      }),
  );

export const withDbEffect = <A, E>(
  connectionString: string,
  run: (db: AppDb) => Effect.Effect<A, E>,
) =>
  Effect.scoped(
    Effect.flatMap(makeDbResource(connectionString), ({ db }) => run(db)),
  );

export const withControlPlaneDbEffect = withDbEffect;

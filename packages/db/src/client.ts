import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client, Pool } from "pg";
import { schema } from "./db-schema";

export type AppDb = NodePgDatabase<typeof schema>;

export const DEFAULT_DATABASE_URL =
  "postgres://yardwatch:yardwatch123@localhost:5432/yardwatch";

export const resolveConnectionString = (connectionString?: string | null) =>
  connectionString ??
  process.env.CONTROL_PLANE_DATABASE_URL ??
  process.env.DATABASE_URL ??
  DEFAULT_DATABASE_URL;

export const createDbClient = (connectionString: string) => {
  return new Client({ connectionString });
};

export const createDbPool = (connectionString: string) => {
  return new Pool({ connectionString });
};

export const getPooledDb = (connectionString: string) => {
  const pool = createDbPool(connectionString);

  return {
    pool,
    db: drizzle(pool, { schema }),
  };
};

export const getConnectedDb = async (connectionString: string) => {
  const client = createDbClient(connectionString);
  await client.connect();

  return {
    client,
    db: drizzle(client, { schema }),
  };
};

export const getControlPlaneDb = (connectionString: string) =>
  getPooledDb(connectionString).db;

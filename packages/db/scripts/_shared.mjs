import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { Client } from "pg";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

export const packageDir = path.resolve(scriptDir, "..");
export const drizzleDir = path.join(packageDir, "drizzle");
export const metaDir = path.join(drizzleDir, "meta");
export const DEFAULT_DATABASE_URL =
  "postgres://yardwatch:yardwatch123@localhost:5432/yardwatch";

loadDotenv({ path: path.join(packageDir, ".env.local") });

export function resolveConnectionString(explicitConnectionString) {
  return (
    explicitConnectionString ??
    process.env.CONTROL_PLANE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    DEFAULT_DATABASE_URL
  );
}

export function createPgConfig(connectionString) {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  const sslRootCert = url.searchParams.get("sslrootcert");

  if (!sslMode && !sslRootCert) {
    return { connectionString };
  }

  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslrootcert");

  if (sslMode === "disable") {
    return { connectionString: url.toString() };
  }

  return {
    connectionString: url.toString(),
    ssl: {
      rejectUnauthorized: sslMode !== "require",
    },
  };
}

export function createClient(connectionString = resolveConnectionString()) {
  return new Client(createPgConfig(connectionString));
}

export async function withClient(run, connectionString) {
  const client = createClient(connectionString);
  await client.connect();

  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

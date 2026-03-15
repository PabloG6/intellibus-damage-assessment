import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { drizzleDir, metaDir, resolveConnectionString, withClient } from "./_shared.mjs";

async function readManifestEntries() {
  const manifestPath = path.join(metaDir, "_journal.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

  return Promise.all(
    manifest.entries.map(async (entry) => {
      const filename = `${entry.tag}.sql`;
      const sqlPath = path.join(drizzleDir, filename);
      const sql = await fs.readFile(sqlPath, "utf8");

      return {
        ...entry,
        hash: crypto.createHash("sha256").update(sql).digest("hex"),
        sql,
      };
    }),
  );
}

async function migrationTableExists(client, schema) {
  const result = await client.query("select to_regclass($1) as table_name", [
    `${schema}.__drizzle_migrations`,
  ]);

  return Boolean(result.rows[0]?.table_name);
}

async function readMigrationRows(client, schema) {
  if (!(await migrationTableExists(client, schema))) {
    return [];
  }

  const result = await client.query(
    `select id, hash, created_at from "${schema}"."__drizzle_migrations" order by id`,
  );

  return result.rows;
}

async function ensurePublicJournal(client) {
  await client.query(`
    create table if not exists public.__drizzle_migrations (
      id integer primary key generated always as identity,
      hash text not null,
      created_at bigint
    )
  `);
}

async function reconcileLegacyJournal(client) {
  const legacyRows = await readMigrationRows(client, "drizzle");
  const publicRows = await readMigrationRows(client, "public");

  if (!legacyRows.length) {
    return publicRows;
  }

  if (publicRows.length > legacyRows.length) {
    throw new Error(
      "public.__drizzle_migrations has more rows than drizzle.__drizzle_migrations; refusing to continue",
    );
  }

  for (let index = 0; index < publicRows.length; index += 1) {
    if (publicRows[index].hash !== legacyRows[index].hash) {
      throw new Error(
        "Migration journal mismatch between public.__drizzle_migrations and drizzle.__drizzle_migrations",
      );
    }
  }

  if (publicRows.length === legacyRows.length) {
    return publicRows;
  }

  for (const row of legacyRows.slice(publicRows.length)) {
    await client.query(
      `
        insert into public.__drizzle_migrations (id, hash, created_at)
        overriding system value
        values ($1, $2, $3)
      `,
      [row.id, row.hash, row.created_at],
    );
  }

  return readMigrationRows(client, "public");
}

async function applyPendingMigrations(client, entries) {
  const appliedRows = await readMigrationRows(client, "public");

  if (appliedRows.length > entries.length) {
    throw new Error(
      "public.__drizzle_migrations has more rows than the checked-in migration manifest",
    );
  }

  for (let index = 0; index < appliedRows.length; index += 1) {
    if (appliedRows[index].hash !== entries[index].hash) {
      throw new Error(
        `Applied migration hash mismatch at index ${index}; expected ${entries[index].hash}, found ${appliedRows[index].hash}`,
      );
    }
  }

  for (const entry of entries.slice(appliedRows.length)) {
    await client.query("begin");

    try {
      await client.query(entry.sql);
      await client.query(
        "insert into public.__drizzle_migrations (hash, created_at) values ($1, $2)",
        [entry.hash, entry.when],
      );
      await client.query("commit");
      console.log(`Applied migration ${entry.tag}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
}

async function main() {
  const connectionString = resolveConnectionString();
  const entries = await readManifestEntries();

  await withClient(async (client) => {
    await ensurePublicJournal(client);
    await reconcileLegacyJournal(client);
    await applyPendingMigrations(client, entries);
  }, connectionString);

  console.log("Database migrations are up to date.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

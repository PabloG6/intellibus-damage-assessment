import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: "./.env.local" });

const connectionString =
  process.env.CONTROL_PLANE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Missing CONTROL_PLANE_DATABASE_URL or DATABASE_URL in packages/db/.env.local",
  );
}

export default defineConfig({
  schema: ["./src/schema.ts", "./auth.schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  migrations: {
    schema: "public",
  },
  dbCredentials: {
    url: connectionString,
  },
});

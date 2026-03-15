import { getControlPlaneDb, resolveConnectionString } from "@workspace/db";
import { createAuth } from "./src/create-auth";

const auth = createAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:8788",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "dev-only-secret-change-in-production-dev-only-secret",
  database: getControlPlaneDb(resolveConnectionString()),
});

export default auth;

import { createAuth } from "@workspace/auth";
import { resolveConnectionString } from "@workspace/db";
import { withControlPlaneDbEffect } from "@workspace/db/effect";
import { Effect } from "effect";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type AuthWorkerEnv, parseAllowedOrigins } from "./env";

const app = new Hono<{
  Bindings: AuthWorkerEnv;
}>();

app.use("/*", (c, next) => {
  const allowedOrigins = parseAllowedOrigins(c.env.ALLOWED_ORIGINS);

  return cors({
    origin: (origin) => {
      if (!origin) {
        return allowedOrigins[0] ?? "";
      }

      return allowedOrigins.includes(origin) ? origin : "";
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })(c, next);
});

app.on(["GET", "POST"], "/api/*", async (c) => {
  if (!c.env.BETTER_AUTH_SECRET || !c.env.BETTER_AUTH_URL) {
    return c.json(
      { error: "Missing BETTER_AUTH_SECRET or BETTER_AUTH_URL" },
      500,
    );
  }

  return Effect.runPromise(
    withControlPlaneDbEffect(
      resolveConnectionString(
        c.env.HYPERDRIVE?.connectionString ??
          c.env.CONTROL_PLANE_DATABASE_URL ??
          c.env.DATABASE_URL,
      ),
      (database) =>
        Effect.tryPromise(async () => {
          const auth = createAuth({
            baseURL: c.env.BETTER_AUTH_URL!,
            secret: c.env.BETTER_AUTH_SECRET!,
            database,
            trustedOrigins: parseAllowedOrigins(c.env.ALLOWED_ORIGINS),
          });

          return auth.handler(c.req.raw);
        }),
    ),
  );
});

app.get("/health", (c) => c.json({ ok: true }));

export default app;

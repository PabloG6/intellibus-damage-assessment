# Cloudflare production rollout

This repo is already built around a Cloudflare Worker API and a TanStack Start frontend. The lowest-friction production setup keeps PostgreSQL as PostgreSQL and deploys both apps as Workers.

## What ships where

- `apps/web`: TanStack Start built with Nitro's `cloudflare_module` preset and deployed as the `yardwatch-web` Worker with static assets.
- `apps/api`: tRPC API deployed as the `yardwatch-api` Worker.
- `packages/db`: shared schema and migration code. This stays pointed at your production Postgres database.

## GitHub secrets to add

The workflow in `.github/workflows/deploy-cloudflare.yml` expects these secrets:

- `CLOUDFLARE_API_TOKEN`: API token with Workers deploy access.
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID.
- `WEB_BASE_URL`: production URL for the frontend, for example `https://yardwatch.example.com`.
- `WEB_API_URL`: production URL for the API, for example `https://api.yardwatch.example.com`.
- `WEB_AUTH_URL`: optional. If auth stays on the same Worker as the API, use the same value as `WEB_API_URL`.
- `WEB_MAPBOX_API_KEY`: public Mapbox token used by the dashboard.
- `API_ALLOWED_ORIGINS`: comma-separated browser origins allowed to call the API. Include the exact `WEB_BASE_URL`.
- `API_DATABASE_URL`: production Postgres URL.
- `API_CONTROL_PLANE_DATABASE_URL`: optional override if you want a separate control-plane database URL.
- `API_GOOGLE_MAPS_API_KEY`: optional. Only needed if you plan to run enrichment against production from CI.

## Postgres production path

Do not move this app to D1 unless you want to change the database layer. The code already uses `pg` and Drizzle against PostgreSQL, so the simplest production path is:

1. Create a managed Postgres instance.
2. Copy the existing local database into it.
3. Point the API Worker at that production database.

### Easiest copy option

Use the helper script from the repo root:

```bash
TARGET_DATABASE_URL="postgres://..." npm run db:push:production
```

The script loads your local source URL from `packages/db/.env.local` by default, then streams `pg_dump` directly into the target database with `psql`.

### If you want Cloudflare's recommended connection path

Cloudflare's official guidance for PostgreSQL on Workers is to use [Hyperdrive](https://developers.cloudflare.com/hyperdrive/). The API now supports that by preferring `env.HYPERDRIVE.connectionString` when a Hyperdrive binding exists.

To switch to Hyperdrive later:

1. Create a Hyperdrive configuration that points at the same production Postgres instance.
2. Add the `HYPERDRIVE` binding to `apps/api/wrangler.jsonc`.
3. Run `npx wrangler types` in `apps/api` if you want regenerated binding types.

If you do not add Hyperdrive, the Worker still works with `API_DATABASE_URL` directly.

## First production deploy

After the GitHub secrets are in place:

1. Push to `main` or run the workflow manually from the Actions tab.
2. Attach custom domains to `yardwatch-web` and `yardwatch-api` in Cloudflare.
3. Set `API_ALLOWED_ORIGINS` to the exact frontend origin or origins you will use.
4. Re-run the workflow after any domain change so the frontend is rebuilt with the correct `VITE_*` URLs.

## After deploy

Validate these before calling production ready:

- The frontend loads from the production Worker URL or custom domain.
- The browser can reach `https://<api-domain>/api/trpc`.
- The incidents dashboard loads live records from production Postgres.
- CORS rejects unknown origins and allows the production frontend origin.

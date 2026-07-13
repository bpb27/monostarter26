# monostarter26

A TypeScript monorepo: mobile app, user web app, admin web app, and an API server.

## Stack

| Concern | Choice |
| --- | --- |
| Monorepo | Turborepo + pnpm workspaces |
| Runtime pinning | mise (Node 26, pnpm 11) |
| Mobile | Expo (SDK 57) + expo-router |
| Web (user + admin) | React 19 + Vite SPA + React Router |
| Frontend toolchain | Vite+ (`vp`) — scoped to lint/format/test/build |
| Server | Hono on Node (long-running container on Railway) |
| Database | Postgres (Railway) + Kysely |
| Auth | Clerk |
| Hosting | Railway (server + Postgres), EAS (mobile); web = Railway or a CDN |

## Layout

```
apps/
  mobile/      Expo app
  web-user/    user-facing SPA
  web-admin/   admin SPA (admin-role gated)
  server/      Hono API
packages/
  tsconfig/    shared TS configs
  shared/      shared, isomorphic types
  env/         env manifest (per-app schemas) + getters + `env:sync` generator
  db/          Kysely client, migrations, seed
  auth/        Clerk role helpers
  api-client/  typed Hono RPC client (shared by all frontends)
```

## Getting started

See [docs/initial-setup.md](docs/initial-setup.md) for one-time manual setup
(mise, `vp`, Docker, accounts, env vars). Then:

```bash
pnpm install
cp .env.example .env      # fill in Clerk keys, etc.
pnpm env:sync             # fan the root .env out to per-app .env files
docker compose up -d      # local Postgres
pnpm db:migrate           # apply schema
pnpm dev                  # run everything via turbo
```

## Common commands

| Command | Does |
| --- | --- |
| `pnpm dev` | Run all apps in dev |
| `pnpm build` | Build all apps/packages |
| `pnpm typecheck` | Typecheck the workspace |
| `pnpm lint` | Lint (oxlint on web apps) |
| `pnpm test` | Run tests |
| `pnpm db:migrate` | Apply DB migrations |
| `pnpm db:codegen` | Regenerate Kysely types from the DB |
| `pnpm env:sync` | Regenerate per-app `.env` from the root `.env` |
| `pnpm env:example` | Regenerate committed `.env.example` files from the manifest |

Target a single package with `--filter`, e.g. `pnpm --filter server dev`.

## Tooling responsibilities

- **mise** pins Node + pnpm versions.
- **pnpm** is the package manager / workspace linker.
- **Turborepo** orchestrates tasks across packages (caching, dependency order).
- **Vite+ (`vp`)** is the per-app frontend toolchain. The web apps are standard
  Vite projects, which `vp migrate` adopts; once the `vp` CLI is installed,
  `vp dev|build|check|test` wrap the current `vite`/`oxlint`/`vitest` scripts.

## Deployment

See [docs/initial-setup.md](docs/initial-setup.md#7-deploy-the-server-to-railway)
for step-by-step Railway setup.

- **Server**: a long-running container built from `apps/server/Dockerfile`
  (multi-stage `node:26-alpine`; the build **bundles** the `@repo/*` workspace
  packages so the runtime needs no TypeScript). Deployed on **Railway**;
  config-as-code in `apps/server/railway.json` (Dockerfile builder + `/health`
  healthcheck). Railway injects `PORT`; the app binds `0.0.0.0:$PORT`.
- **Database**: **Railway Postgres**. Wire it to the server with
  `DATABASE_URL = ${{Postgres.DATABASE_URL}}` (private network). SSL is enabled
  only when the URL has `sslmode=require` or `DATABASE_SSL=true`.
- **Web apps**: static SPAs served by **Caddy** containers on Railway
  (`apps/web-*/Dockerfile` + `Caddyfile`, with SPA fallback to `index.html`).
  `VITE_API_URL` uses the `${{server.RAILWAY_PUBLIC_DOMAIN}}` reference so each
  environment points at its own server.
- **Mobile**: EAS (`eas build` / `eas update`) — see
  [docs/mobile-deploy.md](docs/mobile-deploy.md).

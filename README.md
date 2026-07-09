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
| Server | Hono on Node (Vercel Functions in prod) |
| Database | Postgres (Supabase in prod) + Kysely |
| Auth | Clerk |
| Hosting | Vercel (web + server), EAS (mobile) |

## Layout

```
apps/
  mobile/      Expo app
  web-user/    user-facing SPA
  web-admin/   admin SPA (admin-role gated)
  server/      Hono API
packages/
  tsconfig/    shared TS configs
  shared/      shared types + zod env schema
  db/          Kysely client, migrations, seed
  auth/        Clerk role helpers
  api-client/  typed Hono RPC client (shared by all frontends)
```

## Getting started

See [docs/initial-setup.md](docs/initial-setup.md) for one-time manual setup
(mise, `vp`, Docker, accounts, env vars). Then:

```bash
pnpm install
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

Target a single package with `--filter`, e.g. `pnpm --filter server dev`.

## Tooling responsibilities

- **mise** pins Node + pnpm versions.
- **pnpm** is the package manager / workspace linker.
- **Turborepo** orchestrates tasks across packages (caching, dependency order).
- **Vite+ (`vp`)** is the per-app frontend toolchain. The web apps are standard
  Vite projects, which `vp migrate` adopts; once the `vp` CLI is installed,
  `vp dev|build|check|test` wrap the current `vite`/`oxlint`/`vitest` scripts.

## Deployment

- **Web apps + server**: three Vercel projects, each with its **Root Directory**
  set to `apps/web-user`, `apps/web-admin`, or `apps/server`. Each ships a
  `vercel.json` (SPA rewrites for the web apps; a catch-all to the Hono function
  for the server).
- **Mobile**: EAS (`eas build` / `eas submit`) — see `apps/mobile/eas.json`.
- **Database**: Supabase Postgres; set `DATABASE_URL` in each Vercel project.

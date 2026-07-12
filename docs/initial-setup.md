# Initial setup

Manual, one-time steps to get a working local environment. Everything here is
outside of what the repo can script for you.

## 1. Install `mise`

```bash
curl https://mise.run | sh
```

Add this to your `.zshrc`:

```bash
export PATH="/Users/brendanbrown/.local/bin:$PATH"
eval "$(/Users/$USER/.local/bin/mise activate zsh)"
```

> **⚠️ asdf vs mise PATH precedence.** This machine also has **asdf** installed,
> and its shims (`~/.asdf/shims`) currently come *before* mise on `PATH`, so a
> bare `node`/`pnpm` resolves to the asdf versions (Node 22 / pnpm 9) instead of
> the mise-pinned ones (Node 26 / pnpm 11).
>
> Standardize this repo on mise by making mise activate **after** asdf in your
> `.zshrc` (put the `mise activate` line last), or remove asdf if you no longer
> use it. Verify with:
>
> ```bash
> which node    # -> ~/.local/share/mise/installs/node/26/bin/node
> node -v       # -> v26.x
> pnpm -v       # -> 11.x
> ```

In this directory, run:

```bash
mise trust
mise install
```

## 2. Install the Vite+ CLI (`vp`)

Vite+ is the frontend toolchain (lint/format/test/build) for the web apps and
server. It is currently **beta**.

```bash
curl -fsSL https://vite.plus | bash    # macOS/Linux
```

Verify: `vp --version`.

## 3. Install Docker Desktop

Used to build the server image and to run the local Postgres that mirrors the
production (Railway) database. Download from
<https://www.docker.com/products/docker-desktop/> and start it.

## 4. Create accounts / projects

| Service | Why | What to grab |
| --- | --- | --- |
| [Railway](https://railway.com) | Hosts the **server** (long-running container) + **Postgres** | Link the repo; add a Postgres service |
| [Clerk](https://clerk.com) | Auth for web + mobile | Publishable key + Secret key |
| [Expo / EAS](https://expo.dev) | Mobile builds | Account + `eas login` |

Web apps (`web-user`/`web-admin`) are static SPAs — host on Railway or a CDN
(Cloudflare Pages / Netlify). Mobile ships via EAS, not Railway.

## 5. Environment variables

Local dev uses a **single root `.env`** with canonical (unprefixed) values.
`pnpm env:sync` fans those out into gitignored, correctly-prefixed per-app
`.env` files — so one Clerk key lives in one place instead of being copied
across four files under three prefixes.

```bash
cp .env.example .env      # fill in your Clerk keys, etc.
pnpm env:sync             # writes apps/*/.env from the root .env
```

Canonical keys in the root `.env`:

| Canonical key | Fans out to | Source |
| --- | --- | --- |
| `DATABASE_URL` | server `DATABASE_URL` | Local: docker-compose (below). Prod: Railway `${{Postgres.DATABASE_URL}}` |
| `CLERK_SECRET_KEY` | server `CLERK_SECRET_KEY` | Clerk dashboard |
| `CLERK_PUBLISHABLE_KEY` | server + `VITE_*` + `EXPO_PUBLIC_*` | Clerk dashboard |
| `API_URL` | `VITE_API_URL` + `EXPO_PUBLIC_API_URL` | Local: `http://localhost:8787` (mobile on device: LAN IP) |
| `PORT` | server `PORT` | Local: `8787` |

The mapping (canonical → prefixed name, per app) is defined once in
[`packages/env/src/manifest.ts`](../packages/env/src/manifest.ts) — the single
source of truth that also drives runtime validation (`@repo/env/{server,web,
mobile}`) and a CI drift check (`packages/env/src/drift.test.ts`) that fails if a
var is missing from `.env.example`, `turbo.json`, or a web Dockerfile. To add a
var: edit the manifest, then run `pnpm env:example` to regenerate the committed
`.env.example` files.

Local Postgres (matches `docker-compose.yml`):

```
DATABASE_URL=postgres://postgres:postgres@localhost:5433/monostarter
```

> Port **5433** (not 5432) is used for the local container so it can coexist
> with any Postgres you already run on the default 5432 (e.g. Homebrew).

## 6. First run

```bash
mise install            # toolchain
pnpm install            # workspace deps
cp .env.example .env    # then fill in Clerk keys, etc.
pnpm env:sync           # fan the root .env out to per-app .env files
docker compose up -d    # local Postgres
pnpm db:migrate         # apply schema
pnpm dev                # run everything via turbo
```

## 7. Deploy to Railway

Everything runs on Railway: the server + both web apps as containers, plus a
managed Postgres. Build/deploy config lives in each `apps/<name>/railway.json`,
but several settings must be done once per service in the dashboard (Root
Directory, Config-as-code path, public domains, and **domain target ports**) —
skip one and a green build still serves a 404 or 502.

See **[docs/railway-setup.md](railway-setup.md)** for the full per-service
checklist, the variables to set, preview-environment setup, and a
troubleshooting table keyed to specific symptoms.

Mobile ships via EAS, not Railway.

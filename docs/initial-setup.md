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

Copy each app's `.env.example` to `.env` (or `.env.local`) and fill in values.

| Variable | Used by | Source |
| --- | --- | --- |
| `DATABASE_URL` | server, `@repo/db` | Local: docker-compose (see below). Prod: Railway Postgres — `${{Postgres.DATABASE_URL}}` |
| `CLERK_SECRET_KEY` | server | Clerk dashboard |
| `CLERK_PUBLISHABLE_KEY` | server | Clerk dashboard |
| `VITE_CLERK_PUBLISHABLE_KEY` | web-user, web-admin | Clerk dashboard |
| `VITE_API_URL` | web-user, web-admin | Local: `http://localhost:8787` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | mobile | Clerk dashboard |
| `EXPO_PUBLIC_API_URL` | mobile | Local: your machine LAN IP + port |

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
docker compose up -d    # local Postgres
pnpm db:migrate         # apply schema
pnpm dev                # run everything via turbo
```

## 7. Deploy the server to Railway

The server runs as a long-running container from `apps/server/Dockerfile`.

1. **Postgres**: in your Railway project, New → Database → **PostgreSQL**.
2. **Server service** (from the linked repo) settings:
   - Root Directory: `/` (repo root — the Docker build needs the workspace)
   - Config-as-code: point to `apps/server/railway.json` (sets Dockerfile + healthcheck), or set Builder = Dockerfile, Dockerfile Path = `apps/server/Dockerfile`, Healthcheck = `/health` manually.
3. **Server variables**:
   ```
   DATABASE_URL          = ${{Postgres.DATABASE_URL}}   # private network, no TLS
   CLERK_SECRET_KEY      = sk_live_… (or sk_test_)
   CLERK_PUBLISHABLE_KEY = pk_live_… (or pk_test_)
   ```
   `PORT` is injected by Railway — do not set it.
4. **Run migrations** once against the new DB (from your machine, using the
   Postgres service's **public** URL):
   ```bash
   DATABASE_URL='<Postgres DATABASE_PUBLIC_URL>' DATABASE_SSL=true \
     pnpm --filter @repo/db db:migrate
   ```
5. Point the web apps' `VITE_API_URL` at the server's Railway domain.

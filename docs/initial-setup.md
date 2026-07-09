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

Used for the local Postgres instance that mirrors Supabase.
Download from <https://www.docker.com/products/docker-desktop/> and start it.

## 4. Create accounts / projects

| Service | Why | What to grab |
| --- | --- | --- |
| [Supabase](https://supabase.com) | Hosted Postgres (staging/prod) | Project connection string (`DATABASE_URL`) |
| [Clerk](https://clerk.com) | Auth for web + mobile | Publishable key + Secret key |
| [Vercel](https://vercel.com) | Hosting for web apps + server | Account (link repo later) |
| [Expo / EAS](https://expo.dev) | Mobile builds | Account + `eas login` |

## 5. Environment variables

Copy each app's `.env.example` to `.env` (or `.env.local`) and fill in values.

| Variable | Used by | Source |
| --- | --- | --- |
| `DATABASE_URL` | server, `@repo/db` | Local: docker-compose (see below). Prod: Supabase |
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

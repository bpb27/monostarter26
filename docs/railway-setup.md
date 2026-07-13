# Railway setup

Everything on Railway runs as a container: the **server** (Hono, long-running)
and both web apps (**web-user** / **web-admin**, static SPAs served by Caddy),
plus a managed **Postgres**. Mobile ships via EAS, not Railway.

Build + deploy settings live in code — each service has an
`apps/<name>/railway.json` (Dockerfile builder, healthcheck, watch paths, and for
the server a migrate `preDeployCommand`). But a handful of things **cannot** be
set from the repo and must be done once per service in the Railway dashboard. Those are the
focus of this doc; miss one and you get a green build that still serves a 404 or
502. Every manual step below is marked **⚙️ dashboard**.

## The non-code checklist (do this per service)

| # | Step | server | web-user | web-admin |
| --- | --- | --- | --- | --- |
| 1 | **⚙️ Root Directory = `/`** (repo root) | ✅ | ✅ | ✅ |
| 2 | **⚙️ Config-as-code** → `apps/<name>/railway.json` | `apps/server/railway.json` | `apps/web-user/railway.json` | `apps/web-admin/railway.json` |
| 3 | **⚙️ Custom Start Command** — leave **empty** | ✅ | ✅ | ✅ |
| 4 | **⚙️ Generate a public domain** (Networking) | ✅ | ✅ | ✅ |
| 5 | **⚙️ Domain Target Port** | `8787` | **`8080`** | **`8080`** |
| 6 | Variables (see below) | ✅ | ✅ | ✅ |

Why each matters:

1. **Root Directory `/`.** The Docker builds run `pnpm install` against the
   whole workspace, so the build context must be the repo root. Pointing a
   service's root at `apps/<name>` breaks the build. Keep it `/` and let the
   Dockerfile path in `railway.json` locate the right Dockerfile.
2. **Config-as-code path.** Railway looks for the config file at the service's
   root directory. Because root is `/` (not `apps/<name>`), it will **not** find
   `apps/<name>/railway.json` on its own — you must point at it explicitly. If
   you skip this, Railway ignores your Dockerfile/healthcheck/preDeploy and
   falls back to auto-detection (Railpack), which for the web apps runs the
   **`vite` dev server** instead of building + serving with Caddy.
3. **Empty start command.** A custom start command overrides the Dockerfile
   `CMD`. Leave it blank so the server runs `node dist/index.mjs` and the web
   apps run Caddy, as their Dockerfiles intend.
4. **Public domain.** Each externally-reachable service needs one generated
   (Settings → Networking → Generate Domain). A freshly-forked project has none.
5. **Target Port.** This is the one that bites hardest. Railway's edge routes a
   domain to a **target port** on the container. It does **not** reliably
   auto-detect it, so set it explicitly to match where the app listens:
   - **web-user / web-admin → `8080`** — Caddy binds `:{$PORT:8080}` and the
     Dockerfile `EXPOSE 8080`; with no `PORT` variable it listens on 8080.
   - **server → `8787`** — the server listens on `PORT` (default `8787`, and
     `PORT=8787` is set as a variable).

   A wrong/unset target port produces a **502 with `x-railway-fallback: true`**
   even though the container is healthy — the edge has no valid upstream.

## Variables

**⚙️ dashboard** — set per service. `${{...}}` are Railway
[reference variables](https://docs.railway.com/guides/variables#reference-variables);
they resolve per environment so prod and each PR preview wire themselves up.

**Postgres** — New → Database → PostgreSQL. No config needed.

**server:**
```
DATABASE_URL          = ${{Postgres.DATABASE_URL}}   # private network, no TLS
CLERK_SECRET_KEY      = sk_live_… (or sk_test_)
CLERK_PUBLISHABLE_KEY = pk_live_… (or pk_test_)
CORS_ORIGINS          = https://${{web-user.RAILWAY_PUBLIC_DOMAIN}},https://${{web-admin.RAILWAY_PUBLIC_DOMAIN}}
PORT                  = 8787
```
`CORS_ORIGINS` is the browser allowlist (comma-separated). **Use the reference
form above** rather than pasting literal URLs — a hand-typed value is easy to
truncate (e.g. `…,https://` with the second origin missing), which silently
blocks one of the web apps. Migrations run automatically before each deploy via
the `preDeployCommand` (`node dist/migrate.mjs`) in `apps/server/railway.json`.

**web-user / web-admin** (Vite bakes these in **at build time** — they're passed
to the Dockerfile as build args, so a change requires a rebuild, not just a
restart):
```
VITE_CLERK_PUBLISHABLE_KEY = pk_live_… (or pk_test_)
VITE_API_URL               = https://${{server.RAILWAY_PUBLIC_DOMAIN}}
```

## Watch paths & the dependency graph

Railway decides whether a push triggers a build for a service by matching the
changed files against that service's **watch paths**. These are committed as
`build.watchPatterns` in each `railway.json` (config-as-code — no dashboard
step), and Railway's config file **overrides** the dashboard field.

The critical thing to understand: **watch paths are pure glob matching with zero
dependency-graph awareness.** Turbo knows that `server` depends on
`@repo/db` → `@repo/shared`; Railway does not. So a watch path of only
`apps/server/**` would *miss* a change to `packages/db` and ship a **stale
server** (the running bundle inlines `@repo/*` via tsdown `noExternal`, so old
package code stays live). Turbo's graph is build-time only — it never triggers a
Railway deploy.

Because Railway has no "ignored build step" hook (unlike Vercel), you can't plug
in `turbo-ignore`. Watch paths are the only native lever, so we use the **coarse
superset** — each service watches its own app dir plus *all* shared inputs:

```jsonc
// apps/server/railway.json
"watchPatterns": [
  "apps/server/**",
  "packages/**",        // any workspace package — never miss a transitive dep
  "pnpm-lock.yaml",     // dependency-version bumps touch ONLY the lockfile
  "pnpm-workspace.yaml",
  ".npmrc"
]
```

This never ships stale code. The tradeoff is occasional over-building (a
`packages/x` change only the web apps use still rebuilds the server), which for a
few services is cheap and strictly safer than the alternative. A *precise*
per-app closure (`server` → `packages/{auth,db,env,shared}/**`) minimizes builds
but is brittle: add a dependency and forget to update the globs, and you silently
ship stale code. For a template, correctness beats minimal builds — keep it
coarse. If over-building ever becomes costly, move to a CI-driven approach that
computes affected apps from the Turbo graph (`turbo-ignore` /
`--filter=<app>...[HEAD^1]`) and triggers deploys via the `railway` CLI, with
Railway's git auto-deploy turned off.

> **Applying a `watchPatterns` change is chicken-and-egg.** The commit that
> introduces or edits `watchPatterns` is only picked up if it matches the
> *currently active* watch paths. Editing a file already inside the globs (e.g.
> `apps/server/railway.json`) satisfies this. If a service ever gets stuck on old
> patterns, trigger one manual **Redeploy** to adopt the new config.

## Mobile: not a Railway service

Mobile is an Expo/React Native app — there's no server process to containerize,
so it **does not deploy on Railway**. It ships via **EAS** (`apps/mobile/eas.json`);
JS/TS-only changes (including `@repo/{api-client,env,shared}`) go out as an **EAS
Update** (OTA), while native changes need an **EAS Build** + submit.

Railway often auto-creates a `mobile` service when you first link the repo —
**delete it** (service → Settings → Danger → **Delete service**). Notes:

- Deletion is **per-environment** ("remove it from *this* environment"); delete
  it from `production` (and any other standing environment where it exists).
- It **won't reappear** from normal deploys — a `git push` only deploys existing
  services; Railway never provisions a new service per app folder. There is no
  `apps/mobile/railway.json` and nothing in the repo references a mobile service.
- New PR environments clone `production`, so once it's gone from prod, previews
  won't include it either.

Mobile's deploy automation (an EAS job in CI) is intentionally separate from
Railway; that pipeline is where mobile's graph-awareness lives, if you add it.
See **[mobile-deploy.md](mobile-deploy.md)** for the EAS build + OTA setup.

## Preview environments

Enable **PR Environments** (Focused/Isolated) to get a full-stack, throwaway copy
of the stack per pull request — the reference variables auto-wire web → server →
db, and the committed `watchPatterns` above scope which services rebuild. See
**[railway-preview-envs.md](railway-preview-envs.md)** for the full flow, what
auto-wires, and the first-preview checks.

## Troubleshooting

The app code and Docker images are almost never the cause — you can prove that
locally (see "Reproduce locally" below). When a Railway deploy misbehaves, it's
usually one of the manual steps above. Match the symptom:

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Server: "Starting Container" → "Stopping Container" ~2s later, big stack trace about `Invalid server environment` | A required runtime var is missing/invalid — `getServerEnv()` throws at boot | Set `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` (step 6) |
| Server: 2s exit, log says `Cannot find module '.../dist/index.js'` and runs `pnpm start` | A custom start command / stale (pre-Dockerfile) image is running | Clear the start command (step 3); confirm config-as-code (step 2); force a fresh deploy |
| Domain returns `{"code":404,"message":"Application not found"}` | No healthy deployment is serving the domain (server crash-looping, or never deployed) | Fix the crash above; check the domain exists (step 4) |
| Web: **502** with header `x-railway-fallback: true`, but deploy logs show Caddy healthy on `:8080` | Domain **Target Port** not pointed at the port the app listens on | Set Target Port `8080` (step 5) |
| Web: deploy logs show `$ vite … Local: http://localhost:5173/` instead of Caddy | Config-as-code not applied → Railpack auto-detect ran the dev server | Set config-as-code (step 2), redeploy |
| A commit shows as **SKIPPED** on a service | Watch paths didn't match that commit (expected for focused previews), or auto-deploy is off | Trigger a manual deploy: service → Deployments → ⋯ → **Redeploy** (bypasses watch-path skipping) |

### Verify from the terminal

```bash
# server up?
curl -s -o /dev/null -w "%{http_code}\n" https://<server-domain>/health          # -> 200

# web app serving real HTML (not the Railway fallback)?
curl -s https://<web-user-domain>/ | grep -o '<title>[^<]*</title>'              # -> <title>Monostarter — User</title>

# a fallback 502 shows this header; a real app response does not
curl -sD - -o /dev/null https://<web-user-domain>/ | grep -i x-railway-fallback

# CORS allows the web origin? (expect 204)
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS \
  -H "Origin: https://<web-user-domain>" -H "Access-Control-Request-Method: GET" \
  https://<server-domain>/api/widgets
```

### Reproduce locally with Docker

Every service builds and runs with the same Dockerfile Railway uses (build
context = repo root). This is the fastest way to confirm an issue is config, not
code:

```bash
# server — build, then run against the local compose Postgres
docker build -f apps/server/Dockerfile -t mono-server:local .
docker run --rm -p 8787:8787 --env-file .env \
  -e DATABASE_URL="postgres://postgres:postgres@host.docker.internal:5433/monostarter" \
  mono-server:local
# running with NO env reproduces the "invalid environment" boot crash.

# web — VITE_* are build args, baked in at build time
docker build -f apps/web-user/Dockerfile \
  --build-arg VITE_API_URL="http://localhost:8787" \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY="pk_test_…" \
  -t mono-web-user:local .
docker run --rm -p 5173:8080 mono-web-user:local   # Caddy serves on 8080
```

> **Railway MCP auth note.** The Railway MCP server caches its token at startup;
> when it expires, MCP calls fail with `Unauthorized` and a full restart is
> needed to refresh it. The `railway` CLI authenticates independently and keeps
> working — fall back to it for logs/status.

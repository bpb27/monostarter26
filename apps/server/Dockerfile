# Multi-stage build for the Hono server in a pnpm monorepo.
# Build context is the REPO ROOT (see docker-bake / Railway root dir = repo root),
# so the whole workspace is available for `pnpm install` + build.

FROM node:26-alpine AS base
# Node 25+ images no longer bundle corepack, so install pnpm directly
# (pinned to match packageManager in the root package.json).
RUN npm install -g pnpm@11.10.0

# --- Install full workspace (dev deps needed to build) ---
FROM base AS build
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter server build
# Produce a self-contained deploy dir: server's prod deps + built dist.
# @repo/* are bundled into dist, so only real npm deps land in node_modules.
RUN pnpm --filter=server --prod --legacy deploy /prod/server

# --- Minimal runtime image ---
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /prod/server/node_modules ./node_modules
COPY --from=build /prod/server/dist ./dist
COPY --from=build /prod/server/package.json ./package.json
# Railway injects PORT; the server binds 0.0.0.0:$PORT (defaults 8787 locally).
EXPOSE 8787
CMD ["node", "dist/index.mjs"]

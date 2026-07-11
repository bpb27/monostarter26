# Build the Vite SPA, then serve the static output via Caddy (SPA fallback).
# Build context = repo root (needs the workspace for pnpm install).
FROM node:26-alpine AS build
RUN npm install -g pnpm@11.10.0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter web-user...
# Vite inlines these at BUILD time. Railway passes service variables as build
# args; set VITE_API_URL to https://${{server.RAILWAY_PUBLIC_DOMAIN}} so each
# environment (prod / PR preview) points at its own server.
ARG VITE_API_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN pnpm --filter web-user build

FROM caddy:2-alpine AS runtime
COPY apps/web-user/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/apps/web-user/dist /srv
EXPOSE 8080

import { z } from "zod";

/**
 * The single source of truth for environment variables across the monorepo.
 *
 * One manifest drives three consumers:
 *  1. Runtime getters (`@repo/env/{server,web,mobile}`) — validate + type env.
 *  2. The `env:sync` generator — writes prefixed per-app `.env` files from the
 *     canonical root `.env`.
 *  3. The drift check (`drift.test.ts`) — asserts every var below is declared in
 *     each app's `.env.example`, `turbo.json` globalEnv, and (web) Dockerfile.
 *
 * To add a variable: add it to the relevant app schema AND its `sources` map,
 * add the canonical key to `canonical`, then run `pnpm env:sync --example`.
 */

/** Local web dev servers — the default CORS allowlist and its example value. */
export const DEV_CORS_ORIGINS = [
  "http://localhost:5173", // web-user
  "http://localhost:5174", // web-admin
];

/** Per-app zod schemas. `z.infer` of these is the getter return type. */
export const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  PORT: z.coerce.number().default(8787),
  // Comma-separated browser origins allowed by CORS -> parsed to a list.
  CORS_ORIGINS: z
    .string()
    .default(DEV_CORS_ORIGINS.join(","))
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
});

/** web-user and web-admin share this schema (Vite inlines `VITE_*` at build). */
export const webSchema = z.object({
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  VITE_API_URL: z.string().url(),
});

/** Expo inlines `EXPO_PUBLIC_*` at build. */
export const mobileSchema = z.object({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  EXPO_PUBLIC_API_URL: z.string().url(),
});

/** Config surfaces the drift check enforces per app. */
export type Surface = "envExample" | "turboGlobalEnv" | "dockerArg";

export interface AppEnvSpec {
  /** Directories under `apps/` that consume this schema (web has two). */
  dirs: string[];
  /** Prefix the bundler requires to expose a var to client code. */
  prefix: "" | "VITE_" | "EXPO_PUBLIC_";
  schema: z.ZodObject;
  /** App-facing (prefixed) var name -> canonical key in the root `.env`. */
  sources: Record<string, string>;
  /** Which config surfaces must declare these vars (checked in CI). */
  surfaces: Surface[];
}

export const appEnv: Record<string, AppEnvSpec> = {
  server: {
    dirs: ["server"],
    prefix: "",
    schema: serverSchema,
    sources: {
      NODE_ENV: "NODE_ENV",
      DATABASE_URL: "DATABASE_URL",
      CLERK_SECRET_KEY: "CLERK_SECRET_KEY",
      CLERK_PUBLISHABLE_KEY: "CLERK_PUBLISHABLE_KEY",
      PORT: "PORT",
      CORS_ORIGINS: "CORS_ORIGINS",
    },
    surfaces: ["envExample", "turboGlobalEnv"],
  },
  web: {
    dirs: ["web-user", "web-admin"],
    prefix: "VITE_",
    schema: webSchema,
    sources: {
      VITE_CLERK_PUBLISHABLE_KEY: "CLERK_PUBLISHABLE_KEY",
      VITE_API_URL: "API_URL",
    },
    surfaces: ["envExample", "turboGlobalEnv", "dockerArg"],
  },
  mobile: {
    dirs: ["mobile"],
    prefix: "EXPO_PUBLIC_",
    schema: mobileSchema,
    sources: {
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "CLERK_PUBLISHABLE_KEY",
      EXPO_PUBLIC_API_URL: "API_URL",
    },
    surfaces: ["envExample", "turboGlobalEnv"],
  },
};

/** Canonical keys as they appear in the root `.env` / `.env.example`. */
export interface CanonicalSpec {
  /** Placeholder written into `.env.example`. */
  example: string;
  /** Optional comment written above the var in generated example files. */
  comment?: string;
}

export const canonical: Record<string, CanonicalSpec> = {
  DATABASE_URL: {
    example: "postgres://postgres:postgres@localhost:5433/monostarter",
    comment: "Local Postgres from docker-compose (prod: Railway ${{Postgres.DATABASE_URL}})",
  },
  CLERK_SECRET_KEY: {
    example: "sk_test_...",
    comment: "Clerk (https://dashboard.clerk.com -> API keys)",
  },
  CLERK_PUBLISHABLE_KEY: { example: "pk_test_..." },
  API_URL: {
    example: "http://localhost:8787",
    comment: "Server URL. Mobile on a physical device: use your machine's LAN IP, not localhost.",
  },
  PORT: { example: "8787" },
  NODE_ENV: { example: "development" },
  CORS_ORIGINS: {
    example: DEV_CORS_ORIGINS.join(","),
    comment: "Comma-separated browser origins allowed by CORS (prod: your web app URLs)",
  },
};

/** The set of canonical keys actually referenced by at least one app. */
export function usedCanonicalKeys(): string[] {
  const order = Object.keys(canonical);
  const used = new Set<string>();
  for (const spec of Object.values(appEnv)) {
    for (const from of Object.values(spec.sources)) used.add(from);
  }
  return order.filter((k) => used.has(k));
}

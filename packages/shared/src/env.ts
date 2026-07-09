import { z } from "zod";

/**
 * Server-side environment schema. Validate once at process start with
 * `serverEnv()` so a misconfigured deploy fails fast instead of at first query.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  PORT: z.coerce.number().default(8787),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Accept the variable names the Supabase + Vercel integration injects, so the
 * same code works locally (DATABASE_URL) and on Vercel (POSTGRES_URL*) without
 * hand-maintaining duplicates. Explicit canonical names always win.
 */
function normalize(src: Record<string, unknown>): Record<string, unknown> {
  return {
    ...src,
    DATABASE_URL:
      src.DATABASE_URL ??
      src.POSTGRES_URL_NON_POOLING ??
      src.POSTGRES_URL,
    CLERK_PUBLISHABLE_KEY:
      src.CLERK_PUBLISHABLE_KEY ?? src.VITE_PUBLIC_CLERK_PUBLISHABLE_KEY,
  };
}

let cached: ServerEnv | undefined;

export function serverEnv(source: Record<string, unknown> = process.env): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(normalize(source));
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid server environment:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

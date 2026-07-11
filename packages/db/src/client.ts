import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "./types";

/**
 * Create a Kysely instance. Kept intentionally decoupled from the full server
 * env schema — a migration only needs a connection string.
 *
 * Supabase is just Postgres, so the same `pg` dialect covers local and cloud;
 * the only difference is TLS. SSL is enabled when the connection string asks
 * for it (`sslmode=require`, e.g. Supabase) or `DATABASE_SSL=true` is set —
 * otherwise plaintext. That keeps local Docker and Railway's *internal*
 * Postgres (private network, no TLS) working while still securing Supabase and
 * any public/remote connection. Explicit `connectionString` wins; otherwise we
 * accept the Supabase/Vercel integration's variable names too.
 */
export function createDb(connectionString?: string): Kysely<Database> {
  const url =
    connectionString ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const needsSsl =
    /sslmode=require/i.test(url) || process.env.DATABASE_SSL === "true";
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: url,
        ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      }),
    }),
  });
}

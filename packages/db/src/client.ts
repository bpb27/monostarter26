import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "./types";

/**
 * Create a Kysely instance. Kept intentionally decoupled from the full server
 * env schema — a migration only needs a connection string.
 */
export function createDb(connectionString?: string): Kysely<Database> {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool: new Pool({ connectionString: url }) }),
  });
}

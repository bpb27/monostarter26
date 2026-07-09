import type { Generated } from "kysely";

/**
 * Hand-written to start. Once the local Postgres is migrated you can regenerate
 * this file from the live schema with `pnpm --filter @repo/db codegen`.
 */
export interface Database {
  users: UsersTable;
  widgets: WidgetsTable;
}

export interface UsersTable {
  /** Clerk user id (e.g. "user_2 abc..."). */
  id: string;
  email: string | null;
  role: "user" | "admin";
  created_at: Generated<Date>;
}

export interface WidgetsTable {
  id: Generated<string>;
  name: string;
  owner_id: string;
  created_at: Generated<Date>;
}

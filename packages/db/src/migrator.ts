import type { Kysely } from "kysely";
import { Migrator, type MigrationResultSet } from "kysely/migration";
import { migrations } from "./migrations";
import type { Database } from "./types";

function migrator(db: Kysely<Database>): Migrator {
  return new Migrator({
    db,
    provider: { getMigrations: async () => migrations },
  });
}

export function migrateToLatest(db: Kysely<Database>): Promise<MigrationResultSet> {
  return migrator(db).migrateToLatest();
}

export function migrateDown(db: Kysely<Database>): Promise<MigrationResultSet> {
  return migrator(db).migrateDown();
}

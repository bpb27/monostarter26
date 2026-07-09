import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import { createDb } from "./client";

const dir = path.dirname(fileURLToPath(import.meta.url));

async function run(direction: "up" | "down"): Promise<void> {
  const db = createDb();
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(dir, "migrations"),
    }),
  });

  const { error, results } =
    direction === "up"
      ? await migrator.migrateToLatest()
      : await migrator.migrateDown();

  for (const r of results ?? []) {
    const status = r.status === "Success" ? "✓" : "✗";
    console.log(`${status} ${r.direction} ${r.migrationName}`);
  }

  await db.destroy();

  if (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

const direction = process.argv[2] === "down" ? "down" : "up";
await run(direction);

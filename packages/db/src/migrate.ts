import { createDb } from "./client";
import { migrateDown, migrateToLatest } from "./migrator";

// CLI entry for local dev: `tsx src/migrate.ts [up|down]`.
const direction = process.argv[2] === "down" ? "down" : "up";
const db = createDb();

const { error, results } =
  direction === "up" ? await migrateToLatest(db) : await migrateDown(db);

for (const r of results ?? []) {
  const status = r.status === "Success" ? "✓" : "✗";
  console.log(`${status} ${r.direction} ${r.migrationName}`);
}

await db.destroy();

if (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}

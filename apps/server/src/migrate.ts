import { createDb, migrateToLatest } from "@repo/db";

// Bundled migration entry for the container (Railway pre-deploy command:
// `node dist/migrate.mjs`). Runs the schema up to latest against DATABASE_URL,
// which is how each fresh PR-preview database gets provisioned.
const db = createDb();
const { error, results } = await migrateToLatest(db);

for (const r of results ?? []) {
  const status = r.status === "Success" ? "✓" : "✗";
  console.log(`${status} ${r.migrationName}`);
}

await db.destroy();

if (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}

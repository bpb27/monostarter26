import { createDb } from "./client";

const db = createDb();

await db
  .insertInto("users")
  .values({ id: "user_seed_admin", email: "admin@example.com", role: "admin" })
  .onConflict((oc) => oc.column("id").doNothing())
  .execute();

await db
  .insertInto("widgets")
  .values({ name: "Example widget", owner_id: "user_seed_admin" })
  .execute();

console.log("Seed complete.");
await db.destroy();

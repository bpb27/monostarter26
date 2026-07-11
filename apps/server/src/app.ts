import { clerkMiddleware, getAuth } from "@clerk/hono";
import { createDb, type Kysely, type Database } from "@repo/db";
import { Hono } from "hono";
import { cors } from "hono/cors";

// Lazily create the DB so importing this module for its *type* (see
// @repo/api-client) or hitting /health never requires a live connection/env.
let _db: Kysely<Database> | undefined;
function db(): Kysely<Database> {
  return (_db ??= createDb());
}

export const app = new Hono()
  .use("*", cors())
  .get("/health", (c) => c.json({ status: "ok" as const }))
  // Everything under /api requires a signed-in Clerk user.
  .use("/api/*", clerkMiddleware())
  .get("/api/widgets", async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) return c.json({ error: "Unauthorized" }, 401);
    const widgets = await db()
      .selectFrom("widgets")
      .selectAll()
      .where("owner_id", "=", auth.userId)
      .orderBy("created_at", "desc")
      .execute();
    return c.json({ widgets });
  })
  .post("/api/widgets", async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) return c.json({ error: "Unauthorized" }, 401);
    const { name } = await c.req.json<{ name: string }>();
    const widget = await db()
      .insertInto("widgets")
      .values({ name, owner_id: auth.userId })
      .returningAll()
      .executeTakeFirstOrThrow();
    return c.json({ widget }, 201);
  });

export type AppType = typeof app;

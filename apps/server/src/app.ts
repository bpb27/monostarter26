import { clerkMiddleware, getAuth } from "@clerk/hono";
import { createDb, type Kysely, type Database } from "@repo/db";
import { DEV_CORS_ORIGINS } from "@repo/env";
import { Hono } from "hono";
import { cors } from "hono/cors";

// CORS allowlist defaults to the local web dev servers; the server entry
// (index.ts) overrides it from the validated CORS_ORIGINS at boot. Kept out of
// module-load env parsing so importing this module for its *type* (see
// @repo/api-client) or in tests never requires a full server env.
let allowedOrigins: readonly string[] = DEV_CORS_ORIGINS;

/** Set the CORS allowlist. Called once at boot from the validated env. */
export function setCorsOrigins(origins: readonly string[]): void {
  allowedOrigins = origins;
}

// Lazily create the DB so importing this module for its *type* (see
// @repo/api-client) or hitting /health never requires a live connection/env.
let _db: Kysely<Database> | undefined;
function db(): Kysely<Database> {
  return (_db ??= createDb());
}

export const app = new Hono()
  .use(
    "*",
    cors({ origin: (origin) => (allowedOrigins.includes(origin) ? origin : null) }),
  )
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

import { serve } from "@hono/node-server";
import { serverEnv } from "@repo/shared/env";
import { app } from "./app";

const env = serverEnv();

// Bind 0.0.0.0 so the process is reachable inside a container (Railway injects
// PORT; serverEnv() reads it, defaulting to 8787 for local dev).
serve({ fetch: app.fetch, port: env.PORT, hostname: "0.0.0.0" }, (info) => {
  console.log(`Server listening on :${info.port}`);
});

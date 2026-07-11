import { serve } from "@hono/node-server";
import { getServerEnv } from "@repo/env/server";
import { app, setCorsOrigins } from "./app";

const env = getServerEnv(process.env);
setCorsOrigins(env.CORS_ORIGINS);

// Bind 0.0.0.0 so the process is reachable inside a container (Railway injects
// PORT; getServerEnv() reads it, defaulting to 8787 for local dev).
serve({ fetch: app.fetch, port: env.PORT, hostname: "0.0.0.0" }, (info) => {
  console.log(`Server listening on :${info.port}`);
});

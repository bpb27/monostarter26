import { serve } from "@hono/node-server";
import { serverEnv } from "@repo/shared/env";
import { app } from "./app";

const env = serverEnv();

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`);
});

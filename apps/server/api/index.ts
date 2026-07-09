import { handle } from "hono/vercel";
import { app } from "../src/app";

// Vercel Functions entry. Deploy this app as its own Vercel project with the
// Root Directory set to `apps/server`.
export const config = { runtime: "nodejs" };

export default handle(app);

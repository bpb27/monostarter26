import { serverSchema } from "./manifest";
import { parseEnv } from "./parse";
import type { z } from "zod";

export type ServerEnv = z.infer<typeof serverSchema>;

/**
 * Validate the server's environment. Call once at boot:
 * `const env = getServerEnv(process.env)`.
 */
export function getServerEnv(source: Record<string, unknown>): ServerEnv {
  return parseEnv(serverSchema, source, "server");
}

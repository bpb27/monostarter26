import { webSchema } from "./manifest";
import { parseEnv } from "./parse";
import type { z } from "zod";

export type WebEnv = z.infer<typeof webSchema>;

/**
 * Validate a Vite web app's environment. Call once with Vite's env object:
 * `export const env = getWebEnv(import.meta.env)`. Vite statically inlines the
 * `VITE_*` values into that object at build time.
 */
export function getWebEnv(source: Record<string, unknown>): WebEnv {
  return parseEnv(webSchema, source, "web");
}

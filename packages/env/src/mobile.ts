import { mobileSchema } from "./manifest";
import { parseEnv } from "./parse";
import type { z } from "zod";

export type MobileEnv = z.infer<typeof mobileSchema>;

/**
 * Validate the Expo app's environment. Expo/Metro only inlines *literal*
 * `process.env.EXPO_PUBLIC_*` member accesses, so the caller must build the
 * source object from literals rather than passing `process.env` wholesale:
 *
 *   export const env = getMobileEnv({
 *     EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
 *     EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
 *   });
 */
export function getMobileEnv(source: Record<string, unknown>): MobileEnv {
  return parseEnv(mobileSchema, source, "mobile");
}

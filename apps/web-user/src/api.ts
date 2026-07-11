import { createApiClient } from "@repo/api-client";
import { env } from "./env";

/** Build a request-scoped client bound to the current Clerk token getter. */
export function makeApi(getToken: () => Promise<string | null>) {
  return createApiClient({ baseUrl: env.VITE_API_URL, getToken });
}

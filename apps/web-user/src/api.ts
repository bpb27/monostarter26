import { createApiClient } from "@repo/api-client";

/** Build a request-scoped client bound to the current Clerk token getter. */
export function makeApi(getToken: () => Promise<string | null>) {
  return createApiClient({ baseUrl: import.meta.env.VITE_API_URL, getToken });
}

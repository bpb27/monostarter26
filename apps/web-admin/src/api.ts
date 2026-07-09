import { createApiClient } from "@repo/api-client";

export function makeApi(getToken: () => Promise<string | null>) {
  return createApiClient({ baseUrl: import.meta.env.VITE_API_URL, getToken });
}

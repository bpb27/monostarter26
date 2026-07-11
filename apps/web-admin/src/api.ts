import { createApiClient } from "@repo/api-client";
import { env } from "./env";

export function makeApi(getToken: () => Promise<string | null>) {
  return createApiClient({ baseUrl: env.VITE_API_URL, getToken });
}

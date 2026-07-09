import type { AppType } from "server";
import { hc } from "hono/client";

export type TokenGetter = () => string | null | Promise<string | null>;

export interface ApiClientOptions {
  baseUrl: string;
  /** Supplies the Clerk session token; wired per-platform (react/expo). */
  getToken?: TokenGetter;
}

/**
 * Typed RPC client for the server. Route types flow from the server's
 * `AppType`, so calls like `api.api.widgets.$get()` are fully typed.
 */
export function createApiClient({ baseUrl, getToken }: ApiClientOptions) {
  return hc<AppType>(baseUrl, {
    headers: async (): Promise<Record<string, string>> => {
      const token = await getToken?.();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;
export type { AppType };

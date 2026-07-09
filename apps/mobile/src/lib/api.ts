import { createApiClient } from '@repo/api-client';

function getBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error('Missing EXPO_PUBLIC_API_URL');
  }
  return url;
}

/** Build a client bound to the current Clerk token getter (from useAuth). */
export function makeApi(getToken: () => Promise<string | null>) {
  return createApiClient({ baseUrl: getBaseUrl(), getToken });
}

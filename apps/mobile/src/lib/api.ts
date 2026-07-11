import { createApiClient } from '@repo/api-client';
import { env } from '@/env';

/** Build a client bound to the current Clerk token getter (from useAuth). */
export function makeApi(getToken: () => Promise<string | null>) {
  return createApiClient({ baseUrl: env.EXPO_PUBLIC_API_URL, getToken });
}

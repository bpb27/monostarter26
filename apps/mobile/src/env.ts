import { getMobileEnv } from '@repo/env/mobile';

// Expo/Metro only inlines *literal* `process.env.EXPO_PUBLIC_*` accesses at
// build time, so we spell each one out here (passing `process.env` wholesale
// would leave them undefined in the bundle). getMobileEnv then validates.
export const env = getMobileEnv({
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

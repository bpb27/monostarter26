import { getWebEnv } from "@repo/env/web";

/**
 * Validated, typed build-time env. Vite inlines `VITE_*` into `import.meta.env`
 * at build; getWebEnv fails fast with a readable error if any are missing.
 */
export const env = getWebEnv(import.meta.env);

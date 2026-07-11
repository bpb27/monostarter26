import type { z } from "zod";

/**
 * Validate an env source against a schema, throwing a readable, aggregated
 * error listing every problem so a misconfigured deploy fails fast at startup
 * instead of at first use.
 *
 * Intentionally global-free (no `process` / `import.meta`): callers pass the
 * source so this stays importable from Node, the browser, and React Native.
 */
export function parseEnv<T extends z.ZodType>(
  schema: T,
  source: unknown,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid ${label} environment:\n${issues}`);
  }
  return result.data;
}

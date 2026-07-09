import type { UserRole } from "@repo/shared";

export const ROLES = ["user", "admin"] as const satisfies readonly UserRole[];

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

/**
 * Clerk exposes custom data via session-token claims. We store the app role in
 * `publicMetadata.role` and surface it in the JWT template as `metadata.role`.
 * This reads it defensively and falls back to "user".
 */
export interface ClerkClaims {
  metadata?: { role?: string | null } | null;
}

export function roleFromClaims(claims: ClerkClaims | null | undefined): UserRole {
  return claims?.metadata?.role === "admin" ? "admin" : "user";
}

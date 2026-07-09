// NOTE: the server env schema is intentionally NOT re-exported here. It depends
// on Node globals (`process`), and this entry must stay isomorphic so browser /
// React Native consumers can import shared types without pulling in Node types.
// Import it explicitly from "@repo/shared/env" (server only).

/** A user as exposed across app boundaries (never leaks auth-provider internals). */
export interface AppUser {
  id: string;
  email: string | null;
  role: UserRole;
}

export type UserRole = "user" | "admin";

/** Shape returned by the server's example resource route. */
export interface Widget {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

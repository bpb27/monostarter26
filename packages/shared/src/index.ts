// Pure, isomorphic shared types — safe in Node, the browser, and React Native.
// Environment schemas + getters live in @repo/env (see @repo/env/{server,web,
// mobile}), kept separate so this entry never pulls in Node/bundler types.

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

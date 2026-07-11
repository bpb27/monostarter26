// The manifest + types are isomorphic (safe in Node, browser, and RN).
// The runtime getters live on env-specific subpaths so an app only ever pulls
// the schema it needs:
//   @repo/env/server  -> getServerEnv
//   @repo/env/web     -> getWebEnv
//   @repo/env/mobile  -> getMobileEnv
export * from "./manifest";
export type { ServerEnv } from "./server";
export type { WebEnv } from "./web";
export type { MobileEnv } from "./mobile";

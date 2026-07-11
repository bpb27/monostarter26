import type { Migration } from "kysely/migration";
import * as init from "./001_init";

/**
 * Explicit migration map (keys sorted in execution order) so the migrator can
 * be *bundled* into the server image — no runtime filesystem reads like
 * `FileMigrationProvider`. Add new migrations here as you create them.
 */
export const migrations: Record<string, Migration> = {
  "001_init": { up: init.up, down: init.down },
};

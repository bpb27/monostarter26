import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseDotenv } from "./dotenv";
import { appEnv, canonical, usedCanonicalKeys } from "./manifest";

/**
 * Drift guard: the manifest is the source of truth, so every variable it
 * declares must also be present in the config surfaces that actually deploy it
 * (`.env.example`, `turbo.json` globalEnv, web Dockerfile build args). If you
 * add a var to the manifest but forget one of these, this fails in CI.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const read = (rel: string) => readFileSync(join(repoRoot, rel), "utf8");

const turboGlobalEnv: string[] = JSON.parse(read("turbo.json")).globalEnv ?? [];

describe("env manifest drift", () => {
  for (const [name, spec] of Object.entries(appEnv)) {
    const keys = Object.keys(spec.sources);

    describe(name, () => {
      it("schema and sources declare the same vars", () => {
        expect(keys.sort()).toEqual(Object.keys(spec.schema.shape).sort());
      });

      it("sources map to known canonical keys", () => {
        for (const from of Object.values(spec.sources)) {
          expect(canonical).toHaveProperty(from);
        }
      });

      it("prefix matches every var name", () => {
        for (const key of keys) expect(key.startsWith(spec.prefix)).toBe(true);
      });

      if (spec.surfaces.includes("turboGlobalEnv")) {
        it("all vars are declared in turbo.json globalEnv", () => {
          for (const key of keys) expect(turboGlobalEnv).toContain(key);
        });
      }

      for (const dir of spec.dirs) {
        if (spec.surfaces.includes("envExample")) {
          it(`${dir}/.env.example lists every var`, () => {
            const example = parseDotenv(read(`apps/${dir}/.env.example`));
            for (const key of keys) expect(example).toHaveProperty(key);
          });
        }

        if (spec.surfaces.includes("dockerArg")) {
          it(`${dir}/Dockerfile declares an ARG for every var`, () => {
            const dockerfile = read(`apps/${dir}/Dockerfile`);
            for (const key of keys) {
              expect(dockerfile).toMatch(new RegExp(`^ARG ${key}\\b`, "m"));
            }
          });
        }
      }
    });
  }

  it("root .env.example lists exactly the canonical keys in use", () => {
    const example = parseDotenv(read(".env.example"));
    expect(Object.keys(example).sort()).toEqual(usedCanonicalKeys().sort());
  });
});

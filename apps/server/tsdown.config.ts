import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/migrate.ts"],
  format: "esm",
  platform: "node",
  target: "node26",
  clean: true,
  // Inline the workspace packages (@repo/*) into the bundle. They export raw
  // TypeScript source, so a plain `node dist/index.js` in a container must not
  // `require` them at runtime — bundle them instead. Real npm deps stay external.
  noExternal: [/^@repo\//],
});

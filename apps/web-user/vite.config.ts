import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// A standard Vite project — this is exactly what `vp migrate` adopts. Once the
// `vp` CLI is installed, `vp dev|build|check|test` wrap these same settings.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});

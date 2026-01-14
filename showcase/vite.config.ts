import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/secrets-ts",
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});

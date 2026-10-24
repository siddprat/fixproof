import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // Real api runs on 8080 (AGENTS.md). Only used when VITE_USE_MOCK=false.
    proxy: { "/api": "http://localhost:8080" },
  },
});

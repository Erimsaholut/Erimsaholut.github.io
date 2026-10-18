import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // three.js ships as one large, lazily loaded chunk.
  build: { chunkSizeWarningLimit: 1000 },
});

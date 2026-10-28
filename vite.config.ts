import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // three.js ships as one large, lazily loaded chunk.
  build: {
    chunkSizeWarningLimit: 1000,
    // Extra static pages: the legal page and the branded 404 GitHub Pages serves for unknown paths.
    rollupOptions: { input: { main: "index.html", privacy: "privacy.html", notFound: "404.html" } },
  },
});

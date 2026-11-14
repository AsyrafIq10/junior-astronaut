import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js alone is ~680 kB minified and cannot be split further.
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        // Split large libraries into their own long-cacheable chunks.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules\/three\//.test(id)) return "three";
          if (/node_modules\/(@react-three|three-stdlib|troika|camera-controls|maath|meshline|@monogrid|stats)/.test(id)) return "r3f";
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
          if (/node_modules\/lucide-react\//.test(id)) return "icons";
        },
      },
    },
  },
});

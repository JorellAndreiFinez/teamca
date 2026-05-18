// Astro build configuration
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  output: "server",
  server: {
    port: 4322,
  },
  vite: {
    server: {
      strictPort: true,
    },
  },
});

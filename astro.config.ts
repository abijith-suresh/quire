import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import solid from "@astrojs/solid-js";
import vitePwa from "@vite-pwa/astro";

// https://astro.build/config
export default defineConfig({
  integrations: [
    solid(),
    vitePwa({
      mode: "production",
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{css,js,html,svg,png,ico,woff2}"],
        navigateFallback: "/index.html",
      },
      manifest: false,
    }),
  ],
  site: "https://quire.page",
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    optimizeDeps: { exclude: ["@resvg/resvg-js"] },
    ssr: { external: ["@resvg/resvg-js"] },
  },
});

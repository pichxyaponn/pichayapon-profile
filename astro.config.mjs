// @ts-check
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://pichayapon.com",
  integrations: [sitemap()],
  image: {
    // Required for layout="constrained" images to actually resize responsively.
    responsiveStyles: true
  },
  vite: {
    plugins: [tailwindcss()]
  }
});

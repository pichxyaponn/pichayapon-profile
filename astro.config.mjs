// @ts-check
import { existsSync, readFileSync } from "node:fs";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// <lastmod> comes from lastmod.json, written by `bun run lastmod` where git is
// available. The production image builds from oven/bun:slim, which has no git
// binary — calling git here throws, the catch swallows it, and the sitemap ships
// with no lastmod at all. That shipped once, on 2026-08-24.
//
// Google treats lastmod as a hint it stops trusting SITE-WIDE once it disagrees
// with what actually changed, so a build-time stamp on every page is worse than
// omitting the field. A page with no recorded date gets none.
const lastmod = existsSync("lastmod.json")
  ? JSON.parse(readFileSync("lastmod.json", "utf8"))
  : {};

export default defineConfig({
  site: "https://pichayapon.com",
  integrations: [
    sitemap({
      serialize(item) {
        // Sitemap URLs carry a trailing slash; the map is keyed without one.
        const path = new URL(item.url).pathname.replace(/(.)\/$/, "$1");
        const iso = lastmod[path];
        return iso ? { ...item, lastmod: iso } : item;
      }
    })
  ],
  image: {
    // Required for layout="constrained" images to actually resize responsively.
    responsiveStyles: true
  },
  vite: {
    plugins: [tailwindcss()]
  }
});

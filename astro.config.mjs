// @ts-check
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Date each URL from the commit that last touched the file behind it.
//
// Google treats <lastmod> as a hint it stops trusting SITE-WIDE once it
// disagrees with what actually changed, so stamping every page with the build
// time is worse than omitting the field — it trains them to ignore it. A page
// with no source file (or no history yet) gets no lastmod rather than a
// fabricated one.
function sourceFileFor(pathname) {
  const path = pathname.replace(/\/+$/, "");
  if (path === "") return "src/pages/index.astro";
  for (const candidate of [`src/pages${path}.astro`, `src/pages${path}/index.astro`]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Every file that decides what a page renders — the page plus everything it
 * imports from src/, transitively. The homepage's prose lives in components, so
 * dating it from src/pages/index.astro alone reports July for text edited today.
 */
function sourceGraph(entry, seen = new Set()) {
  if (!entry || seen.has(entry) || !existsSync(entry)) return seen;
  seen.add(entry);
  const src = readFileSync(entry, "utf8");
  for (const m of src.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) {
    const base = resolve(dirname(entry), m[1]);
    const rel = relative(process.cwd(), base);
    // Astro imports omit the extension for .astro/.ts; try both, and skip
    // anything that resolves outside src/ (node_modules, virtual modules).
    if (rel.startsWith("..")) continue;
    for (const cand of [rel, `${rel}.astro`, `${rel}.ts`, `${rel}/index.astro`]) {
      if (existsSync(cand) && !cand.endsWith("/")) sourceGraph(cand, seen);
    }
  }
  return seen;
}

function lastCommitISO(file) {
  try {
    return (
      execFileSync("git", ["log", "-1", "--format=%cI", "--", file], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      }).trim() || undefined
    );
  } catch {
    return undefined;
  }
}

// https://astro.build/config
export default defineConfig({
  site: "https://pichayapon.com",
  integrations: [
    sitemap({
      serialize(item) {
        const entry = sourceFileFor(new URL(item.url).pathname);
        if (!entry) return item;
        // Newest commit across the whole render graph, not just the page file.
        const dates = [...sourceGraph(entry)].map(lastCommitISO).filter(Boolean).sort();
        const iso = dates.at(-1);
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

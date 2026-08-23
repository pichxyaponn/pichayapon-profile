// scripts/lastmod.mjs — writes lastmod.json from git history.
//
//   bun run lastmod
//
// Why this is a separate step instead of being done inside astro.config:
// the production image builds from `oven/bun:slim`, which has no git binary and
// no .git directory in the build context. Calling git from the config there
// throws, the catch swallows it, and the sitemap silently ships with no
// <lastmod> at all — which is exactly what happened on 2026-08-24 before this
// file existed. Generating the dates where git IS available and handing the
// result to the build as data removes the dependency.
//
// astro.config.mjs prefers this file and falls back to calling git directly, so
// a plain `bun run build` on a dev machine still produces correct dates.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Every file that decides what a page renders — the page plus everything it
 * imports from src/, transitively. The homepage's prose lives in components, so
 * dating it from src/pages/index.astro alone reports the page file's date for
 * text that was edited in About.astro today.
 */
function graph(entry, seen = new Set()) {
  if (!entry || seen.has(entry) || !existsSync(join(root, entry))) return seen;
  seen.add(entry);
  const src = readFileSync(join(root, entry), "utf8");
  for (const m of src.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) {
    const rel = relative(root, resolve(dirname(join(root, entry)), m[1]));
    if (rel.startsWith("..")) continue;
    for (const cand of [rel, `${rel}.astro`, `${rel}.ts`, `${rel}/index.astro`]) {
      if (existsSync(join(root, cand))) graph(cand, seen);
    }
  }
  return seen;
}

function commitISO(file) {
  try {
    return (
      execFileSync("git", ["log", "-1", "--format=%cI", "--", file], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"]
      }).trim() || null
    );
  } catch {
    return null;
  }
}

/** Route path for a page file, matching how Astro maps src/pages. */
function routeFor(rel) {
  const p = rel.replace(/^src\/pages/, "").replace(/\.astro$/, "");
  if (p === "/index") return "/";
  return p.replace(/\/index$/, "") || "/";
}

const out = {};
for (const name of readdirSync(join(root, "src/pages"), { recursive: true })) {
  const rel = join("src/pages", String(name));
  if (!rel.endsWith(".astro")) continue;
  const route = routeFor(rel);
  if (route === "/404") continue; // noindex, never in the sitemap
  const dates = [...graph(rel)].map(commitISO).filter(Boolean).sort();
  const iso = dates.at(-1);
  if (iso) out[route] = iso;
}

if (Object.keys(out).length === 0) {
  console.error("  refusing to write an empty lastmod.json — is git available?");
  process.exit(1);
}

writeFileSync(join(root, "lastmod.json"), JSON.stringify(out, null, 2) + "\n");
for (const [route, iso] of Object.entries(out)) console.log(`  ${route.padEnd(20)} ${iso}`);

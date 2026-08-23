// scripts/icons.mjs — renders every favicon from one SVG.
//
//   bun run icons
//
// Writes public/favicon.svg, public/favicon.ico (16/32/48) and
// public/apple-touch-icon.png (180).
//
// Why all three: a site scaffolded from a template ships the template's icon at
// /favicon.ico, and browsers request that path whether or not the page declares
// it. Safari, Google's favicon crawler and every bookmark tool ignore the SVG.
// Declaring only an SVG is what left the Astro logo showing everywhere those
// look — this site did exactly that until 2026-08-24.
//
// Generating all three from one source here is the point: they cannot drift.
// Editing the mark means editing it once, in this file, and re-running.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const pub = resolve(dirname(fileURLToPath(import.meta.url)), "../public");

// Drawn as filled geometry rather than <text>: a favicon is rasterised without
// the page's fonts, so a text element resolves to whatever the renderer happens
// to have and shifts between platforms.
//
// Solid plate rather than a transparent glyph — a browser tab strip may be light
// or dark, and a bare monogram disappears into one of them.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Pichayapon Chaipanha">
  <rect width="64" height="64" rx="14" fill="#18181b"/>
  <path fill="#fafafa" d="M20 14h15.5c7.7 0 13 4.9 13 12.2 0 7.4-5.3 12.3-13 12.3H28.5V50H20V14Zm8.5 7.4v9.7h6.2c3.2 0 5.2-1.9 5.2-4.9 0-2.9-2-4.8-5.2-4.8h-6.2Z"/>
  <circle cx="44.5" cy="46" r="4" fill="#38bdf8"/>
</svg>
`;
writeFileSync(resolve(pub, "favicon.svg"), svg);

const browser = await chromium.launch();
const page = await browser.newPage();

/** Rasterises the mark at one edge length. */
async function png(size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`
  );
  return await page.screenshot({ type: "png", omitBackground: true });
}

writeFileSync(resolve(pub, "apple-touch-icon.png"), await png(180));

// A PNG-embedded ICO: a 6-byte header, one 16-byte entry per image, then the PNG
// bytes. Every browser still in use reads this form, and it avoids encoding BMP
// by hand.
const sizes = [16, 32, 48];
const images = [];
for (const s of sizes) images.push(await png(s));
await browser.close();

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);

let offset = 6 + images.length * 16;
const entries = images.map((img, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i], 0);
  e.writeUInt8(sizes[i], 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(img.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.length;
  return e;
});

writeFileSync(resolve(pub, "favicon.ico"), Buffer.concat([header, ...entries, ...images]));

console.log(`  favicon.svg · favicon.ico (${sizes.join("/")}) · apple-touch-icon.png (180)`);

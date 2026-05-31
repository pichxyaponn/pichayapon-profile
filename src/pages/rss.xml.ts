import rss from "@astrojs/rss";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  return rss({
    title: "Pichayapon C. | Portfolio",
    description: "Follow me and learn more about me.",
    site: context.site ?? "https://pichayapon.com",
    stylesheet: "/rss/styles.xsl",
    items: [
      {
        title: "Pichayapon C. | Portfolio",
        pubDate: new Date("2025-06-10"),
        description: "Follow me and learn more about me.",
        link: "/"
      }
    ],
    customData: `<language>en-GB</language>`
  });
}

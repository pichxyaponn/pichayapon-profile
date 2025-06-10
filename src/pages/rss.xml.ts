// File: src/pages/rss.xml.js

import rss from "@astrojs/rss";

export async function GET(context: any) {
  return rss({
    title: "Pichayapon C. | Portfolio",
    description: "Follow me and learn more about me.",
    site: context.site,
    items: [
      {
        title: "Pichayapon C. | Portfolio",
        pubDate: new Date(),
        description: "Follow me and learn more about me.",
        link: "/"
      }
    ],
    customData: `<language>en-uk</language>`
  });
}

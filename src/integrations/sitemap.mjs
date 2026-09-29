// Writes dist/sitemap.xml from every built page, so new routes are included
// automatically. Redirect stubs and the 404 page are left out.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/** @returns {import("astro").AstroIntegration} */
export default function sitemap() {
  /** @type {import("astro").AstroConfig} */
  let config;

  return {
    name: "toby-sitemap",
    hooks: {
      "astro:config:done": ({ config: c }) => {
        config = c;
      },
      "astro:build:done": async ({ dir, pages, logger }) => {
        if (!config.site) throw new Error("sitemap: `site` must be set in astro.config");

        const normalise = (p) => `/${p}`.replace(/\/+/g, "/").replace(/\/?$/, "/");
        const excluded = new Set([...Object.keys(config.redirects ?? {}), "/404/"].map(normalise));
        const urls = [...new Set(pages.map((p) => normalise(p.pathname)))]
          .filter((p) => !excluded.has(p))
          .sort()
          .map((p) => new URL(p, config.site).href);

        const xml =
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
          "\n</urlset>\n";

        await writeFile(fileURLToPath(new URL("sitemap.xml", dir)), xml);
        logger.info(`sitemap.xml: ${urls.length} URLs`);
      },
    },
  };
}

// @ts-check
import { defineConfig } from "astro/config";
import resourceZips from "./src/integrations/resource-zips.mjs";
import sitemap from "./src/integrations/sitemap.mjs";

export default defineConfig({
  site: "https://tobytang-bot.github.io",
  base: "/",
  trailingSlash: "always",
  integrations: [sitemap(), resourceZips()],

  markdown: {
    shikiConfig: {
      // github-dark-default: its comment color meets 4.5:1 on our dark code background.
      themes: { light: "github-light", dark: "github-dark-default" },
      // Colors come from CSS (--shiki-light / --shiki-dark) so the theme toggle controls them.
      defaultColor: false,
    },
  },

  // Legacy Jekyll paths (/posts/:title/) on this host → new content routes.
  // Excluded from sitemap.xml by src/integrations/sitemap.mjs.
  redirects: {
    "/posts/server/": "/knowledge/magento/server-setup/",
    "/posts/docker-command/": "/knowledge/docker/docker-command/",
    // The old mysql-command post had no body; its commands live in server-setup.
    "/posts/mysql-command/": "/knowledge/magento/server-setup/",
    "/posts/jekyll-markdown/": "/",
  },
});

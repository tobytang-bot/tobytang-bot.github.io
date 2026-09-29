// Packs every folder in dist/downloads/ (copied from public/downloads/) into
// dist/downloads/<folder>.zip, so the repo only keeps the source files.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

/** @returns {import("astro").AstroIntegration} */
export default function resourceZips() {
  return {
    name: "toby-resource-zips",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const root = join(fileURLToPath(dir), "downloads");
        let entries;
        try {
          entries = readdirSync(root);
        } catch {
          return; // no downloads yet
        }
        for (const name of entries) {
          const folder = join(root, name);
          if (!statSync(folder).isDirectory()) continue;
          const files = Object.fromEntries(
            readdirSync(folder)
              .filter((f) => !f.startsWith("."))
              .map((f) => [`${name}/${f}`, readFileSync(join(folder, f))]),
          );
          // Fixed mtime keeps the archive byte-identical between builds of the same files.
          const zip = zipSync(files, { level: 9, mtime: new Date("2026-01-01T00:00:00Z") });
          writeFileSync(join(root, `${name}.zip`), zip);
          logger.info(`downloads/${name}.zip: ${Object.keys(files).length} files`);
        }
      },
    },
  };
}

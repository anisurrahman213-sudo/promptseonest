import { statSync } from "node:fs";
import { resolve } from "node:path";
import { SITEMAP_ROUTES, SITE_ORIGIN, type SitemapRoute } from "./sitemap-routes";

/**
 * Generate sitemap XML using each route's source-file mtime as lastmod.
 * Falls back to today's date if the file is missing.
 */
export function generateSitemapXml(rootDir: string): string {
  const today = new Date().toISOString().slice(0, 10);

  const lastmodFor = (route: SitemapRoute): string => {
    try {
      return statSync(resolve(rootDir, route.source)).mtime.toISOString().slice(0, 10);
    } catch {
      return today;
    }
  };

  const urls = SITEMAP_ROUTES.map((r) => `  <url>
    <loc>${SITE_ORIGIN}${r.path}</loc>
    <lastmod>${lastmodFor(r)}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

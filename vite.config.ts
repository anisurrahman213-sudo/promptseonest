// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "node:path";
import { writeFileSync } from "node:fs";
import { generateSitemapXml } from "./scripts/generate-sitemap";

// Stable build timestamp shared between `define` and the build-info plugin
const BUILD_TIME = new Date().toISOString();
const ROOT = process.cwd();

/**
 * Emits /build-info.json into the build output AND serves it from the
 * Vite dev server. The frontend polls this file to detect when a fresh
 * build is live and trigger a cache-bust + reload.
 */
function buildInfoPlugin(): any {
  const json = () => JSON.stringify({ buildTime: BUILD_TIME }) + "\n";
  return {
    name: "pn-build-info",
    configureServer(server: any) {
      server.middlewares.use("/build-info.json", (_req: any, res: any) => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store, no-cache, max-age=0");
        res.end(json());
      });
    },
    generateBundle(this: any) {
      this.emitFile({
        type: "asset",
        fileName: "build-info.json",
        source: json(),
      });
    },
  };
}

/**
 * Auto-generate sitemap.xml from SITEMAP_ROUTES on dev start AND every build.
 * lastmod is derived from each page file's mtime — edit a page, get a fresh date.
 */
function sitemapPlugin(): any {
  const writePublic = () => {
    try {
      writeFileSync(path.join(ROOT, "public", "sitemap.xml"), generateSitemapXml(ROOT));
    } catch (e) {
      console.warn("[sitemap] Failed to write public/sitemap.xml:", e);
    }
  };
  return {
    name: "pn-sitemap",
    buildStart() {
      writePublic();
    },
    configureServer() {
      writePublic();
    },
    generateBundle(this: any) {
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: generateSitemapXml(ROOT),
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      __BUILD_TIME__: JSON.stringify(BUILD_TIME),
    },
    plugins: [buildInfoPlugin(), sitemapPlugin()],
  },
});

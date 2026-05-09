/**
 * Single source of truth for sitemap.xml.
 *
 * Each entry maps a public route → its source page file (used to derive
 * `lastmod` from the file's modification time). Add a new route here and
 * the next dev-server start or production build regenerates public/sitemap.xml.
 *
 * Private routes (/auth, /dashboard, /profile, /admin/*, /payment-history)
 * are intentionally excluded — they're either user-specific or in robots.txt Disallow.
 */
export interface SitemapRoute {
  path: string;
  /** Source file relative to project root — used for lastmod */
  source: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

export const SITE_ORIGIN = "https://www.promptseonest.com";

export const SITEMAP_ROUTES: SitemapRoute[] = [
  { path: "/",                       source: "src/pages/Index.tsx",               changefreq: "weekly",  priority: 1.0 },
  { path: "/adobe-stock-generator",  source: "src/pages/AdobeStockGenerator.tsx", changefreq: "weekly",  priority: 0.9 },
  { path: "/metadata-fixer",         source: "src/pages/MetadataFixer.tsx",       changefreq: "weekly",  priority: 0.9 },
  { path: "/platform-converter",     source: "src/pages/PlatformConverter.tsx",   changefreq: "weekly",  priority: 0.8 },
  { path: "/keyword-research",       source: "src/pages/KeywordResearch.tsx",     changefreq: "weekly",  priority: 0.8 },
  { path: "/trending-keywords",      source: "src/pages/TrendingKeywords.tsx",    changefreq: "daily",   priority: 0.8 },
  { path: "/rejection-analyzer",     source: "src/pages/RejectionAnalyzer.tsx",   changefreq: "weekly",  priority: 0.8 },
  { path: "/submission-tracker",     source: "src/pages/SubmissionTracker.tsx",   changefreq: "weekly",  priority: 0.7 },
  { path: "/pricing",                source: "src/pages/Pricing.tsx",             changefreq: "monthly", priority: 0.8 },
  { path: "/tutorials",              source: "src/pages/Tutorials.tsx",           changefreq: "weekly",  priority: 0.8 },
  { path: "/extension",              source: "src/pages/ExtensionDownload.tsx",   changefreq: "monthly", priority: 0.7 },
  { path: "/calendar",               source: "src/pages/CalendarPage.tsx",        changefreq: "monthly", priority: 0.6 },
];

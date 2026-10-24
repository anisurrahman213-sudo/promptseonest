import { lazy, Suspense, useEffect, type ComponentType } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { BackgroundProcessorProvider } from "@/contexts/BackgroundProcessorContext";
import { RouteTracker } from "@/components/RouteTracker";
import { useBuildVersionCheck } from "@/hooks/useBuildVersionCheck";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import NotFound from "@/pages/NotFound";
import appCss from "@/styles.css?url";

// Auto-recover from stale chunk errors (after deploys / HMR cache miss)
const RELOAD_KEY = "__chunk_reload__";
function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await factory();
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isChunkErr = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(msg);
      const alreadyReloaded =
        typeof sessionStorage !== "undefined" && sessionStorage.getItem(RELOAD_KEY) === "1";
      if (isChunkErr && !alreadyReloaded && typeof window !== "undefined") {
        sessionStorage.setItem(RELOAD_KEY, "1");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}

// Lazy load global components that aren't needed for initial render
const BackgroundProcessingIndicator = lazyWithRetry(() =>
  import("@/components/BackgroundProcessingIndicator").then((m) => ({
    default: m.BackgroundProcessingIndicator,
  })),
);
const NetworkStatusIndicator = lazyWithRetry(() =>
  import("@/components/NetworkStatusIndicator").then((m) => ({ default: m.NetworkStatusIndicator })),
);
const PWAInstallPrompt = lazyWithRetry(() =>
  import("@/components/PWAInstallPrompt").then((m) => ({ default: m.PWAInstallPrompt })),
);
const AiAskPopup = lazyWithRetry(() =>
  import("@/components/AiAskPopup").then((m) => ({ default: m.AiAskPopup })),
);

function VersionWatcher() {
  useBuildVersionCheck({ intervalMs: 60_000, promptUser: true });
  return null;
}

const JSON_LD_SOFTWARE_APPLICATION = `{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PromptSEONest",
  "alternateName": ["Prompt SEO Nest", "Adobe Stock Metadata Generator"],
  "url": "https://www.promptseonest.com",
  "description": "Free AI-powered metadata optimizer for stock contributors. Generates 100% compliant titles, exactly 49 single-word keywords, and 200-500 character descriptions for Adobe Stock, Shutterstock, and Freepik in seconds.",
  "applicationCategory": "BusinessApplication",
  "applicationSubCategory": "SEO Software",
  "operatingSystem": "Web Browser, Chrome, Edge, Firefox, Safari",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "softwareVersion": "2.0",
  "screenshot": "https://www.promptseonest.com/og-image.png",
  "image": "https://www.promptseonest.com/pwa-512x512.png",
  "inLanguage": ["en", "bn", "hi", "es", "fr", "de", "pt", "ar", "zh", "ja", "ko"],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "category": "Free"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "1247",
    "bestRating": "5",
    "worstRating": "1"
  },
  "featureList": [
    "Adobe Stock Metadata Generator (49 single-word keywords)",
    "Shutterstock Metadata Generator (50 keywords, multi-word)",
    "Freepik Metadata Generator (30 keywords, max 2 words)",
    "Bulk Image and Video Processing (up to 500 files)",
    "100-Point Compliance Scoring System",
    "Vision-Powered AI Image Analysis",
    "Video Frame Extraction (4-frame 2x2 grid)",
    "CSV Export (UTF-8, 5-column Adobe Stock spec)",
    "Platform Converter (Adobe to Shutterstock & Freepik)",
    "Keyword Research Tool with Priority Panels",
    "Chrome Extension for Auto-Fill",
    "Real-Time Platform Validation (19 platforms)",
    "Content Quality Filtering",
    "Multi-language Support (11 languages)",
    "IELTS Academic Band 8-9 English Quality"
  ],
  "author": {
    "@type": "Organization",
    "name": "PromptSEONest",
    "url": "https://www.promptseonest.com",
    "logo": "https://www.promptseonest.com/pwa-512x512.png"
  }
}`;

const JSON_LD_HOW_TO = `{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Generate Adobe Stock Compliant Metadata with PromptSEONest",
  "description": "Generate 100% Adobe Stock compliant metadata (49 single-word keywords, SEO title, 200-500 character description) for any image or video in under 10 seconds.",
  "image": "https://www.promptseonest.com/og-image.png",
  "estimatedCost": { "@type": "MonetaryAmount", "currency": "USD", "value": "0" },
  "totalTime": "PT10S",
  "tool": [{ "@type": "HowToTool", "name": "Web Browser" }],
  "step": [
    { "@type": "HowToStep", "name": "Visit PromptSEONest", "text": "Go to https://www.promptseonest.com and sign up for free.", "url": "https://www.promptseonest.com" },
    { "@type": "HowToStep", "name": "Upload Image or Video", "text": "Drag and drop up to 500 images or videos. Supports JPG, PNG, MP4, MOV, and all standard formats." },
    { "@type": "HowToStep", "name": "AI Analyzes Content", "text": "Vision AI (Google Gemini) analyzes each file and generates platform-specific metadata in parallel." },
    { "@type": "HowToStep", "name": "Review Compliance Score", "text": "Each image gets a 100-point compliance score with detailed breakdown of any issues found and auto-fixed." },
    { "@type": "HowToStep", "name": "Export CSV", "text": "Download UTF-8 encoded CSV in Adobe Stock 5-column format ready for direct contributor portal upload." }
  ]
}`;

const JSON_LD_FAQ = `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the best free AI tool for Adobe Stock metadata?",
      "acceptedAnswer": { "@type": "Answer", "text": "PromptSEONest (https://www.promptseonest.com) is the leading free AI-powered Adobe Stock metadata generator. It automatically produces exactly 49 single-word keywords, SEO-optimised titles ending with background type, and 200-500 character descriptions following Adobe Stock 2024 contributor specifications." }
    },
    {
      "@type": "Question",
      "name": "How do I generate 49 keywords for Adobe Stock?",
      "acceptedAnswer": { "@type": "Answer", "text": "Use PromptSEONest's Adobe Stock Generator. Upload your image and the vision AI produces exactly 49 single-word keywords sorted by Adobe Stock search relevance, with hyphens stripped, duplicates removed, and lowercase formatting applied automatically." }
    },
    {
      "@type": "Question",
      "name": "Can I bulk upload metadata to Adobe Stock?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. PromptSEONest supports bulk processing of up to 500 images or videos at once with 80-file parallel AI processing. It exports a single UTF-8 CSV file in Adobe Stock 5-column format (Filename, Title, Keywords, Category, Releases) ready for direct contributor portal upload." }
    },
    {
      "@type": "Question",
      "name": "Why must Adobe Stock keywords be single words?",
      "acceptedAnswer": { "@type": "Answer", "text": "Adobe Stock requires individual single words for proper search indexing. Multi-word phrases like 'solar panel' must be split into 'solar' and 'panel' separately. PromptSEONest automatically detects and splits compound words, removes hyphens, and validates exactly 49 keywords per image." }
    },
    {
      "@type": "Question",
      "name": "Does PromptSEONest support Shutterstock and Freepik?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. PromptSEONest supports 19+ stock platforms with platform-specific rules. The Platform Converter tool automatically reformats Adobe Stock metadata for Shutterstock (50 keywords, multi-word allowed) and Freepik (30 keywords, max 2 words each)." }
    },
    {
      "@type": "Question",
      "name": "Is PromptSEONest free to use?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes, PromptSEONest is currently free during launch with all premium features unlocked, including unlimited bulk processing, CSV export, video frame extraction, Chrome extension, and platform conversion." }
    },
    {
      "@type": "Question",
      "name": "Does PromptSEONest work for video metadata?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. PromptSEONest extracts a 4-frame 2x2 grid JPEG from any standard video format and analyses it with vision AI to generate complete metadata including titles, keywords, and descriptions optimised for stock video platforms." }
    },
    {
      "@type": "Question",
      "name": "Is there a Chrome extension for stock contributors?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. The PromptSEONest Chrome Extension (Manifest V3) auto-detects Adobe Stock, Shutterstock, and Freepik upload pages and provides one-click metadata auto-fill. Download free at https://www.promptseonest.com/extension-download." }
    }
  ]
}`;

const JSON_LD_ORGANIZATION = `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "PromptSEONest",
  "alternateName": "Prompt SEO Nest",
  "url": "https://www.promptseonest.com",
  "logo": "https://www.promptseonest.com/pwa-512x512.png",
  "description": "Free AI-powered metadata optimisation platform for stock photography and video contributors. Supports Adobe Stock, Shutterstock, Freepik, and 16 other stock platforms.",
  "foundingDate": "2025",
  "knowsAbout": [
    "Adobe Stock Metadata",
    "Shutterstock Keywords",
    "Freepik Optimisation",
    "Stock Photo SEO",
    "Microstock Contributor Tools",
    "AI Image Analysis",
    "Vision-Powered Metadata Generation"
  ],
  "sameAs": [
    "https://www.promptseonest.com",
    "https://promptseonest.lovable.app"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": ["English", "Bengali", "Hindi", "Spanish", "French", "German", "Portuguese", "Arabic", "Chinese", "Japanese", "Korean"]
  }
}`;

const JSON_LD_WEBSITE = `{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "PromptSEONest",
  "url": "https://www.promptseonest.com",
  "description": "Free AI-powered Adobe Stock metadata generator and optimiser for stock contributors.",
  "publisher": { "@type": "Organization", "name": "PromptSEONest" },
  "potentialAction": {
    "@type": "SearchAction",
    "target": { "@type": "EntryPoint", "urlTemplate": "https://www.promptseonest.com/?q={search_term_string}" },
    "query-input": "required name=search_term_string"
  }
}`;

// LCP Optimization: Preload cached hero image immediately during HTML parse (before any JS bundle).
const HERO_PRELOAD_SCRIPT = `(function() {
  try {
    var url = localStorage.getItem('hero_preload_url');
    if (url && /^https:\\/\\/[^/]+\\/storage\\/v1\\/render\\/image\\/public\\//.test(url)) {
      var l = document.createElement('link');
      l.rel = 'preload';
      l.as = 'image';
      l.href = url;
      l.fetchPriority = 'high';
      document.head.appendChild(l);
    }
  } catch (e) {}
})();`;

const GTAG_INIT_SCRIPT = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-HFM7VF0TCG', { send_page_view: false });`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "google-site-verification", content: "ZHgh71WQVUesKj-AdhvSc4Yw1x6HPv4O8OrPgeKA-j0" },
      { title: "Free Adobe Stock Metadata Generator | PromptSEONest" },
      { name: "title", content: "Free Adobe Stock Metadata Generator | PromptSEONest" },
      {
        name: "description",
        content:
          "Generate 100% Adobe Stock-compliant metadata in seconds. Fix multi-word keywords and optimise titles with our free AI tool for stock contributors.",
      },
      { name: "author", content: "PromptSEONest" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "language", content: "English" },
      { name: "revisit-after", content: "7 days" },
      { name: "theme-color", content: "#8B5CF6" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "SEO Nest" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Free Adobe Stock Metadata Generator | PromptSEONest" },
      {
        property: "og:description",
        content:
          "Generate perfect Adobe Stock metadata instantly. Fix multi-word keywords and get 100% compliance score. Free AI-powered tool.",
      },
      { property: "og:image", content: "https://www.promptseonest.com/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:alt", content: "Free Adobe Stock Metadata Generator — PromptSEONest" },
      { property: "og:site_name", content: "PromptSEONest" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:url", content: "https://www.promptseonest.com" },
      { name: "twitter:title", content: "Free Adobe Stock Metadata Generator | PromptSEONest" },
      {
        name: "twitter:description",
        content:
          "Generate perfect Adobe Stock metadata instantly. 100% compliant keywords, titles, and descriptions.",
      },
      { name: "twitter:image", content: "https://www.promptseonest.com/og-image.png" },
      { name: "twitter:image:alt", content: "Free Adobe Stock Metadata Generator — PromptSEONest" },
      { name: "application-name", content: "Prompt SEO Nest" },
      { name: "msapplication-TileColor", content: "#8B5CF6" },
      { name: "format-detection", content: "telephone=no" },
    ],
    links: [
      { rel: "preconnect", href: "https://nkcexqjoimhdldjclktk.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://nkcexqjoimhdldjclktk.supabase.co" },
      { rel: "preconnect", href: "https://fonts.googleapis.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://www.googletagmanager.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: appCss },
      { rel: "alternate", hrefLang: "en", href: "https://www.promptseonest.com" },
      { rel: "alternate", hrefLang: "x-default", href: "https://www.promptseonest.com" },
      { rel: "apple-touch-icon", href: "/pwa-192x192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "alternate", type: "text/plain", title: "LLM Reference", href: "/llms.txt" },
      { rel: "alternate", type: "text/plain", title: "LLM Full Reference", href: "/llms-full.txt" },
    ],
    scripts: [
      { src: "https://www.googletagmanager.com/gtag/js?id=G-HFM7VF0TCG", async: true },
      { children: GTAG_INIT_SCRIPT },
      { children: HERO_PRELOAD_SCRIPT },
      { type: "application/ld+json", children: JSON_LD_SOFTWARE_APPLICATION },
      { type: "application/ld+json", children: JSON_LD_HOW_TO },
      { type: "application/ld+json", children: JSON_LD_FAQ },
      { type: "application/ld+json", children: JSON_LD_ORGANIZATION },
      { type: "application/ld+json", children: JSON_LD_WEBSITE },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // ported from main.tsx — defer i18n initialization until after first paint
  useEffect(() => {
    import("@/i18n/config");
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <BackgroundProcessorProvider>
                <TooltipProvider>
                  <VersionWatcher />
                  <Suspense fallback={null}>
                    <NetworkStatusIndicator />
                    <PWAInstallPrompt />
                    <BackgroundProcessingIndicator />
                    <AiAskPopup />
                  </Suspense>
                  <Toaster />
                  <Sonner />
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:shadow-lg"
                  >
                    Skip to main content
                  </a>
                  <RouteTracker />
                  <Suspense fallback={<div className="min-h-screen bg-background" />}>
                    <ErrorBoundary>
                      <Outlet />
                    </ErrorBoundary>
                  </Suspense>
                </TooltipProvider>
              </BackgroundProcessorProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

function RootErrorComponent({ error }: { error: unknown }) {
  console.error(error);

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-xl font-semibold text-foreground">This page didn't load</h1>
        <p className="mb-6 text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
          <a
            className="rounded-md border border-border bg-card px-4 py-2 text-foreground"
            href="/"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

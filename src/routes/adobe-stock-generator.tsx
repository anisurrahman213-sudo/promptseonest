import { createFileRoute } from "@tanstack/react-router";
import AdobeStockGenerator from "@/pages/AdobeStockGenerator";

export const Route = createFileRoute("/adobe-stock-generator")({
  head: () => ({
    meta: [
      { title: "Adobe Stock Metadata Generator | PromptSEONest" },
      { name: "description", content: "Generate exactly 49 single-word keywords, SEO titles and compliant descriptions for Adobe Stock uploads." },
      { property: "og:title", content: "Adobe Stock Metadata Generator | PromptSEONest" },
      { property: "og:description", content: "Generate exactly 49 single-word keywords, SEO titles and compliant descriptions for Adobe Stock uploads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdobeStockGenerator,
});

import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Free Adobe Stock Metadata Generator | PromptSEONest" },
      { name: "description", content: "Generate 100% Adobe Stock-compliant titles, 49 single-word keywords and descriptions in seconds with our free AI tool." },
      { property: "og:title", content: "Free Adobe Stock Metadata Generator | PromptSEONest" },
      { property: "og:description", content: "Generate 100% Adobe Stock-compliant titles, 49 single-word keywords and descriptions in seconds with our free AI tool." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

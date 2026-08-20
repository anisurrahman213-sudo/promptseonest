import { createFileRoute } from "@tanstack/react-router";
import TrendingKeywords from "@/pages/TrendingKeywords";

export const Route = createFileRoute("/trending-keywords")({
  head: () => ({
    meta: [
      { title: "Trending Stock Keywords | PromptSEONest" },
      { name: "description", content: "Discover trending stock photography and video keywords updated for current buyer demand." },
      { property: "og:title", content: "Trending Stock Keywords | PromptSEONest" },
      { property: "og:description", content: "Discover trending stock photography and video keywords updated for current buyer demand." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrendingKeywords,
});

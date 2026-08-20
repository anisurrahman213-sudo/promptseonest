import { createFileRoute } from "@tanstack/react-router";
import KeywordResearch from "@/pages/KeywordResearch";

export const Route = createFileRoute("/keyword-research")({
  head: () => ({
    meta: [
      { title: "Stock Keyword Research Tool | PromptSEONest" },
      { name: "description", content: "Research high-performing stock keywords and prioritise them for Adobe Stock, Shutterstock and Freepik." },
      { property: "og:title", content: "Stock Keyword Research Tool | PromptSEONest" },
      { property: "og:description", content: "Research high-performing stock keywords and prioritise them for Adobe Stock, Shutterstock and Freepik." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KeywordResearch,
});

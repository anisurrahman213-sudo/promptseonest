import { createFileRoute } from "@tanstack/react-router";
import RejectionAnalyzer from "@/pages/RejectionAnalyzer";

export const Route = createFileRoute("/rejection-analyzer")({
  head: () => ({
    meta: [
      { title: "Stock Rejection Analyzer | PromptSEONest" },
      { name: "description", content: "Understand why your stock submissions were rejected and get AI guidance to fix them before resubmitting." },
      { property: "og:title", content: "Stock Rejection Analyzer | PromptSEONest" },
      { property: "og:description", content: "Understand why your stock submissions were rejected and get AI guidance to fix them before resubmitting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RejectionAnalyzer,
});

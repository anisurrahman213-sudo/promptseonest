import { createFileRoute } from "@tanstack/react-router";
import CalendarPage from "@/pages/CalendarPage";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "2026 Stock Photography Event Calendar | PromptSEONest" },
      { name: "description", content: "Plan shoots around 2026 holidays and seasonal events with the stock contributor content calendar." },
      { property: "og:title", content: "2026 Stock Photography Event Calendar | PromptSEONest" },
      { property: "og:description", content: "Plan shoots around 2026 holidays and seasonal events with the stock contributor content calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

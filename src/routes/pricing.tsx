import { createFileRoute } from "@tanstack/react-router";
import Pricing from "@/pages/Pricing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing Plans | PromptSEONest" },
      { name: "description", content: "See PromptSEONest pricing plans for bulk stock metadata generation, CSV export and platform conversion." },
      { property: "og:title", content: "Pricing Plans | PromptSEONest" },
      { property: "og:description", content: "See PromptSEONest pricing plans for bulk stock metadata generation, CSV export and platform conversion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

import { createFileRoute } from "@tanstack/react-router";
import HealthCheck from "@/pages/HealthCheck";

export const Route = createFileRoute("/admin/health")({
  head: () => ({
    meta: [
      { title: "System Health Check | PromptSEONest" },
      { name: "description", content: "Live status of PromptSEONest backend services, AI gateway and database." },
      { property: "og:title", content: "System Health Check | PromptSEONest" },
      { property: "og:description", content: "Live status of PromptSEONest backend services, AI gateway and database." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HealthCheck,
});

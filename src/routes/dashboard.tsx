import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Metadata Dashboard | PromptSEONest" },
      { name: "description", content: "Upload images and videos, review AI-generated metadata and export Adobe Stock ready CSV files." },
      { property: "og:title", content: "Your Metadata Dashboard | PromptSEONest" },
      { property: "og:description", content: "Upload images and videos, review AI-generated metadata and export Adobe Stock ready CSV files." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

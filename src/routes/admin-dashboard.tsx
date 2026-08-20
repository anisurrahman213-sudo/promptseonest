import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/pages/AdminDashboard";

export const Route = createFileRoute("/admin-dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | PromptSEONest" },
      { name: "description", content: "Administrator tools for managing users, credits, content and support tickets." },
      { property: "og:title", content: "Admin Dashboard | PromptSEONest" },
      { property: "og:description", content: "Administrator tools for managing users, credits, content and support tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

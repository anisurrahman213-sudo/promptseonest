import { createFileRoute } from "@tanstack/react-router";
import AdminPayments from "@/pages/AdminPayments";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Admin Payments | PromptSEONest" },
      { name: "description", content: "Review and approve manual payment requests from PromptSEONest users." },
      { property: "og:title", content: "Admin Payments | PromptSEONest" },
      { property: "og:description", content: "Review and approve manual payment requests from PromptSEONest users." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPayments,
});

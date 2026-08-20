import { createFileRoute } from "@tanstack/react-router";
import PaymentHistory from "@/pages/PaymentHistory";

export const Route = createFileRoute("/payment-history")({
  head: () => ({
    meta: [
      { title: "Payment History | PromptSEONest" },
      { name: "description", content: "Review your PromptSEONest payment history, invoices and plan changes." },
      { property: "og:title", content: "Payment History | PromptSEONest" },
      { property: "og:description", content: "Review your PromptSEONest payment history, invoices and plan changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaymentHistory,
});

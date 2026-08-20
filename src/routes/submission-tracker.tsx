import { createFileRoute } from "@tanstack/react-router";
import SubmissionTracker from "@/pages/SubmissionTracker";

export const Route = createFileRoute("/submission-tracker")({
  head: () => ({
    meta: [
      { title: "Stock Submission Tracker | PromptSEONest" },
      { name: "description", content: "Track your stock portfolio submissions, approvals and rejections across every platform in one place." },
      { property: "og:title", content: "Stock Submission Tracker | PromptSEONest" },
      { property: "og:description", content: "Track your stock portfolio submissions, approvals and rejections across every platform in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubmissionTracker,
});

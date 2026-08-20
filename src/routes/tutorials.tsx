import { createFileRoute } from "@tanstack/react-router";
import Tutorials from "@/pages/Tutorials";

export const Route = createFileRoute("/tutorials")({
  head: () => ({
    meta: [
      { title: "Video Tutorials for Stock Contributors | PromptSEONest" },
      { name: "description", content: "Watch step-by-step tutorials on generating Adobe Stock, Shutterstock and Freepik metadata with PromptSEONest." },
      { property: "og:title", content: "Video Tutorials for Stock Contributors | PromptSEONest" },
      { property: "og:description", content: "Watch step-by-step tutorials on generating Adobe Stock, Shutterstock and Freepik metadata with PromptSEONest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tutorials,
});

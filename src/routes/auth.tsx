import { createFileRoute } from "@tanstack/react-router";
import Auth from "@/pages/Auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Create Account | PromptSEONest" },
      { name: "description", content: "Sign in to PromptSEONest to generate compliant stock metadata, export CSVs and track submissions." },
      { property: "og:title", content: "Sign In or Create Account | PromptSEONest" },
      { property: "og:description", content: "Sign in to PromptSEONest to generate compliant stock metadata, export CSVs and track submissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Auth,
});

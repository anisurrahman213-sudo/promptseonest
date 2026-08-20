import { createFileRoute } from "@tanstack/react-router";
import GitHubSetup from "@/pages/GitHubSetup";

export const Route = createFileRoute("/github-setup")({
  head: () => ({
    meta: [
      { title: "GitHub Connection Setup | PromptSEONest" },
      { name: "description", content: "Connect a GitHub repository and authorise access for your PromptSEONest project." },
      { property: "og:title", content: "GitHub Connection Setup | PromptSEONest" },
      { property: "og:description", content: "Connect a GitHub repository and authorise access for your PromptSEONest project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GitHubSetup,
});

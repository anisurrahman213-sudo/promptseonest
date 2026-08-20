import { createFileRoute } from "@tanstack/react-router";
import Profile from "@/pages/Profile";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Account Profile | PromptSEONest" },
      { name: "description", content: "Manage your PromptSEONest profile, preferences and account settings." },
      { property: "og:title", content: "Account Profile | PromptSEONest" },
      { property: "og:description", content: "Manage your PromptSEONest profile, preferences and account settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

import { createFileRoute } from "@tanstack/react-router";
import PlatformConverter from "@/pages/PlatformConverter";

export const Route = createFileRoute("/platform-converter")({
  head: () => ({
    meta: [
      { title: "Convert Metadata Between Stock Platforms | PromptSEONest" },
      { name: "description", content: "Convert Adobe Stock metadata to Shutterstock and Freepik formats with platform-specific keyword rules." },
      { property: "og:title", content: "Convert Metadata Between Stock Platforms | PromptSEONest" },
      { property: "og:description", content: "Convert Adobe Stock metadata to Shutterstock and Freepik formats with platform-specific keyword rules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlatformConverter,
});

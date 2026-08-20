import { createFileRoute } from "@tanstack/react-router";
import ExtensionDownload from "@/pages/ExtensionDownload";

export const Route = createFileRoute("/extension")({
  head: () => ({
    meta: [
      { title: "Chrome Extension for Stock Uploads | PromptSEONest" },
      { name: "description", content: "Download the free PromptSEONest Chrome extension to auto-fill metadata on Adobe Stock, Shutterstock and Freepik." },
      { property: "og:title", content: "Chrome Extension for Stock Uploads | PromptSEONest" },
      { property: "og:description", content: "Download the free PromptSEONest Chrome extension to auto-fill metadata on Adobe Stock, Shutterstock and Freepik." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExtensionDownload,
});

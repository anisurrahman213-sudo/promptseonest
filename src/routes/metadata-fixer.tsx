import { createFileRoute } from "@tanstack/react-router";
import MetadataFixer from "@/pages/MetadataFixer";

export const Route = createFileRoute("/metadata-fixer")({
  head: () => ({
    meta: [
      { title: "Stock Metadata Fixer & Compliance Checker | PromptSEONest" },
      { name: "description", content: "Fix multi-word keywords and score your stock metadata against a 100-point Adobe Stock compliance checklist." },
      { property: "og:title", content: "Stock Metadata Fixer & Compliance Checker | PromptSEONest" },
      { property: "og:description", content: "Fix multi-word keywords and score your stock metadata against a 100-point Adobe Stock compliance checklist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MetadataFixer,
});

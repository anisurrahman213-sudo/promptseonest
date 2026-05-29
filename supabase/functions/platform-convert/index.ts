import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { APP_CONTEXT } from "../_shared/app-knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  if (!auth.ok) return auth.response;

  try {
    const { title, keywords, description, source_platform } = await req.json();

    if (!title || !keywords || !description) {
      return new Response(
        JSON.stringify({ error: "Title, keywords, and description are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const keywordsStr = Array.isArray(keywords) ? keywords.join(", ") : keywords;

    const systemPrompt = `Microstock SEO expert. IELTS Band 8-9 academic English. Convert metadata for 3 platforms.

LANGUAGE: Sophisticated vocab ("monumental" not "big", "photovoltaic" not "solar panel", "vegetation" not "plants"). Formal academic prose.

ADOBE STOCK:
- Title: ≤70 chars, Title Case, no colons/dashes/colours
- Keywords: EXACTLY 49 SINGLE words (no spaces, no hyphens). Split phrases: "solar panel"→"solar","panel". Convert: "close-up"→"closeup"
- Description: 200-500 chars, 5 sentences (Subject, Tech, Atmosphere, Use Cases ≥3, Commercial)

SHUTTERSTOCK:
- Title: ≤200 chars, expanded descriptive
- Keywords: ≤50, 2-3 word phrases allowed
- Description: ≤200 chars, formal commercial

FREEPIK:
- Title: ≤100 chars
- Keywords: ≤30, single or short phrases
- Description: 100-300 chars with use cases

Score each platform 0-100 for compliance. Use the tool format.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        temperature: 0,
        max_tokens: 2000,
        messages: [
          { role: "system", content: APP_CONTEXT + "\n\n" + systemPrompt },
          {
            role: "user",
            content: `Convert this metadata from ${source_platform || "adobe_stock"} to all three platforms:\n\nTITLE: ${title}\n\nKEYWORDS: ${keywordsStr}\n\nDESCRIPTION: ${description}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_converted_metadata",
              description: "Return metadata converted for all three stock platforms",
              parameters: {
                type: "object",
                properties: {
                  adobe_stock: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Optimised title, max 70 chars" },
                      keywords: { type: "array", items: { type: "string" }, description: "Exactly 49 single-word keywords" },
                      description: { type: "string", description: "200-500 char description" },
                      score: { type: "number", description: "Compliance score 0-100" },
                    },
                    required: ["title", "keywords", "description", "score"],
                  },
                  shutterstock: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Expanded title, max 200 chars" },
                      keywords: { type: "array", items: { type: "string" }, description: "Up to 50 keywords, phrases allowed" },
                      description: { type: "string", description: "Max 200 char description" },
                      score: { type: "number", description: "Compliance score 0-100" },
                    },
                    required: ["title", "keywords", "description", "score"],
                  },
                  freepik: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Simplified title, max 100 chars" },
                      keywords: { type: "array", items: { type: "string" }, description: "Top 30 keywords" },
                      description: { type: "string", description: "100-300 char description" },
                      score: { type: "number", description: "Compliance score 0-100" },
                    },
                    required: ["title", "keywords", "description", "score"],
                  },
                  changes_made: {
                    type: "object",
                    properties: {
                      shutterstock: { type: "array", items: { type: "string" } },
                      freepik: { type: "array", items: { type: "string" } },
                    },
                    required: ["shutterstock", "freepik"],
                  },
                },
                required: ["adobe_stock", "shutterstock", "freepik", "changes_made"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_converted_metadata" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);

    // Post-process: enforce single-word keywords for Adobe Stock, remove duplicates
    // Split compound/concatenated words where BOTH halves are recognized words
    const knownWords = new Set([
      'solar', 'panel', 'wind', 'turbine', 'energy', 'power', 'plant', 'climate',
      'technology', 'module', 'background', 'landscape', 'nature', 'environment',
      'green', 'clean', 'renewable', 'sustainable', 'industrial', 'urban', 'rural',
      'aerial', 'macro', 'abstract', 'digital', 'modern', 'vintage', 'professional',
      'commercial', 'creative', 'outdoor', 'indoor', 'transmission', 'generation',
      'infrastructure', 'conservation', 'innovation', 'efficiency', 'ecological',
      'biological', 'agricultural', 'architectural', 'atmospheric', 'panoramic',
      'photovoltaic', 'electricity', 'voltage', 'pylon', 'grid', 'utility',
      'structure', 'engineering', 'resource', 'concept', 'system', 'array',
      'horizon', 'industry', 'ecology', 'carbon', 'neutral', 'emission',
      'footprint', 'oriented', 'solution', 'farm', 'field', 'forest', 'mountain',
      'ocean', 'river', 'desert', 'tropical', 'arctic', 'wildlife', 'animal',
      'flower', 'tree', 'building', 'house', 'office', 'factory', 'bridge',
      'road', 'vehicle', 'transport', 'food', 'health', 'medical', 'science',
      'education', 'finance', 'business', 'market', 'global', 'world', 'city',
      'night', 'light', 'shadow', 'texture', 'pattern', 'color', 'design',
      'space', 'water', 'fire', 'earth', 'metal', 'glass', 'wood', 'stone',
    ]);

    const splitCompound = (word: string): string[] => {
      const parts = word.replace(/[-_]/g, ' ').split(/\s+/);
      const out: string[] = [];
      for (const part of parts) {
        // Split camelCase: "solarPanel" → "solar", "panel"
        const camelSplit = part.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');
        if (camelSplit.length > 1) { out.push(...camelSplit); continue; }
        // Try splitting concatenated words where BOTH halves are known
        const lower = part.toLowerCase();
        if (lower.length >= 8) {
          let found = false;
          for (let i = 4; i <= lower.length - 4; i++) {
            const left = lower.slice(0, i);
            const right = lower.slice(i);
            if (knownWords.has(left) && knownWords.has(right)) {
              out.push(left, right);
              found = true;
              break;
            }
          }
          if (!found) out.push(part);
        } else {
          out.push(part);
        }
      }
      return out;
    };

    if (result.adobe_stock?.keywords) {
      const split = result.adobe_stock.keywords
        .flatMap((k: string) => splitCompound(k))
        .map((k: string) => k.toLowerCase().trim())
        .filter((k: string) => k.length > 1);
      result.adobe_stock.keywords = [...new Set(split)].slice(0, 49);
    }
    if (result.shutterstock?.keywords) {
      const seen = new Set<string>();
      result.shutterstock.keywords = result.shutterstock.keywords
        .map((k: string) => k.trim())
        .filter((k: string) => {
          const low = k.toLowerCase();
          if (seen.has(low) || !k) return false;
          seen.add(low);
          return true;
        }).slice(0, 50);
    }
    if (result.freepik?.keywords) {
      const seen = new Set<string>();
      result.freepik.keywords = result.freepik.keywords
        .map((k: string) => k.trim())
        .filter((k: string) => {
          const low = k.toLowerCase();
          if (seen.has(low) || !k) return false;
          seen.add(low);
          return true;
        }).slice(0, 30);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("platform-convert error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

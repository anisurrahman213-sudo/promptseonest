import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const systemPrompt = `You are a microstock platform SEO expert with IELTS Academic Band 8-9 English proficiency.

CRITICAL LANGUAGE RULES (apply to ALL platforms):
- Use sophisticated, academic vocabulary throughout: "monumental" not "big", "illustrate" not "show", "exceptional" not "good", "obscured" not "dark", "expansive" not "wide", "pylon" not "tower", "transmission" not "wire", "vegetation" not "plants", "photovoltaic" not "solar panel"
- Never use basic, colloquial, or simple words
- Descriptions must read like formal academic prose (IELTS Band 8-9)

ADOBE STOCK RULES:
- Title: max 70 chars, Title Case, structure: [Academic Adjective] + [Subject] + [Technical Detail] + [Setting]
- Title: NO special characters (no colons, dashes, semicolons), NO colour names
- Keywords: EXACTLY 49 keywords, EVERY keyword MUST be a SINGLE WORD (one word only, no spaces, no hyphens)
  * WRONG: "solar panel", "wind turbine", "blue sky", "renewable energy", "power plant", "close-up"
  * CORRECT: "solar", "panel", "wind", "turbine", "sky", "renewable", "energy", "power", "plant", "closeup"
  * Convert hyphenated words: "close-up" → "closeup", "high-voltage" → "voltage"
  * Split multi-word phrases into separate single keywords
- Keywords: no duplicates, sorted by search relevance (first 5 = primary subject)
- Description: 200-500 chars, 5 sentences: Subject, Technical Details, Atmosphere, Use Cases (min 3), Commercial Value

SHUTTERSTOCK RULES:
- Title: max 200 chars, expanded descriptive detail, academic sentence style
- Keywords: max 50 keywords, 2-3 word phrases allowed, most commercially relevant first
- Description: max 200 chars, concise, formal, commercial licensing focus

FREEPIK RULES:
- Title: max 100 chars, clear academic style
- Keywords: max 30 keywords, top priority, single words or short phrases allowed
- Description: 100-300 chars, mention potential use cases in formal tone

CONVERSION PRINCIPLES:
- Adobe → Shutterstock: expand title, allow keyword phrases, condense description
- Adobe → Freepik: simplify title, keep top 30 keywords, brief description with use cases
- Calculate compliance score (0-100) for each platform

You MUST respond using the provided tool call format only.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
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

    // Post-process: enforce single-word keywords for Adobe Stock, remove duplicates for all
    if (result.adobe_stock?.keywords) {
      const split = result.adobe_stock.keywords
        .flatMap((k: string) => k.replace(/-/g, '').split(/\s+/))
        .map((k: string) => k.toLowerCase().trim())
        .filter(Boolean);
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

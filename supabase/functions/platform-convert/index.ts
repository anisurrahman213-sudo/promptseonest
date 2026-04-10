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

    const systemPrompt = `You are a microstock platform SEO expert specialising in Adobe Stock, Shutterstock, and Freepik metadata optimisation.

Your task: Convert the provided metadata to all three platform formats simultaneously, following each platform's specific rules precisely.

PLATFORM RULES:

ADOBE STOCK:
- Title: max 70 characters, Title Case, no special characters (no colons, dashes), no colour names
- Keywords: exactly 49 single-word keywords, no hyphens, no duplicates, no multi-word phrases
- Description: 200-500 characters, 3-5 sentences, IELTS Academic English Band 8-9

SHUTTERSTOCK:
- Title: max 200 characters, more descriptive detail permitted, natural sentence style
- Keywords: max 50 keywords, 2-3 word phrases allowed, most commercially relevant first
- Description: max 200 characters, concise, focus on commercial licensing value

FREEPIK:
- Title: max 100 characters, clear and straightforward
- Keywords: max 30 keywords, top priority only, single words or short phrases
- Description: 100-300 characters, mention potential use cases

CONVERSION PRINCIPLES:
- Adobe → Shutterstock: expand title with detail, allow keyword phrases, condense description
- Adobe → Freepik: simplify title, keep top 30 keywords, brief description with use cases
- Maintain IELTS Academic English throughout
- Maximise search discoverability on each platform
- Calculate a compliance score (0-100) for each platform output

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

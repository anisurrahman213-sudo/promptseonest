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
    const { subject, subject_type, platform } = await req.json();

    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Subject is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const platformRules: Record<string, string> = {
      adobe_stock:
        "Generate exactly 49 single-word keywords. Max 49 keywords. Every keyword ONE word only. No hyphens, no multi-word phrases.",
      shutterstock:
        "Generate exactly 50 single-word keywords. Max 50 keywords. Every keyword ONE word only. No hyphens.",
      freepik:
        "Generate exactly 30 single-word keywords. Max 30 keywords. Every keyword ONE word only. No hyphens.",
    };

    const rules = platformRules[platform] || platformRules.adobe_stock;
    const maxKeywords = platform === "shutterstock" ? 50 : platform === "freepik" ? 30 : 49;
    const primaryCount = Math.min(7, maxKeywords);
    const supportingCount = Math.min(14, Math.floor(maxKeywords * 0.28));
    const secondaryCount = maxKeywords - primaryCount - supportingCount;

    const systemPrompt = `You are an Adobe Stock and stock photography SEO expert with deep understanding of search algorithms on major stock platforms.

Your task: Generate exactly ${maxKeywords} single-word keywords for the given subject, optimised for ${platform.replace("_", " ")} search ranking.

STRICT RULES:
- ${rules}
- Every keyword must be exactly ONE English word (no spaces, no hyphens, no compound phrases)
- No duplicates allowed
- Use IELTS Academic Band 8-9 vocabulary where appropriate
- Sort by search relevance: highest commercial value first

KEYWORD PRIORITY ORDER:
- Primary (1-${primaryCount}): Literal subject words — the exact thing in the image. These carry highest search weight.
- Secondary (${primaryCount + 1}-${primaryCount + secondaryCount}): Descriptive, technical, visual attributes, commercial buyer-intent terms.
- Supporting (${primaryCount + secondaryCount + 1}-${maxKeywords}): Conceptual, scientific, mood, use-case terms.

Subject type "${subject_type}" should inform which scientific/technical vocabulary to prioritise.

You MUST respond with ONLY a valid JSON object using this exact tool call format.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content: `Generate ${maxKeywords} single-word keywords for: "${subject.trim()}" (type: ${subject_type}, platform: ${platform})`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_keywords",
                description: `Return exactly ${maxKeywords} categorised single-word keywords`,
                parameters: {
                  type: "object",
                  properties: {
                    primary: {
                      type: "array",
                      items: { type: "string" },
                      description: `Top ${primaryCount} highest-priority subject keywords`,
                    },
                    secondary: {
                      type: "array",
                      items: { type: "string" },
                      description: `${secondaryCount} descriptive and technical keywords`,
                    },
                    supporting: {
                      type: "array",
                      items: { type: "string" },
                      description: `${supportingCount} conceptual and use-case keywords`,
                    },
                  },
                  required: ["primary", "secondary", "supporting"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_keywords" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const keywords = JSON.parse(toolCall.function.arguments);

    // Validate: enforce single-word, remove duplicates
    const clean = (arr: string[]) =>
      arr
        .map((w: string) => w.toLowerCase().replace(/[^a-z]/g, "").trim())
        .filter((w: string) => w.length > 0 && !w.includes(" "));

    const seen = new Set<string>();
    const dedup = (arr: string[]) =>
      arr.filter((w) => {
        if (seen.has(w)) return false;
        seen.add(w);
        return true;
      });

    const primary = dedup(clean(keywords.primary || []));
    const secondary = dedup(clean(keywords.secondary || []));
    const supporting = dedup(clean(keywords.supporting || []));
    const total = primary.length + secondary.length + supporting.length;

    return new Response(
      JSON.stringify({
        primary,
        secondary,
        supporting,
        total,
        platform,
        platform_notes: {
          adobe_stock: "49 single words maximum",
          shutterstock: "50 keywords, phrases allowed",
          freepik: "30 keywords maximum",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("keyword-research error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

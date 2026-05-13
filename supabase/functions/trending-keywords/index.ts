// Generate trending stock photography keywords/themes based on time of year & user-provided context
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert microstock market analyst with deep knowledge of Adobe Stock, Shutterstock, Freepik, and Getty buyer demand patterns.

Given the current date and an optional niche/category, generate trending content suggestions that have high commercial demand RIGHT NOW.

Always respond by calling the suggest_trends tool with:
- trending_themes: 6-10 specific themes with title, description, demand_score (1-100), best_keywords (5-8 each), and reason
- upcoming_events: 4-6 upcoming holidays/events/seasons in next 60 days that drive demand
- evergreen_topics: 4-6 perennial high-demand topics
- avoid_oversaturated: 3-5 topics that are oversaturated and hard to rank

Be specific (not "business" — say "remote team async meeting"). Focus on Adobe Stock buyer behavior. English only.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req, corsHeaders);
  if (!auth.ok) return auth.response;

  try {
    const { niche, region } = await req.json().catch(() => ({}));
    const today = new Date().toISOString().split("T")[0];
    const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

    const userPrompt = `Today is ${today} (${monthName}). ${niche ? `Niche/category: ${niche}.` : "No specific niche."} ${region ? `Region focus: ${region}.` : "Global market."}

Generate trending stock content suggestions for microstock contributors. Consider:
- Current season and upcoming holidays
- Recent cultural/business trends
- AI/tech topics getting buyer demand
- Adobe Stock & Shutterstock search trends`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_trends",
            description: "Return structured trending stock content suggestions",
            parameters: {
              type: "object",
              properties: {
                trending_themes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      demand_score: { type: "number", minimum: 1, maximum: 100 },
                      best_keywords: { type: "array", items: { type: "string" } },
                      reason: { type: "string" },
                    },
                    required: ["title", "description", "demand_score", "best_keywords", "reason"],
                    additionalProperties: false,
                  },
                  minItems: 6, maxItems: 10,
                },
                upcoming_events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      event: { type: "string" },
                      date: { type: "string" },
                      keywords: { type: "array", items: { type: "string" } },
                    },
                    required: ["event", "date", "keywords"],
                    additionalProperties: false,
                  },
                  minItems: 4, maxItems: 6,
                },
                evergreen_topics: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 6 },
                avoid_oversaturated: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
              },
              required: ["trending_themes", "upcoming_events", "evergreen_topics", "avoid_oversaturated"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_trends" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No trends returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const trends = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ trends, generated_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("trending-keywords error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

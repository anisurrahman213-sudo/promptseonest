// Analyze Adobe Stock rejection emails using Lovable AI
// Categorizes the reason and provides actionable suggestions
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert Adobe Stock contributor reviewer. You analyze rejection emails from Adobe Stock (or similar microstock platforms like Shutterstock, Freepik) and help contributors understand why their content was rejected.

Always respond by calling the analyze_rejection tool with:
1. category: one of these exact values:
   - "quality_technical" — focus, noise, exposure, artifacts, compression
   - "trademark_ip" — logos, brand names, recognizable copyrighted material
   - "similar_content" — too similar to existing content / oversaturated
   - "model_property_release" — missing model or property release
   - "metadata_keywords" — bad title, spammy keywords, wrong description
   - "content_policy" — prohibited content (offensive, misleading, AI policy)
   - "composition" — poor composition, framing, cropping
   - "commercial_value" — low commercial appeal
   - "other" — anything not matching above

2. severity: "low" | "medium" | "high"
3. summary: 1-sentence plain-English explanation of WHY (max 140 chars)
4. suggestions: array of 3-5 short, actionable improvement tips
5. avoid_in_future: array of 2-3 short DO-NOT-DO items for next submissions
6. confidence: 0-100 (how confident you are in the categorization)

Be precise, friendly, and contributor-focused. Use English.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  if (!auth.ok) return auth.response;

  try {
    const { rejectionText } = await req.json();
    if (!rejectionText || typeof rejectionText !== "string" || rejectionText.length < 10) {
      return new Response(JSON.stringify({ error: "rejectionText is required (min 10 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rejectionText.length > 8000) {
      return new Response(JSON.stringify({ error: "rejectionText too long (max 8000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze this rejection email/message:\n\n${rejectionText}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_rejection",
            description: "Return structured analysis of a stock-platform rejection",
            parameters: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  enum: ["quality_technical", "trademark_ip", "similar_content", "model_property_release", "metadata_keywords", "content_policy", "composition", "commercial_value", "other"],
                },
                severity: { type: "string", enum: ["low", "medium", "high"] },
                summary: { type: "string" },
                suggestions: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
                avoid_in_future: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
                confidence: { type: "number", minimum: 0, maximum: 100 },
              },
              required: ["category", "severity", "summary", "suggestions", "avoid_in_future", "confidence"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_rejection" } },
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
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No analysis returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("analyze-rejection error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

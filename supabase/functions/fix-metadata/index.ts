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
    const { title, keywords, description, prompt } = await req.json();

    if (!title && !keywords && !description && !prompt) {
      return new Response(JSON.stringify({ error: "At least one field is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert Adobe Stock metadata validator and fixer. Analyze the given metadata and fix ALL issues according to these strict rules.

## TITLE RULES:
- Remove ALL special characters: colon(:) semicolon(;) slash(/) dash(-) comma(,) quotes("') pipes(|) brackets([]{}) ampersand(&) hash(#) at(@) exclamation(!) question(?)
- Only allow: letters, numbers, spaces, periods
- Maximum 70 characters
- Remove ALL color names from title (red, blue, green, orange, yellow, pink, purple, cyan, magenta, lime, brown, grey, gray, black, white, beige, teal, violet, maroon, navy, gold, silver, turquoise, crimson, ivory, coral, amber, indigo, scarlet, emerald, sapphire, ruby, bronze, copper, platinum, chartreuse, fuchsia, khaki, lavender, mauve, ochre, olive, peach, periwinkle, plum, rose, rust, salmon, sienna, slate, tan, taupe, vermillion)
- Title MUST end with background type: "on White Background" or "on Transparent Background" or "Isolated on White Background"
- If grey/gray background is mentioned anywhere, change to "White Background"
- Format: [Subject] + [Action/Style] + on [Background Type]
- Generate 3 alternative unique title suggestions following same rules

## KEYWORD RULES:
- Every keyword MUST be a single word — no spaces allowed
- Remove hyphens and merge: "close-up" → "closeup", "high-quality" → "highquality"
- Split multi-word phrases into individual words: "white background" → keep only "background"
- Compound concepts: "life cycle" → "lifecycle", "sun flower" → "sunflower"
- Remove ALL exact duplicate words (case-insensitive)
- Remove near-duplicates: if "detail" and "detailed" both exist, keep only the more useful one
- Final count MUST be EXACTLY 49 keywords
- If fewer than 49: add relevant, high-search-volume single keywords related to the image subject
- If more than 49: remove least relevant keywords
- Sort by search relevance — most commonly searched terms first
- All keywords lowercase

## DESCRIPTION RULES:
- Must be 200-500 characters
- Must mention at least 2 use cases (e.g., marketing, web design, presentations, social media, etc.)
- No keyword stuffing — natural reading flow
- Last sentence must mention commercial or editorial use suitability
- If too short, expand with relevant details
- If too long, trim while keeping key information

## PROMPT VALIDATION:
- Check if "white background" or "transparent background" is mentioned
- Check if lighting is described (studio lighting, soft light, etc.)
- Check if camera angle is mentioned (front view, top view, eye level, etc.)
- Check if color palette is described
- Check if mood/atmosphere is mentioned (professional, clean, vibrant, etc.)

Respond ONLY with valid JSON:
{
  "title": "Fixed title here",
  "alt_titles": ["Alt title 1", "Alt title 2", "Alt title 3"],
  "keywords": "word1, word2, word3, ... (exactly 49 single words)",
  "description": "Fixed description here",
  "prompt_checks": {
    "white_background": true/false,
    "lighting": true/false,
    "camera_angle": true/false,
    "color_palette": true/false,
    "mood": true/false
  },
  "errors": [
    {
      "field": "title|keywords|description|prompt",
      "type": "error|warning",
      "original": "problematic text",
      "fixed": "corrected text",
      "reason": "Short explanation"
    }
  ],
  "compliance_score": 0-100
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Fix and optimize this Adobe Stock metadata:\n\nTITLE: ${title || "(empty)"}\n\nKEYWORDS: ${keywords || "(empty)"}\n\nDESCRIPTION: ${description || "(empty)"}\n\nPROMPT: ${prompt || "(empty)"}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1].trim();

    let metadata;
    try {
      metadata = JSON.parse(content);
    } catch {
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) {
        metadata = JSON.parse(objMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    return new Response(JSON.stringify(metadata), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("fix-metadata error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

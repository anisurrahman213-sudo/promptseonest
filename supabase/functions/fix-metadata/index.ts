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

    const systemPrompt = `You are an expert Adobe Stock metadata optimizer. Your job is to fix and optimize stock metadata for maximum search ranking and compliance.

RULES FOR TITLE:
- Remove ALL special characters: colons (:), dashes (-), slashes (/), pipes (|), brackets, etc. Only letters, numbers, spaces, and periods allowed.
- No color details in the title (remove "blue", "red", "orange" etc. from title)
- Max 70 characters
- Must be unique and SEO-friendly, natural sentence structure
- If the background is described as "grey" or "gray", change it to "white" in the title
- Format should follow: [Subject] + [Style] + [Background]
- Example: "Professional Business Woman Standing Isolated on White Background"

RULES FOR KEYWORDS:
- Every keyword must be a SINGLE WORD only — no spaces, no hyphens
- Convert hyphenated words: "close-up" → "closeup", "high-quality" → "highquality" or split into separate words
- Convert multi-word phrases: "orange spots" → "orange" and "spots" as separate keywords
- "lime green" → "lime" and "green" as separate keywords
- Must have EXACTLY 49 keywords
- Best ranking/most searchable words first
- Adobe Stock guideline compliant
- Remove all duplicates
- No keyword stuffing (no repetitive variants)
- All lowercase

RULES FOR BACKGROUND:
- If prompt mentions "grey background" or "gray background", suggest "white background" instead
- Add "white", "background", "isolated" as keywords if relevant
- Update title to mention white background if applicable

RULES FOR DESCRIPTION:
- 200-500 characters
- Natural language, mention potential use cases
- No special characters that could cause issues
- SEO optimized

Analyze the input metadata and return a JSON response with:
1. Fixed versions of all fields
2. List of issues found in each field
3. Compliance score (0-100)

Respond ONLY with valid JSON in this exact format:
{
  "fixed": {
    "title": "...",
    "keywords": "word1, word2, word3, ...",
    "description": "...",
    "prompt": "..."
  },
  "issues": [
    {
      "field": "title|keywords|description|prompt",
      "type": "error|warning",
      "original": "the problematic text",
      "fixed": "the corrected text",
      "reason": "brief explanation"
    }
  ],
  "score": 85,
  "summary": "Brief summary of all changes made"
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
            content: `Fix and optimize the following Adobe Stock metadata:\n\nTitle: ${title || "(empty)"}\n\nKeywords: ${keywords || "(empty)"}\n\nDescription: ${description || "(empty)"}\n\nPrompt: ${prompt || "(empty)"}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    }

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

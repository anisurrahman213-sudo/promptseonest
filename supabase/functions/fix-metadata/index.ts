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

    const systemPrompt = `You are an Adobe Stock SEO expert. Fix the metadata strictly following ALL rules below. Return ONLY valid JSON, no extra text.

## IELTS ACADEMIC LANGUAGE RULES (MANDATORY):
VOCABULARY UPGRADE LIST — NEVER use the basic word, ALWAYS use the academic replacement:
- big → monumental / expansive / substantial
- nice → compelling / striking / distinguished
- good → exceptional / superior / optimum
- show → illustrate / depict / portray
- use → utilise / employ / incorporate
- make → generate / produce / construct
- get → obtain / acquire / attain
- old → aged / weathered / historical
- new → contemporary / modern / innovative
- dark → obscured / shadowed / silhouetted
- bright → luminous / radiant / vivid
- wide → expansive / panoramic / sweeping
- high → elevated / towering / monumental
- far → distant / remote / peripheral
- near → adjacent / proximate / foreground
Use academic descriptors: dramatic, atmospheric, expansive, striking, compelling, distinctive, monumental, panoramic, sweeping
Prefer Latinate/technical vocabulary over informal/colloquial words throughout ALL fields.

## TITLE FIX RULES (25 points):
1. Remove ALL special characters: : ; - / \\ , ' " ! ? | [ ] { } ( ) & @ # $ % ^ * < > ~ \` + =
2. Maximum 70 characters
3. Minimum 50 characters (too short = low SEO)
4. First word MUST be main subject (noun), NOT an adjective like "Beautiful" or "Stunning"
   GOOD: "Solar Panel Array..." NOT "Beautiful Solar..."
5. Must include ONE of these power words naturally: Macro, Aerial, Closeup, Detailed, Vibrant, Professional, Stunning, Isolated, Abstract
6. Must include setting/background at end:
   "on White Background" OR "in Green Field" OR "on Transparent Background" OR "Against Blue Sky" etc.
7. Every word First Letter Capital (Title Case)
8. No color names in title (red, blue, green, golden, etc.)
9. No duplicate words
10. No AI/Generated/Midjourney/Artificial words
11. Structure: [Academic Adjective] + [Subject] + [Technical Detail] + [Setting]
GOOD EXAMPLE: "Monumental Transmission Pylon Silhouetted Against Dramatic Twilight Horizon"
BAD EXAMPLE: "Big Tower in Dark Sky at Sunset" (uses basic words, no power word)

## KEYWORD FIX RULES (35 points):
1. EVERY keyword = exactly ONE single word only — NO SPACES
2. NO hyphenated words: close-up → closeup, wide-angle → wideangle, creepy-crawly → DELETE
3. NO multi-word phrases: solar panel → solar + panel (split into 2 separate keywords)
   white background → background, lens flare → flare, solar farm → farm, clean energy → clean
4. NO duplicate words (case insensitive)
5. EXACTLY 49 keywords required
6. Sort order MUST be:
   - Position 1-5: Primary subject words (most important, most searched — these carry HIGHEST weight in Adobe Stock)
   - Position 6-15: Secondary descriptive words
   - Position 16-30: Style/technical words
   - Position 31-40: Use case/concept words
   - Position 41-49: Supporting/filler words
7. MANDATORY: Use technically accurate, Latinate/academic single words:
   pylon (not tower), transmission (not wire), silhouette (not shadow)
   twilight (not almost dark), infrastructure (not building)
   atmospheric (not cloudy), panoramic (not wide), voltage (not electric)
8. After splitting multi-words and removing duplicates, if count < 49:
   Auto-add relevant single words from: isolated, detailed, vibrant, professional, glossy, sharp, focused, clean, bright, vivid, colorful, stunning, beautiful, modern, realistic, natural, organic, commercial, editorial, stock
9. If count > 49: remove from position 49 downward
10. All keywords lowercase
11. Avoid informal or colloquial words

## DESCRIPTION FIX RULES (25 points):
1. Minimum 200 characters, maximum 500 characters
2. Write in IELTS Academic Band 8-9 style with sophisticated sentence structures
3. Formal tone throughout with technical terminology relevant to subject matter
4. Varied vocabulary — no word repeated more than twice
5. Structure MUST be exactly 5 sentences:
   - Sentence 1: Technical subject description
   - Sentence 2: Compositional/visual details (lighting, angle)
   - Sentence 3: Atmospheric/mood description
   - Sentence 4: Professional use cases (minimum 3 specific uses)
   - Sentence 5: Commercial value statement / call to action for buyer
6. Must include these SEO words naturally: stock photo/illustration, high-quality, professional, ideal for
7. No keyword stuffing (same word max 2 times)
8. Last sentence format: "Perfect for [use case 1], [use case 2], and [use case 3]."

## PROMPT VALIDATION RULES (15 points):
Check all 8 points — each must be present in the user's prompt:
1. subject - Subject clearly described
2. background - Background type mentioned (white/natural/transparent)
3. lighting - Lighting type mentioned (soft/dramatic/studio/natural)
4. camera_angle - Camera angle mentioned (wide/macro/aerial/closeup/eye level)
5. color_palette - Color palette mentioned
6. mood - Mood/atmosphere mentioned
7. quality - Technical quality mentioned (8K/ultra HD/high resolution)
8. restrictions - Restrictions mentioned (no people/no text/no watermark)
For each missing check, provide a suggestion of what to add.

## SCORING:
- title_score: 0-25 (deduct for each rule violation)
- keyword_score: 0-35 (deduct for multi-word, duplicates, wrong count)
- description_score: 0-25 (deduct for length, missing structure, missing SEO words)
- prompt_score: 0-15 (deduct ~2 points per missing check)
- total_score: sum of all scores

Return ONLY this JSON:
{
  "fixed_title": "Corrected Title Here",
  "alt_titles": ["Alternative 1", "Alternative 2", "Alternative 3"],
  "fixed_keywords": ["word1","word2","word3",...exactly 49 single words],
  "fixed_description": "Corrected description here...",
  "prompt_checks": {
    "subject": true/false,
    "background": true/false,
    "lighting": true/false,
    "camera_angle": true/false,
    "color_palette": true/false,
    "mood": true/false,
    "quality": true/false,
    "restrictions": true/false
  },
  "prompt_suggestions": ["Add white background specification", "Mention lighting type"],
  "errors_found": 12,
  "errors_fixed": 12,
  "title_score": 25,
  "keyword_score": 35,
  "description_score": 25,
  "prompt_score": 15,
  "total_score": 100,
  "changes_made": [
    "Removed colon from title",
    "Split 'solar panel' into 'solar' + 'panel'",
    "Added 15 missing keywords to reach 49"
  ]
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
          { role: "system", content: APP_CONTEXT + "\n\n" + systemPrompt },
          {
            role: "user",
            content: `Fix this metadata for Adobe Stock:\n\nTITLE: ${title || "(empty)"}\n\nKEYWORDS: ${keywords || "(empty)"}\n\nDESCRIPTION: ${description || "(empty)"}\n\nPROMPT: ${prompt || "(empty)"}`,
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

    // Normalize: ensure fixed_keywords is a comma-separated string for backward compat
    if (Array.isArray(metadata.fixed_keywords)) {
      metadata.fixed_keywords_array = metadata.fixed_keywords;
      metadata.fixed_keywords_str = metadata.fixed_keywords.join(", ");
    } else if (typeof metadata.fixed_keywords === "string") {
      metadata.fixed_keywords_array = metadata.fixed_keywords.split(",").map((k: string) => k.trim()).filter(Boolean);
      metadata.fixed_keywords_str = metadata.fixed_keywords;
    }

    // Also keep backward-compatible fields
    metadata.title = metadata.fixed_title || metadata.title || "";
    metadata.keywords = metadata.fixed_keywords_str || metadata.keywords || "";
    metadata.description = metadata.fixed_description || metadata.description || "";

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

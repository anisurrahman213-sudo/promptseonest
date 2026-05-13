import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";

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
    const { imageBase64, mimeType, hasTransparency, isAiGenerated } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const transparencyInstruction = hasTransparency
      ? `IMPORTANT: This image has a TRANSPARENT background (PNG with alpha channel). You MUST include "Isolated on Transparent Background" or "Transparent Background" naturally in the title.`
      : "";

    const aiWarning = isAiGenerated
      ? `NOTE: This image is AI-generated. Include this context where relevant in the description.`
      : "";

const systemPrompt = `You are an expert Adobe Stock metadata specialist. Your job is to generate perfectly optimized metadata for stock images that will rank highly on Adobe Stock search.

RULES:
- Title: Max 70 characters. MUST perfectly and accurately describe EXACTLY what is visible in the image.
  Use IELTS Band 8-9 level academic/professional English.
  MANDATORY VOCABULARY UPGRADES:
    big → monumental/expansive/substantial, nice → compelling/striking/distinguished
    good → exceptional/superior/optimum, show → illustrate/depict/portray
    old → aged/weathered/historical, new → contemporary/modern/innovative
    dark → obscured/shadowed/silhouetted, bright → luminous/radiant/vivid
    wide → expansive/panoramic/sweeping, high → elevated/towering/monumental
  Use academic descriptors: dramatic, atmospheric, expansive, striking, compelling, distinctive, monumental, panoramic, sweeping
  Structure: [Academic Adjective] + [Subject] + [Technical Detail] + [Setting]
  NO commas, colons, or generic adjectives (beautiful, stunning, amazing, nice, good).
  Example: Instead of "Beautiful sunset over ocean" → "Atmospheric Twilight Cascading Over Tranquil Coastal Horizon"
  Example: Instead of "Big tower in dark sky" → "Monumental Transmission Pylon Silhouetted Against Dramatic Twilight Horizon"

- Description: 200-500 characters, IELTS Academic Band 8-9 style, formal tone throughout.
  MANDATORY VOCABULARY UPGRADES:
    use → utilise/employ/incorporate, make → generate/produce/construct
    get → obtain/acquire/attain, far → distant/remote/peripheral, near → adjacent/proximate/foreground
  Structure:
    Sentence 1: Technical subject description
    Sentence 2: Compositional/visual details
    Sentence 3: Atmospheric/mood description
    Sentence 4: Professional use cases (3 minimum)
    Sentence 5: Commercial value statement
  No word repeated more than twice. Include technical terminology relevant to subject matter.

- Keywords: Exactly 49 single words, comma-separated.
  * CRITICAL: FIRST 5 keywords must PERFECTLY describe what is EXACTLY in the image. Adobe Stock gives the first 5 keywords the HIGHEST search weight.
  * Keywords 6-10: Highest-selling, most-searched commercial terms buyers actually search for.
  * After 10: More specific/niche terms. No compound words, no phrases. Adobe Stock compliant.
  * MANDATORY: Use technically accurate, Latinate/academic single words:
    pylon (not tower), transmission (not wire), silhouette (not shadow)
    twilight (not almost dark), infrastructure (not building)
    atmospheric (not cloudy), panoramic (not wide), voltage (not electric)
  * Avoid informal or colloquial words throughout.

- Prompt: A detailed AI image generation prompt that would recreate this image. Include style, composition, lighting, colors, subject details.
- Category: Pick the best Adobe Stock category number (1-21): 1=Animals, 2=Buildings/Architecture, 3=Business, 4=Drinks, 5=Environment, 6=States of Mind, 7=Food, 8=Graphic Resources, 9=Hobbies/Leisure, 10=Industry, 11=Landscapes, 12=Lifestyle, 13=People, 14=Plants/Flowers, 15=Culture/Religion, 16=Science, 17=Social Issues, 18=Sports, 19=Technology, 20=Transport, 21=Travel

${transparencyInstruction}
${aiWarning}

Respond ONLY with valid JSON in this exact format:
{
  "title": "...",
  "description": "...",
  "keywords": "word1, word2, word3, ...",
  "prompt": "...",
  "category": 3
}`;
    // Clean base64
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");

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
            content: [
              { type: "text", text: "Analyze this image and generate Adobe Stock metadata following the rules exactly." },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType || "image/jpeg"};base64,${cleanBase64}` },
              },
            ],
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

    // Extract JSON from possible markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    }

    let metadata;
    try {
      metadata = JSON.parse(content);
    } catch {
      // Try to extract JSON object manually
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
    console.error("generate-adobe-metadata error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

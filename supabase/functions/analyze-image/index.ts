/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalysisResult {
  prompt: string;
  title: string;
  description: string;
  tags: string;
}

interface MetadataSettings {
  exportPlatform: string;
  titleLength: number;
  titleLengthMix: boolean;
  descriptionLength: number;
  descriptionLengthFixed: boolean;
  keywordsCount: number;
  imageType: string;
  prefix: string;
  suffix: string;
  negativeTitleWords: string;
  negativeKeywords: string;
}

const platformNames: Record<string, string> = {
  adobe_stock: "Adobe Stock",
  shutterstock: "Shutterstock",
  freepik: "Freepik",
  getty: "Getty Images",
  custom: "Stock Marketplaces",
};

const imageTypePrefixes: Record<string, string> = {
  none: "",
  photo: "Photo of ",
  illustration: "Illustration of ",
  vector: "Vector illustration of ",
  "3d_render": "3D Render of ",
  ai_generated: "AI Generated ",
};

function buildPrompt(mediaType: string, settings: MetadataSettings): { systemPrompt: string; userPrompt: string } {
  const platform = platformNames[settings.exportPlatform] || "Stock Marketplaces";
  const titleMax = settings.titleLength || 60;
  const descLength = settings.descriptionLength || 200;
  const keywordCount = settings.keywordsCount || 49;
  const imageTypePrefix = imageTypePrefixes[settings.imageType] || "";
  
  // Build negative words instruction
  const negativeTitleInstruction = settings.negativeTitleWords 
    ? `\n   - AVOID these words in title: ${settings.negativeTitleWords}` 
    : "";
  
  const negativeKeywordsInstruction = settings.negativeKeywords
    ? `\n   - EXCLUDE these keywords: ${settings.negativeKeywords}`
    : "";

  // Build prefix/suffix instruction
  const prefixInstruction = settings.prefix 
    ? `\n   - START the title with: "${settings.prefix}"` 
    : "";
  
  const suffixInstruction = settings.suffix 
    ? `\n   - END the title with: "${settings.suffix}"` 
    : "";

  const titleLengthNote = settings.titleLengthMix 
    ? `(${titleMax - 10} to ${titleMax} characters ideal)` 
    : `(exactly ${titleMax} characters)`;

  const descLengthNote = settings.descriptionLengthFixed 
    ? `(exactly ${descLength} characters)` 
    : `(${descLength - 50} to ${descLength} characters)`;

  const systemPrompt = `You are a world-class stock content metadata specialist with deep expertise in ${platform}, Adobe Stock, Shutterstock, Freepik, Getty Images, iStock, Pond5, and other major stock marketplaces. You understand exactly what makes content discoverable and avoids rejection for "similar content" issues.

Your metadata must be:
- HIGHLY UNIQUE: Never use generic, overused keywords. Create distinctive, specific descriptions that differentiate this content from millions of similar uploads.
- PLATFORM-OPTIMIZED: Follow the exact requirements specified for this export (title length, description length, keyword count).
- AI-MARKETPLACE READY: Generate prompts that work for Midjourney, DALL-E, Stable Diffusion, Adobe Firefly, and similar platforms.
- REJECTION-PROOF: Avoid common rejection triggers like vague titles, duplicate keywords, or generic descriptions.`;

  const userPrompt = `Analyze this ${mediaType === 'video' ? 'video frame/thumbnail' : 'image'} and generate HIGHLY UNIQUE, PLATFORM-OPTIMIZED metadata for ${platform}.

EXPORT SETTINGS:
- Target Platform: ${platform}
- Title Length: ${titleMax} characters ${titleLengthNote}
- Description Length: ${descLength} characters ${descLengthNote}
- Keywords Count: exactly ${keywordCount} unique keywords
${settings.imageType !== 'none' ? `- Image Type: ${settings.imageType} (add appropriate prefix)` : ''}
${settings.prefix ? `- Title Prefix: "${settings.prefix}"` : ''}
${settings.suffix ? `- Title Suffix: "${settings.suffix}"` : ''}
${settings.negativeTitleWords ? `- Avoid in Title: ${settings.negativeTitleWords}` : ''}
${settings.negativeKeywords ? `- Exclude Keywords: ${settings.negativeKeywords}` : ''}

CRITICAL REQUIREMENTS:
- This metadata will be used on ${platform} and similar marketplaces
- It MUST be unique enough to avoid "similar content" rejections
- Keywords must be DIVERSE with NO REPETITION of root words

Generate the following:

1. **AI ${mediaType === 'video' ? 'Video' : 'Image'} Prompt** (100-150 words):
   - Write a DETAILED, PROFESSIONAL prompt for AI generators (Midjourney, DALL-E, Stable Diffusion, Runway, Pika)
   - Include: exact style (photorealistic/illustration/3D), lighting type, camera angle, lens, color palette, mood, atmosphere
   - ${mediaType === 'video' ? 'Include: motion description, camera movement, duration hints, pacing' : 'Include: composition, focal point, depth of field'}
   - Make it UNIQUE - avoid generic terms like "beautiful", "stunning", "amazing"

2. **SEO Title** (max ${titleMax} characters):${prefixInstruction}${suffixInstruction}${negativeTitleInstruction}
   - ${imageTypePrefix ? `Start with "${imageTypePrefix}" after any prefix` : 'Lead with the MOST SPECIFIC, UNIQUE aspect'}
   - Include primary keyword naturally
   - NO generic adjectives (beautiful, nice, good)
   - Example: Instead of "Beautiful sunset" → "${settings.prefix ? settings.prefix + ' ' : ''}${imageTypePrefix}Golden Hour Silhouette Over Misty Mountains${settings.suffix ? ' ' + settings.suffix : ''}"

3. **SEO Description** ${descLengthNote}:
   - First sentence: Unique, specific description of the main subject
   - Include: setting, mood, style, potential use cases
   - Naturally integrate 8-10 keywords WITHOUT stuffing
   - ${mediaType === 'video' ? 'Describe motion, transitions, and dynamic elements' : 'Describe visual elements, textures, and artistic qualities'}
   - End with commercial applications (advertising, websites, social media, etc.)

4. **Keywords/Tags** (exactly ${keywordCount} unique tags):${negativeKeywordsInstruction}
   - NO DUPLICATE CONCEPTS (don't use "business" and "business concept")
   - Categories to cover:
     * Main subject (5-7 specific terms)
     * Style/aesthetic (5-7 terms)
     * Mood/emotion (5-7 terms)
     * Colors present (3-5 terms)
     * Technical aspects (3-5 terms)
     * Use cases (5-7 terms)
     * Related concepts (5-7 terms)
     * Seasonal/temporal (2-3 if applicable)
     * ${mediaType === 'video' ? 'Motion/action terms (5-7 terms)' : 'Composition terms (3-5 terms)'}
   - Arrange from MOST to LEAST specific
   - Use single words AND 2-3 word phrases

Respond ONLY with this exact JSON:
{
  "prompt": "your unique AI generation prompt",
  "title": "Your Unique SEO Title Under ${titleMax} Chars",
  "description": "Your detailed, keyword-rich description...",
  "tags": "specific-term-1, unique-keyword-2, style-term-3, ..."
}`;

  return { systemPrompt, userPrompt };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, imageName, mediaType = 'image', settings } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No media provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${mediaType}: ${imageName}`);
    console.log("Settings received:", JSON.stringify(settings));

    // Use Lovable AI Gateway
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use default settings if not provided
    const metadataSettings: MetadataSettings = settings || {
      exportPlatform: 'adobe_stock',
      titleLength: 60,
      titleLengthMix: true,
      descriptionLength: 200,
      descriptionLengthFixed: false,
      keywordsCount: 49,
      imageType: 'none',
      prefix: '',
      suffix: '',
      negativeTitleWords: '',
      negativeKeywords: '',
    };

    const { systemPrompt, userPrompt } = buildPrompt(mediaType, metadataSettings);

    // Call Lovable AI Gateway with Gemini vision model
    console.log("Calling Lovable AI Gateway...");
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userPrompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI processing failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response received successfully");

    const aiResponse = await response.json();
    const textContent = aiResponse.choices?.[0]?.message?.content;

    if (!textContent) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let analysisResult: AnalysisResult;
    try {
      // Remove any markdown code blocks if present
      const cleanedText = textContent.replace(/```json\n?|\n?```/g, "").trim();
      analysisResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", textContent);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          prompt: analysisResult.prompt,
          title: analysisResult.title,
          description: analysisResult.description,
          tags: analysisResult.tags,
          imageName: imageName || `uploaded-${mediaType}`,
          mediaType: mediaType,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in analyze-image function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

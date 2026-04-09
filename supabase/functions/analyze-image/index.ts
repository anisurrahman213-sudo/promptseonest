/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // 10x faster - increased from 30 to 100 requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count, resetIn: record.resetTime - now };
}

interface AnalysisResult {
  prompt: string;
  title: string;
  description: string;
  tags: string;
  category: string;
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
  categoryLanguage?: string;
}

// Forbidden words that should NEVER appear in stock metadata
const FORBIDDEN_WORDS = [
  'watermark', 'watermarked', 'logo', 'signature', 'copyright', 'copyrighted',
  'text overlay', 'overlay text', 'branded', 'branding', 'stamp', 'stamped',
  'marked', 'marker', 'insignia', 'emblem', 'seal', 'stock photo', 'stock image',
  'sample', 'preview', 'demo', 'placeholder', 'licensed', 'royalty'
];

const FORBIDDEN_PATTERNS = [
  /\bwater\s*mark(ed|s|ing)?\b/gi,
  /\blogo(s|'s)?\b/gi,
  /\bcopyright(ed)?\b/gi,
  /\bsignature(s)?\b/gi,
  /\btext\s+overlay(s)?\b/gi,
  /\bbrand(ed|ing|s)?\b/gi,
  /\bstamp(ed|s)?\b/gi,
  /\bstock\s+(photo|image)(s)?\b/gi,
  /\bsample\s*(image|photo)?\b/gi,
  /\bplaceholder\b/gi,
];

function removeForbiddenWords(text: string): string {
  if (!text) return text;
  let cleaned = text;
  
  for (const word of FORBIDDEN_WORDS) {
    const regex = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  
  for (const pattern of FORBIDDEN_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').replace(/,\s*$/g, '').replace(/^\s*,/g, '').trim();
}

function cleanTags(tags: string): string {
  if (!tags) return tags;
  const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
  const cleanedTags = tagList.filter(tag => {
    const lowerTag = tag.toLowerCase();
    return !FORBIDDEN_WORDS.some(word => lowerTag.includes(word.toLowerCase()));
  });
  return cleanedTags.join(', ');
}

function findForbiddenWords(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const word of FORBIDDEN_WORDS) {
    const regex = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) found.push(...matches);
  }
  return [...new Set(found)];
}

const platformNames: Record<string, string> = {
  adobe_stock: "Adobe Stock",
  shutterstock: "Shutterstock",
  freepik: "Freepik",
  getty: "Getty Images",
  custom: "Stock Marketplaces",
};

// Stock photo categories based on major platforms (Adobe Stock, Shutterstock, etc.)
const stockCategories = [
  "Abstract", "Animals/Wildlife", "Architecture", "Arts", "Backgrounds/Textures",
  "Beauty/Fashion", "Business", "Celebrities", "Editorial", "Education",
  "Food and Drink", "Healthcare/Medical", "Holidays", "Industrial", "Interiors",
  "Landmarks", "Lifestyle", "Nature", "Objects", "Parks/Outdoor",
  "People", "Religion", "Science", "Signs/Symbols", "Sports/Recreation",
  "Technology", "Transportation", "Travel", "Vintage"
];

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

  const videoAnalysisNote = mediaType === 'video' 
    ? `\n\nIMPORTANT: This is a MULTI-FRAME GRID showing 6 different moments from the video at different timestamps. Analyze ALL frames together to understand:
- The complete narrative/story arc
- Scene transitions and changes
- Movement patterns and action flow
- Visual consistency and style throughout
- Key moments and highlights`
    : '';

  const userPrompt = `Analyze this ${mediaType === 'video' ? 'VIDEO (shown as a grid of 6 frames from different timestamps)' : 'image'} and generate HIGHLY UNIQUE, PLATFORM-OPTIMIZED metadata for ${platform}.${videoAnalysisNote}

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
${mediaType === 'video' ? '- Describe the COMPLETE video content based on all 6 frames, not just individual frames' : ''}

Generate the following:

1. **AI ${mediaType === 'video' ? 'Video' : 'Image'} Prompt** (100-150 words):
   - Write a DETAILED, PROFESSIONAL prompt for AI generators (Midjourney, DALL-E, Stable Diffusion, Runway, Pika)
   - Include: exact style (photorealistic/illustration/3D), lighting type, camera angle, lens, color palette, mood, atmosphere
   - ${mediaType === 'video' ? 'Include: motion description based on frame sequence, camera movement, scene transitions, pacing, and action flow' : 'Include: composition, focal point, depth of field'}
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

5. **Category** (exactly one from list):
   Choose the MOST APPROPRIATE category from: ${stockCategories.join(', ')}
   - Select based on the PRIMARY subject matter
   - If multiple apply, choose the most specific one

Respond ONLY with this exact JSON:
{
  "prompt": "your unique AI generation prompt",
  "title": "Your Unique SEO Title Under ${titleMax} Chars",
  "description": "Your detailed, keyword-rich description...",
  "tags": "specific-term-1, unique-keyword-2, style-term-3, ...",
  "category": "CategoryName"
}`;

  return { systemPrompt, userPrompt };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user identifier for rate limiting (from auth header or IP)
    const authHeader = req.headers.get("authorization") || "";
    const userIdentifier = authHeader.replace("Bearer ", "").slice(0, 20) || 
                          req.headers.get("x-forwarded-for") || 
                          "anonymous";

    // Check rate limit
    const rateLimit = checkRateLimit(userIdentifier);
    
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for: ${userIdentifier}`);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please wait before making more requests.",
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000))
          } 
        }
      );
    }

    const { imageBase64, imageName, mediaType = 'image', settings } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No media provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean and validate base64 data
    let cleanedBase64 = imageBase64.trim();
    
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    if (cleanedBase64.includes(",") && cleanedBase64.startsWith("data:")) {
      cleanedBase64 = cleanedBase64.split(",")[1];
    }
    
    // Remove any whitespace/newlines that might have been introduced
    cleanedBase64 = cleanedBase64.replace(/\s/g, "");
    
    // Basic validation - check if it looks like valid base64
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanedBase64)) {
      console.error("Invalid base64 string detected");
      return new Response(
        JSON.stringify({ error: "Invalid image data format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check minimum size (a valid image should be at least a few KB)
    if (cleanedBase64.length < 100) {
      console.error("Base64 data too small:", cleanedBase64.length);
      return new Response(
        JSON.stringify({ error: "Image data is too small or corrupted" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Rate limit OK - Remaining: ${rateLimit.remaining}`);
    console.log(`Base64 data length: ${cleanedBase64.length} chars`);

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

    // Call Lovable AI Gateway with retry logic for rate limits
    const MAX_RETRIES = 3;
    let response: Response | null = null;
    let lastError = "";

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`Calling Lovable AI Gateway... (attempt ${attempt}/${MAX_RETRIES})`);
      
      response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
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
                      url: `data:image/jpeg;base64,${cleanedBase64}`,
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

      if (response.ok) break;

      const errorText = await response.text();
      lastError = errorText;
      console.error(`AI Gateway error (attempt ${attempt}):`, response.status, errorText);

      if (response.status === 429 && attempt < MAX_RETRIES) {
        const backoffMs = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s
        console.log(`Rate limited. Retrying in ${backoffMs}ms...`);
        await new Promise(r => setTimeout(r, backoffMs));
        continue;
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For non-retryable errors, break immediately
      if (response.status !== 429) break;
    }

    if (!response || !response.ok) {
      if (response?.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded after retries. Please try again in a minute." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI processing failed", details: lastError }),
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

    // Parse the JSON response with robust handling
    let analysisResult: AnalysisResult;
    try {
      // Remove markdown code blocks and clean up the response
      let cleanedText = textContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      
      // Try to extract JSON if there's extra text before/after
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      analysisResult = JSON.parse(cleanedText);
      
      // Validate required fields
      if (!analysisResult.prompt || !analysisResult.title || !analysisResult.description || !analysisResult.tags) {
        throw new Error("Missing required fields in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", textContent.substring(0, 500));
      
      // Attempt to extract data manually if JSON parse fails
      try {
        const promptMatch = textContent.match(/"prompt"\s*:\s*"([^"]+)"/);
        const titleMatch = textContent.match(/"title"\s*:\s*"([^"]+)"/);
        const descMatch = textContent.match(/"description"\s*:\s*"([^"]+)"/);
        const tagsMatch = textContent.match(/"tags"\s*:\s*"([^"]+)"/);
        const categoryMatch = textContent.match(/"category"\s*:\s*"([^"]+)"/);
        
        if (promptMatch && titleMatch && descMatch && tagsMatch) {
          analysisResult = {
            prompt: promptMatch[1],
            title: titleMatch[1],
            description: descMatch[1],
            tags: tagsMatch[1],
            category: categoryMatch ? categoryMatch[1] : "Objects",
          };
          console.log("Recovered data via regex extraction");
        } else {
          throw new Error("Could not extract fields");
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Apply content quality filter - remove forbidden words
    const filteredPrompt = removeForbiddenWords(analysisResult.prompt);
    const filteredTitle = removeForbiddenWords(analysisResult.title);
    const filteredDescription = removeForbiddenWords(analysisResult.description);
    const filteredTags = cleanTags(analysisResult.tags);
    
    // Collect any words that were filtered
    const allFilteredWords = [
      ...findForbiddenWords(analysisResult.prompt),
      ...findForbiddenWords(analysisResult.title),
      ...findForbiddenWords(analysisResult.description),
      ...findForbiddenWords(analysisResult.tags),
    ];
    const uniqueFilteredWords = [...new Set(allFilteredWords)];
    
    if (uniqueFilteredWords.length > 0) {
      console.log(`⚠️ Filtered forbidden words: ${uniqueFilteredWords.join(', ')}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          prompt: filteredPrompt,
          title: filteredTitle,
          description: filteredDescription,
          tags: filteredTags,
          category: stockCategories.includes(analysisResult.category) ? analysisResult.category : "Objects",
          imageName: imageName || `uploaded-${mediaType}`,
          mediaType: mediaType,
          wasFiltered: uniqueFilteredWords.length > 0,
          filteredWords: uniqueFilteredWords,
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

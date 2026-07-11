/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { requireUser } from "../_shared/auth.ts";
import { hasSufficientCredits } from "../_shared/credits.ts";
import { APP_CONTEXT } from "../_shared/app-knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_BATCH_SIZE = 50;

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 200;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) rateLimitMap.delete(key);
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

interface BatchItem {
  imageBase64: string;
  imageName: string;
  mediaType?: string;
}

interface BatchResult {
  index: number;
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}

// Forbidden words that should NEVER appear in stock metadata
const FORBIDDEN_WORDS = [
  'watermark', 'watermarked', 'logo', 'signature', 'copyright', 'copyrighted',
  'text overlay', 'overlay text', 'branded', 'branding', 'stamp', 'stamped',
  'marked', 'marker', 'insignia', 'emblem', 'seal', 'stock photo', 'stock image',
  'sample', 'preview', 'demo', 'placeholder', 'licensed', 'royalty',
  // Additional Adobe Stock rejection triggers
  'qr code', 'barcode', 'bar code', 'trademark', 'trademarked', 'tm',
  'caption', 'subtitle', 'lettering', 'inscription', 'tagline',
  'editorial', 'newsworthy', 'press', 'celebrity', 'celebrities',
  'nsfw', 'nude', 'nudity', 'explicit'
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
  /\bqr\s*code(s)?\b/gi,
  /\bbar\s*code(s)?\b/gi,
  /\btrademark(ed|s)?\b/gi,
  /\bcaption(s|ed)?\b/gi,
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

const stockCategories = [
  "Abstract", "Animals/Wildlife", "Architecture", "Arts", "Backgrounds/Textures",
  "Beauty/Fashion", "Business", "Celebrities", "Editorial", "Education",
  "Food and Drink", "Healthcare/Medical", "Holidays", "Industrial", "Interiors",
  "Landmarks", "Lifestyle", "Nature", "Objects", "Parks/Outdoor",
  "People", "Religion", "Science", "Signs/Symbols", "Sports/Recreation",
  "Technology", "Transportation", "Travel", "Vintage"
];

// Adobe Stock CSV requires numeric category 1-21. Map our 29 category names to closest Adobe slot.
const ADOBE_CATEGORY_MAP: Record<string, number> = {
  "Abstract": 8, "Animals/Wildlife": 1, "Architecture": 2, "Arts": 8,
  "Backgrounds/Textures": 8, "Beauty/Fashion": 12, "Business": 3, "Celebrities": 13,
  "Editorial": 17, "Education": 9, "Food and Drink": 7, "Healthcare/Medical": 16,
  "Holidays": 15, "Industrial": 10, "Interiors": 2, "Landmarks": 21,
  "Lifestyle": 12, "Nature": 5, "Objects": 8, "Parks/Outdoor": 11,
  "People": 13, "Religion": 15, "Science": 16, "Signs/Symbols": 8,
  "Sports/Recreation": 18, "Technology": 19, "Transportation": 20, "Travel": 21,
  "Vintage": 8
};

// Generic high-value commercial keywords used as padding when AI returns too few
const FALLBACK_KEYWORDS = [
  'professional', 'commercial', 'creative', 'modern', 'contemporary', 'design',
  'concept', 'lifestyle', 'minimal', 'aesthetic', 'composition', 'visual',
  'detailed', 'editorial', 'corporate', 'premium', 'quality', 'inspiration',
  'background', 'closeup', 'macro', 'natural', 'vibrant', 'elegant', 'stylish',
  'trendy', 'authentic', 'organic', 'sophisticated', 'refined'
];

const imageTypePrefixes: Record<string, string> = {
  none: "",
  photo: "Photo of ",
  illustration: "Illustration of ",
  vector: "Vector illustration of ",
  "3d_render": "3D Render of ",
  ai_generated: "AI Generated ",
};

// Known words dictionary for compound splitting
const knownWords = new Set([
  'solar', 'panel', 'wind', 'turbine', 'energy', 'power', 'plant', 'climate',
  'technology', 'module', 'background', 'landscape', 'nature', 'environment',
  'green', 'clean', 'renewable', 'sustainable', 'industrial', 'urban', 'rural',
  'aerial', 'macro', 'abstract', 'digital', 'modern', 'vintage', 'professional',
  'commercial', 'creative', 'outdoor', 'indoor', 'transmission', 'generation',
  'infrastructure', 'conservation', 'innovation', 'efficiency', 'ecological',
  'biological', 'agricultural', 'architectural', 'atmospheric', 'panoramic',
  'photovoltaic', 'electricity', 'voltage', 'pylon', 'grid', 'utility',
  'structure', 'engineering', 'resource', 'concept', 'system', 'array',
  'horizon', 'industry', 'ecology', 'carbon', 'neutral', 'emission',
  'footprint', 'oriented', 'solution', 'farm', 'field', 'forest', 'mountain',
  'ocean', 'river', 'desert', 'tropical', 'arctic', 'wildlife', 'animal',
  'flower', 'tree', 'building', 'house', 'office', 'factory', 'bridge',
  'road', 'vehicle', 'transport', 'food', 'health', 'medical', 'science',
  'education', 'finance', 'business', 'market', 'global', 'world', 'city',
  'night', 'light', 'shadow', 'texture', 'pattern', 'color', 'design',
  'space', 'water', 'fire', 'earth', 'metal', 'glass', 'wood', 'stone',
]);

function splitCompound(word: string): string[] {
  const parts = word.replace(/[-_]/g, ' ').split(/\s+/);
  const out: string[] = [];
  for (const part of parts) {
    const camelSplit = part.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');
    if (camelSplit.length > 1) { out.push(...camelSplit); continue; }
    const lower = part.toLowerCase();
    if (lower.length >= 8) {
      let found = false;
      for (let i = 4; i <= lower.length - 4; i++) {
        const left = lower.slice(0, i);
        const right = lower.slice(i);
        if (knownWords.has(left) && knownWords.has(right)) {
          out.push(left, right);
          found = true;
          break;
        }
      }
      if (!found) out.push(part);
    } else {
      out.push(part);
    }
  }
  return out;
}

function postProcessTags(filteredTags: string, settings: MetadataSettings): string {
  const isAdobeStock = !settings.exportPlatform || settings.exportPlatform === 'adobe_stock';
  const maxKw = settings.keywordsCount || 49;
  const tagList = filteredTags.split(',').map((t: string) => t.trim()).filter(Boolean);

  // For Adobe Stock: enforce single-word, split compounds, lowercase
  const processed = isAdobeStock
    ? tagList.flatMap((k: string) => splitCompound(k)).map((k: string) => k.toLowerCase().trim()).filter((k: string) => k.length > 1)
    : tagList.map((k) => k.trim()).filter((k) => k.length > 1);

  // Dedup preserving order (first occurrence = highest priority for Adobe ranking)
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const k of processed) {
    const key = k.toLowerCase();
    if (!seen.has(key)) { seen.add(key); unique.push(k); }
  }

  // Pad with high-value fallback keywords if AI returned fewer than maxKw
  if (unique.length < maxKw) {
    for (const fb of FALLBACK_KEYWORDS) {
      if (unique.length >= maxKw) break;
      if (!seen.has(fb)) { seen.add(fb); unique.push(fb); }
    }
  }

  return unique.slice(0, maxKw).join(', ');
}

// Hard-truncate title at max characters, breaking at word boundary when possible
function truncateTitle(title: string, maxLen: number): string {
  if (!title || title.length <= maxLen) return title;
  const cut = title.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.7 ? cut.slice(0, lastSpace) : cut).trim();
}

function buildPrompt(mediaType: string, settings: MetadataSettings, exif?: string): { systemPrompt: string; userPrompt: string } {
  const platform = platformNames[settings.exportPlatform] || "Stock Marketplaces";
  const titleMax = settings.titleLength || 60;
  const descLength = settings.descriptionLength || 200;
  const keywordCount = settings.keywordsCount || 49;
  const imageTypePrefix = imageTypePrefixes[settings.imageType] || "";
  
  const titleLengthNote = settings.titleLengthMix 
    ? `(${titleMax - 10} to ${titleMax} characters ideal)` 
    : `(exactly ${titleMax} characters)`;

  const descLengthNote = settings.descriptionLengthFixed 
    ? `(exactly ${descLength} characters)` 
    : `(${descLength - 50} to ${descLength} characters)`;

  const prefixInstruction = settings.prefix ? `\n   - START the title with: "${settings.prefix}"` : "";
  const suffixInstruction = settings.suffix ? `\n   - END the title with: "${settings.suffix}"` : "";
  const negativeTitleInstruction = settings.negativeTitleWords ? `\n   - AVOID these words in title: ${settings.negativeTitleWords}` : "";
  const negativeKeywordsInstruction = settings.negativeKeywords ? `\n   - EXCLUDE these keywords: ${settings.negativeKeywords}` : "";

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

  const exifBlock = exif
    ? `\n\nCAMERA EXIF METADATA (factual ground-truth — use to enrich keywords/description with accurate camera, lens, lighting, time-of-day, depth-of-field, and location concepts):\n${exif}\n`
    : '';

  const userPrompt = `Analyze this ${mediaType === 'video' ? 'VIDEO (shown as a grid of 6 frames from different timestamps)' : 'image'} and generate HIGHLY UNIQUE, PLATFORM-OPTIMIZED metadata for ${platform}.${videoAnalysisNote}${exifBlock}

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
   - **CRITICAL: Title MUST perfectly and accurately describe EXACTLY what is visible in the image/video.**
   - Use IELTS Band 8-9 level academic/professional English
   - MANDATORY VOCABULARY UPGRADES for title:
     * big → monumental/expansive/substantial
     * nice → compelling/striking/distinguished
     * good → exceptional/superior/optimum
     * show → illustrate/depict/portray
     * old → aged/weathered/historical
     * new → contemporary/modern/innovative
     * dark → obscured/shadowed/silhouetted
     * bright → luminous/radiant/vivid
     * wide → expansive/panoramic/sweeping
     * high → elevated/towering/monumental
   - Use academic descriptors: dramatic, atmospheric, expansive, striking, compelling, distinctive, monumental, panoramic, sweeping
   - Structure: [Academic Adjective] + [Subject] + [Technical Detail] + [Setting]
   - ${imageTypePrefix ? `Start with "${imageTypePrefix}" after any prefix` : 'Lead with the MOST SPECIFIC, UNIQUE aspect'}
   - Include primary keyword naturally
   - NO generic adjectives (beautiful, nice, good, amazing, stunning) — use precise academic words
   - Example: Instead of "Beautiful sunset" → "${settings.prefix ? settings.prefix + ' ' : ''}${imageTypePrefix}Atmospheric Twilight Cascading Over Mist-Laden Mountain Ridges${settings.suffix ? ' ' + settings.suffix : ''}"
   - Example: Instead of "Big tower in dark sky" → "Monumental Transmission Pylon Silhouetted Against Dramatic Twilight Horizon"

3. **SEO Description** ${descLengthNote}:
   - Write in IELTS Academic Band 8-9 style with sophisticated sentence structures
   - Formal tone throughout with technical terminology relevant to subject matter
   - Varied vocabulary — no word repeated more than twice
   - MANDATORY VOCABULARY UPGRADES for description:
     * use → utilise/employ/incorporate
     * make → generate/produce/construct
     * get → obtain/acquire/attain
     * far → distant/remote/peripheral
     * near → adjacent/proximate/foreground
   - Structure:
     * Sentence 1: Technical subject description
     * Sentence 2: Compositional/visual details
     * Sentence 3: Atmospheric/mood description
     * Sentence 4: Professional use cases (3 minimum)
     * Sentence 5: Commercial value statement
   - ${mediaType === 'video' ? 'Describe motion, transitions, and dynamic elements' : 'Describe visual elements, textures, and artistic qualities'}

4. **Keywords/Tags** (exactly ${keywordCount} unique tags):${negativeKeywordsInstruction}
   - **ABSOLUTE CRITICAL: The FIRST 5 keywords are the MOST IMPORTANT — Adobe Stock gives them the HIGHEST weight in search ranking.**
     * These 5 keywords must PERFECTLY and EXACTLY describe what is in the image
     * Example: For a power line photo → first 5: "pylon, transmission, voltage, infrastructure, silhouette"
     * NOT: "tower, wire, shadow, building, electric" (too informal)
   - **Keywords 6-10: The next 5 highest-selling, most-searched commercial terms** on ${platform}
   - MANDATORY: Use technically accurate, Latinate/academic single words:
     * pylon (not tower), transmission (not wire), silhouette (not shadow)
     * twilight (not almost dark), infrastructure (not building)
     * atmospheric (not cloudy), panoramic (not wide), voltage (not electric)
   - Avoid informal or colloquial words throughout
   - After the first 10, continue with more specific/niche keywords
   - NO DUPLICATE CONCEPTS
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
   - Arrange: FIRST 5 = exact image description, 6-10 = best-selling terms, then MOST to LEAST specific
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

function cleanBase64(imageBase64: string): string | null {
  let cleaned = imageBase64.trim();
  if (cleaned.includes(",") && cleaned.startsWith("data:")) {
    cleaned = cleaned.split(",")[1];
  }
  cleaned = cleaned.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) return null;
  if (cleaned.length < 100) return null;
  return cleaned;
}

function processAnalysisResult(result: AnalysisResult, settings: MetadataSettings, imageName: string, mediaType: string) {
  const filteredPrompt = removeForbiddenWords(result.prompt);
  let filteredTitle = removeForbiddenWords(result.title);
  const filteredDescription = removeForbiddenWords(result.description);
  let filteredTags = cleanTags(result.tags);
  filteredTags = postProcessTags(filteredTags, settings);

  // Hard-enforce title max length (AI sometimes overshoots)
  const titleMax = settings.titleLength || 70;
  filteredTitle = truncateTitle(filteredTitle, titleMax);

  const allFilteredWords = [
    ...findForbiddenWords(result.prompt),
    ...findForbiddenWords(result.title),
    ...findForbiddenWords(result.description),
    ...findForbiddenWords(result.tags),
  ];
  const uniqueFilteredWords = [...new Set(allFilteredWords)];

  if (uniqueFilteredWords.length > 0) {
    console.log(`⚠️ Filtered forbidden words: ${uniqueFilteredWords.join(', ')}`);
  }

  const finalCategory = stockCategories.includes(result.category) ? result.category : "Objects";

  return {
    prompt: filteredPrompt,
    title: filteredTitle,
    description: filteredDescription,
    tags: filteredTags,
    category: finalCategory,
    adobeCategory: ADOBE_CATEGORY_MAP[finalCategory] || 8, // numeric 1-21 for Adobe CSV
    imageName: imageName || `uploaded-${mediaType}`,
    mediaType,
    wasFiltered: uniqueFilteredWords.length > 0,
    filteredWords: uniqueFilteredWords,
  };
}

function parseAIResponse(textContent: string): AnalysisResult {
  let cleanedText = textContent
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleanedText = jsonMatch[0];
  
  const result = JSON.parse(cleanedText);
  if (!result.prompt || !result.title || !result.description || !result.tags) {
    throw new Error("Missing required fields");
  }
  return result;
}

function parseAIResponseFallback(textContent: string): AnalysisResult | null {
  const promptMatch = textContent.match(/"prompt"\s*:\s*"([^"]+)"/);
  const titleMatch = textContent.match(/"title"\s*:\s*"([^"]+)"/);
  const descMatch = textContent.match(/"description"\s*:\s*"([^"]+)"/);
  const tagsMatch = textContent.match(/"tags"\s*:\s*"([^"]+)"/);
  const categoryMatch = textContent.match(/"category"\s*:\s*"([^"]+)"/);
  
  if (promptMatch && titleMatch && descMatch && tagsMatch) {
    return {
      prompt: promptMatch[1],
      title: titleMatch[1],
      description: descMatch[1],
      tags: tagsMatch[1],
      category: categoryMatch ? categoryMatch[1] : "Objects",
    };
  }
  return null;
}

async function callAiGateway(
  lovableApiKey: string,
  systemPrompt: string,
  userPrompt: string,
  cleanedBase64: string,
): Promise<{ ok: boolean; data?: AnalysisResult; error?: string; code?: string }> {
  const MAX_RETRIES = 5;
  const INITIAL_BACKOFF_MS = 800;
  const MAX_BACKOFF_MS = 8000;
  let response: Response | null = null;
  let lastError = "";
  let lastStatus: number | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: APP_CONTEXT + "\n\n" + systemPrompt },
            { role: "user", content: [
                { type: "text", text: userPrompt },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanedBase64}` } },
              ],
            },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        }),
      });

      if (response.ok) break;

      lastStatus = response.status;
      const errorText = await response.text();
      lastError = errorText;

      if (response.status === 400 || response.status === 403) {
        return { ok: false, error: "AI gateway request was rejected", code: "GEMINI_KEY_INVALID" };
      }

      if (response.status === 402) {
        return { ok: false, error: "AI credits exhausted", code: "AI_CREDITS_EXHAUSTED" };
      }

      const isRetryable = response.status === 429 || response.status >= 500;
      if (!isRetryable || attempt === MAX_RETRIES) break;

      const backoffMs = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
      const jitterMs = Math.floor(Math.random() * 300);
      await new Promise((resolve) => setTimeout(resolve, backoffMs + jitterMs));
    } catch (fetchError) {
      lastError = fetchError instanceof Error ? fetchError.message : "AI gateway request failed";
      if (attempt === MAX_RETRIES) break;
      const backoffMs = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
      await new Promise((resolve) => setTimeout(resolve, backoffMs + Math.floor(Math.random() * 300)));
    }
  }

  if (!response || !response.ok) {
    if (lastStatus === 429) {
      return { ok: false, error: "AI is temporarily busy", code: "RATE_LIMITED" };
    }
    return { ok: false, error: lastError || "AI processing failed", code: "AI_PROCESSING_FAILED" };
  }

  const aiResponse = await response.json();
  const choice = aiResponse.choices?.[0];
  if (choice?.finish_reason === "length") {
    return { ok: false, error: "Gemini response was truncated. Please retry.", code: "MAX_TOKENS" };
  }
  const textContent = choice?.message?.content?.trim();
  if (!textContent) {
    return { ok: false, error: "No response from Gemini" };
  }

  try {
    const result = parseAIResponse(textContent);
    return { ok: true, data: result };
  } catch {
    const fallback = parseAIResponseFallback(textContent);
    if (fallback) return { ok: true, data: fallback };
    return { ok: false, error: "Failed to parse AI response" };
  }
}

// ============= BATCH PROCESSING =============
async function processBatch(
  items: BatchItem[],
  settings: MetadataSettings,
  lovableApiKey: string,
): Promise<BatchResult[]> {
  const { systemPrompt, userPrompt: baseUserPrompt } = buildPrompt('image', settings);
  
  // Process all items in parallel
  const promises = items.map(async (item, index): Promise<BatchResult> => {
    try {
      const cleaned = cleanBase64(item.imageBase64);
      if (!cleaned) {
        return { index, success: false, error: "Invalid image data" };
      }

      const mediaType = item.mediaType || 'image';
      const { systemPrompt: sp, userPrompt: up } = buildPrompt(mediaType, settings);
      
      const result = await callAiGateway(lovableApiKey, sp, up, cleaned);
      
      if (!result.ok || !result.data) {
        return { index, success: false, error: result.error, code: result.code };
      }

      const processed = processAnalysisResult(result.data, settings, item.imageName, mediaType);
      return { index, success: true, data: processed };
    } catch (err) {
      return { index, success: false, error: err instanceof Error ? err.message : "Processing error" };
    }
  });

  return Promise.all(promises);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated caller — prevents anonymous AI quota drain
  const auth = await requireUser(req, corsHeaders);
  if (!auth.ok) return auth.response;

  try {
    // Per-user rate limit (keyed on real user id from verified JWT)
    const rateLimit = checkRateLimit(auth.userId);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", retryAfter: Math.ceil(rateLimit.resetIn / 1000) }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    const body = await req.json();

    // ============= BATCH MODE =============
    if (body.batch && Array.isArray(body.batch)) {
      const items: BatchItem[] = body.batch;
      if (items.length > MAX_BATCH_SIZE) {
        return new Response(
          JSON.stringify({ error: `Batch size exceeds limit (max ${MAX_BATCH_SIZE} items per request)` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const settings: MetadataSettings = body.settings || {
        exportPlatform: 'adobe_stock', titleLength: 60, titleLengthMix: true,
        descriptionLength: 200, descriptionLengthFixed: false, keywordsCount: 49,
        imageType: 'none', prefix: '', suffix: '', negativeTitleWords: '', negativeKeywords: '',
      };

      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableApiKey) {
        return new Response(
          JSON.stringify({ error: "AI gateway key not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`📦 Batch processing ${items.length} items`);
      const results = await processBatch(items, settings, lovableApiKey);
      console.log(`✅ Batch complete: ${results.filter(r => r.success).length}/${items.length} succeeded`);

      return new Response(
        JSON.stringify({ success: true, batch: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============= SINGLE MODE (backward compatible) =============
    const { imageBase64, imageName, mediaType = 'image', settings, exif } = body;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No media provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanedBase64 = cleanBase64(imageBase64);
    if (!cleanedBase64) {
      return new Response(
        JSON.stringify({ error: "Invalid image data format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI gateway key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const metadataSettings: MetadataSettings = settings || {
      exportPlatform: 'adobe_stock', titleLength: 60, titleLengthMix: true,
      descriptionLength: 200, descriptionLengthFixed: false, keywordsCount: 49,
      imageType: 'none', prefix: '', suffix: '', negativeTitleWords: '', negativeKeywords: '',
    };

    console.log(`Processing ${mediaType}: ${imageName}`);
    const { systemPrompt, userPrompt } = buildPrompt(mediaType, metadataSettings, typeof exif === 'string' ? exif : undefined);
    const aiResult = await callAiGateway(lovableApiKey, systemPrompt, userPrompt, cleanedBase64);

    if (!aiResult.ok || !aiResult.data) {
      if (aiResult.code === "RATE_LIMITED") {
        return new Response(
          JSON.stringify({ success: false, code: "RATE_LIMITED", error: aiResult.error, retryAfter: 60 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResult.code === "AI_CREDITS_EXHAUSTED") {
        return new Response(
          JSON.stringify({ success: false, code: "AI_CREDITS_EXHAUSTED", error: aiResult.error }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, code: aiResult.code, error: aiResult.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processed = processAnalysisResult(aiResult.data, metadataSettings, imageName, mediaType);

    return new Response(
      JSON.stringify({ success: true, data: processed }),
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

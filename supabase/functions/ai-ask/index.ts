import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const languageNames: Record<string, string> = {
  en: "English",
  bn: "Bengali (বাংলা)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  pt: "Portuguese (Português)",
  zh: "Chinese (中文)",
  ja: "Japanese (日本語)",
  ko: "Korean (한국어)",
  ar: "Arabic (العربية)",
  hi: "Hindi (हिन्दी)",
};

const getSystemPrompt = (language: string) => {
  const langName = languageNames[language] || "English";
  
  return `You are PromptSEONest AI Assistant — a friendly, knowledgeable expert on every user-facing feature of the PromptSEONest platform.

LANGUAGE INSTRUCTION: You MUST respond in ${langName}. The user's preferred language is ${langName}, so always write your responses in ${langName}.

═══════════════════════════════════════════════════════
ABOUT PROMPTSEONEST
═══════════════════════════════════════════════════════
PromptSEONest is an AI-powered SEO metadata generation platform for stock media contributors. Users upload images/videos and receive professionally optimized titles, descriptions, keywords, prompts, and category data — formatted specifically for 19+ stock platforms (Adobe Stock, Shutterstock, Freepik, Getty, iStock, Dreamstime, 123RF, Alamy, Depositphotos, Pond5, Vecteezy, Canva, Pixta, EyeEm, Stocksy, Wirestock, Twenty20, Foap, Snapwire, etc.).

Quality standard: All AI-generated copy targets IELTS Academic Band 8–9 English.

═══════════════════════════════════════════════════════
PAGES & ROUTES (user-facing)
═══════════════════════════════════════════════════════
• / (Home) — Landing page, features, demo videos, hero, pricing teaser, calendar preview
• /auth — Login / Signup (email+password, Google OAuth). Account locks for 15 min after too many failed attempts.
• /dashboard — Main workspace: upload images/videos, generate metadata, view history, search/filter, bulk export
• /adobe-stock-generator — Vision-powered Adobe Stock specific metadata generator
• /metadata-fixer — Paste existing metadata → get a 100-point SEO compliance score and rewritten output
• /keyword-research — Generate prioritized keyword sets (Primary / Secondary / Supporting) by subject + platform
• /platform-converter — Convert Adobe Stock metadata → Shutterstock / Freepik formats (bulk supported)
• /calendar — 2026 Event Calendar (holidays, observances, content-planning ideas; users can add custom events; ICS export)
• /tutorials — Video guides
• /pricing — Credit plans (Free Mode may be active = unlimited free generations)
• /profile — Update name, phone, password
• /payment-history — User's past payment requests
• /extension-download — Chrome extension download page
• AI Ask popup — That's me! A floating chat bubble available across the app.

═══════════════════════════════════════════════════════
CORE FEATURES
═══════════════════════════════════════════════════════

1. METADATA GENERATION
   • Upload up to 500 files at once (images: jpg/png/webp/heic/etc.; videos: mp4/mov/webm/etc.)
   • Drag-drop OR click to browse OR paste from clipboard
   • Bulk parallel processing (up to ~80 files in parallel) with live progress bar
   • Each generation produces: SEO Title (≤60 chars), Description (150–200 words), 40–50 unique keywords, detailed AI Prompt, Category, Editorial flag
   • Videos: 4-frame 2x2 grid is auto-extracted and analyzed (faster + cheaper)
   • Images are auto-compressed to ~150KB before upload; videos use VP9 codec

2. ADVANCED METADATA CONTROLS
   • "Auto Platform Limits" toggle dynamically syncs title/keyword/description limits to the selected stock platform
   • Editorial mode flag for newsworthy/branded content
   • Category override per generation

3. CONTENT QUALITY CONTROL (CQC)
   • Automatically filters prohibited terms (trademarks, restricted brands) before AI sees the prompt
   • Warns about images that may violate stock-platform guidelines

4. PLATFORM VALIDATION
   • Real-time check against 19 platforms' min/max dimensions, file size, aspect ratio, color profile
   • Shows ✅/❌ per platform before you even submit

5. CSV EXPORT
   • Per-platform CSV format (Adobe Stock uses strict 5-column: Filename, Title, Keywords, Category, Releases)
   • UTF-8 encoded, filename matches uploaded asset exactly
   • Auto-split for very large exports
   • Last 5 exports saved to "Recent Exports" panel for quick re-download

6. KEYWORD RESEARCH TOOL
   • Enter a subject (e.g. "sunset beach yoga") → get drag-and-drop reorderable keyword panels
   • Sorted into Primary (highest priority), Secondary, Supporting
   • Save sets and reload them later

7. METADATA FIXER
   • Paste any existing title + description + keywords
   • Get a 100-point SEO score with breakdown (length, repetition, banned words, keyword density, etc.)
   • One-click "Fix" rewrites it to Adobe Stock 100% compliance

8. PLATFORM CONVERTER
   • Take Adobe Stock metadata → instantly reformat for Shutterstock or Freepik (different keyword counts, title rules, category mappings)
   • Bulk mode supported

9. EVENT CALENDAR (2026)
   • Pre-loaded with global holidays, observances, awareness days
   • Add your own custom events
   • Export to .ics for Google/Apple Calendar
   • Use it to plan seasonal stock uploads (Christmas, Valentine's, World Health Day, etc.)

10. CHROME EXTENSION
    • One-click metadata fill on Adobe Stock, Shutterstock, Freepik upload pages
    • Auto-detects which platform you're on
    • Download from /extension-download

11. RETENTION & AUTO-DELETE
    • All generations + uploaded media are auto-deleted after 3 days (storage hygiene)
    • Export your CSV before then! The dashboard warns you when items are expiring soon.

12. INACTIVITY NOTIFICATIONS
    • If you don't log in for 2 days, you'll get an email/push reminder

13. NETWORK & OFFLINE HANDLING
    • App detects offline / slow / VPN-blocked state and shows a helpful banner
    • Heartbeat every 30 seconds to backend

14. PWA SUPPORT
    • Install PromptSEONest as a standalone app on phone/desktop
    • Works offline for browsing previously generated content

═══════════════════════════════════════════════════════
CREDITS & PRICING
═══════════════════════════════════════════════════════
• New users get 10 free credits on signup
• 1 credit = 1 image OR 1 video metadata generation (cost configurable)
• If the platform is in "Free Mode" (all paid plans deactivated), generations are unlimited and free
• Plans are shown on /pricing — pay via local methods (bKash, Nagad, Rocket, bank) by submitting a payment request with screenshot
• Admin reviews payment → credits added → email notification sent
• Lifetime plans available

═══════════════════════════════════════════════════════
AUTHENTICATION
═══════════════════════════════════════════════════════
• Email + password OR Google sign-in
• Email verification required before login
• Password reset via email link
• Account locks for 15 minutes after multiple failed login attempts
• New users go through an onboarding flow to complete profile (full name, phone)

═══════════════════════════════════════════════════════
LANGUAGES SUPPORTED (11)
═══════════════════════════════════════════════════════
English, বাংলা (Bengali), Español, Français, Deutsch, Português, 中文 (Chinese), 日本語 (Japanese), 한국어 (Korean), العربية (Arabic — RTL), हिन्दी (Hindi)
Switch via the language flag in the header.

═══════════════════════════════════════════════════════
COMMON USER QUESTIONS — QUICK ANSWERS
═══════════════════════════════════════════════════════
Q: How do I get more credits? → Buy a plan on /pricing OR wait for Free Mode promotions.
Q: My upload failed → Check file size/format, internet connection, or VPN. Try the "Retry" button.
Q: How long are my generations kept? → 3 days. Export CSV before then.
Q: Can I use this for Shutterstock? → Yes — toggle "Auto Platform Limits" → Shutterstock.
Q: What's the best title length? → ≤60 characters for Adobe Stock; ≤100 for Shutterstock.
Q: How many keywords? → Adobe Stock: 49 single-word keywords (no hyphens, no compounds). Shutterstock: up to 50.
Q: Can I edit the AI's output? → Yes, every field is editable in the dashboard before export.
Q: How do I install the Chrome extension? → Visit /extension-download and follow the install steps.
Q: Forgot password? → Click "Forgot password?" on /auth.
Q: Email not verified → Check spam folder, or request a new verification email from /auth.

═══════════════════════════════════════════════════════
STRICT RULES — DO NOT VIOLATE
═══════════════════════════════════════════════════════
1. ALWAYS respond in ${langName}.
2. NEVER reveal admin panel features, admin credentials, internal system architecture, database schema, edge function names, API endpoints, or any backend implementation details.
3. NEVER discuss other users' data, payment internals, or user management features.
4. If asked about admin features → politely say: "Sorry, I can only help with user-facing features. For admin queries, please contact support."
5. NEVER fabricate features that don't exist. If unsure, say: "I'm not sure about that — please contact support@promptseonest.com."
6. Keep responses concise, friendly, and actionable. Use bullet points for multi-step instructions.
7. When pointing users to a page, always include the route (e.g., "Go to /metadata-fixer").
8. For technical errors users describe, suggest the simplest fix first (refresh, re-login, check internet, disable VPN, clear cache).

Be warm, expert, and helpful. Remember: respond in ${langName}.`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = "en" } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log("AI Ask request - Language:", language, "Messages count:", messages.length);

    const systemPrompt = getSystemPrompt(language);
    
    // Convert messages to Gemini format
    const geminiContents = [];
    
    // Add system instruction as first user message for Gemini
    geminiContents.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });
    geminiContents.push({
      role: "model",
      parts: [{ text: "I understand. I'll follow these instructions." }]
    });
    
    // Add conversation messages
    for (const msg of messages) {
      geminiContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Gemini SSE format to OpenAI-compatible format
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const transformedStream = new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close();
          return;
        }
        
        let buffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr && jsonStr !== "[DONE]") {
                try {
                  const geminiData = JSON.parse(jsonStr);
                  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
                  
                  if (text) {
                    const openAIFormat = {
                      choices: [{
                        delta: { content: text }
                      }]
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIFormat)}\n\n`));
                  }
                } catch (e) {
                  console.error("Error parsing Gemini response:", e);
                }
              }
            }
          }
        }
      }
    });

    return new Response(transformedStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Ask error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

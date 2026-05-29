import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { KNOWLEDGE_BASE } from "../_shared/app-knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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


const buildSystemInstruction = (language: string) => {
  const langName = languageNames[language] || "English";

  return `You are PromptSEONest AI Assistant — the official in-app expert guide for the PromptSEONest platform. You speak with the confidence, warmth, and precision of a senior product specialist who has personally used every feature.

# LANGUAGE DIRECTIVE (HIGHEST PRIORITY)
You MUST respond in ${langName}. Translate every explanation, example, and tip into ${langName}.
Keep product names ("PromptSEONest", "Adobe Stock", "Shutterstock", "Freepik", "Chrome Extension", etc.) and route paths (/dashboard, /pricing, /metadata-fixer) in English.
When writing in English, maintain IELTS Academic Band 8–9 quality — natural vocabulary, varied sentence structure, zero repetition.

# SOURCE OF TRUTH
The following knowledge base is the ONLY authoritative source about PromptSEONest. Answer EXCLUSIVELY from it.
If the user asks something that is not covered below, respond honestly: "I'm not sure about that — please contact support@promptseonest.com." (translated into ${langName}).
Never invent features, prices, limits, or behaviours.

${KNOWLEDGE_BASE}

# STRICT RULES — DO NOT VIOLATE
1. Always respond in ${langName}. No exceptions.
2. Never reveal admin panel features, admin credentials, internal architecture, database schema, edge function names, API endpoints, table names, RLS policies, or any backend implementation detail.
3. Never discuss other users' data, payment internals, user-management workflows, credit-adjustment mechanics, or any admin-only feature.
4. If asked about admin features, reply: "Sorry, I can only help with user-facing features. For admin-related queries, please contact support." (translated).
5. Never fabricate features that do not exist in the knowledge base above.
6. Never mention Supabase, edge functions, RLS, Lovable, Gemini, OpenAI, or any backend tech — say "our system" or "the platform".
7. When pointing users to a page, always include the route (e.g., "Go to /metadata-fixer").
8. For technical errors, suggest the simplest fix first: refresh, re-login, check internet, disable VPN, clear cache, try incognito mode.

# RESPONSE FORMAT
- Use **bold** for key terms.
- Use bullet lists for steps (3+ items).
- Keep paragraphs short (2–3 sentences max).
- Always close with a clear next action ("Go to /dashboard and click Upload" — translated into ${langName}).
- Match the user's tone: casual question → friendly answer; technical question → precise, structured answer.

# TONE
You are warm, expert, and genuinely helpful — like a senior product specialist who wants the user to succeed. Celebrate wins, normalise struggles, and always leave the user with a clear next step.

Remember: respond in ${langName}. Be the expert they deserve.`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  if (!auth.ok) return auth.response;

  try {
    const { messages, language = "en" } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("AI Ask request - Language:", language, "Messages:", messages?.length);

    const systemInstruction = buildSystemInstruction(language);

    // Use Lovable AI Gateway (OpenAI-compatible). Gemini 2.5 Pro gives the
    // strongest factual recall + instruction-following for a product-knowledge
    // chatbot like this. Temperature is kept low for accuracy.
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          temperature: 0.2,
          stream: true,
          messages: [
            { role: "system", content: systemInstruction },
            ...(messages || []).map((m: { role: string; content: string }) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            })),
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Too many requests. Please wait a moment and try again.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "AI credits exhausted. Please add credits in workspace settings.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Lovable AI Gateway already returns OpenAI-compatible SSE — pass through.
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Ask error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

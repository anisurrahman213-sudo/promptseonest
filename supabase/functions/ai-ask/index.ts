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
  
  return `You are PromptNest AI Assistant - a helpful, friendly assistant for the PromptNest platform.

LANGUAGE INSTRUCTION: You MUST respond in ${langName}. The user's preferred language is ${langName}, so always write your responses in ${langName}.

About PromptNest:
- PromptNest is an AI-powered SEO metadata generation tool for stock media (images & videos)
- Users can upload images/videos and get AI-generated titles, descriptions, tags, and prompts
- The platform supports multiple stock platforms like Shutterstock, Adobe Stock, Getty Images, etc.
- Users need credits to generate metadata - they get 10 free credits on signup
- There are various pricing plans available on the Pricing page

Key Features:
- AI-powered metadata generation for images and videos
- Multi-platform support with proper formatting for each stock site
- Bulk upload and processing capabilities
- CSV export for easy uploading to stock platforms
- Multi-language support (English, Bengali, Spanish, French, German, Portuguese, Chinese, Japanese, Korean, Arabic, Hindi)

Pages:
- Home (/) - Landing page with features overview
- Dashboard (/dashboard) - Where users upload media and generate metadata
- Pricing (/pricing) - View and purchase credit plans
- Tutorials (/tutorials) - Help videos and guides
- Profile (/profile) - User account settings
- Auth (/auth) - Login/Signup page

IMPORTANT RULES:
1. ALWAYS respond in ${langName} - this is critical!
2. NEVER share any admin-related information, admin panel details, or internal system information
3. NEVER reveal database structure, API endpoints, or technical implementation details
4. NEVER discuss admin credentials, user data, or payment processing internals
5. If asked about admin features, politely say you can only help with user-facing features
6. Keep responses concise and helpful
7. If you don't know something, admit it and suggest contacting support@promptseonest.com

Be friendly, helpful, and guide users to the right features! Remember to respond in ${langName}.`;
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-05-06:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
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

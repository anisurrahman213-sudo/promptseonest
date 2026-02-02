import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are PromptNest AI Assistant - a helpful, friendly assistant for the PromptNest platform.

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
- Multi-language support (English, Bengali, Spanish, French, German, etc.)

Pages:
- Home (/) - Landing page with features overview
- Dashboard (/dashboard) - Where users upload media and generate metadata
- Pricing (/pricing) - View and purchase credit plans
- Tutorials (/tutorials) - Help videos and guides
- Profile (/profile) - User account settings
- Auth (/auth) - Login/Signup page

IMPORTANT RULES:
1. NEVER share any admin-related information, admin panel details, or internal system information
2. NEVER reveal database structure, API endpoints, or technical implementation details
3. NEVER discuss admin credentials, user data, or payment processing internals
4. If asked about admin features, politely say you can only help with user-facing features
5. Keep responses concise and helpful
6. If you don't know something, admit it and suggest contacting support@promptseonest.com

Be friendly, helpful, and guide users to the right features!`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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

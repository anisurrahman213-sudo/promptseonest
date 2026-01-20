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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, imageName } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI Gateway
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert at analyzing images and generating SEO-optimized metadata for stock photography and digital content. You provide detailed, accurate, and professional metadata.`;

    const userPrompt = `Analyze this image and generate the following metadata for stock photo/image SEO purposes:

1. **AI Image Prompt**: Write a detailed, professional prompt that could be used to recreate this image using AI image generators. Include style, lighting, composition, colors, mood, and all visual elements. Make it 100-150 words.

2. **SEO Title**: Create a concise, keyword-rich title under 60 characters that describes the main subject and would rank well in search.

3. **SEO Description**: Write a compelling description of 150-200 words that describes the image in detail, includes relevant keywords naturally, and would help the image rank in search engines.

4. **Tags**: Generate 40-50 relevant, comma-separated tags/keywords that describe the image. Include variations, related concepts, styles, colors, moods, and potential use cases.

Respond in this exact JSON format:
{
  "prompt": "your detailed AI prompt here",
  "title": "your SEO title here",
  "description": "your SEO description here",
  "tags": "tag1, tag2, tag3, ..."
}

Only respond with the JSON, no additional text.`;

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
          imageName: imageName || "uploaded-image",
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

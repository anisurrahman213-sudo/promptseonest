/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Gemini free tier limits (per API key)
const FREE_TIER_DAILY_LIMIT = 1500;
const FREE_TIER_RPM_LIMIT = 15;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Check if key exists
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          configured: false,
          valid: false,
          error: "GEMINI_API_KEY not configured",
          dailyLimit: FREE_TIER_DAILY_LIMIT,
          rpmLimit: FREE_TIER_RPM_LIMIT,
          usedToday: 0,
          remaining: 0,
          checkedAt: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // 2. Validate key by making a tiny test request to Gemini
    let isValid = false;
    let validationError: string | null = null;
    let modelInfo: string | null = null;

    try {
      const testRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
        { method: "GET" },
      );

      if (testRes.ok) {
        const data = await testRes.json();
        isValid = true;
        modelInfo = `${data.models?.length || 0} models available`;
      } else {
        const errText = await testRes.text();
        validationError = `Status ${testRes.status}: ${errText.slice(0, 200)}`;
      }
    } catch (err) {
      validationError = err instanceof Error ? err.message : "Network error";
    }

    // 3. Get today's usage from generations table (each generation = 1 Gemini call)
    let usedToday = 0;
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("generations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString());

      usedToday = count || 0;
    } catch (err) {
      console.error("Failed to fetch usage count:", err);
    }

    const remaining = Math.max(0, FREE_TIER_DAILY_LIMIT - usedToday);
    const usagePercent = Math.round((usedToday / FREE_TIER_DAILY_LIMIT) * 100);

    return new Response(
      JSON.stringify({
        configured: true,
        valid: isValid,
        error: validationError,
        modelInfo,
        dailyLimit: FREE_TIER_DAILY_LIMIT,
        rpmLimit: FREE_TIER_RPM_LIMIT,
        usedToday,
        remaining,
        usagePercent,
        checkedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("check-gemini-status error:", err);
    return new Response(
      JSON.stringify({
        configured: false,
        valid: false,
        error: err instanceof Error ? err.message : "Unknown error",
        checkedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

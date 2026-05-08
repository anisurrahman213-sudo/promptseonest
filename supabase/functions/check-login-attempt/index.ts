/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email } = await req.json();
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP from headers
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    if (action === "check") {
      // Check if account is locked
      const { data: lockData } = await supabase
        .from("login_attempts")
        .select("locked_until, attempt_count")
        .eq("email", normalizedEmail)
        .single();

      if (lockData?.locked_until) {
        const lockedUntil = new Date(lockData.locked_until);
        const now = new Date();
        
        if (lockedUntil > now) {
          const remainingSeconds = Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000);
          const remainingMinutes = Math.ceil(remainingSeconds / 60);
          
          return new Response(
            JSON.stringify({
              locked: true,
              remainingSeconds,
              remainingMinutes,
              message: `Account locked. Try again in ${remainingMinutes} minute(s).`
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ 
          locked: false, 
          attemptsRemaining: MAX_ATTEMPTS - (lockData?.attempt_count || 0)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "record_failure") {
      // Record a failed login attempt
      const { data: existing } = await supabase
        .from("login_attempts")
        .select("*")
        .eq("email", normalizedEmail)
        .single();

      if (existing) {
        // Check if lock has expired, reset if so
        const lockedUntil = existing.locked_until ? new Date(existing.locked_until) : null;
        const now = new Date();
        
        if (lockedUntil && lockedUntil <= now) {
          // Lock expired, reset attempts
          await supabase
            .from("login_attempts")
            .update({
              attempt_count: 1,
              last_attempt_at: now.toISOString(),
              locked_until: null,
              ip_address: clientIp
            })
            .eq("email", normalizedEmail);

          return new Response(
            JSON.stringify({ 
              locked: false, 
              attemptsRemaining: MAX_ATTEMPTS - 1,
              message: `${MAX_ATTEMPTS - 1} attempts remaining`
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Increment attempt count
        const newAttemptCount = existing.attempt_count + 1;
        const shouldLock = newAttemptCount >= MAX_ATTEMPTS;
        const lockUntil = shouldLock 
          ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000).toISOString()
          : null;

        await supabase
          .from("login_attempts")
          .update({
            attempt_count: newAttemptCount,
            last_attempt_at: now.toISOString(),
            locked_until: lockUntil,
            ip_address: clientIp
          })
          .eq("email", normalizedEmail);

        if (shouldLock) {
          console.log(`Account locked for email: ${normalizedEmail} from IP: ${clientIp}`);
          return new Response(
            JSON.stringify({
              locked: true,
              remainingSeconds: LOCK_DURATION_MINUTES * 60,
              remainingMinutes: LOCK_DURATION_MINUTES,
              message: `Too many failed attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.`
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ 
            locked: false, 
            attemptsRemaining: MAX_ATTEMPTS - newAttemptCount,
            message: `${MAX_ATTEMPTS - newAttemptCount} attempts remaining`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // First failed attempt
        await supabase
          .from("login_attempts")
          .insert({
            email: normalizedEmail,
            ip_address: clientIp,
            attempt_count: 1,
            last_attempt_at: new Date().toISOString()
          });

        return new Response(
          JSON.stringify({ 
            locked: false, 
            attemptsRemaining: MAX_ATTEMPTS - 1,
            message: `${MAX_ATTEMPTS - 1} attempts remaining`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "reset") {
      // SECURITY: require a valid JWT — proves the caller actually signed in
      // before we clear failed-attempt counters. Without this, anyone could
      // wipe an account's lockout to brute-force indefinitely.
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Reset attempts on successful login
      await supabase
        .from("login_attempts")
        .delete()
        .eq("email", normalizedEmail);

      console.log(`Login attempts reset for email: ${normalizedEmail}`);
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-login-attempt:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

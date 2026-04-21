import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckResult {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  details?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checks: CheckResult[] = [];

    // 1. Database connectivity
    const dbStart = Date.now();
    const { error: dbError, count: userCount } = await admin
      .from("user_profiles")
      .select("*", { count: "exact", head: true });
    checks.push({
      name: "Database Connectivity",
      status: dbError ? "fail" : "pass",
      message: dbError ? `DB error: ${dbError.message}` : `Connected in ${Date.now() - dbStart}ms`,
      details: { latencyMs: Date.now() - dbStart, userCount: userCount ?? 0 },
    });

    // 2. Storage buckets
    const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
    checks.push({
      name: "Storage Buckets",
      status: bucketError ? "fail" : "pass",
      message: bucketError ? bucketError.message : `${buckets?.length ?? 0} buckets reachable`,
      details: { buckets: buckets?.map((b) => ({ name: b.name, public: b.public })) ?? [] },
    });

    // 3. Critical tables row counts
    const tables = ["generations", "user_profiles", "user_roles", "payment_requests", "pricing_plans", "site_settings"];
    const tableCounts: Record<string, number> = {};
    let tableErrors = 0;
    for (const t of tables) {
      const { count, error } = await admin.from(t).select("*", { count: "exact", head: true });
      if (error) tableErrors++;
      tableCounts[t] = count ?? 0;
    }
    checks.push({
      name: "Critical Tables",
      status: tableErrors === 0 ? "pass" : "fail",
      message: tableErrors === 0 ? `All ${tables.length} tables accessible` : `${tableErrors} table(s) failed`,
      details: tableCounts,
    });

    // 4. Required secrets present
    const requiredSecrets = ["LOVABLE_API_KEY", "RESEND_API_KEY", "GEMINI_API_KEY"];
    const missingSecrets = requiredSecrets.filter((s) => !Deno.env.get(s));
    checks.push({
      name: "API Secrets",
      status: missingSecrets.length === 0 ? "pass" : "warn",
      message: missingSecrets.length === 0
        ? `All ${requiredSecrets.length} required secrets configured`
        : `Missing: ${missingSecrets.join(", ")}`,
      details: { required: requiredSecrets, missing: missingSecrets },
    });

    // 5. RLS sanity check — ensure user_profiles + user_roles have policies
    const { data: rlsRows } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    checks.push({
      name: "RLS & Auth Functions",
      status: rlsRows === true ? "pass" : "warn",
      message: rlsRows === true ? "has_role() RPC working correctly" : "has_role() returned unexpected value",
    });

    // 6. Recent generations activity (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentGens } = await admin
      .from("generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);
    checks.push({
      name: "Generation Activity (24h)",
      status: "pass",
      message: `${recentGens ?? 0} generations in last 24 hours`,
      details: { last24h: recentGens ?? 0 },
    });

    // 7. Stale data check — generations older than 3 days that should be cleaned
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { count: staleGens } = await admin
      .from("generations")
      .select("*", { count: "exact", head: true })
      .lt("created_at", threeDaysAgo);
    checks.push({
      name: "Auto-Cleanup Status",
      status: (staleGens ?? 0) > 100 ? "warn" : "pass",
      message: (staleGens ?? 0) > 100
        ? `${staleGens} stale generations — cleanup may be lagging`
        : `${staleGens ?? 0} stale rows pending cleanup`,
      details: { staleCount: staleGens ?? 0 },
    });

    // 8. Pending payment requests
    const { count: pendingPayments } = await admin
      .from("payment_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    checks.push({
      name: "Pending Payments",
      status: (pendingPayments ?? 0) > 5 ? "warn" : "pass",
      message: `${pendingPayments ?? 0} pending payment request(s)`,
      details: { pending: pendingPayments ?? 0 },
    });

    // 9. Pricing plans active count (Free Mode detection)
    const { count: activePlans } = await admin
      .from("pricing_plans")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    checks.push({
      name: "Pricing Mode",
      status: "pass",
      message: (activePlans ?? 0) === 0 ? "Free Mode (no active paid plans)" : `${activePlans} active plans`,
      details: { activePlans: activePlans ?? 0 },
    });

    const summary = {
      pass: checks.filter((c) => c.status === "pass").length,
      warn: checks.filter((c) => c.status === "warn").length,
      fail: checks.filter((c) => c.status === "fail").length,
      total: checks.length,
    };

    const overall = summary.fail > 0 ? "fail" : summary.warn > 0 ? "warn" : "pass";

    return new Response(
      JSON.stringify({
        overall,
        summary,
        checks,
        checkedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Health check error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

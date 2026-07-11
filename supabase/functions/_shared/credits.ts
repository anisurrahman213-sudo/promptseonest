import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Pre-flight credit balance check that mirrors the logic of the
 * `deduct_credit()` SQL function WITHOUT mutating any state.
 *
 * Returns { ok: true } when the user is allowed to trigger a paid AI call:
 *  - No active pricing plan exists (free mode), OR
 *  - Configured credit cost is 0, OR
 *  - The user's current balance >= configured credit cost.
 *
 * Returns { ok: false } when the AI call must be blocked BEFORE spending
 * gateway credits.
 */
export async function hasSufficientCredits(
  userId: string,
): Promise<{ ok: true } | { ok: false; reason: "no_credits"; balance: number; cost: number }> {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. If no pricing plan is active -> free mode, always allow.
  const { data: activePlan } = await admin
    .from("pricing_plans")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!activePlan) return { ok: true };

  // 2. Resolve dynamic per-generation credit cost from site_settings.
  const { data: costSetting } = await admin
    .from("site_settings")
    .select("setting_value")
    .eq("setting_key", "credit_per_generation")
    .maybeSingle();

  const cost = costSetting?.setting_value ? parseInt(costSetting.setting_value, 10) || 1 : 1;
  if (cost <= 0) return { ok: true };

  // 3. Check the caller's current balance.
  const { data: profile } = await admin
    .from("user_profiles")
    .select("credits")
    .eq("user_id", userId)
    .maybeSingle();

  const balance = profile?.credits ?? 0;
  if (balance >= cost) return { ok: true };

  return { ok: false, reason: "no_credits", balance, cost };
}

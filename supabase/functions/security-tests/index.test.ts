/**
 * Automated security tests
 *
 * Verifies that:
 *  - Sensitive tables reject anonymous access (RLS).
 *  - SECURITY DEFINER functions reject anonymous callers.
 *  - Credit/admin RPCs cannot be invoked without authentication.
 *  - Submission tracking enforces per-user ownership.
 *
 * Run via: supabase--test_edge_functions
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY")!;

const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ----------------------------- RLS: tables ----------------------------- */

Deno.test("RLS: anon cannot read login_attempts", async () => {
  const { data, error } = await anon.from("login_attempts").select("*").limit(1);
  // Either a policy error OR an empty result — never real rows.
  assertEquals(data?.length ?? 0, 0);
  assert(error || (data && data.length === 0));
});

Deno.test("RLS: anon cannot insert into login_attempts", async () => {
  const { error } = await anon.from("login_attempts").insert({
    email: "attacker@test.com",
    attempt_count: 1,
  });
  assert(error, "Anon insert into login_attempts must fail");
});

Deno.test("RLS: anon cannot read user_profiles", async () => {
  const { data } = await anon.from("user_profiles").select("*").limit(1);
  assertEquals(data?.length ?? 0, 0);
});

Deno.test("RLS: anon cannot read user_roles", async () => {
  const { data } = await anon.from("user_roles").select("*").limit(1);
  assertEquals(data?.length ?? 0, 0);
});

Deno.test("RLS: anon cannot insert user_roles (privilege escalation)", async () => {
  const { error } = await anon.from("user_roles").insert({
    user_id: "00000000-0000-0000-0000-000000000000",
    role: "admin",
  });
  assert(error, "Anon must not be able to grant admin role");
});

Deno.test("RLS: anon cannot read notification_logs", async () => {
  const { data } = await anon.from("notification_logs").select("*").limit(1);
  assertEquals(data?.length ?? 0, 0);
});

Deno.test("RLS: anon cannot read push_subscriptions", async () => {
  const { data } = await anon.from("push_subscriptions").select("*").limit(1);
  assertEquals(data?.length ?? 0, 0);
});

Deno.test("RLS: anon cannot read generations", async () => {
  const { data } = await anon.from("generations").select("*").limit(1);
  assertEquals(data?.length ?? 0, 0);
});

Deno.test("RLS: anon cannot read submission_tracking", async () => {
  const { data } = await anon.from("submission_tracking").select("*").limit(1);
  assertEquals(data?.length ?? 0, 0);
});

Deno.test("RLS: anon cannot insert submission for another user", async () => {
  const { error } = await anon.from("submission_tracking").insert({
    user_id: "00000000-0000-0000-0000-000000000000",
    image_name: "x.jpg",
    platform: "Adobe Stock",
  });
  assert(error, "Anon must not be able to insert submissions");
});

Deno.test("RLS: anon cannot read payment_requests", async () => {
  const { data } = await anon.from("payment_requests").select("*").limit(1);
  assertEquals(data?.length ?? 0, 0);
});

Deno.test("RLS: anon cannot create payment_request", async () => {
  const { error } = await anon.from("payment_requests").insert({
    user_id: "00000000-0000-0000-0000-000000000000",
    plan_name: "Pro",
    amount: 100,
    payment_method: "bkash",
  });
  assert(error, "Anon must not be able to create payment requests");
});

/* ----------------------- Public/whitelisted reads ---------------------- */

Deno.test("RLS: anon CAN read whitelisted site_settings", async () => {
  const { data, error } = await anon
    .from("site_settings")
    .select("setting_key, setting_value")
    .eq("setting_key", "site_title")
    .maybeSingle();
  assertEquals(error, null);
  // value may be null if unset, but the query must succeed
  assert(data === null || typeof data === "object");
});

Deno.test("RLS: anon CANNOT read non-whitelisted site_settings", async () => {
  const { data } = await anon
    .from("site_settings")
    .select("*")
    .eq("setting_key", "secret_internal_key")
    .maybeSingle();
  assertEquals(data, null);
});

Deno.test("RLS: anon CAN read active pricing_plans", async () => {
  const { error } = await anon
    .from("pricing_plans")
    .select("id, name")
    .eq("is_active", true)
    .limit(1);
  assertEquals(error, null);
});

/* --------------------- SECURITY DEFINER functions ---------------------- */

Deno.test("RPC: has_role is callable by anon (required for public RLS) but only returns false for non-members", async () => {
  const { data, error } = await anon.rpc("has_role", {
    _user_id: "00000000-0000-0000-0000-000000000000",
    _role: "admin",
  });
  assertEquals(error, null);
  assertEquals(data, false);
});

Deno.test("RPC: anon cannot call get_credit_cost", async () => {
  const { error } = await anon.rpc("get_credit_cost");
  assert(error, "Anon must not be able to call get_credit_cost");
});

Deno.test("RPC: anon cannot call deduct_credit", async () => {
  const { error } = await anon.rpc("deduct_credit");
  assert(error, "Anon must not be able to call deduct_credit");
});

Deno.test("RPC: anon cannot call add_credits", async () => {
  const { error } = await anon.rpc("add_credits", {
    p_user_id: "00000000-0000-0000-0000-000000000000",
    p_credits: 9999,
  });
  assert(error, "Anon must not be able to call add_credits");
});

Deno.test("RPC: anon cannot call get_admin_user_view", async () => {
  const { error } = await anon.rpc("get_admin_user_view");
  assert(error, "Anon must not be able to call get_admin_user_view");
});

Deno.test("RPC: anon cannot call is_account_locked", async () => {
  const { error } = await anon.rpc("is_account_locked", {
    p_email: "anyone@test.com",
  });
  assert(error, "Anon must not be able to call is_account_locked");
});

Deno.test("RPC: anon cannot call sync_user_emails", async () => {
  const { error } = await anon.rpc("sync_user_emails");
  assert(error, "Anon must not be able to call sync_user_emails");
});

Deno.test("RPC: anon cannot call get_user_email", async () => {
  const { error } = await anon.rpc("get_user_email", {
    user_uuid: "00000000-0000-0000-0000-000000000000",
  });
  assert(error, "Anon must not be able to call get_user_email");
});

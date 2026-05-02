/**
 * Negative-path security tests: malformed / missing parameters.
 *
 * Goal: ensure that even when callers throw garbage at the API
 * (wrong types, missing args, oversized payloads, SQL-injection-shaped strings,
 *  invalid UUIDs, forbidden enum values), the database NEVER:
 *   - silently authorizes the call
 *   - returns rows from another tenant
 *   - mutates protected fields
 *   - leaks an unhandled stack trace as a 200 success
 *
 * All assertions verify that the request was REJECTED (error returned)
 * or returned 0 rows. A 200 OK with data would be a regression.
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
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("VITE_SUPABASE_ANON_KEY")!;

const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";
const SQL_INJECTION = "'; DROP TABLE user_profiles; --";
const HUGE_STRING = "x".repeat(20_000);

/* ============================================================
 * RPC: missing / wrong-typed parameters must NOT succeed silently
 * ============================================================ */

Deno.test("Negative RPC: add_credits with missing params must fail", async () => {
  // @ts-expect-error: intentionally missing required params
  const { data, error } = await anon.rpc("add_credits", {});
  assert(error || data === null, `add_credits({}) must not succeed; got data=${JSON.stringify(data)}`);
});

Deno.test("Negative RPC: add_credits with wrong-typed credits (string) must fail", async () => {
  const { error } = await anon.rpc("add_credits", {
    p_user_id: FAKE_UUID,
    // @ts-expect-error: wrong type on purpose
    p_credits: "9999",
  });
  assert(error, "add_credits with string credits must reject");
});

Deno.test("Negative RPC: add_credits with negative credits must fail (auth/validation)", async () => {
  const { error } = await anon.rpc("add_credits", {
    p_user_id: FAKE_UUID,
    p_credits: -1000,
  });
  // anon is rejected before validation runs — either way must fail
  assert(error, "add_credits with negative credits must reject");
});

Deno.test("Negative RPC: add_credits with invalid UUID format must fail", async () => {
  const { error } = await anon.rpc("add_credits", {
    p_user_id: "not-a-uuid",
    p_credits: 10,
  });
  assert(error, "add_credits with malformed UUID must reject");
});

Deno.test("Negative RPC: has_role with missing _role must fail", async () => {
  // @ts-expect-error: missing _role
  const { error } = await anon.rpc("has_role", { _user_id: FAKE_UUID });
  assert(error, "has_role missing _role must reject");
});

Deno.test("Negative RPC: has_role with invalid enum value must fail", async () => {
  const { error } = await anon.rpc("has_role", {
    _user_id: FAKE_UUID,
    _role: "superuser_god_mode",
  });
  assert(error, "has_role with non-existent enum value must reject");
});

Deno.test("Negative RPC: has_role with SQL-injection-shaped role must fail safely", async () => {
  const { error } = await anon.rpc("has_role", {
    _user_id: FAKE_UUID,
    _role: SQL_INJECTION,
  });
  assert(error, "has_role with injection payload must reject (parameterized)");
});

Deno.test("Negative RPC: get_user_email with malformed UUID must fail", async () => {
  const { error } = await anon.rpc("get_user_email", {
    user_uuid: "not-a-uuid-at-all",
  });
  assert(error, "get_user_email with bad UUID must reject");
});

Deno.test("Negative RPC: is_account_locked with empty email must fail or return false", async () => {
  const { data, error } = await anon.rpc("is_account_locked", {
    p_email: "",
  });
  // Either rejected (not authorized) or safely returned false — never true.
  assert(error || data === false, `Got data=${JSON.stringify(data)} error=${error?.message}`);
});

Deno.test("Negative RPC: deduct_credit ignores extra params from anon", async () => {
  // @ts-expect-error: passing params to no-arg function
  const { error } = await anon.rpc("deduct_credit", { p_user_id: FAKE_UUID });
  assert(error, "Anon must not invoke deduct_credit regardless of extra params");
});

/* ============================================================
 * Tables: malformed / forbidden inserts must be rejected
 * ============================================================ */

Deno.test("Negative INSERT: payment_requests with negative amount must fail", async () => {
  const { error } = await anon.from("payment_requests").insert({
    user_id: FAKE_UUID,
    plan_name: "Pro",
    amount: -500,
    payment_method: "bkash",
    status: "pending",
  });
  assert(error, "Negative amount must be rejected (RLS or trigger)");
});

Deno.test("Negative INSERT: payment_requests with invalid payment_method must fail", async () => {
  const { error } = await anon.from("payment_requests").insert({
    user_id: FAKE_UUID,
    plan_name: "Pro",
    amount: 100,
    payment_method: "bitcoin_mining_rig",
    status: "pending",
  });
  assert(error, "Invalid payment method must be rejected");
});

Deno.test("Negative INSERT: payment_requests pre-set to approved must fail", async () => {
  const { error } = await anon.from("payment_requests").insert({
    user_id: FAKE_UUID,
    plan_name: "Pro",
    amount: 100,
    payment_method: "bkash",
    status: "approved",
  });
  assert(error, "Anon must not create approved payment");
});

Deno.test("Negative INSERT: payment_requests with admin_notes pre-filled must fail", async () => {
  const { error } = await anon.from("payment_requests").insert({
    user_id: FAKE_UUID,
    plan_name: "Pro",
    amount: 100,
    payment_method: "bkash",
    status: "pending",
    admin_notes: "auto-approved by attacker",
  });
  assert(error, "Anon must not pre-fill admin_notes");
});

Deno.test("Negative INSERT: user_roles with arbitrary text role must fail", async () => {
  const { error } = await anon.from("user_roles").insert({
    user_id: FAKE_UUID,
    role: "superadmin",
  });
  assert(error, "Invalid enum value or RLS must reject");
});

Deno.test("Negative INSERT: user_profiles with credits=999999 must fail", async () => {
  const { error } = await anon.from("user_profiles").insert({
    user_id: FAKE_UUID,
    credits: 999_999,
  });
  assert(error, "Anon insert with inflated credits must fail");
});

Deno.test("Negative INSERT: generations with missing required fields must fail", async () => {
  const { error } = await anon.from("generations").insert({
    user_id: FAKE_UUID,
    // missing image_url, image_name, prompt, title, description, tags
  });
  assert(error, "Missing required NOT NULL fields must reject");
});

Deno.test("Negative INSERT: submission_tracking with status=approved as anon must fail", async () => {
  const { error } = await anon.from("submission_tracking").insert({
    user_id: FAKE_UUID,
    image_name: "x.jpg",
    platform: "Adobe Stock",
    status: "approved",
  });
  assert(error, "Anon insert into submission_tracking must fail");
});

Deno.test("Negative INSERT: submission_tracking with invalid platform must fail or be inserted but no rows survive RLS", async () => {
  const { data, error } = await anon
    .from("submission_tracking")
    .insert({
      user_id: FAKE_UUID,
      image_name: "x.jpg",
      platform: SQL_INJECTION,
    })
    .select();
  // Anon is blocked by RLS regardless of payload shape
  assert(error || (data?.length ?? 0) === 0);
});

Deno.test("Negative INSERT: huge string payload to user_profiles must fail (RLS first)", async () => {
  const { error } = await anon.from("user_profiles").insert({
    user_id: FAKE_UUID,
    full_name: HUGE_STRING,
    phone_number: HUGE_STRING,
  });
  assert(error, "Anon insert must fail regardless of payload size");
});

/* ============================================================
 * UPDATE attempts on protected fields must not succeed
 * ============================================================ */

Deno.test("Negative UPDATE: anon attempting to update user_profiles must affect 0 rows", async () => {
  const { data, error } = await anon
    .from("user_profiles")
    .update({ credits: 999_999 })
    .eq("user_id", FAKE_UUID)
    .select();
  // RLS denies — either error, or empty result set
  assert(error || (data?.length ?? 0) === 0);
});

Deno.test("Negative UPDATE: anon attempting to flip payment_requests.status must affect 0 rows", async () => {
  const { data, error } = await anon
    .from("payment_requests")
    .update({ status: "approved" })
    .eq("user_id", FAKE_UUID)
    .select();
  assert(error || (data?.length ?? 0) === 0);
});

Deno.test("Negative UPDATE: anon attempting to update user_roles must affect 0 rows", async () => {
  const { data, error } = await anon
    .from("user_roles")
    .update({ role: "admin" })
    .eq("user_id", FAKE_UUID)
    .select();
  assert(error || (data?.length ?? 0) === 0);
});

/* ============================================================
 * SELECT attempts with crafted filters must not leak rows
 * ============================================================ */

Deno.test("Negative SELECT: anon cannot bypass RLS by using OR filters on user_profiles", async () => {
  const { data } = await anon
    .from("user_profiles")
    .select("*")
    .or(`user_id.eq.${FAKE_UUID},credits.gte.0`);
  assertEquals(data?.length ?? 0, 0, "RLS must hide all user_profiles rows from anon");
});

Deno.test("Negative SELECT: anon cannot bypass RLS by counting user_roles", async () => {
  const { count } = await anon
    .from("user_roles")
    .select("*", { count: "exact", head: true });
  assertEquals(count ?? 0, 0, "Anon must not count rows in user_roles");
});

Deno.test("Negative SELECT: anon cannot bypass RLS by counting login_attempts", async () => {
  const { count } = await anon
    .from("login_attempts")
    .select("*", { count: "exact", head: true });
  assertEquals(count ?? 0, 0, "Anon must not count rows in login_attempts");
});

/* ============================================================
 * DELETE attempts must affect 0 rows
 * ============================================================ */

Deno.test("Negative DELETE: anon delete on payment_requests must affect 0 rows", async () => {
  const { data, error } = await anon
    .from("payment_requests")
    .delete()
    .eq("user_id", FAKE_UUID)
    .select();
  assert(error || (data?.length ?? 0) === 0);
});

Deno.test("Negative DELETE: anon delete on user_roles must be blocked", async () => {
  const { data, error } = await anon
    .from("user_roles")
    .delete()
    .eq("user_id", FAKE_UUID)
    .select();
  assert(error || (data?.length ?? 0) === 0);
});

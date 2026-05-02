/**
 * Deterministic test fixtures for the security suite.
 *
 * Provides a single `setupFixtures()` entry point that:
 *   1. Provisions a known set of auth users (admin + 2 regular) with stable
 *      labels but unique emails per run (avoids collisions in shared envs).
 *   2. Ensures their `user_profiles` rows exist with EXACT credit balances.
 *   3. Inserts the `admin` role row for the admin user.
 *   4. Inserts a deterministic pricing plan so credit-deduction logic
 *      (which short-circuits in "free mode") behaves predictably.
 *
 * And a matching `teardownFixtures()` that removes everything it created,
 * even on partial failure.
 *
 * Usage in a Deno test file:
 *
 *   import { setupFixtures, teardownFixtures, hasAdminKey } from "./fixtures.ts";
 *
 *   Deno.test({
 *     name: "...",
 *     ignore: !hasAdminKey,
 *     fn: async () => {
 *       const fx = await setupFixtures();
 *       try {
 *         // fx.userA, fx.userB, fx.adminUser, fx.plan available
 *       } finally {
 *         await teardownFixtures(fx);
 *       }
 *     },
 *   });
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. When the key is absent, `hasAdminKey`
 * is false and tests should set `ignore: true`.
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;

export const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("VITE_SUPABASE_ANON_KEY")!;

const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

export const hasAdminKey = Boolean(SERVICE_ROLE_KEY);

export const adminClient: SupabaseClient | null = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export interface FixtureUser {
  /** Stable role label: "admin" | "userA" | "userB" */
  label: string;
  id: string;
  email: string;
  password: string;
  /** Anon-key client already signed in as this user. */
  client: SupabaseClient;
  /** Deterministic credit balance set by setupFixtures. */
  initialCredits: number;
}

export interface FixturePlan {
  id: string;
  name: string;
  credits_amount: number;
  price_bdt: number;
  price_usd: number;
}

export interface Fixtures {
  runId: string;
  userA: FixtureUser;
  userB: FixtureUser;
  adminUser: FixtureUser;
  plan: FixturePlan;
  /** All ids created during setup, used by teardown for safe cleanup. */
  createdUserIds: string[];
  createdPlanIds: string[];
}

/** Deterministic credit balances per role. Tests rely on these exact numbers. */
export const SEED_CREDITS = {
  admin: 1000,
  userA: 25,
  userB: 25,
} as const;

const PLAN_PREFIX = "sec-test-plan";
const EMAIL_DOMAIN = "sec-test.local";

async function createUser(
  runId: string,
  label: string,
  credits: number,
): Promise<FixtureUser> {
  if (!adminClient) throw new Error("adminClient unavailable");

  const email = `sec-${label}-${runId}@${EMAIL_DOMAIN}`;
  const password = `Pw_${runId}_${label}_${crypto.randomUUID()}`;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Sec Test ${label}`, fixture_run: runId },
  });
  if (error || !data.user) {
    throw new Error(`Failed to provision user ${label}: ${error?.message}`);
  }
  const userId = data.user.id;

  // Force-set EXACT credit balance using service-role (bypasses RLS + triggers).
  const { error: upsertErr } = await adminClient
    .from("user_profiles")
    .upsert(
      { user_id: userId, email, full_name: `Sec Test ${label}`, credits },
      { onConflict: "user_id" },
    );
  if (upsertErr) {
    throw new Error(
      `Failed to seed credits for ${label}: ${upsertErr.message}`,
    );
  }

  // Sign the user in via the anon-key client to get a real RLS-scoped session.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInErr } = await userClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    throw new Error(`Failed to sign in ${label}: ${signInErr.message}`);
  }

  return {
    label,
    id: userId,
    email,
    password,
    client: userClient,
    initialCredits: credits,
  };
}

async function grantAdminRole(userId: string): Promise<void> {
  if (!adminClient) return;
  const { error } = await adminClient
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  if (error) throw new Error(`Failed to grant admin role: ${error.message}`);
}

async function ensurePlan(runId: string): Promise<FixturePlan> {
  if (!adminClient) throw new Error("adminClient unavailable");

  const planName = `${PLAN_PREFIX}-${runId}`;
  const { data, error } = await adminClient
    .from("pricing_plans")
    .insert({
      name: planName,
      description: "Deterministic plan provisioned by security test fixtures",
      credits: "100",
      credits_amount: 100,
      price_bdt: 100,
      price_usd: 1,
      period: "monthly",
      features: ["fixture"],
      is_active: true,
      is_free: false,
      is_popular: false,
      is_unlimited: false,
      sort_order: 9999,
    })
    .select("id,name,credits_amount,price_bdt,price_usd")
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert pricing plan: ${error?.message}`);
  }
  return data as FixturePlan;
}

/**
 * Provision a fresh, deterministic fixture set. Each call uses a unique runId
 * suffix so parallel runs don't collide.
 */
export async function setupFixtures(): Promise<Fixtures> {
  if (!adminClient) {
    throw new Error(
      "setupFixtures requires SUPABASE_SERVICE_ROLE_KEY. Use `ignore: !hasAdminKey` on tests.",
    );
  }

  const runId = crypto.randomUUID().slice(0, 8);
  const createdUserIds: string[] = [];
  const createdPlanIds: string[] = [];

  try {
    const adminUser = await createUser(runId, "admin", SEED_CREDITS.admin);
    createdUserIds.push(adminUser.id);
    await grantAdminRole(adminUser.id);

    const userA = await createUser(runId, "userA", SEED_CREDITS.userA);
    createdUserIds.push(userA.id);

    const userB = await createUser(runId, "userB", SEED_CREDITS.userB);
    createdUserIds.push(userB.id);

    const plan = await ensurePlan(runId);
    createdPlanIds.push(plan.id);

    return { runId, adminUser, userA, userB, plan, createdUserIds, createdPlanIds };
  } catch (e) {
    // Best-effort rollback if setup blew up halfway through.
    await teardownFixtures({
      runId,
      adminUser: null as unknown as FixtureUser,
      userA: null as unknown as FixtureUser,
      userB: null as unknown as FixtureUser,
      plan: null as unknown as FixturePlan,
      createdUserIds,
      createdPlanIds,
    });
    throw e;
  }
}

/**
 * Remove every row created by setupFixtures. Idempotent and tolerant of
 * partial failure — always safe to call from a `finally` block.
 */
export async function teardownFixtures(fx: Fixtures): Promise<void> {
  if (!adminClient) return;

  // 1. Delete owned data (avoid orphan rows that would survive auth deletion).
  if (fx.createdUserIds.length) {
    const tables = [
      "submission_tracking",
      "payment_requests",
      "generations",
      "keyword_sets",
      "custom_events",
      "notification_logs",
      "push_subscriptions",
      "user_roles",
      "user_profiles",
    ];
    for (const t of tables) {
      try {
        await adminClient.from(t).delete().in("user_id", fx.createdUserIds);
      } catch {
        // ignore — table might not exist or RLS may shadow; service role bypasses RLS
      }
    }
  }

  // 2. Drop fixture pricing plans.
  if (fx.createdPlanIds.length) {
    try {
      await adminClient.from("pricing_plans").delete().in("id", fx.createdPlanIds);
    } catch {
      // ignore
    }
  }

  // 3. Delete auth users last.
  for (const uid of fx.createdUserIds) {
    try {
      await adminClient.auth.admin.deleteUser(uid);
    } catch {
      // ignore
    }
  }

  // 4. Sign out client sessions to release sockets.
  for (const u of [fx.adminUser, fx.userA, fx.userB]) {
    try {
      await u?.client?.auth?.signOut();
    } catch {
      // ignore
    }
  }
}

/**
 * Emergency sweeper: removes any leftover fixture rows from previous failed
 * runs (matched by the `sec-test.local` email domain and `sec-test-plan-`
 * plan-name prefix). Safe to call at the start of a test run.
 */
export async function purgeStaleFixtures(): Promise<void> {
  if (!adminClient) return;

  // Stale auth users
  try {
    const { data } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const stale = (data?.users ?? []).filter((u) =>
      (u.email ?? "").endsWith(`@${EMAIL_DOMAIN}`),
    );
    const ids = stale.map((u) => u.id);
    if (ids.length) {
      const tables = [
        "submission_tracking",
        "payment_requests",
        "generations",
        "keyword_sets",
        "custom_events",
        "notification_logs",
        "push_subscriptions",
        "user_roles",
        "user_profiles",
      ];
      for (const t of tables) {
        try {
          await adminClient.from(t).delete().in("user_id", ids);
        } catch {
          // ignore
        }
      }
      for (const id of ids) {
        try {
          await adminClient.auth.admin.deleteUser(id);
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore listing errors
  }

  // Stale fixture plans
  try {
    await adminClient
      .from("pricing_plans")
      .delete()
      .like("name", `${PLAN_PREFIX}-%`);
  } catch {
    // ignore
  }
}

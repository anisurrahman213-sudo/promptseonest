/**
 * Fixture smoke tests: ensure setup/teardown works deterministically.
 *
 * Skipped cleanly when SUPABASE_SERVICE_ROLE_KEY is absent.
 */
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  hasAdminKey,
  purgeStaleFixtures,
  SEED_CREDITS,
  setupFixtures,
  teardownFixtures,
} from "./fixtures.ts";

const skipIfNoAdmin = !hasAdminKey;

Deno.test({
  name: "Fixtures: purge stale entries from previous runs",
  ignore: skipIfNoAdmin,
  fn: async () => {
    // Should never throw, even if there's nothing to purge.
    await purgeStaleFixtures();
  },
});

Deno.test({
  name: "Fixtures: setupFixtures provisions deterministic users + plan + credits",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const fx = await setupFixtures();
    try {
      // Distinct ids
      assert(fx.adminUser.id !== fx.userA.id);
      assert(fx.userA.id !== fx.userB.id);

      // Email shape
      assert(fx.userA.email.includes(`-${fx.runId}@`));
      assert(fx.plan.name.startsWith("sec-test-plan-"));

      // Each user can read their own profile and credits match seed values.
      const { data: aProfile, error: aErr } = await fx.userA.client
        .from("user_profiles")
        .select("credits, user_id")
        .eq("user_id", fx.userA.id)
        .single();
      assertEquals(aErr, null);
      assertEquals(aProfile?.credits, SEED_CREDITS.userA);

      const { data: adminProfile } = await fx.adminUser.client
        .from("user_profiles")
        .select("credits")
        .eq("user_id", fx.adminUser.id)
        .single();
      assertEquals(adminProfile?.credits, SEED_CREDITS.admin);

      // Admin role is recognized by has_role().
      const { data: isAdmin, error: roleErr } = await fx.adminUser.client.rpc(
        "has_role",
        { _user_id: fx.adminUser.id, _role: "admin" },
      );
      assertEquals(roleErr, null);
      assertEquals(isAdmin, true);

      // Cross-tenant: userA cannot read userB's profile.
      const { data: leak } = await fx.userA.client
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", fx.userB.id);
      assertEquals(leak?.length ?? 0, 0);

      // Plan is visible to anyone (active = true).
      const { data: plan } = await fx.userA.client
        .from("pricing_plans")
        .select("id, name, is_active")
        .eq("id", fx.plan.id)
        .single();
      assertEquals(plan?.is_active, true);
    } finally {
      await teardownFixtures(fx);
    }
  },
});

Deno.test({
  name: "Fixtures: teardownFixtures removes users and plan",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const fx = await setupFixtures();
    const userAId = fx.userA.id;
    const planId = fx.plan.id;

    await teardownFixtures(fx);

    // Re-import adminClient to verify deletion.
    const { adminClient } = await import("./fixtures.ts");
    assert(adminClient);

    const { data: profileLeft } = await adminClient!
      .from("user_profiles")
      .select("user_id")
      .eq("user_id", userAId);
    assertEquals(profileLeft?.length ?? 0, 0);

    const { data: planLeft } = await adminClient!
      .from("pricing_plans")
      .select("id")
      .eq("id", planId);
    assertEquals(planLeft?.length ?? 0, 0);
  },
});

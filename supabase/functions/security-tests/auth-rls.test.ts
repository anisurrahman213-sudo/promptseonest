/**
 * Authenticated per-user RLS ownership tests.
 *
 * Prerequisite: SUPABASE_SERVICE_ROLE_KEY must be available in the Edge Function
 * test runtime to provision and clean up test users via the auth admin API.
 * If it's not present, every test in this file is cleanly skipped (ignored).
 *
 * To enable locally / in CI, add SUPABASE_SERVICE_ROLE_KEY to the project's
 * Edge Function secrets (it already exists for runtime use; the test runner
 * just needs it surfaced).
 *
 * Asserts:
 *   - Each user can only read/write their own generations, submissions, payments.
 *   - User B cannot read/update/delete User A's rows (cross-tenant isolation).
 *   - Users cannot self-approve payments or set admin-only submission fields.
 *   - deduct_credit() never affects another user; non-admins can't call add_credits.
 *   - Direct UPDATE on user_profiles.credits is blocked by RLS/trigger.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("VITE_SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const admin = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

if (!admin) {
  console.warn(
    "[auth-rls.test] SUPABASE_SERVICE_ROLE_KEY not exposed to the test runner — " +
      "authenticated RLS tests will be skipped. Tests still pass; production code paths are unchanged.",
  );
}

interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient;
}

const createdUserIds: string[] = [];

async function provisionUser(label: string): Promise<TestUser> {
  if (!admin) throw new Error("admin client unavailable");

  const email = `sec-${label}-${crypto.randomUUID().slice(0, 8)}@sec-test.local`;
  const password = `Pw_${crypto.randomUUID()}`;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) throw createErr ?? new Error("createUser failed");
  createdUserIds.push(created.user.id);

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) throw signInErr;

  return { id: created.user.id, email, client };
}

async function cleanupUsers() {
  if (!admin) return;
  const ids = createdUserIds.splice(0);
  for (const uid of ids) {
    await admin.from("submission_tracking").delete().eq("user_id", uid);
    await admin.from("payment_requests").delete().eq("user_id", uid);
    await admin.from("generations").delete().eq("user_id", uid);
    await admin.from("user_profiles").delete().eq("user_id", uid);
    await admin.from("user_roles").delete().eq("user_id", uid);
    await admin.auth.admin.deleteUser(uid).catch(() => {});
  }
}

const skipIfNoAdmin = !admin;

/* --------------------------- generations ---------------------------- */

Deno.test({
  name: "Auth RLS: user can insert + read own generation; peer cannot",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const userA = await provisionUser("genA");
    const userB = await provisionUser("genB");

    try {
      const { data: inserted, error: insErr } = await userA.client
        .from("generations")
        .insert({
          user_id: userA.id,
          image_url: "https://example.test/a.jpg",
          image_name: "a.jpg",
          prompt: "test",
          title: "A",
          description: "d",
          tags: "x",
          media_type: "image",
        })
        .select()
        .single();
      assertEquals(insErr, null, `Owner insert must succeed: ${insErr?.message}`);
      assert(inserted);

      const { data: ownRows } = await userA.client
        .from("generations")
        .select("id")
        .eq("id", inserted!.id);
      assertEquals(ownRows?.length, 1);

      const { data: peerRows } = await userB.client
        .from("generations")
        .select("id")
        .eq("id", inserted!.id);
      assertEquals(peerRows?.length ?? 0, 0, "Peer must not read another user's generation");

      // Peer DELETE attempt — verify via service role that row survives
      await userB.client.from("generations").delete().eq("id", inserted!.id);
      const { data: stillThere } = await admin!
        .from("generations")
        .select("id")
        .eq("id", inserted!.id);
      assertEquals(stillThere?.length, 1, "Peer must not delete another user's generation");
    } finally {
      await cleanupUsers();
    }
  },
});

Deno.test({
  name: "Auth RLS: user CANNOT insert generation with another user_id (forged ownership)",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const userA = await provisionUser("forgeA");
    const userB = await provisionUser("forgeB");

    try {
      const { error } = await userA.client.from("generations").insert({
        user_id: userB.id,
        image_url: "https://example.test/x.jpg",
        image_name: "x.jpg",
        prompt: "p",
        title: "t",
        description: "d",
        tags: "x",
        media_type: "image",
      });
      assert(error, "Cross-user insert must be blocked by WITH CHECK");
    } finally {
      await cleanupUsers();
    }
  },
});

/* ------------------------ submission_tracking ----------------------- */

Deno.test({
  name: "Auth RLS: user cannot self-approve own submission (admin-only fields locked)",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const userA = await provisionUser("subA");

    try {
      const { data: sub, error: insErr } = await userA.client
        .from("submission_tracking")
        .insert({
          user_id: userA.id,
          image_name: "submit.jpg",
          platform: "Adobe Stock",
        })
        .select()
        .single();
      assertEquals(insErr, null, `Submission insert: ${insErr?.message}`);

      const { error: updErr } = await userA.client
        .from("submission_tracking")
        .update({
          status: "approved",
          rejection_reason: "trying to forge",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", sub!.id);
      assert(updErr, "User must not be able to set status/rejection_reason/reviewed_at");

      // Verify status really stayed pending
      const { data: stillPending } = await admin!
        .from("submission_tracking")
        .select("status")
        .eq("id", sub!.id)
        .single();
      assertEquals(stillPending?.status, "pending");

      // Allowed fields (notes) should still update
      const { error: noteErr } = await userA.client
        .from("submission_tracking")
        .update({ notes: "my note" })
        .eq("id", sub!.id);
      assertEquals(noteErr, null, `Note update should succeed: ${noteErr?.message}`);
    } finally {
      await cleanupUsers();
    }
  },
});

Deno.test({
  name: "Auth RLS: peer cannot read another user's submissions",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const userA = await provisionUser("subOwner");
    const userB = await provisionUser("subPeer");

    try {
      const { data: sub } = await userA.client
        .from("submission_tracking")
        .insert({
          user_id: userA.id,
          image_name: "secret.jpg",
          platform: "Shutterstock",
        })
        .select()
        .single();

      const { data: peerView } = await userB.client
        .from("submission_tracking")
        .select("id")
        .eq("id", sub!.id);
      assertEquals(peerView?.length ?? 0, 0);
    } finally {
      await cleanupUsers();
    }
  },
});

/* -------------------------- payment_requests ------------------------ */

Deno.test({
  name: "Auth RLS: user can create pending payment; cannot create approved payment",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const user = await provisionUser("pay");

    try {
      const { error: okErr } = await user.client.from("payment_requests").insert({
        user_id: user.id,
        plan_name: "Pro",
        amount: 100,
        payment_method: "bkash",
        status: "pending",
      });
      assertEquals(okErr, null, `Pending insert should succeed: ${okErr?.message}`);

      const { error: cheatErr } = await user.client.from("payment_requests").insert({
        user_id: user.id,
        plan_name: "Pro",
        amount: 100,
        payment_method: "bkash",
        status: "approved",
      });
      assert(cheatErr, "User must not insert non-pending payment");
    } finally {
      await cleanupUsers();
    }
  },
});

Deno.test({
  name: "Auth RLS: peer cannot read or approve another user's payment request",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const owner = await provisionUser("payOwner");
    const peer = await provisionUser("payPeer");

    try {
      const { data: pay } = await owner.client
        .from("payment_requests")
        .insert({
          user_id: owner.id,
          plan_name: "Pro",
          amount: 50,
          payment_method: "nagad",
          status: "pending",
        })
        .select()
        .single();

      const { data: peerView } = await peer.client
        .from("payment_requests")
        .select("id")
        .eq("id", pay!.id);
      assertEquals(peerView?.length ?? 0, 0, "Peer must not read another user's payment");

      await peer.client
        .from("payment_requests")
        .update({ status: "approved" })
        .eq("id", pay!.id);

      const { data: stillPending } = await admin!
        .from("payment_requests")
        .select("status")
        .eq("id", pay!.id)
        .single();
      assertEquals(stillPending?.status, "pending", "Peer must not flip another user's payment status");
    } finally {
      await cleanupUsers();
    }
  },
});

/* ---------------------------- credits ------------------------------- */

Deno.test({
  name: "Auth RPC: deduct_credit only affects caller; never another user",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const userA = await provisionUser("creditA");
    const userB = await provisionUser("creditB");

    try {
      const { data: beforeA } = await admin!
        .from("user_profiles")
        .select("credits")
        .eq("user_id", userA.id)
        .single();
      const { data: beforeB } = await admin!
        .from("user_profiles")
        .select("credits")
        .eq("user_id", userB.id)
        .single();

      const { error: rpcErr } = await userA.client.rpc("deduct_credit");
      assertEquals(rpcErr, null, `deduct_credit error: ${rpcErr?.message}`);

      const { data: afterA } = await admin!
        .from("user_profiles")
        .select("credits")
        .eq("user_id", userA.id)
        .single();
      const { data: afterB } = await admin!
        .from("user_profiles")
        .select("credits")
        .eq("user_id", userB.id)
        .single();

      assertEquals(afterB?.credits, beforeB?.credits, "Other user's credits must not change");
      assert(
        (afterA?.credits ?? 0) <= (beforeA?.credits ?? 0),
        `Caller credits must not increase: before=${beforeA?.credits} after=${afterA?.credits}`,
      );
    } finally {
      await cleanupUsers();
    }
  },
});

Deno.test({
  name: "Auth RPC: non-admin cannot call add_credits",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const user = await provisionUser("notAdmin");

    try {
      const { error } = await user.client.rpc("add_credits", {
        p_user_id: user.id,
        p_credits: 9999,
      });
      assert(error, "Non-admin must not invoke add_credits");

      const { data: profile } = await admin!
        .from("user_profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();
      assertNotEquals(profile?.credits, 9999, "Credits must not have jumped");
    } finally {
      await cleanupUsers();
    }
  },
});

Deno.test({
  name: "Auth RPC: non-admin cannot call get_admin_user_view",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const user = await provisionUser("notAdmin2");

    try {
      const { error } = await user.client.rpc("get_admin_user_view");
      assert(error, "Non-admin must not invoke get_admin_user_view");
    } finally {
      await cleanupUsers();
    }
  },
});

Deno.test({
  name: "Auth RLS: user cannot directly UPDATE their own credits via user_profiles",
  ignore: skipIfNoAdmin,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const user = await provisionUser("credLock");

    try {
      const { data: before } = await admin!
        .from("user_profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();

      await user.client
        .from("user_profiles")
        .update({ credits: 9999 })
        .eq("user_id", user.id);

      const { data: after } = await admin!
        .from("user_profiles")
        .select("credits")
        .eq("user_id", user.id)
        .single();
      assertEquals(after?.credits, before?.credits, "Direct credit update must be blocked");
    } finally {
      await cleanupUsers();
    }
  },
});

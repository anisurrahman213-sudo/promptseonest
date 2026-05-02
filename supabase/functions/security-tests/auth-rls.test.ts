/**
 * Authenticated per-user RLS ownership tests.
 *
 * Uses signUp() + a direct DB connection (SUPABASE_DB_URL) to:
 *   - Auto-confirm test users (so they can sign in immediately)
 *   - Clean up rows + auth users after each test
 *
 * Asserts:
 *   - Each user can only read/write their own generations, submissions, payments.
 *   - User B cannot read/update/delete User A's rows (cross-tenant isolation).
 *   - Users cannot self-promote payment status or set admin-only submission fields.
 *   - deduct_credit() never affects another user; non-admins can't call add_credits.
 *   - Direct UPDATE on user_profiles.credits is blocked by RLS/trigger.
 *
 * Run via: supabase--test_edge_functions
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Client as PgClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
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
const DB_URL = Deno.env.get("SUPABASE_DB_URL") ?? Deno.env.get("DB_URL");

const HAS_DB = !!DB_URL;
if (!HAS_DB) {
  console.warn("[auth-rls.test] SUPABASE_DB_URL missing — authenticated tests will be skipped.");
}

interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient;
}

const createdUserIds: string[] = [];

async function withDb<T>(fn: (db: PgClient) => Promise<T>): Promise<T> {
  const db = new PgClient(DB_URL!);
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

async function provisionUser(label: string): Promise<TestUser> {
  const email = `sec-${label}-${crypto.randomUUID().slice(0, 8)}@sec-test.local`;
  const password = `Pw_${crypto.randomUUID()}`;

  const tmp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: signUp, error: signUpErr } = await tmp.auth.signUp({ email, password });
  if (signUpErr || !signUp.user) throw signUpErr ?? new Error("signUp failed");

  const userId = signUp.user.id;
  createdUserIds.push(userId);

  // Force-confirm email so signInWithPassword works regardless of project setting.
  await withDb(async (db) => {
    await db.queryArray(
      `UPDATE auth.users SET email_confirmed_at = now(), confirmed_at = now() WHERE id = $1`,
      [userId],
    );
  });

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) throw signInErr;

  return { id: userId, email, client };
}

async function cleanupUsers() {
  if (!HAS_DB || createdUserIds.length === 0) return;
  await withDb(async (db) => {
    const ids = createdUserIds.splice(0);
    // Delete dependent data first (no FK cascade defined for these), then auth.users.
    await db.queryArray(
      `DELETE FROM public.submission_tracking WHERE user_id = ANY($1::uuid[])`,
      [ids],
    );
    await db.queryArray(
      `DELETE FROM public.payment_requests WHERE user_id = ANY($1::uuid[])`,
      [ids],
    );
    await db.queryArray(
      `DELETE FROM public.generations WHERE user_id = ANY($1::uuid[])`,
      [ids],
    );
    await db.queryArray(
      `DELETE FROM public.user_profiles WHERE user_id = ANY($1::uuid[])`,
      [ids],
    );
    await db.queryArray(
      `DELETE FROM public.user_roles WHERE user_id = ANY($1::uuid[])`,
      [ids],
    );
    await db.queryArray(`DELETE FROM auth.users WHERE id = ANY($1::uuid[])`, [ids]);
  });
}

async function readWithDb<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return await withDb(async (db) => {
    const res = await db.queryObject<T>(sql, params);
    return res.rows;
  });
}

/* --------------------------- generations ---------------------------- */

Deno.test({
  name: "Auth RLS: user can insert + read own generation; peer cannot",
  ignore: !HAS_DB,
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

      // Peer DELETE must not affect the row
      await userB.client.from("generations").delete().eq("id", inserted!.id);
      const stillThere = await readWithDb<{ id: string }>(
        `SELECT id FROM public.generations WHERE id = $1`,
        [inserted!.id],
      );
      assertEquals(stillThere.length, 1, "Peer must not delete another user's generation");
    } finally {
      await cleanupUsers();
    }
  },
});

Deno.test({
  name: "Auth RLS: user CANNOT insert generation with another user_id (forged ownership)",
  ignore: !HAS_DB,
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
  ignore: !HAS_DB,
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

      // Verify status really stayed pending in DB
      const rows = await readWithDb<{ status: string }>(
        `SELECT status FROM public.submission_tracking WHERE id = $1`,
        [sub!.id],
      );
      assertEquals(rows[0]?.status, "pending");

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
  ignore: !HAS_DB,
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
  ignore: !HAS_DB,
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
  ignore: !HAS_DB,
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

      const rows = await readWithDb<{ status: string }>(
        `SELECT status FROM public.payment_requests WHERE id = $1`,
        [pay!.id],
      );
      assertEquals(rows[0]?.status, "pending", "Peer must not flip another user's payment status");
    } finally {
      await cleanupUsers();
    }
  },
});

/* ---------------------------- credits ------------------------------- */

Deno.test({
  name: "Auth RPC: deduct_credit only affects caller; never another user",
  ignore: !HAS_DB,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const userA = await provisionUser("creditA");
    const userB = await provisionUser("creditB");

    try {
      const before = await readWithDb<{ user_id: string; credits: number }>(
        `SELECT user_id, credits FROM public.user_profiles WHERE user_id = ANY($1::uuid[])`,
        [[userA.id, userB.id]],
      );
      const beforeA = before.find((r) => r.user_id === userA.id)?.credits ?? 0;
      const beforeB = before.find((r) => r.user_id === userB.id)?.credits ?? 0;

      const { error: rpcErr } = await userA.client.rpc("deduct_credit");
      assertEquals(rpcErr, null, `deduct_credit error: ${rpcErr?.message}`);

      const after = await readWithDb<{ user_id: string; credits: number }>(
        `SELECT user_id, credits FROM public.user_profiles WHERE user_id = ANY($1::uuid[])`,
        [[userA.id, userB.id]],
      );
      const afterA = after.find((r) => r.user_id === userA.id)?.credits ?? 0;
      const afterB = after.find((r) => r.user_id === userB.id)?.credits ?? 0;

      assertEquals(afterB, beforeB, "Other user's credits must not change");
      assert(afterA <= beforeA, `Caller credits must not increase (before=${beforeA} after=${afterA})`);
    } finally {
      await cleanupUsers();
    }
  },
});

Deno.test({
  name: "Auth RPC: non-admin cannot call add_credits",
  ignore: !HAS_DB,
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

      const rows = await readWithDb<{ credits: number }>(
        `SELECT credits FROM public.user_profiles WHERE user_id = $1`,
        [user.id],
      );
      assertNotEquals(rows[0]?.credits, 9999, "Credits must not have jumped");
    } finally {
      await cleanupUsers();
    }
  },
});

Deno.test({
  name: "Auth RPC: non-admin cannot call get_admin_user_view",
  ignore: !HAS_DB,
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
  ignore: !HAS_DB,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const user = await provisionUser("credLock");

    try {
      const beforeRows = await readWithDb<{ credits: number }>(
        `SELECT credits FROM public.user_profiles WHERE user_id = $1`,
        [user.id],
      );
      const before = beforeRows[0]?.credits;

      await user.client
        .from("user_profiles")
        .update({ credits: 9999 })
        .eq("user_id", user.id);

      const afterRows = await readWithDb<{ credits: number }>(
        `SELECT credits FROM public.user_profiles WHERE user_id = $1`,
        [user.id],
      );
      assertEquals(afterRows[0]?.credits, before, "Direct credit update must be blocked");
    } finally {
      await cleanupUsers();
    }
  },
});

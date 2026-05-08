import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const corsHeadersJson = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

export type AuthResult =
  | { ok: true; userId: string; authHeader: string }
  | { ok: false; response: Response };

export async function requireUser(req: Request, cors: Record<string, string> = {}): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      }),
    };
  }
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      }),
    };
  }
  return { ok: true, userId: user.id, authHeader };
}

export async function requireAdmin(req: Request, cors: Record<string, string> = {}): Promise<AuthResult> {
  const userResult = await requireUser(req, cors);
  if (!userResult.ok) return userResult;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userResult.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      }),
    };
  }
  return userResult;
}

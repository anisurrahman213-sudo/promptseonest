// Admin-only endpoint to record a new UI/build deployment.
// Called from PublishChecklist after the admin clicks "Mark deployed live".

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface Body {
  buildTime?: string;
  version?: string;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate JWT (signing-keys system requires in-code validation)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Use a request-scoped client that forwards the user's JWT, so the INSERT
  // is performed AS the user and the RLS admin policy is enforced.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = userRes.user.id;

  // Server-side admin gate (defense in depth on top of RLS)
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  if (!roleRow) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  // Validate buildTime — must be a parseable ISO date if provided
  let buildTime = body.buildTime?.trim() || new Date().toISOString();
  const parsed = new Date(buildTime);
  if (isNaN(parsed.getTime())) {
    return new Response(JSON.stringify({ error: 'Invalid buildTime — must be ISO date string' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  buildTime = parsed.toISOString();

  const version = body.version?.toString().slice(0, 100) || null;
  const notes = body.notes?.toString().slice(0, 500) || null;

  const { data, error } = await supabase
    .from('deployment_versions')
    .insert({
      build_time: buildTime,
      version,
      notes,
      deployed_by: userId,
    })
    .select('id, build_time, version, notes, created_at')
    .single();

  if (error) {
    console.error('[record-deployment] insert error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      deployment: {
        id: data.id,
        buildTime: data.build_time,
        version: data.version,
        notes: data.notes,
        deployedAt: data.created_at,
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});

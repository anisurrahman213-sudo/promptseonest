// Public endpoint that returns the latest deployed UI/build version.
// Used by PublishChecklist + useBuildVersionCheck to compare the running
// build against what an admin has actually marked as deployed.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// Use the service-role key so this public version-check endpoint can read
// the registry regardless of the table's RLS policies (the table itself
// stays locked down to admin/authenticated for direct access).
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Retry transient DB errors (up to 3 attempts with short backoff)
    let data: any = null;
    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await supabase
        .from('deployment_versions')
        .select('build_time, version, notes, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!result.error) {
        data = result.data;
        lastError = null;
        break;
      }
      lastError = result.error;
      console.warn(`[get-deployment-version] attempt ${attempt} failed:`, result.error.message);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 200 * attempt));
    }

    if (lastError) {
      // Graceful degrade — return 200 with nulls so the client doesn't blank-screen
      console.error('[get-deployment-version] all retries failed:', lastError.message);
      return new Response(
        JSON.stringify({ buildTime: null, version: null, notes: null, deployedAt: null, source: 'unavailable' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }


    return new Response(
      JSON.stringify({
        buildTime: data?.build_time ?? null,
        version: data?.version ?? null,
        notes: data?.notes ?? null,
        deployedAt: data?.created_at ?? null,
        source: 'deployment_versions',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          // Always fresh — never cache at the edge or browser
          'Cache-Control': 'no-store, no-cache, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('[get-deployment-version] unexpected:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

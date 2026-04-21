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
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('deployment_versions')
      .select('build_time, version, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[get-deployment-version] db error:', error.message);
      return new Response(JSON.stringify({ error: 'Failed to load deployment version' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

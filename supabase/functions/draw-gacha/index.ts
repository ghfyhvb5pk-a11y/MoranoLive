import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authorization = request.headers.get('Authorization');
    if (!supabaseUrl || !anonKey || !authorization) {
      return new Response(JSON.stringify({ error: 'MISSING_AUTH_CONFIGURATION' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'AUTH_REQUIRED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await request.json().catch(() => ({}));
    const banner = body?.banner;
    const count = body?.count;
    if (!['pickup', 'standard', 'event'].includes(banner) || ![1, 10].includes(count)) {
      return new Response(JSON.stringify({ error: 'INVALID_REQUEST' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // The database function atomically checks the wallet, applies rates/pity, handles duplicates,
    // and writes the pull history. No probabilities or wallet amounts are accepted from the client.
    const { data, error } = await supabase.rpc('draw_gacha', { p_banner: banner, p_count: count });
    if (error) {
      const status = error.message.includes('INSUFFICIENT_GEMS') ? 409 : 400;
      return new Response(JSON.stringify({ error: error.message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

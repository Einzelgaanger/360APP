import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, jwt, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.json().catch(() => ({}));
    const proxy = await fetch(`${SUPABASE_URL}/functions/v1/recommendation-run`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        apikey: SERVICE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = await proxy.json().catch(() => ({}));
    if (!proxy.ok) {
      return new Response(JSON.stringify({ error: payload?.error || "Recommendation run failed" }), {
        status: proxy.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const resources = Array.isArray(payload?.items)
      ? payload.items.map((item: any) => ({
          title: item.title,
          type: item.type,
          source: item.source,
          url: item.url,
          why_relevant: item.why_relevant,
          why_picked: item.why_picked,
          time_commitment: item.time_commitment,
          difficulty: item.difficulty,
          run_id: item.run_id,
          item_id: item.id,
          rank_position: item.rank_position,
        }))
      : [];
    return new Response(JSON.stringify({ resources, run: payload?.run, profile: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("adaptive-resources error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const body = await req.json().catch(() => ({}));
    const proxy = await fetch(`${SUPABASE_URL}/functions/v1/adaptive-resources`, {
      method: "POST",
      headers: {
        Authorization: req.headers.get("Authorization") || "",
        apikey: SERVICE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = await proxy.json().catch(() => ({}));
    if (!proxy.ok) {
      return new Response(JSON.stringify({ error: payload?.error || "Failed to build resources" }), {
        status: proxy.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("research-resources error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

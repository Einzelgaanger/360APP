import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mapping from "./mapping.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const entries = Object.entries(mapping as Record<string, string>);
  let updated = 0;
  const errors: string[] = [];

  // Process in parallel batches of 20
  for (let i = 0; i < entries.length; i += 20) {
    const batch = entries.slice(i, i + 20);
    const promises = batch.map(async ([email, title]) => {
      const { error } = await supabase
        .from("employees")
        .update({ role: title })
        .ilike("email", email);
      if (error) {
        errors.push(`${email}: ${error.message}`);
      } else {
        updated++;
      }
    });
    await Promise.all(promises);
  }

  return new Response(
    JSON.stringify({ updated, totalMappings: entries.length, errorCount: errors.length, sampleErrors: errors.slice(0, 5) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

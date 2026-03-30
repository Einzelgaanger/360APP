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
  let notFound = 0;
  const errors: string[] = [];

  // Process in batches of 50
  for (let i = 0; i < entries.length; i += 50) {
    const batch = entries.slice(i, i + 50);
    
    for (const [email, title] of batch) {
      const { data, error } = await supabase
        .from("employees")
        .update({ role: title })
        .ilike("email", email);
      
      if (error) {
        errors.push(`${email}: ${error.message}`);
      } else {
        updated++;
      }
    }
  }

  return new Response(
    JSON.stringify({ updated, notFound, totalMappings: entries.length, errors: errors.slice(0, 20) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

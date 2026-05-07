import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/growth-hub.ts";

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
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: authData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authData.user.id;
    const body = await req.json().catch(() => ({}));
    const runId = String(body.runId || "");
    const focusArea = String(body.focusArea || "");
    const horizonDays = Math.max(14, Math.min(90, Number(body.horizonDays || 28)));
    if (!runId || !focusArea) {
      return new Response(JSON.stringify({ error: "runId and focusArea are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itemsRes = await adminClient
      .from("recommendation_items")
      .select("id, title, why_relevant, url, rank_position")
      .eq("run_id", runId)
      .eq("user_id", userId)
      .order("rank_position", { ascending: true })
      .limit(4);
    if (itemsRes.error) throw itemsRes.error;
    const items = itemsRes.data || [];
    if (items.length === 0) {
      return new Response(JSON.stringify({ error: "No recommendation items found for run" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pathInsert = await adminClient
      .from("learning_paths")
      .insert({
        user_id: userId,
        focus_area: focusArea,
        title: `${focusArea} 4-week growth path`,
        goal_horizon_days: horizonDays,
        created_from_run_id: runId,
        pipeline_version: "v2",
      })
      .select("*")
      .single();
    if (pathInsert.error || !pathInsert.data) throw pathInsert.error || new Error("Failed creating path");

    const startDate = new Date();
    const dueAt = (days: number) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };

    const steps = [
      {
        step_order: 1,
        step_type: "learn",
        title: `Study: ${items[0].title}`,
        details: items[0].why_relevant,
        recommendation_item_id: items[0].id,
        due_date: dueAt(7),
      },
      {
        step_order: 2,
        step_type: "practice",
        title: `Practice what you learned`,
        details: "Apply the idea in one real work interaction this week.",
        recommendation_item_id: items[1]?.id ?? null,
        due_date: dueAt(14),
        prerequisite_step_ids: [] as string[],
      },
      {
        step_order: 3,
        step_type: "apply",
        title: `Apply in a high-stakes task`,
        details: "Use the behavior in a meaningful task and ask for quick peer feedback.",
        recommendation_item_id: items[2]?.id ?? null,
        due_date: dueAt(21),
        prerequisite_step_ids: [] as string[],
      },
      {
        step_order: 4,
        step_type: "reflect",
        title: `Reflect and lock next action`,
        details: "Capture what changed, what worked, and your next commitment.",
        recommendation_item_id: items[3]?.id ?? null,
        due_date: dueAt(horizonDays),
        prerequisite_step_ids: [] as string[],
      },
    ];

    const stepInsert = await adminClient
      .from("learning_path_steps")
      .insert(
        steps.map((s) => ({
          ...s,
          path_id: pathInsert.data.id,
          user_id: userId,
        })),
      )
      .select("*");
    if (stepInsert.error) throw stepInsert.error;

    return new Response(
      JSON.stringify({ path: pathInsert.data, steps: stepInsert.data || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("learning-path-generate error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});


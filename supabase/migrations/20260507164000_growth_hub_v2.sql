-- Growth Hub V2 foundation schema

-- 1) Canonical resource registry + trust policy
CREATE TABLE IF NOT EXISTS public.source_domain_policy (
  domain text PRIMARY KEY,
  policy text NOT NULL CHECK (policy IN ('allow', 'neutral', 'deny')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resource_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_url text NOT NULL UNIQUE,
  normalized_domain text NOT NULL,
  title text NOT NULL,
  source text,
  resource_type text CHECK (resource_type IN ('article', 'book', 'video', 'exercise')),
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'blocked')),
  trust_score numeric(5,2) NOT NULL DEFAULT 0,
  quality_score numeric(5,2),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_catalog_domain ON public.resource_catalog(normalized_domain);
CREATE INDEX IF NOT EXISTS idx_resource_catalog_last_seen ON public.resource_catalog(last_seen_at DESC);

ALTER TABLE public.resource_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Resource catalog readable by authenticated" ON public.resource_catalog;
CREATE POLICY "Resource catalog readable by authenticated"
  ON public.resource_catalog FOR SELECT TO authenticated USING (true);

ALTER TABLE public.source_domain_policy ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Source policy readable by authenticated" ON public.source_domain_policy;
CREATE POLICY "Source policy readable by authenticated"
  ON public.source_domain_policy FOR SELECT TO authenticated USING (true);

-- 2) Recommendation runs/items/events
CREATE TABLE IF NOT EXISTS public.recommendation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  focus_area text NOT NULL,
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  input_snapshot_hash text NOT NULL,
  pipeline_version text NOT NULL DEFAULT 'v2',
  provider text NOT NULL DEFAULT 'claude',
  model text,
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending', 'succeeded', 'failed')),
  error_message text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_runs_user_focus ON public.recommendation_runs(user_id, focus_area, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_runs_generated ON public.recommendation_runs(generated_at DESC);

ALTER TABLE public.recommendation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own recommendation runs" ON public.recommendation_runs;
CREATE POLICY "Users select own recommendation runs"
  ON public.recommendation_runs FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own recommendation runs" ON public.recommendation_runs;
CREATE POLICY "Users insert own recommendation runs"
  ON public.recommendation_runs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.recommendation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.recommendation_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  resource_catalog_id uuid REFERENCES public.resource_catalog(id) ON DELETE SET NULL,
  resource_id text NOT NULL,
  rank_position int NOT NULL CHECK (rank_position > 0),
  title text NOT NULL,
  source text,
  url text,
  type text NOT NULL CHECK (type IN ('article', 'book', 'video', 'exercise')),
  difficulty text NOT NULL CHECK (difficulty IN ('foundational', 'intermediate', 'advanced')),
  time_commitment text,
  why_relevant text,
  why_picked text,
  deterministic_score numeric(8,4) NOT NULL DEFAULT 0,
  score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason_codes text[] NOT NULL DEFAULT '{}',
  trust_score numeric(5,2) NOT NULL DEFAULT 0,
  trust_flags text[] NOT NULL DEFAULT '{}',
  pipeline_version text NOT NULL DEFAULT 'v2',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recommendation_items_run_rank ON public.recommendation_items(run_id, rank_position);
CREATE INDEX IF NOT EXISTS idx_recommendation_items_user_created ON public.recommendation_items(user_id, created_at DESC);

ALTER TABLE public.recommendation_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own recommendation items" ON public.recommendation_items;
CREATE POLICY "Users select own recommendation items"
  ON public.recommendation_items FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own recommendation items" ON public.recommendation_items;
CREATE POLICY "Users insert own recommendation items"
  ON public.recommendation_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.recommendation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  run_id uuid REFERENCES public.recommendation_runs(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.recommendation_items(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'opened', 'saved', 'dismissed', 'completed', 'feedback_up', 'feedback_down')),
  position int,
  focus_area text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_events_user_date ON public.recommendation_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_events_run_item ON public.recommendation_events(run_id, item_id);

ALTER TABLE public.recommendation_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users select own recommendation events" ON public.recommendation_events;
CREATE POLICY "Users select own recommendation events"
  ON public.recommendation_events FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own recommendation events" ON public.recommendation_events;
CREATE POLICY "Users insert own recommendation events"
  ON public.recommendation_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 3) Learning paths + progress
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  focus_area text NOT NULL,
  title text NOT NULL,
  goal_horizon_days int NOT NULL DEFAULT 28 CHECK (goal_horizon_days > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  pipeline_version text NOT NULL DEFAULT 'v2',
  created_from_run_id uuid REFERENCES public.recommendation_runs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_user_status ON public.learning_paths(user_id, status, created_at DESC);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own learning paths select" ON public.learning_paths;
CREATE POLICY "Users manage own learning paths select"
  ON public.learning_paths FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users manage own learning paths insert" ON public.learning_paths;
CREATE POLICY "Users manage own learning paths insert"
  ON public.learning_paths FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users manage own learning paths update" ON public.learning_paths;
CREATE POLICY "Users manage own learning paths update"
  ON public.learning_paths FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users manage own learning paths delete" ON public.learning_paths;
CREATE POLICY "Users manage own learning paths delete"
  ON public.learning_paths FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.learning_path_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  step_order int NOT NULL CHECK (step_order > 0),
  step_type text NOT NULL CHECK (step_type IN ('learn', 'practice', 'reflect', 'apply')),
  title text NOT NULL,
  details text,
  estimated_minutes int,
  recommendation_item_id uuid REFERENCES public.recommendation_items(id) ON DELETE SET NULL,
  prerequisite_step_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_path_steps_path_order ON public.learning_path_steps(path_id, step_order);
CREATE INDEX IF NOT EXISTS idx_learning_path_steps_user_status ON public.learning_path_steps(user_id, status, due_date);

ALTER TABLE public.learning_path_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own learning path steps select" ON public.learning_path_steps;
CREATE POLICY "Users manage own learning path steps select"
  ON public.learning_path_steps FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users manage own learning path steps insert" ON public.learning_path_steps;
CREATE POLICY "Users manage own learning path steps insert"
  ON public.learning_path_steps FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users manage own learning path steps update" ON public.learning_path_steps;
CREATE POLICY "Users manage own learning path steps update"
  ON public.learning_path_steps FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users manage own learning path steps delete" ON public.learning_path_steps;
CREATE POLICY "Users manage own learning path steps delete"
  ON public.learning_path_steps FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.path_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.learning_path_steps(id) ON DELETE CASCADE,
  evidence_text text,
  evidence_url text,
  confidence_rating int CHECK (confidence_rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_path_progress_user_path ON public.path_progress(user_id, path_id, created_at DESC);

ALTER TABLE public.path_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own path progress select" ON public.path_progress;
CREATE POLICY "Users manage own path progress select"
  ON public.path_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users manage own path progress insert" ON public.path_progress;
CREATE POLICY "Users manage own path progress insert"
  ON public.path_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users manage own path progress update" ON public.path_progress;
CREATE POLICY "Users manage own path progress update"
  ON public.path_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users manage own path progress delete" ON public.path_progress;
CREATE POLICY "Users manage own path progress delete"
  ON public.path_progress FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 4) Daily evaluation aggregates
CREATE TABLE IF NOT EXISTS public.evaluation_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  provider text NOT NULL,
  pipeline_version text NOT NULL,
  focus_area text,
  runs_count int NOT NULL DEFAULT 0,
  impressions_count int NOT NULL DEFAULT 0,
  opens_count int NOT NULL DEFAULT 0,
  saves_count int NOT NULL DEFAULT 0,
  completes_count int NOT NULL DEFAULT 0,
  dismisses_count int NOT NULL DEFAULT 0,
  ctr numeric(8,4) NOT NULL DEFAULT 0,
  save_rate numeric(8,4) NOT NULL DEFAULT 0,
  completion_rate numeric(8,4) NOT NULL DEFAULT 0,
  avg_rank_score numeric(10,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (metric_date, provider, pipeline_version, focus_area)
);

CREATE INDEX IF NOT EXISTS idx_eval_metrics_date ON public.evaluation_metrics_daily(metric_date DESC);

ALTER TABLE public.evaluation_metrics_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read daily evaluation metrics" ON public.evaluation_metrics_daily;
CREATE POLICY "Authenticated can read daily evaluation metrics"
  ON public.evaluation_metrics_daily FOR SELECT TO authenticated USING (true);

-- 5) Helper procedures for evaluator and path rollups
CREATE OR REPLACE FUNCTION public.refresh_recommendation_metrics(target_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.evaluation_metrics_daily (
    metric_date,
    provider,
    pipeline_version,
    focus_area,
    runs_count,
    impressions_count,
    opens_count,
    saves_count,
    completes_count,
    dismisses_count,
    ctr,
    save_rate,
    completion_rate,
    avg_rank_score
  )
  SELECT
    target_date AS metric_date,
    COALESCE(r.provider, 'unknown') AS provider,
    COALESCE(r.pipeline_version, 'unknown') AS pipeline_version,
    r.focus_area,
    COUNT(DISTINCT r.id) AS runs_count,
    COUNT(*) FILTER (WHERE e.event_type = 'impression') AS impressions_count,
    COUNT(*) FILTER (WHERE e.event_type = 'opened') AS opens_count,
    COUNT(*) FILTER (WHERE e.event_type = 'saved') AS saves_count,
    COUNT(*) FILTER (WHERE e.event_type = 'completed') AS completes_count,
    COUNT(*) FILTER (WHERE e.event_type = 'dismissed') AS dismisses_count,
    CASE WHEN COUNT(*) FILTER (WHERE e.event_type = 'impression') > 0
      THEN (COUNT(*) FILTER (WHERE e.event_type = 'opened'))::numeric / (COUNT(*) FILTER (WHERE e.event_type = 'impression'))::numeric
      ELSE 0::numeric END AS ctr,
    CASE WHEN COUNT(*) FILTER (WHERE e.event_type = 'opened') > 0
      THEN (COUNT(*) FILTER (WHERE e.event_type = 'saved'))::numeric / (COUNT(*) FILTER (WHERE e.event_type = 'opened'))::numeric
      ELSE 0::numeric END AS save_rate,
    CASE WHEN COUNT(*) FILTER (WHERE e.event_type = 'opened') > 0
      THEN (COUNT(*) FILTER (WHERE e.event_type = 'completed'))::numeric / (COUNT(*) FILTER (WHERE e.event_type = 'opened'))::numeric
      ELSE 0::numeric END AS completion_rate,
    AVG(i.deterministic_score) AS avg_rank_score
  FROM public.recommendation_runs r
  LEFT JOIN public.recommendation_items i ON i.run_id = r.id
  LEFT JOIN public.recommendation_events e ON e.run_id = r.id
  WHERE date_trunc('day', r.generated_at)::date = target_date
  GROUP BY r.provider, r.pipeline_version, r.focus_area
  ON CONFLICT (metric_date, provider, pipeline_version, focus_area)
  DO UPDATE SET
    runs_count = EXCLUDED.runs_count,
    impressions_count = EXCLUDED.impressions_count,
    opens_count = EXCLUDED.opens_count,
    saves_count = EXCLUDED.saves_count,
    completes_count = EXCLUDED.completes_count,
    dismisses_count = EXCLUDED.dismisses_count,
    ctr = EXCLUDED.ctr,
    save_rate = EXCLUDED.save_rate,
    completion_rate = EXCLUDED.completion_rate,
    avg_rank_score = EXCLUDED.avg_rank_score;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_recommendation_metrics(date) TO service_role;

-- Use existing updated_at trigger helper if present.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'tg_set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_learning_paths_updated ON public.learning_paths;
    CREATE TRIGGER trg_learning_paths_updated
      BEFORE UPDATE ON public.learning_paths
      FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

    DROP TRIGGER IF EXISTS trg_learning_path_steps_updated ON public.learning_path_steps;
    CREATE TRIGGER trg_learning_path_steps_updated
      BEFORE UPDATE ON public.learning_path_steps
      FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

    DROP TRIGGER IF EXISTS trg_source_domain_policy_updated ON public.source_domain_policy;
    CREATE TRIGGER trg_source_domain_policy_updated
      BEFORE UPDATE ON public.source_domain_policy
      FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END
$$;


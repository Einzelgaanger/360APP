-- 1. learning_interactions
CREATE TABLE public.learning_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_id text NOT NULL,
  resource_title text,
  resource_format text,
  focus_area text NOT NULL,
  action text NOT NULL CHECK (action IN ('viewed','opened','saved','dismissed','completed','checked_in')),
  duration_seconds integer,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_learning_interactions_user ON public.learning_interactions(user_id, created_at DESC);
CREATE INDEX idx_learning_interactions_resource ON public.learning_interactions(user_id, resource_id);

ALTER TABLE public.learning_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own interactions" ON public.learning_interactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own interactions" ON public.learning_interactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own interactions" ON public.learning_interactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own interactions" ON public.learning_interactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 2. resource_feedback
CREATE TABLE public.resource_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_id text NOT NULL,
  resource_title text,
  focus_area text,
  relevance_score integer NOT NULL CHECK (relevance_score BETWEEN 1 AND 5),
  reason_tag text CHECK (reason_tag IN ('too_basic','off_topic','wrong_format','great_fit','already_knew','too_advanced','perfect_timing')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);
CREATE INDEX idx_resource_feedback_user ON public.resource_feedback(user_id, created_at DESC);

ALTER TABLE public.resource_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own feedback" ON public.resource_feedback FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own feedback" ON public.resource_feedback FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own feedback" ON public.resource_feedback FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own feedback" ON public.resource_feedback FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 3. learning_reflections
CREATE TABLE public.learning_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_starting date NOT NULL,
  what_i_learned text,
  what_changed text,
  what_next text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_starting)
);
CREATE INDEX idx_learning_reflections_user ON public.learning_reflections(user_id, week_starting DESC);

ALTER TABLE public.learning_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own reflections" ON public.learning_reflections FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own reflections" ON public.learning_reflections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own reflections" ON public.learning_reflections FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own reflections" ON public.learning_reflections FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER tg_learning_reflections_updated
  BEFORE UPDATE ON public.learning_reflections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
-- Individual Development Plans (IDP)
CREATE TABLE public.development_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id UUID,
  focus_area TEXT NOT NULL,
  goal TEXT NOT NULL,
  why_it_matters TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  progress_notes TEXT,
  last_check_in_at TIMESTAMPTZ,
  next_check_in_at TIMESTAMPTZ DEFAULT (now() + interval '60 days'),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.development_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plans select" ON public.development_plans FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users manage own plans insert" ON public.development_plans FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own plans update" ON public.development_plans FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own plans delete" ON public.development_plans FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_dev_plans_user ON public.development_plans(user_id);
CREATE INDEX idx_dev_plans_check_in ON public.development_plans(next_check_in_at) WHERE status = 'active';

-- Cached AI growth research (article/video/book recommendations)
CREATE TABLE public.growth_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  focus_area TEXT NOT NULL,
  resources JSONB NOT NULL,
  feedback_snapshot TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days')
);

ALTER TABLE public.growth_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own resources" ON public.growth_resources FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own resources" ON public.growth_resources FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own resources" ON public.growth_resources FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_growth_resources_user ON public.growth_resources(user_id, focus_area);

-- Self-debrief reflections (private journal after viewing feedback)
CREATE TABLE public.feedback_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  surprised_by TEXT,
  agreed_with TEXT,
  disagreed_with TEXT,
  one_change TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own reflections" ON public.feedback_reflections FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own reflections" ON public.feedback_reflections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own reflections" ON public.feedback_reflections FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_dev_plans_updated BEFORE UPDATE ON public.development_plans FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_reflections_updated BEFORE UPDATE ON public.feedback_reflections FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
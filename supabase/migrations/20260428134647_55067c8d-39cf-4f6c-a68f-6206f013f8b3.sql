ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS subsidiary_id uuid,
ADD COLUMN IF NOT EXISTS hierarchy_level integer,
ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS profile_confirmed_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_profiles_subsidiary_id ON public.profiles(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON public.profiles(profile_completed);

DROP POLICY IF EXISTS "Users can update own profile completion" ON public.profiles;
CREATE POLICY "Users can update own profile completion"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update matching employee record" ON public.employees;
CREATE POLICY "Users can update matching employee record"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  lower(coalesce(email, '')) = lower(coalesce((SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()), ''))
)
WITH CHECK (
  lower(coalesce(email, '')) = lower(coalesce((SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()), ''))
);
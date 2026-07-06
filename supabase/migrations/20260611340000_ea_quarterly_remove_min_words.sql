-- EA quarterly: drop 40-word minimum on narrative prompts (text still required, any length).

UPDATE public.assessment_questions q
SET min_words = NULL
FROM public.assessment_forms f
WHERE q.form_id = f.id
  AND f.code = 'ea_quarterly'
  AND q.min_words IS NOT NULL;

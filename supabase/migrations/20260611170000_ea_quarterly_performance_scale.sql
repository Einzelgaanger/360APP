-- EA quarterly: performance rubric labels (1–6) instead of Likert agree/disagree.

UPDATE public.assessment_forms
SET
  scale_min = 1,
  scale_max = 6,
  description = 'Manager evaluation of Executive Assistant — performance rubric (May 2026).'
WHERE code = 'ea_quarterly';

UPDATE public.assessment_questions q
SET helper_text = '1=Did not perform/unrated … 6=Exceptional Performance.'
FROM public.assessment_forms f
WHERE q.form_id = f.id
  AND f.code = 'ea_quarterly'
  AND q.question_type = 'scored'
  AND q.section = 'Delivery & OKRs'
  AND q.sort_order = 1;

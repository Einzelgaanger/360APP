-- Unified BOOM 1–5 rating scale, executive Q4/Q13 copy, EA quarterly scale revert to 5.

UPDATE public.assessment_forms
SET scale_min = 1, scale_max = 5
WHERE code IN ('executive', 'ea_quarterly', 'peer_360');

UPDATE public.assessment_questions q
SET question_text = 'Q4: What do you need to start, stop, or continue doing in your mandate, team, and outputs?'
FROM public.assessment_forms f
WHERE q.form_id = f.id
  AND f.code = 'executive'
  AND q.section = 'Strategic Context — Saturn to Uranus'
  AND q.sort_order = 2
  AND q.question_type = 'written';

UPDATE public.assessment_questions q
SET question_text = 'Q13 (Adaptability): Explain your default response under pressure or ambiguity and what it shows about your Saturn→Uranus transition.'
FROM public.assessment_forms f
WHERE q.form_id = f.id
  AND f.code = 'executive'
  AND q.section = 'Culture & Behavioural Standards'
  AND q.sort_order = 8
  AND q.question_type = 'written';

UPDATE public.assessment_questions q
SET helper_text = '1 = Significant Gap … 5 = Exceptional (see rating scale at top of form).'
FROM public.assessment_forms f
WHERE q.form_id = f.id
  AND f.code = 'executive'
  AND q.question_type = 'scored';

UPDATE public.assessment_questions q
SET helper_text = '1 = Significant Gap … 5 = Exceptional (see rating scale at top of form).'
FROM public.assessment_forms f
WHERE q.form_id = f.id
  AND f.code = 'ea_quarterly'
  AND q.question_type = 'scored';

UPDATE public.assessment_forms
SET description = 'Manager evaluation of Executive Assistant — unified BOOM 1–5 scale (see rating table in form).'
WHERE code = 'ea_quarterly';

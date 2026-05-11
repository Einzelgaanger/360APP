-- Align assessment question banks with BOOM / VGG May 2026 documents.
-- DESTRUCTIVE: removes all submitted/draft answers for peer_360, executive, and ea_quarterly
-- so question IDs stay consistent with new rubrics. Run before production traffic if possible.

-- ---------- peer_360 ----------
DELETE FROM public.assessment_answers a
USING public.assessment_responses r
JOIN public.assessment_forms f ON f.id = r.form_id
WHERE a.response_id = r.id AND f.code = 'peer_360';

DELETE FROM public.assessment_questions q
USING public.assessment_forms f
WHERE q.form_id = f.id AND f.code = 'peer_360';

UPDATE public.assessment_forms
SET
  title = 'Quarterly 360° Peer Review',
  description = 'Anonymous behaviourally anchored peer review (May 2026 EO instrument). Use N/O when you have not observed the behaviour.'
WHERE code = 'peer_360';

WITH f AS (SELECT id FROM public.assessment_forms WHERE code = 'peer_360')
INSERT INTO public.assessment_questions (form_id, section, section_order, sort_order, question_text, question_type, min_words, helper_text, audience)
SELECT f.id, s.section, s.so, s.qo, s.q, s.qt, s.mw, s.h, s.aud
FROM f, (VALUES
  ('Cultural Agility & Humility', 1, 1, 'Admits mistakes openly and uses them as a basis for improvement rather than concealing or deflecting them.', 'scored', NULL::int, NULL::text, 'all'),
  ('Cultural Agility & Humility', 1, 2, 'Shows humility under pressure and treats others with respect regardless of seniority or role.', 'scored', NULL::int, NULL::text, 'all'),
  ('Cultural Agility & Humility', 1, 3, 'Demonstrates emotional maturity by staying composed during conflict, tension, or a difficult instruction.', 'scored', NULL::int, NULL::text, 'all'),
  ('Cultural Agility & Humility', 1, 4, 'Actively seeks feedback from peers and colleagues and visibly acts on it.', 'scored', NULL::int, NULL::text, 'all'),
  ('Cultural Agility & Humility', 1, 5, 'Listens to others before making decisions or taking action — and genuinely acknowledges others'' contributions.', 'scored', NULL::int, NULL::text, 'all'),
  ('Cultural Agility & Humility', 1, 6, 'Responds constructively when colleagues make mistakes rather than distancing themselves or judging.', 'scored', NULL::int, NULL::text, 'all'),
  ('Cultural Agility & Humility', 1, 7, 'Demonstrates willingness to learn from anyone in the team regardless of their seniority or experience.', 'scored', NULL::int, NULL::text, 'all'),
  ('Cultural Agility & Humility', 1, 8, 'Listens actively and respectfully even when others'' opinions differ significantly from their own.', 'scored', NULL::int, NULL::text, 'all'),
  ('Collaboration & Partnership', 2, 1, 'Shares knowledge, information, and context freely with colleagues rather than operating in isolation.', 'scored', NULL::int, NULL::text, 'all'),
  ('Collaboration & Partnership', 2, 2, 'Collaborates effectively with other verticals to achieve shared outcomes for the executive or the office.', 'scored', NULL::int, NULL::text, 'all'),
  ('Collaboration & Partnership', 2, 3, 'Addresses conflicts or misalignments constructively and early rather than letting them compound.', 'scored', NULL::int, NULL::text, 'all'),
  ('Collaboration & Partnership', 2, 4, 'Acts as a connector — brings together people or information across the team to solve problems.', 'scored', NULL::int, NULL::text, 'all'),
  ('Collaboration & Partnership', 2, 5, 'Operates with a One Executive Office mindset rather than focusing solely on their own vertical''s interests.', 'scored', NULL::int, NULL::text, 'all'),
  ('Collaboration & Partnership', 2, 6, 'Proactively shares updates, context, or relevant information with the team without being prompted.', 'scored', NULL::int, NULL::text, 'all'),
  ('BOOM Philosophy in Practice', 3, 1, 'Uses BOOM language and framing naturally in their work — not performatively and not only when prompted by leadership.', 'scored', NULL::int, NULL::text, 'all'),
  ('BOOM Philosophy in Practice', 3, 2, 'Makes decisions that reflect long-term institutional value rather than short-term convenience or personal ease.', 'scored', NULL::int, NULL::text, 'all'),
  ('BOOM Philosophy in Practice', 3, 3, 'Demonstrates execution-first behaviour: moves from direction to action quickly without requiring repeated prompting.', 'scored', NULL::int, NULL::text, 'all'),
  ('BOOM Philosophy in Practice', 3, 4, 'Operates with institutional calm under pressure — maintains process discipline even when the environment is chaotic.', 'scored', NULL::int, NULL::text, 'all'),
  ('BOOM Philosophy in Practice', 3, 5, 'Builds things rather than just completing tasks — work creates something reusable, systematic, or compounding.', 'scored', NULL::int, NULL::text, 'all'),
  ('BOOM Philosophy in Practice', 3, 6, 'Takes full ownership of outcomes from start to finish rather than completing their part and stepping back.', 'scored', NULL::int, NULL::text, 'all'),
  ('Communication & Responsiveness', 4, 1, 'Communicates clearly, consistently, and in a timely manner with team members and stakeholders.', 'scored', NULL::int, NULL::text, 'all'),
  ('Communication & Responsiveness', 4, 2, 'Responds promptly to messages, escalations, and requests — avoids delays that affect the workflow of others.', 'scored', NULL::int, NULL::text, 'all'),
  ('Communication & Responsiveness', 4, 3, 'Shares essential information early enough for colleagues to act on it appropriately.', 'scored', NULL::int, NULL::text, 'all'),
  ('Communication & Responsiveness', 4, 4, 'Keeps the relevant people informed without needing to be chased or reminded.', 'scored', NULL::int, NULL::text, 'all'),
  ('Communication & Responsiveness', 4, 5, 'Demonstrates openness, transparency, and accountability in communications — does not obscure or hedge.', 'scored', NULL::int, NULL::text, 'all'),
  ('Executive Office Standards', 5, 1, 'Handles sensitive information with strict confidentiality — no leaks, no casual sharing.', 'scored', NULL::int, NULL::text, 'all'),
  ('Executive Office Standards', 5, 2, 'Understands how their vertical connects to and depends on the other verticals; operates with that context.', 'scored', NULL::int, NULL::text, 'all'),
  ('Executive Office Standards', 5, 3, 'Produces work that is complete and accurate the first time — minimal repeated correction or clarification.', 'scored', NULL::int, NULL::text, 'all'),
  ('Executive Office Standards', 5, 4, 'Anticipates what is needed before being asked rather than waiting for a specific instruction.', 'scored', NULL::int, NULL::text, 'all'),
  ('Executive Office Standards', 5, 5, 'Maintains standards under pressure — quality does not drop when workload is high or the environment uncertain.', 'scored', NULL::int, NULL::text, 'all'),
  ('Executive Office Standards', 5, 6, 'Documents work and decisions so others can access, understand, and build on them — not held only in their head.', 'scored', NULL::int, NULL::text, 'all'),
  ('Governance, Integrity & Discretion', 6, 1, 'Upholds ethical conduct — no shortcuts or personal interest over the team.', 'scored', NULL::int, NULL::text, 'all'),
  ('Governance, Integrity & Discretion', 6, 2, 'Models accountability — owns decisions, mistakes, and outcomes without deflection.', 'scored', NULL::int, NULL::text, 'all'),
  ('Governance, Integrity & Discretion', 6, 3, 'Respects EO authority structure and contributes to order, discipline, and clear accountability.', 'scored', NULL::int, NULL::text, 'all'),
  ('Governance, Integrity & Discretion', 6, 4, 'Handles required documentation, reports, and information accurately and on time.', 'scored', NULL::int, NULL::text, 'all'),
  ('Governance, Integrity & Discretion', 6, 5, 'Demonstrates behaviour consistent with the reputational stakes of the Executive Office.', 'scored', NULL::int, NULL::text, 'all'),
  ('Development & Team Contribution', 7, 1, 'Actively supports colleagues when they are stretched — without being asked.', 'scored', NULL::int, NULL::text, 'all'),
  ('Development & Team Contribution', 7, 2, 'Shares knowledge, skills, and learnings with the team rather than keeping expertise siloed.', 'scored', NULL::int, NULL::text, 'all'),
  ('Development & Team Contribution', 7, 3, 'Provides honest, constructive feedback to peers when relevant and helpful.', 'scored', NULL::int, NULL::text, 'all'),
  ('Development & Team Contribution', 7, 4, 'Sets an example newer or junior colleagues can learn from.', 'scored', NULL::int, NULL::text, 'all'),
  ('Development & Team Contribution', 7, 5, 'Raises the standard around them — their presence makes the team better.', 'scored', NULL::int, NULL::text, 'all'),
  ('Development — Managers / Executive leaders', 8, 1, 'Actively develops capability in their vertical — identifies gaps, creates learning opportunities, builds people.', 'scored', NULL::int, 'Shown only to managers and executive leaders (hierarchy level ≤ 2).', 'manager_only'),
  ('Development — Managers / Executive leaders', 8, 2, 'Delegates meaningfully — gives real ownership and accountability rather than hoarding critical work.', 'scored', NULL::int, NULL::text, 'manager_only'),
  ('Development — Managers / Executive leaders', 8, 3, 'Provides structured, honest feedback regularly — not only in formal review moments.', 'scored', NULL::int, NULL::text, 'manager_only'),
  ('Development — Managers / Executive leaders', 8, 4, 'Has a clear view of who is ready for more responsibility and creates conditions for growth.', 'scored', NULL::int, NULL::text, 'manager_only'),
  ('Development — Managers / Executive leaders', 8, 5, 'Reduces dependency on themselves — systems and documentation survive their absence.', 'scored', NULL::int, NULL::text, 'manager_only'),
  ('Development — Managers / Executive leaders', 8, 6, 'Makes decisions that serve the institution long term over short-term ease or personal standing.', 'scored', NULL::int, NULL::text, 'manager_only'),
  ('Development — Managers / Executive leaders', 8, 7, 'Operates as a leadership presence across the wider EO — not only within their vertical.', 'scored', NULL::int, NULL::text, 'manager_only'),
  ('Development — Managers / Executive leaders', 8, 8, 'Manages upward effectively — keeps the EO Lead informed, flags risks early, surfaces problems early.', 'scored', NULL::int, NULL::text, 'manager_only'),
  ('Open Questions', 9, 1, 'Provide a specific example of an area where this person could meaningfully improve. What is the gap and what would fixed look like?', 'written', NULL::int, 'Be specific. Generic answers are not useful.', 'all'),
  ('Open Questions', 9, 2, 'What should this person STOP doing? Up to 3 specific behaviours.', 'written', NULL::int, NULL::text, 'all'),
  ('Open Questions', 9, 3, 'What should this person START doing? Up to 3 specific behaviours.', 'written', NULL::int, NULL::text, 'all'),
  ('Open Questions', 9, 4, 'What should this person CONTINUE doing? Up to 3 specific behaviours.', 'written', NULL::int, NULL::text, 'all'),
  ('Open Questions', 9, 5, 'Anything else the Executive Office Lead should know about this person''s contribution or impact this quarter?', 'written', NULL::int, NULL::text, 'all')
) AS s(section, so, qo, q, qt, mw, h, aud)
WHERE EXISTS (SELECT 1 FROM f);

-- ---------- executive (EPA v2.0 executive-facing layer: self-rating + 200w narrative per item) ----------
DELETE FROM public.assessment_answers a
USING public.assessment_responses r
JOIN public.assessment_forms f ON f.id = r.form_id
WHERE a.response_id = r.id AND f.code = 'executive';

DELETE FROM public.assessment_questions q
USING public.assessment_forms f
WHERE q.form_id = f.id AND f.code = 'executive';

UPDATE public.assessment_forms
SET
  title = 'Executive Performance Assessment (BOOM-EPA v2)',
  description = 'Quarterly executive self-assessment: self-rating plus evidence (min. 200 words) per prompt. Assessor workflow is outside this submission.'
WHERE code = 'executive';

WITH f AS (SELECT id FROM public.assessment_forms WHERE code = 'executive')
INSERT INTO public.assessment_questions (form_id, section, section_order, sort_order, question_text, question_type, min_words, helper_text, audience)
SELECT f.id, s.section, s.so, s.qo, s.q, s.qt, s.mw, s.h, 'all'::text
FROM f, (VALUES
  ('BOOM Philosophy Comprehension', 1, 1, 'Self-rating (1–5): depth of BOOM internalisation — Q1 Camel thesis & application.', 'scored', NULL::int, '1=Significant gap … 5=Exceptional (see rating scale in hub).'::text),
  ('BOOM Philosophy Comprehension', 1, 2, 'Q1: In your own words — not definitions — what is the Camel thesis, and where in your function''s work this quarter have you applied it or failed to apply it? Be specific. Minimum 200 words.', 'written', 200, 'Vague or generic responses should be scored as developing by assessors.'::text),
  ('BOOM Philosophy Comprehension', 1, 3, 'Self-rating (1–5): BOOM as seal vs container — Q2.', 'scored', NULL::int, NULL::text),
  ('BOOM Philosophy Comprehension', 1, 4, 'Q2: BOOM certifies how something is built, not what it owns. What does that mean for how you operate? Give one recent decision that reflects this and one where hindsight says it did not.', 'written', 200, NULL::text),
  ('BOOM Philosophy Comprehension', 1, 5, 'Self-rating (1–5): institutional gap ownership — Q3.', 'scored', NULL::int, NULL::text),
  ('BOOM Philosophy Comprehension', 1, 6, 'Q3: Where is the gap between BOOM understood philosophically and how it shows up daily? What is your specific role in closing that gap?', 'written', 200, NULL::text),
  ('Strategic Context — Saturn to Uranus', 2, 1, 'Self-rating (1–5): Uranus expectations for your function — Q4.', 'scored', NULL::int, NULL::text),
  ('Strategic Context — Saturn to Uranus', 2, 2, 'Q4: What does Saturn→Uranus mean for your mandate, team, and outputs — stop / start / do differently?', 'written', 200, NULL::text),
  ('Strategic Context — Saturn to Uranus', 2, 3, 'Self-rating (1–5): personal Saturn habit — Q5.', 'scored', NULL::int, NULL::text),
  ('Strategic Context — Saturn to Uranus', 2, 4, 'Q5: Name one Saturn habit you carried into this role; what it looks like in practice; what you are doing to practise Uranus discipline instead.', 'written', 200, NULL::text),
  ('Strategic Context — Saturn to Uranus', 2, 5, 'Self-rating (1–5): decision under pressure — Q6.', 'scored', NULL::int, NULL::text),
  ('Strategic Context — Saturn to Uranus', 2, 6, 'Q6: Walk through a specific last-quarter decision: was it Saturn or Uranus in nature, and why?', 'written', 200, NULL::text),
  ('Work Output Quality', 3, 1, 'Self-rating (1–5): significance of outputs — Q7.', 'scored', NULL::int, NULL::text),
  ('Work Output Quality', 3, 2, 'Q7: Name three significant outputs; for each — BOOM principle anchored in, what it was designed to build, and actual or expected impact.', 'written', 200, NULL::text),
  ('Work Output Quality', 3, 3, 'Self-rating (1–5): honest weakness in output — Q8.', 'scored', NULL::int, NULL::text),
  ('Work Output Quality', 3, 4, 'Q8: Name one work product you would not submit as BOOM-aligned evidence. What fell short, and what would the BOOM-standard version look like?', 'written', 200, NULL::text),
  ('Work Output Quality', 3, 5, 'Self-rating (1–5): root-cause quality gap — Q9.', 'scored', NULL::int, NULL::text),
  ('Work Output Quality', 3, 6, 'Q9: Where does output quality fall short of the standard you hold for your function? Root cause and concrete plan to close the gap.', 'written', 200, NULL::text),
  ('Culture & Behavioural Standards', 4, 1, 'Self-rating (1–5): Integrity moment — Q10.', 'scored', NULL::int, 'Integrity combined average ≤2 triggers escalation per policy.'::text),
  ('Culture & Behavioural Standards', 4, 2, 'Q10 (Integrity): A moment choosing between convenient and right — what did you choose and what did it cost?', 'written', 200, NULL::text),
  ('Culture & Behavioural Standards', 4, 3, 'Self-rating (1–5): Excellence gap — Q11.', 'scored', NULL::int, NULL::text),
  ('Culture & Behavioural Standards', 4, 4, 'Q11 (Excellence): Where are you operating below your own standard — why, and what are you doing about it?', 'written', 200, NULL::text),
  ('Culture & Behavioural Standards', 4, 5, 'Self-rating (1–5): Mutual respect / silo vs peer — Q12.', 'scored', NULL::int, NULL::text),
  ('Culture & Behavioural Standards', 4, 6, 'Q12 (Mutual Respect): Cross-functional interactions — one peer example and one silo example from the last quarter.', 'written', 200, NULL::text),
  ('Culture & Behavioural Standards', 4, 7, 'Self-rating (1–5): Adaptability under stress — Q13.', 'scored', NULL::int, NULL::text),
  ('Culture & Behavioural Standards', 4, 8, 'Q13 (Adaptability): Pressure/ambiguity moment — default response and what it shows about your Saturn→Uranus transition.', 'written', 200, NULL::text),
  ('Culture & Behavioural Standards', 4, 9, 'Self-rating (1–5): Innovation — Q14.', 'scored', NULL::int, NULL::text),
  ('Culture & Behavioural Standards', 4, 10, 'Q14 (Innovation): One conventional assumption you challenged — drivers, result, how you know it was innovation vs change for its own sake.', 'written', 200, NULL::text),
  ('Culture & Behavioural Standards', 4, 11, 'Self-rating (1–5): Overachievement / ownership — Q15.', 'scored', NULL::int, NULL::text),
  ('Culture & Behavioural Standards', 4, 12, 'Q15 (Overachievement): What did you fully own end-to-end — outcome and what your name on it actually means?', 'written', 200, NULL::text),
  ('Role-Specific OKRs', 5, 1, 'Self-rating (1–5): OKR 1 performance this period.', 'scored', NULL::int, 'Align objective wording with EO Lead outside the app if needed.'::text),
  ('Role-Specific OKRs', 5, 2, 'OKR 1: Written justification (minimum 200 words) explaining the rating — not restating the OKR text.', 'written', 200, 'If rating is 1–2, explain shortfall and remediation plan.'::text),
  ('Role-Specific OKRs', 5, 3, 'Self-rating (1–5): OKR 2 performance this period.', 'scored', NULL::int, NULL::text),
  ('Role-Specific OKRs', 5, 4, 'OKR 2: Written justification (minimum 200 words).', 'written', 200, NULL::text),
  ('Role-Specific OKRs', 5, 5, 'Self-rating (1–5): OKR 3 performance this period.', 'scored', NULL::int, NULL::text),
  ('Role-Specific OKRs', 5, 6, 'OKR 3: Written justification (minimum 200 words).', 'written', 200, NULL::text),
  ('Role-Specific OKRs', 5, 7, 'Self-rating (1–5): OKR 4 performance this period.', 'scored', NULL::int, NULL::text),
  ('Role-Specific OKRs', 5, 8, 'OKR 4: Written justification (minimum 200 words).', 'written', 200, NULL::text)
) AS s(section, so, qo, q, qt, mw, h)
WHERE EXISTS (SELECT 1 FROM f);

-- ---------- EA quarterly (richer manager evaluation; still Likert + narrative) ----------
DELETE FROM public.assessment_answers a
USING public.assessment_responses r
JOIN public.assessment_forms f ON f.id = r.form_id
WHERE a.response_id = r.id AND f.code = 'ea_quarterly';

DELETE FROM public.assessment_questions q
USING public.assessment_forms f
WHERE q.form_id = f.id AND f.code = 'ea_quarterly';

UPDATE public.assessment_forms
SET
  title = 'EA Quarterly Performance Evaluation',
  description = 'Manager evaluation of Executive Assistant — culture, delivery, growth (May 2026 instrument).'
WHERE code = 'ea_quarterly';

WITH f AS (SELECT id FROM public.assessment_forms WHERE code = 'ea_quarterly')
INSERT INTO public.assessment_questions (form_id, section, section_order, sort_order, question_text, question_type, min_words, helper_text, audience)
SELECT f.id, s.section, s.so, s.qo, s.q, s.qt, s.mw, s.h, 'all'::text
FROM f, (VALUES
  ('Delivery & OKRs', 1, 1, 'Technical / objective delivery — completion, quality, timeliness, and impact of work this quarter.', 'scored', NULL::int, '1=Unacceptable … 5=Exceptional (match corporate rubric).'::text),
  ('Delivery & OKRs', 1, 2, 'OKR-related performance — progress against agreed objectives for the period.', 'scored', NULL::int, NULL::text),
  ('Culture — BOOM', 2, 1, 'Integrity — trust through actions; confidentiality; ethics.', 'scored', NULL::int, NULL::text),
  ('Culture — BOOM', 2, 2, 'Excellence — quality, mastery, intentional use of tools.', 'scored', NULL::int, NULL::text),
  ('Culture — BOOM', 2, 3, 'Mutual Respect — professional collaboration and patience.', 'scored', NULL::int, NULL::text),
  ('Culture — BOOM', 2, 4, 'Adaptability — resilience and flexibility as priorities shift.', 'scored', NULL::int, NULL::text),
  ('Culture — BOOM', 2, 5, 'Innovation — curiosity and thoughtful challenge to status quo.', 'scored', NULL::int, NULL::text),
  ('Culture — BOOM', 2, 6, 'Overachievement — ownership, follow-through, initiative.', 'scored', NULL::int, NULL::text),
  ('Growth & Partnership', 3, 1, 'Potential for growth in role — trajectory and readiness.', 'scored', NULL::int, NULL::text),
  ('Growth & Partnership', 3, 2, 'Partnership with executive / team — anticipation, discretion, stakeholder coordination.', 'scored', NULL::int, NULL::text),
  ('Growth & Partnership', 3, 3, 'Communication — clarity, escalation, conflict signals.', 'scored', NULL::int, NULL::text),
  ('Narrative', 4, 1, 'Areas of strength (be specific).', 'written', 40, NULL::text),
  ('Narrative', 4, 2, 'Areas for improvement and observed gaps.', 'written', 40, NULL::text),
  ('Narrative', 4, 3, 'Performance improvement goals, indicators, and timeline (if applicable).', 'written', 40, NULL::text),
  ('Narrative', 4, 4, 'Anything else HR or EO leadership should know.', 'written', NULL::int, NULL::text)
) AS s(section, so, qo, q, qt, mw, h)
WHERE EXISTS (SELECT 1 FROM f);

-- ---------- monthly_self copy tweaks (non-destructive) ----------
UPDATE public.assessment_questions q
SET question_text = 'Is there anything your manager or the Executive Office Lead can do to better support you this month?'
FROM public.assessment_forms f
WHERE q.form_id = f.id AND f.code = 'monthly_self'
  AND q.section = 'Personal Check-In' AND q.sort_order = 3;

UPDATE public.assessment_questions q
SET question_text = 'Would you say you have a good working relationship with your team and the executives you support this month? If not, what would help?'
FROM public.assessment_forms f
WHERE q.form_id = f.id AND f.code = 'monthly_self'
  AND q.section = 'Personal Check-In' AND q.sort_order = 8;

UPDATE public.assessment_questions q
SET question_text = 'Is there anything else you want your manager to know this month?'
FROM public.assessment_forms f
WHERE q.form_id = f.id AND f.code = 'monthly_self'
  AND q.section = 'Personal Check-In' AND q.sort_order = 9;


UPDATE public.assessment_questions q
SET helper_text = '1=Not at all, 2=Somewhat, 3=Moderately, 4=Very much, 5=Completely. Add nuance in nearby written prompts where helpful.'
FROM public.assessment_forms f
WHERE q.form_id = f.id AND f.code = 'monthly_self'
  AND q.sort_order IN (4, 5) AND q.question_type = 'scored';

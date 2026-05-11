-- Legacy org-wide survey (survey_categories / survey_questions) was truncated in the BOOM
-- migration but never re-seeded, which yields "Section 1 of 0" in EmployeeHub / Survey.
-- Repopulate only when the catalog is empty so we do not clobber manual edits.

DO $$
DECLARE
  n int;
  c_lead uuid := 'c1e00001-0001-4001-8001-000000000001';
  c_collab uuid := 'c1e00001-0001-4001-8001-000000000002';
  c_comm uuid := 'c1e00001-0001-4001-8001-000000000003';
  c_exec uuid := 'c1e00001-0001-4001-8001-000000000004';
  c_values uuid := 'c1e00001-0001-4001-8001-000000000005';
  c_growth uuid := 'c1e00001-0001-4001-8001-000000000006';
  c_open uuid := 'c1e00001-0001-4001-8001-000000000007';
BEGIN
  SELECT count(*)::int INTO n FROM public.survey_categories;
  IF n > 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.survey_categories (id, name, sort_order) VALUES
    (c_lead, 'Leadership & strategic impact', 0),
    (c_collab, 'Collaboration & teamwork', 1),
    (c_comm, 'Communication', 2),
    (c_exec, 'Execution & accountability', 3),
    (c_values, 'Values & culture', 4),
    (c_growth, 'Development & growth', 5),
    (c_open, 'Additional comments', 8);

  INSERT INTO public.survey_questions (id, category_id, question_text, question_type, sort_order) VALUES
    ('a1e00001-0001-4001-8001-000000000001', c_lead, 'Sets clear direction and priorities for the team or organisation.', 'scored', 0),
    ('a1e00001-0001-4001-8001-000000000002', c_lead, 'Makes sound decisions with available information and appropriate pace.', 'scored', 1),
    ('a1e00001-0001-4001-8001-000000000003', c_collab, 'Works effectively across teams and resolves friction constructively.', 'scored', 0),
    ('a1e00001-0001-4001-8001-000000000004', c_collab, 'Shares credit and supports colleagues to succeed.', 'scored', 1),
    ('a1e00001-0001-4001-8001-000000000005', c_comm, 'Communicates clearly and listens to others.', 'scored', 0),
    ('a1e00001-0001-4001-8001-000000000006', c_comm, 'Keeps stakeholders appropriately informed.', 'scored', 1),
    ('a1e00001-0001-4001-8001-000000000007', c_exec, 'Delivers reliable outcomes and follows through on commitments.', 'scored', 0),
    ('a1e00001-0001-4001-8001-000000000008', c_exec, 'Manages priorities and resources well under pressure.', 'scored', 1),
    ('a1e00001-0001-4001-8001-000000000009', c_values, 'Role-models organisational values and professionalism.', 'scored', 0),
    ('a1e00001-0001-4001-8001-00000000000a', c_values, 'Creates an inclusive, respectful environment.', 'scored', 1),
    ('a1e00001-0001-4001-8001-00000000000b', c_growth, 'Supports others'' learning and gives useful feedback.', 'scored', 0),
    ('a1e00001-0001-4001-8001-00000000000c', c_growth, 'Invests in their own growth and adapts to change.', 'scored', 1),
    ('a1e00001-0001-4001-8001-00000000000d', c_open, 'What should this person start doing?', 'open_ended', 0),
    ('a1e00001-0001-4001-8001-00000000000e', c_open, 'What should this person stop doing?', 'open_ended', 1),
    ('a1e00001-0001-4001-8001-00000000000f', c_open, 'What should this person continue doing?', 'open_ended', 2);
END $$;

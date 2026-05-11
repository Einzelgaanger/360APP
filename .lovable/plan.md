
# BOOM Executive Office — Full System Rebuild

## What we're building

Replace the current VGG-wide 360 system with a focused **Executive Office of the GCEO** appraisal platform built around the team in `Team_structure_map.docx` and the three forms you uploaded. Each person, when they log in, sees only the people *they* are allowed to review and the *correct form* for that relationship.

## The team (seeded fresh)

```text
GCEO — Bunmi Akinyemiju
│
├─ Executives (reviewed by GCEO; they also review GCEO)
│   ├─ Uche Ukonu        — Central Ops, Technical, Calendar/Travel
│   ├─ Gisele Karekezi   — Brand & Comms
│   ├─ Deyi Dipeolu      — (vertical TBC – assumed Governance)
│   └─ Omotola Akinyemiju — General Operations
│
├─ Chief of Staff line — Kunmi Demuren
│   └─ Eniola Olawale, Oreoluwa Ifia
│
├─ Central Ops (Uche)         → Chuka Monyei, Baluku Duannah, Melissa Omede, Regina Ottoh-Ebhonu
├─ Brand & Comms (Gisele)     → Oluwatobi Ijamakinwa, Brenda Nafula, Abiona Gideon
├─ Technical (Uche)           → Ayomide Adeosun (Team Mgr), Dorathy Akor, Tobi Bankole
├─ Calendar/Travel (Uche)     → Udeme Inyang, Favour Oyekanmi
└─ Operations                  → Adeyinka Oshin
```

## The three forms

| Form | Who fills it | About whom | Cadence | Anonymous? |
|---|---|---|---|---|
| **Executive Performance Assessment** (BOOM v2) | GCEO + executives reviewing each other (incl. exec → GCEO) | The 4 executives + GCEO | Quarterly | No (named, dual-assessor) |
| **Quarterly 360 Peer Review** | Anyone in same vertical + their manager | Any teammate | Quarterly | **Yes, anonymous** |
| **Monthly Self-Assessment** | Every employee | Themselves | Monthly | Private to manager |

## Routing logic (who sees whom on login)

```text
On login:
  if user is GCEO            → review ALL 4 executives (Executive form)
  if user is an Executive    → review GCEO (Executive form)
                              + review own direct reports (360)
                              + monthly self-assessment
  if user is Manager (Kunmi, Ayomide) → review own reports (360)
                                       + monthly self
                                       + 360 their manager + same-vertical peers
  if user is Employee        → 360 same-vertical peers + their manager
                              + monthly self
```

## Data plan (wipe & replace)

Migrations will:
1. **Truncate** `appraisal_responses`, `manager_summaries`, `survey_responses`, `survey_answers`, `survey_questions`, `survey_categories`, `employees`, `subsidiaries` (keep `profiles` linked by email so existing logins survive; drop role rows).
2. Create new schema additions:
   - `assessment_forms` (executive | peer_360 | monthly_self)
   - `assessment_questions` (form_id, section, question_text, type: scored|written|values|nO_allowed, min_words, sort_order)
   - `assessment_responses` (form_id, reviewer_id, reviewee_id, period, status, submitted_at, anonymous bool)
   - `assessment_answers` (response_id, question_id, score, text)
   - `review_assignments` (computed view: who can review whom, by form)
3. Seed:
   - 1 subsidiary "Executive Office of the GCEO"
   - All 18 people with department = vertical, hierarchy_level (GCEO=0, Exec=1, Manager=2, Employee=3)
   - All 3 forms with their full question banks (sections from the docx).

## App changes

- **/hub** becomes the single landing page after login. Three cards:
  1. **Reviews to give** — list of pending review assignments grouped by form, with badges (anonymous / named).
  2. **Monthly self-assessment** — current month status (open / submitted).
  3. **My results** — only when a quarter closes and ≥3 reviewers submitted (anonymity floor).
- **Per-form survey screens**, mobile-first (single-question-per-screen on mobile, sticky progress bar, swipe-friendly):
  - Executive form: 5-pt scale + required ≥200-word written, "assessor view" hidden.
  - 360 form: 1–5 + N/O per behaviour, 5 open questions at the end (improve / stop / start / continue / anything else).
  - Monthly: 1–5 ratings + free text per BOOM value, no minimums.
- **Admin (/admin)**: roster, form templates, period control, response monitoring, export.
- **Email flow** unchanged ("set new password" → profile setup → hub).

## Out of scope this round

- Auto-generated AI insights for the new forms (existing dashboard kept on demo data only).
- The hidden "Assessor Layer" anchors editor in admin (we'll seed the anchors as data; UI to edit comes later).
- Migrating any historical VGG data — wipe is final.

## Technical details

- Schema migration done in one transaction with `TRUNCATE ... CASCADE` then fresh inserts. Old `appraisal_responses` and `survey_*` tables stay (already empty after wipe) for backwards compat with admin dashboards still in code; new flow uses the new `assessment_*` tables.
- Seeding: question banks parsed from the three docx files into a TS seed file, then loaded via a one-shot edge function `seed-boom-forms` (idempotent on form name).
- Routing logic implemented as a Postgres function `get_review_assignments(uid uuid)` returning `(form_code, reviewee_id, reviewee_name, reviewee_role)` — single source of truth used by the hub and the admin.
- Anonymity: `peer_360` responses store `reviewer_id` for dedupe + RLS, but every read for the *reviewee* goes through a security-definer RPC that strips it.
- Fix the existing build errors (`learning_paths`, missing `Badge` import, `replaceAll`) as part of this PR.
- Mobile UX: bottom sheet sticky CTA, large tap targets (44px), single column on `< 640px`, swipe between questions on the survey screens via framer-motion.

## Rollout order in this single response

1. Migration: drop old data, add new tables + RLS + the assignment RPC.
2. Seed function + run it.
3. New hub + three survey screens + routing.
4. Admin updates (roster + period + export).
5. Fix the build errors.
6. Update memory: new team, new forms, new routing.

Approve and I'll execute end-to-end.

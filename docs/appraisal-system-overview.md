# What this appraisal system is

A plain explanation of the product: what it does today, how access and relationships work, and how the pieces fit together. Not a tech spec. Not a pitch deck.

Levels, reporting lines, forms, and calendars will differ by company. That is expected — the system is meant to be mapped to your structure, not the other way around.

---

## In one line

It runs a performance and feedback cycle end to end: who reviews whom, which forms they fill, who is allowed to see what, when results become visible, how people get notified, and where coaching and growth follow-up happen.

---

## Why it exists

Most companies already run appraisals. The usual failure modes are mundane and expensive:

- Assignments live in spreadsheets and chat. People lose track of what they still owe.
- The org chart does not match how work actually happens, so the wrong people review each other — or important collaborators never do.
- Everyone gets the same form, whether they are an individual contributor or a unit lead.
- Peer feedback is either too exposed (people soften the truth) or so opaque that nobody trusts the output.
- Senior leaders find out late that a unit is behind, or that a people risk was visible in the data weeks earlier.
- Scores land with nowhere to talk. Coaching drifts into WhatsApp and disappears.
- “Growth” after the review is a slide deck nobody opens again.

This product is built to make the cycle clear to run, fair to release, honest enough to be useful, and connected to real conversations and development — without forcing every subsidiary into the same org design.

---

## What is in the product today

### Personal hub and task list

Each person opens a workspace and sees what they owe for the current period: form type, due date, progress, drafts they can resume. Assignments are generated from the relationship map and role rules, not from a side spreadsheet.

Typical surfaces in the hub include open tasks, discussions, personal 360 / manager-review results (once released), and optional growth tools.

### Form catalogue

Different feedback shapes can run in the same cycle. You turn on what you need:

| Form | Purpose |
|------|---------|
| Periodic self-assessment | Reflection / pulse (e.g. monthly) |
| Peer 360 | Structured input from collaborators, including across teams |
| Manager evaluation | Line manager’s scored and/or narrative view of directs |
| Leadership self-performance | Deeper self-eval for a defined leadership set; can pull in period OKRs |
| Comment flows | Narrative feedback along explicit “gives → receives” relationships |
| Assessor / second look | Optional senior review after a leadership self-eval |

Unused types stay off. Cadence is per form type.

### Relationships (the routing layer)

This is the spine of the product. Assignments are not “everyone in the department reviews everyone.” They come from a maintained map:

- **Primary manager** — who owns the manager evaluation and much of the coaching line  
- **Secondary / matrix manager** — where dual reporting is real (shared pods, dotted lines)  
- **Hierarchy level** — how senior someone sits in *your* ladder (however many levels you define)  
- **Unit / department** — for roll-ups, oversight, and filtering  
- **Peer pairs or peer sets** — who owes whom a 360, including cross-unit collaboration  
- **Upward lines** — feedback into leadership where you want it  
- **Capability markers** — who does leadership self-performance, who gives narrative comments, who receives them  
- **Exclusions** — new joiners, contractors, leavers, people paused for a cycle  

When someone joins, transfers, or changes manager, you update the map. The next cycle’s assignments follow. That is how the product stays honest to how the company actually works.

### Role-based access

Not everyone sees the same screens. Access is layered:

**Platform role**  
- Ordinary participants use the employee hub.  
- Admins reach configuration, cycle release, completion monitoring, OKR slots where used, and exports.  

**Hierarchy / leadership altitude**  
- Individual contributors mainly see their own tasks, their own results (when released), and discussions they are part of.  
- Managers see team-facing work: evaluations they owe, comment assignments, team-related discussions.  
- Senior / leadership viewers can open directory-style completion views and insights (unit and theme roll-ups) that ICs do not get.  

**Capability flags (independent of job title)**  
- Leadership self-performance can be limited to a marked population.  
- Narrative “gives comments” / “receives comments” can be limited to designed pairs, not the whole company.  
- Assessor rights can sit on a small senior set.  

**Data boundaries**  
- Peer reviewers’ identities are not shown to the person being reviewed. Subjects see aggregates and themes.  
- Discussion UIs are careful not to present a facilitator as if they were a named peer reviewer.  
- Results for a period stay gated until release rules say otherwise.  

So “role-based access” here means both *which menus you get* and *which rows of feedback you are allowed to see*.

### Anonymity and release

Peer 360 is built for psychological safety: aggregates and clustered comments, optional minimum response counts before anything shows, and a **release gate** so People Ops / admin can hold results until the sample and roster are clean. Manager comments can be attributed when that fits the culture. Those policies are configurable; the product defaults toward not leaking reviewer identity on peer forms.

### Discussions

Scores are not the end of the process. The system keeps threaded discussions tied to results and the cycle — manager ↔ direct, facilitation where configured, leadership coaching queues. Peer-related threads stay anonymised for the subject. Coaching has a place to live instead of dissolving into chat.

### Reports, dashboards, and exports

Different altitudes get different reporting:

- **Individual** — personal competency / category views, qualitative themes, manager-evaluation summaries once released.  
- **Manager / leadership** — team and pod completion, oversight of who still owes what, insight panels (scores and themes at unit or level roll-up).  
- **Directory-style status** — for roles allowed to see it: who has submitted, who is lagging.  
- **Admin** — cycle completion monitoring, period release controls, CSV export of assessment answers for calibration packs or archive.  

Charts and tables are there to support decisions (chase completion, spot gaps, prepare a leadership conversation), not to decorate a homepage.

### Notifications and email

Two channels work together:

- **In-app notifications** — a bell in the hub for things that need you (new assignment signal, discussion activity, submissions that affect you, release events, depending on configuration).  
- **Email** — branded transactional mail for the same kinds of moments when email is enabled for the tenant (for example: someone submitted a review that lands on you, check-in style nudges for growth goals). Auth flows (invite / reset) also go through the mail pipeline.  

Email is optional per environment; in-app still works if mail is off. The point is people should not discover a due form only because someone chased them in chat.

### AI help to grow (advisory, not scoring)

The product includes AI-assisted surfaces aimed at *understanding and development*, not at replacing a manager’s judgement or auto-writing someone’s appraisal score:

- **Analytics assistant (admin)** — ask questions against cycle / org signal to explore patterns faster.  
- **Insights on the personal dashboard** — short, readable takeaways from feedback themes to orient someone after results land.  
- **Growth hub** — reflection, development focus, and adaptive learning resources / path suggestions tied to how someone is showing up — including periodic check-in style nudges so growth does not die the week after release.  

AI here is a helper: it summarises, suggests, and points. It does not decide pay, promotion, or final ratings.

### OKRs on leadership forms (when enabled)

For leadership self-performance, period OKRs can be injected into the form so the self-eval sits next to stated outcomes for that cycle — useful when the company already runs OKRs and does not want appraisal to float free of them.

---

## How a cycle usually moves

Exact dates are yours. The shape is usually:

1. Confirm the relationship map (managers, peers, flags, exclusions).  
2. Open the cycle — assignments appear; notifications go out.  
3. Self window.  
4. Peer window (toward whatever threshold you set).  
5. Manager evaluations and any comment flows.  
6. Leadership forms / assessor steps, if in use.  
7. Fairness pass (thin samples, leavers still assigned, obvious anomalies).  
8. Release gate — individuals see results when policy allows.  
9. Discussions, coaching, and growth follow-up.  
10. Leadership review on unit and talent themes; export / archive as needed.  

Each step is meant to be visible in the product, not held in someone’s head.

---

## What you change to fit your company

**Structure** — how many levels, what you call them, how units roll up.  
**Relationships** — single vs matrix managers; which peer links matter; upward-only vs full 360 into leadership.  
**Populations** — who gets which forms and comment rights.  
**Cadence** — per form type.  
**Content** — competencies, questions, rating language in your voice.  
**Access** — who sees directory, insights, admin, and exports.  
**Release and anonymity** — thresholds, human gate vs auto-release, attributed vs anonymous comments.  
**Channels** — in-app only, or in-app plus email.  
**Modules** — OKRs, growth hub, rankings, assessor layer, AI assistants — on or off.

You inherit a way to *run* a cycle. You fill in your own map.

---

## What the interface is trying to do

Raise completion, protect honesty, and make follow-through likely: a clear task list; draft/resume on long forms; completion by person, unit, and form type; plain blockers (“manager eval waiting on self”); peer results as aggregates and themes; release gates against accidental early visibility; leadership screens that highlight attention (which unit, which gap) instead of dumping every row equally; discussions and growth sitting next to the cycle instead of in a separate universe.

---

## What a company gets from running it

- A cycle you can operate without spreadsheet archaeology.  
- Feedback aligned to real working relationships, including across teams.  
- Access that matches responsibility — ICs, managers, senior viewers, and admins do not share one flat permission set.  
- Fairer release of results.  
- Reporting at personal, team, and admin altitudes, plus export when you need a pack offline.  
- Notifications that reduce silent overdue work.  
- A place for coaching after scores, and AI-assisted growth support that stays advisory.  
- Repeatability: next period reuses the map and catalogue; you improve the process instead of rebuilding it.  
- Room for each subsidiary to differ inside the same platform idea.

It does not replace judgement or management courage. It gives those things shared evidence and a cleaner process.

---

## What it is not

Not payroll, leave, or a full HRIS. Not automatic pay or promotion decisions. Not “AI manages your people.” Not locked to one company’s titles, levels, or form pack.

---

## Directions the product can grow

These are natural extensions of what already exists — not a roadmap or a commitment, just clear possibilities:

- **Richer calibration rooms** — side-by-side comparison of manager scores, peer aggregates, and comment themes for a defined cohort, with private calibration notes before release.  
- **Deeper talent views for senior leaders** — flight-risk / high-potential tagging linked to discussion ownership, without exposing peer identities.  
- **Smarter relationship suggestions** — propose peer pairs from collaboration signals (projects, tickets, shared rituals), still confirmed by People Ops before they enter the map.  
- **Stronger growth loops** — IDPs that open automatically from released themes, with manager acknowledgement and lighter mid-cycle check-ins.  
- **Multi-subsidiary portfolios** — one admin lens across several mapped orgs, each with its own levels and release policy.  
- **Richer outbound packs** — board- or ELT-ready summaries (themes, completion, risk flags) generated from the same data leaders already see in-product.  
- **Tighter notification preferences** — per-person control of which events email vs stay in-app only.

---

## Bottom line

The system turns appraisal into a configurable operating rhythm: relationship-based assignments, role-aware access, a real form catalogue, careful peer anonymity, controlled release, discussions after scores, reporting and export, in-app and email notifications, and optional AI support for insight and growth. You bring the org design. The product brings the machinery to run it without chaos.

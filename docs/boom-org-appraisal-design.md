# BOOM Executive Office — Org & appraisal design

Source: Excalidraw org chart (360 evaluation, monthly self-assessment, self performance evaluation, comment flows).

This document is the **target** product model. Implementation replaces generic `get_review_assignments` dept/manager rules with explicit routing from this chart.

---

## 1. Legend (from whiteboard)

| Symbol | Meaning |
|--------|---------|
| **Green** | Completes **self performance evaluation** (quarterly EPA-style). |
| **Orange** | Gives **comments** to people marked **blue** (downward comment flow). |
| **Blue** | **Receives** comments from above (orange); primary feedback recipients at their tier. |
| **↔** (double arrow) | **360 appraisal** — mutual feedback between connected people (anonymous aggregate in product). |
| **Monthly** | **Monthly self-assessment** (private reflection) — **everyone** in the pilot. |

**Three form types in the product**

| Code | Name | Cadence | Who |
|------|------|---------|-----|
| `monthly_self` | Monthly one-on-one / self-assessment | Monthly | All |
| `executive` | Self performance evaluation | Quarterly | Green dots only |
| `peer_360` | 360 appraisal | Quarterly | Per routing matrix below |

When a reviewer opens a **reviewee**, they may have **their own** monthly + performance tasks **plus** one **360 form per reviewee** (your “two forms” = two **self** types on the **view** side; one **360** per person on the **give** side).

---

## 2. Org chart (levels)

Lower `hierarchy_level` = more senior (EO subsidiary).

```text
L0 — Top three (strategic leadership)
├── Bunmi Akinyemiju     [admin, green]
├── Kunmi Demuren        [green + orange]
└── Demola Idowu         [green + orange]
    ├── Eniola           → reports to Kunmi
    └── Brenda (?)       → reports to Demola [blue]  ← confirm vs Comms Brenda

L1 — Four functional leads (all report to Bunmi)
├── Omotola Akinyemiju   [blue]
├── Uche Ukonu           [green + orange + blue]
├── Gisele Ishema Karekezi [green + orange + blue]
└── Deyi Dipeolu         [green + orange + blue]

L2 — Teams
├── Shared Ops (↔ Omotola AND ↔ Uche): Adeyinka, Favour, Ayomide [blue]
├── Central Ops (↔ Uche): Regina, Melissa, Baluku, Chukwuka [blue]
├── Comms (↔ Gisele): Oluwatobiloba, Brenda, Gideon [blue]
└── Technical (↔ Ayomide): Dorathy, Tobi [blue]
```

**Dotted lines on chart:** Ayomide’s team is under Ayomide; Central Ops and Comms pods only to their L1 lead except the **shared** trio that connects to **both** Omotola and Uche.

---

## 3. Roster mapping (DB today)

| Diagram | In DB (corporate email) | `hierarchy_level` (proposed) | Flags |
|---------|-------------------------|------------------------------|--------|
| Bunmi | `bunmi.akinyemiju@peopleos.co` | 0 | `is_admin`, green |
| Kunmi | `kunmi.demuren@peopleos.co` | 0 | green + orange |
| Demola | **Missing** — add employee | 0 | green + orange |
| Eniola | `eniola.olawale@peopleos.co` | 2 | blue, manager Kunmi |
| Omotola | `omotola.akinyemiju@venturegardengroup.com` | 1 | blue |
| Uche | `uche.ukonu@venturegardengroup.com` | 1 | green + orange + blue |
| Gisele | `gisele.karakezi@venturegardengroup.com` | 1 | green + orange + blue |
| Deyi | `deyi.dipeolu@venturegardengroup.com` | 1 | green + orange + blue |
| Adeyinka | `adeyinka.oshin@venturegardengroup.com` | 2 | blue, managers Omotola + Uche |
| Favour | `favour.oyekanmi@venturegardengroup.com` | 2 | blue |
| Ayomide | `adeosun.ayomide@venturegardengroup.com` | 2 | blue, managers Omotola + Uche |
| Regina, Melissa, Baluku, Chukwuka | corporate emails | 2 | blue, manager Uche |
| Oluwatobiloba, Brenda, Gideon | corporate emails | 2 | blue, manager Gisele |
| Dorathy, Tobi | corporate emails | 2 | blue, manager Ayomide |

**Not on chart:** Oreoluwa Ifia — exclude from pilot or assign to Kunmi.  
**Clarify:** Two “Brenda” nodes (under Demola vs Comms) — likely one person; chart may be draft.

---

## 4. Department codes (for routing)

| Code | L1 owner | Members |
|------|----------|---------|
| `top_office` | Bunmi | Kunmi, Demola, Eniola |
| `general_ops` | Omotola | Adeyinka, Favour, Ayomide (shared) |
| `central_ops` | Uche | Regina, Melissa, Baluku, Chukwuka + shared trio |
| `brand_comms` | Gisele | Oluwatobiloba, Brenda, Gideon |
| `portfolio` | Deyi | (cross-cutting — appraises all L2 pods) |

Store on `employees.department_code` + `manager_id` + optional `secondary_manager_id` (for Omotola/Uche dual line).

---

## 5. 360 assignment matrix

Store each directed pair `(reviewer_id, reviewee_id, period)` or compute in `get_boom_assignments(quarter, month)`.

### 5.1 L0 (Bunmi, Kunmi, Demola)

| Reviewer | 360 reviewees |
|----------|----------------|
| Each L0 | The **other two** L0 (lateral) |
| Each L0 | **All L1** (Omotola, Uche, Gisele, Deyi) |
| Each L0 | **Not** L2 directly unless you want skip-level (chart shows L1 as hub) |

### 5.2 L1

| Reviewer | 360 reviewees |
|----------|----------------|
| Omotola | Other **3** L1; all **shared ops** (Adeyinka, Favour, Ayomide); **not** Central Ops-only pod if policy = Uche-only for that box |
| Uche | Other **3** L1; shared trio; **Central Ops** pod; **not** Comms pod |
| Gisele | Other **3** L1; **Comms** pod; shared trio + Central Ops per chart (↔ with Uche/Omotola) |
| Deyi | Other **3** L1; **all L2** in all four departments (cross-functional L1) |
| Each L1 | **All three L0** (upward 360) |

*Refine Gisele/Uche/Omotola cross-pod edges to match every ↔ on the whiteboard.*

### 5.3 L2

| Reviewer | 360 reviewees |
|----------|----------------|
| Each L2 | **Primary L1** (`manager_id`) only upward — **not** other L1, **not** L0 |
| Each L2 | **All other L2** at same level (cross-department peers): e.g. Central Ops ↔ Comms ↔ shared ops ↔ Technical |
| Each L2 | Direct reports if any (Dorathy/Tobi → Ayomide only downward) |
| Each L2 | **Never** Bunmi / Kunmi / Demola |

### 5.4 “Everyone evaluates each other”

Within each **connected component** on the chart (↔), create **both directions** for `peer_360`. Components:

- L0 triangle  
- L1 complete graph (4 nodes)  
- L0 ↔ each L1 (up/down)  
- Each L1 ↔ their pods  
- L2 cross-peer clique  
- Shared trio ↔ both Omotola and Uche  

---

## 6. Comments (orange → blue)

Separate from scored 360 (or a written section on the same form):

- **Orange** reviewers see a **Comments** tab listing **blue** reviewees they owe narrative feedback to.
- **Blue** recipients see comments **only from above** (orange), anonymised in UI.
- **Downward only** for blue nodes — L2 does not comment upward in this tab.

---

## 7. Dashboards & visibility

### 7.1 All levels

- **My tasks:** monthly self + performance (if green) + list of 360 reviewees.  
- **My feedback:** anonymous 360 aggregates + comments received.  
- **Comments tab:** give (orange) / receive (blue).

### 7.2 L1 — Directory (Uche, Gisele, Omotola, Deyi)

- Directory of **all L2** (and pods).  
- Click person → **monthly self** + **performance self** (read-only) + **masked 360** (no reviewer identity, min-N rule).

### 7.3 L0 — Executive console (Bunmi admin + Kunmi + Demola)

- **Feedback overview:** entire org.  
- Anonymous inbound from **L1 four**.  
- Heatmaps: how L2 rate peers; how L1 rated by L2/L1; how each L2 receives from L1 vs L2.  
- Drill-down: one person → 360 breakdown by relation (`up` / `lateral` / `down`) + both self assessments.

### 7.4 HR release gate

Keep existing `assessment_hr_release` so L2 see their own 360 only after HR releases (optional policy).

---

## 8. Data model changes (implementation checklist)

1. **`employees`**  
   - `hierarchy_level` 0 | 1 | 2  
   - `department_code`  
   - `manager_id`, optional `secondary_manager_id`  
   - `appraisal_flags`: `self_performance` (green), `gives_comments` (orange), `receives_comments` (blue)

2. **`assessment_questions`**  
   - `audience_level` / `audience_flags` per form  

3. **`get_boom_assignments`** (new RPC)  
   - Replace dept-only logic in `get_review_assignments` for EO subsidiary  

4. **`assessment_responses.reviewer_relation`**  
   - `self` | `up` | `down` | `lateral`  

5. **UI**  
   - Task hub driven by RPC  
   - L1 Directory page  
   - L0 Feedback console (extend AppraisalAdmin / BOOM tab)  

6. **Seed**  
   - Add Demola; fix `manager_id` tree; corporate emails for Kunmi/Eniola when provided  

---

## 9. Open confirmations

1. **Demola Idowu** — email and whether same tier as Kunmi (L0).  
2. **Brenda** — only under Gisele (Comms) or also under Demola on chart.  
3. **Omotola** — only blue (no green performance form)? Chart shows blue only.  
4. **Oreoluwa** — in or out of pilot.  
5. **Skip-level 360** — L0 ↔ L2 directly or only via L1.  

## 10. Implementation status (2026-06-11)

| Piece | Status |
|-------|--------|
| Migration `20260519120000_boom_org_structure_and_routing.sql` | In repo — **run in SQL editor or `npx supabase db push`** |
| `get_review_assignments` EO routing | In migration (fixed `my_flags` scalar bug) |
| Comments table + `get_boom_comment_assignments` | In migration |
| Directory + insight RPCs | In migration |
| `reviewer_relation` trigger + `get_eo_executive_overview` | In migration |
| Hub UI: Tasks / Feedback / Comments / Directory / Insights | Shipped (L0 heatmaps + relation drill-down) |
| Org apply script `npm run apply:eo-org` | Run after migration |
| `audience_level` on questions | Deferred — forms use existing section routing |

**Terminal deploy order:**

```powershell
cd C:\Users\Admin\Downloads\Appraisal
npx supabase login
npx supabase link --project-ref sgttsotrvemmgmujcuay
$env:SUPABASE_DB_PASSWORD = "your-db-password"
npx supabase db push
npx supabase functions deploy
npm run apply:eo-org
npm run seed:demo-auth
```

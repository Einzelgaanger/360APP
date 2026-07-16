import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Section = {
  id: string;
  num: string;
  title: string;
  body: JSX.Element;
};

const SECTIONS: Section[] = [
  {
    id: "overview",
    num: "01",
    title: "System Overview",
    body: (
      <>
        <p>
          The BOOM Appraisal Platform is a private, invite-only performance and 360 feedback system built for the
          Executive Office of the GCEO at Venture Garden Group (VGG). It replaces the previous VGG-wide 360 tool with
          a focused, mobile-first application that routes each user to exactly the reviews they must complete based on
          their position in the org chart.
        </p>
        <h3>Core capabilities</h3>
        <ul>
          <li>Three assessment forms — Monthly Self-Assessment, Quarterly 360 Peer Review (anonymous), and Quarterly Executive Performance Assessment (named, dual-assessor).</li>
          <li>Automatic routing — a single Postgres function decides who reviews whom, per form, per period.</li>
          <li>Anonymity enforcement — 360 responses are read through security-definer RPCs that strip reviewer identity; results only unlock at ≥3 respondents.</li>
          <li>Admin monitoring — roster, period control, response tracking, export to Excel/PDF.</li>
          <li>AI assistants — Perplexity + Claude powered analytics copilot for admins; growth resource recommender for employees.</li>
          <li>Branded auth flow — VGG-branded transactional emails via a queued edge function pipeline.</li>
        </ul>
        <h3>Design principles</h3>
        <ul>
          <li>Strict light mode. Editorial magazine aesthetic (cream paper, ink, VGG green, ember orange).</li>
          <li>Sharp edges, hairline rules, flat colour — no gradients, glass, or glow.</li>
          <li>Fraunces (display), Inter (body), JetBrains Mono (labels).</li>
          <li>Mobile-first surveys: single question per screen, sticky progress, swipe navigation.</li>
        </ul>
      </>
    ),
  },
  {
    id: "architecture",
    num: "02",
    title: "Architecture",
    body: (
      <>
        <h3>High-level topology</h3>
        <p>
          Browser (React 18 SPA over HTTPS) → static host at{" "}
          <code>appraisal.vgg.app</code> → Lovable Cloud (managed Postgres backend). The backend combines a
          RLS-locked <code>public</code> schema, email + password auth (invite-only), a public{" "}
          <code>email-assets</code> storage bucket, and Deno edge functions that drive the queued email pipeline
          (<code>pgmq</code> + <code>pg_cron</code>). Outbound integrations: Perplexity (copilot search), Claude
          (copilot reasoning and growth resources), and an SMTP relay on{" "}
          <code>notify.appraisal.vgg.app</code>.
        </p>
        <h3>Frontend stack</h3>
        <table>
          <thead><tr><th>Layer</th><th>Choice</th></tr></thead>
          <tbody>
            <tr><td>Framework</td><td>React 18 + Vite 5 + TypeScript 5</td></tr>
            <tr><td>Styling</td><td>Tailwind CSS v3 (semantic tokens in index.css)</td></tr>
            <tr><td>Components</td><td>shadcn/ui (Radix primitives)</td></tr>
            <tr><td>Routing</td><td>react-router-dom</td></tr>
            <tr><td>State / data</td><td>@tanstack/react-query</td></tr>
            <tr><td>Forms</td><td>react-hook-form + zod</td></tr>
            <tr><td>Charts</td><td>Recharts</td></tr>
            <tr><td>Motion</td><td>framer-motion</td></tr>
            <tr><td>Auth client</td><td>Lovable Cloud client SDK</td></tr>
          </tbody>
        </table>
        <h3>Backend stack</h3>
        <table>
          <thead><tr><th>Layer</th><th>Choice</th></tr></thead>
          <tbody>
            <tr><td>Database</td><td>Postgres 15 (Lovable Cloud)</td></tr>
            <tr><td>Auth</td><td>Email/password only</td></tr>
            <tr><td>Server logic</td><td>Edge Functions (Deno + TypeScript)</td></tr>
            <tr><td>Queue</td><td>pgmq (auth + transactional email queues)</td></tr>
            <tr><td>Scheduler</td><td>pg_cron (5s dispatcher when queue is armed)</td></tr>
            <tr><td>Storage</td><td>Bucket <code>email-assets</code> (public)</td></tr>
            <tr><td>Access control</td><td>RLS + <code>user_roles</code> + <code>has_role()</code></td></tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: "data-access",
    num: "03",
    title: "Data Access & Usage",
    body: (
      <>
        <p>
          All application data lives in a single Postgres 15 database, in the RLS-locked <code>public</code> schema.
          The only other store is the public <code>email-assets</code> bucket for email imagery — no personal data.
          The frontend is a static SPA and stores nothing itself; a browser only ever receives what RLS and the
          security-definer RPCs permit for the signed-in user. Transactional email bodies are never stored — only
          send-log metadata. Backups use point-in-time recovery.
        </p>
        <h3>How data gets there</h3>
        <table>
          <thead><tr><th>Data class</th><th>Source</th><th>Cadence</th><th>Access</th></tr></thead>
          <tbody>
            <tr><td>Employee roster <code>employees</code></td><td>Admin import by the EO</td><td>Ad hoc; deactivated, not deleted</td><td>Read: authenticated EO. Write: admin only.</td></tr>
            <tr><td>Auth accounts <code>profiles</code></td><td><code>bulk-create-users</code> + first-login completion</td><td>Ad hoc</td><td>Self + admin.</td></tr>
            <tr><td>Assessments <code>assessment_responses / _answers</code></td><td>Reviewer in-app (draft → submit)</td><td>Monthly (self), Quarterly (360, EPA)</td><td>Reviewer: own rows. Reviewee: aggregated only via RPCs with the ≥3 floor. Admin: monitoring + export.</td></tr>
            <tr><td>Peer comments <code>assessment_peer_comments</code></td><td>Entered in-app</td><td>Quarterly</td><td>Reviewer: own rows. Reviewee: anonymised RPC, text only.</td></tr>
            <tr><td>Email metadata <code>email_send_log</code></td><td>Queue pipeline at send time</td><td>Per send (5s dispatcher)</td><td>Service role (pipeline); bodies never stored.</td></tr>
            <tr><td>AI context</td><td>Assembled server-side per request</td><td>On demand</td><td>Sent to Anthropic / Perplexity APIs; transient; advisory only.</td></tr>
          </tbody>
        </table>
        <h3>No inbound integrations</h3>
        <ul>
          <li>The platform pulls nothing from VGG systems — no Microsoft 365, HRIS, or automated feeds. All external calls are outbound only (Claude, Perplexity, SMTP relay).</li>
          <li>Every write originates from an authenticated EO user acting in the app, or from an explicit admin action.</li>
          <li>AI is advisory only: context is assembled server-side per request, sent to the provider APIs, and never written back to <code>assessment_*</code> tables. Reviewer identity is never included for <code>peer_360</code>.</li>
        </ul>
        <h3>Data received from VGG to date</h3>
        <p>
          The only VGG data received to date is the set of Microsoft 365 usage exports (Excel workbooks) shared by
          the GCEO from the Microsoft 365 admin centre for the Group productivity and digital engagement review:
          Email activity, Teams activity, OneDrive activity and usage, SharePoint activity and site usage, Copilot
          readiness, and the VGG user roster. Those files are held and processed separately for that review and are
          not loaded into this platform. No other VGG data has been received — no HRIS extracts, no direct access to
          VGG systems, no automated feeds. The EO roster used by this platform (name, work email, role, vertical,
          hierarchy level) was supplied by the Executive Office for provisioning.
        </p>
      </>
    ),
  },
  {
    id: "domain-model",
    num: "04",
    title: "Domain Model",
    body: (
      <>
        <h3>Organisational entities</h3>
        <table>
          <thead><tr><th>Table</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><code>subsidiaries</code></td><td>Single row: “Executive Office of the GCEO”.</td></tr>
            <tr><td><code>employees</code></td><td>18+ people in the EO. Name, email, role, vertical, hierarchy_level, manager linkage.</td></tr>
            <tr><td><code>profiles</code></td><td>1:1 with <code>auth.users</code>. Linked to employees by <code>lower(email)</code>.</td></tr>
            <tr><td><code>user_roles</code></td><td>Separate role assignments (<code>admin</code>, <code>moderator</code>, <code>user</code>). Checked via <code>has_role(uid, role)</code>.</td></tr>
          </tbody>
        </table>
        <h3>Hierarchy convention (EO)</h3>
        <p>
          Lower <code>hierarchy_level</code> = more senior (0 = GCEO, 1 = Executive, 2 = Manager, 3 = Employee). This
          is the opposite of the legacy VGG dataset; the <code>subsidiaries.hierarchy_lower_is_senior</code> flag
          selects the convention at runtime (see <code>src/lib/hierarchyConvention.ts</code>).
        </p>
        <h3>Assessment entities</h3>
        <table>
          <thead><tr><th>Table</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><code>assessment_forms</code></td><td>Form definitions: <code>executive</code>, <code>peer_360</code>, <code>monthly_self</code>, <code>ea_quarterly</code>, <code>epa_gceo_assessor</code>.</td></tr>
            <tr><td><code>assessment_questions</code></td><td>Question bank per form: section, text, type (<code>scored | written | values</code>), min word counts.</td></tr>
            <tr><td><code>assessment_responses</code></td><td>One row per (form, reviewer, reviewee, period). Status: <code>todo | draft | submitted</code>.</td></tr>
            <tr><td><code>assessment_answers</code></td><td>One row per (response, question) with score (1–5) and/or text, plus a no-opportunity flag.</td></tr>
            <tr><td><code>assessment_peer_comments</code></td><td>Anonymous downward narrative comments.</td></tr>
            <tr><td><code>review_completions</code></td><td>Marks a reviewer’s pass through a form as complete for a period.</td></tr>
          </tbody>
        </table>
        <h3>Legacy tables kept for read-only demo / analytics</h3>
        <ul>
          <li><code>appraisal_responses</code> / <code>manager_summaries</code> — power original VGG dashboards.</li>
          <li><code>demo_appraisal_responses</code> / <code>demo_manager_summaries</code> — <code>/demo</code> mock dataset.</li>
          <li><code>survey_*</code> — original anonymous 360 (superseded by <code>assessment_*</code>).</li>
        </ul>
      </>
    ),
  },
  {
    id: "routing",
    num: "05",
    title: "Routing Logic · Who Reviews Whom",
    body: (
      <>
        <p>
          The single source of truth is the Postgres function{" "}
          <code>public.get_review_assignments(_period text)</code>. It joins the caller’s <code>employees</code> row
          to the target set defined by the rules below, then left-joins existing{" "}
          <code>assessment_responses</code> to report each row’s status.
        </p>
        <table>
          <thead><tr><th>Caller role (hierarchy)</th><th>Form</th><th>Reviewees</th></tr></thead>
          <tbody>
            <tr><td>GCEO (0)</td><td><code>executive</code></td><td>All L1 executives</td></tr>
            <tr><td>Executive (1)</td><td><code>executive</code></td><td>GCEO</td></tr>
            <tr><td>Executive (1)</td><td><code>peer_360</code></td><td>Own direct reports</td></tr>
            <tr><td>Manager (2)</td><td><code>peer_360</code></td><td>Manager + same-vertical peers + own reports</td></tr>
            <tr><td>Employee (3)</td><td><code>peer_360</code></td><td>Manager + same-vertical peers</td></tr>
            <tr><td>Everyone</td><td><code>monthly_self</code></td><td>Self</td></tr>
          </tbody>
        </table>
        <h3>Anonymity floor</h3>
        <p>
          For <code>peer_360</code> results, <code>get_my_360_results(_period)</code> only returns aggregated scores
          when the reviewee has ≥3 submitted responses. Below the floor, the RPC returns an empty set — the UI shows
          an anonymity banner instead of any score.
        </p>
        <h3>Reviewer identity</h3>
        <ul>
          <li><code>peer_360</code> rows do store <code>reviewer_id</code> (needed for dedupe and RLS on drafts).</li>
          <li>All reads that surface answers to a reviewee route through security-definer functions that never project <code>reviewer_id</code>.</li>
          <li><code>assessment_peer_comments</code> are surfaced via <code>get_my_anonymous_peer_comments(_period)</code>, returning <code>comment_text</code> only.</li>
        </ul>
      </>
    ),
  },
  {
    id: "auth",
    num: "06",
    title: "Authentication & Access Control",
    body: (
      <>
        <h3>Sign-in model</h3>
        <ul>
          <li>Invite-only: no public signup. Only imported employees can sign in.</li>
          <li>Email + password. Default first-time password issued via bulk provisioning edge function.</li>
          <li>First login triggers <code>ProfileCompletionGate</code> → forces password reset + profile fields.</li>
          <li>Password reset uses branded VGG email templates via the <code>auth-email-hook</code> edge function.</li>
        </ul>
        <h3>Role model</h3>
        <p>
          Roles live in <code>public.user_roles</code> (never on <code>profiles</code>). Enum{" "}
          <code>app_role = &#123;admin, moderator, user&#125;</code>. All admin-scoped RLS policies use the
          security-definer helper <code>public.has_role(auth.uid(), 'admin'::app_role)</code> to avoid recursive
          policy evaluation.
        </p>
        <h3>Employee ↔ Auth linkage</h3>
        <pre><code>{`current_employee_id() → uuid
SELECT e.id FROM employees e
JOIN profiles p ON lower(p.email) = lower(e.email)
WHERE p.id = auth.uid()
LIMIT 1`}</code></pre>
        <p>
          This function is the bridge between an authenticated user and their assessment permissions. All{" "}
          <code>assessment_*</code> RLS policies use it to scope reads and writes.
        </p>
      </>
    ),
  },
  {
    id: "rls",
    num: "07",
    title: "Row-Level Security",
    body: (
      <>
        <p>
          Every public table has RLS enabled and explicit GRANTs. The Data API does not grant default privileges on{" "}
          <code>public</code>, so each migration follows the sequence: CREATE TABLE → GRANT → ENABLE RLS → CREATE
          POLICY.
        </p>
        <h3>Canonical policy shapes</h3>
        <table>
          <thead><tr><th>Table</th><th>Read</th><th>Write</th></tr></thead>
          <tbody>
            <tr><td><code>assessment_forms / _questions</code></td><td>authenticated (all)</td><td>admin only</td></tr>
            <tr><td><code>assessment_responses</code></td><td>reviewer = self OR reviewee = self (via RPC) OR admin</td><td>reviewer = self (upsert draft/submit) OR admin</td></tr>
            <tr><td><code>assessment_answers</code></td><td>via response ownership</td><td>reviewer = self while status = draft</td></tr>
            <tr><td><code>assessment_peer_comments</code></td><td>reviewer = self OR anonymised RPC for reviewee</td><td>reviewer = self</td></tr>
            <tr><td><code>employees</code></td><td>authenticated (roster is not secret in EO)</td><td>admin only</td></tr>
            <tr><td><code>user_roles</code></td><td>self OR admin</td><td>admin only</td></tr>
          </tbody>
        </table>
        <h3>Grant template</h3>
        <pre><code>{`GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;
GRANT ALL ON public.<table> TO service_role;
-- add: GRANT SELECT ON public.<table> TO anon;  -- ONLY when a policy allows anon reads.`}</code></pre>
      </>
    ),
  },
  {
    id: "edge-functions",
    num: "08",
    title: "Edge Functions",
    body: (
      <>
        <table>
          <thead><tr><th>Function</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><code>bulk-create-users</code></td><td>Admin: create auth users for every <code>employees</code> row; assign default first-login password.</td></tr>
            <tr><td><code>complete-profile</code></td><td>First-login handler: sets password, writes profile fields, marks onboarding complete.</td></tr>
            <tr><td><code>create-admin-user</code></td><td>Bootstrap: elevates a specific email to admin in <code>user_roles</code>.</td></tr>
            <tr><td><code>auth-email-hook</code></td><td>Signed webhook from Auth. Renders React email templates and enqueues them.</td></tr>
            <tr><td><code>process-email-queue</code></td><td>Woken by <code>pg_cron</code> (5s). Drains <code>q_auth_emails</code> and <code>q_transactional_emails</code> via the SMTP relay.</td></tr>
            <tr><td><code>chat</code></td><td>Analytics copilot for <code>/admin</code>. Perplexity (search) + Claude (reasoning).</td></tr>
            <tr><td><code>adaptive-resources</code></td><td>Employee growth hub: personalised learning resource generation.</td></tr>
            <tr><td><code>research-resources</code></td><td>Perplexity-backed research to enrich resource metadata.</td></tr>
            <tr><td><code>learning-path-generate</code></td><td>Builds structured learning paths from an employee’s 360 growth areas.</td></tr>
            <tr><td><code>recommendation-*</code> (5)</td><td>Multi-stage recommender: candidates → rank → evaluate → personalize → run.</td></tr>
            <tr><td><code>idp-check-in</code></td><td>Individual Development Plan check-ins (weekly reflection cadence).</td></tr>
          </tbody>
        </table>
        <h3>Deployment</h3>
        <pre><code>{`npm run functions:deploy   # deploy all edge functions
npm run db:apply           # apply pending SQL migrations
npm run supabase:deploy    # migrations + functions + secrets sync`}</code></pre>
      </>
    ),
  },
  {
    id: "email",
    num: "09",
    title: "Email Pipeline",
    body: (
      <>
        <h3>Sender identity</h3>
        <ul>
          <li>Sending domain: <code>notify.appraisal.vgg.app</code></li>
          <li>From: <code>VGG People Office &lt;no-reply@notify.appraisal.vgg.app&gt;</code></li>
          <li>Templates: React (JSX) rendered server-side in <code>_shared/email-templates/*</code></li>
          <li>Categories: signup, invite, magic-link, recovery, email-change, reauthentication.</li>
        </ul>
        <h3>Queue mechanics</h3>
        <p>
          <code>auth-email-hook</code> enqueues to <code>pgmq.q_auth_emails</code> (or{" "}
          <code>q_transactional_emails</code>). A row-level trigger calls <code>email_queue_wake()</code> which arms
          the <code>pg_cron</code> job <code>process-email-queue</code> to run every 5 seconds. The dispatcher POSTs
          to the edge function; when both queues drain, it unschedules the cron under a shared advisory lock so idle
          periods cost nothing.
        </p>
        <h3>Retry & suppression</h3>
        <ul>
          <li><code>email_send_state.retry_after_until</code> — global backoff after SMTP throttling.</li>
          <li><code>email_send_log</code> — per-message audit trail.</li>
          <li><code>suppressed_emails</code> — hard-bounce / unsubscribe list; checked before sending.</li>
          <li><code>email_unsubscribe_tokens</code> — signed one-click unsubscribe.</li>
          <li><code>move_to_dlq(source, dlq, msg_id, payload)</code> — DLQ helper for poisoned messages.</li>
        </ul>
      </>
    ),
  },
  {
    id: "routes",
    num: "10",
    title: "Frontend Routes & Screens",
    body: (
      <>
        <table>
          <thead><tr><th>Route</th><th>Component</th><th>Access</th></tr></thead>
          <tbody>
            <tr><td><code>/</code></td><td>Onboarding / Index</td><td>Public — landing</td></tr>
            <tr><td><code>/login</code></td><td>EmployeeLogin</td><td>Public</td></tr>
            <tr><td><code>/find-account</code></td><td>FindAccount</td><td>Public</td></tr>
            <tr><td><code>/reset-password</code></td><td>ResetPassword</td><td>Signed link</td></tr>
            <tr><td><code>/hub</code></td><td>EmployeeHub (tabs)</td><td>Authenticated employee</td></tr>
            <tr><td><code>/survey/:formCode/:revieweeId</code></td><td>AssessmentRunner</td><td>Authenticated</td></tr>
            <tr><td><code>/dashboard</code></td><td>Personal Dashboard</td><td>Authenticated</td></tr>
            <tr><td><code>/admin</code></td><td>AppraisalAdmin</td><td>Authenticated admin</td></tr>
            <tr><td><code>/demo</code></td><td>DemoDashboard</td><td>Public — mock data</td></tr>
            <tr><td><code>/omotola</code></td><td>OmotolaRoutingConfigurator</td><td>Configurator allowlist + admin</td></tr>
          </tbody>
        </table>
        <h3>Mobile-first survey UX</h3>
        <ul>
          <li>Single question per screen below 640px width.</li>
          <li>Sticky progress bar + bottom-sheet CTA (44px min tap targets).</li>
          <li>Swipe navigation via <code>framer-motion</code> drag gestures.</li>
          <li>Draft auto-save on every answer change; explicit Submit moves status → <code>submitted</code>.</li>
          <li>Executive form enforces min 200-word written response; 360 supports per-question N/O.</li>
        </ul>
      </>
    ),
  },
  {
    id: "ai",
    num: "11",
    title: "AI Integrations",
    body: (
      <>
        <h3>Analytics Copilot (/admin)</h3>
        <ul>
          <li>Model: Claude (Anthropic) via <code>CLAUDE_API_KEY</code> secret.</li>
          <li>Web search: Perplexity via <code>PERPLEXITY_API_KEY</code> secret.</li>
          <li>Context strategy: enriched with roster, hierarchy, aggregated scores, qualitative themes.</li>
          <li>Output: markdown, admin-only. Never exposes reviewer identity for <code>peer_360</code>.</li>
        </ul>
        <h3>Growth Hub (employee)</h3>
        <ul>
          <li><code>adaptive-resources</code> — Claude-powered personalised resource generation.</li>
          <li><code>research-resources</code> — Perplexity enrichment.</li>
          <li><code>learning-path-generate</code> — structured learning paths from growth areas.</li>
          <li><code>recommendation-*</code> — 5-stage recommender pipeline.</li>
        </ul>
        <h3>Model governance</h3>
        <ul>
          <li>All AI calls are server-side (edge functions). No API keys reach the browser.</li>
          <li>AI is feature-flagged via <code>VITE_ENABLE_APP_AI</code> (default true).</li>
          <li>AI does not write to <code>assessment_*</code> tables — advisory only.</li>
        </ul>
      </>
    ),
  },
  {
    id: "config",
    num: "12",
    title: "Configuration & Secrets",
    body: (
      <>
        <h3>Environment variables (frontend, .env)</h3>
        <table>
          <thead><tr><th>Key</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><code>VITE_SUPABASE_URL</code></td><td>Backend URL (auto-managed)</td></tr>
            <tr><td><code>VITE_SUPABASE_PUBLISHABLE_KEY</code></td><td>Anon key (safe in browser)</td></tr>
            <tr><td><code>VITE_ENABLE_APP_AI</code></td><td>Toggle AI features (default true)</td></tr>
            <tr><td><code>VITE_ENABLE_GROWTH_HUB_V2</code></td><td>Beta growth hub UI</td></tr>
          </tbody>
        </table>
        <h3>Server-side secrets</h3>
        <table>
          <thead><tr><th>Secret</th><th>Used by</th></tr></thead>
          <tbody>
            <tr><td><code>SUPABASE_URL</code> / <code>SERVICE_ROLE_KEY</code> / <code>ANON_KEY</code> / <code>JWKS</code></td><td>All edge functions</td></tr>
            <tr><td><code>CLAUDE_API_KEY</code></td><td><code>chat</code>, <code>adaptive-resources</code>, <code>learning-path-generate</code></td></tr>
            <tr><td><code>PERPLEXITY_API_KEY</code></td><td><code>chat</code>, <code>research-resources</code></td></tr>
            <tr><td><code>email_queue_service_role_key</code> (vault)</td><td>Cron-triggered dispatcher</td></tr>
          </tbody>
        </table>
        <h3>Custom domain</h3>
        <ul>
          <li>App: <code>appraisal.vgg.app</code> (CNAME to the static host).</li>
          <li>Email: <code>notify.appraisal.vgg.app</code> (SPF, DKIM, DMARC configured).</li>
        </ul>
      </>
    ),
  },
  {
    id: "ops",
    num: "13",
    title: "Operations & Runbooks",
    body: (
      <>
        <h3>Common tasks</h3>
        <table>
          <thead><tr><th>Task</th><th>Command</th></tr></thead>
          <tbody>
            <tr><td>Apply DB migrations</td><td><code>npm run db:apply</code></td></tr>
            <tr><td>Deploy edge functions</td><td><code>npm run functions:deploy</code></td></tr>
            <tr><td>Sync secrets</td><td><code>npm run secrets:sync</code></td></tr>
            <tr><td>Full deploy</td><td><code>npm run supabase:deploy</code></td></tr>
            <tr><td>Seed demo auth users</td><td><code>npm run seed:demo-auth</code></td></tr>
            <tr><td>Check EO roster</td><td><code>npm run check:eo-roster</code></td></tr>
            <tr><td>Export EO roster</td><td><code>npm run export:eo-roster</code></td></tr>
            <tr><td>Reset a user password</td><td><code>node scripts/reset-user-password.mjs &lt;email&gt;</code></td></tr>
            <tr><td>Run tests</td><td><code>npm test</code></td></tr>
          </tbody>
        </table>
        <h3>Incident · Emails not sending</h3>
        <ol>
          <li>Check <code>email_send_state.retry_after_until</code> — if in the future, SMTP is rate-limited; wait or clear.</li>
          <li>Query <code>pgmq.q_auth_emails</code> for stuck messages.</li>
          <li>Inspect edge function logs for <code>process-email-queue</code>.</li>
          <li>Verify the <code>pg_cron</code> job <code>process-email-queue</code> exists; an enqueue with an armed trigger will recreate it.</li>
        </ol>
        <h3>Incident · User cannot log in</h3>
        <ol>
          <li>Confirm the email exists in <code>public.employees</code> (case-insensitive).</li>
          <li>Confirm the <code>public.profiles</code> row is linked to an auth user.</li>
          <li>If missing, run <code>bulk-create-users</code> for that email, or trigger a password reset.</li>
          <li>Check <code>suppressed_emails</code> for hard bounces.</li>
        </ol>
        <h3>Incident · Results screen empty</h3>
        <p>
          Almost always the anonymity floor. <code>get_my_360_results</code> returns nothing until ≥3 submitted{" "}
          <code>peer_360</code> responses exist for the given period. Verify submitted counts in{" "}
          <code>assessment_responses</code> before escalating.
        </p>
      </>
    ),
  },
  {
    id: "security",
    num: "14",
    title: "Security Posture",
    body: (
      <>
        <ul>
          <li>All public tables have RLS enabled with explicit policies and GRANTs.</li>
          <li>Roles live in a separate <code>user_roles</code> table (never on <code>profiles</code>) to prevent privilege escalation.</li>
          <li>Role checks use SECURITY DEFINER function <code>has_role()</code> with a fixed <code>search_path</code>.</li>
          <li>Reviewer identity is never returned to a reviewee — enforced by security-definer RPCs.</li>
          <li>AI providers are only reached from server-side edge functions with secrets from the Vault.</li>
          <li>Emails are queued through <code>pgmq</code>; the auth webhook is signature-verified.</li>
          <li>No anonymous signups. No auto-confirm. No self-service role changes.</li>
          <li>Custom domain uses HTTPS end-to-end.</li>
        </ul>
        <h3>Data lifecycle</h3>
        <ul>
          <li>Employees: created via admin import; deactivated (not deleted) when they leave.</li>
          <li>Responses: retained per period; historical periods remain readable to admins and the individual reviewee (aggregated only).</li>
          <li>Emails: transactional; body not stored, only send-log metadata.</li>
          <li>Backups: managed with point-in-time recovery.</li>
        </ul>
      </>
    ),
  },
  {
    id: "glossary",
    num: "A",
    title: "Appendix · Glossary",
    body: (
      <table>
        <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td>BOOM</td><td>Internal name for the EO performance system (Bunmi’s Operating Model).</td></tr>
          <tr><td>EO</td><td>Executive Office of the GCEO.</td></tr>
          <tr><td>GCEO</td><td>Group CEO — Bunmi Akinyemiju.</td></tr>
          <tr><td>Vertical</td><td>A functional department in the EO (Central Ops, Brand & Comms, Technical, Calendar/Travel, and others).</td></tr>
          <tr><td>360</td><td>Multi-rater anonymous peer review.</td></tr>
          <tr><td>EPA</td><td>Executive Performance Assessment (BOOM v2).</td></tr>
          <tr><td>EA</td><td>Executive Assistant.</td></tr>
          <tr><td>N/O</td><td>No opportunity to observe — valid non-answer for 360 items.</td></tr>
          <tr><td>Anonymity floor</td><td>Minimum reviewer count (3) required before results are shown.</td></tr>
          <tr><td>Period</td><td>A cadence bucket: <code>YYYY-Qn</code> (quarterly) or <code>YYYY-MM</code> (monthly).</td></tr>
        </tbody>
      </table>
    ),
  },
];

export default function Docs() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const meta = useMemo(
    () => [
      { label: "Audience", value: "Engineers, admins, auditors" },
      { label: "Stack", value: "React 18 · Vite · TypeScript · Tailwind · Lovable Cloud" },
      { label: "Deploy", value: "appraisal.vgg.app" },
      { label: "Owner", value: "Executive Office of the GCEO" },
      { label: "Date", value: "July 2026 · v1.0" },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Masthead */}
      <header className="border-b border-foreground/15">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              VGG · Executive Office of the GCEO
            </span>
          </div>
          <Link
            to="/"
            className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/70 hover:text-foreground"
          >
            ← Back to app
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/60">
            № v1.0 · Technical Documentation
          </p>
          <h1 className="mt-3 font-serif text-5xl md:text-7xl leading-[0.95] tracking-tight">
            BOOM Appraisal Platform
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-foreground/70">
            Private, invite-only performance and 360 feedback system for the Executive Office of the GCEO.
          </p>
          <dl className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-4 border-t border-foreground/15 pt-6">
            {meta.map((m) => (
              <div key={m.label}>
                <dt className="font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/60">{m.label}</dt>
                <dd className="mt-1 text-sm">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/60 mb-3">Contents</p>
          <nav className="border-l border-foreground/15">
            {SECTIONS.map((s) => {
              const isActive = active === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`group block pl-4 -ml-px py-1.5 border-l text-sm transition-colors ${
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-foreground/60 hover:text-foreground"
                  }`}
                >
                  <span className="font-mono text-[10px] tracking-[0.14em] mr-2 text-foreground/50 group-hover:text-foreground/70">
                    {s.num}
                  </span>
                  {s.title}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="docs-prose min-w-0">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-6 mb-16">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                Section {s.num}
              </p>
              <h2 className="mt-2 font-serif text-3xl md:text-4xl tracking-tight border-b border-foreground/15 pb-3">
                {s.title}
              </h2>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-foreground/85">
                {s.body}
              </div>
            </section>
          ))}
          <footer className="border-t border-foreground/15 pt-6 mt-16 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/60 font-mono uppercase tracking-[0.18em]">
            <span>End of document</span>
            <span>VGG · Executive Office · July 2026</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

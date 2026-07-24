import type { MvpRoleMeta } from './mvpTypes';

/** Fictional demo org — illustrative only; not a real subsidiary roster. */
export const MVP_PERIOD = 'Q2 2026';
export const MVP_ORG = 'Demo Subsidiary';

export const MVP_ROLES: MvpRoleMeta[] = [
  {
    id: 'team_member',
    tabLabel: 'Team Member',
    shortLabel: 'Contributor',
    personaName: 'Amara Okonkwo',
    personaTitle: 'Payments Operations Analyst',
    personaUnit: 'Merchant Ops',
    blurb: 'Self assessments, open tasks, personal dashboard, growth.',
    nav: [
      { key: 'tasks', label: 'My Tasks' },
      { key: 'dashboard', label: 'My Dashboard' },
      { key: 'feedback', label: 'My Feedback' },
      { key: 'growth', label: 'Growth Hub' },
      { key: 'discussions', label: 'Discussions' },
    ],
  },
  {
    id: 'line_manager',
    tabLabel: 'Line Manager',
    shortLabel: 'Manager',
    personaName: 'Tunde Adeyemi',
    personaTitle: 'Head of Merchant Ops',
    personaUnit: 'Merchant Ops',
    blurb: 'Team board, manager evaluations, comments, coaching threads.',
    nav: [
      { key: 'team', label: 'My Team' },
      { key: 'reviews', label: 'Team Reviews' },
      { key: 'comments', label: 'Comments' },
      { key: 'discussions', label: 'Discussions' },
      { key: 'tasks', label: 'My Own Tasks' },
    ],
  },
  {
    id: 'peer_reviewer',
    tabLabel: 'Peer Reviewer',
    shortLabel: '360 Peer',
    personaName: 'Chioma Nwosu',
    personaTitle: 'Risk & Compliance Lead',
    personaUnit: 'Risk',
    blurb: 'Cross-unit peer 360 assignments with anonymity explained.',
    nav: [
      { key: 'assignments', label: '360 Assignments' },
      { key: 'guide', label: 'How Anonymity Works' },
      { key: 'tasks', label: 'Other Tasks' },
    ],
  },
  {
    id: 'general_manager',
    tabLabel: 'General Manager',
    shortLabel: 'GM',
    personaName: 'Ifeanyi Bello',
    personaTitle: 'General Manager',
    personaUnit: 'Subsidiary Leadership',
    blurb: 'Org pulse, unit health, talent risk, coaching queue, cycle runway.',
    nav: [
      { key: 'command', label: 'Command Overview' },
      { key: 'units', label: 'Unit Health' },
      { key: 'reports', label: 'Direct Reports' },
      { key: 'talent', label: 'Talent & Risk' },
      { key: 'themes', label: '360 Themes' },
      { key: 'discussions', label: 'Discussion Queue' },
      { key: 'cycle', label: 'Cycle Progress' },
      { key: 'insights', label: 'Insights' },
    ],
  },
  {
    id: 'people_ops',
    tabLabel: 'People Ops',
    shortLabel: 'HR',
    personaName: 'Ngozi Eze',
    personaTitle: 'People Partner',
    personaUnit: 'People & Culture',
    blurb: 'Release gates, roster fixes, completion chase, fairness checks.',
    nav: [
      { key: 'cycle', label: 'Cycle Control' },
      { key: 'roster', label: 'Roster & Mapping' },
      { key: 'completion', label: 'Completion Ops' },
      { key: 'fairness', label: 'Fairness Checks' },
      { key: 'comms', label: 'Nudges & Comms' },
    ],
  },
  {
    id: 'admin',
    tabLabel: 'Platform Admin',
    shortLabel: 'Admin',
    personaName: 'Kemi Adebayo',
    personaTitle: 'Platform Owner',
    personaUnit: 'Group People Systems',
    blurb: 'Configuration, form catalogue, analytics, exports.',
    nav: [
      { key: 'overview', label: 'Admin Overview' },
      { key: 'config', label: 'Configuration' },
      { key: 'forms', label: 'Forms & Cadence' },
      { key: 'analytics', label: 'Analytics' },
      { key: 'export', label: 'Exports' },
    ],
  },
];

export const teamMemberTasks = [
  { id: 't1', title: 'Monthly self-assessment — June', type: 'Monthly Self', due: '30 Jun', status: 'In progress', progress: 62 },
  { id: 't2', title: 'Peer 360 — review Jordan Mensah', type: 'Peer 360', due: '5 Jul', status: 'Not started', progress: 0 },
  { id: 't3', title: 'Peer 360 — review Sade Balogun', type: 'Peer 360', due: '5 Jul', status: 'Not started', progress: 0 },
  { id: 't4', title: 'Quarterly performance self-eval', type: 'Executive Self', due: '12 Jul', status: 'Locked until OKRs confirmed', progress: 0 },
];

export const teamMemberCompetencies = [
  { category: 'Delivery', myScore: 4.2, teamAvg: 3.8 },
  { category: 'Collaboration', myScore: 3.9, teamAvg: 3.7 },
  { category: 'Ownership', myScore: 4.4, teamAvg: 3.9 },
  { category: 'Customer focus', myScore: 4.1, teamAvg: 3.6 },
  { category: 'Judgement', myScore: 3.6, teamAvg: 3.5 },
  { category: 'Communication', myScore: 3.8, teamAvg: 3.7 },
];

export const teamMemberFeedback = [
  { theme: 'Reliable under pressure', source: 'Anonymous peer aggregate', detail: 'Consistently closes settlement exceptions before SLA breach.' },
  { theme: 'Could share context earlier', source: 'Anonymous peer aggregate', detail: 'Handoffs to Risk sometimes arrive late in the day.' },
  { theme: 'Strong merchant empathy', source: 'Manager comments', detail: 'Merchants escalate less when Amara owns the thread.' },
];

export const teamMemberDiscussions = [
  {
    with: 'Tunde Adeyemi',
    topic: 'Q2 delivery stretch goals',
    status: 'Awaiting your reply',
    updated: '2d ago',
    preview: 'If you take playbook ownership, let’s define success for July…',
  },
  {
    with: 'People Partner',
    topic: 'Career path — ops → product ops',
    status: 'Open',
    updated: '5d ago',
    preview: 'Happy to outline a 6-month bridge with Tunde involved…',
  },
];

export const teamMemberMonthlyPulse = [
  { month: 'Mar', score: 3.8 },
  { month: 'Apr', score: 3.9 },
  { month: 'May', score: 4.0 },
  { month: 'Jun', score: 4.1 },
];

export const lineManagerDirects = [
  { name: 'Amara Okonkwo', role: 'Ops Analyst', self: 'Done', ea: 'Draft', peer360: '3/4', risk: 'Low', score: 4.1, note: 'Strong ownership' },
  { name: 'Jordan Mensah', role: 'Ops Analyst', self: 'Done', ea: 'Not started', peer360: '2/4', risk: 'Med', score: 3.4, note: 'Needs clearer priorities' },
  { name: 'Sade Balogun', role: 'Senior Ops Analyst', self: 'In progress', ea: 'Not started', peer360: '4/4', risk: 'Low', score: 4.3, note: 'Ready for stretch' },
  { name: 'Ibrahim Yusuf', role: 'Ops Associate', self: 'Overdue', ea: 'Blocked', peer360: '1/3', risk: 'High', score: 2.9, note: 'Self overdue · eval blocked' },
  { name: 'Rita Chukwu', role: 'Ops Analyst', self: 'Done', ea: 'Submitted', peer360: '3/3', risk: 'Low', score: 4.0, note: 'Eval submitted' },
  { name: 'Felix Anene', role: 'Ops Analyst', self: 'Done', ea: 'Draft', peer360: '2/3', risk: 'Med', score: 3.5, note: 'Draft half done' },
];

export const lineManagerWeekPlan = [
  { day: 'Mon', focus: 'Finish Amara + Felix eval drafts' },
  { day: 'Tue', focus: '1:1 with Ibrahim on overdue self' },
  { day: 'Wed', focus: 'Write Jordan comment + start eval' },
  { day: 'Thu', focus: 'Sade stretch conversation' },
  { day: 'Fri', focus: 'Submit remaining evals' },
];

export const lineManagerReviews = [
  { subject: 'Amara Okonkwo', form: 'Manager evaluation (EA)', status: 'Draft saved', due: '10 Jul' },
  { subject: 'Jordan Mensah', form: 'Manager evaluation (EA)', status: 'Not started', due: '10 Jul' },
  { subject: 'Sade Balogun', form: 'Manager evaluation (EA)', status: 'Not started', due: '10 Jul' },
  { subject: 'Ibrahim Yusuf', form: 'Manager evaluation (EA)', status: 'Waiting on self-assessment', due: '10 Jul' },
  { subject: 'Rita Chukwu', form: 'Manager evaluation (EA)', status: 'Submitted', due: '10 Jul' },
  { subject: 'Felix Anene', form: 'Manager evaluation (EA)', status: 'Draft saved', due: '10 Jul' },
];

export const lineManagerComments = [
  { to: 'Amara Okonkwo', type: 'Downward comment', preview: 'Keep owning merchant recovery playbooks…', status: 'Sent' },
  { to: 'Jordan Mensah', type: 'Downward comment', preview: 'Need clearer weekly priorities…', status: 'Draft' },
  { to: 'Sade Balogun', type: 'Downward comment', preview: 'Ready for stretch ownership on…', status: 'Not started' },
];

export const peerAssignments = [
  { reviewee: 'Jordan Mensah', relationship: 'Cross-team collaborator', dept: 'Merchant Ops', progress: 0, due: '5 Jul', note: 'Worked together on chargeback surge' },
  { reviewee: 'Lola Akin', relationship: 'Peer in adjacent unit', dept: 'Risk', progress: 40, due: '5 Jul', note: 'Weekly fraud triage standups' },
  { reviewee: 'Emeka Obi', relationship: 'Project partner', dept: 'Product', progress: 100, due: '5 Jul', note: 'Launch of merchant onboarding v2' },
  { reviewee: 'Fatima Bello', relationship: 'Service partner', dept: 'Customer Success', progress: 15, due: '5 Jul', note: 'Escalation bridge for VIP merchants' },
  { reviewee: 'David Okoro', relationship: 'Process peer', dept: 'Finance Ops', progress: 0, due: '5 Jul', note: 'Reconciliation exception loops' },
];

export const gmKpis = [
  { label: 'Org completion', value: '78%', sub: '↑ 12 pts vs last week', tone: 'good' as const },
  { label: 'Units on track', value: '5 / 7', sub: '2 units need attention', tone: 'warn' as const },
  { label: 'Open discussion threads', value: '14', sub: '6 awaiting leadership reply', tone: 'neutral' as const },
  { label: 'Talent risk flags', value: '4', sub: '1 critical · 3 watch', tone: 'bad' as const },
  { label: 'Avg peer 360 (org)', value: '3.82', sub: 'Scale 1–5 · n=186', tone: 'good' as const },
  { label: 'Manager evals submitted', value: '61%', sub: 'Deadline in 6 days', tone: 'warn' as const },
];

export const gmUnitHealth = [
  { unit: 'Merchant Ops', head: 'Tunde Adeyemi', headcount: 18, completion: 84, avgScore: 3.9, risk: 'Watch', trend: '+0.2' },
  { unit: 'Risk & Compliance', head: 'Chioma Nwosu', headcount: 11, completion: 91, avgScore: 4.1, risk: 'Healthy', trend: '+0.1' },
  { unit: 'Product', head: 'Segun Alabi', headcount: 14, completion: 72, avgScore: 3.7, risk: 'Watch', trend: '0.0' },
  { unit: 'Customer Success', head: 'Adaeze Ume', headcount: 16, completion: 88, avgScore: 4.0, risk: 'Healthy', trend: '+0.3' },
  { unit: 'Finance Ops', head: 'Yemi Cole', headcount: 9, completion: 55, avgScore: 3.3, risk: 'At risk', trend: '−0.2' },
  { unit: 'Engineering', head: 'Bola Fashola', headcount: 22, completion: 69, avgScore: 3.8, risk: 'Watch', trend: '+0.1' },
  { unit: 'Growth & Partnerships', head: 'Zainab Lawal', headcount: 8, completion: 94, avgScore: 4.2, risk: 'Healthy', trend: '+0.4' },
];

export const gmCompletionByWeek = [
  { week: 'W1', self: 22, manager: 8, peer: 15 },
  { week: 'W2', self: 48, manager: 21, peer: 34 },
  { week: 'W3', self: 71, manager: 39, peer: 58 },
  { week: 'W4', self: 86, manager: 61, peer: 74 },
];

export const gmScoreDistribution = [
  { band: '4.5–5.0', count: 12 },
  { band: '4.0–4.4', count: 28 },
  { band: '3.5–3.9', count: 41 },
  { band: '3.0–3.4', count: 19 },
  { band: 'Below 3.0', count: 7 },
];

export const gmDirectReports = [
  {
    name: 'Tunde Adeyemi',
    title: 'Head of Merchant Ops',
    teamSize: 18,
    selfScore: 4.2,
    upward360: 3.9,
    teamAvg: 3.9,
    completion: 84,
    flags: ['1 overdue direct'],
    coaching: 'Due this week',
  },
  {
    name: 'Chioma Nwosu',
    title: 'Head of Risk',
    teamSize: 11,
    selfScore: 4.4,
    upward360: 4.3,
    teamAvg: 4.1,
    completion: 91,
    flags: [],
    coaching: 'Completed',
  },
  {
    name: 'Segun Alabi',
    title: 'Head of Product',
    teamSize: 14,
    selfScore: 3.8,
    upward360: 3.5,
    teamAvg: 3.7,
    completion: 72,
    flags: ['Upward gap vs self', 'Slow peer completion'],
    coaching: 'Scheduled Thu',
  },
  {
    name: 'Adaeze Ume',
    title: 'Head of Customer Success',
    teamSize: 16,
    selfScore: 4.1,
    upward360: 4.0,
    teamAvg: 4.0,
    completion: 88,
    flags: [],
    coaching: 'Completed',
  },
  {
    name: 'Yemi Cole',
    title: 'Head of Finance Ops',
    teamSize: 9,
    selfScore: 3.6,
    upward360: 3.1,
    teamAvg: 3.3,
    completion: 55,
    flags: ['Unit at risk', 'Critical talent flag'],
    coaching: 'Escalated — meet Mon',
  },
  {
    name: 'Bola Fashola',
    title: 'Head of Engineering',
    teamSize: 22,
    selfScore: 4.0,
    upward360: 3.7,
    teamAvg: 3.8,
    completion: 69,
    flags: ['Large team · uneven coverage'],
    coaching: 'Due next week',
  },
  {
    name: 'Zainab Lawal',
    title: 'Head of Growth',
    teamSize: 8,
    selfScore: 4.5,
    upward360: 4.4,
    teamAvg: 4.2,
    completion: 94,
    flags: ['High performer — succession'],
    coaching: 'Completed',
  },
];

export const gmTalentRisk = [
  {
    person: 'Ibrahim Yusuf',
    unit: 'Merchant Ops',
    signal: 'Performance dip + overdue self',
    severity: 'Critical',
    evidence: 'Manager score draft 2.6 · peer avg 2.9 · 2 missed monthly reflections',
    suggested: 'Manager 1:1 + PIP framing discussion',
  },
  {
    person: 'Yemi Cole',
    unit: 'Finance Ops (lead)',
    signal: 'Upward 360 gap · unit completion lag',
    severity: 'Critical',
    evidence: 'Self 3.6 vs upward 3.1 · unit 55% complete · theme: “unclear priorities”',
    suggested: 'GM coaching + unit reset workshop',
  },
  {
    person: 'Kola Peters',
    unit: 'Engineering',
    signal: 'Flight risk language in peer themes',
    severity: 'Watch',
    evidence: 'Anonymous themes mention “considering options”; delivery still strong (4.2)',
    suggested: 'Skip-level listen + retention check',
  },
  {
    person: 'Miriam Danjuma',
    unit: 'Product',
    signal: 'High potential · under-stretched',
    severity: 'Opportunity',
    evidence: 'Peer 4.6 · asks for broader scope in self-eval',
    suggested: 'Stretch assignment / lead track',
  },
];

export const gmThemes = [
  { theme: 'Cross-unit handoffs slow', mentions: 34, polarity: 'Concern', units: 'Ops ↔ Risk ↔ Finance' },
  { theme: 'Strong merchant empathy', mentions: 28, polarity: 'Strength', units: 'CS · Merchant Ops' },
  { theme: 'Priorities change mid-sprint', mentions: 22, polarity: 'Concern', units: 'Product · Eng' },
  { theme: 'Leaders available and coaching', mentions: 19, polarity: 'Strength', units: 'Growth · Risk' },
  { theme: 'Documentation debt', mentions: 17, polarity: 'Concern', units: 'Eng · Finance Ops' },
  { theme: 'Celebrates wins publicly', mentions: 15, polarity: 'Strength', units: 'CS · Growth' },
];

export const gmDiscussions = [
  { who: 'Segun Alabi', topic: 'Closing the self vs upward gap', status: 'Awaiting GM', priority: 'High', updated: '1d' },
  { who: 'Yemi Cole', topic: 'Finance Ops turnaround plan', status: 'Escalated', priority: 'Critical', updated: '4h' },
  { who: 'Tunde Adeyemi', topic: 'Ibrahim performance conversation', status: 'In progress', priority: 'High', updated: '2d' },
  { who: 'Bola Fashola', topic: 'Coverage model for 22-person team', status: 'Scheduled', priority: 'Med', updated: '3d' },
  { who: 'Zainab Lawal', topic: 'Succession / next role stretch', status: 'GM to open', priority: 'Med', updated: '—' },
  { who: 'Adaeze Ume', topic: 'Q3 OKR alignment with Product', status: 'Open', priority: 'Low', updated: '5d' },
];

export const gmCycleMilestones = [
  { name: 'Cycle opens', date: '1 Jun', done: true },
  { name: 'Self assessments due', date: '20 Jun', done: true },
  { name: 'Peer 360 window', date: '15–30 Jun', done: false },
  { name: 'Manager evaluations due', date: '10 Jul', done: false },
  { name: 'People Ops release gate', date: '15 Jul', done: false },
  { name: 'Results visible to individuals', date: '18 Jul', done: false },
  { name: 'Calibration / GM review', date: '22 Jul', done: false },
  { name: 'Cycle close & archive', date: '31 Jul', done: false },
];

export const gmInsightsBullets = [
  'Finance Ops is the only unit below 60% completion — concentrate nudges and unblock manager capacity.',
  'Product leadership shows the widest self–upward gap (−0.3); coaching should focus on listening and priority clarity.',
  'Growth & Partnerships is a bright spot (4.2 avg, 94% complete) — harvest practices for other units.',
  'Peer themes cluster on handoffs; consider a cross-unit working agreement as a cycle outcome, not only scores.',
  'Four talent flags need named owners before results release so conversations are planned, not reactive.',
];

export const peopleOpsRosterIssues = [
  { person: 'New joiner — Halima Sule', issue: 'No manager mapping', impact: 'Blocks EA assignment' },
  { person: 'Transfer — Paul Ike', issue: 'Unit stale (still Eng)', impact: 'Wrong 360 matrix' },
  { person: 'Contractor — Ayo Temp', issue: 'Should be excluded this cycle', impact: 'Noise in completion %' },
  { person: 'Dual line — Shared Ops trio', issue: 'Secondary manager missing', impact: 'Incomplete comment flow' },
];

export const peopleOpsCompletion = [
  { form: 'Monthly self', due: '20 Jun', done: 86, total: 98, overdue: 12 },
  { form: 'Peer 360', due: '30 Jun', done: 142, total: 186, overdue: 44 },
  { form: 'Manager evaluation', due: '10 Jul', done: 38, total: 62, overdue: 0 },
  { form: 'Leadership self (EPA-style)', due: '12 Jul', done: 9, total: 14, overdue: 0 },
];

export const adminConfig = [
  { knobs: 'Hierarchy depth', current: '3 levels (L0–L2)', note: 'Can add L3/L4 without rebuilding forms' },
  { knobs: 'Form catalogue', current: '4 active form types', note: 'Enable/disable per population' },
  { knobs: '360 anonymity', current: 'Aggregate only to subject', note: 'Facilitator never shown as reviewer' },
  { knobs: 'Release gate', current: 'People Ops required', note: 'GM can preview; individuals wait' },
  { knobs: 'OKR injection', current: 'On for leadership self', note: 'Period OKRs pulled into form' },
  { knobs: 'Notification channels', current: 'In-app + email', note: 'Email optional per tenant' },
];

export const adminForms = [
  { code: 'monthly_self', name: 'Monthly self-assessment', cadence: 'Monthly', audience: 'Everyone' },
  { code: 'peer_360', name: 'Peer 360', cadence: 'Quarterly', audience: 'Routed pairs' },
  { code: 'ea_quarterly', name: 'Manager evaluation', cadence: 'Quarterly', audience: 'Managers → directs' },
  { code: 'executive', name: 'Leadership self-performance', cadence: 'Quarterly', audience: 'Configured leaders' },
];

export const adminAnalytics = [
  { metric: 'Responses this cycle', value: '412' },
  { metric: 'Unique participants', value: '98' },
  { metric: 'Avg time to complete peer 360', value: '11 min' },
  { metric: 'Discussion threads opened', value: '47' },
  { metric: 'Notifications delivered', value: '1,204' },
  { metric: 'Exports run (People Ops)', value: '6' },
];

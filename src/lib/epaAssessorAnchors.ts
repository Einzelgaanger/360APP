/** BOOM-EPA v2.0 — GCEO / assessor rating scale (May 2026). */
export const EPA_ASSESSOR_SCALE = [
  { value: 5, label: 'Exceptional', short: 'Exceptional' },
  { value: 4, label: 'Exceeds standard', short: 'Exceeds' },
  { value: 3, label: 'Meets standard', short: 'Meets' },
  { value: 2, label: 'Developing', short: 'Developing' },
  { value: 1, label: 'Significant gap', short: 'Gap' },
] as const;

export type EpaAnchorRow = {
  score: number;
  label: string;
  lookFor: string;
};

export type EpaQuestionAnchor = {
  questionNum: number;
  measuring: string;
  anchors: EpaAnchorRow[];
};

/** Behavioural anchors for assessor-only view (Q1–Q15). */
export const EPA_QUESTION_ANCHORS: EpaQuestionAnchor[] = [
  {
    questionNum: 1,
    measuring:
      'The Camel thesis is the conceptual core of BOOM. An executive who has internalised it names concrete decisions, not abstract principles.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Cannot articulate beyond the phrase; no institutional evidence.' },
      { score: 3, label: 'Meets standard', lookFor: 'Names a relevant example; may conflate Camel with any prudent decision.' },
      { score: 5, label: 'Exceptional', lookFor: 'Own language; specific success and failure with equal specificity.' },
    ],
  },
  {
    questionNum: 2,
    measuring:
      'Tests whether BOOM is an operating principle, not a metaphor. Naming both success and failure prevents performative answers.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Treats BOOM as brand; cannot explain seal vs container.' },
      { score: 3, label: 'Meets standard', lookFor: 'Understands seal logic; failure example may be partial.' },
      { score: 5, label: 'Exceptional', lookFor: 'Active decision filter; owns failure without deflection.' },
    ],
  },
  {
    questionNum: 3,
    measuring:
      'Asks the executive to critique the institution and own a piece of the solution — shift from “the institution should” to “I am doing”.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Institutional problem only; no personal ownership.' },
      { score: 3, label: 'Meets standard', lookFor: 'Real gap; personal role partial.' },
      { score: 5, label: 'Exceptional', lookFor: 'Specific gap; explicit personal accountability with verifiable actions.' },
    ],
  },
  {
    questionNum: 4,
    measuring: 'Does this executive know what Uranus demands of them as an operator, not only as an institution?',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'VGG-level only; Uranus language without behaviour.' },
      { score: 3, label: 'Meets standard', lookFor: '1–2 operational changes; partial stop/start/differently.' },
      { score: 5, label: 'Exceptional', lookFor: 'Observable stop/start/differently with institutional reasoning.' },
    ],
  },
  {
    questionNum: 5,
    measuring:
      'Requires voluntary self-disclosure of a real Saturn habit — the most revealing question in the assessment.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Generic development area, not a Saturn habit.' },
      { score: 3, label: 'Meets standard', lookFor: 'Recognisable habit; shift plan vague.' },
      { score: 5, label: 'Exceptional', lookFor: 'Named behaviour, observable manifestation, concrete Uranus replacement.' },
    ],
  },
  {
    questionNum: 6,
    measuring: 'Reconstruct a real decision under the Saturn/Uranus framework honestly.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Surface decision; no Saturn/Uranus classification.' },
      { score: 3, label: 'Meets standard', lookFor: 'Real decision; partial classification reasoning.' },
      { score: 5, label: 'Exceptional', lookFor: 'Precise reconstruction; owns Saturn choices; verifiable Uranus evidence.' },
    ],
  },
  {
    questionNum: 7,
    measuring: 'Deliver vs build — outputs must compound; impact must be evidenced.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Delivery terms only; retrofitted BOOM link.' },
      { score: 3, label: 'Meets standard', lookFor: 'At least one build-term output with plausible impact.' },
      { score: 5, label: 'Exceptional', lookFor: 'All three in build terms; precise BOOM link; evidenced impact.' },
    ],
  },
  {
    questionNum: 8,
    measuring: 'Evidence of shortfall — describing the BOOM-standard version is equally important.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Near-success framing; protective of record.' },
      { score: 3, label: 'Meets standard', lookFor: 'Genuine shortfall; BOOM-standard version partial.' },
      { score: 5, label: 'Exceptional', lookFor: 'Institutional shortfall explained; BOOM-standard version detailed.' },
    ],
  },
  {
    questionNum: 9,
    measuring: 'Root cause analysis, not improvement intentions.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Symptom not cause; vague or absent plan.' },
      { score: 3, label: 'Meets standard', lookFor: 'Partial root cause; somewhat concrete plan.' },
      { score: 5, label: 'Exceptional', lookFor: 'Root cause vs symptom clear; verifiable improvement indicator.' },
    ],
  },
  {
    questionNum: 10,
    measuring: 'Integrity under pressure — the cost of the choice is the signal.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Right choice was also convenient; no real cost.' },
      { score: 3, label: 'Meets standard', lookFor: 'Real choice with some cost; may underplay it.' },
      { score: 5, label: 'Exceptional', lookFor: 'Genuine cost named honestly; specific recallable moment.' },
    ],
  },
  {
    questionNum: 11,
    measuring: 'Knowing your standard and naming when you are below it.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Cannot name below-standard area or only superficial gap.' },
      { score: 3, label: 'Meets standard', lookFor: 'Real gap; plan exists but may lack method.' },
      { score: 5, label: 'Exceptional', lookFor: 'Precise gap, root cause, observable remediation.' },
    ],
  },
  {
    questionNum: 12,
    measuring: 'Peer vs silo — must name one silo moment honestly.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'No silo example or trivial/minor silo only.' },
      { score: 3, label: 'Meets standard', lookFor: 'Peer contribution real; silo framed defensively.' },
      { score: 5, label: 'Exceptional', lookFor: 'Institutional peer impact; silo owned without deflection.' },
    ],
  },
  {
    questionNum: 13,
    measuring: 'Actual default under pressure — Saturn vs Uranus diagnostic.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Claims composure without evidence.' },
      { score: 3, label: 'Meets standard', lookFor: 'Honest default; partial Saturn/Uranus link.' },
      { score: 5, label: 'Exceptional', lookFor: 'Honest reactive default; real self-analysis under framework.' },
    ],
  },
  {
    questionNum: 14,
    measuring: 'Innovation vs disruption — result and institutional rationale required.',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Change without institutional rationale.' },
      { score: 3, label: 'Meets standard', lookFor: 'Real challenge; result early-stage.' },
      { score: 5, label: 'Exceptional', lookFor: 'Evidence of compounding value; innovation test articulated.' },
    ],
  },
  {
    questionNum: 15,
    measuring: 'Full ownership end-to-end — what does your name on the outcome mean?',
    anchors: [
      { score: 1, label: 'Significant gap', lookFor: 'Managed/coordinated, not owned.' },
      { score: 3, label: 'Meets standard', lookFor: 'Owned with real outcome; accountability-level answer.' },
      { score: 5, label: 'Exceptional', lookFor: 'Inception to impact; verifiable “would not exist without” ownership.' },
    ],
  },
];

/** Executive form self-rating rows use odd sort_order (1,3,5…) → Q1, Q2, … */
export function epaQuestionNumFromSortOrder(sortOrder: number): number {
  return Math.ceil(sortOrder / 2);
}

export function epaAnchorForSortOrder(sortOrder: number): EpaQuestionAnchor | undefined {
  const n = epaQuestionNumFromSortOrder(sortOrder);
  return EPA_QUESTION_ANCHORS.find((a) => a.questionNum === n);
}

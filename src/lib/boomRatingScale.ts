/** Unified BOOM 1–5 rating scale (Executive, EA quarterly, GCEO assessor, peer 360). */

export type BoomRatingRow = {
  value: number;
  label: string;
  short: string;
  meaning: string;
  /** Optional performance band (EA quarterly reference). */
  pctRange?: string;
};

export const BOOM_RATING_SCALE: BoomRatingRow[] = [
  {
    value: 5,
    label: 'Exceptional',
    short: 'Exceptional',
    meaning:
      'Deep, unprompted BOOM fluency. Specific, honest, institutionally grounded with compelling evidence. Operating above role standard.',
    pctRange: '85% – 100%',
  },
  {
    value: 4,
    label: 'Exceeds Standard',
    short: 'Exceeds',
    meaning:
      'Solid alignment with real evidence. Beyond surface-level articulation. Minor gaps acknowledged. Above minimum expectations.',
    pctRange: '71% – 84%',
  },
  {
    value: 3,
    label: 'Meets Standard',
    short: 'Meets',
    meaning:
      'Adequate comprehension with real but limited evidence. On track. Some gaps present, not critical.',
    pctRange: '56% – 70%',
  },
  {
    value: 2,
    label: 'Developing',
    short: 'Developing',
    meaning:
      'Partial comprehension. Generic language. Weak or absent evidence. Targeted development required.',
    pctRange: '45% – 55%',
  },
  {
    value: 1,
    label: 'Significant Gap',
    short: 'Gap',
    meaning:
      'Comprehension superficial or absent. Describes BOOM from outside rather than reasoning within it. Immediate remediation required.',
    pctRange: '< 45%',
  },
];

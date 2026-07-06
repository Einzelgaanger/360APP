/** Placeholder answers reviewers use when they have nothing to add — hide from dashboards. */
const PLACEHOLDER_ANSWERS = new Set([
  'nil',
  'nill',
  'n/a',
  'na',
  'none',
  'nothing',
  'no comment',
  'no comments',
  'not applicable',
  'notapplicable',
  'null',
  'blank',
  'empty',
  '-',
  '--',
  '—',
  '.',
  '..',
  '...',
  'same',
  'same as above',
  'nope',
  'no',
]);

export function isMeaningfulQualitativeAnswer(text: string | null | undefined): boolean {
  const raw = text?.trim();
  if (!raw) return false;
  const normalized = raw
    .toLowerCase()
    .replace(/[.!?,;:]+$/g, '')
    .trim();
  if (!normalized || normalized.length < 2) return false;
  return !PLACEHOLDER_ANSWERS.has(normalized);
}

export function filterQualitativeItems<T extends { text: string }>(items: T[]): T[] {
  return items.filter((item) => isMeaningfulQualitativeAnswer(item.text));
}

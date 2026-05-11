/**
 * Legacy VGG survey: higher hierarchy_level = more senior (intern at 0, partner at 8).
 * Executive Office (EO) seed: lower hierarchy_level = more senior (0 = Group CEO).
 * Subsidiary flag `hierarchy_lower_is_senior` selects which convention applies.
 */

import { boomHierarchyLabel } from '@/lib/boomRoleLabels';

/** Legacy pool labels (higher number = more senior in org chart). */
export const LEGACY_HIERARCHY_LABELS: Record<number, string> = {
  0: 'Intern',
  1: 'Junior',
  2: 'Analyst',
  3: 'Associate',
  4: 'Senior Associate',
  5: 'Manager',
  6: 'Principal/Head',
  7: 'C-Suite',
  8: 'Partner',
};

export function displayHierarchyLabel(
  level: number | null | undefined,
  hierarchyLowerIsSenior: boolean,
): string {
  const l = level ?? 3;
  if (hierarchyLowerIsSenior) return boomHierarchyLabel(level);
  return LEGACY_HIERARCHY_LABELS[l] ?? `L${l}`;
}

/** Feedback direction stored on survey_responses: reviewer vs reviewee seniority. */
export function getSurveyFeedbackDirection(
  reviewerLevel: number,
  revieweeLevel: number,
  hierarchyLowerIsSenior: boolean,
): 'above' | 'peer' | 'below' {
  if (hierarchyLowerIsSenior) {
    if (reviewerLevel < revieweeLevel) return 'above';
    if (reviewerLevel > revieweeLevel) return 'below';
    return 'peer';
  }
  if (reviewerLevel > revieweeLevel) return 'above';
  if (reviewerLevel < revieweeLevel) return 'below';
  return 'peer';
}

export type HierarchyPool = 'above' | 'peers' | 'below';

export function assignHierarchyPool(
  otherLevel: number,
  myLevel: number,
  hierarchyLowerIsSenior: boolean,
): HierarchyPool {
  if (hierarchyLowerIsSenior) {
    if (otherLevel < myLevel) return 'above';
    if (otherLevel > myLevel) return 'below';
    return 'peers';
  }
  if (otherLevel > myLevel) return 'above';
  if (otherLevel < myLevel) return 'below';
  return 'peers';
}

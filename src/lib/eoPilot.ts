/** Executive Office subsidiary — BOOM appraisal pilot (~22 people). */
export const EO_SUBSIDIARY_ID = '11111111-1111-1111-1111-111111111111';

/** When true, hide legacy multi-subsidiary survey, rankings, XLSX demo, and /demo route. */
export const EO_PILOT_ONLY = true;

/** EO hierarchy: 0 = L0, 1 = L1 leads, 2+ = team members below functional leads. */
export const EO_TEAM_MEMBER_MIN_LEVEL = 2;

export function isEoTeamMember(hierarchyLevel: number | null | undefined): boolean {
  return hierarchyLevel != null && hierarchyLevel >= EO_TEAM_MEMBER_MIN_LEVEL;
}

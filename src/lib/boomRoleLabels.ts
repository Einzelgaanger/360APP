/**
 * Labels for `employees.hierarchy_level` in the Executive Office / BOOM seed model.
 * Lower numbers are more senior in this dataset (0 = Group CEO).
 */
export function boomHierarchyLabel(level: number | null | undefined): string {
  if (level === null || level === undefined) return 'Level not set';
  if (level <= 0) return 'Group CEO';
  if (level === 1) return 'Executive leadership';
  if (level === 2) return 'Manager';
  return 'Team member';
}

/** Short hint for why peer forms may include extra manager-only sections */
export function boomPeerFormHint(level: number | null | undefined): string {
  const l = level ?? 99;
  if (l <= 2) {
    return 'You see manager / executive lens questions on peer reviews.';
  }
  return 'Peer reviews show standard sections; executive-only items are hidden for your role.';
}

/** Human summary for each assessment form type (reviewer-facing). */
export function boomFormPurpose(formCode: string): string {
  switch (formCode) {
    case 'executive':
      return 'Quarterly executive performance — self vs executive peers per routing rules.';
    case 'peer_360':
      return 'Anonymous peer feedback about colleagues you work with (questions adapt to your level).';
    case 'monthly_self':
      return 'Private monthly reflection — only you and authorised admins see answers.';
    case 'ea_quarterly':
      return 'Managers assess Executive Assistants they line-manage.';
    default:
      return 'Executive Office assessment.';
  }
}

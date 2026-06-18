export const BOOM_OVERSIGHT_EMAILS = [
  'bunmi.akinyemiju@peopleos.co',
  'omotola.akinyemiju@venturegardengroup.com',
] as const;

export function isBoomOversightViewer(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  return BOOM_OVERSIGHT_EMAILS.some((x) => x.toLowerCase() === e);
}

export const DISCUSSION_FORM_LABELS: Record<string, string> = {
  monthly_self: 'Monthly self-assessment',
  executive: 'Executive assessment',
  ea_quarterly: 'EA quarterly evaluation',
  peer_360: '360 Peer review',
};

export function discussionThreadTitle(
  formCode: string,
  viewerRole: 'subject' | 'facilitator',
  subjectName: string,
  facilitatorName: string,
): string {
  const label = DISCUSSION_FORM_LABELS[formCode] ?? formCode;
  if (viewerRole === 'subject') {
    return `${label} · with ${facilitatorName}`;
  }
  return `${label} · ${subjectName}`;
}

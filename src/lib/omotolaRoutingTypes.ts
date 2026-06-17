/** Form / document types used in EO appraisal routing. */
export type RoutingFormCode =
  | 'monthly_self'
  | 'executive'
  | 'peer_360'
  | 'ea_quarterly'
  | 'comments_give';

export const ROUTING_FORM_OPTIONS: {
  code: RoutingFormCode;
  label: string;
  cadence: string;
  description: string;
}[] = [
  {
    code: 'monthly_self',
    label: 'Monthly self-assessment',
    cadence: 'Monthly',
    description: 'Private monthly reflection (reviewer = reviewee).',
  },
  {
    code: 'executive',
    label: 'Performance self-assessment',
    cadence: 'Quarterly',
    description: 'Quarterly executive performance self-evaluation.',
  },
  {
    code: 'peer_360',
    label: '360° peer review',
    cadence: 'Quarterly',
    description: 'Scored anonymous peer review of another person.',
  },
  {
    code: 'ea_quarterly',
    label: 'EA quarterly (manager rates EA)',
    cadence: 'Quarterly',
    description: 'Manager assessment of an executive assistant.',
  },
  {
    code: 'comments_give',
    label: 'Narrative comment',
    cadence: 'Quarterly',
    description: 'Written downward comment (orange → blue). Not scored.',
  },
];

export type SelfAssessmentRow = {
  id: string;
  formCode: RoutingFormCode;
};

export type ReviewAssignmentRow = {
  id: string;
  revieweeId: string;
  formCode: RoutingFormCode;
  notes: string;
};

export type CommentGiveRow = {
  id: string;
  revieweeId: string;
};

export type CommentReceiveRow = {
  id: string;
  fromEmployeeId: string;
};

export type PersonRoutingConfig = {
  employeeId: string;
  selfAssessments: SelfAssessmentRow[];
  reviewAssignments: ReviewAssignmentRow[];
  commentsGive: CommentGiveRow[];
  commentsReceive: CommentReceiveRow[];
  locked: boolean;
};

export type EmployeeOption = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  hierarchy_level: number | null;
  department_code: string | null;
};

export type RoutingWorkbook = {
  version: 1;
  updatedAt: string;
  configuredBy: string;
  people: Record<string, PersonRoutingConfig>;
};

export const ROUTING_STORAGE_KEY = 'omotola-routing-config-v1';

export function emptyPersonConfig(employeeId: string): PersonRoutingConfig {
  return {
    employeeId,
    selfAssessments: [],
    reviewAssignments: [],
    commentsGive: [],
    commentsReceive: [],
    locked: false,
  };
}

export function newId(): string {
  return crypto.randomUUID();
}

export function formLabel(code: RoutingFormCode): string {
  return ROUTING_FORM_OPTIONS.find((f) => f.code === code)?.label ?? code;
}

/** Accounts allowed to open /omotola (plus platform admins). */
export const OMOTOLA_CONFIGURATOR_EMAILS = new Set([
  'omotola.akinyemiju@venturegardengroup.com',
  'omotola.akinyemiju@peopleos.co',
  'bunmi.akinyemiju@peopleos.co',
  'kunmi.demuren@peopleos.co',
]);

export const OMOTOLA_PRIMARY_EMAIL = 'omotola.akinyemiju@venturegardengroup.com';

export function canAccessOmotolaConfigurator(email: string | null | undefined, isAdmin = false): boolean {
  if (isAdmin) return true;
  const normalized = email?.trim().toLowerCase();
  return !!normalized && OMOTOLA_CONFIGURATOR_EMAILS.has(normalized);
}

import * as XLSX from 'xlsx';
import {
  type EmployeeOption,
  type PersonRoutingConfig,
  type RoutingWorkbook,
  formLabel,
} from './omotolaRoutingTypes';

function empMap(employees: EmployeeOption[]): Map<string, EmployeeOption> {
  return new Map(employees.map((e) => [e.id, e]));
}

function sheetName(name: string, used: Set<string>): string {
  let base = name.replace(/[\\/?*[\]:]/g, '').slice(0, 28) || 'Person';
  let candidate = base;
  let n = 1;
  while (used.has(candidate)) {
    candidate = `${base.slice(0, 25)}_${n++}`;
  }
  used.add(candidate);
  return candidate;
}

function personSheetRows(
  person: EmployeeOption,
  config: PersonRoutingConfig,
  byId: Map<string, EmployeeOption>,
): (string | number)[][] {
  const rows: (string | number)[][] = [
    ['EO APPRAISAL ROUTING — PER PERSON'],
    ['Generated for implementation review — not live assignments until imported'],
    [],
    ['PERSON'],
    ['Name', person.name],
    ['Email', person.email],
    ['Role', person.role ?? ''],
    ['Level', person.hierarchy_level ?? ''],
    ['Department code', person.department_code ?? ''],
    ['Locked', config.locked ? 'YES' : 'NO'],
    [],
    ['SELF ASSESSMENTS (this person completes about themselves)'],
    ['Form code', 'Form title', 'Cadence'],
  ];

  for (const s of config.selfAssessments) {
    rows.push([s.formCode, formLabel(s.formCode), cadenceFor(s.formCode)]);
  }
  if (config.selfAssessments.length === 0) rows.push(['—', '—', '—']);

  rows.push([]);
  rows.push(['REVIEW ASSIGNMENTS (this person is the reviewer)']);
  rows.push(['Reviewee name', 'Reviewee email', 'Form code', 'Form title', 'Self?', 'Notes']);

  for (const a of config.reviewAssignments) {
    const rev = byId.get(a.revieweeId);
    rows.push([
      rev?.name ?? a.revieweeId,
      rev?.email ?? '',
      a.formCode,
      formLabel(a.formCode),
      a.revieweeId === person.id ? 'YES' : 'NO',
      a.notes,
    ]);
  }
  if (config.reviewAssignments.length === 0) rows.push(['—', '—', '—', '—', '—', '—']);

  rows.push([]);
  rows.push(['COMMENTS TO GIVE (narrative, downward)']);
  rows.push(['Reviewee name', 'Reviewee email']);

  for (const c of config.commentsGive) {
    const rev = byId.get(c.revieweeId);
    rows.push([rev?.name ?? c.revieweeId, rev?.email ?? '']);
  }
  if (config.commentsGive.length === 0) rows.push(['—', '—']);

  rows.push([]);
  rows.push(['COMMENTS RECEIVED FROM (who writes narrative feedback about this person)']);
  rows.push(['Reviewer name', 'Reviewer email']);

  for (const c of config.commentsReceive) {
    const from = byId.get(c.fromEmployeeId);
    rows.push([from?.name ?? c.fromEmployeeId, from?.email ?? '']);
  }
  if (config.commentsReceive.length === 0) rows.push(['—', '—']);

  return rows;
}

function cadenceFor(code: string): string {
  if (code === 'monthly_self') return 'Monthly';
  return 'Quarterly';
}

export function buildRoutingWorkbook(
  workbook: RoutingWorkbook,
  employees: EmployeeOption[],
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const byId = empMap(employees);
  const usedNames = new Set<string>();

  const summaryRows: (string | number)[][] = [
    ['EO ROUTING CONFIGURATION SUMMARY'],
    ['Configured by', workbook.configuredBy],
    ['Last updated', workbook.updatedAt],
    [],
    ['Name', 'Email', 'Level', 'Locked', 'Self forms', 'Reviews', 'Comments give', 'Comments receive'],
  ];

  for (const emp of employees) {
    const cfg = workbook.people[emp.id] ?? emptyFallback(emp.id);
    summaryRows.push([
      emp.name,
      emp.email,
      emp.hierarchy_level ?? '',
      cfg.locked ? 'YES' : 'NO',
      cfg.selfAssessments.length,
      cfg.reviewAssignments.length,
      cfg.commentsGive.length,
      cfg.commentsReceive.length,
    ]);
  }

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');

  const readme: (string | number)[][] = [
    ['HOW TO USE THIS FILE'],
    ['1. One sheet per person — all relationships for that individual.'],
    ['2. SELF ASSESSMENTS — forms they complete about themselves (can be multiple).'],
    ['3. REVIEW ASSIGNMENTS — who they review and which document; Self?=YES when reviewee is same person.'],
    ['4. COMMENTS TO GIVE — narrative feedback they owe (typically orange roles → blue recipients).'],
    ['5. COMMENTS RECEIVED — who may write narrative feedback about this person.'],
    ['6. Send completed file back to tech team to implement in the platform.'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(readme), 'README');

  for (const emp of employees) {
    const cfg = workbook.people[emp.id] ?? emptyFallback(emp.id);
    const rows = personSheetRows(emp, cfg, byId);
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(rows),
      sheetName(emp.name, usedNames),
    );
  }

  return wb;
}

function emptyFallback(employeeId: string): PersonRoutingConfig {
  return {
    employeeId,
    selfAssessments: [],
    reviewAssignments: [],
    commentsGive: [],
    commentsReceive: [],
    locked: false,
  };
}

export function downloadRoutingExcel(
  workbook: RoutingWorkbook,
  employees: EmployeeOption[],
  filename?: string,
): void {
  const wb = buildRoutingWorkbook(workbook, employees);
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, filename ?? `eo-routing-config-${stamp}.xlsx`);
}

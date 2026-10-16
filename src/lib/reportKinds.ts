// The five things a student can report about a task (R83). One list, used by
// the report dialog and the instructor's panel, so the labels never drift
// from the CHECK constraint in supabase/migrations/0008_task_reports.sql.
export const REPORT_KINDS = [
  { id: 'unclear', label: 'Instructions unclear', hint: 'Missing steps, ambiguous wording, "what does this mean?"' },
  { id: 'broken', label: 'Something is broken', hint: 'A command fails, output doesn’t match, a link is dead' },
  { id: 'environment', label: 'My environment', hint: 'VM, network or hardware problems on my side' },
  { id: 'question', label: 'I have a question', hint: 'I understand the words but not the why' },
  { id: 'outdated', label: 'Content looks outdated', hint: 'The task no longer matches the current tool or screen' },
] as const;

export type ReportKind = (typeof REPORT_KINDS)[number]['id'];

export function reportKindLabel(id: string): string {
  return REPORT_KINDS.find((k) => k.id === id)?.label ?? id;
}

// Where a report stands (R120). One registry for the dialog, the inbox, the cohort
// panel and the team's marker, so the words never drift from the CHECK constraint in
// supabase/migrations/0016_report_context.sql. Every status is an icon plus a word in the
// UI, never colour alone. A report is PENDING until an instructor resolves it or says it
// will not be fixed; "complete" is resolved, and "won't fix" is closed without a change.
export const REPORT_STATUSES = [
  { id: 'open', label: 'Open', group: 'pending' },
  { id: 'in_progress', label: 'In progress', group: 'pending' },
  { id: 'resolved', label: 'Resolved', group: 'complete' },
  { id: 'wont_fix', label: 'Won’t fix', group: 'closed' },
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number]['id'];

export function reportStatusLabel(id: string): string {
  return REPORT_STATUSES.find((s) => s.id === id)?.label ?? id;
}

/** Open or in progress: the instructor still owes the reporter something. */
export function isPendingReport(status: string): boolean {
  return status === 'open' || status === 'in_progress';
}

/** A status the database accepts; anything else reads as open. */
export function asReportStatus(v: unknown): ReportStatus {
  return REPORT_STATUSES.some((s) => s.id === v) ? (v as ReportStatus) : 'open';
}

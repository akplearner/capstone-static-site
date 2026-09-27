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

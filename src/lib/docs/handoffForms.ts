import { isGradedWeek } from '../course-helpers';
import type { Course, Task } from '../types';
import type { DeliverableDef } from './types';

/**
 * R138 — the form each task hand-off lands in, by course and task.
 *
 * A task's `handoff` names the artifact in words ("Attack-surface findings",
 * "D3 and D4 v1") because that is how the hand-off is read on the task. The
 * Hand-offs KPI (`kpi.teamwork.handoffs`) counts a hand-off completed when the
 * FORM it lands in reached approved or issued, so each needs a form id. Rather
 * than restating the id inside sixty-nine seed literals, the map lives here, as
 * data, and the export (`content/dto.ts`) writes it into every hand-off's
 * `deliverable` before the course document is built. A hand-off with its own
 * `deliverable` keeps it; `handoffForms.test.ts` asserts every hand-off of every
 * course resolves to a form of that course.
 *
 * A task with two hand-offs lists them in the task's order.
 */
export const HANDOFF_FORMS: Record<string, Record<string, string[]>> = {
  'security-plus': {
    'red-w0-setup': ['scope_roe'],
    'red-w1-osint': ['asset_inventory'],
    'red-w2-enumeration': ['risk_register'],
    'red-w3-attacks': ['evidence_log'],
    'red-w4-briefing': ['final_report'],
    'blue-w0-setup': ['hardening_standard', 'scope_roe'],
    'blue-w1-hardening': ['hardening_baseline'],
    'blue-w2-baseline': ['vm_sop'],
    'blue-w3-detection': ['evidence_log'],
    'blue-w4-response': ['final_report'],
    'grc-w0-setup': ['scope_roe', 'hardening_standard'],
    'grc-w1-framework': ['hardening_standard', 'scope_roe'],
    'grc-w2-risk': ['vm_sop'],
    'grc-w3-custody': ['ir_runbook'],
    'grc-w4-report': ['final_report', 'final_report'],
  },
  mssp: {
    'mg-w0': ['mssp_engagement', 'mssp_engagement'],
    'mg-w1': ['mssp_soa'],
    'mr-w1': ['mssp_gap_assessment'],
    'mb-w1': ['mssp_control_matrix'],
    'mg-w2': ['mssp_control_matrix'],
    'mb-w2': ['mssp_control_matrix'],
    'mr-w2': ['mssp_control_matrix', 'mssp_gap_assessment'],
    'mr-w3': ['mssp_detection_rules'],
    'mb-w3': ['mssp_evidence_packet'],
    'mr-w4': ['mssp_retest'],
    'mg-w4a': ['mssp_internal_audit'],
  },
  'cysa-plus': {
    'cr-w1': ['cysa_coverage_validation'],
    'cb-w1': ['cysa_soc_monitoring'],
    'cb-w2': ['cysa_alert_triage'],
    'cg-w2': ['cysa_ioc_database'],
    'cb-w3': ['cysa_soc_findings'],
    'cg-w3': ['cysa_scan_validation'],
    'cb-w4': ['cysa_detection_record'],
    'cg-w4': ['cysa_incident_response'],
    'cr-w4': ['cysa_incident_response'],
  },
  ccna: {
    'ccna-w0-register': ['ccna_kit'],
    'ccna-w5-change': ['ccna_ops'],
  },
  'secai-plus': {
    'sa-w0-gov': ['secai_lab_rule'],
    'sa-w0-def': ['secai_system_map'],
    'sa-w1-red': ['secai_attack_casebook'],
    'sa-w1-def': ['secai_control_set'],
    'sa-w2-red': ['secai_attack_casebook'],
    'sa-w2-def': ['secai_control_set'],
    'sa-w3-red': ['secai_attack_casebook'],
    'sa-w4-def': ['secai_control_set', 'secai_release_package'],
    'sa-w4-red': ['secai_governance_pack'],
  },
  cissp: {
    'ci-w0-gov': ['cissp_d2', 'cissp_d7'],
    'ci-w0-arch': ['cissp_d2'],
    'ci-w1-arch': ['cissp_d3'],
    'ci-w1-idops': ['cissp_d5'],
    'ci-w2-gov': ['cissp_d1'],
    'ci-w2-arch': ['cissp_d4'],
    'ci-w2-idops': ['cissp_d7'],
    'ci-w3-arch': ['cissp_d4'],
    'ci-w3-idops': ['cissp_d5'],
    'ci-w4-idops': ['cissp_d7'],
    'ci-w4-arch': ['cissp_d8'],
    'ci-w5-arch': ['cissp_d6'],
    'ci-w5-idops': ['cissp_d6'],
    'ci-w6-arch': ['cissp_ssp'],
    'ci-w6-idops': ['cissp_ssp'],
  },
};

/**
 * R138 — a hand-off for every graded task that was authored without one. Nine courses (Server+, A+, Network+,
 * CCNA, the six cloud courses, and the SecAI governance lane) had no hand-off on their graded tasks, so the
 * Hand-offs KPI could not be measured for those roles. The rule is the RACI's: a task hands its form to the
 * role that approves it, or to the reviewer when the task's own role approves; the artifact is the form.
 */
export function generatedHandoff(task: Pick<Task, 'id' | 'role' | 'deliverables' | 'week'>, defs: Pick<DeliverableDef, 'id' | 'file' | 'title' | 'raci' | 'owner' | 'weeks'>[]): NonNullable<Task['handoff']> | null {
  const named = (task.deliverables ?? []).map((f) => defs.find((d) => d.file === f)).find((d): d is NonNullable<typeof d> => !!d?.raci);
  // A task that files nothing itself hands on the form its role owns that week, else the week's own form.
  const def = named ?? defs.find((d) => d.raci && d.owner === task.role && d.weeks.includes(task.week)) ?? defs.find((d) => d.raci && d.weeks.includes(task.week));
  if (!def) return null;
  const to = def.raci!.approves !== task.role ? def.raci!.approves : def.raci!.reviews;
  if (to === task.role) return null;
  return [{ to, artifact: def.title, note: `Your section of the ${def.title}, for the review that approves it.`, deliverable: def.id }];
}

/** The course's hand-offs with their forms written in; a hand-off that already names one keeps it; a graded task without one gets the RACI's. */
export function withHandoffForms<T extends Pick<Course, 'id' | 'tasks' | 'weeks'>>(course: T, defs: Pick<DeliverableDef, 'id' | 'file' | 'title' | 'raci' | 'owner' | 'weeks'>[] = []): T {
  const map = HANDOFF_FORMS[course.id] ?? {};
  return {
    ...course,
    tasks: course.tasks.map((t) => {
      const forms = map[t.id];
      if (t.handoff?.length) return forms ? { ...t, handoff: t.handoff.map((h, i) => (h.deliverable || !forms[i] ? h : { ...h, deliverable: forms[i] })) } : t;
      if (!isGradedWeek(course as unknown as Course, t.week)) return t;
      const made = generatedHandoff(t, defs);
      return made ? { ...t, handoff: made } : t;
    }),
  };
}

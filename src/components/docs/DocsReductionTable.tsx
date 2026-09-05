'use client';

import { ArrowRight } from 'lucide-react';
import { Collapsible } from '@/components/ui/Button';
import { deliverablesForCourse, getDeliverable } from '@/lib/docs/definitions';

/**
 * Spec §1 — the old course produced 17 loose working files; this platform
 * consolidates them into graded deliverables (the core reports; GRC also adds
 * SOP/policy forms + an evidence log). Showing the mapping makes the change
 * legible to returning students.
 */
const MAP: { id: string; old: string[] }[] = [
  { id: 'scope_roe', old: ['Case_Overview', 'Scope_and_Rules'] },
  { id: 'asset_inventory', old: ['Asset_List.csv'] },
  { id: 'risk_register', old: ['Simple_Risk_List.csv', 'Threat_Notes'] },
  { id: 'hardening_baseline', old: ['Hardening_Checklist', 'Firewall_Notes', 'Logging_Notes'] },
  { id: 'change_log', old: ['Change_Log'] },
  { id: 'pentest_report', old: ['Scan_Results', 'Exploit_Notes', 'Findings_Summary'] },
  { id: 'incident_report', old: ['IR_Awareness_Notes'] },
  { id: 'final_report', old: ['Final_Presentation', 'Recommendations'] },
];

const ADMIN = ['Team_Roles', 'README'];

function Table() {
  const oldCount = MAP.reduce((n, m) => n + m.old.length, 0) + ADMIN.length;
  const newCount = deliverablesForCourse('security-plus').length;
  return (
    <div className="overflow-x-auto pb-2">
      <p className="mb-3 text-sm text-muted">
        The old course produced <strong>{oldCount} loose files</strong>. They now consolidate into{' '}
        <strong>{newCount} graded deliverables</strong> (plus a README and Team_Roles) — same
        work, one clear set of documents.
      </p>
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-muted dark:border-gray-700">
            <th scope="col" className="py-2 pr-3">Old working files</th>
            <th scope="col" className="py-2 pr-3" />
            <th scope="col" className="py-2 pr-3">New deliverable</th>
          </tr>
        </thead>
        <tbody>
          {MAP.map((m) => {
            const def = getDeliverable(m.id);
            return (
              <tr key={m.id} className="border-b border-gray-100 align-top dark:border-gray-700/60">
                <td className="py-1.5 pr-3 font-mono text-xs text-muted">
                  {m.old.join(' · ')}
                </td>
                <td className="py-1.5 pr-3 text-gray-300 dark:text-gray-600">
                  <ArrowRight className="h-4 w-4" />
                </td>
                <td className="py-1.5 pr-3 font-medium text-ink">
                  {def?.num}. {def?.title}{' '}
                  <span className="font-mono text-xs font-normal text-gray-400">{def?.file}</span>
                </td>
              </tr>
            );
          })}
          <tr className="align-top">
            <td className="py-1.5 pr-3 font-mono text-xs text-muted">
              {ADMIN.join(' · ')}
            </td>
            <td className="py-1.5 pr-3 text-gray-300 dark:text-gray-600">
              <ArrowRight className="h-4 w-4" />
            </td>
            <td className="py-1.5 pr-3 text-muted">
              Admin files — kept as <span className="font-mono text-xs">README.md</span> &amp;{' '}
              <span className="font-mono text-xs">Team_Roles.md</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function DocsReductionTable({ collapsible = false }: { collapsible?: boolean }) {
  if (collapsible) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-5 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="From 17 loose files to graded deliverables" defaultOpen={false}>
          <Table />
        </Collapsible>
      </div>
    );
  }
  return <Table />;
}

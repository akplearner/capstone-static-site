'use client';

import { Collapsible } from '@/components/ui/Button';
import { DELIVERABLES } from '@/lib/docs/definitions';

function IndexTable() {
  return (
    <div className="overflow-x-auto pb-2">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <th className="py-2 pr-3">#</th>
            <th className="py-2 pr-3">Deliverable</th>
            <th className="py-2 pr-3">Owner</th>
            <th className="py-2 pr-3">Folder</th>
            <th className="py-2 pr-3">Week</th>
            <th className="py-2 pr-3">Gate</th>
            <th className="py-2 pr-3">Standard</th>
          </tr>
        </thead>
        <tbody>
          {DELIVERABLES.map((d) => (
            <tr key={d.id} className="border-b border-gray-100 dark:border-gray-700/60">
              <td className="py-1.5 pr-3 text-gray-500">{d.num}</td>
              <td className="py-1.5 pr-3 font-medium text-gray-900 dark:text-white">{d.title}</td>
              <td className="py-1.5 pr-3 uppercase">{d.owner}</td>
              <td className="py-1.5 pr-3 font-mono text-xs text-gray-500 dark:text-gray-400">{d.folder}</td>
              <td className="py-1.5 pr-3">{d.weeks.join(', ')}</td>
              <td className="py-1.5 pr-3">{d.gate ?? '—'}</td>
              <td className="py-1.5 pr-3 text-gray-500 dark:text-gray-400">{d.standard}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Naming: deliverables <span className="font-mono">NN_Name.ext</span>; evidence{' '}
        <span className="font-mono">YYYYMMDD_TeamXX_Tool_Action.png</span>. Graded on process,
        documentation, evidence and ethics — not speed.
      </p>
    </div>
  );
}

/**
 * The canonical "8 files → owner → folder → week → gate → standard" index.
 * Reused on the (enrolment-gated) Deliverables page as a collapsible panel and
 * on the public Guide as an always-open section, so students always know what
 * they owe and when (spec §9.8).
 */
export function DeliverablesIndex({ collapsible = false }: { collapsible?: boolean }) {
  if (collapsible) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-5 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="The 8 deliverables — who owns what, and when" defaultOpen={false}>
          <IndexTable />
        </Collapsible>
      </div>
    );
  }
  return <IndexTable />;
}

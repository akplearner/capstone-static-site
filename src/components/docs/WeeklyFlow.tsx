'use client';

import { Collapsible } from '@/components/ui/Button';
import { Course } from '@/lib/types';
import { DELIVERABLES } from '@/lib/docs/definitions';

function WeeklyTable({ course }: { course: Course }) {
  const weeks = [...course.weeks].sort((a, b) => a.number - b.number);
  return (
    <div className="overflow-x-auto pb-2">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <th className="py-2 pr-3">Week</th>
            <th className="py-2 pr-3">Theme</th>
            <th className="py-2 pr-3">Produced this week</th>
            <th className="py-2 pr-3">Gate</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => {
            const produced = DELIVERABLES.filter((d) => d.weeks.includes(w.number));
            const gate = course.gates.find((g) => g.week === w.number);
            return (
              <tr key={w.number} className="border-b border-gray-100 align-top dark:border-gray-700/60">
                <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white">
                  {w.number === 0 ? 'Setup' : `Week ${w.number}`}
                  <div className="text-xs font-normal text-gray-500 dark:text-gray-400">{w.title}</div>
                </td>
                <td className="py-2 pr-3 italic text-gray-600 dark:text-gray-300">{w.theme}</td>
                <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                  {produced.length === 0 ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <ul className="space-y-0.5">
                      {produced.map((d) => (
                        <li key={d.id}>
                          <span className="text-gray-400">{d.num}.</span> {d.title}{' '}
                          <span className="text-[11px] uppercase text-gray-400">{d.owner}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2 pr-3 text-gray-600 dark:text-gray-300">
                  {gate ? (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Gate {gate.id}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        The four-week arc — themes drive each week&apos;s work; the deliverables it produces are your
        evidence for that week&apos;s gate.
      </p>
    </div>
  );
}

/**
 * The weekly arc (spec §4): theme + the deliverables produced that week + the
 * gate it clears. Shown collapsibly on the Deliverables page and always-open on
 * the public Guide.
 */
export function WeeklyFlow({ course, collapsible = false }: { course: Course; collapsible?: boolean }) {
  if (collapsible) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-5 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="The weekly arc — themes, what you produce, and gates" defaultOpen={false}>
          <WeeklyTable course={course} />
        </Collapsible>
      </div>
    );
  }
  return <WeeklyTable course={course} />;
}

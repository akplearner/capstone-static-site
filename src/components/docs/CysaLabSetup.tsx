'use client';

import { CheckCircle2, Cpu, Network, Server } from 'lucide-react';
import { LAB_MACHINES, LAB_PREFLIGHT, LAB_SETUP_COPY as COPY } from '@/lib/docs/cysaContent';

/**
 * CySA+ lab requirements — the shared Wazuh SOC plus per-team pods.
 *
 * Unlike the Security+ self-study lab, this is normally built once by the
 * instructor (Week 0 · "Environment build"); students just get an account and
 * their pod. The machine table, the pre-flight list and every sentence around
 * them are content, in `lib/docs/cysaContent.ts` — including the three pod
 * addresses that used to be typed here rather than read from `labTopology.ts`.
 */

export function CysaLabSetup({ courseId }: { courseId: string }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        {COPY.intro.before}
        <span className="font-medium">{COPY.intro.strong}</span>
        {COPY.intro.middle}
        <span className="font-mono text-xs">{COPY.intro.subnet}</span>
        {COPY.intro.after}
        <span className="font-medium">{COPY.intro.week0}</span>
        {COPY.intro.end}
      </p>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Cpu className="h-4 w-4 text-info" /> {COPY.machinesTitle}
        </h3>
        <div className="mt-2 overflow-x-auto rounded-lg clay-rim">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                {COPY.machinesColumns.map((c) => (
                  <th key={c} scope="col" className="px-3 py-2">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LAB_MACHINES.map((vm) => (
                <tr key={vm.name} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 font-medium text-ink">{vm.name}</td>
                  <td className="px-3 py-2 text-body">{vm.role}</td>
                  <td className="px-3 py-2 font-mono text-xs text-body">{vm.addr}</td>
                  <td className="px-3 py-2 text-muted">{vm.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Server className="h-4 w-4 text-info" /> {COPY.buildTitle}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {COPY.build.before}
          <span className="font-medium">{COPY.build.strong}</span>
          {COPY.build.middle}
          <a href={`/courses/${courseId}?tab=tasks`} className="font-medium text-accent underline">
            {COPY.build.link}
          </a>
          {COPY.build.after}
        </p>
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Network className="h-4 w-4 text-info" /> {COPY.preflightTitle}
        </h3>
        <ul className="mt-2 space-y-1.5">
          {LAB_PREFLIGHT.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-body">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

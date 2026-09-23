'use client';

import { CheckCircle2, Cpu, Network, Server } from 'lucide-react';
import { CommandBlock } from '@/components/TaskComponents';
import { Runs } from '@/components/docs/Runs';
import {
  DVWA,
  HYPERVISORS,
  LAB_NETWORK,
  LAB_PREFLIGHT,
  LAB_SETUP_COPY as COPY,
  LAB_VMS,
} from '@/lib/docs/securityContent';

/**
 * Self-study lab requirements + setup: what VMs to build, how to network them,
 * and the DVWA lifecycle (run / start / stop / first-run).
 *
 * All of it is content, in `lib/docs/securityContent.ts` — including the subnet
 * and the three host addresses, which used to be typed here beside a model that
 * already held them.
 */

export function LabSetupGuide() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        <Runs runs={COPY.intro} />
      </p>

      {/* VMs */}
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Cpu className="h-4 w-4 text-info" /> {COPY.vmsTitle}
        </h3>
        <div className="mt-2 overflow-x-auto rounded-lg depth-edge">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                {COPY.vmsColumns.map((c) => (
                  <th key={c} scope="col" className="px-3 py-2">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LAB_VMS.map((vm) => (
                <tr key={vm.name} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 font-medium text-ink">{vm.name}</td>
                  <td className="px-3 py-2 text-body">{vm.role}</td>
                  <td className="px-3 py-2 font-mono text-xs text-body">{vm.specs}</td>
                  <td className="px-3 py-2 text-muted">{vm.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          {COPY.hypervisorsLabel} {HYPERVISORS.join(' · ')}.
        </p>
      </div>

      {/* Network */}
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Network className="h-4 w-4 text-info" /> {COPY.networkTitle}
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-body">
          {LAB_NETWORK.map((bullet, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-info" />
              <span className="min-w-0">
                <Runs runs={bullet} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* DVWA lifecycle */}
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Server className="h-4 w-4 text-info" /> {DVWA.title}
        </h3>
        <p className="mt-1 mb-2 text-sm text-muted">
          <Runs runs={DVWA.intro} />
        </p>
        <CommandBlock commands={DVWA.commands} />
      </div>

      {/* Pre-flight */}
      <div>
        <h3 className="text-sm font-semibold text-ink">{COPY.preflightTitle}</h3>
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

'use client';

import { CheckCircle2, Cpu, Network, Server } from 'lucide-react';

// CySA+ lab requirements — the shared Wazuh SOC + per-team pods. Unlike the
// Security+ self-study lab, this is normally built once by the instructor/builder
// (Week 0 · "Environment build"); students just get an account and their pod.

const VMS: { name: string; role: string; addr: string; notes: string }[] = [
  { name: 'Wazuh SOC', role: 'The dashboard everyone shares', addr: '10.10.100.100', notes: 'Wazuh manager + indexer + dashboard (all-in-one). You log in here in a browser.' },
  { name: 'Ubuntu pod', role: 'Your team’s target', addr: '10.10.100.N', notes: 'DVWA web app + Suricata IDS + the Wazuh agent. N = your team number.' },
  { name: 'Windows 11 pod', role: 'Your team’s target', addr: '10.10.20.N', notes: 'Sysmon + the Wazuh agent for rich Windows logging.' },
  { name: 'Kali Linux', role: 'Your team’s attacker box', addr: '10.10.30.N', notes: 'You drive it yourself: the Week 2 traffic, the Week 3 scans and the Week 4 attack all start here — against your own pods only.' },
];

const PREFLIGHT = [
  'The classroom SOC is already running — open https://10.10.100.100 and sign in with student / @Pass@2026',
  'Both of your pods (Ubuntu 10.10.100.N and Windows 10.10.20.N) exist and you can sign in to them',
  'You can SSH into your Ubuntu pod as the student user',
  'Your pod numbers are recorded in the Lab access panel (Weekly Tasks); Rules of Engagement read',
];

export function CysaLabSetup({ courseId }: { courseId: string }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        This course runs on a shared <span className="font-medium">Wazuh SOC</span> with one pod per team, on a
        flat lab network (<span className="font-mono text-xs">10.10.0.0/16</span>). The build is done once — see
        Week&nbsp;0 · <span className="font-medium">Environment build</span> — so as a student you mainly need your
        account and your pod numbers.
      </p>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Machines
        </h3>
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-muted dark:border-gray-700">
                <th className="px-3 py-2">Machine</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Address</th>
                <th className="px-3 py-2">What runs on it</th>
              </tr>
            </thead>
            <tbody>
              {VMS.map((vm) => (
                <tr key={vm.name} className="border-b border-gray-100 last:border-0 dark:border-gray-700/50">
                  <td className="px-3 py-2 font-medium text-ink">{vm.name}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{vm.role}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{vm.addr}</td>
                  <td className="px-3 py-2 text-muted">{vm.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Building it (instructor / builder)
        </h3>
        <p className="mt-1 text-sm text-muted">
          The full build — Wazuh all-in-one install, DVWA + Suricata on the Ubuntu template, Sysmon on the
          Windows template, then cloning ×16 — is a guided task with copy-paste commands and the required files
          in <span className="font-medium">Week&nbsp;0 · Environment build</span> on the{' '}
          <a href={`/courses/${courseId}?tab=weeks`} className="font-medium text-blue-600 underline dark:text-blue-400">
            Weekly Tasks
          </a>{' '}
          page.
        </p>
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Network className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Before Week 1 — pre-flight
        </h3>
        <ul className="mt-2 space-y-1.5">
          {PREFLIGHT.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

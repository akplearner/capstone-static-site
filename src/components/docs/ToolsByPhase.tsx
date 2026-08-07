'use client';

import { Collapsible } from '@/components/ui/Button';

/** Spec §5 — which tools belong to which phase of the engagement. */
const PHASES: { phase: string; tools: string; note: string }[] = [
  { phase: 'Recon', tools: 'whois · dig · whatweb · theHarvester', note: 'Map the target before you touch it.' },
  { phase: 'Scan', tools: 'nmap · nikto', note: 'Find open ports, services and web issues.' },
  { phase: 'Capture', tools: 'tcpdump · Wireshark', note: 'Record traffic as evidence.' },
  { phase: 'Exploit', tools: 'sqlmap · hydra · nc', note: 'Prove the one in-scope finding — nothing destructive.' },
  { phase: 'Detect', tools: 'grep /var/log · fail2ban · Event Viewer', note: 'Blue spots the attack in the logs.' },
  { phase: 'Screenshot', tools: 'YYYYMMDD_TeamXX_Tool_Action.png', note: 'Name every capture this way.' },
  { phase: 'Integrity', tools: 'sha256sum', note: 'Hash every artifact so it is tamper-evident.' },
];

export function ToolsByPhase() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 dark:border-gray-700 dark:bg-gray-800">
      <Collapsible title="Which tool for which phase" defaultOpen={false}>
        <div className="overflow-x-auto pb-2">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-muted dark:border-gray-700">
                <th className="py-2 pr-3">Phase</th>
                <th className="py-2 pr-3">Tools</th>
                <th className="py-2 pr-3">Why</th>
              </tr>
            </thead>
            <tbody>
              {PHASES.map((p) => (
                <tr key={p.phase} className="border-b border-gray-100 dark:border-gray-700/60">
                  <td className="py-1.5 pr-3 font-medium text-ink">{p.phase}</td>
                  <td className="py-1.5 pr-3 font-mono text-xs text-body">{p.tools}</td>
                  <td className="py-1.5 pr-3 text-muted">{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Collapsible>
    </div>
  );
}

'use client';

import { ExternalLink, LayoutDashboard, Network, MonitorCheck } from 'lucide-react';

// CySA+ "how to actually use the tools" reference. The step-by-step commands
// live in each week's task; this is the one place that explains the tools as
// components — what they are, how they're configured, where their data shows up
// in the Wazuh dashboard, and the exact searches/IDs students reuse all course.
// Every panel links out to the official documentation.

type Ref = { label: string; href: string };
type Row = { k: string; v: string };
type Panel = {
  icon: typeof LayoutDashboard;
  name: string;
  where: string;
  what: string;
  config: string;
  rows: Row[];       // "the things you'll actually type / look for"
  rowsTitle: string;
  refs: Ref[];
};

const PANELS: Panel[] = [
  {
    icon: LayoutDashboard,
    name: 'Wazuh dashboard',
    where: 'http://10.10.100.100 · both pods',
    what: 'The web SIEM every role shares. Agents ship their logs here and you read, search and prove everything from the browser.',
    config:
      'No config for students — sign in with student / @Pass@2026. Left menu: Agents (which machines report, and their status), Security events (one agent’s alert feed), and the modules: Vulnerabilities, SCA, Integrity monitoring (FIM) and MITRE ATT&CK. The search bar takes field:value queries.',
    rowsTitle: 'Searches you reuse',
    rows: [
      { k: 'rule.level:>=7', v: 'Cut to alerts that usually matter (levels run 0–15; higher = more severe).' },
      { k: 'rule.level:>=10', v: 'Just the high-severity alerts — where an incident shows up.' },
      { k: 'data.srcip:<ip>', v: 'Everything one source did, across agents — the shape of the behaviour.' },
      { k: 'sort by Time', v: 'Order the events to read an attack as a sequence.' },
    ],
    refs: [
      { label: 'Using the Wazuh dashboard', href: 'https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/index.html' },
      { label: 'Alert levels explained', href: 'https://documentation.wazuh.com/current/user-manual/ruleset/rules-classification.html' },
      { label: 'Vulnerability detection', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/vulnerability-detection/index.html' },
      { label: 'Configuration assessment (SCA)', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/sec-config-assessment/index.html' },
      { label: 'File integrity monitoring (FIM)', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/file-integrity/index.html' },
      { label: 'MITRE ATT&CK module', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/mitre-attack/index.html' },
    ],
  },
  {
    icon: Network,
    name: 'Suricata',
    where: 'your Ubuntu server',
    what: 'The network IDS. It watches traffic on one network card and raises an alert when it matches a rule — this is how the SOC sees scans and web attacks.',
    config:
      'One gotcha: the capture interface in /etc/suricata/suricata.yaml must be your real NIC (ens18 on Proxmox, not eth0). suricata-update pulls the Emerging Threats ruleset (no rules = no alerts). Suricata writes alerts to /var/log/suricata/eve.json, and the Wazuh agent’s <localfile> block ships that file to the SOC.',
    rowsTitle: 'Reading its alerts',
    rows: [
      { k: '/var/log/suricata/eve.json', v: 'The live alert file — one JSON object per event; `tail -f` it to watch alerts arrive.' },
      { k: 'event_type: "alert"', v: 'The lines that matter — each has a signature name and a category.' },
      { k: 'suricata-update', v: 'Refresh the ruleset; re-run if a scan raises nothing.' },
      { k: 'in the dashboard', v: 'Suricata alerts appear in Security events like any other rule.' },
    ],
    refs: [
      { label: 'Suricata quickstart', href: 'https://docs.suricata.io/en/latest/quickstart.html' },
      { label: 'eve.json output format', href: 'https://docs.suricata.io/en/latest/output/eve/eve-json-format.html' },
      { label: 'Rules — introduction', href: 'https://docs.suricata.io/en/latest/rules/intro.html' },
    ],
  },
  {
    icon: MonitorCheck,
    name: 'Sysmon',
    where: 'your Windows 11 PC',
    what: 'Rich Windows telemetry — process starts, network connections and file changes that the built-in Windows log does not capture.',
    config:
      'Install with a config or it logs almost nothing: sysmon -accepteula -i sysmonconfig.xml (the SwiftOnSecurity config is a sane default). Sysmon writes to the Microsoft-Windows-Sysmon/Operational event channel, and the Wazuh agent’s <localfile> eventchannel block forwards it to the SOC.',
    rowsTitle: 'Event IDs you’ll see',
    rows: [
      { k: 'Event ID 1', v: 'Process created — what ran, with its full command line.' },
      { k: 'Event ID 3', v: 'Network connection — a process reached out to an address.' },
      { k: 'Event ID 11', v: 'File created — e.g. a dropped or uploaded file.' },
      { k: 'find it in Wazuh', v: 'data.win.system.channel: "Microsoft-Windows-Sysmon/Operational"' },
    ],
    refs: [
      { label: 'Sysmon (Sysinternals)', href: 'https://learn.microsoft.com/sysinternals/downloads/sysmon' },
      { label: 'SwiftOnSecurity sysmonconfig.xml', href: 'https://github.com/SwiftOnSecurity/sysmon-config' },
    ],
  },
];

export function CysaToolGuide() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        The three tools behind the whole course, as components: what each one is, how it&apos;s configured, where
        its data lands in the dashboard, and the exact searches or event IDs you&apos;ll reuse. The step-by-step
        install commands live in each week&apos;s task — this is the reference you come back to.
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {PANELS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.name} className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" /> {p.name}
                </h3>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">{p.where}</span>
              </div>

              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{p.what}</p>

              <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Config
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{p.config}</p>

              <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {p.rowsTitle}
              </div>
              <ul className="mt-1 space-y-1.5">
                {p.rows.map((r) => (
                  <li key={r.k} className="text-sm">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {r.k}
                    </code>
                    <span className="mt-0.5 block text-gray-600 dark:text-gray-400">{r.v}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Documentation
              </div>
              <ul className="mt-1 space-y-1">
                {p.refs.map((ref) => (
                  <li key={ref.href}>
                    <a
                      href={ref.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
                    >
                      {ref.label} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

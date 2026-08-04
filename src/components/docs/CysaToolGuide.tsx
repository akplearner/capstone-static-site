'use client';

import { ExternalLink, LayoutDashboard, Network, MonitorCheck } from 'lucide-react';

// CySA+ "how to actually use the tools" reference. The step-by-step commands
// live in each week's task; this is the one place that explains the tools as
// components — what they are, how they're configured, where their data shows up
// in the Wazuh dashboard, and the exact searches/IDs students reuse all course.
// Every panel links out to the official documentation.

type Ref = { label: string; href: string };
type Row = { k: string; v: string };
type Signature = { behaviour: string; query: string; tell: string };
type HowTo = { action: string; how: string; ref?: Ref };

// Week-2 "how to filter / what to look for" — behaviour → search query → the tell.
const SIGNATURES: Signature[] = [
  { behaviour: 'Port scan', query: 'rule.groups:(ids or suricata) and data.event_type:alert', tell: 'One data.src_ip hitting many data.dest_port in seconds (Suricata uses underscore fields).' },
  { behaviour: 'SSH brute force', query: 'rule.groups:authentication_failed', tell: 'Repeated failed logins from one IP, then maybe a success.' },
  { behaviour: 'Web attack (SQLi/XSS)', query: 'data.alert.signature:SQL*', tell: 'Suricata signature name flags the injection (no leading *). rule.groups:web if Apache logs are ingested.' },
  { behaviour: 'One machine only', query: 'agent.name:Team<#>-ubuntu', tell: 'Separate Ubuntu vs Windows when both are noisy.' },
  { behaviour: 'Windows process activity', query: 'data.win.system.channel:"Microsoft-Windows-Sysmon/Operational"', tell: 'Sysmon process (ID 1), network (3) and file (11) events.' },
];

const FILTER_FIELDS = 'rule.level · rule.groups · rule.description · data.src_ip · data.dest_port · data.alert.signature · data.url · agent.name';

// "Driving the dashboard" — action → how (click-path) → doc. Used across Weeks 2–4.
const DASHBOARD_HOWTO: HowTo[] = [
  { action: 'Open the alerts', how: 'Left menu → Security events → Events sub-tab (raw rows) or Dashboard sub-tab (charts + counts).', ref: { label: 'Wazuh dashboard', href: 'https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/index.html' } },
  { action: 'Set the time range', how: 'Time picker, top-right → e.g. Last 24 hours, or Absolute for an exact attack window. #1 reason a query looks empty.' },
  { action: 'Search (DQL)', how: 'Search bar → field:value, e.g. data.src_ip:10.10.100.66; combine with and / or. Enter to apply.', ref: { label: 'Query language (DQL)', href: 'https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/queries.html' } },
  { action: 'Add columns', how: 'In Events, hover a field in the left field list → click the + (Add). Now it is a column you can sort.' },
  { action: 'Save a search', how: 'Top bar → Save → name it (e.g. "Team07 attacker") → reopen from Open.' },
  { action: 'Visualize a field', how: 'Expand a field in the list → Visualize → pick a chart (bar/pie). Save it to reuse.', ref: { label: 'Create a visualization', href: 'https://opensearch.org/docs/latest/dashboards/visualize/viz-index/' } },
  { action: 'Build a dashboard', how: 'Left menu → Dashboards → Create → Add → drop in your saved visualizations → Save.', ref: { label: 'Build a dashboard', href: 'https://opensearch.org/docs/latest/dashboards/dashboard/index/' } },
  { action: 'Vulnerabilities', how: 'Agents → your agent → Vulnerabilities → filter Severity = Critical/High → Export or screenshot.', ref: { label: 'Vulnerability detection', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/vulnerability-detection/index.html' } },
  { action: 'SCA (hardening)', how: 'Agents → your agent → SCA → filter Result = Failed → open a check for its Remediation text.', ref: { label: 'Configuration assessment', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/sec-config-assessment/index.html' } },
  { action: 'File changes (FIM)', how: 'Agents → your agent → Integrity monitoring → Events → read syscheck.path / added·modified. Fallback search: rule.groups:syscheck.', ref: { label: 'File integrity monitoring', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/file-integrity/index.html' } },
];
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
    where: 'https://10.10.100.100 · both pods',
    what: 'The web SIEM every role shares. Agents ship their logs here and you read, search and prove everything from the browser.',
    config:
      'No config for students — sign in with student / @Pass@2026. Each machine runs a Wazuh agent that forwards its logs to 10.10.100.100 over port 1514 (Linux: /var/log; Windows: the Application/Security/System event channels), plus the Suricata and Sysmon blocks you add. Confirm a machine is actually connected with the "Connected to the server" line in its ossec.log. Left menu: Agents (which machines report + status), Security events (one agent’s feed), and the modules Vulnerabilities, SCA, Integrity monitoring (FIM) and MITRE ATT&CK. The search bar takes field:value queries.',
    rowsTitle: 'Searches you reuse',
    rows: [
      { k: 'rule.level:>=7', v: 'Cut to alerts that usually matter (levels run 0–15; higher = more severe).' },
      { k: 'rule.level:>=10', v: 'Just the high-severity alerts — where an incident shows up.' },
      { k: 'data.srcip:<ip> or data.src_ip:<ip>', v: 'Everything one source did. Auth logs use data.srcip; Suricata uses data.src_ip — search both.' },
      { k: 'agent.name:<Team07-ubuntu>', v: 'Limit to one machine when both agents are noisy.' },
      { k: 'sort by Time', v: 'Order the events to read an attack as a sequence.' },
      { k: 'Connected to the server', v: 'The ossec.log line that proves an agent is talking to the SOC.' },
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

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filtering &amp; what to look for (Week 2)</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          In Security events, type a <code className="rounded bg-gray-100 px-1 font-mono text-xs dark:bg-gray-900">field:value</code>{' '}
          query in the search bar. Start with <code className="rounded bg-gray-100 px-1 font-mono text-xs dark:bg-gray-900">rule.level:&gt;=7</code>{' '}
          to cut the noise, then match the shape of the attack:
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="px-3 py-2">Looks like…</th>
                <th className="px-3 py-2">Search</th>
                <th className="px-3 py-2">The tell</th>
              </tr>
            </thead>
            <tbody>
              {SIGNATURES.map((s) => (
                <tr key={s.behaviour} className="border-b border-gray-100 last:border-0 dark:border-gray-700/50">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{s.behaviour}</td>
                  <td className="px-3 py-2">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {s.query}
                    </code>
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{s.tell}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold">Fields you filter on:</span>{' '}
          <code className="rounded bg-gray-100 px-1 font-mono text-[11px] text-gray-700 dark:bg-gray-900 dark:text-gray-300">{FILTER_FIELDS}</code>
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Driving the dashboard — search, read, build</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          The clicks behind the tasks: find alerts, filter and read them, then turn a useful search into a saved
          visualization and your own dashboard. Used across Weeks 2–4.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="px-3 py-2">To…</th>
                <th className="px-3 py-2">Do this</th>
                <th className="px-3 py-2">Docs</th>
              </tr>
            </thead>
            <tbody>
              {DASHBOARD_HOWTO.map((h) => (
                <tr key={h.action} className="border-b border-gray-100 last:border-0 dark:border-gray-700/50">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{h.action}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{h.how}</td>
                  <td className="px-3 py-2">
                    {h.ref && (
                      <a
                        href={h.ref.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
                      >
                        {h.ref.label} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { DiagramFrame } from './DiagramFrame';
import { SOC_IP, SOC_URL } from '@/lib/labTopology';

/**
 * An annotated, code-drawn walkthrough of a tool's UI — a simplified mock of the
 * screen with numbered callout markers, so a beginner can see *where* to click
 * before doing it. No external image: the mock is drawn with theme tokens so it
 * adapts to light/dark, and it doubles as a clear placeholder until (optionally)
 * a real screenshot is dropped in via `Step.images`.
 *
 * Fed by `Step.walkthrough`: `screen` picks a layout preset; `markers` are the
 * numbered captions. A preset draws badge anchors for numbers 1..k; a badge only
 * renders if its number is present in `markers`, so authors control how many show.
 * Markers fade in with the house `delay: i*0.05` stagger (reduce-motion honoured
 * globally via <MotionConfig reducedMotion="user">).
 */

export type WalkthroughScreen =
  | 'agents'
  | 'security-events'
  | 'deploy-agent'
  | 'vuln-sca'
  | 'mitre'
  | 'ossec-conf'
  | 'wireshark'
  | 'generic';

interface WalkthroughData {
  screen: WalkthroughScreen;
  title?: string;
  markers: { n: number; label: string }[];
}

/** A numbered callout badge, overlaid on a mock UI element. */
function Marker({ n, present }: { n: number; present: Set<number> }) {
  if (!present.has(n)) return null;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(n * 0.06, 0.5), duration: 0.2 }}
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow"
      style={{ background: 'var(--color-danger)' }}
      aria-hidden
    >
      {n}
    </motion.span>
  );
}

/** Shared app chrome: coloured title bar + a left nav rail. */
function Chrome({ children, nav }: { children: React.ReactNode; nav?: string[] }) {
  return (
    <div className="min-w-[320px] overflow-hidden rounded-lg border border-line bg-panel">
      <div className="flex items-center gap-1.5 border-b border-line bg-panel-2 px-2.5 py-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-danger)' }} aria-hidden />
        <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-warn)' }} aria-hidden />
        <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-accent)' }} aria-hidden />
        <span className="ml-2 truncate font-mono text-[10px] text-muted">{SOC_URL} — Wazuh</span>
      </div>
      <div className="flex">
        {nav && (
          <div className="w-24 shrink-0 border-r border-line bg-panel-2 p-1.5">
            {nav.map((item) => (
              <div
                key={item}
                className="truncate rounded px-1.5 py-1 text-[10px] font-medium text-muted"
              >
                {item}
              </div>
            ))}
          </div>
        )}
        <div className="min-w-0 flex-1 p-2.5">{children}</div>
      </div>
    </div>
  );
}

/** A fake table row. */
function Row({ cells, tint }: { cells: React.ReactNode[]; tint?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-line py-1 text-[10px] last:border-0">
      {cells.map((c, i) => (
        <span
          key={i}
          className={`truncate ${i === 0 ? 'w-28 shrink-0 font-medium' : 'flex-1'}`}
          style={tint && i === 0 ? { color: tint } : undefined}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

const OK = 'var(--color-accent)';
const BAD = 'var(--color-danger)';

function ScreenBody({ screen, present }: { screen: WalkthroughScreen; present: Set<number> }) {
  switch (screen) {
    case 'agents':
      return (
        <Chrome nav={['Modules', 'Agents ▸', 'Management', 'Settings']}>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Marker n={1} present={present} />
            <span className="text-[11px] font-semibold text-ink">Agents / Endpoints</span>
          </div>
          <div className="rounded border border-line">
            <Row cells={[<b key="h">Name</b>, <b key="s">Status</b>, <b key="k">Last keep alive</b>]} />
            <Row
              cells={[
                'Team07-ubuntu',
                <span key="a" className="inline-flex items-center gap-1" style={{ color: OK }}>
                  <Marker n={2} present={present} /> Active
                </span>,
                '12s ago',
              ]}
            />
            <Row
              cells={[
                'Team07-win',
                <span key="a" className="inline-flex items-center gap-1" style={{ color: BAD }}>
                  <Marker n={3} present={present} /> Disconnected
                </span>,
                'never',
              ]}
            />
          </div>
        </Chrome>
      );

    case 'security-events':
      return (
        <Chrome nav={['Security events ▸', 'Integrity', 'Vulnerabilities', 'SCA']}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Marker n={1} present={present} />
              <span className="rounded bg-panel-2 px-1.5 py-0.5 text-[10px] font-semibold text-ink">Events</span>
              <span className="px-1.5 py-0.5 text-[10px] text-muted">Dashboard</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">
              <Marker n={3} present={present} /> Last 24 hours ▾
            </span>
          </div>
          <div className="mb-1.5 flex items-center gap-1.5 rounded border border-line px-1.5 py-1">
            <Marker n={2} present={present} />
            <span className="font-mono text-[10px] text-muted">rule.level:&gt;=7</span>
          </div>
          <div className="rounded border border-line">
            <Row cells={[<b key="t">Time</b>, <b key="a">Agent</b>, <b key="r">rule.description</b>]} />
            <Row cells={['10:02:11', 'Team07-ubuntu', 'sshd: authentication success']} />
            <Row cells={['10:02:44', 'Team07-win', 'Sysmon: process create']} />
          </div>
        </Chrome>
      );

    case 'deploy-agent':
      return (
        <Chrome nav={['Agents', 'Deploy ▸']}>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Marker n={1} present={present} />
            <span className="text-[11px] font-semibold text-ink">Deploy new agent</span>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="rounded border border-line p-1.5">
              <div className="text-muted">1. Package</div>
              <div className="mt-0.5 flex gap-1">
                <span className="rounded bg-panel-2 px-1.5 py-0.5">Linux</span>
                <span className="rounded bg-panel-2 px-1.5 py-0.5">Windows</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded border border-line p-1.5">
              <Marker n={2} present={present} />
              <span className="text-muted">Server address</span>
              <span className="font-mono">{SOC_IP}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded border border-line p-1.5" style={{ borderColor: OK }}>
              <Marker n={3} present={present} />
              <span className="text-muted">Copy the generated command →</span>
              <span className="font-mono text-[10px]">WAZUH_MANAGER=…</span>
            </div>
          </div>
        </Chrome>
      );

    case 'vuln-sca':
      return (
        <Chrome nav={['Vulnerabilities ▸', 'SCA', 'Integrity']}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Marker n={1} present={present} />
              <span className="text-[11px] font-semibold text-ink">Vulnerabilities</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">
              <Marker n={2} present={present} /> Severity: Critical/High ▾
            </span>
          </div>
          <div className="rounded border border-line">
            <Row cells={[<b key="c">CVE</b>, <b key="s">Severity</b>, <b key="p">Package</b>]} />
            <Row cells={['CVE-2024-1234', <span key="s" style={{ color: BAD }}>Critical</span>, 'openssl 1.1.1']} tint={BAD} />
            <Row cells={['CVE-2023-9999', <span key="s" style={{ color: 'var(--color-warn)' }}>High</span>, 'sudo 1.9.9']} />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 rounded border border-line p-1.5 text-[10px]" style={{ borderColor: OK }}>
            <Marker n={3} present={present} />
            <span className="text-muted">Click a row → read the Remediation drawer</span>
          </div>
        </Chrome>
      );

    case 'mitre':
      return (
        <Chrome nav={['MITRE ATT&CK ▸', 'Security events']}>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Marker n={1} present={present} />
            <span className="text-[11px] font-semibold text-ink">MITRE ATT&amp;CK</span>
          </div>
          <div className="rounded border border-line">
            <Row cells={[<b key="t">Technique</b>, <b key="i">ID</b>, <b key="c">Count</b>]} />
            <Row cells={[<span key="a" className="inline-flex items-center gap-1"><Marker n={2} present={present} />Brute Force</span>, 'T1110', '14']} />
            <Row cells={['Exploit Public App', 'T1190', '3']} />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 rounded border border-line p-1.5 text-[10px]">
            <Marker n={3} present={present} />
            <span className="text-muted">Click a technique → the alerts tagged to it</span>
          </div>
        </Chrome>
      );

    case 'ossec-conf':
      return (
        <div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-line">
              <div className="flex items-center gap-1.5 border-b border-line bg-panel-2 px-2 py-1 text-[10px] font-semibold text-muted">
                <Marker n={1} present={present} /> BEFORE — ossec.conf
              </div>
              <pre className="whitespace-pre-wrap p-2 font-mono text-[10px] leading-snug text-muted">{`<ossec_config>
  <client>
    <server>…</server>
  </client>

</ossec_config>`}</pre>
            </div>
            <div className="overflow-hidden rounded-lg border" style={{ borderColor: OK }}>
              <div className="flex items-center gap-1.5 border-b border-line bg-panel-2 px-2 py-1 text-[10px] font-semibold text-muted">
                <Marker n={2} present={present} /> AFTER — block pasted inside
              </div>
              <pre className="whitespace-pre-wrap p-2 font-mono text-[10px] leading-snug text-ink">{`<ossec_config>
  <client>
    <server>…</server>
  </client>

  `}<span style={{ color: OK }}>{`<localfile>
    <log_format>json</log_format>
    <location>/var/log/…</location>
  </localfile>`}</span>{`

</ossec_config>`}</pre>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 rounded border border-line p-1.5 text-[10px] text-muted">
            <Marker n={3} present={present} />
            <span>Save, then restart the agent so it re-reads the file.</span>
          </div>
        </div>
      );

    case 'wireshark':
      return (
        <div className="min-w-[320px] overflow-hidden rounded-lg border border-line bg-panel">
          <div className="flex items-center gap-1.5 border-b border-line bg-panel-2 px-2.5 py-1.5">
            <span className="font-mono text-[10px] text-muted">Wireshark — week2.pcap</span>
          </div>
          <div className="p-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 rounded border border-line px-1.5 py-1">
              <Marker n={1} present={present} />
              <span className="font-mono text-[10px] text-muted">http  (display filter)</span>
            </div>
            <div className="rounded border border-line">
              <Row cells={[<b key="n">No.</b>, <b key="s">Source</b>, <b key="i">Info</b>]} />
              <Row cells={['42', '10.10.30.9', <span key="a" className="inline-flex items-center gap-1"><Marker n={2} present={present} />GET /dvwa/…?id=1&apos; UNION SELECT</span>]} />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 rounded border border-line p-1.5 text-[10px]" style={{ borderColor: OK }}>
              <Marker n={3} present={present} />
              <span className="text-muted">Right-click → Follow → HTTP Stream</span>
            </div>
          </div>
        </div>
      );

    default: // 'generic'
      return (
        <Chrome nav={['Modules', 'Agents', 'Management']}>
          <div className="space-y-1">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex items-center gap-1.5 rounded border border-line px-1.5 py-1 text-[10px] text-muted">
                <Marker n={n} present={present} />
                <span className="h-1.5 flex-1 rounded bg-panel-2" />
              </div>
            ))}
          </div>
        </Chrome>
      );
  }
}

export function WazuhWalkthrough({ data }: { data: WalkthroughData }) {
  if (!data?.markers?.length) return null;
  const present = new Set(data.markers.map((m) => m.n));
  return (
    <DiagramFrame
      title={data.title ?? 'Where to click'}
      howToRead="A simplified drawing of the screen. The red numbers point at what to click, in order — match them to the list below."
    >
      <div className="space-y-2.5">
        <ScreenBody screen={data.screen} present={present} />
        <ol className="space-y-1">
          {[...data.markers]
            .sort((a, b) => a.n - b.n)
            .map((m) => (
              <li key={m.n} className="flex items-start gap-2 text-xs text-body">
                <span
                  className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: 'var(--color-danger)' }}
                  aria-hidden
                >
                  {m.n}
                </span>
                {m.label}
              </li>
            ))}
        </ol>
      </div>
    </DiagramFrame>
  );
}

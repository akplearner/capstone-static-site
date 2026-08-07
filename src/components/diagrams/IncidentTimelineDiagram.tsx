'use client';

import { motion } from 'framer-motion';
import { DiagramFrame } from './DiagramFrame';

/**
 * What an incident timeline looks like, on an actual time axis.
 *
 * Week 4's graded deliverable is a time-ordered table, and MTTD/MTTR are two
 * timestamp subtractions the course explained in a 77-word paragraph — but no
 * time axis is drawn anywhere. This shows the worked example as a line, with the
 * two measured intervals called out, so a student can see what they are building
 * before they build it.
 *
 * Times are the same worked example the Incident Response Report seeds, so the
 * diagram and the form agree.
 */

type Event = { t: string; min: number; label: string; source: string; kind: 'attack' | 'detect' | 'respond' };

const EVENTS: Event[] = [
  { t: '14:20', min: 0, label: 'Port scan begins', source: 'Suricata', kind: 'attack' },
  { t: '14:22', min: 2, label: 'SQL injection against DVWA', source: 'Apache access.log', kind: 'attack' },
  { t: '14:29', min: 9, label: 'First alert raised', source: 'Wazuh Security events', kind: 'detect' },
  { t: '14:31', min: 11, label: 'Web shell uploaded', source: 'Integrity monitoring', kind: 'attack' },
  { t: '14:41', min: 21, label: 'Attacker blocked at the firewall', source: 'ufw', kind: 'respond' },
];

const TONE: Record<Event['kind'], string> = {
  attack: 'var(--color-w4)',
  detect: 'var(--color-accent)',
  respond: 'var(--color-w3)',
};

const SPAN = 24; // minutes on the axis

export function IncidentTimelineDiagram() {
  const pct = (m: number) => (m / SPAN) * 100;
  const detect = EVENTS.find((e) => e.kind === 'detect')!;
  const respond = EVENTS.find((e) => e.kind === 'respond')!;

  return (
    <DiagramFrame
      title="An incident on a time axis"
      subtitle="The worked example from the Incident Response Report — and where MTTD and MTTR come from"
      howToRead="Every row is one line of your timeline table: a time, what happened, and the source that proves it. MTTD is the gap from the attack starting to the first alert; MTTR is from that alert to containment. Both are subtractions you can read straight off this line."
      legend={[
        { label: 'Attacker action', color: 'var(--color-w4)' },
        { label: 'Detection', color: 'var(--color-accent)' },
        { label: 'Response', color: 'var(--color-w3)' },
      ]}
    >
      <div className="min-w-[560px] pb-1">
        {/* The measured intervals, above the axis. */}
        <div className="relative mb-1.5 h-9">
          <div
            className="absolute top-0 flex h-4 items-center justify-center rounded border border-dashed text-[10px] font-semibold"
            style={{ left: 0, width: `${pct(detect.min)}%`, borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          >
            MTTD {detect.min} min
          </div>
          <div
            className="absolute top-5 flex h-4 items-center justify-center rounded border border-dashed text-[10px] font-semibold"
            style={{
              left: `${pct(detect.min)}%`,
              width: `${pct(respond.min - detect.min)}%`,
              borderColor: 'var(--color-w3)',
              color: 'var(--color-w3)',
            }}
          >
            MTTR {respond.min - detect.min} min
          </div>
        </div>

        {/* The axis with a marker per event. */}
        <div className="relative h-6">
          <div className="absolute top-2.5 h-0.5 w-full rounded bg-line" />
          {EVENTS.map((e, i) => (
            <motion.span
              key={e.t}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, duration: 0.25 }}
              className="absolute top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2"
              style={{ left: `${pct(e.min)}%`, background: TONE[e.kind], borderColor: 'var(--color-panel)' }}
              aria-hidden
            />
          ))}
        </div>

        {/* The rows — this is literally the table they must fill. */}
        <ol className="mt-2 space-y-1">
          {EVENTS.map((e, i) => (
            <motion.li
              key={e.t}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="grid grid-cols-[54px_14px_1fr_auto] items-center gap-2 rounded-md border border-line bg-panel px-2 py-1.5"
            >
              <span className="font-mono text-[11px] text-ink">{e.t}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: TONE[e.kind] }} aria-hidden />
              <span className="text-sm text-ink">{e.label}</span>
              <span className="font-mono text-[11px] text-muted">{e.source}</span>
            </motion.li>
          ))}
        </ol>
      </div>
      <ul className="sr-only">
        {EVENTS.map((e) => (
          <li key={e.t}>
            {e.t}, {e.min} minutes in: {e.label}, evidenced by {e.source}.
          </li>
        ))}
        <li>
          MTTD is {detect.min} minutes (attack start to first alert). MTTR is {respond.min - detect.min} minutes
          (first alert to containment).
        </li>
      </ul>
    </DiagramFrame>
  );
}

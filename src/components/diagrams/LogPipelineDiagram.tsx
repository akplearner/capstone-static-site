'use client';

import { motion } from 'framer-motion';
import { DiagramFrame } from './DiagramFrame';
import { SOC_IP } from '@/lib/labTopology';
import { DUR } from '@/lib/motion';

/**
 * How a log actually reaches the dashboard — the mental model behind almost
 * every "why is there no data?" question in the course.
 *
 * The content teaches this pipeline in pieces across Weeks 0-2 (a sensor writes
 * a file, the agent ships it on 1514/1515, a rule fires, a row appears) but
 * never draws it, so a student with an empty table has no way to reason about
 * WHERE it broke. Each stage names the one thing that proves it is working, so
 * the diagram doubles as a fault-isolation checklist.
 */

const STAGES: { n: number; label: string; sub: string; proof: string }[] = [
  { n: 1, label: 'Your machine', sub: 'Ubuntu or Windows', proof: 'the activity happened at all' },
  { n: 2, label: 'Sensor', sub: 'Suricata · Sysmon · system logs', proof: 'eve.json is growing' },
  { n: 3, label: 'Wazuh agent', sub: 'reads the files it is told to', proof: 'systemctl status = active' },
  { n: 4, label: 'Ports 1514 / 1515', sub: 'data · enrolment', proof: '"Connected to the server"' },
  { n: 5, label: 'Wazuh manager', sub: SOC_IP, proof: 'agent shows Active' },
  { n: 6, label: 'Rule fires', sub: 'gives it a rule.level', proof: 'the event has a level' },
  { n: 7, label: 'Dashboard row', sub: 'Security events', proof: 'you can see it — check the time picker' },
];

export function LogPipelineDiagram() {
  return (
    <DiagramFrame
      title="How a log reaches the dashboard"
      subtitle="Seven hops. When the table is empty, one of them broke — this is the order to check them in."
      howToRead="Follow it left to right. Each box names what proves that hop is working. Start at the far right (is it just the time picker?) and walk backwards until you find the first hop that cannot prove itself — that is where the break is."
      legend={[
        { label: 'On your machine', color: 'var(--color-w1)' },
        { label: 'In transit', color: 'var(--color-accent)' },
        { label: 'On the SOC', color: 'var(--color-w3)' },
      ]}
    >
      <ol className="flex min-w-[680px] items-stretch gap-1.5">
        {STAGES.map((s, i) => {
          const tone = i <= 1 ? 'var(--color-w1)' : i <= 3 ? 'var(--color-accent)' : 'var(--color-w3)';
          return (
            <li key={s.n} className="flex items-stretch gap-1.5">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: DUR.reveal }}
                className="flex w-[104px] flex-col rounded-md border border-line bg-panel p-2"
                style={{ borderTopColor: tone, borderTopWidth: 2 }}
              >
                <span className="font-mono text-3xs text-muted">{s.n}</span>
                <span className="mt-0.5 text-xs font-semibold leading-tight text-ink">{s.label}</span>
                <span className="mt-0.5 text-2xs leading-tight text-muted">{s.sub}</span>
                <span className="mt-1.5 border-t border-line pt-1 text-2xs leading-tight text-muted">
                  <span className="font-medium text-ink">Proof: </span>
                  {s.proof}
                </span>
              </motion.div>
              {i < STAGES.length - 1 && (
                <span className="self-center font-bold text-accent" aria-hidden>
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <ul className="sr-only">
        {STAGES.map((s) => (
          <li key={s.n}>
            Stage {s.n}: {s.label} ({s.sub}). You know it works when {s.proof}.
          </li>
        ))}
      </ul>
    </DiagramFrame>
  );
}

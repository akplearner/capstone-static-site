'use client';

import { motion } from 'framer-motion';
import { DiagramFrame } from './DiagramFrame';

/**
 * The attack the course actually runs, end to end.
 *
 * Weeks 2-4 describe this chain repeatedly — recon, then SQL injection, then a
 * brute force, then the alert, the pivot, and containment — and map steps to
 * ATT&CK ids, but nothing draws it. Seeing the whole path is what lets a student
 * place the alert in front of them inside a story rather than treating it as an
 * isolated row.
 */

const HOPS: { stage: string; what: string; attck?: string; week: number; sees: string }[] = [
  { stage: 'Recon', what: 'nmap scans your pod from Kali', attck: 'T1046', week: 2, sees: 'Suricata: ET SCAN signatures' },
  { stage: 'Exploit', what: 'SQL injection against DVWA', attck: 'T1190', week: 2, sees: 'Apache access.log + web rules' },
  { stage: 'Brute force', what: 'hydra guesses the SSH password', attck: 'T1110', week: 2, sees: 'repeated authentication_failed' },
  { stage: 'Detect', what: 'the SOC raises the first alert', week: 4, sees: 'your incident start time' },
  { stage: 'Investigate', what: 'pivot on the source address', week: 4, sees: 'everything that IP touched' },
  { stage: 'Contain', what: 'block the attacker at the firewall', week: 4, sees: 'ufw DENY, rule position 1' },
];

export function AttackPathDiagram() {
  return (
    <DiagramFrame
      title="The attack, end to end"
      subtitle="The same chain you generate, detect, prove and stop across Weeks 2-4"
      howToRead="Read left to right: the first three hops are what the attacker does (you run them yourself against your own pod), the last three are what you do about it. The bottom line of each box is the evidence that hop leaves behind — that is what you search for."
      legend={[
        { label: 'Attacker action', color: 'var(--color-w4)' },
        { label: 'Your response', color: 'var(--color-accent)' },
      ]}
    >
      <ol className="flex min-w-[720px] items-stretch gap-1.5">
        {HOPS.map((h, i) => {
          const attacker = i < 3;
          const tone = attacker ? 'var(--color-w4)' : 'var(--color-accent)';
          return (
            <li key={h.stage} className="flex items-stretch gap-1.5">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                className="flex w-[118px] flex-col rounded-md border border-line bg-panel p-2"
                style={{ borderTopColor: tone, borderTopWidth: 2 }}
              >
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-xs font-semibold text-ink">{h.stage}</span>
                  <span className="font-mono text-[10px] text-muted">W{h.week}</span>
                </div>
                <span className="mt-0.5 text-[11px] leading-tight text-muted">{h.what}</span>
                {h.attck && (
                  <span className="mt-1 self-start rounded border border-line px-1 font-mono text-[10px] text-muted">
                    {h.attck}
                  </span>
                )}
                <span className="mt-1.5 border-t border-line pt-1 text-[11px] leading-tight text-muted">
                  <span className="font-medium text-ink">Leaves: </span>
                  {h.sees}
                </span>
              </motion.div>
              {i < HOPS.length - 1 && (
                <span className="self-center font-bold text-accent" aria-hidden>
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <ul className="sr-only">
        {HOPS.map((h) => (
          <li key={h.stage}>
            {h.stage} (Week {h.week}): {h.what}
            {h.attck ? `, ATT&CK ${h.attck}` : ''}. Evidence left behind: {h.sees}.
          </li>
        ))}
      </ul>
    </DiagramFrame>
  );
}

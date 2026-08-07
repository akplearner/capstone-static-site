'use client';

import { motion } from 'framer-motion';
import { DiagramFrame } from './DiagramFrame';

/**
 * Likelihood × impact, as an actual grid.
 *
 * The Week-3 deliverable IS this matrix, and the course defined it in a 99-word
 * paragraph of sentences ("High = reachable from the network with no login…").
 * Drawing it makes the ranking rule legible at a glance and gives the two axes
 * the concrete lab meanings the prose buried.
 */

const LEVELS = ['Low', 'Medium', 'High'] as const;
type Level = (typeof LEVELS)[number];

// Row = impact (high at the top so the grid reads like every risk matrix);
// column = likelihood.
type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

/** A deliberate severity ramp — green → amber → orange → red. The per-week phase
 *  tokens are arbitrary hues, so using them made "Critical" render calmer than
 *  "High", which is exactly backwards for a risk grid. */
const SEVERITY: Record<Severity, string> = {
  Low: '#059669',
  Medium: '#d97706',
  High: '#ea580c',
  Critical: '#dc2626',
};

const CELL: Record<Level, Record<Level, Severity>> = {
  High: { Low: 'Medium', Medium: 'High', High: 'Critical' },
  Medium: { Low: 'Low', Medium: 'Medium', High: 'High' },
  Low: { Low: 'Low', Medium: 'Low', High: 'Medium' },
};

const LIKELIHOOD_MEANS: Record<Level, string> = {
  High: 'reachable from the network with no login',
  Medium: 'needs a local account or a user to click something',
  Low: 'needs physical access or an unlikely chain',
};
const IMPACT_MEANS: Record<Level, string> = {
  High: 'full data loss, or the attacker gets admin',
  Medium: 'one service down, or limited data exposed',
  Low: 'cosmetic, or no real data at risk',
};

export function RiskMatrix() {
  return (
    <DiagramFrame
      title="Ranking a finding: likelihood × impact"
      subtitle="Rate each axis, read the cell — that is the priority you write in the assessment"
      howToRead="Pick the likelihood column using how reachable the flaw is, then the impact row using what an attacker would get. Where they meet is the rating. Two findings with the same CVSS can land in different cells, and the cell is what decides fix order."
      legend={(['Low', 'Medium', 'High', 'Critical'] as Severity[]).map((k) => ({
        label: k,
        color: SEVERITY[k],
      }))}
    >
      <div className="min-w-[440px]">
        <div className="grid grid-cols-[92px_repeat(3,1fr)] gap-1.5">
          <div />
          {LEVELS.map((l) => (
            <div key={l} className="pb-0.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
              {l}
            </div>
          ))}
          {[...LEVELS].reverse().map((impact) => (
            <div key={impact} className="contents">
              <div className="flex items-center justify-end pr-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {impact}
              </div>
              {LEVELS.map((likelihood, i) => {
                const sev = CELL[impact][likelihood];
                return (
                  <motion.div
                    key={likelihood}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="rounded-md px-2 py-3 text-center text-xs font-semibold text-white"
                    style={{ background: SEVERITY[sev] }}
                  >
                    {sev}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-[92px_1fr] gap-x-2">
          <div />
          <div className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
            Likelihood →
          </div>
        </div>

        <dl className="mt-3 grid gap-x-6 gap-y-1 text-[12px] sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-ink">Likelihood</dt>
            {LEVELS.map((l) => (
              <dd key={l} className="text-muted">
                <span className="font-medium text-ink">{l}:</span> {LIKELIHOOD_MEANS[l]}
              </dd>
            ))}
          </div>
          <div>
            <dt className="font-semibold text-ink">Impact</dt>
            {LEVELS.map((l) => (
              <dd key={l} className="text-muted">
                <span className="font-medium text-ink">{l}:</span> {IMPACT_MEANS[l]}
              </dd>
            ))}
          </div>
        </dl>
      </div>
      <ul className="sr-only">
        {[...LEVELS].reverse().map((impact) =>
          LEVELS.map((likelihood) => (
            <li key={`${impact}-${likelihood}`}>
              Impact {impact} with likelihood {likelihood} rates {CELL[impact][likelihood]}.
            </li>
          ))
        )}
      </ul>
    </DiagramFrame>
  );
}

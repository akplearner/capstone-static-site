/**
 * A sentence that has code, emphasis or both inside it.
 *
 * Moving instructional prose out of the components (R75-B) hit one real
 * obstacle: a bullet like "VirtualBox `Host-Only` or `Internal`, VMware
 * `Host-Only`" is not a string. Flattening it would have quietly dropped the
 * formatting that tells a student which words to type; leaving it in the
 * component would have kept the content unexportable. So a sentence is a list of
 * runs — plain text, `code`, `em` or `strong` — which is data, and this renders
 * it.
 */
import { Fragment } from 'react';
import type { Run } from '@/lib/docs/securityContent';

export function Runs({ runs, codeClass = 'font-mono text-xs' }: { runs: readonly Run[]; codeClass?: string }) {
  return (
    <>
      {runs.map((r, i) => {
        // A keyed Fragment, not a span: a plain run must add no element, so a
        // sentence assembled from runs renders exactly the markup the hand-written
        // sentence did.
        if (typeof r === 'string') return <Fragment key={i}>{r}</Fragment>;
        if ('code' in r) return <span key={i} className={codeClass}>{r.code}</span>;
        if ('medium' in r) return <span key={i} className="font-medium">{r.medium}</span>;
        if ('em' in r) return <em key={i}>{r.em}</em>;
        return <strong key={i}>{r.strong}</strong>;
      })}
    </>
  );
}

/** Fill `{token}` placeholders in every run, whatever kind it is. */
export function fillRuns(runs: readonly Run[], values: Record<string, string | number>): Run[] {
  const fill = (t: string) => t.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
  return runs.map((r) => {
    if (typeof r === 'string') return fill(r);
    if ('code' in r) return { code: fill(r.code) };
    if ('medium' in r) return { medium: fill(r.medium) };
    if ('em' in r) return { em: fill(r.em) };
    return { strong: fill(r.strong) };
  });
}

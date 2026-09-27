/**
 * The kit's ONE colour table. Every swatch is a theme token or the course
 * tint's custom properties — never a literal colour, so the same preset drawn
 * inside two courses takes each course's seam. `page-shape.test.ts` enforces
 * the no-literal rule over the whole kit.
 */
export const KIT_TONE: Record<string, string> = {
  router: 'var(--color-w3)',
  'l3-switch': 'var(--color-w2)',
  'l2-switch': 'var(--color-w1)',
  ap: 'var(--color-w4)',
  wlc: 'var(--color-w4)',
  firewall: 'var(--color-w8)',
  server: 'var(--acc, var(--color-accent))',
  workstation: 'var(--color-muted)',
  cloud: 'var(--color-muted)',
  sensor: 'var(--acc, var(--color-accent))',
  browser: 'var(--color-w6)',
  people: 'var(--color-w6)',
  // Rack slot kinds.
  panel: 'var(--color-w2)',
  switch: 'var(--color-w1)',
  pdu: 'var(--color-w8)',
};

export function kitTone(kind?: string): string {
  return (kind && KIT_TONE[kind]) || 'var(--color-muted)';
}

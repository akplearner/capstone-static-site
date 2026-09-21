import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Surface, surfaceVariants } from './Surface';

describe('Surface — the one card', () => {
  it('draws a clay card by default, at tier 1, with medium padding', () => {
    render(<Surface data-testid="s">hello</Surface>);
    const el = screen.getByTestId('s');
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('rounded-[var(--radius-card)]');
    expect(el.className).toContain('bg-panel');
    expect(el.className).toContain('shadow-[var(--clay-1)]');
    expect(el.className).toContain('p-5');
  });

  /**
   * THE LAW (R77): depth is one token, and the edge lives inside it.
   *
   * This replaces "a line OR elevation, never both". It is the stricter rule,
   * not the looser one: a clay tier carries its own rims as inset layers, so a
   * border beside one is still a doubled edge — and now two tiers on one element
   * are banned as well, which is how a smudge happens.
   */
  it('names exactly one depth tier, and never draws its own edge', () => {
    for (const variant of ['card', 'raised', 'inset', 'dense', 'flat', 'glass'] as const) {
      const s = surfaceVariants({ variant });
      expect((s.match(/shadow-\[/g) ?? []).length, variant).toBeLessThanOrEqual(1);
      if (/shadow-\[var\(--clay-/.test(s)) expect(s, variant).not.toMatch(/\bborder(-line)?\b/);
    }
    expect(surfaceVariants({ variant: 'card' })).toContain('shadow-[var(--clay-1)]');
    expect(surfaceVariants({ variant: 'raised' })).toContain('shadow-[var(--clay-2)]');
    expect(surfaceVariants({ variant: 'inset' })).toContain('shadow-[var(--clay-well)]');
    expect(surfaceVariants({ variant: 'dense' })).toContain('shadow-[var(--clay-0)]');
    expect(surfaceVariants({ variant: 'flat' })).not.toMatch(/border|shadow/);
    expect(surfaceVariants({ variant: 'glass' })).toContain('glass');
  });

  it('the dense tier is the answer to a screen of data, not an exemption from it', () => {
    // Rims, no cast: it still reads as clay, it just does not float. A 16px cast
    // under every row of a twelve-row table is grey haze.
    const dense = surfaceVariants({ variant: 'dense' });
    expect(dense).toContain('rounded-[var(--radius-clay-sm)]');
    expect(dense).toContain('shadow-[var(--clay-0)]');
  });

  it('a glow replaces the tier rather than stacking on it', () => {
    for (const variant of ['card', 'raised', 'inset', 'dense'] as const) {
      const s = surfaceVariants({ variant, glow: 'accent' });
      expect((s.match(/shadow-\[/g) ?? []).length, `${variant} + glow`).toBe(1);
      expect(s, `${variant} + glow`).toContain('shadow-[var(--glow-accent)]');
    }
  });

  it('expresses status as one left seam', () => {
    expect(surfaceVariants({ accent: 'week' })).toContain('border-l-4 border-l-[var(--week,var(--color-accent))]');
    render(<Surface data-testid="r" accent="role" seamColor="#0f766e" />);
    const el = screen.getByTestId('r');
    expect(el.className).toContain('border-l-[var(--accent-seam,var(--color-accent))]');
    expect(el.style.getPropertyValue('--accent-seam')).toBe('#0f766e');
  });

  it('glows from the tokens, not the raw shadow scale — in every semantic colour', () => {
    for (const glow of ['accent', 'week', 'ok', 'warn', 'danger', 'info'] as const) {
      expect(surfaceVariants({ glow })).toContain(`shadow-[var(--glow-${glow})]`);
      expect(surfaceVariants({ glow })).not.toMatch(/shadow-(sm|md|lg|xl)/);
    }
  });

  it('renders as the element it is asked to be, and tints on hover when interactive', () => {
    render(
      <Surface as="section" interactive aria-label="box" className="extra">
        x
      </Surface>
    );
    const el = screen.getByLabelText('box');
    expect(el.tagName).toBe('SECTION');
    expect(el.className).toContain('hover:shadow-[var(--clay-2)]');
    expect(el.className).toContain('focus-within:shadow-[var(--glow-accent)]');
    expect(el.className).toContain('extra');
    // …and nothing lifts: motion belongs to a wrapper.
    expect(el.className).not.toMatch(/translate|scale/);
  });
});

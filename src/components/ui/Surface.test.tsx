import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Surface, surfaceVariants } from './Surface';

describe('Surface — the one card', () => {
  it('draws a hairline card by default, with medium padding and no shadow', () => {
    render(<Surface data-testid="s">hello</Surface>);
    const el = screen.getByTestId('s');
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('rounded-[var(--radius-card)]');
    expect(el.className).toContain('border-line');
    expect(el.className).toContain('bg-panel');
    expect(el.className).toContain('p-5');
    expect(el.className).not.toMatch(/shadow-/);
  });

  it('chooses a line OR elevation, never both', () => {
    expect(surfaceVariants({ variant: 'raised' })).toContain('shadow-[var(--shadow-1)]');
    expect(surfaceVariants({ variant: 'raised' })).not.toContain('border-line');
    expect(surfaceVariants({ variant: 'card' })).not.toMatch(/shadow-/);
    expect(surfaceVariants({ variant: 'flat' })).not.toMatch(/border|shadow/);
    expect(surfaceVariants({ variant: 'inset' })).toContain('bg-panel-2');
    expect(surfaceVariants({ variant: 'glass' })).toContain('glass');
  });

  it('expresses status as one left seam', () => {
    expect(surfaceVariants({ accent: 'week' })).toContain('border-l-4 border-l-[var(--week,var(--color-accent))]');
    render(<Surface data-testid="r" accent="role" seamColor="#0f766e" />);
    const el = screen.getByTestId('r');
    expect(el.className).toContain('border-l-[var(--accent-seam,var(--color-accent))]');
    expect(el.style.getPropertyValue('--accent-seam')).toBe('#0f766e');
  });

  it('glows from the tokens, not the raw shadow scale', () => {
    expect(surfaceVariants({ glow: 'week' })).toContain('shadow-[var(--glow-week)]');
    expect(surfaceVariants({ glow: 'accent' })).toContain('shadow-[var(--glow-accent)]');
    expect(surfaceVariants({ glow: 'accent' })).not.toMatch(/shadow-(sm|md|lg|xl)/);
  });

  it('renders as the element it is asked to be, and tints on hover when interactive', () => {
    render(
      <Surface as="section" interactive aria-label="box" className="extra">
        x
      </Surface>
    );
    const el = screen.getByLabelText('box');
    expect(el.tagName).toBe('SECTION');
    expect(el.className).toContain('hover:border-accent');
    expect(el.className).toContain('focus-within:border-accent');
    expect(el.className).toContain('extra');
    // …and nothing lifts: motion belongs to a wrapper.
    expect(el.className).not.toMatch(/translate|scale/);
  });
});

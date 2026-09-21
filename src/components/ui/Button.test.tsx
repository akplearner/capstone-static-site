import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label and calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('draws its disabled state and stops reacting', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>
    );
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toBeDisabled();
    expect(btn.className).toContain('disabled:opacity');
    expect(btn.className).toContain('disabled:pointer-events-none');
    await userEvent.click(btn).catch(() => {});
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps every variant on the tokens, and secondary on its own tier', () => {
    // Until R77 this asserted `border-line` on secondary. That hairline is gone,
    // and not by relaxation: a clay tier draws its own rims as inset layers, so
    // a border beside one is the doubled edge the law has always forbidden — the
    // edge just moved inside the shadow. What replaces the assertion is the
    // stronger statement: secondary is the SAME system one tier quieter.
    const { rerender } = render(<Button variant="secondary">A</Button>);
    const secondary = screen.getByRole('button').className;
    expect(secondary).toContain('shadow-[var(--clay-1)]');
    expect(secondary, 'the rim is in the tier now').not.toMatch(/(?<![\w-])border(?![\w-])/);

    rerender(<Button>A</Button>);
    expect(screen.getByRole('button').className).toContain('bg-accent');
    expect(screen.getByRole('button').className).not.toMatch(/\bgray-|bg-white|blue-600/);
  });

  it('names exactly one tier per state, and swaps rather than stacks', () => {
    for (const variant of ['default', 'secondary', 'ghost', 'destructive'] as const) {
      const { unmount } = render(<Button variant={variant}>A</Button>);
      const cls = screen.getByRole('button').className;
      for (const state of ['', 'hover:', 'active:']) {
        const n = (
          cls.match(new RegExp(`(?<![\\w:-])${state}shadow-\\[var\\(--(clay|glow)-[a-z0-9-]+\\)\\]`, 'g')) ?? []
        ).length;
        expect(n, `${variant} "${state || 'rest'}" wears ${n} tiers`).toBeLessThanOrEqual(1);
      }
      unmount();
    }
  });

  it('re-colours destructive depth by moving one parameter, not by adding tokens', () => {
    render(<Button variant="destructive">Delete</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('[--clay-tint:var(--color-danger)]');
    // …and it therefore uses the SAME tinted tiers the primary does. A separate
    // --clay-danger-1 family would be four more tokens to keep in step across
    // 24 theme blocks, and they would drift.
    expect(cls).toContain('shadow-[var(--clay-1-tint)]');
  });

  it('flattens to rims when disabled rather than vanishing', () => {
    render(<Button disabled>Save</Button>);
    const cls = screen.getByRole('button').className;
    // `shadow-none` beside a row of extruded siblings reads as a failed render.
    expect(cls).toContain('disabled:shadow-[var(--clay-0)]');
    expect(cls).not.toContain('disabled:shadow-none');
  });

  it('wears a gloss — except where there is no body to catch the light', () => {
    // A highlight on a ghost is a shine on nothing, and a disabled control that
    // still gleams is a control that still looks pressable.
    const gloss = (el: HTMLElement) => el.querySelector('svg[aria-hidden="true"]');
    const { rerender } = render(<Button>A</Button>);
    expect(gloss(screen.getByRole('button'))).toBeTruthy();
    rerender(<Button variant="ghost">A</Button>);
    expect(gloss(screen.getByRole('button'))).toBeNull();
    rerender(<Button disabled>A</Button>);
    expect(gloss(screen.getByRole('button'))).toBeNull();
  });

  it('keeps the label above the sheen and the accessible name intact', () => {
    // The bug every glassy button ships: the overlay paints over the text.
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn.className).toContain('isolate');
    const label = btn.querySelector('span.relative')!;
    expect(label.className).toContain('z-10');
    expect(label.textContent).toBe('Save');
    // The gloss must not be announced, or the button has two names.
    expect(btn.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('is a pill by default, a circle at icon size, and square-cornered on request', () => {
    const { rerender } = render(<Button>A</Button>);
    expect(screen.getByRole('button').className).toContain('rounded-[var(--radius-pill)]');
    rerender(
      <Button size="icon" aria-label="Close">
        ×
      </Button>
    );
    const icon = screen.getByRole('button', { name: 'Close' });
    expect(icon.className).toContain('h-10 w-10');
    expect(icon.className).toContain('rounded-[var(--radius-pill)]');
    expect(icon.querySelector('svg rect')!.getAttribute('rx'), 'a disc sheen, not a pill sweep').toBe('50');
    rerender(<Button shape="rect">A</Button>);
    expect(screen.getByRole('button').className).toContain('rounded-[var(--radius-clay-sm)]');
  });
});

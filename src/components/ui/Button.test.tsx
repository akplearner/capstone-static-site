import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
    // and not by relaxation: a depth tier draws its own ring in the shadow, so
    // a border beside one is the doubled edge the law has always forbidden — the
    // edge just moved inside the shadow. What replaces the assertion is the
    // stronger statement: secondary is the SAME system one tier quieter.
    const { rerender } = render(<Button variant="secondary">A</Button>);
    const secondary = screen.getByRole('button').className;
    expect(secondary).toContain('shadow-[var(--depth-1)]');
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
          cls.match(new RegExp(`(?<![\\w:-])${state}shadow-\\[var\\(--(depth|glow)-[a-z0-9-]+\\)\\]`, 'g')) ?? []
        ).length;
        expect(n, `${variant} "${state || 'rest'}" wears ${n} tiers`).toBeLessThanOrEqual(1);
      }
      unmount();
    }
  });

  it('re-colours destructive depth by moving one parameter, not by adding tokens', () => {
    render(<Button variant="destructive">Delete</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('[--depth-tint:var(--color-danger)]');
    // …and it therefore uses the SAME tinted tiers the primary does. A separate
    // --depth-danger-1 family would be four more tokens to keep in step across
    // 24 theme blocks, and they would drift.
    expect(cls).toContain('shadow-[var(--depth-1-tint)]');
  });

  it('drops to the ring when disabled rather than vanishing', () => {
    render(<Button disabled>Save</Button>);
    const cls = screen.getByRole('button').className;
    // `shadow-none` beside a row of edged siblings reads as a failed render.
    expect(cls).toContain('disabled:shadow-[var(--depth-0)]');
    expect(cls).not.toContain('disabled:shadow-none');
  });

  it('wears no decorative overlay in any variant — the label is the whole button', () => {
    // R77 drew a gloss SVG inside every non-ghost button. It is gone, and this
    // is the guard that keeps it gone: a button contains its label and nothing
    // aria-hidden.
    for (const variant of ['default', 'secondary', 'ghost', 'destructive'] as const) {
      const { unmount } = render(<Button variant={variant}>Save</Button>);
      const btn = screen.getByRole('button', { name: 'Save' });
      expect(btn.querySelector('svg'), variant).toBeNull();
      expect(btn.querySelector('[aria-hidden]'), variant).toBeNull();
      expect(btn.textContent).toBe('Save');
      unmount();
    }
  });

  it('is a crisp rectangle by default and a circle only at icon size', () => {
    const { rerender } = render(<Button>A</Button>);
    expect(screen.getByRole('button').className).toContain('rounded-[var(--radius-control)]');
    expect(screen.getByRole('button').className).not.toContain('radius-pill');
    rerender(
      <Button size="icon" aria-label="Close">
        ×
      </Button>
    );
    const icon = screen.getByRole('button', { name: 'Close' });
    expect(icon.className).toContain('h-10 w-10');
    expect(icon.className).toContain('rounded-full');
  });

  it('settles under the finger and never travels', () => {
    // Scale is the press; y-travel is the "3D" that was asked to go. The prop
    // is read off the source because framer applies it only on a real pointer.
    const src = readFileSync(resolve(process.cwd(), 'src/components/ui/Button.tsx'), 'utf8');
    expect(src).not.toMatch(/whileHover/);
    expect(src).toMatch(/whileTap=\{disabled \? undefined : \{ scale: 0\.98 \}\}/);
    expect(src).not.toMatch(/\by:\s*-?\d/);
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible } from './Collapsible';

describe('Collapsible — R100 sizes and the link variant', () => {
  it('the bar variant keeps its rule and full width; sm tightens the bar', () => {
    const { container, rerender } = render(
      <Collapsible title="Show me how">
        <p>body</p>
      </Collapsible>
    );
    expect(container.firstElementChild!.className).toContain('border-b');
    expect(screen.getByRole('button', { name: 'Show me how' }).className).toContain('py-3');
    rerender(
      <Collapsible title="Show me how" size="sm">
        <p>body</p>
      </Collapsible>
    );
    expect(screen.getByRole('button', { name: 'Show me how' }).className).toContain('py-2');
  });

  it('the link variant is an inline text link with no rule, and still opens a controlled panel', async () => {
    const { container } = render(
      <Collapsible title="Why, and if it breaks" variant="link" hint="2 notes">
        <p>because</p>
      </Collapsible>
    );
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'link');
    expect(container.firstElementChild!.className).not.toContain('border-b');
    const btn = screen.getByRole('button', { name: /Why, and if it breaks/ });
    expect(btn.className).toContain('inline-flex');
    expect(btn.className).toContain('text-accent');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('because')).toBeNull();
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('because')).toBeInTheDocument();
    expect(document.getElementById(btn.getAttribute('aria-controls')!)).toBeTruthy();
  });
});

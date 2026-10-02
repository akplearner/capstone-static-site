import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from './Chip';

describe('Chip', () => {
  it('is a pill span by default, with a tone class and the label', () => {
    render(<Chip tone="ok">Done by Ada</Chip>);
    const el = screen.getByText('Done by Ada').closest('span')!.parentElement!;
    expect(el.tagName).toBe('SPAN');
    expect(el.className).toContain('rounded-[var(--radius-pill)]');
    expect(el.className).toContain('text-ok');
    expect(el.className).not.toContain('focusable');
  });

  it('as a button it is focusable and clickable; as a link it carries its href', async () => {
    const onClick = vi.fn();
    render(
      <>
        <Chip as="button" tone="link" onClick={onClick}>
          Expand
        </Chip>
        <Chip as="a" tone="link" href="https://example.test/docs">
          Docs
        </Chip>
      </>
    );
    const btn = screen.getByRole('button', { name: 'Expand' });
    expect(btn.className).toContain('focusable');
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', 'https://example.test/docs');
  });

  it('draws its icon out of the accessible name', () => {
    render(
      <Chip icon={<svg data-testid="i" />} tone="muted">
        ~20 min
      </Chip>
    );
    expect(screen.getByTestId('i').parentElement).toHaveAttribute('aria-hidden');
    expect(screen.getByText('~20 min')).toBeInTheDocument();
  });
});

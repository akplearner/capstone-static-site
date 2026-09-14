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

  it('keeps the secondary variant on a hairline and the primary on the accent', () => {
    const { rerender } = render(<Button variant="secondary">A</Button>);
    expect(screen.getByRole('button').className).toContain('border-line');
    rerender(<Button>A</Button>);
    expect(screen.getByRole('button').className).toContain('bg-accent');
    expect(screen.getByRole('button').className).not.toMatch(/\bgray-|bg-white|blue-600/);
  });
});

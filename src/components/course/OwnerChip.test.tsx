import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OwnerChip } from './OwnerChip';

const role = { name: 'Platform Build (Infrastructure Admin)', icon: 'server', color: '#123456' };

/** R116 — whose a task is, as an icon plus words, never a padlock. */
describe('OwnerChip', () => {
  it('your task: the accent chip with the role’s icon', () => {
    const { container } = render(<OwnerChip kind="yours" role={role} />);
    expect(screen.getByText('Your task')).toBeInTheDocument();
    expect(container.querySelector('[data-owner="yours"]')).not.toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('[data-owner]')?.getAttribute('title')).toBe('This task is for: Platform Build (Infrastructure Admin) (that’s you).');
  });

  it('a shared task says Everyone, which it never said before', () => {
    const { container } = render(<OwnerChip kind="shared" />);
    expect(screen.getByText('Everyone')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('another role’s task names the role’s short name and says it is open to anyone', () => {
    const { container } = render(<OwnerChip kind="other" role={role} />);
    expect(screen.getByText('Platform Build · open to anyone')).toBeInTheDocument();
    expect(container.querySelector('[data-owner]')?.getAttribute('title')).toContain('anyone on the team can do it');
  });

  it('still says it is open when the role is unknown, and never draws a padlock', () => {
    const { container } = render(<OwnerChip kind="other" />);
    expect(screen.getByText('open to anyone')).toBeInTheDocument();
    expect(container.querySelector('.lucide-lock, .lucide-lock-open')).toBeNull();
  });
});

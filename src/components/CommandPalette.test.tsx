import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from './CommandPalette';
import type { SearchItem } from '@/lib/search';

const items: SearchItem[] = [
  { id: 'page:explore', kind: 'page', title: 'Explore certs', href: '/explore' },
  { id: 'week:1', kind: 'week', title: 'Week 1 · Bring the Server Up', href: '/courses/server-plus?tab=tasks&week=1' },
  { id: 'step:a', kind: 'step', title: 'The bridge on the host, and the ping', subtitle: 'Wire the ops network · Week 6', keywords: 'ifreload -a', href: '/courses/server-plus?tab=tasks&week=6&task=sp-w6-spine&step=sp-w6-spine-s1' },
  { id: 'step:b', kind: 'step', title: 'A second NIC on every server VM', subtitle: 'Wire the ops network · Week 6', keywords: 'netplan apply', href: '/courses/server-plus?tab=tasks&week=6&task=sp-w6-spine&step=sp-w6-spine-s2' },
];

describe('CommandPalette', () => {
  it('renders nothing while closed and a dialog when open', () => {
    const { rerender } = render(<CommandPalette open={false} onClose={() => {}} items={items} onNavigate={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<CommandPalette open onClose={() => {}} items={items} onNavigate={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('filters as you type, walks with the arrows and navigates on Enter', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} items={items} onNavigate={onNavigate} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'ops network' } });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onNavigate).toHaveBeenCalledWith('/courses/server-plus?tab=tasks&week=6&task=sp-w6-spine&step=sp-w6-spine-s2');
    expect(onClose).toHaveBeenCalled();
  });

  it('finds a step by its command text', () => {
    render(<CommandPalette open onClose={() => {}} items={items} onNavigate={() => {}} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'netplan' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option')).toHaveTextContent('A second NIC on every server VM');
  });

  it('closes on Escape and says so when nothing matches', () => {
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} items={items} onNavigate={() => {}} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzz' } });
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

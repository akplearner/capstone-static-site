import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlowDiagram, type FlowNode } from './FlowDiagram';

const NODES: FlowNode[] = [
  { id: 'a', label: 'Task 1', sublabel: 'Discover the kit', status: 'done' },
  { id: 'b', label: 'Task 2', sublabel: 'Design the shape', status: 'current', meta: '6 steps' },
  { id: 'c', label: 'Task 3', sublabel: 'Bring it up', status: 'upcoming' },
  { id: 'd', label: 'Task 4', sublabel: 'Prove reachability', status: 'locked' },
];

describe('FlowDiagram — the clickable workflow', () => {
  it('renders one real button per node, and the authored flow as the chain', () => {
    render(<FlowDiagram nodes={NODES} onSelect={() => {}} flow={['Discover', 'Design', 'Build', 'Prove']} title="This week" />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText('Discover → Design → Build → Prove')).toBeTruthy();
    expect(screen.getByText('6 steps')).toBeTruthy();
  });

  it('marks where you are, and locks what you cannot reach', () => {
    render(<FlowDiagram nodes={NODES} onSelect={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[1].getAttribute('aria-current')).toBe('step');
    expect(buttons[0].getAttribute('aria-current')).toBeNull();
    expect((buttons[3] as HTMLButtonElement).disabled).toBe(true);
    expect((buttons[2] as HTMLButtonElement).disabled).toBe(false);
  });

  it('answers a click with the node id', () => {
    const onSelect = vi.fn();
    render(<FlowDiagram nodes={NODES} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Bring it up'));
    expect(onSelect).toHaveBeenCalledWith('c');
  });

  it('walks the row with the arrow keys — one tab stop, not four', () => {
    render(<FlowDiagram nodes={NODES} onSelect={() => {}} />);
    const buttons = screen.getAllByRole('button');
    // Roving tabindex: only the current node is in the tab order.
    expect(buttons.map((b) => b.tabIndex)).toEqual([-1, 0, -1, -1]);
    buttons[1].focus();
    fireEvent.keyDown(screen.getByRole('list'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[2]);
    fireEvent.keyDown(screen.getByRole('list'), { key: 'Home' });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('takes its depth from the recipes, never a spelled token or a border', () => {
    const { container } = render(<FlowDiagram nodes={NODES} onSelect={() => {}} />);
    for (const b of container.querySelectorAll('button')) {
      expect(b.className).toMatch(/\bdepth-(edge|lift)\b/);
      expect(b.className).not.toMatch(/shadow-\[/);
      expect(b.className).not.toMatch(/(?<![\w-])border(?![\w-])/);
    }
  });

  it('never wraps — a workflow that wraps stops reading as a sequence', () => {
    render(<FlowDiagram nodes={NODES} onSelect={() => {}} />);
    const list = screen.getByRole('list');
    expect(list.className).toContain('overflow-x-auto');
    expect(list.className).not.toContain('flex-wrap');
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskStone, stoneStateFor } from './TaskStone';

describe('TaskStone — the task, as the stone it is cutting', () => {
  it('maps progress to intact · chipped · cracked · open', () => {
    expect([0, 10, 50, 99, 100].map(stoneStateFor)).toEqual([0, 1, 2, 2, 3]);
  });

  it('names the progress while unfinished, and the gem once done', () => {
    const { rerender } = render(<TaskStone percent={40} rarity={null} cut="shield" />);
    expect(screen.getByRole('img', { name: '40% of this task done' })).toBeInTheDocument();
    rerender(<TaskStone percent={100} rarity={2} cut="shield" />);
    expect(screen.getByRole('img', { name: 'Task done — Epic gem' })).toBeInTheDocument();
    expect(screen.getByTitle(/Epic/)).toBeInTheDocument();
  });

  it('two stones on one page never share a gradient id', () => {
    const { container } = render(
      <>
        <TaskStone percent={0} rarity={null} cut="hex" />
        <TaskStone percent={60} rarity={null} cut="hex" />
      </>,
    );
    const ids = [...container.querySelectorAll('linearGradient')].map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

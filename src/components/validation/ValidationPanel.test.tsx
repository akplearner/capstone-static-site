import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ValidationPanel, latestAnswers } from './ValidationPanel';
import type { ValidationActivity } from '@/lib/validation/activities';
import type { ValidationAnswer } from '@/lib/data/types';

const recall: ValidationActivity = { id: 'val:3:recall:f.g[0].c', kind: 'recall', checkpoint: 3, recordKey: 'f.g[0].c', area: 'infrastructure', form: 'f', prompt: 'What did the team record as the address for websrv?', options: ['10.0.0.2', '10.0.0.1', '10.0.0.9', '10.0.1.1'], answer: '10.0.0.1' };
const explain: ValidationActivity = { id: 'val:3:explain:f.d', kind: 'explain', checkpoint: 3, recordKey: 'f.d', area: 'decisions', form: 'f', prompt: 'Why?', answer: '', minWords: 40 };
const checkpoints = [{ kind: 'recall' as const, week: 3 }, { kind: 'apply' as const, week: 4 }];
const answer = (over: Partial<ValidationAnswer>): ValidationAnswer => ({ courseId: 'c', memberId: 'm', teamId: 't', activityId: recall.id, checkpoint: 3, kind: 'recall', recordKey: recall.recordKey, answerSha256: 'a'.repeat(64), correct: false, explanation: '', at: 1, ...over });

/** R140 — the panel is props only: it never prints the recorded value, judges nothing itself, and shows the states. */
describe('ValidationPanel', () => {
  it('before the checkpoint says when it opens; after it with nothing recorded says what to record', () => {
    const { container, rerender } = render(<ValidationPanel checkpoints={checkpoints} reached={[]} activities={[]} answers={[]} currentWeek={1} recorded={0} onAnswer={() => {}} />);
    expect(container.querySelector('[data-validation-empty]')?.textContent).toContain('Opens in week 3');
    rerender(<ValidationPanel checkpoints={checkpoints} reached={[checkpoints[0]]} activities={[]} answers={[]} currentWeek={3} recorded={0} onAnswer={() => {}} />);
    expect(container.querySelector('[data-validation-empty]')?.textContent).toContain('record your team’s values');
  });

  it('a recall card offers the options without marking the answer, hands the choice up, and shows the retry or the stamp', () => {
    const onAnswer = vi.fn();
    const { container, rerender } = render(<ValidationPanel checkpoints={checkpoints} reached={[checkpoints[0]]} activities={[recall, explain]} answers={[]} currentWeek={3} recorded={4} onAnswer={onAnswer} />);
    const card = container.querySelector('[data-validation-activity]')!;
    expect(card.querySelectorAll('input[type=radio]')).toHaveLength(4);
    expect(card.textContent).not.toMatch(/recorded value|expected|answer:/i);
    fireEvent.click(card.querySelector('input[value="10.0.0.9"]')!);
    fireEvent.click(card.querySelector('button[type=submit]')!);
    expect(onAnswer).toHaveBeenCalledWith(recall, '10.0.0.9');
    rerender(<ValidationPanel checkpoints={checkpoints} reached={[checkpoints[0]]} activities={[recall, explain]} answers={[answer({ correct: false })]} currentWeek={3} recorded={4} onAnswer={onAnswer} />);
    expect(container.querySelector('[data-retry]')).not.toBeNull();
    rerender(<ValidationPanel checkpoints={checkpoints} reached={[checkpoints[0]]} activities={[recall, explain]} answers={[answer({ correct: false }), answer({ correct: true, at: 2 })]} currentWeek={3} recorded={4} onAnswer={onAnswer} />);
    expect(container.querySelector('[data-validation-activity][data-done="true"] [data-stamp]')?.textContent).toContain('Correct on attempt 2');
    expect(container.querySelector('[data-validation-progress]')?.textContent).toBe('1/2');
  });

  it('an explanation needs forty words and is saved for the instructor', () => {
    const onAnswer = vi.fn();
    const { container } = render(<ValidationPanel checkpoints={checkpoints} reached={[checkpoints[0]]} activities={[explain]} answers={[]} currentWeek={3} recorded={1} onAnswer={onAnswer} />);
    const area = container.querySelector('textarea')!;
    fireEvent.change(area, { target: { value: 'too short' } });
    expect(container.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(true);
    fireEvent.change(area, { target: { value: Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ') } });
    expect(container.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(false);
    fireEvent.click(container.querySelector('button[type=submit]')!);
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(latestAnswers([answer({ at: 1 }), answer({ at: 2, correct: true })]).get(recall.id)).toMatchObject({ attempts: 2, latest: { correct: true } });
  });
});

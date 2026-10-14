import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DtoChip } from './DtoChip';
import { downloadText } from '@/lib/download';
import { SKILLS_COPY } from '@/lib/docs/skillsCopy';

/** R109 — the chip names the document, builds it only at the click, and never prints it. */
vi.mock('@/lib/download', () => ({ downloadText: vi.fn() }));

const writeText = vi.fn().mockResolvedValue(undefined);
beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  vi.mocked(downloadText).mockClear();
  writeText.mockClear();
});

describe('DtoChip', () => {
  const json = vi.fn(() => '{"schema":"x"}');
  const mount = (onCredential?: () => void) =>
    render(<DtoChip schema="capstone-kpi-board/1" version="1.1.0" json={json} filename="security-plus-kpi-board.json" caption={SKILLS_COPY.board.schemaNote} copy={SKILLS_COPY.board} onCredential={onCredential} />);

  it('prints the schema and the version, never the JSON, and builds it only at the click', async () => {
    json.mockClear();
    const { container } = mount();
    expect(container.querySelector('[data-dto-chip]')?.getAttribute('data-dto-chip')).toBe('capstone-kpi-board/1');
    expect(container.querySelector('[data-dto-schema]')?.textContent).toBe('capstone-kpi-board/1 · v1.1.0');
    expect(container.querySelector('pre')).toBeNull();
    expect(json).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: SKILLS_COPY.board.download }));
    expect(downloadText).toHaveBeenCalledWith('security-plus-kpi-board.json', '{"schema":"x"}', 'application/json');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: SKILLS_COPY.board.copyJson }));
    });
    expect(writeText).toHaveBeenCalledWith('{"schema":"x"}');
    expect(screen.queryByRole('button', { name: SKILLS_COPY.board.exportCredential })).toBeNull();
  });

  it('offers the credential only when a page hands in the export', () => {
    const onCredential = vi.fn();
    mount(onCredential);
    fireEvent.click(screen.getByRole('button', { name: SKILLS_COPY.board.exportCredential }));
    expect(onCredential).toHaveBeenCalledTimes(1);
  });
});

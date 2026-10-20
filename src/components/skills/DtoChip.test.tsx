import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DtoChip } from './DtoChip';
import { SKILLS_COPY } from '@/lib/docs/skillsCopy';

/**
 * R109 — the chip names the document, builds it only at the click, and never prints it.
 * R127 — the file it offers is a PDF, built by the page; the JSON is for the clipboard only.
 */
const writeText = vi.fn().mockResolvedValue(undefined);
beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  writeText.mockClear();
});

describe('DtoChip', () => {
  const json = vi.fn(() => '{"schema":"x"}');
  const onPdf = vi.fn();
  const mount = (onShare?: () => void) => render(<DtoChip schema="capstone-kpi-board/1" version="1.1.0" json={json} onPdf={onPdf} caption={SKILLS_COPY.board.schemaNote} copy={SKILLS_COPY.board} onShare={onShare} />);

  it('prints the schema and the version, never the JSON, and builds it only at the click', async () => {
    json.mockClear();
    const { container } = mount();
    expect(container.querySelector('[data-dto-chip]')?.getAttribute('data-dto-chip')).toBe('capstone-kpi-board/1');
    expect(container.querySelector('[data-dto-schema]')?.textContent).toBe('capstone-kpi-board/1 · v1.1.0');
    expect(container.querySelector('pre')).toBeNull();
    expect(json).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: SKILLS_COPY.board.copyJson }));
    });
    expect(json).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('{"schema":"x"}');
  });

  it('offers a PDF, not a JSON file, and nothing else to download', () => {
    onPdf.mockClear();
    json.mockClear();
    const { container } = mount();
    expect(SKILLS_COPY.board.download).toBe('Download PDF');
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(onPdf).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /JSON$/ })).toBe(screen.getByRole('button', { name: SKILLS_COPY.board.copyJson }));
    expect(container.querySelector('[data-export-credential]')).toBeNull();
    expect(container.querySelector('[data-dto-download]')).toBeNull();
    expect(container.querySelector('[data-dto-pdf]')).not.toBeNull();
    // the JSON was not built to make the PDF
    expect(json).not.toHaveBeenCalled();
  });

  it('offers a link only when a page hands in the way to make one', () => {
    const { container, rerender } = mount();
    expect(container.querySelector('[data-share-link]')).toBeNull();
    const onShare = vi.fn();
    rerender(<DtoChip schema="capstone-kpi-board/1" version="1.1.0" json={json} onPdf={onPdf} caption="c" copy={SKILLS_COPY.board} onShare={onShare} />);
    fireEvent.click(screen.getByRole('button', { name: SKILLS_COPY.board.createLink }));
    expect(onShare).toHaveBeenCalledTimes(1);
  });
});

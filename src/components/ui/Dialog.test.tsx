import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog, Dialog } from './Dialog';

/**
 * R123 — a field inside a dialog takes every character typed.
 *
 * The dialog's focus effect used to depend on `onClose`. Every caller passes an inline arrow, a
 * new function on each render, and a parent that holds the field's text re-renders on each
 * keystroke: the effect re-ran, handed focus back to the trigger and then moved it to the first
 * control (the close button). A field took one character, and the next space closed the dialog.
 * These tests type for real (user-event, a key at a time), which `fireEvent.change` never did.
 */

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [label, setLabel] = useState('');
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {/* Inline, as every caller writes it: a new function on every render, so on every keystroke. */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          onClose?.();
        }}
        title="A form"
      >
        <textarea aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        <input aria-label="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
      </Dialog>
    </>
  );
}

async function openHarness(user: ReturnType<typeof userEvent.setup>, onClose?: () => void) {
  render(<Harness onClose={onClose} />);
  await user.click(screen.getByRole('button', { name: 'Open' }));
  return screen.findByLabelText('Note');
}

describe('Dialog — typing (R123)', () => {
  it('takes every character typed into a field, spaces included, while its parent re-renders on each key', async () => {
    const user = userEvent.setup();
    const note = await openHarness(user);
    const said = 'The command in step 3 returns an error, and the flag is rejected.';
    await user.type(note, said);
    expect(note).toHaveValue(said);
    expect(note, 'focus never left the field').toHaveFocus();
    expect(screen.getByRole('dialog'), 'a space is a space, not a click on the close button').toBeInTheDocument();
  });

  it('takes a second field too, and moving between them keeps what was typed', async () => {
    const user = userEvent.setup();
    const note = await openHarness(user);
    await user.type(note, 'first field');
    const label = screen.getByLabelText('Label');
    await user.type(label, 'second field');
    expect(note).toHaveValue('first field');
    expect(label).toHaveValue('second field');
    expect(label).toHaveFocus();
  });

  it('reopens on a draft with the caret at its end, so typing continues it', async () => {
    const user = userEvent.setup();
    const note = await openHarness(user);
    await user.type(note, 'a draft');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const again = await screen.findByLabelText('Note');
    await waitFor(() => expect(again).toHaveFocus());
    expect((again as HTMLTextAreaElement).selectionStart).toBe('a draft'.length);
    await user.keyboard(' goes on');
    expect(again).toHaveValue('a draft goes on');
  });

  it('opens with focus in the first text field, so typing starts at once', async () => {
    const user = userEvent.setup();
    const note = await openHarness(user);
    await waitFor(() => expect(note).toHaveFocus());
    await user.keyboard('typed with no click');
    expect(note).toHaveValue('typed with no click');
  });
});

describe('Dialog — focus and keys (R123)', () => {
  it('lands a confirmation on its first choice, not on the close button', async () => {
    render(<ConfirmDialog open onClose={() => {}} onConfirm={() => {}} title="Delete it?" message="Gone for good." />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
  });

  it('lands on an element marked data-autofocus before any field, and skips a read-only one', async () => {
    render(
      <Dialog open onClose={() => {}} title="Marked">
        <input aria-label="Read only" readOnly defaultValue="x" />
        <input aria-label="Plain" />
        <button type="button" data-autofocus>
          Chosen
        </button>
      </Dialog>
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Chosen' })).toHaveFocus());
  });

  it('skips a read-only field when there is no marked element', async () => {
    render(
      <Dialog open onClose={() => {}} title="Fields">
        <input aria-label="Read only" readOnly defaultValue="x" />
        <input aria-label="Plain" />
      </Dialog>
    );
    await waitFor(() => expect(screen.getByLabelText('Plain')).toHaveFocus());
  });

  it('closes on Escape through the latest onClose, not the one it was opened with', async () => {
    const user = userEvent.setup();
    const seen: number[] = [];
    function Counter() {
      const [n, setN] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setN((x) => x + 1)}>
            bump
          </button>
          <Dialog open onClose={() => seen.push(n)} title="Counter">
            <button type="button">inside</button>
          </Dialog>
        </>
      );
    }
    render(<Counter />);
    await user.click(screen.getByRole('button', { name: 'bump' }));
    await user.click(screen.getByRole('button', { name: 'bump' }));
    await user.keyboard('{Escape}');
    expect(seen).toEqual([2]);
  });

  it('hands focus back to what opened it when it closes', async () => {
    const user = userEvent.setup();
    await openHarness(user);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(opener).toHaveFocus();
  });

  it('wraps Tab and Shift+Tab at the ends of the dialog', async () => {
    const user = userEvent.setup();
    render(
      <Dialog open onClose={() => {}} title="Wrap">
        <button type="button">one</button>
        <button type="button">two</button>
      </Dialog>
    );
    const close = screen.getByRole('button', { name: 'Close dialog' });
    const two = screen.getByRole('button', { name: 'two' });
    // Let the dialog's own move of focus on open finish before the test moves it.
    await waitFor(() => expect(screen.getByRole('button', { name: 'one' })).toHaveFocus());
    two.focus();
    await user.tab();
    expect(close, 'past the last control comes the first').toHaveFocus();
    await user.tab({ shift: true });
    expect(two, 'and back from the first to the last').toHaveFocus();
  });
});

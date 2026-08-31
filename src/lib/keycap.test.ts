import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { format } from '@/components/ui/Keycap';

/**
 * `format()` is reached by every step of every course, so the risk it carries is
 * not "does it wrap a key" but "does it quietly mangle a sentence it should not
 * have touched". These cases are the ones that would.
 */
const html = (s: string) => renderToStaticMarkup(format(s) as React.ReactElement);
// MenuPath draws its separator as `›` rather than reprinting ` → `, so the
// round-trip check normalises it back before comparing.
const plain = (s: string) => html(s).replace(/<[^>]+>/g, '').replace(/\u203a/g, ' → ');

describe('format — wraps what it should', () => {
  it('wraps a function key', () => {
    expect(html('Tap F2 at the splash screen.')).toContain('<kbd class="kbd">F2</kbd>');
  });

  it('wraps a chorded key', () => {
    expect(html('Press Ctrl+R at the prompt.')).toContain('<kbd class="kbd">Ctrl+R</kbd>');
  });

  it('prefers the longest key so F12 does not become F1', () => {
    expect(html('Press F12 now.')).toContain('>F12<');
    expect(html('Press F12 now.')).not.toContain('>F1<');
  });

  it('wraps a menu path as one chip with separators', () => {
    const out = html('Open System BIOS → Processor Settings and read it.');
    expect(out).toContain('menupath');
    expect(out).toContain('System BIOS');
    expect(out).toContain('Processor Settings');
  });

  it('handles a three-segment path', () => {
    expect(html('Go to Datacenter → pve-host → local now.')).toContain('menupath');
  });
});

describe('format — leaves alone what it should', () => {
  it('does not turn a word starting with a key name into a keycap', () => {
    for (const s of ['Escalate to your instructor.', 'Enterprise licensing applies.', 'Tabulate the results.']) {
      expect(html(s), s).not.toContain('<kbd');
    }
  });

  it('does not wrap a key name glued to other word characters', () => {
    expect(html('The F2xx model differs.')).not.toContain('<kbd');
  });

  it('leaves an arrow used as punctuation alone', () => {
    expect(html('Planned → installed, once it is racked.')).not.toContain('menupath');
  });

  it('still treats an all-lowercase three-segment run as a path', () => {
    expect(html('Expand Datacenter → pve-host → local in the sidebar.')).toContain('menupath');
  });

  it('does not swallow a whole clause around an arrow', () => {
    expect(html('The planned elevation → the installed one, once racked.')).not.toContain('menupath');
  });

  it('never loses or reorders the underlying text', () => {
    const cases = [
      'Tap F2 about once a second until System Setup loads.',
      'Open System BIOS → Memory Settings and record the size.',
      'Press Ctrl+N to reach PD Mgmt, then Esc to exit.',
      'No keys or paths in this sentence at all.',
      'Planned → installed.',
      'Escalate, then press Enter.',
    ];
    for (const s of cases) expect(plain(s), s).toBe(s);
  });

  it('returns empty input untouched', () => {
    expect(format('')).toBe('');
  });
});

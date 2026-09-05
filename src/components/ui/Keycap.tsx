import { Fragment, type ReactNode } from 'react';

/**
 * Formats the two things a student reads standing at a machine — the key to
 * press, and the menu path to walk — out of text that is ALREADY written that
 * way.
 *
 * The Server+ seed alone contains 25 menu paths spelled with `→` and 22
 * keypresses (`F2` nine times, `Ctrl+R` four, `Esc` three…), every one of them
 * rendered as ordinary sentence text. Nothing needed rewriting; they just
 * needed to look like what they are. So this reads the existing convention
 * rather than introducing a new authoring field, which is why it improves every
 * course without a single content edit.
 *
 * Deliberately conservative. It matches a KNOWN key list, not a shape, because
 * "shape" matching turns ordinary words into keycaps: `Esc` is a key, but so is
 * the start of "Escalate", and a bare capital letter is almost never a key. And
 * it only treats `→` as a menu path when the arrow separates two short,
 * path-looking segments — an arrow used as punctuation ("planned → installed")
 * is left alone. `format()` is unit-tested against exactly those cases.
 */

/** The keys this course set actually tells students to press. */
const KEYS = [
  'Ctrl+Alt+Del',
  'Ctrl+Alt',
  'Ctrl+N', 'Ctrl+O', 'Ctrl+R', 'Ctrl+X', 'Ctrl+C', 'Ctrl+D', 'Ctrl+L',
  'Shift+F10',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  'Esc', 'Enter', 'Tab', 'Space', 'Delete', 'Backspace',
];
// Longest first, so `Ctrl+Alt+Del` wins over `Ctrl+Alt` and `F12` over `F1`.
const KEY_RE = new RegExp(
  `(?<![\\w+])(${[...KEYS].sort((a, b) => b.length - a.length).map((k) => k.replace(/\+/g, '\\+')).join('|')})(?![\\w+])`,
  'g'
);

/**
 * A candidate `A → B → C` run. Deliberately loose here — `isMenuPath` below does
 * the deciding, because the rule that separates a menu path from an arrow used
 * as punctuation is not expressible as a regex worth reading.
 */
// A segment is a menu LABEL, so after its first word every further word must
// start with a capital or a digit. That is what stops the match running on into
// the rest of the sentence: "Processor Settings and read it" ends at "Settings".
const SEG = String.raw`[\w][\w./-]*(?: [A-Z0-9][\w./-]*)*`;
const PATH_RE = new RegExp(`${SEG}(?: → ${SEG})+`, 'g');

/** Two or more words, each starting with a capital: "Processor Settings". */
const isTitleRun = (seg: string) => {
  const words = seg.trim().split(/\s+/);
  return words.length >= 2 && words.every((w) => /^[A-Z0-9]/.test(w));
};

/**
 * Is this run a menu path, or a sentence that happens to contain an arrow?
 *
 * "Planned → installed" is the case that matters: it is real prose from the rack
 * record and must be left alone. Two signals separate it from a real path —
 * a multi-word Title Case segment ("System BIOS", "Processor Settings"), or
 * three or more segments, which prose essentially never has. "Datacenter →
 * pve-host → local" is all-lowercase and still a path because of the second.
 */
const isMenuPath = (run: string) => {
  const segs = run.split(' → ').map((x) => x.trim());
  if (segs.length < 2 || segs.some((x) => !x)) return false;
  if (segs.some((x) => x.split(/\s+/).length > 4)) return false; // a clause, not a label
  return segs.length >= 3 || segs.some(isTitleRun);
};

export function Keycap({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

/** `System BIOS → Processor Settings` as one chip with real arrows between parts. */
export function MenuPath({ path }: { path: string }) {
  const parts = path.split(' → ');
  return (
    <span className="menupath">
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="menupath-sep" aria-hidden>
              ›
            </span>
          )}
          <span>{p.trim()}</span>
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Turn one string into nodes, wrapping keys and menu paths. Paths are matched
 * first so a key inside one is left as part of the path.
 */
export function format(text: string): ReactNode {
  if (!text) return text;
  const out: ReactNode[] = [];
  let cursor = 0;
  let k = 0;

  const pushKeys = (chunk: string) => {
    let last = 0;
    for (const m of chunk.matchAll(KEY_RE)) {
      const at = m.index ?? 0;
      if (at > last) out.push(chunk.slice(last, at));
      out.push(<Keycap key={`k${k++}`}>{m[1]}</Keycap>);
      last = at + m[1].length;
    }
    if (last < chunk.length) out.push(chunk.slice(last));
  };

  for (const m of text.matchAll(PATH_RE)) {
    if (!isMenuPath(m[0])) continue;
    const at = m.index ?? 0;
    if (at > cursor) pushKeys(text.slice(cursor, at));
    out.push(<MenuPath key={`p${k++}`} path={m[0]} />);
    cursor = at + m[0].length;
  }
  if (cursor < text.length) pushKeys(text.slice(cursor));
  return out.length ? <>{out}</> : text;
}

/** Convenience wrapper for rendering a formatted string inline. */
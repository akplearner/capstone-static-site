import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Guards the *shape* of the Guide and Deliverables pages, not their wording.
 *
 * Five previous rounds compacted these two surfaces and each time they grew back,
 * because nothing measured them. The existing "Reading length" guard
 * (`content-integrity.test.ts`) only inspects seed-data step fields, so it never
 * saw a 754-word JSX component like CysaToolGuide, and it has no notion of a page
 * budget or a fact rendered in six places.
 *
 * These assertions encode the three rules that the compaction actually depended
 * on. Reading source from disk in a test follows the precedent in
 * `src/lib/catalog/helpers.test.ts`, which asserts on globals.css the same way.
 */

const root = (p: string) => resolve(process.cwd(), p);
const read = (p: string) => readFileSync(root(p), 'utf8');

/**
 * Source with comments removed.
 *
 * The assertions below are about what a page *renders*. These files carry long
 * comments explaining which components were deliberately removed and why, and
 * those comments name the very things being asserted absent — so matching raw
 * source would fail on the explanation of the rule it is enforcing.
 */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const GUIDE = 'src/app/courses/[courseId]/guide/page.tsx';
const REFERENCE = 'src/app/courses/[courseId]/guide/reference/page.tsx';
const DOCS = 'src/app/courses/[courseId]/docs/page.tsx';

/**
 * Rough prose extraction: drop imports, comments, JSX tags and expressions, then
 * count what a reader would actually see. It undercounts data-driven text (week
 * titles, role missions) — `content-integrity.test.ts` covers that side — and it
 * is deliberately approximate, because the budget is set with headroom rather
 * than to the word.
 */
function proseWords(src: string): number {
  const stripped = src
    .replace(/^import[\s\S]*?from\s+'[^']+';$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/className="[^"]*"/g, ' ');
  return stripped.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w)).length;
}

describe('page shape — disclosure is for tools, not for reading', () => {
  // The rule that makes the compaction real. A collapsed section is not a shorter
  // page: the words are still loaded, Ctrl-F still misses them, and an anchor that
  // targets a closed panel scrolls to nothing — which is exactly what
  // /guide#command-help used to do. Long reading material goes to the Reference
  // route, where it renders open.
  it.each([
    ['Guide', GUIDE],
    ['Reference', REFERENCE],
  ])('%s renders no Collapsible', (_name, path) => {
    expect(code(path)).not.toContain('Collapsible');
  });

  it('the Guide stays a one-page orientation, not a manual', () => {
    // 105 words today. 170 leaves room for a sentence or two of genuine
    // improvement while still tripping on a section being pasted back in — the
    // failure mode this whole round exists to prevent. It was ~430 words of
    // inline copy before, on top of everything the components rendered.
    expect(proseWords(read(GUIDE))).toBeLessThan(170);
  });

  it('the Guide renders one week arc and one role-mission source', () => {
    const src = code(GUIDE);
    // WeekGoals and LifecycleFlow both print week title + phase. They used to sit
    // forty lines apart on this page; LifecycleFlow now lives on Reference.
    const arcs = ['WeekGoals', 'LifecycleFlow'].filter((c) => src.includes(c));
    expect(arcs).toEqual(['WeekGoals']);
    // The Guide prints each role's mission exactly once. It used to print it
    // twice in one two-column section — as a card list, and again inside
    // RoleInterplayDiagram's SVG nodes. Either renderer is fine; both is the bug.
    const missionSources = ['.mission', 'RoleInterplayDiagram'].filter((c) => src.includes(c));
    expect(missionSources).toHaveLength(1);
  });
});

describe('page shape — the week is the Deliverables page', () => {
  it('renders the four blocks in order, forms last', () => {
    const src = read(DOCS);
    const order = ['week-rail', 'week-head', 'week-tools', 'week-forms'];
    const positions = order.map((b) => src.indexOf(`data-block="${b}"`));
    expect(positions.every((p) => p >= 0)).toBe(true);
    // This is the assertion that stops the week selector drifting back down the
    // page. It was the tenth of thirteen blocks before this round.
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('keeps the deep-link targets every task step points at', () => {
    const src = read(DOCS);
    expect(src).toContain('id="evidence-tool"'); // ?tool=evidence
    expect(src).toContain('id={`form-${def.id}`}'); // ?form=<id>
    expect(src).toContain("searchParams.get('week')"); // ?week=N
  });
});

/**
 * The single-source-of-truth registry.
 *
 * Each fact has one owning module. Everywhere else imports it. Seed course files
 * are exempt: there the address or filename is inside a command a student reads
 * and types, not a UI label, and inlining a constant into thousands of words of
 * content would hurt more than it helps.
 *
 * When a new repeated fact turns up, add a row rather than letting the copies
 * spread — this table is the living record of what "say it once" means here.
 */
const SEED_CONTENT = [
  'src/lib/data/seed/',
  'src/lib/content-data.ts',
  'src/lib/docs/cysaDeliverables.ts',
  // The Server+ forms are worked examples a student reads and copies into their
  // own IP plan — the same kind of content as the seed, not a UI label.
  'src/lib/docs/serverPlusDeliverables.ts',
];

/**
 * Source with the student-facing procedure text removed.
 *
 * A shell command has to read the way the student will type it: `ping -c 4
 * 192.168.0.1` cannot be assembled out of constants and still be worth a copy
 * button, and the sentence explaining it has to name the same address. So rows
 * marked `commandsExempt` scan what is LEFT once the step text is gone — the
 * tables, the headings and the diagram nodes. Those are data being *displayed*,
 * and displayed data gets imported.
 *
 * Those rows read through `code()` as well, for the reason given above it: a
 * comment explaining which address moved where must be able to name the address.
 */
const STEP_TEXT =
  /\b(?:title|where|summary|cmd|gui|explain):\s*(?:`[^`]*`|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")/g;
const withoutStepText = (src: string) => src.replace(STEP_TEXT, '');

const REGISTRY: {
  literal: string;
  home: string;
  alsoAllowed?: string[];
  /** Ignore the literal inside procedure/step text; see `withoutStepText`. */
  commandsExempt?: boolean;
}[] = [
  { literal: '10.10.100.100', home: 'src/lib/labTopology.ts' },
  { literal: '@Pass@2026', home: 'src/lib/labTopology.ts' },
  {
    literal: 'YYYYMMDD_TeamXX_',
    home: 'src/lib/evidence.ts',
    // The filename validator's regex and its error message: the enforcement point
    // is allowed to state the rule it enforces.
    alsoAllowed: ['src/lib/utils.ts'],
  },
  // The Server+ topology. ServerConfigGuide.tsx was created by COPYING the seed
  // instead of reading it, and the copies disagreed inside the commit that
  // introduced them — one surface reserved 192.168.0.4 for the optional
  // monitoring host while another told teams to start their own VMs there. Five
  // hand-typed tables is four too many, so these rows say the addressing is
  // rendered from serverTopology.ts and nowhere else.
  { literal: '10.10.30.T', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '172.16.0.0/24', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '192.168.0.0/24', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '192.168.0.1', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '192.168.0.4', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: 'capstone_db', home: 'src/lib/serverTopology.ts', commandsExempt: true },
];

describe('single source of truth', () => {
  const files = collectSourceFiles('src');

  it.each(REGISTRY)('"$literal" lives only in $home', ({ literal, home, alsoAllowed = [], commandsExempt }) => {
    const allowed = [home, ...alsoAllowed, ...SEED_CONTENT];
    const offenders = files
      .filter((f) => !allowed.some((a) => f.startsWith(a)))
      .filter((f) => (commandsExempt ? withoutStepText(code(f)) : read(f)).includes(literal));
    expect(offenders, `${literal} should be imported from ${home}, not restated`).toEqual([]);
  });
});

/**
 * Design-token guard.
 *
 * The theme defines a complete token set (ink/body/muted/line/panel/accent plus
 * ok/warn/danger with -soft/-line pairs), and every raw palette class is a place
 * that ignores it — it doesn't re-theme per course, and it needs a hand-written
 * `dark:` twin that drifts. R38 swept the student-facing surfaces; these two
 * assertions are what make it the LAST sweep rather than the sixth.
 */
describe('design tokens — palette classes do not come back', () => {
  const RAW = /\bgray-[0-9]|\bbg-white\b|\bblue-600\b/;

  it('the ui/ primitives are fully tokenized', () => {
    const offenders = collectSourceFiles('src/components/ui').filter((f) => RAW.test(code(f)));
    expect(offenders, 'ui primitives must use theme tokens, never raw palette classes').toEqual([]);
  });

  it('the number of files using raw gray-* only goes down', () => {
    // 25 files — was 26 at the end of R38; RoleExtractionGuide was rewritten as
    // a tokenized table in R41. Instructor tools and a few reference-page
    // components are what remain, none student-critical. New code uses tokens;
    // fixing an old file lowers the number, and then THIS number should be
    // lowered to match.
    const offenders = collectSourceFiles('src').filter((f) => /\bgray-[0-9]/.test(code(f)));
    expect(offenders.length).toBeLessThanOrEqual(25);
  });
});

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root(dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(root(rel)).isDirectory()) out.push(...collectSourceFiles(rel));
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(rel);
  }
  return out;
}

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
// The manual — the sections that used to be the Reference route. It renders on
// the Guide now, below the orientation, so the rule follows it there.
const MANUAL = 'src/components/docs/GuideManual.tsx';
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
    ['GuideManual', MANUAL],
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
    // WeekGoals and LifecycleFlow both printed week title + phase. They used to
    // sit forty lines apart on this page. LifecycleFlow is deleted now — WeekGoals
    // carries the gate chips that were its only unique contribution — and the
    // manual (`GuideManual`) renders on this page too, so it is held to the same
    // rule: one arc, and it is WeekGoals.
    const manual = code(MANUAL);
    const arcs = ['WeekGoals', 'LifecycleFlow'].filter((c) => src.includes(c) || manual.includes(c));
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
  // The campus gateway. It had NO row until it was found wrong: the code said
  // 10.10.0.1 while the classroom gateway is 10.10.10.1, restated by hand in
  // twelve places across six files and asserted by nothing, which is precisely
  // how it drifted and stayed wrong.
  //
  // `alsoAllowed` is load-bearing here for the same reason it is on Pass@2026:
  // this row matches by plain substring, and 10.10.10.1 is already in the repo
  // twice for unrelated reasons — as a generic ping example in the shared
  // command content, and INSIDE the CySA attacker box's 10.10.10.10. Neither is
  // the Server+ campus gateway, and neither should be dragged into this SSOT.
  {
    literal: '10.10.10.1',
    home: 'src/lib/serverTopology.ts',
    alsoAllowed: ['src/lib/content-data.ts', 'src/lib/labTopology.ts'],
    commandsExempt: true,
  },
  // The Proxmox root password every team sets in Week 1.
  //
  // `alsoAllowed` is load-bearing, not defensive: the CySA SOC password is the
  // string '@Pass@2026', which CONTAINS 'Pass@2026', so this row matches
  // labTopology.ts on sight. Allowing that one file is what lets the two
  // passwords coexist; without it this row fails the moment it is added, on a
  // file that has nothing to do with Server+.
  {
    literal: 'Pass@2026',
    home: 'src/lib/serverTopology.ts',
    alsoAllowed: ['src/lib/labTopology.ts'],
    commandsExempt: true,
  },
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
    // 22 files — 26 at the end of R38, 25 after R41 rewrote RoleExtractionGuide
    // as a tokenized table, 22 after R63 tokenized Badge's violet and the
    // Deliverables page's green/amber icons. The cap said 25 until R64 noticed
    // it was three regressions loose: a ratchet that is not tightened when the
    // number falls stops being a ratchet. Instructor tools and a few
    // reference-page components are what remain, none student-critical. Fixing
    // an old file lowers the number, and then THIS number is lowered to match.
    const offenders = collectSourceFiles('src').filter((f) => /\bgray-[0-9]/.test(code(f)));
    expect(offenders.length).toBeLessThanOrEqual(22);
  });

  /**
   * Focus is not optional, and it is not a component's private business.
   *
   * Before R63 `focus-visible` appeared in exactly ZERO of the ui/ primitives
   * and the only focus style in the app was the one on inputs — so tabbing
   * through a page of buttons showed the browser default, which against a
   * themed panel is frequently invisible. The fix is a rule on the ELEMENTS in
   * globals.css rather than a class every component must remember, and this
   * asserts that rule is still there and still covers what it claims to.
   */
  it('the focus ring covers every interactive element by default', () => {
    const css = readFileSync(root('src/app/globals.css'), 'utf8');
    for (const sel of ["button:focus-visible", "a:focus-visible", "[role='tab']:focus-visible"]) {
      expect(css, `globals.css must style ${sel}`).toContain(sel);
    }
    // A ring drawn with `outline: none` and nothing else is a ring that does
    // not exist in forced-colors mode.
    expect(css).toContain('outline: 2px solid transparent');
  });

  /**
   * Disabled had never been drawn at all — `disabled:` appeared zero times in
   * the repo — so a button the code had disabled looked pressable.
   */
  it('Button draws its disabled state', () => {
    const src = code('src/components/ui/Button.tsx');
    expect(src).toMatch(/disabled:opacity/);
    expect(src).toMatch(/disabled:pointer-events-none/);
  });

  /**
   * The close-animation bug, as a rule.
   *
   * Two disclosures animated `height: auto → 0` while setting `hidden`
   * (display: none) on the same render, so the close played against an element
   * already gone from layout. Nobody had ever seen either of them close. A
   * `hidden` prop on a motion element is that bug; AnimatePresence is the fix.
   */
  it('no motion element hides itself with `hidden` while animating its height', () => {
    const offenders = collectSourceFiles('src').filter((f) => {
      const src = code(f);
      return /animate=\{\{\s*height:/.test(src) && /\bhidden=\{/.test(src);
    });
    expect(offenders, 'use AnimatePresence — `hidden` cancels the exit animation').toEqual([]);
  });

  /**
   * Every animation that never stops must be switchable off.
   *
   * `MotionConfig reducedMotion="user"` covers most of this app for free, but
   * it stills only POSITIONAL keys — x, y, scale, rotate, layout. An infinite
   * loop on `opacity`, `pathLength` or `offsetDistance` sails straight through
   * it, which is how DeliverableChain ended up running a forever-loop at full
   * speed for a student who had explicitly asked for no motion. A loop is the
   * worst case for that setting: there is no moment where it is over.
   *
   * So: a file containing `repeat: Infinity` must also read the preference.
   * Deliberately file-level rather than per-animation — matching a gate to its
   * animation needs a parser, and the coarse version is the one that cannot be
   * quietly satisfied by an unrelated import.
   */
  it('every never-ending animation reads the reduced-motion preference', () => {
    const offenders = collectSourceFiles('src').filter((f) => {
      const src = code(f);
      return /repeat:\s*Infinity/.test(src) && !/useReducedMotionSafe|useReducedMotion/.test(src);
    });
    expect(offenders, 'gate infinite loops behind useReducedMotionSafe()').toEqual([]);
  });

  /**
   * Font size is a token like any other.
   *
   * 139 sites hand-wrote `text-[10px]` or `text-[11px]` — 40% the volume of the
   * nearest real scale step — with no principle separating the two: the same
   * component used both, adjacent, in one row. R64 added `--text-3xs` and
   * `--text-2xs` and swept them, pixel-identically. This is what stops the next
   * one appearing.
   *
   * `WazuhWalkthrough` is exempt on purpose. Its sizes are not app typography:
   * they draw a simulated Wazuh/Wireshark screenshot at reduced scale, and they
   * answer to "does this read as a screenshot", not to the design system.
   * Putting them on app tokens would mean a future caption change silently
   * rescales a fake UI.
   */
  it('no new arbitrary font sizes', () => {
    const MOCK_UI = 'src/components/diagrams/WazuhWalkthrough.tsx';
    const offenders = collectSourceFiles('src')
      .filter((f) => f !== MOCK_UI)
      .filter((f) => /text-\[\d+px\]/.test(code(f)));
    expect(offenders, 'use text-2xs / text-3xs — an arbitrary size is a token nobody can change').toEqual(
      []
    );
  });

  /**
   * A transition with no timing is a transition nobody chose.
   *
   * Five sites shipped `transition={{ delay: … }}` and nothing else, which
   * falls through to framer's defaults — a spring for transforms, 300ms for
   * everything else. That is how two elements told to move together ended up
   * moving apart. Every transition object must name a duration or a spring.
   *
   * `quarry/**` is exempt: its draw-ins and ambient loops are scene-setting at
   * 0.4s-6s, deliberately off the interaction scale (see `lib/motion.ts`).
   */
  it('every transition declares its timing', () => {
    const offenders: string[] = [];
    for (const f of collectSourceFiles('src')) {
      if (f.startsWith('src/components/quarry/')) continue;
      for (const m of code(f).matchAll(/transition=\{\{([^}]*)\}\}/g)) {
        if (!/duration|type:\s*'spring'/.test(m[1])) offenders.push(`${f}: {{${m[1].trim()}}}`);
      }
    }
    expect(offenders, 'name a DUR value or a SPRING preset').toEqual([]);
  });

  /**
   * A meter animates its transform, never its width.
   *
   * A width transition re-lays-out its row on every frame, and — the part that
   * actually bites — `MotionConfig reducedMotion="user"` stills TRANSFORMS, so
   * a width animation keeps running at full speed for a student who asked for
   * none. Three bar meters were doing exactly that until R64-C.
   */
  it('no motion element animates its width', () => {
    const offenders = collectSourceFiles('src').filter((f) =>
      /animate=\{\{[^}]*\bwidth:/.test(code(f))
    );
    expect(offenders, 'scale a full-width bar from its left edge instead').toEqual([]);
  });

  /**
   * Elevation is a token too.
   *
   * Tailwind's `shadow-md/lg/xl` are fixed black at fixed opacities. They do not
   * follow the theme, so in dark mode an overlay lit by one glows grey against
   * a near-black page instead of sitting above it — which is exactly what Dialog,
   * Toast and InfoTip did until R63. The ramp (--shadow-1/2/3) has dark twins,
   * so this is the rule that keeps them on it.
   *
   * `shadow-none` and `shadow-[var(--shadow-N)]` are fine; so is a print or
   * hover variant of either. Only the fixed-size Tailwind scale is banned.
   */
  /**
   * The team's other work stays reachable from the task list.
   *
   * `sharedTrack` describes the CONTENT — one build everyone shares, with a
   * small per-focus deep-dive on top — not the audience for it. For several
   * rounds the reference panel carrying the other three focuses was gated on
   * `!course.sharedTrack`, which silently removed it from the whole of Server+:
   * `otherWeekTasks` was still computed on every week and then thrown away, so
   * nothing failed and nothing looked wrong. An instructor found it.
   *
   * The panel's own emptiness check (`otherWeekTasks.length > 0`) is the only
   * condition it should carry. This asserts nothing puts a course-shape test
   * back in front of it.
   */
  it('the other-focus panel is not gated on sharedTrack', () => {
    const src = code('src/app/courses/[courseId]/page.tsx');
    expect(src).toContain('{otherWeekTasks.length > 0 && (');
    expect(src, 'the panel is for every course that has other roles').not.toMatch(
      /sharedTrack\s*&&\s*otherWeekTasks/
    );
  });

  it('nothing reaches past the elevation ramp for a raw Tailwind shadow', () => {
    const RAW_SHADOW = /(?<![\w-])shadow-(sm|md|lg|xl|2xl)(?![\w-])/;
    const offenders = collectSourceFiles('src').filter((f) => RAW_SHADOW.test(code(f)));
    expect(offenders, 'use shadow-[var(--shadow-1|2|3)] — the raw scale does not re-theme').toEqual(
      []
    );
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

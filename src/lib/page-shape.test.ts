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
  /\b(?:title|where|summary|cmd|gui|explain|k|sample|backupOf):\s*(?:`[^`]*`|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")/g;
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
  { literal: '192.168.0.20', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '192.168.0.21', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: 'capstone_db', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  // R70: the four base-build addresses the host's rules file, the diagram and
  // the IP Plan all render. They were the most-restated Server+ literals and
  // had no row; the published-ports model made restating them a live risk.
  { literal: '172.16.0.10', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '172.16.0.1', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '192.168.0.2', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '192.168.0.3', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  // Week 6's ops network. The team rule is three octets; the Core addresses are
  // the five services every team's commands point at. Same SSOT, same reason.
  { literal: '10.20.0.0/16', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '10.20.T', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '10.20.0.10', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '10.20.0.11', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '10.20.0.12', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '10.20.0.13', home: 'src/lib/serverTopology.ts', commandsExempt: true },
  { literal: '10.20.0.14', home: 'src/lib/serverTopology.ts', commandsExempt: true },
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
  // The CCNA network. Same discipline as the Server+ rows above, applied from the
  // first commit rather than after a drift: every prefix, gateway and WAN address
  // is COMPUTED in `ccnaTopology.ts` (third octet = VLAN id), so a literal
  // anywhere else is a hand-typed copy of something the model already derives.
  { literal: '10.50.10.0/24', home: 'src/lib/ccnaTopology.ts', commandsExempt: true },
  { literal: '10.50.20.10', home: 'src/lib/ccnaTopology.ts', commandsExempt: true },
  { literal: '10.50.20.20', home: 'src/lib/ccnaTopology.ts', commandsExempt: true },
  { literal: '10.50.99.', home: 'src/lib/ccnaTopology.ts', commandsExempt: true },
  { literal: '10.60.199.', home: 'src/lib/ccnaTopology.ts', commandsExempt: true },
  { literal: '10.255.255.', home: 'src/lib/ccnaTopology.ts', commandsExempt: true },
  { literal: '198.51.100.', home: 'src/lib/ccnaTopology.ts', commandsExempt: true },
  { literal: 'northgate.local', home: 'src/lib/ccnaTopology.ts', commandsExempt: true },
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

  /**
   * Week 6's ops network is a management plane, not a client zone. `ZONE_BRIDGES`
   * filters `BRIDGES` at runtime on "everything but vmbr0", so if someone ever
   * adds vmbr9 there it renders as a third zone in the diagram, the guide table
   * and TEAM_VM_START — whatever the type says. The plane has its own export.
   */
  it('the ops bridge is not a zone', () => {
    const src = read('src/lib/serverTopology.ts');
    expect(src).toMatch(/export const OPS = \{/);
    // No BRIDGES entry may carry the ops bridge id.
    const bridgesBlock = src.slice(src.indexOf('export const BRIDGES'), src.indexOf('export function bridge('));
    expect(bridgesBlock).not.toContain('vmbr9');
  });

  /**
   * The team block on Home runs every DoD check of every form with no week
   * filter, so a team that finished the four graded weeks read as incomplete
   * the moment an advanced week added checks to the As-Built. It now skips
   * checks that belong to an advanced week; the Deliverables page keeps its
   * own per-week view.
   */
  it('the team block ignores advanced-week checks', () => {
    const src = read('src/components/team/TeamBlock.tsx');
    expect(src).toMatch(/isAdvancedWeek\(course, c\.week\)/);
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
    // 0 files — 26 at the end of R38, 25 after R41 rewrote RoleExtractionGuide
    // as a tokenized table, 22 after R63 tokenized Badge's violet and the
    // Deliverables page's green/amber icons. The cap said 25 until R64 noticed
    // it was three regressions loose: a ratchet that is not tightened when the
    // number falls stops being a ratchet. R68 swept the last 22 — the
    // instructor tools, the reference-page components, the two SVG diagrams
    // and the framework colour map — so the ratchet is now a wall: the whole
    // RAW set (gray-*, bg-white, blue-600) is banned everywhere under src.
    const offenders = collectSourceFiles('src').filter((f) => RAW.test(code(f)));
    expect(offenders.length).toBeLessThanOrEqual(0);
  });

  it('no dark: variants — tokens re-theme', () => {
    // `.dark` re-declares the same custom properties, so a `dark:` twin is
    // never needed where a token exists — and after R68 a token always exists.
    // A `dark:` variant is never followed by whitespace; the `\S` keeps the
    // TypeScript parameter `setTheme(dark: boolean)` in ThemeToggle out of it.
    const offenders = collectSourceFiles('src').filter((f) => /\bdark:\S/.test(code(f)));
    expect(offenders, 'dark: variants must not come back — use a token').toEqual([]);
  });

  it('no raw palette hue survives', () => {
    const HUE =
      /\b(bg|text|border|ring|from|to|fill|stroke|divide|placeholder)-(rose|amber|emerald|violet|green|red|yellow|blue|slate|zinc|indigo|sky|teal|orange|purple|gray)-[0-9]/;
    const offenders = collectSourceFiles('src').filter((f) => HUE.test(code(f)));
    expect(offenders, 'raw palette hues must map to ok/warn/danger/info/accent tokens').toEqual([]);
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
      .filter((f) => /text-\[\d+(?:\.\d+)?(?:px|rem)\]/.test(code(f)));
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
   * Toast and InfoTip did until R63. The ladder (--depth-0/1/2/3) has dark twins,
   * so this is the rule that keeps them on it.
   *
   * `shadow-none` and `shadow-[var(--depth-N)]` are fine; so is a print or
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
    const src = code('src/components/course/TasksTab.tsx');
    expect(src).toContain('{otherWeekTasks.length > 0 && (');
    expect(src, 'the panel is for every course that has other roles').not.toMatch(
      /sharedTrack\s*&&\s*otherWeekTasks/
    );
  });

  /**
   * A date a student reads is a date in the student's timezone.
   *
   * `new Date().toISOString().slice(0, 10)` is UTC, so for the four hours after
   * 8pm US-eastern it is tomorrow. It was dating the Evidence Log row copied to
   * the clipboard, the `date` printed on every generated deliverable, and the
   * day buckets the streak counts. `lib/localDate.ts` has the two helpers.
   *
   * UTC is still right for the wire and for machine metadata, so the ban is
   * scoped: the Supabase repos write `timestamptz` columns, and the two export
   * `generatedAt`/`exportedAt` fields are stamps for a file, not for a reader.
   */
  it('no user-facing date is built out of toISOString', () => {
    const WIRE = /^src\/lib\/data\/supabase/;
    const ALLOWED = new Set([
      // Machine metadata inside a downloaded JSON export.
      'src/app/account/page.tsx',
      'src/app/portfolio/page.tsx',
    ]);
    const offenders = collectSourceFiles('src').filter(
      (f) => !WIRE.test(f) && !ALLOWED.has(f) && /toISOString\(\)/.test(code(f))
    );
    expect(offenders, 'use localDay/localStamp from lib/localDate').toEqual([]);
  });

  /**
   * Every register control says which column it is in.
   *
   * `RegisterTable` renders two layouts and only one of them can use a `<label>`:
   * the phone card wraps each control in one, and a `<td>` cannot. The table
   * therefore has to write the name onto the control, and until R65 it wrote
   * nothing — every cell of every graded deliverable announced as "edit text,
   * blank", on the layout everyone not on a phone uses.
   *
   * `labelled` is the seam. This asserts the table branch passes `false` (so the
   * name gets written) and the card branch passes it plain (so it does not get
   * written twice).
   */
  it('the register table names its own controls', () => {
    const src = code('src/components/grc/RegisterTable.tsx');
    expect(src, 'the <td> branch must ask Cell for an aria-label').toContain('labelled={false}');
    expect(src, 'the aria-label has to name the column and the row').toContain(
      "'aria-label': `${col.label}, row ${rowIndex + 1}`"
    );
    expect(src, 'a <th> that names a column says so').toContain('scope="col"');
  });

  /**
   * Three Server+ audit findings, each held by the literal that fixed it.
   *
   * - "Exact clicks →" links land on the procedure. The config guide used to
   *   `setWeek` and scroll inside a `requestAnimationFrame`, which fires before
   *   React commits the new week, so the article was not there yet and the page
   *   sat at the top. The scroll lives in an effect keyed on the week now.
   * - The Deliverables page keeps the form you are editing on screen. Any
   *   edit pins `activeForm`; "first unfinished form" applies on arrival only.
   * - The "Course complete" banner counts graded weeks, not Week 0.
   */
  it('the config guide scrolls to a procedure after its week has rendered', () => {
    const src = code('src/components/docs/ServerConfigGuide.tsx');
    expect(src, 'the scroll must wait for the commit, not a frame').not.toContain('requestAnimationFrame');
    expect(src).toContain('pendingScroll');
    expect(src).toMatch(/useEffect\(\(\) => \{[\s\S]*?pendingScroll\.current[\s\S]*?\}, \[week\]\)/);
  });

  it('editing a deliverable pins it as the form on screen', () => {
    const src = code('src/app/courses/[courseId]/docs/page.tsx');
    expect(src).toMatch(/const setDoc = \(id: string, data: DeliverableData\) => \{\s*setActiveForm\(id\);/);
    expect(src, 'DoD is judged without the worked example').toContain('withoutSeedRows(def, saved[id]');
  });

  it('course completion is judged on graded weeks only', () => {
    const src = code('src/components/course/HomeTab.tsx');
    expect(src).not.toMatch(/course\.weeks\.every\(\(w\) => \(weekStats/);
    expect(src).toMatch(/isGradedWeek\(course, w\.number\)\)[\s\S]{0,120}allWeeksComplete/);
  });

  it('nothing reaches past the elevation ramp for a raw Tailwind shadow', () => {
    const RAW_SHADOW = /(?<![\w-])shadow-(sm|md|lg|xl|2xl)(?![\w-])/;
    const offenders = collectSourceFiles('src').filter((f) => RAW_SHADOW.test(code(f)));
    expect(offenders, 'use a depth tier (a Surface variant or depthTier()) — the raw scale does not re-theme').toEqual(
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

/**
 * R68 — the modernisation's shape, held.
 *
 * Every rule below was true on the day it was written and would drift back
 * quietly without a guard: the card recipe re-typed in a page, a fourth
 * translucency on a bar, a `dark:` twin, an eyebrow inside a card, a second
 * week selector on the status surface.
 */
describe('R68 — the shape of the modernised platform', () => {
  const files = collectSourceFiles('src');

  it('Surface is the only file that spells the card', () => {
    // R77 re-cut the card: the border is gone, because a depth tier carries
    // its own edge as a ring. The literal is asserted to still live IN Surface
    // before it is asserted absent everywhere else — a "nobody spells it" rule
    // passes just as happily when nobody spells it anywhere, including the one
    // file that is supposed to, which is exactly how this guard went quiet when
    // the law changed under it.
    const CARD = "rounded-[var(--radius-card)]', {\n  variants: {";
    expect(code('src/components/ui/Surface.tsx'), 'the card recipe has moved — repoint this guard').toContain(
      CARD
    );
    const RECIPE = 'rounded-[var(--radius-card)] bg-panel';
    const offenders = files.filter(
      (f) => f !== 'src/components/ui/Surface.tsx' && code(f).includes(RECIPE)
    );
    expect(offenders, 'render <Surface> or surfaceVariants() instead of the class string').toEqual([]);
  });

  it('glass is a recipe, not a utility', () => {
    // No hand-rolled translucency and no backdrop-blur outside globals.css:
    // the three sticky bars, the palette and the dialog all wear `.glass`.
    const offenders = files.filter((f) => /\bbackdrop-blur\b|\bbg-(panel|surface)\/\d+/.test(code(f)));
    expect(offenders).toEqual([]);
    const css = read('src/app/globals.css');
    for (const t of ['--glass-bg', '--glass-line', '--glow-accent', '--glow-week', '--mesh-hero']) {
      expect((css.match(new RegExp(`${t}:`, 'g')) ?? []).length, `${t} needs a light and a dark value`).toBeGreaterThanOrEqual(2);
    }
    expect(css).toContain('@supports not (backdrop-filter');
    // The mesh drifts only when the visitor allows motion — and only on opt-in.
    expect(css).toMatch(/prefers-reduced-motion: no-preference\)[\s\S]*?mesh-drift/);
    expect(css).toContain(".hero-wash[data-drift='true']");
  });

  it('every page has a skip-link target', () => {
    const layout = code('src/app/layout.tsx');
    expect(layout).toContain('href="#main"');
    expect(layout).toContain('id="main"');
    expect(layout).toContain('tabIndex={-1}');
    expect(read('src/app/globals.css')).toContain('.skip-link:focus');
  });

  it('eyebrows are section labels, not card furniture', () => {
    // 50 class uses before R68; 13 after. Lower the cap when it falls.
    const n = files.reduce((sum, f) => sum + (code(f).match(/className=["{][^"}]*\beyebrow(-muted)?\b/g)?.length ?? 0), 0);
    expect(n).toBeLessThanOrEqual(16);
  });

  it('the status surface is not a second week selector', () => {
    expect(code('src/components/team/EngagementStatus.tsx')).not.toContain('onGoToWeek');
    expect(code('src/components/team/EngagementStatus.tsx')).toContain('id="home-head"');
  });

  it('the brand does not ping and the links carry no desktop icons', () => {
    const nav = code('src/components/SiteNav.tsx');
    expect(nav).not.toContain('animate-ping');
    expect(nav).toContain("const icon = 'h-4 w-4 sm:hidden'");
    expect(nav).toContain("e.key.toLowerCase() === 'k'");
  });

  it('a deep link can name a task and a step', () => {
    const page = code('src/app/courses/[courseId]/page.tsx');
    expect(page).toContain("params.get('task')");
    expect(page).toContain("params.get('step')");
    expect(page).toContain("window.addEventListener('popstate', readDeepLink)");
    expect(code('src/components/task/ChecklistItem.tsx')).toContain('id={`step-${stepId}`}');
    expect(code('src/components/task/GuidedTaskRunner.tsx')).toContain('initialStepId');
  });

  it('tab and week changes move focus to the new heading', () => {
    const page = code('src/app/courses/[courseId]/page.tsx');
    expect(page).toMatch(/focusById\(t === 'tasks' \? 'tasks-head' : 'home-head'\)/);
    expect(code('src/components/course/TasksTab.tsx')).toContain('id="tasks-head"');
    expect(code(DOCS)).toContain("focusById('week-head')");
    expect(code(DOCS)).toContain('id="week-head"');
  });

  it('the course Home is four surfaces, not ten boxes', () => {
    const page = code('src/components/course/HomeTab.tsx');
    expect(page).toContain('<Surface glow="accent" padding="lg">');
    expect(page).toContain('<Surface accent="role" seamColor={ownRole.color}');
    expect(page).not.toContain('🎉');
    // The role surface holds the team; the team block is mounted once.
    expect(page.match(/<TeamBlock /g)?.length).toBe(1);
  });

  it('the review loop, notes and stuck flag are mounted where the student works', () => {
    expect(code(DOCS)).toContain('<ReviewBanner');
    expect(code('src/components/step/StepHow.tsx'), 'the note sits in the step\'s how tier (R79)').toContain('<StepNotes');
    expect(code('src/components/StepNotes.tsx')).toContain('aria-pressed');
    // A course reset clears the notes too, or the next student inherits them.
    expect(code('src/components/course/HomeTab.tsx')).toContain('stepNotesRepo.resetCourse');
  });

  it('the offline layer is a first-party worker the policy allows', () => {
    const config = read('next.config.ts');
    expect(config).toContain("`worker-src 'self'`");
    expect(config).toContain("`manifest-src 'self'`");
    expect(config).toContain('source: "/sw.js"');
    const sw = read('public/sw.js');
    expect(sw).toContain("request.method !== 'GET'");
    expect(sw).toContain("headers.get('RSC')");
    expect(sw).toContain('caches.delete');
    expect(sw).toContain("event.data.type === 'clear'");
    const layout = code('src/app/layout.tsx');
    expect(layout).toContain('<ServiceWorkerRegistrar />');
    expect(layout).toContain('<OfflineBanner />');
    expect(code('src/lib/useAuth.ts')).toContain('clearOfflineCaches()');
    // Never in development: a caching worker under the dev server serves stale chunks.
    expect(code('src/components/pwa/ServiceWorkerRegistrar.tsx')).toContain("process.env.NODE_ENV === 'production'");
  });

  it('the cohort dashboard loads the whole course, not the caller’s cache', () => {
    const loader = code('src/lib/data/cohortLoader.ts');
    // Row shapers are shared; the cache itself (keyed without a user id) is not.
    expect(loader).not.toMatch(/\bcache\b|hydrateCourse/);
    expect(loader).toContain("supabase.from('step_evidence').select('*').eq('course_id', course.id)");
    expect(loader).toContain("supabase.from('step_flags')");
    expect(code('src/app/instructor/[courseId]/cohort/page.tsx')).toContain('cohortCsv(');
  });
});

describe('R69 — Terraform or OpenTofu is the student’s choice', () => {
  it('the choice is a Lab access select, and every command site honours it', () => {
    expect(code('src/components/week/LabAccessPanel.tsx')).toContain("f.kind === 'select'");
    expect(code('src/lib/labAccess.ts')).toContain('export function useIacTool(');
    expect(code('src/components/step/CommandBlock.tsx')).toContain('commandFor(c, tool)');
    expect(code('src/components/step/StepHow.tsx')).toContain('verifyRaw?.map((v) => applyIacTool(v, tool))');
    expect(code('src/components/docs/ServerConfigGuide.tsx')).toContain('commandFor(step, tool)');
  });

  it('the content names both tools and authors the install line twice', () => {
    const seed = code('src/lib/data/seed/serverPlus.ts');
    const guide = code('src/lib/docs/serverProcedures.ts');
    expect(seed).not.toContain("tools: ['Terraform',");
    expect(guide.match(/opentofu: \{ cmd: "curl --proto '=https' --tlsv1.2 -fsSL https:\/\/get.opentofu.org/g)?.length).toBe(2);
    expect(code('src/lib/glossary.ts')).toContain('OpenTofu:');
    expect(code('src/lib/docs/serverPlusDeliverables.ts')).toContain("options: ['Terraform', 'OpenTofu',");
  });
});

describe('R70 — the DMZ site is built, uploaded, and published through one model of the host', () => {
  it('the diagram, the form and the glossary render the published ports rather than restate them', () => {
    // The picture reads the model through its content module (R75-B moved the
    // rack, the week-by-week arrival and every caption out of the component), so
    // the chain to assert is data module → model, component → data module.
    const content = code('src/lib/docs/serverDiagrams.ts');
    expect(content).toContain('PUBLISHED_PORTS');
    expect(content).toContain('CROSS_ZONE_ALLOW');
    const diagram = code('src/components/diagrams/ServerTopologyDiagram.tsx');
    expect(diagram).toContain("from '@/lib/docs/serverDiagrams'");
    expect(diagram).toContain('PUBLISHED_BY_VM');
    expect(diagram).toContain('CROSS_ZONE_LABEL');
    expect(diagram).toContain('z.bridge.gateway');
    const form = code('src/lib/docs/serverPlusDeliverables.ts');
    expect(form).toContain("group: 'published'");
    expect(form).toContain('seed: PUBLISHED_PORTS.map(');
    expect(form).toContain("field: 'site_evidence'");
    expect(code('src/lib/glossary.ts')).toContain('DNAT:');
  });

  it('no Server+ surface types iptables -A any more — the file is the ruleset', () => {
    expect(code('src/lib/data/seed/serverPlus.ts')).not.toMatch(/iptables -A |iptables -t nat -A /);
    expect(code('src/lib/docs/serverProcedures.ts')).not.toMatch(/iptables -A |iptables -t nat -A /);
    expect(code('src/lib/data/seed/serverPlus.ts').match(/hostRulesCommand\('the-(way-out|holes)'\)/g)?.length).toBe(2);
    expect(code('src/lib/docs/serverProcedures.ts').match(/hostRulesCommand\('the-(way-out|holes)'\)/g)?.length).toBe(2);
  });
});

describe('R72 — every command says where it runs, and every week shows its part of the picture', () => {
  it('the machine chip renders from the topology model, not from hand-typed names', () => {
    const chip = code('src/components/MachineChip.tsx');
    expect(chip).toContain('MACHINES');
    expect(chip).toContain('machineChipLabel');
    // One colour table for the diagram, the focus strip and the chip.
    expect(code('src/components/diagrams/topologyStyle.ts')).toContain('ZONE_COLOR');
    expect(code('src/components/diagrams/ServerTopologyDiagram.tsx')).toContain("from './topologyStyle'");
  });

  it('a command carries its machine and its sample through to the screen', () => {
    const components = code('src/components/step/CommandBlock.tsx');
    expect(components).toContain('<MachineChip on={on}');
    expect(components).toContain("'What it prints'");
    expect(components).toContain('shellPrompt(');
  });

  it('the open task and the guide draw the part being built — the closed row does not', () => {
    // R78-B put the machines strip on the open task's header; R79 took it off
    // again — the task is one screen, and every command already wears its
    // machine chip. The guide still draws the week's part of the picture.
    expect(code('src/components/task/GuidedTaskRunner.tsx')).not.toContain('<TopologyFocus');
    expect(code('src/components/course/TaskRow.tsx')).not.toContain('<TopologyFocus');
    expect(code('src/components/step/CommandBlock.tsx')).toContain('<MachineChip');
    const guide = code('src/components/docs/ServerConfigGuide.tsx');
    expect(guide).toContain('<TopologyFocus');
    expect(guide).toContain('<ServerTopologyDiagram highlight=');
    // The focus set is derived from the commands, never authored twice.
    expect(code('src/components/diagrams/TopologyFocus.tsx')).toContain('export function focusOf');
  });

  it('the full diagram can dim what has not been built and light one week', () => {
    const diagram = code('src/components/diagrams/ServerTopologyDiagram.tsx');
    expect(diagram).toContain('builtThrough');
    expect(diagram).toContain('highlight');
    expect(diagram).toContain('REMOTE_ADMIN');
  });
});

describe('R71/R78-B — a course you can follow', () => {
  it('the Tasks tab keeps the week\'s objective and objectives in front of the student', () => {
    // R71 put a build map and a "key points" view here. R78-B replaced both
    // with the objective sentence and a diagram of the tasks; R79 made the
    // diagram's nodes the week's OBJECTIVES, the tasks grouped under them,
    // and the milestone the caption — the header says one sentence.
    const tab = code('src/components/course/TasksTab.tsx');
    expect(tab.match(/<FlowDiagram\b/g)?.length, 'one workflow per week').toBe(1);
    expect(tab).toContain('summary.objectives');
    expect(tab).toContain('caption={summary.milestone');
    expect(tab).not.toContain('<BuildMap');
    expect(tab).not.toContain('<PageHeader');
    expect(tab, 'the gate is the objectives; no second checklist').not.toContain('<WeekGatePanel');
    const header = code('src/components/week/WeekHeader.tsx');
    expect(header).toContain('.objective');
    for (const gone of ['milestone', 'buildMap', 'taskCount']) expect(header, `${gone} left the header`).not.toContain(gone);
    expect(code('src/lib/types.ts')).not.toContain('buildMap');
  });

  it('one mode rule for every course, and the density switch is gone', () => {
    // R80 dropped the per-course guided flag: Show all is the default everywhere.
    const runner = code('src/components/task/GuidedTaskRunner.tsx');
    expect(runner).not.toContain('onDensityChange');
    expect(runner).not.toMatch(/courseId === 'cysa-plus'/);
    // R79: the task's workflow is the step ladder, not a second diagram.
    expect(runner, 'the ladder is the workflow').not.toContain('<FlowDiagram');
    expect(runner.match(/<ChecklistItem\b/g)?.length, 'one rung component').toBe(1);
    expect(runner).not.toContain('GuidedStepper');
    for (const f of ['src/components/step/StepDetail.tsx', 'src/components/task/ChecklistItem.tsx', 'src/lib/types.ts']) {
      expect(code(f), f).not.toMatch(/[dD]ensity/);
    }
  });

  it('nothing in the private zone is published — 2222 is gone from every Server+ surface', () => {
    for (const f of ['src/lib/data/seed/serverPlus.ts', 'src/lib/docs/serverProcedures.ts', 'src/lib/docs/serverPlusDeliverables.ts', 'src/lib/serverTopology.ts']) {
      expect(code(f), f).not.toContain('2222');
    }
    expect(code('src/lib/serverTopology.ts')).toContain('REMOTE_ADMIN');
  });
});

/**
 * R75-B — the content is not in the components.
 *
 * Sixteen components held the course's reference material: six diagram data
 * tables, the CySA+ tool manual, two lab specifications, the troubleshooting
 * rows, the manual's own section blurbs and the quick-reference card. None of it
 * reached `content/courses/*.json`, so a document described a course's forms and
 * addressing in full and could not say what the course teaches.
 *
 * Each of these is a renderer over a data module now — and since R78-D3, over
 * the course DOCUMENT that module was written into, through the accessor in
 * `content/read.ts`. The two things that would undo it are a new table typed
 * back into a component, and a sentence typed beside the markup — so this
 * looks for both.
 */
describe('R75-B — the content is not in the components', () => {
  /** component → the document section it must read from. */
  const RENDERERS: [string, string][] = [
    ['src/components/diagrams/ServerTopologyDiagram.tsx', 'serverDiagramsOf'],
    ['src/components/diagrams/AttackPathDiagram.tsx', 'cysaOf'],
    ['src/components/diagrams/IncidentTimelineDiagram.tsx', 'cysaOf'],
    ['src/components/diagrams/LogPipelineDiagram.tsx', 'cysaOf'],
    ['src/components/diagrams/TriageDecisionTree.tsx', 'cysaOf'],
    ['src/components/diagrams/RiskMatrix.tsx', 'cysaOf'],
    ['src/components/docs/CysaToolGuide.tsx', 'cysaOf'],
    ['src/components/docs/CysaLabSetup.tsx', 'cysaOf'],
    ['src/components/docs/LabSetupGuide.tsx', 'securityOf'],
    ['src/components/docs/DocsReductionTable.tsx', 'securityOf'],
    ['src/components/docs/CommandTroubleshooting.tsx', 'troubleshootingOf'],
    ['src/components/docs/QuickReferenceCard.tsx', 'manualOf'],
    ['src/components/docs/GuideManual.tsx', 'manualOf'],
  ];

  it('every emptied component reads its words from the course document', () => {
    for (const [file, accessor] of RENDERERS) {
      expect(code(file), file).toContain(`${accessor}(useCourseDocument())`);
    }
  });

  it('none of them declares a table of content rows', () => {
    // `const ROWS = [{ … }]` is the shape every one of them used to hold. A
    // colour or icon map keyed by a kind is fine and stays — it is not content.
    for (const [file] of RENDERERS) {
      const src = code(file).replace(/\/\*[\s\S]*?\*\//g, '');
      expect(src.match(/^const\s+\w+[^=\n]*=\s*\[\s*$/m)?.[0], file).toBeUndefined();
      expect(src.match(/^const\s+\w+[^=\n]*=\s*\[\{/m)?.[0], file).toBeUndefined();
    }
  });

  it('none of them types a sentence beside the markup', () => {
    // A string with sentence punctuation in it is prose. A Tailwind class list
    // is long but never has any, which is what makes this cheap to check.
    const PROSE = /[a-z]{2}[.?!](\s|$)|\s—\s/;
    for (const [file] of RENDERERS) {
      const src = code(file)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      const literals = [...src.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g)].map(
        (m) => m[1] ?? m[2]
      );
      const prose = literals.filter((l) => l.length > 40 && PROSE.test(l));
      expect(prose, `${file} holds prose: ${prose[0]}`).toEqual([]);
    }
  });

  it('the content modules hold the words, so the guard above is not vacuous', () => {
    const modules = [
      'src/lib/docs/serverDiagrams.ts',
      'src/lib/docs/cysaContent.ts',
      'src/lib/docs/securityContent.ts',
      'src/lib/docs/troubleshooting.ts',
      'src/lib/docs/manual.ts',
    ];
    for (const m of modules) {
      const src = code(m).replace(/\/\*[\s\S]*?\*\//g, '');
      const literals = [
        ...[...src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map((x) => x[1]),
        ...[...src.matchAll(/`([^`]*)`/g)].map((x) => x[1]),
      ];
      expect(literals.filter((l) => l.length > 60).length, m).toBeGreaterThan(3);
    }
  });

  it('the lab addresses come from the model in the components that name them', () => {
    // Five were typed: two pod addresses in the step flow and three in the CySA+
    // lab table. The model has held all of them the whole time.
    for (const f of ['src/components/diagrams/StepFlow.tsx', 'src/lib/docs/cysaContent.ts']) {
      expect(code(f), f).not.toMatch(/'10\.10\.\d+\.[N\d]+'/);
    }
    expect(code('src/components/diagrams/StepFlow.tsx')).toContain('socTopology(');
    expect(code('src/lib/docs/cysaContent.ts')).toContain('socTopology(');
    expect(code('src/lib/docs/securityContent.ts')).toContain('LAB_SUBNET');
  });
});

/**
 * R78 — the depth law, held.
 *
 * "Depth is one token, and the edge lives inside it." That sentence is cheap to
 * write in a docblock and free to violate in a component, which is what happened
 * to its predecessor: the old law ("a line OR elevation, never both") survived as
 * prose in `Surface.tsx` long after call sites had quietly started pairing
 * `border border-line` with a `shadow-`.
 *
 * So the law is arithmetic here. Tier 0 IS a 1px ring drawn as a box-shadow, so
 * a border beside any tier is a doubled edge, and two tiers on one element is a
 * smudge. Both are caught by reading the class strings the source contains.
 *
 * R78 also keeps the R77 look from coming back: no gloss, no travel, no pill.
 */
describe('R78 — depth', () => {
  const files = collectSourceFiles('src');
  const CSS = read('src/app/globals.css');

  /**
   * Every `className="…"` / `className={'…'}` literal chunk in a file, plus the
   * bare quoted strings in a cva/record of class strings — which is how the
   * primitives spell them. Comments are already stripped by `code()`.
   *
   * `${…}` is cut out of a template literal rather than counted with it. A
   * ternary inside one — `${sel ? 'depth-lift …' : 'depth-edge …'}` — puts every
   * branch in the same backticked string, and counting them together reads
   * three MUTUALLY EXCLUSIVE tiers as three tiers on one element. The branches
   * are single-quoted, so they are already collected on their own and each gets
   * counted as the one element it actually renders.
   */
  const stripInterpolations = (t: string): string => {
    let out = '';
    for (let i = 0; i < t.length; i++) {
      if (t[i] === '$' && t[i + 1] === '{') {
        let depth = 1;
        i += 2;
        while (i < t.length && depth > 0) {
          if (t[i] === '{') depth++;
          else if (t[i] === '}') depth--;
          i++;
        }
        i--;
      } else out += t[i];
    }
    return out;
  };

  const classStrings = (f: string): string[] => {
    const src = code(f);
    return [
      ...[...src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map((m) => m[1]),
      ...[...src.matchAll(/"([^"\n]*)"/g)].map((m) => m[1]),
      ...[...src.matchAll(/`([^`]*)`/g)].map((m) => stripInterpolations(m[1])),
    ].filter((s) => /\b(shadow|rounded|border|bg)-|\bdepth-/.test(s));
  };

  it('never draws a border beside a depth tier — the ring is already in the shadow', () => {
    const offenders: string[] = [];
    for (const f of files) {
      for (const s of classStrings(f)) {
        if (!/shadow-\[var\(--depth-/.test(s) && !/\bdepth-(edge|lift|sunk)\b/.test(s)) continue;
        // A left seam is status, not an edge: `border-l-4` is the one survivor,
        // and it is deliberately a different thing from a box outline.
        const border = s.match(/(?<![\w-])border(?!-l\b|-l-)(-[a-z0-9[\]]+)?(?![\w-])/);
        if (border) offenders.push(`${f}: ${s}`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('names at most one resting tier per class string', () => {
    const offenders: string[] = [];
    for (const f of files) {
      for (const s of classStrings(f)) {
        // Only the resting state counts: `hover:` and `active:` swap the tier,
        // they do not stack with it, which is the whole point of a swap.
        const resting =
          (s.match(/(?<![\w:-])shadow-\[var\(--(depth|glow)-[a-z0-9-]+\)\]/g) ?? []).length +
          (s.match(/(?<![\w:-])depth-(edge|lift|sunk)(?![\w-])/g) ?? []).length;
        if (resting > 1) offenders.push(`${f}: ${s}`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('spells a tier only in the primitives that own depth', () => {
    // If a page can reach for `--depth-2` directly then the ladder is decoration
    // rather than a ladder, and the next round cannot re-cut it in one place.
    //
    // The rule is the DIRECTORY, not a list of filenames: `src/components/ui/*`
    // is what "a primitive" means here, and a list would have to be edited every
    // time one is added — which is the kind of edit that gets made by deleting
    // the offending name from the array.
    const offenders = files.filter(
      (f) => !f.startsWith('src/components/ui/') && /shadow-\[var\(--depth-/.test(code(f))
    );
    expect(offenders, 'depth belongs to the ui primitives — pass a variant instead').toEqual([]);
  });

  it('declares every depth parameter in both themes', () => {
    // A parameter with no dark twin is a light-mode ring on a dark card.
    const missing: string[] = [];
    for (const t of ['--depth-rim', '--depth-cast']) {
      const n = (CSS.match(new RegExp(`${t}:`, 'g')) ?? []).length;
      if (n < 2) missing.push(`${t} is declared ${n}× — needs a light and a dark value`);
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('declares every depth recipe a component reaches for by name', () => {
    // `.depth-edge` is an ordinary class. Tailwind will not warn about it, tsc
    // cannot see it, and a misspelling renders a flat element that looks almost
    // right — which is the worst kind of wrong.
    const used = new Set<string>();
    for (const f of files) {
      for (const m of code(f).matchAll(/(?<![\w-])depth-([a-z]+)(?![\w-])/g)) used.add(`depth-${m[1]}`);
    }
    expect(used.size, 'the R77 sweep replaced 134 hairlines — this cannot be empty').toBeGreaterThan(0);
    const missing = [...used].filter((c) => !CSS.includes(`.${c} {`));
    expect(missing, `no such recipe in globals.css: ${missing.join(', ')}`).toEqual([]);
  });

  it('references no depth or radius token the stylesheet does not declare', () => {
    // `shadow-[var(--depth-4)]` is not a compile error, not a lint error and not
    // a runtime error. It is a silently missing shadow, and the only place it
    // can be caught is here.
    const declared = new Set([...CSS.matchAll(/(--[a-z0-9-]+):/gi)].map((m) => m[1]));
    const missing: string[] = [];
    for (const f of files) {
      for (const m of code(f).matchAll(/(?:shadow|rounded)-\[var\((--[a-z0-9-]+)[,)]/g)) {
        if (!declared.has(m[1])) missing.push(`${f} uses ${m[1]}, which globals.css never declares`);
      }
    }
    expect([...new Set(missing)], [...new Set(missing)].join('\n')).toEqual([]);
  });

  it('has no gloss, no travel and no top rim — the R77 look does not come back', () => {
    // The instructor's word for the extruded, glossy, y-travelling control was
    // "cheap". Three spellings of it, each caught by name.
    const offenders: string[] = [];
    for (const f of files) {
      const src = code(f);
      // `(?!ary)`: GlossaryText is not the gloss.
      if (/\bgloss(?!ary)/i.test(src)) offenders.push(`${f}: mentions gloss`);
      if (/while(Hover|Tap)=\{[^}]*\by:/.test(src)) offenders.push(`${f}: y-travel in a hover/tap`);
    }
    if (/inset 0 1(\.5)?px 0 0 (color-mix\(in oklab, )?white/.test(CSS)) offenders.push('globals.css: a white top rim');
    if (/\bgloss(?!ary)/i.test(CSS)) offenders.push('globals.css: mentions gloss');
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('keeps the button a rectangle, and tier 0 exactly one ring', () => {
    expect(code('src/components/ui/Button.tsx')).not.toContain('radius-pill');
    // Tier 0 is one 1px spread layer and nothing else, so the "no border beside
    // a tier" rule above still describes a single edge rather than two.
    expect(CSS).toMatch(/--depth-0: 0 0 0 1px var\(--depth-rim\);/);
  });
});

/**
 * R78-C1 — one hierarchy.
 *
 * The course page was 1,822 lines with four components defined inside it, and
 * `StepDetail` took 28 individual props that three call sites hand-copied —
 * and the copies had drifted. Both are the kind of shape that grows back one
 * convenient edit at a time, so both are numbers now.
 */
describe('R78-C1 — one hierarchy', () => {
  it('the course page is orchestration, not a place to define components', () => {
    const lines = read('src/app/courses/[courseId]/page.tsx').split('\n').length;
    expect(lines, 'define the component under src/components/course/ instead').toBeLessThan(400);
    expect(code('src/app/courses/[courseId]/page.tsx')).not.toMatch(/^function [A-Z]\w+\(/m);
  });

  it('a step is passed as one object, never as a field list', () => {
    // `<StepDetail instruction=…` is the spelling that let `danger` go missing
    // from one of three copies for a round.
    const offenders: string[] = [];
    for (const f of collectSourceFiles('src')) {
      if (/<(StepDetail|ChecklistItem)\b[^>]*\b(instruction|whatItMeans|expectedOutput)=/.test(code(f))) offenders.push(f);
    }
    expect(offenders, 'pass `step={s}`').toEqual([]);
    // …and the two renderers that take it are the only spellings of the body
    // (R79: the runner renders rungs, and a rung renders the body).
    expect(code('src/components/task/GuidedTaskRunner.tsx')).not.toContain('<StepDetail');
    expect(code('src/components/task/ChecklistItem.tsx').match(/<StepDetail\b/g)?.length).toBe(1);
    expect(code('src/components/course/TaskReference.tsx').match(/<StepDetail\b/g)?.length).toBe(1);
  });
});

/**
 * R78-C2 — fold the duplicates.
 *
 * Two surfaces drew "how ready is this gate" from two sources with two sets of
 * icons; the join panel was mounted twice; a component file could grow without
 * limit. The first two are one component each now, the third is a number.
 */
describe('R78-C2 — fold the duplicates', () => {
  it('gate readiness is one picture, whatever the source', () => {
    // Both derivations render the same strip: the Tasks tab from task
    // completion, the Deliverables page from the Definition-of-Done checks.
    // R79 removed the Tasks-tab gate checklist (the objectives are the gate),
    // so the Deliverables page is the strip's one consumer now.
    const strip = code('src/components/week/GateReadinessStrip.tsx');
    expect(strip).toContain('line-through');
    for (const f of [DOCS]) {
      expect(code(f), `${f} draws the strip`).toContain('<GateReadinessStrip');
      expect(code(f), `${f} does not draw its own tick list`).not.toContain('line-through');
    }
  });

  it('the join panel is mounted once on Home', () => {
    expect(code('src/components/course/HomeTab.tsx').match(/<JoinPanel\b/g)?.length).toBe(1);
  });

  it('no component file is over 600 lines', () => {
    // The pixel scenes under quarry/ are drawings, not components to navigate.
    const big: string[] = [];
    for (const f of collectSourceFiles('src/components')) {
      if (f.includes('/quarry/') || f.endsWith('.test.tsx') || f.endsWith('.test.ts')) continue;
      const n = read(f).split('\n').length;
      if (n > 600) big.push(`${f} (${n})`);
    }
    expect(big, 'split it — a file this long is two components').toEqual([]);
  });
});

/**
 * R78-D3 — components read the document.
 *
 * The content modules are what `dto.ts` WRITES into `content/courses/*.json`.
 * What renders is READ from that document through `content/read.ts`, so an
 * instructor's edit to the document is what the student sees. A component
 * importing a table from a content module is reading the writer's input
 * instead — the leak this guard closes. Types and pure functions (which take
 * their data as a parameter) may still be imported; the seeds may not.
 */
describe('R78-D3 — components read the document', () => {
  const CONTENT_MODULES =
    /from '@\/lib\/docs\/(securityContent|cysaContent|manual|serverDiagrams|ccnaDiagrams|ccnaKit|troubleshooting|serverProcedures|custodyTemplate)'/;
  const renderers = [...collectSourceFiles('src/components'), ...collectSourceFiles('src/app')];

  it('no component or page imports a table from a content module', () => {
    const offenders: string[] = [];
    for (const f of renderers) {
      const src = read(f);
      for (const m of src.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+'(@\/lib\/docs\/\w+)'/g)) {
        if (!CONTENT_MODULES.test(`from '${m[3]}'`) || m[1]) continue;
        const tables = m[2]
          .split(',')
          .map((n) => n.trim())
          .filter((n) => n && !n.startsWith('type ') && /^[A-Z][A-Z0-9_]+\b/.test(n));
        if (tables.length) offenders.push(`${f}: ${tables.join(', ')}`);
      }
    }
    expect(offenders, 'read it from the document: useCourseDocument() + an accessor in content/read.ts').toEqual([]);
  });

  it('no component or page imports a seed course or a course document file', () => {
    const offenders = renderers.filter((f) => /from '(@\/lib\/data\/seed\/|.*content\/courses\/)/.test(read(f)));
    expect(offenders, 'the catalogue comes from courseRepo; the document from useCourseDocument()').toEqual([]);
  });

  it('the renderers R75-B did not empty read the document too', () => {
    // These hold prose or a table of their own by design (the config guide's
    // addressing, the evidence rules), so they are not in R75-B's list — but
    // what they show of the content still comes from the document.
    const MORE: [string, string][] = [
      ['src/components/diagrams/CcnaTopologyDiagram.tsx', 'ccnaDiagramsOf'],
      ['src/components/docs/EvidenceGuide.tsx', 'custodyOf'],
      ['src/components/docs/ServerConfigGuide.tsx', 'proceduresOf'],
      ['src/components/step/StepHow.tsx', 'proceduresOf'],
    ];
    for (const [file, accessor] of MORE) {
      expect(code(file), file).toContain(`${accessor}(useCourseDocument())`);
    }
  });

  it('the documents are read in one place', () => {
    const readers = collectSourceFiles('src').filter((f) => /content\/courses\/\w[\w-]*\.json'/.test(read(f)));
    expect(readers).toEqual(['src/lib/content/docs.ts']);
  });
});

/**
 * R78-B — the funnel.
 *
 * One thing in focus per level, and one disclosure per level. These are the
 * counts that would drift back first: a second disclosure on the task, a
 * progress bar back on the closed row, a fourth block above the list.
 */
describe('R78-B — the funnel', () => {
  it('a closed task row is a line: number, title, status, objective', () => {
    const row = code('src/components/course/TaskRow.tsx');
    for (const gone of ['<TopologyFocus', 'estimatedTime', 'steps.total', 'scaleX']) {
      expect(row, `${gone} is the open task's business`).not.toContain(gone);
    }
    expect(row).toContain('{task.objective}');
  });

  it('one disclosure per level', () => {
    expect(code('src/components/course/TasksTab.tsx').match(/<Collapsible\b/g)?.length, 'week: More for this week, plus the reference task About').toBe(2);
    expect(code('src/components/task/GuidedTaskRunner.tsx').match(/<Collapsible\b/g)?.length, 'task: About this task').toBe(1);
    expect(code('src/components/step/StepDetail.tsx').match(/<Collapsible\b/g)?.length, 'step: Show me how, and Why').toBe(2);
    // …and the closed bar says what it holds.
    expect(code('src/components/course/TasksTab.tsx')).toContain('hint={hintParts.join');
  });

  it('nothing on the Tasks tab opens itself just because it is empty', () => {
    expect(code('src/components/week/LabAccessPanel.tsx')).not.toContain('defaultOpen={filledCount');
  });

  it('R79 — a step is one sentence until the student asks for more', () => {
    // Tier 0 is the where-chip and one line. Everything a student DOES with —
    // the actions, the command, the output, the verify box — is the second
    // tier; why and fixes the third. The command text must not be in tier 0.
    const detail = code('src/components/step/StepDetail.tsx');
    for (const gone of ['<CommandBlock', 'NumberedSteps', 'expectedOutput', 'instructionList', '<OutputVerify', 'whatItMeans']) {
      expect(detail, `${gone} is not tier 0`).not.toContain(gone);
    }
    expect(detail).toContain('instruction || description');
    expect(detail).toContain('title="Show me how"');
    expect(code('src/components/step/StepHow.tsx')).toContain('<CommandBlock');
    expect(code('src/components/step/StepWhy.tsx')).toContain('whatItMeans');
    // The description is printed once: the runner card no longer repeats it.
    expect(code('src/components/task/GuidedTaskRunner.tsx')).not.toContain('description');
    // A command's explanation is behind its toggle, with the flags.
    const cmd = code('src/components/step/CommandBlock.tsx');
    expect(cmd).toContain('showFlags && c.explain');
    // R80: Show all is the default for every course, and no rung opens by
    // itself — the task is a list of step titles until the student clicks one.
    const runner = code('src/components/task/GuidedTaskRunner.tsx');
    expect(runner).toContain("useState<'guided' | 'all'>('all')");
    expect(runner).toContain('new Set(initialStepId ? [initialStepId] : [])');
    expect(runner).not.toContain('guidedDefault');
    // The task's definition of done is the ladder's last rung, not About.
    expect(code('src/components/task/GuidedTaskRunner.tsx')).toContain('definitionOfDone');
    expect(code('src/components/course/TaskAboutPanel.tsx')).not.toContain('definitionOfDone');
  });

  it('R79 — Home says which objective you are on', () => {
    expect(code('src/components/course/HomeTab.tsx')).toContain('objectivesFor(');
    expect(code('src/components/team/EngagementStatus.tsx')).toContain('Objective {objective.index} of {objective.count}');
  });

  it('the workflow nodes are real buttons that a keyboard can walk', () => {
    const flow = code('src/components/diagrams/FlowDiagram.tsx');
    expect(flow).toContain("aria-current={current ? 'step' : undefined}");
    expect(flow).toContain('ArrowRight');
    expect(flow).toContain('tabIndex={i === focusIdx ? 0 : -1}');
    expect(flow).toContain('scrollIntoView');
  });
});

/**
 * R80 — the mine comes alive.
 *
 * The instructor's art replaced the pixel scene; every task carries the stone
 * it is cutting; gems are earned by proof. These are the shapes that would
 * quietly undo it.
 */
describe('R80 — the mine', () => {
  it('every own task wears its stone, and the week its gem tray', () => {
    const tab = code('src/components/course/TasksTab.tsx');
    expect(tab).toContain('lead={<TaskStone');
    expect(tab).toContain('<WeekGemTray');
    expect(code('src/components/course/TaskRow.tsx')).toContain('{lead}');
  });

  it('rarity is computed from the record, never rolled', () => {
    expect(code('src/lib/rarity.ts')).not.toMatch(/Math\.random/);
    expect(code('src/components/course/useRarity.ts')).toContain('taskRarity(');
  });

  it('the course Home shows the pack', () => {
    expect(code('src/components/course/HomeTab.tsx')).toContain('<PackStrip');
  });

  it('both homes are the mine; the pixel scene is gone', () => {
    expect(code('src/components/quarry/art/HeroMine.tsx')).toContain('<MineScene');
    expect(code('src/components/quarry/art/HeroMine.tsx'), 'picking a cert recolours the scene').toContain('tintVars(pick)');
    expect(code('src/app/page.tsx')).toContain('<HeroMine');
    expect(code('src/components/course/HomeTab.tsx')).toContain('mode="progress"');
    for (const f of collectSourceFiles('src')) expect(code(f), f).not.toMatch(/PixelMiner|QuarryScene/);
  });

  it('the mine stops when nobody can see it', () => {
    const mine = code('src/components/quarry/art/MineScene.tsx');
    expect(mine).toContain('IntersectionObserver');
    expect(mine).toContain('visibilitychange');
    expect(mine).toContain('cancelAnimationFrame');
  });

  it('every art component that animates on its own honours reduced motion', () => {
    for (const f of ['MinerStrike.tsx', 'TaskStone.tsx', 'widgets.tsx', 'MineScene.tsx']) {
      expect(code(`src/components/quarry/art/${f}`), f).toContain('useReducedMotionSafe');
    }
  });
});

/**
 * R81 — accounts.
 *
 * Every student has an account (Google or GitHub), progress and badges are
 * saved to it, and the team sees each other's. These are the shapes that
 * would quietly undo it: a device-only pointer, an evidence map that ignores
 * whose it is, a policy that asks the membership question by subquery again
 * (the recursion 0006 fixed), a sign-in screen back to one provider.
 */
describe('R81 — accounts', () => {
  it('offers Google and GitHub by default', () => {
    expect(code('src/lib/supabase/config.ts')).toContain("DEFAULT_METHODS: readonly AuthMethod[] = ['google', 'github']");
  });

  it('nothing on the course Home lives on the device only', () => {
    const home = code('src/components/course/HomeTab.tsx');
    expect(home).not.toMatch(/localStorage/);
    expect(home, 'the mine pointer goes through the user-state repo').toContain('mineSeen');
  });

  it('the cloud evidence map is keyed by whose it is', () => {
    const repo = code('src/lib/data/supabaseEvidenceRepo.ts');
    expect(repo).toContain('cache.stepEvidence(courseId, memberId)');
    expect(repo).toContain('cache.setStepEvidence(evidence, memberId)');
    expect(code('src/lib/data/supabaseCache.ts')).toContain('`${userId}::${evidence.courseId}::${evidence.taskId}::${evidence.stepId}`');
  });

  it('the team page shows each teammate\'s badges, from their own ledger', () => {
    const block = code('src/components/team/TeamBlock.tsx');
    expect(block).toContain('evidenceRepo.getSteps(course.id, m.memberId)');
    expect(block).toContain('taskRarity(');
    expect(code('src/components/team/TeamProgressTable.tsx')).toContain('<GemRow');
  });

  it('no policy asks the membership question by subquery — that is the recursion 0006 fixed', () => {
    // Every policy created from 0006 on must go through the security-definer
    // helpers. A `create policy … (select … from public.memberships` or
    // `public.profiles` inside a policy body is exactly the shape that recursed.
    const dir = 'supabase/migrations';
    const files = readdirSync(root(dir)).filter((f) => f.endsWith('.sql') && f >= '0006').sort();
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const sql = read(`${dir}/${f}`).replace(/^\s*--.*$/gm, '');
      const policies = sql.match(/create policy[\s\S]*?;/g) ?? [];
      for (const p of policies) {
        expect(p, `${f}: ${p.split('\n')[0]}`).not.toMatch(/from\s+public\.(memberships|profiles)\b/);
      }
    }
    // And the helpers themselves are what the last policy set calls.
    const six = read('supabase/migrations/0006_accounts.sql');
    for (const fn of ['is_instructor()', 'shares_course(', 'on_team(', 'same_team_as(']) expect(six).toContain(`public.${fn}`);
    expect(six, 'a student cannot promote themselves').toContain('revoke update on public.profiles from anon, authenticated');
  });

  it('the schema is exercised on a real Postgres in CI', () => {
    expect(read('.github/workflows/ci.yml')).toContain('scripts/db-check.sh');
    expect(read('package.json')).toContain('"db:check"');
    expect(read('supabase/tests/rls.sql')).toMatch(/^begin;/m);
    expect(read('supabase/tests/rls.sql')).toMatch(/^rollback;/m);
  });

  it('a signed-out visitor is asked for the account before "enrol"', () => {
    const gate = code('src/components/CourseEnrolGate.tsx');
    expect(gate).toContain('<SignInPanel');
    expect(gate).toContain('isSupabaseConfigured() && !loading && !user');
  });
});

/**
 * R82 — the chrome always wins.
 *
 * The instructor's phone screenshot showed the pack's miner painted OVER the
 * sticky site nav: the art's 3D compositing (perspective + preserve-3d + a
 * blend mode, under backdrop-filter bars) escaped the z-order on mobile
 * Chrome. The fix is layered — flat art, isolated items, an isolated <main>,
 * a portaled Dialog — and each layer is a one-line edit someone could undo
 * without noticing. These make that fail here instead.
 */
describe('R82 — the chrome always wins', () => {
  const css = () => read('src/app/globals.css');

  it('the art is flat: no 3D context, no blend group, tilt only for hover pointers', () => {
    expect(css()).not.toContain('preserve-3d');
    expect(css()).not.toContain('mix-blend-mode: screen');
    const qa3d = css().match(/\.qa-3d \{[^}]*\}/)?.[0] ?? '';
    expect(qa3d, '.qa-3d fences its own layers').toContain('isolation: isolate');
    // The rest-state inner rule carries no transform of its own…
    const inner = css().match(/\.qa-3d-inner \{[^}]*\}/)?.[0] ?? '';
    expect(inner).not.toMatch(/\n\s*transform:/);
    // …every rotateX tilt lives inside the hover-capable media query.
    const hoverBlock = css().match(/@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\n\}/)?.[0] ?? '';
    const tilts = css().match(/rotateX\(var\(--rx/g) ?? [];
    const tiltsInHover = hoverBlock.match(/rotateX\(var\(--rx/g) ?? [];
    expect(tilts.length).toBeGreaterThan(0);
    expect(tiltsInHover.length).toBe(tilts.length);
  });

  it('main is isolated AND Dialog is portaled — a pair, never undo one alone', () => {
    // `isolate` on <main> is what guarantees the z-40 header paints over any
    // stacking context the page content creates…
    expect(read('src/app/layout.tsx')).toMatch(/<main[^>]*className="[^"]*\bisolate\b/);
    // …and it would trap an inline fixed overlay, so Dialog must render
    // through a portal to <body>.
    expect(code('src/components/ui/Dialog.tsx')).toContain('createPortal(');
    expect(code('src/components/ui/Dialog.tsx')).toContain('document.body');
  });

  it('art clips to its box by default, and the drop spins around the gem', () => {
    const w = code('src/components/quarry/art/widgets.tsx');
    expect(w, 'ArtSvg overflow defaults hidden').toContain("overflow = 'hidden'");
    expect(w).toContain('overflow={overflow}');
    const drop = css().match(/\.qa-drop \{[^}]*\}/)?.[0] ?? '';
    expect(drop).toContain('transform-box: fill-box');
  });

  it('bars pinned under the sub-nav track its real, wrappable height', () => {
    expect(code('src/components/CourseSubNav.tsx')).toContain("setProperty('--subnav-h'");
    expect(code('src/components/week/WeekRail.tsx')).toContain('var(--subnav-h, 3rem)');
    expect(code('src/components/docs/GuideManual.tsx')).toContain('var(--subnav-h, 3rem)');
    expect(css()).toContain('var(--subnav-h, 3rem)');
  });

  it('the mine never invents a week', () => {
    expect(code('src/components/course/HomeTab.tsx')).toContain('mineWeeks.length > 0 && (');
    const mine = code('src/components/quarry/art/MineScene.tsx');
    expect(mine).toContain('if (weeks <= 0) return null;');
    expect(mine, 'unknown rarity is a silhouette, not a Common gem').toContain('(rarities[i] ?? null)');
  });
});

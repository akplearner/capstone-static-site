import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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
    // RoleInterplayDiagram's SVG nodes. Since R104 the one renderer is the
    // role table; a mission card list pasted back beside it is the bug.
    const missionSources = ['<RoleTable', '.mission', 'RoleInterplayDiagram'].filter((c) => src.includes(c));
    expect(missionSources).toEqual(['<RoleTable']);
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
  // `alsoAllowed` is load-bearing here:
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
  // The lab passwords used to have rows here (`@Pass@2026`, `Pass@2026`). R135
  // removed the literals from source altogether — see the R135 pins below.
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
  it('R98: every role’s task is a row of the week for every member — no reference panel, no role gate', () => {
    const src = code('src/components/course/TasksTab.tsx');
    expect(src).not.toContain('TaskReference');
    expect(src, 'the list is not filtered by the viewer’s role').not.toContain('t.role === member.role');
    expect(src).toContain('o.tasks.map(');
    expect(src, 'the percentages on the tab are the team’s').toContain('teamTaskStats[task.id]');
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
      // R109: the dashboard stamps the same export (built by src/lib/memberExport.ts, which reads no clock).
      'src/app/dashboard/page.tsx',
      // R110: the device's acknowledgement log, as rows for the account export (the cloud rows are already ISO strings).
      'src/lib/legal/acceptances.ts',
      // R114: the shared copy's generatedAt, machine metadata like the exports above.
      'src/app/courses/[courseId]/skills/page.tsx',
      // R120: an issue's timestamps are fields of the published capstone-issue/1 (ISO 8601); the inbox prints them with toLocaleString.
      'src/lib/issueInbox.ts',
      // R121: a ledger entry's time is a field of the published capstone-content-fix/1 (ISO 8601); the offline ledger stamps it as the database would.
      'src/lib/data/localStorageContentFixesRepo.ts',
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
    ['src/components/diagrams/WeekBuildDiagram.tsx', 'weekVisualsOf'],
    ['src/components/diagrams/ArchDiagram.tsx', 'archOf'],
    ['src/components/course/WeekAddsList.tsx', 'weekVisualsOf'],
    ['src/components/docs/RoleTable.tsx', 'rolesOf'],
    ['src/components/diagrams/RoleFlowDiagram.tsx', 'rolesOf'],
    ['src/components/docs/CertCoverage.tsx', 'certOf'],
    ['src/components/skills/SkillsCard.tsx', 'skillsOf'],
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
      'src/lib/docs/roles.ts',
      'src/lib/docs/costs.ts',
      'src/lib/docs/standards.ts',
      'src/lib/docs/sops.ts',
      'src/lib/docs/metricCatalogue.ts',
      'src/lib/docs/skillsCopy.ts',
      'src/lib/docs/kpis.ts',
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
    // …and the one renderer that takes it is the only spelling of the body
    // (R79: the runner renders rungs, and a rung renders the body; R98 removed
    // the read-only reference renderer — every task opens in the runner).
    expect(code('src/components/task/GuidedTaskRunner.tsx')).not.toContain('<StepDetail');
    expect(code('src/components/task/ChecklistItem.tsx').match(/<StepDetail\b/g)?.length).toBe(1);
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
    /from '@\/lib\/docs\/(securityContent|cysaContent|manual|serverDiagrams|ccnaDiagrams|ccnaKit|troubleshooting|serverProcedures|custodyTemplate|msspContent|secaiContent|cisspContent|weekVisuals|roles|certs|costs|skills|tools|standards|sops|tactics|metricCatalogue|skillsCopy|skillCoverage|skillSheet|skillsSection|kpis|workRoles|environmentProfile|kpiSheet)'/;
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
    expect(code('src/components/course/TasksTab.tsx').match(/<Collapsible\b/g)?.length, 'week: More for this week').toBe(1);
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

/**
 * R82 — team data reaches the team, and never clobbers it.
 *
 * The shapes that would quietly undo the R82 data fixes: a whole-map form
 * save (one stale tab overwrites every teammate's newer form), a realtime
 * channel with no DELETE listeners (an un-tick never reaches a teammate),
 * evidence missing from the publication (gems never stream), a join that
 * reports ok before the membership row lands.
 */
describe('R82 — team data', () => {
  it('the autosave writes ONE deliverable, never the whole team map', () => {
    const page = code('src/app/courses/[courseId]/docs/page.tsx');
    expect(page).toContain('docsRepo.saveOne(');
    expect(page, 'the old clobbering shape').not.toContain('docsRepo.save(course.id, member.teamId, { ...current');
    expect(code('src/components/team/TeamBusinessPicker.tsx')).toContain('docsRepo.saveOne(');
  });

  it('realtime survives what filters and sleep drop', () => {
    const cacheSrc = code('src/lib/data/supabaseCache.ts');
    expect(cacheSrc, 'DELETE events are unfiltered (Supabase drops filtered ones)').toContain("{ event: 'DELETE', schema: 'public', table }");
    expect(cacheSrc, 'gems stream').toContain("table: 'step_evidence'");
    expect(cacheSrc, 'rejoin re-hydrates').toContain("if (status !== 'SUBSCRIBED') return;");
    expect(code('src/lib/useSupabaseSync.ts'), 'waking tabs re-hydrate').toContain("addEventListener('visibilitychange'");
  });

  it('a join is only ok once the membership row landed', () => {
    const repo = code('src/lib/data/supabaseProgressRepo.ts');
    expect(repo).toContain('async joinTeam');
    expect(repo, 'rollback on failure').toContain("return { ok: false, reason: 'network' }");
    expect(code('src/components/course/JoinPanel.tsx')).toContain('await Promise.resolve(progressRepo.joinTeam(');
  });

  it('step_evidence is published, and rls.sql proves the whole publication', () => {
    expect(read('supabase/migrations/0007_evidence_realtime.sql')).toContain('add table public.step_evidence');
    const rls = read('supabase/tests/rls.sql');
    expect(rls).toContain('pg_publication_tables');
    expect(rls, 'the reverse direction is asserted too').toContain("bob: reads ada''s evidence");
  });

  it('every course page hydrates through the layout, and loading means hydrated', () => {
    expect(code('src/app/courses/[courseId]/layout.tsx')).toContain('useSupabaseSync(courseId)');
    expect(code('src/lib/useMember.ts')).toContain('isCourseHydrated(courseId)');
  });
});

describe('R82 — the sign-in round trip tells the truth', () => {
  it('the callback reads the provider error and logs every failure', () => {
    const cb = code('src/app/auth/callback/route.ts');
    expect(cb).toContain("searchParams.get('error_description')");
    expect(cb).toContain('console.error');
    expect(cb, 'in-app browsers get their own reason').toContain('auth_error=browser');
    const banner = code('src/components/auth/AuthErrorBanner.tsx');
    expect(banner).toContain('provider:');
    expect(banner).toContain('browser:');
  });

  it('proxy redirects carry rotated cookies and recover a code that landed on /', () => {
    const px = code('src/proxy.ts');
    expect(px).toContain('response.cookies.getAll().forEach');
    expect(px).toContain("searchParams.has('code')");
    expect(px, 'signed-in /login honours ?next=').toContain("safeNextPath(request.nextUrl.searchParams.get('next'), '/dashboard')");
  });

  it('sign-out is local; sign-in lands on the dashboard', () => {
    expect(code('src/lib/useAuth.ts')).toContain("signOut({ scope: 'local' })");
    expect(code('src/app/login/page.tsx')).toContain("safeNextPath(params.get('next'), '/dashboard')");
  });
});

/**
 * R83 — the PDF prints once, and a task shows its team.
 */
describe('R83 — print + task indicators', () => {
  it('printHTML loads content through srcdoc, exactly once', () => {
    const docs = code('src/app/courses/[courseId]/docs/page.tsx');
    expect(docs).toContain('iframe.srcdoc = html');
    // doc.open()/write() is the double-load shape that printed a blank page
    // first on Windows Chrome — it must not come back.
    expect(docs).not.toContain('doc.open()');
    expect(docs).not.toContain('doc.write(');
    expect(docs, 'guarded against any second load').toContain('let printed = false');
  });

  it('every task row can show who on the team finished it', () => {
    expect(code('src/components/course/TaskRow.tsx')).toContain('function TeamMarks(');
    expect(code('src/components/course/TasksTab.tsx')).toContain('teammates={teamTaskProgress[task.id]}');
    expect(code('src/components/course/useCourseProgress.ts')).toContain('teamTaskProgress');
  });
});

describe('R83 — Report an issue', () => {
  it('the button is on every own task and the chip on every row', () => {
    expect(code('src/components/course/TasksTab.tsx')).toContain('<ReportIssueDialog');
    expect(code('src/components/course/TaskRow.tsx')).toContain('reportCount');
  });

  it('reports reach the instructor and can only be resolved there', () => {
    const page = code('src/app/instructor/[courseId]/cohort/page.tsx');
    expect(page).toContain('Reported issues');
    expect(page).toContain('taskReportsRepo.resolve(');
    const sql = read('supabase/migrations/0008_task_reports.sql');
    expect(sql).toContain('for update');
    expect(sql).toContain('public.is_instructor()');
    expect(sql, 'teammates read via the 0006 helper').toContain('public.same_team_as(user_id, course_id)');
    expect(read('supabase/tests/rls.sql')).toContain("bob resolved a report");
  });

  it('the kinds come from one list shared with the CHECK constraint', () => {
    const kinds = code('src/lib/reportKinds.ts');
    const sql = read('supabase/migrations/0008_task_reports.sql');
    for (const k of ['unclear', 'broken', 'environment', 'question', 'outdated']) {
      expect(kinds).toContain(`'${k}'`);
      expect(sql).toContain(`'${k}'`);
    }
    expect(code('src/components/task/ReportIssueDialog.tsx')).toContain('REPORT_KINDS');
  });
});

describe('R83 — cohorts and lobbies', () => {
  it('a join is current-month only, and the student picks how they attend', () => {
    const jp = code('src/components/course/JoinPanel.tsx');
    expect(jp, 'the 12-month free-for-all select is gone').not.toContain('getMonthlyCohorts(12)');
    expect(jp).toContain('getMonthlyCohorts(2)');
    expect(jp).toContain('How are you attending?');
    expect(jp, 'lobbies and teams never mix').toContain("mode === 'local' ? (");
    expect(jp).toContain('Start a new lobby');
  });

  it('the mode lives inside the team id, and legacy ids stay local', () => {
    const team = code('src/lib/team.ts');
    expect(team).toContain("mode === 'online' ? 'o' : 't'");
    expect(team, 'labels tell the two apart').toContain("'Lobby' : 'Team'");
    // The grammar itself is locked by src/lib/team.test.ts.
  });
});

describe('R84 — the stamp, the grading preview, and the diagram kit', () => {
  it('a verified paste requires the member’s stamp, and the runner explains it', () => {
    const how = code('src/components/step/StepHow.tsx');
    expect(how, 'StepHow appends the task stamp to the expected tokens').toContain(
      'taskToken(ledger.memberId, courseId, ledger.taskId)'
    );
    const runner = code('src/components/task/GuidedTaskRunner.tsx');
    expect(runner, 'the task header states the stamp once').toContain('Your stamp:');
    expect(runner).toContain('taskToken(memberId, courseId, task.id)');
  });

  it('every form resolves its picture through visualFor — the id table is gone', () => {
    const docs = code(DOCS);
    expect(docs).toContain('visualFor(def)');
    expect(docs, 'the per-page diagram table must not come back').not.toContain('FORM_DIAGRAM');
    expect(docs, 'the grading preview sits with every unlocked form').toContain('<ExpectationsPanel');
    const resolver = code('src/components/diagrams/kit/visualFor.tsx');
    for (const bespoke of ['cysa_alert_triage', 'risk_register', 'cysa_incident_response', 'incident_report']) {
      expect(resolver, 'the four bespoke drawings survive the kit').toContain(bespoke);
    }
  });

  it('the kit is recolourable — not one literal colour in it', () => {
    // Comments included on purpose: a hex "example" in a comment is how the
    // next literal gets pasted into code.
    const files = readdirSync(root('src/components/diagrams/kit'))
      .map((f) => `src/components/diagrams/kit/${f}`)
      .concat(['src/lib/diagrams/kitPresets.ts', 'src/lib/diagrams/kitSpec.ts']);
    expect(files.length).toBeGreaterThan(6);
    for (const f of files) {
      expect(read(f), `${f} takes colours from theme tokens or tintVars only`).not.toMatch(
        /#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/
      );
    }
  });

  it('the panel judges with the shared rubric, not a private copy', () => {
    const panel = code('src/components/docs/ExpectationsPanel.tsx');
    expect(panel).toContain('evaluateBundle(');
    expect(panel).toContain('RUBRIC_CATEGORIES');
    expect(panel, 'authenticity reads the real ledger').toContain('evidenceRepo.getSteps(');
  });
});

describe('R84 — frozen submissions and blind review (the DB contract)', () => {
  const MIGRATIONS = readdirSync(root('supabase/migrations')).filter((f) => f.endsWith('.sql'));

  it('submissions are append-only: no migration may ever add an update/delete policy', () => {
    for (const f of MIGRATIONS) {
      const sql = read(`supabase/migrations/${f}`).toLowerCase();
      expect(sql, `${f} must not open deliverable_submissions to rewrites`).not.toMatch(
        /create policy [^;]*on public\.deliverable_submissions for (update|delete)/
      );
    }
    const sql = read('supabase/migrations/0009_evidence_bundles.sql');
    expect(sql, 'the belt-and-braces trigger').toContain('before update on public.deliverable_submissions');
    expect(sql).toContain('append-only');
  });

  it('a peer_reviews row can never name its reviewer, and the packet strips identity', () => {
    const sql = read('supabase/migrations/0009_evidence_bundles.sql');
    const table = sql.slice(
      sql.indexOf('create table if not exists public.peer_reviews'),
      sql.indexOf('alter table public.peer_reviews')
    );
    expect(table.length).toBeGreaterThan(50);
    expect(table, 'anonymity is structural: no reviewer column on the verdict row').not.toContain('reviewer');
    expect(sql, 'the packet strips the identifying snapshot keys').toContain("(s.snapshot - 'teamId') - 'submittedBy'");
  });

  it('the cohort is the leading YYYY-MM of the team id — split_part would return the year', () => {
    const sql = read('supabase/migrations/0009_evidence_bundles.sql');
    expect(sql).toContain(String.raw`substring(s.team_id from '^\d{4}-\d{2}')`);
    expect(sql).not.toContain('split_part');
  });

  it('rls.sql proves the freeze, the blindness, and the realtime streams', () => {
    const t = read('supabase/tests/rls.sql');
    expect(t, 'blind-read assert').toContain('no teamId in the packet');
    expect(t, 'owner-level freeze assert').toContain('append-only');
    expect(t, 'double review assert').toContain('cy reviewed twice');
    for (const tbl of ['deliverable_submissions', 'peer_reviews']) {
      expect(t, `publication assert covers ${tbl}`).toContain(`'${tbl}'`);
    }
  });
});

describe('R84 — the review bench stays blind, and verdicts have one brain', () => {
  const REVIEW = 'src/app/courses/[courseId]/review/page.tsx';

  it('the review page can only see what the RPCs serve — never the submitter', () => {
    const src = read(REVIEW); // comments included: the temptation starts there
    // The reviewer's OWN teamId (the sub-nav) is fine — it is the submitter's
    // identity that must be unreachable from this file.
    for (const leak of ['deliverable_submissions', 'submitted_by', 'submittedBy']) {
      expect(src, `the reviewer's page must never mention ${leak}`).not.toContain(leak);
    }
    expect(src, 'the packet is rendered from the snapshot, never from a table row').not.toMatch(/packet\.(teamId|team_id)/);
    expect(src, 'reads through the repo (queue + packet RPCs)').toContain('submissionsRepo.queue()');
    expect(src).toContain('submissionsRepo.packet(');
  });

  it('the six questions live in one module, and confirm is derived from them', () => {
    const q = read('src/lib/docs/reviewQuestions.ts');
    expect((q.match(/\{ id: '/g) ?? []).length, 'exactly six questions').toBe(6);
    const src = code(REVIEW);
    expect(src).toContain("from '@/lib/docs/reviewQuestions'");
    expect(src, 'confirm = all six yes, computed, never a seventh checkbox').toContain('confirmOf(answers)');
  });

  it('verdicts are derived in deliverableRubric.ts and nowhere else', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(root(dir))) {
        const p = `${dir}/${f}`;
        if (statSync(root(p)).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(f) && !p.endsWith('deliverableRubric.ts') && !p.endsWith('.test.ts')) {
          if (/return '(platform|overridden)_(pass|fail)'/.test(read(p))) offenders.push(p);
        }
      }
    };
    walk('src');
    expect(offenders, 'a second place deriving verdicts is a desync waiting to happen').toEqual([]);
    expect(read('src/lib/docs/deliverableRubric.ts')).toContain("return 'overridden_pass'");
  });

  it('the honest grading story is in the setup guide the instructor reads', () => {
    const md = read('SUPABASE_SETUP.md');
    expect(md).toContain('How grading works now');
    expect(md).toContain('re-run it once');
    expect(md, 'the honesty note ships with the feature').toContain('does not prove which\nmachine ran a command');
  });
});

describe('R85 — two staff roles: instructors run the class, admins own the content', () => {
  it('the course document write policy is the admin’s, and stays that way', () => {
    const files = readdirSync(root('supabase/migrations')).filter((f) => f.endsWith('.sql')).sort();
    const all = files.map((f) => read(`supabase/migrations/${f}`)).join('\n');
    const defs = [...all.matchAll(/create policy "course documents [^"]*writes"[\s\S]*?;/g)];
    expect(defs.length).toBeGreaterThan(0);
    const last = defs[defs.length - 1][0];
    expect(last, 'the LAST definition of the write policy must be admin-only').toContain('public.is_admin()');
  });

  it('admins inherit everything: is_instructor() answers for both flags', () => {
    const sql = read('supabase/migrations/0010_admin_and_roster.sql');
    expect(sql).toContain('p.is_instructor or p.is_admin');
    expect(sql, 'students still cannot grant themselves either flag').toContain('grant  update (display_name, avatar_url)');
  });

  it('roster management is staff-only, and never lets staff enrol someone', () => {
    const sql = read('supabase/migrations/0010_admin_and_roster.sql');
    const policies = [...sql.matchAll(/create policy "memberships instructor [^"]*"[\s\S]*?;/g)].map((m) => m[0]);
    expect(policies.length).toBe(2);
    for (const p of policies) expect(p).toContain('public.is_instructor()');
    expect(sql, 'update + delete only — no instructor insert path').not.toMatch(/create policy "memberships instructor [^"]*" on public\.memberships for insert/);
  });

  it('rls.sql proves the split and the roster fixes', () => {
    const t = read('supabase/tests/rls.sql');
    for (const a of ['ana: is an admin', 'an admin is an instructor', 'ivy published a course document', 'ivy: moved zed', 'cy moved bob', 'ivy: sees student names']) {
      expect(t, `missing assert: ${a}`).toContain(a);
    }
    expect(read('SUPABASE_SETUP.md'), 'the operator can find the grant').toContain('set is_admin = true');
  });
});

describe('R85 — the instructor page plumbing and the full view', () => {
  it('instructor pages set the user id — the silent-write bug stays dead', () => {
    const gate = code('src/components/InstructorGate.tsx');
    expect(gate, 'InstructorGate is the one wrapper every /instructor page shares').toContain('useUserSync(');
  });

  it('authoring is behind the admin, the dashboard is not', () => {
    expect(code('src/app/instructor/[courseId]/page.tsx'), 'the course editor').toContain('<AdminGate>');
    const home = code('src/app/instructor/page.tsx');
    expect(home, 'the studio home gates its authoring verbs').toContain('isAdmin &&');
    expect(home, 'every instructor still reaches their dashboards from it').toContain('/cohort`}');
    expect(code('src/app/instructor/[courseId]/cohort/page.tsx'), 'the dashboard stays instructor-level').not.toContain('AdminGate');
  });

  it('the cohort dashboard shows registrations, evidence quality and verdicts', () => {
    const page = code('src/app/instructor/[courseId]/cohort/page.tsx');
    expect(page).toContain('<RegistrationsPanel');
    expect(page).toContain('<SubmissionVerdictLine');
    expect(page).toContain('<SubmissionSummary');
    expect(page, 'verified vs self-attested reaches the screen, not only the CSV').toContain('evidence: { verified: m.verified, selfAttested: m.selfAttested }');
    expect(code('src/components/instructor/SubmissionVerdicts.tsx'), 'verdicts derive through the one brain').toContain('verdictOf(');
  });

  it('roster fixes correct, never conscript: no insert anywhere in the verbs', () => {
    const src = read('src/lib/data/rosterAdmin.ts');
    expect(src).not.toContain('.insert(');
    expect(src, 'both verbs exist').toContain('export async function moveMember');
    expect(src).toContain('export async function removeMember');
  });
});

describe('R85 — the admin content studio edits safely', () => {
  it('content editors never touch storage — everything rides the one save', () => {
    for (const f of ['src/components/instructor/DeliverablesEditor.tsx', 'src/components/instructor/ReferenceEditor.tsx']) {
      const src = read(f);
      for (const leak of ['supabase', 'localStorage', 'docsRepo', 'courseRepo']) {
        expect(src, `${f} must not reach ${leak} — edits flow up to the editor's Save`).not.toContain(leak);
      }
    }
    expect(code('src/app/instructor/[courseId]/page.tsx'), 'the save path').toContain('courseRepo.saveWithContent(');
  });

  it('structure edits pass the validator before they apply, and again before save', () => {
    expect(code('src/components/instructor/DeliverablesEditor.tsx')).toContain('validateDeliverableDef(');
    expect(code('src/app/instructor/[courseId]/page.tsx')).toContain('validateDeliverableList(');
  });

  it('the preview is the student’s own renderer, not a lookalike', () => {
    const src = code('src/components/instructor/DeliverablesEditor.tsx');
    expect(src).toContain('<DeliverableForm');
    expect(src).toContain('visualFor(');
    expect(src, 'derived exactly as the docs page derives').toContain('withDerivedBundle(');
  });
});

describe('R86 — nobody works unsigned, and the log never lies', () => {
  it('the gate covers the whole app in cloud mode, and the first join offline', () => {
    expect(code('src/app/layout.tsx'), 'the overlay sits in the root layout').toContain('<LegalGateOverlay');
    const join = code('src/components/course/JoinPanel.tsx');
    expect(join, 'offline join fronts the agreements').toContain('missingAcceptances(localAcceptances())');
    expect(join).toContain('<LocalLegalDialog');
    expect(code('src/components/auth/SignInPanel.tsx'), 'no surprise at sign-in').toContain('platform agreements');
  });

  it('the acknowledgement log is append-only, and versions drive the re-ask', () => {
    const sql = read('supabase/migrations/0011_agreement_log.sql').toLowerCase();
    expect(sql).not.toMatch(/create policy [^;]*agreement_acceptances for (update|delete)/);
    expect(sql, 'the primary key is what makes a version a new row').toContain('primary key (user_id, agreement_id, version)');
    const gate = code('src/components/legal/AgreementGate.tsx');
    expect(gate, 'the gate asks by version, through the one registry function').toContain('missingAcceptances(');
    expect(gate, 'accepting writes the log, never edits it').not.toContain('.update(');
  });

  it('the rls proofs stand', () => {
    const t = read('supabase/tests/rls.sql');
    for (const a of ['ada acknowledged terms as bob', 'ada rewrote the acceptance log', 'the whole acknowledgement log', 'sets her own last-seen clock']) {
      expect(t, `missing assert: ${a}`).toContain(a);
    }
  });
});

describe('R86 — metrics count activity, they do not read work', () => {
  it('every signed-in tab reports presence, throttled and self-scoped', () => {
    expect(code('src/app/layout.tsx')).toContain('<PresenceBeacon');
    const hook = read('src/lib/usePresence.ts');
    expect(hook, 'heartbeat no faster than five minutes').toContain('5 * 60_000');
    expect(hook, 'no writes from a backgrounded tab').toContain('visibilitychange');
    expect(hook, 'the write goes through the wire layer').toContain('stampLastSeen(userId)');
    expect(read('src/lib/data/supabaseFeatureRepos.ts'), 'the clock is the caller’s own row, nobody else’s').toContain(".eq('id', userId)");
  });

  it('the metrics page is the admin’s, and reads through the one loader', () => {
    const page = code('src/app/instructor/metrics/page.tsx');
    expect(page).toContain('<AdminGate>');
    expect(page).toContain('loadMetrics()');
    expect(code('src/app/instructor/page.tsx'), 'reachable from the studio home').toContain('/instructor/metrics');
  });

  it('the loader can never reach private data', () => {
    const src = read('src/lib/data/metricsLoader.ts');
    for (const t of ['lab_access', 'step_notes', 'user_course_state', 'step_evidence', 'deliverables']) {
      expect(src, `metrics must not select ${t}`).not.toContain(`'${t}'`);
    }
  });
});

/**
 * R99 — every week of every course has a picture.
 *
 * The Tasks tab draws "What you build this week" for the week on screen, the
 * Guide draws the same picture behind week pills, and every form draws it
 * for the form's week. The pictures read the course document, and the
 * overlay pieces take their colours from tokens.
 */
describe('R99 — every week has a picture', () => {
  it('the Tasks tab draws the week visual, and still one objectives flow', () => {
    const src = code('src/components/course/TasksTab.tsx');
    expect(src).toContain('<WeekVisualPanel');
    expect(src.match(/<FlowDiagram\b/g)?.length).toBe(1);
  });

  it('the Guide draws one week-scoped picture for every course, not five static ones', () => {
    const src = code('src/components/docs/GuideManual.tsx');
    expect(src).toContain('<WeekBuildDiagram');
    for (const stale of ['ArchitectureDiagram', 'SocTopologyDiagram', 'ServerTopologyDiagram', 'CcnaTopologyDiagram']) {
      expect(src, `${stale} is drawn by WeekBuildDiagram now`).not.toMatch(new RegExp(`import \\{ ${stale} \\}`));
    }
  });

  it('a form draws its week', () => {
    expect(code('src/components/diagrams/kit/visualFor.tsx')).toContain("v.kit === 'week'");
  });

  it('the overlay pieces are recolourable — not one literal colour in them', () => {
    for (const f of ['src/components/diagrams/ProcessArrows.tsx', 'src/components/diagrams/ProcessStrip.tsx', 'src/components/week/WeekPills.tsx', 'src/components/diagrams/WeekBuildDiagram.tsx', 'src/components/diagrams/ArchDiagram.tsx']) {
      expect(read(f), `${f} takes colours from theme tokens only`).not.toMatch(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/);
    }
  });
});

/**
 * R100 — the Tasks tab reads on one screen.
 *
 * Split view beside the list from 1100px, a thumbnail week picture, one-line
 * rows, one chip row in the runner, container-query columns in a step, a
 * header that steps away on a scroll down, and Focus mode. These are the
 * shapes that would quietly undo it.
 */
describe('R100 — the Tasks tab reads on one screen', () => {
  it('the tab lays out through TasksLayout and the open task lives in TaskPane', () => {
    const tab = code('src/components/course/TasksTab.tsx');
    expect(tab).toContain('<TasksLayout');
    expect(tab).toContain('<TaskPane');
    expect(tab).toContain("mode={split ? 'select' : 'accordion'}");
    expect(tab, 'a sticky column cannot live under overflow-hidden').not.toContain('className="stratum-week scroll-under-chrome overflow-hidden"');
    expect(code('src/components/course/TasksLayout.tsx')).toContain("'(min-width: 68.75rem)'");
    expect(code('src/components/course/TaskPane.tsx')).toContain('id="task-pane"');
    expect(code('src/components/course/TaskPane.tsx')).toContain("focusById('task-pane-head')");
    const page = code('src/app/courses/[courseId]/page.tsx');
    expect(page).toContain('const selectTask = ');
    expect(page, 'a task scroll resolves to the pane in the split view').toContain('resolveScroll(');
    expect(page, 'scrolls land the task top under the bars').not.toContain("block: 'center'");
    expect(page).toContain("setAttribute('data-tasks-wide', 'true')");
    expect(read('src/app/globals.css')).toContain("html[data-tasks-wide='true'] main#main");
  });

  it('a step goes two-column by its container, not the window; tier 2 is a link', () => {
    const how = code('src/components/step/StepHow.tsx');
    expect(how).toContain('@2xl:grid-cols-2');
    expect(how).not.toContain('md:grid-cols-2');
    const detail = code('src/components/step/StepDetail.tsx');
    expect(detail).toContain('@container');
    expect(detail).toContain('variant="link"');
    expect(detail).toContain('size="sm"');
  });

  it('the week picture is a thumbnail with Expand, said once, and the process lands on its people', () => {
    const panel = code('src/components/course/WeekVisualPanel.tsx');
    expect(panel).toContain('aria-expanded={expanded}');
    expect(panel.match(/What you build this week/g)?.length, 'the heading, and the section label').toBe(2);
    expect(code('src/components/diagrams/WeekBuildDiagram.tsx'), 'the cloud frame draws no second title').toContain('title={null}');
    const cloud = code('src/components/diagrams/cloud/CloudTopology.tsx');
    expect(cloud.indexOf('if (forced(n)) return true;'), 'a process-named person is drawn before the week check').toBeLessThan(cloud.indexOf('if (!drawn(n.week)) return false;'));
    expect(cloud).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it('pictures scale on a phone — no SVG forces a sideways scroll below sm', () => {
    for (const f of ['src/components/diagrams/cloud/CloudTopology.tsx', 'src/components/diagrams/ArchDiagram.tsx', 'src/components/diagrams/RoleFlowDiagram.tsx']) {
      expect(code(f), f).toMatch(/min-w-0 sm:min-w-\[\d+px\]/);
    }
    for (const f of ['src/components/diagrams/ServerTopologyDiagram.tsx', 'src/components/diagrams/CcnaTopologyDiagram.tsx']) {
      expect(code(f), f).toContain('sm:min-w-[560px]');
      expect(code(f), f).not.toMatch(/(?<![\w:-])min-w-\[560px\]/);
    }
    expect(code('src/components/diagrams/FlowDiagram.tsx')).toContain('grid grid-cols-2');
  });

  it('one chip, used by the row, the rung and the runner; the current ring is the one current treatment', () => {
    for (const f of ['src/components/course/TaskRow.tsx', 'src/components/task/GuidedTaskRunner.tsx', 'src/components/task/ChecklistItem.tsx', 'src/components/step/StepDetail.tsx', 'src/components/course/WeekVisualPanel.tsx']) {
      expect(code(f), f).toContain("from '@/components/ui/Chip'");
    }
    expect(read('src/app/globals.css')).toContain('.depth-current {');
    expect(code('src/components/task/ChecklistItem.tsx')).toContain("'depth-current bg-panel-2'");
    expect(code('src/components/course/TaskRow.tsx')).toContain("select && open ? 'depth-current'");
    expect(code('src/components/diagrams/FlowDiagram.tsx')).toContain('depth-edge depth-current');
    // The runner's stamp is a chip that copies itself; the explanation is its tooltip.
    const runner = code('src/components/task/GuidedTaskRunner.tsx');
    expect(runner).toContain('data-stamp={stamp}');
    expect(runner).toContain('data-task-runner');
    expect(runner).toContain('useStepKeys({');
  });

  it('the header hides on the Tasks tab only, and the sub-nav follows it', () => {
    const nav = code('src/components/SiteNav.tsx');
    expect(nav).toContain('useNavAutoHide()');
    expect(nav).toContain("data-tucked={hidden ? 'true' : undefined}");
    expect(nav).toContain("setProperty('--nav-top'");
    expect(code('src/components/CourseSubNav.tsx')).toContain("top: 'var(--nav-top, var(--nav-h, 0px))'");
    expect(code('src/app/courses/[courseId]/page.tsx')).toContain("setNavAutoHide(tab === 'tasks')");
    expect(read('src/app/globals.css')).toContain(".glass.sticky[data-tucked='true']");
  });

  it('Focus mode is a per-device preference with a pressed toggle, and the word "density" is not back', () => {
    expect(code('src/lib/data/keys.ts')).toContain('focusMode:');
    expect(code('src/components/course/CourseSubNavActions.tsx')).toContain('aria-pressed={focus.on}');
    expect(code('src/components/course/CourseHero.tsx')).toContain('compact');
    for (const f of ['src/components/course/TasksTab.tsx', 'src/components/course/TasksLayout.tsx', 'src/components/course/TaskPane.tsx', 'src/components/course/CourseSubNavActions.tsx', 'src/lib/uiPrefs.ts', 'src/components/ui/Chip.tsx']) {
      expect(code(f), f).not.toMatch(/[dD]ensity/);
    }
  });
});

/**
 * R101 — two new capstones: SecAI+ (four releases) and CISSP (six releases).
 *
 * Both secure the same fictional company's move to the Ridgeline Service Hub,
 * both draw the generic `hub` picture from their own content module, and both
 * are open (no gatekeeping). These are the shapes that would quietly break
 * either of them.
 */
describe('R101 — SecAI+ and CISSP', () => {
  it('both seeds are registered everywhere a seed must be', () => {
    const dto = code('src/lib/content/dto.ts');
    for (const id of ['SECAI_PLUS', 'CISSP']) expect(dto, id).toContain(id);
    for (const f of ['src/lib/data/localStorageCourseRepo.ts', 'src/lib/data/supabaseCourseRepo.ts']) {
      expect(code(f), f).toContain('SECAI_PLUS');
      expect(code(f), f).toContain('CISSP');
    }
    expect(code('src/lib/docs/definitions.ts')).toContain('SECAI_DELIVERABLES');
    expect(code('src/lib/docs/definitions.ts')).toContain('CISSP_DELIVERABLES');
    expect(code('src/lib/content/docs.ts')).toContain("content/courses/secai-plus.json");
    expect(code('src/lib/content/docs.ts')).toContain("content/courses/cissp.json");
  });

  it('both draw the architecture picture, from their own content', () => {
    for (const f of ['src/lib/data/seed/secaiPlus.ts', 'src/lib/data/seed/cissp.ts']) {
      expect(code(f), f).toContain("topologyPicture: 'arch'");
      expect(code(f), f).toContain('noGatekeeping: true');
    }
    const arch = code('src/components/diagrams/ArchDiagram.tsx');
    expect(arch).toContain('archOf(useCourseDocument())');
    expect(arch).toContain('preserveAspectRatio="xMidYMid meet"');
    // The picture reads coordinates from the document; it holds no node table.
    const src = arch.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(src.match(/^const\s+\w+[^=\n]*=\s*\[\{/m)?.[0], 'ArchDiagram holds a table').toBeUndefined();
  });

  it('both are on the catalogue, available, pointing at the seed', () => {
    const cat = code('src/lib/catalog/entries.ts');
    expect(cat).toContain("courseId: 'secai-plus'");
    expect(cat).toContain("courseId: 'cissp'");
    const cisspEntry = cat.slice(cat.indexOf("id: 'isc2-cissp'"), cat.indexOf("id: 'isc2-cissp'") + 220);
    expect(cisspEntry, 'CISSP is no longer coming-soon').toContain("status: 'available'");
  });
});

/**
 * R102 — every step shows how: the page to read is part of the step on every
 * course, a command next to actions is required work ("Then run"), and the two
 * new capstones never tuck the shell away.
 */
describe('R102 — step docs on every course, honest captions', () => {
  it('StepHow renders the docs line whenever a step has docs, not only when the shell is tucked', () => {
    const how = code('src/components/step/StepHow.tsx');
    const at = how.indexOf('<StepDocs');
    expect(at, 'StepDocs is rendered').toBeGreaterThan(0);
    const guard = how.slice(how.lastIndexOf('\n', at), at);
    expect(guard).toContain('step.docs?.length');
    expect(guard, 'docs are no longer gated on shellOptional').not.toContain('shellOptional &&');
    expect(how).toContain("'Then run'");
    expect(how).toContain("'Or in the shell'");
  });
  it('neither SecAI+ nor CISSP tucks the shell away', () => {
    for (const f of ['src/lib/data/seed/secaiPlus.ts', 'src/lib/data/seed/cissp.ts']) expect(code(f), f).not.toContain('shellOptional');
  });
});

/**
 * R103 — real architectures. Every course that draws its own picture draws
 * it from ONE data shape (`ArchPicture`): the parts, their purpose, the form
 * that records each, and the week each arrives — read through the course
 * document by one renderer. The old per-course renderers, with coordinates
 * and arrival weeks typed inside them, are gone. Under the picture, the
 * weekly breakdown lists what arrives, from the same data.
 */
describe('R103 — one architecture picture, the weekly breakdown', () => {
  it('ArchDiagram reads the picture from the document and holds no table of its own', () => {
    const arch = code('src/components/diagrams/ArchDiagram.tsx');
    expect(arch).toContain('archOf(useCourseDocument())');
    expect(arch).toContain('data-node={n.id}');
    expect(arch).toContain('<title>{n.purpose}</title>');
    for (const stale of ['ArchitectureDiagram', 'SocTopologyDiagram', 'EngagementDiagram', 'HubDiagram']) {
      expect(existsSync(`src/components/diagrams/${stale}.tsx`), `${stale} is gone`).toBe(false);
    }
    expect(existsSync('src/lib/docs/hub.ts')).toBe(false);
    // No diagram component types an arrival week or an anchor table any more.
    for (const f of readdirSync('src/components/diagrams').filter((f) => f.endsWith('.tsx') && !f.includes('.test.'))) {
      const src = code(`src/components/diagrams/${f}`);
      expect(src, `${f} types arrival weeks`).not.toMatch(/^const ARRIVES\b/m);
      expect(src, `${f} types an anchor table`).not.toMatch(/^const ANCHORS\b/m);
    }
  });

  it('the five arch courses declare the picture, and every part carries its own arrival week', () => {
    for (const f of ['securityPlus', 'cysa', 'mssp', 'secaiPlus', 'cissp']) expect(code(`src/lib/data/seed/${f}.ts`), f).toContain("topologyPicture: 'arch'");
    for (const f of ['securityContent', 'cysaContent', 'msspContent', 'secaiContent', 'cisspContent']) {
      const src = code(`src/lib/docs/${f}.ts`);
      expect(src, f).toContain('export const ARCH: ArchPicture');
      expect(src, f).toContain('export const ARCH_BUILD = archBuildModel(ARCH,');
      expect(src, `${f} authors arrives twice`).not.toMatch(/^\s+arrives:\s*\{/m);
    }
    expect(code('src/lib/types.ts')).toContain("topologyPicture?: 'arch' | 'rack' | 'campus' | 'cloud';");
  });

  it('the weekly breakdown sits under the picture on the Tasks tab and in the Guide', () => {
    expect(code('src/components/course/WeekVisualPanel.tsx')).toContain('<WeekAddsList');
    expect(code('src/components/docs/GuideManual.tsx')).toContain('<WeekAddsList');
    const list = code('src/components/course/WeekAddsList.tsx');
    expect(list).toContain('weekAdds(doc, week)');
    expect(list, 'no disclosure widget — the week keeps its one collapsible').not.toContain('<Collapsible');
    expect(list).not.toContain('What you build this week');
  });
});

/**
 * R103 — the document lifecycle. Every form says who drafts, reviews and
 * approves it; the team moves it draft → in review → approved → issued in
 * the app; what it waits on is a notice, never a lock.
 */
describe('R103 — the deliverable lifecycle', () => {
  it('the docs page shows the status strip and the waiting-on notice; Home shows the team queue', () => {
    const docs = code('src/app/courses/[courseId]/docs/page.tsx');
    expect(docs).toContain('<StatusStrip');
    expect(docs).toContain('<WaitingOnNotice');
    expect(docs).toContain('role={member.role}');
    expect(code('src/components/course/HomeTab.tsx')).toContain('<TeamReviewQueueCard');
    expect(code('src/components/docs/ExpectationsPanel.tsx')).toContain("transition(def, rows, 'submit'");
  });
  it('the rules live in one pure module, the RACI in one table, and the gates no longer carry hand-offs nobody rendered', () => {
    expect(code('src/lib/docs/lifecycle.ts')).toContain('export function allowedActions');
    expect(code('src/lib/docs/lifecycle.ts')).not.toContain('localStorage');
    expect(code('src/lib/docs/definitions.ts')).toContain('RACI[d.id]');
    expect(code('src/lib/types.ts')).not.toContain('handoffs?:');
    for (const f of readdirSync('src/lib/data/seed').filter((f) => f.endsWith('.ts'))) expect(code(`src/lib/data/seed/${f}`), f).not.toContain('handoffs:');
    expect(existsSync('supabase/migrations/0012_deliverable_lifecycle.sql')).toBe(true);
  });
});

/** R103 — the build sheets are generated with the content, and CI diffs them. */
describe('R103 — build sheets', () => {
  it('the export writes the sheets from the same renderer the test checks, and CI diffs the folder', () => {
    expect(read('package.json')).toContain('tsx scripts/export-courses.ts && tsx scripts/export-build-sheets.ts');
    expect(read('.github/workflows/ci.yml')).toContain('git diff --exit-code -- content/ docs/courses/build-sheets/');
    expect(code('scripts/export-build-sheets.ts')).toContain("from '../src/lib/docs/buildSheet'");
    expect(code('src/lib/docs/buildSheet.ts')).toContain('weekAdds(doc, v.week)');
    expect(existsSync('docs/courses/arch-pictures.md')).toBe(true);
  });
});

/**
 * R104 — the overview standard (`docs/ARCHITECTURE.md` §6). The roles and
 * the hand-offs are read off the RACI and the chain and shown as one table
 * and one flow picture; three or more parallel things are a table, a flow is
 * a diagram, and no page explains in a paragraph what a row can show.
 */
describe('R104 — the overview is a table and a picture', () => {
  it('the Guide renders the role table, the manual draws the hand-offs, and the radial picture is gone', () => {
    const guide = code(GUIDE);
    expect(guide).toContain('<RoleTable');
    expect(guide, 'no mission cards').not.toMatch(/<li[^>]*>[\s\S]*?\{r\.mission\}/);
    const manual = code(MANUAL);
    expect(manual).toContain('<RoleFlowDiagram');
    expect(existsSync('src/components/diagrams/RoleInterplayDiagram.tsx')).toBe(false);
    expect(code('src/lib/docs/roleFlow.ts')).toContain('export function roleFlow');
    expect(code('src/lib/docs/roleFlow.ts')).not.toContain('localStorage');
  });

  it('the table and the flow are derived: both read the forms off the document and type no role facts', () => {
    const table = code('src/components/docs/RoleTable.tsx');
    expect(table).toContain('roleFlow(course.roles, defs)');
    expect(table).toContain('<table');
    expect(table).toContain('{row.role.mission}');
    const flow = code('src/components/diagrams/RoleFlowDiagram.tsx');
    expect(flow).toContain('roleFlowPairs(flow)');
    expect(flow).toContain('describeRoleFlow(flow, name)');
    expect(flow, 'the picture is read aloud too').toContain('aria-label="Hand-offs"');
    for (const f of [table, flow]) expect(f).not.toMatch(/handsOffTo|waitsOnFrom/);
  });

  it('the standard is written down where the architecture lives', () => {
    const arch = read('docs/ARCHITECTURE.md');
    expect(arch).toContain('### Overview standard (R104)');
    for (const rule of ['≤ 40', '≤ 15', '≤ 20', '≤ 25', 'RoleTable', 'RoleFlowDiagram']) expect(arch, rule).toContain(rule);
    expect(read('docs/courses/arch-pictures.md')).toContain('Overview standard');
  });
});

/**
 * R105 — the roles are one section, one register and one motion scale.
 * Profiles and the motion spec live in `content.roles`; every role is named
 * Function (Role) with no decorated label; the table, the picture, the
 * picker and the Home surface read the section; the picture draws from
 * the motion scale only and goes still under reduced motion.
 */
describe('R105 — roles: one section, one register, one motion scale', () => {
  it('the section replaces the role guide and every consumer reads it from the document', () => {
    expect(existsSync('src/lib/roleGuide.ts')).toBe(false);
    const dto = code('src/lib/content/dto.ts');
    expect(dto).toContain('content.roles = contentData(');
    expect(dto).not.toContain('roleGuide');
    expect(code('src/lib/content/read.ts')).toContain('export function rolesOf');
    for (const f of ['src/components/docs/RoleTable.tsx', 'src/components/diagrams/RoleFlowDiagram.tsx', 'src/components/course/JoinPanel.tsx', 'src/components/course/HomeTab.tsx']) {
      expect(code(f), f).toContain('rolesOf(useCourseDocument())');
    }
    expect(code('src/lib/types.ts')).not.toContain('label?: string;    //');
    for (const f of readdirSync('src/lib/data/seed').filter((f) => f.endsWith('.ts'))) {
      expect(code(`src/lib/data/seed/${f}`), `${f} carries a decorated label`).not.toMatch(/label: '[^\x00-\x7F]/);
    }
  });

  it('no nickname survives anywhere in the source or the hand-written docs', () => {
    const files = [...collectSourceFiles('src'), ...readdirSync('docs').filter((f) => f.endsWith('.md')).map((f) => `docs/${f}`), ...readdirSync('docs/courses').filter((f) => f.endsWith('.md')).map((f) => `docs/courses/${f}`), 'README.md', 'content/README.md'];
    const offenders = files.filter((f) => !f.endsWith('roles.test.ts') && /Runners|Wardens|Fixers/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('the picture draws from the motion scale, honours reduced motion and is focusable', () => {
    const flow = code('src/components/diagrams/RoleFlowDiagram.tsx');
    for (const needle of ['strokeDasharray', 'legend=', 'useRoleFocus(', 'data-focus', 'resolveRoleMotion(', 'useReducedMotionSafe()', 'aria-pressed', 'onKeyDown']) expect(flow, needle).toContain(needle);
    expect(flow, 'seconds come only from tokens').not.toMatch(/duration:\s*0?\.\d/);
    expect(flow).not.toContain('repeat: Infinity');
    const table = code('src/components/docs/RoleTable.tsx');
    for (const needle of ['splitRoleName(', 'resolveRoleMotion(', 'useRoleFocus(', 'data-focus']) expect(table, needle).toContain(needle);
    const resolver = code('src/lib/roleMotion.ts');
    expect(resolver).toMatch(/DUR\[|DUR\./);
    expect(resolver, 'no decimal of its own').not.toMatch(/\b0?\.\d+\b/);
    expect(code('src/components/course/JoinPanel.tsx')).toContain('profile.responsibilities');
    expect(code('src/lib/docs/package.ts')).toContain('roleFlow(meta.roles');
  });

  it('the standard is written down', () => {
    const arch = read('docs/ARCHITECTURE.md');
    expect(arch).toContain('### Role content and motion (R105)');
    expect(arch).toContain('Function (Role)');
    const readme = read('content/README.md');
    expect(readme).toContain('content.roles');
    expect(readme).toContain('## Adding a section');
    expect(read('docs/OPERATIONS.md')).toContain('(R105)');
  });
});

/**
 * R106 — the certification ladder and the cost live in one registry, reach
 * every document as `content.cert`, and are printed as tables: the Guide's
 * exam-and-cost section, the generated coverage sheets, the catalogue index.
 */
describe('R106 — the certification ladder and the cost', () => {
  it('the registry is one module per concern, written into every document and read off it', () => {
    expect(code('src/lib/docs/certs.ts')).toContain('export const CERTS');
    expect(code('src/lib/docs/certs.ts')).toContain('export const TASK_DOMAINS');
    expect(code('src/lib/docs/costs.ts')).toContain('export const COURSE_COSTS');
    const dto = code('src/lib/content/dto.ts');
    expect(dto).toContain('content.cert = contentData(');
    expect(dto).toContain('coveredWeight: coverageOf(');
    expect(code('src/lib/content/read.ts')).toContain('export function certOf');
    expect(code(GUIDE)).toContain('<CertCoverage');
    const cover = code('src/components/docs/CertCoverage.tsx');
    expect(cover).toContain('coverageOf(course, CERT, DOMAIN_OF)');
    expect(cover).toContain('data-domains');
    expect(cover).toContain('data-costs');
    expect(cover, 'the ladder comes from the document, not the registry').not.toContain('ladderOf(');
  });

  it('the sheets are generated with the content and CI diffs them', () => {
    expect(read('package.json')).toContain('tsx scripts/export-cert-sheets.ts');
    expect(read('.github/workflows/ci.yml')).toContain('docs/courses/cert-coverage/');
    expect(code('scripts/export-cert-sheets.ts')).toContain("from '../src/lib/docs/certSheet'");
    expect(existsSync('docs/courses/cert-coverage')).toBe(true);
    expect(code('src/lib/data/seed/cloudKit.ts'), 'every cloud task carries a cost').toContain("cost: t.cost ?? { usd: 0, per: 'run'");
    expect(read('docs/ARCHITECTURE.md')).toContain('### Certification ladder and cost (R106)');
    expect(read('content/README.md')).toContain('content.cert');
  });
});

/**
 * R107 — skills, tools, standards, procedures, tactics and practices live in
 * one registry each, reach every document as `content.skills`, and are read
 * off it; the framework helpers read the standards register; the sheets are
 * generated with the content and diffed by CI.
 */
describe('R107 — skills, tools, standards and the member profile', () => {
  it('the registries are one module per concern, written into every document and read off it', () => {
    expect(code('src/lib/docs/skills.ts')).toContain('export const SKILLS');
    expect(code('src/lib/docs/skills.ts')).toContain('export const TASK_SKILLS');
    expect(code('src/lib/docs/tools.ts')).toContain('export const TOOLS');
    expect(code('src/lib/docs/tools.ts')).toContain('export const WHERE_TOOLS');
    expect(code('src/lib/docs/tools.ts')).toContain('export const COURSE_TOOL_DEFAULTS');
    expect(code('src/lib/docs/standards.ts')).toContain('export const STANDARDS');
    expect(code('src/lib/docs/standards.ts')).toContain('export const CONTROLS');
    expect(code('src/lib/docs/standards.ts')).toContain('export const CONTROL_EXCEPTIONS');
    expect(code('src/lib/docs/sops.ts')).toContain('export const SOPS');
    expect(code('src/lib/docs/sops.ts')).toContain('export const DELIVERABLE_SOPS');
    expect(code('src/lib/docs/tactics.ts')).toContain('export const TACTICS');
    expect(code('src/lib/docs/tactics.ts')).toContain('export const PRACTICES');
    expect(code('src/lib/docs/metricCatalogue.ts')).toContain('export const METRICS');
    expect(code('src/lib/docs/skillsCopy.ts')).toContain('export const SKILLS_COPY');
    const dto = code('src/lib/content/dto.ts');
    expect(dto).toContain('content.skills = contentData(skillsSectionFor(');
    expect(dto).toContain('...skillsIndex(c, dto)');
    expect(code('src/lib/docs/skillsSection.ts')).toContain('TOOL_OF = toolsByTask(');
    expect(code('src/lib/content/read.ts')).toContain('export function skillsOf');
    expect(code('src/lib/content/docs.ts')).toContain('SKILL_OF: {}');
    // The projection modules are lowercase: nothing in them is a table.
    for (const f of ['src/lib/docs/skillCoverage.ts', 'src/lib/docs/skillsSection.ts', 'src/lib/docs/skillSheet.ts']) expect(code(f), f).not.toMatch(/^export const [A-Z]/m);
  });

  it('the member projection is pure: no repository, no clock, no duration, no ranking', () => {
    const src = code('src/lib/skillProfile.ts');
    expect(src).not.toMatch(/^import (?!type )[^\n]*from '\.\/data\//m);
    expect(src).not.toMatch(/localStorage|supabase|Repo\b|fetch\(/);
    expect(src).not.toMatch(/estimatedTime|parseEstimatedMinutes|Date\.now\(\)|new Date\(/);
    // R132: scores exist now, by a published method; nothing ranks one member against another.
    expect(src).not.toMatch(/\brank(ing|ed)?\b|leaderboard|badge|\bXP\b/i);
    expect(src).toContain('export function skillProfile(');
    expect(src).toContain('export function skillPortfolio(');
    expect(src).toContain('export function levelOf(');
    // The registries arrive as the document's section, never as an import.
    expect(src).not.toMatch(/^import (?!type )[^\n]*from '\.\/docs\/(skills|tools|standards|sops|tactics|metricCatalogue|skillsCopy)'/m);
    // The self-attested count means one thing everywhere: a verifiable step ticked without matching output.
    expect(code('src/lib/metrics.ts')).toContain("} else if (rec?.method === 'self-attested') {");
    expect(code('src/components/catalog/VerificationBar.tsx')).toContain('ticked without matching output');
  });

  it('the skills card sits inside the role surface, the dashboard and the portfolio read the projection, and the export is the published shape', () => {
    const home = code('src/components/course/HomeTab.tsx');
    expect(home.match(/<SkillsCard /g)?.length).toBe(1);
    const role = home.indexOf('<Surface accent="role"');
    expect(role).toBeGreaterThan(0);
    expect(home.indexOf('<SkillsCard ')).toBeGreaterThan(role);
    expect(home.indexOf('<SkillsCard ')).toBeLessThan(home.indexOf('<TeamBlock '));
    const card = code('src/components/skills/SkillsCard.tsx');
    expect(card).not.toContain('<Surface');
    expect(card).toContain('data-skills-card');
    expect(card).toContain('data-domain={r.id}');
    expect(card).toContain('skillProfile({');
    for (const page of ['src/app/dashboard/page.tsx', 'src/app/portfolio/page.tsx']) {
      expect(code(page), page).toContain('courseDocument(course.id) ?? bareDocument(course)');
      expect(code(page), page).toContain('skillProfile({');
    }
    expect(code('src/app/dashboard/page.tsx')).toContain('<DomainStrip ');
    expect(code('src/app/dashboard/page.tsx')).toContain('data-skills-by-course');
    const portfolio = code('src/app/portfolio/page.tsx');
    expect(portfolio).toContain('<SkillsSections ');
    // R109: the export is built in one place; the page only downloads it.
    expect(code('src/lib/memberExport.ts')).toContain('schema: MEMBER_PROFILE_SCHEMA');
    expect(code('src/lib/memberExport.ts')).toContain('signature: null');
    expect(code('src/lib/docs/ontology.ts')).toContain("MEMBER_PROFILE_SCHEMA = 'capstone-member-profile/3'");
    expect(code('src/app/page.tsx')).not.toContain('the output they printed');
    // The cross-course hydrate reads the four tables the profile needs and never the single-user ones.
    const cache = code('src/lib/data/supabaseCache.ts');
    const user = cache.slice(cache.indexOf('export async function hydrateUser'), cache.indexOf('export function submissionFromLightRow'));
    for (const t of ['deliverable_status', 'deliverable_submissions', 'task_reports', 'step_notes', 'deliverables', 'deliverable_review_marks', 'step_flag_events', 'step_flags', 'cohorts']) expect(user, t).toContain(`from('${t}')`);
    expect(user).not.toMatch(/lab_access|user_course_state/);
    expect(user).toContain('categories:snapshot->categories');
    // The cohort column reads the document, never the metrics loader.
    const cohort = code('src/app/instructor/[courseId]/cohort/page.tsx');
    expect(cohort).toContain('cert: certOf(courseDocument(course.id) ?? bareDocument(course))');
    expect(cohort).not.toContain('metricsLoader');
  });

  it('the framework helpers read the standards register, which holds no class string', () => {
    const utils = code('src/lib/utils.ts');
    expect(utils).toContain("from './docs/standards'");
    expect(utils).not.toMatch(/FRAMEWORK_(COLORS|LABELS|DESCRIPTIONS|WHY)/);
    expect(utils).toContain('TONE_CLASS');
    const standards = code('src/lib/docs/standards.ts');
    expect(standards).not.toMatch(/\b(bg|text)-[a-z]/);
    expect(code('src/lib/docs/manual.ts')).toContain("'server-plus':");
  });

  it('the ontology and the schemas are published with the content, and the value register is honest about status', () => {
    expect(read('package.json')).toContain('tsx scripts/export-ontology.ts');
    expect(code('scripts/export-ontology.ts')).toContain("from '../src/lib/docs/ontology'");
    expect(existsSync('content/ontology/index.json')).toBe(true);
    expect(existsSync('content/schemas/member-profile.schema.json')).toBe(true);
    expect(existsSync('content/schemas/README.md')).toBe(true);
    expect(read('.github/workflows/ci.yml'), 'content/ covers ontology and schemas').toContain('git diff --exit-code -- content/');
    expect(read('package.json'), 'no schema library: the subset validator is the contract').not.toMatch(/"(ajv|zod)"/);
    const register = read('docs/VALUE_REGISTER.md');
    for (const status of ['available now', 'needs validators', 'needs events', 'needs consent', 'needs legal change', 'Phase 4']) expect(register, status).toContain(status);
    expect(register.match(/^\| \d+ \|/gm)?.length, 'three lists of ten, plus the R108 rows (14 + 12 + 13), plus one R134 row each (15 + 13 + 14), plus one R140 row each (16 + 14 + 15)').toBe(45);
    expect(read('docs/OPERATIONS.md')).toContain('(R107)');
    expect(read('docs/CURRENT_STATE.md')).toContain('Member profile');
    expect(read('content/README.md')).toContain('ontology/');
    expect(read('README.md')).toContain('VALUE_REGISTER.md');
  });

  it('the sheets are generated with the content and CI diffs them', () => {
    expect(read('package.json')).toContain('tsx scripts/export-skill-sheets.ts');
    expect(read('.github/workflows/ci.yml')).toContain('docs/courses/skills/');
    expect(code('scripts/export-skill-sheets.ts')).toContain("from '../src/lib/docs/skillSheet'");
    expect(existsSync('docs/courses/skills')).toBe(true);
    expect(read('docs/ARCHITECTURE.md')).toContain('### Skills, tools, standards and the member profile (R107)');
    expect(read('content/README.md')).toContain('content.skills');
  });
});

/**
 * R108 — the Skill board, the KPI board, the profiles, the work roles, the
 * credential and the cohort report: the page reads the document and hands
 * props down; the pure projections read no repository, no clock and no
 * registry; the tiles keep the meter budget and the map keeps the quarry's
 * rules; the surfaces link to the board; the docs and the register say what
 * shipped and what did not (no events table, no proof on the credential).
 */
describe('R108 — the skill board, the KPI board, the profiles and the cohort report', () => {
  const PURE = ['src/lib/kpiBoard.ts', 'src/lib/skymap.ts', 'src/lib/cohortKpi.ts'];

  it('the board page reads the document once and hands props to components that never do', () => {
    const page = code('src/app/courses/[courseId]/skills/page.tsx');
    for (const needle of ['skillsOf(useCourseDocument())', 'certOf(useCourseDocument())', 'deliverablesOf(useCourseDocument())', 'kpiBoard({', 'skymapLayout(', '<CourseEnrolGate', 'active="home"', 'tintVars(course.id)', '<SkyMap ', '<KpiBoard ', '<KpiTable ']) expect(page, needle).toContain(needle);
    expect(page, 'no local components on the page').not.toMatch(/^function [A-Z]\w+\(/m);
    for (const f of ['src/components/skills/KpiBoard.tsx', 'src/components/skills/KpiTable.tsx', 'src/components/quarry/skymap/SkyMap.tsx', 'src/components/instructor/CohortKpiPanel.tsx']) {
      expect(code(f), `${f} is props-only`).not.toContain('useCourseDocument');
      expect(code(f), `${f} reads no repository`).not.toMatch(/from '@\/lib\/data'/);
    }
    expect(existsSync('src/app/courses/[courseId]/skills/loading.tsx')).toBe(true);
    expect(code('src/components/ui/Skeletons.tsx')).toContain('export function SkillBoardSkeleton');
  });

  it('the tiles keep the meter budget and read the motion preference; the map keeps the quarry rules and no literal colour', () => {
    const board = code('src/components/skills/KpiBoard.tsx');
    expect(board).toContain('useReducedMotionSafe');
    expect(board).toMatch(/DUR\.meter|\bmeter\b/);
    expect(board, 'no bespoke duration').not.toMatch(/duration:\s*0?\.\d/);
    expect(board).not.toContain('repeat:');
    expect(board).not.toContain('whileHover');
    expect(board, 'the figures count up').toContain('useCountUp(');
    const count = code('src/lib/useCountUp.ts');
    expect(count).toContain('useReducedMotionSafe()');
    expect(count).toContain('DUR.meter');
    expect(count, 'no decimal literal').not.toMatch(/\b0?\.\d+\b/);
    const sky = code('src/components/quarry/skymap/SkyMap.tsx');
    for (const n of ['useArt()', 'useReducedMotionSafe()', 'role="button"', 'data-skymap-detail', 'var(--color-term-bg)', 'SkyMapLayout']) expect(sky, n).toContain(n);
    expect(sky).not.toMatch(/Math\.random/);
    expect(sky, 'ambient motion is a CSS class the reduced-motion block stills').not.toContain('repeat: Infinity');
    for (const f of readdirSync(root('src/components/quarry/skymap'))) {
      expect(read(`src/components/quarry/skymap/${f}`), `${f} takes colours from the tint and the tokens only`).not.toMatch(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/);
    }
    expect(read('src/app/globals.css')).toContain('.skymap-halo');
  });

  it('the projections are pure: no repository, no clock, no ranking, no runtime registry import; the cohort report names nobody', () => {
    for (const f of PURE) {
      const src = code(f);
      expect(src, `${f}: no runtime data import`).not.toMatch(/^import (?!type )[^\n]*from '\.\/data\//m);
      expect(src, `${f}: no storage`).not.toMatch(/localStorage|supabase|Repo\b|fetch\(/);
      expect(src, `${f}: no clock`).not.toMatch(/estimatedTime|parseEstimatedMinutes|Date\.now\(\)|new Date\(/);
      expect(src, `${f}: no ranking`).not.toMatch(/\brank(ing|ed)?\b|leaderboard|badge|\bXP\b/i);
      expect(src, `${f}: registries arrive as values`).not.toMatch(/^import (?!type )[^\n]*from '\.\/docs\/(skills|tools|standards|sops|tactics|metricCatalogue|skillsCopy|kpis|workRoles|environmentProfile)'/m);
    }
    const cohort = code('src/lib/cohortKpi.ts');
    const shapes = cohort.slice(cohort.indexOf('export interface CohortKpiRow'), cohort.indexOf('export interface CohortKpiInput'));
    expect(shapes, 'the report carries no member').not.toMatch(/memberId|displayName/);
    expect(cohort, 'nobody is ordered by a value').not.toMatch(/\.sort\([^)]*(value|pct|sum)/);
    expect(code('src/lib/cohort.ts'), 'the marking CSV is untouched').not.toContain('kpi');
    expect(code('src/lib/kpiBoard.ts')).toContain("KPI_BOARD_SCHEMA = 'capstone-kpi-board/3'");
    // R132: a KPI may be scored by the published method; the flag is a boolean, never a bare true.
    expect(code('src/lib/docs/kpis.ts')).toContain('scored: boolean');
    expect(code('src/lib/docs/scoring.ts')).toContain('export const SCORES');
  });

  it('the surfaces link to the board, the exports carry the sixteen, and the credential admits no proof', () => {
    for (const f of ['src/components/skills/SkillsCard.tsx', 'src/components/team/EngagementStatus.tsx', 'src/app/dashboard/page.tsx']) expect(code(f), f).toContain('/skills`');
    expect(code('src/lib/search.ts')).toContain('skills:${course.id}');
    const portfolio = code('src/app/portfolio/page.tsx');
    // R127: the file a member saves is a PDF; the profile and the credential are still built for a link, which carries them as JSON.
    for (const n of ['<KpiTable ', 'sha256Text(', 'buildMemberProfile(', 'buildCredential(', 'buildRecordPdf(', 'downloadBytes(']) expect(portfolio, n).toContain(n);
    expect(portfolio, 'unsigned by construction').not.toMatch(/\bproof\s*:/);
    expect(portfolio, 'the one download helper').not.toContain('URL.createObjectURL');
    // R109: the shapes live in the shared builder.
    const exp = code('src/lib/memberExport.ts');
    for (const n of ['signature: null', 'kpis: r.board.kpis', 'workRoles: r.workRoles', 'OpenBadgeCredential']) expect(exp, n).toContain(n);
    expect(exp, 'unsigned by construction').not.toMatch(/\bproof\s*:/);
    expect(read('content/schemas/credential.schema.json')).not.toContain('"proof"');
    expect(code('src/components/ui/PageHeader.tsx'), 'a third button wraps at phone width').toContain('max-w-full');
    const cache = code('src/lib/data/supabaseCache.ts');
    const user = cache.slice(cache.indexOf('export async function hydrateUser'), cache.indexOf('export function submissionFromLightRow'));
    expect(user).toContain("from('deliverable_reviews')");
  });

  it('the cohort page folds the sixteen per cohort through the loader, never the caller’s cache', () => {
    const page = code('src/app/instructor/[courseId]/cohort/page.tsx');
    for (const n of ['<CohortKpiPanel ', 'cohortKpiCsv(', 'cohortKpiReport({', 'statusFor: (t) => data.status[t]', 'artifactsFor: (m) => data.artifacts[m]']) expect(page, n).toContain(n);
    expect(page).not.toContain('AdminGate');
    const loader = code('src/lib/data/cohortLoader.ts');
    expect(loader).toContain("supabase.from('deliverable_status').select('*').eq('course_id', course.id)");
    expect(loader).toContain("supabase.from('evidence_artifacts').select('*').eq('course_id', course.id)");
    expect(loader).not.toMatch(/\bcache\b|hydrateCourse/);
  });

  it('the docs and the register say what shipped: no events table, the contract and the schemas published with the content', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### The KPI board, profiles and work roles (R108)');
    expect(read('docs/OPERATIONS.md')).toContain('(R108)');
    expect(read('docs/CURRENT_STATE.md')).toContain('KPI board');
    expect(read('docs/VALUE_REGISTER.md')).toContain('capstone-kpi-board/3');
    expect(read('content/README.md')).toContain('profiles/');
    expect(read('content/schemas/README.md')).toContain('kpi-board.schema.json');
    expect(existsSync('docs/EVENTS.md')).toBe(true);
    expect(read('docs/EVENTS.md')).toContain('no dual-write');
    expect(existsSync('supabase/migrations/0013_events.sql'), 'the log is a contract this round, not a table').toBe(false);
    expect(read('package.json')).toContain('tsx scripts/export-profiles.ts');
    for (const f of ['kpi-board', 'work-role', 'environment-profile', 'credential', 'event']) expect(existsSync(`content/schemas/${f}.schema.json`), f).toBe(true);
    expect(existsSync('content/profiles/sample-mssp.json')).toBe(true);
    expect(existsSync('content/ontology/kpis.json')).toBe(true);
    expect(existsSync('content/ontology/work-roles.json')).toBe(true);
  });
});

/**
 * R109 — the KPI pack and the DTO chips: the sixteen KPIs and their DTOs in a
 * compact form on the course Home and on every dashboard card, off the same
 * board; the member profile and the credential built in one pure module both
 * pages share; the pack keeps the meter budget, reads the motion preference,
 * draws with the tint tokens and adds no eyebrow.
 */
describe('R109 — the KPI pack and the DTO chips', () => {
  it('the pack and the chip are props-only, keep the meter budget, read the motion preference, and add no eyebrow or hex', () => {
    for (const f of ['src/components/skills/KpiPack.tsx', 'src/components/skills/DtoChip.tsx', 'src/components/ui/CopyButton.tsx']) {
      expect(code(f), `${f} is props-only`).not.toContain('useCourseDocument');
      expect(code(f), `${f} reads no repository`).not.toMatch(/from '@\/lib\/data'/);
      expect(code(f), `${f} adds no eyebrow (the cap is full)`).not.toMatch(/\beyebrow(-muted)?\b/);
      expect(read(f), `${f} takes colours from the tokens only`).not.toMatch(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/);
    }
    const pack = code('src/components/skills/KpiPack.tsx');
    for (const n of ['useReducedMotionSafe()', 'useCountUp(', 'transition={meter}', 'initial={reduce ? false', '@container', 'data-kpi-pack', 'data-kpi-readout', 'data-kpi-family', 'data-skill-board-link', 'aria-pressed', 'qa-breathe', 'ArrowRight']) expect(pack, n).toContain(n);
    expect(pack, 'no bespoke duration').not.toMatch(/duration:\s*0?\.\d/);
    expect(pack).not.toContain('repeat:');
    expect(pack).not.toContain('whileHover');
    expect(pack, 'the tint comes from the surface, as the seal ledger beside it').not.toContain('tintVars');
    expect(pack, 'Enter pins; the header link navigates').not.toContain('useRouter');
    expect(pack).not.toContain('<Surface');
    expect(pack).not.toMatch(/animate=\{\{[^}]*\bwidth:/);
    const chip = code('src/components/skills/DtoChip.tsx');
    // R127: the chip copies JSON for an agent and hands a PDF to the browser through the page; it saves no JSON file of its own.
    for (const n of ['<CopyButton ', 'onPdf', 'data-dto-chip', 'data-dto-pdf']) expect(chip, n).toContain(n);
    for (const bad of ['downloadText(', "'application/json'", 'data-export-credential', 'onCredential']) expect(chip, bad).not.toContain(bad);
    expect(chip, 'no JSON printed inline').not.toContain('<pre');
    expect(chip, 'schema ids are case-sensitive; PixelBadge uppercases').not.toContain('PixelBadge');
    const block = code('src/components/step/CommandBlock.tsx');
    expect(block).toContain("from '@/components/ui/CopyButton'");
    expect(block).not.toContain('export function CopyButton');
  });

  it('both surfaces mount the pack and the chip off one board, and Home hands the crew down', () => {
    const card = code('src/components/skills/SkillsCard.tsx');
    for (const n of ['<KpiPack ', '<DtoChip ', 'kpiBoard({', 'defaultMeasure(', 'isCapstoneFiled(', 'data-abilities']) expect(card, n).toContain(n);
    expect(card).not.toContain('<Surface');
    expect(card.match(/data-skill-board-link/g), 'the link lives in the pack').toBeNull();
    expect(code('src/components/course/HomeTab.tsx')).toMatch(/<SkillsCard [^>]*crew=\{crew\}/);
    const dash = code('src/app/dashboard/page.tsx');
    for (const n of ['<KpiPack ', '<DtoChip ', 'kpiBoard({', 'defaultMeasure(', 'sumKpi(', 'buildMemberProfile(', 'buildCredential(', 'profileJson(', 'sha256Text(', 'buildRecordPdf(', 'downloadBytes(', 'tiles.commandsVerified', 'tiles.proceduresToStandard']) expect(dash, n).toContain(n);
    // R126: the figures are a strip of buttons now; the four columns live in the strip.
    expect(code('src/components/skills/RecordStrip.tsx'), 'lg:grid-cols-4').toContain('lg:grid-cols-4');
    // R126: eight tiles became twelve, each a button in the strip, defined once in the page as { id, icon, label, value, sub }.
    expect(dash.match(/\bid: '[a-z-]+'(?: as const)?,\s*icon:/g)?.length, 'twelve record tiles').toBe(12);
    expect(dash).not.toContain('function Mini(');
    expect(dash.match(/data-skill-board-link/g), 'the link lives in the pack').toBeNull();
    expect(dash).not.toMatch(/\bproof\s*:/);
    expect(dash).not.toContain('URL.createObjectURL');
  });

  it('the export builder is pure and the pages share it', () => {
    const src = code('src/lib/memberExport.ts');
    expect(src, 'no runtime data import').not.toMatch(/^import (?!type )[^\n]*from '\.\/data\//m);
    expect(src, 'no storage, no window').not.toMatch(/localStorage|supabase|Repo\b|fetch\(|window\.|document\./);
    expect(src, 'no clock: the page stamps the export').not.toMatch(/Date\.now\(\)|new Date\(|toISOString/);
    expect(src, 'no ranking').not.toMatch(/\brank(ing|ed)?\b|leaderboard|\bbadge[sd]?\b|\bXP\b/i);
    for (const n of ['export function buildMemberProfile(', 'export function buildCredential(', 'export function profileJson(', 'generatedAt: input.generatedAt']) expect(src, n).toContain(n);
    const board = code('src/lib/kpiBoard.ts');
    expect(board).toContain('export function sumKpi(');
    expect(board).toContain('export function defaultMeasure(');
    for (const f of ['src/app/portfolio/page.tsx', 'src/app/courses/[courseId]/skills/page.tsx', 'src/components/skills/SkillsCard.tsx', 'src/app/dashboard/page.tsx', 'src/lib/cohortKpi.ts']) {
      expect(code(f), `${f}: one sentinel, in kpiBoard.ts`).not.toContain("id: 'role.none'");
    }
    expect(code('src/lib/schema/schemas.test.ts'), 'the schema test validates the real builder').toContain('buildMemberProfile(');
  });

  it('the copy carries the pack words and the docs say what shipped', () => {
    const copy = code('src/lib/docs/skillsCopy.ts');
    for (const n of ['packTitle:', 'packIdle:', 'packKeys:', 'familyShort:', 'commandsVerified:', 'proceduresToStandard:', 'recordCommands:', 'recordProcedures:']) expect(copy, n).toContain(n);
    expect(read('docs/ARCHITECTURE.md')).toContain('### The KPI pack and the DTO chips (R109)');
    expect(read('docs/OPERATIONS.md')).toContain('(R109)');
    expect(read('docs/CURRENT_STATE.md')).toContain('KPI pack');
    expect(read('docs/VALUE_REGISTER.md')).toContain('KpiPack');
  });
});

/**
 * R110 — the acceptance gate, consent and outcomes: the agreements carry the
 * sandbox and liability clause at version 2 and the AUP has a page; the gate
 * lets the legal pages be read and names what changed; the log records which
 * text was accepted; consent and outcomes are append-only, personal, and the
 * only aggregate is a floored count; the legal pages say so.
 */
describe('R110 — the acceptance gate, consent and outcomes', () => {
  it('the agreements say sandbox and liability at version 2, and the AUP has its own public page', () => {
    const reg = code('src/lib/legal/agreements.ts');
    for (const id of ['terms', 'aup', 'lab', 'privacy']) expect(reg, `${id} is at version 2`).toMatch(new RegExp(`id: '${id}',\\s*version: 2`));
    expect(reg).toContain("link: '/legal/aup'");
    expect(reg).toContain('sandbox you control');
    expect(reg).toContain('not liable for any cause, implementation, overcharge, misuse or consequence');
    expect(code('src/app/legal/aup/page.tsx')).toContain('<LegalPage');
    expect(code('src/app/legal/aup/page.tsx')).toContain('Costs, misuse and consequences');
    expect(code('src/app/sitemap.ts')).toContain("'/legal/aup'");
    expect(code('src/components/SiteFooter.tsx')).toContain('/legal/aup');
    for (const f of ['src/app/login/page.tsx', 'src/app/register/page.tsx']) expect(code(f), f).toContain('/legal/aup');
    const terms = code('src/app/legal/terms/page.tsx');
    expect(terms).toContain('Sandbox and liability');
    expect(terms, 'explicit re-acceptance, not use-as-acceptance').not.toContain('Continuing to use the service after a change');
    expect(terms).toContain('presented again at your next sign-in');
    const privacy = code('src/app/legal/privacy/page.tsx');
    for (const n of ['Consent grants', 'Links you create', 'Google or GitHub', 'never the pasted']) expect(privacy, n).toContain(n);
  });

  it('the gate lets the legal pages be read, names what changed, and the log records the text', () => {
    const gate = code('src/components/legal/AgreementGate.tsx');
    expect(gate).toContain('usePathname()');
    expect(gate).toContain("startsWith('/legal')");
    expect(gate).toContain('AGREEMENTS.length');
    expect(gate).not.toContain('Five short agreements');
    expect(gate).toContain('missing.map((a) => a.title)');
    const acc = code('src/lib/legal/acceptances.ts');
    expect(acc).toContain('text_sha256');
    expect(acc).toContain('export function agreementTextHash(');
    expect(acc).toContain('export async function fetchCloudAcceptanceLog(');
    expect(code('src/components/auth/ImportPrompt.tsx'), 'offline acceptances carry over at first sign-in').toContain('acceptInCloud(');
    expect(code('src/app/account/page.tsx')).toContain('agreements,');
  });

  it('consent and outcomes are append-only and personal, and the only aggregate is floored', () => {
    const sql = read('supabase/migrations/0013_consent_outcomes.sql');
    const lower = sql.toLowerCase();
    for (const n of ['text_sha256', 'consent_grants', 'learner_outcomes', 'outcome_counts', 'has_consent', 'n.total >= 5', 'clock_timestamp()']) expect(sql, n).toContain(n);
    expect(lower).not.toMatch(/create policy [^;]*(consent_grants|learner_outcomes) for (update|delete)/);
    expect(lower, 'no instructor read on either table').not.toMatch(/create policy [^;]*(consent_grants|learner_outcomes) for select[^;]*is_instructor/);
    expect(sql).toContain("grant_id in ('share-employer', 'benchmark', 'outcome')");
    expect(sql, 'the consent helper is the platform’s').toContain('revoke execute on function public.has_consent(uuid, text) from public, anon, authenticated');
    expect(existsSync('supabase/migrations/0013_events.sql'), 'the events table is still a later round').toBe(false);
    const consents = code('src/lib/legal/consents.ts');
    expect(consents).toContain("'share-employer' | 'benchmark' | 'outcome'");
    expect(consents, 'no training grant').not.toMatch(/'train'/);
    expect(code('src/lib/legal/outcomes.ts')).toContain('OUTCOME_K = 5');
    expect(code('src/components/account/ConsentSection.tsx')).toContain('data-consent-grant');
    expect(code('src/components/account/OutcomesSection.tsx')).toContain('data-outcome-form');
    expect(code('src/app/instructor/[courseId]/cohort/page.tsx')).toContain('<OutcomesLine ');
    expect(code('src/components/instructor/OutcomesLine.tsx'), 'props only').not.toMatch(/from '@\/lib\/data'/);
    const rls = read('supabase/tests/rls.sql');
    for (const a of ['ada consented as bob', 'ada rewrote her consent log', 'ivy: the k floor holds below five answers', 'the owner rewrote a consent row']) expect(rls, a).toContain(a);
    expect(code('src/lib/docs/metricCatalogue.ts')).toMatch(/m\('outcome-placement'[^\n]*'computed'/);
  });

  it('the docs say what shipped and that the wording awaits counsel', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### Consent, outcomes and the acceptance gate (R110)');
    expect(read('docs/OPERATIONS.md')).toContain('(R110)');
    expect(read('docs/CURRENT_STATE.md')).toContain('counsel review');
    expect(read('SUPABASE_SETUP.md')).toContain('consent_grants');
    expect(read('SUPABASE_SETUP.md')).toContain('outcome_counts');
  });
});

/**
 * R111 — attribution and currency: the projection reads the page's clock and
 * no other, the role's share rides on the indicators and the board, and the
 * surfaces print it where it differs; rows know when they were last proved.
 */
describe('R111 — attribution and currency', () => {
  it('the projection takes the page clock, never its own, and carries the role share and the RACI moves', () => {
    const src = code('src/lib/skillProfile.ts');
    expect(src).toContain('asOf?: number');
    expect(src).toContain('export const CURRENT_WINDOW_DAYS = 180');
    expect(src, 'never defaults the clock inside the module').not.toMatch(/asOf\s*\?\?\s*Date|Date\.now\(\)/);
    for (const n of ['lastVerifiedAt', 'current:', 'own: dodOver(draftForms)', 'own: controlOver(draftForms)', 'own: approvedOver(draftForms)', 'raciRespected: teamOr(', 'draftedForms:']) expect(src, n).toContain(n);
    // R132: a duration is the difference of two recorded stamps; the module still reads no clock.
    expect(read('src/lib/skillProfile.ts'), 'the docblock says what timestamps are for').toContain('the difference of two stamps the platform recorded');
    const board = code('src/lib/kpiBoard.ts');
    expect(board).toContain('contribution?: { value: number; of: number }');
    expect(board, 'an unloaded team fact attributes nothing').toContain('v.contribution && v.loaded');
  });

  it('every surface passes the page clock and prints the share and the currency', () => {
    expect(code('src/components/skills/SkillsCard.tsx')).toContain('useState(() => Date.now())');
    expect(code('src/app/courses/[courseId]/skills/page.tsx')).toContain('useState(() => Date.now())');
    for (const f of ['src/app/dashboard/page.tsx', 'src/app/portfolio/page.tsx']) expect(code(f), f).toContain('asOf: Date.now()');
    expect(code('src/components/skills/KpiPack.tsx')).toContain('copy.contribution');
    expect(code('src/components/skills/KpiBoard.tsx')).toContain('data-contribution');
    expect(code('src/components/skills/KpiTable.tsx')).toContain('copy.contributionColumn');
    expect(code('src/components/skills/SkillsSections.tsx')).toContain('data-last-verified');
    expect(code('src/app/dashboard/page.tsx')).toContain('currentSkills');
    expect(code('src/lib/memberExport.ts')).toContain('copy.board.contribution');
    expect(code('src/components/skills/SkillsCard.tsx')).toContain("'raciRespected'");
  });

  it('the schemas carry the new fields and the docs keep their sections', () => {
    const sp = read('content/schemas/skill-profile.schema.json');
    for (const n of ['"own"', '"lastVerifiedAt"', '"current"', '"draftedForms"', '"raciRespected"']) expect(sp, n).toContain(n);
    expect(read('content/schemas/kpi-board.schema.json')).toContain('"contribution"');
    expect(read('content/schemas/member-profile.schema.json')).toContain('"contribution"');
    const arch = read('docs/ARCHITECTURE.md');
    expect(arch).toContain('### Attribution and currency (R111)');
    expect(arch, 'the MSP bridge keeps its own heading').toMatch(/^## 7\. The MSP \/ business bridge/m);
    expect(read('docs/OPERATIONS.md')).toContain('(R111)');
    expect(read('docs/CURRENT_STATE.md')).toContain('Attribution and currency');
  });
});

/**
 * R112 — the funnel and the step friction map: pure aggregates that name
 * nobody, an instructor page on the cohort loader, props-only panels, and a
 * loader that reads past the row cap.
 */
describe('R112 — the funnel and the step friction map', () => {
  it('the two reports are pure and carry nobody', () => {
    for (const f of ['src/lib/funnel.ts', 'src/lib/friction.ts']) {
      const src = code(f);
      expect(src, `${f}: no runtime data import`).not.toMatch(/^import (?!type )[^\n]*from '\.\/data\//m);
      expect(src, `${f}: no storage`).not.toMatch(/localStorage|supabase|Repo\b|fetch\(/);
      expect(src, `${f}: no clock`).not.toMatch(/Date\.now\(\)|new Date\(|estimatedTime/);
      expect(src, `${f}: no ranking`).not.toMatch(/\brank(ing|ed)?\b|leaderboard|\bscore[sd]?\b|badge|\bXP\b/i);
    }
    const funnel = code('src/lib/funnel.ts');
    const fShapes = funnel.slice(funnel.indexOf('export interface FunnelGroup'), funnel.indexOf('export interface FunnelInput'));
    expect(fShapes, 'the funnel carries no member').not.toMatch(/memberId|displayName/);
    const friction = code('src/lib/friction.ts');
    const xShapes = friction.slice(friction.indexOf('export interface FrictionRow'), friction.indexOf('export interface FrictionInput'));
    expect(xShapes, 'the friction map carries no member').not.toMatch(/memberId|displayName/);
    expect(code('src/lib/course-helpers.ts')).toContain('export function gradedWeeksCleared(');
    expect(code('src/lib/cohortKpi.ts')).toContain('gradedWeeksCleared(');
  });

  it('the page reads the whole course through the loader and hands props to panels that never read data', () => {
    const page = code('src/app/instructor/[courseId]/effectiveness/page.tsx');
    for (const n of ['loadCohort(', 'funnelReport({', 'frictionReport({', 'funnelCsv(', 'frictionCsv(', '<FunnelPanel ', '<FrictionPanel ']) expect(page, n).toContain(n);
    expect(page).not.toContain('AdminGate');
    expect(page).not.toContain('metricsLoader');
    for (const f of ['src/components/instructor/FunnelPanel.tsx', 'src/components/instructor/FrictionPanel.tsx']) {
      expect(code(f), `${f} is props-only`).not.toMatch(/from '@\/lib\/data'/);
      expect(code(f), f).not.toContain('useCourseDocument');
    }
    expect(code('src/components/instructor/FrictionPanel.tsx'), 'a candidate is an icon and a word').toContain('Rewrite candidate');
    expect(existsSync('src/app/instructor/[courseId]/effectiveness/loading.tsx')).toBe(true);
    expect(code('src/app/instructor/page.tsx')).toContain('/effectiveness`}');
  });

  it('the loader pages past the row cap and keeps its pinned selects', () => {
    const loader = code('src/lib/data/cohortLoader.ts');
    expect(loader).toContain('selectAll(');
    expect(loader).toContain("supabase.from('step_completions').select('*').eq('course_id', course.id)");
    expect(loader).toContain("supabase.from('step_evidence').select('*').eq('course_id', course.id)");
    expect(code('src/lib/data/selectAll.ts')).toContain('PAGE_ROWS = 1000');
    expect(read('docs/ARCHITECTURE.md')).toContain('### The funnel and the step friction map (R112)');
    expect(read('docs/OPERATIONS.md')).toContain('(R112)');
    expect(read('docs/CURRENT_STATE.md')).toContain('Funnel and step friction');
  });
});

/**
 * R113 — verification receipts: the platform issues the stamp and logs the
 * receipt, the paste never leaves the browser, and nothing claims the machine.
 */
describe('R113 — stamps, receipts and re-hash checks', () => {
  const MIGRATIONS = readdirSync(root('supabase/migrations')).filter((f) => f.endsWith('.sql'));
  // R114 adds the two link functions: they answer the preflight the same way.
  const FUNCTIONS = ['delete-account', 'report-notify', 'stamp', 'receipt', 'share', 'shared-profile'];

  it('stamps are the platform’s alone, receipts are written by nobody but the function, and both stay frozen', () => {
    const sql = read('supabase/migrations/0014_verification_receipts.sql');
    for (const n of ['verification_stamps', 'verification_receipts', 'rehash_checks', 'unique (stamp_id, step_id)', "stamp ~ '^CQ-[A-HJKMNP-TV-Z2-9]{6}$'", 'before update on public.verification_receipts', 'before update on public.rehash_checks']) expect(sql, n).toContain(n);
    expect(sql, 'the 0003 honesty note ships with the tables').toContain('does not prove a command ran on a real machine');
    for (const f of MIGRATIONS) {
      const lower = read(`supabase/migrations/${f}`).toLowerCase();
      expect(lower, `${f}: no policy at all on stamps`).not.toMatch(/create policy [^;]*on public\.verification_stamps/);
      expect(lower, `${f}: no client writes a receipt`).not.toMatch(/create policy [^;]*on public\.verification_receipts for (insert|update|delete|all)/);
      expect(lower, `${f}: a re-hash check is never rewritten`).not.toMatch(/create policy [^;]*on public\.rehash_checks for (update|delete|all)/);
    }
    expect(existsSync('supabase/migrations/0013_events.sql'), 'the events table is still a later round').toBe(false);
    const rls = read('supabase/tests/rls.sql');
    for (const a of ['ada: no stamp rows, not even her own', 'ada wrote her own receipt', "bob: reads his teammate''s receipt", "cy: never another team''s receipts", 'the owner rewrote a receipt', 'one stamp receipted one step twice']) expect(rls, a).toContain(a);
  });

  it('every function answers the preflight, and the receipt function cannot accept pasted text', () => {
    for (const f of FUNCTIONS) {
      const src = code(`supabase/functions/${f}/index.ts`);
      expect(src, `${f} uses the shared CORS helper`).toContain("from '../_shared/cors.ts'");
      expect(src, `${f} answers OPTIONS before auth`).toContain('preflight(req, origin)');
      expect(src, `${f}: every reply carries the headers`).not.toContain('new Response(');
    }
    const receipt = code('supabase/functions/receipt/index.ts');
    expect(receipt).toContain('receiptProblem(body)');
    expect(receipt, 'no text field is ever read').not.toMatch(/\.(output|snapshot|paste|text)\b|\[['"](output|snapshot|paste|text)['"]\]/);
    const codec = code('supabase/functions/_shared/stampCodec.ts');
    expect(codec, 'unknown fields are refused, not ignored').toContain('RECEIPT_KEYS');
    expect(codec, 'pure: no Deno API').not.toContain('Deno.');
    const stamp = code('supabase/functions/stamp/index.ts');
    expect(stamp, 'the caller comes from the token').toContain('asCaller.auth.getUser()');
    expect(stamp, 'only a member of the course gets a stamp').toContain("'not-enrolled'");
    const ci = read('.github/workflows/ci.yml');
    expect(ci).toContain('deno test --no-config supabase/functions/_shared');
    expect(ci).toContain('deno check --no-config supabase/functions/*/index.ts');
    const setup = read('SUPABASE_SETUP.md');
    for (const n of ['verification_receipts', 'rehash_checks', 'APP_ORIGIN']) expect(setup, n).toContain(n);
  });

  it('the client asks for the server stamp, falls back to the client stamp, and never sends the paste', () => {
    const how = code('src/components/step/StepHow.tsx');
    expect(how).toContain('useServerStamp(');
    expect(how, 'the R84 fallback survives').toContain('taskToken(ledger.memberId, courseId, ledger.taskId)');
    const runner = code('src/components/task/GuidedTaskRunner.tsx');
    for (const n of ['useServerStamp(', 'refreshStamp(', 'taskToken(memberId, courseId, task.id)', 'Your stamp:', 'data-stamp={stamp}', 'Not proof of the machine.']) expect(runner, n).toContain(n);
    const verify = code('src/components/step/OutputVerify.tsx');
    expect(verify).toContain('Not receipted');
    const call = verify.slice(verify.indexOf('requestReceipt({'), verify.indexOf('})', verify.indexOf('requestReceipt({')));
    expect(call.length).toBeGreaterThan(20);
    expect(call, 'the receipt request carries no paste').not.toMatch(/\b(snapshot|text)\b/);
    const stamps = code('src/lib/stamps.ts');
    const body = stamps.slice(stamps.indexOf("invoke('receipt'"), stamps.indexOf('});', stamps.indexOf("invoke('receipt'")));
    for (const k of ['courseId', 'taskId', 'stepId', 'stamp', 'outputSha256', 'matchedTokens', 'totalTokens']) expect(body, k).toContain(`${k}: r.${k}`);
    expect(body.match(/:\s*r\./g)?.length, 'exactly the seven fields the function accepts').toBe(7);
    expect(stamps, 'only the signed-in member is ever asked for').toContain('getCurrentUserId() === userId');
  });

  it('receipts are read, stamps never are, and a re-hash check never rewrites the artifact', () => {
    const cache = code('src/lib/data/supabaseCache.ts');
    expect(cache).toContain("from('verification_receipts')");
    expect(cache).toContain("from('rehash_checks')");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(root(dir))) {
        const p = `${dir}/${f}`;
        if (statSync(root(p)).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && read(p).includes("from('verification_stamps')")) offenders.push(p);
      }
    };
    walk('src');
    expect(offenders, 'no client reads a stamp row').toEqual([]);
    const ledger = code('src/app/courses/[courseId]/ledger/page.tsx');
    expect(ledger).toContain('evidenceRepo.saveRehash(');
    expect(ledger, 'the hash time of the artifact stays').not.toContain('saveArtifact(');
    for (const f of ['src/components/docs/EvidenceHasher.tsx', 'src/components/docs/WeekEvidencePackager.tsx']) {
      expect(code(f), f).toContain("from '@/lib/hashFile'");
      expect(code(f), `${f}: one digest helper`).not.toContain('crypto.subtle.digest');
    }
    const catalogue = code('src/lib/docs/metricCatalogue.ts');
    expect(catalogue).toMatch(/m\('verified-receipted'[^\n]*'computed'/);
    expect(catalogue).toMatch(/m\('evidence-rehash-confirmed'[^\n]*'computed'/);
    expect(code('src/lib/skillProfile.ts'), 'offline prints a dash, never a zero').toContain('receipted: input.receipts ?');
  });

  it('the first validator reads the paste as state, stays pure, and the docs say what it is and is not', () => {
    const v = code('src/lib/docs/validators.ts');
    expect(v).toContain('export interface Validator');
    expect(v).toContain("id: 'ufw-least-privilege'");
    expect(v, 'pure').not.toMatch(/Date\.now\(\)|localStorage|supabase|fetch\(/);
    expect(read('src/lib/types.ts')).toContain('validator?: { id: string; params?: Record<string, unknown> }');
    expect(code('src/components/step/OutputVerify.tsx')).toContain('runValidator(validator, text)');
    expect(code('src/components/step/StepHow.tsx')).toContain('validator={step.validator}');
    expect(read('src/components/step/OutputVerify.tsx'), 'the honest limit ships with the panel').toContain('not proof of the machine');
    expect(read('docs/ARCHITECTURE.md')).toContain('### Verification receipts, re-hash checks and the first validator (R113)');
    expect(read('docs/CURRENT_STATE.md')).toContain('Server stamps and verification receipts');
    expect(read('docs/OPERATIONS.md')).toContain('(R113)');
    const setup = read('SUPABASE_SETUP.md');
    for (const n of ['supabase functions deploy stamp', 'supabase functions deploy receipt', 'A receipt records the stamp, not the machine']) expect(setup, n).toContain(n);
  });
});

/**
 * R114 — candidate links: a frozen, unsigned copy for whoever holds an
 * unguessable, expiring, revocable link; identity stays out of the copy and
 * the token stays out of every log.
 */
describe('R114 — candidate links and employer profiles', () => {
  it('only the platform creates a link, the owner never reads the copy back, and a revocation is final', () => {
    const sql = read('supabase/migrations/0015_profile_shares.sql');
    const lower = sql.toLowerCase();
    for (const n of ['revoke all on public.profile_shares from anon, authenticated', 'grant update (revoked_at) on public.profile_shares to authenticated', "interval '90 days'", 'a revoked link stays revoked', 'new.revoked_at := now()', 'environment_profiles']) expect(sql, n).toContain(n);
    expect(lower, 'no client insert policy').not.toMatch(/create policy [^;]*on public\.profile_shares for (insert|all)/);
    expect(sql, 'the owner may not read the copy or the token hash').not.toMatch(/grant select \([^)]*(snapshot|token_hash)/);
    expect(existsSync('supabase/migrations/0013_events.sql'), 'the events table is still a later round').toBe(false);
    const rls = read('supabase/tests/rls.sql');
    for (const a of ['ada read the frozen copy back', 'ada created a link without the function', 'the revocation carries the database clock', "ivy: no instructor reads a member''s links", 'a member published an employer profile']) expect(rls, a).toContain(a);
  });

  it('the functions keep identity out of the copy and the token out of storage and logs', () => {
    const share = code('supabase/functions/share/index.ts');
    for (const n of ["'share-employer'", 'shareProblem(body)', 'withSubject(', 'newToken()', 'token_hash: await sha256HexText(token)']) expect(share, n).toContain(n);
    const insert = share.slice(share.indexOf(".from('profile_shares')"), share.indexOf('.select('));
    expect(insert, 'the token itself is never stored').not.toMatch(/\btoken:/);
    const reader = code('supabase/functions/shared-profile/index.ts');
    for (const n of [".eq('token_hash'", ".is('revoked_at', null)", ".gt('expires_at'", "'Cache-Control': 'no-store'"]) expect(reader, n).toContain(n);
    for (const f of ['share', 'shared-profile']) expect(code(`supabase/functions/${f}/index.ts`), `${f} logs nothing`).not.toMatch(/console\./);
    const guard = code('supabase/functions/_shared/shareGuard.ts');
    expect(guard).toContain("['memberId', 'userId', 'user_id', 'email', 'teamId', 'submittedBy']");
    expect(guard, 'pure').not.toContain('Deno.');
    const setupGuide = read('SUPABASE_SETUP.md');
    expect(setupGuide, 'the link reader deploys like every other function').toContain('supabase functions deploy shared-profile');
    expect(setupGuide, 'the JWT check accepts the public key a signed-out reader sends, so no flag').not.toContain('--no-verify-jwt');
  });

  it('the token rides in the fragment, the page reads no data layer and is never indexed, and links degrade softly', () => {
    const shares = code('src/lib/shares.ts');
    expect(shares).toContain('/share#${token}');
    expect(shares, 'only the granted columns are listed').toContain(".select('id, kind, label, measured_against, created_at, expires_at, revoked_at')");
    expect(shares).toContain("from '../../supabase/functions/_shared/shareGuard'");
    for (const f of ['src/app/share/page.tsx', 'src/components/share/SharedProfile.tsx']) expect(code(f), `${f} never reads the data layer`).not.toMatch(/from '@\/lib\/data'/);
    expect(code('src/app/share/page.tsx')).toContain('robots: { index: false, follow: false }');
    expect(code('src/app/robots.ts')).toContain("'/share'");
    expect(code('src/proxy.ts')).toContain("request.nextUrl.pathname === '/share'");
    const account = code('src/app/account/page.tsx');
    expect(account).toContain('<LinksSection />');
    expect(account, 'deleting the account removes the copies too').toContain("'profile_shares'");
    expect(account, 'a project without 0015 still deletes').toContain('missingTable(error)');
    expect(code('src/components/account/LinksSection.tsx'), 'hidden where links cannot exist').toContain('if (!rows) return null;');
    for (const f of ['src/app/dashboard/page.tsx', 'src/app/portfolio/page.tsx']) {
      expect(code(f), `${f} shares under the display name`).toContain("subject: profile?.displayName?.trim() || 'Capstone Quarry member'");
      expect(code(f), `${f}: cloud only`).toMatch(/isSupabaseConfigured\(\)/);
    }
  });

  it('instructors publish employer profiles, validated on publish and read, and the board is measured against them', () => {
    const page = code('src/app/instructor/profiles/page.tsx');
    for (const n of ['publishProfile(', 'removeProfile(', 'usePublishedProfiles()']) expect(page, n).toContain(n);
    expect(code('src/app/instructor/page.tsx')).toContain('href="/instructor/profiles"');
    const lib = code('src/lib/employerProfiles.ts');
    expect(lib, 'validated again on read').toContain('readProfileFile(JSON.stringify(r.profile');
    expect(lib).toContain("from('environment_profiles')");
    const board = code('src/app/courses/[courseId]/skills/page.tsx');
    for (const n of ['usePublishedProfiles()', 'profileMeasure(p.profile, workRoleIds)', 'measuredAgainst={measure.label}']) expect(board, n).toContain(n);
    expect(read('supabase/migrations/0015_profile_shares.sql')).toContain("check (id ~ '^profile\\.[a-z0-9][a-z0-9-]{0,79}$')");
    expect(code('src/app/portfolio/page.tsx')).toContain("'Private to you until you create a link.'");
    expect(read('docs/ARCHITECTURE.md')).toContain('### Candidate links and employer profiles (R114)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Candidate links |');
    expect(read('docs/OPERATIONS.md')).toContain('(R114)');
    const register = read('docs/VALUE_REGISTER.md');
    expect(register.match(/^\| \d+ \|/gm)?.length).toBe(45);
    expect(register).toContain('member-created link');
  });
});

describe('R115 — the functions deploy from the browser', () => {
  const FUNCTIONS = ['delete-account', 'report-notify', 'stamp', 'receipt', 'share', 'shared-profile'];

  it('every function reads the keys Supabase injects, so no secret has to be set', () => {
    for (const f of FUNCTIONS) {
      const src = code(`supabase/functions/${f}/index.ts`);
      expect(src, `${f} picks the project key`).toContain('projectKey(');
      expect(src, `${f} imports the picker`).toContain("from '../_shared/env.ts'");
      expect(src, `${f} reads no hand-set key`).not.toMatch(/Deno\.env\.get\('(SERVICE_ROLE_KEY|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)'\)/);
      expect(src, `${f}: a missing key is an answer, never a crash`).not.toMatch(/Deno\.env\.get\([^)]*\)!/);
    }
    const env = code('supabase/functions/_shared/env.ts');
    expect(env, 'pure: no Deno API').not.toContain('Deno.');
    for (const n of ["'SUPABASE_SECRET_KEYS'", "'SUPABASE_PUBLISHABLE_KEYS'", "'SUPABASE_SERVICE_ROLE_KEY'", "'SUPABASE_ANON_KEY'", "'SERVICE_ROLE_KEY'"]) expect(env, n).toContain(n);
    expect(code('src/lib/shares.ts'), 'a function without keys reads as not set up').toContain("code === 'not-configured'");
  });

  it('each function has a paste-ready copy, type-checked in CI and kept out of the app build', () => {
    for (const f of FUNCTIONS) expect(existsSync(`supabase/dashboard/${f}.ts`), `supabase/dashboard/${f}.ts`).toBe(true);
    expect(read('package.json')).toContain('"functions:dashboard": "tsx scripts/build-dashboard-functions.ts"');
    expect(read('.github/workflows/ci.yml')).toContain('deno check --no-config supabase/dashboard/*.ts');
    expect(read('tsconfig.json')).toContain('"supabase/dashboard"');
    expect(read('eslint.config.mjs')).toContain('"supabase/dashboard/**"');
    expect(read('supabase/dashboard/README.md')).toContain('npm run functions:dashboard');
  });

  it('the setup guide deploys from the dashboard, with no secret and no JWT flag', () => {
    const setup = read('SUPABASE_SETUP.md');
    for (const n of ['## Deploy the server functions from your browser', 'Deploy a new function', 'Via Editor', 'supabase/dashboard/', 'Copy raw file', 'Deploy updates', 'invalid-session', 'not-available']) {
      expect(setup, n).toContain(n);
    }
    // The name typed before the first deploy is the address the app calls; a rename changes only the
    // label, and the Test button answers at any address, so the check reads the URL column.
    for (const n of ['**Before deploying**', '/functions/v1/<name>', 'changes only its label', 'read the **URL** column']) expect(setup, n).toContain(n);
    expect(setup, 'the name column proves nothing about the address').not.toContain('lists each name exactly as in the table');
    expect(setup, 'no secret to set by hand').not.toMatch(/secrets set SERVICE_ROLE_KEY/);
    expect(setup).not.toContain('--no-verify-jwt');
    expect(read('docs/OPERATIONS.md')).not.toContain('--no-verify-jwt');
    expect(read('docs/ARCHITECTURE.md')).toContain('### Deploying the functions from the browser (R115)');
  });
});

/**
 * R116 — the role on top, whose task is whose, no week locked.
 *
 * Three promises, each easy to lose quietly: the member's role is in the one
 * sticky bar EVERY course page renders (so a new page cannot ship without it);
 * every task, wherever it is drawn, says whether it is yours, everyone's, or
 * another role's and open to anyone; and no week, task or form is behind a
 * padlock (a gate and the scope sign-off are notes).
 */
describe('R116 — the role on top, whose task is whose, no week locked', () => {
  const coursePages = (dir = 'src/app/courses/[courseId]'): string[] =>
    readdirSync(root(dir)).flatMap((name) => {
      const rel = `${dir}/${name}`;
      if (statSync(root(rel)).isDirectory()) return coursePages(rel);
      return name === 'page.tsx' ? [rel] : [];
    });
  // Redirect stubs: they forward to a page that does render the bar.
  const STUBS = ['src/app/courses/[courseId]/guide/reference/page.tsx', 'src/app/courses/[courseId]/team/[teamId]/page.tsx'];

  it('the role strip is the first item of the sticky course bar', () => {
    const nav = code('src/components/CourseSubNav.tsx');
    expect(nav).toContain('<RoleStrip courseId={courseId}');
    expect(nav.indexOf('<RoleStrip'), 'before the tabs').toBeLessThan(nav.indexOf("aria-current={cur('home')}"));
    expect(nav, 'sticky, so it never scrolls away').toContain('sticky');
    const strip = code('src/components/course/RoleStrip.tsx');
    for (const n of ['Your role', 'No role yet.', 'data-role-strip', 'useMember(courseId)', 'useContext(CourseContext)']) expect(strip, n).toContain(n);
    expect(strip, 'the longhand label, not the capped eyebrow class').not.toMatch(/['"` ]eyebrow['"` ]/);
    expect(code('src/components/ui/Skeletons.tsx'), 'the skeleton holds its place').toMatch(/function SubNavSkeleton\(\)[\s\S]*?h-8 w-full sm:w-52/);
  });

  it('every course page renders that bar, so the role is on top of all of them', () => {
    const pages = coursePages();
    expect(pages.length).toBeGreaterThanOrEqual(8);
    for (const f of pages) {
      if (STUBS.includes(f)) expect(code(f), `${f} only forwards`).toMatch(/router\.replace\(/);
      else expect(code(f), `${f} renders the course bar`).toContain('<CourseSubNav');
    }
  });

  it('Home has a role section the strip can land on, and the dashboard card names the role', () => {
    expect(code('src/components/course/HomeTab.tsx')).toContain('<Surface accent="role" seamColor={ownRole.color} id="role"');
    expect(code('src/components/course/HomeTab.tsx')).toContain('.arc &&');
    expect(code('src/app/courses/[courseId]/page.tsx')).toContain("id !== 'team' && id !== 'role' && id !== 'roles'");
    expect(code('src/app/dashboard/page.tsx')).toContain('{card.role}');
  });

  it('every task says whose it is: one pure helper, one chip, used on the row, the opened task and the list', () => {
    const pure = code('src/lib/taskOwnership.ts');
    for (const bad of ['Date.', 'Math.random', 'localStorage', "from './data", 'useClientStore']) expect(pure, `pure: ${bad}`).not.toContain(bad);
    expect(code('src/components/course/TaskRow.tsx')).toContain('<OwnerChip kind={owner.kind} role={owner.role} />');
    const tab = code('src/components/course/TasksTab.tsx');
    for (const n of ['taskOwnership(task, member.role)', 'OWNER_COPY.explain[kind]', 'data-owner-explain={kind}', '<YourTasksStrip', 'hasOthers']) expect(tab, n).toContain(n);
    expect(tab, 'the opened task states it in full, not in a tooltip alone').not.toMatch(/InfoTip[^\n]*anyone can do any/);
  });

  it('no padlock on any task surface: a gate and the scope sign-off are notes, and the week stays open', () => {
    for (const f of ['src/components/course/TaskRow.tsx', 'src/components/course/TasksTab.tsx', 'src/components/course/WeekGateNote.tsx', 'src/components/course/OwnerChip.tsx', 'src/components/course/YourTasksStrip.tsx', 'src/components/week/WeekRail.tsx', 'src/components/task/GuidedTaskRunner.tsx', 'src/components/diagrams/FlowDiagram.tsx', 'src/app/courses/[courseId]/docs/page.tsx']) {
      expect(code(f), `${f} draws no padlock`).not.toMatch(/\bLock(Open)?\b/);
    }
    expect(existsSync('src/components/course/WeekLockedNotice.tsx'), 'the locked notice is gone').toBe(false);
    const gate = code('src/components/course/WeekGateNote.tsx');
    for (const n of ['role="note"', 'data-gate-note', 'is not cleared yet. This {unit} is open.', 'onGoTask']) expect(gate, n).toContain(n);
    const page = code('src/app/courses/[courseId]/page.tsx');
    expect(page).toContain('const gateNote =');
    for (const gone of ['weekLocked', 'priorGateForWeek']) expect(page, gone).not.toContain(gone);
    expect(code('src/components/course/TasksTab.tsx')).not.toMatch(/viewLocked|WeekLockedNotice/);
    const docs = code('src/app/courses/[courseId]/docs/page.tsx');
    expect(docs).toContain('Scope is not authorized yet');
    expect(docs).not.toContain('Locked until scope');
    expect(docs, 'the form is never hidden by the sign-off').not.toMatch(/!locked|\blocked\b/);
    expect(code('src/lib/teamProgress.ts')).toContain('export function openGateSteps(');
    expect(code('src/components/course/useCourseProgress.ts')).toContain('gateOpen');
  });

  it('a wide register scrolls inside its own box: its sr-only header label is clipped by a positioned scroller', () => {
    expect(code('src/components/grc/RegisterTable.tsx')).toContain('relative hidden overflow-x-auto sm:block');
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### The role on top, whose task is whose, and gates as notes (R116)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| The role on top |');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Whose task is whose |');
    expect(read('docs/OPERATIONS.md')).toContain('(R116)');
  });
});

/**
 * R117 — empty roles and failed loads never strand a team.
 *
 * A document a team cannot move because nobody holds a role, and an enrolled
 * student shown the Join panel because a request failed, are both dead ends
 * with no explanation. These pins keep the cover rule pure and recorded, and
 * keep a failed load from ever reading as "not enrolled".
 */
describe('R117 — empty roles and failures never strand a team', () => {
  it('the cover rule is pure, recorded in the note (no migration), and every surface that offers a step asks the same rule', () => {
    const life = code('src/lib/docs/lifecycle.ts');
    for (const n of ['export function isVacant(', 'export function coverOf(', 'export function noteText(', "export const COVER_PREFIX = 'Covering for '", 'export function roleForAction(', 'team.length > 0 &&']) expect(life, n).toContain(n);
    for (const bad of ['Date.now', 'localStorage', 'Math.random', "from '../data"]) expect(life.replace(/at: opts\.at \?\? Date\.now\(\)/, ''), `pure: ${bad}`).not.toContain(bad);
    expect(code('src/components/docs/StatusStrip.tsx')).toContain('isVacant(team,');
    expect(code('src/components/docs/ExpectationsPanel.tsx')).toContain('isVacant(');
    const queue = code('src/components/docs/TeamReviewQueueCard.tsx');
    expect(queue, 'the queue asks the same rule as the buttons').toContain('allowedActions(');
    expect(queue).not.toMatch(/raci!?\.(reviews|approves) === role/);
    expect(code('src/lib/skillProfile.ts'), 'cover rows are neither respected nor broken').toContain('coverOf(r.note) === null');
    expect(readdirSync(root('supabase/migrations')).filter((f) => read(`supabase/migrations/${f}`).includes('Covering for')), 'cover needs no migration: it is a note prefix on rows the database already takes').toEqual([]);
  });

  it('a failed first load is recorded and offered a retry, never shown as not enrolled', () => {
    const cache = code('src/lib/data/supabaseCache.ts');
    for (const n of ['const failedCourses = new Set<string>();', 'export function courseHydrateFailed(', 'if (memberships.error) {', 'failedCourses.delete(courseId);', 'failedCourses.clear();']) expect(cache, n).toContain(n);
    expect(code('src/lib/useMember.ts')).toContain('courseHydrateFailed(courseId)');
    expect(code('src/components/CourseEnrolGate.tsx')).toContain('<CourseLoadFailed courseId={courseId} />');
    expect(code('src/app/courses/[courseId]/page.tsx')).toContain('if (failed && !member) return <CourseLoadFailed');
    expect(code('src/components/auth/ImportPrompt.tsx'), 'no import over a membership that could not be read').toContain('memberFailed ||');
    const failed = code('src/components/course/CourseLoadFailed.tsx');
    for (const n of ['role="alert"', 'Try again', 'hydrateCourse(courseId)']) expect(failed, n).toContain(n);
  });

  it('a removed role is asked for again with the picker open, and a full house says so', () => {
    const join = code('src/components/course/JoinPanel.tsx');
    for (const n of ['const roleGone = !!member && !getRoleDef(course, member.role);', "roleGone ? 'Pick a role' : 'Join this course'", 'data-all-full', 'Every team is full.']) expect(join, n).toContain(n);
    const gate = code('src/components/CourseEnrolGate.tsx');
    expect(gate).toContain('title="Pick a role"');
    expect(gate).toContain('!getRoleDef(course, member.role)');
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### Empty roles and failures never strand a team (R117)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Cover for an empty role |');
    expect(read('docs/OPERATIONS.md')).toContain('(R117)');
  });
});

/**
 * R118 — one word for "done".
 *
 * A task is done for the team once anyone did it, and the member's own record
 * is theirs: two figures that every surface used to draw in its own words, so a
 * row could say "Done by Ada" beside a stone reading "0% of this task done".
 * These pins keep one pure state, one chip, words on every tick, and the
 * instructor's verdict apart from the team's own lifecycle.
 */
describe('R118 — one word for done', () => {
  it('the state is one pure module and one chip, used on the row and the opened task', () => {
    const pure = code('src/lib/taskState.ts');
    for (const bad of ['Date.', 'Math.random', 'localStorage', "from './data", 'useClientStore']) expect(pure, `pure: ${bad}`).not.toContain(bad);
    for (const n of ['export function taskState(', 'export function stateLabel(', 'export function yourLabel(', 'export function weekState(', 'TASK_STATE_COPY']) expect(pure, n).toContain(n);
    expect(code('src/components/course/TaskRow.tsx')).toContain('<TaskStateChip state={state} />');
    expect(code('src/components/course/TaskRow.tsx'), 'the old tick and by-chip are gone').not.toMatch(/Done by \$\{|CheckCircle2/);
    const tab = code('src/components/course/TasksTab.tsx');
    for (const n of ['const stateOf = (task: Task)', '<TaskStateChip state={stateOf(task)} withVerified />', 'state={stateOf(task)}', 'youPercent={weekStats?.[viewWeek]}']) expect(tab, n).toContain(n);
    const chip = code('src/components/course/TaskStateChip.tsx');
    for (const n of ['CheckCircle2', 'CircleDot', 'CircleDashed', 'data-task-state', 'data-task-you']) expect(chip, n).toContain(n);
  });

  it('the figures say whose they are: the stone is the member’s, the week bar is the team’s, each rail tick says what it means', () => {
    expect(code('src/components/quarry/art/TaskStone.tsx')).toContain('Your progress on this task: ${percent}%');
    expect(code('src/components/quarry/art/TaskStone.tsx')).not.toContain('of this task done');
    const header = code('src/components/week/WeekHeader.tsx');
    for (const n of ['by the team', 'data-week-you', 'youPercent']) expect(header, n).toContain(n);
    expect(code('src/components/week/WeekRail.tsx')).toContain("aria-label={it.doneLabel ?? 'done'}");
    expect(code('src/components/course/TasksTab.tsx')).toContain("doneLabel: 'every task done for the team'");
    expect(code('src/app/courses/[courseId]/docs/page.tsx')).toContain("doneLabel: 'every document meets the definition of done'");
  });

  it('no done tick, gate dot or filed icon is colour or shape alone', () => {
    expect(code('src/components/diagrams/FlowDiagram.tsx')).toContain('<span className="sr-only">Done:</span>');
    expect(code('src/components/team/TeamProgressTable.tsx')).toContain('aria-label="Filed"');
    expect(code('src/components/team/TeamProgressTable.tsx')).toContain("g === 'passed' ? 'passed'");
    expect(code('src/components/task/GuidedTaskRunner.tsx')).toContain('(met: every required step is ticked)');
    expect(code('src/app/courses/[courseId]/docs/page.tsx')).toContain('aria-label="meets the definition of done"');
  });

  it('the instructor’s verdict is always named and never shares a word with the team’s lifecycle', () => {
    const life = code('src/lib/docs/lifecycle.ts');
    expect(life).toContain('export const REVIEW_VERDICT_LABEL');
    expect(code('src/components/docs/ReviewBanner.tsx')).toContain('REVIEW_VERDICT_LABEL[review.status].head');
    expect(code('src/components/docs/ReviewBanner.tsx')).not.toMatch(/Under review|Revise and resubmit/);
    expect(code('src/components/team/TeamProgressTable.tsx')).toContain('REVIEW_VERDICT_LABEL');
  });

  it('Home says what the member waits on, and a late joiner on a finished team is never at a dead end', () => {
    const home = code('src/components/course/HomeTab.tsx');
    for (const n of ['<MyWaitingCard ', 'data-own-record', 'Done for the team.', 'Your own record: {crew.stepsDone} of {crew.stepsTotal} steps', 'onContinue(ownNext)', 'onContinue={() => onContinue()}']) expect(home, n).toContain(n);
    expect(code('src/app/courses/[courseId]/page.tsx'), 'Continue takes an optional task').toContain('onContinue={(t) => {');
    const waiting = code('src/components/docs/MyWaitingCard.tsx');
    for (const n of ['data-my-waiting', 'allowedActions(', 'isVacant(', 'submitterOf(']) expect(waiting, n).toContain(n);
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### One word for "done" (R118)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| One word for done |');
    expect(read('docs/OPERATIONS.md')).toContain('(R118)');
  });
});

/**
 * R119 — the team's roles board.
 *
 * A role says who a task is for, never who may do it, so the team's roles are
 * one board on Home: every role with the teammates who hold it and this week's
 * tasks, the viewer's own first, a role nobody holds marked open and one click
 * to take. These pins keep it pure, props only, never a padlock, never a member
 * id, and the take-this-role move the join panel's own call.
 */
describe('R119 — the team’s roles board', () => {
  it('the board is one pure module that reuses the vacancy, ownership and state rules, and carries no member id', () => {
    const pure = code('src/lib/roleBoard.ts');
    for (const bad of ['Date.', 'Math.random', 'localStorage', "from './data", 'useClientStore']) expect(pure, `pure: ${bad}`).not.toContain(bad);
    for (const n of ['export function roleBoard(', 'export function roleCoverage(', 'export function holdersLabel(', 'ROLE_BOARD_COPY', 'isVacant(', 'taskOwnership(', 'taskState(', 'doneByNames(']) expect(pure, n).toContain(n);
    expect(pure.match(/export interface BoardHolder \{[^}]*\}/)?.[0], 'a holder is a name and a flag').not.toContain('memberId');
    expect(pure.match(/export interface BoardRole \{[^}]*\}/)?.[0], 'a role on the board names no member id').not.toContain('memberId');
    expect(pure.match(/export interface BoardTask \{[^}]*\}/)?.[0]).not.toContain('memberId');
  });

  it('the board is props only: one section with the roles anchor, both chips on every task, and the dialog is the confirm alone', () => {
    const board = code('src/components/course/RoleBoard.tsx');
    for (const bad of ['useClientStore', 'progressRepo', "from '@/lib/data'", 'useMember', 'localStorage']) expect(board, `props only: ${bad}`).not.toContain(bad);
    for (const n of ['id="roles"', 'aria-labelledby="roles-title"', '<OwnerChip', '<TaskStateChip', 'data-take-role', 'data-board-role', 'ROLE_BOARD_COPY']) expect(board, n).toContain(n);
    expect(board, 'no padlock on the board').not.toMatch(/\bLock(Open)?\b/);
    expect(board.match(/<Dialog /g)?.length).toBe(1);
    expect(board, 'the board is a section; the dialog sits inside it').toMatch(/return \(\s*<Surface as="section"/);
    expect(board.indexOf('<Dialog '), 'the dialog follows the section it belongs to').toBeGreaterThan(board.indexOf('<Surface as="section"'));
  });

  it('Home mounts the board once, in place of the titles-only list, and a role is taken through the join call', () => {
    const home = code('src/components/course/HomeTab.tsx');
    expect(home.match(/<RoleBoard /g)?.length).toBe(1);
    for (const n of ['roleBoard({', 'takeRole(course, member, roleId)', 'board.roles.length > 1', 'onOpenTask={(t) => onContinue(t)}', 'teamTaskProgress']) expect(home, n).toContain(n);
    expect(home, 'the titles-only list is gone').not.toMatch(/otherFocuses|Titles only/);
    expect(home.indexOf('<RoleBoard '), 'after the role section').toBeGreaterThan(home.indexOf('<Surface accent="role"'));
    expect(home.indexOf('<RoleBoard '), 'before the join panel').toBeLessThan(home.indexOf('<JoinPanel'));
    const take = code('src/lib/takeRole.ts');
    expect(take.match(/progressRepo\.joinTeam\(/g)?.length).toBe(1);
    expect(take).toContain('{ ...member, role: roleId }');
    for (const bad of ['teamId:', 'cohort:', 'displayName:', 'memberId:']) expect(take, `only the role changes: ${bad}`).not.toContain(bad);
    for (const f of ['src/lib/data/localStorageProgressRepo.ts', 'src/lib/data/supabaseProgressRepo.ts']) expect(code(f), `${f}: a role change on one’s own team is never refused as full`).toContain('const staying = ');
  });

  it('the role strip lands on the board, the page accepts the hash, the instructor sees each team’s gap, and “done by” has one rule', () => {
    const strip = code('src/components/course/RoleStrip.tsx');
    for (const n of ["course.roles.length > 1 ? 'roles' : 'role'", '#${target}', 'goTo(target)']) expect(strip, n).toContain(n);
    expect(code('src/app/courses/[courseId]/page.tsx')).toContain("id !== 'team' && id !== 'role' && id !== 'roles'");
    const panel = code('src/components/instructor/RegistrationsPanel.tsx');
    for (const n of ['roleCoverage(course, data.roster)', 'data-team-open', 'data-role-coverage']) expect(panel, n).toContain(n);
    expect(code('src/components/course/TasksTab.tsx'), 'the task list and the board say “Done by” from one helper').toContain('doneByNames(');
    expect(code('src/lib/taskState.ts')).toContain('export function doneByNames(');
  });

  it('a table scroller that holds sr-only text is positioned, or the text escapes it and the page scrolls sideways on a phone', () => {
    // `sr-only` is absolutely positioned: with no positioned ancestor inside the scroller it lands at its
    // static position, far right in a wide table, and widens the whole page (R116, R118, R119).
    for (const f of ['src/components/team/TeamProgressTable.tsx', 'src/components/instructor/CohortKpiPanel.tsx', 'src/components/instructor/RegistrationsPanel.tsx', 'src/components/account/LinksSection.tsx', 'src/app/instructor/profiles/page.tsx', 'src/app/courses/[courseId]/ledger/page.tsx', 'src/components/grc/RegisterTable.tsx']) {
      const lines = code(f).split('\n').filter((l) => l.includes('overflow-x-auto'));
      expect(lines.length, f).toBeGreaterThan(0);
      for (const l of lines) expect(l, `${f}: ${l.trim().slice(0, 80)}`).toContain('relative');
    }
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### The team\'s roles board (R119)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| The team\'s roles board |');
    expect(read('docs/OPERATIONS.md')).toContain('(R119)');
  });
});

/**
 * R120 — the issues inbox.
 *
 * A report says where, who and which version, as filed, and says it for good; the
 * inbox is the one place an instructor reads every report across every course,
 * with the four statuses and a note for the reporter. These pins keep the core
 * pure, the board props-only, the identity of a report frozen in the database, the
 * statuses one list shared with the CHECK constraint, and the app safe to reach
 * production before the SQL does.
 */
describe('R120 — the issues inbox', () => {
  it('the core is pure, joins reports to courses, and carries no account id', () => {
    const pure = code('src/lib/issueInbox.ts');
    for (const bad of ['Date.now', 'Math.random', 'localStorage', 'useClientStore']) expect(pure, `pure: ${bad}`).not.toContain(bad);
    expect(pure, 'only types come from the data layer').not.toMatch(/^import (?!type )[^\n]*from '\.\/data/m);
    for (const n of ['export function buildIssues(', 'export function filterIssues(', 'export function groupByTask(', 'export function issueCounts(', 'export function issueFacets(', 'export function issuesCsv(', "ISSUE_SCHEMA = 'capstone-issue/1'"]) expect(pure, n).toContain(n);
    const dto = pure.match(/export interface IssueDto \{[\s\S]*?\n\}/)![0];
    expect(dto, 'an issue names a person, never an account').not.toMatch(/memberId|userId|user_id/);
    const schema = JSON.parse(read('content/schemas/issue.schema.json')) as { properties: { reporter: { properties: Record<string, unknown> } } };
    expect(Object.keys(schema.properties.reporter.properties).sort()).toEqual(['name', 'role', 'roleName', 'teamId']);
  });

  it('the board and the card are props only, and the page is the one that loads and stores', () => {
    for (const f of ['src/components/instructor/IssuesBoard.tsx', 'src/components/instructor/IssueCard.tsx']) {
      const src = code(f);
      for (const bad of ['taskReportsRepo', 'loadIssues', 'localStorage', 'useClientStore', 'progressRepo', 'courseRepo']) expect(src, `${f}: ${bad}`).not.toContain(bad);
    }
    const board = code('src/components/instructor/IssuesBoard.tsx');
    for (const n of ['role="tablist"', 'data-issues-tab', 'data-issues-csv', 'data-issues-pdf', 'buildIssuesPdf(', 'data-issues-group', 'issueFacets(', 'groupByTask(']) expect(board, n).toContain(n);
    expect(board, 'R127: the inbox saves a CSV and a PDF, no JSON file').not.toContain('data-issues-json');
    const card = code('src/components/instructor/IssueCard.tsx');
    expect(card, 'a status is an icon and a word').toContain('STATUS_LOOK');
    expect(card).toContain('data-issue-where');
    const page = code('src/app/instructor/issues/page.tsx');
    for (const n of ['loadIssues(', 'taskReportsRepo.update(', "label: 'Reported issues'"]) expect(page, n).toContain(n);
    expect(code('src/app/instructor/layout.tsx'), 'the inbox sits under the instructor gate').toContain('<InstructorGate>');
  });

  it('the statuses are one list shared with the CHECK constraint, and a student files only an open report', () => {
    const kinds = code('src/lib/reportKinds.ts');
    const sql = read('supabase/migrations/0016_report_context.sql');
    for (const st of ['open', 'in_progress', 'resolved', 'wont_fix']) {
      expect(kinds, st).toContain(`'${st}'`);
      expect(sql, st).toContain(`'${st}'`);
    }
    expect(sql).toContain("and status = 'open'");
    expect(sql).toContain('create trigger task_reports_frozen');
    expect(sql).toContain('raise exception \'task_reports identity is frozen');
    for (const col of ['step_id', 'week', 'reporter_name', 'reporter_role', 'content_version', 'resolution_note', 'fix_revision']) expect(sql, col).toContain(`add column if not exists ${col}`);
    expect(sql, 'the 0006 helpers, never a subquery on memberships/profiles').not.toMatch(/from public\.(memberships|profiles)/);
    expect(read('supabase/tests/rls.sql')).toContain('ivy rewrote who filed the report');
  });

  it('a report is filed with its context, and the app degrades when the database has not had 0016', () => {
    const dialog = code('src/components/task/ReportIssueDialog.tsx');
    for (const n of ['data-report-step', 'data-report-stamp', 'contentVersion(', 'reporterName: member.displayName', 'reporterRole: member.role', 'week: task.week']) expect(dialog, n).toContain(n);
    const repo = code('src/lib/data/supabaseFeatureRepos.ts');
    expect(repo.match(/isMissingSchema\(/g)?.length, 'the insert falls back and the update says what to do').toBeGreaterThanOrEqual(2);
    const errors = code('src/lib/data/schemaErrors.ts');
    for (const c of ['42703', 'PGRST204', '42P01', 'PGRST205']) expect(errors, c).toContain(c);
    expect(code('src/lib/data/issuesLoader.ts'), 'the inbox probes for the new column').toContain("select('step_id')");
    expect(code('src/components/course/useCourseProgress.ts'), 'the team marker counts in-progress reports too').toContain('isPendingReport(r.status)');
  });

  it('the inbox is reachable from the instructor home, the cohort page and the command palette', () => {
    const home = code('src/app/instructor/page.tsx');
    for (const n of ['loadPendingCounts(', 'href="/instructor/issues"', 'data-pending-issues']) expect(home, n).toContain(n);
    const cohort = code('src/app/instructor/[courseId]/cohort/page.tsx');
    for (const n of ['data-open-inbox', '/instructor/issues?course=', 'isPendingReport(r.status)', 'taskReportsRepo.resolve(']) expect(cohort, n).toContain(n);
    expect(code('src/lib/search.ts')).toContain("id: 'page:issues'");
  });

  it('the docs say it, and the admin login is described the way it works', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### The issues inbox (R120)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Reported issues inbox |');
    expect(read('docs/OPERATIONS.md')).toContain('**The issues inbox (R120):**');
    expect(read('SUPABASE_SETUP.md')).toContain('/instructor/issues');
    for (const f of ['README.md', 'docs/OPERATIONS.md', 'SUPABASE_SETUP.md']) expect(read(f), `${f} names both staff flags`).toContain('is_admin');
    expect(read('SUPABASE_SETUP.md'), 'a miss in the grant statement is visible').toMatch(/where id = \(select id from auth\.users where email = 'admin@example\.com'\)\s+returning id;/);
    expect(read('docs/CURRENT_STATE.md')).not.toMatch(/`profiles\.is_instructor`\s+flag\./);
  });
});

/**
 * R121 — versioned content fixes.
 *
 * A correction to the words of a course is an entry in an append-only ledger laid over the
 * course, applied in ONE place, numbered by the database, and held to what the seeds are held
 * to. These pins keep the core pure, the application single, the admin's desk admin-only, the
 * ledger append-only in the database, a saved copy free of the ledger, and the budgets one set
 * of numbers.
 */
describe('R121 — versioned content fixes', () => {
  it('the core is pure, and a fix is applied in one place', () => {
    const pure = code('src/lib/contentFix.ts');
    for (const bad of ['Date.now', 'Math.random', 'new Date', 'localStorage', 'useClientStore', 'document.', 'window.']) expect(pure, `pure: ${bad}`).not.toContain(bad);
    expect(pure, 'types only from the data layer').not.toMatch(/^import (?!type )[^\n]*from '\.\/data/m);
    for (const n of ['export function applyChange(', 'export function applyFixes(', 'export function ledger(', 'export function validateChanges(', 'export function revertDraft(', 'export function foldDraft(', 'export function fixBundle(', "FIX_SCHEMA = 'capstone-content-fix/1'", "FIX_BUNDLE_SCHEMA = 'capstone-content-fixes/1'"]) expect(pure, n).toContain(n);
    const appliers = collectSourceFiles('src').filter((f) => !/\.test\.tsx?$/.test(f) && /\b(applyFixes|applyChange)\(/.test(code(f))).sort();
    expect(appliers, 'the ledger is replayed by contentFix itself and applied by content/docs.ts, nowhere else').toEqual(['src/lib/content/docs.ts', 'src/lib/contentFix.ts']);
    const dto = code('src/lib/content/dto.ts');
    expect(dto, 'the effective document carries the ledger, additively').toContain('revision?: number');
    expect(dto).toContain('fixes?: readonly ContentFix[]');
    const shipped = JSON.parse(read('content/courses/security-plus.json')) as Record<string, unknown>;
    expect(Object.keys(shipped), 'a committed file is the course as shipped: no ledger, no revision').not.toEqual(expect.arrayContaining(['fixes']));
    expect('revision' in shipped).toBe(false);
  });

  it('every reader of a course sees the fixes: both repos list through effectiveCourse, and a saved copy never stores the ledger', () => {
    for (const f of ['src/lib/data/localStorageCourseRepo.ts', 'src/lib/data/supabaseCourseRepo.ts']) {
      const src = code(f);
      expect(src, `${f}: lists through effectiveCourse`).toContain('.map(effectiveCourse)');
      expect(src.match(/storedCourse\(/g)?.length ?? 0, `${f}: save, duplicate, import and export strip the revision`).toBeGreaterThanOrEqual(4);
    }
    expect(code('src/lib/data/supabaseCourseRepo.ts'), 'a saved document is made from the document BEFORE its fixes').toContain('baseDocument(course.id)');
    expect(code('src/lib/data/localStorageCourseRepo.ts'), 'the offline document source reads the course as saved, not as listed').toContain('readAuthored().find(');
    expect(code('src/lib/data/index.ts')).toContain('registerFixesSource(');
    // read(), not code(): a "/*" inside this file's first line comment (".../[courseId]/* routes") swallows the code below it.
    expect(read('src/components/CourseProvider.tsx'), 'the page re-renders when a fix changes the words').toContain('${c.revision ?? 0}');
    expect(code('src/components/task/ReportIssueDialog.tsx'), 'a report stamps the revision it was reading').toContain('contentVersion(course?.version, course?.revision)');
    expect(code('src/lib/data/supabaseCache.ts'), 'the page never paints the old words first: the course hydrate selects the ledger').toContain("supabase.from('content_fixes').select('*').eq('course_id', courseId)");
    expect(code('src/lib/types.ts')).toContain('revision?: number');
  });

  it('the panel and the ledger are props only, and the page is the one that stores, for the admin alone', () => {
    for (const f of ['src/components/instructor/FixTextPanel.tsx', 'src/components/instructor/FixesLedger.tsx']) {
      const src = code(f);
      for (const bad of ['contentFixesRepo', 'taskReportsRepo', 'courseRepo', 'loadIssues', 'localStorage', 'useClientStore', 'progressRepo']) expect(src, `${f}: ${bad}`).not.toContain(bad);
    }
    const panel = code('src/components/instructor/FixTextPanel.tsx');
    for (const n of ['validateFix(', 'patchableFields(', 'data-fix-save', 'data-fix-also', 'data-fix-problem']) expect(panel, n).toContain(n);
    const ledger = code('src/components/instructor/FixesLedger.tsx');
    for (const n of ['STATE_LOOK', 'data-fix-revert', 'data-fixes-bundle', 'data-fixes-document', 'LEDGER_COPY.was', 'LEDGER_COPY.now']) expect(ledger, n).toContain(n);
    const page = code('src/app/instructor/issues/page.tsx');
    for (const n of ['contentFixesRepo.add(', 'fixBundle(', 'revertDraft(', 'foldDraft(', 'fixRevision: fix.revision', 'renderExtra={isAdmin ? renderFix : undefined}', 'const showFixes = isAdmin && view', '{isAdmin && (']) expect(page, n).toContain(n);
    expect(page, 'the ledger’s moves are the admin’s').toContain('canEdit={isAdmin}');
  });

  it('the ledger is append-only and numbered by the database, and only an admin writes it', () => {
    const sql = read('supabase/migrations/0017_content_fixes.sql');
    for (const n of ['create table if not exists public.content_fixes', 'pg_advisory_xact_lock', 'create trigger content_fixes_assign', 'create trigger content_fixes_append_only', 'content_fixes_one_revert', 'revoke update, delete, truncate on public.content_fixes from anon, authenticated', 'with check (public.is_admin() and created_by = auth.uid())', 'using (auth.uid() is not null)']) expect(sql, n).toContain(n);
    expect(sql, 'the 0006 helpers, never a subquery on memberships').not.toMatch(/from public\.memberships/);
    expect(sql, 'an instructor is not enough').not.toMatch(/with check \(public\.is_instructor\(\)/);
    for (const kind of ["'fix'", "'revert'", "'fold'"]) expect(sql, kind).toContain(kind);
    const rls = read('supabase/tests/rls.sql');
    for (const n of ['ana: the database numbers the first fix 1, whatever she sent', 'ivy, an instructor and not an admin, wrote a fix', 'ana reverted the same fix twice', 'the owner rewrote an entry', 'erasing an account detaches its id from its entries']) expect(rls, n).toContain(n);
    expect(read('supabase/setup.sql'), 'setup.sql carries it').toContain('content_fixes_append_only');
    expect(readdirSync(root('supabase/migrations')).filter((f) => f.startsWith('0013')), 'the events migration still does not exist').toEqual(['0013_consent_outcomes.sql']);
  });

  it('a fix is held to the numbers the seeds are held to', () => {
    expect(code('src/lib/contentFix.ts')).toContain("from './readingBudget'");
    expect(code('src/lib/data/content-integrity.test.ts').replace(/\/\/.*$/gm, '')).toContain("from '../readingBudget'");
    const budget = code('src/lib/readingBudget.ts');
    for (const n of ['longWords: 40', 'explainProse: 36', 'weekObjectiveProse: 20', 'taskObjectiveProse: 25', 'instructionProse: 30', 'actionProse: 20', 'descriptionProse: 30']) expect(budget, n).toContain(n);
  });

  it('the published shapes, the schema list and the docs say it', () => {
    const entry = JSON.parse(read('content/schemas/content-fix.schema.json')) as { properties: Record<string, unknown>; $defs: { change: { properties: Record<string, unknown> } } };
    expect(Object.keys(entry.properties).sort(), 'an entry names a person and never an account').toEqual(['at', 'by', 'changes', 'courseId', 'docVersion', 'foldedIn', 'folds', 'id', 'issueIds', 'kind', 'reverts', 'revision', 'schema', 'summary']);
    expect(Object.keys(entry.$defs.change.properties).sort()).toEqual(['after', 'before', 'field', 'stepId', 'taskId']);
    for (const n of ['content-fix.schema.json', 'content-fixes.schema.json']) expect(read('content/schemas/README.md'), n).toContain(n);
    expect(read('content/README.md')).toContain('The effective document (R121)');
    expect(read('docs/ARCHITECTURE.md')).toContain('### Versioned content fixes (R121)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Versioned content fixes |');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Content version |');
    expect(read('docs/OPERATIONS.md')).toContain('**Content fixes (R121):**');
    expect(read('SUPABASE_SETUP.md')).toContain('content_fixes');
    expect(read('SUPABASE_SETUP.md')).toContain('## Fix the wording of a course from a report');
  });
});

/**
 * R122 — versioned course editing.
 *
 * Every save of a course in the studio is a numbered, restorable version (the database counts and keeps
 * them; the clients count the same way), a built-in course is not forked without asking, and the ids
 * that progress is recorded against stop being editable. These pins keep the history written only by
 * the trigger, admin-read, append-only; the clients counting one way; the panel props-only; the fork
 * asking first; the id locks in place; and the docs saying it.
 */
describe('R122 — versioned course editing', () => {
  it('the database numbers and keeps every save, and only an admin reads the history', () => {
    const sql = read('supabase/migrations/0018_course_document_versions.sql');
    for (const n of [
      'create table if not exists public.course_document_versions',
      'create trigger course_documents_save',
      'before insert or update on public.course_documents',
      'pg_advisory_xact_lock',
      'greatest(',
      "jsonb_set(new.doc, '{course,version}'",
      'create trigger course_document_versions_append_only',
      'revoke insert, update, delete, truncate on public.course_document_versions from anon, authenticated',
      'using (public.is_admin())',
      'course_documents_updated_by_fkey',
      'on delete set null',
      'on conflict (course_id, version) do nothing',
    ]) expect(sql, n).toContain(n);
    expect(sql, 'the 0006 helpers, never a subquery on memberships').not.toMatch(/from public\.memberships/);
    expect(sql, 'an instructor is not enough to read a whole document').not.toMatch(/using \(public\.is_instructor\(\)\)/);
    const rls = read('supabase/tests/rls.sql');
    for (const n of ['ana: the database counts the saves, whatever number the client sent', 'ivy: an instructor is not an admin; no history', 'ana rewrote a snapshot', 'the owner rewrote a snapshot', 'a deleted course keeps its history', 'erasing the admin who saved a course does not erase the course', 'ana: a restore is the next version']) expect(rls, n).toContain(n);
    expect(read('supabase/setup.sql'), 'setup.sql carries it').toContain('course_document_versions_append_only');
  });

  it('both repos count a save the way the database does, and a copy starts again at 1', () => {
    const local = code('src/lib/data/localStorageCourseRepo.ts');
    expect(local).toContain('version: prior + 1');
    expect(local).toContain('recordVersion(next)');
    expect(local, 'a copy is a new course').toContain('delete clone.version');
    expect(local, 'the offline history keeps a few saves and never alarms').toContain('KEEP_VERSIONS = 8');
    expect(local, 'epoch milliseconds, never toISOString').not.toContain('toISOString');
    const cloud = code('src/lib/data/supabaseCourseRepo.ts');
    expect(cloud).toContain('version: prior + 1');
    expect(cloud).toContain('delete clone.version');
    const history = code('src/lib/data/supabaseCourseHistoryRepo.ts');
    expect(history, 'the list asks for what describes a version, never the documents').toContain("select('version, saved_by_name, saved_at, title, bytes')");
    expect(history).toContain("onConflict: 'course_id'");
    expect(code('src/lib/data/index.ts')).toContain('export const courseHistoryRepo = cloud ? supabaseCourseHistoryRepo : localStorageCourseHistoryRepo');
  });

  it('the history panel is props only, and the studio does the loading, the restoring and the asking', () => {
    const panel = code('src/components/instructor/HistoryPanel.tsx');
    for (const bad of ['courseHistoryRepo', 'courseRepo', 'localStorage', 'useClientStore', 'progressRepo', 'getBrowserClient']) expect(panel, `HistoryPanel: ${bad}`).not.toContain(bad);
    expect(panel, 'only types come from the data layer').not.toMatch(/^import (?!type )[^\n]*from '@\/lib\/data/m);
    for (const n of ['data-history-restore', 'data-history-download', 'data-history-current', 'HISTORY_COPY.restoreBody']) expect(panel, n).toContain(n);
    const studio = code('src/app/instructor/[courseId]/page.tsx');
    for (const n of ['courseHistoryRepo.list(', 'courseHistoryRepo.restore(', 'courseHistoryRepo.get(', 'setSeededId(null)', "{ id: 'history', label: 'History' }", 'data-studio-version', 'data-studio-save']) expect(studio, n).toContain(n);
    expect(studio, 'a built-in course asks before its first save forks it').toContain('if (builtIn) setForking(true);');
    expect(studio, 'what the course is comes from what is saved, not from the draft').toContain('const builtIn = source?.isSeed === true;');
    expect(studio).toContain('data-studio-fork-confirm');
    expect(studio, 'no claim that a cloud save is this device’s').toContain('isSupabaseConfigured() ? HISTORY_COPY.forkCloud : HISTORY_COPY.forkLocal');
    expect(studio).toContain('HISTORY_COPY.confirmTitle');
  });

  it('saved ids cannot be changed, for tasks, steps, roles and gates; new ones can until they are saved', () => {
    const studio = code('src/app/instructor/[courseId]/page.tsx');
    expect(studio).toContain('const lockedIds = useMemo(');
    for (const n of ['locked={lockedIds.roles}', 'locked={lockedIds.gates}', 'tasks: lockedIds.tasks', 'steps: lockedIds.steps']) expect(studio, n).toContain(n);
    const fields = code('src/components/instructor/fields.tsx');
    expect(fields).toContain('export const ID_LOCKED_HINT');
    expect(fields.match(/readOnly=\{readOnly\}/g)?.length, 'both field kinds honour it').toBe(2);
    expect(fields.match(/aria-readonly=\{readOnly \|\| undefined\}/g)?.length, 'and say so to assistive technology').toBe(2);
    expect(fields, 'a utility on the input loses to the unlayered global field rule: the look is set in globals.css').not.toContain('bg-panel-2');
    expect(read('src/app/globals.css'), 'a saved id looks locked').toMatch(/input\[aria-readonly='true'\],\s*input\[aria-readonly='true'\]:focus \{\s*@apply bg-panel-2 text-muted;/);
    for (const [f, needle] of [
      ['src/components/instructor/TasksEditor.tsx', 'readOnly={locked?.tasks.has(t.id)}'],
      ['src/components/instructor/StepsEditor.tsx', 'readOnly={lockedSteps?.has(`${taskId}/${s.id}`)}'],
      ['src/components/instructor/RolesEditor.tsx', 'readOnly={locked?.has(r.id)}'],
      ['src/components/instructor/GatesEditor.tsx', 'readOnly={locked?.has(g.id)}'],
    ] as const) expect(code(f), f).toContain(needle);
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### Versioned course editing (R122)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Course versions and history |');
    expect(read('docs/CURRENT_STATE.md')).toContain('| No silent fork, saved ids read-only |');
    expect(read('docs/OPERATIONS.md')).toContain('**Course versions (R122):**');
    expect(read('SUPABASE_SETUP.md')).toContain('### Every save of a course is a numbered version');
    expect(read('SUPABASE_SETUP.md')).toContain('course_document_versions');
  });
});

/**
 * R123 — a field in a dialog takes every character typed, and the admin's fix list holds every item.
 *
 * The dialog's focus effect used to depend on `onClose`, which every caller writes inline, so each
 * keystroke moved focus out of the field. These pins keep the one focus trap depending on `open`
 * alone, the dialog using it and carrying no effect of its own, and the fix list from losing an item.
 */
describe('R123 — typing in a dialog, and the fix list', () => {
  it('the focus trap depends on open and reads onClose through a ref', () => {
    const trap = code('src/lib/useFocusTrap.ts');
    expect(trap).toContain('onCloseRef.current()');
    expect(trap).toContain('}, [open, panelRef, autoFocusFirst]);');
    expect(trap, 'a close handler in the dependency list re-ran the effect on every keystroke').not.toMatch(/\}, \[[^\]]*onClose[^\]]*\]\)/);
  });

  it('the dialog uses the trap and keeps no focus effect of its own', () => {
    const dialog = code('src/components/ui/Dialog.tsx');
    expect(dialog).toContain('useFocusTrap(open, panelRef, onClose)');
    expect(dialog, 'the focus behaviour lives in useFocusTrap').not.toContain('useEffect');
    expect(dialog).toContain('data-dialog-close');
  });

  it('every item on the admin’s list is in the fix list, with the link limit written down', () => {
    const list = read('docs/FIX_LIST.md');
    for (const id of ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']) expect(list, id).toContain(`| ${id} |`);
    expect(list).toContain('256 KB');
    expect(list).toContain('SHARE_MAX_BYTES');
    expect(read('docs/OPERATIONS.md')).toContain('**Typing (R123):**');
  });
});

/**
 * R124 — the copy a link serves fits in 256 KB.
 *
 * The full export carried every row of every course and came to 525 KB for thirteen courses, so a
 * member with four could not make a link. The copy is now compact, the member picks the courses,
 * and the dialog shows the size before the click. These pins keep the pages handing the dialog the
 * compact copy, the dialog measuring it and refusing one over the limit, the builder pure, the cap
 * where the deployed function also reads it, and the docs saying what the limit is.
 */
describe('R124 — the link copy fits', () => {
  it('the pages hand the dialog the compact copy, and the dialog measures it before the click', () => {
    for (const f of ['src/app/dashboard/page.tsx', 'src/app/portfolio/page.tsx']) {
      const page = code(f);
      expect(page, f).toContain('shareProfileCopy(buildMemberProfile(shareInput(words!.COPY)), ids)');
      expect(page, `${f}: the member picks the courses`).toMatch(/<ShareLinkDialog[\s\S]{0,400}?courses=\{/);
    }
    expect(code('src/app/courses/[courseId]/skills/page.tsx')).toContain('shareProfileCopy(shareProfile())');
    const dialog = code('src/components/share/ShareLinkDialog.tsx');
    for (const n of ['courseSizes(buildProfile, ids)', 'copyBytes(buildProfile(', 'SHARE_LIMIT_BYTES', 'data-share-size', 'data-share-courses', 'disabled={busy || !loaded || over || none}']) expect(dialog, n).toContain(n);
    expect(dialog, 'the copy that is sent is built at the click').toContain('buildProfile(choosing ? chosen : undefined)');
  });

  it('the builder is pure: no clock, no store, no window', () => {
    const copy = code('src/lib/shareCopy.ts');
    for (const bad of ['Date.now', 'new Date', 'window', 'localStorage', 'useClientStore', 'getBrowserClient', 'fetch(']) expect(copy, bad).not.toContain(bad);
    expect(copy).toContain("from '../../supabase/functions/_shared/shareGuard'");
  });

  it('the cap is read from the one place the deployed function reads it, and the docs say what it is', () => {
    expect(read('supabase/functions/_shared/shareGuard.ts')).toContain('export const SHARE_MAX_BYTES = 256 * 1024;');
    expect(read('docs/ARCHITECTURE.md')).toContain('**The 256 KB limit (R124).**');
    expect(read('SUPABASE_SETUP.md')).toContain('**A link holds 256 KB.**');
    expect(read('docs/OPERATIONS.md')).toContain('**Link size (R124):**');
    expect(read('docs/FIX_LIST.md')).toContain('| F2 | Create link fails: "The copy is larger than 256 KB, the most a link can hold." | R124 | Done |');
    expect(read('content/schemas/member-profile.schema.json')).toContain('(R124)');
  });
});

/**
 * R125 — a skill earned stays earned.
 *
 * "Reset my progress" is how a course is retaken, and the profile is a projection over the progress a
 * member has now, so it used to take the record with it. The ledger keeps what was reached; these pins
 * keep every surface that shows a member's profile laying it over the live one and banking as it shows,
 * a reset never reaching the ledger, the rule pure and held by the database for every client, the cloud
 * repo sending no time of its own, and the docs saying it.
 */
describe('R125 — the earned-skills ledger', () => {
  it('every surface that builds the member’s profile lays the ledger over it, and the pages bank what they show', () => {
    expect(code('src/app/dashboard/page.tsx')).toContain('applyEarned(live, earned)');
    expect(code('src/app/dashboard/page.tsx')).toContain('useBankEarned(cards.map((c) => c.skills))');
    expect(code('src/app/portfolio/page.tsx')).toContain('withEarned(skillProfile({');
    expect(code('src/app/portfolio/page.tsx')).toContain('useBankEarned(rows.map((r) => r.skills))');
    expect(code('src/components/skills/SkillsCard.tsx')).toContain('withEarned(skillProfile({');
    expect(code('src/components/skills/SkillsCard.tsx')).toContain('useBankEarned([profile])');
    expect(code('src/app/courses/[courseId]/skills/page.tsx')).toContain('withEarned(skillProfile({');
    expect(code('src/app/courses/[courseId]/skills/page.tsx')).toContain('<BankEarned profiles={[profile]} />');
  });

  it('"Reset my progress" never reaches the ledger, and deleting an account clears it', () => {
    const reset = code('src/components/course/HomeTab.tsx').split('const confirmReset')[1].split('return (')[0];
    expect(reset).not.toMatch(/earned/i);
    for (const f of ['src/lib/data/localStorageProgressRepo.ts', 'src/lib/data/supabaseProgressRepo.ts', 'src/lib/data/localStorageEvidenceRepo.ts', 'src/lib/data/supabaseEvidenceRepo.ts', 'src/lib/data/localStorageFeatureRepos.ts', 'src/lib/data/supabaseFeatureRepos.ts']) {
      expect(code(f), `${f}: a reset is about progress, not the ledger`).not.toMatch(/earned_skills|earnedSkills|earnedRepo/);
    }
    expect(code('src/app/account/page.tsx')).toContain("'earned_skills'");
    expect(read('src/components/course/HomeTab.tsx')).toContain('Skills you have already earned stay on your record');
  });

  it('the rule is pure and the database holds it for every client', () => {
    const rule = code('src/lib/earnedSkills.ts');
    for (const bad of ['Date.now', 'new Date', 'window', 'localStorage', 'useClientStore', 'fetch(']) expect(rule, bad).not.toContain(bad);
    const sql = read('supabase/migrations/0019_earned_skills.sql');
    for (const n of [
      'create trigger earned_skills_guard',
      'new.first_at := clock_timestamp();',
      'return old;',
      'new.course_id := old.course_id;',
      'new.first_at := old.first_at;',
      'references auth.users(id) on delete cascade',
      'using (user_id = auth.uid() or public.is_instructor())',
      'with check (user_id = auth.uid())',
      'revoke truncate on public.earned_skills from anon, authenticated',
    ]) expect(sql, n).toContain(n);
    const rls = read('supabase/tests/rls.sql');
    for (const n of ['ada: a reset cannot lower a skill', 'ada: first reached stays', 'ada: where it was first reached stays', 'bob: reads only his own', 'ada added a row for bob', 'removing the login removes the ledger with it', 'ivy: reads them all and raises none of them']) expect(rls, n).toContain(n);
    expect(read('supabase/setup.sql')).toContain('earned_skills_guard');
  });

  it('the cloud repo sends no time of its own, keeps a failed write, and falls back to the device when the table is missing', () => {
    const cloud = code('src/lib/data/supabaseEarnedRepo.ts');
    expect(cloud).toContain("onConflict: 'user_id,dimension,skill_id'");
    expect(cloud, 'the database stamps the times').not.toMatch(/first_at|level_at|firstAt|levelAt/);
    expect(cloud).toContain('cache.markEarnedMissing()');
    expect(cloud).toContain('pending.set(earnedKey(r), r)');
    expect(code('src/lib/data/supabaseCache.ts')).toContain('await hydrateEarned(courseId);');
    expect(code('src/lib/data/index.ts')).toContain('export const earnedRepo = cloud ? supabaseEarnedRepo : localStorageEarnedRepo');
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### The earned-skills ledger (R125)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Earned-skills ledger |');
    expect(read('docs/OPERATIONS.md')).toContain('**Skills kept across a retake (R125):**');
    expect(read('SUPABASE_SETUP.md')).toContain('### Skills earned are kept across a reset or a retake');
    expect(read('SUPABASE_SETUP.md')).toContain('| Earned skills (`earned_skills`) |');
    expect(read('docs/FIX_LIST.md')).toContain('| F5 | A skill is earned the first time a course is completed; a retake only adds what is missing and never overwrites an earned skill | R125 | Done |');
  });
});

/**
 * R126 — the record updates, and every figure opens.
 *
 * The record counted verified evidence only, so ticking steps changed nothing it printed, and a page left
 * open never refreshed. These pins keep the twelve figures each a button over a pure list builder, the
 * lists built from the step set the figure counts (never from a repository inside the builder), the page
 * refreshing when it is looked at and waiting for its first load, and the store key not serialising
 * whole courses.
 */
describe('R126 — the record, live and openable', () => {
  it('the dashboard prints the twelve figures as buttons over the pure list builder', () => {
    const page = code('src/app/dashboard/page.tsx');
    for (const id of ['steps-done', 'tasks-done', 'weeks-sealed', 'capstones', 'steps-verified', "'commands'", 'evidence', 'days', "'skills'", "'tools'", "'procedures'", "'domains'"]) expect(page, id).toContain(id.replace(/'/g, ''));
    for (const n of ['<RecordStrip tiles={tiles}', '<RecordDetailPanel', 'metricDetail(openTile, cards.map(courseFactsOf))', 'const { ready } = useUserSync();', '!hydrated || !ready']) expect(page, n).toContain(n);
    expect(page, 'the old strip of four-column definitions is gone').not.toContain('function Stat(');
    const strip = code('src/components/skills/RecordStrip.tsx');
    for (const n of ['aria-expanded={isOpen}', 'aria-controls={panelId}', 'data-record-tile={t.id}', 'data-record-detail={detail.metric}', 'aria-label={`${RECORD_UI.openTask}: ${item.label}`}']) expect(strip, n).toContain(n);
    expect(strip, 'the list scrolls into view clear of the sticky header, not under it').toContain('<div ref={ref} className="scroll-mt-20">');
  });

  it('the list builder is pure and counts what the figure counts', () => {
    const detail = code('src/lib/recordDetail.ts');
    for (const bad of ['@/lib/data', "from './data'", 'localStorage', 'window', 'Date.now', 'new Date', 'useClientStore', 'fetch(']) expect(detail, bad).not.toContain(bad);
    for (const m of ['steps-done', 'tasks-done', 'weeks-sealed', 'capstones', 'steps-verified', 'commands', 'evidence', 'days', 'skills', 'tools', 'procedures', 'domains']) expect(detail, m).toContain(`'${m}'`);
    expect(detail, 'a row kept from an earlier run is marked, from the ledger’s own steps').toContain("'kept'");
    const facts = code('src/lib/recordFacts.ts');
    for (const n of ['earnedRepo.list(course.id)', 'evidenceRepo.getSteps(', 'progressRepo.isStepComplete(']) expect(facts, n).toContain(n);
  });

  it('the page refreshes when it is looked at, and does not serialise whole courses on every broadcast', () => {
    const sync = code('src/lib/useUserSync.ts');
    for (const n of ["window.addEventListener('focus', refresh)", "document.addEventListener('visibilitychange', refresh)", "window.addEventListener('pageshow', refresh)", 'export const REFRESH_MS = 10_000;', 'return { ready:']) expect(sync, n).toContain(n);
    const page = code('src/app/dashboard/page.tsx');
    expect(page).toContain("course: `${c.course.id}:${c.course.updatedAt ?? 'seed'}:${c.course.revision ?? 0}`");
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### The record updates and every figure opens (R126)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| The record, live and openable |');
    expect(read('docs/OPERATIONS.md')).toContain('**The record moves, and opens (R126):**');
    const list = read('docs/FIX_LIST.md');
    expect(list).toContain('| F3 | The dashboard\'s "Your record" does not update | R126 | Done |');
    expect(list).toContain('| F4 | Each record metric expands to the tools, commands, procedures and actions behind it | R126 | Done |');
  });
});

/**
 * R127 — exports are a compact PDF, not JSON files.
 *
 * The admin's fix list, F6: every export a learner makes is one compact PDF of skills, progress and issues. These
 * pins keep the writer and the builder pure and free of a dependency, send every learner-facing export through
 * them, and keep the list of files that are still machine-readable explicit, so a JSON download added to a
 * learner's page is a decision somebody writes down here, not an accident.
 */
describe('R127 — exports are a compact PDF', () => {
  it('the writer and the builder are pure, and add no dependency', () => {
    for (const f of ['src/lib/pdf.ts', 'src/lib/recordPdf.ts']) {
      const src = code(f);
      for (const bad of ['window', 'document.', 'Date.now', 'new Date()', 'localStorage', 'fetch(', '@/lib/data', 'useClientStore', 'toISOString']) expect(src, `${f}: ${bad}`).not.toContain(bad);
    }
    expect(read('package.json')).not.toMatch(/"(jspdf|pdfkit|pdf-lib|pdfmake|@react-pdf\/renderer|react-pdf)"/);
    // the writer reads no clock: the caller says when it was made
    expect(code('src/lib/pdf.ts')).toContain('created: number');
    // text is WinAnsi and widths are Adobe's AFM, so a line is broken where it ends
    expect(code('src/lib/pdf.ts')).toContain('/Encoding /WinAnsiEncoding');
  });

  it('every learner-facing export goes through the PDF builder and the one download helper, and none saves JSON', () => {
    const surfaces = ['src/app/dashboard/page.tsx', 'src/app/portfolio/page.tsx', 'src/components/skills/DtoChip.tsx', 'src/components/skills/SkillsCard.tsx', 'src/components/share/SharedProfile.tsx', 'src/components/instructor/IssuesBoard.tsx'];
    for (const f of surfaces) {
      const src = code(f);
      expect(src, `${f}: no JSON mime type`).not.toContain("'application/json'");
      expect(src, `${f}: no Blob of its own`).not.toContain('new Blob');
      expect(src, `${f}: no JSON file name`).not.toMatch(/downloadText\([^)]*\.json/);
    }
    for (const f of ['src/app/dashboard/page.tsx', 'src/app/portfolio/page.tsx', 'src/components/skills/SkillsCard.tsx']) {
      const src = code(f);
      for (const n of ['buildRecordPdf(', 'recordPdfName(', 'downloadBytes(', 'ownIssues(']) expect(src, `${f}: ${n}`).toContain(n);
    }
    const shared = code('src/components/share/SharedProfile.tsx');
    for (const n of ['recordPdfFromShare(', 'buildRecordPdf(', 'buildCredentialPdf(', 'downloadBytes(']) expect(shared, n).toContain(n);
    expect(code('src/components/instructor/IssuesBoard.tsx')).toContain('buildIssuesPdf(');
    // the helper is the one place a file is handed to the browser
    const helper = code('src/lib/download.ts');
    expect(helper).toContain('export function downloadBytes(');
    expect(helper.match(/URL\.createObjectURL/g)).toHaveLength(1);
    // the words: "Download PDF" is the registry's, and the credential file is gone
    expect(code('src/lib/docs/skillsCopy.ts')).toContain("download: 'Download PDF'");
    expect(code('src/lib/docs/skillsCopy.ts')).not.toContain('exportCredential');
    expect(code('src/lib/memberExport.ts')).not.toContain('CREDENTIAL_FILENAME');
  });

  it('the files that are still JSON are the ones that are machine-read, and they are listed here', () => {
    // A page that saves JSON (a Blob of it, downloadText with its type, or a file named .json) must be on this list, with the reason.
    const MACHINE_READ = [
      'src/app/account/page.tsx', // the complete data export: the privacy policy promises it as JSON, and it is the member's to move elsewhere
      'src/app/courses/[courseId]/docs/page.tsx', // "Export my work" is a handoff file a teammate restores and merges (`docs/handoff.ts`), which a PDF cannot be
      'src/app/instructor/[courseId]/page.tsx', // the Studio's course document, which the Studio imports again
      'src/app/instructor/page.tsx', // the course export, imported again
      'src/app/instructor/issues/page.tsx', // the fix bundle and the live course document, for folding fixes into the code
      'src/components/cloud/IacViewer.tsx', // template files a lab step asks for, which are JSON because the tool reads JSON
      'src/app/instructor/[courseId]/record/page.tsx', // R141: the project architecture and infrastructure documents, published shapes an agent reads
    ];
    const saves = collectSourceFiles('src').filter((f) => {
      const src = code(f);
      return (
        /(?:download|downloadText)\([^\n]*\.json/.test(src) ||
        /\.download = [^\n]*\.json/.test(src) ||
        (src.includes("'application/json'") && (src.includes('new Blob') || src.includes('downloadText(')))
      );
    });
    expect(saves.sort()).toEqual([...MACHINE_READ].sort());
    // and the account page says what that file is for, and where the readable summary is
    expect(code('src/app/account/page.tsx')).toContain('data-account-export');
  });

  it('the PDF says what it holds, in the register, and leaves out what it does not hold', () => {
    const src = code('src/lib/recordPdf.ts');
    for (const n of ['SKILLS_COPY.pdf.claim', 'SKILLS_COPY.pdf.unsigned', 'if (issues) issuesSection(', 'MAX_ISSUES', 'NOTE_CHARS']) expect(src, n).toContain(n);
    // nothing in it is ranked or badged: no string the PDF prints says so
    const literals = [...src.matchAll(/'([^'\n]*)'|`([^`\n]*)`/g)].map((m) => m[1] ?? m[2] ?? '');
    for (const text of literals) expect(text, text).not.toMatch(/\b(rank|ranked|ranking|percent|leaderboard|badge)\b/i);
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### Exports are a compact PDF (R127)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| PDF exports |');
    expect(read('docs/OPERATIONS.md')).toContain('**PDF exports (R127):**');
    const list = read('docs/FIX_LIST.md');
    expect(list).toContain('| F6 | An export is a compact PDF of skills, progress and issues, not a JSON file | R127 | Done |');
    expect(list).toContain('Still machine-readable');
  });
});

/**
 * R128 — the agreements gate says why it failed (fix list F7). The write is a plain insert (no upsert shape),
 * the hash is optional, an expired session is refreshed once, and the console gets the code.
 */
describe('R128 — the acceptance write fails legibly', () => {
  it('is a typed, tolerant write and the gate uses it', () => {
    const src = code('src/lib/legal/acceptances.ts');
    for (const n of ['acceptInCloudDetailed', 'classifyAcceptError', 'refreshSession()', "'23505'", 'reportError({ area: \'agreements\'']) expect(src, n).toContain(n);
    // R129: no technical detail is left in the browser
    expect(src, 'no console output in the acceptance module').not.toMatch(/console\.(error|warn|log)/);
    expect(src, 'no ON CONFLICT upsert on the log').not.toContain('ignoreDuplicates');
    const gate = code('src/components/legal/AgreementGate.tsx');
    for (const n of ['acceptInCloudDetailed(', "result.reason === 'session'", "result.reason === 'permission'", 'supportLine(result.support)']) expect(gate, n).toContain(n);
    expect(read('SUPABASE_SETUP.md')).toContain('A student cannot get past the agreements checkbox (R128)');
    expect(read('docs/FIX_LIST.md')).toContain('| F7 |');
  });
});

/**
 * R129 — a failure is a support code and a time for the student, and the detail for the admin only (fix list F8):
 * the log table is admin-read and append-only, the student-facing text carries no database wording, and the
 * acceptance module prints nothing to the console.
 */
describe('R129 — support codes, details on our side', () => {
  it('the log is written by the person it is about and read by an admin only', () => {
    const sql = read('supabase/migrations/0020_client_errors.sql');
    for (const n of ['create table if not exists public.client_errors', 'with check (user_id = auth.uid())', 'using (public.is_admin())', 'revoke update, delete, truncate on public.client_errors', "support_code ~ '^E-[A-Z0-9]{6}$'"]) expect(sql, n).toContain(n);
    expect(read('supabase/setup.sql')).toContain('create table if not exists public.client_errors');
    expect(read('supabase/tests/rls.sql')).toContain('R129: the support log');
  });

  it('the student sees the code and the time, through one helper, and no database wording', () => {
    const gate = code('src/components/legal/AgreementGate.tsx');
    for (const n of ['supportLine(result.support)', 'result.support']) expect(gate, n).toContain(n);
    for (const bad of ['result.code', 'result.message', '42501', 'row-level']) expect(gate, bad).not.toContain(bad);
    const rep = code('src/lib/reportError.ts');
    for (const n of ["from('client_errors').insert(", 'export function supportCode', 'Never throws']) expect(rep + read('src/lib/reportError.ts'), n).toContain(n);
    expect(rep, 'the log write is best effort and silent').not.toMatch(/console\./);
  });

  it('the admin finds a code on the metrics page, behind the admin gate', () => {
    expect(code('src/app/instructor/metrics/page.tsx')).toContain('<ErrorLog data={errors}');
    expect(code('src/components/instructor/ErrorLog.tsx')).toContain('data-error-log');
    for (const bad of ['taskReportsRepo', 'localStorage', 'useClientStore']) expect(code('src/components/instructor/ErrorLog.tsx'), bad).not.toContain(bad);
  });

  it('the docs say it, including what a gate is', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### Support codes and the support log (R129)');
    expect(read('docs/ARCHITECTURE.md')).toContain('What a "gate" is');
    expect(read('SUPABASE_SETUP.md')).toContain('Looking up a support code (R129)');
    expect(read('docs/OPERATIONS.md')).toContain('**Support codes (R129):**');
    expect(read('docs/FIX_LIST.md')).toContain('| F8 |');
  });
});

/**
 * R133 — the eight domains and the fourteen categories: two pure projections
 * over the profile and the board, two props-only components, the record
 * leading with the categories and keeping the twelve figures, and the docs.
 */
describe('R133 — the eight domains and the fourteen categories', () => {
  it('the projections are pure and the components take props only', () => {
    for (const f of ['src/lib/skillDomainsView.ts', 'src/lib/recordCard.ts']) {
      const src = code(f);
      expect(src, `${f}: no runtime data import`).not.toMatch(/^import (?!type )[^\n]*from '\.\/data\//m);
      expect(src, `${f}: no storage`).not.toMatch(/localStorage|supabase|Repo\b|fetch\(/);
      expect(src, `${f}: no clock`).not.toMatch(/Date\.now\(\)/);
      expect(src, `${f}: no ranking`).not.toMatch(/\brank(ing|ed)?\b|leaderboard|badge|\bXP\b/i);
    }
    expect(code('src/lib/recordCard.ts')).toContain('export function recordCards(');
    expect(code('src/lib/recordCard.ts')).toContain('tierOf(verified, PROFESSIONAL_THRESHOLD)');
    expect(code('src/lib/skillDomainsView.ts')).toContain('export function domainSections(');
    for (const f of ['src/components/skills/DomainBoard.tsx', 'src/components/skills/RecordCategories.tsx']) {
      expect(code(f), `${f} reads no repository`).not.toMatch(/from '@\/lib\/data'/);
      expect(code(f), `${f} reads no document`).not.toContain('useCourseDocument');
    }
  });

  it('the Skill board draws the domains between the map and the KPI board; the dashboard leads with the categories and keeps the twelve figures', () => {
    const page = code('src/app/courses/[courseId]/skills/page.tsx');
    expect(page).toContain('domainSections(profile, board, registry.DOMAINS, measure)');
    expect(page.indexOf('<DomainBoard ')).toBeGreaterThan(page.indexOf('<SkyMap '));
    expect(page.indexOf('<DomainBoard ')).toBeLessThan(page.indexOf('<KpiBoard '));
    const dash = code('src/app/dashboard/page.tsx');
    for (const n of ['<RecordCategories ', 'recordCards(cards.map(recordCourseInputOf)', 'categoryDetail(openCategory, cards.map(courseFactsOf))', '<RecordStrip tiles={tiles}', 'words.COPY.progressFigures']) expect(dash, n).toContain(n);
    expect(dash.indexOf('<RecordCategories ')).toBeLessThan(dash.indexOf('<RecordStrip '));
    expect(code('src/lib/recordFacts.ts')).toContain('export function recordCourseInputOf(');
    expect(code('src/lib/recordDetail.ts')).toContain('export function categoryDetail(');
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### The eight domains and the fourteen categories (R133)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| The eight domains and the fourteen categories |');
    expect(read('docs/OPERATIONS.md')).toContain('**The eight domains and the fourteen categories (R133):**');
    expect(read('docs/FIX_LIST.md')).toContain('| F11 |');
    expect(read('docs/SCORING.md')).toContain('## The tier');
  });
});

/**
 * R134 — the scores and the timing reach every KPI surface, the cohort report
 * folds them, the record by category travels in the export, the credential,
 * the PDF and the shared page, and the instructor marks each rubric category.
 */
describe('R134 — scores, timing and the record by category on every surface', () => {
  it('the KPI tiles, table and pack read the unit; the board prints the scores and the timing', () => {
    const board = code('src/components/skills/KpiBoard.tsx');
    for (const n of ['function ScoresSection(', 'function TimingSection(', 'data-kpi-scores', 'data-kpi-timing', "k.unit === 'minutes'", 'data-score-components']) expect(board, n).toContain(n);
    expect(board, 'the capstone tile is gone with its KPI').not.toContain('kpi.outcome.capstone-filed');
    const table = code('src/components/skills/KpiTable.tsx');
    for (const n of ['data-kpi-scores-table', "k.unit === 'minutes'", "k.unit === 'count'"]) expect(table, n).toContain(n);
    const pack = code('src/components/skills/KpiPack.tsx');
    expect(pack).toContain("const figureOf = (k: KpiValue) => (off(k) ? offWord(k) : k.unit === 'count'");
    expect(pack).toContain("const HERO = 'kpi.technical.skills-verified'");
  });

  it('the cohort report folds score means and the timing, carries no member, and sums only ratios', () => {
    const cohort = code('src/lib/cohortKpi.ts');
    for (const n of ['scores: { id: string; mean: number; loaded: number }[]', 'timing: { timedSteps: number; withinHour: number; over24h: number; medianMinutes: number | null }', "if (k.unit === 'ratio' && k.notMeasured !== 'role')"]) expect(cohort, n).toContain(n);
    expect(cohort, 'the running sums stay out of the report').toContain('interface Running');
    expect(code('src/components/instructor/CohortKpiPanel.tsx')).toContain('data-cohort-scores');
    expect(code('src/components/instructor/CohortKpiPanel.tsx')).toContain('data-cohort-timing');
  });

  it('the record by category travels: export, credential, PDF, shared page; the instructor marks each category', () => {
    expect(code('src/lib/memberExport.ts')).toContain('categories?: RecordCategoryCard[]');
    expect(code('src/lib/memberExport.ts')).toContain('resultDescription: `record ${c.id}`');
    expect(read('content/schemas/member-profile.schema.json')).toContain('"recordCategory"');
    expect(code('src/lib/recordPdf.ts')).toContain('function categoriesSection(');
    expect(code('src/lib/recordPdf.ts')).toContain("scores: asArray(c.scores)");
    expect(code('src/components/share/SharedProfile.tsx')).toContain('data-share-categories');
    expect(code('src/app/dashboard/page.tsx')).toContain('categories: categoryCards');
    const cell = code('src/components/instructor/ReviewCell.tsx');
    expect(cell).toContain('reviewRepo.saveMarks(');
    expect(cell).toContain('data-review-marks');
    expect(cell).toContain('RUBRIC_CATEGORIES.map(');
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### The workforce-readiness pipeline (R132 to R134)');
    expect(read('docs/EVENTS.md')).toContain('`decided`');
    expect(read('docs/EVENTS.md')).toContain('`marked`');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Scores, timing and the record by category on every surface |');
    expect(read('docs/OPERATIONS.md')).toContain('**Scores, timing and the record by category (R134):**');
    expect(read('docs/FIX_LIST.md')).toContain('| F12 |');
  });
});

describe('R135 — ownership and hardening', () => {
  it('the work is owned: a proprietary licence, the package says so, and every path has an owner', () => {
    const licence = read('LICENSE');
    expect(licence).toContain('Copyright (c) 2026 akplearner');
    expect(licence).toContain('All rights reserved');
    expect(licence).not.toMatch(/MIT License|Apache License|GNU General Public/);
    const pkg = JSON.parse(read('package.json')) as { private?: boolean; license?: string; author?: string };
    expect(pkg.private).toBe(true);
    expect(pkg.license).toBe('UNLICENSED');
    expect(pkg.author).toBe('akplearner');
    expect(read('.github/CODEOWNERS')).toContain('* @akplearner');
    expect(read('README.md')).toContain('## Ownership');
    for (const f of ['NOTICE.md', 'SECURITY.md', '.github/dependabot.yml']) expect(read(f).length, f).toBeGreaterThan(100);
  });

  it('no lab password literal is anywhere in src; the placeholder is the single source', () => {
    const files = collectSourceFiles('src');
    const offenders = files.filter((f) => /Pass@2026/.test(read(f)) && !f.endsWith('page-shape.test.ts'));
    expect(offenders).toEqual([]);
    expect(code('src/lib/labTopology.ts')).toContain("password: 'set by the instructor'");
    expect(code('src/lib/serverTopology.ts')).toContain("password: 'set by the instructor'");
  });

  it('CI runs read-only, pinned, with a security job', () => {
    const ci = read('.github/workflows/ci.yml');
    expect(ci).toContain('permissions:\n  contents: read');
    expect(ci).not.toMatch(/uses: [\w-]+\/[\w-]+@v\d/);
    expect(ci.match(/uses: [\w-]+\/[\w-]+@[0-9a-f]{40}/g)?.length).toBeGreaterThanOrEqual(7);
    expect(ci).toContain('security:');
    expect(ci).toContain('npm audit --omit=dev --audit-level=high');
    expect(ci).toContain('gitleaks/gitleaks-action@');
  });

  it('the database closes the holes: migration 0023 is in setup.sql and rls.sql proves each refusal', () => {
    const m = read('supabase/migrations/0023_hardening.sql');
    for (const n of [
      'revoke insert on public.profiles from anon, authenticated',
      'function public.team_has_review(u uuid, c text)',
      "new.level := 'verified'",
      'task_reports_cap',
      'client_errors_guard',
      'profiles_avatar_https',
      'updated_by is null or updated_by = auth.uid()',
      'public.on_team(course_id, team_id)',
      'alter table public.deliverable_review_marks alter column reviewer_id drop not null',
    ]) expect(m, n).toContain(n);
    expect(read('supabase/setup.sql')).toContain('0023_hardening.sql');
    const t = read('supabase/tests/rls.sql');
    for (const n of ['zed inserted his own profile row', 'cy: reviewed without a review is verified', 'ada filed a 51st report in one day', 'ada set a javascript: avatar', 'ada signed a form as bob', 'has no search_path']) expect(t, n).toContain(n);
  });

  it('the functions fail closed on origin and cap what they mint; the dashboard copies carry it', () => {
    const cors = read('supabase/functions/_shared/cors.ts');
    expect(cors).toContain("'app-origin-unset'");
    expect(cors).not.toContain("requestOrigin ?? '*'");
    const limits = read('supabase/functions/_shared/limits.ts');
    expect(limits).toContain('SHARE_MAX_LIVE = 20');
    expect(limits).toContain('STAMPS_PER_HOUR = 120');
    expect(limits).toContain('NOTIFY_PER_DAY = 10');
    expect(read('supabase/functions/share/index.ts')).toContain("'too-many-links'");
    expect(read('supabase/functions/stamp/index.ts')).toContain("'too-many-stamps'");
    const notify = read('supabase/functions/report-notify/index.ts');
    expect(notify).toContain('notifyMessage(');
    expect(notify).not.toContain('body.note');
    expect(notify).not.toContain('body.displayName');
    expect(read('supabase/functions/delete-account/index.ts')).toContain("'delete-failed'");
    expect(read('supabase/functions/delete-account/index.ts')).not.toContain('error: error.message');
    for (const f of ['share', 'stamp', 'report-notify']) expect(read(`supabase/dashboard/${f}.ts`), f).toContain('overCap(');
  });

  it('the app: one formula-safe CSV helper, the avatar hosts in the CSP, the outbox cleared on sign-out', () => {
    expect(code('src/lib/csv.ts')).toContain('export const FORMULA_START');
    expect(code('src/lib/docs/report.ts')).toContain("import { csvEscape } from '../csv'");
    expect(code('src/lib/docs/report.ts')).not.toContain('function csvEscape(');
    const csp = read('next.config.ts');
    expect(csp).toContain("img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com");
    expect(code('src/lib/data/outbox.ts')).toContain('export function clearDeliverableOutbox()');
    expect(code('src/lib/useAuth.ts')).toContain('clearDeliverableOutbox();');
  });

  it('the docs say it', () => {
    expect(read('SUPABASE_SETUP.md')).toContain('**Migration 0023**');
    expect(read('SUPABASE_SETUP.md')).toContain('`app-origin-unset`');
    expect(read('docs/OPERATIONS.md')).toContain('## Security settings the owner keeps (R135)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Ownership and hardening |');
    expect(read('docs/FIX_LIST.md')).toContain('| F13 |');
    expect(read('docs/ARCHITECTURE.md')).toContain('### Ownership and the hardening layer (R135)');
    expect(read('SECURITY.md')).toContain('## What the code enforces (R135)');
  });
});

describe('R136 — every fact reaches the projection', () => {
  const CALLERS = ['src/app/courses/[courseId]/skills/page.tsx', 'src/components/skills/SkillsCard.tsx', 'src/app/dashboard/page.tsx', 'src/app/portfolio/page.tsx'];

  it('the four member surfaces build the team and own facts through the one loader, and hand the calendar in', () => {
    for (const f of CALLERS) {
      const src = code(f);
      expect(src, f).toContain('teamFactsOf(');
      expect(src, f).toContain('ownFactsOf(');
      expect(src, f).toContain('weekDueOf(');
      expect(src, `${f} builds no team facts by hand`).not.toMatch(/reviews:\s*reviewRepo\.list\(/);
    }
    const facts = code('src/lib/recordFacts.ts');
    for (const n of ['marks: reviewRepo.marks(', 'flagEvents: stepNotesRepo.flagEvents(', 'submissionsRepo.peerReviewCounts(', 'weekDueFrom(']) expect(facts, n).toContain(n);
  });

  it('the cohort report stands on the same facts: marks, flag history, review counts and the calendar', () => {
    const page = code('src/app/instructor/[courseId]/cohort/page.tsx');
    for (const n of ['marksFor: (t) => data.marks[t]', 'flagEventsFor: (m) => data.flagEvents[m]', 'peerReviewsFor: (m) => data.peerReviewCounts[m]', 'weekDueFor: (c) => weekDueFrom(']) expect(page, n).toContain(n);
    const loader = code('src/lib/data/cohortLoader.ts');
    for (const n of ["from('deliverable_review_marks')", "from('step_flag_events')", "select('id, submission_id, reviewer_id')"]) expect(loader, n).toContain(n);
  });

  it('the history tables arrive live, and a tick is not an attempt', () => {
    const cache = code('src/lib/data/supabaseCache.ts');
    const realtime = cache.slice(cache.indexOf('function subscribeRealtime'));
    for (const t of ['deliverable_review_marks', 'step_flag_events']) expect(realtime, t).toContain(`table: '${t}'`);
    expect(read('supabase/migrations/0024_history_realtime.sql')).toContain("array['deliverable_review_marks', 'step_flag_events']");
    expect(read('supabase/setup.sql')).toContain('0024_history_realtime.sql');
    const ledger = code('src/lib/evidenceLedger.ts');
    const tick = ledger.slice(ledger.indexOf('export function selfAttested'));
    expect(tick).toContain('firstAttemptAt: prev?.firstAttemptAt,');
    expect(tick, 'only a paste stamps the first attempt').not.toContain('?? next.at');
  });

  it('one rule for the forms a role fills; a decision stamps only its maker; the import re-signs what travels', () => {
    const profile = code('src/lib/skillProfile.ts');
    expect(profile).toContain('export function roleFormsOf<');
    expect((profile.match(/roleFormsOf\(input\.deliverables, role\)/g) ?? []).length).toBe(2);
    expect(profile).not.toContain("d.raci?.reviews === role || d.raci?.approves === role");
    expect(code('src/lib/recordCard.ts')).toContain("fields[`${decisionKey(b.id)}:by`] === input.memberId");
    const imp = code('src/components/auth/ImportPrompt.tsx');
    for (const n of ['rewriteDecisionAuthors(data, oldId, user.id)', 'statusRepo.save({ ...row, changedBy: user.id })', 'stepNotesRepo.save(user.id, note)']) expect(imp, n).toContain(n);
    const cell = code('src/components/instructor/ReviewCell.tsx');
    expect(cell).toContain('latestMarks(reviewRepo.marks(courseId, teamId), deliverableId, week)');
    expect(cell).toContain('marks[c.id] !== previous[c.id]');
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### Every fact reaches the projection (R136)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Every fact reaches the projection |');
    expect(read('docs/FIX_LIST.md')).toContain('| F14 |');
    expect(read('docs/OPERATIONS.md')).toContain('**Every fact reaches the projection (R136):**');
    expect(read('SUPABASE_SETUP.md')).toContain('**Migration 0024**');
    const catalogue = code('src/lib/docs/metricCatalogue.ts');
    expect(catalogue).not.toContain('Loads when the page hands the queue in.');
  });
});

describe('R137 — measured as documented, and not measured is a state', () => {
  it('the board carries applies and the reason; the surfaces say it in words; no 0 of 0', () => {
    const board = code('src/lib/kpiBoard.ts');
    for (const n of ['applies: boolean;', "notMeasured?: 'role' | 'yet';", "v.offered === 0 ? 'role' : 'yet'", 'const evidenced = (r: ProfileRow)', 'of: coverage.of - coverage.untaught']) expect(board, n).toContain(n);
    expect(read('content/schemas/kpi-board.schema.json')).toContain('"notMeasured"');
    for (const f of ['src/components/skills/KpiBoard.tsx', 'src/components/skills/KpiTable.tsx', 'src/components/skills/KpiPack.tsx']) {
      const src = code(f);
      expect(src, f).toContain('data-applies={k.applies}');
      expect(src, f).toContain('notMeasuredRole');
    }
    expect(code('src/components/instructor/CohortKpiPanel.tsx')).toContain("{ id: 'notMeasured', Icon: CircleOff }");
    const copy = code('src/lib/docs/skillsCopy.ts');
    for (const n of ['notMeasuredRole:', 'notMeasuredYet:', 'notLoadedOwn:', "notMeasured: 'Not measured'"]) expect(copy, n).toContain(n);
  });

  it('graded weeks only; decisions are the drafter’s; the cohort lays the ledger over and bands per unit', () => {
    const profile = code('src/lib/skillProfile.ts');
    expect(profile).toContain("DENOMINATOR = 'own ticks · graded weeks · required steps'");
    expect(profile).toContain('getTasksByRole(course, role).filter((t) => isGradedWeek(course, t.week))');
    expect(profile).toContain('for (const d of draftForms) for (const b of decisionBlocksOf(d))');
    expect(profile).toContain('offered?: number;');
    const cohort = code('src/lib/cohortKpi.ts');
    for (const n of ["'notMeasured'", 'earnedFor?(memberId: string)', 'applyEarned(live, ledger)', "if (v.unit === 'count')"]) expect(cohort, n).toContain(n);
    expect(code('src/lib/data/cohortLoader.ts')).toContain("from('earned_skills')");
    expect(code('src/app/instructor/[courseId]/cohort/page.tsx')).toContain('earnedFor: (m) => data.earned[m]');
    expect(code('src/lib/scores.ts')).toContain('applies !== false');
  });

  it('every course and role runs through the pipeline, with the content debt pinned for R138', () => {
    expect(read('src/lib/kpiBoard.allCourses.test.ts')).toContain('SEED_COURSES.flatMap((c) => c.roles.map((r) => [c.id, r.id] as const))');
    expect(read('src/lib/kpiBoard.allCourses.fixture.ts')).toContain('export function fullMemberInput(');
    expect(read('scripts/kpi-debt.ts')).toContain('kpiBoard.allCourses.allow.json');
    expect(() => JSON.parse(read('src/lib/kpiBoard.allCourses.allow.json'))).not.toThrow();
  });

  it('the docs say it', () => {
    expect(read('docs/SCORING.md')).toContain('## Not measured, and the graded weeks (R137)');
    expect(read('docs/ARCHITECTURE.md')).toContain('### Measured as documented, and "not measured" is a state (R137)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Measured as documented, not-measured state |');
    expect(read('docs/FIX_LIST.md')).toContain('| F15 |');
    expect(read('docs/OPERATIONS.md')).toContain('**Not measured is a state (R137):**');
  });
});

describe('R138 — every course feeds every KPI for every role', () => {
  it('hand-offs name their form, generated where none was authored; the export carries them', () => {
    const h = code('src/lib/docs/handoffForms.ts');
    for (const n of ['export const HANDOFF_FORMS', 'export function generatedHandoff(', 'export function withHandoffForms<']) expect(h, n).toContain(n);
    expect(code('src/lib/content/dto.ts')).toContain('course: serialisable(withHandoffForms(course, seedDeliverablesForCourse(courseId)))');
  });

  it('a change table with a rollback column in every course, a fault table per role, document control on every form', () => {
    const cats = code('src/lib/docs/recordCategories.ts');
    for (const form of ['change_log', 'mssp_control_matrix', 'cysa_soc_monitoring', 'ap_os', 'secai_control_set', 'cissp_d8', 'incident', 'server', 'change']) expect(cats, form).toMatch(new RegExp(`form: '${form}', group: '[a-z_]+', rollback: 'rollback'`));
    for (const form of ['pentest_report', 'risk_register', 'mssp_detection_rules', 'mssp_internal_audit', 'cysa_scan_validation', 'secai_control_set', 'secai_governance_pack', 'cissp_d4', 'cissp_d7']) expect(cats, form).toContain(`{ form: '${form}', group:`);
    expect(code('src/lib/docs/derive.ts')).toContain('export function withDocumentControl(');
    expect(code('src/lib/docs/derive.ts')).toContain('const def = withDocumentControl(raw);');
  });

  it('every standard cites a control and keeps its practices; the cloud roles each draft a document; the work roles carry the cloud area', () => {
    expect(code('src/lib/docs/standards.ts')).toContain('export function practiceKeyOf(');
    expect(code('src/lib/docs/skillsSection.ts')).toContain('CONTROL_EXCEPTIONS[practiceKeyOf(f.standard)]');
    expect(code('src/lib/docs/skillCoverage.ts')).toContain('CONTROL_EXCEPTIONS[practiceKeyOf(form.standard)]');
    const raci = code('src/lib/docs/raci.ts');
    for (const n of ["foundation: r('infra'", "api: r('dev'", "incident: r('secops'", "handover: r('arch'"]) expect(raci, n).toContain(n);
    expect(code('src/lib/docs/cloudDeliverables.ts')).toContain('owner: CLOUD_RACI[slug].drafts,');
    const roles = code('src/lib/docs/workRoles.ts');
    expect(roles).toContain("['detect', 'harden', 'ops', 'cloud']");
    expect(roles).toContain("['sysadmin', 'hardware', 'virt', 'continuity', 'observe', 'docs', 'cloud']");
  });

  it('the proof steps: CCNA show commands, the GRC lanes’ hashes and counts, the cloud Architect’s read-backs; the debt is empty', () => {
    const ccna = read('src/lib/data/seed/ccna.ts');
    expect((ccna.match(/R138: the proof step/g) ?? []).length).toBe(22);
    for (const n of ["cmd: 'show vlan brief'", "cmd: 'show interfaces trunk'", "cmd: 'show ip ospf neighbor'", "cmd: 'show ip access-lists'", "cmd: 'show port-security'"]) expect(ccna, n).toContain(n);
    expect((read('src/lib/data/seed/mssp.ts').match(/R138: the proof step/g) ?? []).length).toBe(18);
    expect((read('src/lib/content-data.ts').match(/R138: the proof step/g) ?? []).length).toBe(3);
    expect(code('src/lib/data/seed/cissp.ts')).toContain("id: 'ci-w3-gov-s3'");
    for (const f of ['src/lib/data/seed/azureCloud.ts', 'src/lib/data/seed/awsCloud.ts']) expect((read(f).match(/R138: a second proof/g) ?? []).length, f).toBe(3);
    expect(JSON.parse(read('src/lib/kpiBoard.allCourses.allow.json'))).toEqual({});
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### Every course feeds every KPI for every role (R138)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Every course feeds every KPI for every role |');
    expect(read('docs/FIX_LIST.md')).toContain('| F16 |');
    expect(read('docs/OPERATIONS.md')).toContain('**Every course feeds every KPI (R138):**');
  });
});

describe('R139 — the project record, its history and its conflicts', () => {
  it('the registry, the extractor and the rules are one pure module, published in the ontology', () => {
    const r = code('src/lib/docs/projectRecord.ts');
    for (const n of ['export const RECORD_FIELDS: RecordField[]', 'export function projectRecord(', 'export function recordConflicts(', 'export function conflictsOnForm(', 'withoutSeedRows(def, raw)']) expect(r, n).toContain(n);
    for (const rule of ['duplicate-value', 'duplicate-address', 'address-outside-prefix', 'prefixes-overlap', 'port-reused', 'undeclared-host', 'ram-over-committed', 'cpu-over-committed', 'published-port-not-listening']) expect(r, rule).toContain(`'${rule}'`);
    expect(r).not.toMatch(/from '\.\.\/data|Repo\b/);
    const o = code('src/lib/docs/ontology.ts');
    expect(o).toContain("'project-record'");
    expect(o).toMatch(/export const ONTOLOGY_VERSION = '2\.[1-9]\d*\.\d+';/);
  });

  it('two typed columns, hinted in both renderers and checked by the derived validators; the free-text columns are retyped', () => {
    expect(code('src/lib/grc/templates.ts')).toMatch(/\| 'cidr'[\s\S]*\| 'port';/);
    expect(code('src/lib/docs/types.ts')).toMatch(/\| 'cidr'\n\s+\| 'port';/);
    for (const n of ['isCidr', 'isPort']) {
      expect(code('src/components/grc/RegisterTable.tsx'), n).toContain(n);
      expect(code('src/components/docs/DeliverableForm.tsx'), n).toContain(n);
    }
    expect(code('src/lib/docs/derive.ts')).toContain("if (col.type === 'cidr')");
    expect(code('src/lib/docs/derive.ts')).toContain("if (col.type === 'port')");
    expect(code('src/lib/docs/cloudDeliverables.ts')).toContain("type: 'cidr'");
    expect(code('src/lib/docs/cloudDeliverables.ts')).toContain("c('port', 'Port', 'port'");
    expect(code('src/lib/docs/ccnaDeliverables.ts')).toContain("c('prefix', 'Prefix', 'cidr'");
    expect(code('src/lib/docs/networkPlusDeliverables.ts')).toContain("c('prefix', 'Prefix', 'cidr'");
    expect(code('src/lib/docs/serverPlusDeliverables.ts')).toContain("c('host_port', 'Host port', 'port'");
    expect(code('src/lib/docs/serverPlusDeliverables.ts')).toContain("group: 'vms',");
    expect(code('src/lib/docs/definitions.ts')).toContain("c('ip', 'IP address', 'ipv4'");
  });

  it('the Consistency category reads the record when the documents are handed in, and the live panel hands them in', () => {
    const rubric = code('src/lib/docs/deliverableRubric.ts');
    expect(rubric).toContain('docs?: Record<string, DeliverableData>;');
    expect(rubric).toContain("conflictsOnForm(recordConflicts(projectRecord({ ...ctx.docs, [def.id]: d }, ctx.defs)), def.id)");
    expect(rubric).toContain("conflicts.every((i) => i.ok || i.severity === 'warn')");
    expect(code('src/components/docs/ExpectationsPanel.tsx')).toContain('docs: ctx?.docs, defs: ctx?.defs');
    expect(code('src/app/courses/[courseId]/docs/page.tsx')).toContain('instructorReview={review?.status} ctx={ctx} />');
    // A frozen snapshot judges the form alone.
    expect(code('src/lib/docs/validateDeliverable.ts')).toContain("evaluateBundle(derived, data, { evidence: {}, steps: [], week: def.weeks[0] })");
  });

  it('migration 0025 keeps the history: append-only, the database’s clock, the trigger the only writer; both repositories read it', () => {
    const sql = read('supabase/migrations/0025_deliverable_history.sql');
    for (const n of ['create table if not exists public.deliverable_history', 'revoke insert, update, delete, truncate on public.deliverable_history from anon, authenticated', "interval '5 minutes'", '>= 500', 'before update on public.deliverables', 'security definer set search_path = public', 'public.on_team(course_id, team_id)']) expect(sql, n).toContain(n);
    expect(read('supabase/tests/rls.sql')).toContain("'ada: a second save in the sitting is not a version'");
    expect(read('supabase/tests/rls.sql')).toContain("'cy: not team 01''s history'");
    expect(code('src/lib/data/types.ts')).toContain('history(courseId: string, teamId: string): Promise<DeliverableVersion[]>;');
    expect(code('src/lib/data/supabaseDocsRepo.ts')).toContain(".from('deliverable_history')");
    expect(code('src/lib/data/localStorageDocsRepo.ts')).toContain('export const HISTORY_SITTING_MS = 5 * 60_000;');
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### The project record (R139)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| The project record, its history and its conflicts |');
    expect(read('docs/FIX_LIST.md')).toContain('| F17 |');
    expect(read('docs/OPERATIONS.md')).toContain('**The project record (R139):**');
    expect(read('SUPABASE_SETUP.md')).toContain('**Migration 0025**');
  });
});

describe('R140 — longitudinal validation, the task timer, the validation family and the Understanding score', () => {
  it('the plan and the generator are pure, and the projection runs the same generator', () => {
    const plan = code('src/lib/validation/plan.ts');
    for (const n of ['export function validationPlanOf(', 'export function checkpointsReached(']) expect(plan, n).toContain(n);
    const acts = code('src/lib/validation/activities.ts');
    for (const n of ['export function validationActivities(', 'export function judgeAnswer(', 'export function stableShuffle<', "`val:${input.checkpoint.week}:recall:${e.key}`"]) expect(acts, n).toContain(n);
    expect(acts).not.toMatch(/Math\.random|Date\.now|from '\.\.\/data|Repo\b/);
    const profile = code('src/lib/skillProfile.ts');
    expect(profile).toContain('function validationIndicators(');
    expect(profile).toContain("validationActivities({ course, defs: input.deliverables, record, conflicts, checkpoint })");
    expect(code('src/components/validation/ValidationSection.tsx')).toContain('validationActivities({ course, defs, record, conflicts, checkpoint })');
  });

  it('the panel is props only and never prints the recorded value; the section stores the hash', () => {
    const panel = code('src/components/validation/ValidationPanel.tsx');
    expect(panel).not.toMatch(/Repo\b|from '@\/lib\/data'/);
    expect(panel).not.toMatch(/\{activity\.answer\}|\{a\.answer\}/);
    expect(panel).toContain('data-validation-panel');
    expect(code('src/components/validation/ValidationSection.tsx')).toContain('sha256Text(given.trim())');
    expect(code('src/app/courses/[courseId]/page.tsx')).toContain('<ValidationSection course={course} member={member} currentWeek={effectiveWeek} />');
  });

  it('every task has a pausable timer: a reducer, one hook, a cover that hides the content, both repositories carrying the field', () => {
    const reducer = code('src/lib/taskTimer.ts');
    for (const n of ['export function startTimer(', 'export function stopTimer(', 'export function stopAll(', 'export function totalMinutes(']) expect(reducer, n).toContain(n);
    const hook = code('src/lib/useTaskTimer.ts');
    for (const n of ["document.addEventListener('visibilitychange', onVisibility)", "window.addEventListener('pagehide', onLeave)", 'paused: openTaskId', 'paused: null']) expect(hook, n).toContain(n);
    expect(code('src/components/course/PauseCover.tsx')).toContain('fixed inset-0 z-50');
    expect(code('src/components/course/CourseSubNavActions.tsx')).toContain('data-pause-task');
    expect(code('src/components/course/TaskPane.tsx')).toContain('data-pane-elapsed');
    const page = code('src/app/courses/[courseId]/page.tsx');
    expect(page).toContain('useTaskTimer(course.id, member?.memberId ?? null, openTaskId)');
    expect(page).toContain('paused={member && timer.paused ? { taskId: timer.paused, elapsedMs: timer.pausedElapsedMs, onResume: timer.resume } : null}');
    expect(code('src/components/course/CourseOverlays.tsx')).toContain('<PauseCover taskTitle=');
    expect(code('src/lib/data/types.ts')).toContain('timers?: Record<string, TaskTimer>;');
    expect(code('src/lib/data/localStorageUserStateRepo.ts')).toContain('KEYS.timers(courseId, memberId)');
    expect(code('src/components/auth/ImportPrompt.tsx')).toContain('KEYS.timers(course.id, oldId)');
    expect(code('src/components/auth/ImportPrompt.tsx')).toContain('KEYS.validation(course.id, oldId)');
  });

  it('migration 0026 keeps the answers append-only with the database’s clock; both repositories and both hydrates read it', () => {
    const sql = read('supabase/migrations/0026_validation_answers.sql');
    for (const n of ['create table if not exists public.validation_answers', "kind in ('recall', 'apply', 'explain', 'consistency')", 'revoke update, delete, truncate on public.validation_answers from anon, authenticated', '>= 200', 'new.at := clock_timestamp();', 'public.on_team(course_id, team_id)']) expect(sql, n).toContain(n);
    expect(read('supabase/tests/rls.sql')).toContain("'ada: answered as bob'".replace("'ada: answered as bob'", "'ada answered as bob'"));
    expect(code('src/lib/data/supabaseValidationRepo.ts')).toContain(".from('validation_answers')");
    const cache = code('src/lib/data/supabaseCache.ts');
    expect(cache).toContain("supabase.from('validation_answers').select('*').eq('course_id', courseId)");
    expect(cache).toContain("supabase.from('validation_answers').select('*').eq('user_id', currentUserId)");
    expect(code('src/lib/data/cohortLoader.ts')).toContain("supabase.from('validation_answers').select('*').eq('course_id', course.id)");
    expect(code('src/lib/recordFacts.ts')).toContain('validation: validationRepo.list(course.id, member.memberId)');
    expect(code('src/app/instructor/[courseId]/cohort/page.tsx')).toContain('validationFor: (m) => data.validation[m] ?? []');
  });

  it('thirty-two KPIs in eight families, seven scores, the schemas at /3 and the copy moved', () => {
    expect(code('src/lib/kpiBoard.ts')).toContain("KPI_BOARD_SCHEMA = 'capstone-kpi-board/3'");
    expect(code('src/lib/docs/ontology.ts')).toContain("MEMBER_PROFILE_SCHEMA = 'capstone-member-profile/3'");
    expect(code('src/lib/docs/ontology.ts')).toContain("export const ONTOLOGY_VERSION = '2.2.0';");
    const kpis = code('src/lib/docs/kpis.ts');
    for (const n of ["'validation'", "k('validation', 'recall-accuracy'", "k('validation', 'applied-scenarios'", "k('validation', 'conflicts-resolved'", "k('validation', 'time-on-task'"]) expect(kpis, n).toContain(n);
    expect(code('src/lib/docs/scoring.ts')).toContain("id: 'score.understanding'");
    const board = JSON.parse(read('content/schemas/kpi-board.schema.json'));
    expect(board.properties.kpis.minItems).toBe(32);
    expect(board.properties.scores.minItems).toBe(7);
    expect(board.properties.families.minItems).toBe(8);
    const profile = read('content/schemas/member-profile.schema.json');
    expect(profile).toContain('"const": "capstone-member-profile/3"');
    expect(profile).not.toContain('"minItems": 28');
    const copy = code('src/lib/docs/skillsCopy.ts');
    expect(copy).toContain("familiesHeading: 'Eight families of four'");
    expect(copy).toContain("packTitle: 'Thirty-two KPIs'");
    for (const f of ['src', 'docs', 'content/schemas']) expect(f).toBeDefined();
    expect(read('docs/SCORING.md')).toContain('`score.understanding` Understanding retained');
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### Longitudinal validation, the task timer and the Understanding score (R140)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| Longitudinal validation, the task timer, the Understanding score |');
    expect(read('docs/FIX_LIST.md')).toContain('| F18 |');
    expect(read('docs/OPERATIONS.md')).toContain('**Validate what you built (R140):**');
    expect(read('docs/SCORING.md')).toContain('## The validation family and the seventh score (R140)');
    expect(read('SUPABASE_SETUP.md')).toContain('**Migration 0026**');
    expect(read('docs/VALUE_REGISTER.md')).toContain('Understanding retained: values the team recorded');
  });
});

describe('R141 — the four documents, the two-lane diagram and the record console', () => {
  it('four pure builders, four published schemas, the facets as a registry, the export carrying two of them', () => {
    for (const f of ['src/lib/competency.ts', 'src/lib/skillValidation.ts', 'src/lib/projectArchitecture.ts', 'src/lib/projectInfrastructure.ts', 'src/lib/teamRecord.ts']) {
      const src = code(f);
      expect(src, `${f}: no repository, no clock`).not.toMatch(/from '\.\/data'|from '\.\/data\/index'|Repo\b|Date\.now/);
      expect(src, `${f}: no ranking`).not.toMatch(/\brank(ing|ed)?\b|leaderboard|badge|\bXP\b/i);
    }
    for (const s of ['competency', 'skill-validation', 'project-architecture', 'project-infrastructure']) expect(existsSync(`content/schemas/${s}.schema.json`), s).toBe(true);
    expect(code('src/lib/docs/competencyFacets.ts')).toContain('export const COMPETENCY_FACETS: CompetencyFacetDef[]');
    const exp = code('src/lib/memberExport.ts');
    expect(exp).toContain('competency: competencyOf(r.board),');
    expect(exp).toContain("...(r.validation ? { skillValidation: skillValidationOf(r.skills, r.validation) } : {})");
    expect(code('src/lib/shareCopy.ts')).toContain("facets: competency.facets.map((f) => ({ id: f.id, value: f.value, counted: f.counted, of: f.of, loaded: f.loaded }))");
    for (const f of ['src/app/dashboard/page.tsx', 'src/app/portfolio/page.tsx', 'src/app/courses/[courseId]/skills/page.tsx']) expect(code(f), f).toContain('validation: validationRepo.list(course.id, member.memberId),');
  });

  it('the diagram takes a props-only overlay that only the console passes; the console is a loader, a pure view and a props-only panel', () => {
    const diagram = code('src/components/diagrams/ArchDiagram.tsx');
    expect(diagram).toContain('export interface ArchValidationOverlay');
    expect(diagram).toContain('data-validation-badge={n.records}');
    for (const f of ['src/components/course/WeekVisualPanel.tsx', 'src/components/diagrams/WeekBuildDiagram.tsx']) expect(code(f), `${f}: a learner surface passes no overlay`).not.toContain('validation={');
    expect(code('src/components/instructor/ProjectRecordPanel.tsx')).toContain('<ArchDiagram validation={view.overlay} />');
    expect(code('src/components/instructor/ProjectRecordPanel.tsx')).not.toMatch(/Repo\b|from '@\/lib\/data'/);
    expect(code('src/lib/data/projectRecordLoader.ts')).toContain('export function teamRecordFacts(');
    expect(code('src/app/instructor/[courseId]/record/page.tsx')).toContain("teamRecordView(teamRecordFacts(course, data, selected, history, week))");
    expect(code('src/app/instructor/page.tsx')).toContain('href={`/instructor/${course.id}/record`}');
    // No learner page mounts the console's panel or reads the record as a whole.
    expect(code('src/app/courses/[courseId]/page.tsx')).not.toContain('ProjectRecordPanel');
    expect(code('src/app/courses/[courseId]/docs/page.tsx')).not.toContain('projectRecord(');
  });

  it('the docs say it', () => {
    expect(read('docs/ARCHITECTURE.md')).toContain('### The validation layer (R139 to R141)');
    expect(read('docs/ARCHITECTURE.md')).toContain('### The record console and the four documents (R141)');
    expect(read('docs/courses/arch-pictures.md')).toContain('## The validation overlay (R141)');
    expect(read('docs/CURRENT_STATE.md')).toContain('| The record console and the four documents |');
    expect(read('docs/FIX_LIST.md')).toContain('| F19 |');
    expect(read('docs/OPERATIONS.md')).toContain('**The record console (R141):**');
    expect(read('content/schemas/README.md')).toContain('`competency.schema.json`');
  });
});

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROCEDURES, WEEKS, procedureById } from './serverProcedures';
import { SERVER_PLUS } from '../data/seed/serverPlus';
import { HOST, OPS, ZONE_BRIDGES, BRIDGES, MACHINES } from '../serverTopology';
import { COMMANDS, RESOLVED } from './serverCommands';
import { NOT_TOPOLOGY, literalToSymbol, resolveSymbols, symbolsIn } from '../topologySymbols';

/**
 * Steps say WHAT; the guide says HOW.
 *
 * Weeks 1 and 2 of Server+ used to carry the configuration guide twice: 22
 * near-verbatim click-list items in Week 1, and 49% of Week 2 restated — two
 * steps were 100% copies. A step now names the procedure instead (`guideRef`),
 * and these assertions are what keep the copy from creeping back and the link
 * from rotting.
 */
const steps = SERVER_PLUS.tasks.flatMap((t) => t.steps.map((s) => ({ task: t, step: s })));
const refs = steps.filter(({ step }) => step.guideRef);

describe('Server+ procedures — the guide the steps point at', () => {
  it('procedure ids are unique, and every one sits in a week the guide renders', () => {
    const ids = PROCEDURES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const weeks = new Set(WEEKS.map((w) => w.number));
    expect(PROCEDURES.filter((p) => !weeks.has(p.week)).map((p) => p.id)).toEqual([]);
  });

  it('the guide names the weeks the way the course does', () => {
    for (const w of WEEKS) {
      const seedWeek = SERVER_PLUS.weeks.find((x) => x.number === w.number);
      expect(seedWeek?.title, `guide week ${w.number}`).toBe(w.title);
    }
  });

  it('every guideRef resolves', () => {
    const broken = refs.filter(({ step }) => !procedureById(step.guideRef!.procedureId));
    expect(broken.map(({ step }) => `${step.id} → ${step.guideRef!.procedureId}`)).toEqual([]);
  });

  it('a guideRef lands in the week the step is in', () => {
    // The deep link selects the procedure's week in the guide. A step in Week 1
    // pointing at a Week-2 procedure would open the guide on the wrong week.
    const wrong = refs.filter(({ task, step }) => procedureById(step.guideRef!.procedureId)?.week !== task.week);
    expect(wrong.map(({ task, step }) => `${step.id} (week ${task.week}) → ${step.guideRef!.procedureId}`)).toEqual([]);
  });

  it('a step with a guideRef carries no click-list of its own', () => {
    const doubled = refs.filter(({ step }) => step.instructionList?.length || step.paths?.length);
    expect(doubled.map(({ step }) => step.id)).toEqual([]);
  });

  it('no step still links the guide as a bare file entry', () => {
    // The old shape: a `files[]` row whose source was the guide's section anchor,
    // rendered as four lines ending in a raw URL that always landed on Week 1.
    const stale = steps.filter(({ step }) => step.files?.some((f) => /guide(\/reference)?#config-guide/.test(f.source ?? '')));
    expect(stale.map(({ step }) => step.id)).toEqual([]);
  });

  it('the duplicated Week 1–2 steps are the ones that link', () => {
    expect(refs.length).toBeGreaterThanOrEqual(15);
  });
});

/**
 * Every team gets its OWN server, and the course has to say so everywhere.
 *
 * The Tailscale procedures were written from an instructor SOP that documents a
 * single real machine — local address 10.10.30.15, Tailscale address
 * 100.121.75.81. Pasted in as-is those would have told sixteen teams to
 * administer one host. The addressing rule is `HOST.rule` (10.10.30.T) with
 * Team 1 as the single worked example, and nothing else may appear.
 *
 * CySA+ is deliberately not scanned: its attacker box genuinely lives at
 * 10.10.30.<team> on a different lab, and that is its own course's fact.
 */
const SERVER_PLUS_SOURCES = [
  'src/lib/docs/serverProcedures.ts',
  'src/lib/data/seed/serverPlus.ts',
  'src/lib/docs/serverPlusDeliverables.ts',
  'src/lib/serverTopology.ts',
  'src/components/diagrams/ServerTopologyDiagram.tsx',
];
const readSource = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

/**
 * R71: the guide adds 10,400 explain words to the seed's. The base build is
 * Weeks 1–4, and a student follows it with the guide open beside the step, so
 * each explain is one line and each summary is a paragraph, not a page. The
 * budgets bind only the base build; the advanced weeks are a reference.
 */
describe('the base-build guide stays short enough to follow', () => {
  const prose = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  const base = PROCEDURES.filter((p) => p.week <= 4);

  it('has base-build procedures to measure', () => {
    expect(base.length).toBeGreaterThan(20);
  });

  it('every explain is under 40 words', () => {
    const over = base.flatMap((p) => p.steps.filter((s) => prose(s.explain ?? '') >= 40).map((s) => `${p.id}: ${(s.cmd ?? s.gui ?? '').slice(0, 40)} (${prose(s.explain ?? '')}w)`));
    expect(over, `cut these: ${over.join(', ')}`).toEqual([]);
  });

  it('every summary is under 60 words', () => {
    const over = base.filter((p) => prose(p.summary) >= 60).map((p) => `${p.id} (${prose(p.summary)}w)`);
    expect(over, `cut these: ${over.join(', ')}`).toEqual([]);
  });
});

describe('the host address is always the team’s own', () => {
  it.each(SERVER_PLUS_SOURCES)('%s writes only the rule or the Team 1 example', (path) => {
    const found = Array.from(readSource(path).matchAll(/10\.10\.30\.(\d+|[A-Za-z])/g)).map((m) => m[0]);
    const allowed = [HOST.rule, HOST.exampleAddress];
    expect(
      Array.from(new Set(found.filter((a) => !allowed.includes(a)))),
      `use ${HOST.rule} (worked example ${HOST.exampleAddress}), never one team's address`
    ).toEqual([]);
  });

  it.each(SERVER_PLUS_SOURCES)('%s carries no address from the source SOP', (path) => {
    // The SOP's own machine. A 100.x address belongs to one tailnet node; the
    // course must always say "whatever `tailscale ip -4` prints on your host".
    expect(readSource(path)).not.toContain('100.121.75.81');
  });
});

/**
 * The fleet track's ops network (Weeks 7–8) is the one place a team's address is unique — and it is
 * unique by the team number, so a command that names one must carry the rule
 * (`OPS.team.rule`, 10.20.T) for the Lab access panel to fill, never a worked
 * example's octet. The Core's own block (10.20.0.x) is the same for everyone
 * and is allowed as a literal. The README the repository procedure writes is
 * a command too — a student copies it — so it is held to the same rule.
 */
describe('the fleet track names team addresses by the rule, never by example', () => {
  const fleet = (week: number) => week >= 7;
  const week6Commands = [
    ...SERVER_PLUS.tasks.filter((t) => fleet(t.week)).flatMap((t) => t.steps.flatMap((s) => [s.command ?? '', ...(s.commands ?? []).map((c) => c.cmd)])),
    ...PROCEDURES.filter((p) => fleet(p.week)).flatMap((p) => p.steps.map((s) => s.cmd ?? '')),
  ].filter(Boolean);

  it('has fleet-track commands to check', () => {
    expect(week6Commands.length).toBeGreaterThan(40);
  });

  it('never hard-codes a team octet on the ops network', () => {
    const literal = week6Commands.filter((c) => /\b10\.20\.(?:[1-9]|1[0-6])\.\d+/.test(c));
    expect(literal, `use ${OPS.team.rule}.x so Lab access fills it`).toEqual([]);
  });

  it('uses the ops rule somewhere, so the token is not vacuous', () => {
    expect(week6Commands.some((c) => c.includes(OPS.team.rule))).toBe(true);
  });

  it('badges the instructor build so nobody runs it', () => {
    const day0 = procedureById('core-node-day-zero');
    expect(day0?.optional).toBe(true);
    expect(day0?.optionalLabel).toMatch(/Instructor/);
    // …and the only step that points at it is a read, not a build.
    const readers = SERVER_PLUS.tasks.flatMap((t) => t.steps).filter((s) => s.guideRef?.procedureId === 'core-node-day-zero');
    expect(readers.length).toBe(1);
    expect(readers[0].commands ?? []).toEqual([]);
  });
});

describe('the ops network is a plane, not a zone', () => {
  it('never appears among the segmented zones', () => {
    expect(ZONE_BRIDGES.map((b) => b.id as string)).not.toContain(OPS.bridge);
    expect(BRIDGES.map((b) => b.id as string)).not.toContain(OPS.bridge);
  });

  it('gives the Core a block no team can collide with', () => {
    // Team numbers start at 1; the Core sits in block 0.
    for (const addr of Object.values(OPS.core)) expect(addr.startsWith('10.20.0.')).toBe(true);
    expect(OPS.team.node.startsWith(OPS.team.rule + '.')).toBe(true);
    expect(OPS.team.opsVm.startsWith(OPS.team.rule + '.')).toBe(true);
  });
});

/**
 * R72: nothing overwrites a config file without a way back.
 *
 * `backupOf` marks a command that rewrites something a student cannot easily
 * reconstruct — the interfaces file, the ruleset, netplan, sshd_config, the
 * NGINX site, a firewall, winserver's DNS zone. Before any of them runs, the
 * same step (and the same guide procedure) must already have taken a copy.
 * Students lost whole evenings to a netplan file they could not get back.
 */
describe('R72 — back up before you change it', () => {
  // A copy under any name that reads as a backup, a Proxmox snapshot, a
  // Windows export, or a capture of the current state into a file.
  const TAKES_BACKUP = /\bcp\b[^\n]*\.(bak|week2|orig)|\bcp\b[^\n]*baseline\/|\bcp\b[^\n]*\.bak\b|qm snapshot|Export-|tar -czf|>\s*\S*(before|baseline)\S*/;

  const unbacked = (list: { cmd: string; backupOf?: string }[]) => {
    const out: string[] = [];
    let safe = false;
    for (const c of list) {
      if (TAKES_BACKUP.test(c.cmd)) safe = true;
      if (c.backupOf && !safe) out.push(`${c.cmd.split('\n')[0].slice(0, 60)} → ${c.backupOf}`);
    }
    return out;
  };

  it('every Server+ step that rewrites config copies it first', () => {
    const bad: string[] = [];
    for (const t of SERVER_PLUS.tasks) {
      for (const s of t.steps) {
        for (const line of unbacked(s.commands ?? [])) bad.push(`${s.id}: ${line}`);
      }
    }
    expect(bad, `take a copy before these: ${bad.join(' | ')}`).toEqual([]);
  });

  it('every guide procedure that rewrites config copies it first', () => {
    const bad: string[] = [];
    for (const p of PROCEDURES) {
      const cmds = p.steps.filter((s) => s.cmd).map((s) => ({ cmd: s.cmd!, backupOf: s.backupOf }));
      for (const line of unbacked(cmds)) bad.push(`${p.id}: ${line}`);
    }
    expect(bad, `take a copy before these: ${bad.join(' | ')}`).toEqual([]);
  });
});

/**
 * R72: a command is written down once.
 *
 * 157 of the base build's 219 commands used to exist in both the seed step and
 * the guide procedure, each with its own hand-written sentence, and nothing
 * stopped the two drifting. `serverCommands.ts` is the home now, and both sides
 * are filled from it — so no command may carry its own explanation on BOTH
 * sides, and every base-build command must be in the registry.
 */
describe('R72 — a command is written down once', () => {
  const norm = (c: string) => c.replace(/\s+/g, ' ').trim();
  const src = (f: string) => readFileSync(resolve(process.cwd(), f), 'utf8');

  it('the registry is the home, and both sides read from it', () => {
    expect(src('src/lib/data/seed/serverPlus.ts')).toContain('withCommandDetail');
    expect(src('src/lib/docs/serverProcedures.ts')).toContain('withProcedureDetail');
    expect(COMMANDS.length).toBeGreaterThan(200);
  });

  it('every base-build command is in the registry', () => {
    // RESOLVED, not COMMANDS: the registry is authored with topology symbols
    // and the seed holds the addresses those resolve to.
    const known = new Set(RESOLVED.map((c) => norm(c.k)));
    const missing: string[] = [];
    for (const t of SERVER_PLUS.tasks.filter((t) => t.week <= 4))
      for (const s of t.steps)
        for (const c of s.commands ?? [])
          if (!known.has(norm(c.cmd))) missing.push(`${s.id}: ${c.cmd.slice(0, 50)}`);
    expect(missing, `add to serverCommands.ts: ${missing.join(' | ')}`).toEqual([]);
  });

  it('no base-build command carries its own explanation on both sides', () => {
    const seedOwn = new Map<string, string>();
    for (const t of SERVER_PLUS.tasks.filter((t) => t.week <= 4))
      for (const s of t.steps) for (const c of s.commands ?? []) if (c.explain) seedOwn.set(norm(c.cmd), c.explain);
    // A guide step that still spells out its own sentence for a command the seed
    // also explains is the duplication this round removed.
    const raw = src('src/lib/docs/serverProcedures.ts');
    const both: string[] = [];
    for (const [cmd, explain] of seedOwn) {
      if (raw.includes(explain) && RESOLVED.some((c) => norm(c.k) === cmd)) {
        // Allowed only when the registry itself is where that sentence lives.
        const inRegistry = src('src/lib/docs/serverCommands.ts').includes(explain);
        if (!inRegistry) both.push(cmd.slice(0, 50));
      }
    }
    expect(both, `written twice: ${both.join(' | ')}`).toEqual([]);
  });

  // The chip and the sentence have to agree. Four disagreed when the chip was
  // first derived — the sentence said "inside each Ubuntu guest" while the chip
  // said Proxmox host — and a chip that contradicts the text is worse than none.
  // Only the FIRST machine a sentence names counts: several explanations end by
  // pointing at the opposite box ("...run the reverse from winserver").
  it('the machine chip agrees with the sentence beside it', () => {
    const SAYS: [RegExp, string[]][] = [
      [/\b(on|inside|from) (each |every )?(ubuntu )?guest/i, ['websrv', 'linuxsrv']],
      [/\bon winserver\b|\bfrom winserver\b/i, ['winserver']],
      [/\bon linuxsrv\b|\bfrom linuxsrv\b/i, ['linuxsrv']],
      [/\bon websrv\b|\bfrom websrv\b/i, ['websrv']],
      [/\bon the (proxmox )?host\b|\bfrom the (proxmox )?host\b/i, ['host']],
      [/\bfrom a campus pc\b|\bcampus pc on vmbr0\b/i, ['campus']],
      [/\bon your laptop\b|\bfrom your laptop\b/i, ['laptop']],
    ];
    const bad: string[] = [];
    for (const c of RESOLVED) {
      // Whichever machine the sentence names first is the one it is about.
      let first: { at: number; allow: string[] } | null = null;
      for (const [re, allow] of SAYS) {
        const m = re.exec(c.explain);
        if (m && (first === null || m.index < first.at)) first = { at: m.index, allow };
      }
      if (first && !first.allow.includes(c.on)) {
        bad.push(`${c.k.slice(0, 45)} — chip says ${c.on}, text says ${first.allow.join('/')}`);
      }
    }
    expect(bad, `chip and text disagree: ${bad.join(' | ')}`).toEqual([]);
  });

  it('every machine a command names is a real one', () => {
    const ids = new Set(Object.keys(MACHINES));
    const bad = COMMANDS.filter((c) => !ids.has(c.on)).map((c) => `${c.k.slice(0, 40)} → ${c.on}`);
    expect(bad, `not a MachineId: ${bad.join(' | ')}`).toEqual([]);
  });
});

/**
 * R74: a command names an address, it does not carry one.
 *
 * The old rule was the opposite. `page-shape.test.ts` kept a registry of
 * addresses that had to live in `serverTopology.ts`, and EXEMPTED command text
 * from it (`commandsExempt`), because a copyable line has to read the way a
 * student types it. That was right while there was one classroom, and it is
 * exactly what stopped a procedure being reusable: point the build at a
 * business on another subnet and every one of the 226 commands is wrong.
 *
 * So the exemption is gone and the rule is inverted. A command is authored
 * against the model — `<vm.websrv.address>` — and `serverCommands.ts` resolves
 * it once at load, so the student still reads a real address. A literal one in
 * the authored source now fails here, and the failure names the symbol that
 * belongs there.
 */
describe('R74 — commands name addresses through the model', () => {
  const MAP = literalToSymbol();

  it('the registry knows the addresses that must be symbols', () => {
    expect(Object.keys(MAP).length).toBeGreaterThan(8);
    for (const a of NOT_TOPOLOGY) expect(MAP[a]).toBeUndefined();
  });

  it('no authored command, sample or explanation carries a topology address', () => {
    const bad: string[] = [];
    for (const c of COMMANDS) {
      for (const [field, text] of [['cmd', c.k], ['sample', c.sample], ['explain', c.explain]] as const) {
        for (const [literal, symbol] of Object.entries(MAP)) {
          // A bare address, never one inside a longer number.
          if (new RegExp(`(?<![\\d.\\w])${literal.replace(/\./g, '\\.')}(?![\\d])`).test(text)) {
            bad.push(`${c.k.slice(0, 40)} [${field}] has ${literal} — write ${symbol}`);
          }
        }
      }
    }
    expect(bad, `use the symbol, not the address:\n${bad.join('\n')}`).toEqual([]);
  });

  it('every symbol used resolves, and none survives to a rendered command', () => {
    const unknown: string[] = [];
    for (const c of COMMANDS) {
      for (const text of [c.k, c.sample, c.explain]) {
        try {
          resolveSymbols(text);
        } catch {
          unknown.push(`${c.k.slice(0, 40)}: ${symbolsIn(text).join(', ')}`);
        }
      }
    }
    expect(unknown, `unknown symbols: ${unknown.join(' | ')}`).toEqual([]);
    // And nothing symbol-shaped is left once resolved.
    for (const c of RESOLVED) {
      expect(symbolsIn(c.k), c.k.slice(0, 40)).toEqual([]);
      expect(symbolsIn(c.sample), c.k.slice(0, 40)).toEqual([]);
    }
  });

  it('the symbols are actually used — this guard is not vacuous', () => {
    const used = new Set(COMMANDS.flatMap((c) => symbolsIn(`${c.k} ${c.sample} ${c.explain}`)));
    expect(used.size).toBeGreaterThan(8);
    expect([...used].some((u) => u.startsWith('vm.'))).toBe(true);
    expect([...used].some((u) => u.startsWith('bridge.'))).toBe(true);
  });
});

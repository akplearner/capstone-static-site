import { describe, it, expect } from 'vitest';
import { SECAI_PLUS } from './seed/secaiPlus';
import { CISSP } from './seed/cissp';
import { isGradedWeek } from '../course-helpers';
import { SECAI_DELIVERABLES } from '../docs/secaiDeliverables';
import { CISSP_DELIVERABLES } from '../docs/cisspDeliverables';
import type { Course } from '../types';
import type { DeliverableDef } from '../docs/types';

/**
 * R101 — the two new capstones say, in the content, what their specs promise:
 * the planted weaknesses close where the spec says, the milestones carry the
 * release's counts, and every role has work every graded week.
 */
const stepText = (c: Course) =>
  c.tasks.flatMap((t) => t.steps.flatMap((s) => [s.title, s.instruction ?? '', ...(s.instructionList ?? []), s.whatItMeans ?? '', s.description ?? ''])).join(' ');

const weekStepText = (c: Course, week: number) => {
  const w = c.weeks.find((x) => x.number === week);
  const tasks = c.tasks.filter((t) => t.week === week);
  return [
    w?.milestone ?? '',
    ...tasks.flatMap((t) => [t.title, t.objective, ...t.steps.flatMap((s) => [s.title, s.description ?? '', s.instruction ?? '', ...(s.instructionList ?? []), s.whatItMeans ?? ''])]),
  ].join(' ');
};

describe('R101 — every graded week has work for every role', () => {
  it.each([['secai-plus', SECAI_PLUS], ['cissp', CISSP]] as const)('%s', (_id, course) => {
    for (const w of course.weeks) {
      if (!isGradedWeek(course, w.number)) continue;
      for (const r of course.roles) {
        const owned = course.tasks.some((t) => t.week === w.number && t.role === r.id);
        expect(owned, `${course.id} week ${w.number}: no task for ${r.id}`).toBe(true);
      }
    }
  });
});

describe('R101 — SecAI+ closes its planted weaknesses', () => {
  // SA-n → the week the spec closes it in.
  const CLOSES: Record<string, number> = { 'SA-1': 1, 'SA-2': 2, 'SA-3': 2, 'SA-4': 1, 'SA-5': 2, 'SA-7': 3 };
  it('each weakness is named in or before the week that closes it', () => {
    for (const [sa, week] of Object.entries(CLOSES)) {
      const seen = [1, 2, 3, 4].filter((w) => w <= week).some((w) => weekStepText(SECAI_PLUS, w).includes(sa));
      expect(seen, `${sa} is never named by week ${week}`).toBe(true);
    }
  });
  it('SA-6 is flagged, and the loop is covered', () => {
    expect(stepText(SECAI_PLUS)).toContain('SA-6');
    for (const w of [1, 2, 3, 4]) expect(SECAI_PLUS.weeks.find((x) => x.number === w)?.milestone?.length ?? 0, `week ${w} milestone`).toBeGreaterThan(0);
  });
  it('each week milestone carries the release’s attack and detection counts', () => {
    const m = (w: number) => SECAI_PLUS.weeks.find((x) => x.number === w)!.milestone!;
    expect(m(1)).toMatch(/2 attacks/);
    expect(m(2)).toMatch(/6 attacks/);
    expect(m(4)).toMatch(/six|6/);
  });
});

describe('R101 — CISSP closes its planted weaknesses and scores each release', () => {
  const CLOSES: Record<string, number> = { 'S-1': 1, 'S-8': 2, 'S-2': 3, 'S-3': 3, 'S-4': 3, 'S-6': 3, 'S-9': 3, 'S-10': 3, 'S-5': 4, 'S-7': 4 };
  it('each weakness is named in or before the week that closes it', () => {
    for (const [s, week] of Object.entries(CLOSES)) {
      const seen = [1, 2, 3, 4, 5, 6].filter((w) => w <= week).some((w) => weekStepText(CISSP, w).includes(s));
      expect(seen, `${s} is never named by week ${week}`).toBe(true);
    }
  });
  it('each release milestone carries its score target', () => {
    const score: Record<number, string> = { 1: '8', 2: '16', 3: '20', 4: '24', 5: '32' };
    for (const [w, n] of Object.entries(score)) {
      expect(CISSP.weeks.find((x) => x.number === Number(w))!.milestone!, `week ${w} score`).toContain(n);
    }
  });
});

/**
 * R102 — the step contract. Every step on both courses shows WHERE it happens,
 * says what to do in ≤14 words, lists 2–4 concrete actions with example
 * values, names the page to read and what to look for there, and says how it
 * breaks. Command steps carry an annotated sample and a verify token that only
 * appears when it worked. Form-only steps carry the result sentence instead.
 */
const OFFICIAL_HOSTS = [
  'nist.gov', 'csrc.nist.gov', 'pages.nist.gov', 'owasp.org', 'genai.owasp.org', 'atlas.mitre.org', 'iso.org',
  'acquisition.gov', 'isc2.org', 'marketplace.fedramp.gov', 'capitol.texas.gov', 'artificialintelligenceact.eu',
  'git-scm.com', 'gnu.org', 'github.com', 'docs.litellm.ai', 'openbao.org', 'protectai.github.io', 'microsoft.github.io',
  'documentation.wazuh.com', 'semgrep.dev', 'trivy.dev', 'jenkins.io', 'docs.zeek.org', 'docs.continue.dev',
  'docs.prowler.com', 'huggingface.co', 'threatdragon.com', 'docs.trychroma.com', 'glpi-project.org', 'docs.garak.ai',
  'docs.openssl.org', 'nginx.org', 'nmap.org', 'wiki.nftables.org', 'keycloak.org', 'restic.readthedocs.io',
  'cisofy.com', 'greenbone.github.io', 'drawio.com', 'cisecurity.org',
];
// Prose words, as content-integrity counts them: a token with a letter or digit (so “·” separators are free).
const words = (t: string) => t.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
const official = (url: string) => {
  const host = new URL(url).hostname.replace(/^www\./, '');
  return OFFICIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
};

describe.each([['secai-plus', SECAI_PLUS], ['cissp', CISSP]] as const)('R102 — the step contract on %s', (_id, course) => {
  const graded = course.tasks.filter((t) => isGradedWeek(course, t.week));
  const steps = course.tasks.flatMap((t) => t.steps.map((s) => ({ t, s })));

  it('no task has more than three steps', () => {
    const over = course.tasks.filter((t) => t.steps.length > 3).map((t) => `${t.id} (${t.steps.length})`);
    expect(over, over.join(', ')).toEqual([]);
  });

  it('every graded task waits on an artifact and hands one on', () => {
    const bad = graded.filter((t) => !t.prerequisites?.length || !(t.handoff || t.consumes?.length)).map((t) => t.id);
    expect(bad, bad.join(', ')).toEqual([]);
  });

  it('every step says where, what, and the actions with example values', () => {
    const bad: string[] = [];
    for (const { s } of steps) {
      if (!s.where) bad.push(`${s.id}: no where`);
      if (!s.instruction || words(s.instruction) > 14) bad.push(`${s.id}: instruction ${s.instruction ? words(s.instruction) + 'w' : 'missing'}`);
      const list = s.instructionList ?? [];
      if (list.length < 2 || list.length > 4) bad.push(`${s.id}: ${list.length} actions`);
      for (const a of list) if (words(a) > 20) bad.push(`${s.id}: action ${words(a)}w`);
    }
    expect(bad, bad.join('; ')).toEqual([]);
  });

  it('every step names an official page and what to look for there', () => {
    const bad: string[] = [];
    for (const { s } of steps) {
      if (!s.docs?.length) { bad.push(`${s.id}: no docs`); continue; }
      for (const d of s.docs) {
        if (!official(d.url)) bad.push(`${s.id}: ${new URL(d.url).hostname} is not an official host`);
        const n = words(d.lookFor ?? '');
        if (n < 5 || n > 18) bad.push(`${s.id}: lookFor ${n}w for ${d.title}`);
      }
    }
    expect(bad, bad.join('; ')).toEqual([]);
  });

  it('every step says why it matters and how it breaks', () => {
    const bad: string[] = [];
    for (const { s } of steps) {
      if (!s.whatItMeans || words(s.whatItMeans) > 30) bad.push(`${s.id}: whatItMeans ${s.whatItMeans ? words(s.whatItMeans) + 'w' : 'missing'}`);
      if ((s.fixes?.length ?? 0) < 2) bad.push(`${s.id}: ${s.fixes?.length ?? 0} fixes`);
    }
    expect(bad, bad.join('; ')).toEqual([]);
  });

  it('every command is explained flag by flag, with its sample shown and a verify token that means something', () => {
    const bad: string[] = [];
    for (const { s } of steps) {
      for (const c of s.commands ?? []) {
        if (!c.explain) bad.push(`${s.id}: ${c.cmd.slice(0, 30)} has no explain`);
        if (!c.flags?.length) bad.push(`${s.id}: ${c.cmd.slice(0, 30)} has no flags`);
        if (!c.sample) bad.push(`${s.id}: ${c.cmd.slice(0, 30)} has no sample`);
      }
      if (s.commands?.length) {
        if (!s.expectedOutput) bad.push(`${s.id}: no expectedOutput`);
        if (!s.outputHighlights?.length) bad.push(`${s.id}: no outputHighlights`);
      } else if (!s.expectedOutput) bad.push(`${s.id}: form step without a result sentence`);
      for (const v of s.verify ?? []) if (v.length < 4) bad.push(`${s.id}: verify '${v}' is too short to mean anything`);
    }
    expect(bad, bad.join('; ')).toEqual([]);
  });
});

describe('R102 — the spec’s tables are in the forms', () => {
  const rows = (defs: DeliverableDef[], id: string, group: string) => {
    const def = defs.find((d) => d.id === id)!;
    const sec = def.sections.find((x) => x.kind === 'group' && x.group.group === group);
    return sec?.kind === 'group' ? (sec.group.seed ?? []) : [];
  };
  it('SecAI+: 18 configuration items, 5 alerts, 11 rules, 14 procedures, 8 weaknesses', () => {
    expect(rows(SECAI_DELIVERABLES, 'secai_control_set', 'configuration')).toHaveLength(18);
    expect(rows(SECAI_DELIVERABLES, 'secai_watch_plan', 'alerts')).toHaveLength(5);
    expect(rows(SECAI_DELIVERABLES, 'secai_governance_pack', 'compliance')).toHaveLength(11);
    expect(rows(SECAI_DELIVERABLES, 'secai_governance_pack', 'procedures').map((r) => r.id)).toEqual(Array.from({ length: 14 }, (_, i) => `PR${i + 1}`));
    expect(rows(SECAI_DELIVERABLES, 'secai_governance_pack', 'weaknesses').map((r) => r.id)).toEqual(Array.from({ length: 8 }, (_, i) => `SA-${i + 1}`));
  });
  it('CISSP: 16 questions, 16 control statements, 15 basics, 6 profiles, 33 procedures, 10 weaknesses, 10 risks, 4 targets, 5 shared rows', () => {
    const q = rows(CISSP_DELIVERABLES, 'cissp_questionnaire', 'answers');
    expect(q).toHaveLength(16);
    expect(q.filter((r) => /^D[1-8]$/.test(String(r.domain)))).toHaveLength(16);
    const c = rows(CISSP_DELIVERABLES, 'cissp_controls', 'controls');
    expect(c).toHaveLength(16);
    expect(c.filter((r) => /^v[234]$/.test(String(r.release)))).toHaveLength(16);
    expect(rows(CISSP_DELIVERABLES, 'cissp_d6', 'basics')).toHaveLength(15);
    expect(rows(CISSP_DELIVERABLES, 'cissp_d6', 'profiles').map((r) => r.function)).toEqual(['Govern', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover']);
    expect(rows(CISSP_DELIVERABLES, 'cissp_d1', 'procedures').map((r) => r.id)).toEqual(Array.from({ length: 33 }, (_, i) => `PR${i + 1}`));
    expect(rows(CISSP_DELIVERABLES, 'cissp_d1', 'weaknesses').map((r) => r.id)).toEqual(Array.from({ length: 10 }, (_, i) => `S-${i + 1}`));
    expect(rows(CISSP_DELIVERABLES, 'cissp_d1', 'risks')).toHaveLength(10);
    expect(rows(CISSP_DELIVERABLES, 'cissp_d7', 'targets')).toHaveLength(4);
    expect(rows(CISSP_DELIVERABLES, 'cissp_d3', 'shared')).toHaveLength(5);
  });
});

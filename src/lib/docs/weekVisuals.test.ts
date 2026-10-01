import { describe, it, expect } from 'vitest';
import type { Course } from '../types';
import { SECURITY_PLUS } from '../data/seed/securityPlus';
import { CYSA_PLUS } from '../data/seed/cysa';
import { MSSP } from '../data/seed/mssp';
import { SERVER_PLUS } from '../data/seed/serverPlus';
import { CCNA } from '../data/seed/ccna';
import { AZURE_BLOCKS, AZURE_COURSES } from '../data/seed/azureCloud';
import { AWS_BLOCKS, AWS_COURSES } from '../data/seed/awsCloud';
import { AZURE_TOPOLOGY } from '../cloud/azureTopology';
import { AWS_TOPOLOGY } from '../cloud/awsTopology';
import { isGradedWeek } from '../course-helpers';
import { BASE_VMS } from '../serverTopology';
import { DEVICES } from '../ccnaTopology';
import { ENGAGEMENT } from './msspContent';
import { partsBuiltThrough, processIds, type WeekVisual } from '../weekVisual';
import { BUILD_MODELS, cloudBuildModel, weekVisualsFor } from './weekVisuals';

/**
 * R99 — every week of every course has a picture with something new in it:
 * a part that arrives this week, or the week's process drawn over the build.
 */
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const blockOf = (c: Course) => [...Object.values(AZURE_BLOCKS), ...Object.values(AWS_BLOCKS)].find((b) => b.id === c.id);
const cloudOf = (c: Course) => {
  const b = blockOf(c);
  if (!b) return undefined;
  const topology = c.id.startsWith('azure') ? AZURE_TOPOLOGY : AWS_TOPOLOGY;
  return { topology, block: { weeks: [b.weeks[0], b.weeks[1]] as [number, number] } };
};
/** The ids the course's picture can draw. */
const pictureIds = (c: Course): Set<string> => {
  const cloud = cloudOf(c);
  if (cloud) return new Set([...cloud.topology.nodes.map((n) => n.id), ...cloud.topology.containers.map((x) => x.id)]);
  return new Set(Object.keys(BUILD_MODELS[c.id].arrives));
};

const ALL: Course[] = [SECURITY_PLUS, CYSA_PLUS, MSSP, SERVER_PLUS, CCNA, ...AZURE_COURSES, ...AWS_COURSES];

describe.each(ALL.map((c) => [c.id, c] as const))('R99 — what you build this week · %s', (id, course) => {
  const visuals: WeekVisual[] = weekVisualsFor(course, cloudOf(course));
  const byWeek = new Map(visuals.map((v) => [v.week, v]));

  it('one visual per week, in the course’s own week numbers', () => {
    expect(visuals.map((v) => v.week)).toEqual([...course.weeks].map((w) => w.number).sort((a, b) => a - b));
    expect(new Set(visuals.map((v) => v.week)).size).toBe(visuals.length);
  });

  it('every graded week shows something new: a part that arrives, or the week’s process', () => {
    for (const w of course.weeks) {
      if (!isGradedWeek(course, w.number)) continue;
      const v = byWeek.get(w.number)!;
      expect(v.highlight.length > 0 || !!v.process, `${id} week ${w.number}: nothing new to look at`).toBe(true);
      expect(v.caption.length, `${id} week ${w.number}: no caption`).toBeGreaterThan(0);
    }
  });

  it('every highlighted part and every process end is in the picture', () => {
    const ids = pictureIds(course);
    for (const v of visuals) {
      for (const h of v.highlight) expect(ids.has(h), `${id} week ${v.week}: highlight "${h}" is not drawn`).toBe(true);
      for (const p of processIds(v.process)) expect(ids.has(p), `${id} week ${v.week}: process names "${p}", which is not drawn`).toBe(true);
    }
  });

  it('the build grows: never fewer parts than the week before, and more at the end than at the start', () => {
    const model = cloudOf(course) ? cloudBuildModel(cloudOf(course)!.topology, cloudOf(course)!.block) : BUILD_MODELS[id];
    const weeks = visuals.map((v) => v.week);
    const counts = weeks.map((w) => partsBuiltThrough(model, w).length);
    for (let i = 1; i < counts.length; i++) expect(counts[i], `${id}: week ${weeks[i]} draws less than week ${weeks[i - 1]}`).toBeGreaterThanOrEqual(counts[i - 1]);
    // A course that adds nothing to its template (the AWS DevOps slice) is
    // carried by its processes instead — every graded week must then have one.
    if (counts[counts.length - 1] === counts[0]) {
      for (const v of visuals) if (isGradedWeek(course, v.week)) expect(v.process, `${id} week ${v.week}: builds nothing and shows no process`).toBeTruthy();
    } else {
      expect(counts[counts.length - 1]).toBeGreaterThan(counts[0]);
    }
  });

  it('a process is short, and its words fit on an arrow', () => {
    for (const v of visuals) {
      expect(words(v.caption), `${id} week ${v.week}: caption is ${words(v.caption)} words`).toBeLessThanOrEqual(25);
      if (!v.process) continue;
      expect(v.process.title.length).toBeGreaterThan(0);
      expect(v.process.steps.length, `${id} week ${v.week}`).toBeGreaterThanOrEqual(1);
      expect(v.process.steps.length, `${id} week ${v.week}`).toBeLessThanOrEqual(6);
      for (const s of v.process.steps) {
        expect(words(s.label), `${id} week ${v.week}: "${s.label}"`).toBeLessThanOrEqual(7);
        expect(s.from, `${id} week ${v.week}: an arrow to itself`).not.toBe(s.to);
      }
    }
  });
});

describe('R99 — the build models cover their topologies', () => {
  it('Server+ draws every base and advanced VM; CCNA every device; MSSP every engagement node', () => {
    for (const v of BASE_VMS) expect(BUILD_MODELS['server-plus'].arrives, v.hostname).toHaveProperty(v.hostname);
    for (const d of DEVICES) expect(BUILD_MODELS.ccna.arrives, d.name).toHaveProperty(d.name);
    for (const n of ENGAGEMENT.nodes) expect(BUILD_MODELS.mssp.arrives, n.id).toHaveProperty(n.id);
    for (const e of ENGAGEMENT.edges) for (const end of [e.from, e.to]) expect(ENGAGEMENT.nodes.some((n) => n.id === end), end).toBe(true);
  });

  it('the cloud slices count weeks from their block: Week 0 inherits, Week 1 is the block’s first global week', () => {
    const admin = AZURE_COURSES.find((c) => c.id === 'azure-administrator')!;
    const v = weekVisualsFor(admin, cloudOf(admin));
    expect(v.find((x) => x.week === 0)?.builtThrough).toBe(4);
    expect(v.find((x) => x.week === 1)?.builtThrough).toBe(5);
    expect(v.find((x) => x.week === 0)?.highlight).toContain('vm'); // inherited from the first course
    expect(v.find((x) => x.week === 1)?.highlight).toContain('kv'); // Key Vault arrives in global week 5
    // The DevOps slice adds almost nothing to the template: its process carries each week.
    const devops = AZURE_COURSES.find((c) => c.id === 'azure-devops')!;
    for (const x of weekVisualsFor(devops, cloudOf(devops))) if (x.week > 0) expect(x.process, `devops week ${x.week}`).toBeTruthy();
  });
});

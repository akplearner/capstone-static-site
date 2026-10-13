import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ONTOLOGY_FILES, ONTOLOGY_SCHEMA, ONTOLOGY_VERSION, ontologyFiles, ontologyIds, ontologyJson } from './ontology';

const DIR = resolve(process.cwd(), 'content', 'ontology');
const read = (name: string) => JSON.parse(readFileSync(resolve(DIR, `${name}.json`), 'utf8')) as Record<string, unknown>;

/**
 * R107 — the published ontology is current, additive and honest: every
 * committed file equals a fresh render; every id a committed file carried is
 * still published (deprecate, never remove); an addition moved the version;
 * the counts in the index are the files' own; no product colour leaks.
 */
describe('content/ontology — current, additive, versioned', () => {
  const fresh = ontologyFiles();

  it.each(ONTOLOGY_FILES)('%s.json is current', (name) => {
    const file = resolve(DIR, `${name}.json`);
    expect(existsSync(file), `${name}.json exists`).toBe(true);
    expect(readFileSync(file, 'utf8'), 'a registry changed: run `npm run content:export` and commit content/ontology/').toBe(ontologyJson(fresh[name]));
  });

  it('every id the committed files carry is still published, and an addition bumped the minor version', () => {
    const committed = Object.fromEntries(ONTOLOGY_FILES.map((n) => [n, read(n)])) as Parameters<typeof ontologyIds>[0];
    const before = ontologyIds(committed);
    const after = ontologyIds(fresh);
    let added = 0;
    for (const [kind, ids] of Object.entries(before)) {
      const now = new Set(after[kind]);
      expect(ids.filter((id) => !now.has(id)), `${kind}: removed ids (deprecate, never remove)`).toEqual([]);
      added += after[kind].filter((id) => !new Set(ids).has(id)).length;
    }
    const version = (v: string) => v.split('.').map(Number);
    const [cMajor, cMinor] = version(String(committed.index.version));
    const [fMajor, fMinor] = version(ONTOLOGY_VERSION);
    if (added > 0) expect(fMajor > cMajor || (fMajor === cMajor && fMinor > cMinor), `${added} ids added: bump ONTOLOGY_VERSION`).toBe(true);
  });

  it('the index names every file, its counts are the files’ own, and the standards file carries no colour', () => {
    const index = fresh.index as { schema: string; version: string; files: Record<string, string>; counts: Record<string, number> };
    expect(index.schema).toBe(ONTOLOGY_SCHEMA);
    expect(index.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(Object.keys(index.files).sort()).toEqual([...ONTOLOGY_FILES].filter((f) => f !== 'index').sort());
    const ids = ontologyIds(fresh);
    for (const [kind, list] of Object.entries(ids)) expect(index.counts[kind], kind).toBe(list.length);
    const standards = ontologyJson(fresh.standards);
    expect(standards).not.toMatch(/"tone"|bg-[a-z]+-soft|text-[a-z]+/);
    expect((fresh.domains as { domains: { id: string }[] }).domains.map((d) => d.id)).toContain('SY0-701.d2');
    expect((fresh.competencies as { taughtBy: Record<string, unknown[]> }).taughtBy['comp.recon.port-scan'].length).toBeGreaterThanOrEqual(2);
    // R108: the sixteen KPIs and the work roles travel with the ontology.
    expect((fresh.kpis as { kpis: unknown[] }).kpis.length).toBe(16);
    expect((fresh['work-roles'] as { workRoles: { requiredCompetencies: string[] }[] }).workRoles.every((w) => w.requiredCompetencies.length > 0)).toBe(true);
  });
});

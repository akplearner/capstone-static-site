import { beforeEach, describe, expect, it } from 'vitest';
import { HISTORY_CAP, HISTORY_SITTING_MS, appendVersion, localStorageDocsRepo } from './localStorageDocsRepo';
import type { DeliverableVersion } from './types';

beforeEach(() => localStorage.clear());

const d = (x: string) => ({ fields: { x }, groups: {} });

/** R139: offline, a device keeps the versions a team's forms held before — the same sitting rule as migration 0025. */
describe('localStorageDocsRepo history', () => {
  it('records the version a save replaced, newest first, and nothing for a first save or an unchanged one', async () => {
    await localStorageDocsRepo.saveOne('server-plus', 't1', 'srv_ip_plan', d('1'));
    expect(await localStorageDocsRepo.history('server-plus', 't1')).toEqual([]);
    await localStorageDocsRepo.saveOne('server-plus', 't1', 'srv_ip_plan', d('1'));
    expect(await localStorageDocsRepo.history('server-plus', 't1')).toEqual([]);
    await localStorageDocsRepo.saveOne('server-plus', 't1', 'srv_ip_plan', d('2'));
    const h = await localStorageDocsRepo.history('server-plus', 't1');
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ deliverableId: 'srv_ip_plan', data: d('1') });
    expect(await localStorageDocsRepo.history('server-plus', 't2')).toEqual([]);
  });

  it('save (the whole map) records each form that changed', async () => {
    localStorageDocsRepo.save('server-plus', 't1', { a: d('1'), b: d('1') });
    localStorageDocsRepo.save('server-plus', 't1', { a: d('2'), b: d('1') });
    const h = await localStorageDocsRepo.history('server-plus', 't1');
    expect(h.map((v) => v.deliverableId)).toEqual(['a']);
  });

  it('appendVersion: a version is a sitting — the same author within five minutes is not a new version; another author is; the cap holds', () => {
    let h: DeliverableVersion[] = [];
    h = appendVersion(h, 'f', d('1'), d('2'), 'ada', 1_000);
    expect(h).toHaveLength(1);
    h = appendVersion(h, 'f', d('2'), d('3'), 'ada', 1_000 + 60_000);
    expect(h).toHaveLength(1);
    h = appendVersion(h, 'f', d('3'), d('4'), 'bob', 1_000 + 120_000);
    expect(h).toHaveLength(2);
    expect(h[1]).toMatchObject({ data: d('3'), replacedBy: 'bob', updatedBy: 'ada' });
    h = appendVersion(h, 'f', d('4'), d('5'), 'bob', 1_000 + 120_000 + HISTORY_SITTING_MS);
    expect(h).toHaveLength(3);
    expect(appendVersion(h, 'f', d('5'), d('5'), 'bob', 10 ** 9)).toBe(h);
    expect(appendVersion(h, 'f', undefined, d('5'), 'bob', 10 ** 9)).toBe(h);
    let many: DeliverableVersion[] = [];
    for (let i = 0; i < HISTORY_CAP + 10; i++) many = appendVersion(many, 'f', d(String(i)), d(String(i + 1)), `u${i}`, i * HISTORY_SITTING_MS);
    expect(many).toHaveLength(HISTORY_CAP);
    expect(many[0].data).toEqual(d('10'));
  });
});

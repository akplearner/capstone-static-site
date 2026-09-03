import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  addressPart,
  applyCarryForward,
  fitsInput,
  isIpv4OrCidr,
  buildFormContext,
  formatDuration,
  inSubnet,
  isIpv4,
  parseDuration,
  teamHostnames,
} from './formContext';
import { emptyData, emptyFormContext, type DeliverableDef, type FieldType } from './types';
import type { ColumnType } from '../grc/templates';
import { deliverablesForCourse } from './definitions';

const group = (over: Partial<DeliverableDef> = {}): DeliverableDef =>
  ({
    id: 'target',
    num: 1,
    file: '01_T.md',
    title: 'Target',
    owner: 'mgmt',
    folder: '00',
    standard: '',
    weeks: [1],
    kind: 'form',
    exportFormat: 'md',
    purpose: '',
    howTo: '',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'addresses',
          label: 'Addresses',
          columns: [
            { field: 'hostname', label: 'Host', type: 'text' },
            { field: 'zone', label: 'Zone', type: 'text' },
            { field: 'address', label: 'Address', type: 'text' },
          ],
          carryFrom: { deliverableId: 'upstream', group: 'machines', columns: ['hostname', 'zone'] },
        },
      },
    ],
    ...over,
  }) as DeliverableDef;

const ctxWithUpstream = () => ({
  ...emptyFormContext(),
  docs: {
    upstream: {
      fields: {},
      groups: {
        machines: [
          { hostname: 'websrv', zone: 'DMZ', job: 'website' },
          { hostname: 'linuxsrv', zone: 'private', job: 'database' },
        ],
      },
    },
  },
});

/**
 * Carrying values forward is the one feature in the forms that can touch data
 * the student did not type. These four assertions are the contract.
 */
describe('carry forward', () => {
  it('starts an empty table from the upstream form, columns it names only', () => {
    const { data, carried } = applyCarryForward(group(), emptyData(), ctxWithUpstream());
    expect(data.groups.addresses).toEqual([
      { hostname: 'websrv', zone: 'DMZ' },
      { hostname: 'linuxsrv', zone: 'private' },
    ]);
    // `job` is not in `columns`, and `address` is the student's own job to read
    // off the running machine — neither may be invented for them.
    expect(Object.keys(data.groups.addresses[0])).toEqual(['hostname', 'zone']);
    expect(carried.addresses).toEqual({ from: 'upstream', rows: 2 });
  });

  it('never overwrites a table the student has typed in', () => {
    const own = { fields: {}, groups: { addresses: [{ hostname: 'mine', zone: '', address: '' }] } };
    const { data, carried } = applyCarryForward(group(), own, ctxWithUpstream());
    expect(data).toBe(own);
    expect(carried).toEqual({});
  });

  it('does nothing when the upstream form is empty', () => {
    const { data, carried } = applyCarryForward(group(), emptyData(), emptyFormContext());
    expect(data.groups.addresses).toBeUndefined();
    expect(carried).toEqual({});
  });

  it('lets the student’s own data displace the worked example', () => {
    // The example is rows the form seeded, not rows anyone typed. Real data
    // from their own earlier form is better than a generic illustration.
    const seeded = { fields: {}, groups: { addresses: [{ hostname: 'pve-host', zone: 'mgmt' }] } };
    const { carried } = applyCarryForward(group(), seeded, ctxWithUpstream(), { replaceSeed: true });
    expect(carried.addresses?.rows).toBe(2);
  });
});

describe('hostnames a form can offer', () => {
  it('lists what the team typed before what the examples suggest', () => {
    const defs = deliverablesForCourse('server-plus');
    const docs = {
      srv_business_reqs: { fields: {}, groups: { machines: [{ hostname: 'shop-db' }] } },
    };
    const names = teamHostnames(docs, defs);
    expect(names[0]).toBe('shop-db');
    // …and the base build is still offered, so the dropdown is useful on day one.
    expect(names).toContain('websrv');
  });

  it('deduplicates case-insensitively', () => {
    const defs = deliverablesForCourse('server-plus');
    const docs = {
      srv_business_reqs: { fields: {}, groups: { machines: [{ hostname: 'WebSrv' }] } },
    };
    const names = teamHostnames(docs, defs);
    expect(names.filter((n) => n.toLowerCase() === 'websrv')).toHaveLength(1);
  });

  it('builds a context without touching a repo', () => {
    const ctx = buildFormContext({}, deliverablesForCourse('server-plus'), [
      { filename: '20260903_Team01_evidence.png', sha256: 'abc' },
    ]);
    expect(ctx.evidence).toHaveLength(1);
    expect(ctx.hostnames.length).toBeGreaterThan(0);
  });
});

describe('address and duration helpers', () => {
  it.each([
    ['172.16.0.10', true],
    ['10.10.30.1', true],
    ['999.1.1.1', false],
    ['172.16.0', false],
    ['not an address', false],
  ])('isIpv4(%s) = %s', (value, expected) => {
    expect(isIpv4(value)).toBe(expected);
  });

  it('spots an address that is well formed but in the wrong zone', () => {
    expect(inSubnet('172.16.0.10', '172.16.0.0/24')).toBe(true);
    expect(inSubnet('192.168.0.3', '172.16.0.0/24')).toBe(false);
  });

  it('stays quiet when the subnet cannot be parsed — a hint it cannot justify is worse than none', () => {
    expect(inSubnet('172.16.0.10', 'the DMZ')).toBe(true);
    expect(inSubnet('172.16.0.10', '')).toBe(true);
  });

  it('round-trips a duration through its editor', () => {
    expect(parseDuration('4 hours')).toEqual({ amount: '4', unit: 'hours' });
    expect(parseDuration('30 minutes')).toEqual({ amount: '30', unit: 'minutes' });
    expect(formatDuration('4', 'hours')).toBe('4 hours');
    expect(formatDuration('', 'hours')).toBe('');
    // Text typed before the field had a type must still survive a render.
    expect(parseDuration('about a day').amount).toBe('');
  });
});

/**
 * Giving a column a real type must never blank out an answer already typed.
 *
 * `<input type="number">` handed "~350 W typical" renders EMPTY — the browser
 * refuses the value, so the student's answer disappears from the screen while
 * still sitting in their document. Same for a date input holding "Wed 18:00".
 * Every column retyped in this round had prose in its placeholder, so this is
 * not hypothetical.
 */
describe('a stricter type never hides what is already stored', () => {
  it.each([
    ['number', '350', true],
    ['number', '~350 W typical', false],
    ['number', '', true],
    ['date', '2026-02-24', true],
    ['date', 'Wed 18:00–19:00', false],
    ['date', '', true],
    ['text', 'anything at all', true],
  ])('fitsInput(%s, %s) = %s', (type, value, expected) => {
    expect(fitsInput(type, value)).toBe(expected);
  });

  it('accepts an address with or without its mask', () => {
    // The IP plan records 172.16.0.10/24; the gateway column records 172.16.0.1.
    expect(isIpv4OrCidr('172.16.0.10/24')).toBe(true);
    expect(isIpv4OrCidr('172.16.0.1')).toBe(true);
    expect(isIpv4OrCidr('172.16.0.10/99')).toBe(false);
    expect(isIpv4OrCidr('the DMZ')).toBe(false);
    expect(addressPart('172.16.0.10/24')).toBe('172.16.0.10');
  });
});

/**
 * Every type needs a renderer.
 *
 * There is no component-test harness in this repo, so this reads the source:
 * a type added to the union and forgotten in the renderer falls through to a
 * plain text box, which looks like it works and quietly loses the unit, the
 * validation and the dropdown. Export needs no equivalent check — `report.ts`
 * serialises by value and every type stores a string.
 */
const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

describe('every field and column type is actually rendered', () => {
  const FIELD_TYPES: FieldType[] = [
    'text', 'area', 'select', 'date', 'paste', 'fileref', 'signature',
    'number', 'ipv4', 'hostref', 'duration', 'evidence',
  ];
  const COLUMN_TYPES: ColumnType[] = [
    'text', 'number', 'select', 'area', 'date', 'ipv4', 'hostref', 'duration', 'evidence',
  ];

  it.each(FIELD_TYPES)('DeliverableForm handles the %s field', (t) => {
    // 'text' is the fall-through default and has no branch of its own.
    if (t === 'text') return;
    expect(read('src/components/docs/DeliverableForm.tsx')).toContain(`'${t}'`);
  });

  it.each(COLUMN_TYPES)('RegisterTable handles the %s column', (t) => {
    if (t === 'text') return;
    expect(read('src/components/grc/RegisterTable.tsx')).toContain(`'${t}'`);
  });
});

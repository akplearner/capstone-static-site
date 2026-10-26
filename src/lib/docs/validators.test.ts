import { describe, it, expect } from 'vitest';
import { VALIDATORS, parseUfw, runValidator, validatorOf, type StepValidator } from './validators';
import { CONTROLS } from './standards';
import { SECURITY_PLUS } from '../data/seed/securityPlus';
import { CYSA_PLUS } from '../data/seed/cysa';
import { MSSP } from '../data/seed/mssp';
import { SERVER_PLUS } from '../data/seed/serverPlus';
import { CCNA } from '../data/seed/ccna';
import { A_PLUS } from '../data/seed/aPlus';
import { SECAI_PLUS } from '../data/seed/secaiPlus';
import { CISSP } from '../data/seed/cissp';
import { AZURE_COURSES } from '../data/seed/azureCloud';
import { AWS_COURSES } from '../data/seed/awsCloud';

// R113: a validator reads the paste as the tool's report of the system and
// compares the rules with the step's expectation. These fixtures are what
// `ufw status numbered` and `ufw status verbose` print.
const SPEC: StepValidator = {
  id: 'ufw-least-privilege',
  params: { public: ['80/tcp', '443/tcp'], restricted: { '22/tcp': ['10.10.0.0/16', '192.168.0.0/24', '172.16.0.0/24', '172.16.0.1'] } },
};

const NUMBERED = `Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    10.10.0.0/16
[ 2] 22/tcp                     ALLOW IN    192.168.0.0/24
[ 3] 22/tcp                     ALLOW IN    172.16.0.0/24
[ 4] 22/tcp                     ALLOW IN    172.16.0.1
[ 5] 80/tcp                     ALLOW IN    Anywhere
[ 6] 443/tcp                    ALLOW IN    Anywhere
[ 7] 80/tcp (v6)                ALLOW IN    Anywhere (v6)
[ 8] 443/tcp (v6)               ALLOW IN    Anywhere (v6)
`;

const VERBOSE = `Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    10.10.0.0/16
22/tcp                     ALLOW IN    192.168.0.0/24
22/tcp                     ALLOW IN    172.16.0.0/24
22/tcp                     ALLOW IN    172.16.0.1
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
80/tcp (v6)                ALLOW IN    Anywhere (v6)
443/tcp (v6)               ALLOW IN    Anywhere (v6)
`;

describe('ufw-least-privilege', () => {
  it('passes the ruleset the step builds, numbered or verbose, and folds the IPv6 twins', () => {
    for (const out of [NUMBERED, VERBOSE]) {
      const r = runValidator(SPEC, out)!;
      expect(r.problems).toEqual([]);
      expect(r.pass).toBe(true);
      expect(r.observed.filter((o) => o.startsWith('80/tcp'))).toEqual(['80/tcp from Anywhere']);
    }
    expect(runValidator(SPEC, VERBOSE)!.observed).toContain('default incoming deny');
  });

  it('order does not matter', () => {
    const lines = NUMBERED.split('\n');
    const shuffled = [lines[0], lines[1], lines[2], lines[3], ...lines.slice(4).reverse()].join('\n');
    expect(runValidator(SPEC, shuffled)!.pass).toBe(true);
  });

  it('an extra open port fails and is named', () => {
    const r = runValidator(SPEC, `${NUMBERED}[ 9] 3306/tcp                   ALLOW IN    Anywhere\n`)!;
    expect(r.pass).toBe(false);
    expect(r.problems).toContain('3306/tcp is open to everyone; only 80/tcp, 443/tcp should be.');
  });

  it('SSH open to everyone fails even though every expected token is present', () => {
    const r = runValidator(SPEC, `${NUMBERED}[ 9] 22/tcp                     ALLOW IN    Anywhere\n`)!;
    expect(r.pass).toBe(false);
    expect(r.problems[0]).toContain('22/tcp is open to everyone');
  });

  it('a missing source, an unlisted source, an inactive firewall and an open default each fail', () => {
    expect(runValidator(SPEC, NUMBERED.replace(/^\[ 4\].*$/m, ''))!.problems).toEqual(['22/tcp from 172.16.0.1 is missing.']);
    expect(runValidator(SPEC, `${NUMBERED}[ 9] 22/tcp                     ALLOW IN    10.20.0.0/16\n`)!.problems).toEqual(["22/tcp from 10.20.0.0/16 is not in the step's allow-list."]);
    expect(runValidator(SPEC, NUMBERED.replace('Status: active', 'Status: inactive'))!.problems).toContain('The firewall is inactive.');
    expect(runValidator(SPEC, NUMBERED.replace('Status: active\n', ''))!.problems[0]).toContain('No "Status: active" line');
    expect(runValidator(SPEC, VERBOSE.replace('deny (incoming)', 'allow (incoming)'))!.problems).toContain('The default for incoming traffic is allow, not deny.');
  });

  it('reads only inbound allow rules as openings', () => {
    const parsed = parseUfw(`Status: active\n\nTo                         Action      From\n--                         ------      ----\n23/tcp                     DENY IN     Anywhere\nAnywhere                   ALLOW OUT   Anywhere on eth0\n`);
    expect(parsed.rules).toEqual([
      { to: '23/tcp', action: 'DENY', direction: 'IN', from: 'Anywhere' },
      { to: 'Anywhere', action: 'ALLOW', direction: 'OUT', from: 'Anywhere' },
    ]);
  });
});

describe('the validator registry', () => {
  it('names nothing it cannot resolve: every id is unique, every control is in the registry, an unknown id runs nothing', () => {
    expect(new Set(VALIDATORS.map((v) => v.id)).size).toBe(VALIDATORS.length);
    const codes = new Set(CONTROLS.map((c) => c.code));
    for (const v of VALIDATORS) for (const c of v.controlIds) expect(codes.has(c), `${v.id} cites ${c}`).toBe(true);
    expect(runValidator(undefined, NUMBERED)).toBeNull();
    expect(runValidator({ id: 'no-such-validator' }, NUMBERED)).toBeNull();
    expect(validatorOf('ufw-least-privilege')?.label).toBeTruthy();
  });

  it('every step that opts in names a validator that exists, on a step with a verify box', () => {
    const courses = [SECURITY_PLUS, CYSA_PLUS, MSSP, SERVER_PLUS, CCNA, A_PLUS, SECAI_PLUS, CISSP, ...AZURE_COURSES, ...AWS_COURSES];
    const opted = courses.flatMap((c) => c.tasks.flatMap((t) => t.steps.filter((s) => s.validator).map((s) => ({ c: c.id, s }))));
    expect(opted.length, 'at least one step opts in').toBeGreaterThan(0);
    for (const { c, s } of opted) {
      expect(validatorOf(s.validator!.id), `${c}/${s.id}`).toBeDefined();
      expect(s.verify?.length, `${c}/${s.id} has a verify box to sit beside`).toBeGreaterThan(0);
    }
    // The step's own expected output (an excerpt) carries the rules it shows.
    const dmz = SERVER_PLUS.tasks.flatMap((t) => t.steps).find((s) => s.id === 'sp-w4-secure-s2')!;
    expect(dmz.validator?.id).toBe('ufw-least-privilege');
    expect(runValidator(dmz.validator, NUMBERED)!.pass).toBe(true);
  });
});

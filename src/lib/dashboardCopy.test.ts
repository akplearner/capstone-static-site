import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DASHBOARD_DIR, dashboardCopy } from '../../scripts/dashboardCopy';

/**
 * R115: `supabase/dashboard/<name>.ts` is the one file a person pastes into the
 * Supabase dashboard to deploy a function without the CLI. It is GENERATED
 * from `supabase/functions/` by `npm run functions:dashboard`.
 *
 * A copy nobody checks is a copy that drifts: edit a function or a shared
 * helper, forget to regenerate, and the person following the setup guide
 * deploys yesterday's code. These tests make that mistake fail here instead.
 */

const REPO = join(__dirname, '..', '..');
const read = (path: string) => readFileSync(join(REPO, path), 'utf-8');
const FUNCTIONS = readdirSync(join(REPO, 'supabase', 'functions'))
  .filter((d) => d !== '_shared' && existsSync(join(REPO, 'supabase', 'functions', d, 'index.ts')))
  .sort();

describe('supabase/dashboard — the paste-ready copies', () => {
  it('covers the functions the setup guide deploys', () => {
    expect(FUNCTIONS).toEqual(expect.arrayContaining(['delete-account', 'receipt', 'report-notify', 'share', 'shared-profile', 'stamp']));
  });

  it.each(FUNCTIONS)('%s: the committed copy equals a fresh build (run npm run functions:dashboard)', (name) => {
    const path = `${DASHBOARD_DIR}/${name}.ts`;
    expect(existsSync(join(REPO, path)), `${path} exists`).toBe(true);
    expect(read(path)).toBe(dashboardCopy(name, read));
  });

  it.each(FUNCTIONS)('%s: the copy is one file, says it is generated and names itself', (name) => {
    const copy = read(`${DASHBOARD_DIR}/${name}.ts`);
    expect(copy, 'no local import survives').not.toMatch(/\bfrom\s+['"]\.{1,2}\//);
    expect(copy).toMatch(/GENERATED, DO NOT EDIT/);
    expect(copy).toContain(`name the function\n// exactly \`${name}\``);
    expect(copy, 'every key comes from what Supabase injects').not.toMatch(/Deno\.env\.get\('(SERVICE_ROLE_KEY|SUPABASE_ANON_KEY)'\)/);
  });

  it('leaves no copy of a function that no longer exists', () => {
    const copies = readdirSync(join(REPO, DASHBOARD_DIR))
      .filter((f) => f.endsWith('.ts'))
      .map((f) => f.slice(0, -3))
      .sort();
    expect(copies).toEqual(FUNCTIONS);
  });

  it('copies each helper verbatim in place of its import, and refuses a helper that imports anything', () => {
    const files: Record<string, string> = {
      'supabase/functions/demo/index.ts': "import { a } from '../_shared/one.ts';\nimport {\n  b,\n  type B,\n} from '../_shared/two.ts';\nDeno.serve(() => a(b));\n",
      'supabase/functions/_shared/one.ts': 'export const a = (x: unknown) => new Response(String(x));\n',
      'supabase/functions/_shared/two.ts': 'export const b = 2;\nexport type B = number;\n\n',
      'supabase/functions/bad/index.ts': "import { c } from '../_shared/three.ts';\n",
      'supabase/functions/_shared/three.ts': "import { a } from './one.ts';\nexport const c = a;\n",
      'supabase/functions/local/index.ts': "import { d } from './helper.ts';\n",
    };
    const fake = (path: string) => files[path] ?? '';
    const copy = dashboardCopy('demo', fake);
    expect(copy).toContain(files['supabase/functions/_shared/one.ts']);
    expect(copy).toContain('export const b = 2;\nexport type B = number;\n// ─── end of supabase/functions/_shared/two.ts');
    expect(copy.indexOf('export const a')).toBeLessThan(copy.indexOf('export const b'));
    expect(copy.trimEnd().endsWith('Deno.serve(() => a(b));')).toBe(true);
    expect(() => dashboardCopy('bad', fake)).toThrow(/imports another module/);
    expect(() => dashboardCopy('local', fake)).toThrow(/imports a local file/);
  });
});

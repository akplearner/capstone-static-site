/**
 * Write the paste-ready copies of the edge functions to supabase/dashboard/ (R115).
 *
 *   npm run functions:dashboard
 *
 * `supabase/functions/` stays the source of truth: `supabase functions deploy`
 * reads it. Each copy is one function in one file, for the dashboard's editor,
 * so deploying needs no CLI. `src/lib/dashboardCopy.test.ts` fails when a
 * function or a shared helper changes without this being re-run.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DASHBOARD_DIR, dashboardCopy } from './dashboardCopy';

const repo = process.cwd();
const read = (path: string) => readFileSync(resolve(repo, path), 'utf-8');
const names = readdirSync(resolve(repo, 'supabase', 'functions'))
  .filter((d) => d !== '_shared' && existsSync(resolve(repo, 'supabase', 'functions', d, 'index.ts')))
  .sort();

const dir = resolve(repo, DASHBOARD_DIR);
mkdirSync(dir, { recursive: true });
for (const name of names) {
  const path = resolve(dir, `${name}.ts`);
  writeFileSync(path, dashboardCopy(name, read));
  console.log(`wrote ${path}`);
}
// A function that no longer exists leaves no copy behind.
for (const file of readdirSync(dir)) {
  if (file.endsWith('.ts') && !names.includes(file.slice(0, -3))) {
    rmSync(resolve(dir, file));
    console.log(`removed ${resolve(dir, file)}`);
  }
}

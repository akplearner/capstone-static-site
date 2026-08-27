import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `supabase/setup.sql` is the one-paste artifact a person setting the project up
 * by hand runs in the dashboard's SQL Editor. It is GENERATED from
 * `supabase/migrations/` by `scripts/build-setup-sql.py`.
 *
 * A generated file nobody checks is a file that drifts: edit a migration, forget
 * to regenerate, and the person following the setup guide silently installs a
 * schema the app no longer expects — failing much later, at sign-in, far from the
 * cause. These tests make that mistake fail here instead.
 */

const REPO = join(__dirname, '..', '..');
const MIGRATIONS = join(REPO, 'supabase', 'migrations');
const SETUP = join(REPO, 'supabase', 'setup.sql');

const migrationFiles = readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith('.sql'))
  .sort();
const setupSql = readFileSync(SETUP, 'utf-8');

describe('supabase/setup.sql', () => {
  it('has migrations to flatten', () => {
    expect(migrationFiles.length).toBeGreaterThan(0);
  });

  it.each(migrationFiles)('contains %s verbatim', (name) => {
    const body = readFileSync(join(MIGRATIONS, name), 'utf-8').replace(/^\n+|\n+$/g, '');
    expect(setupSql).toContain(body);
  });

  it.each(migrationFiles)('labels %s with its banner', (name) => {
    expect(setupSql).toContain(`-- ─── ${name} `);
  });

  it('keeps the migrations in filename order', () => {
    const positions = migrationFiles.map((name) => setupSql.indexOf(`-- ─── ${name} `));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('creates every table the migrations define', () => {
    const tablesIn = (sql: string) =>
      (sql.match(/create table if not exists [\w.]+/g) ?? []).sort();
    const fromMigrations = tablesIn(
      migrationFiles.map((f) => readFileSync(join(MIGRATIONS, f), 'utf-8')).join('\n')
    );
    expect(fromMigrations.length).toBeGreaterThan(0);
    expect(tablesIn(setupSql)).toEqual(fromMigrations);
  });

  it('says it is generated, so nobody hand-edits it', () => {
    expect(setupSql).toContain('scripts/build-setup-sql.py');
    expect(setupSql).toMatch(/DO NOT EDIT/i);
  });

  it('carries no psql-only directives — it is pasted into a web SQL editor', () => {
    // A leading backslash command (\i, \set) or a COPY … FROM stdin only works in
    // the psql client, and would fail silently or halfway in the dashboard.
    expect(setupSql).not.toMatch(/^\\/m);
    expect(setupSql).not.toMatch(/copy .* from stdin/i);
  });
});

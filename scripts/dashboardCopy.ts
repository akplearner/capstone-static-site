/**
 * The paste-ready copy of one edge function, for the Supabase dashboard (R115).
 *
 * The dashboard's editor deploys a function from a single file, so it cannot
 * follow the `../_shared/*.ts` imports the sources use. This builds that file:
 * the function's source with each shared import replaced by the helper it
 * names, copied verbatim. Nothing is rewritten, so a copy and its source
 * cannot say different things; `src/lib/dashboardCopy.test.ts` fails when a
 * committed copy differs from a fresh build. Pure: the caller passes `read`.
 *
 *   npm run functions:dashboard   (scripts/build-dashboard-functions.ts writes them)
 */

const SHARED_IMPORT = /^import (?:type )?\{[^}]*\} from '\.\.\/_shared\/([\w-]+)\.ts';\n/gm;
const ANY_IMPORT = /^\s*(?:import|export)\b[^;]*\bfrom\s+['"]/m;
const LOCAL_IMPORT = /^\s*(?:import|export)\b[^;]*\bfrom\s+['"]\.{1,2}\//m;
const RULE = '─'.repeat(20);

export const DASHBOARD_DIR = 'supabase/dashboard';

export function dashboardHeader(name: string): string {
  return [
    `// ${name}: paste-ready copy for the Supabase dashboard. GENERATED, DO NOT EDIT.`,
    '//',
    `// Built from supabase/functions/${name}/index.ts, with the shared helpers it`,
    '// imports copied in, by `npm run functions:dashboard`. To deploy it without',
    '// the CLI: Supabase → Edge Functions → Deploy a new function → Via Editor;',
    '// replace everything in the editor with this whole file; name the function',
    `// exactly \`${name}\` BEFORE clicking Deploy function: the name becomes its`,
    `// address (…/functions/v1/${name}), and renaming it later changes only the`,
    '// label. No secrets to set, and JWT verification stays on. SUPABASE_SETUP.md',
    '// has the steps.',
    '',
    '',
  ].join('\n');
}

export function dashboardCopy(name: string, read: (path: string) => string): string {
  const source = read(`supabase/functions/${name}/index.ts`);
  const body = source.replace(SHARED_IMPORT, (_line, helper: string) => {
    const path = `supabase/functions/_shared/${helper}.ts`;
    const text = read(path);
    if (ANY_IMPORT.test(text)) throw new Error(`${path} imports another module; a dashboard copy inlines only helpers that import nothing`);
    return `// ─── ${path}, copied in ${RULE}\n${text.replace(/\n+$/, '')}\n// ─── end of ${path} ${RULE}\n`;
  });
  if (LOCAL_IMPORT.test(body)) throw new Error(`supabase/functions/${name}/index.ts imports a local file the dashboard copy cannot inline`);
  return dashboardHeader(name) + body;
}

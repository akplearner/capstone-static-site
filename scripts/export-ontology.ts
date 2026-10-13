/**
 * Write the published ontology to content/ontology/*.json.
 *
 *   npm run content:export   (runs this after the course export)
 *
 * The registries under `src/lib/docs/` are the source of truth; these files
 * are what another platform joins on. `ontology.test.ts` fails when a registry
 * changes without this being re-run, when a published id disappears, or when
 * an addition did not bump the version; CI diffs the folder.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ontologyFiles, ontologyJson } from '../src/lib/docs/ontology';

const dir = resolve(process.cwd(), 'content', 'ontology');
mkdirSync(dir, { recursive: true });
for (const [name, file] of Object.entries(ontologyFiles())) {
  const path = resolve(dir, `${name}.json`);
  writeFileSync(path, ontologyJson(file));
  console.log(`wrote ${path}`);
}

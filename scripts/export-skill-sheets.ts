/**
 * Write every course's skills sheet to docs/courses/skills/<id>.md.
 *
 *   npm run content:export   (runs this after the JSON export)
 *
 * The registries (`src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`,
 * `sops.ts`, `tactics.ts`) and the seeds are the source of truth; this is the
 * readable copy. `skillSheets.test.ts` fails when they change without this
 * being re-run, and CI diffs the folder.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES, courseDto } from '../src/lib/content/dto';
import { skillSheet } from '../src/lib/docs/skillSheet';

const dir = resolve(process.cwd(), 'docs', 'courses', 'skills');
mkdirSync(dir, { recursive: true });
for (const course of SEED_COURSES) {
  const file = resolve(dir, `${course.id}.md`);
  writeFileSync(file, skillSheet(courseDto(course.id)) + '\n');
  console.log(`wrote ${file}`);
}

/**
 * Write every course's certification and cost sheet to
 * docs/courses/cert-coverage/<id>.md.
 *
 *   npm run content:export   (runs this after the JSON export)
 *
 * The registry (`src/lib/docs/certs.ts`, `costs.ts`) and the seeds are the
 * source of truth; this is the readable copy. `certSheets.test.ts` fails
 * when they change without this being re-run, and CI diffs the folder.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES, courseDto } from '../src/lib/content/dto';
import { certSheet } from '../src/lib/docs/certSheet';

const dir = resolve(process.cwd(), 'docs', 'courses', 'cert-coverage');
mkdirSync(dir, { recursive: true });
for (const course of SEED_COURSES) {
  const file = resolve(dir, `${course.id}.md`);
  writeFileSync(file, certSheet(courseDto(course.id)) + '\n');
  console.log(`wrote ${file}`);
}

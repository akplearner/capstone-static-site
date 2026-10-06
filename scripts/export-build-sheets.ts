/**
 * Write every course's build sheet to docs/courses/build-sheets/<id>.md.
 *
 *   npm run content:export   (runs this after the JSON export)
 *
 * The picture modules are the source of truth; this is the readable copy.
 * `src/lib/docs/buildSheets.test.ts` fails when a picture changes without
 * this being re-run, and CI diffs the folder after regenerating.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES, courseDto } from '../src/lib/content/dto';
import { buildSheet } from '../src/lib/docs/buildSheet';

const dir = resolve(process.cwd(), 'docs', 'courses', 'build-sheets');
mkdirSync(dir, { recursive: true });
for (const course of SEED_COURSES) {
  const file = resolve(dir, `${course.id}.md`);
  writeFileSync(file, buildSheet(courseDto(course.id)) + '\n');
  console.log(`wrote ${file}`);
}

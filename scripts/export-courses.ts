/**
 * Write every course to content/courses/<id>.json.
 *
 *   npm run content:export
 *
 * The TypeScript seeds are the source of truth; this is the durable, diffable
 * copy. `src/lib/content/dto.test.ts` fails when a seed changes without this
 * being re-run, and CI diffs the folder after regenerating.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES, courseDto, courseIndex, toJson } from '../src/lib/content/dto';

const dir = resolve(process.cwd(), 'content', 'courses');
mkdirSync(dir, { recursive: true });

for (const course of SEED_COURSES) {
  const file = resolve(dir, `${course.id}.json`);
  writeFileSync(file, toJson(courseDto(course.id)));
  console.log(`wrote ${file}`);
}
writeFileSync(resolve(dir, 'index.json'), toJson(courseIndex()));
console.log(`wrote ${resolve(dir, 'index.json')}`);

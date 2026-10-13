/**
 * Write the published environment profiles to content/profiles/*.json.
 *
 *   npm run content:export   (runs this after the ontology export)
 *
 * The one sample is the platform's own managed-security entity, built from
 * the MSSP course so every id resolves; `environmentProfile.test.ts` fails
 * when the build changes without this being re-run; CI diffs the folder.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES } from '../src/lib/content/dto';
import { seedDeliverablesForCourse } from '../src/lib/docs/definitions';
import { SAMPLE_PROFILE_COURSE, profileJson, sampleProfile } from '../src/lib/docs/environmentProfile';

const dir = resolve(process.cwd(), 'content', 'profiles');
mkdirSync(dir, { recursive: true });
const course = SEED_COURSES.find((c) => c.id === SAMPLE_PROFILE_COURSE);
if (!course) throw new Error(`no seed course ${SAMPLE_PROFILE_COURSE}`);
const profile = sampleProfile(course, seedDeliverablesForCourse(course.id));
const path = resolve(dir, `${profile.id.replace(/^profile\./, '')}.json`);
writeFileSync(path, profileJson(profile));
console.log(`wrote ${path}`);

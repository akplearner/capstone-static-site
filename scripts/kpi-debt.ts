/**
 * R137 — what each course still cannot measure for each role, printed as the allow-list the every-course
 * test reads (`src/lib/kpiBoard.allCourses.allow.json`). Run after authoring content; paste the output
 * only when the debt genuinely went down.
 *
 *   npx tsx scripts/kpi-debt.ts
 */
import { SEED_COURSES } from '../src/lib/content/dto';
import { defaultMeasure, kpiBoard } from '../src/lib/kpiBoard';
import { skillProfile } from '../src/lib/skillProfile';
import { ONTOLOGY_VERSION } from '../src/lib/docs/ontology';
import { fullMemberInput } from '../src/lib/kpiBoard.allCourses.fixture';

const DECISIONS = new Set(['kpi.decision-making.decisions-recorded', 'kpi.decision-making.decisions-justified', 'kpi.decision-making.decisions-approved']);
const out: Record<string, Record<string, string[]>> = {};
let total = 0;
for (const c of SEED_COURSES) {
  for (const r of c.roles) {
    const input = fullMemberInput(c.id, r.id);
    const board = kpiBoard({ profile: skillProfile(input), registry: input.registry, cert: input.cert, measure: defaultMeasure(input.registry, r.id), outcome: { capstoneFiled: true, weeksCleared: 4, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
    const debt = board.kpis.filter((k) => k.loaded && !k.applies && !DECISIONS.has(k.id)).map((k) => k.id).sort();
    if (debt.length) {
      (out[c.id] ??= {})[r.id] = debt;
      total += debt.length;
    }
  }
}
console.error(`${total} KPI × role gaps across ${Object.keys(out).length} courses`);
console.log(JSON.stringify(out, null, 2));

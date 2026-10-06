/**
 * R99 — every course's "What you build this week", one visual per week.
 *
 * Five courses have a build model in their content module (which part of the
 * picture arrives in which week, plus the week's process and caption). The
 * six cloud courses derive theirs from the topology itself — every node and
 * container already carries its global week — plus the week processes in
 * `cloud/workflows.ts`. Both come out as the same `WeekVisual[]`, written
 * into the course document by `dto.ts` and read by `weekVisualsOf`.
 */
import type { Course } from '../types';
import type { CloudTopology } from '../cloud/model';
import { cloudWeekProcesses, CLOUD_WEEK_CAPTIONS } from '../cloud/workflows';
import { weekVisualsFrom, type BuildModel, type WeekVisual } from '../weekVisual';
import { LAB_BUILD } from './securityContent';
import { SOC_BUILD } from './cysaContent';
import { ENGAGEMENT_BUILD } from './msspContent';
import { SERVER_BUILD } from './serverDiagrams';
import { CCNA_BUILD } from './ccnaDiagrams';
import { HUB_BUILD as SECAI_BUILD } from './secaiContent';
import { HUB_BUILD as CISSP_BUILD } from './cisspContent';

/** The build model of each course that draws its own picture. */
export const BUILD_MODELS: Record<string, BuildModel> = {
  'security-plus': LAB_BUILD,
  'cysa-plus': SOC_BUILD,
  mssp: ENGAGEMENT_BUILD,
  'server-plus': SERVER_BUILD,
  ccna: CCNA_BUILD,
  'secai-plus': SECAI_BUILD,
  cissp: CISSP_BUILD,
};

/**
 * A cloud course's build model, from the topology: a part arrives in the
 * course-local week of its global week; a part from before the course is
 * inherited (week 0); a part after the course is not in the model at all.
 */
export function cloudBuildModel(topology: CloudTopology, block: { weeks: [number, number] }): BuildModel {
  const [lo, hi] = block.weeks;
  const arrives: Record<string, number> = {};
  // Nodes only: a box (a VNet, a subnet, a region) is drawn once it holds
  // something (R94 shrink-wraps empty boxes away), so it cannot be promised
  // to glow in the week its template line appears.
  for (const part of topology.nodes) {
    if (part.external) continue;
    if (part.detail) continue;
    if (part.week > hi) continue;
    arrives[part.id] = Math.max(0, part.week - lo + 1);
  }
  const processes: Record<number, ReturnType<typeof cloudWeekProcesses>[number]> = {};
  const captions: Record<number, string> = { 0: 'What this course starts from — the previous course’s finished environment.' };
  const byGlobal = cloudWeekProcesses(topology.platform);
  for (let g = lo; g <= hi; g++) {
    processes[g - lo + 1] = byGlobal[g];
    captions[g - lo + 1] = CLOUD_WEEK_CAPTIONS[g];
  }
  return { arrives, processes, captions };
}

/** The visuals for one course, in its own week numbers. */
export function weekVisualsFor(course: Course, cloud?: { topology: CloudTopology; block: { weeks: [number, number] } }): WeekVisual[] {
  const weeks = [...course.weeks].map((w) => w.number).sort((a, b) => a - b);
  if (cloud) {
    const lo = cloud.block.weeks[0];
    return weekVisualsFrom(cloudBuildModel(cloud.topology, cloud.block), weeks, (w) => lo - 1 + w);
  }
  const model = BUILD_MODELS[course.id];
  return model ? weekVisualsFrom(model, weeks) : [];
}

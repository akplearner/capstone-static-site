import { DeliverableData } from './types';
import { DELIVERABLES } from './definitions';
import { DocMeta } from './report';

/**
 * Self-contained (no-backend) team handoff.
 *
 * Each role's form data lives only in their own browser (localStorage,
 * team-scoped). To assemble a *complete* team package, GRC needs Red's and
 * Blue's deliverables. These helpers serialize a role's saved deliverables to a
 * portable JSON file that a teammate can hand off; GRC imports the file(s),
 * which merge into the team's saved data, and the existing team-package export
 * then contains everyone's work.
 */

const KIND = 'capstone-docs';
const VERSION = 1;

export interface HandoffEnvelope {
  kind: typeof KIND;
  v: number;
  course?: string;
  team?: string;
  cohort?: string;
  role?: string;
  date?: string;
  data: Record<string, DeliverableData>;
}

const KNOWN_IDS = new Set(DELIVERABLES.map((d) => d.id));

/** Serialize the saved deliverable map to a portable JSON handoff file. */
export function exportTeamData(
  saved: Record<string, DeliverableData>,
  meta: DocMeta & { course?: string },
  role?: string
): string {
  const envelope: HandoffEnvelope = {
    kind: KIND,
    v: VERSION,
    course: meta.course,
    team: meta.team,
    cohort: meta.cohort,
    role,
    date: meta.date,
    data: saved,
  };
  return JSON.stringify(envelope, null, 2);
}

function isDeliverableData(v: unknown): v is DeliverableData {
  if (!v || typeof v !== 'object') return false;
  const d = v as Record<string, unknown>;
  return typeof d.fields === 'object' && d.fields !== null && typeof d.groups === 'object' && d.groups !== null;
}

/**
 * Parse and validate a handoff file, returning the deliverable map. Throws a
 * friendly Error on anything that isn't a recognizable capstone handoff so the
 * UI can show the message instead of crashing.
 */
export function parseTeamData(text: string): Record<string, DeliverableData> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t valid JSON. Upload a .json handoff exported from this app.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Unrecognized file — expected a capstone handoff export.');
  }
  const env = parsed as Partial<HandoffEnvelope>;
  if (env.kind !== KIND) {
    throw new Error('This isn’t a capstone handoff file (wrong format). Use “Export my work” to create one.');
  }
  if (!env.data || typeof env.data !== 'object') {
    throw new Error('The handoff file has no deliverable data.');
  }
  // Keep only well-formed, known deliverables so a malformed/foreign entry
  // can't poison the team's saved data.
  const clean: Record<string, DeliverableData> = {};
  for (const [id, value] of Object.entries(env.data)) {
    if (KNOWN_IDS.has(id) && isDeliverableData(value)) clean[id] = value;
  }
  if (Object.keys(clean).length === 0) {
    throw new Error('No recognizable deliverables found in that file.');
  }
  return clean;
}

/**
 * Merge an incoming deliverable map into the current one at per-deliverable
 * granularity (incoming wins for overlapping ids). Teammates only fill their
 * own deliverables, so a normal gather doesn't clobber anyone's work.
 */
export function mergeTeamData(
  current: Record<string, DeliverableData>,
  incoming: Record<string, DeliverableData>
): Record<string, DeliverableData> {
  return { ...current, ...incoming };
}

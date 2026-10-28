import { decisionKey } from '@/lib/docs/types';
import type { DeliverableData } from '@/lib/docs/types';

/**
 * R136 — the first-sign-in import rewrites who decided.
 *
 * A decision block stores the chooser under `decision:<id>:by` (docs/types.ts).
 * On a guest device that is the guest's random member id; once the account
 * exists the member IS `user.id`, and a decision left under the old id reads
 * as a teammate's on every surface (decisions recorded: 0 of 1). The forms
 * travel through the import, so the author travels with them.
 */
const BY = /^decision:.+:by$/;

export function rewriteDecisionAuthors(data: DeliverableData, oldId: string, newId: string): DeliverableData {
  const fields: Record<string, string> = {};
  let changed = false;
  for (const [k, v] of Object.entries(data.fields ?? {})) {
    if (BY.test(k) && v === oldId) {
      fields[k] = newId;
      changed = true;
    } else fields[k] = v;
  }
  return changed ? { ...data, fields } : data;
}

/** The `:by` key of one block, for callers that write it. */
export function decisionByKey(blockId: string): string {
  return `${decisionKey(blockId)}:by`;
}

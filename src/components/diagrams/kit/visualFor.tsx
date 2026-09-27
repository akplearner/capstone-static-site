'use client';

import type { ReactElement } from 'react';
import type { DeliverableDef } from '@/lib/docs/types';
import { kitPreset } from '@/lib/diagrams/kitPresets';
import { TriageDecisionTree } from '../TriageDecisionTree';
import { RiskMatrix } from '../RiskMatrix';
import { IncidentTimelineDiagram } from '../IncidentTimelineDiagram';
import { KitDiagram } from './KitDiagram';

/**
 * The picture a deliverable form shows (R84). This replaces the docs page's
 * `FORM_DIAGRAM` id table: the four forms whose shape IS the diagram keep
 * their bespoke drawing, and every other form in every course now gets its
 * course's kit preset through `visual` — which `withDerivedBundle` fills in,
 * so no form is pictureless and no seed needed editing.
 */
const BESPOKE: Record<string, () => ReactElement | null> = {
  cysa_alert_triage: TriageDecisionTree,
  risk_register: RiskMatrix,
  cysa_incident_response: IncidentTimelineDiagram,
  incident_report: IncidentTimelineDiagram,
};

export function visualFor(def: DeliverableDef): ReactElement | null {
  const Bespoke = BESPOKE[def.id];
  if (Bespoke) return <Bespoke />;
  const v = def.visual;
  if (!v) return null;
  const spec = kitPreset(def.courseId, v.preset);
  if (!spec) return null;
  return <KitDiagram spec={spec} courseId={def.courseId} highlight={v.highlight} />;
}

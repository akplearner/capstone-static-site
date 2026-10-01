'use client';

import type { ReactElement } from 'react';
import type { DeliverableDef } from '@/lib/docs/types';
import { kitPreset } from '@/lib/diagrams/kitPresets';
import { TriageDecisionTree } from '../TriageDecisionTree';
import { RiskMatrix } from '../RiskMatrix';
import { IncidentTimelineDiagram } from '../IncidentTimelineDiagram';
import { KitDiagram } from './KitDiagram';
import { CloudWeekVisual } from '@/components/cloud/CloudOverview';
import { WeekFormVisual } from '../WeekFormVisual';

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
  // R87: a cloud capstone form draws the architecture as it stands that week.
  if (v.kit === 'cloud') return <CloudWeekVisual week={v.week} courseId={def.courseId} />;
  // R99: every other course draws its own picture as it stands in the form's week.
  if (v.kit === 'week') return <WeekFormVisual week={v.week ?? def.weeks[0]} courseId={def.courseId} />;
  const spec = kitPreset(def.courseId, v.preset);
  if (!spec) return null;
  return <KitDiagram spec={spec} courseId={def.courseId} highlight={v.highlight} />;
}

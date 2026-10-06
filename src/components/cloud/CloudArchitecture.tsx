'use client';

import { useState } from 'react';
import type { CloudTopology as Topology, IacBundle } from '@/lib/cloud/model';
import { CloudTopology } from '@/components/diagrams/cloud/CloudTopology';
import { IacViewer } from './IacViewer';

/**
 * Diagram and template side by side (R87): one week, one selection. Click a
 * resource in the picture and the template scrolls to its lines; move the
 * week and both the picture and the template fade what arrives later.
 */
export function CloudArchitecture({
  topology,
  iac,
  initialWeek = 12,
  weekRange,
  onWeekChange,
}: {
  topology: Topology;
  iac: IacBundle;
  initialWeek?: number;
  weekRange?: [number, number];
  /** R103: the week the slider is on, so the section can show "This week adds" under it. */
  onWeekChange?: (week: number) => void;
}) {
  const [week, setWeekState] = useState(initialWeek);
  const setWeek = (w: number) => {
    setWeekState(w);
    onWeekChange?.(w);
  };
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <CloudTopology
        topology={topology}
        week={week}
        onWeekChange={setWeek}
        selected={selected}
        onSelect={(id) => setSelected((cur) => (cur === id ? null : id))}
        weekRange={weekRange}
      />
      <IacViewer iac={iac} selected={selected} week={week} onWeekChange={setWeek} weekRange={weekRange} />
    </div>
  );
}

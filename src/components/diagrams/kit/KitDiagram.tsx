'use client';

import type { KitSpec } from '@/lib/diagrams/kitSpec';
import { tintVars } from '@/components/quarry/art/palette';
import { DiagramFrame } from '../DiagramFrame';
import { Rack } from './Rack';
import { Device } from './Device';
import { Topology } from './Topology';
import { FlowPath } from './FlowPath';
import { kitTone } from './tones';

/**
 * The kit's one entry point: give it a spec and a course, get the finished
 * picture — DiagramFrame around the right renderer, recoloured to the course
 * by `tintVars` (the quarry art's custom properties, so a rack drawn for
 * Server+ is blue and the same rack drawn elsewhere takes that page's seam).
 */
export function KitDiagram({
  spec,
  courseId,
  highlight,
}: {
  spec: KitSpec;
  courseId?: string;
  highlight?: string[];
}) {
  return (
    <div style={tintVars(courseId)}>
      <DiagramFrame
        title={spec.title}
        howToRead={spec.howToRead}
        legend={spec.legend?.map((l) => ({ label: l.label, color: kitTone(l.kind) }))}
      >
        {spec.kit === 'rack' && spec.rack ? (
          <Rack rack={spec.rack} highlight={highlight} />
        ) : spec.kit === 'device' && spec.device ? (
          <Device device={spec.device} />
        ) : spec.kit === 'flow' ? (
          <FlowPath spec={spec} highlight={highlight} />
        ) : (
          <Topology spec={spec} highlight={highlight} />
        )}
      </DiagramFrame>
    </div>
  );
}

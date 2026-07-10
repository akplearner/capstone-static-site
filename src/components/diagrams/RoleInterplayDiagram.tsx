'use client';

import { motion } from 'framer-motion';
import { RoleDef } from '@/lib/types';

interface RoleInterplayDiagramProps {
  roles: RoleDef[];
  highlightRole?: string;
}

/**
 * Custom SVG showing how a course's roles relate. Roles are placed on a circle
 * (radial auto-layout) and connected to a shared center, so it scales to any
 * number of roles (degrades gracefully for 1–2).
 */
export function RoleInterplayDiagram({ roles, highlightRole }: RoleInterplayDiagramProps) {
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const R = roles.length === 1 ? 0 : 120;
  const nodeR = 48;

  const positions = roles.map((_, i) => {
    if (roles.length === 1) return { x: cx, y: cy };
    const angle = (2 * Math.PI * i) / roles.length - Math.PI / 2;
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-sm" role="img" aria-label="How the course roles work together">
        {/* edges to center hub */}
        {roles.length > 1 &&
          positions.map((p, i) => (
            <line
              key={`edge-${i}`}
              x1={p.x}
              y1={p.y}
              x2={cx}
              y2={cy}
              className="stroke-gray-300 dark:stroke-gray-600"
              strokeWidth={2}
            />
          ))}

        {/* center hub */}
        {roles.length > 1 && (
          <circle cx={cx} cy={cy} r={6} className="fill-gray-400 dark:fill-gray-500" />
        )}

        {roles.map((role, i) => {
          const p = positions[i];
          const dim = highlightRole && highlightRole !== role.id;
          return (
            <motion.g
              key={role.id}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: dim ? 0.4 : 1 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <circle cx={p.x} cy={p.y} r={nodeR} fill={role.color} opacity={0.15} />
              <circle
                cx={p.x}
                cy={p.y}
                r={nodeR}
                fill="none"
                stroke={role.color}
                strokeWidth={highlightRole === role.id ? 4 : 2.5}
              />
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="14" fontWeight="700" fill={role.color}>
                {shortName(role.name)}
              </text>
              {wrapText(role.mission, 18, 3).map((line, li) => (
                <text
                  key={li}
                  x={p.x}
                  y={p.y + 8 + li * 10}
                  textAnchor="middle"
                  fontSize="8"
                  className="fill-gray-600 dark:fill-gray-300"
                >
                  {line}
                </text>
              ))}
            </motion.g>
          );
        })}

        {/* center hub label */}
        {roles.length > 1 && (
          <text x={cx} y={cy + 18} textAnchor="middle" fontSize="8" className="fill-gray-400 dark:fill-gray-500">
            hand-offs
          </text>
        )}
      </svg>
    </div>
  );
}

function shortName(name: string): string {
  return name.split('(')[0].trim();
}

/** Wrap a string into up to `maxLines` lines of ~`perLine` chars, packing whole
 *  words; the last line gets an ellipsis if text remains. */
function wrapText(s: string, perLine: number, maxLines: number): string[] {
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= perLine) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  const used = lines.join(' ').split(/\s+/).filter(Boolean).length;
  const remaining = words.slice(used);
  if (remaining.length) {
    let last = remaining.join(' ');
    if (last.length > perLine) last = `${last.slice(0, perLine - 1)}…`;
    lines.push(last);
  } else if (cur) {
    lines.push(cur);
  }
  return lines.slice(0, maxLines);
}

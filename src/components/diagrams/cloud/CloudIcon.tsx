import type { ReactElement } from 'react';
import type { CloudIconKey, CloudPlatform } from '@/lib/cloud/model';
import { AWS_CATEGORY, AWS_TILE, AZURE_GLYPH } from '@/lib/cloud/brand';
import { officialIconHref } from '@/lib/cloud/officialIcons';

/**
 * One service icon, drawn in its platform's style (R87):
 *  - AWS: a rounded tile in the service's category colour with a white glyph
 *    — the look of the AWS architecture icons;
 *  - Azure: a free-standing coloured glyph with white detailing — the look of
 *    the Azure architecture icons.
 * The glyphs are original drawings in 32×32 units; an official SVG replaces
 * one when it is listed in `officialIcons.ts`.
 */

type Glyph = (c: string, bg: string) => ReactElement;

const S = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const person = (c: string, x = 16, y = 11, r = 4.5) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={c} />
    <path d={`M${x - 8} ${y + 15} a8 7 0 0 1 16 0 z`} fill={c} />
  </g>
);

const GLYPHS: Record<CloudIconKey, Glyph> = {
  user: (c) => person(c),
  github: (c) => (
    <g stroke={c} {...S}>
      <circle cx="10" cy="9" r="3" />
      <circle cx="10" cy="23" r="3" />
      <circle cx="22" cy="13" r="3" />
      <path d="M10 12v8M22 16c0 4-5 5-9 6" />
    </g>
  ),
  vm: (c, bg) => (
    <g>
      <rect x="5" y="6" width="22" height="15" rx="2" fill={c} />
      <rect x="8" y="9" width="16" height="9" rx="1" fill={bg} opacity="0.85" />
      <path d="M16 21v4M11 26h10" stroke={c} {...S} />
    </g>
  ),
  disk: (c, bg) => (
    <g>
      <ellipse cx="16" cy="9" rx="10" ry="4" fill={c} />
      <path d="M6 9v14c0 2.2 4.5 4 10 4s10-1.8 10-4V9" fill={c} />
      <ellipse cx="16" cy="9" rx="10" ry="4" fill="none" stroke={bg} strokeWidth="1.5" opacity="0.7" />
    </g>
  ),
  function: (c, bg) => (
    <g>
      <path d="M9 7 3 16l6 9M23 7l6 9-6 9" stroke={c} {...S} strokeWidth="2.5" />
      <path d="M18 5 11 17h5l-2 10 7-12h-5z" fill={c} stroke={bg} strokeWidth="0.8" />
    </g>
  ),
  nosql: (c, bg) => (
    <g>
      <circle cx="16" cy="16" r="9" fill={c} />
      <ellipse cx="16" cy="16" rx="14" ry="4.5" fill="none" stroke={c} strokeWidth="2" transform="rotate(-25 16 16)" />
      <circle cx="13" cy="13" r="2.5" fill={bg} opacity="0.6" />
    </g>
  ),
  storage: (c, bg) => (
    <g>
      <rect x="4" y="7" width="24" height="18" rx="2" fill={c} />
      <path d="M4 13h24M4 19h24M12 7v18M20 7v18" stroke={bg} strokeWidth="1.5" opacity="0.8" />
    </g>
  ),
  secret: (c, bg) => (
    <g>
      <circle cx="11" cy="16" r="6" fill={c} />
      <circle cx="11" cy="16" r="2.2" fill={bg} />
      <path d="M17 16h11M24 16v4M28 16v3" stroke={c} {...S} strokeWidth="2.5" />
    </g>
  ),
  logs: (c, bg) => (
    <g>
      <path d="M8 4h11l6 6v18H8z" fill={c} />
      <path d="M11 14h11M11 18h11M11 22h8" stroke={bg} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  apm: (c, bg) => (
    <g>
      <path d="M16 4a8 8 0 0 0-5 14v3h10v-3A8 8 0 0 0 16 4z" fill={c} />
      <path d="M12 24h8M13 27h6" stroke={c} {...S} />
      <path d="M13 11l3 3 3-3" stroke={bg} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  ),
  alert: (c, bg) => (
    <g>
      <path d="M16 5a7 7 0 0 0-7 7v6l-3 4h20l-3-4v-6a7 7 0 0 0-7-7z" fill={c} />
      <path d="M13 25a3 3 0 0 0 6 0" stroke={c} {...S} />
      <path d="M16 11v5" stroke={bg} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="19" r="1.1" fill={bg} />
    </g>
  ),
  notify: (c) => (
    <g stroke={c} {...S}>
      <path d="M6 13v6h4l8 5V8l-8 5z" fill={c} />
      <path d="M22 11a6 6 0 0 1 0 10M25 8a10 10 0 0 1 0 16" />
    </g>
  ),
  budget: (c, bg) => (
    <g>
      <circle cx="16" cy="16" r="11" fill={c} />
      <path d="M19.5 11.5c-1-1-2.2-1.5-3.5-1.5-2 0-3.5 1-3.5 2.7 0 3.6 7 1.9 7 5.6 0 1.7-1.6 2.8-3.6 2.8-1.4 0-2.8-.6-3.8-1.6M16 8.5v15" stroke={bg} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </g>
  ),
  policy: (c, bg) => (
    <g>
      <rect x="7" y="6" width="18" height="22" rx="2" fill={c} />
      <rect x="12" y="4" width="8" height="4" rx="1" fill={c} stroke={bg} strokeWidth="1" />
      <path d="M11 17l3.5 3.5L21 13" stroke={bg} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  role: (c, bg) => (
    <g>
      <rect x="5" y="7" width="22" height="18" rx="2" fill={c} />
      <circle cx="12" cy="14" r="3" fill={bg} />
      <path d="M7.5 22a4.5 4 0 0 1 9 0" fill={bg} />
      <path d="M19 13h5M19 17h5M19 21h3" stroke={bg} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  group: (c) => (
    <g>
      {person(c, 11, 11, 3.8)}
      {person(c, 21, 11, 3.8)}
    </g>
  ),
  param: (c) => (
    <g stroke={c} {...S}>
      <path d="M6 9h20M6 16h20M6 23h20" />
      <circle cx="12" cy="9" r="2.5" fill={c} />
      <circle cx="21" cy="16" r="2.5" fill={c} />
      <circle cx="14" cy="23" r="2.5" fill={c} />
    </g>
  ),
  diag: (c, bg) => (
    <g>
      <circle cx="16" cy="16" r="7" fill={c} />
      <path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.5 7.5l2.8 2.8M21.7 21.7l2.8 2.8M7.5 24.5l2.8-2.8M21.7 10.3l2.8-2.8" stroke={c} {...S} strokeWidth="2.5" />
      <circle cx="16" cy="16" r="2.5" fill={bg} />
    </g>
  ),
  vnet: (c) => (
    <g stroke={c} {...S} strokeWidth="2.5">
      <path d="M9 8 3 16l6 8M23 8l6 8-6 8" />
      <circle cx="11" cy="16" r="1.4" fill={c} />
      <circle cx="16" cy="16" r="1.4" fill={c} />
      <circle cx="21" cy="16" r="1.4" fill={c} />
    </g>
  ),
  subnet: (c) => (
    <g stroke={c} {...S}>
      <rect x="5" y="8" width="22" height="16" rx="2" strokeDasharray="3 2" />
      <path d="M11 16h10" />
    </g>
  ),
  firewall: (c, bg) => (
    <g>
      <path d="M16 4 6 8v7c0 6.5 4.3 11 10 13 5.7-2 10-6.5 10-13V8z" fill={c} />
      <path d="M11 14h10M11 18h10M16 10v12" stroke={bg} strokeWidth="1.5" opacity="0.85" />
    </g>
  ),
  publicip: (c) => (
    <g stroke={c} {...S}>
      <circle cx="16" cy="16" r="10" />
      <path d="M6 16h20M16 6c3 3 4.5 6.5 4.5 10S19 23 16 26c-3-3-4.5-6.5-4.5-10S13 9 16 6z" />
    </g>
  ),
  nic: (c, bg) => (
    <g>
      <rect x="4" y="9" width="24" height="14" rx="2" fill={c} />
      <rect x="8" y="13" width="4" height="6" fill={bg} opacity="0.85" />
      <rect x="14" y="13" width="4" height="6" fill={bg} opacity="0.85" />
      <rect x="20" y="13" width="4" height="6" fill={bg} opacity="0.85" />
    </g>
  ),
  gateway: (c) => (
    <g stroke={c} {...S}>
      <path d="M6 27V12a10 10 0 0 1 20 0v15" />
      <path d="M11 20h10M17 16l4 4-4 4" />
    </g>
  ),
  route: (c) => (
    <g stroke={c} {...S}>
      <path d="M16 4v24M8 10h14l3 3-3 3H8zM24 18H10l-3 3 3 3h14" />
    </g>
  ),
  plan: (c) => (
    <g fill={c}>
      <rect x="5" y="7" width="6" height="7" rx="1" />
      <rect x="13" y="7" width="6" height="7" rx="1" />
      <rect x="21" y="7" width="6" height="7" rx="1" />
      <rect x="5" y="17" width="6" height="7" rx="1" />
      <rect x="13" y="17" width="6" height="7" rx="1" opacity="0.6" />
      <rect x="21" y="17" width="6" height="7" rx="1" opacity="0.35" />
    </g>
  ),
  cdn: (c) => (
    <g stroke={c} {...S}>
      <circle cx="16" cy="16" r="10" />
      <path d="M6 16h20M16 6c3 3 4.5 6.5 4.5 10S19 23 16 26M16 6c-3 3-4.5 6.5-4.5 10S13 23 16 26" />
      <circle cx="26" cy="8" r="2.4" fill={c} />
      <circle cx="6" cy="24" r="2.4" fill={c} />
    </g>
  ),
  oac: (c, bg) => (
    <g>
      <rect x="7" y="14" width="18" height="13" rx="2" fill={c} />
      <path d="M11 14v-3a5 5 0 0 1 10 0v3" stroke={c} {...S} strokeWidth="2.5" />
      <circle cx="16" cy="20" r="2" fill={bg} />
    </g>
  ),
  api: (c) => (
    <g stroke={c} {...S} strokeWidth="2.5">
      <path d="M8 8 4 16l4 8M24 8l4 8-4 8" />
      <path d="M10 16h12M18 12l4 4-4 4" />
    </g>
  ),
  blobservice: (c, bg) => (
    <g>
      <rect x="5" y="6" width="22" height="6" rx="1.5" fill={c} />
      <rect x="5" y="13" width="22" height="6" rx="1.5" fill={c} opacity="0.8" />
      <rect x="5" y="20" width="22" height="6" rx="1.5" fill={c} opacity="0.6" />
      <path d="M9 9h3M9 16h3M9 23h3" stroke={bg} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  bucketpolicy: (c, bg) => (
    <g>
      <path d="M8 4h11l6 6v18H8z" fill={c} />
      <path d="M12 18l3 3 6-6" stroke={bg} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  container: (c, bg) => (
    <g>
      <path d="M16 4 27 10v12L16 28 5 22V10z" fill={c} />
      <path d="M5 10l11 6 11-6M16 16v12" stroke={bg} strokeWidth="1.5" fill="none" opacity="0.8" />
    </g>
  ),
};

/** AWS glyphs that differ in kind, not just colour, from the shared drawing. */
const AWS_OVERRIDES: Partial<Record<CloudIconKey, Glyph>> = {
  vm: (c) => (
    <g stroke={c} {...S}>
      <rect x="9" y="9" width="14" height="14" rx="1.5" />
      <path d="M12 5v4M16 5v4M20 5v4M12 23v4M16 23v4M20 23v4M5 12h4M5 16h4M5 20h4M23 12h4M23 16h4M23 20h4" />
    </g>
  ),
  function: (c) => (
    <g stroke={c} {...S} strokeWidth="2.5">
      <path d="M9 6h4l8 20h3M15.5 13 9 26" />
    </g>
  ),
  storage: (c) => (
    <g stroke={c} {...S}>
      <ellipse cx="16" cy="8" rx="10" ry="3.5" />
      <path d="M6 8l2.5 17c.3 1.8 3.6 3 7.5 3s7.2-1.2 7.5-3L26 8" />
    </g>
  ),
  nosql: (c) => (
    <g stroke={c} {...S}>
      <ellipse cx="16" cy="8" rx="9" ry="3.5" />
      <path d="M7 8v16c0 2 4 3.5 9 3.5s9-1.5 9-3.5V8M7 14c0 2 4 3.5 9 3.5s9-1.5 9-3.5M7 20c0 2 4 3.5 9 3.5s9-1.5 9-3.5" />
    </g>
  ),
  vnet: (c) => (
    <g stroke={c} {...S}>
      <rect x="4" y="6" width="24" height="20" rx="2" />
      <path d="M11 19a3.5 3.5 0 0 1 .5-7 5 5 0 0 1 9.5 1.5 3 3 0 0 1 .5 5.5z" />
    </g>
  ),
};

export function CloudIcon({
  platform,
  icon,
  size = 40,
  x = 0,
  y = 0,
}: {
  platform: CloudPlatform;
  icon: CloudIconKey;
  size?: number;
  /** Centre of the icon in the parent SVG's units. */
  x?: number;
  y?: number;
}) {
  const scale = size / 32;
  const tx = x - size / 2;
  const ty = y - size / 2;
  const official = officialIconHref(platform, icon);
  if (official) {
    return <image href={official} x={tx} y={ty} width={size} height={size} />;
  }
  if (platform === 'aws') {
    const tile = AWS_CATEGORY[AWS_TILE[icon]];
    const glyph = (AWS_OVERRIDES[icon] ?? GLYPHS[icon])('#FFFFFF', tile);
    return (
      <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
        <rect width="32" height="32" rx="6" fill={tile} />
        <g transform="translate(4 4) scale(0.75)">{glyph}</g>
      </g>
    );
  }
  return (
    <g transform={`translate(${tx} ${ty}) scale(${scale})`}>{GLYPHS[icon](AZURE_GLYPH[icon], '#FFFFFF')}</g>
  );
}

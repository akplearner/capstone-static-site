import { ImageResponse } from 'next/og';
import {
  CRYSTAL,
  CRYSTAL_FACE,
  RIM,
  SILHOUETTE,
  STATIC_PALETTE,
  facetHex,
  facetsFor,
} from '@/components/quarry/stoneGeometry';

// The favicon, drawn rather than shipped as a file: the same faceted capstone the
// product uses everywhere else. Generated with Next's built-in ImageResponse so
// there is no binary asset to maintain and no new dependency — consistent with the
// app's zero-external-asset rule.
//
// Geometry is imported, not retyped. This file and opengraph-image.tsx each used to
// carry their own copy of the path data, so changing the stone silently desynced
// the favicon from the app. Colours ARE hardcoded here, because Satori is not a
// browser and resolves no CSS custom properties — hence STATIC_PALETTE.

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: STATIC_PALETTE.ground,
        }}
      >
        <svg width="512" height="512" viewBox="0 0 120 120">
          <path d={SILHOUETTE.cut} fill={STATIC_PALETTE.rock} />
          {facetsFor('cut').map((f) => {
            const { fill, opacity } = facetHex(f.tone);
            return <path key={f.d} d={f.d} fill={fill} fillOpacity={opacity} />;
          })}
          {/* The crystal earns its place at favicon scale: without it the mark is
              a dark polygon with a light rim, which at 16px in a browser tab is
              just a grey smudge. The coloured core is what makes the tab findable. */}
          <path d={CRYSTAL} fill={STATIC_PALETTE.crystal} />
          <path d={CRYSTAL_FACE} fill={STATIC_PALETTE.vein} fillOpacity="0.5" />
          <path
            d={RIM}
            fill="none"
            stroke={STATIC_PALETTE.vein}
            strokeOpacity="0.9"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size
  );
}

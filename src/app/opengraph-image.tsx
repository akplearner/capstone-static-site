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

// The social preview card. Also generated rather than shipped: the copy has
// changed twice this month, and a drawn card updates with the product instead of
// going stale in /public.
//
// The stone's geometry is imported from the same module the app draws from (see
// the note in icon.tsx); only the colours are hardcoded, because Satori resolves
// no CSS custom properties.

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Capstone Quarry — prove your security skills by building, not cramming';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #14171c 0%, #0d0f12 60%)',
          color: '#f2f4f7',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: '#7aa2c8',
            }}
          >
            Build it · Prove it · Keep it
          </div>
          <div style={{ display: 'flex', fontSize: 68, fontWeight: 700, lineHeight: 1.1, marginTop: 20 }}>
            Cut the stone.
          </div>
          <div style={{ display: 'flex', fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
            Don’t cram for the exam.
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: '#aab3bf', marginTop: 26, maxWidth: 620 }}>
            Home-lab cybersecurity capstones with a verifiable evidence ledger.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="330" height="330" viewBox="0 0 120 120">
            <path d={SILHOUETTE.cut} fill={STATIC_PALETTE.rock} />
            {facetsFor('cut').map((f) => {
              const { fill, opacity } = facetHex(f.tone);
              return <path key={f.d} d={f.d} fill={fill} fillOpacity={opacity} />;
            })}
            <path d={CRYSTAL} fill={STATIC_PALETTE.crystal} fillOpacity="0.95" />
            <path d={CRYSTAL_FACE} fill={STATIC_PALETTE.vein} fillOpacity="0.5" />
            <path
              d={RIM}
              fill="none"
              stroke={STATIC_PALETTE.vein}
              strokeOpacity="0.9"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    ),
    size
  );
}

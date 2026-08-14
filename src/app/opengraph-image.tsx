import { ImageResponse } from 'next/og';

// The social preview card. Also generated rather than shipped: the copy has
// changed twice this month, and a drawn card updates with the product instead of
// going stale in /public.

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
            <defs>
              <linearGradient id="og" x1="0" y1="0" x2="0.7" y2="1">
                <stop offset="0%" stopColor="#d8dce3" />
                <stop offset="55%" stopColor="#5b6572" />
                <stop offset="100%" stopColor="#24272c" />
              </linearGradient>
            </defs>
            <path d="M30 86 L18 54 L40 24 L74 18 L100 44 L96 84 L62 102 Z" fill="url(#og)" />
            <g stroke="#0d0f12" strokeOpacity="0.5" strokeWidth="2.5" fill="none">
              <path d="M40 24 L58 56 L100 44" />
              <path d="M58 56 L62 102" />
              <path d="M58 56 L18 54" />
            </g>
          </svg>
        </div>
      </div>
    ),
    size
  );
}

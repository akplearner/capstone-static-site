import { ImageResponse } from 'next/og';

// The favicon, drawn rather than shipped as a file: a cut facet on dark stone,
// the same mark the product uses everywhere else. Generated with Next's built-in
// ImageResponse so there is no binary asset to maintain and no new dependency —
// consistent with the app's zero-external-asset rule.

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
          background: '#14171c',
        }}
      >
        <svg width="512" height="512" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="f" x1="0" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#d8dce3" />
              <stop offset="60%" stopColor="#5b6572" />
              <stop offset="100%" stopColor="#2b2f36" />
            </linearGradient>
          </defs>
          {/* The faceted capstone. */}
          <path d="M30 86 L18 54 L40 24 L74 18 L100 44 L96 84 L62 102 Z" fill="url(#f)" />
          <g stroke="#0d0f12" strokeOpacity="0.55" strokeWidth="3" fill="none">
            <path d="M40 24 L58 56 L100 44" />
            <path d="M58 56 L62 102" />
            <path d="M58 56 L18 54" />
          </g>
        </svg>
      </div>
    ),
    size
  );
}

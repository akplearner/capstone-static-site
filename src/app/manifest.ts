import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Capstone Quarry',
    short_name: 'Quarry',
    description:
      'Hands-on cybersecurity capstones you build in your own home lab, with a verifiable evidence ledger.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0d0f12',
    theme_color: '#0d0f12',
    icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }],
  };
}

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MandiPlus Field PWA',
    short_name: 'Mandi Field',
    description: 'Standalone field operations progressive web app for survey agents and meeting teams.',
    start_url: '/field',
    display: 'standalone',
    background_color: '#fffaf2',
    theme_color: '#0f172a',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}


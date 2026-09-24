import type { MetadataRoute } from 'next';

/** PWA manifest — makes the web app installable on Android and iOS home screens. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UniDriver',
    short_name: 'UniDriver',
    description: 'Earn from your idle car. UniDriver only earns a share when your car does.',
    start_url: '/owner',
    display: 'standalone',
    background_color: '#0b1120',
    theme_color: '#4f46e5',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}

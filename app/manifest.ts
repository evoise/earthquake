import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Deprem Takip Sistemi',
    short_name: 'Deprem Takip',
    description: 'Türkiye ve dünyada meydana gelen depremleri Kandilli Rasathanesi, AFAD ve EMSC kaynaklarından canlı olarak takip edin.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#1f2937',
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}


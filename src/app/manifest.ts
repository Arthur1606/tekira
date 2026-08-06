import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TEKIRA - Sistema de Gestión Comercial',
    short_name: 'TEKIRA',
    description: 'Plataforma SaaS de control financiero, inventarios, compras y caja para comercios',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#09090B',
    theme_color: '#4F46E5',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

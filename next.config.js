/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Capacitor Configuration
  // En desarrollo, Capacitor puede usar server.url apuntando a localhost
  // En producción, las API routes estarán en Vercel y la app las llamará directamente
  // Para builds estáticos, usar: output: 'export' (pero esto deshabilita API routes)
  // Por ahora mantenemos el servidor activo para que las APIs funcionen
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;


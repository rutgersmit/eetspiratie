/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Recipe images (max 10MB) are uploaded through a server action
    serverActions: { bodySizeLimit: '12mb' },
    proxyClientMaxBodySize: '12mb',
  },
  images: {
    // Image file names are unique and never change, so optimized versions can be cached long
    minimumCacheTTL: 60 * 60 * 24 * 30,
    localPatterns: [{ pathname: '/api/images/**' }],
  },
  async headers() {
    return [
      {
        // Service workers must always be revalidated
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Manifest can change on deploy; short TTL so PWA updates propagate quickly
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        // Icons are referenced by name from manifest.json; cache for a week
        source: '/icons/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800' },
        ],
      },
    ]
  },
}

module.exports = nextConfig

const path = require('path')
const { version } = require('./package.json')

// Only apply outside `next dev`. With tracing root set, some setups saw repeated
// `/_next/static/*` 404s in development (mixed/stale client manifests). Production
// `next build` / `next start` still get the parent-lockfile fix.
const isDevServer = process.argv.includes('dev')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose the package.json version to client components at build time.
  env: { NEXT_PUBLIC_APP_VERSION: version },
  async redirects() {
    return [
      { source: '/planner', destination: '/plan', permanent: true },
      { source: '/planner/:path*', destination: '/plan/:path*', permanent: true },
      { source: '/reports', destination: '/records', permanent: true },
      { source: '/reports/:path*', destination: '/records/:path*', permanent: true },
    ]
  },
  ...(!isDevServer
    ? {
        outputFileTracingRoot: path.join(__dirname),
      }
    : {}),
  productionBrowserSourceMaps: false,
  // Only tweak minification for production. Forcing client minimize in `next dev`
  // breaks Fast Refresh (file saves appear to do nothing until a full reload).
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      config.optimization.minimize = !isServer
    }
    return config
  },
}

module.exports = nextConfig

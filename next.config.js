const path = require('path')

// Only apply outside `next dev`. With tracing root set, some setups saw repeated
// `/_next/static/*` 404s in development (mixed/stale client manifests). Production
// `next build` / `next start` still get the parent-lockfile fix.
const isDevServer = process.argv.includes('dev')

/** @type {import('next').NextConfig} */
const nextConfig = {
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

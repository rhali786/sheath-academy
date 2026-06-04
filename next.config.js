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
  // Keep pino and its transports on the server — never bundle for the browser.
  serverExternalPackages: ['pino', 'pino-pretty'],
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
  webpack: (config, { dev, isServer, nextRuntime }) => {
    if (!dev) {
      config.optimization.minimize = !isServer
    }
    // instrumentation.ts is compiled for every runtime, but its fs/path/pino
    // usage only runs under the Node server (guarded by NEXT_RUNTIME). For the
    // edge and client bundles, stub these node builtins so webpack doesn't try
    // to resolve them. Code paths that touch them never execute off-Node.
    if (nextRuntime !== 'nodejs') {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }
    return config
  },
}

module.exports = nextConfig

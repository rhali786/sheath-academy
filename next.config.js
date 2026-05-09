/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer }) => {
    config.optimization.minimize = !isServer
    return config
  },
}

module.exports = nextConfig

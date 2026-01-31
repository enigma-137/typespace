/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    allowedDevOrigins: ['ambitious-peridot.outray.app', '*.ambitious-peridot.outray.app'],
  },
}

export default nextConfig

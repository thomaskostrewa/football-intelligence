import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/de/match/ger-mex',
        permanent: false,
      },
    ]
  },
}

export default nextConfig

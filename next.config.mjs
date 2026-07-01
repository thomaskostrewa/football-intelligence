/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.git/**',
          '**/.next/**',
          '**/node_modules/**',
          '**/tmp_extracted_football/**',
          '**/tsconfig.tsbuildinfo',
        ],
      }
    }

    return config
  },
}

export default nextConfig

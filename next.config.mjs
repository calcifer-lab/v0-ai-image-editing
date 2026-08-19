/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/qwen-3-8-27b",
        destination: "/qwen-3.8-27b",
        statusCode: 301,
      },
    ]
  },
}

export default nextConfig

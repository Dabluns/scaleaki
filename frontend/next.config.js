/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      { source: '/api/proxy/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.scaleaki.site'}/:path*` },
    ];
  },
};

module.exports = nextConfig;
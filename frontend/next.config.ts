import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Add this rewrites block.
  // This tells the Next.js dev server to forward any /api/...
  // requests to your local Rust server during development.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
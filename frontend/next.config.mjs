/** @type {import('next').NextConfig} */

// Backend base URL. Locally defaults to the Express dev server; on Vercel set
// BACKEND_URL to your deployed backend (e.g. https://your-backend.vercel.app).
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`, // Proxy to Express backend
      },
    ];
  },
};

export default nextConfig;

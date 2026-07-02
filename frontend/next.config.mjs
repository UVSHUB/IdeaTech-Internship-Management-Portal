/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // Proxy to Express backend
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*', // Proxy to serve uploads
      },
    ];
  },
};

export default nextConfig;

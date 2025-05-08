/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
   // Recommended for performance but can be disabled if causing issues
   // reactStrictMode: false, // Disabled strict mode as requested implicitly by font change
   optimizeFonts: true, // Ensure font optimization is enabled
};

module.exports = nextConfig;

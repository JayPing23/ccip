// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.254.102', '192.168.254.110'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // experimental: {
  //   turbo: {
  //     rules: {
  //       '*.module.css': {
  //         as: '*.module.css',
  //         loaders: ['style-loader', 'css-loader'],
  //       },
  //     },
  //   },
  // },
};

export default nextConfig;

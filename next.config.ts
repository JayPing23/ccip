// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.254.102', 'localhost:3000'],
  experimental: {
    turbo: {
      rules: {
        '*.module.css': {
          as: '*.module.css',
          loaders: ['style-loader', 'css-loader'],
        },
      },
    },
  },
};

export default nextConfig;

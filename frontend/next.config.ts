import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
    turbopack: {
        debugIds: true
    },
    experimental: {
        turbopackSourceMaps: true
    }
};

export default nextConfig;

// apps/web/next.config.ts
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },

  // Packages with native binaries or runtime assets that must not be bundled.
  serverExternalPackages: [
    '@resvg/resvg-js',
    'sharp',
    'satori',
    '@imgly/background-removal-node',
    'onnxruntime-node',
  ],

  // Prevent onnxruntime-web from being bundled on the server (peer dep of
  // @imgly/background-removal-node). Not needed for text shaping but
  // harmless to keep as a safety net.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'onnxruntime-web': path.resolve(__dirname, 'src/lib/empty-module.ts'),
      };
    }
    return config;
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '*.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'media.licdn.com' },
      { protocol: 'https', hostname: '*.licdn.com' },
      { protocol: 'https', hostname: '*.fbcdn.net' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
};

export default nextConfig;
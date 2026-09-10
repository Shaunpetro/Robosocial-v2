// apps/web/next.config.ts
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },

  // Packages with native binaries that must not be bundled by Next.js
  serverExternalPackages: [
    '@resvg/resvg-js',
    'sharp',
    'satori',
    '@imgly/background-removal-node',
    'onnxruntime-node',
  ],

  // Trace from the monorepo root so node_modules at the repo root is included
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Explicitly include WASM files used by Satori (harfbuzzjs) and other
  // native runtime assets in the serverless bundle. Without this, Vercel's
  // file tracing omits the .wasm binaries and the function crashes with
  // ENOENT at runtime.
  outputFileTracingIncludes: {
    '/api/companies/[id]/special-dates/generate-media': [
      '../../node_modules/.pnpm/harfbuzzjs@*/node_modules/harfbuzzjs/*.wasm',
      '../../node_modules/.pnpm/satori@*/node_modules/satori/**/*.wasm',
      '../../node_modules/.pnpm/@resvg+resvg-js@*/node_modules/@resvg/resvg-js/**/*.node',
    ],
  },

  // Prevent onnxruntime-web from being bundled on the server (peer dep of
  // @imgly/background-removal-node). Harmless if unused.
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
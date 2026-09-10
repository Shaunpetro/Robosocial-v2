// apps/web/next.config.ts
import type { NextConfig } from 'next';
import path from 'path';

const fontTraces = [
  // Hoisted safety net
  '../../node_modules/@fontsource/*/files/*.woff',

  // pnpm store — one pattern per installed Fontsource package
  '../../node_modules/.pnpm/@fontsource+inter@*/node_modules/@fontsource/inter/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+poppins@*/node_modules/@fontsource/poppins/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+playfair-display@*/node_modules/@fontsource/playfair-display/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+mountains-of-christmas@*/node_modules/@fontsource/mountains-of-christmas/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+festive@*/node_modules/@fontsource/festive/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+handlee@*/node_modules/@fontsource/handlee/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+dawning-of-a-new-day@*/node_modules/@fontsource/dawning-of-a-new-day/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+great-vibes@*/node_modules/@fontsource/great-vibes/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+creepster@*/node_modules/@fontsource/creepster/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+dancing-script@*/node_modules/@fontsource/dancing-script/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+cinzel@*/node_modules/@fontsource/cinzel/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+cormorant-garamond@*/node_modules/@fontsource/cormorant-garamond/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+eb-garamond@*/node_modules/@fontsource/eb-garamond/files/*.woff',
  '../../node_modules/.pnpm/@fontsource+oswald@*/node_modules/@fontsource/oswald/files/*.woff',
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },

  serverExternalPackages: [
    '@resvg/resvg-js',
    'sharp',
    'satori',
    '@imgly/background-removal-node',
    'onnxruntime-node',
  ],

  outputFileTracingRoot: path.join(__dirname, '../../'),

  outputFileTracingIncludes: {
    '/api/companies/[id]/special-dates/generate-media': [
      '../../node_modules/.pnpm/harfbuzzjs@*/node_modules/harfbuzzjs/*.wasm',
      '../../node_modules/.pnpm/satori@*/node_modules/satori/**/*.wasm',
      '../../node_modules/.pnpm/@resvg+resvg-js@*/node_modules/@resvg/resvg-js/**/*.node',
      ...fontTraces,
    ],
  },

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
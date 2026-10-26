import { defineConfig, envField } from 'astro/config'

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

import path from 'node:path';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react()],

  env: {
    schema: {
      GRAPHQL_URL: envField.string({context: 'server', access: 'secret',}),

      CLOUDINARY_CLOUD_NAME: envField.string({ context: 'server', access: 'secret' }),
      CLOUDINARY_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      CLOUDINARY_API_SECRET: envField.string({ context: 'server', access: 'secret' }),

      PUBLIC_PAYPAL_CLIENT_ID: envField.string({
        context: 'client',
        access: 'public',
        default: '',
        optional: true,
      }),

      PUBLIC_MP_PUBLIC_KEY: envField.string({
        context: 'client',
        access: 'public',
        default: '',
        optional: true,
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  }
});
import { defineConfig, envField } from 'astro/config'

import react from '@astrojs/react';
import node from '@astrojs/node';

import tailwindcss from '@tailwindcss/vite';

import path from 'node:path';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],

  env: {
    schema: {
      GRAPHQL_URL: envField.string({
        context: 'server',
        access: 'secret',
        default: 'http://localhost:4000/',
      }),

      PUBLIC_MP_PUBLIC_KEY: envField.string({
        context: 'client',
        access: 'public',
        default: '',
      }),

      PUBLIC_PAYPAL_CLIENT_ID: envField.string({
        context: 'client',
        access: 'public',
        default: '',
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
// @ts-check
import { defineConfig, envField } from 'astro/config'

import react from '@astrojs/react';
import node from '@astrojs/node';

import tailwindcss from '@tailwindcss/vite';

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
    },
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
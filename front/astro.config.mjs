import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import vercel from '@astrojs/vercel';

// import vitePwa from '@vite-pwa/astro';
import { AstroPWAIntegration } from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://checo-barber.vercel.app',
  output: 'server',
  adapter: vercel(),
  
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    fallback: { en: 'es' },
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite',
    },
  },

  integrations: [
    react(),
        AstroPWAIntegration({
      strategies: 'buildSW',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Para probar el SW en local: $env:PWA_DEV="true"; pnpm dev
      devOptions: {
        enabled: process.env.PWA_DEV === 'true',
        type: 'module',
      },
      manifest: {
        id: '/',
        name: 'Checo Barber, Citas y Productos',
        short_name: 'Checo Barber',
        description: 'Productos para cabello y barba y citas en ChecoBarber.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#fde2be',
        background_color: '#ffffff',
        icons: [
          { src: '/icons/icon-192.webp', sizes: '192x192', type: 'image/webp' },
          { src: '/icons/icon-512.webp', sizes: '512x512', type: 'image/webp' },
          { src: '/icons/maskable_icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      buildSW: {
        // Ruta del Service Worker, relativa a la carpeta front
        swSrc: 'src/sw.js',
        // Solo archivos estáticos: tu tienda es SSR, no hay HTML que precachear
        globPatterns: ['**/*.{js,css,svg,png,ico,webp,woff2}'],
      },
    }),
  ],

  env: {
    schema: {
      GRAPHQL_URL: envField.string({context: 'server', access: 'secret',}),

      CLOUDINARY_CLOUD_NAME: envField.string({ context: 'server', access: 'secret' }),
      CLOUDINARY_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      CLOUDINARY_API_SECRET: envField.string({ context: 'server', access: 'secret' }),
      GRAPHQL_URL: envField.string({
        context: 'server',
        access: 'secret',
        default: 'http://localhost:4000/',
      }),

      PUBLIC_GRAPHQL_WS_URL: envField.string({
        context: 'client',
        access: 'public',
        default: 'ws://localhost:4000/graphql',
      }),

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

      PUBLIC_GOOGLE_MAPS_KEY: envField.string({
        context: 'client',
        access: 'public',
        default: '',
        optional: true,
      }),

      PUBLIC_SHOP_MAP_QUERY: envField.string({
        context: 'client',
        access: 'public',
        default: 'ChecoBarber',
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
  },
});
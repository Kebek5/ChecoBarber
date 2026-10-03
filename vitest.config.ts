/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';
import { defineConfig } from 'vitest/config';

export default defineConfig(async (env) => {
   const astroConfig = await getViteConfig(env);

   return {
      ...astroConfig,
      test: {
         environment: 'jsdom',
         globals: true,
      },
   };
});

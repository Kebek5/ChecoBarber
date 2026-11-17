/// <reference types="astro/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/info" />


declare namespace App {
  interface Locals {
    user: import('./domain/auth/User').User | null;
    token: string | null;
    backendDown: boolean;
  }
}
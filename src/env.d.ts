/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('./domain/auth/User').User | null;
  }
}
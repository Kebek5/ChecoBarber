/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
   readonly GRAPHQL_URL?: string
}

declare namespace App {
   interface Locals {
      user: import('@/domain/auth').User | null
      token: string | null
      backendDown: boolean
   }
}
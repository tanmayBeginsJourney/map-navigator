/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_NODE_ENV: string
  readonly VITE_ENABLE_OFFLINE_MODE: string
  readonly VITE_ENABLE_DEBUG_MODE: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ANALYTICS_ID: string
  readonly VITE_MAP_PROVIDER: string
  readonly VITE_MAP_API_KEY: string
  readonly VITE_API_VERSION: string
  // Allow dynamic key access for environment variables
  readonly [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

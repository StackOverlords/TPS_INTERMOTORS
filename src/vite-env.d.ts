/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_REVERB_HOST: string
  readonly VITE_REVERB_PORT: string
  readonly VITE_REVERB_APP_KEY: string
  readonly VITE_REVERB_SCHEME: string
  readonly VITE_APP_ENV: string
  readonly VITE_APP_VARIANT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Version de package.json inyectada en build por Vite (ver vite.config.ts). */
declare const __APP_VERSION__: string;

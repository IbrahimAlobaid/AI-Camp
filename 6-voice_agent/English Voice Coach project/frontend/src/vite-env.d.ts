/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PIPECAT_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

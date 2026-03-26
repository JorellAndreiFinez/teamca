/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_BACKEND_URL: string;
  //...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

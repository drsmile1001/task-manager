interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_TM_PERF?: "0" | "1";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

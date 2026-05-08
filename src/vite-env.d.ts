/// <reference types="vite/client" />

interface ImportMetaEnv {
  // ─── Mock System ──────────────────────────────
  readonly VITE_USE_MOCKS: string;
  readonly VITE_DEV_TOOLBAR: string;
  readonly VITE_MOCK_DELAY_MS: string;
  readonly VITE_SIMULATE_FAILURES: string;
  readonly VITE_FAILURE_RATE: string;
  readonly VITE_VERBOSE_LOGGING: string;

  // ─── Service Overrides ────────────────────────
  readonly VITE_AUTH_PROVIDER: string;
  readonly VITE_STORAGE_PROVIDER: string;
  readonly VITE_EXERCISE_API_PROVIDER: string;

  // ─── Supabase ─────────────────────────────────
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

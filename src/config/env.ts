/**
 * Environment Configuration
 * Reads both VITE_* and NEXT_PUBLIC_* env vars seamlessly.
 */

export type AppEnvironment = 'development' | 'production' | 'test';

export const ENV: AppEnvironment = (() => {
  const mode = import.meta.env.MODE as string;
  if (mode === 'test') return 'test';
  if (mode === 'production') return 'production';
  return 'development';
})();

export const isDev = ENV === 'development';
export const isProd = ENV === 'production';
export const isTest = ENV === 'test';

export interface FeatureFlags {
  useMocks: boolean;
  devToolbar: boolean;
  mockDelayMs: number;
  simulateFailures: boolean;
  failureRate: number;
  verboseLogging: boolean;
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = import.meta.env[key];
  if (raw === undefined || raw === '') return fallback;
  return ['true', '1', 'yes'].includes(String(raw).toLowerCase());
}

function envNumber(key: string, fallback: number): number {
  const raw = import.meta.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const resolvedSupabaseUrl = (
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  ''
) as string;

const resolvedSupabaseAnonKey = (
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
) as string;

export const hasSupabaseCredentials =
  Boolean(resolvedSupabaseUrl && resolvedSupabaseAnonKey) &&
  !resolvedSupabaseUrl.includes('SEU-PROJETO') &&
  !resolvedSupabaseUrl.includes('seu-projeto');

export const flags: FeatureFlags = {
  useMocks: envBool('VITE_USE_MOCKS', !hasSupabaseCredentials),
  devToolbar: envBool('VITE_DEV_TOOLBAR', isDev),
  mockDelayMs: envNumber('VITE_MOCK_DELAY_MS', 300),
  simulateFailures: envBool('VITE_SIMULATE_FAILURES', false),
  failureRate: envNumber('VITE_FAILURE_RATE', 0.1),
  verboseLogging: envBool('VITE_VERBOSE_LOGGING', isDev),
};

export const supabaseConfig = {
  url: resolvedSupabaseUrl || undefined,
  anonKey: resolvedSupabaseAnonKey || undefined,
};

export interface ServiceOverrides {
  auth: 'mock' | 'real';
  storage: 'mock' | 'real';
  exerciseApi: 'mock' | 'real';
}

export const serviceOverrides: ServiceOverrides = {
  auth:
    (import.meta.env.VITE_AUTH_PROVIDER as 'mock' | 'real') ??
    (flags.useMocks ? 'mock' : 'real'),
  storage:
    (import.meta.env.VITE_STORAGE_PROVIDER as 'mock' | 'real') ??
    (flags.useMocks ? 'mock' : 'real'),
  exerciseApi:
    (import.meta.env.VITE_EXERCISE_API_PROVIDER as 'mock' | 'real') ??
    (flags.useMocks ? 'mock' : 'real'),
};

export function logEnvironmentBanner(): void {
  if (!flags.verboseLogging) return;
  console.log(
    `%cCoreTracker Hybrid%c | Mode: ${ENV} | Auth: ${serviceOverrides.auth} | Storage: ${serviceOverrides.storage} | Catalog API: ${serviceOverrides.exerciseApi}`,
    'color: #EA580C; font-weight: bold;',
    'color: inherit;'
  );
}

/**
 * Environment Configuration
 * 
 * Central source of truth for environment detection and feature flags.
 * Reads from Vite's import.meta.env and provides typed, validated config.
 */

// ─── Environment Detection ─────────────────────────────────────

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

// ─── Feature Flags ──────────────────────────────────────────────

export interface FeatureFlags {
  /** Use mock services instead of real ones */
  useMocks: boolean;
  /** Enable the dev toolbar overlay */
  devToolbar: boolean;
  /** Simulate network delay on mock calls (ms) */
  mockDelayMs: number;
  /** Enable random failure simulation */
  simulateFailures: boolean;
  /** Failure rate (0-1) when simulateFailures is on */
  failureRate: number;
  /** Enable verbose logging */
  verboseLogging: boolean;
}

/**
 * Reads a boolean env var, defaulting to `fallback` if absent.
 * Accepts "true", "1", "yes" as truthy.
 */
function envBool(key: string, fallback: boolean): boolean {
  const raw = import.meta.env[key];
  if (raw === undefined || raw === '') return fallback;
  return ['true', '1', 'yes'].includes(String(raw).toLowerCase());
}

function envNumber(key: string, fallback: number): number {
  const raw = import.meta.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return isNaN(parsed) ? fallback : parsed;
}

export const flags: FeatureFlags = {
  useMocks: envBool('VITE_USE_MOCKS', isDev),
  devToolbar: envBool('VITE_DEV_TOOLBAR', isDev),
  mockDelayMs: envNumber('VITE_MOCK_DELAY_MS', 400),
  simulateFailures: envBool('VITE_SIMULATE_FAILURES', false),
  failureRate: envNumber('VITE_FAILURE_RATE', 0.1),
  verboseLogging: envBool('VITE_VERBOSE_LOGGING', isDev),
};

// ─── Supabase Config (production only) ──────────────────────────

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
};

// ─── Hybrid Mode Overrides ──────────────────────────────────────
// Allow individual services to be overridden independently.

export interface ServiceOverrides {
  auth: 'mock' | 'real';
  storage: 'mock' | 'real';
  exerciseApi: 'mock' | 'real';
}

export const serviceOverrides: ServiceOverrides = {
  auth: (import.meta.env.VITE_AUTH_PROVIDER as 'mock' | 'real') ?? (flags.useMocks ? 'mock' : 'real'),
  storage: (import.meta.env.VITE_STORAGE_PROVIDER as 'mock' | 'real') ?? (flags.useMocks ? 'mock' : 'real'),
  exerciseApi: (import.meta.env.VITE_EXERCISE_API_PROVIDER as 'mock' | 'real') ?? (flags.useMocks ? 'mock' : 'real'),
};

// ─── Startup Banner ─────────────────────────────────────────────

export function logEnvironmentBanner(): void {
  const divider = '═'.repeat(52);

  console.log(
    `%c${divider}\n` +
    `  🏋️ CoreTracker — Environment Info\n` +
    `${divider}\n` +
    `  Mode:           ${ENV.toUpperCase()}\n` +
    `  Mocks:          ${flags.useMocks ? '✅ ON' : '❌ OFF'}\n` +
    `  Auth Provider:  ${serviceOverrides.auth}\n` +
    `  Storage:        ${serviceOverrides.storage}\n` +
    `  Exercise API:   ${serviceOverrides.exerciseApi}\n` +
    `  Mock Delay:     ${flags.mockDelayMs}ms\n` +
    `  Failures Sim:   ${flags.simulateFailures ? `ON (${flags.failureRate * 100}%)` : 'OFF'}\n` +
    `  Dev Toolbar:    ${flags.devToolbar ? 'ON' : 'OFF'}\n` +
    `${divider}`,
    `color: ${isProd ? '#22C55E' : '#F59E0B'}; font-weight: bold; font-size: 12px;`
  );
}

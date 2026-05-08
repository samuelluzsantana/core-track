/**
 * Mock Utilities
 * 
 * Shared helpers for mock services: artificial delay, simulated failures, etc.
 */

import { flags } from '../../config/env';

/**
 * Simulates network latency with a small random jitter.
 */
export async function mockDelay(overrideMs?: number): Promise<void> {
  const base = overrideMs ?? flags.mockDelayMs;
  const jitter = Math.random() * base * 0.3; // ±30% jitter
  await new Promise((r) => setTimeout(r, base + jitter));
}

/**
 * Randomly throws an error to simulate backend failures.
 * Only active when `flags.simulateFailures` is true.
 */
export function maybeThrow(operation: string): void {
  if (!flags.simulateFailures) return;
  if (Math.random() < flags.failureRate) {
    throw new Error(
      `[Mock Failure] Simulated failure on "${operation}" (rate: ${flags.failureRate * 100}%)`
    );
  }
}

/**
 * Generates a random ID similar to what a database would produce.
 */
export function mockId(): string {
  return `mock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Logs a mock operation to the console when verbose logging is on.
 */
export function mockLog(service: string, method: string, ...args: unknown[]): void {
  if (flags.verboseLogging) {
    console.log(
      `%c[MOCK:${service}]%c ${method}`,
      'color: #A78BFA; font-weight: bold;',
      'color: inherit;',
      ...args
    );
  }
}

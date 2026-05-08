/**
 * Service Registry — Dependency Injection Container
 * 
 * This is the single entry point for all services. Based on env config
 * and feature flags, it instantiates either mock or real implementations.
 * 
 * Usage:
 *   import { services } from '@/services';
 *   const profile = await services.storage.getProfile();
 */

import { IAuthService, IStorageService, IExerciseApiService } from '../config/types';
import { serviceOverrides, logEnvironmentBanner } from '../config/env';

// ─── Service Instances (singleton) ──────────────────────────────

export interface ServiceContainer {
  auth: IAuthService;
  storage: IStorageService;
  exerciseApi: IExerciseApiService;
}

let _services: ServiceContainer | null = null;

/**
 * Lazily initializes and returns the service container.
 * Uses dynamic imports to avoid bundling mock code in production
 * when tree-shaking is properly configured.
 */
export async function initializeServices(): Promise<ServiceContainer> {
  if (_services) return _services;

  // Auth
  let auth: IAuthService;
  if (serviceOverrides.auth === 'mock') {
    const { MockAuthService } = await import('./mock/auth.mock');
    auth = new MockAuthService();
  } else {
    const { RealAuthService } = await import('./real/auth.real');
    auth = new RealAuthService();
  }

  // Storage
  let storage: IStorageService;
  if (serviceOverrides.storage === 'mock') {
    const { MockStorageService } = await import('./mock/storage.mock');
    storage = new MockStorageService();
  } else {
    const { RealStorageService } = await import('./real/storage.real');
    storage = new RealStorageService();
  }

  // Exercise API
  let exerciseApi: IExerciseApiService;
  if (serviceOverrides.exerciseApi === 'mock') {
    const { MockExerciseApiService } = await import('./mock/exerciseApi.mock');
    exerciseApi = new MockExerciseApiService();
  } else {
    const { RealExerciseApiService } = await import('./real/exerciseApi.real');
    exerciseApi = new RealExerciseApiService();
  }

  _services = { auth, storage, exerciseApi };

  // Log environment info
  logEnvironmentBanner();

  return _services;
}

/**
 * Synchronous accessor — throws if services haven't been initialized yet.
 * Use this only AFTER initializeServices() has resolved.
 */
export function getServices(): ServiceContainer {
  if (!_services) {
    throw new Error(
      '[ServiceRegistry] Services not initialized. Call initializeServices() first.'
    );
  }
  return _services;
}

/**
 * Reset services (useful for testing or scenario switching).
 */
export function resetServices(): void {
  _services = null;
}

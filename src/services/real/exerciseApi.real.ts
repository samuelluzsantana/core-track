/**
 * Real Exercise API Service — wraps ExerciseDB OSS API
 */

import { IExerciseApiService } from '../../config/types';
import { ExerciseDBExercise } from '../../types';

const API_BASE = 'https://oss.exercisedb.dev/api/v1';
const CACHE_KEY = 'coretracker_exercisedb_cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  lastUpdated: string;
  exercises: ExerciseDBExercise[];
}

export class RealExerciseApiService implements IExerciseApiService {
  private getCache(): CacheEntry | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cache: CacheEntry = JSON.parse(raw);
      const age = Date.now() - new Date(cache.lastUpdated).getTime();
      if (age > CACHE_TTL_MS) return null;
      return cache;
    } catch {
      return null;
    }
  }

  private setCache(exercises: ExerciseDBExercise[]): void {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ lastUpdated: new Date().toISOString(), exercises })
      );
    } catch (e) {
      console.warn('Failed to cache ExerciseDB data:', e);
    }
  }

  async fetchExercises(): Promise<ExerciseDBExercise[]> {
    const cached = this.getCache();
    if (cached) return cached.exercises;

    try {
      const coreBodyParts = ['waist', 'back', 'upper legs'];
      const results = await Promise.all(
        coreBodyParts.map(async (part) => {
          const res = await fetch(
            `${API_BASE}/exercises/bodyPart/${encodeURIComponent(part)}`,
            { signal: AbortSignal.timeout(10000) }
          );
          if (!res.ok) throw new Error(`API returned ${res.status}`);
          const data = await res.json();
          return (data.data || data || []) as ExerciseDBExercise[];
        })
      );

      const allExercises = results.flat();
      const homeExercises = allExercises.filter(
        (ex) =>
          !ex.equipments ||
          ex.equipments.length === 0 ||
          ex.equipments.every((e) =>
            ['body weight', 'none', ''].includes(e.toLowerCase())
          )
      );

      this.setCache(homeExercises);
      return homeExercises;
    } catch (error) {
      console.warn('ExerciseDB API unavailable:', error);
      return [];
    }
  }

  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
}

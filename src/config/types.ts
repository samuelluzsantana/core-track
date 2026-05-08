/**
 * Service Interface Contracts
 * 
 * These interfaces define the contracts that both mock and real
 * service implementations must satisfy. This is the "adapter" layer
 * that enables seamless swapping between environments.
 */

import { Session } from '@supabase/supabase-js';
import {
  UserProfile,
  PlankSession,
  ExerciseSession,
  Feedback,
  LombarLevelData,
  ExerciseDBExercise,
} from '../types';

// ─── Auth Service Contract ──────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface IAuthService {
  /** Get the current authenticated user */
  getCurrentUser(): Promise<AuthUser | null>;
  /** Get current session */
  getSession(): Promise<Session | null>;
  /** Sign up with email/password */
  signUp(email: string, password: string): Promise<void>;
  /** Sign in with email/password */
  signIn(email: string, password: string): Promise<void>;
  /** Sign in with Google OAuth */
  signInWithGoogle(): Promise<void>;
  /** Sign out */
  signOut(): Promise<void>;
  /** Subscribe to auth state changes. Returns unsubscribe function. */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}

// ─── Storage Service Contract ───────────────────────────────────

export interface IStorageService {
  // Profile
  getProfile(): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;

  // Plank Sessions
  getPlankSessions(): Promise<PlankSession[]>;
  addPlankSession(session: Omit<PlankSession, 'id'>): Promise<string>;
  updatePlankFeedback(id: string, feedback: Feedback): Promise<void>;

  // Exercise Sessions
  getExerciseSessions(): Promise<ExerciseSession[]>;
  addExerciseSession(session: Omit<ExerciseSession, 'id'>): Promise<string>;
  updateExerciseFeedback(id: string, feedback: Feedback): Promise<void>;

  // Streak
  getStreak(): Promise<{ currentStreak: number; lastWorkoutDate: string | null }>;
  resetStreak(): Promise<void>;

  // Lombar Level
  getLombarLevel(): Promise<LombarLevelData>;
  advanceLombarLevel(): Promise<void>;
  regressLombarLevel(): Promise<void>;

  // Aggregations
  getPersonalRecord(): Promise<number>;
  getWeeklyVolume(): Promise<{ plankSeconds: number; exerciseReps: number }>;
  getMonthlyVolume(): Promise<{ plankSeconds: number; exerciseReps: number }>;
  getTotalSessions(): Promise<number>;

  // Settings / Reset
  updatePainLevel(painLevel: number): Promise<void>;
  updateObjective(objective: 'alivio' | 'fortalecimento' | 'performance'): Promise<void>;
  updateExperienceLevel(level: 'iniciante' | 'moderado' | 'avancado'): Promise<void>;
  clearPlankHistory(): Promise<void>;
  clearExerciseHistory(): Promise<void>;
  resetAllData(): Promise<void>;
}

// ─── Exercise API Contract ──────────────────────────────────────

export interface IExerciseApiService {
  /** Fetch exercises (from API or cache) */
  fetchExercises(): Promise<ExerciseDBExercise[]>;
  /** Clear local cache */
  clearCache(): void;
}

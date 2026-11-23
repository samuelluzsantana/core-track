import { Session } from '@supabase/supabase-js';
import {
  UserProfile,
  CatalogExercise,
  WorkoutRoutine,
  WorkoutLog,
  Feedback,
  LombarLevelData,
  ThemePreference,
  Objective,
  ExperienceLevel,
  ExternalSearchParams,
  ExternalSearchResult,
} from '../types';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface IAuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  getSession(): Promise<Session | null>;
  signUp(email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}

export interface IStorageService {
  // Profile
  getProfile(): Promise<UserProfile | null>;
  saveProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
  updatePainLevel(painLevel: number): Promise<void>;
  updateObjective(objective: Objective): Promise<void>;
  updateExperienceLevel(level: ExperienceLevel): Promise<void>;
  updateThemePreference(theme: ThemePreference): Promise<void>;

  // Exercise Catalog
  getCatalogExercises(): Promise<CatalogExercise[]>;
  saveCatalogExercise(
    exercise: Omit<CatalogExercise, 'id'> & { id?: string }
  ): Promise<CatalogExercise>;
  deleteCustomExercise(id: string): Promise<void>;

  // Routines
  getRoutines(): Promise<WorkoutRoutine[]>;
  saveRoutine(
    routine: Omit<WorkoutRoutine, 'id'> & { id?: string }
  ): Promise<WorkoutRoutine>;
  deleteRoutine(id: string): Promise<void>;

  // Polymorphic Workout Logs
  getWorkoutLogs(): Promise<WorkoutLog[]>;
  addWorkoutLog(log: Omit<WorkoutLog, 'id'>): Promise<WorkoutLog>;
  updateWorkoutFeedback(
    id: string,
    feedback: Feedback,
    painReported?: number
  ): Promise<void>;
  clearWorkoutHistory(): Promise<void>;

  // Streak & Lombar Level
  getStreak(): Promise<{ currentStreak: number; lastWorkoutDate: string | null }>;
  resetStreak(): Promise<void>;
  getLombarLevel(): Promise<LombarLevelData>;
  advanceLombarLevel(): Promise<void>;
  regressLombarLevel(): Promise<void>;

  // Reset
  resetAllData(): Promise<void>;
}

export interface IExerciseApiService {
  searchExternalExercises(
    params: ExternalSearchParams
  ): Promise<ExternalSearchResult>;
  clearCache(): void;
}

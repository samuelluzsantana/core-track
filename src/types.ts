export type PainLevel = number; // 1–10
export type Objective = 'alivio' | 'fortalecimento' | 'performance';
export type ExperienceLevel = 'iniciante' | 'moderado' | 'avancado';
export type ThemePreference = 'light' | 'dark' | 'system';

export type MeasurementType = 'time_based' | 'reps_based' | 'interval_based';
export type ExerciseCategory =
  | 'core'
  | 'cardio'
  | 'strength'
  | 'mobility'
  | 'stretching'
  | 'plyometrics';

export type ImpactLevel = 'mobility' | 'low' | 'medium' | 'high';
export type ExerciseSource =
  | 'system'
  | 'free-exercise-db'
  | 'api-ninjas'
  | 'exerciseapi'
  | 'custom';

export type ThemeColor = 'amber' | 'teal' | 'indigo' | 'emerald' | 'rose';
export type Feedback = 'otimo' | 'ok' | 'desconforto' | 'dorAguda';

export interface LombarLevelData {
  currentLevel: number; // 0–5
  weeksAtCurrentLevel: number;
  levelStartDate: string; // ISO string
}

export interface UserProfile {
  displayName?: string;
  painLevel: PainLevel;
  objective: Objective;
  experienceLevel: ExperienceLevel;
  themePreference: ThemePreference;
  onboardingCompleted: boolean;
  weeklyGoalMinutes: number;
  currentStreak: number;
  lastWorkoutDate: string | null;
  lombarLevel: LombarLevelData;
}

export interface ExerciseDefaultConfig {
  targetSeconds?: number;
  checklist?: string[];
  defaultSets?: number;
  defaultReps?: number;
  defaultLoadKg?: number;
  rounds?: number;
  workSeconds?: number;
  restSeconds?: number;
  targetCycles?: number;
}

export interface CatalogExercise {
  id: string;
  externalId?: string | null;
  source: ExerciseSource;
  name: string;
  category: ExerciseCategory;
  measurementType: MeasurementType;
  force?: 'static' | 'push' | 'pull' | null;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mechanic?: 'compound' | 'isolation' | null;
  equipment?: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  tips: string[];
  imageUrls: string[];
  videoUrl?: string | null;
  impactLevel: ImpactLevel;
  themeColor: ThemeColor;
  iconName: string;
  defaultConfig: ExerciseDefaultConfig;
  isCustom: boolean;
  userId?: string | null;
}

export interface WorkoutRoutineItem {
  id: string;
  catalogId?: string;
  externalId?: string;
  exerciseName: string;
  measurementType: MeasurementType;
  category: ExerciseCategory;
  impactLevel: ImpactLevel;
  imageUrl?: string;
  targetSeconds?: number;
  sets?: number;
  reps?: number;
  loadKg?: number;
  rounds?: number;
  workSeconds?: number;
  restSeconds?: number;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  description?: string;
  category: string;
  accentColor: ThemeColor;
  items: WorkoutRoutineItem[];
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SetLogItem {
  setNumber: number;
  reps: number;
  loadKg?: number;
  completed: boolean;
  isWarmup?: boolean;
}

export interface WorkoutMetrics {
  mode?: 'livre' | 'progressao';
  targetSeconds?: number;
  checklistCompleted?: number;
  sets?: SetLogItem[];
  totalSets?: number;
  avgReps?: number;
  maxLoadKg?: number;
  rounds?: number;
  workSeconds?: number;
  restSeconds?: number;
  totalCycles?: number;
  cadenceRpm?: number;
}

export interface WorkoutLog {
  id: string;
  exerciseId?: string | null;
  exerciseExternalId?: string | null;
  routineId?: string | null;
  exerciseName: string;
  category: ExerciseCategory;
  measurementType: MeasurementType;
  performedAt: string; // ISO string
  durationSeconds: number;
  totalReps: number;
  totalLoadKg: number;
  roundsCompleted: number;
  primaryMuscles: string[];
  metrics: WorkoutMetrics;
  feedback?: Feedback | null;
  painReported?: number | null;
  notes?: string | null;
}

export interface AppData {
  profile: UserProfile | null;
  catalog: CatalogExercise[];
  routines: WorkoutRoutine[];
  logs: WorkoutLog[];
}

export interface ExternalSearchParams {
  query?: string;
  category?: string;
  muscle?: string;
  difficulty?: string;
  provider?: 'auto' | 'free-exercise-db' | 'api-ninjas' | 'exerciseapi';
  limit?: number;
}

export interface ExternalSearchResult {
  source: ExerciseSource;
  fallback: boolean;
  message?: string;
  exercises: CatalogExercise[];
}

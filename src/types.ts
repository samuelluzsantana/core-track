export type PainLevel = number; // 1-10
export type Objective = 'alivio' | 'fortalecimento' | 'performance';
export type ExperienceLevel = 'iniciante' | 'moderado' | 'avancado';

export interface UserProfile {
  painLevel: PainLevel;
  objective: Objective;
  experienceLevel: ExperienceLevel;
  onboardingCompleted: boolean;
}

export type Feedback = 'otimo' | 'ok' | 'desconforto' | 'dorAguda';

export interface PlankSession {
  id: string;
  date: string; // ISO string
  mode: 'livre' | 'progressao';
  durationSeconds: number;
  exerciseId?: string; // ExerciseDB ID for plank variation
  feedback?: Feedback;
}

export type ExerciseId =
  | 'deadBug'
  | 'crunch'
  | 'birdDog'
  | 'catCow'
  | 'ponteGluteo'
  | string; // Allow dynamic ExerciseDB IDs

export interface ExerciseSession {
  id: string;
  date: string; // ISO string
  exerciseId: ExerciseId;
  exerciseName?: string; // Cached name for offline display
  targetMuscles?: string[]; // Cached for radar chart
  sets: number;
  reps: number;
  feedback?: Feedback;
}

export interface LombarLevelData {
  currentLevel: number; // 0–5
  weeksAtCurrentLevel: number;
  levelStartDate: string; // ISO string
}

export interface AppData {
  profile: UserProfile | null;
  plankSessions: PlankSession[];
  exerciseSessions: ExerciseSession[];
  currentStreak: number;
  lastWorkoutDate: string | null;
  lombarLevel?: LombarLevelData;
}

// ─── ExerciseDB Types ───────────────────────────────────────

export type SafetyLevel = 'mobilidade' | 'baixoImpacto' | 'medioImpacto';

export interface ExerciseDBExercise {
  exerciseId: string;
  name: string;
  bodyParts: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  exerciseType: string;
  equipments: string[];
  instructions: string[];
  exerciseTips: string[];
  variations: string[];
  relatedExerciseIds: string[];
  imageUrl?: string;
  videoUrl?: string;
  overview?: string;
}

export interface ExerciseDBCache {
  lastUpdated: string; // ISO string
  exercises: ExerciseDBExercise[];
}

// ─── Static Exercise Definitions (Fallback) ─────────────────

export interface ExerciseDef {
  id: ExerciseId;
  name: string;
  category: 'Abdominal' | 'Costas' | 'Lombar';
  impact: 'Baixo' | 'Médio' | 'Alto';
  safetyLevel: SafetyLevel;
  focus: string;
  description: string;
  instructions?: string[];
  tips?: string[];
  targetMuscles?: string[];
}
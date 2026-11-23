import {
  AppData,
  UserProfile,
  WorkoutLog,
} from '../../types';
import { DEFAULT_ROUTINES, SEED_CATALOG } from '../../data/seedCatalog';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 55), 0, 0);
  return d.toISOString();
}

export type SeedScenario =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'newUser'
  | 'highPain'
  | 'empty';

export const SEED_PROFILES: Record<string, UserProfile> = {
  beginner: {
    displayName: 'Atleta Iniciante',
    painLevel: 3,
    objective: 'alivio',
    experienceLevel: 'iniciante',
    themePreference: 'light',
    onboardingCompleted: true,
    weeklyGoalMinutes: 60,
    currentStreak: 3,
    lastWorkoutDate: daysAgo(0),
    lombarLevel: { currentLevel: 1, weeksAtCurrentLevel: 2, levelStartDate: daysAgo(14) },
  },
  intermediate: {
    displayName: 'Samuel',
    painLevel: 2,
    objective: 'fortalecimento',
    experienceLevel: 'moderado',
    themePreference: 'light',
    onboardingCompleted: true,
    weeklyGoalMinutes: 90,
    currentStreak: 6,
    lastWorkoutDate: daysAgo(0),
    lombarLevel: { currentLevel: 2, weeksAtCurrentLevel: 3, levelStartDate: daysAgo(21) },
  },
  advanced: {
    displayName: 'Atleta Pro',
    painLevel: 1,
    objective: 'performance',
    experienceLevel: 'avancado',
    themePreference: 'light',
    onboardingCompleted: true,
    weeklyGoalMinutes: 150,
    currentStreak: 14,
    lastWorkoutDate: daysAgo(0),
    lombarLevel: { currentLevel: 4, weeksAtCurrentLevel: 3, levelStartDate: daysAgo(21) },
  },
  newUser: {
    displayName: 'Novo Usuário',
    painLevel: 4,
    objective: 'alivio',
    experienceLevel: 'iniciante',
    themePreference: 'light',
    onboardingCompleted: false,
    weeklyGoalMinutes: 60,
    currentStreak: 0,
    lastWorkoutDate: null,
    lombarLevel: { currentLevel: 0, weeksAtCurrentLevel: 0, levelStartDate: daysAgo(0) },
  },
  highPain: {
    displayName: 'Recuperação',
    painLevel: 8,
    objective: 'alivio',
    experienceLevel: 'iniciante',
    themePreference: 'light',
    onboardingCompleted: true,
    weeklyGoalMinutes: 45,
    currentStreak: 2,
    lastWorkoutDate: daysAgo(0),
    lombarLevel: { currentLevel: 0, weeksAtCurrentLevel: 1, levelStartDate: daysAgo(7) },
  },
};

function generateHybridLogs(scenario: SeedScenario): WorkoutLog[] {
  const count = scenario === 'beginner' ? 10 : scenario === 'advanced' ? 28 : 18;
  const logs: WorkoutLog[] = [];

  for (let i = 0; i < count; i++) {
    const daysBack = count - 1 - i;
    const mod = i % 3;

    if (mod === 0) {
      const duration = 35 + i * 3;
      logs.push({
        id: `seed-log-${i}`,
        exerciseId: 'sys-plank',
        exerciseExternalId: 'Plank',
        exerciseName: 'Prancha Abdominal',
        category: 'core',
        measurementType: 'time_based',
        performedAt: daysAgo(daysBack),
        durationSeconds: duration,
        totalReps: 0,
        totalLoadKg: 0,
        roundsCompleted: 1,
        primaryMuscles: ['abdominals', 'lower back'],
        metrics: { mode: 'progressao', targetSeconds: duration - 5 },
        feedback: scenario === 'highPain' ? 'desconforto' : 'otimo',
      });
    } else if (mod === 1) {
      const ex = i % 2 === 0 ? SEED_CATALOG[2] : SEED_CATALOG[5]; // Dead Bug or Ponte de Glúteo
      logs.push({
        id: `seed-log-${i}`,
        exerciseId: ex.id,
        exerciseExternalId: ex.externalId,
        exerciseName: ex.name,
        category: ex.category,
        measurementType: 'reps_based',
        performedAt: daysAgo(daysBack),
        durationSeconds: 210,
        totalReps: 36,
        totalLoadKg: 0,
        roundsCompleted: 3,
        primaryMuscles: ex.primaryMuscles,
        metrics: {
          sets: [
            { setNumber: 1, reps: 12, loadKg: 0, completed: true },
            { setNumber: 2, reps: 12, loadKg: 0, completed: true },
            { setNumber: 3, reps: 12, loadKg: 0, completed: true },
          ],
          totalSets: 3,
          avgReps: 12,
          maxLoadKg: 0,
        },
        feedback: 'ok',
      });
    } else {
      if (scenario === 'highPain') {
        logs.push({
          id: `seed-log-${i}`,
          exerciseId: 'sys-cat-cow',
          exerciseExternalId: 'Cat_Stretch',
          exerciseName: 'Gato-Camelo (Cat-Cow)',
          category: 'mobility',
          measurementType: 'time_based',
          performedAt: daysAgo(daysBack),
          durationSeconds: 90,
          totalReps: 0,
          totalLoadKg: 0,
          roundsCompleted: 1,
          primaryMuscles: ['lower back'],
          metrics: { mode: 'livre', targetSeconds: 60 },
          feedback: 'ok',
        });
      } else {
        logs.push({
          id: `seed-log-${i}`,
          exerciseId: 'sys-rope-hiit',
          exerciseExternalId: 'Rope_Jumping_HIIT',
          exerciseName: 'Pular Corda Intervalado (HIIT)',
          category: 'cardio',
          measurementType: 'interval_based',
          performedAt: daysAgo(daysBack),
          durationSeconds: 360,
          totalReps: 480,
          totalLoadKg: 0,
          roundsCompleted: 6,
          primaryMuscles: ['calves', 'quadriceps', 'abdominals'],
          metrics: { rounds: 6, workSeconds: 40, restSeconds: 20, totalCycles: 480 },
          feedback: 'otimo',
        });
      }
    }
  }

  return logs.reverse();
}

export function getSeedData(scenario: SeedScenario = 'intermediate'): AppData {
  if (scenario === 'empty') {
    return {
      profile: null,
      catalog: [...SEED_CATALOG],
      routines: [...DEFAULT_ROUTINES],
      logs: [],
    };
  }

  if (scenario === 'newUser') {
    return {
      profile: { ...SEED_PROFILES.newUser },
      catalog: [...SEED_CATALOG],
      routines: [...DEFAULT_ROUTINES],
      logs: [],
    };
  }

  return {
    profile: { ...(SEED_PROFILES[scenario] ?? SEED_PROFILES.intermediate) },
    catalog: [...SEED_CATALOG],
    routines: [...DEFAULT_ROUTINES],
    logs: generateHybridLogs(scenario),
  };
}

export const MOCK_USERS = [
  {
    id: 'mock-user-001',
    email: 'dev@coretracker.local',
    displayName: 'Dev User',
    avatarUrl: undefined,
    password: 'dev123',
  },
];

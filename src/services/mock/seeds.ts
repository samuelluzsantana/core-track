/**
 * Seed Data — Fake data for development environment
 * 
 * Provides realistic sample data so the app is fully functional
 * without any backend connection.
 */

import {
  UserProfile,
  PlankSession,
  ExerciseSession,
  LombarLevelData,
  AppData,
} from '../../types';

// ─── Helper ─────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

function randomFeedback(): 'otimo' | 'ok' | 'desconforto' {
  const options = ['otimo', 'ok', 'desconforto'] as const;
  return options[Math.floor(Math.random() * options.length)];
}

// ─── Seed Profiles ──────────────────────────────────────────────

export const SEED_PROFILES: Record<string, UserProfile> = {
  beginner: {
    painLevel: 3,
    objective: 'alivio',
    experienceLevel: 'iniciante',
    onboardingCompleted: true,
  },
  intermediate: {
    painLevel: 2,
    objective: 'fortalecimento',
    experienceLevel: 'moderado',
    onboardingCompleted: true,
  },
  advanced: {
    painLevel: 1,
    objective: 'performance',
    experienceLevel: 'avancado',
    onboardingCompleted: true,
  },
  newUser: {
    painLevel: 5,
    objective: 'alivio',
    experienceLevel: 'iniciante',
    onboardingCompleted: false,
  },
  highPain: {
    painLevel: 8,
    objective: 'alivio',
    experienceLevel: 'iniciante',
    onboardingCompleted: true,
  },
};

// ─── Seed Plank Sessions ────────────────────────────────────────

export function generatePlankSessions(count: number = 20): PlankSession[] {
  const sessions: PlankSession[] = [];
  for (let i = 0; i < count; i++) {
    sessions.push({
      id: `seed_plank_${i}`,
      date: daysAgo(count - i),
      mode: Math.random() > 0.3 ? 'progressao' : 'livre',
      durationSeconds: 20 + Math.floor(Math.random() * 80), // 20–100s
      feedback: randomFeedback(),
    });
  }
  return sessions;
}

// ─── Seed Exercise Sessions ─────────────────────────────────────

const EXERCISE_POOL = [
  { id: 'deadBug', name: 'Dead Bug', muscles: ['Rectus Abdominis', 'Transverse Abdominis'] },
  { id: 'crunch', name: 'Crunch Curto', muscles: ['Rectus Abdominis'] },
  { id: 'birdDog', name: 'Bird-Dog', muscles: ['Erector Spinae', 'Gluteus Maximus'] },
  { id: 'catCow', name: 'Gato-Camelo', muscles: ['Erector Spinae', 'Rectus Abdominis'] },
  { id: 'ponteGluteo', name: 'Ponte de Glúteo', muscles: ['Gluteus Maximus', 'Hamstrings'] },
  { id: 'supermanHold', name: 'Superman', muscles: ['Erector Spinae', 'Gluteus Maximus'] },
];

export function generateExerciseSessions(count: number = 30): ExerciseSession[] {
  const sessions: ExerciseSession[] = [];
  for (let i = 0; i < count; i++) {
    const exercise = EXERCISE_POOL[Math.floor(Math.random() * EXERCISE_POOL.length)];
    sessions.push({
      id: `seed_exercise_${i}`,
      date: daysAgo(count - i),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      targetMuscles: exercise.muscles,
      sets: 2 + Math.floor(Math.random() * 3),      // 2–4
      reps: 8 + Math.floor(Math.random() * 8),       // 8–15
      feedback: randomFeedback(),
    });
  }
  return sessions;
}

// ─── Seed Lombar Level ──────────────────────────────────────────

export const SEED_LOMBAR: LombarLevelData = {
  currentLevel: 2,
  weeksAtCurrentLevel: 3,
  levelStartDate: daysAgo(21),
};

// ─── Full Seed Bundle ───────────────────────────────────────────

export type SeedScenario = 'beginner' | 'intermediate' | 'advanced' | 'newUser' | 'highPain' | 'empty';

export function getSeedData(scenario: SeedScenario = 'intermediate'): AppData {
  if (scenario === 'empty') {
    return {
      profile: null,
      plankSessions: [],
      exerciseSessions: [],
      currentStreak: 0,
      lastWorkoutDate: null,
    };
  }

  if (scenario === 'newUser') {
    return {
      profile: SEED_PROFILES.newUser,
      plankSessions: [],
      exerciseSessions: [],
      currentStreak: 0,
      lastWorkoutDate: null,
    };
  }

  const plankCount = scenario === 'beginner' ? 8 : scenario === 'advanced' ? 35 : 20;
  const exerciseCount = scenario === 'beginner' ? 12 : scenario === 'advanced' ? 45 : 30;

  const plankSessions = generatePlankSessions(plankCount);
  const exerciseSessions = generateExerciseSessions(exerciseCount);

  return {
    profile: SEED_PROFILES[scenario] ?? SEED_PROFILES.intermediate,
    plankSessions,
    exerciseSessions,
    currentStreak: scenario === 'advanced' ? 14 : scenario === 'beginner' ? 3 : 7,
    lastWorkoutDate: daysAgo(0),
    lombarLevel: {
      currentLevel: scenario === 'advanced' ? 4 : scenario === 'beginner' ? 1 : 2,
      weeksAtCurrentLevel: scenario === 'advanced' ? 2 : 3,
      levelStartDate: daysAgo(scenario === 'advanced' ? 14 : 21),
    },
  };
}

// ─── Mock Users ─────────────────────────────────────────────────

export const MOCK_USERS = [
  {
    id: 'mock-user-001',
    email: 'dev@coretracker.local',
    displayName: 'Dev User',
    avatarUrl: undefined,
    password: 'dev123',
  },
  {
    id: 'mock-user-002',
    email: 'admin@coretracker.local',
    displayName: 'Admin User',
    avatarUrl: undefined,
    password: 'admin123',
  },
  {
    id: 'mock-user-003',
    email: 'tester@coretracker.local',
    displayName: 'Test User',
    avatarUrl: undefined,
    password: 'test123',
  },
];

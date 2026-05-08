import {
  AppData,
  UserProfile,
  PlankSession,
  ExerciseSession,
  Feedback } from
'../types';

const STORAGE_KEY = 'coretracker_data';

const defaultData: AppData = {
  profile: null,
  plankSessions: [],
  exerciseSessions: [],
  currentStreak: 0,
  lastWorkoutDate: null
};

export const getAppData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultData;
  } catch (e) {
    console.error('Failed to parse local storage data', e);
    return defaultData;
  }
};

export const saveAppData = (data: AppData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const saveProfile = (profile: UserProfile): void => {
  const data = getAppData();
  data.profile = profile;
  saveAppData(data);
};

const updateStreak = (data: AppData, dateStr: string) => {
  const today = new Date(dateStr);
  today.setHours(0, 0, 0, 0);

  if (!data.lastWorkoutDate) {
    data.currentStreak = 1;
    data.lastWorkoutDate = today.toISOString();
    return;
  }

  const lastWorkout = new Date(data.lastWorkoutDate);
  lastWorkout.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(today.getTime() - lastWorkout.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    data.currentStreak += 1;
    data.lastWorkoutDate = today.toISOString();
  } else if (diffDays > 1) {
    data.currentStreak = 1;
    data.lastWorkoutDate = today.toISOString();
  }
  // If diffDays === 0, streak remains the same, lastWorkoutDate remains the same
};

export const addPlankSession = (session: Omit<PlankSession, 'id'>): string => {
  const data = getAppData();
  const id = Math.random().toString(36).substring(2, 9);
  const newSession = { ...session, id };
  data.plankSessions.push(newSession);
  updateStreak(data, session.date);
  saveAppData(data);
  return id;
};

export const updatePlankFeedback = (id: string, feedback: Feedback): void => {
  const data = getAppData();
  const session = data.plankSessions.find((s) => s.id === id);
  if (session) {
    session.feedback = feedback;
    saveAppData(data);
  }
};

export const addExerciseSession = (
session: Omit<ExerciseSession, 'id'>)
: string => {
  const data = getAppData();
  const id = Math.random().toString(36).substring(2, 9);
  const newSession = { ...session, id };
  data.exerciseSessions.push(newSession);
  updateStreak(data, session.date);
  saveAppData(data);
  return id;
};

export const updateExerciseFeedback = (
id: string,
feedback: Feedback)
: void => {
  const data = getAppData();
  const session = data.exerciseSessions.find((s) => s.id === id);
  if (session) {
    session.feedback = feedback;
    saveAppData(data);
  }
};

export const getPersonalRecord = (): number => {
  const data = getAppData();
  if (data.plankSessions.length === 0) return 0;
  return Math.max(...data.plankSessions.map((s) => s.durationSeconds));
};

export const getTargetPlankTime = (): number => {
  const data = getAppData();
  const pr = getPersonalRecord();
  if (pr === 0) return 30; // Default starting time

  const level = data.profile?.experienceLevel || 'iniciante';
  const increment = level === 'iniciante' ? 5 : level === 'moderado' ? 10 : 15;

  return pr + increment;
};

export const getWeeklyVolume = () => {
  const data = getAppData();
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let plankSeconds = 0;
  let exerciseReps = 0;

  data.plankSessions.forEach((s) => {
    if (new Date(s.date) >= oneWeekAgo) {
      plankSeconds += s.durationSeconds;
    }
  });

  data.exerciseSessions.forEach((s) => {
    if (new Date(s.date) >= oneWeekAgo) {
      exerciseReps += s.sets * s.reps;
    }
  });

  return { plankSeconds, exerciseReps };
};

export const getMonthlyVolume = () => {
  const data = getAppData();
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let plankSeconds = 0;
  let exerciseReps = 0;

  data.plankSessions.forEach((s) => {
    if (new Date(s.date) >= oneMonthAgo) {
      plankSeconds += s.durationSeconds;
    }
  });

  data.exerciseSessions.forEach((s) => {
    if (new Date(s.date) >= oneMonthAgo) {
      exerciseReps += s.sets * s.reps;
    }
  });

  return { plankSeconds, exerciseReps };
};

export const getTotalSessions = (): number => {
  const data = getAppData();
  return data.plankSessions.length + data.exerciseSessions.length;
};

// ─── Lombar Level Management ────────────────────────────────

export const getLombarLevel = () => {
  const data = getAppData();
  return data.lombarLevel || {
    currentLevel: 0,
    weeksAtCurrentLevel: 0,
    levelStartDate: new Date().toISOString(),
  };
};

export const initLombarLevel = (): void => {
  const data = getAppData();
  if (!data.lombarLevel) {
    data.lombarLevel = {
      currentLevel: 0,
      weeksAtCurrentLevel: 0,
      levelStartDate: new Date().toISOString(),
    };
    saveAppData(data);
  }
};

export const advanceLombarLevel = (): void => {
  const data = getAppData();
  const current = data.lombarLevel || {
    currentLevel: 0,
    weeksAtCurrentLevel: 0,
    levelStartDate: new Date().toISOString(),
  };
  current.currentLevel = Math.min(current.currentLevel + 1, 5);
  current.weeksAtCurrentLevel = 0;
  current.levelStartDate = new Date().toISOString();
  data.lombarLevel = current;
  saveAppData(data);
};

export const regressLombarLevel = (): void => {
  const data = getAppData();
  const current = data.lombarLevel || {
    currentLevel: 0,
    weeksAtCurrentLevel: 0,
    levelStartDate: new Date().toISOString(),
  };
  current.currentLevel = Math.max(current.currentLevel - 1, 0);
  current.weeksAtCurrentLevel = 0;
  current.levelStartDate = new Date().toISOString();
  data.lombarLevel = current;
  saveAppData(data);
};

export const updateWeeksAtLevel = (): void => {
  const data = getAppData();
  if (!data.lombarLevel) return;
  const start = new Date(data.lombarLevel.levelStartDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  data.lombarLevel.weeksAtCurrentLevel = Math.floor(
    diffMs / (7 * 24 * 60 * 60 * 1000)
  );
  saveAppData(data);
};

// ─── IPC Decision Application ───────────────────────────────

export const applyIPCDecision = (
  decision: 'avancar_nivel' | 'manter_aumentar_volume' | 'manter_incremento_parcial' | 'regredir_nivel' | 'bloqueio_dor'
): void => {
  const data = getAppData();

  switch (decision) {
    case 'avancar_nivel':
      advanceLombarLevel();
      break;
    case 'regredir_nivel':
      regressLombarLevel();
      break;
    case 'bloqueio_dor':
      // Force lombar level to 0 (mobility only)
      if (data.lombarLevel) {
        data.lombarLevel.currentLevel = 0;
        data.lombarLevel.weeksAtCurrentLevel = 0;
        data.lombarLevel.levelStartDate = new Date().toISOString();
        saveAppData(data);
      }
      break;
    // 'manter_aumentar_volume' and 'manter_incremento_parcial' don't change level
    default:
      break;
  }
};

// ─── Settings / Reset Functions ─────────────────────────────

export const resetStreak = (): void => {
  const data = getAppData();
  data.currentStreak = 0;
  data.lastWorkoutDate = null;
  saveAppData(data);
};

export const resetAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('coretracker_exercisedb_cache');
};

export const updatePainLevel = (painLevel: number): void => {
  const data = getAppData();
  if (data.profile) {
    data.profile.painLevel = painLevel;
    saveAppData(data);
  }
};

export const updateObjective = (objective: 'alivio' | 'fortalecimento' | 'performance'): void => {
  const data = getAppData();
  if (data.profile) {
    data.profile.objective = objective;
    saveAppData(data);
  }
};

export const updateExperienceLevel = (level: 'iniciante' | 'moderado' | 'avancado'): void => {
  const data = getAppData();
  if (data.profile) {
    data.profile.experienceLevel = level;
    saveAppData(data);
  }
};

export const clearPlankHistory = (): void => {
  const data = getAppData();
  data.plankSessions = [];
  saveAppData(data);
};

export const clearExerciseHistory = (): void => {
  const data = getAppData();
  data.exerciseSessions = [];
  saveAppData(data);
};
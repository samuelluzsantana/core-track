import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useServices } from './ServiceContext';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import {
  CatalogExercise,
  Feedback,
  ThemePreference,
  UserProfile,
  WorkoutLog,
  WorkoutRoutine,
} from '../types';
import { calculateIPC, IPCResult } from '../utils/ipcAlgorithm';
import { DEFAULT_ROUTINES, SEED_CATALOG } from '../data/seedCatalog';

interface AppDataContextValue {
  profile: UserProfile | null;
  catalog: CatalogExercise[];
  routines: WorkoutRoutine[];
  logs: WorkoutLog[];
  ipc: IPCResult;
  loading: boolean;
  refreshAll: () => Promise<void>;
  saveProfile: (partial: Partial<UserProfile>) => Promise<UserProfile>;
  setThemeAndSync: (pref: ThemePreference) => Promise<void>;
  addWorkoutLog: (log: Omit<WorkoutLog, 'id'>) => Promise<WorkoutLog>;
  submitWorkoutFeedback: (
    logId: string,
    feedback: Feedback,
    painReported?: number
  ) => Promise<void>;
  saveExerciseToCatalog: (
    exercise: Omit<CatalogExercise, 'id'> & { id?: string }
  ) => Promise<CatalogExercise>;
  deleteCustomExercise: (id: string) => Promise<void>;
  saveRoutine: (
    routine: Omit<WorkoutRoutine, 'id'> & { id?: string }
  ) => Promise<WorkoutRoutine>;
  deleteRoutine: (id: string) => Promise<void>;
  resetStreak: () => Promise<void>;
  clearHistory: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { storage } = useServices();
  const { user } = useAuth();
  const { setThemePreference } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catalog, setCatalog] = useState<CatalogExercise[]>(SEED_CATALOG);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>(DEFAULT_ROUTINES);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setCatalog(SEED_CATALOG);
      setRoutines(DEFAULT_ROUTINES);
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [p, c, r, l] = await Promise.all([
        storage.getProfile(),
        storage.getCatalogExercises(),
        storage.getRoutines(),
        storage.getWorkoutLogs(),
      ]);
      setProfile(p);
      setCatalog(c.length > 0 ? c : SEED_CATALOG);
      setRoutines(r);
      setLogs(l);
      if (p?.themePreference) {
        setThemePreference(p.themePreference);
      }
    } catch (err) {
      console.error('[AppDataProvider] Failed loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, storage, setThemePreference]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const ipc = useMemo(() => calculateIPC(profile, logs), [profile, logs]);

  const saveProfile = async (partial: Partial<UserProfile>) => {
    const updated = await storage.saveProfile(partial);
    setProfile(updated);
    return updated;
  };

  const setThemeAndSync = async (pref: ThemePreference) => {
    setThemePreference(pref);
    if (profile) {
      setProfile({ ...profile, themePreference: pref });
    }
    if (user) {
      await storage.updateThemePreference(pref).catch(() => undefined);
    }
  };

  const addWorkoutLog = async (log: Omit<WorkoutLog, 'id'>) => {
    const saved = await storage.addWorkoutLog(log);
    setLogs((prev) => [saved, ...prev]);
    const streak = await storage.getStreak();
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            currentStreak: streak.currentStreak,
            lastWorkoutDate: streak.lastWorkoutDate,
          }
        : prev
    );
    return saved;
  };

  const submitWorkoutFeedback = async (
    logId: string,
    feedback: Feedback,
    painReported?: number
  ) => {
    await storage.updateWorkoutFeedback(logId, feedback, painReported);
    setLogs((prev) =>
      prev.map((item) =>
        item.id === logId
          ? { ...item, feedback, painReported: painReported ?? item.painReported }
          : item
      )
    );
    if (feedback === 'dorAguda') {
      setProfile((prev) =>
        prev ? { ...prev, painLevel: Math.max(prev.painLevel, 7) } : prev
      );
    }
  };

  const saveExerciseToCatalog = async (
    exercise: Omit<CatalogExercise, 'id'> & { id?: string }
  ) => {
    const saved = await storage.saveCatalogExercise(exercise);
    setCatalog((prev) => [saved, ...prev]);
    return saved;
  };

  const deleteCustomExercise = async (id: string) => {
    await storage.deleteCustomExercise(id);
    setCatalog((prev) => prev.filter((ex) => ex.id !== id));
  };

  const saveRoutine = async (
    routine: Omit<WorkoutRoutine, 'id'> & { id?: string }
  ) => {
    const saved = await storage.saveRoutine(routine);
    setRoutines((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      return exists
        ? prev.map((r) => (r.id === saved.id ? saved : r))
        : [saved, ...prev];
    });
    return saved;
  };

  const deleteRoutine = async (id: string) => {
    await storage.deleteRoutine(id);
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  const resetStreak = async () => {
    await storage.resetStreak();
    setProfile((prev) =>
      prev ? { ...prev, currentStreak: 0, lastWorkoutDate: null } : prev
    );
  };

  const clearHistory = async () => {
    await storage.clearWorkoutHistory();
    setLogs([]);
  };

  const resetAllData = async () => {
    await storage.resetAllData();
    await refreshAll();
  };

  return (
    <AppDataContext.Provider
      value={{
        profile,
        catalog,
        routines,
        logs,
        ipc,
        loading,
        refreshAll,
        saveProfile,
        setThemeAndSync,
        addWorkoutLog,
        submitWorkoutFeedback,
        saveExerciseToCatalog,
        deleteCustomExercise,
        saveRoutine,
        deleteRoutine,
        resetStreak,
        clearHistory,
        resetAllData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }
  return ctx;
}

import { IStorageService } from '../../config/types';
import {
  AppData,
  CatalogExercise,
  ExperienceLevel,
  Feedback,
  LombarLevelData,
  Objective,
  ThemePreference,
  UserProfile,
  WorkoutLog,
  WorkoutRoutine,
} from '../../types';
import { DEFAULT_ROUTINES, SEED_CATALOG } from '../../data/seedCatalog';
import { getSeedData, SeedScenario } from './seeds';
import { mockDelay, maybeThrow, mockId, mockLog } from './mockUtils';

const MOCK_STORAGE_KEY = 'coretracker_hybrid_mock_v2';
const SEED_SCENARIO_KEY = 'coretracker_seed_scenario';

export class MockStorageService implements IStorageService {
  private data: AppData;

  constructor() {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (stored) {
      try {
        this.data = JSON.parse(stored);
      } catch {
        this.data = this.loadSeedData();
      }
    } else {
      this.data = this.loadSeedData();
    }
  }

  private loadSeedData(): AppData {
    const scenario = (localStorage.getItem(SEED_SCENARIO_KEY) ||
      'intermediate') as SeedScenario;
    const data = getSeedData(scenario);
    this.persist(data);
    return data;
  }

  private persist(data?: AppData): void {
    const toSave = data ?? this.data;
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('[MockStorage] persist failed:', e);
    }
  }

  switchScenario(scenario: SeedScenario): void {
    localStorage.setItem(SEED_SCENARIO_KEY, scenario);
    localStorage.removeItem(MOCK_STORAGE_KEY);
    this.data = this.loadSeedData();
  }

  async getProfile(): Promise<UserProfile | null> {
    await mockDelay(120);
    return this.data.profile;
  }

  async saveProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    await mockDelay(120);
    maybeThrow('saveProfile');
    const base: UserProfile = this.data.profile ?? {
      painLevel: 1,
      objective: 'fortalecimento',
      experienceLevel: 'iniciante',
      themePreference: 'light',
      onboardingCompleted: false,
      weeklyGoalMinutes: 90,
      currentStreak: 0,
      lastWorkoutDate: null,
      lombarLevel: {
        currentLevel: 0,
        weeksAtCurrentLevel: 0,
        levelStartDate: new Date().toISOString(),
      },
    };
    this.data.profile = { ...base, ...profile };
    this.persist();
    return this.data.profile;
  }

  async updatePainLevel(painLevel: number): Promise<void> {
    await this.saveProfile({ painLevel });
  }

  async updateObjective(objective: Objective): Promise<void> {
    await this.saveProfile({ objective });
  }

  async updateExperienceLevel(level: ExperienceLevel): Promise<void> {
    await this.saveProfile({ experienceLevel: level });
  }

  async updateThemePreference(theme: ThemePreference): Promise<void> {
    if (this.data.profile) {
      this.data.profile.themePreference = theme;
      this.persist();
    }
  }

  async getCatalogExercises(): Promise<CatalogExercise[]> {
    await mockDelay(100);
    return this.data.catalog.length > 0 ? [...this.data.catalog] : [...SEED_CATALOG];
  }

  async saveCatalogExercise(
    exercise: Omit<CatalogExercise, 'id'> & { id?: string }
  ): Promise<CatalogExercise> {
    await mockDelay(120);
    const created: CatalogExercise = {
      ...exercise,
      id: exercise.id || mockId(),
    };
    this.data.catalog = [created, ...this.data.catalog];
    this.persist();
    return created;
  }

  async deleteCustomExercise(id: string): Promise<void> {
    await mockDelay(100);
    this.data.catalog = this.data.catalog.filter((c) => c.id !== id);
    this.persist();
  }

  async getRoutines(): Promise<WorkoutRoutine[]> {
    await mockDelay(100);
    return this.data.routines.length > 0
      ? [...this.data.routines]
      : [...DEFAULT_ROUTINES];
  }

  async saveRoutine(
    routine: Omit<WorkoutRoutine, 'id'> & { id?: string }
  ): Promise<WorkoutRoutine> {
    await mockDelay(120);
    if (routine.id) {
      const idx = this.data.routines.findIndex((r) => r.id === routine.id);
      if (idx >= 0) {
        const updated = { ...this.data.routines[idx], ...routine, id: routine.id };
        this.data.routines[idx] = updated;
        this.persist();
        return updated;
      }
    }
    const created: WorkoutRoutine = {
      ...routine,
      id: routine.id || mockId(),
      createdAt: new Date().toISOString(),
    };
    this.data.routines = [created, ...this.data.routines];
    this.persist();
    return created;
  }

  async deleteRoutine(id: string): Promise<void> {
    await mockDelay(100);
    this.data.routines = this.data.routines.filter((r) => r.id !== id);
    this.persist();
  }

  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    await mockDelay(100);
    return [...this.data.logs].sort(
      (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
    );
  }

  async addWorkoutLog(log: Omit<WorkoutLog, 'id'>): Promise<WorkoutLog> {
    await mockDelay(150);
    const created: WorkoutLog = { ...log, id: mockId() };
    this.data.logs = [created, ...this.data.logs];
    this.updateStreakLocal(created.performedAt);
    this.persist();
    mockLog('MockStorage', 'addWorkoutLog', created.id);
    return created;
  }

  async updateWorkoutFeedback(
    id: string,
    feedback: Feedback,
    painReported?: number
  ): Promise<void> {
    await mockDelay(100);
    const found = this.data.logs.find((l) => l.id === id);
    if (found) {
      found.feedback = feedback;
      if (painReported !== undefined) found.painReported = painReported;
    }
    if (feedback === 'dorAguda' && this.data.profile) {
      this.data.profile.painLevel = Math.max(this.data.profile.painLevel, 7);
    }
    this.persist();
  }

  async clearWorkoutHistory(): Promise<void> {
    await mockDelay(120);
    this.data.logs = [];
    this.persist();
  }

  private updateStreakLocal(dateStr: string): void {
    if (!this.data.profile) return;
    const today = new Date(dateStr);
    today.setHours(0, 0, 0, 0);
    const lastStr = this.data.profile.lastWorkoutDate;
    if (!lastStr) {
      this.data.profile.currentStreak = 1;
    } else {
      const last = new Date(lastStr);
      last.setHours(0, 0, 0, 0);
      const diff = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) this.data.profile.currentStreak += 1;
      else if (diff > 1) this.data.profile.currentStreak = 1;
      else if (diff === 0 && this.data.profile.currentStreak === 0)
        this.data.profile.currentStreak = 1;
    }
    this.data.profile.lastWorkoutDate = today.toISOString();
  }

  async getStreak(): Promise<{ currentStreak: number; lastWorkoutDate: string | null }> {
    return {
      currentStreak: this.data.profile?.currentStreak ?? 0,
      lastWorkoutDate: this.data.profile?.lastWorkoutDate ?? null,
    };
  }

  async resetStreak(): Promise<void> {
    if (this.data.profile) {
      this.data.profile.currentStreak = 0;
      this.data.profile.lastWorkoutDate = null;
      this.persist();
    }
  }

  async getLombarLevel(): Promise<LombarLevelData> {
    return (
      this.data.profile?.lombarLevel ?? {
        currentLevel: 0,
        weeksAtCurrentLevel: 0,
        levelStartDate: new Date().toISOString(),
      }
    );
  }

  async advanceLombarLevel(): Promise<void> {
    if (!this.data.profile) return;
    this.data.profile.lombarLevel.currentLevel = Math.min(
      this.data.profile.lombarLevel.currentLevel + 1,
      5
    );
    this.data.profile.lombarLevel.weeksAtCurrentLevel = 0;
    this.data.profile.lombarLevel.levelStartDate = new Date().toISOString();
    this.persist();
  }

  async regressLombarLevel(): Promise<void> {
    if (!this.data.profile) return;
    this.data.profile.lombarLevel.currentLevel = Math.max(
      this.data.profile.lombarLevel.currentLevel - 1,
      0
    );
    this.data.profile.lombarLevel.weeksAtCurrentLevel = 0;
    this.data.profile.lombarLevel.levelStartDate = new Date().toISOString();
    this.persist();
  }

  async resetAllData(): Promise<void> {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    this.data = getSeedData('empty');
    this.persist();
  }
}

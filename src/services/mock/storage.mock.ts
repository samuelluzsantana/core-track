/**
 * Mock Storage Service
 * 
 * Implements IStorageService using localStorage as the backing store.
 * Seeds itself with fake data on first load.
 */

import { IStorageService } from '../../config/types';
import {
  UserProfile,
  PlankSession,
  ExerciseSession,
  Feedback,
  LombarLevelData,
  AppData,
} from '../../types';
import { getSeedData, SeedScenario } from './seeds';
import { mockDelay, maybeThrow, mockId, mockLog } from './mockUtils';

const MOCK_STORAGE_KEY = 'coretracker_mock_data';
const SEED_SCENARIO_KEY = 'coretracker_seed_scenario';

export class MockStorageService implements IStorageService {
  private data: AppData;

  constructor() {
    // Try to restore from localStorage
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (stored) {
      try {
        this.data = JSON.parse(stored);
        mockLog('Storage', 'Restored data from localStorage');
      } catch {
        this.data = this.loadSeedData();
      }
    } else {
      this.data = this.loadSeedData();
    }
  }

  private loadSeedData(): AppData {
    const scenario = (localStorage.getItem(SEED_SCENARIO_KEY) || 'intermediate') as SeedScenario;
    const data = getSeedData(scenario);
    this.persist(data);
    mockLog('Storage', `Loaded seed data (scenario: ${scenario})`);
    return data;
  }

  private persist(data?: AppData): void {
    const toSave = data ?? this.data;
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('[MockStorage] Failed to persist:', e);
    }
  }

  /** Switch seed scenario and reload data */
  switchScenario(scenario: SeedScenario): void {
    localStorage.setItem(SEED_SCENARIO_KEY, scenario);
    localStorage.removeItem(MOCK_STORAGE_KEY);
    this.data = this.loadSeedData();
    mockLog('Storage', `Switched to scenario: ${scenario}`);
  }

  // ─── Profile ────────────────────────────────────────────────

  async getProfile(): Promise<UserProfile | null> {
    await mockDelay();
    maybeThrow('getProfile');
    mockLog('Storage', 'getProfile');
    return this.data.profile;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    await mockDelay();
    maybeThrow('saveProfile');
    mockLog('Storage', 'saveProfile', profile);
    this.data.profile = profile;
    this.persist();
  }

  // ─── Plank Sessions ─────────────────────────────────────────

  async getPlankSessions(): Promise<PlankSession[]> {
    await mockDelay();
    maybeThrow('getPlankSessions');
    mockLog('Storage', 'getPlankSessions', `count: ${this.data.plankSessions.length}`);
    return [...this.data.plankSessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async addPlankSession(session: Omit<PlankSession, 'id'>): Promise<string> {
    await mockDelay();
    maybeThrow('addPlankSession');
    const id = mockId();
    const newSession = { ...session, id };
    this.data.plankSessions.push(newSession);
    this.updateStreak(session.date);
    this.persist();
    mockLog('Storage', 'addPlankSession', id);
    return id;
  }

  async updatePlankFeedback(id: string, feedback: Feedback): Promise<void> {
    await mockDelay();
    maybeThrow('updatePlankFeedback');
    const session = this.data.plankSessions.find((s) => s.id === id);
    if (session) {
      session.feedback = feedback;
      this.persist();
    }
    mockLog('Storage', 'updatePlankFeedback', id, feedback);
  }

  // ─── Exercise Sessions ──────────────────────────────────────

  async getExerciseSessions(): Promise<ExerciseSession[]> {
    await mockDelay();
    maybeThrow('getExerciseSessions');
    mockLog('Storage', 'getExerciseSessions', `count: ${this.data.exerciseSessions.length}`);
    return [...this.data.exerciseSessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async addExerciseSession(session: Omit<ExerciseSession, 'id'>): Promise<string> {
    await mockDelay();
    maybeThrow('addExerciseSession');
    const id = mockId();
    const newSession = { ...session, id };
    this.data.exerciseSessions.push(newSession);
    this.updateStreak(session.date);
    this.persist();
    mockLog('Storage', 'addExerciseSession', id);
    return id;
  }

  async updateExerciseFeedback(id: string, feedback: Feedback): Promise<void> {
    await mockDelay();
    maybeThrow('updateExerciseFeedback');
    const session = this.data.exerciseSessions.find((s) => s.id === id);
    if (session) {
      session.feedback = feedback;
      this.persist();
    }
    mockLog('Storage', 'updateExerciseFeedback', id, feedback);
  }

  // ─── Streak ─────────────────────────────────────────────────

  private updateStreak(dateStr: string): void {
    const today = new Date(dateStr);
    today.setHours(0, 0, 0, 0);

    if (!this.data.lastWorkoutDate) {
      this.data.currentStreak = 1;
      this.data.lastWorkoutDate = today.toISOString();
      return;
    }

    const lastWorkout = new Date(this.data.lastWorkoutDate);
    lastWorkout.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      this.data.currentStreak += 1;
    } else if (diffDays > 1) {
      this.data.currentStreak = 1;
    }
    this.data.lastWorkoutDate = today.toISOString();
  }

  async getStreak(): Promise<{ currentStreak: number; lastWorkoutDate: string | null }> {
    await mockDelay(100);
    return {
      currentStreak: this.data.currentStreak,
      lastWorkoutDate: this.data.lastWorkoutDate,
    };
  }

  async resetStreak(): Promise<void> {
    await mockDelay();
    maybeThrow('resetStreak');
    this.data.currentStreak = 0;
    this.data.lastWorkoutDate = null;
    this.persist();
    mockLog('Storage', 'resetStreak');
  }

  // ─── Lombar Level ───────────────────────────────────────────

  async getLombarLevel(): Promise<LombarLevelData> {
    await mockDelay(100);
    return this.data.lombarLevel ?? {
      currentLevel: 0,
      weeksAtCurrentLevel: 0,
      levelStartDate: new Date().toISOString(),
    };
  }

  async advanceLombarLevel(): Promise<void> {
    await mockDelay();
    maybeThrow('advanceLombarLevel');
    const current = this.data.lombarLevel ?? {
      currentLevel: 0,
      weeksAtCurrentLevel: 0,
      levelStartDate: new Date().toISOString(),
    };
    current.currentLevel = Math.min(current.currentLevel + 1, 5);
    current.weeksAtCurrentLevel = 0;
    current.levelStartDate = new Date().toISOString();
    this.data.lombarLevel = current;
    this.persist();
    mockLog('Storage', 'advanceLombarLevel', `→ level ${current.currentLevel}`);
  }

  async regressLombarLevel(): Promise<void> {
    await mockDelay();
    maybeThrow('regressLombarLevel');
    const current = this.data.lombarLevel ?? {
      currentLevel: 0,
      weeksAtCurrentLevel: 0,
      levelStartDate: new Date().toISOString(),
    };
    current.currentLevel = Math.max(current.currentLevel - 1, 0);
    current.weeksAtCurrentLevel = 0;
    current.levelStartDate = new Date().toISOString();
    this.data.lombarLevel = current;
    this.persist();
    mockLog('Storage', 'regressLombarLevel', `→ level ${current.currentLevel}`);
  }

  // ─── Aggregations ───────────────────────────────────────────

  async getPersonalRecord(): Promise<number> {
    await mockDelay(100);
    if (this.data.plankSessions.length === 0) return 0;
    return Math.max(...this.data.plankSessions.map((s) => s.durationSeconds));
  }

  async getWeeklyVolume(): Promise<{ plankSeconds: number; exerciseReps: number }> {
    await mockDelay(100);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let plankSeconds = 0;
    let exerciseReps = 0;

    this.data.plankSessions.forEach((s) => {
      if (new Date(s.date) >= oneWeekAgo) plankSeconds += s.durationSeconds;
    });
    this.data.exerciseSessions.forEach((s) => {
      if (new Date(s.date) >= oneWeekAgo) exerciseReps += s.sets * s.reps;
    });

    return { plankSeconds, exerciseReps };
  }

  async getMonthlyVolume(): Promise<{ plankSeconds: number; exerciseReps: number }> {
    await mockDelay(100);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let plankSeconds = 0;
    let exerciseReps = 0;

    this.data.plankSessions.forEach((s) => {
      if (new Date(s.date) >= oneMonthAgo) plankSeconds += s.durationSeconds;
    });
    this.data.exerciseSessions.forEach((s) => {
      if (new Date(s.date) >= oneMonthAgo) exerciseReps += s.sets * s.reps;
    });

    return { plankSeconds, exerciseReps };
  }

  async getTotalSessions(): Promise<number> {
    await mockDelay(100);
    return this.data.plankSessions.length + this.data.exerciseSessions.length;
  }

  // ─── Settings / Reset ───────────────────────────────────────

  async updatePainLevel(painLevel: number): Promise<void> {
    await mockDelay();
    if (this.data.profile) {
      this.data.profile.painLevel = painLevel;
      this.persist();
    }
    mockLog('Storage', 'updatePainLevel', painLevel);
  }

  async updateObjective(objective: 'alivio' | 'fortalecimento' | 'performance'): Promise<void> {
    await mockDelay();
    if (this.data.profile) {
      this.data.profile.objective = objective;
      this.persist();
    }
    mockLog('Storage', 'updateObjective', objective);
  }

  async updateExperienceLevel(level: 'iniciante' | 'moderado' | 'avancado'): Promise<void> {
    await mockDelay();
    if (this.data.profile) {
      this.data.profile.experienceLevel = level;
      this.persist();
    }
    mockLog('Storage', 'updateExperienceLevel', level);
  }

  async clearPlankHistory(): Promise<void> {
    await mockDelay();
    this.data.plankSessions = [];
    this.persist();
    mockLog('Storage', 'clearPlankHistory');
  }

  async clearExerciseHistory(): Promise<void> {
    await mockDelay();
    this.data.exerciseSessions = [];
    this.persist();
    mockLog('Storage', 'clearExerciseHistory');
  }

  async resetAllData(): Promise<void> {
    await mockDelay();
    localStorage.removeItem(MOCK_STORAGE_KEY);
    this.data = getSeedData('empty');
    this.persist();
    mockLog('Storage', 'resetAllData');
  }
}

/**
 * Real Storage Service — Supabase implementation
 * 
 * Wraps the existing supabaseStorage functions into the IStorageService interface.
 */

import { IStorageService } from '../../config/types';
import {
  UserProfile,
  PlankSession,
  ExerciseSession,
  Feedback,
  LombarLevelData,
} from '../../types';
import { supabase } from '../../utils/supabase';

export class RealStorageService implements IStorageService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    return user.id;
  }

  // ─── Profile ────────────────────────────────────────────────

  async getProfile(): Promise<UserProfile | null> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      painLevel: data.pain_level,
      objective: data.objective,
      experienceLevel: data.experience_level,
      onboardingCompleted: data.onboarding_completed,
    };
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('profiles')
      .update({
        pain_level: profile.painLevel,
        objective: profile.objective,
        experience_level: profile.experienceLevel,
        onboarding_completed: profile.onboardingCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  // ─── Plank Sessions ─────────────────────────────────────────

  async getPlankSessions(): Promise<PlankSession[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('plank_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) return [];

    return (data || []).map((row) => ({
      id: row.id,
      date: row.date,
      mode: row.mode,
      durationSeconds: row.duration_seconds,
      exerciseId: row.exercise_id,
      feedback: row.feedback,
    }));
  }

  async addPlankSession(session: Omit<PlankSession, 'id'>): Promise<string> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('plank_sessions')
      .insert({
        user_id: userId,
        date: session.date,
        mode: session.mode,
        duration_seconds: session.durationSeconds,
        exercise_id: session.exerciseId,
        feedback: session.feedback,
      })
      .select('id')
      .single();

    if (error) throw error;
    await this.updateStreakInternal();
    return data.id;
  }

  async updatePlankFeedback(id: string, feedback: Feedback): Promise<void> {
    const { error } = await supabase
      .from('plank_sessions')
      .update({ feedback })
      .eq('id', id);
    if (error) throw error;
  }

  // ─── Exercise Sessions ──────────────────────────────────────

  async getExerciseSessions(): Promise<ExerciseSession[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('exercise_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) return [];

    return (data || []).map((row) => ({
      id: row.id,
      date: row.date,
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      targetMuscles: row.target_muscles,
      sets: row.sets,
      reps: row.reps,
      feedback: row.feedback,
    }));
  }

  async addExerciseSession(session: Omit<ExerciseSession, 'id'>): Promise<string> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('exercise_sessions')
      .insert({
        user_id: userId,
        date: session.date,
        exercise_id: session.exerciseId,
        exercise_name: session.exerciseName,
        target_muscles: session.targetMuscles,
        sets: session.sets,
        reps: session.reps,
        feedback: session.feedback,
      })
      .select('id')
      .single();

    if (error) throw error;
    await this.updateStreakInternal();
    return data.id;
  }

  async updateExerciseFeedback(id: string, feedback: Feedback): Promise<void> {
    const { error } = await supabase
      .from('exercise_sessions')
      .update({ feedback })
      .eq('id', id);
    if (error) throw error;
  }

  // ─── Streak ─────────────────────────────────────────────────

  private async updateStreakInternal(): Promise<void> {
    const userId = await this.getUserId();
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, last_workout_date')
      .eq('id', userId)
      .single();

    if (!profile) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let newStreak = profile.current_streak;

    if (!profile.last_workout_date) {
      newStreak = 1;
    } else {
      const lastWorkout = new Date(profile.last_workout_date);
      lastWorkout.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    }

    await supabase
      .from('profiles')
      .update({ current_streak: newStreak, last_workout_date: today.toISOString() })
      .eq('id', userId);
  }

  async getStreak(): Promise<{ currentStreak: number; lastWorkoutDate: string | null }> {
    const userId = await this.getUserId();
    const { data } = await supabase
      .from('profiles')
      .select('current_streak, last_workout_date')
      .eq('id', userId)
      .single();

    return {
      currentStreak: data?.current_streak ?? 0,
      lastWorkoutDate: data?.last_workout_date ?? null,
    };
  }

  async resetStreak(): Promise<void> {
    const userId = await this.getUserId();
    await supabase
      .from('profiles')
      .update({ current_streak: 0, last_workout_date: null })
      .eq('id', userId);
  }

  // ─── Lombar Level ───────────────────────────────────────────

  async getLombarLevel(): Promise<LombarLevelData> {
    const userId = await this.getUserId();
    const { data } = await supabase
      .from('profiles')
      .select('lombar_level, lombar_weeks_at_level, lombar_level_start_date')
      .eq('id', userId)
      .single();

    if (!data) return { currentLevel: 0, weeksAtCurrentLevel: 0, levelStartDate: new Date().toISOString() };

    return {
      currentLevel: data.lombar_level,
      weeksAtCurrentLevel: data.lombar_weeks_at_level,
      levelStartDate: data.lombar_level_start_date,
    };
  }

  async advanceLombarLevel(): Promise<void> {
    const userId = await this.getUserId();
    const current = await this.getLombarLevel();
    await supabase
      .from('profiles')
      .update({
        lombar_level: Math.min(current.currentLevel + 1, 5),
        lombar_weeks_at_level: 0,
        lombar_level_start_date: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  async regressLombarLevel(): Promise<void> {
    const userId = await this.getUserId();
    const current = await this.getLombarLevel();
    await supabase
      .from('profiles')
      .update({
        lombar_level: Math.max(current.currentLevel - 1, 0),
        lombar_weeks_at_level: 0,
        lombar_level_start_date: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  // ─── Aggregations ───────────────────────────────────────────

  async getPersonalRecord(): Promise<number> {
    const userId = await this.getUserId();
    const { data } = await supabase
      .from('plank_sessions')
      .select('duration_seconds')
      .eq('user_id', userId)
      .order('duration_seconds', { ascending: false })
      .limit(1)
      .single();
    return data?.duration_seconds || 0;
  }

  async getWeeklyVolume(): Promise<{ plankSeconds: number; exerciseReps: number }> {
    const userId = await this.getUserId();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [plankResult, exerciseResult] = await Promise.all([
      supabase.from('plank_sessions').select('duration_seconds').eq('user_id', userId).gte('date', oneWeekAgo),
      supabase.from('exercise_sessions').select('sets, reps').eq('user_id', userId).gte('date', oneWeekAgo),
    ]);

    const plankSeconds = (plankResult.data || []).reduce((s, r) => s + r.duration_seconds, 0);
    const exerciseReps = (exerciseResult.data || []).reduce((s, r) => s + r.sets * r.reps, 0);
    return { plankSeconds, exerciseReps };
  }

  async getMonthlyVolume(): Promise<{ plankSeconds: number; exerciseReps: number }> {
    const userId = await this.getUserId();
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [plankResult, exerciseResult] = await Promise.all([
      supabase.from('plank_sessions').select('duration_seconds').eq('user_id', userId).gte('date', oneMonthAgo),
      supabase.from('exercise_sessions').select('sets, reps').eq('user_id', userId).gte('date', oneMonthAgo),
    ]);

    const plankSeconds = (plankResult.data || []).reduce((s, r) => s + r.duration_seconds, 0);
    const exerciseReps = (exerciseResult.data || []).reduce((s, r) => s + r.sets * r.reps, 0);
    return { plankSeconds, exerciseReps };
  }

  async getTotalSessions(): Promise<number> {
    const userId = await this.getUserId();
    const [plankResult, exerciseResult] = await Promise.all([
      supabase.from('plank_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('exercise_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    return (plankResult.count || 0) + (exerciseResult.count || 0);
  }

  // ─── Settings / Reset ───────────────────────────────────────

  async updatePainLevel(painLevel: number): Promise<void> {
    const userId = await this.getUserId();
    await supabase.from('profiles').update({ pain_level: painLevel }).eq('id', userId);
  }

  async updateObjective(objective: 'alivio' | 'fortalecimento' | 'performance'): Promise<void> {
    const userId = await this.getUserId();
    await supabase.from('profiles').update({ objective }).eq('id', userId);
  }

  async updateExperienceLevel(level: 'iniciante' | 'moderado' | 'avancado'): Promise<void> {
    const userId = await this.getUserId();
    await supabase.from('profiles').update({ experience_level: level }).eq('id', userId);
  }

  async clearPlankHistory(): Promise<void> {
    const userId = await this.getUserId();
    await supabase.from('plank_sessions').delete().eq('user_id', userId);
  }

  async clearExerciseHistory(): Promise<void> {
    const userId = await this.getUserId();
    await supabase.from('exercise_sessions').delete().eq('user_id', userId);
  }

  async resetAllData(): Promise<void> {
    const userId = await this.getUserId();
    await Promise.all([
      supabase.from('plank_sessions').delete().eq('user_id', userId),
      supabase.from('exercise_sessions').delete().eq('user_id', userId),
      supabase.from('profiles').update({
        pain_level: 1,
        objective: 'alivio',
        experience_level: 'iniciante',
        onboarding_completed: false,
        current_streak: 0,
        last_workout_date: null,
        lombar_level: 0,
        lombar_weeks_at_level: 0,
        lombar_level_start_date: new Date().toISOString(),
      }).eq('id', userId),
    ]);
  }
}

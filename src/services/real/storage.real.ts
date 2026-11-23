import { IStorageService } from '../../config/types';
import {
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
import { supabase } from '../../utils/supabase';
import { DEFAULT_ROUTINES, SEED_CATALOG } from '../../data/seedCatalog';

const DEFAULT_PROFILE: UserProfile = {
  painLevel: 2,
  objective: 'fortalecimento',
  experienceLevel: 'iniciante',
  themePreference: 'light',
  onboardingCompleted: false,
  weeklyGoalMinutes: 90,
  currentStreak: 0,
  lastWorkoutDate: null,
  lombarLevel: {
    currentLevel: 1,
    weeksAtCurrentLevel: 0,
    levelStartDate: new Date().toISOString(),
  },
};

function mapCatalogRow(row: any): CatalogExercise {
  return {
    id: row.id,
    externalId: row.external_id,
    source: row.source,
    name: row.name,
    category: row.category,
    measurementType: row.measurement_type,
    force: row.force,
    level: row.level || 'beginner',
    mechanic: row.mechanic,
    equipment: row.equipment,
    primaryMuscles: row.primary_muscles || [],
    secondaryMuscles: row.secondary_muscles || [],
    instructions: row.instructions || [],
    tips: row.tips || [],
    imageUrls: row.image_urls || [],
    videoUrl: row.video_url,
    impactLevel: row.impact_level || 'low',
    themeColor: row.theme_color || 'amber',
    iconName: row.icon_name || 'dumbbell',
    defaultConfig: row.default_config || {},
    isCustom: Boolean(row.is_custom),
    userId: row.user_id,
  };
}

function mapRoutineRow(row: any): WorkoutRoutine {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category || 'hybrid',
    accentColor: row.accent_color || 'indigo',
    items: Array.isArray(row.items) ? row.items : [],
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkoutLogRow(row: any): WorkoutLog {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exerciseExternalId: row.exercise_external_id,
    routineId: row.routine_id,
    exerciseName: row.exercise_name,
    category: row.category || 'core',
    measurementType: row.measurement_type,
    performedAt: row.performed_at,
    durationSeconds: row.duration_seconds || 0,
    totalReps: row.total_reps || 0,
    totalLoadKg: Number(row.total_load_kg || 0),
    roundsCompleted: row.rounds_completed || 0,
    primaryMuscles: row.primary_muscles || [],
    metrics: row.metrics || {},
    feedback: row.feedback,
    painReported: row.pain_reported,
    notes: row.notes,
  };
}

export class RealStorageService implements IStorageService {
  private async getUserId(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    return user.id;
  }

  // ─── Profile ────────────────────────────────────────────────

  async getProfile(): Promise<UserProfile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[RealStorage] getProfile error:', error.message);
      return null;
    }

    if (!data) {
      // Ensure profile row exists if user signed up before trigger ran
      const { data: created } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name:
            user.user_metadata?.full_name ||
            user.email?.split('@')[0] ||
            'Atleta',
        })
        .select('*')
        .single();

      if (!created) return DEFAULT_PROFILE;
      return this.mapProfileRow(created);
    }

    return this.mapProfileRow(data);
  }

  private mapProfileRow(data: any): UserProfile {
    return {
      displayName: data.display_name,
      painLevel: data.pain_level ?? 1,
      objective: data.objective ?? 'fortalecimento',
      experienceLevel: data.experience_level ?? 'iniciante',
      themePreference: data.theme_preference ?? 'light',
      onboardingCompleted: Boolean(data.onboarding_completed),
      weeklyGoalMinutes: data.weekly_goal_minutes ?? 90,
      currentStreak: data.current_streak ?? 0,
      lastWorkoutDate: data.last_workout_date ?? null,
      lombarLevel: {
        currentLevel: data.lombar_level ?? 0,
        weeksAtCurrentLevel: data.lombar_weeks_at_level ?? 0,
        levelStartDate: data.lombar_level_start_date ?? new Date().toISOString(),
      },
    };
  }

  async saveProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const userId = await this.getUserId();
    const payload: Record<string, unknown> = {
      id: userId,
      updated_at: new Date().toISOString(),
    };
    if (profile.displayName !== undefined) payload.display_name = profile.displayName;
    if (profile.painLevel !== undefined) payload.pain_level = profile.painLevel;
    if (profile.objective !== undefined) payload.objective = profile.objective;
    if (profile.experienceLevel !== undefined) payload.experience_level = profile.experienceLevel;
    if (profile.themePreference !== undefined) payload.theme_preference = profile.themePreference;
    if (profile.onboardingCompleted !== undefined) payload.onboarding_completed = profile.onboardingCompleted;
    if (profile.weeklyGoalMinutes !== undefined) payload.weekly_goal_minutes = profile.weeklyGoalMinutes;

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return this.mapProfileRow(data);
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ theme_preference: theme })
      .eq('id', user.id);
  }

  // ─── Exercise Catalog ───────────────────────────────────────

  async getCatalogExercises(): Promise<CatalogExercise[]> {
    const { data, error } = await supabase
      .from('exercise_catalog')
      .select('*')
      .order('is_custom', { ascending: false })
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return SEED_CATALOG;
    }

    return data.map(mapCatalogRow);
  }

  async saveCatalogExercise(
    exercise: Omit<CatalogExercise, 'id'> & { id?: string }
  ): Promise<CatalogExercise> {
    const userId = await this.getUserId();

    const rowPayload = {
      external_id: exercise.externalId || null,
      source: exercise.source,
      name: exercise.name,
      category: exercise.category,
      measurement_type: exercise.measurementType,
      force: exercise.force || null,
      level: exercise.level || 'beginner',
      mechanic: exercise.mechanic || null,
      equipment: exercise.equipment || 'body only',
      primary_muscles: exercise.primaryMuscles || [],
      secondary_muscles: exercise.secondaryMuscles || [],
      instructions: exercise.instructions || [],
      tips: exercise.tips || [],
      image_urls: exercise.imageUrls || [],
      video_url: exercise.videoUrl || null,
      impact_level: exercise.impactLevel || 'low',
      theme_color: exercise.themeColor || 'teal',
      icon_name: exercise.iconName || 'dumbbell',
      default_config: exercise.defaultConfig || {},
      is_custom: exercise.isCustom,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('exercise_catalog')
      .insert(rowPayload)
      .select('*')
      .single();

    if (error) throw error;
    return mapCatalogRow(data);
  }

  async deleteCustomExercise(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('exercise_catalog')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // ─── Routines ───────────────────────────────────────────────

  async getRoutines(): Promise<WorkoutRoutine[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('workout_routines')
      .select('*')
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) return DEFAULT_ROUTINES;

    // Seed starter routines automatically for new users on first fetch
    if (!data || data.length === 0) {
      const seeded: WorkoutRoutine[] = [];
      for (const r of DEFAULT_ROUTINES) {
        try {
          const inserted = await this.saveRoutine({
            name: r.name,
            description: r.description,
            category: r.category,
            accentColor: r.accentColor,
            items: r.items,
            isFavorite: r.isFavorite,
          });
          seeded.push(inserted);
        } catch {
          seeded.push(r);
        }
      }
      return seeded;
    }

    return data.map(mapRoutineRow);
  }

  async saveRoutine(
    routine: Omit<WorkoutRoutine, 'id'> & { id?: string }
  ): Promise<WorkoutRoutine> {
    const userId = await this.getUserId();
    const payload = {
      user_id: userId,
      name: routine.name,
      description: routine.description || null,
      category: routine.category || 'hybrid',
      accent_color: routine.accentColor || 'indigo',
      items: routine.items || [],
      is_favorite: Boolean(routine.isFavorite),
    };

    const isUuid =
      routine.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        routine.id
      );

    if (isUuid) {
      const { data, error } = await supabase
        .from('workout_routines')
        .update(payload)
        .eq('id', routine.id)
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return mapRoutineRow(data);
    }

    const { data, error } = await supabase
      .from('workout_routines')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return mapRoutineRow(data);
  }

  async deleteRoutine(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('workout_routines')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // ─── Workout Logs ───────────────────────────────────────────

  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('performed_at', { ascending: false });

    if (error || !data) return [];
    return data.map(mapWorkoutLogRow);
  }

  async addWorkoutLog(log: Omit<WorkoutLog, 'id'>): Promise<WorkoutLog> {
    const userId = await this.getUserId();
    const isUuid = (v?: string | null) =>
      Boolean(
        v &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            v
          )
      );

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        exercise_id: isUuid(log.exerciseId) ? log.exerciseId : null,
        exercise_external_id: log.exerciseExternalId || log.exerciseId || null,
        routine_id: isUuid(log.routineId) ? log.routineId : null,
        exercise_name: log.exerciseName,
        category: log.category,
        measurement_type: log.measurementType,
        performed_at: log.performedAt || new Date().toISOString(),
        duration_seconds: Math.max(0, Math.round(log.durationSeconds || 0)),
        total_reps: Math.max(0, Math.round(log.totalReps || 0)),
        total_load_kg: Math.max(0, Number(log.totalLoadKg || 0)),
        rounds_completed: Math.max(0, Math.round(log.roundsCompleted || 0)),
        primary_muscles: log.primaryMuscles || [],
        metrics: log.metrics || {},
        feedback: log.feedback || null,
        pain_reported: log.painReported || null,
        notes: log.notes || null,
      })
      .select('*')
      .single();

    if (error) throw error;
    await this.updateStreakInternal(log.performedAt);
    return mapWorkoutLogRow(data);
  }

  async updateWorkoutFeedback(
    id: string,
    feedback: Feedback,
    painReported?: number
  ): Promise<void> {
    const userId = await this.getUserId();
    const update: Record<string, unknown> = { feedback };
    if (painReported !== undefined) update.pain_reported = painReported;

    const { error } = await supabase
      .from('workout_logs')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;

    // Auto-adjust pain level if acute pain reported
    if (feedback === 'dorAguda') {
      const profile = await this.getProfile();
      const nextPain = Math.max(profile?.painLevel ?? 1, 7);
      await this.updatePainLevel(nextPain);
    }
  }

  async clearWorkoutHistory(): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  }

  // ─── Streak & Lombar Level ──────────────────────────────────

  private async updateStreakInternal(dateIso?: string): Promise<void> {
    const userId = await this.getUserId();
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, last_workout_date')
      .eq('id', userId)
      .single();

    if (!profile) return;

    const today = dateIso ? new Date(dateIso) : new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = profile.current_streak || 0;

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
      else if (diffDays === 0 && newStreak === 0) newStreak = 1;
    }

    await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        last_workout_date: today.toISOString(),
      })
      .eq('id', userId);
  }

  async getStreak(): Promise<{ currentStreak: number; lastWorkoutDate: string | null }> {
    const profile = await this.getProfile();
    return {
      currentStreak: profile?.currentStreak ?? 0,
      lastWorkoutDate: profile?.lastWorkoutDate ?? null,
    };
  }

  async resetStreak(): Promise<void> {
    const userId = await this.getUserId();
    await supabase
      .from('profiles')
      .update({ current_streak: 0, last_workout_date: null })
      .eq('id', userId);
  }

  async getLombarLevel(): Promise<LombarLevelData> {
    const profile = await this.getProfile();
    return (
      profile?.lombarLevel ?? {
        currentLevel: 0,
        weeksAtCurrentLevel: 0,
        levelStartDate: new Date().toISOString(),
      }
    );
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

  async resetAllData(): Promise<void> {
    const userId = await this.getUserId();
    await Promise.all([
      supabase.from('workout_logs').delete().eq('user_id', userId),
      supabase.from('workout_routines').delete().eq('user_id', userId),
      supabase
        .from('exercise_catalog')
        .delete()
        .eq('user_id', userId)
        .eq('is_custom', true),
      supabase
        .from('profiles')
        .update({
          pain_level: 1,
          objective: 'fortalecimento',
          experience_level: 'iniciante',
          onboarding_completed: false,
          current_streak: 0,
          last_workout_date: null,
          lombar_level: 0,
          lombar_weeks_at_level: 0,
          lombar_level_start_date: new Date().toISOString(),
        })
        .eq('id', userId),
    ]);
  }
}

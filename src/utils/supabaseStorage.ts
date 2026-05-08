import { supabase } from './supabase';
import { UserProfile, PlankSession, ExerciseSession, Feedback } from '../types';

// ─── Profile ────────────────────────────────────────────────

export const getProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  return {
    painLevel: data.pain_level,
    objective: data.objective,
    experienceLevel: data.experience_level,
    onboardingCompleted: data.onboarding_completed,
  };
};

export const saveProfile = async (profile: UserProfile): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('profiles')
    .update({
      pain_level: profile.painLevel,
      objective: profile.objective,
      experience_level: profile.experienceLevel,
      onboarding_completed: profile.onboardingCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw error;
};

// ─── Plank Sessions ─────────────────────────────────────────

export const addPlankSession = async (
  session: Omit<PlankSession, 'id'>
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('plank_sessions')
    .insert({
      user_id: user.id,
      date: session.date,
      mode: session.mode,
      duration_seconds: session.durationSeconds,
      exercise_id: session.exerciseId,
      feedback: session.feedback,
    })
    .select('id')
    .single();

  if (error) throw error;

  // Atualizar streak após adicionar sessão
  await updateStreak();

  return data.id;
};

export const getPlankSessions = async (): Promise<PlankSession[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('plank_sessions')
    .select('*')
    .eq('user_id', user.id)
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
};

export const updatePlankFeedback = async (
  id: string,
  feedback: Feedback
): Promise<void> => {
  const { error } = await supabase
    .from('plank_sessions')
    .update({ feedback })
    .eq('id', id);

  if (error) throw error;
};

// ─── Exercise Sessions ──────────────────────────────────────

export const addExerciseSession = async (
  session: Omit<ExerciseSession, 'id'>
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('exercise_sessions')
    .insert({
      user_id: user.id,
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

  // Atualizar streak após adicionar sessão
  await updateStreak();

  return data.id;
};

export const getExerciseSessions = async (): Promise<ExerciseSession[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('exercise_sessions')
    .select('*')
    .eq('user_id', user.id)
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
};

export const updateExerciseFeedback = async (
  id: string,
  feedback: Feedback
): Promise<void> => {
  const { error } = await supabase
    .from('exercise_sessions')
    .update({ feedback })
    .eq('id', id);

  if (error) throw error;
};

// ─── Streak ─────────────────────────────────────────────────

export const updateStreak = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, last_workout_date')
    .eq('id', user.id)
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

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
    // diffDays === 0 → sem mudança
  }

  await supabase
    .from('profiles')
    .update({
      current_streak: newStreak,
      last_workout_date: today.toISOString(),
    })
    .eq('id', user.id);
};

// ─── Lombar Level ───────────────────────────────────────────

export const getLombarLevel = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { currentLevel: 0, weeksAtCurrentLevel: 0, levelStartDate: new Date().toISOString() };

  const { data } = await supabase
    .from('profiles')
    .select('lombar_level, lombar_weeks_at_level, lombar_level_start_date')
    .eq('id', user.id)
    .single();

  if (!data) return { currentLevel: 0, weeksAtCurrentLevel: 0, levelStartDate: new Date().toISOString() };

  return {
    currentLevel: data.lombar_level,
    weeksAtCurrentLevel: data.lombar_weeks_at_level,
    levelStartDate: data.lombar_level_start_date,
  };
};

export const advanceLombarLevel = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const current = await getLombarLevel();
  await supabase
    .from('profiles')
    .update({
      lombar_level: Math.min(current.currentLevel + 1, 5),
      lombar_weeks_at_level: 0,
      lombar_level_start_date: new Date().toISOString(),
    })
    .eq('id', user.id);
};

export const regressLombarLevel = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const current = await getLombarLevel();
  await supabase
    .from('profiles')
    .update({
      lombar_level: Math.max(current.currentLevel - 1, 0),
      lombar_weeks_at_level: 0,
      lombar_level_start_date: new Date().toISOString(),
    })
    .eq('id', user.id);
};

// ─── Aggregation Queries ────────────────────────────────────

export const getPersonalRecord = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from('plank_sessions')
    .select('duration_seconds')
    .eq('user_id', user.id)
    .order('duration_seconds', { ascending: false })
    .limit(1)
    .single();

  return data?.duration_seconds || 0;
};

export const getWeeklyVolume = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { plankSeconds: 0, exerciseReps: 0 };

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [plankResult, exerciseResult] = await Promise.all([
    supabase
      .from('plank_sessions')
      .select('duration_seconds')
      .eq('user_id', user.id)
      .gte('date', oneWeekAgo),
    supabase
      .from('exercise_sessions')
      .select('sets, reps')
      .eq('user_id', user.id)
      .gte('date', oneWeekAgo),
  ]);

  const plankSeconds = (plankResult.data || []).reduce(
    (sum, s) => sum + s.duration_seconds, 0
  );
  const exerciseReps = (exerciseResult.data || []).reduce(
    (sum, s) => sum + s.sets * s.reps, 0
  );

  return { plankSeconds, exerciseReps };
};

export const getTotalSessions = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const [plankResult, exerciseResult] = await Promise.all([
    supabase
      .from('plank_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('exercise_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  return (plankResult.count || 0) + (exerciseResult.count || 0);
};

// ─── Reset Functions ────────────────────────────────────────

export const resetStreak = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('profiles')
    .update({ current_streak: 0, last_workout_date: null })
    .eq('id', user.id);
};

export const resetAllData = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await Promise.all([
    supabase.from('plank_sessions').delete().eq('user_id', user.id),
    supabase.from('exercise_sessions').delete().eq('user_id', user.id),
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
    }).eq('id', user.id),
  ]);
};
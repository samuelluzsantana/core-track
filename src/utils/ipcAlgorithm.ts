/**
 * Motor Adaptativo Dinâmico & Analytics Unificado (IPC v2)
 *
 * Unifica progressão e segurança para exercícios polimórficos
 * (time_based, reps_based, interval_based) e aplica bloqueio automático
 * de alto impacto quando há dor elevada ou feedback negativo recente.
 */
import {
  CatalogExercise,
  Feedback,
  ImpactLevel,
  UserProfile,
  WorkoutLog,
} from '../types';
import { SEED_CATALOG } from '../data/seedCatalog';

export interface IPCComponents {
  ecs: number; // Escore de Consistência e Estabilidade (0–1)
  ere: number; // Escore de Resposta e Execução (0–1)
  dorInversa: number; // 1 - (painLevel / 10)
  ipc: number; // Índice de Prontidão (0–1)
  freqScore: number;
  trendScore: number;
}

export type IPCDecision =
  | 'bloqueio_dor'
  | 'alerta_impacto'
  | 'avancar_nivel'
  | 'manter_aumentar_volume'
  | 'manter_incremento_parcial'
  | 'regredir_nivel';

export interface IPCResult {
  components: IPCComponents;
  decision: IPCDecision;
  label: string;
  description: string;
  accentToken: 'danger' | 'amber' | 'teal' | 'emerald' | 'indigo';
  highImpactBlocked: boolean;
  mediumImpactBlocked: boolean;
  blockReason?: string;
  reviewDays?: number;
}

const FEEDBACK_SCORES: Record<Feedback, number> = {
  otimo: 1.0,
  ok: 0.72,
  desconforto: 0.25,
  dorAguda: 0.0,
};

function calcFreqScore(logs: WorkoutLog[]): number {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const uniqueDays = new Set<string>();
  for (const log of logs) {
    const t = new Date(log.performedAt).getTime();
    if (t >= sevenDaysAgo) {
      uniqueDays.add(new Date(t).toISOString().split('T')[0]);
    }
  }
  return Math.min(uniqueDays.size / 5, 1.0); // 5+ active days/week = 100% freq score
}

function calcTrendScore(logs: WorkoutLog[]): number {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const currentWeek = logs.filter((l) => new Date(l.performedAt).getTime() >= sevenDaysAgo);
  const previousWeek = logs.filter((l) => {
    const t = new Date(l.performedAt).getTime();
    return t >= fourteenDaysAgo && t < sevenDaysAgo;
  });

  if (currentWeek.length === 0 && previousWeek.length === 0) return 0.55;
  if (previousWeek.length === 0) return 0.8;
  if (currentWeek.length === 0) return 0.3;

  const metricScore = (items: WorkoutLog[]) =>
    items.reduce(
      (sum, l) => sum + l.durationSeconds + l.totalReps * 2 + l.roundsCompleted * 20,
      0
    );

  const cur = metricScore(currentWeek);
  const prev = metricScore(previousWeek);
  if (prev === 0) return 0.75;

  const changePercent = ((cur - prev) / prev) * 100;
  if (changePercent > 8) return 1.0;
  if (changePercent > 3) return 0.82;
  if (changePercent >= -5) return 0.62;
  if (changePercent > -15) return 0.35;
  return 0.15;
}

function calcERE(logs: WorkoutLog[], weeksAtLevel: number): number {
  const sorted = [...logs]
    .filter((l) => l.feedback)
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

  let feedbackScore = 0.72;
  if (sorted.length > 0) {
    const recent = sorted.slice(0, 4);
    feedbackScore =
      recent.reduce(
        (acc, l) => acc + (l.feedback ? FEEDBACK_SCORES[l.feedback] : 0.72),
        0
      ) / recent.length;
  }

  const weekBonus = Math.min(weeksAtLevel / 6, 1.0) * 0.2;
  return Math.min(feedbackScore * 0.8 + weekBonus, 1.0);
}

export function calculateIPC(
  profile: UserProfile | null,
  logs: WorkoutLog[]
): IPCResult {
  const painLevel = profile?.painLevel ?? 1;
  const weeksAtLevel = profile?.lombarLevel?.weeksAtCurrentLevel ?? 0;

  const sortedByDate = [...logs].sort(
    (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );
  const latestFeedback = sortedByDate.find((l) => l.feedback)?.feedback;
  const recentNegative = sortedByDate
    .slice(0, 2)
    .some((l) => l.feedback === 'dorAguda' || l.feedback === 'desconforto');

  const freqScore = calcFreqScore(logs);
  const trendScore = calcTrendScore(logs);
  const ecs = freqScore * 0.6 + trendScore * 0.4;
  const ere = calcERE(logs, weeksAtLevel);
  const dorInversa = 1 - painLevel / 10;
  const ipc = Math.max(0, Math.min(1, ecs * 0.52 + ere * 0.33 + dorInversa * 0.15));

  const components: IPCComponents = {
    ecs,
    ere,
    dorInversa,
    ipc,
    freqScore,
    trendScore,
  };

  // Rule 1: Severe pain (>= 7) or acute pain feedback -> Lock high & medium impact, mobility only
  if (painLevel >= 7 || latestFeedback === 'dorAguda') {
    const reason =
      latestFeedback === 'dorAguda'
        ? 'Dor aguda relatada no último treino. Exercícios de alto e médio impacto foram bloqueados automaticamente.'
        : 'Nível de dor elevado (≥ 7/10). Apenas mobilidade e descompressão estão liberadas hoje.';

    return {
      components: { ...components, ipc: Math.min(ipc, 0.25) },
      decision: 'bloqueio_dor',
      label: 'Protocolo de Proteção Ativo',
      description: `${reason} Recomendamos Gato-Camelo, Postura da Criança ou Torção Lombar com foco em alívio.`,
      accentToken: 'danger',
      highImpactBlocked: true,
      mediumImpactBlocked: true,
      blockReason: reason,
      reviewDays: 3,
    };
  }

  // Rule 2: Moderate pain (>= 4) or recent discomfort -> Block high-impact (e.g., Pular Corda, Polichinelos)
  if (painLevel >= 4 || recentNegative) {
    const reason = recentNegative
      ? 'Desconforto recente detectado. Exercícios de alto impacto (como Pular Corda) estão pausados para proteção articular.'
      : 'Dor moderada informada (4–6/10). Alto impacto bloqueado temporariamente; priorize baixo impacto e mobilidade.';

    return {
      components,
      decision: 'alerta_impacto',
      label: 'Adaptação Segura (Sem Impacto)',
      description: `${reason} Continue com Prancha controlada, Dead Bug, Bird-Dog e Ponte de Glúteo.`,
      accentToken: 'amber',
      highImpactBlocked: true,
      mediumImpactBlocked: false,
      blockReason: reason,
      reviewDays: 4,
    };
  }

  // Rule 3: High readiness + sufficient weeks -> Advance
  if (ipc >= 0.68 && weeksAtLevel >= 3) {
    return {
      components,
      decision: 'avancar_nivel',
      label: 'Pronto para Evoluir',
      description:
        'Excelente estabilidade, consistência e resposta pós-treino. Todos os treinos (incluindo Pular Corda HIIT e progressões avançadas) estão liberados.',
      accentToken: 'emerald',
      highImpactBlocked: false,
      mediumImpactBlocked: false,
    };
  }

  // Rule 4: Good readiness -> Maintain & build volume
  if (ipc >= 0.58) {
    return {
      components,
      decision: 'manter_aumentar_volume',
      label: 'Progressão Consistente',
      description:
        'Seu corpo está respondendo muito bem aos estímulos. Mantenha a frequência semanal e aumente gradualmente tempo na prancha ou rounds no cardio.',
      accentToken: 'teal',
      highImpactBlocked: false,
      mediumImpactBlocked: false,
    };
  }

  // Rule 5: Adapting
  if (ipc >= 0.38) {
    return {
      components,
      decision: 'manter_incremento_parcial',
      label: 'Adaptação em Curso',
      description:
        'Construindo base motora. Mantemos metas conservadoras de tempo e volume para consolidar técnica e resistência sem sobrecarga.',
      accentToken: 'amber',
      highImpactBlocked: false,
      mediumImpactBlocked: false,
      reviewDays: 5,
    };
  }

  return {
    components,
    decision: 'regredir_nivel',
    label: 'Recuperação Recomendada',
    description:
      'Volume ou feedback indica fadiga acumulada. Reduza a intensidade hoje e priorize mobilidade ativa com foco na respiração.',
    accentToken: 'danger',
    highImpactBlocked: true,
    mediumImpactBlocked: false,
    blockReason: 'Fadiga ou baixa prontidão recente: alto impacto pausado hoje.',
    reviewDays: 3,
  };
}

// ─── Safety Lock & Substitutes ──────────────────────────────

export interface ExerciseSafetyStatus {
  locked: boolean;
  reason?: string;
  recommendedSubstitutes: CatalogExercise[];
}

export function getExerciseSafetyStatus(
  exercise: Pick<CatalogExercise, 'impactLevel' | 'category'>,
  ipc: IPCResult,
  catalog: CatalogExercise[] = SEED_CATALOG
): ExerciseSafetyStatus {
  const locked =
    (exercise.impactLevel === 'high' && ipc.highImpactBlocked) ||
    (exercise.impactLevel === 'medium' && ipc.mediumImpactBlocked);

  if (!locked) {
    return { locked: false, recommendedSubstitutes: [] };
  }

  const substitutes = catalog
    .filter(
      (c) =>
        c.impactLevel === 'mobility' ||
        (!ipc.mediumImpactBlocked && c.impactLevel === 'low')
    )
    .slice(0, 3);

  return {
    locked: true,
    reason:
      ipc.blockReason ||
      'Bloqueado pelo Motor Adaptativo para proteger sua coluna e articulações.',
    recommendedSubstitutes: substitutes,
  };
}

export function isHighImpactBlocked(
  impact: ImpactLevel,
  ipc: IPCResult
): boolean {
  if (impact === 'high') return ipc.highImpactBlocked;
  if (impact === 'medium') return ipc.mediumImpactBlocked;
  return false;
}

// ─── Dynamic Targets & PRs ──────────────────────────────────

export function getExercisePR(
  logs: WorkoutLog[],
  exerciseIdOrExternalId: string
): { bestSeconds: number; bestReps: number; bestLoadKg: number; bestRounds: number } {
  const matching = logs.filter(
    (l) =>
      l.exerciseId === exerciseIdOrExternalId ||
      l.exerciseExternalId === exerciseIdOrExternalId ||
      l.exerciseName.toLowerCase() === exerciseIdOrExternalId.toLowerCase()
  );

  if (matching.length === 0) {
    return { bestSeconds: 0, bestReps: 0, bestLoadKg: 0, bestRounds: 0 };
  }

  return {
    bestSeconds: Math.max(...matching.map((m) => m.durationSeconds || 0)),
    bestReps: Math.max(...matching.map((m) => m.totalReps || 0)),
    bestLoadKg: Math.max(...matching.map((m) => m.metrics?.maxLoadKg || m.totalLoadKg || 0)),
    bestRounds: Math.max(...matching.map((m) => m.roundsCompleted || 0)),
  };
}

export function getAdaptiveTargetSeconds(
  exercise: CatalogExercise,
  profile: UserProfile | null,
  logs: WorkoutLog[],
  ipc: IPCResult
): number {
  const baseDefault = exercise.defaultConfig?.targetSeconds ?? 45;
  const pr = getExercisePR(logs, exercise.externalId || exercise.id).bestSeconds;

  if (pr === 0) {
    if (ipc.decision === 'bloqueio_dor') return Math.min(baseDefault, 30);
    return baseDefault;
  }

  const exp = profile?.experienceLevel ?? 'iniciante';
  const isCardio = exercise.category === 'cardio';
  const baseInc = isCardio
    ? exp === 'iniciante'
      ? 15
      : exp === 'moderado'
        ? 30
        : 45
    : exp === 'iniciante'
      ? 5
      : exp === 'moderado'
        ? 10
        : 15;

  if (ipc.decision === 'bloqueio_dor' || ipc.decision === 'regredir_nivel') {
    return Math.max(20, Math.round(pr * 0.8));
  }
  if (ipc.decision === 'manter_incremento_parcial' || ipc.decision === 'alerta_impacto') {
    return pr + Math.max(3, Math.round(baseInc * 0.5));
  }
  return pr + baseInc;
}

export function getPreviousSetsSummary(
  logs: WorkoutLog[],
  exercise: CatalogExercise
): Array<{ reps: number; loadKg?: number }> {
  const prev = logs
    .filter(
      (l) =>
        l.measurementType === 'reps_based' &&
        (l.exerciseId === exercise.id ||
          (exercise.externalId && l.exerciseExternalId === exercise.externalId) ||
          l.exerciseName === exercise.name)
    )
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0];

  if (!prev || !prev.metrics?.sets) return [];
  return prev.metrics.sets.map((s) => ({ reps: s.reps, loadKg: s.loadKg }));
}

// ─── Unified Analytics Helpers ──────────────────────────────

export interface UnifiedVolumeSummary {
  totalActiveSeconds: number;
  totalActiveMinutes: number;
  totalReps: number;
  totalRounds: number;
  totalSessions: number;
  timeBasedSeconds: number;
  cardioSeconds: number;
}

export function getVolumeSummary(
  logs: WorkoutLog[],
  daysWindow = 7
): UnifiedVolumeSummary {
  const cutoff = Date.now() - daysWindow * 24 * 60 * 60 * 1000;
  const filtered = logs.filter((l) => new Date(l.performedAt).getTime() >= cutoff);

  let totalActiveSeconds = 0;
  let totalReps = 0;
  let totalRounds = 0;
  let timeBasedSeconds = 0;
  let cardioSeconds = 0;

  for (const log of filtered) {
    totalActiveSeconds += log.durationSeconds || 0;
    totalReps += log.totalReps || 0;
    totalRounds += log.roundsCompleted || 0;
    if (log.measurementType === 'time_based') {
      timeBasedSeconds += log.durationSeconds || 0;
    }
    if (log.category === 'cardio' || log.measurementType === 'interval_based') {
      cardioSeconds += log.durationSeconds || 0;
    }
  }

  return {
    totalActiveSeconds,
    totalActiveMinutes: Math.round(totalActiveSeconds / 60),
    totalReps,
    totalRounds,
    totalSessions: filtered.length,
    timeBasedSeconds,
    cardioSeconds,
  };
}

export interface HeatmapDay {
  dateStr: string;
  label: string;
  sessions: number;
  activeMinutes: number;
  reps: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export function generateConsistencyHeatmap(
  logs: WorkoutLog[],
  daysCount = 35
): HeatmapDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byDay = new Map<string, { sessions: number; seconds: number; reps: number }>();
  for (const log of logs) {
    const d = new Date(log.performedAt);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().split('T')[0];
    const curr = byDay.get(key) || { sessions: 0, seconds: 0, reps: 0 };
    curr.sessions += 1;
    curr.seconds += log.durationSeconds || 0;
    curr.reps += log.totalReps || 0;
    byDay.set(key, curr);
  }

  const days: HeatmapDay[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const stats = byDay.get(key);
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (stats) {
      const score = stats.sessions * 20 + Math.round(stats.seconds / 30) + Math.round(stats.reps / 15);
      if (score >= 60) intensity = 4;
      else if (score >= 40) intensity = 3;
      else if (score >= 22) intensity = 2;
      else intensity = 1;
    }
    days.push({
      dateStr: key,
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      sessions: stats?.sessions ?? 0,
      activeMinutes: Math.round((stats?.seconds ?? 0) / 60),
      reps: stats?.reps ?? 0,
      intensity,
    });
  }

  return days;
}

export function aggregateMuscleWork(
  logs: WorkoutLog[]
): { muscle: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const log of logs) {
    for (const m of log.primaryMuscles || []) {
      const normalized = m.charAt(0).toUpperCase() + m.slice(1);
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return [];
  const maxVal = Math.max(...entries.map(([, v]) => v));
  return entries
    .map(([muscle, val]) => ({
      muscle,
      value: Math.round((val / maxVal) * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
}

export function getRandomTip(
  catalog: CatalogExercise[] = SEED_CATALOG
): { exerciseName: string; tip: string } {
  const withTips = catalog.filter((ex) => ex.tips && ex.tips.length > 0);
  if (withTips.length === 0) {
    return {
      exerciseName: 'Respiração & Core',
      tip: 'Expire durante o esforço máximo para ativar o transverso do abdômen e estabilizar a coluna.',
    };
  }
  // Deterministic daily rotation so the tip stays steady across re-renders
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % withTips.length;
  const ex = withTips[dayIndex];
  return {
    exerciseName: ex.name,
    tip: ex.tips[0],
  };
}

export const LOMBAR_LEVELS = [
  { level: 0, label: 'Mobilidade Básica', desc: 'Gato-Camelo, Postura da Criança' },
  { level: 1, label: 'Estabilização Leve', desc: 'Dead Bug, Bird-Dog' },
  { level: 2, label: 'Estabilização Moderada', desc: 'Ponte de Glúteo, Prancha controlada' },
  { level: 3, label: 'Condicionamento Integrado', desc: 'Core + Cardio leve sem sobrecarga' },
  { level: 4, label: 'Híbrido Moderado', desc: 'Séries compostas + Pular Corda HIIT' },
  { level: 5, label: 'Performance Híbrida', desc: 'Volume máximo em todas as modalidades' },
];

export function getLombarLevelInfo(level: number) {
  return LOMBAR_LEVELS[Math.min(Math.max(level, 0), LOMBAR_LEVELS.length - 1)];
}

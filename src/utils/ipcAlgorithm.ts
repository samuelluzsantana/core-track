/**
 * IPC — Índice de Prontidão do Core
 * Algoritmo adaptativo que combina estabilidade da prancha,
 * resposta a exercícios e nível de dor para governar progressão.
 */
import { AppData, Feedback } from '../types';

// ─── Result Types ───────────────────────────────────────────

export interface IPCComponents {
  ecs: number;       // Escore de Estabilidade do Core (0–1)
  ere: number;       // Escore de Resposta e Execução (0–1)
  dorInversa: number; // 1 - (painLevel / 10)
  ipc: number;       // Índice de Prontidão do Core (0–1)
  freqScore: number;
  trendScore: number;
}

export type IPCDecision =
  | 'bloqueio_dor'
  | 'avancar_nivel'
  | 'manter_aumentar_volume'
  | 'manter_incremento_parcial'
  | 'regredir_nivel';

export interface IPCResult {
  components: IPCComponents;
  decision: IPCDecision;
  label: string;
  description: string;
  color: string;
  emoji: string;
  reviewDays?: number;
}

// ─── 1. ESCORE DE ESTABILIDADE DO CORE (ECS) ────────────────

function calcFreqScore(plankSessions: { date: string }[]): number {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const uniqueDays = new Set<string>();
  plankSessions.forEach((s) => {
    const d = new Date(s.date);
    if (d >= sevenDaysAgo) {
      uniqueDays.add(d.toISOString().split('T')[0]);
    }
  });

  return Math.min(uniqueDays.size / 7, 1.0);
}

function calcTrendScore(plankSessions: { date: string; durationSeconds: number }[]): number {
  // Compare average of last 7 days vs previous 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const currentWeek = plankSessions.filter(
    (s) => new Date(s.date) >= sevenDaysAgo
  );
  const previousWeek = plankSessions.filter(
    (s) => {
      const d = new Date(s.date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }
  );

  if (previousWeek.length === 0 || currentWeek.length === 0) {
    // Not enough data — assume stable
    return 0.6;
  }

  const avgCurrent = currentWeek.reduce((a, b) => a + b.durationSeconds, 0) / currentWeek.length;
  const avgPrevious = previousWeek.reduce((a, b) => a + b.durationSeconds, 0) / previousWeek.length;

  const changePercent = ((avgCurrent - avgPrevious) / avgPrevious) * 100;

  if (changePercent > 8) return 1.0;   // crescimento expressivo
  if (changePercent > 3) return 0.8;   // crescimento leve
  if (changePercent >= -3) return 0.6; // estável
  if (changePercent > -10) return 0.35; // declínio leve
  return 0.1;                           // declínio forte
}

function calcECS(plankSessions: { date: string; durationSeconds: number }[]): {
  ecs: number;
  freqScore: number;
  trendScore: number;
} {
  const freqScore = calcFreqScore(plankSessions);
  const trendScore = calcTrendScore(plankSessions);
  const ecs = freqScore * 0.6 + trendScore * 0.4;
  return { ecs, freqScore, trendScore };
}

// ─── 2. ESCORE DE RESPOSTA E EXECUÇÃO (ERE) ─────────────────

const FEEDBACK_SCORES: Record<Feedback, number> = {
  otimo: 1.0,
  ok: 0.7,
  desconforto: 0.25,
  dorAguda: 0.0,
};

function calcERE(
  exerciseSessions: { feedback?: Feedback }[],
  weeksAtCurrentLevel: number
): number {
  // Get most recent feedback from exercise sessions
  const sessionsWithFeedback = exerciseSessions.filter((s) => s.feedback);

  let feedbackScore = 0.7; // default to "ok" if no feedback
  if (sessionsWithFeedback.length > 0) {
    // Average of last 3 feedbacks
    const recent = sessionsWithFeedback.slice(-3);
    feedbackScore =
      recent.reduce((acc, s) => acc + (FEEDBACK_SCORES[s.feedback!] || 0.7), 0) /
      recent.length;
  }

  const weekBonus = Math.min(weeksAtCurrentLevel / 6, 1.0) * 0.2;
  return Math.min(feedbackScore * 0.8 + weekBonus, 1.0);
}

// ─── 3. ÍNDICE DE PRONTIDÃO DO CORE (IPC) ───────────────────

export function calculateIPC(data: AppData): IPCResult {
  const painLevel = data.profile?.painLevel ?? 1;
  const weeksAtCurrentLevel = data.lombarLevel?.weeksAtCurrentLevel ?? 0;

  // High pain override
  if (painLevel >= 7) {
    return {
      components: {
        ecs: 0,
        ere: 0,
        dorInversa: 1 - painLevel / 10,
        ipc: 0,
        freqScore: 0,
        trendScore: 0,
      },
      decision: 'bloqueio_dor',
      label: 'Bloqueio por Dor',
      description:
        'Dor alta detectada. Apenas exercícios de mobilidade permitidos. Reavaliação em 3 dias.',
      color: '#EF4444',
      emoji: '🚫',
      reviewDays: 3,
    };
  }

  // Calculate components
  const { ecs, freqScore, trendScore } = calcECS(data.plankSessions);
  const ere = calcERE(data.exerciseSessions, weeksAtCurrentLevel);
  const dorInversa = 1 - painLevel / 10;

  const ipc = ecs * 0.55 + ere * 0.3 + dorInversa * 0.15;

  const components: IPCComponents = {
    ecs,
    ere,
    dorInversa,
    ipc,
    freqScore,
    trendScore,
  };

  // Decision logic
  if (ipc >= 0.65 && weeksAtCurrentLevel >= 3) {
    return {
      components,
      decision: 'avancar_nivel',
      label: 'Pronto para Avançar',
      description:
        'Excelente! Seu core está forte e consistente. Pode avançar um nível lombar com incremento completo na prancha.',
      color: '#22C55E',
      emoji: '🚀',
    };
  }

  if (ipc >= 0.65) {
    return {
      components,
      decision: 'manter_aumentar_volume',
      label: 'Progredindo Bem',
      description:
        'Bom desempenho! Mantenha o nível atual e aumente volume (séries/reps). Incremento completo na prancha.',
      color: '#14B8A6',
      emoji: '📈',
    };
  }

  if (ipc >= 0.40) {
    return {
      components,
      decision: 'manter_incremento_parcial',
      label: 'Adaptação em Curso',
      description:
        'Seu corpo está se adaptando. Mantenha o nível, 50% do incremento de prancha. Reavaliação em 5 dias.',
      color: '#F59E0B',
      emoji: '⏳',
      reviewDays: 5,
    };
  }

  return {
    components,
    decision: 'regredir_nivel',
    label: 'Reduzir Intensidade',
    description:
      'Sinal de sobrecarga. Regrida um nível lombar, mantenha tempo de prancha. Reavaliação em 3 dias.',
    color: '#EF4444',
    emoji: '⚠️',
    reviewDays: 3,
  };
}

// ─── Helper: Lombar Level Labels ─────────────────────────────

export const LOMBAR_LEVELS = [
  { level: 0, label: 'Mobilidade Básica', desc: 'Cat-Cow, Child Pose' },
  { level: 1, label: 'Estabilização Leve', desc: 'Dead Bug, Bird-Dog' },
  { level: 2, label: 'Estabilização Moderada', desc: 'Ponte de Glúteo, Superman' },
  { level: 3, label: 'Fortalecimento Baixo', desc: 'Prancha lateral, Crunch controlado' },
  { level: 4, label: 'Fortalecimento Moderado', desc: 'Séries combinadas, volume crescente' },
  { level: 5, label: 'Fortalecimento Avançado', desc: 'Full core workout com variações' },
];

export function getLombarLevelInfo(level: number) {
  return LOMBAR_LEVELS[Math.min(Math.max(level, 0), LOMBAR_LEVELS.length - 1)];
}

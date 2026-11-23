import {
  Flame,
  Timer,
  Dumbbell,
  Zap,
  ChevronRight,
  Lightbulb,
  Sun,
  Moon,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Play,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  getAdaptiveTargetSeconds,
  getExercisePR,
  getExerciseSafetyStatus,
  getRandomTip,
  getVolumeSummary,
} from '../utils/ipcAlgorithm';
import { NumberTicker } from '../components/ui/NumberTicker';
import { ExerciseAvatar } from '../components/ExerciseAvatar';
import { SEED_CATALOG } from '../data/seedCatalog';

function IPCRing({
  percentage,
  accentToken,
  size = 96,
}: {
  percentage: number;
  accentToken: 'danger' | 'amber' | 'teal' | 'emerald' | 'indigo';
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const strokeColor =
    accentToken === 'danger'
      ? 'var(--accent-danger)'
      : accentToken === 'amber'
        ? 'var(--accent-time)'
        : accentToken === 'emerald'
          ? 'var(--accent-mobility)'
          : 'var(--accent-reps)';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="var(--ring-track)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - (percentage / 100) * circumference,
          }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-display font-extrabold text-ink tabular-nums">
          {percentage}%
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">
          IPC
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { profile, catalog, routines, logs, ipc, setThemeAndSync } = useAppData();
  const { resolvedTheme } = useTheme();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const plankEx =
    catalog.find((c) => c.externalId === 'Plank' || c.id === 'sys-plank') ||
    SEED_CATALOG[0];
  const ropeEx =
    catalog.find(
      (c) =>
        c.externalId === 'Rope_Jumping_HIIT' ||
        c.externalId === 'Rope_Jumping_Free' ||
        c.id === 'sys-rope-hiit'
    ) || SEED_CATALOG[10];
  const mobilityEx =
    catalog.find((c) => c.impactLevel === 'mobility') || SEED_CATALOG[4];

  const plankTarget = getAdaptiveTargetSeconds(plankEx, profile, logs, ipc);
  const plankPR = getExercisePR(logs, plankEx.externalId || plankEx.id).bestSeconds;
  const ropeSafety = getExerciseSafetyStatus(ropeEx, ipc, catalog);

  const weekVol = getVolumeSummary(logs, 7);
  const weeklyGoalMin = profile?.weeklyGoalMinutes || 90;
  const minutesPct = Math.min(
    100,
    Math.round((weekVol.totalActiveMinutes / weeklyGoalMin) * 100)
  );
  const repsGoal = 300;
  const repsPct = Math.min(100, Math.round((weekVol.totalReps / repsGoal) * 100));
  const sessionsGoal = 5;
  const sessionsPct = Math.min(
    100,
    Math.round((weekVol.totalSessions / sessionsGoal) * 100)
  );

  const ipcPercent = Math.round(ipc.components.ipc * 100);
  const tip = getRandomTip(catalog);
  const featuredRoutine = routines[0];
  const streak = profile?.currentStreak ?? 0;

  const formatDurationShort = (sec: number) => {
    if (sec >= 60) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return s > 0 ? `${m}m ${s}s` : `${m}min`;
    }
    return `${sec}s`;
  };

  const handleToggleTheme = () => {
    const next = resolvedTheme === 'light' ? 'dark' : 'light';
    setThemeAndSync(next);
  };

  return (
    <div className="px-5 pt-7 pb-8 space-y-6">
      {/* 1. Header: Saudação + Streak + Seletor rápido de Tema */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            CoreTrack Hybrid
          </p>
          <h1 className="text-2xl font-display font-extrabold text-ink tracking-tight truncate">
            {getGreeting()}
            {profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}!
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Theme Switcher */}
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={
              resolvedTheme === 'light'
                ? 'Ativar tema escuro'
                : 'Ativar tema claro'
            }
            className="w-10 h-10 rounded-xl surface-card flex items-center justify-center text-ink-secondary hover:text-ink transition-colors"
            title={resolvedTheme === 'light' ? 'Mudar para Tema Escuro' : 'Mudar para Tema Claro'}
          >
            {resolvedTheme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-modality-time" />
            )}
          </button>

          {/* Streak Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-modality-time-soft border border-modality-time-border flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-modality-time" />
            <div className="leading-none">
              <span className="text-sm font-display font-extrabold text-ink tabular-nums">
                {streak > 0 ? <NumberTicker value={streak} /> : '0'}
              </span>
              <span className="text-[10px] font-bold text-modality-time ml-1">
                dias
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Safety Alert when High Impact is Locked */}
      {ipc.highImpactBlocked && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-modality-danger-soft border border-modality-danger-border flex items-start gap-3"
        >
          <AlertTriangle className="w-4 h-4 text-modality-danger shrink-0 mt-0.5" />
          <div className="text-xs text-ink-secondary leading-relaxed">
            <span className="font-bold text-modality-danger block mb-0.5">
              Proteção Adaptativa Ativa
            </span>
            {ipc.blockReason}
          </div>
        </motion.div>
      )}

      {/* 2. Seção "Seu Treino de Hoje" */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
            Seu Treino de Hoje
          </h2>
          <button
            type="button"
            onClick={() => navigate('/exercises')}
            className="text-xs font-semibold text-modality-cardio flex items-center gap-0.5"
          >
            Catálogo <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Actions Grid: Prancha (Time) & Pular Corda / Mobilidade (Cardio or Safety Swap) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Prancha Card (Laranja - Isometria/Tempo) */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => navigate(`/train?exerciseId=${plankEx.id}`)}
            className="surface-card rounded-2xl p-4 text-left hover:border-modality-time-border transition-all flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-modality-time-soft border border-modality-time-border flex items-center justify-center">
                <Timer className="w-4 h-4 text-modality-time" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-modality-time-soft text-modality-time tabular-nums">
                Meta {formatDurationShort(plankTarget)}
              </span>
            </div>
            <div>
              <div className="font-display font-bold text-sm text-ink">
                Prancha Diária
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5 tabular-nums">
                {plankPR > 0
                  ? `Recorde: ${formatDurationShort(plankPR)}`
                  : 'Isometria adaptativa'}
              </div>
            </div>
          </motion.button>

          {/* Pular Corda Card (Índigo - Cardio/HIIT) OR Mobilidade Segura */}
          {ropeSafety.locked ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate(`/train?exerciseId=${mobilityEx.id}`)}
              className="surface-card rounded-2xl p-4 text-left border-modality-mobility-border transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-modality-mobility-soft border border-modality-mobility-border flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-modality-mobility" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-modality-danger-soft text-modality-danger flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Corda
                </span>
              </div>
              <div>
                <div className="font-display font-bold text-sm text-ink">
                  {mobilityEx.name.split(' ')[0]} Segura
                </div>
                <div className="text-[11px] text-modality-mobility font-medium mt-0.5">
                  Mobilidade recomendada
                </div>
              </div>
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate(`/train?exerciseId=${ropeEx.id}`)}
              className="surface-card rounded-2xl p-4 text-left hover:border-modality-cardio-border transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-modality-cardio-soft border border-modality-cardio-border flex items-center justify-center">
                  <Zap className="w-4 h-4 text-modality-cardio" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-modality-cardio-soft text-modality-cardio tabular-nums">
                  {ropeEx.defaultConfig.rounds || 6} rounds
                </span>
              </div>
              <div>
                <div className="font-display font-bold text-sm text-ink">
                  Pular Corda
                </div>
                <div className="text-[11px] text-ink-muted mt-0.5 tabular-nums">
                  HIIT {ropeEx.defaultConfig.workSeconds || 40}s /{' '}
                  {ropeEx.defaultConfig.restSeconds || 20}s
                </div>
              </div>
            </motion.button>
          )}
        </div>

        {/* Featured Routine Card (Ref Image 2 style) */}
        {featuredRoutine && (
          <div className="surface-card rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ExerciseAvatar
                  name={featuredRoutine.name}
                  imageUrl={featuredRoutine.items[0]?.imageUrl}
                  measurementType={
                    featuredRoutine.items[0]?.measurementType || 'reps_based'
                  }
                  size="md"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-modality-reps">
                    Rotina Recomendada
                  </span>
                  <h3 className="font-display font-bold text-sm text-ink truncate">
                    {featuredRoutine.name}
                  </h3>
                  <p className="text-xs text-ink-muted truncate">
                    {featuredRoutine.items.map((i) => i.exerciseName).join(', ')}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate(`/train?routineId=${featuredRoutine.id}`)}
                className="py-2.5 px-3 rounded-xl bg-modality-cardio text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Iniciar Rotina
              </button>
              <button
                type="button"
                onClick={() => navigate('/exercises')}
                className="py-2.5 px-3 rounded-xl bg-subtle text-ink-secondary font-semibold text-xs flex items-center justify-center gap-1.5 border border-border-token hover:text-ink"
              >
                <Plus className="w-3.5 h-3.5" />
                Explorar / Criar
              </button>
            </div>
          </div>
        )}
      </motion.section>

      {/* 3. "Resumo da Semana" com barras de progresso visuais */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="surface-card rounded-2xl p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
            Resumo da Semana
          </h2>
          <button
            type="button"
            onClick={() => navigate('/progress')}
            className="text-xs font-semibold text-modality-reps"
          >
            Ver métricas
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Active Minutes Progress */}
          <div>
            <div className="flex justify-between items-baseline text-xs mb-1.5">
              <span className="font-semibold text-ink-secondary flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-modality-time" />
                Minutos Ativos
              </span>
              <span className="font-mono font-bold text-ink tabular-nums">
                {weekVol.totalActiveMinutes}{' '}
                <span className="text-ink-muted font-normal">/ {weeklyGoalMin} min</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-subtle overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${minutesPct}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full bg-modality-time"
              />
            </div>
          </div>

          {/* Reps & Jumps Progress */}
          <div>
            <div className="flex justify-between items-baseline text-xs mb-1.5">
              <span className="font-semibold text-ink-secondary flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-modality-reps" />
                Repetições & Saltos
              </span>
              <span className="font-mono font-bold text-ink tabular-nums">
                {weekVol.totalReps}{' '}
                <span className="text-ink-muted font-normal">/ {repsGoal}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-subtle overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${repsPct}%` }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="h-full rounded-full bg-modality-reps"
              />
            </div>
          </div>

          {/* Sessions Progress */}
          <div>
            <div className="flex justify-between items-baseline text-xs mb-1.5">
              <span className="font-semibold text-ink-secondary flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-modality-cardio" />
                Sessões na Semana
              </span>
              <span className="font-mono font-bold text-ink tabular-nums">
                {weekVol.totalSessions}{' '}
                <span className="text-ink-muted font-normal">/ {sessionsGoal}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-subtle overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${sessionsPct}%` }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="h-full rounded-full bg-modality-cardio"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. "Prontidão & Adaptação" — Texto completo visível (sem truncamento) */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2.5">
          Prontidão & Adaptação
        </h2>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="w-full surface-card rounded-2xl p-4 flex items-center gap-4 text-left hover:border-border-strong transition-all"
        >
          <IPCRing percentage={ipcPercent} accentToken={ipc.accentToken} size={88} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-bold text-base text-ink">
                {ipc.label}
              </span>
              <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />
            </div>
            <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
              {ipc.description}
            </p>
          </div>
        </button>
      </motion.section>

      {/* 5. "Dica do Dia" — Texto completo visível (sem truncamento) */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="surface-card rounded-2xl p-4 flex gap-3.5 items-start">
          <div className="w-9 h-9 rounded-xl bg-modality-time-soft border border-modality-time-border flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-modality-time" />
          </div>
          <div className="flex-1">
            <span className="text-[11px] uppercase tracking-wider text-ink-muted font-bold block">
              Dica do Dia — {tip.exerciseName}
            </span>
            <p className="text-sm text-ink-secondary leading-relaxed mt-1">
              {tip.tip}
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

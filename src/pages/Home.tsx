import { useState } from 'react';
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
import { DotPattern } from '../components/ui/DotPattern';
import { BlurFade } from '../components/ui/BlurFade';
import { BlurText } from '../components/ui/BlurText';
import { GlassBadge } from '../components/ui/GlassIcons';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { MagicCard } from '../components/ui/MagicCard';
import { BorderBeam } from '../components/ui/BorderBeam';
import { AnimatedCircularProgressBar } from '../components/ui/AnimatedCircularProgressBar';
import { ShimmerButton } from '../components/ui/ShimmerButton';
import { ExerciseAvatar } from '../components/ExerciseAvatar';
import { ExerciseMediaModal } from '../components/ExerciseMediaModal';
import { SEED_CATALOG } from '../data/seedCatalog';
import { CatalogExercise } from '../types';

function IPCRing({
  percentage,
  accentToken,
  size = 96,
}: {
  percentage: number;
  accentToken: 'danger' | 'amber' | 'teal' | 'emerald' | 'indigo';
  size?: number;
}) {
  const strokeColor =
    accentToken === 'danger'
      ? 'var(--accent-danger)'
      : accentToken === 'amber'
        ? 'var(--accent-time)'
        : accentToken === 'emerald'
          ? 'var(--accent-mobility)'
          : 'var(--accent-reps)';

  return (
    <AnimatedCircularProgressBar
      value={percentage}
      size={size}
      strokeWidth={8}
      gaugePrimaryColor={strokeColor}
    >
      <span className="text-xl font-display font-extrabold text-ink tabular-nums">
        <NumberTicker value={percentage} />%
      </span>
      <span className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">
        IPC
      </span>
    </AnimatedCircularProgressBar>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { profile, catalog, routines, logs, ipc, setThemeAndSync } = useAppData();
  const { resolvedTheme } = useTheme();
  const [mediaPreview, setMediaPreview] = useState<CatalogExercise | null>(null);

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
    <div className="px-5 pt-7 pb-8 space-y-6 relative">
      <DotPattern width={22} height={22} className="h-64 opacity-50" />

      {/* 1. Header: Saudação + Streak + Seletor rápido de Tema */}
      <BlurFade delay={0.02} className="relative z-10 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-modality-time">
            CoreTrack Hybrid
          </p>
          <h1 className="text-2xl font-display font-extrabold text-ink tracking-tight">
            <BlurText
              text={`${getGreeting()}${profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}!`}
            />
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
          <div className="px-3 py-1.5 rounded-xl bg-modality-time-soft border border-modality-time-border flex items-center gap-1.5 shadow-sm">
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
      </BlurFade>

      {/* Safety Alert when High Impact is Locked */}
      {ipc.highImpactBlocked && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-3.5 rounded-2xl bg-modality-danger-soft border border-modality-danger-border flex items-start gap-3"
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
      <BlurFade delay={0.07} className="relative z-10 space-y-3">
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

        {/* Quick Actions Grid com React Bits GlassBadge & SpotlightCard */}
        <div className="grid grid-cols-2 gap-3">
          {/* Prancha Card (Laranja - Isometria/Tempo) */}
          <SpotlightCard
            spotlightColor="rgba(234, 88, 12, 0.11)"
            className="rounded-2xl hover:border-modality-time-border transition-colors"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate(`/train?exerciseId=${plankEx.id}`)}
              className="w-full p-4 text-left flex flex-col justify-between gap-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <GlassBadge
                  size="sm"
                  tone="amber"
                  icon={<Timer className="w-4 h-4" />}
                />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-modality-time-soft text-modality-time border border-modality-time-border/60 tabular-nums">
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
          </SpotlightCard>

          {/* Pular Corda Card (Índigo - Cardio/HIIT) OR Mobilidade Segura */}
          {ropeSafety.locked ? (
            <SpotlightCard
              spotlightColor="rgba(21, 128, 61, 0.11)"
              className="rounded-2xl border-modality-mobility-border transition-colors"
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate(`/train?exerciseId=${mobilityEx.id}`)}
                className="w-full p-4 text-left flex flex-col justify-between gap-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <GlassBadge
                    size="sm"
                    tone="emerald"
                    icon={<ShieldCheck className="w-4 h-4" />}
                  />
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
            </SpotlightCard>
          ) : (
            <SpotlightCard
              spotlightColor="rgba(79, 70, 229, 0.11)"
              className="rounded-2xl hover:border-modality-cardio-border transition-colors"
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate(`/train?exerciseId=${ropeEx.id}`)}
                className="w-full p-4 text-left flex flex-col justify-between gap-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <GlassBadge
                    size="sm"
                    tone="indigo"
                    icon={<Zap className="w-4 h-4" />}
                  />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-modality-cardio-soft text-modality-cardio border border-modality-cardio-border/60 tabular-nums">
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
            </SpotlightCard>
          )}
        </div>

        {/* Featured Routine Card com MagicCard + BorderBeam + ShimmerButton */}
        {featuredRoutine && (
          <MagicCard className="rounded-2xl p-4 space-y-3">
            <BorderBeam duration={8} borderWidth={1.5} />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ExerciseAvatar
                  name={featuredRoutine.name}
                  imageUrl={featuredRoutine.items[0]?.imageUrl}
                  measurementType={
                    featuredRoutine.items[0]?.measurementType || 'reps_based'
                  }
                  size="md"
                  onClick={() => {
                    const first = featuredRoutine.items[0];
                    if (!first) return;
                    const found =
                      catalog.find(
                        (c) =>
                          c.id === first.catalogId ||
                          (first.externalId && c.externalId === first.externalId) ||
                          c.name === first.exerciseName
                      ) ||
                      SEED_CATALOG.find(
                        (c) =>
                          c.id === first.catalogId ||
                          (first.externalId && c.externalId === first.externalId)
                      );
                    if (found) setMediaPreview(found);
                  }}
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
              <ShimmerButton
                onClick={() => navigate(`/train?routineId=${featuredRoutine.id}`)}
                className="py-2.5 px-3 rounded-xl bg-modality-cardio text-white text-xs shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Iniciar Rotina
              </ShimmerButton>
              <button
                type="button"
                onClick={() => navigate('/exercises')}
                className="py-2.5 px-3 rounded-xl bg-subtle text-ink-secondary font-semibold text-xs flex items-center justify-center gap-1.5 border border-border-token hover:text-ink transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Explorar / Criar
              </button>
            </div>
          </MagicCard>
        )}
      </BlurFade>

      {/* 3. "Resumo da Semana" com MagicCard + barras de progresso visuais */}
      <BlurFade delay={0.12} className="relative z-10">
        <MagicCard className="rounded-2xl p-4 space-y-4">
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
                  <NumberTicker value={weekVol.totalActiveMinutes} />{' '}
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
                  Repetições &amp; Saltos
                </span>
                <span className="font-mono font-bold text-ink tabular-nums">
                  <NumberTicker value={weekVol.totalReps} />{' '}
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
                  <NumberTicker value={weekVol.totalSessions} />{' '}
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
        </MagicCard>
      </BlurFade>

      {/* 4. "Prontidão & Adaptação" com SpotlightCard + AnimatedCircularProgressBar */}
      <BlurFade delay={0.16} className="relative z-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2.5">
          Prontidão &amp; Adaptação
        </h2>
        <SpotlightCard
          spotlightColor="rgba(13, 148, 136, 0.10)"
          className="rounded-2xl hover:border-border-strong transition-colors"
        >
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-full p-4 flex items-center gap-4 text-left"
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
        </SpotlightCard>
      </BlurFade>

      {/* 5. "Dica do Dia" — Texto completo visível (sem truncamento) */}
      <BlurFade delay={0.2} className="relative z-10">
        <MagicCard className="rounded-2xl p-4">
          <div className="flex gap-3.5 items-start">
            <GlassBadge
              size="sm"
              tone="amber"
              icon={<Lightbulb className="w-4 h-4" />}
              className="mt-0.5"
            />
            <div className="flex-1">
              <span className="text-[11px] uppercase tracking-wider text-ink-muted font-bold block">
                Dica do Dia — {tip.exerciseName}
              </span>
              <p className="text-sm text-ink-secondary leading-relaxed mt-1">
                {tip.tip}
              </p>
            </div>
          </div>
        </MagicCard>
      </BlurFade>

      <ExerciseMediaModal
        exercise={mediaPreview}
        onClose={() => setMediaPreview(null)}
        onStartTraining={
          mediaPreview && !getExerciseSafetyStatus(mediaPreview, ipc, catalog).locked
            ? (ex) => {
                setMediaPreview(null);
                navigate(`/train?exerciseId=${ex.id}`);
              }
            : undefined
        }
      />
    </div>
  );
}

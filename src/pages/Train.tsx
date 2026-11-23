import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  Lock,
  ShieldCheck,
  Clock,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';
import {
  CatalogExercise,
  Feedback,
  SetLogItem,
  WorkoutLog,
} from '../types';
import {
  getAdaptiveTargetSeconds,
  getExercisePR,
  getExerciseSafetyStatus,
  getPreviousSetsSummary,
} from '../utils/ipcAlgorithm';
import { AnimatedChecklist, ChecklistItem } from '../components/ui/AnimatedChecklist';
import { FeedbackModal } from '../components/FeedbackModal';
import { ExerciseAvatar } from '../components/ExerciseAvatar';
import { IMPACT_LABELS, MODALITY_LABELS, SEED_CATALOG } from '../data/seedCatalog';

function playTone(freq = 660, durationMs = 140) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // audio blocked or unsupported
  }
}

export function Train() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    profile,
    catalog,
    routines,
    logs,
    ipc,
    addWorkoutLog,
    submitWorkoutFeedback,
  } = useAppData();

  const routineIdParam = searchParams.get('routineId');
  const exerciseIdParam = searchParams.get('exerciseId');

  const activeRoutine = useMemo(
    () => routines.find((r) => r.id === routineIdParam) || null,
    [routines, routineIdParam]
  );

  const [routineIndex, setRoutineIndex] = useState(0);

  const selectedExercise: CatalogExercise = useMemo(() => {
    if (activeRoutine && activeRoutine.items[routineIndex]) {
      const item = activeRoutine.items[routineIndex];
      const match = catalog.find(
        (c) =>
          c.id === item.catalogId ||
          (item.externalId && c.externalId === item.externalId) ||
          c.name === item.exerciseName
      );
      if (match) return match;
    }
    if (exerciseIdParam) {
      const found = catalog.find(
        (c) => c.id === exerciseIdParam || c.externalId === exerciseIdParam
      );
      if (found) return found;
    }
    return (
      catalog.find((c) => c.externalId === 'Plank' || c.id === 'sys-plank') ||
      catalog[0] ||
      SEED_CATALOG[0]
    );
  }, [activeRoutine, routineIndex, exerciseIdParam, catalog]);

  const safety = useMemo(
    () => getExerciseSafetyStatus(selectedExercise, ipc, catalog),
    [selectedExercise, ipc, catalog]
  );

  const pr = useMemo(
    () =>
      getExercisePR(
        logs,
        selectedExercise.externalId || selectedExercise.id
      ),
    [logs, selectedExercise]
  );

  const adaptiveTargetSec = useMemo(
    () => getAdaptiveTargetSeconds(selectedExercise, profile, logs, ipc),
    [selectedExercise, profile, logs, ipc]
  );

  // ── Shared feedback state ──
  const [lastSavedLog, setLastSavedLog] = useState<WorkoutLog | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // ── TIME-BASED state ──
  const [timeMode, setTimeMode] = useState<'progressao' | 'livre'>('progressao');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // ── REPS-BASED state (Ref Image 4 style) ──
  const [sets, setSets] = useState<SetLogItem[]>([]);
  const [restTimerSec, setRestTimerSec] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [repsSessionStart, setRepsSessionStart] = useState<number>(Date.now());
  const prevSets = useMemo(
    () => getPreviousSetsSummary(logs, selectedExercise),
    [logs, selectedExercise]
  );

  // ── INTERVAL-BASED (HIIT / Jump Rope) state ──
  const [totalRounds, setTotalRounds] = useState(6);
  const [workSec, setWorkSec] = useState(40);
  const [restSec, setRestSec] = useState(20);
  const [currentRound, setCurrentRound] = useState(1);
  const [intervalPhase, setIntervalPhase] = useState<'work' | 'rest'>('work');
  const [phaseRemaining, setPhaseRemaining] = useState(40);
  const [intervalRunning, setIntervalRunning] = useState(false);
  const [jumpCount, setJumpCount] = useState(0);
  const [intervalTotalActiveSec, setIntervalTotalActiveSec] = useState(0);

  const timerRef = useRef<number | null>(null);

  // Reset exercise-specific defaults when selectedExercise changes
  useEffect(() => {
    setTimerActive(false);
    setElapsedSec(0);
    setIntervalRunning(false);
    setRestRunning(false);
    setRestTimerSec(0);

    const cfg = selectedExercise.defaultConfig || {};
    const checkItems =
      cfg.checklist ||
      (selectedExercise.instructions.length > 0
        ? selectedExercise.instructions.slice(0, 4)
        : ['Postura alinhada', 'Respiração controlada']);
    setChecklist(
      checkItems.map((label, idx) => ({ id: `chk-${idx}`, label, checked: false }))
    );

    const defSetsCount = cfg.defaultSets || 3;
    const defReps = cfg.defaultReps || 12;
    const defLoad = cfg.defaultLoadKg || 0;
    setSets(
      Array.from({ length: defSetsCount }, (_, i) => ({
        setNumber: i + 1,
        reps: prevSets[i]?.reps ?? defReps,
        loadKg: prevSets[i]?.loadKg ?? defLoad,
        completed: false,
      }))
    );
    setRepsSessionStart(Date.now());

    const r = cfg.rounds || 6;
    const w = cfg.workSeconds || 40;
    const rest = cfg.restSeconds || 20;
    setTotalRounds(r);
    setWorkSec(w);
    setRestSec(rest);
    setCurrentRound(1);
    setIntervalPhase('work');
    setPhaseRemaining(w);
    setJumpCount(0);
    setIntervalTotalActiveSec(0);
  }, [selectedExercise, prevSets]);

  // Timer effect for time_based
  useEffect(() => {
    if (selectedExercise.measurementType !== 'time_based' || !timerActive) return;
    timerRef.current = window.setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 1;
        if (timeMode === 'progressao' && next === adaptiveTargetSec) {
          playTone(880, 220);
        }
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedExercise.measurementType, timerActive, timeMode, adaptiveTargetSec]);

  // Rest timer effect for reps_based
  useEffect(() => {
    if (!restRunning) return;
    const id = window.setInterval(() => {
      setRestTimerSec((s) => {
        if (s <= 1) {
          setRestRunning(false);
          playTone(720, 160);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restRunning]);

  // Interval HIIT timer effect
  useEffect(() => {
    if (selectedExercise.measurementType !== 'interval_based' || !intervalRunning) {
      return;
    }
    const id = window.setInterval(() => {
      setIntervalTotalActiveSec((s) => s + 1);
      setPhaseRemaining((rem) => {
        if (rem > 1) return rem - 1;

        // Phase transition
        if (intervalPhase === 'work') {
          if (currentRound >= totalRounds) {
            setIntervalRunning(false);
            playTone(880, 300);
            return 0;
          }
          playTone(520, 180);
          setIntervalPhase('rest');
          return restSec;
        } else {
          playTone(780, 180);
          setCurrentRound((r) => r + 1);
          setIntervalPhase('work');
          return workSec;
        }
      });
    }, 1000);

    return () => clearInterval(id);
  }, [
    selectedExercise.measurementType,
    intervalRunning,
    intervalPhase,
    currentRound,
    totalRounds,
    workSec,
    restSec,
  ]);

  const formatMMSS = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectCatalogExercise = (exId: string) => {
    setSearchParams({ exerciseId: exId });
    setRoutineIndex(0);
  };

  const finishAndSaveTime = async () => {
    setTimerActive(false);
    const saved = await addWorkoutLog({
      exerciseId: selectedExercise.id,
      exerciseExternalId: selectedExercise.externalId,
      routineId: activeRoutine?.id,
      exerciseName: selectedExercise.name,
      category: selectedExercise.category,
      measurementType: 'time_based',
      performedAt: new Date().toISOString(),
      durationSeconds: elapsedSec,
      totalReps: 0,
      totalLoadKg: 0,
      roundsCompleted: 1,
      primaryMuscles: selectedExercise.primaryMuscles,
      metrics: {
        mode: timeMode,
        targetSeconds: timeMode === 'progressao' ? adaptiveTargetSec : undefined,
        checklistCompleted: checklist.filter((c) => c.checked).length,
      },
    });
    setLastSavedLog(saved);
    setShowFeedback(true);
  };

  const finishAndSaveReps = async () => {
    const completedSets = sets.filter((s) => s.completed);
    const effectiveSets = completedSets.length > 0 ? completedSets : sets;
    const totalReps = effectiveSets.reduce((sum, s) => sum + (s.reps || 0), 0);
    const totalLoadKg = effectiveSets.reduce(
      (sum, s) => sum + (s.reps || 0) * (s.loadKg || 0),
      0
    );
    const maxLoadKg = Math.max(0, ...effectiveSets.map((s) => s.loadKg || 0));
    const durationSeconds = Math.max(
      45,
      Math.round((Date.now() - repsSessionStart) / 1000)
    );

    const saved = await addWorkoutLog({
      exerciseId: selectedExercise.id,
      exerciseExternalId: selectedExercise.externalId,
      routineId: activeRoutine?.id,
      exerciseName: selectedExercise.name,
      category: selectedExercise.category,
      measurementType: 'reps_based',
      performedAt: new Date().toISOString(),
      durationSeconds,
      totalReps,
      totalLoadKg,
      roundsCompleted: effectiveSets.length,
      primaryMuscles: selectedExercise.primaryMuscles,
      metrics: {
        sets: effectiveSets,
        totalSets: effectiveSets.length,
        avgReps: Math.round(totalReps / Math.max(1, effectiveSets.length)),
        maxLoadKg,
      },
    });
    setLastSavedLog(saved);
    setShowFeedback(true);
  };

  const finishAndSaveInterval = async () => {
    setIntervalRunning(false);
    const duration = Math.max(1, intervalTotalActiveSec);
    const cadenceRpm =
      jumpCount > 0 ? Math.round((jumpCount / duration) * 60) : undefined;

    const saved = await addWorkoutLog({
      exerciseId: selectedExercise.id,
      exerciseExternalId: selectedExercise.externalId,
      routineId: activeRoutine?.id,
      exerciseName: selectedExercise.name,
      category: selectedExercise.category,
      measurementType: 'interval_based',
      performedAt: new Date().toISOString(),
      durationSeconds: duration,
      totalReps: jumpCount,
      totalLoadKg: 0,
      roundsCompleted: currentRound,
      primaryMuscles: selectedExercise.primaryMuscles,
      metrics: {
        rounds: currentRound,
        workSeconds: workSec,
        restSeconds: restSec,
        totalCycles: jumpCount,
        cadenceRpm,
      },
    });
    setLastSavedLog(saved);
    setShowFeedback(true);
  };

  const handleFeedbackSubmit = async (feedback: Feedback) => {
    if (lastSavedLog) {
      await submitWorkoutFeedback(lastSavedLog.id, feedback);
    }
    if (activeRoutine && routineIndex < activeRoutine.items.length - 1) {
      setRoutineIndex((i) => i + 1);
    } else if (activeRoutine) {
      navigate('/progress');
    }
  };

  const completedSetsCount = sets.filter((s) => s.completed).length;
  const totalRepsSelected = sets
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.reps, 0);
  const totalVolumeKg = sets
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.reps * (s.loadKg || 0), 0);

  return (
    <div className="px-5 pt-6 pb-8 space-y-5">
      {/* Routine Banner if active */}
      {activeRoutine && (
        <div className="p-3.5 rounded-2xl bg-modality-cardio-soft border border-modality-cardio-border flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-modality-cardio">
              Rotina Ativa • Passo {routineIndex + 1} de {activeRoutine.items.length}
            </span>
            <div className="font-display font-bold text-sm text-ink truncate">
              {activeRoutine.name}
            </div>
          </div>
          {routineIndex < activeRoutine.items.length - 1 && (
            <button
              type="button"
              onClick={() => setRoutineIndex((i) => i + 1)}
              className="px-2.5 py-1.5 rounded-lg bg-surface border border-border-token text-xs font-semibold text-ink flex items-center gap-1 shrink-0"
            >
              Próximo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Horizontal Exercise Quick Picker */}
      {!activeRoutine && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {catalog.slice(0, 10).map((ex) => {
            const active = ex.id === selectedExercise.id;
            const exSafety = getExerciseSafetyStatus(ex, ipc, catalog);
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelectCatalogExercise(ex.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 transition-all ${
                  active
                    ? 'bg-ink text-surface border-ink shadow-sm'
                    : 'bg-surface text-ink-secondary border-border-token hover:bg-subtle'
                }`}
              >
                {exSafety.locked && <Lock className="w-3 h-3 text-modality-danger" />}
                <span>{ex.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Exercise Header Card */}
      <div className="surface-card rounded-2xl p-4 flex items-center gap-3.5">
        <ExerciseAvatar
          name={selectedExercise.name}
          imageUrl={selectedExercise.imageUrls[0]}
          measurementType={selectedExercise.measurementType}
          themeColor={selectedExercise.themeColor}
          iconName={selectedExercise.iconName}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-subtle text-ink-secondary">
              {MODALITY_LABELS[selectedExercise.measurementType]}
            </span>
            <span className={`safety-badge safety-${selectedExercise.impactLevel}`}>
              {IMPACT_LABELS[selectedExercise.impactLevel]}
            </span>
          </div>
          <h1 className="font-display font-extrabold text-lg text-ink mt-1 truncate">
            {selectedExercise.name}
          </h1>
          <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5 tabular-nums">
            {pr.bestSeconds > 0 && (
              <span className="flex items-center gap-1 text-modality-time font-semibold">
                <Trophy className="w-3.5 h-3.5" /> PR: {formatMMSS(pr.bestSeconds)}
              </span>
            )}
            {pr.bestReps > 0 && selectedExercise.measurementType === 'reps_based' && (
              <span className="flex items-center gap-1 text-modality-reps font-semibold">
                <Trophy className="w-3.5 h-3.5" /> PR: {pr.bestReps} reps
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Adaptive Safety Block Gate */}
      {safety.locked ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card rounded-2xl p-5 border-modality-danger-border space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-modality-danger-soft border border-modality-danger-border flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-modality-danger" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-modality-danger">
                Exercício Bloqueado por Segurança
              </h2>
              <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                {safety.reason}
              </p>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
              Substitutos Seguros Sugeridos
            </div>
            <div className="space-y-2">
              {safety.recommendedSubstitutes.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSelectCatalogExercise(sub.id)}
                  className="w-full p-3 rounded-xl bg-subtle hover:bg-surface-hover border border-border-token flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-modality-mobility" />
                    <div>
                      <div className="text-xs font-bold text-ink">{sub.name}</div>
                      <div className="text-[11px] text-ink-muted">
                        {IMPACT_LABELS[sub.impactLevel]}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-modality-mobility">
                    Trocar →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* ═════════ MODALITY 1: TIME_BASED ═════════ */}
          {selectedExercise.measurementType === 'time_based' && (
            <div className="space-y-5">
              {/* Mode Toggle */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-subtle border border-border-token">
                <button
                  type="button"
                  onClick={() => {
                    setTimeMode('progressao');
                    setTimerActive(false);
                    setElapsedSec(0);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    timeMode === 'progressao'
                      ? 'bg-surface text-modality-time shadow-sm'
                      : 'text-ink-muted'
                  }`}
                >
                  Progressão ({formatMMSS(adaptiveTargetSec)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeMode('livre');
                    setTimerActive(false);
                    setElapsedSec(0);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    timeMode === 'livre'
                      ? 'bg-surface text-modality-time shadow-sm'
                      : 'text-ink-muted'
                  }`}
                >
                  Tempo Livre
                </button>
              </div>

              {/* Collapsible Posture Checklist */}
              {!timerActive && checklist.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowChecklist((v) => !v)}
                    className="flex items-center justify-between w-full mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted"
                  >
                    <span>Checklist de Técnica</span>
                    {showChecklist ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <AnimatePresence>
                    {showChecklist && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <AnimatedChecklist
                          items={checklist}
                          onToggle={(id, checked) =>
                            setChecklist((items) =>
                              items.map((it) =>
                                it.id === id ? { ...it, checked } : it
                              )
                            )
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Circular SVG Timer */}
              <div className="surface-card rounded-3xl py-8 px-4 flex flex-col items-center">
                <div className="relative w-60 h-60 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="120"
                      cy="120"
                      r="108"
                      fill="none"
                      stroke="var(--ring-track)"
                      strokeWidth="10"
                    />
                    <motion.circle
                      cx="120"
                      cy="120"
                      r="108"
                      fill="none"
                      stroke="var(--accent-time)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      animate={{
                        strokeDasharray: `${
                          (timeMode === 'progressao'
                            ? Math.min(elapsedSec / adaptiveTargetSec, 1)
                            : (elapsedSec % 60) / 60) *
                          (2 * Math.PI * 108)
                        } 1000`,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                  </svg>
                  <div className="text-center z-10">
                    <div className="text-5xl font-mono font-bold tracking-tight text-ink tabular-nums">
                      {formatMMSS(elapsedSec)}
                    </div>
                    {timeMode === 'progressao' && (
                      <div className="text-xs font-semibold text-ink-muted mt-2 tabular-nums">
                        Meta: {formatMMSS(adaptiveTargetSec)}
                      </div>
                    )}
                    {timeMode === 'progressao' && elapsedSec >= adaptiveTargetSec && (
                      <div className="text-xs font-bold text-modality-mobility mt-1 flex items-center justify-center gap-1">
                        <Trophy className="w-3.5 h-3.5" /> Meta atingida!
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-5 mt-6">
                  {elapsedSec > 0 && !timerActive && (
                    <button
                      type="button"
                      onClick={() => setElapsedSec(0)}
                      className="w-12 h-12 rounded-full bg-subtle border border-border-token flex items-center justify-center text-ink-secondary hover:text-ink"
                      aria-label="Reiniciar cronômetro"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => setTimerActive((v) => !v)}
                    className={`w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-elevated transition-colors ${
                      timerActive
                        ? 'bg-subtle border-2 border-modality-time text-modality-time'
                        : 'bg-modality-time text-white'
                    }`}
                    aria-label={timerActive ? 'Pausar' : 'Iniciar'}
                  >
                    {timerActive ? (
                      <Pause className="w-7 h-7 fill-current" />
                    ) : (
                      <Play className="w-7 h-7 fill-current ml-0.5" />
                    )}
                  </motion.button>

                  {elapsedSec > 0 && (
                    <button
                      type="button"
                      onClick={finishAndSaveTime}
                      className="w-12 h-12 rounded-full bg-modality-mobility-soft border border-modality-mobility-border flex items-center justify-center text-modality-mobility"
                      aria-label="Finalizar e salvar"
                      title="Finalizar e salvar"
                    >
                      <Square className="w-5 h-5 fill-current" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═════════ MODALITY 2: REPS_BASED (Ref Image 4 style) ═════════ */}
          {selectedExercise.measurementType === 'reps_based' && (
            <div className="surface-card rounded-2xl p-4 space-y-4">
              {/* Top Stats Strip */}
              <div className="grid grid-cols-3 gap-2 pb-3 border-b border-border-token text-center">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block">
                    Séries
                  </span>
                  <span className="text-base font-mono font-bold text-modality-reps tabular-nums">
                    {completedSetsCount}/{sets.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block">
                    Reps Feitas
                  </span>
                  <span className="text-base font-mono font-bold text-ink tabular-nums">
                    {totalRepsSelected}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block">
                    Volume
                  </span>
                  <span className="text-base font-mono font-bold text-ink tabular-nums">
                    {totalVolumeKg} kg
                  </span>
                </div>
              </div>

              {/* Rest Timer Pill */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-subtle border border-border-token">
                <div className="flex items-center gap-2 text-xs font-semibold text-modality-cardio">
                  <Clock className="w-4 h-4" />
                  <span className="tabular-nums">
                    Descanso: {restRunning ? formatMMSS(restTimerSec) : 'Pronto (45s)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (restRunning) {
                      setRestRunning(false);
                      setRestTimerSec(0);
                    } else {
                      setRestTimerSec(45);
                      setRestRunning(true);
                    }
                  }}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg bg-surface border border-border-token text-ink"
                >
                  {restRunning ? 'Zerar' : 'Iniciar 45s'}
                </button>
              </div>

              {/* Tabular Set Logger */}
              <div>
                <div className="grid grid-cols-12 gap-2 px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted text-center">
                  <div className="col-span-2">Série</div>
                  <div className="col-span-3">Anterior</div>
                  <div className="col-span-2">Kg</div>
                  <div className="col-span-3">Reps</div>
                  <div className="col-span-2">OK</div>
                </div>

                <div className="space-y-1.5">
                  {sets.map((s, idx) => {
                    const prev = prevSets[idx];
                    return (
                      <div
                        key={s.setNumber}
                        className={`grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-xl transition-colors ${
                          s.completed
                            ? 'border border-modality-mobility-border'
                            : 'bg-subtle/70 border border-transparent'
                        }`}
                        style={
                          s.completed
                            ? { backgroundColor: 'var(--set-done-bg)' }
                            : undefined
                        }
                      >
                        <div className="col-span-2 text-center font-mono font-bold text-sm text-ink tabular-nums">
                          {s.setNumber}
                        </div>
                        <div className="col-span-3 text-center text-xs text-ink-muted font-mono tabular-nums">
                          {prev
                            ? `${prev.loadKg || 0}×${prev.reps}`
                            : '—'}
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={s.loadKg ?? 0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSets((curr) =>
                                curr.map((item, i) =>
                                  i === idx ? { ...item, loadKg: val } : item
                                )
                              );
                            }}
                            className="w-full py-1 px-1 rounded-lg bg-surface border border-border-token text-center text-xs font-mono font-bold text-ink tabular-nums outline-none"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            min={1}
                            value={s.reps}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value));
                              setSets((curr) =>
                                curr.map((item, i) =>
                                  i === idx ? { ...item, reps: val } : item
                                )
                              );
                            }}
                            className="w-full py-1 px-1 rounded-lg bg-surface border border-border-token text-center text-xs font-mono font-bold text-ink tabular-nums outline-none"
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSets((curr) =>
                                curr.map((item, i) =>
                                  i === idx
                                    ? { ...item, completed: !item.completed }
                                    : item
                                )
                              );
                              if (!s.completed) {
                                setRestTimerSec(45);
                                setRestRunning(true);
                              }
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              s.completed
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'bg-surface border border-border-strong text-ink-muted hover:text-ink'
                            }`}
                            aria-label={`Concluir série ${s.setNumber}`}
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSets((curr) => [
                        ...curr,
                        {
                          setNumber: curr.length + 1,
                          reps: curr[curr.length - 1]?.reps ?? 12,
                          loadKg: curr[curr.length - 1]?.loadKg ?? 0,
                          completed: false,
                        },
                      ])
                    }
                    className="flex-1 py-2.5 rounded-xl bg-subtle border border-border-token text-xs font-semibold text-ink-secondary hover:text-ink flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Série
                  </button>
                  {sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSets((curr) => curr.slice(0, -1))}
                      className="px-3 py-2.5 rounded-xl bg-subtle border border-border-token text-ink-muted hover:text-modality-danger"
                      aria-label="Remover última série"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={finishAndSaveReps}
                className="w-full py-3.5 rounded-xl bg-modality-reps text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Check className="w-4 h-4" />
                Finalizar Exercício
              </button>
            </div>
          )}

          {/* ═════════ MODALITY 3: INTERVAL_BASED (Cardio / Jump Rope HIIT) ═════════ */}
          {selectedExercise.measurementType === 'interval_based' && (
            <div className="space-y-4">
              {/* Config Strip when stopped */}
              {!intervalRunning && intervalTotalActiveSec === 0 && (
                <div className="surface-card rounded-2xl p-4 grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-ink-muted block mb-1">
                      Rounds
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={totalRounds}
                      onChange={(e) => setTotalRounds(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2.5 py-2 rounded-xl bg-subtle border border-border-token text-sm font-mono font-bold text-ink tabular-nums text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-ink-muted block mb-1">
                      Ação (s)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={300}
                      value={workSec}
                      onChange={(e) => {
                        const v = Math.max(5, Number(e.target.value));
                        setWorkSec(v);
                        setPhaseRemaining(v);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-subtle border border-border-token text-sm font-mono font-bold text-ink tabular-nums text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-ink-muted block mb-1">
                      Descanso (s)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={restSec}
                      onChange={(e) => setRestSec(Math.max(5, Number(e.target.value)))}
                      className="w-full px-2.5 py-2 rounded-xl bg-subtle border border-border-token text-sm font-mono font-bold text-ink tabular-nums text-center"
                    />
                  </div>
                </div>
              )}

              {/* Interval Ring Card */}
              <div className="surface-card rounded-3xl p-6 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      intervalPhase === 'work'
                        ? 'bg-modality-cardio-soft text-modality-cardio border-modality-cardio-border'
                        : 'bg-modality-reps-soft text-modality-reps border-modality-reps-border'
                    }`}
                  >
                    {intervalPhase === 'work' ? 'Execução Intensa' : 'Recuperação'}
                  </span>
                  <span className="text-xs font-mono font-bold text-ink-muted tabular-nums">
                    Round {currentRound}/{totalRounds}
                  </span>
                </div>

                <div className="relative w-52 h-52 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="104"
                      cy="104"
                      r="94"
                      fill="none"
                      stroke="var(--ring-track)"
                      strokeWidth="10"
                    />
                    <motion.circle
                      cx="104"
                      cy="104"
                      r="94"
                      fill="none"
                      stroke={
                        intervalPhase === 'work'
                          ? 'var(--accent-cardio)'
                          : 'var(--accent-reps)'
                      }
                      strokeWidth="10"
                      strokeLinecap="round"
                      animate={{
                        strokeDasharray: `${
                          (phaseRemaining /
                            Math.max(1, intervalPhase === 'work' ? workSec : restSec)) *
                          (2 * Math.PI * 94)
                        } 1000`,
                      }}
                    />
                  </svg>
                  <div className="text-center z-10">
                    <div className="text-5xl font-mono font-bold text-ink tabular-nums">
                      {formatMMSS(phaseRemaining)}
                    </div>
                    <div className="text-[11px] text-ink-muted mt-1 tabular-nums">
                      Ativo: {formatMMSS(intervalTotalActiveSec)}
                    </div>
                  </div>
                </div>

                {/* Jump / Cycle Counter */}
                <div className="w-full mt-5 p-3 rounded-2xl bg-subtle border border-border-token flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Saltos / Ciclos (Opcional)
                    </div>
                    <div className="text-lg font-mono font-extrabold text-modality-cardio tabular-nums">
                      {jumpCount}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {[10, 25, 50].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setJumpCount((c) => c + inc)}
                        className="px-2.5 py-1.5 rounded-lg bg-surface border border-border-token text-xs font-mono font-bold text-ink hover:border-modality-cardio"
                      >
                        +{inc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interval Controls */}
                <div className="flex items-center justify-center gap-5 mt-5">
                  {intervalTotalActiveSec > 0 && !intervalRunning && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentRound(1);
                        setIntervalPhase('work');
                        setPhaseRemaining(workSec);
                        setIntervalTotalActiveSec(0);
                        setJumpCount(0);
                      }}
                      className="w-12 h-12 rounded-full bg-subtle border border-border-token flex items-center justify-center text-ink-secondary"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => setIntervalRunning((r) => !r)}
                    className={`w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-elevated ${
                      intervalRunning
                        ? 'bg-subtle border-2 border-modality-cardio text-modality-cardio'
                        : 'bg-modality-cardio text-white'
                    }`}
                  >
                    {intervalRunning ? (
                      <Pause className="w-7 h-7 fill-current" />
                    ) : (
                      <Play className="w-7 h-7 fill-current ml-0.5" />
                    )}
                  </motion.button>

                  {intervalTotalActiveSec > 0 && (
                    <button
                      type="button"
                      onClick={finishAndSaveInterval}
                      className="w-12 h-12 rounded-full bg-modality-mobility-soft border border-modality-mobility-border flex items-center justify-center text-modality-mobility"
                      title="Finalizar treino"
                    >
                      <Square className="w-5 h-5 fill-current" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <FeedbackModal
        isOpen={showFeedback}
        exerciseName={selectedExercise.name}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}

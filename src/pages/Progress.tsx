import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Flame,
  Trophy,
  Activity,
  Clock,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Tabs, Tab } from '@heroui/tabs';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  aggregateMuscleWork,
  generateConsistencyHeatmap,
  getExercisePR,
  getVolumeSummary,
} from '../utils/ipcAlgorithm';
import { NumberTicker } from '../components/ui/NumberTicker';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { MagicCard } from '../components/ui/MagicCard';
import { BorderBeam } from '../components/ui/BorderBeam';
import { BlurFade } from '../components/ui/BlurFade';
import { DotPattern } from '../components/ui/DotPattern';
import { MODALITY_LABELS } from '../data/seedCatalog';

type ChartMetric = 'active_min' | 'plank_sec' | 'reps' | 'cardio_min';

export function Progress() {
  const { profile, logs } = useAppData();
  const { resolvedTheme } = useTheme();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [metric, setMetric] = useState<ChartMetric>('active_min');

  const daysWindow = period === 'week' ? 7 : 30;
  const volume = useMemo(
    () => getVolumeSummary(logs, daysWindow),
    [logs, daysWindow]
  );

  const plankPR = useMemo(() => getExercisePR(logs, 'Plank').bestSeconds, [logs]);
  const heatmap = useMemo(() => generateConsistencyHeatmap(logs, 35), [logs]);
  const radarData = useMemo(() => aggregateMuscleWork(logs), [logs]);

  // Unified Trend Series (Ref Image 3 & 5)
  const trendData = useMemo(() => {
    const cutoff = Date.now() - daysWindow * 24 * 60 * 60 * 1000;
    const relevant = [...logs]
      .filter((l) => new Date(l.performedAt).getTime() >= cutoff)
      .sort(
        (a, b) =>
          new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime()
      );

    if (metric === 'plank_sec') {
      return relevant
        .filter(
          (l) =>
            l.exerciseExternalId === 'Plank' ||
            l.exerciseName.toLowerCase().includes('prancha')
        )
        .slice(-12)
        .map((l) => ({
          date: new Date(l.performedAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          }),
          value: l.durationSeconds,
        }));
    }

    // Group by day for active_min, reps, cardio_min
    const byDay = new Map<string, number>();
    for (const l of relevant) {
      if (metric === 'cardio_min' && l.category !== 'cardio' && l.measurementType !== 'interval_based') {
        continue;
      }
      const key = new Date(l.performedAt).toISOString().split('T')[0];
      const prev = byDay.get(key) || 0;
      const add =
        metric === 'reps'
          ? l.totalReps
          : Math.max(1, Math.round(l.durationSeconds / 60));
      byDay.set(key, prev + add);
    }

    return Array.from(byDay.entries())
      .slice(-12)
      .map(([iso, val]) => ({
        date: new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        value: val,
      }));
  }, [logs, daysWindow, metric]);

  const metricMeta: Record<
    ChartMetric,
    { label: string; unit: string; stroke: string; fill: string }
  > = {
    active_min: {
      label: 'Tempo Ativo',
      unit: 'min',
      stroke: resolvedTheme === 'dark' ? '#F59E0B' : '#EA580C',
      fill: resolvedTheme === 'dark' ? 'rgba(245,158,11,0.22)' : 'rgba(234,88,12,0.14)',
    },
    plank_sec: {
      label: 'Prancha',
      unit: 's',
      stroke: resolvedTheme === 'dark' ? '#F59E0B' : '#EA580C',
      fill: resolvedTheme === 'dark' ? 'rgba(245,158,11,0.22)' : 'rgba(234,88,12,0.14)',
    },
    reps: {
      label: 'Reps & Saltos',
      unit: 'reps',
      stroke: resolvedTheme === 'dark' ? '#14B8A6' : '#0D9488',
      fill: resolvedTheme === 'dark' ? 'rgba(20,184,166,0.22)' : 'rgba(13,148,136,0.14)',
    },
    cardio_min: {
      label: 'Cardio / HIIT',
      unit: 'min',
      stroke: resolvedTheme === 'dark' ? '#818CF8' : '#4F46E5',
      fill: resolvedTheme === 'dark' ? 'rgba(129,140,248,0.22)' : 'rgba(79,70,229,0.14)',
    },
  };

  const currentMetric = metricMeta[metric];
  const streak = profile?.currentStreak ?? 0;

  return (
    <div className="px-5 pt-7 pb-8 space-y-5 relative">
      <DotPattern width={22} height={22} className="h-56 opacity-45" />

      <BlurFade delay={0.02} className="relative z-10 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-ink tracking-tight">
            Analytics Híbrido
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Consolidado entre tempo, força e cardio/HIIT
          </p>
        </div>

        {/* HeroUI Period Switch */}
        <Tabs
          aria-label="Período de análise"
          selectedKey={period}
          onSelectionChange={(key) => setPeriod(key as 'week' | 'month')}
          size="sm"
          radius="lg"
          classNames={{
            tabList: 'bg-subtle p-1 border border-border-token',
            cursor: 'bg-surface shadow-sm',
            tab: 'px-3 h-7 text-xs font-bold',
            tabContent: 'group-data-[selected=true]:text-ink text-ink-muted',
          }}
        >
          <Tab key="week" title="7d" />
          <Tab key="month" title="30d" />
        </Tabs>
      </BlurFade>

      {/* Top KPI SpotlightCards */}
      <BlurFade delay={0.06} className="relative z-10 grid grid-cols-4 gap-2">
        <SpotlightCard
          spotlightColor="rgba(234, 88, 12, 0.12)"
          className="rounded-2xl p-3 text-center"
        >
          <Flame className="w-4 h-4 text-modality-time mx-auto mb-1" />
          <div className="text-lg font-mono font-extrabold text-ink tabular-nums">
            <NumberTicker value={streak} />
          </div>
          <div className="text-[10px] font-semibold text-ink-muted">Streak</div>
        </SpotlightCard>
        <SpotlightCard
          spotlightColor="rgba(79, 70, 229, 0.12)"
          className="rounded-2xl p-3 text-center"
        >
          <Clock className="w-4 h-4 text-modality-cardio mx-auto mb-1" />
          <div className="text-lg font-mono font-extrabold text-ink tabular-nums">
            <NumberTicker value={volume.totalActiveMinutes} />
            <span className="text-[10px] font-normal text-ink-muted">m</span>
          </div>
          <div className="text-[10px] font-semibold text-ink-muted">Ativo</div>
        </SpotlightCard>
        <SpotlightCard
          spotlightColor="rgba(13, 148, 136, 0.12)"
          className="rounded-2xl p-3 text-center"
        >
          <Activity className="w-4 h-4 text-modality-reps mx-auto mb-1" />
          <div className="text-lg font-mono font-extrabold text-ink tabular-nums">
            <NumberTicker value={volume.totalReps} />
          </div>
          <div className="text-[10px] font-semibold text-ink-muted">Reps</div>
        </SpotlightCard>
        <SpotlightCard
          spotlightColor="rgba(234, 88, 12, 0.12)"
          className="rounded-2xl p-3 text-center"
        >
          <Trophy className="w-4 h-4 text-modality-time mx-auto mb-1" />
          <div className="text-lg font-mono font-extrabold text-ink tabular-nums">
            {plankPR}
            <span className="text-[10px] font-normal text-ink-muted">s</span>
          </div>
          <div className="text-[10px] font-semibold text-ink-muted">PR Prancha</div>
        </SpotlightCard>
      </BlurFade>

      {/* Unified Trend Chart com MagicCard + BorderBeam */}
      <BlurFade delay={0.1} className="relative z-10">
        <MagicCard className="rounded-2xl p-4 space-y-4">
          <BorderBeam duration={9} borderWidth={1.25} />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-modality-cardio" />
            <h2 className="font-display font-bold text-sm text-ink">
              {currentMetric.label} ({currentMetric.unit})
            </h2>
          </div>
          {plankPR > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-modality-time-soft text-modality-time border border-modality-time-border flex items-center gap-1">
              <Trophy className="w-3 h-3" /> PR {plankPR}s
            </span>
          )}
        </div>

        <div className="h-48 w-full">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentMetric.stroke} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={currentMetric.stroke} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={resolvedTheme === 'dark' ? '#262B3A' : '#E4E4E7'}
                />
                <XAxis
                  dataKey="date"
                  tick={{
                    fill: resolvedTheme === 'dark' ? '#94A3B8' : '#64748B',
                    fontSize: 10,
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{
                    fill: resolvedTheme === 'dark' ? '#94A3B8' : '#64748B',
                    fontSize: 10,
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: resolvedTheme === 'dark' ? '#181C26' : '#FFFFFF',
                    border: `1px solid ${resolvedTheme === 'dark' ? '#262B3A' : '#E4E4E7'}`,
                    borderRadius: '12px',
                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                    fontSize: '12px',
                  }}
                  labelStyle={{
                    color: resolvedTheme === 'dark' ? '#94A3B8' : '#64748B',
                  }}
                  itemStyle={{
                    color: currentMetric.stroke,
                    fontWeight: 700,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={currentMetric.stroke}
                  strokeWidth={2.5}
                  fill="url(#trendAreaFill)"
                  dot={{ r: 3.5, fill: currentMetric.stroke, strokeWidth: 0 }}
                  activeDot={{ r: 5.5, fill: currentMetric.stroke }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-ink-muted">
              Registre treinos para visualizar sua curva de evolução.
            </div>
          )}
        </div>

        {/* Metric selector pills (Ref Image 3 & 5) */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {(Object.keys(metricMeta) as ChartMetric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                metric === m
                  ? 'bg-modality-cardio text-white border-modality-cardio'
                  : 'bg-subtle text-ink-secondary border-border-token hover:text-ink'
              }`}
            >
              {metricMeta[m].label}
            </button>
          ))}
        </div>
        </MagicCard>
      </BlurFade>

      {/* Consistency Heatmap (GitHub style, 35 days) */}
      <div className="surface-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-sm text-ink flex items-center gap-2">
            <Calendar className="w-4 h-4 text-modality-reps" />
            Consistência (35 dias)
          </h2>
          <span className="text-[11px] font-medium text-ink-muted tabular-nums">
            {logs.length} sessões totais
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {heatmap.map((day) => {
            const bgClass =
              day.intensity === 0
                ? 'bg-subtle border-border-token'
                : day.intensity === 1
                  ? 'bg-modality-reps-soft border-modality-reps-border'
                  : day.intensity === 2
                    ? 'bg-modality-reps/40 border-modality-reps/50'
                    : day.intensity === 3
                      ? 'bg-modality-reps/75 border-modality-reps'
                      : 'bg-modality-reps border-modality-reps shadow-sm';
            return (
              <div
                key={day.dateStr}
                title={`${day.label}: ${day.sessions} treino(s), ${day.activeMinutes}min, ${day.reps} reps`}
                className={`aspect-square rounded-md border ${bgClass} transition-colors`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-1.5 text-[10px] text-ink-muted">
          <span>Menos</span>
          <span className="w-3 h-3 rounded-sm bg-subtle border border-border-token" />
          <span className="w-3 h-3 rounded-sm bg-modality-reps-soft border border-modality-reps-border" />
          <span className="w-3 h-3 rounded-sm bg-modality-reps/40" />
          <span className="w-3 h-3 rounded-sm bg-modality-reps/75" />
          <span className="w-3 h-3 rounded-sm bg-modality-reps" />
          <span>Mais</span>
        </div>
      </div>

      {/* Muscle Balance Radar */}
      {radarData.length >= 3 && (
        <div className="surface-card rounded-2xl p-4">
          <h2 className="font-display font-bold text-sm text-ink mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-modality-reps" />
            Equilíbrio Muscular Consolidado
          </h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                <PolarGrid
                  stroke={resolvedTheme === 'dark' ? '#262B3A' : '#E4E4E7'}
                />
                <PolarAngleAxis
                  dataKey="muscle"
                  tick={{
                    fill: resolvedTheme === 'dark' ? '#94A3B8' : '#475569',
                    fontSize: 10,
                  }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke={resolvedTheme === 'dark' ? '#14B8A6' : '#0D9488'}
                  fill={resolvedTheme === 'dark' ? '#14B8A6' : '#0D9488'}
                  fillOpacity={0.22}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History List (Ref Image 5 bottom list) */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
          Histórico Recente
        </h2>
        {logs.length === 0 ? (
          <div className="surface-card rounded-2xl p-6 text-center text-xs text-ink-muted">
            Nenhum treino registrado ainda.
          </div>
        ) : (
          <div className="surface-card rounded-2xl divide-y divide-border-token overflow-hidden">
            {logs.slice(0, 10).map((log) => {
              const dotClass =
                log.measurementType === 'interval_based'
                  ? 'bg-modality-cardio'
                  : log.measurementType === 'time_based'
                    ? 'bg-modality-time'
                    : 'bg-modality-reps';

              const metricLabel =
                log.measurementType === 'time_based'
                  ? `${log.durationSeconds}s`
                  : log.measurementType === 'interval_based'
                    ? `${log.roundsCompleted} rounds${log.totalReps > 0 ? ` • ${log.totalReps} saltos` : ''}`
                    : `${log.roundsCompleted} séries • ${log.totalReps} reps`;

              return (
                <div
                  key={log.id}
                  className="p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink truncate">
                        {log.exerciseName}
                      </div>
                      <div className="text-[11px] text-ink-muted">
                        {new Date(log.performedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        • {MODALITY_LABELS[log.measurementType]}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-ink tabular-nums">
                      {metricLabel}
                    </div>
                    {log.feedback && (
                      <div className="text-[10px] text-ink-muted capitalize">
                        {log.feedback === 'dorAguda' ? 'Dor aguda' : log.feedback}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar, Activity, TrendingUp } from 'lucide-react';
import { getAppData, getWeeklyVolume, getMonthlyVolume } from '../utils/storage';
import { aggregateMuscleWork } from '../utils/exerciseApi';
import { AppData } from '../types';
import { NumberTicker } from '../components/ui/NumberTicker';

export function Progress() {
  const [data, setData] = useState<AppData | null>(null);
  const [volumePeriod, setVolumePeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    setData(getAppData());
  }, []);

  if (!data) return null;

  // Chart data
  const chartData = data.plankSessions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10)
    .map((s) => ({
      date: new Date(s.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      tempo: s.durationSeconds,
    }));

  // Radar data
  const radarData = aggregateMuscleWork(data.exerciseSessions);

  // Volume
  const weekVol = getWeeklyVolume();
  const monthVol = getMonthlyVolume();
  const volume = volumePeriod === 'week' ? weekVol : monthVol;

  // Heatmap generation (last 28 days)
  const generateHeatmap = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasPlank = data.plankSessions.some((s) => s.date.startsWith(dateStr));
      const hasExercise = data.exerciseSessions.some((s) => s.date.startsWith(dateStr));
      let intensity = 0;
      if (hasPlank && hasExercise) intensity = 3;
      else if (hasPlank) intensity = 2;
      else if (hasExercise) intensity = 1;
      days.push({ date: d, intensity });
    }
    return days;
  };

  const heatmapDays = generateHeatmap();
  const pr =
    data.plankSessions.length > 0
      ? Math.max(...data.plankSessions.map((s) => s.durationSeconds))
      : 0;

  const totalSessions = data.plankSessions.length + data.exerciseSessions.length;

  return (
    <div className="p-6 pt-10 space-y-6 pb-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold"
      >
        Seu Progresso
      </motion.h1>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Flame className="text-app-primary w-6 h-6 mb-2" />
          <div className="text-xl font-bold text-app-text">
            {data.currentStreak > 0 ? (
              <NumberTicker value={data.currentStreak} className="text-app-text" />
            ) : '0'}
          </div>
          <div className="text-[10px] text-app-textMuted uppercase tracking-wide mt-0.5">Streak</div>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Trophy className="text-app-primary w-6 h-6 mb-2" />
          <div className="text-xl font-bold text-app-text">
            {pr > 0 ? (
              <NumberTicker value={pr} className="text-app-text" />
            ) : '0'}
            <span className="text-xs text-app-textMuted ml-0.5">s</span>
          </div>
          <div className="text-[10px] text-app-textMuted uppercase tracking-wide mt-0.5">Recorde</div>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Activity className="text-app-secondary w-6 h-6 mb-2" />
          <div className="text-xl font-bold text-app-text">
            {totalSessions > 0 ? (
              <NumberTicker value={totalSessions} className="text-app-text" />
            ) : '0'}
          </div>
          <div className="text-[10px] text-app-textMuted uppercase tracking-wide mt-0.5">Sessões</div>
        </div>
      </motion.div>

      {/* Volume Cards with Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-4 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-app-textMuted" />
            <h2 className="text-sm font-semibold">Volume Total</h2>
          </div>
          <div className="flex bg-app-bg/50 p-0.5 rounded-lg">
            <button
              onClick={() => setVolumePeriod('week')}
              className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                volumePeriod === 'week'
                  ? 'bg-app-primary text-black'
                  : 'text-app-textMuted'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setVolumePeriod('month')}
              className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                volumePeriod === 'month'
                  ? 'bg-app-primary text-black'
                  : 'text-app-textMuted'
              }`}
            >
              Mês
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-app-bg/40 p-3 rounded-xl text-center">
            <div className="text-[10px] text-app-textMuted uppercase tracking-wide mb-1">Prancha</div>
            <div className="text-lg font-bold text-app-primary">
              {volume.plankSeconds > 0 ? (
                <>
                  <NumberTicker value={Math.floor(volume.plankSeconds / 60)} className="text-app-primary" />
                  <span className="text-xs text-app-textMuted ml-0.5">m</span>
                  <span className="text-sm text-app-textMuted ml-1">
                    {volume.plankSeconds % 60}s
                  </span>
                </>
              ) : '0m 0s'}
            </div>
          </div>
          <div className="bg-app-bg/40 p-3 rounded-xl text-center">
            <div className="text-[10px] text-app-textMuted uppercase tracking-wide mb-1">Repetições</div>
            <div className="text-lg font-bold text-app-secondary">
              {volume.exerciseReps > 0 ? (
                <NumberTicker value={volume.exerciseReps} className="text-app-secondary" />
              ) : '0'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-4 rounded-2xl"
      >
        <h2 className="text-sm font-semibold mb-5 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-app-textMuted" />
          Evolução da Prancha
        </h2>
        <div className="h-48 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#4B5563"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#4B5563"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(26, 26, 36, 0.95)',
                    border: '1px solid rgba(42, 42, 58, 0.6)',
                    borderRadius: '10px',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                  itemStyle={{ color: '#F59E0B' }}
                  labelStyle={{ color: '#9CA3AF', fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="tempo"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#F97316', stroke: '#F59E0B', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-app-textMuted text-sm">
              Nenhum dado de prancha ainda.
            </div>
          )}
        </div>
      </motion.div>

      {/* Radar Chart — Muscle Balance */}
      {radarData.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-4 rounded-2xl"
        >
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-app-textMuted" />
            Equilíbrio Muscular
          </h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="rgba(42, 42, 58, 0.5)" />
                <PolarAngleAxis
                  dataKey="muscle"
                  tick={{ fill: '#9CA3AF', fontSize: 9 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="value"
                  stroke="#14B8A6"
                  fill="#14B8A6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-4 rounded-2xl"
      >
        <h2 className="text-sm font-semibold mb-4">
          Consistência (Últimos 28 dias)
        </h2>
        <div className="grid grid-cols-7 gap-[6px]">
          {heatmapDays.map((day, i) => {
            let bg = 'bg-app-bg/60 border border-app-border/30';
            if (day.intensity === 1)
              bg = 'bg-app-secondary/25 border border-app-secondary/30';
            if (day.intensity === 2)
              bg = 'bg-app-primary/35 border border-app-primary/40';
            if (day.intensity === 3)
              bg = 'bg-app-primary border border-app-primary shadow-sm shadow-app-primary/20';
            return (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.01 }}
                className={`aspect-square rounded-[5px] ${bg}`}
                title={day.date.toLocaleDateString('pt-BR')}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 text-[9px] text-app-textMuted">
          <span>Menos</span>
          <div className="w-3 h-3 rounded-sm bg-app-bg/60 border border-app-border/30" />
          <div className="w-3 h-3 rounded-sm bg-app-secondary/25" />
          <div className="w-3 h-3 rounded-sm bg-app-primary/35" />
          <div className="w-3 h-3 rounded-sm bg-app-primary" />
          <span>Mais</span>
        </div>
      </motion.div>
    </div>
  );
}
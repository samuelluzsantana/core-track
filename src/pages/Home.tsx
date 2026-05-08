import React, { useEffect, useState } from 'react';
import { Flame, Timer, Dumbbell, ChevronRight, Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAppData, getWeeklyVolume, getTotalSessions, initLombarLevel } from '../utils/storage';
import { getRandomTip } from '../utils/exerciseApi';
import { calculateIPC, IPCResult } from '../utils/ipcAlgorithm';
import { AppData } from '../types';
import { NumberTicker } from '../components/ui/NumberTicker';
import GlassIcons from '../components/ui/GlassIcons';

const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className={`bg-app-card/60 backdrop-blur-xl border border-white/5 rounded-4xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ${className}`}
  >
    {children}
  </motion.div>
);

const ProgressRing = ({ percentage }: { percentage: number }) => {
  const strokeWidth = 8;
  const radius = 54 / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width="54" height="54">
      <circle
        cx="27"
        cy="27"
        r={radius}
        stroke="url(#ipc-gradient)"
        strokeWidth={strokeWidth}
        fill="none"
        style={{ strokeDasharray: `${circumference}px ${circumference}px`, strokeDashoffset: `${circumference - (percentage / 100) * circumference}px` }}
      />
      <defs>
        <linearGradient id="ipc-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
    </svg>
  );
};


const Home: React.FC = () => {
  const userName = "Usuário"; // Mock data
  const streak = 5; // Mock data
  const ipcScore = 88; // Mock data
  const navigate = useNavigate();
  const [data, setData] = useState<AppData | null>(null);
  const [volume, setVolume] = useState({ plankSeconds: 0, exerciseReps: 0 });
  const [totalSessions, setTotalSessions] = useState(0);
  const [tip, setTip] = useState<{ exerciseName: string; tip: string } | null>(null);
  const [ipc, setIpc] = useState<IPCResult | null>(null);

  useEffect(() => {
    initLombarLevel();
    const appData = getAppData();
    setData(appData);
    setVolume(getWeeklyVolume());
    setTotalSessions(getTotalSessions());
    setTip(getRandomTip());
    setIpc(calculateIPC(appData));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (!data) return null;

  const isHighPain = data.profile?.painLevel && data.profile.painLevel >= 7;

  const glassItems = [
    {
      icon: <Timer className="w-full h-full" />,
      color: 'amber',
      label: 'Prancha',
      onClick: () => navigate('/plank'),
    },
    {
      icon: <Dumbbell className="w-full h-full" />,
      color: 'teal',
      label: isHighPain ? 'Mobilidade' : 'Core',
      onClick: () => navigate('/exercises'),
    },
  ];

  return (
    <div className="relative min-h-screen w-full max-w-[430px] mx-auto p-6 flex flex-col gap-8 overflow-hidden bg-app-bg pb-24">
      {/* Ambient Orbs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-app-primary/20 rounded-full filter blur-[100px] opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-app-secondary/20 rounded-full filter blur-[100px] opacity-50 animate-pulse pointer-events-none"></div>

      {/* Header */}
      <header className="z-10 mt-6 relative">
        <h1 className="text-3xl font-bold">{getGreeting()}, {userName}</h1>
        <div className="flex items-center gap-2 mt-2 text-app-primary">
          <Flame size={18} />
          <span className="font-semibold text-sm tracking-wide">STREAK DE {streak} DIAS</span>
        </div>
      </header>

      {/* IPC Card */}
      <GlassCard className="p-8 flex flex-col items-center text-center z-10 relative">
        <h2 className="text-xs font-semibold tracking-widest text-app-textMuted uppercase mb-2">ÍNDICE DE PRONTIDÃO DO CORE</h2>
        <div className="relative my-6">
          <ProgressRing percentage={ipcScore} />
          <motion.div 
            className="absolute inset-0 flex items-center justify-center text-5xl font-extrabold"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 }}
          >
            {ipcScore}
          </motion.div>
        </div>
        <p className="font-semibold text-lg">Seu core está <span className="text-app-primary font-bold">pronto e forte</span>.</p>
        <p className="text-sm text-app-textMuted mt-2 max-w-[80%] mx-auto leading-relaxed">Pode aumentar a intensidade hoje.</p>
      </GlassCard>

      {/* Action Cards */}
      <div className="z-10 grid grid-cols-2 gap-4 relative">
        <GlassCard className="p-6 flex flex-col items-center justify-center aspect-square hover:border-app-primary/50 transition-colors duration-300 group cursor-pointer">
          <div className="p-3 bg-app-primary/10 rounded-full group-hover:bg-app-primary/20 transition-colors duration-300 mb-3">
            <Zap size={28} className="text-app-primary" />
          </div>
          <h3 className="font-bold text-center">Prancha Diária</h3>
          <p className="text-xs text-app-textMuted mt-1">Meta: 2min 30s</p>
        </GlassCard>
        
        <GlassCard className="p-6 flex flex-col items-center justify-center aspect-square hover:border-app-secondary/50 transition-colors duration-300 group cursor-pointer">
          <div className="p-3 bg-app-secondary/10 rounded-full group-hover:bg-app-secondary/20 transition-colors duration-300 mb-3">
            <Droplets size={28} className="text-app-secondary" />
          </div>
          <h3 className="font-bold text-center">Exercícios</h3>
          <p className="text-xs text-app-textMuted mt-1">Foco: Mobilidade</p>
        </GlassCard>
      </div>
      
      {/* Weekly Summary */}
       <GlassCard className="p-6 z-10 relative mb-safe">
         <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm uppercase tracking-wider text-app-textMuted">Resumo da Semana</h3>
            <ShieldCheck size={20} className="text-app-secondary opacity-80"/>
         </div>
         <div className="mt-5 flex justify-between items-baseline">
            <div>
                <p className="text-[10px] text-app-textMuted uppercase tracking-widest mb-1">Volume Total</p>
                <p className="text-3xl font-extrabold">45<span className="text-sm font-medium text-app-textMuted ml-1">min</span></p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-app-textMuted uppercase tracking-widest mb-1">Sessões</p>
                <p className="text-3xl font-extrabold">4<span className="text-xl font-medium text-app-textMuted">/5</span></p>
            </div>
         </div>
       </GlassCard>
    </div>
  );
};

export function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState<AppData | null>(null);
  const [volume, setVolume] = useState({ plankSeconds: 0, exerciseReps: 0 });
  const [totalSessions, setTotalSessions] = useState(0);
  const [tip, setTip] = useState<{ exerciseName: string; tip: string } | null>(null);
  const [ipc, setIpc] = useState<IPCResult | null>(null);

  useEffect(() => {
    initLombarLevel();
    const appData = getAppData();
    setData(appData);
    setVolume(getWeeklyVolume());
    setTotalSessions(getTotalSessions());
    setTip(getRandomTip());
    setIpc(calculateIPC(appData));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (!data) return null;

  const isHighPain = data.profile?.painLevel && data.profile.painLevel >= 7;

  const glassItems = [
    {
      icon: <Timer className="w-full h-full" />,
      color: 'amber',
      label: 'Prancha',
      onClick: () => navigate('/plank'),
    },
    {
      icon: <Dumbbell className="w-full h-full" />,
      color: 'teal',
      label: isHighPain ? 'Mobilidade' : 'Core',
      onClick: () => navigate('/exercises'),
    },
  ];

  return (
    <div className="p-6 pt-12 space-y-8 relative">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-2xl font-bold text-app-text">
            {getGreeting()}!
          </h1>
          <p className="text-app-textMuted text-sm mt-1">
            Pronto para fortalecer o core?
          </p>
        </div>

        {/* Streak Badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex flex-col items-center glass-card rounded-2xl p-3 min-w-[68px] ${
            data.currentStreak > 0 ? 'glow-amber' : ''
          }`}
        >
          <Flame
            className={`w-7 h-7 ${
              data.currentStreak > 0
                ? 'text-app-primary animate-pulse-slow'
                : 'text-app-textMuted'
            }`}
          />
          <span className="text-lg font-bold mt-1">
            {data.currentStreak > 0 ? (
              <NumberTicker value={data.currentStreak} className="text-app-text" />
            ) : (
              '0'
            )}
          </span>
          <span className="text-[9px] text-app-textMuted font-medium">STREAK</span>
        </motion.div>
      </motion.header>

      {/* Quick Action — GlassIcons */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="text-base font-semibold mb-5 text-app-textMuted uppercase tracking-wider text-[11px]">
          Treino Rápido
        </h2>
        <GlassIcons items={glassItems} className="justify-center gap-12" />
      </motion.section>

      {/* Workout Cards */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-base font-semibold mb-3 text-app-textMuted uppercase tracking-wider text-[11px]">
          Treino Sugerido
        </h2>

        <button
          onClick={() => navigate('/plank')}
          className="w-full glass-card p-4 rounded-2xl flex items-center gap-4 hover:border-app-primary/50 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-app-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-app-primary/20 transition-colors">
            <Timer className="text-app-primary w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-app-text">Prancha Diária</h3>
            <p className="text-xs text-app-textMuted mt-0.5">
              Mantenha a consistência
            </p>
          </div>
          <ChevronRight className="text-app-textMuted w-5 h-5 group-hover:text-app-primary transition-colors" />
        </button>

        <button
          onClick={() => navigate('/exercises')}
          className="w-full glass-card p-4 rounded-2xl flex items-center gap-4 hover:border-app-secondary/50 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-app-secondary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-app-secondary/20 transition-colors">
            <Dumbbell className="text-app-secondary w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-app-text">
              {isHighPain ? 'Mobilidade Lombar' : 'Fortalecimento Core'}
            </h3>
            <p className="text-xs text-app-textMuted mt-0.5">
              {isHighPain ? 'Foco em alívio de dor' : 'Séries e repetições'}
            </p>
          </div>
          <ChevronRight className="text-app-textMuted w-5 h-5 group-hover:text-app-secondary transition-colors" />
        </button>
      </motion.section>

      {/* Weekly Summary */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-base font-semibold mb-3 text-app-textMuted uppercase tracking-wider text-[11px]">
          Resumo da Semana
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4 rounded-2xl text-center">
            <div className="text-app-textMuted text-[10px] mb-2 uppercase tracking-wide">Prancha</div>
            <div className="text-xl font-bold text-app-primary">
              {volume.plankSeconds > 0 ? (
                <NumberTicker value={Math.floor(volume.plankSeconds / 60)} className="text-app-primary" />
              ) : '0'}
              <span className="text-xs text-app-textMuted ml-0.5">m</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl text-center">
            <div className="text-app-textMuted text-[10px] mb-2 uppercase tracking-wide">Reps</div>
            <div className="text-xl font-bold text-app-secondary">
              {volume.exerciseReps > 0 ? (
                <NumberTicker value={volume.exerciseReps} className="text-app-secondary" />
              ) : '0'}
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl text-center">
            <div className="text-app-textMuted text-[10px] mb-2 uppercase tracking-wide">Sessões</div>
            <div className="text-xl font-bold text-app-text">
              {totalSessions > 0 ? (
                <NumberTicker value={totalSessions} className="text-app-text" />
              ) : '0'}
            </div>
          </div>
        </div>
      </motion.section>

      {/* IPC Readiness Card */}
      {ipc && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <h2 className="text-base font-semibold mb-3 text-app-textMuted uppercase tracking-wider text-[11px]">
            Prontidão do Core
          </h2>
          <button
            onClick={() => navigate('/settings')}
            className="w-full glass-card p-4 rounded-2xl flex items-center gap-4 text-left group hover:border-opacity-50 transition-all"
            style={{ borderColor: `${ipc.color}30` }}
          >
            <span className="text-2xl">{ipc.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-app-text text-sm">{ipc.label}</div>
              <div className="text-xs text-app-textMuted mt-0.5 line-clamp-1">{ipc.description}</div>
              {/* Mini progress bar */}
              <div className="h-1 bg-app-bg/50 rounded-full mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(ipc.components.ipc * 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: ipc.color }}
                />
              </div>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <span className="text-xl font-bold" style={{ color: ipc.color }}>
                {Math.round(ipc.components.ipc * 100)}%
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-app-textMuted group-hover:text-app-text transition-colors mt-1" />
            </div>
          </button>
        </motion.section>
      )}

      {/* Daily Tip */}
      {tip && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-app-primary" />
              <span className="text-[10px] uppercase tracking-wider text-app-textMuted font-semibold">
                Dica do Dia — {tip.exerciseName}
              </span>
            </div>
            <p className="text-sm text-app-text/90 leading-relaxed">
              {tip.tip}
            </p>
          </div>
        </motion.section>
      )}
    </div>
  );
}
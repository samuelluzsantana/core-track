import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, TrendingUp, Info, Zap, Droplets, ShieldCheck, Flame } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { TopBar } from '../components/TopBar';
import { NumberTicker } from '../components/ui/NumberTicker';
import GlassIcons from '../components/ui/GlassIcons';
import { AppData } from '../types';
import { calculateIPC, IPCResult } from '../utils/ipcAlgorithm';
import { getAppData, getWeeklyVolume, getTotalSessions, initLombarLevel } from '../utils/storage';
import { getRandomTip } from '../utils/exerciseApi';
import { useAuth } from '../hooks/useAuth';

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

export default function Home() {
  const navigate = useNavigate();
  const userName = "Usuário"; // Mock data
  const streak = 5; // Mock data
  const ipcScore = 88; // Mock data
  const { user } = useAuth();
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
}
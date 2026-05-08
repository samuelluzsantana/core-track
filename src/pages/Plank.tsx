import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Pause, RotateCcw, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getTargetPlankTime,
  getPersonalRecord,
  addPlankSession,
  updatePlankFeedback,
} from '../utils/storage';
import { FeedbackModal } from '../components/FeedbackModal';
import { AnimatedChecklist, ChecklistItem } from '../components/ui/AnimatedChecklist';
import { NumberTicker } from '../components/ui/NumberTicker';
import { Feedback } from '../types';

const POSTURE_CHECKLIST: Omit<ChecklistItem, 'checked'>[] = [
  { id: 'p1', label: 'Cotovelos alinhados com os ombros' },
  { id: 'p2', label: 'Core ativado, umbigo para dentro' },
  { id: 'p3', label: 'Coluna neutra — sem curvar a lombar' },
  { id: 'p4', label: 'Glúteos contraídos' },
  { id: 'p5', label: 'Respiração controlada e contínua' },
];

export function Plank() {
  const [mode, setMode] = useState<'livre' | 'progressao'>('progressao');
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    POSTURE_CHECKLIST.map((item) => ({ ...item, checked: false }))
  );
  const targetTime = getTargetPlankTime();
  const pr = getPersonalRecord();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTime(0);
    setIsFinished(false);
    setShowChecklist(true);
    setChecklistItems(POSTURE_CHECKLIST.map((item) => ({ ...item, checked: false })));
  };

  const stopTimer = () => {
    setIsActive(false);
    setIsFinished(true);
    const id = addPlankSession({
      date: new Date().toISOString(),
      mode,
      durationSeconds: time,
    });
    setSessionId(id);
    setTimeout(() => setShowFeedback(true), 1500);
  };

  const handleFeedback = (feedback: Feedback) => {
    if (sessionId) {
      updatePlankFeedback(sessionId, feedback);
    }
    if (feedback === 'dorAguda') {
      alert(
        'Recomendamos descansar e focar apenas em exercícios de mobilidade nos próximos dias.'
      );
    }
  };

  const handleChecklistToggle = (id: string, checked: boolean) => {
    setChecklistItems((items) =>
      items.map((item) => (item.id === id ? { ...item, checked } : item))
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress =
    mode === 'progressao' ? Math.min((time / targetTime) * 100, 100) : 0;
  const isTargetReached = mode === 'progressao' && time >= targetTime;
  const isNewPR = time > pr && pr > 0;

  return (
    <div className="p-6 pt-10 flex flex-col h-full relative">
      {/* Mode Toggle */}
      <div className="flex glass-card p-1 rounded-xl mb-6">
        <button
          onClick={() => {
            setMode('progressao');
            resetTimer();
          }}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            mode === 'progressao'
              ? 'bg-app-primary text-black shadow-lg'
              : 'text-app-textMuted hover:text-app-text'
          }`}
        >
          Progressão
        </button>
        <button
          onClick={() => {
            setMode('livre');
            resetTimer();
          }}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            mode === 'livre'
              ? 'bg-app-primary text-black shadow-lg'
              : 'text-app-textMuted hover:text-app-text'
          }`}
        >
          Livre
        </button>
      </div>

      {/* PR display */}
      {pr > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <Trophy className="w-4 h-4 text-app-primary" />
          <span className="text-xs text-app-textMuted">
            Recorde: <span className="text-app-primary font-semibold">{formatTime(pr)}</span>
          </span>
        </motion.div>
      )}

      {/* Posture Checklist (collapsible) */}
      <AnimatePresence>
        {!isActive && !isFinished && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <button
              onClick={() => setShowChecklist(!showChecklist)}
              className="flex items-center justify-between w-full mb-3"
            >
              <span className="text-[11px] uppercase tracking-wider text-app-textMuted font-semibold">
                ✅ Postura antes de iniciar
              </span>
              {showChecklist ? (
                <ChevronUp className="w-4 h-4 text-app-textMuted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-app-textMuted" />
              )}
            </button>
            {showChecklist && (
              <AnimatedChecklist
                items={checklistItems}
                onToggle={handleChecklistToggle}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Circular Timer */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className={`relative w-64 h-64 flex items-center justify-center ${isActive ? 'timer-glow-active' : ''}`}>
          {mode === 'progressao' && (
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              {/* Background ring */}
              <circle
                cx="128"
                cy="128"
                r="120"
                className="fill-none"
                stroke="rgba(42, 42, 58, 0.5)"
                strokeWidth="8"
              />
              {/* Progress ring */}
              <motion.circle
                cx="128"
                cy="128"
                r="120"
                className="fill-none"
                stroke="url(#timerGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 1000' }}
                animate={{
                  strokeDasharray: `${(progress / 100) * (2 * Math.PI * 120)} 1000`,
                }}
                transition={{ duration: 0.5 }}
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
              </defs>
            </svg>
          )}

          {/* Free mode ring */}
          {mode === 'livre' && (
            <svg className="absolute inset-0 w-full h-full">
              <circle
                cx="128"
                cy="128"
                r="120"
                className="fill-none"
                stroke="rgba(42, 42, 58, 0.3)"
                strokeWidth="6"
                strokeDasharray="4 8"
              />
            </svg>
          )}

          <div className="text-center z-10">
            <div className="text-6xl font-bold font-mono tracking-tighter text-app-text">
              {formatTime(time)}
            </div>
            {mode === 'progressao' && (
              <div className="text-app-textMuted mt-2 text-sm">
                Alvo: {formatTime(targetTime)}
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        <div className="h-16 mt-6 flex items-center justify-center">
          {isFinished ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              {isNewPR ? (
                <div className="flex items-center gap-2 text-app-primary font-bold text-lg">
                  <Trophy className="w-6 h-6" /> Novo Recorde Pessoal!
                </div>
              ) : (
                <div className="text-app-textMuted">Treino Finalizado — <span className="text-app-text font-semibold">{formatTime(time)}</span></div>
              )}
            </motion.div>
          ) : isTargetReached && !isFinished ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-app-primary font-bold flex items-center gap-2 text-lg"
            >
              <Trophy className="w-6 h-6" /> Meta Atingida!
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-5 mt-auto pb-4">
        {!isActive && time > 0 && !isFinished && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={resetTimer}
            className="w-14 h-14 rounded-full glass-card flex items-center justify-center text-app-textMuted hover:text-app-text transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>
        )}

        {!isFinished && (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isActive
                ? 'glass-card border-2 border-app-primary text-app-primary'
                : 'bg-gradient-to-br from-amber-500 to-orange-500 text-black'
            }`}
          >
            {isActive ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </motion.button>
        )}

        {(isActive || (!isActive && time > 0 && !isFinished)) && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={stopTimer}
            className="w-14 h-14 rounded-full glass-card border border-app-danger/50 flex items-center justify-center text-app-danger hover:bg-app-danger/10 transition-colors"
          >
            <Square className="w-5 h-5 fill-current" />
          </motion.button>
        )}
      </div>

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedback}
      />
    </div>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Target,
  Zap,
  ChevronRight,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { saveProfile } from '../utils/storage';
import { PainLevel, Objective, ExperienceLevel } from '../types';

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [painLevel, setPainLevel] = useState<PainLevel>(1);
  const [objective, setObjective] = useState<Objective>('fortalecimento');
  const [experience, setExperience] = useState<ExperienceLevel>('iniciante');

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      saveProfile({
        painLevel,
        objective,
        experienceLevel: experience,
        onboardingCompleted: true,
      });
      navigate('/');
    }
  };

  const getPainColor = () => {
    if (painLevel <= 3) return 'text-green-400';
    if (painLevel <= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  const getPainEmoji = () => {
    if (painLevel <= 3) return '😊';
    if (painLevel <= 6) return '😐';
    return '😣';
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1">
        <div className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center mb-6">
          <Activity className="text-app-primary w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          Qual seu nível de dor lombar?
        </h2>
        <p className="text-app-textMuted mb-8 text-sm">
          Isso nos ajuda a adaptar os exercícios com segurança.
        </p>

        <div className="glass-card p-6 rounded-2xl">
          <div className="text-center mb-6">
            <span className="text-3xl mr-2">{getPainEmoji()}</span>
            <span className={`text-5xl font-bold ${getPainColor()}`}>
              {painLevel}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={painLevel}
            onChange={(e) => setPainLevel(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-app-textMuted mt-3 uppercase tracking-wide">
            <span>Sem dor</span>
            <span>Dor extrema</span>
          </div>
        </div>

        {painLevel >= 7 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-app-danger/10 border border-app-danger/20 rounded-xl flex items-start gap-3"
          >
            <AlertTriangle className="text-app-danger w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm text-app-danger/90">
              Com dor alta, focaremos apenas em exercícios de mobilidade e
              alívio. Consulte um médico se a dor persistir.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const objectives = [
    {
      id: 'alivio',
      label: 'Alívio de dor',
      desc: 'Foco em mobilidade e estabilização',
      icon: Shield,
      gradient: 'from-green-500/20 to-emerald-500/20',
    },
    {
      id: 'fortalecimento',
      label: 'Fortalecimento',
      desc: 'Progressão gradual de carga',
      icon: Target,
      gradient: 'from-amber-500/20 to-orange-500/20',
    },
    {
      id: 'performance',
      label: 'Performance',
      desc: 'Progressão acelerada e métricas',
      icon: Zap,
      gradient: 'from-cyan-500/20 to-teal-500/20',
    },
  ];

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1">
        <div className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center mb-6">
          <Target className="text-app-primary w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          Qual seu objetivo principal?
        </h2>
        <p className="text-app-textMuted mb-8 text-sm">
          Personalizaremos seu plano com base nisso.
        </p>

        <div className="space-y-3">
          {objectives.map((opt) => {
            const Icon = opt.icon;
            const isSelected = objective === opt.id;
            return (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setObjective(opt.id as Objective)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                  isSelected
                    ? 'glass-card border-app-primary/50 glow-amber'
                    : 'glass-card-light hover:border-app-textMuted/30'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-app-primary' : 'text-app-textMuted'}`} />
                </div>
                <div>
                  <div className="font-semibold text-app-text">{opt.label}</div>
                  <div className="text-xs text-app-textMuted mt-0.5">{opt.desc}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  const levels = [
    {
      id: 'iniciante',
      label: 'Iniciante',
      desc: '+5s por evolução',
      detail: 'Ideal para quem está começando',
    },
    {
      id: 'moderado',
      label: 'Moderado',
      desc: '+10s por evolução',
      detail: 'Alguma experiência com core',
    },
    {
      id: 'avancado',
      label: 'Avançado',
      desc: '+15s por evolução',
      detail: 'Experiência consistente com prancha',
    },
  ];

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1">
        <div className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center mb-6">
          <Zap className="text-app-primary w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          Qual sua experiência com prancha?
        </h2>
        <p className="text-app-textMuted mb-8 text-sm">
          Define o ritmo de evolução do seu tempo.
        </p>

        <div className="space-y-3">
          {levels.map((opt) => {
            const isSelected = experience === opt.id;
            return (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setExperience(opt.id as ExperienceLevel)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'glass-card border-app-primary/50 glow-amber'
                    : 'glass-card-light hover:border-app-textMuted/30'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-app-text">{opt.label}</div>
                  <span className="text-xs font-mono text-app-primary bg-app-primary/10 px-2 py-0.5 rounded-md">
                    {opt.desc}
                  </span>
                </div>
                <div className="text-xs text-app-textMuted mt-1">{opt.detail}</div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col max-w-[430px] mx-auto w-full relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="ambient-orb ambient-orb-amber w-72 h-72 -top-24 -right-24" />
      <div className="ambient-orb ambient-orb-teal w-56 h-56 bottom-24 -left-20" />

      {/* Progress bar */}
      <div className="px-6 pt-12 pb-6 flex gap-2 relative z-10">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i <= step ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-app-border/50'
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>

      <div className="flex-1 px-6 pb-24 overflow-y-auto no-scrollbar relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-app-bg via-app-bg/95 to-transparent z-20">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          {step === 3 ? 'Começar' : 'Continuar'}
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
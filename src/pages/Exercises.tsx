import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, X, Check, Info, ChevronRight } from 'lucide-react';
import {
  getAppData,
  addExerciseSession,
  updateExerciseFeedback,
} from '../utils/storage';
import { getFilteredStaticExercises } from '../utils/exerciseApi';
import { FeedbackModal } from '../components/FeedbackModal';
import { AnimatedChecklist, ChecklistItem } from '../components/ui/AnimatedChecklist';
import { ExerciseDef, Feedback, SafetyLevel } from '../types';

function SafetyBadge({ level }: { level: SafetyLevel }) {
  const config: Record<SafetyLevel, { emoji: string; text: string; cls: string }> = {
    mobilidade: { emoji: '🟢', text: 'Mobilidade', cls: 'safety-mobilidade' },
    baixoImpacto: { emoji: '🟡', text: 'Baixo Impacto', cls: 'safety-baixo' },
    medioImpacto: { emoji: '🔴', text: 'Médio Impacto', cls: 'safety-medio' },
  };
  const c = config[level];
  return (
    <span className={`safety-badge ${c.cls}`}>
      {c.emoji} {c.text}
    </span>
  );
}

export function Exercises() {
  const [painLevel, setPainLevel] = useState(1);
  const [exercises, setExercises] = useState<ExerciseDef[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDef | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [instructionChecklist, setInstructionChecklist] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    const data = getAppData();
    const pl = data.profile?.painLevel || 1;
    setPainLevel(pl);
    setExercises(getFilteredStaticExercises(pl));
  }, []);

  const isHighPain = painLevel >= 7;

  const handleSelectExercise = (ex: ExerciseDef) => {
    setSelectedExercise(ex);
    setShowDetail(false);
    // Build instruction checklist from exercise data
    if (ex.instructions && ex.instructions.length > 0) {
      setInstructionChecklist(
        ex.instructions.map((inst, i) => ({
          id: `inst-${i}`,
          label: inst,
          checked: false,
        }))
      );
    } else {
      setInstructionChecklist([]);
    }
  };

  const handleInstructionToggle = (id: string, checked: boolean) => {
    setInstructionChecklist((items) =>
      items.map((item) => (item.id === id ? { ...item, checked } : item))
    );
  };

  const handleSave = () => {
    if (!selectedExercise) return;
    const id = addExerciseSession({
      date: new Date().toISOString(),
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      targetMuscles: selectedExercise.targetMuscles,
      sets,
      reps,
    });
    setLastSessionId(id);
    setSelectedExercise(null);
    setTimeout(() => setShowFeedback(true), 300);
  };

  const handleFeedback = (feedback: Feedback) => {
    if (lastSessionId) {
      updateExerciseFeedback(lastSessionId, feedback);
    }
  };

  return (
    <div className="p-6 pt-10 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold mb-1">Exercícios Core</h1>
        <p className="text-app-textMuted text-sm mb-6">
          {isHighPain
            ? '⚠️ Mostrando apenas exercícios seguros para seu nível de dor.'
            : 'Selecione um exercício para registrar.'}
        </p>
      </motion.div>

      <div className="space-y-3">
        {exercises.map((ex, index) => {
          const isLocked = isHighPain && ex.safetyLevel === 'medioImpacto';
          return (
            <motion.button
              key={ex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              disabled={isLocked}
              onClick={() => handleSelectExercise(ex)}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 ${
                isLocked
                  ? 'glass-card-light opacity-50 cursor-not-allowed'
                  : 'glass-card hover:border-app-secondary/50'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isLocked
                    ? 'bg-app-bg/50 text-app-textMuted'
                    : 'bg-app-secondary/10 text-app-secondary'
                }`}
              >
                {isLocked ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-app-text text-sm">{ex.name}</h3>
                  <SafetyBadge level={ex.safetyLevel} />
                </div>
                <p className="text-xs text-app-textMuted mt-1">{ex.focus}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-app-textMuted shrink-0" />
            </motion.button>
          );
        })}
      </div>

      {/* Exercise Detail & Logging Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setSelectedExercise(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-app-card rounded-t-3xl p-6 pb-24 z-50 border-t border-app-border max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-app-text">
                      {selectedExercise.name}
                    </h3>
                    <SafetyBadge level={selectedExercise.safetyLevel} />
                  </div>
                  <p className="text-sm text-app-textMuted">
                    {selectedExercise.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="p-2 bg-app-bg rounded-full text-app-textMuted hover:text-app-text shrink-0 ml-3"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Target muscles */}
              {selectedExercise.targetMuscles && selectedExercise.targetMuscles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedExercise.targetMuscles.map((m) => (
                    <span
                      key={m}
                      className="text-[10px] px-2 py-1 rounded-full bg-app-secondary/10 text-app-secondary border border-app-secondary/20"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Instructions Checklist */}
              {instructionChecklist.length > 0 && (
                <div className="mb-5">
                  <button
                    onClick={() => setShowDetail(!showDetail)}
                    className="flex items-center gap-2 mb-3"
                  >
                    <Info className="w-4 h-4 text-app-primary" />
                    <span className="text-[11px] uppercase tracking-wider text-app-textMuted font-semibold">
                      Passo a passo
                    </span>
                  </button>
                  <AnimatedChecklist
                    items={instructionChecklist}
                    onToggle={handleInstructionToggle}
                  />
                </div>
              )}

              {/* Tips */}
              {selectedExercise.tips && selectedExercise.tips.length > 0 && (
                <div className="mb-5 p-3 rounded-xl bg-app-primary/5 border border-app-primary/10">
                  <span className="text-[10px] uppercase tracking-wider text-app-primary font-semibold">
                    💡 Dicas
                  </span>
                  <ul className="mt-2 space-y-1">
                    {selectedExercise.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-app-textMuted flex items-start gap-2">
                        <span className="text-app-primary mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sets & Reps */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-xs text-app-textMuted mb-2">Séries</div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSets(Math.max(1, sets - 1))}
                      className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-app-textMuted hover:text-app-text transition-colors text-lg"
                    >
                      −
                    </button>
                    <span className="text-2xl font-bold">{sets}</span>
                    <button
                      onClick={() => setSets(sets + 1)}
                      className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-app-textMuted hover:text-app-text transition-colors text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-xs text-app-textMuted mb-2">Repetições</div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setReps(Math.max(1, reps - 1))}
                      className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-app-textMuted hover:text-app-text transition-colors text-lg"
                    >
                      −
                    </button>
                    <span className="text-2xl font-bold">{reps}</span>
                    <button
                      onClick={() => setReps(reps + 1)}
                      className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center text-app-textMuted hover:text-app-text transition-colors text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg"
              >
                <Check className="w-5 h-5" />
                Salvar Treino
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedback}
      />
    </div>
  );
}
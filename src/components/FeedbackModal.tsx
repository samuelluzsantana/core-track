import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smile, Meh, AlertCircle, ShieldAlert } from 'lucide-react';
import { Feedback } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  exerciseName?: string;
  onClose: () => void;
  onSubmit: (feedback: Feedback) => void;
}

export function FeedbackModal({
  isOpen,
  exerciseName,
  onClose,
  onSubmit,
}: FeedbackModalProps) {
  const options: {
    id: Feedback;
    icon: React.ReactNode;
    label: string;
    desc: string;
    badgeClass: string;
  }[] = [
    {
      id: 'otimo',
      icon: <Smile className="w-5 h-5" />,
      label: 'Ótimo',
      desc: 'Execução firme, energia alta e sem incômodos.',
      badgeClass: 'bg-modality-mobility-soft text-modality-mobility border-modality-mobility-border',
    },
    {
      id: 'ok',
      icon: <Meh className="w-5 h-5" />,
      label: 'Ok',
      desc: 'Treino controlado e confortável dentro da meta.',
      badgeClass: 'bg-modality-reps-soft text-modality-reps border-modality-reps-border',
    },
    {
      id: 'desconforto',
      icon: <AlertCircle className="w-5 h-5" />,
      label: 'Desconforto',
      desc: 'Leve sobrecarga. Bloqueia alto impacto temporariamente.',
      badgeClass: 'bg-modality-time-soft text-modality-time border-modality-time-border',
    },
    {
      id: 'dorAguda',
      icon: <ShieldAlert className="w-5 h-5" />,
      label: 'Dor Aguda',
      desc: 'Ativa proteção imediata e restringe à mobilidade segura.',
      badgeClass: 'bg-modality-danger-soft text-modality-danger border-modality-danger-border',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 max-w-[460px] mx-auto bg-surface rounded-t-3xl p-6 z-50 border-t border-border-token shadow-elevated"
          >
            <div className="w-10 h-1 rounded-full bg-border-strong mx-auto mb-4" />
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-lg font-display font-bold text-ink">
                  Como você se sentiu?
                </h3>
                {exerciseName && (
                  <p className="text-xs text-ink-muted mt-0.5">
                    Calibrando o Motor Adaptativo após <strong className="text-ink-secondary">{exerciseName}</strong>
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-subtle rounded-full text-ink-muted hover:text-ink transition-colors"
                aria-label="Fechar feedback"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 pb-safe">
              {options.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onSubmit(opt.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-subtle/60 hover:bg-subtle border border-border-token transition-all text-left"
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${opt.badgeClass}`}>
                    {opt.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-ink">{opt.label}</div>
                    <div className="text-xs text-ink-muted leading-snug mt-0.5">
                      {opt.desc}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

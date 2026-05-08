import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Feedback } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: Feedback) => void;
}

export function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
}: FeedbackModalProps) {
  const options: {
    id: Feedback;
    emoji: string;
    label: string;
    desc: string;
  }[] = [
    {
      id: 'otimo',
      emoji: '😊',
      label: 'Ótimo',
      desc: 'Senti o core trabalhando bem',
    },
    {
      id: 'ok',
      emoji: '😐',
      label: 'Ok',
      desc: 'Foi tranquilo, sem problemas',
    },
    {
      id: 'desconforto',
      emoji: '😟',
      label: 'Desconforto',
      desc: 'Senti um leve incômodo',
    },
    {
      id: 'dorAguda',
      emoji: '🔴',
      label: 'Dor aguda',
      desc: 'Doeu as costas/lombar',
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-app-card rounded-t-3xl p-6 z-50 border-t border-app-border"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-app-text">
                Como você se sentiu?
              </h3>
              <button
                onClick={onClose}
                className="p-2 bg-app-bg rounded-full text-app-textMuted hover:text-app-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {options.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onSubmit(opt.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl glass-card hover:border-app-primary/40 transition-all text-left"
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <div>
                    <div className="font-semibold text-app-text">
                      {opt.label}
                    </div>
                    <div className="text-xs text-app-textMuted">{opt.desc}</div>
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
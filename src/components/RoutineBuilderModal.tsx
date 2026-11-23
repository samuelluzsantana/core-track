import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { CatalogExercise, WorkoutRoutineItem } from '../types';
import { useAppData } from '../contexts/AppDataContext';
import { ExerciseAvatar } from './ExerciseAvatar';
import { ExerciseMediaModal } from './ExerciseMediaModal';
import { MODALITY_LABELS } from '../data/seedCatalog';

interface RoutineBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoutineBuilderModal({ isOpen, onClose }: RoutineBuilderModalProps) {
  const { catalog, saveRoutine } = useAppData();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<WorkoutRoutineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<CatalogExercise | null>(null);

  const toggleExercise = (ex: CatalogExercise) => {
    const exists = selectedItems.some(
      (item) => item.catalogId === ex.id || item.exerciseName === ex.name
    );
    if (exists) {
      setSelectedItems((prev) =>
        prev.filter((item) => item.catalogId !== ex.id && item.exerciseName !== ex.name)
      );
      return;
    }

    const newItem: WorkoutRoutineItem = {
      id: `ri-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      catalogId: ex.id,
      externalId: ex.externalId || undefined,
      exerciseName: ex.name,
      measurementType: ex.measurementType,
      category: ex.category,
      impactLevel: ex.impactLevel,
      imageUrl: ex.imageUrls[0],
      targetSeconds: ex.defaultConfig.targetSeconds,
      sets: ex.defaultConfig.defaultSets,
      reps: ex.defaultConfig.defaultReps,
      rounds: ex.defaultConfig.rounds,
      workSeconds: ex.defaultConfig.workSeconds,
      restSeconds: ex.defaultConfig.restSeconds,
    };
    setSelectedItems((prev) => [...prev, newItem]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedItems.length === 0) return;
    setSaving(true);
    try {
      await saveRoutine({
        name: name.trim(),
        description: description.trim() || `${selectedItems.length} exercícios híbridos`,
        category: 'hybrid',
        accentColor: 'indigo',
        items: selectedItems,
        isFavorite: false,
      });
      setName('');
      setDescription('');
      setSelectedItems([]);
      onClose();
    } finally {
      setSaving(false);
    }
  };

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
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="fixed inset-x-0 bottom-0 max-w-[460px] mx-auto bg-canvas rounded-t-3xl z-50 border-t border-border-token shadow-elevated flex flex-col max-h-[88vh]"
          >
            <div className="px-5 py-4 bg-surface rounded-t-3xl border-b border-border-token flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-ink">
                Nova Rotina Híbrida
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-subtle text-ink-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar pb-safe"
            >
              <div>
                <label className="text-xs font-semibold text-ink-secondary block mb-1.5">
                  Nome da Rotina *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Manhã Core + Pular Corda"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-token text-sm text-ink outline-none focus:border-modality-cardio"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-secondary block mb-1.5">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Ativação lombar seguida de cardio leve"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-token text-sm text-ink outline-none"
                />
              </div>

              {selectedItems.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
                    Sequência Selecionada ({selectedItems.length})
                  </div>
                  <div className="space-y-2">
                    {selectedItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="surface-card px-3 py-2.5 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-modality-cardio-soft text-modality-cardio text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-ink truncate">
                            {item.exerciseName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedItems((prev) =>
                              prev.filter((i) => i.id !== item.id)
                            )
                          }
                          className="text-ink-muted hover:text-modality-danger p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
                  Escolher Exercícios do Catálogo
                </div>
                <div className="surface-card rounded-2xl divide-y divide-border-token max-h-60 overflow-y-auto">
                  {catalog.map((ex) => {
                    const selected = selectedItems.some(
                      (i) => i.catalogId === ex.id || i.exerciseName === ex.name
                    );
                    return (
                      <div
                        key={ex.id}
                        className="p-3 flex items-center gap-3 hover:bg-surface-hover transition-colors"
                      >
                        <ExerciseAvatar
                          name={ex.name}
                          imageUrl={ex.imageUrls[0]}
                          measurementType={ex.measurementType}
                          themeColor={ex.themeColor}
                          iconName={ex.iconName}
                          size="sm"
                          onClick={() => setMediaPreview(ex)}
                        />
                        <button
                          type="button"
                          onClick={() => toggleExercise(ex)}
                          className="flex-1 min-w-0 flex items-center gap-3 text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-ink truncate">
                              {ex.name}
                            </div>
                            <div className="text-[11px] text-ink-muted">
                              {MODALITY_LABELS[ex.measurementType]}
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                              selected
                                ? 'bg-modality-cardio text-white border-modality-cardio'
                                : 'bg-subtle text-ink-muted border-border-token'
                            }`}
                          >
                            {selected ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !name.trim() || selectedItems.length === 0}
                className="w-full py-3.5 rounded-xl bg-modality-cardio text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Salvar Rotina
              </button>
            </form>
          </motion.div>

          <ExerciseMediaModal
            exercise={mediaPreview}
            onClose={() => setMediaPreview(null)}
          />
        </>
      )}
    </AnimatePresence>
  );
}

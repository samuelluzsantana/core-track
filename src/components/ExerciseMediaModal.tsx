import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Info,
  Dumbbell,
  Sparkles,
  Award,
} from 'lucide-react';
import { CatalogExercise } from '../types';
import { CATEGORY_LABELS, IMPACT_LABELS, MODALITY_LABELS } from '../data/seedCatalog';
import { ExerciseAvatar } from './ExerciseAvatar';

interface ExerciseMediaModalProps {
  exercise: CatalogExercise | null;
  initialPhotoIndex?: number;
  onClose: () => void;
  onStartTraining?: (exercise: CatalogExercise) => void;
}

const LEVEL_LABELS: Record<CatalogExercise['level'], string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
  expert: 'Avançado+',
};

export function ExerciseMediaModal({
  exercise,
  initialPhotoIndex = 0,
  onClose,
  onStartTraining,
}: ExerciseMediaModalProps) {
  const [photoIndex, setPhotoIndex] = useState(initialPhotoIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const images = exercise?.imageUrls ?? [];
  const totalImages = images.length;

  useEffect(() => {
    setPhotoIndex(
      totalImages > 0 ? Math.min(Math.max(0, initialPhotoIndex), totalImages - 1) : 0
    );
    setIsPlaying(false);
    setFailedImages({});
  }, [exercise?.id, exercise?.name, initialPhotoIndex, totalImages]);

  useEffect(() => {
    if (!exercise) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && totalImages > 1) {
        setIsPlaying(false);
        setPhotoIndex((prev) => (prev + 1) % totalImages);
      }
      if (e.key === 'ArrowLeft' && totalImages > 1) {
        setIsPlaying(false);
        setPhotoIndex((prev) => (prev - 1 + totalImages) % totalImages);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exercise, totalImages, onClose]);

  useEffect(() => {
    if (!isPlaying || totalImages <= 1) return;
    const timer = window.setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % totalImages);
    }, 1150);
    return () => window.clearInterval(timer);
  }, [isPlaying, totalImages]);

  const activeImage = images[photoIndex];
  const activeFailed = Boolean(failedImages[photoIndex]);

  return (
    <AnimatePresence>
      {exercise && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Visualizar exercício ${exercise.name}`}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative z-10 w-full max-w-[460px] max-h-[90vh] bg-surface rounded-3xl border border-border-token shadow-elevated flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-border-token flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-subtle text-ink-secondary">
                    {CATEGORY_LABELS[exercise.category] || exercise.category}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-subtle text-ink-secondary">
                    {MODALITY_LABELS[exercise.measurementType]}
                  </span>
                  <span className={`safety-badge safety-${exercise.impactLevel}`}>
                    {IMPACT_LABELS[exercise.impactLevel]}
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-lg text-ink leading-snug">
                  {exercise.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar visualização"
                className="p-2 rounded-full bg-subtle text-ink-muted hover:text-ink shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Stage + Technical Sheet */}
            <div className="overflow-y-auto no-scrollbar p-5 space-y-5">
              {/* Enlarged Photo Carousel */}
              {totalImages > 0 && !activeFailed ? (
                <div className="space-y-2.5">
                  <div className="relative aspect-[4/3] w-full rounded-2xl bg-white border border-border-token overflow-hidden flex items-center justify-center">
                    <img
                      src={activeImage}
                      alt={`${exercise.name} — foto ${photoIndex + 1} de ${totalImages}`}
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [photoIndex]: true }))
                      }
                      className="w-full h-full object-contain select-none"
                    />

                    {/* Top badges */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-slate-900/75 text-white text-[11px] font-semibold backdrop-blur-sm tabular-nums">
                      {totalImages === 2
                        ? photoIndex === 0
                          ? 'Posição 1 / 2'
                          : 'Execução 2 / 2'
                        : `Foto ${photoIndex + 1} / ${totalImages}`}
                    </div>

                    {totalImages > 1 && (
                      <button
                        type="button"
                        onClick={() => setIsPlaying((p) => !p)}
                        className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white text-[11px] font-semibold backdrop-blur-sm flex items-center gap-1 transition-colors"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3 h-3 fill-current" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            Animar poses
                          </>
                        )}
                      </button>
                    )}

                    {/* Left / Right arrows */}
                    {totalImages > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsPlaying(false);
                            setPhotoIndex((prev) => (prev - 1 + totalImages) % totalImages);
                          }}
                          aria-label="Foto anterior"
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/65 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsPlaying(false);
                            setPhotoIndex((prev) => (prev + 1) % totalImages);
                          }}
                          aria-label="Próxima foto"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/65 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails strip */}
                  {totalImages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      {images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setIsPlaying(false);
                            setPhotoIndex(idx);
                          }}
                          aria-label={`Ver foto ${idx + 1}`}
                          className={`w-16 h-12 rounded-xl overflow-hidden border bg-white transition-all ${
                            idx === photoIndex
                              ? 'border-modality-cardio ring-2 ring-modality-cardio/30'
                              : 'border-border-token opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`${exercise.name} miniatura ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-subtle border border-border-token py-7 px-4 flex flex-col items-center text-center gap-2.5">
                  <ExerciseAvatar
                    name={exercise.name}
                    measurementType={exercise.measurementType}
                    themeColor={exercise.themeColor}
                    iconName={exercise.iconName}
                    size="lg"
                  />
                  <p className="text-xs text-ink-muted">
                    Este exercício não possui fotos demonstrativas cadastradas.
                  </p>
                </div>
              )}

              {/* Equipment & Level */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-subtle border border-border-token flex items-center gap-2.5">
                  <Dumbbell className="w-4 h-4 text-modality-time shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-ink-muted">
                      Equipamento
                    </div>
                    <div className="text-xs font-semibold text-ink truncate capitalize">
                      {exercise.equipment || 'Peso corporal'}
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-subtle border border-border-token flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-modality-cardio shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-ink-muted">
                      Nível
                    </div>
                    <div className="text-xs font-semibold text-ink truncate">
                      {LEVEL_LABELS[exercise.level] || exercise.level}
                    </div>
                  </div>
                </div>
              </div>

              {/* Muscles */}
              {(exercise.primaryMuscles.length > 0 ||
                exercise.secondaryMuscles.length > 0) && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
                    Músculos Trabalhados
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.primaryMuscles.map((m) => (
                      <span
                        key={m}
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-modality-reps-soft text-modality-reps border border-modality-reps-border capitalize"
                      >
                        {m}
                      </span>
                    ))}
                    {exercise.secondaryMuscles.map((m) => (
                      <span
                        key={m}
                        className="text-[11px] px-2.5 py-0.5 rounded-full bg-subtle text-ink-secondary border border-border-token capitalize"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {exercise.instructions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
                    <Info className="w-3.5 h-3.5 text-modality-time" />
                    Execução Passo a Passo
                  </div>
                  <ol className="space-y-2 text-xs text-ink-secondary list-decimal pl-4 leading-relaxed">
                    {exercise.instructions.map((inst, idx) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tips */}
              {exercise.tips.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-modality-time-soft border border-modality-time-border space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-modality-time">
                    <Sparkles className="w-3.5 h-3.5" />
                    Dicas de Forma
                  </div>
                  <ul className="space-y-1 text-xs text-ink-secondary leading-relaxed">
                    {exercise.tips.map((tip, idx) => (
                      <li key={idx}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer Action */}
            {onStartTraining && (
              <div className="p-4 border-t border-border-token bg-canvas">
                <button
                  type="button"
                  onClick={() => onStartTraining(exercise)}
                  className="w-full py-3 rounded-xl bg-modality-time text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Treinar Este Exercício
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

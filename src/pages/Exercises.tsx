import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Lock,
  ChevronRight,
  X,
  Play,
  ClipboardList,
  Trash2,
  ShieldAlert,
  Info,
  Maximize2,
} from 'lucide-react';
import { Input } from '@heroui/input';
import { Tabs, Tab } from '@heroui/tabs';
import { useAppData } from '../contexts/AppDataContext';
import { CatalogExercise } from '../types';
import { getExerciseSafetyStatus, getExercisePR } from '../utils/ipcAlgorithm';
import { ExerciseAvatar } from '../components/ExerciseAvatar';
import { ExerciseMediaModal } from '../components/ExerciseMediaModal';
import { AddExerciseModal } from '../components/AddExerciseModal';
import { RoutineBuilderModal } from '../components/RoutineBuilderModal';
import { BlurFade } from '../components/ui/BlurFade';
import { MagicCard } from '../components/ui/MagicCard';
import { CATEGORY_LABELS, IMPACT_LABELS, MODALITY_LABELS } from '../data/seedCatalog';

export function Exercises() {
  const navigate = useNavigate();
  const {
    catalog,
    routines,
    logs,
    ipc,
    deleteCustomExercise,
    deleteRoutine,
  } = useAppData();

  const [viewMode, setViewMode] = useState<'catalog' | 'routines'>('catalog');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEx, setSelectedEx] = useState<CatalogExercise | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{
    exercise: CatalogExercise;
    index: number;
  } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab] = useState<'explore' | 'custom'>('explore');
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((ex) => {
      if (selectedCategory !== 'all' && ex.category !== selectedCategory) {
        return false;
      }
      if (
        q &&
        !ex.name.toLowerCase().includes(q) &&
        !ex.primaryMuscles.some((m) => m.toLowerCase().includes(q)) &&
        !(ex.equipment || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [catalog, search, selectedCategory]);

  const openAddModal = (tab: 'explore' | 'custom') => {
    setAddTab(tab);
    setShowAddModal(true);
  };

  return (
    <div className="px-5 pt-7 pb-8 space-y-5">
      {/* Top Header */}
      <BlurFade delay={0.02} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-ink tracking-tight">
            Biblioteca & Rotinas
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Core, força, mobilidade e cardio/HIIT unificados
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAddModal('explore')}
          className="px-3.5 py-2 rounded-xl bg-modality-cardio text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 hover:opacity-95 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </BlurFade>

      {/* HeroUI Tabs: Catálogo vs Rotinas */}
      <Tabs
        fullWidth
        aria-label="Modo de visualização da biblioteca"
        selectedKey={viewMode}
        onSelectionChange={(key) => setViewMode(key as 'catalog' | 'routines')}
        radius="lg"
        classNames={{
          tabList: 'bg-subtle p-1 border border-border-token',
          cursor: 'bg-surface shadow-sm',
          tab: 'h-9 text-xs font-bold',
          tabContent: 'group-data-[selected=true]:text-ink text-ink-muted',
        }}
      >
        <Tab key="catalog" title={`Exercícios (${catalog.length})`} />
        <Tab key="routines" title={`Rotinas (${routines.length})`} />
      </Tabs>

      {/* Adaptive Safety Banner */}
      {ipc.highImpactBlocked && (
        <div className="p-3.5 rounded-2xl bg-modality-danger-soft border border-modality-danger-border flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-modality-danger shrink-0 mt-0.5" />
          <p className="text-xs text-ink-secondary leading-relaxed">
            <strong className="text-modality-danger">Alto impacto bloqueado:</strong>{' '}
            {ipc.blockReason}
          </p>
        </div>
      )}

      {viewMode === 'catalog' ? (
        <>
          {/* HeroUI Search + Category Filter Pills */}
          <div className="space-y-3">
            <Input
              isClearable
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar exercício, músculo ou equipamento..."
              variant="bordered"
              radius="lg"
              startContent={<Search className="w-4 h-4 text-ink-muted shrink-0" />}
              classNames={{
                inputWrapper:
                  'bg-surface border-border-token hover:border-border-strong group-data-[focus=true]:border-modality-cardio',
                input: 'text-sm text-ink placeholder:text-ink-muted',
              }}
            />

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'core', label: 'Core & Lombar' },
                { id: 'cardio', label: 'Cardio & Corda' },
                { id: 'mobility', label: 'Mobilidade' },
                { id: 'strength', label: 'Força' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${selectedCategory === cat.id
                      ? 'bg-modality-cardio text-white border-modality-cardio'
                      : 'bg-surface text-ink-secondary border-border-token hover:bg-subtle'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise List (Ref Image 1 clean circular thumbnail list) */}
          <div className="surface-card rounded-2xl divide-y divide-border-token overflow-hidden">
            {filteredCatalog.map((ex) => {
              const safety = getExerciseSafetyStatus(ex, ipc, catalog);
              return (
                <div
                  key={ex.id}
                  className={`p-3.5 flex items-center gap-3.5 transition-colors ${safety.locked
                      ? 'opacity-65 bg-subtle/40 hover:bg-subtle/70'
                      : 'hover:bg-surface-hover'
                    }`}
                >
                  <ExerciseAvatar
                    name={ex.name}
                    imageUrl={ex.imageUrls[0]}
                    measurementType={ex.measurementType}
                    themeColor={ex.themeColor}
                    iconName={ex.iconName}
                    size="md"
                    onClick={() => setMediaPreview({ exercise: ex, index: 0 })}
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedEx(ex)}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-sm text-ink truncate">
                          {ex.name}
                        </h3>
                        {ex.isCustom && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-modality-cardio-soft text-modality-cardio">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] text-ink-muted capitalize">
                          {ex.primaryMuscles[0] || CATEGORY_LABELS[ex.category]}
                        </span>
                        <span className={`safety-badge safety-${ex.impactLevel}`}>
                          {safety.locked && <Lock className="w-2.5 h-2.5" />}
                          {IMPACT_LABELS[ex.impactLevel]}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Secondary actions: Explore external APIs or Create custom */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => openAddModal('explore')}
              className="py-3 px-3 rounded-xl surface-card text-xs font-semibold text-ink-secondary hover:text-ink flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-modality-cardio" />
              Explorar APIs
            </button>
            <button
              type="button"
              onClick={() => openAddModal('custom')}
              className="py-3 px-3 rounded-xl surface-card text-xs font-semibold text-ink-secondary hover:text-ink flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-modality-time" />
              Criar Customizado
            </button>
          </div>
        </>
      ) : (
        /* Routines View (Ref Image 2) */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setShowRoutineBuilder(true)}
              className="py-3 px-3 rounded-xl surface-card text-xs font-bold text-ink flex items-center justify-center gap-2 hover:border-modality-cardio-border"
            >
              <ClipboardList className="w-4 h-4 text-modality-cardio" />
              Nova Rotina
            </button>
            <button
              type="button"
              onClick={() => openAddModal('explore')}
              className="py-3 px-3 rounded-xl surface-card text-xs font-bold text-ink flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 text-modality-reps" />
              Importar Exercício
            </button>
          </div>

          <div className="space-y-3">
            {routines.map((r) => {
              const hasBlocked = r.items.some((it) =>
                getExerciseSafetyStatus(
                  { impactLevel: it.impactLevel, category: it.category },
                  ipc,
                  catalog
                ).locked
              );
              return (
                <MagicCard key={r.id} className="rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-base text-ink">
                        {r.name}
                      </h3>
                      {r.description && (
                        <p className="text-xs text-ink-muted mt-0.5">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteRoutine(r.id)}
                      className="p-1.5 rounded-lg text-ink-muted hover:text-modality-danger"
                      title="Excluir rotina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-ink-secondary leading-relaxed">
                    {r.items.map((it) => it.exerciseName).join(' • ')}
                  </p>

                  {hasBlocked && (
                    <div className="text-[11px] font-medium text-modality-danger flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Contém exercício de alto impacto bloqueado hoje — substituições seguras disponíveis ao iniciar.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(`/train?routineId=${r.id}`)}
                    className="w-full py-2.5 rounded-xl bg-modality-cardio text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Iniciar Rotina ({r.items.length} exercícios)
                  </button>
                </MagicCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Exercise Detail Bottom Sheet */}
      <AnimatePresence>
        {selectedEx && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40"
              onClick={() => setSelectedEx(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 max-w-[460px] mx-auto bg-surface rounded-t-3xl p-6 pb-8 z-50 border-t border-border-token shadow-elevated max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-start gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <ExerciseAvatar
                    name={selectedEx.name}
                    imageUrl={selectedEx.imageUrls[0]}
                    measurementType={selectedEx.measurementType}
                    themeColor={selectedEx.themeColor}
                    iconName={selectedEx.iconName}
                    size="lg"
                    onClick={() =>
                      setMediaPreview({ exercise: selectedEx, index: 0 })
                    }
                  />
                  <div>
                    <h3 className="text-lg font-display font-bold text-ink">
                      {selectedEx.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[11px] font-medium text-ink-muted">
                        {MODALITY_LABELS[selectedEx.measurementType]}
                      </span>
                      <span className={`safety-badge safety-${selectedEx.impactLevel}`}>
                        {IMPACT_LABELS[selectedEx.impactLevel]}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEx(null)}
                  className="p-2 bg-subtle rounded-full text-ink-muted hover:text-ink"
                >oi
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Free Exercise DB Images */}
              {selectedEx.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {selectedEx.imageUrls.slice(0, 2).map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setMediaPreview({ exercise: selectedEx, index: i })
                      }
                      aria-label={`Ampliar foto ${i + 1} de ${selectedEx.name}`}
                      className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-border-token bg-white cursor-pointer hover:border-modality-cardio transition-colors"
                    >
                      <img
                        src={img}
                        alt={`${selectedEx.name} demonstração ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                      />
                      <span
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-slate-900/65 text-white flex items-center justify-center backdrop-blur-sm opacity-90 group-hover:bg-modality-cardio transition-colors"
                        aria-hidden="true"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Muscles */}
              {selectedEx.primaryMuscles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedEx.primaryMuscles.map((m) => (
                    <span
                      key={m}
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-modality-reps-soft text-modality-reps border border-modality-reps-border capitalize"
                    >
                      {m}
                    </span>
                  ))}
                  {selectedEx.secondaryMuscles.map((m) => (
                    <span
                      key={m}
                      className="text-[11px] px-2.5 py-0.5 rounded-full bg-subtle text-ink-secondary border border-border-token capitalize"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Instructions */}
              {selectedEx.instructions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                    <Info className="w-3.5 h-3.5 text-modality-time" />
                    Passo a Passo
                  </div>
                  <ol className="space-y-1.5 text-xs text-ink-secondary list-decimal pl-4 leading-relaxed">
                    {selectedEx.instructions.map((inst, idx) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Safety Warning or Start Action */}
              {(() => {
                const safety = getExerciseSafetyStatus(selectedEx, ipc, catalog);
                const pr = getExercisePR(logs, selectedEx.externalId || selectedEx.id);
                return (
                  <div className="space-y-3 pt-2 border-t border-border-token">
                    {pr.bestSeconds > 0 && (
                      <div className="text-xs text-ink-muted">
                        Seu recorde pessoal:{' '}
                        <strong className="text-modality-time tabular-nums">
                          {pr.bestSeconds}s
                        </strong>
                      </div>
                    )}

                    {safety.locked ? (
                      <div className="p-3 rounded-xl bg-modality-danger-soft border border-modality-danger-border text-xs text-modality-danger">
                        <div className="font-bold flex items-center gap-1.5 mb-1">
                          <Lock className="w-3.5 h-3.5" /> Bloqueado pelo Motor Adaptativo
                        </div>
                        <p className="text-ink-secondary">{safety.reason}</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const id = selectedEx.id;
                          setSelectedEx(null);
                          navigate(`/train?exerciseId=${id}`);
                        }}
                        className="w-full py-3.5 rounded-xl bg-modality-time text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Treinar Agora
                      </button>
                    )}

                    {selectedEx.isCustom && (
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteCustomExercise(selectedEx.id);
                          setSelectedEx(null);
                        }}
                        className="w-full py-2.5 rounded-xl bg-subtle text-modality-danger text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover exercício customizado
                      </button>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AddExerciseModal
        isOpen={showAddModal}
        initialTab={addTab}
        onClose={() => setShowAddModal(false)}
      />

      <RoutineBuilderModal
        isOpen={showRoutineBuilder}
        onClose={() => setShowRoutineBuilder(false)}
      />

      <ExerciseMediaModal
        exercise={mediaPreview?.exercise ?? null}
        initialPhotoIndex={mediaPreview?.index ?? 0}
        onClose={() => setMediaPreview(null)}
        onStartTraining={
          mediaPreview &&
            !getExerciseSafetyStatus(mediaPreview.exercise, ipc, catalog).locked
            ? (ex) => {
              setMediaPreview(null);
              setSelectedEx(null);
              navigate(`/train?exerciseId=${ex.id}`);
            }
            : undefined
        }
      />
    </div>
  );
}

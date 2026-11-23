import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Plus,
  Check,
  Loader2,
  Sparkles,
  Database,
  Dumbbell,
  Timer,
  Zap,
  Flame,
  Heart,
  Activity,
  Shield,
  Wind,
  Maximize2,
} from 'lucide-react';
import { Form } from '@heroui/form';
import { Input, Textarea } from '@heroui/input';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { Tabs, Tab } from '@heroui/tabs';
import {
  CatalogExercise,
  ExerciseCategory,
  ImpactLevel,
  MeasurementType,
  ThemeColor,
} from '../types';
import { useServices } from '../contexts/ServiceContext';
import { useAppData } from '../contexts/AppDataContext';
import { ExerciseAvatar } from './ExerciseAvatar';
import { ExerciseMediaModal } from './ExerciseMediaModal';
import { CATEGORY_LABELS, IMPACT_LABELS, MODALITY_LABELS } from '../data/seedCatalog';

interface AddExerciseModalProps {
  isOpen: boolean;
  initialTab?: 'explore' | 'custom';
  onClose: () => void;
  onImported?: (ex: CatalogExercise) => void;
}

const ICON_OPTIONS = [
  { id: 'timer', label: 'Timer', icon: Timer },
  { id: 'dumbbell', label: 'Força', icon: Dumbbell },
  { id: 'zap', label: 'Cardio', icon: Zap },
  { id: 'flame', label: 'HIIT', icon: Flame },
  { id: 'shield', label: 'Estab.', icon: Shield },
  { id: 'wind', label: 'Mobil.', icon: Wind },
  { id: 'activity', label: 'Pulso', icon: Activity },
  { id: 'heart', label: 'Saúde', icon: Heart },
];

const COLOR_OPTIONS: { id: ThemeColor; label: string; dotClass: string }[] = [
  { id: 'amber', label: 'Laranja (Tempo)', dotClass: 'bg-orange-600' },
  { id: 'teal', label: 'Esmeralda (Reps)', dotClass: 'bg-teal-600' },
  { id: 'indigo', label: 'Índigo (Cardio)', dotClass: 'bg-indigo-600' },
  { id: 'emerald', label: 'Verde (Mobilidade)', dotClass: 'bg-green-700' },
  { id: 'rose', label: 'Rosa (Intenso)', dotClass: 'bg-rose-600' },
];

export function AddExerciseModal({
  isOpen,
  initialTab = 'explore',
  onClose,
  onImported,
}: AddExerciseModalProps) {
  const { exerciseApi } = useServices();
  const { catalog, saveExerciseToCatalog } = useAppData();

  const [tab, setTab] = useState<'explore' | 'custom'>(initialTab);

  // Explore tab state
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [provider, setProvider] = useState<'auto' | 'free-exercise-db' | 'api-ninjas'>('auto');
  const [results, setResults] = useState<CatalogExercise[]>([]);
  const [searchMeta, setSearchMeta] = useState<{ source: string; message?: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [previewEx, setPreviewEx] = useState<CatalogExercise | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{
    exercise: CatalogExercise;
    index: number;
  } | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  // Custom tab state
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>('core');
  const [customMuscle, setCustomMuscle] = useState('abdominals');
  const [customEquipment, setCustomEquipment] = useState('body only');
  const [customMeasurement, setCustomMeasurement] = useState<MeasurementType>('time_based');
  const [customImpact, setCustomImpact] = useState<ImpactLevel>('low');
  const [customIcon, setCustomIcon] = useState('timer');
  const [customColor, setCustomColor] = useState<ThemeColor>('amber');
  const [customTargetSec, setCustomTargetSec] = useState(45);
  const [customSets, setCustomSets] = useState(3);
  const [customReps, setCustomReps] = useState(12);
  const [customRounds, setCustomRounds] = useState(6);
  const [customWorkSec, setCustomWorkSec] = useState(40);
  const [customRestSec, setCustomRestSec] = useState(20);
  const [customInstructions, setCustomInstructions] = useState('');
  const [savingCustom, setSavingCustom] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen || tab !== 'explore') return;
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await exerciseApi.searchExternalExercises({
          query,
          category: filterCat || undefined,
          provider,
          limit: 24,
        });
        if (!active) return;
        setResults(res.exercises);
        setSearchMeta({ source: res.source, message: res.message });
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, tab, query, filterCat, provider, exerciseApi]);

  const isAlreadyInCatalog = (ex: CatalogExercise) =>
    catalog.some(
      (c) =>
        (c.externalId && ex.externalId && c.externalId === ex.externalId) ||
        c.name.toLowerCase() === ex.name.toLowerCase()
    );

  const handleImport = async (ex: CatalogExercise) => {
    setImportingId(ex.id);
    try {
      const saved = await saveExerciseToCatalog({
        externalId: ex.externalId,
        source: ex.source,
        name: ex.name,
        category: ex.category,
        measurementType: ex.measurementType,
        force: ex.force,
        level: ex.level,
        mechanic: ex.mechanic,
        equipment: ex.equipment,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        instructions: ex.instructions,
        tips: ex.tips,
        imageUrls: ex.imageUrls,
        impactLevel: ex.impactLevel,
        themeColor: ex.themeColor,
        iconName: ex.iconName,
        defaultConfig: ex.defaultConfig,
        isCustom: false,
      });
      setPreviewEx(null);
      onImported?.(saved);
    } finally {
      setImportingId(null);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    setSavingCustom(true);
    try {
      const defaultConfig =
        customMeasurement === 'time_based'
          ? { targetSeconds: customTargetSec }
          : customMeasurement === 'reps_based'
            ? { defaultSets: customSets, defaultReps: customReps, defaultLoadKg: 0 }
            : {
                rounds: customRounds,
                workSeconds: customWorkSec,
                restSeconds: customRestSec,
                targetCycles: 40,
              };

      const saved = await saveExerciseToCatalog({
        externalId: `custom_${Date.now()}`,
        source: 'custom',
        name: customName.trim(),
        category: customCategory,
        measurementType: customMeasurement,
        force: null,
        level: 'beginner',
        mechanic: null,
        equipment: customEquipment.trim() || 'body only',
        primaryMuscles: [customMuscle],
        secondaryMuscles: [],
        instructions: customInstructions
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        tips: [],
        imageUrls: [],
        impactLevel: customImpact,
        themeColor: customColor,
        iconName: customIcon,
        defaultConfig,
        isCustom: true,
      });
      setCustomName('');
      setCustomInstructions('');
      onImported?.(saved);
      onClose();
    } finally {
      setSavingCustom(false);
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
            className="fixed inset-x-0 bottom-0 max-w-[460px] mx-auto bg-canvas rounded-t-3xl z-50 border-t border-border-token shadow-elevated flex flex-col max-h-[90vh]"
          >
            {/* Top Bar (Ref Image 1 style: Cancel | Title | Create) */}
            <div className="px-5 pt-4 pb-3 bg-surface rounded-t-3xl border-b border-border-token flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-ink-muted hover:text-ink"
              >
                Cancelar
              </button>
              <h2 className="text-base font-display font-bold text-ink">
                Adicionar Exercício
              </h2>
              <button
                type="button"
                onClick={() => setTab(tab === 'explore' ? 'custom' : 'explore')}
                className="text-sm font-semibold text-modality-cardio"
              >
                {tab === 'explore' ? 'Criar' : 'Explorar'}
              </button>
            </div>

            {/* HeroUI Tabs */}
            <div className="px-5 pt-3 pb-2 bg-surface border-b border-border-token">
              <Tabs
                fullWidth
                aria-label="Modo de adição de exercício"
                selectedKey={tab}
                onSelectionChange={(key) => setTab(key as 'explore' | 'custom')}
                radius="lg"
                classNames={{
                  tabList: 'bg-subtle p-1',
                  cursor: 'bg-surface shadow-sm',
                  tab: 'h-9 text-xs font-semibold',
                  tabContent: 'group-data-[selected=true]:text-ink text-ink-muted',
                }}
              >
                <Tab
                  key="explore"
                  title={
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      Explorar Biblioteca
                    </span>
                  }
                />
                <Tab
                  key="custom"
                  title={
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Criar Customizado
                    </span>
                  }
                />
              </Tabs>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar pb-safe">
              {tab === 'explore' ? (
                <>
                  {/* HeroUI Search input */}
                  <Input
                    isClearable
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Buscar ex: Jump Rope, Plank, Squat..."
                    variant="bordered"
                    radius="lg"
                    startContent={<Search className="w-4 h-4 text-ink-muted shrink-0" />}
                    classNames={{
                      inputWrapper:
                        'bg-surface border-border-token hover:border-border-strong group-data-[focus=true]:border-modality-cardio',
                      input: 'text-sm text-ink placeholder:text-ink-muted',
                    }}
                  />

                  {/* Category + Provider filter pills */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { id: '', label: 'Todas' },
                      { id: 'core', label: 'Core' },
                      { id: 'cardio', label: 'Cardio' },
                      { id: 'strength', label: 'Força' },
                      { id: 'mobility', label: 'Mobilidade' },
                      { id: 'plyometrics', label: 'Pliometria' },
                    ].map((cat) => (
                      <button
                        key={cat.id || 'all'}
                        type="button"
                        onClick={() => setFilterCat(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                          filterCat === cat.id
                            ? 'bg-modality-cardio text-white border-modality-cardio'
                            : 'bg-surface text-ink-secondary border-border-token hover:bg-subtle'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Source selector & API status */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex gap-1.5">
                      {(
                        [
                          { id: 'auto', label: 'Auto' },
                          { id: 'free-exercise-db', label: 'Free Exercise DB' },
                          { id: 'api-ninjas', label: 'API Ninjas' },
                        ] as const
                      ).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProvider(p.id)}
                          className={`px-2.5 py-1 rounded-lg font-medium border ${
                            provider === p.id
                              ? 'bg-subtle text-ink border-border-strong'
                              : 'bg-transparent text-ink-muted border-transparent'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    {searchMeta && (
                      <span className="text-ink-muted font-medium">
                        Fonte: {searchMeta.source}
                      </span>
                    )}
                  </div>

                  {searchMeta?.message && (
                    <div className="px-3 py-2 rounded-xl bg-modality-time-soft border border-modality-time-border text-[11px] text-ink-secondary">
                      {searchMeta.message}
                    </div>
                  )}

                  {/* Preview sheet inline when an exercise is clicked */}
                  {previewEx ? (
                    <div className="surface-card rounded-2xl p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <ExerciseAvatar
                            name={previewEx.name}
                            imageUrl={previewEx.imageUrls[0]}
                            measurementType={previewEx.measurementType}
                            themeColor={previewEx.themeColor}
                            size="lg"
                            onClick={() =>
                              setMediaPreview({ exercise: previewEx, index: 0 })
                            }
                          />
                          <div>
                            <h3 className="font-display font-bold text-base text-ink">
                              {previewEx.name}
                            </h3>
                            <p className="text-xs text-ink-muted mt-0.5">
                              {CATEGORY_LABELS[previewEx.category] || previewEx.category} •{' '}
                              {MODALITY_LABELS[previewEx.measurementType]}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewEx(null)}
                          className="p-1.5 rounded-full bg-subtle text-ink-muted"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {previewEx.imageUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {previewEx.imageUrls.slice(0, 2).map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() =>
                                setMediaPreview({ exercise: previewEx, index: i })
                              }
                              aria-label={`Ampliar foto ${i + 1} de ${previewEx.name}`}
                              className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-border-token bg-white cursor-pointer hover:border-modality-cardio transition-colors"
                            >
                              <img
                                src={img}
                                alt={`${previewEx.name} passo ${i + 1}`}
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                              />
                              <span
                                className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/65 text-white flex items-center justify-center backdrop-blur-sm opacity-90 group-hover:bg-modality-cardio transition-colors"
                                aria-hidden="true"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                          Músculos Alvo
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {previewEx.primaryMuscles.map((m) => (
                            <span
                              key={m}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-modality-reps-soft text-modality-reps border border-modality-reps-border"
                            >
                              {m}
                            </span>
                          ))}
                          {previewEx.secondaryMuscles.map((m) => (
                            <span
                              key={m}
                              className="px-2.5 py-0.5 rounded-full text-[11px] bg-subtle text-ink-secondary border border-border-token"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      {previewEx.instructions.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                            Instruções
                          </div>
                          <ol className="space-y-1.5 text-xs text-ink-secondary list-decimal pl-4">
                            {previewEx.instructions.slice(0, 4).map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isAlreadyInCatalog(previewEx) || importingId === previewEx.id}
                        onClick={() => handleImport(previewEx)}
                        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-modality-cardio text-white disabled:opacity-50"
                      >
                        {importingId === previewEx.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isAlreadyInCatalog(previewEx) ? (
                          <>
                            <Check className="w-4 h-4" /> Já no seu catálogo
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" /> Importar para Meu Catálogo
                          </>
                        )}
                      </button>
                    </div>
                  ) : searching ? (
                    <div className="py-12 flex flex-col items-center justify-center text-ink-muted gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-modality-cardio" />
                      <span className="text-xs">Consultando bases de exercícios...</span>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="py-10 text-center text-sm text-ink-muted">
                      Nenhum exercício encontrado. Tente outro termo ou crie um customizado.
                    </div>
                  ) : (
                    <div className="surface-card rounded-2xl divide-y divide-border-token overflow-hidden">
                      {results.map((ex) => {
                        const imported = isAlreadyInCatalog(ex);
                        return (
                          <div
                            key={ex.id}
                            className="p-3.5 flex items-center gap-3 hover:bg-surface-hover transition-colors"
                          >
                            <ExerciseAvatar
                              name={ex.name}
                              imageUrl={ex.imageUrls[0]}
                              measurementType={ex.measurementType}
                              themeColor={ex.themeColor}
                              size="md"
                              onClick={() =>
                                setMediaPreview({ exercise: ex, index: 0 })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewEx(ex)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm text-ink truncate">
                                  {ex.name}
                                </div>
                                <div className="text-xs text-ink-muted truncate mt-0.5">
                                  {ex.primaryMuscles.join(', ') || ex.category} •{' '}
                                  {IMPACT_LABELS[ex.impactLevel]}
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              disabled={imported || importingId === ex.id}
                              onClick={() => handleImport(ex)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 ${
                                imported
                                  ? 'bg-subtle text-ink-muted'
                                  : 'bg-modality-cardio-soft text-modality-cardio border border-modality-cardio-border'
                              }`}
                            >
                              {importingId === ex.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : imported ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Salvo
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" /> Importar
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Form
                  onSubmit={handleCreateCustom}
                  validationBehavior="native"
                  className="w-full flex flex-col gap-4"
                >
                  <Input
                    isRequired
                    label="Nome do Exercício"
                    labelPlacement="outside"
                    placeholder="Ex: Pular Corda Boxe, Prancha com Toque..."
                    value={customName}
                    onValueChange={setCustomName}
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      label: 'text-xs font-semibold text-ink-secondary',
                      inputWrapper:
                        'bg-surface border-border-token hover:border-border-strong group-data-[focus=true]:border-modality-time',
                      input: 'text-sm text-ink placeholder:text-ink-muted',
                    }}
                  />

                  <div className="w-full grid grid-cols-2 gap-3">
                    <Select
                      label="Categoria"
                      labelPlacement="outside"
                      selectedKeys={[customCategory]}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as ExerciseCategory | undefined;
                        if (val) setCustomCategory(val);
                      }}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        label: 'text-xs font-semibold text-ink-secondary',
                        trigger:
                          'bg-surface border-border-token hover:border-border-strong',
                        value: 'text-sm text-ink',
                        popoverContent:
                          'bg-surface border border-border-token text-ink',
                      }}
                    >
                      <SelectItem key="core">Core &amp; Lombar</SelectItem>
                      <SelectItem key="cardio">Cardio &amp; HIIT</SelectItem>
                      <SelectItem key="strength">Força</SelectItem>
                      <SelectItem key="mobility">Mobilidade</SelectItem>
                      <SelectItem key="plyometrics">Pliometria</SelectItem>
                    </Select>

                    <Select
                      label="Grupo Muscular"
                      labelPlacement="outside"
                      selectedKeys={[customMuscle]}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string | undefined;
                        if (val) setCustomMuscle(val);
                      }}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        label: 'text-xs font-semibold text-ink-secondary',
                        trigger:
                          'bg-surface border-border-token hover:border-border-strong',
                        value: 'text-sm text-ink',
                        popoverContent:
                          'bg-surface border border-border-token text-ink',
                      }}
                    >
                      <SelectItem key="abdominals">Abdômen</SelectItem>
                      <SelectItem key="lower back">Lombar</SelectItem>
                      <SelectItem key="glutes">Glúteos</SelectItem>
                      <SelectItem key="quadriceps">Quadríceps / Pernas</SelectItem>
                      <SelectItem key="calves">Panturrilhas</SelectItem>
                      <SelectItem key="chest">Peitoral</SelectItem>
                      <SelectItem key="shoulders">Ombros</SelectItem>
                    </Select>
                  </div>

                  <div className="w-full">
                    <label className="text-xs font-semibold text-ink-secondary block mb-1.5">
                      Modalidade de Medição
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'time_based', label: 'Tempo' },
                          { id: 'reps_based', label: 'Séries/Reps' },
                          { id: 'interval_based', label: 'Intervalado' },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setCustomMeasurement(m.id)}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                            customMeasurement === m.id
                              ? 'bg-modality-cardio text-white border-modality-cardio'
                              : 'bg-surface text-ink-secondary border-border-token'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modality-specific default goals */}
                  <div className="w-full surface-card p-3.5 rounded-2xl">
                    {customMeasurement === 'time_based' && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-ink-secondary">
                          Meta inicial (segundos)
                        </span>
                        <Input
                          type="number"
                          aria-label="Meta inicial em segundos"
                          min={10}
                          max={3600}
                          value={String(customTargetSec)}
                          onValueChange={(v) => setCustomTargetSec(Number(v) || 30)}
                          variant="bordered"
                          size="sm"
                          radius="md"
                          className="w-28"
                          classNames={{
                            inputWrapper: 'bg-subtle border-border-token',
                            input: 'text-sm font-mono tabular-nums text-right text-ink',
                          }}
                        />
                      </div>
                    )}
                    {customMeasurement === 'reps_based' && (
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          label="Séries padrão"
                          labelPlacement="outside"
                          min={1}
                          max={12}
                          value={String(customSets)}
                          onValueChange={(v) => setCustomSets(Number(v) || 3)}
                          variant="bordered"
                          size="sm"
                          radius="md"
                          classNames={{
                            label: 'text-[11px] text-ink-muted',
                            inputWrapper: 'bg-subtle border-border-token',
                            input: 'text-sm font-mono tabular-nums text-ink',
                          }}
                        />
                        <Input
                          type="number"
                          label="Repetições padrão"
                          labelPlacement="outside"
                          min={1}
                          max={200}
                          value={String(customReps)}
                          onValueChange={(v) => setCustomReps(Number(v) || 10)}
                          variant="bordered"
                          size="sm"
                          radius="md"
                          classNames={{
                            label: 'text-[11px] text-ink-muted',
                            inputWrapper: 'bg-subtle border-border-token',
                            input: 'text-sm font-mono tabular-nums text-ink',
                          }}
                        />
                      </div>
                    )}
                    {customMeasurement === 'interval_based' && (
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          label="Rounds"
                          labelPlacement="outside"
                          min={1}
                          max={30}
                          value={String(customRounds)}
                          onValueChange={(v) => setCustomRounds(Number(v) || 4)}
                          variant="bordered"
                          size="sm"
                          radius="md"
                          classNames={{
                            label: 'text-[11px] text-ink-muted',
                            inputWrapper: 'bg-subtle border-border-token',
                            input: 'text-sm font-mono tabular-nums text-ink',
                          }}
                        />
                        <Input
                          type="number"
                          label="Ação (s)"
                          labelPlacement="outside"
                          min={5}
                          max={300}
                          value={String(customWorkSec)}
                          onValueChange={(v) => setCustomWorkSec(Number(v) || 30)}
                          variant="bordered"
                          size="sm"
                          radius="md"
                          classNames={{
                            label: 'text-[11px] text-ink-muted',
                            inputWrapper: 'bg-subtle border-border-token',
                            input: 'text-sm font-mono tabular-nums text-ink',
                          }}
                        />
                        <Input
                          type="number"
                          label="Descanso (s)"
                          labelPlacement="outside"
                          min={5}
                          max={180}
                          value={String(customRestSec)}
                          onValueChange={(v) => setCustomRestSec(Number(v) || 15)}
                          variant="bordered"
                          size="sm"
                          radius="md"
                          classNames={{
                            label: 'text-[11px] text-ink-muted',
                            inputWrapper: 'bg-subtle border-border-token',
                            input: 'text-sm font-mono tabular-nums text-ink',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="w-full grid grid-cols-2 gap-3">
                    <Select
                      label="Impacto Articular"
                      labelPlacement="outside"
                      selectedKeys={[customImpact]}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as ImpactLevel | undefined;
                        if (val) setCustomImpact(val);
                      }}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        label: 'text-xs font-semibold text-ink-secondary',
                        trigger:
                          'bg-surface border-border-token hover:border-border-strong',
                        value: 'text-sm text-ink',
                        popoverContent:
                          'bg-surface border border-border-token text-ink',
                      }}
                    >
                      <SelectItem key="mobility">Mobilidade</SelectItem>
                      <SelectItem key="low">Baixo Impacto</SelectItem>
                      <SelectItem key="medium">Médio Impacto</SelectItem>
                      <SelectItem key="high">Alto Impacto</SelectItem>
                    </Select>

                    <Input
                      label="Equipamento"
                      labelPlacement="outside"
                      value={customEquipment}
                      onValueChange={setCustomEquipment}
                      placeholder="body only, jump rope..."
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        label: 'text-xs font-semibold text-ink-secondary',
                        inputWrapper:
                          'bg-surface border-border-token hover:border-border-strong',
                        input: 'text-sm text-ink placeholder:text-ink-muted',
                      }}
                    />
                  </div>

                  {/* Icon & Color pickers */}
                  <div className="w-full">
                    <label className="text-xs font-semibold text-ink-secondary block mb-1.5">
                      Ícone & Cor Temática
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {ICON_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setCustomIcon(opt.id)}
                            className={`p-2.5 rounded-xl border transition-all ${
                              customIcon === opt.id
                                ? 'bg-modality-time-soft text-modality-time border-modality-time-border'
                                : 'bg-surface text-ink-muted border-border-token'
                            }`}
                            title={opt.label}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCustomColor(c.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium border ${
                            customColor === c.id
                              ? 'border-ink bg-surface text-ink'
                              : 'border-border-token bg-subtle text-ink-muted'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} />
                          {c.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    label="Instruções (opcional, uma por linha)"
                    labelPlacement="outside"
                    minRows={3}
                    value={customInstructions}
                    onValueChange={setCustomInstructions}
                    placeholder="1. Postura inicial...&#10;2. Execução controlada..."
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      label: 'text-xs font-semibold text-ink-secondary',
                      inputWrapper:
                        'bg-surface border-border-token hover:border-border-strong',
                      input: 'text-sm text-ink placeholder:text-ink-muted',
                    }}
                  />

                  <Button
                    type="submit"
                    color="primary"
                    radius="lg"
                    size="lg"
                    fullWidth
                    isLoading={savingCustom}
                    isDisabled={!customName.trim()}
                    startContent={!savingCustom ? <Check className="w-4 h-4" /> : undefined}
                    className="font-bold text-sm shadow-sm mt-1"
                  >
                    Salvar Exercício Customizado
                  </Button>
                </Form>
              )}
            </div>
          </motion.div>

          <ExerciseMediaModal
            exercise={mediaPreview?.exercise ?? null}
            initialPhotoIndex={mediaPreview?.index ?? 0}
            onClose={() => setMediaPreview(null)}
          />
        </>
      )}
    </AnimatePresence>
  );
}

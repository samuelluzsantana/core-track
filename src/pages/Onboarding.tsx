import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Target,
  Zap,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Shield,
  Loader2,
  Check,
} from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';
import { ExperienceLevel, Objective, PainLevel } from '../types';

export function Onboarding() {
  const navigate = useNavigate();
  const { saveProfile } = useAppData();

  const [step, setStep] = useState(1);
  const [painLevel, setPainLevel] = useState<PainLevel>(2);
  const [objective, setObjective] = useState<Objective>('fortalecimento');
  const [experience, setExperience] = useState<ExperienceLevel>('iniciante');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleNext = async () => {
    setSaveError(null);
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    setSaving(true);
    try {
      await saveProfile({
        painLevel,
        objective,
        experienceLevel: experience,
        onboardingCompleted: true,
      });
      navigate('/');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar seu perfil. Tente novamente.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const painColor =
    painLevel <= 3
      ? 'text-modality-mobility'
      : painLevel <= 6
        ? 'text-modality-time'
        : 'text-modality-danger';

  return (
    <div className="min-h-screen bg-canvas text-ink flex justify-center w-full sm:py-4">
      <div className="w-full max-w-[460px] min-h-screen sm:min-h-[calc(100vh-2rem)] flex flex-col bg-canvas sm:rounded-[28px] sm:border sm:border-border-token sm:shadow-elevated overflow-hidden relative">
        {/* Progress Steps */}
        <div className="px-6 pt-10 pb-5 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-modality-time' : 'bg-subtle border border-border-token'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 px-6 pb-28 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-modality-time-soft border border-modality-time-border flex items-center justify-center">
                  <Activity className="w-6 h-6 text-modality-time" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-extrabold text-ink">
                    Qual seu nível de dor lombar hoje?
                  </h1>
                  <p className="text-sm text-ink-muted mt-1.5">
                    O Motor Adaptativo calibra suas metas e bloqueia alto impacto automaticamente se necessário.
                  </p>
                </div>

                <div className="surface-card rounded-2xl p-6 space-y-5">
                  <div className="text-center">
                    <span className={`text-5xl font-mono font-extrabold tabular-nums ${painColor}`}>
                      {painLevel}
                    </span>
                    <span className="text-sm text-ink-muted ml-1">/ 10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={painLevel}
                    onChange={(e) => setPainLevel(parseInt(e.target.value, 10))}
                    className="pain-slider"
                  />
                  <div className="flex justify-between text-[11px] font-medium text-ink-muted">
                    <span>Sem dor</span>
                    <span>Moderada</span>
                    <span>Dor intensa</span>
                  </div>
                </div>

                {painLevel >= 7 && (
                  <div className="p-4 rounded-2xl bg-modality-danger-soft border border-modality-danger-border flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-modality-danger shrink-0 mt-0.5" />
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      Com dor ≥ 7, exercícios de alto impacto (como Pular Corda) ficarão bloqueados automaticamente, liberando apenas mobilidade segura.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-modality-reps-soft border border-modality-reps-border flex items-center justify-center">
                  <Target className="w-6 h-6 text-modality-reps" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-extrabold text-ink">
                    Qual seu foco principal?
                  </h1>
                  <p className="text-sm text-ink-muted mt-1.5">
                    Personalizamos suas rotinas híbridas de core, força e condicionamento.
                  </p>
                </div>

                <div className="space-y-3">
                  {(
                    [
                      {
                        id: 'alivio',
                        label: 'Alívio & Mobilidade',
                        desc: 'Descompressão lombar e estabilização leve',
                        icon: Shield,
                      },
                      {
                        id: 'fortalecimento',
                        label: 'Fortalecimento Híbrido',
                        desc: 'Equilíbrio entre core isométrico e força funcional',
                        icon: Target,
                      },
                      {
                        id: 'performance',
                        label: 'Performance & Cardio',
                        desc: 'Progressão intensa com Pular Corda HIIT e séries avançadas',
                        icon: Zap,
                      },
                    ] as const
                  ).map((opt) => {
                    const Icon = opt.icon;
                    const active = objective === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setObjective(opt.id)}
                        className={`w-full p-4 rounded-2xl surface-card flex items-center gap-3.5 text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-modality-reps-soft border-modality-reps ring-1 ring-modality-reps'
                            : 'hover:border-border-strong'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            active
                              ? 'bg-modality-reps text-white'
                              : 'bg-subtle text-ink-muted'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-bold text-sm text-ink">
                            {opt.label}
                          </div>
                          <div className="text-xs text-ink-muted mt-0.5">
                            {opt.desc}
                          </div>
                        </div>
                        {active && (
                          <div className="w-5 h-5 rounded-full bg-modality-reps text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-modality-cardio-soft border border-modality-cardio-border flex items-center justify-center">
                  <Zap className="w-6 h-6 text-modality-cardio" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-extrabold text-ink">
                    Qual sua experiência atual?
                  </h1>
                  <p className="text-sm text-ink-muted mt-1.5">
                    Define o ritmo de incremento automático das metas.
                  </p>
                </div>

                <div className="space-y-3">
                  {(
                    [
                      {
                        id: 'iniciante',
                        label: 'Iniciante',
                        inc: '+5s core / +15s cardio',
                        desc: 'Ideal para construir consistência com segurança',
                      },
                      {
                        id: 'moderado',
                        label: 'Moderado',
                        inc: '+10s core / +30s cardio',
                        desc: 'Já treina regularmente e busca evolução contínua',
                      },
                      {
                        id: 'avancado',
                        label: 'Avançado',
                        inc: '+15s core / +45s cardio',
                        desc: 'Domínio sólido de isometria, força e HIIT',
                      },
                    ] as const
                  ).map((opt) => {
                    const active = experience === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setExperience(opt.id)}
                        className={`w-full p-4 rounded-2xl surface-card text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-modality-cardio-soft border-modality-cardio ring-1 ring-modality-cardio'
                            : 'hover:border-border-strong'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                active
                                  ? 'bg-modality-cardio border-modality-cardio text-white'
                                  : 'border-border-strong bg-surface'
                              }`}
                            >
                              {active && <Check className="w-3 h-3" strokeWidth={3} />}
                            </div>
                            <span className="font-display font-bold text-sm text-ink">
                              {opt.label}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                              active
                                ? 'bg-surface text-modality-cardio border border-modality-cardio-border'
                                : 'bg-modality-cardio-soft text-modality-cardio'
                            }`}
                          >
                            {opt.inc}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted mt-1.5 pl-7">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-canvas border-t border-border-token space-y-3">
          {saveError && (
            <div className="p-3 rounded-xl bg-modality-danger-soft border border-modality-danger-border text-xs font-medium text-modality-danger text-center">
              {saveError}
            </div>
          )}
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                disabled={saving}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="px-4 py-3.5 rounded-xl surface-card text-ink-secondary font-semibold text-sm flex items-center justify-center gap-1 hover:text-ink disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={handleNext}
              className="flex-1 py-3.5 rounded-xl bg-modality-time text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{step === 3 ? 'Começar Treinos' : 'Continuar'}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

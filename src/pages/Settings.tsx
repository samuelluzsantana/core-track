import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  Activity,
  Target,
  Zap,
  Shield,
  RotateCcw,
  Trash2,
  AlertTriangle,
  LogOut,
  Check,
  Smartphone,
  Download,
  Share,
} from 'lucide-react';
import { Tabs, Tab } from '@heroui/tabs';
import { Button } from '@heroui/button';
import { useAppData } from '../contexts/AppDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getLombarLevelInfo, LOMBAR_LEVELS } from '../utils/ipcAlgorithm';
import { usePwaInstall } from '../utils/pwaInstall';
import { BlurFade } from '../components/ui/BlurFade';
import { MagicCard } from '../components/ui/MagicCard';
import { ShimmerButton } from '../components/ui/ShimmerButton';
import { ExperienceLevel, Objective, ThemePreference } from '../types';

export function Settings() {
  const { user, signOut } = useAuth();
  const { preference } = useTheme();
  const { isInstalled, canPrompt, isIos, promptInstall } = usePwaInstall();
  const {
    profile,
    ipc,
    saveProfile,
    setThemeAndSync,
    resetStreak,
    clearHistory,
    resetAllData,
  } = useAppData();

  const [toast, setToast] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{
    title: string;
    message: string;
    label: string;
    danger?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  if (!profile) return null;

  const ipcPercent = Math.round(ipc.components.ipc * 100);
  const lombarInfo = getLombarLevelInfo(profile.lombarLevel?.currentLevel ?? 0);

  return (
    <div className="px-5 pt-7 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-ink tracking-tight">
            Configurações
          </h1>
          <p className="text-xs text-ink-muted mt-0.5 truncate max-w-[240px]">
            {user?.email || 'Conta conectada'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="px-3 py-2 rounded-xl surface-card text-xs font-semibold text-ink-secondary hover:text-modality-danger flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>

      {/* Theme Switcher: HeroUI Tabs */}
      <BlurFade delay={0.04} className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
          Aparência & Tema
        </h2>
        <Tabs
          fullWidth
          aria-label="Selecionar tema"
          selectedKey={preference}
          onSelectionChange={(key) => {
            const labelMap = { light: 'Claro', dark: 'Escuro', system: 'Sistema' };
            const pref = key as ThemePreference;
            setThemeAndSync(pref);
            showToast(`Tema ${labelMap[pref]} ativado`);
          }}
          radius="lg"
          classNames={{
            tabList: 'surface-card p-1.5 rounded-2xl',
            cursor: 'bg-modality-cardio shadow-sm rounded-xl',
            tab: 'h-10 text-xs font-bold',
            tabContent: 'group-data-[selected=true]:text-white text-ink-secondary',
          }}
        >
          <Tab
            key="light"
            title={
              <span className="flex items-center gap-1.5">
                <Sun className="w-4 h-4" />
                Claro
              </span>
            }
          />
          <Tab
            key="dark"
            title={
              <span className="flex items-center gap-1.5">
                <Moon className="w-4 h-4" />
                Escuro
              </span>
            }
          />
          <Tab
            key="system"
            title={
              <span className="flex items-center gap-1.5">
                <Monitor className="w-4 h-4" />
                Sistema
              </span>
            }
          />
        </Tabs>
      </BlurFade>

      {/* IPC Engine Overview */}
      <BlurFade delay={0.08} className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
          Motor Adaptativo (IPC)
        </h2>
        <MagicCard className="rounded-2xl p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display font-bold text-base text-ink">
                {ipc.label}
              </div>
              <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                {ipc.description}
              </p>
            </div>
            <span className="text-2xl font-mono font-extrabold text-modality-time tabular-nums shrink-0">
              {ipcPercent}%
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[11px] font-medium text-ink-muted mb-1">
                <span>ECS — Consistência & Tendência</span>
                <span className="font-mono tabular-nums">
                  {Math.round(ipc.components.ecs * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-subtle overflow-hidden">
                <div
                  className="h-full rounded-full bg-modality-time"
                  style={{ width: `${ipc.components.ecs * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-medium text-ink-muted mb-1">
                <span>ERE — Resposta Pós-Treino</span>
                <span className="font-mono tabular-nums">
                  {Math.round(ipc.components.ere * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-subtle overflow-hidden">
                <div
                  className="h-full rounded-full bg-modality-reps"
                  style={{ width: `${ipc.components.ere * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-medium text-ink-muted mb-1">
                <span>Conforto Lombar (Dor Inversa)</span>
                <span className="font-mono tabular-nums">
                  {Math.round(ipc.components.dorInversa * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-subtle overflow-hidden">
                <div
                  className="h-full rounded-full bg-modality-mobility"
                  style={{ width: `${ipc.components.dorInversa * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border-token flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                Nível Adaptativo Atual
              </div>
              <div className="text-sm font-bold text-ink">{lombarInfo.label}</div>
              <div className="text-xs text-ink-muted">{lombarInfo.desc}</div>
            </div>
            <div className="flex gap-1">
              {LOMBAR_LEVELS.map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i <= (profile.lombarLevel?.currentLevel ?? 0)
                      ? 'bg-modality-time'
                      : 'bg-subtle border border-border-token'
                  }`}
                />
              ))}
            </div>
          </div>
        </MagicCard>
      </BlurFade>

      {/* Profile Calibration */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
          Perfil & Calibração de Segurança
        </h2>
        <div className="surface-card rounded-2xl divide-y divide-border-token overflow-hidden">
          <div className="p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-ink flex items-center gap-2">
                <Activity className="w-4 h-4 text-modality-time" />
                Nível de Dor Hoje
              </span>
              <span className="text-base font-mono font-extrabold text-modality-time tabular-nums">
                {profile.painLevel}/10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={profile.painLevel}
              onChange={(e) =>
                saveProfile({ painLevel: parseInt(e.target.value, 10) })
              }
              className="pain-slider"
            />
            <div className="flex justify-between text-[10px] text-ink-muted">
              <span>1 (Sem dor)</span>
              <span>4+ (Bloqueia alto impacto)</span>
              <span>7+ (Só mobilidade)</span>
            </div>
          </div>

          <div className="p-4 space-y-2.5">
            <div className="text-sm font-semibold text-ink flex items-center gap-2">
              <Target className="w-4 h-4 text-modality-reps" />
              Objetivo Principal
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'alivio', label: 'Alívio', icon: Shield },
                  { id: 'fortalecimento', label: 'Fortalecer', icon: Target },
                  { id: 'performance', label: 'Performance', icon: Zap },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const active = profile.objective === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => saveProfile({ objective: opt.id as Objective })}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-all ${
                      active
                        ? 'bg-modality-reps-soft text-modality-reps border-modality-reps-border'
                        : 'bg-subtle text-ink-secondary border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 space-y-2.5">
            <div className="text-sm font-semibold text-ink flex items-center gap-2">
              <Zap className="w-4 h-4 text-modality-cardio" />
              Experiência & Ritmo
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'iniciante', label: 'Iniciante', sub: '+5s / leve' },
                  { id: 'moderado', label: 'Moderado', sub: '+10s / médio' },
                  { id: 'avancado', label: 'Avançado', sub: '+15s / alto' },
                ] as const
              ).map((opt) => {
                const active = profile.experienceLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      saveProfile({ experienceLevel: opt.id as ExperienceLevel })
                    }
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-modality-cardio-soft text-modality-cardio border-modality-cardio-border'
                        : 'bg-subtle text-ink-secondary border-transparent'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Web App / PWA Install */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
          Aplicativo Web (PWA)
        </h2>
        <div className="surface-card rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-modality-time-soft border border-modality-time-border flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-modality-time" />
              </div>
              <div>
                <div className="text-sm font-bold text-ink">
                  CoreTrack na Tela Inicial
                </div>
                <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                  {isInstalled
                    ? 'Executando em modo aplicativo independente.'
                    : 'Instale como aplicativo no celular ou desktop para acesso rápido.'}
                </p>
              </div>
            </div>
            {isInstalled && (
              <span className="px-2.5 py-1 rounded-full bg-modality-mobility-soft border border-modality-mobility-border text-[11px] font-bold text-modality-mobility shrink-0">
                Instalado
              </span>
            )}
          </div>

          {!isInstalled && canPrompt && (
            <button
              type="button"
              onClick={async () => {
                const outcome = await promptInstall();
                if (outcome === 'accepted') {
                  showToast('Aplicativo instalado!');
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-modality-time text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity"
            >
              <Download className="w-4 h-4" />
              Adicionar Aplicativo Web
            </button>
          )}

          {!isInstalled && !canPrompt && (
            <div className="rounded-xl bg-subtle p-3 text-xs text-ink-secondary flex items-start gap-2.5 leading-relaxed">
              <Share className="w-4 h-4 text-modality-time shrink-0 mt-0.5" />
              <span>
                {isIos
                  ? 'No Safari, toque no botão Compartilhar e escolha "Adicionar à Tela de Início".'
                  : 'Pelo menu do navegador ou barra de endereços, selecione "Instalar aplicativo" ou "Adicionar à tela inicial".'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Data Management */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
          Gerenciar Dados
        </h2>
        <div className="surface-card rounded-2xl divide-y divide-border-token overflow-hidden">
          <button
            type="button"
            onClick={() =>
              setConfirming({
                title: 'Zerar Sequência?',
                message: 'Seu streak diário voltará a 0, mantendo todo o histórico.',
                label: 'Zerar Streak',
                onConfirm: async () => {
                  await resetStreak();
                  showToast('Streak zerado');
                },
              })
            }
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-surface-hover"
          >
            <RotateCcw className="w-4 h-4 text-ink-muted" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink">Zerar Sequência</div>
              <div className="text-xs text-ink-muted">Reiniciar contagem de dias seguidos</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setConfirming({
                title: 'Apagar Histórico de Treinos?',
                message: 'Todos os logs de treinos registrados serão excluídos.',
                label: 'Apagar Histórico',
                danger: true,
                onConfirm: async () => {
                  await clearHistory();
                  showToast('Histórico apagado');
                },
              })
            }
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-surface-hover"
          >
            <Trash2 className="w-4 h-4 text-ink-muted" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink">Limpar Histórico</div>
              <div className="text-xs text-ink-muted">Remover todas as sessões registradas</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setConfirming({
                title: 'Resetar Conta Completa?',
                message: 'Apaga histórico, rotinas, exercícios customizados e reinicia o onboarding.',
                label: 'Resetar Tudo',
                danger: true,
                onConfirm: async () => {
                  await resetAllData();
                  showToast('Dados resetados');
                },
              })
            }
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-modality-danger-soft/40"
          >
            <AlertTriangle className="w-4 h-4 text-modality-danger" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-modality-danger">
                Resetar Todos os Dados
              </div>
              <div className="text-xs text-ink-muted">Volta à calibração inicial</div>
            </div>
          </button>
        </div>
      </section>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirming && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50"
              onClick={() => setConfirming(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="fixed inset-0 flex items-center justify-center p-6 z-50"
            >
              <div className="surface-card rounded-2xl p-5 max-w-sm w-full space-y-4">
                <h3 className="font-display font-bold text-lg text-ink">
                  {confirming.title}
                </h3>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  {confirming.message}
                </p>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="flex-1 py-2.5 rounded-xl bg-subtle text-ink-secondary font-semibold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await confirming.onConfirm();
                      setConfirming(null);
                    }}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white ${
                      confirming.danger ? 'bg-modality-danger' : 'bg-modality-cardio'
                    }`}
                  >
                    {confirming.label}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 surface-card px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-elevated"
          >
            <Check className="w-4 h-4 text-modality-mobility" />
            <span className="text-xs font-semibold text-ink">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

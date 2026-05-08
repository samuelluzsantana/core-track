import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Trash2,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Activity,
  Target,
  Zap,
  Shield,
  X,
  Check,
} from 'lucide-react';
import {
  getAppData,
  resetStreak,
  resetAllData,
  updatePainLevel,
  updateObjective,
  updateExperienceLevel,
  clearPlankHistory,
  clearExerciseHistory,
  initLombarLevel,
} from '../utils/storage';
import { calculateIPC, getLombarLevelInfo, LOMBAR_LEVELS } from '../utils/ipcAlgorithm';
import { NumberTicker } from '../components/ui/NumberTicker';
import { AppData, Objective, ExperienceLevel } from '../types';

// ─── Confirm Dialog ─────────────────────────────────────────

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-6"
          >
            <div className="glass-card rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-app-text mb-2">{title}</h3>
              <p className="text-sm text-app-textMuted mb-6">{message}</p>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-xl glass-card-light text-app-textMuted font-medium hover:text-app-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                    danger
                      ? 'bg-app-danger text-white hover:bg-red-600'
                      : 'bg-app-primary text-black hover:bg-amber-400'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Settings Page ──────────────────────────────────────────

export function Settings() {
  const navigate = useNavigate();
  const [data, setData] = useState<AppData | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    action: () => void;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => {
    const d = getAppData();
    initLombarLevel();
    setData(getAppData());
  };

  useEffect(() => {
    reload();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (!data || !data.profile) return null;

  const ipcResult = calculateIPC(data);
  const lombarInfo = getLombarLevelInfo(data.lombarLevel?.currentLevel ?? 0);
  const ipcPercent = Math.round(ipcResult.components.ipc * 100);

  return (
    <div className="p-6 pt-10 pb-8 space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold flex items-center gap-3"
      >
        <SettingsIcon className="w-6 h-6 text-app-textMuted" />
        Configurações
      </motion.h1>

      {/* ─── IPC Dashboard ──────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h2 className="text-[11px] uppercase tracking-wider text-app-textMuted font-semibold mb-3">
          Índice de Prontidão do Core (IPC)
        </h2>
        <div
          className="glass-card p-5 rounded-2xl"
          style={{ borderColor: `${ipcResult.color}30` }}
        >
          {/* Main IPC Score */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{ipcResult.emoji}</span>
              <div>
                <div className="font-bold text-app-text text-lg">{ipcResult.label}</div>
                <div className="text-xs text-app-textMuted">{ipcResult.description}</div>
              </div>
            </div>
            <div
              className="text-3xl font-bold"
              style={{ color: ipcResult.color }}
            >
              <NumberTicker value={ipcPercent} className="" />
              <span className="text-sm text-app-textMuted ml-0.5">%</span>
            </div>
          </div>

          {/* Component Bars */}
          <div className="space-y-3 mt-4">
            <div>
              <div className="flex justify-between text-[10px] text-app-textMuted mb-1 uppercase tracking-wide">
                <span>ECS — Estabilidade</span>
                <span>{Math.round(ipcResult.components.ecs * 100)}%</span>
              </div>
              <div className="h-1.5 bg-app-bg rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ipcResult.components.ecs * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                />
              </div>
              <div className="flex justify-between text-[9px] text-app-textMuted/60 mt-0.5">
                <span>Freq: {Math.round(ipcResult.components.freqScore * 100)}%</span>
                <span>Trend: {Math.round(ipcResult.components.trendScore * 100)}%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-app-textMuted mb-1 uppercase tracking-wide">
                <span>ERE — Resposta</span>
                <span>{Math.round(ipcResult.components.ere * 100)}%</span>
              </div>
              <div className="h-1.5 bg-app-bg rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ipcResult.components.ere * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-app-textMuted mb-1 uppercase tracking-wide">
                <span>Dor Inversa</span>
                <span>{Math.round(ipcResult.components.dorInversa * 100)}%</span>
              </div>
              <div className="h-1.5 bg-app-bg rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ipcResult.components.dorInversa * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Lombar Level */}
          <div className="mt-5 pt-4 border-t border-app-border/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-app-textMuted mb-0.5">Nível Lombar Atual</div>
                <div className="font-semibold text-app-text">{lombarInfo.label}</div>
                <div className="text-xs text-app-textMuted">{lombarInfo.desc}</div>
              </div>
              <div className="flex items-center gap-1">
                {LOMBAR_LEVELS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i <= (data.lombarLevel?.currentLevel ?? 0)
                        ? 'bg-app-primary'
                        : 'bg-app-border/40'
                    }`}
                  />
                ))}
              </div>
            </div>
            {data.lombarLevel && (
              <div className="text-[10px] text-app-textMuted mt-2">
                {data.lombarLevel.weeksAtCurrentLevel} semana(s) neste nível
                {ipcResult.decision === 'avancar_nivel' && (
                  <span className="text-green-400 ml-1">• Pronto para avançar!</span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ─── Profile Settings ───────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-[11px] uppercase tracking-wider text-app-textMuted font-semibold mb-3">
          Perfil
        </h2>
        <div className="glass-card rounded-2xl divide-y divide-app-border/30 overflow-hidden">
          {/* Pain Level */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-app-primary" />
                <span className="text-sm font-medium">Nível de Dor</span>
              </div>
              <span className="text-sm font-bold text-app-primary">{data.profile.painLevel}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={data.profile.painLevel}
              onChange={(e) => {
                updatePainLevel(parseInt(e.target.value));
                reload();
              }}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] text-app-textMuted mt-1">
              <span>Sem dor</span>
              <span>Dor extrema</span>
            </div>
          </div>

          {/* Objective */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-app-primary" />
              <span className="text-sm font-medium">Objetivo</span>
            </div>
            <div className="flex gap-2">
              {([
                { id: 'alivio', label: 'Alívio', icon: Shield },
                { id: 'fortalecimento', label: 'Fortalecer', icon: Target },
                { id: 'performance', label: 'Performance', icon: Zap },
              ] as const).map((opt) => {
                const Icon = opt.icon;
                const isSelected = data.profile?.objective === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      updateObjective(opt.id as Objective);
                      reload();
                    }}
                    className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-medium transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-app-primary/15 text-app-primary border border-app-primary/30'
                        : 'bg-app-bg/50 text-app-textMuted border border-transparent hover:border-app-border'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience Level */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-app-primary" />
              <span className="text-sm font-medium">Experiência</span>
            </div>
            <div className="flex gap-2">
              {([
                { id: 'iniciante', label: 'Iniciante', inc: '+5s' },
                { id: 'moderado', label: 'Moderado', inc: '+10s' },
                { id: 'avancado', label: 'Avançado', inc: '+15s' },
              ] as const).map((opt) => {
                const isSelected = data.profile?.experienceLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      updateExperienceLevel(opt.id as ExperienceLevel);
                      reload();
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-app-primary/15 text-app-primary border border-app-primary/30'
                        : 'bg-app-bg/50 text-app-textMuted border border-transparent hover:border-app-border'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[9px] opacity-60 mt-0.5">{opt.inc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── Data Management ────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-[11px] uppercase tracking-wider text-app-textMuted font-semibold mb-3">
          Gerenciar Dados
        </h2>
        <div className="glass-card rounded-2xl divide-y divide-app-border/30 overflow-hidden">
          <button
            onClick={() =>
              setConfirmAction({
                title: 'Limpar Sequência?',
                message: 'Seu streak será zerado. Dados de treino serão mantidos.',
                confirmLabel: 'Zerar Streak',
                action: () => {
                  resetStreak();
                  reload();
                  showToast('Sequência zerada');
                },
              })
            }
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-app-bg/30 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-app-textMuted" />
            <div className="flex-1">
              <div className="text-sm font-medium text-app-text">Zerar Sequência (Streak)</div>
              <div className="text-[11px] text-app-textMuted">Reiniciar contagem de dias consecutivos</div>
            </div>
            <ChevronRight className="w-4 h-4 text-app-textMuted" />
          </button>

          <button
            onClick={() =>
              setConfirmAction({
                title: 'Limpar Histórico de Prancha?',
                message: 'Todas as sessões de prancha serão apagadas permanentemente.',
                confirmLabel: 'Apagar',
                danger: true,
                action: () => {
                  clearPlankHistory();
                  reload();
                  showToast('Histórico de prancha apagado');
                },
              })
            }
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-app-bg/30 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-app-textMuted" />
            <div className="flex-1">
              <div className="text-sm font-medium text-app-text">Limpar Histórico de Prancha</div>
              <div className="text-[11px] text-app-textMuted">Apagar todas as sessões de prancha</div>
            </div>
            <ChevronRight className="w-4 h-4 text-app-textMuted" />
          </button>

          <button
            onClick={() =>
              setConfirmAction({
                title: 'Limpar Histórico de Exercícios?',
                message: 'Todas as sessões de exercícios serão apagadas permanentemente.',
                confirmLabel: 'Apagar',
                danger: true,
                action: () => {
                  clearExerciseHistory();
                  reload();
                  showToast('Histórico de exercícios apagado');
                },
              })
            }
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-app-bg/30 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-app-textMuted" />
            <div className="flex-1">
              <div className="text-sm font-medium text-app-text">Limpar Histórico de Exercícios</div>
              <div className="text-[11px] text-app-textMuted">Apagar todas as sessões de core</div>
            </div>
            <ChevronRight className="w-4 h-4 text-app-textMuted" />
          </button>
        </div>
      </motion.section>

      {/* ─── Danger Zone ────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-[11px] uppercase tracking-wider text-app-danger/80 font-semibold mb-3">
          Zona de Perigo
        </h2>
        <button
          onClick={() =>
            setConfirmAction({
              title: 'Resetar Tudo?',
              message:
                'TODOS os dados serão apagados: perfil, histórico, streak, cache. Esta ação é irreversível. O app voltará à tela de onboarding.',
              confirmLabel: 'Resetar Tudo',
              danger: true,
              action: () => {
                resetAllData();
                window.location.href = '/';
              },
            })
          }
          className="w-full glass-card border-app-danger/20 p-4 rounded-2xl flex items-center gap-3 text-left hover:border-app-danger/40 transition-colors"
        >
          <div className="w-10 h-10 bg-app-danger/10 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-app-danger" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-app-danger">Resetar Todos os Dados</div>
            <div className="text-[11px] text-app-textMuted">Apaga tudo e volta ao onboarding</div>
          </div>
          <ChevronRight className="w-4 h-4 text-app-danger/50" />
        </button>
      </motion.section>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-center pt-4 pb-4"
      >
        <div className="text-[10px] text-app-textMuted/50 uppercase tracking-wider">
          CoreTracker v2.0
        </div>
        <div className="text-[10px] text-app-textMuted/30 mt-0.5">
          IPC Algorithm • ExerciseDB OSS
        </div>
      </motion.div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmLabel={confirmAction?.confirmLabel || ''}
        danger={confirmAction?.danger}
        onConfirm={() => {
          confirmAction?.action();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 glass-card px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg"
          >
            <Check className="w-4 h-4 text-app-primary" />
            <span className="text-sm font-medium text-app-text">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

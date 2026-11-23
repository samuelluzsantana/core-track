import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
  Activity,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type AuthMode = 'login' | 'signup';

export function Login() {
  const { signIn, signUp, signInWithGoogle, authError, clearAuthError } = useAuth();
  const { resolvedTheme, toggleQuickTheme } = useTheme();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const displayError = error || authError || '';

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError('');
    setSuccess('');
    clearAuthError();
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    clearAuthError();

    if (mode === 'signup' && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password);
        setSuccess('Conta criada! Se necessário, confirme seu e-mail para entrar.');
        setMode('login');
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro inesperado.';
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else if (msg.includes('User already registered')) {
        setError('Este e-mail já está cadastrado.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de entrar.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    clearAuthError();
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('provider is not enabled')) {
        setError(
          'Login com Google ainda não está habilitado no Supabase. Entre com e-mail e senha ou ative o provedor Google no painel.'
        );
      } else {
        setError(msg || 'Erro ao conectar com Google.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex justify-center w-full sm:py-6 px-4">
      <div className="w-full max-w-[440px] flex flex-col justify-center relative py-8">
        <button
          type="button"
          onClick={toggleQuickTheme}
          className="absolute top-4 right-0 w-10 h-10 rounded-xl surface-card flex items-center justify-center text-ink-secondary hover:text-ink"
          aria-label="Alternar tema"
        >
          {resolvedTheme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-modality-time" />
          )}
        </button>

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-7"
        >
          <div className="w-16 h-16 rounded-2xl bg-modality-time-soft border border-modality-time-border flex items-center justify-center mb-3 shadow-card">
            <Activity className="w-8 h-8 text-modality-time" />
          </div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-ink">
            Core<span className="text-modality-time">Track</span>
          </h1>
          <p className="text-xs font-medium text-ink-muted mt-1">
            Plataforma híbrida de core, força, mobilidade e cardio
          </p>
        </motion.div>

        <div className="surface-card rounded-3xl p-6 space-y-5">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-subtle">
            {(['login', 'signup'] as AuthMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError('');
                  setSuccess('');
                  clearAuthError();
                }}
                className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === m
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {m === 'login' ? (
                  <LogIn className="w-3.5 h-3.5" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                {m === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-subtle border border-border-token text-sm text-ink placeholder:text-ink-muted outline-none focus:border-modality-time"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder={
                  mode === 'signup' ? 'Crie uma senha (mín. 6 dígitos)' : 'Sua senha'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-subtle border border-border-token text-sm text-ink placeholder:text-ink-muted outline-none focus:border-modality-time"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative overflow-hidden"
                >
                  <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Confirme a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-subtle border border-border-token text-sm text-ink placeholder:text-ink-muted outline-none focus:border-modality-time"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {displayError && (
              <div className="p-3 rounded-xl bg-modality-danger-soft border border-modality-danger-border text-xs font-medium text-modality-danger text-center">
                {displayError}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-modality-mobility-soft border border-modality-mobility-border text-xs font-medium text-modality-mobility text-center">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-modality-time text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Entrar' : 'Criar Conta'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border-token" />
            <span className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
              ou
            </span>
            <div className="flex-1 h-px bg-border-token" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-xl bg-subtle hover:bg-surface-hover border border-border-token flex items-center justify-center gap-2.5 text-sm font-semibold text-ink transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </button>
        </div>

        <p className="text-center text-xs text-ink-muted mt-5">
          {mode === 'login' ? 'Não tem conta?' : 'Já possui conta?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="text-modality-time font-bold hover:underline"
          >
            {mode === 'login' ? 'Cadastre-se' : 'Fazer login'}
          </button>
        </p>
      </div>
    </div>
  );
}

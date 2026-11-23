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
  Sun,
  Moon,
  Activity,
} from 'lucide-react';
import { Form } from '@heroui/form';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { DotPattern } from '../components/ui/DotPattern';
import { BorderBeam } from '../components/ui/BorderBeam';
import { MagicCard } from '../components/ui/MagicCard';
import { BlurFade } from '../components/ui/BlurFade';
import { BlurText } from '../components/ui/BlurText';
import { GlassBadge } from '../components/ui/GlassIcons';

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

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    clearAuthError();
    if (nextMode === 'login') setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado.';
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
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
    <div className="min-h-screen bg-canvas text-ink flex justify-center w-full sm:py-6 px-4 relative overflow-hidden">
      <DotPattern width={24} height={24} className="opacity-70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full blur-3xl opacity-25"
        style={{
          background:
            'radial-gradient(circle, var(--accent-time) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-[440px] flex flex-col justify-center relative z-10 py-8">
        <button
          type="button"
          onClick={toggleQuickTheme}
          className="absolute top-4 right-0 w-10 h-10 rounded-xl surface-card flex items-center justify-center text-ink-secondary hover:text-ink transition-colors"
          aria-label="Alternar tema"
        >
          {resolvedTheme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-modality-time" />
          )}
        </button>

        <BlurFade delay={0.04} className="flex flex-col items-center mb-7">
          <GlassBadge
            size="lg"
            tone="amber"
            icon={<Activity className="w-8 h-8" />}
            className="mb-4"
          />
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-ink">
            Core<span className="text-modality-time">Track</span>
          </h1>
          <p className="text-xs font-medium text-ink-muted mt-1.5 text-center">
            <BlurText text="Plataforma híbrida de core, força, mobilidade e cardio" />
          </p>
        </BlurFade>

        <BlurFade delay={0.1}>
          <MagicCard className="rounded-3xl p-6 space-y-5">
            <BorderBeam duration={9} borderWidth={1.5} />

            {/* HeroUI Tabs */}
            <Tabs
              fullWidth
              aria-label="Modo de autenticação"
              selectedKey={mode}
              onSelectionChange={(key) => handleModeChange(key as AuthMode)}
              radius="lg"
              classNames={{
                tabList: 'bg-subtle p-1 border border-border-token',
                cursor: 'bg-surface shadow-sm',
                tab: 'h-9 text-xs font-bold',
                tabContent: 'group-data-[selected=true]:text-ink text-ink-muted',
              }}
            >
              <Tab
                key="login"
                title={
                  <span className="flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" />
                    Entrar
                  </span>
                }
              />
              <Tab
                key="signup"
                title={
                  <span className="flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Criar Conta
                  </span>
                }
              />
            </Tabs>

            {/* HeroUI Form */}
            <Form
              onSubmit={handleSubmit}
              validationBehavior="native"
              className="w-full flex flex-col gap-4"
            >
              <Input
                isRequired
                type="email"
                name="email"
                label="E-mail"
                labelPlacement="outside"
                placeholder="voce@exemplo.com"
                value={email}
                onValueChange={setEmail}
                autoComplete="email"
                variant="bordered"
                radius="lg"
                startContent={<Mail className="w-4 h-4 text-ink-muted shrink-0" />}
                classNames={{
                  label: 'text-xs font-semibold text-ink-secondary',
                  inputWrapper:
                    'bg-subtle/60 border-border-token hover:border-border-strong group-data-[focus=true]:border-modality-time',
                  input: 'text-sm text-ink placeholder:text-ink-muted',
                }}
              />

              <Input
                isRequired
                minLength={6}
                type={showPassword ? 'text' : 'password'}
                name="password"
                label="Senha"
                labelPlacement="outside"
                placeholder={
                  mode === 'signup' ? 'Crie uma senha (mín. 6 dígitos)' : 'Sua senha'
                }
                value={password}
                onValueChange={setPassword}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                variant="bordered"
                radius="lg"
                startContent={<Lock className="w-4 h-4 text-ink-muted shrink-0" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="text-ink-muted hover:text-ink focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                classNames={{
                  label: 'text-xs font-semibold text-ink-secondary',
                  inputWrapper:
                    'bg-subtle/60 border-border-token hover:border-border-strong group-data-[focus=true]:border-modality-time',
                  input: 'text-sm text-ink placeholder:text-ink-muted',
                }}
              />

              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full overflow-hidden pt-1"
                  >
                    <Input
                      isRequired
                      minLength={6}
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      label="Confirmar senha"
                      labelPlacement="outside"
                      placeholder="Repita sua senha"
                      value={confirmPassword}
                      onValueChange={setConfirmPassword}
                      variant="bordered"
                      radius="lg"
                      startContent={<Lock className="w-4 h-4 text-ink-muted shrink-0" />}
                      classNames={{
                        label: 'text-xs font-semibold text-ink-secondary',
                        inputWrapper:
                          'bg-subtle/60 border-border-token hover:border-border-strong group-data-[focus=true]:border-modality-time',
                        input: 'text-sm text-ink placeholder:text-ink-muted',
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {displayError && (
                <div className="w-full p-3 rounded-xl bg-modality-danger-soft border border-modality-danger-border text-xs font-medium text-modality-danger text-center">
                  {displayError}
                </div>
              )}

              {success && (
                <div className="w-full p-3 rounded-xl bg-modality-mobility-soft border border-modality-mobility-border text-xs font-medium text-modality-mobility text-center">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                color="primary"
                radius="lg"
                size="lg"
                isLoading={loading}
                fullWidth
                endContent={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
                className="font-bold text-sm shadow-sm mt-1"
              >
                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </Button>
            </Form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-token" />
              <span className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                ou
              </span>
              <div className="flex-1 h-px bg-border-token" />
            </div>

            <Button
              type="button"
              variant="bordered"
              radius="lg"
              size="lg"
              fullWidth
              onPress={handleGoogleLogin}
              className="bg-subtle/70 hover:bg-surface-hover border-border-token font-semibold text-sm text-ink"
              startContent={
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
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
              }
            >
              Continuar com Google
            </Button>
          </MagicCard>
        </BlurFade>

        <p className="text-center text-xs text-ink-muted mt-5">
          {mode === 'login' ? 'Não tem conta?' : 'Já possui conta?'}{' '}
          <button
            type="button"
            onClick={() => handleModeChange(mode === 'login' ? 'signup' : 'login')}
            className="text-modality-time font-bold hover:underline"
          >
            {mode === 'login' ? 'Cadastre-se' : 'Fazer login'}
          </button>
        </p>
      </div>
    </div>
  );
}

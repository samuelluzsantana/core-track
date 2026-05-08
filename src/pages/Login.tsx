import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'signup';

export function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
        setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
        setMode('login');
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro inesperado.';
      if (msg.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos.');
      } else if (msg.includes('User already registered')) {
        setError('Este email já está cadastrado.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu email antes de entrar.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Erro ao conectar com Google.');
    }
  };

  // Spine/Core icon built with SVG
  const CoreIcon = () => (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
      {/* Spine segments */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.rect
          key={i}
          x="24"
          y={10 + i * 10}
          width="16"
          height="7"
          rx="3.5"
          fill="url(#spineGrad)"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
        />
      ))}
      {/* Connecting dots */}
      {[0, 1, 2, 3].map((i) => (
        <motion.circle
          key={`dot-${i}`}
          cx="32"
          cy={17 + i * 10 + 5}
          r="1.5"
          fill="#F59E0B"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6] }}
          transition={{ delay: 0.6 + i * 0.12, duration: 0.6 }}
        />
      ))}
      <defs>
        <linearGradient id="spineGrad" x1="24" y1="10" x2="40" y2="55">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
    </svg>
  );

  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col items-center justify-center max-w-[430px] mx-auto w-full relative overflow-hidden px-6 py-8">
      {/* Ambient orbs */}
      <div className="ambient-orb ambient-orb-amber w-80 h-80 -top-32 -right-32" />
      <div className="ambient-orb ambient-orb-teal w-64 h-64 bottom-16 -left-28" />
      <motion.div
        className="absolute w-40 h-40 rounded-full opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #F59E0B, transparent 70%)',
          filter: 'blur(60px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center">

        {/* Logo & Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-8"
        >
          <motion.div
            className="w-20 h-20 glass-card rounded-3xl flex items-center justify-center mb-4 glow-amber"
            animate={{ boxShadow: [
              '0 0 20px rgba(245, 158, 11, 0.15)',
              '0 0 40px rgba(245, 158, 11, 0.3)',
              '0 0 20px rgba(245, 158, 11, 0.15)',
            ]}}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <CoreIcon />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text-mixed">Core</span>
            <span className="text-app-text">Tracker</span>
          </h1>
          <p className="text-app-textMuted text-sm mt-1">
            Fortalecimento adaptativo de core
          </p>
        </motion.div>

        {/* Mode Toggle Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass-card rounded-2xl p-1 flex w-full mb-6"
        >
          {(['login', 'signup'] as AuthMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === m
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-app-textMuted hover:text-app-text'
              }`}
            >
              {m === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {m === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          ))}
        </motion.div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="w-full space-y-4"
          >
            {/* Email Input */}
            <motion.div
              className="relative"
              variants={inputVariants}
              whileFocus="focus"
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-textMuted">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="login-email"
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-12 pr-4 py-4 glass-card rounded-xl text-app-text placeholder:text-app-textMuted/60 outline-none border border-transparent focus:border-app-primary/50 transition-all duration-300 text-sm bg-transparent"
              />
            </motion.div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-textMuted">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Crie uma senha (mín. 6 caracteres)' : 'Sua senha'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full pl-12 pr-12 py-4 glass-card rounded-xl text-app-text placeholder:text-app-textMuted/60 outline-none border border-transparent focus:border-app-primary/50 transition-all duration-300 text-sm bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-app-textMuted hover:text-app-text transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Confirm Password (signup only) */}
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative overflow-hidden"
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-textMuted">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="login-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirme a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full pl-12 pr-4 py-4 glass-card rounded-xl text-app-text placeholder:text-app-textMuted/60 outline-none border border-transparent focus:border-app-primary/50 transition-all duration-300 text-sm bg-transparent"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 bg-app-danger/10 border border-app-danger/20 rounded-xl text-app-danger text-xs font-medium text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-medium text-center"
                >
                  ✅ {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Aguarde...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Entrar' : 'Criar Conta'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center w-full my-6">
          <div className="flex-1 h-px bg-app-border/50" />
          <span className="px-4 text-app-textMuted text-xs uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-app-border/50" />
        </div>

        {/* Google Sign In */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogleLogin}
          className="w-full glass-card py-3.5 rounded-xl flex items-center justify-center gap-3 hover:border-app-textMuted/40 transition-all duration-300 group"
        >
          {/* Google "G" icon */}
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-app-text text-sm font-semibold group-hover:text-white transition-colors">
            Continuar com Google
          </span>
        </motion.button>

        {/* Bottom Toggle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-app-textMuted text-xs mt-6 text-center"
        >
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="text-app-primary font-semibold hover:underline transition-all"
          >
            {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
          </button>
        </motion.p>

      </div>
    </div>
  );
}

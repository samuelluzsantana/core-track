# 🚀 Tutorial: Integração do CoreTracker com Supabase

## Índice

1. [O que é Supabase?](#1-o-que-é-supabase)
2. [Criar o Projeto no Supabase](#2-criar-o-projeto-no-supabase)
3. [Modelagem do Banco de Dados](#3-modelagem-do-banco-de-dados)
4. [Instalar o SDK no Projeto](#4-instalar-o-sdk-no-projeto)
5. [Configurar o Client Supabase](#5-configurar-o-client-supabase)
6. [Autenticação de Usuários](#6-autenticação-de-usuários)
7. [Migrar o Storage para Supabase](#7-migrar-o-storage-para-supabase)
8. [Row Level Security (RLS)](#8-row-level-security-rls)
9. [Sync Offline-First](#9-sync-offline-first)
10. [Próximos Passos](#10-próximos-passos)

---

## 1. O que é Supabase?

Supabase é uma alternativa open-source ao Firebase. Ele oferece:
- **Banco de dados PostgreSQL** gerenciado
- **Autenticação** (email, Google, GitHub, etc.)
- **APIs REST e Realtime** geradas automaticamente
- **Storage** para arquivos
- **Edge Functions** para lógica serverless

> [!TIP]
> O plano gratuito do Supabase é bastante generoso: 500MB de banco, 1GB de storage, 50.000 MAUs (monthly active users).

---

## 2. Criar o Projeto no Supabase

### Passo a Passo:

1. Acesse [https://supabase.com](https://supabase.com) e crie uma conta
2. Clique em **"New Project"**
3. Preencha:
   - **Nome**: `coretracker`
   - **Senha do banco**: anote em lugar seguro!
   - **Região**: escolha a mais próxima (ex: `South America (São Paulo)`)
4. Aguarde ~2 minutos para o projeto ser provisionado
5. Após criado, vá em **Settings → API** e anote:
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **anon public key** (começa com `eyJ...`)

> [!IMPORTANT]
> A `anon key` é **pública** e segura para usar no frontend. A segurança é feita via **Row Level Security (RLS)**, não pela chave.

---

## 3. Modelagem do Banco de Dados

No painel do Supabase, vá em **SQL Editor** e execute o seguinte script para criar as tabelas:

```sql
-- ═══════════════════════════════════════════════════════
-- 1. Tabela de Perfis (vinculada ao auth.users)
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pain_level INTEGER DEFAULT 1 CHECK (pain_level BETWEEN 1 AND 10),
  objective TEXT DEFAULT 'alivio' CHECK (objective IN ('alivio', 'fortalecimento', 'performance')),
  experience_level TEXT DEFAULT 'iniciante' CHECK (experience_level IN ('iniciante', 'moderado', 'avancado')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  current_streak INTEGER DEFAULT 0,
  last_workout_date TIMESTAMPTZ,
  lombar_level INTEGER DEFAULT 0 CHECK (lombar_level BETWEEN 0 AND 5),
  lombar_weeks_at_level INTEGER DEFAULT 0,
  lombar_level_start_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 2. Tabela de Sessões de Prancha
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.plank_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mode TEXT NOT NULL CHECK (mode IN ('livre', 'progressao')),
  duration_seconds INTEGER NOT NULL,
  exercise_id TEXT,
  feedback TEXT CHECK (feedback IN ('otimo', 'ok', 'desconforto', 'dorAguda')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 3. Tabela de Sessões de Exercícios
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.exercise_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exercise_id TEXT NOT NULL,
  exercise_name TEXT,
  target_muscles TEXT[],  -- Array de strings no PostgreSQL
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 10,
  feedback TEXT CHECK (feedback IN ('otimo', 'ok', 'desconforto', 'dorAguda')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 4. Índices para performance
-- ═══════════════════════════════════════════════════════

CREATE INDEX idx_plank_sessions_user_date ON plank_sessions(user_id, date DESC);
CREATE INDEX idx_exercise_sessions_user_date ON exercise_sessions(user_id, date DESC);

-- ═══════════════════════════════════════════════════════
-- 5. Trigger para criar perfil automaticamente no signup
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

> [!NOTE]
> O trigger `on_auth_user_created` garante que toda vez que um novo usuário se registrar, um perfil será criado automaticamente na tabela `profiles`.

---

## 4. Instalar o SDK no Projeto

No terminal, dentro do diretório do projeto:

```bash
npm install @supabase/supabase-js
```

---

## 5. Configurar o Client Supabase

### 5.1 Criar o arquivo de variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> [!CAUTION]
> Adicione `.env` ao seu `.gitignore` para não committar suas chaves!

### 5.2 Criar o client

Crie o arquivo `src/utils/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. ' +
    'Crie um arquivo .env na raiz do projeto.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 6. Autenticação de Usuários

### 6.1 Contexto de Autenticação

Crie `src/contexts/AuthContext.tsx`:

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      signUp, signIn, signInWithGoogle, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
```

### 6.2 Envolver o App com o Provider

No `src/App.tsx`, envolva o conteúdo com `<AuthProvider>`:

```tsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* ... suas rotas e componentes existentes ... */}
    </AuthProvider>
  );
}
```

### 6.3 Página de Login (exemplo simplificado)

Crie `src/pages/Login.tsx`:

```tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-card glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>🏋️ CoreTracker</h1>
        <p>{isSignUp ? 'Criar conta' : 'Entrar'}</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <p className="error-text">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <button onClick={signInWithGoogle} className="google-btn">
          Entrar com Google
        </button>

        <p onClick={() => setIsSignUp(!isSignUp)} className="toggle-auth">
          {isSignUp
            ? 'Já tem conta? Faça login'
            : 'Não tem conta? Cadastre-se'}
        </p>
      </motion.div>
    </div>
  );
}
```

---

## 7. Migrar o Storage para Supabase

Esta é a parte mais importante. O projeto atualmente usa `localStorage` via `src/utils/storage.ts`. Vamos criar uma nova camada que usa o Supabase.

### 7.1 Criar `src/utils/supabaseStorage.ts`

```typescript
import { supabase } from './supabase';
import { UserProfile, PlankSession, ExerciseSession, Feedback } from '../types';

// ─── Profile ────────────────────────────────────────────────

export const getProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  return {
    painLevel: data.pain_level,
    objective: data.objective,
    experienceLevel: data.experience_level,
    onboardingCompleted: data.onboarding_completed,
  };
};

export const saveProfile = async (profile: UserProfile): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('profiles')
    .update({
      pain_level: profile.painLevel,
      objective: profile.objective,
      experience_level: profile.experienceLevel,
      onboarding_completed: profile.onboardingCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw error;
};

// ─── Plank Sessions ─────────────────────────────────────────

export const addPlankSession = async (
  session: Omit<PlankSession, 'id'>
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('plank_sessions')
    .insert({
      user_id: user.id,
      date: session.date,
      mode: session.mode,
      duration_seconds: session.durationSeconds,
      exercise_id: session.exerciseId,
      feedback: session.feedback,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

export const getPlankSessions = async (): Promise<PlankSession[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('plank_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) return [];

  return (data || []).map((row) => ({
    id: row.id,
    date: row.date,
    mode: row.mode,
    durationSeconds: row.duration_seconds,
    exerciseId: row.exercise_id,
    feedback: row.feedback,
  }));
};

export const updatePlankFeedback = async (
  id: string,
  feedback: Feedback
): Promise<void> => {
  const { error } = await supabase
    .from('plank_sessions')
    .update({ feedback })
    .eq('id', id);

  if (error) throw error;
};

// ─── Exercise Sessions ──────────────────────────────────────

export const addExerciseSession = async (
  session: Omit<ExerciseSession, 'id'>
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('exercise_sessions')
    .insert({
      user_id: user.id,
      date: session.date,
      exercise_id: session.exerciseId,
      exercise_name: session.exerciseName,
      target_muscles: session.targetMuscles,
      sets: session.sets,
      reps: session.reps,
      feedback: session.feedback,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
};

export const getExerciseSessions = async (): Promise<ExerciseSession[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('exercise_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) return [];

  return (data || []).map((row) => ({
    id: row.id,
    date: row.date,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    targetMuscles: row.target_muscles,
    sets: row.sets,
    reps: row.reps,
    feedback: row.feedback,
  }));
};

export const updateExerciseFeedback = async (
  id: string,
  feedback: Feedback
): Promise<void> => {
  const { error } = await supabase
    .from('exercise_sessions')
    .update({ feedback })
    .eq('id', id);

  if (error) throw error;
};

// ─── Streak (calculado no servidor) ─────────────────────────

export const updateStreak = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Buscar perfil atual
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, last_workout_date')
    .eq('id', user.id)
    .single();

  if (!profile) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let newStreak = profile.current_streak;

  if (!profile.last_workout_date) {
    newStreak = 1;
  } else {
    const lastWorkout = new Date(profile.last_workout_date);
    lastWorkout.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
    // diffDays === 0 → sem mudança
  }

  await supabase
    .from('profiles')
    .update({
      current_streak: newStreak,
      last_workout_date: today.toISOString(),
    })
    .eq('id', user.id);
};
```

### 7.2 Como Usar nos Componentes

Antes (localStorage):
```tsx
import { addPlankSession } from '../utils/storage';
const id = addPlankSession({ ... });  // síncrono
```

Depois (Supabase):
```tsx
import { addPlankSession } from '../utils/supabaseStorage';
const id = await addPlankSession({ ... });  // assíncrono!
```

> [!WARNING]
> Todas as funções do Supabase são **assíncronas** (`async/await`). Você precisará adaptar os componentes que chamam essas funções para lidar com Promises.

---

## 8. Row Level Security (RLS)

> [!CAUTION]
> **RLS é OBRIGATÓRIO!** Sem ele, qualquer pessoa com a `anon key` pode ler/escrever dados de todos os usuários.

Execute no **SQL Editor** do Supabase:

```sql
-- ═══════════════════════════════════════════════════════
-- Habilitar RLS em todas as tabelas
-- ═══════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plank_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════
-- Policies para PROFILES
-- ═══════════════════════════════════════════════════════

-- Usuário só pode ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuário só pode atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ═══════════════════════════════════════════════════════
-- Policies para PLANK_SESSIONS
-- ═══════════════════════════════════════════════════════

CREATE POLICY "Users can view own plank sessions"
  ON public.plank_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plank sessions"
  ON public.plank_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plank sessions"
  ON public.plank_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════
-- Policies para EXERCISE_SESSIONS
-- ═══════════════════════════════════════════════════════

CREATE POLICY "Users can view own exercise sessions"
  ON public.exercise_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise sessions"
  ON public.exercise_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise sessions"
  ON public.exercise_sessions FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## 9. Sync Offline-First

Para manter compatibilidade quando o usuário estiver offline, você pode criar um wrapper que tenta Supabase primeiro e faz fallback para localStorage:

```typescript
// src/utils/storageAdapter.ts

import { supabase } from './supabase';
import * as cloud from './supabaseStorage';
import * as local from './storage';

const isOnline = () => navigator.onLine;

const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

export const addPlankSession = async (
  session: Parameters<typeof cloud.addPlankSession>[0]
): Promise<string> => {
  if (isOnline() && await isAuthenticated()) {
    try {
      const id = await cloud.addPlankSession(session);
      await cloud.updateStreak();
      return id;
    } catch (e) {
      console.warn('Falha no Supabase, salvando local:', e);
      return local.addPlankSession(session);
    }
  }
  return local.addPlankSession(session);
};

// ... repetir padrão para as demais funções
```

> [!TIP]
> Para uma solução mais robusta, considere uma fila de sincronização que armazena operações offline e as envia quando a conexão voltar.

---

## 10. Próximos Passos

### Checklist de Implementação

| # | Tarefa | Status |
|---|--------|--------|
| 1 | Criar projeto no Supabase | ⬜ |
| 2 | Executar SQL de criação de tabelas | ⬜ |
| 3 | Executar SQL de RLS | ⬜ |
| 4 | `npm install @supabase/supabase-js` | ⬜ |
| 5 | Criar `.env` com URL e Key | ⬜ |
| 6 | Criar `src/utils/supabase.ts` | ⬜ |
| 7 | Criar `src/contexts/AuthContext.tsx` | ⬜ |
| 8 | Criar `src/utils/supabaseStorage.ts` | ⬜ |
| 9 | Criar página de Login | ⬜ |
| 10 | Adaptar componentes para `async/await` | ⬜ |
| 11 | Testar fluxo completo | ⬜ |

### Extras opcionais

- **Google OAuth**: No painel do Supabase → Authentication → Providers → Google → ative e configure com suas credenciais do Google Cloud Console
- **Realtime**: Use `supabase.channel()` para receber atualizações em tempo real
- **Edge Functions**: Para lógica de negócios no servidor (ex: calcular IPC no backend)
- **Storage**: Para salvar fotos de perfil ou vídeos de exercícios

---

> [!NOTE]
> Se quiser, posso **implementar** qualquer uma dessas etapas diretamente no seu código. É só pedir! 🚀

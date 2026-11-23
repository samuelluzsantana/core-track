import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/system';
import { ServiceProvider, useServiceStatus } from './contexts/ServiceContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AppDataProvider, useAppData } from './contexts/AppDataContext';
import { DevToolbar } from './components/dev/DevToolbar';
import { ClickSpark } from './components/ui/ClickSpark';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import { Train } from './pages/Train';
import { Exercises } from './pages/Exercises';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';

function SplashScreen() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-subtle border-t-modality-time animate-spin" />
      <p className="text-xs font-medium text-ink-muted">
        Inicializando CoreTrack Hybrid...
      </p>
    </div>
  );
}

function ErrorScreen({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-6 text-center gap-3">
      <h2 className="font-display font-bold text-lg text-modality-danger">
        Erro na inicialização
      </h2>
      <p className="text-xs text-ink-muted max-w-sm">{error.message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-4 py-2 rounded-xl bg-modality-time text-white text-xs font-bold"
      >
        Tentar Novamente
      </button>
    </div>
  );
}

function ServiceGate({ children }: { children: React.ReactNode }) {
  const { loading, error } = useServiceStatus();
  if (loading) return <SplashScreen />;
  if (error) return <ErrorScreen error={error} />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: dataLoading } = useAppData();

  if (authLoading) return <SplashScreen />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (dataLoading) return <SplashScreen />;

  const needsOnboarding = !profile?.onboardingCompleted;
  if (needsOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/train" element={<Train />} />
        <Route path="/plank" element={<Train />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function ThemedAppShell() {
  const { resolvedTheme } = useTheme();
  const sparkColor = resolvedTheme === 'dark' ? '#F59E0B' : '#EA580C';

  return (
    <HeroUIProvider>
      <ClickSpark sparkColor={sparkColor}>
        <ServiceProvider>
          <ServiceGate>
            <AuthProvider>
              <AppDataProvider>
                <BrowserRouter>
                  <AppRoutes />
                  <DevToolbar />
                </BrowserRouter>
              </AppDataProvider>
            </AuthProvider>
          </ServiceGate>
        </ServiceProvider>
      </ClickSpark>
    </HeroUIProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ThemedAppShell />
    </ThemeProvider>
  );
}

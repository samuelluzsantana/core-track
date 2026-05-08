import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ServiceProvider, useServiceStatus, useServices } from "./contexts/ServiceContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DevToolbar } from "./components/dev/DevToolbar";
import { Onboarding } from "./pages/Onboarding";
import { Login } from "./pages/Login";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import { Plank } from "./pages/Plank";
import { Exercises } from "./pages/Exercises";
import { Progress } from "./pages/Progress";
import { Settings } from "./pages/Settings";

// ─── Splash Screen while services initialize ───────────────────

function SplashScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F0A23',
      color: '#A78BFA',
      fontFamily: 'Inter, sans-serif',
      gap: 16,
    }}>
      <div style={{
        width: 48,
        height: 48,
        border: '3px solid rgba(167, 139, 250, 0.3)',
        borderTopColor: '#A78BFA',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 14, opacity: 0.7 }}>Inicializando CoreTracker...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorScreen({ error }: { error: Error }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F0A23',
      color: '#EF4444',
      fontFamily: 'Inter, sans-serif',
      padding: 32,
      textAlign: 'center',
      gap: 12,
    }}>
      <span style={{ fontSize: 48 }}>⚠️</span>
      <h2>Erro na inicialização</h2>
      <p style={{ color: '#94A3B8', maxWidth: 400 }}>{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 16,
          padding: '10px 24px',
          background: '#A78BFA',
          border: 'none',
          borderRadius: 8,
          color: 'white',
          cursor: 'pointer',
        }}
      >
        Tentar Novamente
      </button>
    </div>
  );
}

// ─── Service Gate — waits for services to init ──────────────────

function ServiceGate({ children }: { children: React.ReactNode }) {
  const { loading, error } = useServiceStatus();

  if (loading) return <SplashScreen />;
  if (error) return <ErrorScreen error={error} />;

  return <>{children}</>;
}

// ─── App Routes (unchanged logic) ───────────────────────────────

function AppRoutes() {
  const { user, loading } = useAuth();
  const { storage } = useServices();
  const [isReady, setIsReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);

  useEffect(() => {
    storage.getProfile().then((profile) => {
      setNeedsOnboarding(!profile?.onboardingCompleted);
      setIsReady(true);
    });
  }, [storage]);

  // Show nothing while auth or app data is loading
  if (loading || !isReady) return <SplashScreen />;

  // Not authenticated → show login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated but needs onboarding
  if (needsOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Authenticated and onboarded → full app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/plank" element={<Plank />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

// ─── Root App Component ─────────────────────────────────────────

export function App() {
  return (
    <ServiceProvider>
      <ServiceGate>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <DevToolbar />
          </BrowserRouter>
        </AuthProvider>
      </ServiceGate>
    </ServiceProvider>
  );
}

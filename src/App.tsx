import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { getAppData } from './utils/storage';
import Home from './pages/Home';
import { Plank } from './pages/Plank';
import { Exercises } from './pages/Exercises';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';

function AppRoutes() {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);

  useEffect(() => {
    const data = getAppData();
    setNeedsOnboarding(!data.profile?.onboardingCompleted);
    setIsReady(true);
  }, []);

  // Show nothing while auth or app data is loading
  if (loading || !isReady) return null;

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

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
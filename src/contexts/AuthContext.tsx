/**
 * AuthContext — Refactored to use the service layer.
 * 
 * No longer directly depends on Supabase. Uses IAuthService from
 * the service container, which could be mock or real.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '../config/types';
import { useServices } from './ServiceContext';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractCallbackAuthError(): string | null {
  if (typeof window === 'undefined') return null;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);

  const errorCode = hashParams.get('error_code') || queryParams.get('error_code');
  const errorDesc =
    hashParams.get('error_description') || queryParams.get('error_description');
  const error = hashParams.get('error') || queryParams.get('error');

  if (!error && !errorDesc && !errorCode) return null;

  // Clean callback error parameters without touching access_token hashes.
  const cleanUrl = `${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);

  if (errorCode === 'otp_expired') {
    return 'O link de login expirou ou já foi utilizado. Entre com seu e-mail e senha ou solicite um novo link.';
  }
  if (errorDesc) {
    return errorDesc.replace(/\+/g, ' ');
  }
  return 'Não foi possível concluir a autenticação pelo link. Tente novamente.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth } = useServices();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(() =>
    extractCallbackAuthError()
  );

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    let active = true;
    let settledByEvent = false;

    const unsubscribe = auth.onAuthStateChange((authUser) => {
      if (!active) return;
      settledByEvent = true;
      setUser(authUser);
      setLoading(false);
    });

    // Wait for getSession() first so supabase-js finishes parsing #access_token / ?code URL params.
    auth
      .getSession()
      .then(async (session) => {
        if (!active) return null;
        if (!session) return null;
        return auth.getCurrentUser();
      })
      .then((u) => {
        if (!active) return;
        if (!settledByEvent || u) {
          setUser(u);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth]);

  const signUp = async (email: string, password: string) => {
    await auth.signUp(email, password);
  };

  const signIn = async (email: string, password: string) => {
    await auth.signIn(email, password);
  };

  const signInWithGoogle = async () => {
    await auth.signInWithGoogle();
  };

  const signOut = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, loading, authError, clearAuthError,
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

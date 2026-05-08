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
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth } = useServices();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    // Also do an initial check
    auth.getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });

    return unsubscribe;
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
      user, loading,
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

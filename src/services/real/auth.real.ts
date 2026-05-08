/**
 * Real Auth Service — Supabase implementation
 * 
 * Wraps the existing Supabase auth logic into the IAuthService interface.
 */

import { Session } from '@supabase/supabase-js';
import { IAuthService, AuthUser } from '../../config/types';
import { supabase } from '../../utils/supabase';

export class RealAuthService implements IAuthService {
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? '',
      displayName: user.user_metadata?.display_name ?? user.email?.split('@')[0],
      avatarUrl: user.user_metadata?.avatar_url,
    };
  }

  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          callback({
            id: session.user.id,
            email: session.user.email ?? '',
            displayName: session.user.user_metadata?.display_name ?? session.user.email?.split('@')[0],
            avatarUrl: session.user.user_metadata?.avatar_url,
          });
        } else {
          callback(null);
        }
      }
    );
    return () => subscription.unsubscribe();
  }
}

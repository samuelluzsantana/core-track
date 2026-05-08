/**
 * Mock Auth Service
 * 
 * Simulates authentication without any backend.
 * Users are stored in memory and persisted to localStorage.
 */

import { Session } from '@supabase/supabase-js';
import { IAuthService, AuthUser } from '../../config/types';
import { MOCK_USERS } from './seeds';
import { mockDelay, maybeThrow, mockLog } from './mockUtils';

const MOCK_AUTH_KEY = 'coretracker_mock_auth';

export class MockAuthService implements IAuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();

  constructor() {
    // Restore session from localStorage
    try {
      const stored = localStorage.getItem(MOCK_AUTH_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
        mockLog('Auth', 'Session restored', this.currentUser?.email);
      }
    } catch {
      this.currentUser = null;
    }
  }

  private persist(): void {
    if (this.currentUser) {
      localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(MOCK_AUTH_KEY);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb(this.currentUser));
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    mockLog('Auth', 'getCurrentUser', this.currentUser?.email ?? 'null');
    return this.currentUser;
  }

  async getSession(): Promise<Session | null> {
    if (!this.currentUser) return null;
    // Return a minimal mock session
    return {
      access_token: `mock_token_${this.currentUser.id}`,
      refresh_token: `mock_refresh_${this.currentUser.id}`,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: this.currentUser.id,
        email: this.currentUser.email,
        app_metadata: {},
        user_metadata: { display_name: this.currentUser.displayName },
        aud: 'mock',
        created_at: new Date().toISOString(),
      },
    } as Session;
  }

  async signUp(email: string, _password: string): Promise<void> {
    await mockDelay();
    maybeThrow('signUp');
    mockLog('Auth', 'signUp', email);

    const existing = MOCK_USERS.find((u) => u.email === email);
    if (existing) {
      throw new Error('Usuário já existe com este e-mail.');
    }

    // Create a new mock user
    const newUser: AuthUser = {
      id: `mock-user-${Date.now()}`,
      email,
      displayName: email.split('@')[0],
    };

    this.currentUser = newUser;
    this.persist();
    this.notifyListeners();
  }

  async signIn(email: string, password: string): Promise<void> {
    await mockDelay();
    maybeThrow('signIn');
    mockLog('Auth', 'signIn', email);

    const mockUser = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!mockUser) {
      throw new Error('Credenciais inválidas. Tente: dev@coretracker.local / dev123');
    }

    this.currentUser = {
      id: mockUser.id,
      email: mockUser.email,
      displayName: mockUser.displayName,
      avatarUrl: mockUser.avatarUrl,
    };

    this.persist();
    this.notifyListeners();
  }

  async signInWithGoogle(): Promise<void> {
    await mockDelay(800);
    maybeThrow('signInWithGoogle');
    mockLog('Auth', 'signInWithGoogle (auto-login as dev user)');

    // Auto-login as the dev user for Google mock
    const devUser = MOCK_USERS[0];
    this.currentUser = {
      id: devUser.id,
      email: devUser.email,
      displayName: devUser.displayName,
      avatarUrl: devUser.avatarUrl,
    };

    this.persist();
    this.notifyListeners();
  }

  async signOut(): Promise<void> {
    await mockDelay(200);
    mockLog('Auth', 'signOut');
    this.currentUser = null;
    this.persist();
    this.notifyListeners();
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.add(callback);
    // Fire immediately with current state
    callback(this.currentUser);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

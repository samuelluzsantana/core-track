/**
 * Supabase Client
 * 
 * Only initializes when real Supabase credentials are available.
 * In mock mode, this module is never imported (thanks to dynamic imports
 * in the service registry).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('SEU-PROJETO')) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Create a dummy client that will throw meaningful errors if accidentally used.
  // In normal flow, this branch only runs if someone force-imports supabase.ts
  // in mock mode — which shouldn't happen with the service architecture.
  console.warn(
    '[Supabase] Credenciais não configuradas. ' +
    'Se está em modo development com mocks, isso é esperado. ' +
    'Em produção, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  );

  // Use placeholder URL to avoid crash — real services won't be used in mock mode
  _supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key'
  );
}

export const supabase = _supabase;

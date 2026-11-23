import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig, hasSupabaseCredentials } from '../config/env';

let _supabase: SupabaseClient;

if (hasSupabaseCredentials && supabaseConfig.url && supabaseConfig.anonKey) {
  _supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
} else {
  console.warn(
    '[Supabase] Credenciais não configuradas. Operando em fallback local/mock.'
  );
  _supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key'
  );
}

export const supabase = _supabase;

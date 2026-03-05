import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let _supabase: SupabaseClient<Database> | null = null;

/**
 * Initialize the Supabase client with explicit URL and key.
 * Must be called once at app startup before any data access.
 */
export function initSupabase(url: string, anonKey: string): SupabaseClient<Database> {
  _supabase = createClient<Database>(url, anonKey);
  return _supabase;
}

/**
 * Get the initialized Supabase client.
 * Throws if initSupabase() hasn't been called yet.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    throw new Error('Supabase not initialized. Call initSupabase(url, key) first.');
  }
  return _supabase;
}

/**
 * Proxy that lazily accesses the initialized client.
 * Allows importing `supabase` at module level and using it after init.
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

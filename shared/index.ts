// Types
export * from './types';

// Database types
export * from './lib/database.types';

// Supabase client
export { supabase, initSupabase, getSupabase, signUp, signIn, signOut, getCurrentUser, onAuthStateChange } from './lib/supabase';

// Data transformers
export * from './lib/dataTransformers';

// Hooks
export { useProjects, useSuppliers, useProfile, useDebts } from './hooks/useSupabaseData';
export { useMutations } from './hooks/useMutations';

// Auth context
export { AuthProvider, useAuth } from './context/AuthContext';

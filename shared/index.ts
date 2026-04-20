// Types
export * from './types';

// Database types (only non-conflicting exports)
export type { Json, Database, Tables, TablesInsert, TablesUpdate, Profile, Contact, AuditLog } from './lib/database.types';

// Supabase client
export { supabase, initSupabase, getSupabase, signUp, signIn, signOut, getCurrentUser, onAuthStateChange } from './lib/supabase';

// Data transformers
export * from './lib/dataTransformers';

// Hooks
export { useProjects, useSuppliers, useProfile, useDebts } from './hooks/useSupabaseData';
export { useMutations } from './hooks/useMutations';
export { useExchangeRates } from './hooks/useExchangeRates';

// Auth context
export { AuthProvider, useAuth } from './context/AuthContext';

// Data export/import
export { exportUserData, importUserData } from './lib/dataExport';
export type { ExportBundle } from './lib/dataExport';

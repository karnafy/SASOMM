// Types
export * from './types';

// Database types (only non-conflicting exports)
export type { Json, Database, Tables, TablesInsert, TablesUpdate } from './lib/database.types';

// Supabase client
export { supabase, initSupabase, getSupabase, signUp, signIn, signOut, getCurrentUser, onAuthStateChange } from './lib/supabase';

// Data transformers
export * from './lib/dataTransformers';

// Hooks
export { useProjects, useSuppliers, useProfile, useDebts, useRecurringTransactions } from './hooks/useSupabaseData';
export { useMutations } from './hooks/useMutations';
export { useExchangeRates } from './hooks/useExchangeRates';

// Auth context
export { AuthProvider, useAuth } from './context/AuthContext';

// Data export/import
export { exportUserData, importUserData } from './lib/dataExport';
export type { ExportBundle } from './lib/dataExport';

// Recurring occurrence generator (catch-up)
export { generateMissingRecurringOccurrences } from './lib/generateRecurringOccurrences';

// UI helpers
export { confirmDialog } from './lib/confirmDialog';

// Admin BO
export { ADMIN_EMAIL, isAdmin, isAdminScreen } from './admin/guard';
export type { AuthLikeUser } from './admin/guard';

// Internationalization (i18next)
export {
  default as i18n,
  initI18n,
  setLocale,
  getCurrentLocale,
  isRTL,
  SUPPORTED_LOCALES,
} from './lib/i18n';
export type { Locale } from './lib/i18n';

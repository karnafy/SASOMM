// Admin guard — central place that decides who sees the BO.
// Server-side enforcement is via public.is_admin() function in RLS policies.
// Client-side is just UX (hide BO nav for non-admin).

export const ADMIN_EMAIL = 'karnafstudio@gmail.com';

export interface AuthLikeUser {
  id?: string;
  email?: string | null;
}

export function isAdmin(user: AuthLikeUser | null | undefined): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

import { AppScreen } from '../types';

export function isAdminScreen(screen: AppScreen): boolean {
  return String(screen).startsWith('admin_');
}

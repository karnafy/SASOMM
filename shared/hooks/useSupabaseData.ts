import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Project, Supplier, Debt, ReminderInterval } from '../types';
import {
  supabaseProjectToLocal,
  supabaseSupplierToLocal,
} from '../lib/dataTransformers';

// ============================================
// useProjects Hook
// ============================================

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useProjects(userId: string | undefined): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch projects with related expenses, incomes, and activities
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // Fetch all expenses for user's projects
      const projectIds = projectsData.map(p => p.id);

      const [expensesRes, incomesRes, activitiesRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .in('project_id', projectIds)
          .order('date', { ascending: false }),
        supabase
          .from('incomes')
          .select('*')
          .in('project_id', projectIds)
          .order('date', { ascending: false }),
        supabase
          .from('project_activities')
          .select('*')
          .in('project_id', projectIds)
          .order('date', { ascending: false }),
      ]);

      if (expensesRes.error) throw expensesRes.error;
      if (incomesRes.error) throw incomesRes.error;
      if (activitiesRes.error) throw activitiesRes.error;

      const expenses = expensesRes.data || [];
      const incomes = incomesRes.data || [];
      const activities = activitiesRes.data || [];

      // Transform and combine data
      const transformedProjects = projectsData.map(project =>
        supabaseProjectToLocal(
          project,
          expenses.filter(e => e.project_id === project.id),
          incomes.filter(i => i.project_id === project.id),
          activities.filter(a => a.project_id === project.id)
        )
      );

      setProjects(transformedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}

// ============================================
// useSuppliers Hook
// ============================================

interface UseSuppliersResult {
  suppliers: Supplier[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSuppliers(userId: string | undefined): UseSuppliersResult {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuppliers = useCallback(async () => {
    if (!userId) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (suppliersError) throw suppliersError;

      const transformedSuppliers = (data || []).map(supabaseSupplierToLocal);
      setSuppliers(transformedSuppliers);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch suppliers'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    suppliers,
    loading,
    error,
    refetch: fetchSuppliers,
  };
}

// ============================================
// useProfile Hook
// ============================================

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useProfile(userId: string | undefined): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!userId) return;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (updateError) throw updateError;

      await fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  }, [userId, fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}

// ============================================
// useDebts Hook
// ============================================

interface UseDebtsResult {
  debts: Debt[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  saveDebt: (debt: Omit<Debt, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
}

export function useDebts(userId: string | undefined): UseDebtsResult {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDebts = useCallback(async () => {
    if (!userId) {
      setDebts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: debtsError } = await (supabase as any)
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (debtsError) throw debtsError;

      const transformedDebts: Debt[] = ((data as any[]) || []).map((row: any) => ({
        id: row.id,
        personName: row.person_name,
        personPhone: row.person_phone || undefined,
        amount: row.amount,
        currency: row.currency as Debt['currency'],
        projectId: row.project_id || undefined,
        projectName: row.project_name || undefined,
        notes: row.notes || undefined,
        reminderInterval: (row.reminder_interval || 'none') as ReminderInterval,
        lastReminderDate: row.last_reminder_date || undefined,
        nextReminderDate: row.next_reminder_date || undefined,
        createdAt: row.created_at || new Date().toISOString(),
        isPaid: row.is_paid || false,
        imageUrl: row.image_url || undefined,
      }));

      setDebts(transformedDebts);
    } catch (err) {
      console.error('Error fetching debts:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch debts'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveDebt = useCallback(async (debt: Omit<Debt, 'id' | 'createdAt'> & { id?: string }) => {
    if (!userId) throw new Error('User not authenticated');

    const dbData = {
      user_id: userId,
      person_name: debt.personName,
      person_phone: debt.personPhone || null,
      amount: debt.amount,
      currency: debt.currency,
      project_id: debt.projectId || null,
      project_name: debt.projectName || null,
      notes: debt.notes || null,
      reminder_interval: debt.reminderInterval,
      last_reminder_date: debt.lastReminderDate || null,
      next_reminder_date: debt.nextReminderDate || null,
      is_paid: debt.isPaid || false,
      image_url: debt.imageUrl || null,
    };

    if (debt.id) {
      // Update existing
      const { error } = await (supabase as any)
        .from('debts')
        .update(dbData)
        .eq('id', debt.id);
      if (error) throw error;
    } else {
      // Insert new
      const { error } = await (supabase as any)
        .from('debts')
        .insert(dbData);
      if (error) throw error;
    }

    await fetchDebts();
  }, [userId, fetchDebts]);

  const deleteDebt = useCallback(async (id: string) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await (supabase as any)
      .from('debts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await fetchDebts();
  }, [userId, fetchDebts]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  return {
    debts,
    loading,
    error,
    refetch: fetchDebts,
    saveDebt,
    deleteDebt,
  };
}

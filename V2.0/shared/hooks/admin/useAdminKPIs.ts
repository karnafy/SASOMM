// Read aggregated KPIs from public.admin_kpi_view + extra real DB queries.
// All numbers from existing data — no fake mocks.
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface AdminKpis {
  totalUsers: number;
  newSignups7d: number;
  newSignups30d: number;
  totalProjects: number;
  totalExpenses: number;
  totalIncomes: number;
  totalBudgetIls: number;
  totalSpentIls: number;
  totalIncomeIls: number;
  netIls: number;
  openFeedback: number;
  openTodos: number;
  actionsToday: number;
  actionsThisMonth: number;
  activeLast30d: number;
}

interface Result {
  data: AdminKpis | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminKPIs(): Result {
  const [data, setData] = useState<AdminKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      // 1) Pre-aggregated KPIs
      const { data: kpi, error: e1 } = await supabase
        .from('admin_kpi_view')
        .select('*')
        .single();
      if (e1) throw new Error(e1.message);

      // 2) Real money totals from projects/expenses/incomes
      const [{ data: proj, error: e2 }, { data: exp, error: e3 }, { data: inc, error: e4 }] = await Promise.all([
        supabase.from('projects').select('budget'),
        supabase.from('expenses').select('amount'),
        supabase.from('incomes').select('amount'),
      ]);
      if (e2) throw new Error(e2.message);
      if (e3) throw new Error(e3.message);
      if (e4) throw new Error(e4.message);

      const sum = (rows: any[] | null, field: string) =>
        (rows ?? []).reduce((s, r) => s + Number(r[field] ?? 0), 0);
      const totalBudgetIls = sum(proj, 'budget');
      const totalSpentIls = sum(exp, 'amount');
      const totalIncomeIls = sum(inc, 'amount');

      // 3) Active last 30d via auth.users last_sign_in_at
      // RLS blocks auth.users from regular SELECT, so admin_users_view is used.
      const { count: active30 } = await supabase
        .from('admin_users_view')
        .select('id', { head: true, count: 'exact' })
        .gte('last_sign_in_at', new Date(Date.now() - 30 * 86_400_000).toISOString());

      setData({
        totalUsers: kpi.total_users,
        newSignups7d: kpi.new_signups_7d,
        newSignups30d: kpi.new_signups_30d,
        totalProjects: (proj ?? []).length,
        totalExpenses: (exp ?? []).length,
        totalIncomes: (inc ?? []).length,
        totalBudgetIls,
        totalSpentIls,
        totalIncomeIls,
        netIls: totalIncomeIls - totalSpentIls,
        openFeedback: kpi.open_feedback,
        openTodos: kpi.open_todos,
        actionsToday: kpi.actions_today,
        actionsThisMonth: kpi.actions_this_month,
        activeLast30d: active30 ?? 0,
      });
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

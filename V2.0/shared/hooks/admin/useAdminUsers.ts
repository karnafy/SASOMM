// Reads admin_users_view — RLS-protected, only admin sees data.
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  signupAt: string;
  lastSignInAt: string | null;
  projectCount: number;
  transactionCount: number;
  lastSessionAt: string | null;
  lastPlatform: string | null;
}

interface Result {
  data: AdminUserRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminUsers(): Result {
  const [data, setData] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: rows, error: err } = await supabase
      .from('admin_users_view')
      .select('*')
      .order('signup_at', { ascending: false });
    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setError(null);
      setData((rows ?? []).map((r: any) => ({
        id: r.id,
        email: r.email,
        fullName: r.full_name,
        phone: r.phone,
        signupAt: r.signup_at,
        lastSignInAt: r.last_sign_in_at,
        projectCount: r.project_count,
        transactionCount: r.transaction_count,
        lastSessionAt: r.last_session_at,
        lastPlatform: r.last_platform,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

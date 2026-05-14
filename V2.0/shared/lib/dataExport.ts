import { supabase } from './supabase';

export interface ExportBundle {
  version: number;
  exportedAt: string;
  userId: string;
  projects: any[];
  expenses: any[];
  incomes: any[];
  suppliers: any[];
  contacts: any[];
  project_activities: any[];
  debts: any[];
  project_supplier_allocations: any[];
  payment_milestones: any[];
}

const EXPORT_VERSION = 1;

const TABLES_WITH_USER_ID = [
  'projects',
  'expenses',
  'incomes',
  'suppliers',
  'contacts',
  'project_activities',
  'debts',
  'project_supplier_allocations',
] as const;

export async function exportUserData(userId: string): Promise<ExportBundle> {
  if (!userId) throw new Error('userId is required');

  const bundle: ExportBundle = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    userId,
    projects: [],
    expenses: [],
    incomes: [],
    suppliers: [],
    contacts: [],
    project_activities: [],
    debts: [],
    project_supplier_allocations: [],
    payment_milestones: [],
  };

  for (const table of TABLES_WITH_USER_ID) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select('*')
      .eq('user_id', userId);
    if (error) throw new Error(`Failed to read ${table}: ${error.message}`);
    (bundle as any)[table] = data || [];
  }

  const allocationIds = bundle.project_supplier_allocations.map((a) => a.id);
  if (allocationIds.length > 0) {
    const { data, error } = await (supabase as any)
      .from('payment_milestones')
      .select('*')
      .in('allocation_id', allocationIds);
    if (error) throw new Error(`Failed to read payment_milestones: ${error.message}`);
    bundle.payment_milestones = data || [];
  }

  return bundle;
}

interface ImportResult {
  projects: number;
  expenses: number;
  incomes: number;
  suppliers: number;
  contacts: number;
  project_activities: number;
  debts: number;
  project_supplier_allocations: number;
  payment_milestones: number;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function importUserData(
  bundle: ExportBundle,
  targetUserId: string
): Promise<ImportResult> {
  if (!targetUserId) throw new Error('targetUserId is required');
  if (!bundle || typeof bundle !== 'object') throw new Error('Invalid bundle');
  if (bundle.version !== EXPORT_VERSION) {
    throw new Error(`Unsupported export version: ${bundle.version}`);
  }

  const projectIdMap = new Map<string, string>();
  const supplierIdMap = new Map<string, string>();
  const allocationIdMap = new Map<string, string>();

  const result: ImportResult = {
    projects: 0,
    expenses: 0,
    incomes: 0,
    suppliers: 0,
    contacts: 0,
    project_activities: 0,
    debts: 0,
    project_supplier_allocations: 0,
    payment_milestones: 0,
  };

  const suppliers = (bundle.suppliers || []).map((s: any) => {
    const newId = generateId();
    supplierIdMap.set(s.id, newId);
    return { ...s, id: newId, user_id: targetUserId, created_at: undefined, updated_at: undefined };
  });
  if (suppliers.length) {
    const { error } = await (supabase as any).from('suppliers').insert(suppliers);
    if (error) throw new Error(`suppliers: ${error.message}`);
    result.suppliers = suppliers.length;
  }

  const projects = (bundle.projects || []).map((p: any) => {
    const newId = generateId();
    projectIdMap.set(p.id, newId);
    return {
      ...p,
      id: newId,
      user_id: targetUserId,
      primary_supplier_id: p.primary_supplier_id
        ? supplierIdMap.get(p.primary_supplier_id) || null
        : null,
      created_at: undefined,
      updated_at: undefined,
    };
  });
  if (projects.length) {
    const { error } = await (supabase as any).from('projects').insert(projects);
    if (error) throw new Error(`projects: ${error.message}`);
    result.projects = projects.length;
  }

  const remapRow = (row: any) => ({
    ...row,
    id: generateId(),
    user_id: targetUserId,
    project_id: row.project_id ? projectIdMap.get(row.project_id) || null : null,
    supplier_id: row.supplier_id ? supplierIdMap.get(row.supplier_id) || null : null,
    created_at: undefined,
    updated_at: undefined,
  });

  const expenses = (bundle.expenses || []).map(remapRow);
  if (expenses.length) {
    const { error } = await (supabase as any).from('expenses').insert(expenses);
    if (error) throw new Error(`expenses: ${error.message}`);
    result.expenses = expenses.length;
  }

  const incomes = (bundle.incomes || []).map(remapRow);
  if (incomes.length) {
    const { error } = await (supabase as any).from('incomes').insert(incomes);
    if (error) throw new Error(`incomes: ${error.message}`);
    result.incomes = incomes.length;
  }

  const contacts = (bundle.contacts || []).map((c: any) => ({
    ...c,
    id: generateId(),
    user_id: targetUserId,
    created_at: undefined,
    updated_at: undefined,
  }));
  if (contacts.length) {
    const { error } = await (supabase as any).from('contacts').insert(contacts);
    if (error) throw new Error(`contacts: ${error.message}`);
    result.contacts = contacts.length;
  }

  const activities = (bundle.project_activities || []).map(remapRow);
  if (activities.length) {
    const { error } = await (supabase as any)
      .from('project_activities')
      .insert(activities);
    if (error) throw new Error(`project_activities: ${error.message}`);
    result.project_activities = activities.length;
  }

  const debts = (bundle.debts || []).map((d: any) => ({
    ...d,
    id: generateId(),
    user_id: targetUserId,
    project_id: d.project_id ? projectIdMap.get(d.project_id) || null : null,
    created_at: undefined,
  }));
  if (debts.length) {
    const { error } = await (supabase as any).from('debts').insert(debts);
    if (error) throw new Error(`debts: ${error.message}`);
    result.debts = debts.length;
  }

  const allocations = (bundle.project_supplier_allocations || [])
    .map((a: any) => {
      const projectId = projectIdMap.get(a.project_id);
      const supplierId = supplierIdMap.get(a.supplier_id);
      if (!projectId || !supplierId) return null;
      const newId = generateId();
      allocationIdMap.set(a.id, newId);
      return {
        ...a,
        id: newId,
        user_id: targetUserId,
        project_id: projectId,
        supplier_id: supplierId,
        created_at: undefined,
      };
    })
    .filter(Boolean);
  if (allocations.length) {
    const { error } = await (supabase as any)
      .from('project_supplier_allocations')
      .insert(allocations);
    if (error) throw new Error(`project_supplier_allocations: ${error.message}`);
    result.project_supplier_allocations = allocations.length;
  }

  const milestones = (bundle.payment_milestones || [])
    .map((m: any) => {
      const allocationId = allocationIdMap.get(m.allocation_id);
      if (!allocationId) return null;
      return {
        ...m,
        id: generateId(),
        allocation_id: allocationId,
        created_at: undefined,
      };
    })
    .filter(Boolean);
  if (milestones.length) {
    const { error } = await (supabase as any)
      .from('payment_milestones')
      .insert(milestones);
    if (error) throw new Error(`payment_milestones: ${error.message}`);
    result.payment_milestones = milestones.length;
  }

  return result;
}

import type {
  Project, Expense, Income, Supplier, ProjectActivity, AuditEntry,
  Currency, MainCategory
} from '../types';
import type { Tables, TablesInsert } from './database.types';

// ============================================
// Supabase → Local Type Transformers
// ============================================

export function supabaseExpenseToLocal(row: Tables<'expenses'>): Expense {
  return {
    id: row.id,
    icon: row.icon || 'payments',
    title: row.title,
    tag: row.tag || '',
    date: formatDateForDisplay(row.date),
    amount: row.amount,
    currency: (row.currency as Currency) || 'ILS',
    color: row.color || 'text-rose-500',
    supplierId: row.supplier_id || undefined,
    type: 'expense',
    receiptImages: row.receipt_images || undefined,
    paymentMethod: row.payment_method || undefined,
    includesVat: row.includes_vat || false,
    created_at: (row as any).created_at || undefined,
  };
}

export function supabaseIncomeToLocal(row: Tables<'incomes'>): Income {
  return {
    id: row.id,
    icon: row.icon || 'payments',
    title: row.title,
    tag: row.tag || '',
    date: formatDateForDisplay(row.date),
    amount: row.amount,
    currency: (row.currency as Currency) || 'ILS',
    color: row.color || 'text-emerald-500',
    supplierId: row.supplier_id || undefined,
    type: 'income',
    receiptImages: row.receipt_images || undefined,
    paymentMethod: row.payment_method || undefined,
    includesVat: row.includes_vat || false,
    created_at: (row as any).created_at || undefined,
  };
}

export function supabaseActivityToLocal(row: Tables<'project_activities'>): ProjectActivity {
  return {
    id: row.id,
    type: row.type as ProjectActivity['type'],
    title: row.title,
    date: row.date || new Date().toISOString(),
    amount: row.amount || undefined,
    oldValue: row.old_value || undefined,
    newValue: row.new_value || undefined,
    tag: row.tag || undefined,
    icon: row.icon || undefined,
    supplierId: row.supplier_id || undefined,
    receiptImages: row.receipt_images || undefined,
    transactionId: row.transaction_id || undefined,
  };
}

export function supabaseProjectToLocal(
  row: Tables<'projects'>,
  expenses: Tables<'expenses'>[],
  incomes: Tables<'incomes'>[],
  activities: Tables<'project_activities'>[]
): Project {
  return {
    id: row.id,
    name: row.name,
    budget: row.budget || 0,
    budgetCurrency: (row.budget_currency as Currency) || 'ILS',
    budgetIncludesVat: row.budget_includes_vat || false,
    spent: row.spent || 0,
    income: row.income || 0,
    status: (row.status as 'ok' | 'warning' | 'over') || 'ok',
    category: row.category || '',
    mainCategory: (row.main_category as MainCategory) || 'other',
    icon: row.icon || 'folder',
    expenses: expenses.map(supabaseExpenseToLocal),
    incomes: incomes.map(supabaseIncomeToLocal),
    history: activities.map(supabaseActivityToLocal),
    primarySupplierId: row.primary_supplier_id || undefined,
  };
}

export function supabaseSupplierToLocal(row: Tables<'suppliers'>): Supplier {
  return {
    id: row.id,
    name: row.name,
    status: (row.status as 'debt' | 'credit' | 'settled') || 'settled',
    amount: row.amount || 0,
    lastActive: row.last_active ? formatDateForDisplay(row.last_active.split('T')[0]) : 'היום',
    avatar: row.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=random`,
    category: row.category || '',
    phone: row.phone || '',
  };
}

// ============================================
// Local → Supabase Type Transformers
// ============================================

export function localExpenseToSupabase(
  expense: Partial<Expense>,
  projectId: string,
  userId: string
): TablesInsert<'expenses'> {
  return {
    id: expense.id,
    project_id: projectId,
    user_id: userId,
    supplier_id: expense.supplierId || null,
    title: expense.title || '',
    tag: expense.tag || null,
    icon: expense.icon || 'payments',
    color: expense.color || 'text-rose-500',
    date: formatDateForDB(expense.date || new Date().toLocaleDateString('he-IL')),
    amount: expense.amount || 0,
    currency: expense.currency || 'ILS',
    payment_method: expense.paymentMethod || null,
    includes_vat: expense.includesVat || false,
    receipt_images: expense.receiptImages || null,
  };
}

export function localIncomeToSupabase(
  income: Partial<Income>,
  projectId: string,
  userId: string
): TablesInsert<'incomes'> {
  return {
    id: income.id,
    project_id: projectId,
    user_id: userId,
    supplier_id: income.supplierId || null,
    title: income.title || '',
    tag: income.tag || null,
    icon: income.icon || 'payments',
    color: income.color || 'text-emerald-500',
    date: formatDateForDB(income.date || new Date().toLocaleDateString('he-IL')),
    amount: income.amount || 0,
    currency: income.currency || 'ILS',
    payment_method: income.paymentMethod || null,
    includes_vat: income.includesVat || false,
    receipt_images: income.receiptImages || null,
  };
}

export function localProjectToSupabase(
  project: Partial<Project>,
  userId: string
): TablesInsert<'projects'> {
  return {
    id: project.id,
    user_id: userId,
    name: project.name || '',
    budget: project.budget || 0,
    budget_currency: project.budgetCurrency || 'ILS',
    budget_includes_vat: project.budgetIncludesVat || false,
    spent: project.spent || 0,
    income: project.income || 0,
    status: project.status || 'ok',
    category: project.category || null,
    main_category: project.mainCategory || 'other',
    icon: project.icon || 'folder',
    primary_supplier_id: project.primarySupplierId || null,
  };
}

export function localSupplierToSupabase(
  supplier: Partial<Supplier>,
  userId: string
): TablesInsert<'suppliers'> {
  return {
    id: supplier.id,
    user_id: userId,
    name: supplier.name || '',
    status: supplier.status || 'settled',
    amount: supplier.amount || 0,
    last_active: new Date().toISOString(),
    avatar: supplier.avatar || null,
    category: supplier.category || null,
    phone: supplier.phone || null,
  };
}

export function localActivityToSupabase(
  activity: Partial<ProjectActivity>,
  projectId: string,
  userId: string
): TablesInsert<'project_activities'> {
  return {
    id: activity.id,
    project_id: projectId,
    user_id: userId,
    type: activity.type || null,
    title: activity.title || '',
    date: activity.date || new Date().toISOString(),
    amount: activity.amount || null,
    old_value: activity.oldValue || null,
    new_value: activity.newValue || null,
    tag: activity.tag || null,
    icon: activity.icon || null,
    supplier_id: activity.supplierId || null,
    receipt_images: activity.receiptImages || null,
    transaction_id: activity.transactionId || null,
  };
}

// ============================================
// Date Helpers
// ============================================

// Convert DB date (YYYY-MM-DD) to display format (DD.MM.YYYY)
function formatDateForDisplay(dbDate: string): string {
  if (!dbDate) return new Date().toLocaleDateString('he-IL');

  // Handle ISO date or already formatted
  if (dbDate.includes('.')) return dbDate;

  const [year, month, day] = dbDate.split('-');
  return `${day}.${month}.${year}`;
}

// Convert display date (DD.MM.YYYY) to DB format (YYYY-MM-DD)
function formatDateForDB(displayDate: string): string {
  if (!displayDate) return new Date().toISOString().split('T')[0];

  // Handle already DB format
  if (displayDate.includes('-') && !displayDate.includes('T')) return displayDate;

  // Handle ISO format
  if (displayDate.includes('T')) return displayDate.split('T')[0];

  const [day, month, year] = displayDate.split('.');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

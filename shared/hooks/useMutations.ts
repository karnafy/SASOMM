import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Currency, MainCategory, RecurringTransaction } from '../types';
import {
  localExpenseToSupabase,
  localIncomeToSupabase,
  localProjectToSupabase,
  localSupplierToSupabase,
  localActivityToSupabase,
  localRecurringToSupabase,
} from '../lib/dataTransformers';
import { useExchangeRates } from './useExchangeRates';

// ============================================
// Transaction Data Types
// ============================================

interface TransactionData {
  amount: number;
  currency: Currency;
  description: string;
  category: string;
  supplierId?: string;
  receiptImages?: string[];
  paymentMethod?: string;
  includesVat?: boolean;
  date?: string;
}

interface CreateProjectData {
  name: string;
  budget: number;
  budgetCurrency?: Currency;
  budgetIncludesVat?: boolean;
  category: string;
  mainCategory: MainCategory;
  icon?: string;
}

interface CreateSupplierData {
  name: string;
  category: string;
  phone?: string;
  avatar?: string;
}

// ============================================
// useMutations Hook
// ============================================

export function useMutations(userId: string | undefined) {
  const { rates: CONVERSION_RATES } = useExchangeRates();

  // ============================================
  // Save Transaction (Create/Edit Expense or Income)
  // ============================================

  const saveTransaction = useCallback(async (
    type: 'expense' | 'income',
    projectId: string,
    data: TransactionData,
    editId?: string,
    originalType?: 'expense' | 'income' // Original type when editing (to detect type changes)
  ) => {
    if (!userId) throw new Error('User not authenticated');

    const table = type === 'expense' ? 'expenses' : 'incomes';
    const originalTable = originalType ? (originalType === 'expense' ? 'expenses' : 'incomes') : table;
    const typeChanged = editId && originalType && originalType !== type;

    // Convert amount to ILS for storage
    const amountInILS = data.amount / CONVERSION_RATES[data.currency];

    // Track original currency/amount if not ILS
    const originalAmount = data.currency !== 'ILS' ? data.amount : undefined;
    const originalCurrency = data.currency !== 'ILS' ? data.currency : undefined;

    // If editing, get old transaction from ORIGINAL table to calculate balance reversal
    let oldTransaction: any = null;
    if (editId) {
      const { data: oldData } = await supabase
        .from(originalTable) // Use original table, not new table
        .select('*')
        .eq('id', editId)
        .single();
      oldTransaction = oldData;
    }

    // Prepare transaction data
    const transactionData = type === 'expense'
      ? localExpenseToSupabase({
          id: editId,
          title: data.description,
          tag: data.category,
          amount: amountInILS,
          currency: 'ILS', // Always store in ILS for calculations
          originalAmount,
          originalCurrency,
          supplierId: data.supplierId,
          receiptImages: data.receiptImages,
          paymentMethod: data.paymentMethod,
          includesVat: data.includesVat,
          date: data.date,
        }, projectId, userId)
      : localIncomeToSupabase({
          id: editId,
          title: data.description,
          tag: data.category,
          amount: amountInILS,
          currency: 'ILS',
          originalAmount,
          originalCurrency,
          supplierId: data.supplierId,
          receiptImages: data.receiptImages,
          paymentMethod: data.paymentMethod,
          includesVat: data.includesVat,
          date: data.date,
        }, projectId, userId);

    // Remove id if not editing (let Supabase generate)
    if (!editId) {
      delete transactionData.id;
    }

    // Revert old supplier balance if editing
    if (oldTransaction?.supplier_id) {
      // Always revert old balance when editing (using ORIGINAL type for correct reversal)
      await updateSupplierBalance(
        oldTransaction.supplier_id,
        oldTransaction.amount,
        originalType || type, // Use original type for correct reversal
        true // isReversal
      );
    }

    // Insert or Update transaction
    if (typeChanged && editId) {
      // Type changed: delete from old table, insert into new table
      const { error: deleteError } = await supabase
        .from(originalTable)
        .delete()
        .eq('id', editId);
      if (deleteError) throw deleteError;

      // Insert into new table (remove id to let Supabase generate new one)
      delete transactionData.id;
      const { error: insertError } = await supabase
        .from(table)
        .insert(transactionData);
      if (insertError) throw insertError;
    } else if (editId) {
      // Same type: update in same table
      const { error } = await supabase
        .from(table)
        .update(transactionData)
        .eq('id', editId);
      if (error) throw error;
    } else {
      // New transaction: insert
      const { error } = await supabase
        .from(table)
        .insert(transactionData);
      if (error) {
        console.error('[saveTransaction] insert failed', { table, error, transactionData });
        throw error;
      }
      console.log('[saveTransaction] inserted', { table });
    }

    // Update project totals
    await recalculateProjectTotals(projectId);

    // Apply new supplier balance (old balance was already reverted above)
    if (data.supplierId) {
      await updateSupplierBalance(data.supplierId, amountInILS, type, false);
    }

    // Create activity entry for edits
    if (editId && oldTransaction) {
      await createActivityEntry(projectId, 'transaction_update', {
        title: `עריכת ${type === 'expense' ? 'הוצאה' : 'הכנסה'}: ${data.description}`,
        oldValue: `${oldTransaction.amount.toLocaleString()} ₪`,
        newValue: `${amountInILS.toLocaleString()} ₪`,
        amount: amountInILS,
        transactionId: editId,
      });
    }

  }, [userId]);

  // ============================================
  // Update Supplier Balance
  // ============================================

  const updateSupplierBalance = useCallback(async (
    supplierId: string,
    amount: number,
    transactionType: 'expense' | 'income',
    isReversal: boolean = false
  ) => {
    // Fetch current supplier
    const { data: supplier, error: fetchError } = await supabase
      .from('suppliers')
      .select('amount, status')
      .eq('id', supplierId)
      .single();

    if (fetchError || !supplier) {
      console.error('Error fetching supplier:', fetchError);
      return;
    }

    // Calculate current signed balance
    const supplierAmount = supplier.amount ?? 0;
    let signedBalance = supplier.status === 'credit'
      ? supplierAmount
      : supplier.status === 'debt'
        ? -supplierAmount
        : 0;

    // Apply adjustment based on transaction type
    // Expense = we owe supplier (negative for us, positive for supplier)
    // Income = supplier owes us (positive for us)
    if (isReversal) {
      // Reverting: do the opposite
      if (transactionType === 'expense') {
        signedBalance += amount; // Was debt, now less debt
      } else {
        signedBalance -= amount; // Was credit, now less credit
      }
    } else {
      if (transactionType === 'expense') {
        signedBalance -= amount; // More debt to supplier
      } else {
        signedBalance += amount; // Supplier paid us
      }
    }

    // Determine new status
    const newStatus = signedBalance > 0.01 ? 'credit'
      : signedBalance < -0.01 ? 'debt'
      : 'settled';

    // Update supplier
    const { error: updateError } = await supabase
      .from('suppliers')
      .update({
        amount: Math.abs(signedBalance),
        status: newStatus,
        last_active: new Date().toISOString(),
      })
      .eq('id', supplierId);

    if (updateError) {
      console.error('Error updating supplier balance:', updateError);
    }
  }, []);

  // ============================================
  // Recalculate Project Totals
  // ============================================

  const recalculateProjectTotals = useCallback(async (projectId: string) => {
    // Sum all expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('project_id', projectId);

    const totalSpent = (expenses || []).reduce((sum, e) => sum + e.amount, 0);

    // Sum all incomes
    const { data: incomes } = await supabase
      .from('incomes')
      .select('amount')
      .eq('project_id', projectId);

    const totalIncome = (incomes || []).reduce((sum, i) => sum + i.amount, 0);

    // Calculate status based on income vs expenses (contractor semantics)
    let status: 'ok' | 'warning' | 'over' = 'ok';
    if (totalSpent > totalIncome) {
      status = 'over';
    } else if (totalIncome > 0 && totalSpent / totalIncome >= 0.9) {
      status = 'warning';
    }

    // Update project
    await supabase
      .from('projects')
      .update({
        spent: totalSpent,
        income: totalIncome,
        status,
      })
      .eq('id', projectId);
  }, []);

  // ============================================
  // Create Activity Entry
  // ============================================

  const createActivityEntry = useCallback(async (
    projectId: string,
    type: 'budget_change' | 'note' | 'expense' | 'income' | 'transaction_update',
    data: {
      title: string;
      amount?: number;
      oldValue?: string;
      newValue?: string;
      tag?: string;
      supplierId?: string;
      transactionId?: string;
    }
  ) => {
    if (!userId) return;

    const activity = localActivityToSupabase({
      type,
      title: data.title,
      amount: data.amount,
      oldValue: data.oldValue,
      newValue: data.newValue,
      tag: data.tag,
      supplierId: data.supplierId,
      transactionId: data.transactionId,
    }, projectId, userId);

    await supabase.from('project_activities').insert(activity);
  }, [userId]);

  // ============================================
  // Project CRUD
  // ============================================

  const createProject = useCallback(async (data: CreateProjectData) => {
    if (!userId) throw new Error('User not authenticated');

    const projectData = localProjectToSupabase({
      name: data.name,
      budget: data.budget,
      budgetCurrency: data.budgetCurrency || 'ILS',
      budgetIncludesVat: data.budgetIncludesVat || false,
      category: data.category,
      mainCategory: data.mainCategory,
      icon: data.icon || 'folder',
      spent: 0,
      income: 0,
      status: 'ok',
    }, userId);

    delete projectData.id; // Let Supabase generate

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) throw error;
    return newProject;
  }, [userId]);

  const updateProject = useCallback(async (
    projectId: string,
    updates: {
      name?: string;
      budget?: number;
      category?: string;
      mainCategory?: MainCategory;
      icon?: string;
    }
  ) => {
    if (!userId) throw new Error('User not authenticated');

    // If budget changed, create activity entry
    if (updates.budget !== undefined) {
      const { data: oldProject } = await supabase
        .from('projects')
        .select('budget')
        .eq('id', projectId)
        .single();

      if (oldProject && oldProject.budget !== updates.budget) {
        await createActivityEntry(projectId, 'budget_change', {
          title: 'עדכון תקציב',
          oldValue: `${(oldProject.budget ?? 0).toLocaleString()} ₪`,
          newValue: `${updates.budget.toLocaleString()} ₪`,
        });
      }
    }

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.budget !== undefined) updateData.budget = updates.budget;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.mainCategory !== undefined) updateData.main_category = updates.mainCategory;
    if (updates.icon !== undefined) updateData.icon = updates.icon;

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (error) throw error;

    // Recalculate status if budget changed
    if (updates.budget !== undefined) {
      await recalculateProjectTotals(projectId);
    }
  }, [userId, createActivityEntry, recalculateProjectTotals]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!userId) throw new Error('User not authenticated');

    // Cascade delete handled by Supabase FK constraints
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  }, [userId]);

  const addNoteToProject = useCallback(async (projectId: string, note: string, images?: string[]) => {
    if (!userId) throw new Error('User not authenticated');

    const activity = localActivityToSupabase({
      type: 'note',
      title: note,
      receiptImages: images,
    }, projectId, userId);

    await supabase.from('project_activities').insert(activity);
  }, [userId]);

  // ============================================
  // Supplier CRUD
  // ============================================

  const createSupplier = useCallback(async (data: CreateSupplierData) => {
    if (!userId) throw new Error('User not authenticated');

    const supplierData = localSupplierToSupabase({
      name: data.name,
      category: data.category,
      phone: data.phone,
      avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
      status: 'settled',
      amount: 0,
    }, userId);

    delete supplierData.id; // Let Supabase generate

    const { data: newSupplier, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();

    if (error) throw error;
    return newSupplier;
  }, [userId]);

  const updateSupplier = useCallback(async (
    supplierId: string,
    updates: {
      name?: string;
      category?: string;
      phone?: string;
      avatar?: string;
    }
  ) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', supplierId);

    if (error) throw error;
  }, [userId]);

  const deleteSupplier = useCallback(async (supplierId: string) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId);

    if (error) throw error;
  }, [userId]);

  // ============================================
  // Delete Transaction
  // ============================================

  const deleteTransaction = useCallback(async (
    type: 'expense' | 'income',
    transactionId: string,
    projectId: string
  ) => {
    if (!userId) throw new Error('User not authenticated');

    const table = type === 'expense' ? 'expenses' : 'incomes';

    // Get transaction to revert supplier balance
    const { data: transaction } = await supabase
      .from(table)
      .select('*')
      .eq('id', transactionId)
      .single();

    if (transaction?.supplier_id) {
      await updateSupplierBalance(
        transaction.supplier_id,
        transaction.amount,
        type,
        true // isReversal
      );
    }

    // Delete transaction
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', transactionId);

    if (error) throw error;

    // Recalculate project totals
    await recalculateProjectTotals(projectId);
  }, [userId, updateSupplierBalance, recalculateProjectTotals]);

  // ============================================
  // Recurring Templates CRUD
  // ============================================

  const saveRecurringTemplate = useCallback(async (
    template: Partial<RecurringTransaction>
  ): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');

    // Convert amount to ILS for consistency with regular transactions
    const currency = template.currency || 'ILS';
    const amountInILS = (template.amount ?? 0) / CONVERSION_RATES[currency];

    const dbData = localRecurringToSupabase({
      ...template,
      amount: amountInILS,
      currency: 'ILS',
    }, userId);

    if (template.id) {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ ...dbData, updated_at: new Date().toISOString() })
        .eq('id', template.id);
      if (error) throw error;
      return template.id;
    } else {
      delete dbData.id;
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert(dbData)
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    }
  }, [userId, CONVERSION_RATES]);

  const pauseRecurringTemplate = useCallback(async (
    templateId: string,
    isActive: boolean
  ) => {
    if (!userId) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('recurring_transactions')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', templateId);
    if (error) throw error;
  }, [userId]);

  const deleteRecurringTemplate = useCallback(async (
    templateId: string,
    options?: { deleteGeneratedRows?: boolean }
  ) => {
    if (!userId) throw new Error('User not authenticated');

    if (options?.deleteGeneratedRows) {
      // Need to find affected projects to recalc totals after deletion
      const [{ data: expRows }, { data: incRows }] = await Promise.all([
        supabase
          .from('expenses')
          .select('project_id')
          .eq('recurring_template_id', templateId),
        supabase
          .from('incomes')
          .select('project_id')
          .eq('recurring_template_id', templateId),
      ]);
      const affectedProjectIds = new Set<string>([
        ...((expRows || []).map((r: any) => r.project_id)),
        ...((incRows || []).map((r: any) => r.project_id)),
      ]);

      await Promise.all([
        supabase.from('expenses').delete().eq('recurring_template_id', templateId),
        supabase.from('incomes').delete().eq('recurring_template_id', templateId),
      ]);

      await Promise.all(
        Array.from(affectedProjectIds).map((pid) => recalculateProjectTotals(pid))
      );
    }

    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', templateId);
    if (error) throw error;
  }, [userId, recalculateProjectTotals]);

  /**
   * Propagate edits across a recurring series based on scope.
   * - 'this': caller already updated the single row via saveTransaction; nothing more to do.
   * - 'this_and_future': updates the template's mutable fields, advances template.start_date
   *    to the cursor date, and updates all generated rows with date >= cursor.
   * - 'all': updates the template's mutable fields and updates ALL generated rows.
   */
  const applyRecurringEdit = useCallback(async (
    templateId: string,
    type: 'expense' | 'income',
    scope: 'this' | 'this_and_future' | 'all',
    cursorDate: string, // YYYY-MM-DD of the instance being edited
    updates: {
      title?: string;
      tag?: string;
      amount?: number;        // already in ILS
      currency?: Currency;
      paymentMethod?: string;
      includesVat?: boolean;
      supplierId?: string;
    }
  ) => {
    if (!userId) throw new Error('User not authenticated');
    if (scope === 'this') return;

    const table = type === 'expense' ? 'expenses' : 'incomes';

    const templatePatch: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) templatePatch.title = updates.title;
    if (updates.tag !== undefined) templatePatch.tag = updates.tag;
    if (updates.amount !== undefined) templatePatch.amount = updates.amount;
    if (updates.currency !== undefined) templatePatch.currency = updates.currency;
    if (updates.paymentMethod !== undefined) templatePatch.payment_method = updates.paymentMethod;
    if (updates.includesVat !== undefined) templatePatch.includes_vat = updates.includesVat;
    if (updates.supplierId !== undefined) templatePatch.supplier_id = updates.supplierId;
    if (scope === 'this_and_future') templatePatch.start_date = cursorDate;

    const { error: tplErr } = await supabase
      .from('recurring_transactions')
      .update(templatePatch)
      .eq('id', templateId);
    if (tplErr) throw tplErr;

    const rowPatch: any = {};
    if (updates.title !== undefined) rowPatch.title = updates.title;
    if (updates.tag !== undefined) rowPatch.tag = updates.tag;
    if (updates.amount !== undefined) rowPatch.amount = updates.amount;
    if (updates.currency !== undefined) rowPatch.currency = updates.currency;
    if (updates.paymentMethod !== undefined) rowPatch.payment_method = updates.paymentMethod;
    if (updates.includesVat !== undefined) rowPatch.includes_vat = updates.includesVat;
    if (updates.supplierId !== undefined) rowPatch.supplier_id = updates.supplierId;

    if (Object.keys(rowPatch).length > 0) {
      let q = supabase
        .from(table)
        .update(rowPatch)
        .eq('recurring_template_id', templateId);
      if (scope === 'this_and_future') q = q.gte('date', cursorDate);
      const { error: rowErr } = await q;
      if (rowErr) throw rowErr;
    }

    // Recalc project totals for all touched projects
    const { data: affectedRows } = await supabase
      .from(table)
      .select('project_id')
      .eq('recurring_template_id', templateId);
    const projectIds = new Set<string>((affectedRows || []).map((r: any) => r.project_id));
    await Promise.all(
      Array.from(projectIds).map((pid) => recalculateProjectTotals(pid))
    );
  }, [userId, recalculateProjectTotals]);

  return {
    saveTransaction,
    createProject,
    updateProject,
    deleteProject,
    addNoteToProject,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    deleteTransaction,
    updateSupplierBalance,
    saveRecurringTemplate,
    pauseRecurringTemplate,
    deleteRecurringTemplate,
    applyRecurringEdit,
  };
}

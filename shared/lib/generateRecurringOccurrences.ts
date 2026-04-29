import { supabase } from './supabase';
import type { Tables } from './database.types';

type Template = Tables<'recurring_transactions'>;

interface GeneratorResult {
  templatesProcessed: number;
  rowsInserted: number;
  affectedProjectIds: string[];
  errors: Array<{ templateId: string; error: unknown }>;
}

/**
 * Catch-up generator for recurring transactions.
 *
 * Walks every active template owned by the user and inserts any missing
 * expense/income rows for occurrences whose scheduled date is in the past
 * (relative to `today`). Idempotent: a unique index on
 * (recurring_template_id, recurring_occurrence_index) prevents duplicates.
 *
 * Failures on individual templates are isolated and never throw — the caller
 * (App.tsx boot) must keep working even if generation fails.
 */
export async function generateMissingRecurringOccurrences(
  userId: string,
  today: Date = new Date()
): Promise<GeneratorResult> {
  const result: GeneratorResult = {
    templatesProcessed: 0,
    rowsInserted: 0,
    affectedProjectIds: [],
    errors: [],
  };

  if (!userId) return result;

  const { data: templates, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    result.errors.push({ templateId: '*', error });
    return result;
  }

  const todayDateOnly = toDateOnly(today);
  const affected = new Set<string>();

  await Promise.all(
    (templates || []).map(async (tpl: Template) => {
      try {
        const inserted = await processTemplate(tpl, todayDateOnly);
        result.templatesProcessed += 1;
        result.rowsInserted += inserted;
        if (inserted > 0) affected.add(tpl.project_id);
      } catch (err) {
        result.errors.push({ templateId: tpl.id, error: err });
      }
    })
  );

  result.affectedProjectIds = Array.from(affected);
  return result;
}

async function processTemplate(tpl: Template, todayDateOnly: string): Promise<number> {
  const startDate = tpl.start_date;
  const endDate = tpl.end_date ?? todayDateOnly;
  const windowEnd = minDate(todayDateOnly, endDate);
  if (compareDate(windowEnd, startDate) < 0) return 0; // start in future

  // Determine where to begin the cursor
  // If never generated: start from template.start_date
  // Else: start from last_generated_until_date + 1 day
  const cursorStartCandidate = tpl.last_generated_until_date
    ? addDays(tpl.last_generated_until_date, 1)
    : startDate;
  const cursorStart = maxDate(cursorStartCandidate, startDate);

  if (compareDate(cursorStart, windowEnd) > 0) {
    // Already up to date — still bump last_generated_until_date so future
    // catch-ups don't re-walk past months pointlessly.
    if (
      !tpl.last_generated_until_date ||
      compareDate(tpl.last_generated_until_date, todayDateOnly) < 0
    ) {
      await supabase
        .from('recurring_transactions')
        .update({ last_generated_until_date: todayDateOnly })
        .eq('id', tpl.id);
    }
    return 0;
  }

  // Walk monthly cursor from cursorStart to windowEnd
  const occurrences = enumerateMonthlyOccurrences(
    cursorStart,
    windowEnd,
    tpl.day_of_month,
    tpl.start_date
  );

  if (occurrences.length === 0) {
    await supabase
      .from('recurring_transactions')
      .update({ last_generated_until_date: todayDateOnly })
      .eq('id', tpl.id);
    return 0;
  }

  const table = tpl.type === 'expense' ? 'expenses' : 'incomes';

  // Idempotency: fetch already-generated indices for this template and skip them.
  // (The partial unique index protects against duplicates in the DB but Supabase
  // upsert doesn't accept partial indexes as conflict targets, so we filter manually.)
  const { data: existing, error: existingErr } = await supabase
    .from(table)
    .select('recurring_occurrence_index')
    .eq('recurring_template_id', tpl.id);
  if (existingErr) throw existingErr;
  const existingIndices = new Set<number>(
    (existing || [])
      .map((r: any) => r.recurring_occurrence_index)
      .filter((n: any) => typeof n === 'number')
  );

  const rows = occurrences
    .filter((occ) => !existingIndices.has(occ.index))
    .map((occ) => ({
      user_id: tpl.user_id,
      project_id: tpl.project_id,
      supplier_id: tpl.supplier_id ?? null,
      title: tpl.title,
      tag: tpl.tag,
      icon: tpl.icon,
      color: tpl.color,
      amount: tpl.amount,
      currency: tpl.currency,
      payment_method: tpl.payment_method,
      includes_vat: tpl.includes_vat,
      date: occ.date,
      recurring_template_id: tpl.id,
      recurring_occurrence_index: occ.index,
    }));

  if (rows.length > 0) {
    const { error: insertErr } = await supabase.from(table).insert(rows);
    if (insertErr) throw insertErr;
    await recalculateProjectTotals(tpl.project_id);
  }

  await supabase
    .from('recurring_transactions')
    .update({ last_generated_until_date: todayDateOnly })
    .eq('id', tpl.id);

  return rows.length;
}

async function recalculateProjectTotals(projectId: string): Promise<void> {
  const [{ data: expenses }, { data: incomes }] = await Promise.all([
    supabase.from('expenses').select('amount').eq('project_id', projectId),
    supabase.from('incomes').select('amount').eq('project_id', projectId),
  ]);
  const totalSpent = (expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const totalIncome = (incomes || []).reduce((sum: number, i: any) => sum + Number(i.amount), 0);
  let status: 'ok' | 'warning' | 'over' = 'ok';
  if (totalSpent > totalIncome) status = 'over';
  else if (totalIncome > 0 && totalSpent / totalIncome >= 0.9) status = 'warning';
  await supabase
    .from('projects')
    .update({ spent: totalSpent, income: totalIncome, status })
    .eq('id', projectId);
}

/**
 * Generates the list of occurrence dates between [from, to] for a monthly
 * template anchored at startDate. Each occurrence is the `dayOfMonth` of its
 * month, clamped to the last day of months that don't have that day (e.g.
 * day 31 in February → 28/29).
 *
 * The occurrence_index is the count of months elapsed since startDate's month
 * (0 = the month containing startDate).
 */
function enumerateMonthlyOccurrences(
  from: string,
  to: string,
  dayOfMonth: number,
  startDateStr: string
): Array<{ date: string; index: number }> {
  const result: Array<{ date: string; index: number }> = [];

  const fromParts = parseDate(from);
  const toParts = parseDate(to);
  const startParts = parseDate(startDateStr);

  // Walk by month
  let cursorY = fromParts.y;
  let cursorM = fromParts.m; // 1-12

  while (true) {
    const day = clampDay(cursorY, cursorM, dayOfMonth);
    const dateStr = formatDate(cursorY, cursorM, day);

    if (compareDate(dateStr, from) >= 0 && compareDate(dateStr, to) <= 0) {
      const index = monthsBetween(startParts.y, startParts.m, cursorY, cursorM);
      if (index >= 0) {
        result.push({ date: dateStr, index });
      }
    }

    // Next month
    cursorM += 1;
    if (cursorM > 12) {
      cursorM = 1;
      cursorY += 1;
    }

    // Stop when cursor passes `to`
    const firstOfNext = formatDate(cursorY, cursorM, 1);
    if (compareDate(firstOfNext, to) > 0) break;
  }

  return result;
}

// ---------- date helpers (YYYY-MM-DD strings, no Date timezone math) ----------

function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return formatDate(y, m, day);
}

function parseDate(s: string): { y: number; m: number; d: number } {
  const [y, m, d] = s.split('-').map((p) => parseInt(p, 10));
  return { y, m, d };
}

function formatDate(y: number, m: number, d: number): string {
  const mm = m.toString().padStart(2, '0');
  const dd = d.toString().padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function compareDate(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function minDate(a: string, b: string): string {
  return compareDate(a, b) <= 0 ? a : b;
}

function maxDate(a: string, b: string): string {
  return compareDate(a, b) >= 0 ? a : b;
}

function addDays(s: string, n: number): string {
  const { y, m, d } = parseDate(s);
  // Use UTC to avoid DST edge cases
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return formatDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function clampDay(y: number, m: number, day: number): number {
  return Math.min(day, daysInMonth(y, m));
}

function monthsBetween(y1: number, m1: number, y2: number, m2: number): number {
  return (y2 - y1) * 12 + (m2 - m1);
}

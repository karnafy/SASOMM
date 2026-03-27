import { Project, Supplier, Expense, Income } from '../types';

// Hebrew month names
const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

// Chart color palette
export const CHART_COLORS = [
  '#FF4D6A', '#00E88F', '#00D9D9', '#FFB020', '#5B9BFF',
  '#8B6BAB', '#FF6B8A', '#00C9FF', '#FFD93D', '#6BCB77',
  '#4D96FF', '#FF8042',
];

/** Parse DD.MM.YYYY → Date parts */
export function parseTransactionDate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return { year, month, day };
    }
  }
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime())) {
    return { year: iso.getFullYear(), month: iso.getMonth() + 1, day: iso.getDate() };
  }
  return null;
}

/** Get all expenses and incomes flat from projects */
function getAllTransactions(projects: Project[]): { expenses: Expense[]; incomes: Income[] } {
  const expenses = projects.flatMap((p) => p.expenses);
  const incomes = projects.flatMap((p) => p.incomes || []);
  return { expenses, incomes };
}

/** Get the last N months as { year, month } sorted chronologically */
function getLastNMonths(n: number): { year: number; month: number }[] {
  const now = new Date();
  const months: { year: number; month: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
}

/** Group transactions by month (last 12 months) */
export function getMonthlyBreakdown(projects: Project[]): {
  month: string; monthKey: string; expenses: number; income: number;
}[] {
  const { expenses, incomes } = getAllTransactions(projects);
  const months = getLastNMonths(12);

  return months.map(({ year, month }) => {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthExpenses = expenses
      .filter((e) => {
        const d = parseTransactionDate(e.date);
        return d && d.year === year && d.month === month;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const monthIncome = incomes
      .filter((i) => {
        const d = parseTransactionDate(i.date);
        return d && d.year === year && d.month === month;
      })
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      month: HEBREW_MONTHS[month - 1],
      monthKey,
      expenses: monthExpenses,
      income: monthIncome,
    };
  });
}

/** Monthly averages */
export function getMonthlyAverages(projects: Project[]): {
  avgExpenses: number; avgIncome: number; avgSavings: number;
} {
  const breakdown = getMonthlyBreakdown(projects);
  const activeMonths = breakdown.filter((m) => m.expenses > 0 || m.income > 0);
  const count = Math.max(activeMonths.length, 1);

  const totalExpenses = activeMonths.reduce((s, m) => s + m.expenses, 0);
  const totalIncome = activeMonths.reduce((s, m) => s + m.income, 0);

  return {
    avgExpenses: totalExpenses / count,
    avgIncome: totalIncome / count,
    avgSavings: (totalIncome - totalExpenses) / count,
  };
}

/** Trend: current month vs previous month (percentage change) */
export function getMonthlyTrend(projects: Project[]): {
  expenseTrend: number; incomeTrend: number;
} {
  const breakdown = getMonthlyBreakdown(projects);
  const current = breakdown[breakdown.length - 1];
  const previous = breakdown[breakdown.length - 2];

  const calcTrend = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    expenseTrend: current && previous ? calcTrend(current.expenses, previous.expenses) : 0,
    incomeTrend: current && previous ? calcTrend(current.income, previous.income) : 0,
  };
}

/** Expense breakdown by category tag */
export function getExpensesByCategory(projects: Project[]): {
  label: string; value: number; color: string;
}[] {
  const { expenses } = getAllTransactions(projects);
  const map = new Map<string, number>();
  for (const e of expenses) {
    const tag = e.tag || 'אחר';
    map.set(tag, (map.get(tag) || 0) + e.amount);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

/** Income breakdown by category tag */
export function getIncomesByCategory(projects: Project[]): {
  label: string; value: number; color: string;
}[] {
  const { incomes } = getAllTransactions(projects);
  const map = new Map<string, number>();
  for (const i of incomes) {
    const tag = i.tag || 'אחר';
    map.set(tag, (map.get(tag) || 0) + i.amount);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

/** Payment method breakdown */
export function getPaymentMethodBreakdown(projects: Project[]): {
  label: string; value: number; color: string;
}[] {
  const { expenses, incomes } = getAllTransactions(projects);
  const all = [...expenses, ...incomes];
  const map = new Map<string, number>();
  for (const t of all) {
    const method = t.paymentMethod || 'לא צוין';
    map.set(method, (map.get(method) || 0) + t.amount);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

/** Top suppliers by total payment */
export function getTopSuppliers(
  projects: Project[], suppliers: Supplier[], limit = 5
): { name: string; total: number; id: string }[] {
  const { expenses } = getAllTransactions(projects);
  const map = new Map<string, number>();

  for (const e of expenses) {
    if (e.supplierId) {
      map.set(e.supplierId, (map.get(e.supplierId) || 0) + e.amount);
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, total]) => ({
      name: suppliers.find((s) => s.id === id)?.name || 'לא ידוע',
      total,
      id,
    }));
}

/** Most active suppliers by transaction count */
export function getMostActiveSuppliers(
  projects: Project[], suppliers: Supplier[], limit = 5
): { name: string; count: number; id: string }[] {
  const { expenses, incomes } = getAllTransactions(projects);
  const all = [...expenses, ...incomes];
  const map = new Map<string, number>();

  for (const t of all) {
    if (t.supplierId) {
      map.set(t.supplierId, (map.get(t.supplierId) || 0) + 1);
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({
      name: suppliers.find((s) => s.id === id)?.name || 'לא ידוע',
      count,
      id,
    }));
}

/** Projects over budget */
export function getOverBudgetProjects(projects: Project[]): {
  name: string; id: string; percentUsed: number; overspend: number;
}[] {
  return projects
    .filter((p) => p.budget > 0 && p.spent > p.budget)
    .map((p) => ({
      name: p.name,
      id: p.id,
      percentUsed: Math.round((p.spent / p.budget) * 100),
      overspend: p.spent - p.budget,
    }))
    .sort((a, b) => b.percentUsed - a.percentUsed);
}

/** Overall budget usage percentage */
export function getOverallBudgetUsage(projects: Project[]): number {
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  if (totalBudget === 0) return 0;
  return Math.round((totalSpent / totalBudget) * 100);
}

/** VAT summary */
export function getVatSummary(projects: Project[]): {
  totalWithVat: number; estimatedVat: number; totalWithoutVat: number;
} {
  const { expenses } = getAllTransactions(projects);
  let totalWithVat = 0;
  let totalWithoutVat = 0;

  for (const e of expenses) {
    if (e.includesVat) {
      totalWithVat += e.amount;
    } else {
      totalWithoutVat += e.amount;
    }
  }

  // VAT rate in Israel is 17%
  const estimatedVat = totalWithVat * (17 / 117);

  return { totalWithVat, estimatedVat, totalWithoutVat };
}

/** Income to expense ratio */
export function getIncomeExpenseRatio(projects: Project[]): number {
  const totalExpenses = projects.reduce((s, p) => s + p.spent, 0);
  const totalIncome = projects.reduce(
    (s, p) => s + (p.incomes || []).reduce((si, i) => si + i.amount, 0), 0
  );
  if (totalExpenses === 0) return totalIncome > 0 ? Infinity : 0;
  return totalIncome / totalExpenses;
}

/** Busiest spending month */
export function getBusiestMonth(projects: Project[]): {
  month: string; amount: number;
} | null {
  const breakdown = getMonthlyBreakdown(projects);
  if (breakdown.length === 0) return null;

  const busiest = breakdown.reduce((max, m) =>
    m.expenses > max.expenses ? m : max
  );

  if (busiest.expenses === 0) return null;
  return { month: busiest.month, amount: busiest.expenses };
}

/** Format number with commas */
export function formatNumber(n: number): string {
  return Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

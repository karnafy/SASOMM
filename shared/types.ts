
export enum AppScreen {
  DASHBOARD = 'dashboard',
  SUPPLIERS = 'suppliers',
  CONTACTS = 'contacts',
  SUPPLIER_DETAIL = 'supplier_detail',
  PROJECTS = 'projects',
  PROJECT_DETAIL = 'project_detail',
  ADD_EXPENSE = 'add_expense',
  ADD_INCOME = 'add_income',
  ADD_PROJECT = 'add_project',
  ADD_SUPPLIER = 'add_supplier',
  ACTIVITY_DETAIL = 'activity_detail',
  CATEGORY_PROJECTS = 'category_projects',
  EDIT_PROJECT = 'edit_project',
  EDIT_ACTIVITY = 'edit_activity',
  PERSONAL_AREA = 'personal_area',
  REPORTS_CENTER = 'reports_center',
  SETTINGS = 'settings',
  DEBTS = 'debts',
  ADD_DEBT = 'add_debt',
  RECURRING_TEMPLATES = 'recurring_templates'
}

export type ReminderInterval = 'daily' | '2days' | '3days' | 'weekly' | 'biweekly' | 'monthly' | 'none';

export type DebtDirection = 'owed_to_me' | 'i_owe';

export interface Debt {
  id: string;
  direction: DebtDirection;
  personName: string;
  personPhone?: string;
  amount: number;
  currency: Currency;
  projectId?: string;
  projectName?: string;
  notes?: string;
  reminderInterval: ReminderInterval;
  dueDate?: string;
  lastReminderDate?: string;
  nextReminderDate?: string;
  createdAt: string;
  isPaid: boolean;
  imageUrl?: string;
}

export type MainCategory = 'projects' | 'personal' | 'other';

export const MAIN_CATEGORIES: Record<MainCategory, string> = {
  projects: 'פרויקטים',
  personal: 'אישי',
  other: 'שונות'
};

export type Currency = 'ILS' | 'USD' | 'EUR';

export interface AuditEntry {
  id: string;
  date: string;
  action: string;
  user?: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
}

export interface Expense {
  id: string;
  icon: string;
  title: string;
  tag: string;
  date: string;
  amount: number;
  currency: Currency;
  originalAmount?: number;
  originalCurrency?: Currency;
  color: string;
  supplierId?: string;
  type?: 'expense' | 'income';
  receiptImages?: string[];
  paymentMethod?: string;
  includesVat?: boolean;
  history?: AuditEntry[];
  created_at?: string;
  recurringTemplateId?: string;
  recurringOccurrenceIndex?: number;
}

export interface Income {
  id: string;
  icon: string;
  title: string;
  tag: string;
  date: string;
  amount: number;
  currency: Currency;
  originalAmount?: number;
  originalCurrency?: Currency;
  color: string;
  supplierId?: string;
  type?: 'expense' | 'income';
  receiptImages?: string[];
  paymentMethod?: string;
  includesVat?: boolean;
  history?: AuditEntry[];
  created_at?: string;
  recurringTemplateId?: string;
  recurringOccurrenceIndex?: number;
}

export type RecurringFrequency = 'monthly';

export interface RecurringTransaction {
  id: string;
  type: 'expense' | 'income';
  projectId: string;
  amount: number;
  currency: Currency;
  title: string;
  tag?: string;
  icon?: string;
  color?: string;
  supplierId?: string;
  paymentMethod?: string;
  includesVat: boolean;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  lastGeneratedUntilDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  status: 'debt' | 'credit' | 'settled';
  amount: number;
  lastActive: string;
  avatar: string;
  category: string;
  phone: string;
}

export interface ProjectActivity {
  id: string;
  type: 'budget_change' | 'note' | 'expense' | 'income' | 'transaction_update';
  title: string;
  date: string;
  amount?: number;
  oldValue?: string;
  newValue?: string;
  tag?: string;
  icon?: string;
  supplierId?: string;
  receiptImages?: string[];
  transactionId?: string;
}

export interface Project {
  id: string;
  name: string;
  budget: number; // Expense Budget
  budgetCurrency?: Currency;
  budgetIncludesVat?: boolean;
  spent: number;
  income: number; // Total income received for this project
  status: 'ok' | 'warning' | 'over';
  category: string;
  mainCategory: MainCategory;
  icon: string;
  expenses: Expense[];
  incomes: Income[];
  history?: ProjectActivity[];
  primarySupplierId?: string; // Main supplier/client for this project
}

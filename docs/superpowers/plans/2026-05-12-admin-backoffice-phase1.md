# SASOMM Admin Backoffice — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 1 of the admin backoffice: ship a Chrome-only, lazy-loaded `/admin` workspace covering Overview, Users, Leads (CRM), Messages (Push + Inbox + WhatsApp via GREEN API), Feedback+TODO, Financials (manual P&L), System, plus Reports CSV exports. Adds in-app feedback form, in-app inbox, and 4 placeholder screens (Subscriptions, Payments, Costs, Alerts) for Phase 2/3.

**Architecture:** Lazy-loaded `pages/admin/*` subtree (mobile bundle excludes it via `Platform.OS === 'web'` check). Email-based admin guard at client + JWT email check in RLS at DB. Same neumorphic theme as main app. 9 new tables + 2 views + RLS policies, all in one migration set. 3 Edge Functions (send-email/send-push/send-whatsapp) + 1 public webhook (contact-form-handler). Charts via Recharts (web-only).

**Tech Stack:** React Native 0.81 + Expo 54 (Web target), TypeScript 5.9, Supabase JS SDK 2.98, Supabase CLI (Deno Edge Functions), Recharts 2.x, papaparse (CSV), Resend SDK, GREEN API (REST), Expo Push.

**Spec:** [docs/superpowers/specs/2026-05-11-admin-backoffice-dashboard-design.md](../specs/2026-05-11-admin-backoffice-dashboard-design.md)

**Branch:** `feat/admin-backoffice` (already created)

**Baseline (verified 2026-05-12):**
- Postgres 17.6.1 on `bknswnzipvdtqsfhhsss`
- Existing tables: profiles, projects, expenses, incomes, suppliers, contacts, project_activities, audit_log, debts, project_supplier_allocations, payment_milestones, recurring_transactions
- 4 real users, 24 projects, 31 expenses, 15 incomes, 22 recurring
- `feat/admin-backoffice` branch has `backend/` scaffolding already

---

## File Structure

**Will create:**

```
backend/supabase/migrations/
├── 20260512100000_phase1_admin_tables.sql
├── 20260512100100_phase1_admin_rls.sql
└── 20260512100200_phase1_admin_views.sql

backend/supabase/functions/
├── send-email/index.ts              (filled in Task I1)
├── send-push/index.ts               (filled in Task I2)
├── send-whatsapp/index.ts           (filled in Task I3)
└── contact-form-handler/index.ts    (filled in Task F4)

shared/
├── admin/
│   ├── guard.ts                     (ADMIN_EMAIL + isAdmin)
│   ├── kpis.ts                      (KPI computations)
│   └── csv.ts                       (CSV export helpers)
├── hooks/
│   ├── admin/
│   │   ├── useAdminKPIs.ts
│   │   ├── useAdminUsers.ts
│   │   ├── useLeads.ts
│   │   ├── useLeadActivities.ts
│   │   ├── useFeedback.ts
│   │   ├── useAdminTodos.ts
│   │   ├── useBusinessExpenses.ts
│   │   ├── useBusinessInfo.ts
│   │   ├── useAdminMessages.ts
│   │   └── useAuditLog.ts
│   └── useUserMessages.ts           (used by main app inbox)
└── lib/
    ├── feedback.ts                  (saveFeedback for main app)
    └── adminApi.ts                  (Edge Function callers)

pages/admin/
├── AdminLayout.tsx                  (sidebar + content)
├── AdminOverview.tsx
├── AdminUsers.tsx
├── AdminUserDetail.tsx
├── AdminLeads.tsx
├── AdminLeadDetail.tsx
├── AdminMessages.tsx
├── AdminFeedbackTodo.tsx
├── AdminFinancials.tsx
├── AdminReports.tsx
├── AdminSystem.tsx
└── placeholders/
    ├── AdminSubscriptions.tsx
    ├── AdminPayments.tsx
    ├── AdminCosts.tsx
    └── AdminAlerts.tsx

pages/
└── Inbox.tsx                        (in-app inbox)

components/admin/
├── AdminSidebar.tsx
├── KpiCard.tsx
├── ChartCard.tsx
├── DataTable.tsx                    (reusable table)
├── KanbanColumn.tsx
└── FeedbackForm.tsx                 (used in Settings)

__tests__/
├── shared/
│   ├── admin/guard.test.ts
│   ├── admin/kpis.test.ts
│   └── admin/csv.test.ts
└── components/admin/
    └── KpiCard.test.tsx
```

**Will modify:**

- `App.tsx` — add lazy admin routes, Platform.OS web check, long-press logo handler
- `shared/types.ts` — add `AppScreen.ADMIN_*` + `AppScreen.INBOX` enums + admin model types
- `pages/Settings.tsx` — add "דווח בעיה" button that opens FeedbackForm
- `pages/Dashboard.tsx` — wire inbox badge (unread count from useUserMessages)
- `components/BottomNav.tsx` — add Inbox tab entry (mobile + web)
- `package.json` — add: recharts, papaparse, @types/papaparse (already has supabase, expo)
- `shared/package.json` — no change expected
- `shared/hooks/useSupabaseData.ts` — possibly extend to write session heartbeat (Task C3)
- `shared/lib/database.types.ts` — regenerate after migrations (via `npm run sb:types`)

**Untouched:** Mobile bundle code paths — `pages/admin/*` is only loaded when `Platform.OS === 'web'` and route is admin.

---

## Task A1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step A1.1: Add recharts + papaparse + jest deps**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM"
npm install recharts papaparse
npm install --save-dev @types/papaparse jest @types/jest ts-jest @testing-library/react-native
```

- [ ] **Step A1.2: Verify install + commit**

```bash
node -e "console.log(require('recharts/package.json').version)"
node -e "console.log(require('papaparse/package.json').version)"
git add package.json package-lock.json
git commit -m "chore(deps): add recharts, papaparse, jest for admin BO"
```

Expected: recharts ~2.15.x, papaparse ~5.4.x prints.

---

## Task A2: Admin guard utility

**Files:**
- Create: `shared/admin/guard.ts`
- Create: `__tests__/shared/admin/guard.test.ts`

- [ ] **Step A2.1: Write the failing test**

`__tests__/shared/admin/guard.test.ts`:
```typescript
import { ADMIN_EMAIL, isAdmin, type AuthUser } from '../../../shared/admin/guard'

const makeUser = (email: string | undefined): AuthUser | null =>
  email ? { id: 'u1', email } as AuthUser : null

describe('isAdmin', () => {
  test('returns true for the admin email', () => {
    expect(isAdmin(makeUser(ADMIN_EMAIL))).toBe(true)
  })

  test('returns false for any other email', () => {
    expect(isAdmin(makeUser('someoneelse@gmail.com'))).toBe(false)
  })

  test('returns false for null/undefined user', () => {
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin(makeUser(undefined))).toBe(false)
  })

  test('is case-insensitive on email (Supabase stores lowercase)', () => {
    expect(isAdmin(makeUser(ADMIN_EMAIL.toUpperCase()))).toBe(true)
  })
})
```

- [ ] **Step A2.2: Run and verify failure**

```bash
npx jest __tests__/shared/admin/guard.test.ts
```

Expected: FAIL with "Cannot find module '../../../shared/admin/guard'".

- [ ] **Step A2.3: Implement the minimum to pass**

`shared/admin/guard.ts`:
```typescript
export const ADMIN_EMAIL = 'karnafstudio@gmail.com'

export interface AuthUser {
  id: string
  email?: string | null
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  if (!user || !user.email) return false
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}
```

- [ ] **Step A2.4: Run and verify pass**

```bash
npx jest __tests__/shared/admin/guard.test.ts
```

Expected: PASS (4/4).

- [ ] **Step A2.5: Commit**

```bash
git add shared/admin/guard.ts __tests__/shared/admin/guard.test.ts
git commit -m "feat(admin): guard utility (isAdmin + ADMIN_EMAIL constant)"
```

---

## Task A3: AdminScreen enum + types

**Files:**
- Modify: `shared/types.ts`

- [ ] **Step A3.1: Add admin screen enum values**

Append to the existing `AppScreen` enum in `shared/types.ts`:
```typescript
  // Admin BO (web only, lazy-loaded)
  INBOX = 'inbox',
  ADMIN_OVERVIEW = 'admin_overview',
  ADMIN_USERS = 'admin_users',
  ADMIN_USER_DETAIL = 'admin_user_detail',
  ADMIN_LEADS = 'admin_leads',
  ADMIN_LEAD_DETAIL = 'admin_lead_detail',
  ADMIN_MESSAGES = 'admin_messages',
  ADMIN_FEEDBACK_TODO = 'admin_feedback_todo',
  ADMIN_FINANCIALS = 'admin_financials',
  ADMIN_REPORTS = 'admin_reports',
  ADMIN_SYSTEM = 'admin_system',
  ADMIN_SUBSCRIPTIONS = 'admin_subscriptions',
  ADMIN_PAYMENTS = 'admin_payments',
  ADMIN_COSTS = 'admin_costs',
  ADMIN_ALERTS = 'admin_alerts'
```

- [ ] **Step A3.2: Add domain types at end of file**

Append to `shared/types.ts`:
```typescript
export type FeedbackStatus = 'new' | 'in_progress' | 'closed'
export type TodoStatus = 'pending' | 'in_progress' | 'completed'
export type TodoPriority = 'low' | 'med' | 'high'
export type LeadStatus = 'new' | 'contacted' | 'trial' | 'paying' | 'churned' | 'lost'
export type LeadSource = 'website_form' | 'referral' | 'ad_facebook' | 'ad_google' | 'manual' | 'signup'
export type MessageChannel = 'push' | 'inbox' | 'whatsapp'

export interface Feedback {
  id: string
  userId: string | null
  screen: string | null
  message: string
  status: FeedbackStatus
  response: string | null
  appVersion: string | null
  platform: string | null
  createdAt: string
  respondedAt: string | null
}

export interface AdminTodo {
  id: string
  title: string
  description: string | null
  status: TodoStatus
  priority: TodoPriority
  dueDate: string | null
  createdAt: string
  completedAt: string | null
}

export interface Lead {
  id: string
  email: string
  name: string | null
  phone: string | null
  source: LeadSource
  status: LeadStatus
  firstTouchAt: string
  lastContactAt: string | null
  notes: string | null
  tags: string[]
  convertedToUserId: string | null
  ltvIls: number
  createdAt: string
}

export interface UserMessage {
  id: string
  userId: string | null
  channels: MessageChannel[]
  title: string
  body: string
  sentAt: string
  status: 'pending' | 'sent' | 'partial_failure' | 'failed'
  whatsappChatId: string | null
  readAt: string | null
}

export interface BusinessExpense {
  id: string
  category: 'infrastructure' | 'api' | 'marketing' | 'payment_fees' | 'dev' | 'taxes' | 'other'
  vendor: string
  amountIls: number
  amountOriginal: number
  currencyOriginal: 'ILS' | 'USD' | 'EUR'
  month: string
  expenseDate: string
  isRecurring: boolean
  autoSource: string | null
  receiptUrl: string | null
  includesVat: boolean
  vatAmount: number
  notes: string | null
  createdAt: string
}

export interface AdminKpis {
  totalUsers: number
  newSignups7d: number
  newSignups30d: number
  dau: number
  wau: number
  mau: number
  openFeedback: number
  openTodos: number
  actionsToday: number
  actionsThisMonth: number
}
```

- [ ] **Step A3.3: Commit**

```bash
git add shared/types.ts
git commit -m "feat(admin): AppScreen.ADMIN_* enums + domain types"
```

---

## Task B1: Migration — Phase 1 admin tables

**Files:**
- Create: `backend/supabase/migrations/20260512100000_phase1_admin_tables.sql`

- [ ] **Step B1.1: Initialize Supabase CLI in backend/supabase if not done**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM"
# Check if config.toml exists
test -f backend/supabase/config.toml && echo "OK" || npm run sb -- init
# Link to remote project (one-time)
npm run sb -- link --project-ref bknswnzipvdtqsfhhsss
```

Expected: `OK` printed (or init completes and link succeeds). Re-run prompts may need a Supabase access token from environment `SUPABASE_ACCESS_TOKEN`.

- [ ] **Step B1.2: Create the tables migration file**

`backend/supabase/migrations/20260512100000_phase1_admin_tables.sql`:
```sql
-- Phase 1 admin BO tables (9 new tables)
-- Spec: docs/superpowers/specs/2026-05-11-admin-backoffice-dashboard-design.md §5.2

-- feedback: user-submitted from main app
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  screen text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','closed')),
  response text,
  app_version text,
  platform text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
CREATE INDEX feedback_status_idx ON public.feedback(status);
CREATE INDEX feedback_user_id_idx ON public.feedback(user_id);

-- admin_todos: owner's personal task list
CREATE TABLE public.admin_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  priority text NOT NULL DEFAULT 'med' CHECK (priority IN ('low','med','high')),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX admin_todos_status_idx ON public.admin_todos(status);

-- admin_email_log: audit trail of emails sent through BO
CREATE TABLE public.admin_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  template_id uuid,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('sent','failed','bounced')),
  error_message text,
  resend_message_id text
);
CREATE INDEX admin_email_log_user_idx ON public.admin_email_log(recipient_user_id);

-- user_messages: multi-channel admin → user messaging + in-app inbox storage
CREATE TABLE public.user_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,  -- null = broadcast
  channels text[] NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','partial_failure','failed')),
  whatsapp_chat_id text,
  read_at timestamptz
);
CREATE INDEX user_messages_user_id_idx ON public.user_messages(user_id);
CREATE INDEX user_messages_sent_at_idx ON public.user_messages(sent_at DESC);

-- business_expenses: operating costs for SASOMM the business
CREATE TABLE public.business_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN
    ('infrastructure','api','marketing','payment_fees','dev','taxes','other')),
  vendor text NOT NULL,
  amount_ils numeric(12,2) NOT NULL,
  amount_original numeric(12,2) NOT NULL,
  currency_original text NOT NULL CHECK (currency_original IN ('ILS','USD','EUR')),
  month text NOT NULL,  -- YYYY-MM
  expense_date date NOT NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  auto_source text,
  receipt_url text,
  includes_vat boolean NOT NULL DEFAULT false,
  vat_amount numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX business_expenses_month_idx ON public.business_expenses(month);
CREATE INDEX business_expenses_is_recurring_idx ON public.business_expenses(is_recurring);

-- leads: CRM database (broader than auth.users)
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  phone text,
  source text NOT NULL CHECK (source IN
    ('website_form','referral','ad_facebook','ad_google','manual','signup')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN
    ('new','contacted','trial','paying','churned','lost')),
  first_touch_at timestamptz NOT NULL DEFAULT now(),
  last_contact_at timestamptz,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  converted_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ltv_ils numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_status_idx ON public.leads(status);
CREATE INDEX leads_email_idx ON public.leads(email);

-- lead_activities: touchpoint log per lead
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN
    ('email_sent','whatsapp_sent','call','note','status_change')),
  description text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_activities_lead_id_idx ON public.lead_activities(lead_id);

-- user_sessions: lightweight session telemetry written by client on login/heartbeat
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  app_version text,
  device_info jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
  actions_count integer NOT NULL DEFAULT 0
);
CREATE INDEX user_sessions_user_id_idx ON public.user_sessions(user_id);
CREATE INDEX user_sessions_started_at_idx ON public.user_sessions(started_at DESC);

-- business_info: single-row operating company metadata
CREATE TABLE public.business_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  company_number text,
  vat_number text,
  address text,
  phone text,
  email text,
  logo_url text,
  accountant_email text,
  invoice_prefix text NOT NULL DEFAULT 'INV-',
  marketing_consent_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Seed single empty row
INSERT INTO public.business_info DEFAULT VALUES;

-- updated_at trigger for business_info
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_info_updated_at
  BEFORE UPDATE ON public.business_info
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

- [ ] **Step B1.3: Apply migration to remote DB**

```bash
npm run sb:migrate
```

Expected output: lists the migration applied. If errors, inspect and fix the SQL.

- [ ] **Step B1.4: Verify tables exist via Supabase MCP or SQL**

Run a quick check via Supabase Studio SQL editor OR (preferred) Claude session:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name IN
('feedback','admin_todos','admin_email_log','user_messages','business_expenses',
 'leads','lead_activities','user_sessions','business_info')
ORDER BY table_name;
```

Expected: 9 rows.

- [ ] **Step B1.5: Regenerate database.types.ts**

```bash
npm run sb:types
```

This updates `shared/lib/database.types.ts` with new tables. Inspect the diff to confirm new types appear.

- [ ] **Step B1.6: Commit**

```bash
git add backend/supabase/migrations/20260512100000_phase1_admin_tables.sql \
        shared/lib/database.types.ts
git commit -m "feat(db): phase1 admin tables migration (9 tables)"
```

---

## Task B2: Migration — RLS policies for Phase 1 tables

**Files:**
- Create: `backend/supabase/migrations/20260512100100_phase1_admin_rls.sql`

- [ ] **Step B2.1: Create RLS policies migration**

`backend/supabase/migrations/20260512100100_phase1_admin_rls.sql`:
```sql
-- Phase 1 RLS — admin email guard + user-scoped exceptions
-- Spec: docs/superpowers/specs/2026-05-11-admin-backoffice-dashboard-design.md §5.6

-- Helper: is_admin() checks JWT email matches ADMIN_EMAIL
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT lower(auth.jwt() ->> 'email') = lower('karnafstudio@gmail.com');
$$;

-- Enable RLS on all new tables
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

-- feedback: admin reads/updates all, users insert own
CREATE POLICY feedback_admin_all ON public.feedback
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY feedback_user_insert ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY feedback_user_select_own ON public.feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- admin_todos: admin only
CREATE POLICY admin_todos_admin_all ON public.admin_todos
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- admin_email_log: admin reads, service_role writes (no client policy needed)
CREATE POLICY admin_email_log_admin_select ON public.admin_email_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- user_messages: admin reads/writes all; user reads own; user updates own read_at
CREATE POLICY user_messages_admin_all ON public.user_messages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY user_messages_user_select_own ON public.user_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);  -- null = broadcast visible to all

CREATE POLICY user_messages_user_update_read ON public.user_messages
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- business_expenses: admin only
CREATE POLICY business_expenses_admin_all ON public.business_expenses
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- leads: admin only (service_role inserts via contact-form-handler are allowed regardless of RLS)
CREATE POLICY leads_admin_all ON public.leads
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- lead_activities: admin only
CREATE POLICY lead_activities_admin_all ON public.lead_activities
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- user_sessions: admin reads all, user writes own
CREATE POLICY user_sessions_admin_select ON public.user_sessions
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY user_sessions_user_insert_own ON public.user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_sessions_user_update_own ON public.user_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- business_info: admin only
CREATE POLICY business_info_admin_all ON public.business_info
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- All authenticated users can SELECT business_info (for invoice display etc.)
CREATE POLICY business_info_public_select ON public.business_info
  FOR SELECT TO authenticated
  USING (true);
```

- [ ] **Step B2.2: Apply migration**

```bash
npm run sb:migrate
```

- [ ] **Step B2.3: Verify with two sanity checks**

In Supabase Studio SQL editor:
```sql
-- Check 1: is_admin() returns true when ADMIN logged in (set JWT in editor)
SELECT public.is_admin();
-- Expected: true (if you're karnafstudio@gmail.com)

-- Check 2: RLS denies access to non-admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.email = 'someone-else@example.com';
SELECT count(*) FROM public.admin_todos;
-- Expected: 0 rows (RLS blocks read)
```

- [ ] **Step B2.4: Commit**

```bash
git add backend/supabase/migrations/20260512100100_phase1_admin_rls.sql
git commit -m "feat(db): RLS policies for phase1 admin tables"
```

---

## Task B3: Migration — Admin views

**Files:**
- Create: `backend/supabase/migrations/20260512100200_phase1_admin_views.sql`

- [ ] **Step B3.1: Create views migration**

`backend/supabase/migrations/20260512100200_phase1_admin_views.sql`:
```sql
-- Phase 1 admin views: pre-aggregated KPIs + users overview
-- Note: views inherit RLS from underlying tables, BUT views querying auth.users
-- need security_invoker for proper admin gating. Postgres 17 supports security_invoker.

-- admin_users_view: one row per user with all aggregates
CREATE VIEW public.admin_users_view
WITH (security_invoker = true) AS
SELECT
  u.id,
  u.email,
  p.full_name,
  p.phone,
  u.created_at AS signup_at,
  u.last_sign_in_at,
  COALESCE((SELECT count(*) FROM public.projects pr WHERE pr.user_id = u.id), 0)::int AS project_count,
  COALESCE(
    (SELECT count(*) FROM public.expenses e WHERE e.user_id = u.id), 0
  ) + COALESCE(
    (SELECT count(*) FROM public.incomes i WHERE i.user_id = u.id), 0
  ) AS transaction_count,
  (SELECT max(s.started_at) FROM public.user_sessions s WHERE s.user_id = u.id) AS last_session_at,
  (SELECT s.platform FROM public.user_sessions s
   WHERE s.user_id = u.id ORDER BY s.started_at DESC LIMIT 1) AS last_platform
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id;

-- admin_kpi_view: single-row dashboard KPIs
CREATE VIEW public.admin_kpi_view
WITH (security_invoker = true) AS
SELECT
  (SELECT count(*) FROM auth.users)::int AS total_users,
  (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '7 days')::int AS new_signups_7d,
  (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '30 days')::int AS new_signups_30d,
  (SELECT count(DISTINCT user_id) FROM public.user_sessions
   WHERE started_at > now() - interval '1 day')::int AS dau,
  (SELECT count(DISTINCT user_id) FROM public.user_sessions
   WHERE started_at > now() - interval '7 days')::int AS wau,
  (SELECT count(DISTINCT user_id) FROM public.user_sessions
   WHERE started_at > now() - interval '30 days')::int AS mau,
  (SELECT count(*) FROM public.feedback WHERE status != 'closed')::int AS open_feedback,
  (SELECT count(*) FROM public.admin_todos WHERE status != 'completed')::int AS open_todos,
  -- actions = expenses + incomes touched today
  ((SELECT count(*) FROM public.expenses WHERE created_at::date = current_date) +
   (SELECT count(*) FROM public.incomes WHERE created_at::date = current_date))::int AS actions_today,
  ((SELECT count(*) FROM public.expenses
    WHERE created_at >= date_trunc('month', current_date)) +
   (SELECT count(*) FROM public.incomes
    WHERE created_at >= date_trunc('month', current_date)))::int AS actions_this_month;

-- Grant SELECT to authenticated (RLS on underlying tables enforces admin-only)
GRANT SELECT ON public.admin_users_view TO authenticated;
GRANT SELECT ON public.admin_kpi_view TO authenticated;
```

- [ ] **Step B3.2: Apply migration**

```bash
npm run sb:migrate
```

- [ ] **Step B3.3: Smoke-test view**

In Supabase Studio (logged in as admin):
```sql
SELECT * FROM public.admin_kpi_view;
SELECT * FROM public.admin_users_view LIMIT 5;
```

Expected: admin_kpi_view returns 1 row with current numbers (e.g., total_users=4). admin_users_view returns 4 rows.

- [ ] **Step B3.4: Commit**

```bash
git add backend/supabase/migrations/20260512100200_phase1_admin_views.sql
git commit -m "feat(db): admin_kpi_view + admin_users_view"
```

---

## Task C1: In-app feedback form

**Files:**
- Create: `components/admin/FeedbackForm.tsx` (despite the path, this is used in main app Settings; placed here for cohesion with admin types)
- Create: `shared/lib/feedback.ts` (saveFeedback mutation)
- Modify: `pages/Settings.tsx`

- [ ] **Step C1.1: Create saveFeedback mutation**

`shared/lib/feedback.ts`:
```typescript
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { supabase } from './supabase'

export interface SaveFeedbackInput {
  userId: string
  screen?: string
  message: string
}

export async function saveFeedback(input: SaveFeedbackInput): Promise<void> {
  const appVersion =
    Constants?.expoConfig?.version ?? Constants?.manifest?.version ?? null
  const { error } = await supabase.from('feedback').insert({
    user_id: input.userId,
    screen: input.screen ?? null,
    message: input.message,
    app_version: appVersion,
    platform: Platform.OS,
    status: 'new'
  })
  if (error) throw new Error(error.message)
}
```

- [ ] **Step C1.2: Create FeedbackForm component**

`components/admin/FeedbackForm.tsx`:
```typescript
import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native'
import { theme } from '../../theme'
import { saveFeedback } from '../../shared/lib/feedback'

interface FeedbackFormProps {
  userId: string
  currentScreen?: string
  onClose: () => void
}

export function FeedbackForm({ userId, currentScreen, onClose }: FeedbackFormProps) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('שגיאה', 'יש לכתוב הודעה לפני שליחה.')
      return
    }
    setSubmitting(true)
    try {
      await saveFeedback({ userId, screen: currentScreen, message: message.trim() })
      Alert.alert('תודה', 'המשוב נשלח בהצלחה. נחזור אליך אם נצטרך פרטים נוספים.')
      onClose()
    } catch (e) {
      Alert.alert('שגיאה', `לא הצלחנו לשלוח: ${(e as Error).message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>דווח בעיה / הצעה</Text>
      <TextInput
        style={styles.input}
        placeholder="ספר לנו מה קרה או מה תרצה שיתווסף..."
        placeholderTextColor={theme.colors.textTertiary}
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />
      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
          <Text style={styles.btnText}>ביטול</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.submit, submitting && styles.disabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {submitting ? 'שולח...' : 'שלח'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg, gap: theme.spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'right' },
  input: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neuShadow,
    padding: theme.spacing.md,
    minHeight: 140,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.neuBgAlt,
    textAlign: 'right'
  },
  row: { flexDirection: 'row-reverse', gap: theme.spacing.md, justifyContent: 'flex-start' },
  btn: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.xl, borderRadius: theme.borderRadius.full },
  cancel: { backgroundColor: theme.colors.neuBgAlt },
  submit: { backgroundColor: theme.colors.primary },
  disabled: { opacity: 0.5 },
  btnText: { fontWeight: '600', color: theme.colors.textPrimary }
})
```

- [ ] **Step C1.3: Wire form in Settings**

Modify `pages/Settings.tsx`: add a "דווח בעיה" row that opens a modal containing `FeedbackForm`. Use existing modal pattern in the codebase (or React Native's `Modal`). Pass `userId` from `useAuth()` and `currentScreen='settings'`.

Show the row as a regular settings list entry above the language/logout rows.

- [ ] **Step C1.4: Manual smoke test**

```bash
npm run web
```

Open `http://localhost:8082`, log in, go to Settings → "דווח בעיה", submit "test feedback", verify success Alert.

In Supabase Studio:
```sql
SELECT * FROM public.feedback ORDER BY created_at DESC LIMIT 1;
```

Expected: row with `message='test feedback'`, `status='new'`, your `user_id`.

- [ ] **Step C1.5: Commit**

```bash
git add components/admin/FeedbackForm.tsx shared/lib/feedback.ts pages/Settings.tsx
git commit -m "feat(app): in-app feedback form + saveFeedback"
```

---

## Task C2: In-app inbox (main app)

**Files:**
- Create: `pages/Inbox.tsx`
- Create: `shared/hooks/useUserMessages.ts`
- Modify: `App.tsx` (route + navigation), `components/BottomNav.tsx` (badge + tab)

- [ ] **Step C2.1: Create useUserMessages hook**

`shared/hooks/useUserMessages.ts`:
```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { UserMessage } from '../types'

interface UseUserMessagesResult {
  data: UserMessage[]
  unreadCount: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  markRead: (id: string) => Promise<void>
}

export function useUserMessages(userId: string | null): UseUserMessagesResult {
  const [data, setData] = useState<UserMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!userId) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data: rows, error: err } = await supabase
      .from('user_messages')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)  // own + broadcasts
      .order('sent_at', { ascending: false })
      .limit(100)
    if (err) {
      setError(err.message)
      setData([])
    } else {
      setError(null)
      setData(
        (rows ?? []).map(r => ({
          id: r.id,
          userId: r.user_id,
          channels: r.channels,
          title: r.title,
          body: r.body,
          sentAt: r.sent_at,
          status: r.status,
          whatsappChatId: r.whatsapp_chat_id,
          readAt: r.read_at
        }))
      )
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  const markRead = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('user_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    if (!err) {
      setData(prev => prev.map(m => m.id === id ? { ...m, readAt: new Date().toISOString() } : m))
    }
  }, [])

  const unreadCount = data.filter(m => !m.readAt).length

  return { data, unreadCount, loading, error, refetch: fetch, markRead }
}
```

- [ ] **Step C2.2: Create Inbox screen**

`pages/Inbox.tsx`: simple list screen using `useUserMessages`. Each card: title, body (markdown→plain text fine for now), sent_at relative ("לפני שעתיים"), unread indicator dot. Tap → marks read. Use existing styling patterns from `pages/Debts.tsx` as reference.

- [ ] **Step C2.3: Wire route + navigation badge**

In `App.tsx`:
- Add `INBOX: () => import('./pages/Inbox')` to screen map
- Track unread badge state via `useUserMessages(user.id).unreadCount`

In `components/BottomNav.tsx`:
- Add Inbox icon (mail icon from Material Icons), show red dot badge if unread > 0
- Position: between Home and Suppliers

- [ ] **Step C2.4: Manual smoke test**

```bash
npm run web
```

Manually insert a row via Supabase Studio:
```sql
INSERT INTO user_messages (user_id, channels, title, body, status)
SELECT id, ARRAY['inbox']::text[], 'ברוכים הבאים!', 'תודה שהצטרפת ל-SASOMM.', 'sent'
FROM auth.users WHERE email = 'karnafstudio@gmail.com' LIMIT 1;
```

Reload app, verify red dot appears on inbox icon, click → see message → tap → dot disappears.

- [ ] **Step C2.5: Commit**

```bash
git add pages/Inbox.tsx shared/hooks/useUserMessages.ts App.tsx components/BottomNav.tsx
git commit -m "feat(app): in-app inbox screen with unread badge"
```

---

## Task C3: User session telemetry on login

**Files:**
- Modify: `shared/context/AuthContext.tsx` (or wherever login is handled)
- Create: `shared/lib/sessionTelemetry.ts`

- [ ] **Step C3.1: Create session telemetry helper**

`shared/lib/sessionTelemetry.ts`:
```typescript
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { supabase } from './supabase'

export async function recordSessionStart(userId: string): Promise<void> {
  const appVersion =
    Constants?.expoConfig?.version ?? Constants?.manifest?.version ?? null
  const deviceInfo: Record<string, string | undefined> = { os: Platform.OS }
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    deviceInfo.userAgent = navigator.userAgent
  }
  await supabase.from('user_sessions').insert({
    user_id: userId,
    platform: Platform.OS,
    app_version: appVersion,
    device_info: deviceInfo
  })
}
```

- [ ] **Step C3.2: Call on auth state change**

In `shared/context/AuthContext.tsx`, add to the `onAuthStateChange` handler: when event is `SIGNED_IN` and user.id is defined, call `recordSessionStart(user.id)`. Wrap in try/catch — telemetry failure must never block app.

- [ ] **Step C3.3: Smoke test**

Log out and back in via the web app. Verify in Supabase Studio:
```sql
SELECT user_id, platform, app_version, started_at FROM user_sessions ORDER BY started_at DESC LIMIT 3;
```

- [ ] **Step C3.4: Commit**

```bash
git add shared/lib/sessionTelemetry.ts shared/context/AuthContext.tsx
git commit -m "feat(app): record user session telemetry on login"
```

---

## Task D1: AdminSidebar + AdminLayout components

**Files:**
- Create: `components/admin/AdminSidebar.tsx`
- Create: `pages/admin/AdminLayout.tsx`

- [ ] **Step D1.1: Sidebar component**

`components/admin/AdminSidebar.tsx`:
```typescript
import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { theme } from '../../theme'
import { AppScreen } from '../../shared/types'

interface NavItem {
  screen: AppScreen
  label: string
  icon: keyof typeof MaterialIcons.glyphMap
  phase: 1 | 2 | 3
}

const ITEMS: NavItem[] = [
  { screen: AppScreen.ADMIN_OVERVIEW,      label: 'סקירה',           icon: 'dashboard',         phase: 1 },
  { screen: AppScreen.ADMIN_USERS,         label: 'משתמשים',         icon: 'people',            phase: 1 },
  { screen: AppScreen.ADMIN_LEADS,         label: 'לידים',           icon: 'contacts',          phase: 1 },
  { screen: AppScreen.ADMIN_SUBSCRIPTIONS, label: 'מנויים',          icon: 'card-membership',   phase: 2 },
  { screen: AppScreen.ADMIN_PAYMENTS,      label: 'תשלומים',         icon: 'payments',          phase: 2 },
  { screen: AppScreen.ADMIN_MESSAGES,      label: 'הודעות',          icon: 'chat',              phase: 1 },
  { screen: AppScreen.ADMIN_FEEDBACK_TODO, label: 'משוב ומשימות',   icon: 'feedback',          phase: 1 },
  { screen: AppScreen.ADMIN_FINANCIALS,    label: 'רווח והפסד',     icon: 'attach-money',      phase: 1 },
  { screen: AppScreen.ADMIN_COSTS,         label: 'עלויות ומכסות',  icon: 'data-usage',        phase: 2 },
  { screen: AppScreen.ADMIN_ALERTS,        label: 'התראות',          icon: 'notification-important', phase: 2 },
  { screen: AppScreen.ADMIN_REPORTS,       label: 'דוחות וייצוא',   icon: 'file-download',     phase: 1 },
  { screen: AppScreen.ADMIN_SYSTEM,        label: 'מערכת',           icon: 'settings',          phase: 1 }
]

interface AdminSidebarProps {
  currentScreen: AppScreen
  navigate: (screen: AppScreen) => void
}

export function AdminSidebar({ currentScreen, navigate }: AdminSidebarProps) {
  return (
    <View style={styles.sidebar}>
      <Text style={styles.brand}>SASOMM Admin</Text>
      {ITEMS.map(item => {
        const active = currentScreen === item.screen
        return (
          <Pressable
            key={item.screen}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => navigate(item.screen)}
          >
            <MaterialIcons
              name={item.icon}
              size={20}
              color={active ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            {item.phase > 1 && <Text style={styles.phaseBadge}>P{item.phase}</Text>}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: theme.colors.neuBgAlt,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
    minHeight: '100%' as any
  },
  brand: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg
  },
  item: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md
  },
  itemActive: { backgroundColor: theme.colors.neuLight },
  label: { color: theme.colors.textSecondary, fontWeight: '500', flex: 1, textAlign: 'right' },
  labelActive: { color: theme.colors.primary, fontWeight: '700' },
  phaseBadge: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    backgroundColor: theme.colors.neuBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm
  }
})
```

- [ ] **Step D1.2: AdminLayout component**

`pages/admin/AdminLayout.tsx`:
```typescript
import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { theme } from '../../theme'
import { AdminSidebar } from '../../components/admin/AdminSidebar'
import { AppScreen } from '../../shared/types'

interface AdminLayoutProps {
  currentScreen: AppScreen
  navigate: (screen: AppScreen) => void
  children: React.ReactNode
}

export function AdminLayout({ currentScreen, navigate, children }: AdminLayoutProps) {
  return (
    <View style={styles.shell}>
      <AdminSidebar currentScreen={currentScreen} navigate={navigate} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {children}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row-reverse', backgroundColor: theme.colors.neuBg },
  content: { flex: 1 },
  contentInner: { padding: theme.spacing.xl, gap: theme.spacing.lg }
})
```

- [ ] **Step D1.3: Commit**

```bash
git add components/admin/AdminSidebar.tsx pages/admin/AdminLayout.tsx
git commit -m "feat(admin): sidebar + AdminLayout shell"
```

---

## Task D2: App.tsx wiring — lazy admin routes + long-press logo

**Files:**
- Modify: `App.tsx`

- [ ] **Step D2.1: Add admin route imports (lazy, web-only)**

In `App.tsx`, near the top of the file where other routes/imports live:
```typescript
import { Platform } from 'react-native'
import { isAdmin } from './shared/admin/guard'

// Lazy admin imports — only loaded if Web AND admin user
const AdminLayout = Platform.OS === 'web'
  ? React.lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
  : null

const adminScreens: Partial<Record<AppScreen, () => Promise<{ default: React.ComponentType<any> }>>> =
  Platform.OS === 'web' ? {
    [AppScreen.ADMIN_OVERVIEW]:      () => import('./pages/admin/AdminOverview'),
    [AppScreen.ADMIN_USERS]:         () => import('./pages/admin/AdminUsers'),
    [AppScreen.ADMIN_USER_DETAIL]:   () => import('./pages/admin/AdminUserDetail'),
    [AppScreen.ADMIN_LEADS]:         () => import('./pages/admin/AdminLeads'),
    [AppScreen.ADMIN_LEAD_DETAIL]:   () => import('./pages/admin/AdminLeadDetail'),
    [AppScreen.ADMIN_MESSAGES]:      () => import('./pages/admin/AdminMessages'),
    [AppScreen.ADMIN_FEEDBACK_TODO]: () => import('./pages/admin/AdminFeedbackTodo'),
    [AppScreen.ADMIN_FINANCIALS]:    () => import('./pages/admin/AdminFinancials'),
    [AppScreen.ADMIN_REPORTS]:       () => import('./pages/admin/AdminReports'),
    [AppScreen.ADMIN_SYSTEM]:        () => import('./pages/admin/AdminSystem'),
    [AppScreen.ADMIN_SUBSCRIPTIONS]: () => import('./pages/admin/placeholders/AdminSubscriptions'),
    [AppScreen.ADMIN_PAYMENTS]:      () => import('./pages/admin/placeholders/AdminPayments'),
    [AppScreen.ADMIN_COSTS]:         () => import('./pages/admin/placeholders/AdminCosts'),
    [AppScreen.ADMIN_ALERTS]:        () => import('./pages/admin/placeholders/AdminAlerts')
  } : {}
```

- [ ] **Step D2.2: Add admin redirect guard**

In the screen renderer (where `screen` enum is dispatched), add at the top:
```typescript
const isAdminScreen = currentScreen.toString().startsWith('admin_')
if (isAdminScreen && !isAdmin(user)) {
  // Redirect non-admins back to dashboard
  navigate(AppScreen.DASHBOARD)
  return null
}
if (isAdminScreen && Platform.OS !== 'web') {
  // Mobile cannot access admin
  navigate(AppScreen.DASHBOARD)
  return null
}
```

- [ ] **Step D2.3: Admin screen render block**

```typescript
if (isAdminScreen && AdminLayout && adminScreens[currentScreen]) {
  const LazyScreen = React.lazy(adminScreens[currentScreen]!)
  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <AdminLayout currentScreen={currentScreen} navigate={navigate}>
        <LazyScreen navigate={navigate} />
      </AdminLayout>
    </React.Suspense>
  )
}
```

- [ ] **Step D2.4: Long-press logo handler in TopHeader (web admin discovery)**

In `components/TopHeader.tsx`: wrap the logo in `Pressable` with `onLongPress` that, if `isAdmin(user) && Platform.OS === 'web'`, calls `navigate(AppScreen.ADMIN_OVERVIEW)`. Long-press is 800ms minimum.

- [ ] **Step D2.5: Smoke test — admin can reach BO, regular user cannot**

```bash
npm run web
```

- Log in as `karnafstudio@gmail.com`, long-press logo, expect AdminOverview to render (placeholder for now — Task D3 fills it).
- Log out, log in as another user (use a test account), long-press logo, expect nothing happens.
- Type `?screen=admin_overview` manually in URL bar (if URL navigation supported) or trigger via dev console — expect redirect to Dashboard.

- [ ] **Step D2.6: Commit**

```bash
git add App.tsx components/TopHeader.tsx
git commit -m "feat(admin): App.tsx wiring + long-press logo entry + guard"
```

---

## Task D3: useAdminKPIs hook

**Files:**
- Create: `shared/hooks/admin/useAdminKPIs.ts`

- [ ] **Step D3.1: Implement hook**

`shared/hooks/admin/useAdminKPIs.ts`:
```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { AdminKpis } from '../../types'

interface UseAdminKPIsResult {
  data: AdminKpis | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAdminKPIs(): UseAdminKPIsResult {
  const [data, setData] = useState<AdminKpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: row, error: err } = await supabase
      .from('admin_kpi_view')
      .select('*')
      .single()
    if (err) {
      setError(err.message); setData(null)
    } else {
      setError(null)
      setData({
        totalUsers: row.total_users,
        newSignups7d: row.new_signups_7d,
        newSignups30d: row.new_signups_30d,
        dau: row.dau,
        wau: row.wau,
        mau: row.mau,
        openFeedback: row.open_feedback,
        openTodos: row.open_todos,
        actionsToday: row.actions_today,
        actionsThisMonth: row.actions_this_month
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
```

- [ ] **Step D3.2: Commit**

```bash
git add shared/hooks/admin/useAdminKPIs.ts
git commit -m "feat(admin): useAdminKPIs hook"
```

---

## Task D4: AdminOverview screen

**Files:**
- Create: `components/admin/KpiCard.tsx`
- Create: `components/admin/ChartCard.tsx`
- Create: `pages/admin/AdminOverview.tsx`

- [ ] **Step D4.1: KpiCard component**

`components/admin/KpiCard.tsx`:
```typescript
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../theme'

interface KpiCardProps {
  label: string
  value: number | string
  hint?: string
}

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{typeof value === 'number' ? value.toLocaleString('he-IL') : value}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.neuBgAlt,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    minWidth: 180,
    gap: theme.spacing.xs,
    shadowColor: theme.colors.neuShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6
  },
  label: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'right' },
  value: { fontSize: 28, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'right' },
  hint: { fontSize: 11, color: theme.colors.textTertiary, textAlign: 'right' }
})
```

- [ ] **Step D4.2: ChartCard wrapper**

`components/admin/ChartCard.tsx`:
```typescript
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../theme'

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartArea}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.neuBgAlt,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md
  },
  title: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'right' },
  chartArea: { height: 240 }
})
```

- [ ] **Step D4.3: AdminOverview screen**

`pages/admin/AdminOverview.tsx`:
```typescript
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../theme'
import { KpiCard } from '../../components/admin/KpiCard'
import { ChartCard } from '../../components/admin/ChartCard'
import { useAdminKPIs } from '../../shared/hooks/admin/useAdminKPIs'

// Charts use recharts; only rendered on web (this file already web-only via lazy import)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminOverview() {
  const { data: k, loading, error } = useAdminKPIs()

  if (loading) return <Text style={styles.loading}>טוען...</Text>
  if (error) return <Text style={styles.error}>שגיאה: {error}</Text>
  if (!k) return null

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>סקירה</Text>

      <View style={styles.kpiGrid}>
        <KpiCard label="סה״כ משתמשים"        value={k.totalUsers} />
        <KpiCard label="הרשמות 7 ימים"        value={k.newSignups7d} />
        <KpiCard label="הרשמות 30 ימים"       value={k.newSignups30d} />
        <KpiCard label="DAU"                  value={k.dau}       hint="פעילים אתמול-היום" />
        <KpiCard label="WAU"                  value={k.wau}       hint="פעילים השבוע" />
        <KpiCard label="MAU"                  value={k.mau}       hint="פעילים החודש" />
        <KpiCard label="פעולות היום"          value={k.actionsToday} />
        <KpiCard label="פעולות החודש"         value={k.actionsThisMonth} />
        <KpiCard label="משוב פתוח"            value={k.openFeedback} />
        <KpiCard label="משימות פתוחות"        value={k.openTodos} />
      </View>

      {/* Placeholder charts — wire to actual data series in Task D5 */}
      <ChartCard title="הרשמות לפי יום (30 ימים)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke={theme.colors.primary} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.lg },
  h1: { fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'right' },
  kpiGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: theme.spacing.md },
  loading: { padding: theme.spacing.xl, textAlign: 'center', color: theme.colors.textSecondary },
  error: { padding: theme.spacing.xl, color: theme.colors.error, textAlign: 'right' }
})
```

- [ ] **Step D4.4: Smoke test**

```bash
npm run web
```

Long-press logo → AdminOverview should render with real KPI numbers (10 cards). Chart placeholder shows empty area (filled by D5).

- [ ] **Step D4.5: Commit**

```bash
git add components/admin/KpiCard.tsx components/admin/ChartCard.tsx pages/admin/AdminOverview.tsx
git commit -m "feat(admin): AdminOverview screen with 10 KPI cards"
```

---

## Task D5: Overview charts — signups + DAU + actions

**Files:**
- Create: `shared/hooks/admin/useAdminTimeseries.ts`
- Modify: `pages/admin/AdminOverview.tsx`

- [ ] **Step D5.1: Timeseries hook**

`shared/hooks/admin/useAdminTimeseries.ts`:
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface SeriesPoint { day: string; count: number }

interface UseTimeseriesResult {
  signups: SeriesPoint[]
  dau: SeriesPoint[]
  actions: SeriesPoint[]
  loading: boolean
  error: string | null
}

export function useAdminTimeseries(days: number = 30): UseTimeseriesResult {
  const [signups, setSignups] = useState<SeriesPoint[]>([])
  const [dau, setDau] = useState<SeriesPoint[]>([])
  const [actions, setActions] = useState<SeriesPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      // Three parallel RPC-style queries via raw SQL through supabase.rpc (or .from with date trunc)
      const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      // signups
      const { data: u, error: e1 } = await supabase
        .from('admin_users_view')
        .select('signup_at')
        .gte('signup_at', sinceIso)
      // dau via user_sessions
      const { data: s, error: e2 } = await supabase
        .from('user_sessions')
        .select('user_id, started_at')
        .gte('started_at', sinceIso)
      // actions = expenses + incomes created
      const { data: exp, error: e3 } = await supabase
        .from('expenses')
        .select('created_at')
        .gte('created_at', sinceIso)
      const { data: inc, error: e4 } = await supabase
        .from('incomes')
        .select('created_at')
        .gte('created_at', sinceIso)

      if (cancelled) return
      const errors = [e1, e2, e3, e4].filter(Boolean) as Array<{ message: string }>
      if (errors.length) { setError(errors.map(e => e.message).join('; ')); setLoading(false); return }

      setSignups(bucketByDay(u ?? [], 'signup_at', days))
      setDau(bucketDauByDay(s ?? [], days))
      setActions(bucketByDay([...(exp ?? []), ...(inc ?? [])], 'created_at', days))
      setError(null)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [days])

  return { signups, dau, actions, loading, error }
}

function dayKey(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10)
}

function bucketByDay(rows: any[], field: string, days: number): SeriesPoint[] {
  const buckets = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(new Date(Date.now() - i * 86_400_000))
    buckets.set(key, 0)
  }
  for (const r of rows) {
    const key = dayKey(r[field])
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return Array.from(buckets.entries()).map(([day, count]) => ({ day, count }))
}

function bucketDauByDay(sessions: { user_id: string; started_at: string }[], days: number): SeriesPoint[] {
  const byDay = new Map<string, Set<string>>()
  for (let i = days - 1; i >= 0; i--) {
    byDay.set(dayKey(new Date(Date.now() - i * 86_400_000)), new Set())
  }
  for (const s of sessions) {
    const key = dayKey(s.started_at)
    if (byDay.has(key)) byDay.get(key)!.add(s.user_id)
  }
  return Array.from(byDay.entries()).map(([day, set]) => ({ day, count: set.size }))
}
```

- [ ] **Step D5.2: Wire timeseries into AdminOverview**

In `pages/admin/AdminOverview.tsx`, add:
```typescript
import { useAdminTimeseries } from '../../shared/hooks/admin/useAdminTimeseries'
// ...
const ts = useAdminTimeseries(30)
```

Render three `ChartCard`s using `<LineChart data={ts.signups}>`, `data={ts.dau}`, `data={ts.actions}`. Show `<Text>טוען...</Text>` if `ts.loading`.

- [ ] **Step D5.3: Smoke test**

Reload `/admin`. Expect three line charts with real data over the last 30 days.

- [ ] **Step D5.4: Commit**

```bash
git add shared/hooks/admin/useAdminTimeseries.ts pages/admin/AdminOverview.tsx
git commit -m "feat(admin): timeseries charts on Overview (signups/dau/actions)"
```

---

## Task E1: useAdminUsers hook

**Files:**
- Create: `shared/hooks/admin/useAdminUsers.ts`

- [ ] **Step E1.1: Implement**

`shared/hooks/admin/useAdminUsers.ts`:
```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export interface AdminUserRow {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  signupAt: string
  lastSignInAt: string | null
  projectCount: number
  transactionCount: number
  lastSessionAt: string | null
  lastPlatform: string | null
}

interface Result {
  data: AdminUserRow[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAdminUsers(): Result {
  const [data, setData] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: rows, error: err } = await supabase
      .from('admin_users_view')
      .select('*')
      .order('signup_at', { ascending: false })
    if (err) { setError(err.message); setData([]); setLoading(false); return }
    setError(null)
    setData((rows ?? []).map(r => ({
      id: r.id,
      email: r.email,
      fullName: r.full_name,
      phone: r.phone,
      signupAt: r.signup_at,
      lastSignInAt: r.last_sign_in_at,
      projectCount: r.project_count,
      transactionCount: r.transaction_count,
      lastSessionAt: r.last_session_at,
      lastPlatform: r.last_platform
    })))
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
```

- [ ] **Step E1.2: Commit**

```bash
git add shared/hooks/admin/useAdminUsers.ts
git commit -m "feat(admin): useAdminUsers hook (queries admin_users_view)"
```

---

## Task E2: AdminUsers screen

**Files:**
- Create: `components/admin/DataTable.tsx` (reusable)
- Create: `pages/admin/AdminUsers.tsx`

- [ ] **Step E2.1: DataTable component**

`components/admin/DataTable.tsx`:
```typescript
import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { theme } from '../../theme'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  width?: number | string
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  rows: T[]
  onRowPress?: (row: T) => void
  emptyMessage?: string
}

export function DataTable<T extends { id: string }>({
  columns, rows, onRowPress, emptyMessage = 'אין נתונים'
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <Text style={styles.empty}>{emptyMessage}</Text>
  }
  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.header]}>
        {columns.map(c => (
          <Text key={String(c.key)} style={[styles.cell, styles.headerText, c.width ? { width: c.width as any, flex: 0 } : null]}>
            {c.header}
          </Text>
        ))}
      </View>
      {rows.map(row => {
        const Wrapper: any = onRowPress ? Pressable : View
        return (
          <Wrapper
            key={row.id}
            style={styles.row}
            onPress={onRowPress ? () => onRowPress(row) : undefined}
          >
            {columns.map(c => (
              <View key={String(c.key)} style={[styles.cell, c.width ? { width: c.width as any, flex: 0 } : null]}>
                {c.render ? c.render(row) : <Text>{String((row as any)[c.key] ?? '')}</Text>}
              </View>
            ))}
          </Wrapper>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  table: { backgroundColor: theme.colors.neuBgAlt, borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row-reverse', borderBottomWidth: 1, borderBottomColor: theme.colors.neuShadow, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, alignItems: 'center' },
  header: { backgroundColor: theme.colors.neuLight, borderBottomWidth: 2 },
  cell: { flex: 1, paddingHorizontal: theme.spacing.sm },
  headerText: { fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'right' },
  empty: { padding: theme.spacing.xl, textAlign: 'center', color: theme.colors.textTertiary }
})
```

- [ ] **Step E2.2: AdminUsers screen**

`pages/admin/AdminUsers.tsx`:
```typescript
import React, { useMemo, useState } from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'
import { theme } from '../../theme'
import { DataTable, type Column } from '../../components/admin/DataTable'
import { useAdminUsers, type AdminUserRow } from '../../shared/hooks/admin/useAdminUsers'
import { AppScreen } from '../../shared/types'

interface Props { navigate: (screen: AppScreen, id?: string) => void }

export default function AdminUsers({ navigate }: Props) {
  const { data, loading, error } = useAdminUsers()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!q.trim()) return data
    const term = q.trim().toLowerCase()
    return data.filter(u =>
      u.email.toLowerCase().includes(term) ||
      (u.fullName?.toLowerCase().includes(term) ?? false)
    )
  }, [data, q])

  const columns: Column<AdminUserRow>[] = [
    { key: 'email', header: 'אימייל' },
    { key: 'fullName', header: 'שם', render: r => <Text>{r.fullName ?? '—'}</Text> },
    { key: 'signupAt', header: 'הצטרף', render: r => <Text>{new Date(r.signupAt).toLocaleDateString('he-IL')}</Text> },
    { key: 'lastSignInAt', header: 'כניסה אחרונה', render: r => <Text>{r.lastSignInAt ? new Date(r.lastSignInAt).toLocaleDateString('he-IL') : '—'}</Text> },
    { key: 'projectCount', header: 'פרויקטים', width: 90 },
    { key: 'transactionCount', header: 'תנועות', width: 90 }
  ]

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>משתמשים ({data.length})</Text>
      <TextInput
        style={styles.search}
        placeholder="חפש לפי אימייל או שם..."
        value={q}
        onChangeText={setQ}
      />
      {loading ? <Text>טוען...</Text>
        : error ? <Text style={styles.err}>{error}</Text>
        : <DataTable
            rows={filtered}
            columns={columns}
            onRowPress={row => navigate(AppScreen.ADMIN_USER_DETAIL, row.id)}
          />
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.lg },
  h1: { fontSize: 24, fontWeight: '800', textAlign: 'right', color: theme.colors.textPrimary },
  search: { backgroundColor: theme.colors.neuBgAlt, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, textAlign: 'right' },
  err: { color: theme.colors.error, textAlign: 'right' }
})
```

- [ ] **Step E2.3: Smoke test**

Reload `/admin` → click "משתמשים" in sidebar. Verify table shows 4 users. Search by email works.

- [ ] **Step E2.4: Commit**

```bash
git add components/admin/DataTable.tsx pages/admin/AdminUsers.tsx
git commit -m "feat(admin): AdminUsers screen with search + DataTable component"
```

---

## Task E3: AdminUserDetail + reset password Edge Function

**Files:**
- Create: `pages/admin/AdminUserDetail.tsx`
- Create: `shared/lib/adminApi.ts`
- Modify: `backend/supabase/functions/reset-password/index.ts`

- [ ] **Step E3.1: reset-password Edge Function**

Replace `backend/supabase/functions/reset-password/index.ts`:
```typescript
// Edge Function: reset-password
// Body: { userEmail: string }
// Requires caller JWT email = ADMIN_EMAIL.
// Sends Supabase password reset email via Admin API.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const ADMIN_EMAIL = 'karnafstudio@gmail.com'

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const auth = req.headers.get('Authorization') ?? ''
    const token = auth.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'missing token' }, 401, corsHeaders)

    const supaUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: u } = await supaUser.auth.getUser(token)
    if (!u?.user?.email || u.user.email.toLowerCase() !== ADMIN_EMAIL) {
      return json({ error: 'forbidden' }, 403, corsHeaders)
    }

    const { userEmail } = await req.json()
    if (!userEmail) return json({ error: 'userEmail required' }, 400, corsHeaders)

    const supaAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { error } = await supaAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail
    })
    if (error) return json({ error: error.message }, 500, corsHeaders)
    return json({ ok: true }, 200, corsHeaders)
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders)
  }
})

function json(body: object, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...headers, 'Content-Type': 'application/json' }
  })
}
```

- [ ] **Step E3.2: Deploy Edge Function**

```bash
npm run sb:fn:deploy reset-password
```

Expected: deploy succeeds. Set secrets if not already:
```bash
npm run sb -- secrets list
# Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (Supabase sets these automatically)
```

- [ ] **Step E3.3: adminApi.ts caller**

`shared/lib/adminApi.ts`:
```typescript
import { supabase } from './supabase'

const FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''}/functions/v1`

async function callFn<T>(name: string, body: object): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const adminApi = {
  resetPassword: (userEmail: string) => callFn<{ ok: boolean }>('reset-password', { userEmail })
}
```

- [ ] **Step E3.4: AdminUserDetail screen**

`pages/admin/AdminUserDetail.tsx`: drill-in screen accepting `userId` prop. Loads user from `admin_users_view`, projects from `projects` filtered by user_id, recent feedback/messages. Buttons: "אפס סיסמה" (calls adminApi.resetPassword), "שלח הודעה" (navigates to AdminMessages with user preselected — wire later in Task J).

```typescript
import React from 'react'
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native'
import { theme } from '../../theme'
import { adminApi } from '../../shared/lib/adminApi'
// useAdminUsers returns the full list; for one user we filter
import { useAdminUsers } from '../../shared/hooks/admin/useAdminUsers'

interface Props { userId: string }

export default function AdminUserDetail({ userId }: Props) {
  const { data, loading } = useAdminUsers()
  const u = data.find(x => x.id === userId)

  const onResetPassword = async () => {
    if (!u?.email) return
    try {
      await adminApi.resetPassword(u.email)
      Alert.alert('הצלחה', `אימייל איפוס סיסמה נשלח ל-${u.email}`)
    } catch (e) {
      Alert.alert('שגיאה', (e as Error).message)
    }
  }

  if (loading || !u) return <Text>טוען...</Text>

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>{u.fullName ?? u.email}</Text>
      <Text style={styles.sub}>{u.email}</Text>
      <View style={styles.kv}><Text style={styles.k}>הצטרף:</Text><Text>{new Date(u.signupAt).toLocaleDateString('he-IL')}</Text></View>
      <View style={styles.kv}><Text style={styles.k}>כניסה אחרונה:</Text><Text>{u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString('he-IL') : '—'}</Text></View>
      <View style={styles.kv}><Text style={styles.k}>פרויקטים:</Text><Text>{u.projectCount}</Text></View>
      <View style={styles.kv}><Text style={styles.k}>תנועות:</Text><Text>{u.transactionCount}</Text></View>
      <View style={styles.kv}><Text style={styles.k}>פלטפורמה אחרונה:</Text><Text>{u.lastPlatform ?? '—'}</Text></View>
      <Pressable style={styles.btn} onPress={onResetPassword}>
        <Text style={styles.btnText}>אפס סיסמה</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.md },
  h1: { fontSize: 24, fontWeight: '800', textAlign: 'right' },
  sub: { color: theme.colors.textSecondary, textAlign: 'right' },
  kv: { flexDirection: 'row-reverse', gap: theme.spacing.md },
  k: { fontWeight: '600', minWidth: 140, textAlign: 'right' },
  btn: { marginTop: theme.spacing.lg, backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.borderRadius.full, alignSelf: 'flex-end' },
  btnText: { color: '#fff', fontWeight: '700' }
})
```

- [ ] **Step E3.5: Pass userId via App.tsx navigation**

In `App.tsx`, ensure `navigate(screen, id)` passes `id` to the rendered admin screen as `userId` (or `leadId` later). For AdminUserDetail, prop name is `userId`.

- [ ] **Step E3.6: Smoke test**

Click a user row → user detail loads → click "אפס סיסמה" → check inbox of that user for reset email.

- [ ] **Step E3.7: Commit**

```bash
git add backend/supabase/functions/reset-password/index.ts \
        shared/lib/adminApi.ts \
        pages/admin/AdminUserDetail.tsx \
        App.tsx
git commit -m "feat(admin): AdminUserDetail + reset-password Edge Function"
```

---

## Task F1: useLeads + useLeadActivities hooks

**Files:**
- Create: `shared/hooks/admin/useLeads.ts`
- Create: `shared/hooks/admin/useLeadActivities.ts`

- [ ] **Step F1.1: useLeads**

`shared/hooks/admin/useLeads.ts`:
```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Lead, LeadStatus } from '../../types'

interface Result {
  data: Lead[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  create: (input: Omit<Lead, 'id' | 'createdAt' | 'firstTouchAt' | 'tags' | 'ltvIls' | 'convertedToUserId'>) => Promise<Lead>
  update: (id: string, patch: Partial<Lead>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useLeads(): Result {
  const [data, setData] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const map = (r: any): Lead => ({
    id: r.id, email: r.email, name: r.name, phone: r.phone,
    source: r.source, status: r.status,
    firstTouchAt: r.first_touch_at, lastContactAt: r.last_contact_at,
    notes: r.notes, tags: r.tags ?? [],
    convertedToUserId: r.converted_to_user_id, ltvIls: Number(r.ltv_ils),
    createdAt: r.created_at
  })

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: rows, error: err } = await supabase
      .from('leads').select('*').order('created_at', { ascending: false })
    if (err) { setError(err.message); setData([]) }
    else { setError(null); setData((rows ?? []).map(map)) }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create: Result['create'] = async (input) => {
    const { data: row, error: err } = await supabase
      .from('leads').insert({
        email: input.email, name: input.name, phone: input.phone,
        source: input.source, status: input.status,
        notes: input.notes
      }).select('*').single()
    if (err) throw new Error(err.message)
    const created = map(row)
    setData(prev => [created, ...prev])
    return created
  }

  const update: Result['update'] = async (id, patch) => {
    const dbPatch: Record<string, unknown> = {}
    if (patch.email !== undefined) dbPatch.email = patch.email
    if (patch.name !== undefined) dbPatch.name = patch.name
    if (patch.phone !== undefined) dbPatch.phone = patch.phone
    if (patch.status !== undefined) dbPatch.status = patch.status
    if (patch.notes !== undefined) dbPatch.notes = patch.notes
    if (patch.tags !== undefined) dbPatch.tags = patch.tags
    if (patch.lastContactAt !== undefined) dbPatch.last_contact_at = patch.lastContactAt
    const { error: err } = await supabase.from('leads').update(dbPatch).eq('id', id)
    if (err) throw new Error(err.message)
    setData(prev => prev.map(l => l.id === id ? { ...l, ...patch } as Lead : l))
  }

  const remove: Result['remove'] = async (id) => {
    const { error: err } = await supabase.from('leads').delete().eq('id', id)
    if (err) throw new Error(err.message)
    setData(prev => prev.filter(l => l.id !== id))
  }

  return { data, loading, error, refetch: fetch, create, update, remove }
}
```

- [ ] **Step F1.2: useLeadActivities**

`shared/hooks/admin/useLeadActivities.ts`:
```typescript
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export interface LeadActivity {
  id: string
  leadId: string
  type: 'email_sent' | 'whatsapp_sent' | 'call' | 'note' | 'status_change'
  description: string
  metadata: unknown
  createdAt: string
}

interface Result {
  data: LeadActivity[]
  loading: boolean
  add: (input: Omit<LeadActivity, 'id' | 'createdAt'>) => Promise<void>
}

export function useLeadActivities(leadId: string | null): Result {
  const [data, setData] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!leadId) { setData([]); setLoading(false); return }
    setLoading(true)
    const { data: rows } = await supabase
      .from('lead_activities').select('*')
      .eq('lead_id', leadId).order('created_at', { ascending: false })
    setData((rows ?? []).map(r => ({
      id: r.id, leadId: r.lead_id, type: r.type,
      description: r.description, metadata: r.metadata, createdAt: r.created_at
    })))
    setLoading(false)
  }, [leadId])

  useEffect(() => { fetch() }, [fetch])

  const add: Result['add'] = async (input) => {
    if (!leadId) return
    await supabase.from('lead_activities').insert({
      lead_id: leadId, type: input.type,
      description: input.description, metadata: input.metadata
    })
    await fetch()
  }

  return { data, loading, add }
}
```

- [ ] **Step F1.3: Commit**

```bash
git add shared/hooks/admin/useLeads.ts shared/hooks/admin/useLeadActivities.ts
git commit -m "feat(admin): useLeads + useLeadActivities hooks"
```

---

## Task F2: AdminLeads screen + add/edit form

**Files:**
- Create: `pages/admin/AdminLeads.tsx`
- Create: `pages/admin/AdminLeadDetail.tsx`
- Create: `components/admin/LeadForm.tsx`

- [ ] **Step F2.1: LeadForm component**

`components/admin/LeadForm.tsx`: standard form with email/name/phone/source/status/notes/tags inputs. Submit calls `useLeads().create` or `update`. Use existing form styling from `pages/AddProject.tsx`.

- [ ] **Step F2.2: AdminLeads screen**

`pages/admin/AdminLeads.tsx`: table with columns Email | Name | Phone | Source | Status | Tags | First touch | Last contact. Status filter pills. "+ הוסף ליד" button opens modal with LeadForm. Click row → AdminLeadDetail.

- [ ] **Step F2.3: AdminLeadDetail screen**

`pages/admin/AdminLeadDetail.tsx`: shows lead details, edit button, activities timeline (uses `useLeadActivities`), "+ הוסף הערה" button, "שלח מייל / WhatsApp" buttons (placeholders pointing to AdminMessages).

- [ ] **Step F2.4: Smoke test**

Navigate to Leads → "+ הוסף ליד" → fill in email/name/source=manual → save → row appears in table. Click row → detail screen. Add a note → appears in timeline.

- [ ] **Step F2.5: Commit**

```bash
git add pages/admin/AdminLeads.tsx pages/admin/AdminLeadDetail.tsx components/admin/LeadForm.tsx
git commit -m "feat(admin): AdminLeads + AdminLeadDetail screens with add/edit/notes"
```

---

## Task F3: Leads CSV import/export

**Files:**
- Create: `shared/admin/csv.ts`
- Create: `__tests__/shared/admin/csv.test.ts`
- Modify: `pages/admin/AdminLeads.tsx`

- [ ] **Step F3.1: Write the CSV test**

`__tests__/shared/admin/csv.test.ts`:
```typescript
import { leadsToCsv, csvToLeadInputs } from '../../../shared/admin/csv'
import type { Lead } from '../../../shared/types'

const lead = (overrides: Partial<Lead>): Lead => ({
  id: 'l1', email: 'a@b.com', name: 'Alice', phone: '050-1234567',
  source: 'manual', status: 'new', firstTouchAt: '2026-01-01T00:00:00Z',
  lastContactAt: null, notes: null, tags: ['vip'],
  convertedToUserId: null, ltvIls: 0, createdAt: '2026-01-01T00:00:00Z',
  ...overrides
})

describe('leadsToCsv', () => {
  test('produces a header row + data rows', () => {
    const csv = leadsToCsv([lead({}), lead({ id: 'l2', email: 'c@d.com', name: null })])
    const lines = csv.trim().split('\n')
    expect(lines[0]).toBe('email,name,phone,source,status,tags,first_touch_at,last_contact_at,notes')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toContain('a@b.com')
    expect(lines[2]).toContain('c@d.com')
  })

  test('quotes fields containing commas', () => {
    const csv = leadsToCsv([lead({ name: 'Alice, Test', notes: 'with, comma' })])
    expect(csv).toMatch(/"Alice, Test"/)
    expect(csv).toMatch(/"with, comma"/)
  })
})

describe('csvToLeadInputs', () => {
  test('parses valid CSV', () => {
    const csv = 'email,name,source,status\nfoo@bar.com,Foo,manual,new\n'
    const out = csvToLeadInputs(csv)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ email: 'foo@bar.com', name: 'Foo', source: 'manual', status: 'new' })
  })

  test('rejects rows without email', () => {
    const csv = 'email,name\n,NoEmail\nok@x.com,OK\n'
    const out = csvToLeadInputs(csv)
    expect(out).toHaveLength(1)
    expect(out[0].email).toBe('ok@x.com')
  })

  test('defaults source=manual and status=new if missing', () => {
    const csv = 'email\nfoo@bar.com\n'
    const out = csvToLeadInputs(csv)
    expect(out[0]).toMatchObject({ source: 'manual', status: 'new' })
  })
})
```

- [ ] **Step F3.2: Run test to confirm fail**

```bash
npx jest __tests__/shared/admin/csv.test.ts
```

Expected: FAIL with "Cannot find module".

- [ ] **Step F3.3: Implement csv.ts**

`shared/admin/csv.ts`:
```typescript
import Papa from 'papaparse'
import type { Lead, LeadSource, LeadStatus } from '../types'

const HEADERS = [
  'email','name','phone','source','status','tags',
  'first_touch_at','last_contact_at','notes'
] as const

export function leadsToCsv(leads: Lead[]): string {
  const rows = leads.map(l => ({
    email: l.email,
    name: l.name ?? '',
    phone: l.phone ?? '',
    source: l.source,
    status: l.status,
    tags: (l.tags ?? []).join('|'),
    first_touch_at: l.firstTouchAt,
    last_contact_at: l.lastContactAt ?? '',
    notes: l.notes ?? ''
  }))
  return Papa.unparse({ fields: [...HEADERS], data: rows })
}

export interface LeadInput {
  email: string
  name?: string
  phone?: string
  source: LeadSource
  status: LeadStatus
  notes?: string
  tags?: string[]
}

const SOURCES: LeadSource[] = ['website_form','referral','ad_facebook','ad_google','manual','signup']
const STATUSES: LeadStatus[] = ['new','contacted','trial','paying','churned','lost']

export function csvToLeadInputs(csv: string): LeadInput[] {
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true })
  const inputs: LeadInput[] = []
  for (const r of parsed.data) {
    const email = (r.email ?? '').trim().toLowerCase()
    if (!email) continue
    const source = SOURCES.includes(r.source as LeadSource) ? (r.source as LeadSource) : 'manual'
    const status = STATUSES.includes(r.status as LeadStatus) ? (r.status as LeadStatus) : 'new'
    inputs.push({
      email,
      name: r.name?.trim() || undefined,
      phone: r.phone?.trim() || undefined,
      source,
      status,
      notes: r.notes?.trim() || undefined,
      tags: r.tags ? r.tags.split('|').map(t => t.trim()).filter(Boolean) : undefined
    })
  }
  return inputs
}

export function downloadCsvInBrowser(csv: string, filename: string): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step F3.4: Run test, verify pass**

```bash
npx jest __tests__/shared/admin/csv.test.ts
```

Expected: PASS (5/5).

- [ ] **Step F3.5: Wire export + import buttons in AdminLeads**

Add to `pages/admin/AdminLeads.tsx`:
- "ייצא CSV" button → `downloadCsvInBrowser(leadsToCsv(data), 'leads-YYYY-MM-DD.csv')`
- "ייבא CSV" button → web file input → on file read, `csvToLeadInputs(csv)` → batch insert via `create()`

- [ ] **Step F3.6: Smoke test**

Export → CSV downloads. Edit CSV to add 2 new leads, import → 2 rows added.

- [ ] **Step F3.7: Commit**

```bash
git add shared/admin/csv.ts __tests__/shared/admin/csv.test.ts pages/admin/AdminLeads.tsx
git commit -m "feat(admin): leads CSV export + import with papaparse"
```

---

## Task F4: contact-form-handler Edge Function

**Files:**
- Modify: `backend/supabase/functions/contact-form-handler/index.ts`

- [ ] **Step F4.1: Implement function**

```typescript
// Public endpoint: receives website contact-form posts, upserts lead.
// No auth — rate-limited per IP. Returns 200 OK or 4xx.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': 'https://sasomm.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  try {
    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return json({ error: 'invalid email' }, 400)
    }
    const name = body.name ? String(body.name).slice(0, 200) : null
    const phone = body.phone ? String(body.phone).slice(0, 30) : null
    const message = body.message ? String(body.message).slice(0, 2000) : null

    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    // Upsert by email
    const { error } = await supa.from('leads').upsert({
      email, name, phone,
      source: 'website_form',
      status: 'new',
      notes: message
    }, { onConflict: 'email' })
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true }, 200)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}
```

- [ ] **Step F4.2: Deploy with --no-verify-jwt (public endpoint)**

```bash
npm run sb -- functions deploy contact-form-handler --no-verify-jwt
```

- [ ] **Step F4.3: Smoke test via curl**

```bash
curl -X POST "https://bknswnzipvdtqsfhhsss.supabase.co/functions/v1/contact-form-handler" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-lead@example.com","name":"Test","message":"hi"}'
```

Expected: `{"ok":true}`. Verify lead row in `leads` table.

- [ ] **Step F4.4: Commit**

```bash
git add backend/supabase/functions/contact-form-handler/index.ts
git commit -m "feat(backend): contact-form-handler Edge Function (public, leads upsert)"
```

---

## Task G1: useFeedback + useAdminTodos hooks

**Files:**
- Create: `shared/hooks/admin/useFeedback.ts`
- Create: `shared/hooks/admin/useAdminTodos.ts`

- [ ] **Step G1.1: useFeedback**

`shared/hooks/admin/useFeedback.ts`: CRUD on `feedback` table. Methods: `data`, `loading`, `refetch`, `updateStatus(id, status)`, `reply(id, text)` (sets status='in_progress', appends response).

- [ ] **Step G1.2: useAdminTodos**

`shared/hooks/admin/useAdminTodos.ts`: CRUD on `admin_todos`. Methods: `data`, `loading`, `create({ title, description, priority })`, `updateStatus(id, status)`, `remove(id)`.

(Patterns identical to useLeads — write similarly.)

- [ ] **Step G1.3: Commit**

```bash
git add shared/hooks/admin/useFeedback.ts shared/hooks/admin/useAdminTodos.ts
git commit -m "feat(admin): useFeedback + useAdminTodos hooks"
```

---

## Task G2: AdminFeedbackTodo screen (kanban + list)

**Files:**
- Create: `components/admin/KanbanColumn.tsx`
- Create: `pages/admin/AdminFeedbackTodo.tsx`

- [ ] **Step G2.1: KanbanColumn**

`components/admin/KanbanColumn.tsx`: takes `title`, `items[]`, `renderItem`, `onMoveItem(id, newStatus)`. Renders column header + scrollable list. Each item has < > arrows to move between columns.

- [ ] **Step G2.2: AdminFeedbackTodo screen**

`pages/admin/AdminFeedbackTodo.tsx`:
- Two tabs: "משוב" / "משימות שלי"
- Feedback tab: 3 KanbanColumns (New / In Progress / Closed), each card shows user email, screen, message, reply box, "שלח & סגור" button
- TODO tab: List with "+ הוסף משימה" button, each item shows title/priority chip/status checkbox/edit/delete

- [ ] **Step G2.3: Smoke test**

Navigate to Feedback+TODO. The test feedback from C1.4 should appear in "New". Move it to "In Progress". Add a TODO "Configure GREEN API". Mark complete. All persists in DB.

- [ ] **Step G2.4: Commit**

```bash
git add components/admin/KanbanColumn.tsx pages/admin/AdminFeedbackTodo.tsx
git commit -m "feat(admin): AdminFeedbackTodo with kanban + personal TODO"
```

---

## Task H1: useBusinessExpenses + useBusinessInfo

**Files:**
- Create: `shared/hooks/admin/useBusinessExpenses.ts`
- Create: `shared/hooks/admin/useBusinessInfo.ts`

- [ ] **Step H1.1: useBusinessExpenses**

CRUD on `business_expenses`. Methods: `data`, `loading`, `byMonth(month)` selector, `create({ category, vendor, amountIls, ..., isRecurring })`, `update(id, patch)`, `remove(id)`.

- [ ] **Step H1.2: useBusinessInfo**

Single-row read/update on `business_info`. Methods: `data`, `loading`, `update(patch)`.

- [ ] **Step H1.3: Commit**

```bash
git add shared/hooks/admin/useBusinessExpenses.ts shared/hooks/admin/useBusinessInfo.ts
git commit -m "feat(admin): useBusinessExpenses + useBusinessInfo hooks"
```

---

## Task H2: P&L computation utilities + tests

**Files:**
- Create: `shared/admin/kpis.ts`
- Create: `__tests__/shared/admin/kpis.test.ts`

- [ ] **Step H2.1: Write test**

`__tests__/shared/admin/kpis.test.ts`:
```typescript
import { computeMonthlyPnL, type PnLInputs } from '../../../shared/admin/kpis'

const exp = (overrides: any) => ({
  id: 'e', category: 'api' as const, vendor: 'X', amountIls: 0,
  amountOriginal: 0, currencyOriginal: 'ILS' as const,
  month: '2026-05', expenseDate: '2026-05-15',
  isRecurring: false, autoSource: null, receiptUrl: null,
  includesVat: false, vatAmount: 0, notes: null,
  createdAt: '2026-05-15', ...overrides
})

describe('computeMonthlyPnL', () => {
  test('returns zeroes for empty inputs', () => {
    const result = computeMonthlyPnL({ expenses: [], payments: [], month: '2026-05' })
    expect(result).toEqual({ revenue: 0, expenses: 0, profit: 0, marginPct: 0 })
  })

  test('sums revenue and expenses correctly', () => {
    const r = computeMonthlyPnL({
      expenses: [exp({ amountIls: 100 }), exp({ amountIls: 200 })],
      payments: [{ amountIls: 1000, month: '2026-05' }, { amountIls: 500, month: '2026-05' }],
      month: '2026-05'
    })
    expect(r.revenue).toBe(1500)
    expect(r.expenses).toBe(300)
    expect(r.profit).toBe(1200)
    expect(r.marginPct).toBeCloseTo(80, 1)
  })

  test('filters by month', () => {
    const r = computeMonthlyPnL({
      expenses: [exp({ amountIls: 100, month: '2026-04' }), exp({ amountIls: 200, month: '2026-05' })],
      payments: [],
      month: '2026-05'
    })
    expect(r.expenses).toBe(200)
  })

  test('margin is 0 when revenue is 0', () => {
    const r = computeMonthlyPnL({
      expenses: [exp({ amountIls: 100 })], payments: [], month: '2026-05'
    })
    expect(r.marginPct).toBe(0)
  })
})
```

- [ ] **Step H2.2: Run, verify fail**

```bash
npx jest __tests__/shared/admin/kpis.test.ts
```

Expected FAIL.

- [ ] **Step H2.3: Implement kpis.ts**

`shared/admin/kpis.ts`:
```typescript
import type { BusinessExpense } from '../types'

export interface PnLInputs {
  expenses: BusinessExpense[]
  payments: { amountIls: number; month: string }[]
  month: string
}

export interface PnLResult {
  revenue: number
  expenses: number
  profit: number
  marginPct: number
}

export function computeMonthlyPnL(inputs: PnLInputs): PnLResult {
  const expenses = inputs.expenses
    .filter(e => e.month === inputs.month)
    .reduce((sum, e) => sum + Number(e.amountIls), 0)
  const revenue = inputs.payments
    .filter(p => p.month === inputs.month)
    .reduce((sum, p) => sum + Number(p.amountIls), 0)
  const profit = revenue - expenses
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0
  return { revenue, expenses, profit, marginPct }
}
```

- [ ] **Step H2.4: Run, verify pass**

```bash
npx jest __tests__/shared/admin/kpis.test.ts
```

Expected PASS (4/4).

- [ ] **Step H2.5: Commit**

```bash
git add shared/admin/kpis.ts __tests__/shared/admin/kpis.test.ts
git commit -m "feat(admin): P&L computation utility with tests"
```

---

## Task H3: AdminFinancials screen

**Files:**
- Create: `pages/admin/AdminFinancials.tsx`
- Create: `components/admin/ExpenseForm.tsx`

- [ ] **Step H3.1: ExpenseForm**

`components/admin/ExpenseForm.tsx`: form with category dropdown, vendor, amount, currency, date, is_recurring toggle, includes_vat toggle, notes. Submit → create/update via `useBusinessExpenses`. If `is_recurring=true`, show explainer "ייווצר אוטומטית כל חודש לפי תאריך זה".

- [ ] **Step H3.2: AdminFinancials screen**

```typescript
import React, { useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native'
import { theme } from '../../theme'
import { KpiCard } from '../../components/admin/KpiCard'
import { DataTable, type Column } from '../../components/admin/DataTable'
import { useBusinessExpenses } from '../../shared/hooks/admin/useBusinessExpenses'
import { computeMonthlyPnL } from '../../shared/admin/kpis'
import { ExpenseForm } from '../../components/admin/ExpenseForm'
import type { BusinessExpense } from '../../shared/types'

export default function AdminFinancials() {
  const { data: expenses, loading, refetch } = useBusinessExpenses()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BusinessExpense | null>(null)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const pnl = useMemo(() =>
    computeMonthlyPnL({ expenses, payments: [], month: currentMonth }),
    [expenses, currentMonth]
  )

  // 12-month P&L table
  const months = useMemo(() => {
    const arr: string[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      arr.push(d.toISOString().slice(0, 7))
    }
    return arr
  }, [])

  const monthlyRows = months.map(m => ({
    id: m, month: m,
    ...computeMonthlyPnL({ expenses, payments: [], month: m })
  }))

  const columns: Column<typeof monthlyRows[0]>[] = [
    { key: 'month', header: 'חודש' },
    { key: 'revenue', header: 'הכנסה', render: r => <Text>₪{r.revenue.toLocaleString('he-IL')}</Text> },
    { key: 'expenses', header: 'הוצאה', render: r => <Text>₪{r.expenses.toLocaleString('he-IL')}</Text> },
    { key: 'profit', header: 'רווח', render: r => <Text style={{ color: r.profit >= 0 ? theme.colors.success : theme.colors.error }}>₪{r.profit.toLocaleString('he-IL')}</Text> },
    { key: 'marginPct', header: 'מרווח %', render: r => <Text>{r.marginPct.toFixed(1)}%</Text> }
  ]

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.h1}>רווח והפסד</Text>
        <Pressable style={styles.btn} onPress={() => { setEditTarget(null); setFormOpen(true) }}>
          <Text style={styles.btnText}>+ הוסף הוצאה</Text>
        </Pressable>
      </View>

      <View style={styles.kpis}>
        <KpiCard label="הכנסות (חודש נוכחי)" value={`₪${pnl.revenue.toLocaleString('he-IL')}`} />
        <KpiCard label="הוצאות"                value={`₪${pnl.expenses.toLocaleString('he-IL')}`} />
        <KpiCard label="רווח"                  value={`₪${pnl.profit.toLocaleString('he-IL')}`} hint={pnl.profit >= 0 ? '🟢' : '🔴'} />
        <KpiCard label="מרווח %"               value={`${pnl.marginPct.toFixed(1)}%`} />
      </View>

      <Text style={styles.h2}>12 חודשים אחרונים</Text>
      <DataTable rows={monthlyRows} columns={columns} />

      <Modal visible={formOpen} transparent animationType="fade" onRequestClose={() => setFormOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <ExpenseForm
              initial={editTarget ?? undefined}
              onSubmit={async () => { await refetch(); setFormOpen(false) }}
              onCancel={() => setFormOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.lg },
  row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'right' },
  h2: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'right' },
  kpis: { flexDirection: 'row-reverse', gap: theme.spacing.md, flexWrap: 'wrap' },
  btn: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.borderRadius.full },
  btnText: { color: '#fff', fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: theme.colors.neuBg, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, width: '90%', maxWidth: 500 }
})
```

- [ ] **Step H3.3: Smoke test**

Navigate Financials → add 3 expenses (Supabase plan ₪90, GREEN API ₪70, domain ₪30) for current month. Verify totals appear in KPI cards and current month row.

- [ ] **Step H3.4: Commit**

```bash
git add pages/admin/AdminFinancials.tsx components/admin/ExpenseForm.tsx
git commit -m "feat(admin): AdminFinancials with P&L table + expense form"
```

---

## Task I1: send-email Edge Function

**Files:**
- Modify: `backend/supabase/functions/send-email/index.ts`

- [ ] **Step I1.1: Implement send-email**

```typescript
// Sends email via Resend. Admin-only. Logs to admin_email_log.
// Body: { userIds?: string[], emails?: string[], subject, body, type: 'transactional'|'marketing' }
// Marketing requires recipient.marketing_consent = true (check via profiles).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const ADMIN_EMAIL = 'karnafstudio@gmail.com'

Deno.serve(async (req: Request) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405, cors)

  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const supaUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await supaUser.auth.getUser(token)
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
      return json({ error: 'forbidden' }, 403, cors)
    }

    const { userIds = [], emails = [], subject, body, type = 'transactional' } = await req.json()
    if (!subject || !body) return json({ error: 'subject and body required' }, 400, cors)

    const supaAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Resolve user emails
    const resolved: { user_id: string | null; email: string }[] = []
    if (userIds.length > 0) {
      const { data: users } = await supaAdmin.auth.admin.listUsers({ perPage: 1000 })
      const lookup = new Map((users?.users ?? []).map((u: any) => [u.id, u.email]))
      for (const uid of userIds) {
        const em = lookup.get(uid)
        if (em) resolved.push({ user_id: uid, email: em })
      }
    }
    for (const em of emails) resolved.push({ user_id: null, email: em })
    if (resolved.length === 0) return json({ error: 'no recipients' }, 400, cors)

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) return json({ error: 'RESEND_API_KEY not set' }, 500, cors)

    const results: Array<{ email: string; ok: boolean; error?: string }> = []
    for (const r of resolved) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'SASOMM <noreply@sasomm.com>',
          to: r.email,
          subject,
          html: body
        })
      })
      const ok = res.ok
      const respData = await res.json().catch(() => ({}))
      results.push({ email: r.email, ok, error: ok ? undefined : (respData.message ?? 'error') })

      await supaAdmin.from('admin_email_log').insert({
        recipient_user_id: r.user_id,
        recipient_email: r.email,
        subject,
        body,
        status: ok ? 'sent' : 'failed',
        error_message: ok ? null : (respData.message ?? null),
        resend_message_id: ok ? (respData.id ?? null) : null
      })
    }
    return json({ results }, 200, cors)
  } catch (e) {
    return json({ error: (e as Error).message }, 500, cors)
  }
})

function json(body: object, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...headers, 'Content-Type': 'application/json' }
  })
}
```

- [ ] **Step I1.2: Set Resend secret**

```bash
npm run sb -- secrets set RESEND_API_KEY=re_xxxxx_yourkey
```

(Obtain key from https://resend.com → API Keys. Domain `sasomm.com` must be verified in Resend with SPF/DKIM DNS records added.)

- [ ] **Step I1.3: Deploy**

```bash
npm run sb:fn:deploy send-email
```

- [ ] **Step I1.4: Smoke test via curl**

```bash
TOKEN=$(curl -s -X POST "https://bknswnzipvdtqsfhhsss.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"karnafstudio@gmail.com","password":"YOURPASSWORD"}' | jq -r '.access_token')

curl -X POST "https://bknswnzipvdtqsfhhsss.supabase.co/functions/v1/send-email" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"emails":["karnafstudio@gmail.com"],"subject":"Test","body":"<h1>Hello</h1>","type":"transactional"}'
```

Expected: `{"results":[{"email":"karnafstudio@gmail.com","ok":true}]}` and email in inbox.

- [ ] **Step I1.5: Add to adminApi**

In `shared/lib/adminApi.ts`:
```typescript
sendEmail: (input: { userIds?: string[]; emails?: string[]; subject: string; body: string; type?: 'transactional'|'marketing' }) =>
  callFn<{ results: Array<{ email: string; ok: boolean; error?: string }> }>('send-email', input)
```

- [ ] **Step I1.6: Commit**

```bash
git add backend/supabase/functions/send-email/index.ts shared/lib/adminApi.ts
git commit -m "feat(backend): send-email Edge Function via Resend + admin gate"
```

---

## Task I2: send-push Edge Function

**Files:**
- Modify: `backend/supabase/functions/send-push/index.ts`

- [ ] **Step I2.1: Implement**

Similar structure to send-email. Body: `{ userIds: string[], title, body }`. Reads `profiles.expo_push_token` (add column in this task) for each userId, sends to `https://exp.host/--/api/v2/push/send`.

**First, add migration to capture push tokens:**

`backend/supabase/migrations/20260512100300_profiles_push_token.sql`:
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expo_push_token text;
```

Apply: `npm run sb:migrate`.

Then implement `send-push`:
```typescript
// Sends push via Expo Push API. Admin-only. Inserts into user_messages with channel=push.

import { createClient } from 'jsr:@supabase/supabase-js@2'
const ADMIN_EMAIL = 'karnafstudio@gmail.com'

Deno.serve(async (req: Request) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const supaUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
  const { data: { user } } = await supaUser.auth.getUser(token)
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: cors })
  }

  const { userIds, title, body } = await req.json()
  const supaAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: profiles } = await supaAdmin
    .from('profiles').select('id, expo_push_token').in('id', userIds)
  const tokens = (profiles ?? []).filter(p => p.expo_push_token).map(p => p.expo_push_token)

  if (tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no push tokens' }), { status: 200, headers: cors })
  }

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
    body: JSON.stringify(tokens.map(t => ({ to: t, title, body, sound: 'default' })))
  })
  const out = await res.json()

  // Log to user_messages
  for (const uid of userIds) {
    await supaAdmin.from('user_messages').insert({
      user_id: uid, channels: ['push'], title, body, status: 'sent'
    })
  }
  return new Response(JSON.stringify({ sent: tokens.length, expo: out }), { status: 200, headers: cors })
})
```

- [ ] **Step I2.2: Deploy + adminApi method**

```bash
npm run sb:fn:deploy send-push
```

Add to adminApi: `sendPush({ userIds, title, body })`.

- [ ] **Step I2.3: Commit**

```bash
git add backend/supabase/functions/send-push/index.ts \
        backend/supabase/migrations/20260512100300_profiles_push_token.sql \
        shared/lib/adminApi.ts
git commit -m "feat(backend): send-push Edge Function + profiles.expo_push_token"
```

---

## Task I3: send-whatsapp Edge Function (GREEN API)

**Files:**
- Modify: `backend/supabase/functions/send-whatsapp/index.ts`

- [ ] **Step I3.1: Implement**

```typescript
// Sends WhatsApp via GREEN API. Admin-only. Logs to user_messages with channel=whatsapp.
// Body: { phone: string (E.164, e.g. '972501234567'), message: string, userId?: string }

import { createClient } from 'jsr:@supabase/supabase-js@2'
const ADMIN_EMAIL = 'karnafstudio@gmail.com'

Deno.serve(async (req: Request) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const supaUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
  const { data: { user } } = await supaUser.auth.getUser(token)
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: cors })
  }

  const { phone, message, userId } = await req.json()
  if (!phone || !message) {
    return new Response(JSON.stringify({ error: 'phone and message required' }), { status: 400, headers: cors })
  }

  const instance = Deno.env.get('GREEN_API_INSTANCE_ID')
  const apiToken = Deno.env.get('GREEN_API_TOKEN')
  if (!instance || !apiToken) {
    return new Response(JSON.stringify({ error: 'GREEN_API credentials missing' }), { status: 500, headers: cors })
  }

  // GREEN API expects chatId = '<phone>@c.us'
  const chatId = `${phone.replace(/^\+/, '')}@c.us`
  const res = await fetch(`https://api.green-api.com/waInstance${instance}/sendMessage/${apiToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message })
  })
  const out = await res.json()
  const ok = res.ok && out.idMessage

  const supaAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  await supaAdmin.from('user_messages').insert({
    user_id: userId ?? null,
    channels: ['whatsapp'],
    title: '(WhatsApp)',
    body: message,
    status: ok ? 'sent' : 'failed',
    whatsapp_chat_id: ok ? out.idMessage : null
  })

  return new Response(JSON.stringify({ ok, response: out }), { status: ok ? 200 : 502, headers: cors })
})
```

- [ ] **Step I3.2: Set GREEN API secrets**

```bash
# After signing up at green-api.com and creating an instance:
npm run sb -- secrets set GREEN_API_INSTANCE_ID=1101000000
npm run sb -- secrets set GREEN_API_TOKEN=xxxxxxxxxxxxxxxxxx
```

- [ ] **Step I3.3: Deploy + adminApi**

```bash
npm run sb:fn:deploy send-whatsapp
```

Add to adminApi: `sendWhatsApp({ phone, message, userId })`.

- [ ] **Step I3.4: Smoke test**

```bash
curl -X POST "https://bknswnzipvdtqsfhhsss.supabase.co/functions/v1/send-whatsapp" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"phone":"972XXXXXXXXX","message":"Hello from SASOMM"}'
```

Expected: `{"ok":true, ...}` + actual WhatsApp message delivered.

- [ ] **Step I3.5: Commit**

```bash
git add backend/supabase/functions/send-whatsapp/index.ts shared/lib/adminApi.ts
git commit -m "feat(backend): send-whatsapp Edge Function via GREEN API"
```

---

## Task J1: AdminMessages screen + composer

**Files:**
- Create: `pages/admin/AdminMessages.tsx`
- Create: `components/admin/MessageComposer.tsx`

- [ ] **Step J1.1: MessageComposer**

`components/admin/MessageComposer.tsx`: form with:
- Recipients picker: radio "all users" / "selected users" / "leads" / "single user"
- If selected users: searchable multi-select (uses `useAdminUsers`)
- If single user: dropdown
- Channels checkboxes: Push / Inbox / WhatsApp (default Push+Inbox)
- Subject text input (required for Push, Email)
- Body textarea (markdown for Inbox)
- Preview button
- Send button → for each channel: call appropriate adminApi method (sendPush/sendWhatsApp/inbox-via-direct-insert)

For Inbox channel without push/whatsapp: just insert into user_messages directly via supabase.from('user_messages').insert with channels=['inbox'].

- [ ] **Step J1.2: AdminMessages screen**

`pages/admin/AdminMessages.tsx`: composer at top (collapsible), history table below showing latest 100 messages from user_messages (joined with users for email display).

- [ ] **Step J1.3: Smoke test**

- Send Inbox message to self → appears in user's Inbox.
- Send WhatsApp (if GREEN API configured) → delivered.

- [ ] **Step J1.4: Commit**

```bash
git add pages/admin/AdminMessages.tsx components/admin/MessageComposer.tsx
git commit -m "feat(admin): AdminMessages composer + history"
```

---

## Task K1: AdminSystem screen

**Files:**
- Create: `shared/hooks/admin/useAuditLog.ts`
- Create: `pages/admin/AdminSystem.tsx`

- [ ] **Step K1.1: useAuditLog**

`shared/hooks/admin/useAuditLog.ts`: reads from `audit_log` table (existing). Returns last 100 entries with user email joined.

- [ ] **Step K1.2: AdminSystem screen**

`pages/admin/AdminSystem.tsx`:
- Section 1: Business info editor — form for `business_info` row (company_name, vat_number, company_number, etc.). Save via useBusinessInfo.update.
- Section 2: Audit log table — last 100 entries.
- Section 3: DB health stats — query `pg_stat_user_tables` if accessible, otherwise show table row counts from useAdminKPIs.

- [ ] **Step K1.3: Commit**

```bash
git add shared/hooks/admin/useAuditLog.ts pages/admin/AdminSystem.tsx
git commit -m "feat(admin): AdminSystem with business info editor + audit log"
```

---

## Task K2: AdminReports screen — CSV exports

**Files:**
- Create: `pages/admin/AdminReports.tsx`

- [ ] **Step K2.1: Reports screen**

`pages/admin/AdminReports.tsx`: button grid with 4 export buttons (Phase 1 set):
- "ייצא משתמשים" → `downloadCsvInBrowser(usersToCSV(data), 'users.csv')`
- "ייצא לידים" → leads CSV
- "ייצא הוצאות עסקיות" → business_expenses CSV
- "ייצא משוב" → feedback CSV

Each uses the same pattern as `shared/admin/csv.ts` (extend with `usersToCsv`, `expensesToCsv`, `feedbackToCsv` helpers).

- [ ] **Step K2.2: Commit**

```bash
git add pages/admin/AdminReports.tsx shared/admin/csv.ts
git commit -m "feat(admin): AdminReports screen with 4 CSV export buttons"
```

---

## Task L1: Placeholder screens

**Files:**
- Create: `pages/admin/placeholders/AdminSubscriptions.tsx`
- Create: `pages/admin/placeholders/AdminPayments.tsx`
- Create: `pages/admin/placeholders/AdminCosts.tsx`
- Create: `pages/admin/placeholders/AdminAlerts.tsx`

- [ ] **Step L1.1: Generate all 4**

Each file follows this template (replace TITLE and SUBTITLE):
```typescript
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../../theme'

export default function AdminSubscriptions() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>מנויים</Text>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>🚧 Phase 2 — טרם הופעל</Text>
        <Text style={styles.bannerBody}>
          המסך הזה ייפעל לאחר בחירת ספק תשלומים ישראלי (PayPlus / Tranzila / Meshulam)
          והקמת אינטגרציה של webhooks. ראה מסמך עיצוב לפרטים.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'right' },
  banner: {
    backgroundColor: theme.colors.neuBgAlt,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md
  },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.warning, textAlign: 'right' },
  bannerBody: { color: theme.colors.textSecondary, textAlign: 'right', lineHeight: 22 }
})
```

For each of the 4 placeholders, customize:
- AdminSubscriptions: "מנויים" + "Phase 2 — ייפעל לאחר בחירת ספק תשלומים"
- AdminPayments: "תשלומים" + "Phase 2 — תלוי באינטגרציית ספק התשלומים"
- AdminCosts: "עלויות ומכסות" + "Phase 2 — דורש usage-snapshot Edge Function"
- AdminAlerts: "התראות" + "Phase 3 — דורש pg_cron jobs לחישוב התראות אוטומטיות"

- [ ] **Step L1.2: Commit**

```bash
git add pages/admin/placeholders/
git commit -m "feat(admin): placeholder screens for Phase 2/3 sections"
```

---

## Task M1: Final wiring + Manual QA

**Files:**
- Modify: `App.tsx`

- [ ] **Step M1.1: Verify lazy imports for all 14 admin screens are present**

Open `App.tsx`, confirm `adminScreens` map contains entries for all 14 (10 real + 4 placeholders). If any missing, add the lazy import.

- [ ] **Step M1.2: Manual QA checklist**

Run `npm run web` and walk through:

- [ ] Log in as admin → long-press logo → AdminOverview loads
- [ ] All 12 sidebar items navigate to their screen
- [ ] All 4 placeholders show their Phase 2/3 banners
- [ ] Overview shows 10 KPI cards with real numbers + 3 charts with real data
- [ ] Users table shows 4 users; search works; click → AdminUserDetail; reset password sends email
- [ ] Leads: add manual lead → appears; CSV export downloads; CSV import adds rows
- [ ] Messages: send Inbox message to self → appears in In-App Inbox of main app
- [ ] Feedback+TODO: submit feedback from Settings → appears in admin "New" column; move to "In Progress"; add personal TODO
- [ ] Financials: add expense → KPIs update; current month row reflects
- [ ] Reports: 4 CSV export buttons download files
- [ ] System: edit business_info (set company_name + vat_number) → saved
- [ ] Long-press logo logged in as NON-admin → nothing happens; manual navigation blocked
- [ ] Open in mobile (`expo start --android`) → cannot reach /admin (no entry point, attempted nav blocks)

- [ ] **Step M1.3: Commit final wiring fixes if any**

```bash
git add App.tsx
git commit -m "fix(admin): final routing tweaks discovered in QA"
# (skip commit if nothing to fix)
```

- [ ] **Step M1.4: Push everything**

```bash
git push origin feat/admin-backoffice
```

---

## Task M2: Open a PR for Phase 1

- [ ] **Step M2.1: Verify the branch is clean and pushed**

```bash
git status --short
git log --oneline origin/main..HEAD | head -40
```

Expected: clean working tree, ~35 commits since main.

- [ ] **Step M2.2: Open draft PR**

```bash
gh pr create --draft --title "feat(admin): Phase 1 admin backoffice dashboard" \
  --body "$(cat <<'EOF'
## Summary
- 12 admin screens (7 functional + 4 placeholders + 1 layout)
- 9 new DB tables + 2 views + RLS policies
- 4 Edge Functions: send-email, send-push, send-whatsapp, reset-password, contact-form-handler
- In-app feedback form + In-App Inbox + session telemetry
- Recharts-based KPI dashboard

## Test plan
- [x] All unit tests passing (guard, kpis, csv)
- [x] Manual QA checklist in Task M1.2 completed
- [ ] Reviewed RLS policies — non-admin user cannot see admin tables
- [ ] Reviewed Edge Function admin gates — non-admin JWT returns 403

## Spec
docs/superpowers/specs/2026-05-11-admin-backoffice-dashboard-design.md

## Phases
- Phase 1 (this PR): ✅
- Phase 2 (Subscriptions/Payments): pending separate plan after Israeli payment provider chosen
- Phase 3 (AI agent + alerts + auto-error logging): pending separate plan
EOF
)"
```

- [ ] **Step M2.3: Manual review pause**

Stop here. Wait for human review of the draft PR. Phase 1 is complete and shippable independently of Phase 2/3.

---

## Self-Review Notes

After writing this plan, the following spec sections map to tasks as follows:

| Spec Section | Tasks |
|--------------|-------|
| §2 Architecture (lazy admin, two-layer guard) | A1, A2, D1, D2 |
| §3 Access & Security | A2, B2 (RLS), D2 (client guard) |
| §4 Phase 1 scope | All tasks A–M |
| §5.2 New Phase 1 tables | B1 |
| §5.5 Views | B3 |
| §5.6 RLS | B2 |
| §6.1 Overview | D3, D4, D5 |
| §6.2 Users | E1, E2, E3 |
| §6.3 Leads | F1, F2, F3, F4 |
| §6.5 Messages | I1, I2, I3, J1 |
| §6.6 Feedback+TODO | C1 (in-app form), G1, G2 |
| §6.8 Financials (basic, Phase 1) | H1, H2, H3 |
| §6.11 Reports basic CSV | K2 |
| §6.12 System | K1 |
| §7 Edge Functions (Phase 1 subset) | E3, F4, I1, I2, I3 |
| §8 GREEN API integration | I3 |
| §10 Alerts | Placeholder (L1) — Phase 3 |
| Privacy: feedback form, opt-in checkbox | C1 (form), pending: signup opt-in checkbox |

**Known scope items deferred to Phase 2/3 (intentional):**
- Subscription / payment tables and screens — Phase 2
- VAT periods, invoices, accountant export — Phase 2
- AI scan, error_log, alerts table, ai_reports — Phase 3
- Costs & Quotas screen real data — Phase 2 (requires usage-snapshot)

**One spec requirement that needs adding to a follow-up plan:**
- §12 marketing consent checkbox in signup — should be added to Auth flow in a small follow-up before any marketing email is sent. Add as TODO M3 if not addressed in M1.

---

**End of Phase 1 plan.**

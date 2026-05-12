# SASOMM Admin Backoffice Dashboard — Design Spec

**Date:** 2026-05-11
**Author:** Project owner (sole admin)
**Status:** Approved design, ready for implementation planning

---

## 1. Overview & Goals

A private backoffice dashboard for the project owner to monitor and operate the SASOMM business: users, subscriptions, payments, business financials (P&L), CRM/leads, app performance, communications, alerts, and Israeli tax compliance.

**Business context:**
- Company structure: חברה בע"מ (Ltd), עוסק מורשה (VAT-registered)
- Subscription model: monthly + yearly recurring, Israeli payment provider (to be chosen in Phase 2)
- Sole administrator (the owner)
- Currently no paying subscribers; BO must function from day zero with placeholders for not-yet-active sections

**Primary goals:**
1. Single screen overview of business health (KPIs + AI recommendations)
2. Full subscriber lifecycle visibility: lead → trial → paying → churned
3. Financial picture: monthly P&L, accountant-ready exports, Israeli VAT compliance
4. Operational health: errors, feedback, alerts, quotas
5. Communications: send emails / push / WhatsApp to users
6. Automation: AI agent scans data and recommends weekly actions

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (Expo)                           │
│                                                                  │
│   ┌─────────────────┐         ┌──────────────────────────────┐  │
│   │   Main App      │         │   /admin (Web only)          │  │
│   │   (mobile+web)  │         │   ┌──────────────────────┐   │  │
│   │                 │         │   │ AdminLayout          │   │  │
│   │  • Dashboard    │ guard ─►│   │  ├─ Overview         │   │  │
│   │  • Projects     │  by     │   │  ├─ Users            │   │  │
│   │  • Expenses     │  email  │   │  ├─ Leads (CRM)      │   │  │
│   │  • Suppliers    │         │   │  ├─ Subscriptions    │   │  │
│   │  • Debts        │         │   │  ├─ Payments         │   │  │
│   │  • Feedback ◄───┼─────────┤   │  ├─ Messages         │   │  │
│   │    (form)       │         │   │  ├─ Feedback+TODO    │   │  │
│   │  • In-App Inbox │         │   │  ├─ Financials (P&L) │   │  │
│   │                 │         │   │  ├─ Costs & Quotas   │   │  │
│   └────────┬────────┘         │   │  ├─ Alerts           │   │  │
│            │                  │   │  ├─ Reports & Export │   │  │
│            │                  │   │  └─ System           │   │  │
│            │                  │   └──────────────────────┘   │  │
│            │                  └──────────────┬───────────────┘  │
└────────────┼─────────────────────────────────┼──────────────────┘
             │  Supabase JS SDK                │  Supabase JS SDK
             ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                   │
│                                                                  │
│   ┌──────────┐   ┌─────────────────────────────────────────┐    │
│   │   Auth   │   │     Postgres (RLS-protected)             │    │
│   └──────────┘   │  Existing + 22 new tables + 3 views      │    │
│                  └─────────────────────────────────────────┘    │
│                                                                  │
│   ┌──────────────────────  EDGE FUNCTIONS  ──────────────────┐  │
│   │  send-email / send-whatsapp / send-push                    │  │
│   │  reset-password / ai-scan / payment-webhook                │  │
│   │  ai-scan-cron / generate-invoice-pdf                       │  │
│   │  monthly-vat-report / accountant-export / usage-snapshot   │  │
│   └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
             │                                 │
             ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                              │
│  Resend (email)  •  GREEN API (WhatsApp)  •  Expo Push           │
│  Anthropic Claude (AI)  •  Israeli Payment Provider (TBD)         │
└──────────────────────────────────────────────────────────────────┘
```

**Architectural principles:**
1. **Single repo, separated bundles** — `pages/admin/` and `shared/admin/` lazy-loaded via `React.lazy()`; mobile bundle does not grow.
2. **Server-side security primacy** — email guard on client is convenience; RLS on Postgres is the real boundary.
3. **One-direction webhooks** — External → Edge Function → DB. Client never calls external APIs directly.
4. **Reuse over duplicate** — same `theme.ts`, same neumorphic components, same Supabase client as main app.

---

## 3. Access & Security

**Admin identification:**
- Constant `ADMIN_EMAIL = 'karnafstudio@gmail.com'` in `shared/lib/admin.ts`
- Client guard: long-press on logo after login reveals "BO" button; manual navigation to `AppScreen.Admin*` redirects non-admin users to Dashboard
- Server guard: every admin table & view has RLS policy `auth.jwt() ->> 'email' = 'karnafstudio@gmail.com'`
- Edge Functions run with `service_role` and additionally verify caller's JWT email before any privileged operation

**Why two layers:** if the JS bundle is tampered with and the client guard is bypassed, RLS at the DB returns zero rows for non-admin sessions. The client guard is for UX (hide menu items); RLS is for security.

**Future migration path:** if multi-admin is needed, replace the email constant with a lookup against an `admins` table. The RLS policy changes from string equality to `EXISTS` against the new table. No other code changes required.

---

## 4. Phased Rollout

The BO is delivered in three independent, shippable phases. Each phase produces a working, useful tool. The full architecture is designed up front so phases compose cleanly.

### Phase 1 — Immediate value (~3 weeks)

Everything that does not depend on a payment provider being chosen.

- Admin guard + `AdminLayout` + sidebar navigation
- **Overview** screen with KPI cards + 3 charts + AI Recommendations card (placeholder until Phase 3)
- **Users** screen with table, drill-in, reset-password, send-message
- **Leads (CRM)** screen with leads table, manual entry, CSV import/export, contact form integration
- **Messages** screen with multi-channel composer (Push + Inbox + WhatsApp via GREEN API)
- **Feedback + TODO** screen with kanban + personal TODO list
- **Financials** screen with manual expenses entry (zero-state, recurring + one-off)
- **Reports & Exports** screen (basic CSV exports only; PDF generation comes in Phase 2)
- **System** screen with audit log + DB health
- **Subscriptions / Payments** screens exist as placeholders showing "Subscription model not yet active"
- **Alerts** screen with manual TODO-style alerts; auto-generated alerts come in Phase 3
- In-app feedback form (added to main app Settings screen)
- In-app inbox screen (added to main app)
- WhatsApp messaging framework via GREEN API (pending account setup)

### Phase 2 — Subscriptions live (~2 weeks)

Activates after Israeli payment provider is chosen.

- Tables: `plans`, `subscriptions`, `payments`, `payment_events`, `invoices`, `vat_periods`, `discount_codes`
- Payment provider webhook Edge Function
- **Subscriptions** screen fully populated
- **Payments** screen fully populated
- **Financials** screen receives auto-fed revenue from `payments`
- Israeli tax compliance: sequential invoice numbering, חשבונית מס PDF generation, monthly VAT report, חשבונית זיכוי for refunds
- **Costs & Quotas** screen with auth/API/Claude usage breakdown
- Email broadcast to subscriber groups
- Subscription operations: discounts, trial extensions, dunning workflow, grace period
- Public subscription page at `sasomm.com/subscribe`

### Phase 3 — AI + Polish (~1 week)

- AI agent (manual + weekly cron) writing to `ai_reports`
- AI Recommendations card on Overview becomes live
- Auto-generated alerts (`alerts` table populated by pg_cron jobs)
- Error log automation (Sentry integration or custom `error_log`)
- Date range pickers throughout
- Advanced charts (cohort retention, revenue forecasting)
- Accountant ZIP export (annual)

**Total estimated effort:** ~6 weeks of single-developer work.

---

## 5. Data Model

### 5.1 Existing tables (unchanged)

`profiles`, `projects`, `expenses`, `incomes`, `suppliers`, `project_activities`, `contacts`, `audit_log`, `debts`, `auth.users` (Supabase-managed).

### 5.2 New tables — Phase 1

#### `feedback`
User-submitted feedback from main app.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK auth.users; can be null for anonymous |
| screen | text | Origin screen name |
| message | text | Free text |
| status | text | new / in_progress / closed |
| response | text | Admin reply, optional |
| app_version | text | Detected at submission |
| platform | text | ios / android / web |
| created_at | timestamptz | Auto |
| responded_at | timestamptz | Set when admin replies |

**RLS:** SELECT/UPDATE/DELETE → admin only. INSERT → authenticated user where `user_id = auth.uid()`.

#### `admin_todos`
Personal admin TODO list.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | |
| description | text | |
| status | text | pending / in_progress / completed |
| priority | text | low / med / high |
| due_date | date | Optional |
| created_at | timestamptz | |
| completed_at | timestamptz | |

**RLS:** admin only on all operations.

#### `admin_email_log`
Audit trail of every email sent through BO.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| recipient_user_id | uuid | Nullable for broadcast |
| recipient_email | text | Resolved at send time |
| subject | text | |
| body | text | |
| template_id | uuid | Optional FK |
| sent_at | timestamptz | |
| status | text | sent / failed / bounced |
| error_message | text | If failed |
| resend_message_id | text | Tracking from Resend |

**RLS:** SELECT → admin only. INSERT → service_role only (via Edge Function).

#### `user_messages`
Multi-channel admin messages to users + In-App Inbox storage.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | Nullable = broadcast |
| channels | text[] | Subset of: push / inbox / whatsapp |
| title | text | |
| body | text | Markdown for inbox |
| sent_at | timestamptz | |
| status | text | pending / sent / partial_failure / failed |
| whatsapp_chat_id | text | GREEN API tracking |
| read_at | timestamptz | Set when user opens (inbox) |

**RLS:** SELECT → admin OR `user_id = auth.uid()`. INSERT/UPDATE/DELETE → admin or service_role.

#### `business_expenses`
Operating expenses for the SASOMM business itself.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| category | text | infrastructure / api / marketing / payment_fees / dev / other |
| vendor | text | Free text: "Supabase", "Anthropic", etc. |
| amount_ils | numeric | Always stored in ILS |
| amount_original | numeric | |
| currency_original | text | ILS / USD / EUR |
| month | text | YYYY-MM for aggregation |
| expense_date | date | Actual date paid |
| is_recurring | boolean | True = repeats monthly |
| auto_source | text | null / anthropic_api / supabase_api / resend / green_api |
| receipt_url | text | Optional, in Supabase Storage |
| includes_vat | boolean | For VAT input tax credit |
| vat_amount | numeric | If includes_vat |
| notes | text | |
| created_at | timestamptz | |

**RLS:** admin only.

**Recurring expenses behavior:** A pg_cron job runs on the 1st of each month, scans `business_expenses` where `is_recurring = true`, and creates a copy for the new month with the prior month's amounts. Auto-sourced rows are inserted by `usage-snapshot` Edge Function.

#### `leads`
CRM database — broader than `auth.users`. Includes prospects who have not signed up.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| email | text | Unique |
| name | text | |
| phone | text | |
| source | text | website_form / referral / ad_facebook / ad_google / manual / signup |
| status | text | new / contacted / trial / paying / churned / lost |
| first_touch_at | timestamptz | |
| last_contact_at | timestamptz | |
| notes | text | |
| tags | text[] | |
| converted_to_user_id | uuid | FK auth.users when signs up |
| ltv_ils | numeric | Sum of payments if converted |
| created_at | timestamptz | |

**RLS:** admin only.

**Auto-sourcing:**
- Website contact form → Edge Function → INSERT row with `source = website_form`
- New signup → trigger on `auth.users` insert → upsert by email, set `source = signup` if new, link `converted_to_user_id` if existing lead
- Manual entry via BO UI

#### `lead_activities`
Touchpoint log per lead.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| lead_id | uuid | FK leads |
| type | text | email_sent / whatsapp_sent / call / note / status_change |
| description | text | |
| metadata | jsonb | e.g. old/new status, email subject |
| created_at | timestamptz | |

**RLS:** admin only.

#### `user_sessions`
Session telemetry written by main app on login/heartbeat.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK auth.users |
| platform | text | ios / android / web |
| app_version | text | |
| device_info | jsonb | OS version, model, browser |
| started_at | timestamptz | |
| last_heartbeat_at | timestamptz | Updated every N minutes by client |
| actions_count | integer | Incremented client-side |

**RLS:** SELECT → admin only. INSERT/UPDATE → authenticated user where `user_id = auth.uid()`.

#### `business_info`
Single-row table with the operating company's metadata.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| company_name | text | Hebrew legal name |
| company_number | text | מספר חברה (Companies Registry) |
| vat_number | text | מספר עוסק מורשה |
| address | text | |
| phone | text | |
| email | text | |
| logo_url | text | |
| accountant_email | text | For direct sending of reports |
| invoice_prefix | text | e.g. "INV-2026-" for sequential numbering |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**RLS:** admin only.

### 5.3 New tables — Phase 2

#### `plans`
Subscription plan catalog.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| code | text | e.g. "pro_monthly", "pro_yearly" |
| name | text | Hebrew display name |
| price_ils | numeric | Pre-VAT price in ILS |
| interval | text | monthly / yearly |
| trial_days | integer | Default trial length |
| features_json | jsonb | Limits / feature flags |
| is_active | boolean | False = no new signups, existing keep |
| sort_order | integer | |

**RLS:** SELECT → public. INSERT/UPDATE/DELETE → admin only.

#### `subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK auth.users |
| plan_id | uuid | FK plans |
| status | text | trial / active / past_due / cancelled / expired |
| trial_end | timestamptz | |
| current_period_start | timestamptz | |
| current_period_end | timestamptz | |
| cancel_at | timestamptz | Set when user requests cancellation |
| cancelled_at | timestamptz | Actual cancellation |
| provider | text | payplus / tranzila / meshulam |
| provider_subscription_id | text | External ID |
| discount_code_id | uuid | Optional FK |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**RLS:** SELECT → admin OR `user_id = auth.uid()`. INSERT/UPDATE/DELETE → service_role only (webhook-driven).

#### `payments`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK auth.users |
| subscription_id | uuid | FK subscriptions |
| invoice_id | uuid | FK invoices, set on success |
| amount_pre_vat | numeric | |
| vat_amount | numeric | 17% in Israel as of 2026 |
| total_amount | numeric | Pre-VAT + VAT |
| currency | text | ILS |
| provider_fee | numeric | Israeli provider commission |
| status | text | pending / succeeded / failed / refunded |
| failure_reason | text | If failed |
| provider | text | |
| provider_payment_id | text | |
| paid_at | timestamptz | |
| failed_at | timestamptz | |
| refunded_at | timestamptz | |
| refund_amount | numeric | Partial or full |
| created_at | timestamptz | |

**RLS:** SELECT → admin OR `user_id = auth.uid()`. INSERT/UPDATE → service_role only.

#### `payment_events`
Raw webhook log from payment provider, for debugging and replay.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| provider | text | |
| event_type | text | charge.succeeded / charge.failed / etc. |
| payload_json | jsonb | Full raw webhook body |
| processed | boolean | False until handler succeeds |
| processed_at | timestamptz | |
| error_message | text | If processing failed |
| received_at | timestamptz | |

**RLS:** SELECT → admin only. INSERT/UPDATE → service_role only.

#### `invoices`
Israeli legal tax documents. Sequential numbering required by law.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| sequential_number | integer | Unique, gap-free, increments globally |
| document_type | text | invoice / receipt / credit_invoice |
| user_id | uuid | FK auth.users |
| payment_id | uuid | FK payments |
| amount_pre_vat | numeric | |
| vat_amount | numeric | |
| vat_rate | numeric | Captured at issue time (e.g. 0.17) |
| total | numeric | |
| customer_name | text | Snapshot at issue |
| customer_address | text | Snapshot |
| customer_vat_number | text | Optional |
| issued_at | timestamptz | |
| pdf_url | text | Supabase Storage URL |
| related_invoice_id | uuid | FK for credit invoices |
| created_at | timestamptz | |

**RLS:** SELECT → admin OR `user_id = auth.uid()`. INSERT → service_role only (sequential numbering enforced by trigger).

**Sequential numbering implementation:** Postgres `BEFORE INSERT` trigger acquires advisory lock, reads max `sequential_number`, increments. Prevents race conditions and gaps.

#### `vat_periods`
Monthly VAT submission tracking.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| year | integer | |
| month | integer | 1-12 |
| total_income_pre_vat | numeric | Sum from invoices |
| total_vat_collected | numeric | "מע"מ עסקאות" |
| total_vat_paid | numeric | "מע"מ תשומות" — from business_expenses where includes_vat |
| net_vat_owed | numeric | Collected minus paid |
| status | text | open / submitted / paid |
| submitted_at | timestamptz | |
| paid_at | timestamptz | |
| confirmation_number | text | From מע"מ Online |
| notes | text | |

**RLS:** admin only.

**Generation:** pg_cron on the 1st of each month creates next month's row.

#### `discount_codes`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| code | text | Unique, uppercase |
| percent_off | integer | Nullable |
| amount_off_ils | numeric | Nullable |
| valid_from | timestamptz | |
| valid_until | timestamptz | |
| max_uses | integer | Nullable = unlimited |
| used_count | integer | Default 0 |
| applies_to_plans | uuid[] | Empty = all |
| is_active | boolean | |
| created_at | timestamptz | |

**RLS:** SELECT → public (for validation). INSERT/UPDATE/DELETE → admin only.

### 5.4 New tables — Phase 3

#### `ai_reports`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| scan_type | text | manual / scheduled |
| input_summary | jsonb | KPIs snapshot fed to model |
| recommendations_md | text | Markdown output from Claude |
| top_actions | jsonb | Structured top-3 actions |
| model | text | claude-haiku-4-5 |
| input_tokens | integer | |
| output_tokens | integer | |
| cost_usd | numeric | |
| created_at | timestamptz | |

**RLS:** admin only.

#### `error_log`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | Nullable |
| screen | text | |
| error_message | text | |
| stack_trace | text | |
| app_version | text | |
| platform | text | |
| device_info | jsonb | |
| user_agent | text | Web only |
| created_at | timestamptz | |

**RLS:** SELECT/UPDATE/DELETE → admin only. INSERT → authenticated user.

#### `alerts`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| type | text | payment_failed / storage_quota / error_rate / trial_ending / no_signups / vat_due / lead_stale / churn_risk |
| severity | text | low / med / high / critical |
| title | text | |
| message | text | |
| related_record_type | text | e.g. "payment", "user", "lead" |
| related_record_id | uuid | |
| triggered_at | timestamptz | |
| dismissed_at | timestamptz | |
| acknowledged | boolean | |

**RLS:** admin only.

**Generation:** pg_cron daily job at 06:00 evaluates rules and inserts alerts.

#### `report_exports`
Log of report exports for compliance (7-year retention of financial records).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| report_type | text | accountant_annual / vat_monthly / customers_csv / etc. |
| period_start | date | |
| period_end | date | |
| file_url | text | Storage URL |
| recipient_email | text | If emailed |
| exported_at | timestamptz | |
| exported_by_email | text | Snapshot of admin email |

**RLS:** admin only.

### 5.5 Views

#### `admin_users_view`
One row per user with all relevant aggregates pre-computed.

Joins: `auth.users` + `profiles` + `subscriptions` (current) + counts from `projects`, `expenses`, `incomes`, `user_sessions`.

Columns: `id, email, full_name, phone, signup_at, last_sign_in_at, subscription_status, plan_code, current_period_end, project_count, transaction_count, last_session_at, last_platform, total_storage_mb`

#### `admin_kpi_view`
Single row with all dashboard KPIs.

Columns: `total_users, new_signups_7d, new_signups_30d, dau, wau, mau, active_subscribers, mrr_ils, arr_ils, churn_rate_30d, open_feedback, open_todos, open_alerts, ai_health_score`

#### `admin_revenue_view`
Monthly aggregated revenue/expenses/profit for the trailing 12 months.

Columns: `year_month, revenue_ils, vat_collected, expenses_ils, vat_paid, profit_ils, margin_pct`

### 5.6 RLS summary

| Layer | Policy |
|-------|--------|
| Admin-only tables | `auth.jwt() ->> 'email' = 'karnafstudio@gmail.com'` on all operations |
| User-readable admin tables (`subscriptions`, `payments`, `invoices`, `user_messages`) | Admin OR `user_id = auth.uid()` for SELECT only |
| User-writable (`feedback`, `error_log`, `user_sessions`) | Authenticated user where `user_id = auth.uid()` for INSERT; admin for everything else |
| Service-role-only (`payment_events`, `admin_email_log`, `invoices` INSERT) | No client policy; Edge Functions use `service_role` to bypass RLS |

---

## 6. Screens

Twelve admin screens, organized in sidebar. Same neumorphic theme as main app.

### 6.1 Overview 📊

**KPI cards (16):**
Total users, DAU, WAU, MAU, signups 7d, signups 30d, active subscribers, MRR, ARR, churn 30d, open feedback, open TODOs, open alerts, actions today, conversion rate (leads→paying), AI Health Score.

Each card shows: large number, % change vs prior period, sparkline of last 14 days.

**Charts (3 line charts):**
- Signups per day, 30d
- DAU per day, 30d
- MRR per month, 12mo

**AI Recommendations card** (Phase 3): last scan summary, top-3 actions in Hebrew, "Scan now" button, last cost.

**Conversion funnel widget:**
`Leads → Trial → Paying → Active 30d`, with counts and conversion %.

### 6.2 Users 👥

Table columns: Email, Name, Plan, Signed up, Last sign in, Projects, Transactions, Status.

Filters: plan, signup date range, status (active/inactive/churned), search by email/name.

Drill-in: full profile, session history (last 5), subscription + payment history, projects list, activity history, sent emails/messages, action buttons: **Send message / Reset password / View as user (read-only) / Suspend / Delete (with GDPR export option)**.

### 6.3 Leads (CRM) 📇

Table: Email, Name, Phone, Source, Status, First touch, Last contact, Tags, Value.

Filters: status, source, tags, date range.

Actions: Add manually, Import CSV, Export CSV, Send email/WhatsApp, Mark status, Add note.

Drill-in: full lead detail + `lead_activities` timeline + conversion progress if applicable.

**Auto-source endpoints:**
- Website contact form POST → Edge Function → INSERT
- Trigger on `auth.users` insert → upsert into `leads`

### 6.4 Subscriptions 💎 *(Phase 2)*

KPIs: Active, Trial, Past Due, Cancelled, Churn rate 30d, Avg LTV.

Table: User email, Plan, Status, Started, Current period end, Cancel date, Total paid, Provider.

Drill-in: payment history, status timeline, action buttons: **Cancel now / Refund last / Change plan / Apply discount / Extend trial**.

### 6.5 Payments 💳 *(Phase 2)*

KPIs: Revenue this month, Failed charges this week, Refunds, Avg transaction value.

Table: Date+time, User email, Pre-VAT, VAT, Total, Provider fee, Status, Invoice link, Provider transaction ID, Failure reason.

Drill-in: raw webhook payload (JSON), retry history, invoice PDF link, refund/credit-invoice button.

### 6.6 Messages 💬

**Composer (top half):**
Recipients (all / filtered group / single user) + channels (☑️Push ☑️Inbox ☑️WhatsApp) + subject + body (markdown for inbox) + preview + send.

**Sent History (bottom half):**
Table: date+time, subject, recipient count, channels, delivery stats (sent/delivered/read/failed), view recipients.

**Templates section:** Saved message templates. WhatsApp templates do not require Meta pre-approval (GREEN API does not use the official Business API).

### 6.7 Feedback + TODO 📝

**Tab 1 — Feedback (kanban: New | In Progress | Closed):**
Each card: user email + avatar, screen, full message text, timestamp, app version + platform, reply textarea + "Send & Close" button.

**Tab 2 — TODO (list):**
Each item: title, description, priority chip (High/Med/Low), status, created date, edit/delete.

### 6.8 Financials (P&L) 💵

**KPIs (current month):** Revenue, Expenses, Profit, Margin %, Break-even users.

**Monthly P&L table (trailing 12 months):**
Columns: Month, Revenue, Expenses, Profit, Margin %, Status (🟢🟡🔴 by profitability).

**Charts:**
- Revenue vs Expenses (line, 12mo)
- Expense breakdown by category (pie, current month)
- Profit margin trend (line, 12mo)

**Drill-in per month:** all payments (income side) + all `business_expenses` (cost side). Add/edit/delete expense buttons.

**Recurring expenses setup widget** (zero-state on first visit):
Add recurring monthly expenses (Supabase plan, GREEN API, hosting, etc.). Triggers monthly auto-insert via pg_cron.

### 6.9 Costs & Quotas 💰 *(Phase 2)*

**Section A — Auth tokens:** Daily signups (30d), daily logins (30d), active sessions, OAuth provider breakdown.

**Section B — Supabase API:** Total requests this month, % of plan quota, top 10 endpoints, DB size, storage size, estimated monthly cost.

**Section C — Claude API:** Scans this month, input/output tokens, total USD cost, avg cost per scan, last scan.

**Section D — Per-platform usage:**
Sub-sections iOS / Android / Web / Aggregate: active users, sessions, storage MB, crashes, app version distribution.

### 6.10 Alerts 🚨

List of active and dismissed alerts, sortable by severity and date.

**Active alert rules** (evaluated by pg_cron daily):
| Trigger | Severity |
|---------|----------|
| Payment failed 2+ times | High |
| Storage > 80% quota | High |
| Error rate > 5% in 24h | Critical |
| Trial ending in 3d | Med |
| No signups in 7d | Med |
| AI cost > monthly budget | Med |
| VAT not submitted by day 10 of month | High |
| Lead stale (no contact 3d) | Low |
| Paying user inactive 30d | Low |

Actions per alert: Acknowledge, Dismiss, View related record.

### 6.11 Reports & Exports 📤

One-click report buttons:
- Annual accountant ZIP (P&L + invoices + expenses + customers + tax summary)
- Monthly VAT report (Excel Open Format)
- Customers active list (CSV)
- Leads by status (CSV)
- Payments in date range (Excel)
- Invoices in date range (ZIP of PDFs)
- P&L PDF (annual / quarterly / monthly)
- User communications log (PDF per user)

Direct-email option sends report to `business_info.accountant_email`.

All exports logged to `report_exports` (7-year retention for financial records).

### 6.12 System ⚙️

**Phase 1:**
- Audit log (latest 100): date, user, table, action, record ID
- DB health: table sizes, row counts, last vacuum
- Business info editor (`business_info` table)

**Phase 3:**
- Error log with top errors, count, last seen, drill-in to stack trace
- Slow queries (from Supabase logs)
- EAS build status: current production version, build ID
- Privacy/Terms version tracking

---

## 7. Edge Functions

| Function | Trigger | Purpose | External calls |
|----------|---------|---------|---------------|
| `send-email` | Admin BO action | Send transactional or marketing email | Resend |
| `send-whatsapp` | Admin BO action | Send WhatsApp message | GREEN API |
| `send-push` | Admin BO action | Send push notification | Expo Push |
| `reset-password` | Admin BO action | Trigger password reset for user | Supabase Admin API |
| `ai-scan` | Admin "Scan now" button | Generate AI recommendations | Anthropic Claude |
| `ai-scan-cron` | Weekly pg_cron | Scheduled AI scan | Anthropic Claude |
| `payment-webhook` | Payment provider POST | Handle subscription/payment events | DB write |
| `usage-snapshot` | Daily pg_cron | Capture Supabase + API costs into `business_expenses` | Supabase Management API |
| `generate-invoice-pdf` | After successful payment | Generate PDF tax invoice | PDF library |
| `monthly-vat-report` | Monthly pg_cron + manual | Aggregate VAT data into Excel | Excel library |
| `accountant-export` | Manual annual export | Zip-bundle all reports | Multiple |
| `contact-form-handler` | Website contact form | Create lead | DB write |

**Security:** All functions verify caller JWT email matches `ADMIN_EMAIL` before privileged operations (except webhooks, which verify provider signature).

---

## 8. External Integrations

| Service | Purpose | Cost | Setup needed |
|---------|---------|------|--------------|
| Resend | Email delivery | Free up to 3K/mo | Domain DNS records for SPF/DKIM |
| GREEN API | WhatsApp messaging | ~$10-30/mo | Dedicated business phone number, QR scan |
| Expo Push | Push notifications | Free | Already configured |
| Anthropic Claude | AI agent (Haiku 4.5) | ~$0.001/scan | API key |
| Israeli payment provider | Subscriptions (Phase 2) | TBD | Account opening, webhook config, sandbox testing |
| Supabase Management API | Auto-fetch usage costs | Included | API key |

**Risks specific to GREEN API:** Not the official Meta WhatsApp Business API. WhatsApp may block the number if abused. Mitigation: dedicated business number, no spam, marketing-consent opt-in.

---

## 9. Israeli Tax Compliance (Ltd Company)

### 9.1 Document types

| Document | Hebrew | When issued |
|----------|--------|-------------|
| Tax invoice | חשבונית מס | At billing time (subscription renews) |
| Receipt | קבלה | After payment cleared |
| Credit invoice | חשבונית זיכוי | For refunds |

**Sequential numbering:** unique global counter, gap-free, never reset between years. Enforced by Postgres trigger with advisory lock.

**Required fields on PDF:** company legal name, company number (ח.פ), VAT number (עוסק מורשה), address, document type Hebrew label, sequential number, customer details, line-item breakdown (description, quantity, pre-VAT price, VAT %, VAT amount, total), issue date.

### 9.2 VAT (מע"מ)

- Standard rate: 17% (as of 2026)
- Captured per-payment in `vat_rate` column on `invoices` to handle future rate changes
- Monthly VAT report due by 15th of following month
- **VAT collected** (מע"מ עסקאות) from `invoices`
- **VAT paid** (מע"מ תשומות) from `business_expenses` where `includes_vat = true`
- Net owed = collected − paid, submitted to מע"מ Online
- `monthly-vat-report` Edge Function exports Excel in Open Format compatible with מע"מ Online

### 9.3 Corporate income tax

- Rate: 23% on profit (as of 2026, חברה בע"מ)
- Quarterly advance payments (מקדמות) — admin enters manually in `business_expenses` as `category = 'taxes'`
- Annual filing on Form 1214 — `accountant-export` generates supporting data; the form itself is filed by the accountant
- Distinguish: company tax on profit (23%) vs. personal dividend tax if owner draws dividend (additional 30-33%)

### 9.4 Record retention

- Financial records (invoices, payments, expenses, exports): 7 years minimum (Israeli tax law)
- `report_exports` table tracks every report exported for audit trail
- Supabase daily backups retained at least 30 days; manual archive of annual exports recommended

---

## 10. Alerts & Automation

**Daily pg_cron job at 06:00 evaluates these rules:**

```
- For each user with subscription status='past_due' and last_payment_failed_count >= 2:
    INSERT alert(payment_failed, high, ...)

- If storage usage > 80% of Supabase plan quota:
    INSERT alert(storage_quota, high, ...)

- If error_log COUNT in last 24h / total_events > 5%:
    INSERT alert(error_rate, critical, ...)

- For each subscription where trial_end BETWEEN now() AND now() + 3 days:
    INSERT alert(trial_ending, med, ...)

- If no rows in auth.users created in last 7 days:
    INSERT alert(no_signups, med, ...)

- For each lead where status='new' AND first_touch_at < now() - 3 days AND last_contact_at IS NULL:
    INSERT alert(lead_stale, low, ...)

- For each user with subscription status='active' AND last_sign_in_at < now() - 30 days:
    INSERT alert(churn_risk, low, ...)

- If today is day 10 of month AND current vat_period status != 'submitted':
    INSERT alert(vat_due, high, ...)
```

**Notification channels for alerts:**
- Always: appear in BO Alerts screen and as red badge on sidebar
- High/Critical: also email to admin
- Critical: also WhatsApp to admin's personal number

---

## 11. Reports & Exports

All exports go through Edge Functions to ensure consistent formatting and prevent client-side data leakage.

| Export | Format | Trigger | Contents |
|--------|--------|---------|----------|
| Annual accountant ZIP | ZIP | Manual | P&L (Excel), invoices (PDF folder), expenses (Excel), customers list (CSV), tax summary (PDF) |
| Monthly VAT report | Excel (Open Format) | Manual + monthly auto-email reminder | Income, VAT collected, VAT paid, net owed |
| Customers active | CSV | Manual | Email, name, plan, signup date, LTV |
| Leads by status | CSV | Manual | All `leads` columns |
| Payments range | Excel | Manual with date picker | All payments with status |
| Invoices range | ZIP of PDFs | Manual | Sequential by number |
| P&L | PDF | Manual + scheduled annual auto | Monthly breakdown, charts |
| User communications | PDF | From user drill-in | All emails/messages/notes per user |

Email-to-accountant option: any report can be sent directly to `business_info.accountant_email`. Logged in `admin_email_log` and `report_exports`.

---

## 12. Privacy & Compliance

**Israeli Privacy Protection Law (חוק הגנת הפרטיות):**
- Data subject access request: Users → User screen drill-in → "Export all data" → JSON download (covers all rows where `user_id = X` across all tables)
- Right to deletion: "Delete user" button → cascade delete + retain anonymized invoice records (legally required for 7 years)
- Privacy policy version tracking: `profiles.privacy_accepted_version` updated on each policy change; users prompted to re-accept

**Spam law (חוק התקשורת, תשס"ח-2008):**
- `profiles.marketing_consent` boolean with timestamp
- Signup form has explicit checkbox for marketing emails
- BO Messages composer distinguishes "Transactional" (no consent required: receipts, trial expiry) vs "Marketing" (consent required: feature announcements, promotions)
- Sending marketing message to non-consented user is blocked at Edge Function level

**Data retention:**
- Financial records (invoices, payments, vat_periods, business_expenses, report_exports): 7 years
- User-generated content (projects, expenses, etc.): until user deletion request
- Communications log (admin_email_log, user_messages): 3 years
- Error log: 90 days (auto-purged by pg_cron)
- User sessions: 30 days (auto-purged)

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| GREEN API number gets banned by WhatsApp | Med | Med | Dedicated business number, opt-in for marketing, monitor delivery rate; fallback to Twilio Business API if blocked |
| Email guard bypassed in tampered JS bundle | Low | High | RLS at DB is real boundary; tampered client sees empty UI |
| Sequential invoice numbering race condition | Low | Critical (legal) | Postgres advisory lock in `BEFORE INSERT` trigger; tested with concurrent insert load |
| Payment provider webhook delivered twice | Med | Med | `payment_events.provider_payment_id` UNIQUE constraint; idempotent processing |
| Israeli VAT rate changes mid-year | Low | Med | `vat_rate` captured per-invoice, not hardcoded; admin updates rate in `business_info` for new invoices |
| Marketing email sent to non-consented user | Med | High (legal) | `send-email` Edge Function blocks at the source if `marketing_consent = false` AND email type = marketing |
| AI agent gives bad advice | Med | Low | Output is advisory only, never auto-executes; admin reviews before acting |
| Supabase plan quota exceeded | Med | High | Daily `usage-snapshot` job + alert at 80% threshold |
| Free tier of Resend exceeded silently | Med | Med | Daily check in `usage-snapshot`, alert at 80% of 3K |
| Loss of `business_info` data | Low | High | Annual export to accountant ZIP includes business info snapshot |

---

## 14. Out of Scope (Deferred)

- Israeli payment provider selection (PayPlus / Tranzila / Meshulam / Grow) — separate decision before Phase 2 begins
- Specific plan pricing structure (Basic / Pro / Business tiers and amounts) — business decision, not technical
- Migration of BO to dedicated subdomain `admin.sasomm.com` — if scaling beyond single admin
- Multi-admin support — if hiring staff
- A/B testing infrastructure — premature for solo founder
- Multi-language admin UI (BO stays Hebrew) — not needed for single admin
- Real-time collaboration features — single-admin model

---

## 15. Open Questions

1. **AI Health Score formula** — proposed: `((100 − churn_pct − error_rate_pct) × open_feedback_resolution_rate)`. Final formula determined during Phase 3 implementation based on what data is available.
2. **WhatsApp business number** — owner to obtain dedicated number before Phase 1 WhatsApp framework is activated.
3. **Resend domain DNS** — owner must add SPF/DKIM records to sasomm.com DNS before Phase 1 email features ship.
4. **Anthropic API key budget cap** — initial monthly cap suggestion: $5 USD. Configurable in `business_info` or environment.
5. **`usage-snapshot` data sources** — exact Management API endpoints for Supabase usage TBD during Phase 1 implementation; Anthropic and Resend have well-documented usage APIs.
6. **Recurring expense rollover edge cases** — handling of mid-month subscription changes to recurring vendors (e.g. upgraded Supabase plan on the 15th) — handled by allowing edit of any auto-generated expense row.

---

## 16. Approved Decisions Summary

| Decision | Choice |
|----------|--------|
| Subscription model | Monthly + yearly recurring via Israeli payment provider (chosen Phase 2) |
| BO location | `/admin` route in existing Expo Web app, lazy-loaded |
| Admin auth | Email constant guard + two-layer RLS |
| Message channels | Push + In-App Inbox + WhatsApp via GREEN API |
| AI agent | Claude Haiku 4.5, manual + weekly cron |
| Financials starting point | Zero (no historical backfill); recurring + one-off expenses tracked going forward |
| Business structure | חברה בע"מ + עוסק מורשה (full VAT mechanism + 23% corporate tax) |
| Phasing | 3 phases, ~6 weeks total single-developer effort |
| Screens | 12 (Overview, Users, Leads, Subscriptions, Payments, Messages, Feedback+TODO, Financials, Costs & Quotas, Alerts, Reports & Exports, System) |
| New tables | 20 (Phase 1: 9, Phase 2: 7, Phase 3: 4) |
| New views | 3 (`admin_users_view`, `admin_kpi_view`, `admin_revenue_view`) |
| Edge Functions | 12 |
| Third-party integrations | 5 (Resend, GREEN API, Expo Push, Anthropic, Israeli payment provider) |
| Platform APIs used | Supabase Management API (for `usage-snapshot`) |

---

**Next step:** Implementation plan via `writing-plans` skill, after owner reviews this design.

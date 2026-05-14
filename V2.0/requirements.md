# SASOMM - Product Requirements Document

## 1. Product Overview

**SASOMM** is a personal and project expense management mobile app for freelancers, small business owners, and individuals who need to track finances across multiple projects. Built with React Native / Expo and backed by Supabase.

**Target Users:** Hebrew-speaking users managing project-based finances (contractors, freelancers, small agencies).

**Core Value:** One place to track budgets, expenses, income, suppliers, and debts across all projects with multi-currency support.

---

## 2. Supported Platforms

| Platform | Status |
|----------|--------|
| Android  | Primary |
| iOS      | Supported |
| Web      | Expo Web (secondary) |

- Portrait orientation only
- Build system: EAS (Expo Application Services)
- Minimum Node.js: 22.14.0

---

## 3. Language & Localization

- **UI Language:** Hebrew (RTL layout)
- **Error messages:** Hebrew
- **Date format:** DD.MM.YYYY (display), YYYY-MM-DD (storage)
- **Number format:** Standard with commas for thousands
- **Currency symbols:** ILS, USD ($), EUR

---

## 4. Design System

### 4.1 Visual Style

**Neumorphic design** - soft, raised UI elements with subtle shadows on a light gray background.

**Design Inspiration:** Dark-themed finance apps (Revolut-style) referenced in `/UI/` folder for analytics/dashboard layout patterns. Current implementation uses a light neumorphic theme.

### 4.2 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| neuBg | `#E8EEF5` | Main background |
| neuBgAlt | `#F1F3F6` | Alternate background |
| neuShadow | `#C8D0E0` | Shadow color |
| neuLight | `#FFFFFF` | Highlight color |
| primary | `#00D9D9` | Primary actions, links |
| primaryDark | `#0891B2` | Primary dark variant |
| primaryLight | `#5EEAD4` | Primary light variant |
| accent | `#6B5B7B` | Accent (purple, matches logo) |
| success | `#10B981` | Positive status, income |
| warning | `#F59E0B` | Warning status (80-99% budget) |
| error | `#EF4444` | Over budget, debts, errors |
| info | `#3B82F6` | Informational elements |
| textPrimary | `#1E293B` | Main text |
| textSecondary | `#475569` | Secondary text |
| textTertiary | `#94A3B8` | Muted text |

### 4.3 Typography

- **Font Family:** Open Sans (Google Fonts)
- **Weights:** Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800)
- **Monospace:** Platform-specific (Menlo on iOS, monospace on Android)

### 4.4 Spacing Scale

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| 2xl | 28px |
| 3xl | 32px |

### 4.5 Border Radii

| Token | Value |
|-------|-------|
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 20px |
| full | 9999px |

### 4.6 Neumorphic Effects

- **neuRaised:** Outward dual-shadow (light top-left, dark bottom-right) for elevated cards
- **neuRaisedLg:** Larger raised shadow for prominent elements
- **neuPressed:** Inset shadow for pressed/active states
- Platform-specific implementation: iOS `shadowColor`, Android `elevation`, Web `boxShadow`

### 4.7 Icons

- **Library:** Material Icons via `@expo/vector-icons`
- **Icon Set:** 35+ project icons available for selection (home, work, build, shopping-cart, restaurant, etc.)

---

## 5. Authentication

### 5.1 Auth Flow

| Feature | Description |
|---------|-------------|
| Login | Email + password via Supabase Auth |
| Signup | Email + password, creates profile record |
| Logout | Sign out from any screen via header button |
| Session | Persistent session managed by Supabase client |

### 5.2 Auth Rules

- Email is required and validated
- Password minimum 6 characters
- On signup, a `profiles` record is created automatically
- Error messages displayed in Hebrew via Alert
- Auth state wraps entire app via `AuthContext`

---

## 6. Navigation

### 6.1 Architecture

Custom stack-based navigation (NOT React Navigation):
- History maintained in `App.tsx` via `historyStack` array
- `navigate(screen, id?, scan?, txType?)` function for forward navigation
- `goBack()` pops from history stack
- Scroll-to-top on every navigation

### 6.2 Bottom Navigation Bar

5 tabs with a center floating action button (FAB):

| Position | Label | Screen | Icon |
|----------|-------|--------|------|
| 1 | Home | Dashboard | home |
| 2 | Suppliers | Contacts | people |
| 3 | **+ (FAB)** | Quick Actions | add |
| 4 | Debts | Debts | account-balance-wallet |
| 5 | Projects | Projects | folder |

**FAB Quick Actions Menu** (4 options):
1. Add Expense
2. Add Income
3. Add Project
4. Add Supplier

**Visibility:** Bottom nav is hidden on add/edit screens.

### 6.3 Top Header

- Back button (when navigable)
- Screen title
- Logout button (right side)

---

## 7. Screens & Features

### 7.1 Dashboard (Home)

The main overview screen showing financial summary.

**Sections:**

1. **User Greeting** - "Hello, {name}" (extracted from email prefix)
2. **Financial Totals Card:**
   - Total Budget (sum of all project budgets)
   - Total Income (sum of all income)
   - Total Expenses (sum of all expenses)
   - Net Balance (budget + income - expenses)
3. **Currency Switcher** - Toggle display between ILS / USD / EUR
4. **Recent Activity** - Last 8 transactions (expenses + incomes), sorted newest first, showing title, amount, date, category icon
5. **Recent Projects** - 5 most recently active projects with mini transaction history
6. **Category Breakdown:**
   - Per main-category (Projects / Personal / Other) cards showing:
     - Total budget, spent, remaining
     - Visual progress bar
     - Status indicator (on track / warning / over)
7. **Supplier Quick View** - Recent supplier interactions

### 7.2 Projects List

Filterable list of all user projects.

**Features:**
- **Filter Pills:** "All", per-subcategory, "Personal", "Other"
- **Project Cards** showing:
  - Icon, name, category
  - Budget amount, spent amount, remaining amount
  - Progress bar (color-coded by status)
  - Percentage used
  - Status badge (ok / warning / over)
- **Add Project Button** (top-right)
- Tap card to navigate to Project Detail

### 7.3 Project Detail

Full view of a single project.

**Sections:**

1. **Header:** Icon, name, category, status badge
2. **Budget Overview:**
   - Budget amount (inline editable)
   - Spent total, income total, remaining
   - Progress bar with percentage
3. **Transaction List:**
   - All expenses and incomes for this project
   - Activity log entries (budget changes, notes, transactions)
   - Each item shows: date, title, amount, type icon, color
4. **Add Transaction Buttons:** Add Expense / Add Income
5. **Notes Section:**
   - Add text notes with optional image attachments
   - Display history of notes with timestamps
6. **Report Export:**
   - Generate WhatsApp-formatted text report
   - Export as PDF / Print
   - Share via system share sheet
7. **Project Actions Menu:**
   - Edit project details
   - Delete project (with confirmation dialog)

### 7.4 Add / Edit Project

Form for creating or editing a project.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | Yes | Project name |
| Budget | Number | Yes | Amount in selected currency |
| Budget Currency | Picker | Yes | ILS / USD / EUR |
| Main Category | Selector | Yes | Projects / Personal / Other |
| Subcategory | Picker | Yes | Category-specific options |
| Icon | Icon Picker | Yes | 35+ Material Icons |
| VAT Included | Toggle | No | Whether budget includes VAT |

**Behavior:**
- Budget entered in display currency, converted to ILS on save
- Can preselect main category from navigation context
- Edit mode loads existing project data

### 7.5 Add / Edit Expense / Income

Unified form for creating/editing transactions.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Type | Toggle | Yes | Expense / Income |
| Amount | Number | Yes | In selected currency |
| Currency | Picker | Yes | ILS / USD / EUR |
| Title | Text | Yes | Transaction description |
| Category | Picker | Yes | Predefined category lists |
| Project | Picker | Yes | Select from user's projects |
| Supplier | Picker | No | Select or add new supplier |
| Payment Method | Picker | No | Cash, Bank Transfer, Check, Credit Card, etc. |
| Receipt Images | Image Picker | No | Multiple images, camera or gallery |
| VAT Included | Toggle | No | Tax tracking flag |

**Expense Categories:** Materials, Labor, Equipment, Transport, Food, Office, Marketing, Insurance, Taxes, Other

**Income Categories:** Payment, Advance, Refund, Grant, Other

**Behavior:**
- Can preselect project and supplier from navigation
- Edit mode can change transaction type (expense <-> income)
- Type change triggers: delete from old table, insert into new, reverse + apply supplier balance
- Camera auto-trigger option for receipt scanning
- Custom category addition inline

### 7.6 Activity Detail

Read-only view of a single transaction.

**Display:**
- Transaction title, amount, date, category
- Project name (linked)
- Supplier name (linked, if applicable)
- Payment method, VAT status
- Receipt images (viewable, zoomable)
- Audit trail / edit history

**Actions:**
- Edit transaction
- Delete transaction (with confirmation)
- Navigate to related project
- Navigate to related supplier

### 7.7 Contacts / Suppliers List

Filterable list of all suppliers.

**Filter Tabs:**

| Tab | Hebrew | Filter |
|-----|--------|--------|
| All | הכל | No filter |
| Credit | חייבים לי | status = 'credit' |
| Debt | אני חייב | status = 'debt' |
| Settled | מאופסו | status = 'settled' |

**Features:**
- Search by name or category
- **Supplier Cards** showing:
  - Avatar, name, category
  - Balance amount with status color (green = credit, red = debt, gray = settled)
  - Last activity date
- Tap card to navigate to Supplier Detail

### 7.8 Supplier Detail

Full supplier profile and transaction history.

**Sections:**

1. **Profile Header:**
   - Avatar (editable via image picker)
   - Name, phone, category
   - Balance summary with status
   - Last active date
2. **Transaction History:**
   - All expenses/incomes linked to this supplier
   - Grouped by project
   - Running balance display
3. **Edit Mode:** Update name, category, phone, avatar
4. **Quick Actions:**
   - Send WhatsApp message
   - Make phone call
   - Add new transaction for this supplier
5. **Delete Supplier** (with confirmation)

### 7.9 Add / Edit Supplier

Form for creating or editing a supplier.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | Yes | Supplier/vendor name |
| Category | Picker | Yes | Vendor category |
| Phone | Text | No | Phone number |
| Avatar | Image Picker | No | Profile photo |

### 7.10 Debts

Track money owed to/by people, independent from project transactions.

**Overview Section:**
- Total outstanding debts
- Paid vs unpaid count/summary

**Debt List:**
- Person name, amount with currency, status (paid/unpaid)
- Reminder interval and next reminder date
- Related project (if linked)

**Add / Edit Debt Modal Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Person Name | Text | Yes | Who owes / is owed |
| Phone | Text | No | Contact number |
| Amount | Number | Yes | Debt amount |
| Currency | Picker | Yes | ILS / USD / EUR |
| Project | Picker | No | Optional project link |
| Notes | Text | No | Context / details |
| Reminder Interval | Picker | No | none / daily / 2days / 3days / weekly / biweekly / monthly |
| Image | Image Picker | No | Receipt or proof |

**Actions per Debt:**
- Mark as paid / unpaid
- Edit details
- Delete (with confirmation)

**Reminder Logic:**
- Next reminder calculated from interval + last reminder date
- Intervals: none, daily, every 2 days, every 3 days, weekly, biweekly, monthly

### 7.11 Category Projects

Filter and view projects by main category (Projects / Personal / Other).

- Same card layout as Projects list
- Category-specific budget/spending breakdown
- Navigation from Dashboard category cards

### 7.12 Reports Center

Analytics dashboard with export capabilities.

**Summary Statistics:**
- Total budget, spent, income
- Net balance
- Project count, supplier count
- Total transaction count
- Debt/credit summary

**Export Options:**
- Summary report (WhatsApp-formatted text)
- Projects detail report
- Suppliers detail report
- Copy to clipboard
- Share via WhatsApp / system share

### 7.13 Personal Area

User profile screen.

- Display user info (email, name)
- Placeholder for future profile features (avatar, preferences)

### 7.14 Settings

Application preferences.

- Global currency selector (ILS / USD / EUR)
- Placeholder for additional settings (theme, notifications, data export)

---

## 8. Currency System

### 8.1 Core Rules

1. **Storage currency:** All amounts stored in ILS in the database
2. **Display currency:** User selects global display currency (ILS / USD / EUR)
3. **Input currency:** User can enter amounts in any supported currency
4. **Conversion on save:** Input amount converted to ILS before persisting
5. **Conversion on display:** ILS amounts converted to display currency for rendering

### 8.2 Conversion Rates

| Currency | Rate (ILS base) |
|----------|-----------------|
| ILS | 1.0 |
| USD | 3.75 (1 USD = 3.75 ILS) |
| EUR | 4.05 (1 EUR = 4.05 ILS) |

**Note:** Rates are currently hardcoded. Future enhancement: live exchange rates.

### 8.3 Conversion Logic

```
toILS(amount, currency):
  ILS -> amount * 1
  USD -> amount * 3.75
  EUR -> amount * 4.05

fromILS(amount, currency):
  ILS -> amount / 1
  USD -> amount / 3.75
  EUR -> amount / 4.05
```

---

## 9. Data Model

### 9.1 Database Tables

#### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, matches auth.users.id |
| email | text | User email |
| full_name | text | Display name |
| phone | text | Phone number |
| avatar_url | text | Profile image URL |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

#### projects
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK -> profiles, RLS filter |
| name | text | Project name |
| budget | numeric | In ILS |
| budget_currency | text | Currency of original input |
| budget_includes_vat | boolean | VAT flag |
| spent | numeric | Total expenses (ILS) |
| income | numeric | Total income (ILS) |
| status | text | 'ok' / 'warning' / 'over' |
| category | text | Subcategory |
| main_category | text | 'projects' / 'personal' / 'other' |
| icon | text | Material Icon name |
| primary_supplier_id | uuid | FK -> suppliers |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

#### expenses
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK -> profiles, RLS filter |
| project_id | uuid | FK -> projects |
| supplier_id | uuid | FK -> suppliers (optional) |
| title | text | Description |
| tag | text | Category tag |
| date | date | Transaction date |
| amount | numeric | In ILS |
| currency | text | Display currency |
| color | text | Category color |
| icon | text | Category icon |
| payment_method | text | Payment method |
| includes_vat | boolean | VAT flag |
| receipt_images | text[] | Image URLs array |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

#### incomes
Same schema as `expenses` - tracks project revenue separately.

#### suppliers
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK -> profiles, RLS filter |
| name | text | Supplier name |
| category | text | Vendor category |
| phone | text | Phone number |
| status | text | 'debt' / 'credit' / 'settled' |
| amount | numeric | Outstanding balance |
| avatar | text | Image URL |
| last_active | date | Last transaction date |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

#### project_activities
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK -> profiles, RLS filter |
| project_id | uuid | FK -> projects |
| supplier_id | uuid | FK -> suppliers (optional) |
| type | text | budget_change / note / expense / income / transaction_update |
| title | text | Activity description |
| date | date | Activity date |
| amount | numeric | Related amount (optional) |
| old_value | text | Previous value (for changes) |
| new_value | text | New value (for changes) |
| tag | text | Category tag |
| icon | text | Icon name |
| receipt_images | text[] | Image URLs |
| transaction_id | uuid | Links to expense/income |
| created_at | timestamptz | Auto |

#### contacts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK -> profiles, RLS filter |
| name | text | Contact name |
| phone | text | Phone |
| email | text | Email |
| avatar | text | Image URL |
| category | text | Category |
| notes | text | Additional notes |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

#### audit_log
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK -> profiles |
| table_name | text | Affected table |
| record_id | uuid | Affected record |
| action | text | create / update / delete |
| old_value | jsonb | Previous state |
| new_value | jsonb | New state |
| details | text | Additional context |
| created_at | timestamptz | Auto |

#### debts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK -> profiles, RLS filter |
| person_name | text | Debtor/creditor name |
| person_phone | text | Phone (optional) |
| amount | numeric | Debt amount |
| currency | text | ILS / USD / EUR |
| project_id | uuid | FK -> projects (optional) |
| project_name | text | Denormalized project name |
| notes | text | Context |
| reminder_interval | text | Reminder frequency |
| last_reminder_date | date | Last sent |
| next_reminder_date | date | Calculated next |
| is_paid | boolean | Paid status |
| image_url | text | Receipt/proof image |
| created_at | timestamptz | Auto |

### 9.2 Row-Level Security

All tables enforce RLS via `user_id`:
- Users can only read/write their own data
- Enforced at the database level via Supabase policies

### 9.3 Data Transformers

Bidirectional conversion between Supabase (snake_case, ISO dates) and local TypeScript (camelCase, DD.MM.YYYY):

- **Supabase -> Local:** Date conversion, null coalescing, type casting
- **Local -> Supabase:** Amount conversion to ILS, date formatting, null handling

---

## 10. Business Rules

### 10.1 Budget Status Calculation

```
if spent >= budget        -> status = 'over'    (red)
if spent >= budget * 0.8  -> status = 'warning' (yellow)
else                      -> status = 'ok'      (green)
```

Remaining = budget + income - spent

### 10.2 Supplier Balance

- **Positive balance** = they owe us -> status `'credit'` (green)
- **Negative balance** = we owe them -> status `'debt'` (red)
- **Zero balance** (within 0.01 threshold) -> status `'settled'` (gray)

**Balance updates:**
- Expense added: balance decreases (we paid them more)
- Income added: balance increases (they paid us)
- Transaction edited: old amount reversed, new amount applied
- Transaction deleted: full reversal

### 10.3 Project Totals Recalculation

Triggered on every transaction create/edit/delete:
1. Sum all expenses for project -> `spent`
2. Sum all incomes for project -> `income`
3. Recalculate `status` based on spent vs budget

### 10.4 Transaction Type Changes

When editing a transaction and changing type (expense <-> income):
1. Delete record from original table
2. Insert record into new table
3. Reverse supplier balance impact from original type
4. Apply supplier balance impact from new type
5. Log `transaction_update` activity entry
6. Recalculate project totals

### 10.5 Debt Reminders

Next reminder date calculation:
- `daily` -> +1 day
- `2days` -> +2 days
- `3days` -> +3 days
- `weekly` -> +7 days
- `biweekly` -> +14 days
- `monthly` -> +30 days
- `none` -> no reminder

---

## 11. Data Operations

### 11.1 Read Hooks

| Hook | Returns | Notes |
|------|---------|-------|
| useProjects | Project[] | With nested expenses, incomes, activities |
| useSuppliers | Supplier[] | Ordered by name |
| useProfile | Profile | Current user profile |
| useDebts | Debt[] | With calculated reminder dates |

All hooks provide: `data`, `loading`, `error`, `refetch()`

### 11.2 Write Operations (Mutations)

**Transactions:**
- `saveTransaction(type, projectId, data, editId?, originalType?)` - Create/update
- `deleteTransaction(transactionId, projectId)` - Delete with cascade

**Projects:**
- `createProject(data)` - New project
- `updateProject(id, updates)` - Edit fields
- `deleteProject(id)` - Delete with cascading cleanup
- `addNoteToProject(projectId, note, images?)` - Add activity note

**Suppliers:**
- `createSupplier(data)` - New supplier
- `updateSupplier(id, updates)` - Edit fields
- `deleteSupplier(id)` - Delete

**Debts:**
- `saveDebt(debt)` - Create or update
- `deleteDebt(id)` - Delete

---

## 12. Non-Functional Requirements

### 12.1 Performance

- `useMemo` for all computed/derived values
- `useCallback` for all event handlers passed as props
- Minimal re-renders through proper state management
- Image loading with proper caching
- Dashboard loads in < 2 seconds
- Lists paginated at 50 items

### 12.2 Error Handling

- Try-catch on all async operations
- User-facing errors displayed via `Alert` in Hebrew
- Detailed error context for debugging
- Never silently swallow errors

### 12.3 Security

- Supabase Row-Level Security on all tables
- No hardcoded secrets in source code
- Environment variables for Supabase URL and anon key
- All queries filtered by authenticated user_id
- No sensitive data in client-side logs

### 12.4 Code Quality

- Keep files under 800 lines
- Extract utilities from large modules
- High cohesion, low coupling
- Immutable state updates only
- TypeScript strict mode

---

## 13. Future Enhancements (Planned)

- [ ] Live exchange rates (replace hardcoded rates)
- [ ] Push notification reminders for debts
- [ ] Receipt OCR (auto-extract amount from photo)
- [ ] Data export (CSV / Excel / PDF)
- [ ] Budget forecasting and trends
- [ ] Recurring transactions
- [ ] Multi-user project sharing
- [ ] Dark theme option
- [ ] Offline mode with sync
- [ ] Personal Area expansion (statistics, achievements)
- [ ] Advanced Settings (notifications, theme, language, backup)
- [ ] Charts and visual analytics in Reports Center
- [ ] Supplier payment scheduling
- [ ] Budget templates
- [ ] Web dashboard companion

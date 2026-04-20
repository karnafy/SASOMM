# SASOMM

**ניהול פיננסי חכם לפרויקטים אישיים ועסקיים**

SASOMM (SA$OMM — "Money Between People") היא אפליקציה בעברית (RTL) לניהול הוצאות, הכנסות, ספקים וחובות בפרויקטים, עם תמיכה רב-מטבעית (ILS / USD / EUR). מיועדת בעיקר לקבלני שיפוצים ובעלי דירות שמנהלים פרויקטים עם תשלומים רבים בין אנשים.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile / Web | React Native 0.81 + Expo 54 |
| Language | TypeScript 5.9 |
| Backend / Auth | Supabase (PostgreSQL + Auth + Storage) |
| Styling | React Native StyleSheet (dark fintech / neumorphic) |
| Icons | @expo/vector-icons (Material Icons) |
| Fonts | Open Sans (Hebrew) + Plus Jakarta Sans (English) |
| Build | EAS (Expo Application Services) |

---

## Features

- **Projects** — תקציב, ניצול, הוצאות והכנסות לפי פרויקט
- **Multi-currency** — ILS בסיס, המרה חיה ל-USD/EUR
- **Suppliers / Contacts** — ניהול ספקים עם היסטוריית תשלומים
- **Debts (דו-כיווני)** — "חייבים לי" + "אני חייב" עם תאריכי יעד ותזכורות WhatsApp
- **Activity log** — תיעוד כל פעולה בפרויקט עם timestamp
- **Reports** — CSV + PDF export לכל פרויקט
- **Receipts** — צירוף תמונות לעסקאות + תצוגה מקדימה
- **Auth** — אימייל+סיסמה + Google OAuth
- **Backup** — ייצוא/ייבוא JSON של כל הנתונים

---

## Project Structure

```
SASOMM/
├── App.tsx                         # Root, navigation stack, currency conversion
├── theme.ts                        # Design tokens
├── app.json                        # Expo config
├── eas.json                        # EAS build config
├── pages/                          # 16 screens (Hebrew RTL)
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Projects.tsx
│   ├── ProjectDetail.tsx
│   ├── AddExpense.tsx
│   ├── Debts.tsx
│   ├── Settings.tsx
│   └── ...
├── components/
│   ├── BottomNav.tsx
│   ├── TopHeader.tsx
│   └── ui/                         # GradientHeader, GlassCard, TransactionRow, etc.
├── shared/                         # @monn/shared package
│   ├── context/AuthContext.tsx
│   ├── hooks/useSupabaseData.ts    # useProjects, useProfile, useDebts
│   ├── hooks/useMutations.ts
│   ├── lib/supabase.ts
│   ├── lib/dataTransformers.ts     # Supabase <-> Local converters
│   ├── lib/dataExport.ts           # JSON backup/restore
│   └── types.ts
├── assets/                         # Logos, icons
├── LOGO/                           # Master logo variants (PNG + AI)
├── design-system/                  # Design tokens reference
└── WEBSITE/                        # Marketing site (separate from app)
```

---

## Getting Started

### Prerequisites
- Node.js 22.14+
- npm / yarn
- Expo CLI (`npx expo`)
- Supabase project with the schema from `shared/lib/database.types.ts`

### Environment

Create `.env` at repo root (never commit):

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### Install & Run

```bash
npm install
npx expo start --web          # web dev server on :8081
npx expo start --android      # Android device / emulator
npx expo start --ios          # iOS simulator
```

### Build

```bash
eas build --platform android   # Android APK/AAB
eas build --platform ios       # iOS IPA
```

---

## Database

All data lives in Supabase (PostgreSQL) with Row Level Security enabled on every table. Each user sees only their own records via `user_id` filter.

**Tables:** `profiles`, `projects`, `expenses`, `incomes`, `suppliers`, `contacts`, `project_activities`, `debts`, `project_supplier_allocations`, `payment_milestones`, `audit_log`.

All monetary amounts are stored in **ILS** in the DB and converted to the user's selected display currency on the client.

---

## Architecture Notes

- **Navigation:** Custom manual stack (not React Navigation) — state in `App.tsx` via `historyStack`
- **Data flow:** Read = `useSupabaseData` hooks → transform → render. Write = `useMutations` hooks → transform → Supabase
- **Immutability:** Never mutate state directly — always `{...obj, field: value}`
- **Error handling:** Try/catch on all async ops + Hebrew error messages via `Alert`

---

## License

Proprietary. All rights reserved — KarnafSTUDIO.

---

## Links

- Marketing site: [sasomm.com](https://sasomm.com)
- Studio: [karnafstudio.co.il](https://karnafstudio.co.il)

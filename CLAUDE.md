# CLAUDE.md - SASOMM Project

## Overview

SASOMM is a personal and project expense management app built with React Native / Expo and Supabase. It tracks expenses, income, budgets, suppliers, and debts across multiple projects with multi-currency support (ILS, USD, EUR).

## Project Structure

```
monny/
├── App.tsx                  # Root entry, navigation state, currency conversion
├── theme.ts                 # Design tokens (neumorphic colors, fonts, spacing)
├── app.json                 # Expo config (com.monny.app)
├── eas.json                 # EAS build config (Node 22.14.0)
├── shared/                  # @monn/shared package
│   ├── types.ts             # Core types (AppScreen, Project, Supplier, Expense, etc.)
│   ├── context/AuthContext.tsx  # Supabase auth provider
│   ├── hooks/useSupabaseData.ts # Read hooks (useProjects, useSuppliers, useProfile, useDebts)
│   ├── hooks/useMutations.ts    # Write hooks (save/create/update/delete)
│   ├── lib/supabase.ts          # Supabase client init
│   ├── lib/dataTransformers.ts  # Supabase <-> Local type converters
│   └── lib/database.types.ts    # Auto-generated Supabase types
├── pages/                   # Screen components (16 screens)
│   ├── Auth.tsx             # Login/signup
│   ├── Dashboard.tsx        # Home: totals, activity, currency switcher
│   ├── Projects.tsx         # Project list with filters
│   ├── ProjectDetail.tsx    # Single project view
│   ├── AddProject.tsx       # Create/edit project
│   ├── AddExpense.tsx       # Add/edit expense or income with receipts
│   ├── ActivityDetail.tsx   # Transaction detail
│   ├── Contacts.tsx         # Supplier list
│   ├── SupplierDetail.tsx   # Supplier detail + history
│   ├── AddSupplier.tsx      # Create/edit supplier
│   ├── CategoryProjects.tsx # Projects by category
│   ├── Debts.tsx            # Debt tracking
│   ├── PersonalArea.tsx     # User profile
│   ├── ReportsCenter.tsx    # Analytics
│   └── Settings.tsx         # Preferences
├── components/              # Reusable UI
│   ├── BottomNav.tsx        # Bottom nav + quick action menu
│   ├── TopHeader.tsx        # Header with nav + logout
│   └── LoadingScreen.tsx    # Loading indicator
└── UI/                      # Design reference files
```

## Tech Stack

- **Framework**: React Native 0.81.5 + Expo 54
- **Language**: TypeScript 5.9
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: React Native StyleSheet, neumorphic design
- **Icons**: Material Icons (@expo/vector-icons)
- **Fonts**: Open Sans (@expo-google-fonts)
- **Build**: EAS (Expo Application Services)

## Development Commands

```bash
npm install                    # Install dependencies
npx expo start                 # Start Expo dev server
npx expo start --android       # Android
npx expo start --ios           # iOS
eas build --platform android   # Build Android APK
```

## Architecture Rules

### Navigation
- Custom manual navigation (NOT React Navigation)
- Stack-based history in App.tsx via `historyStack`
- Screen enum `AppScreen` in shared/types.ts
- Navigate via `navigate(screen, id)` pattern

### Data Flow
- All amounts stored in ILS in Supabase, converted on display
- Bidirectional transformers in `dataTransformers.ts`
- Read: `useSupabaseData` hooks -> transform -> render
- Write: `useMutations` hooks -> transform -> Supabase
- Auth: `AuthContext` wraps entire app

### Currency
- Base currency: ILS (stored in DB)
- Display currencies: ILS, USD, EUR
- Conversion rates defined in App.tsx

### Database Tables
- `profiles`, `projects`, `expenses`, `incomes`, `suppliers`
- `project_activities` (change log), `contacts`, `audit_log`
- All tables have `user_id` for row-level security

## Coding Conventions

- **Language**: All UI text in Hebrew (RTL)
- **Immutability**: Never mutate state directly, always create new objects
- **Styling**: Neumorphic design from `theme.ts` tokens
- **Error handling**: Try-catch on all async ops, Hebrew error messages via Alert
- **Performance**: useMemo for computed values, useCallback for handlers
- **File size**: Keep files under 800 lines, extract utilities

## Requirements

**IMPORTANT**: Always read `requirements.md` before implementing any feature or making changes. It contains the product requirements, feature specs, and design guidelines that must be followed.

## Agent: Requirements Reader

The `requirements-reader` agent (`.claude/agents/requirements-reader.md`) should be invoked at the start of any implementation task to load project requirements into context.

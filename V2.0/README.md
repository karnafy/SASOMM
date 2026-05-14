# SASOMM V2.0 — Liquid Glass Beta

Beta redesign of the SASOMM app in the Liquid Glass design language.

The original v1 (light/dark neumorphic) lives at the project root and stays
untouched. This folder is a parallel implementation that changes **design only**
— all functionality (hooks, navigation, business logic, Supabase integration)
is identical to v1.

## What's different vs v1

- Dark Liquid Glass theme with cyan↔purple glow gradients
- Glass primitives via `expo-blur` + `expo-linear-gradient`:
  - `<GlassCard>` — small content cards
  - `<GlassGlowCard>` — cards with gradient border (hero cards)
  - `<GlowButton>` — gradient fill button with press animation
  - `<GoogleSignInButton>` — official Google G mark
  - `<BrandStrip>` — top logo + language+currency switcher
  - `<LiquidLoadingScreen>` — pulsing logo + slide bar
- Light animations:
  - Buttons scale on press
  - Logo parallax on scroll (Auth screen)
- Unified font: Open Sans with feature-settings tuned

## Run locally

From repo root:
```bash
npm run v2:install     # first time only: installs V2.0/node_modules
npm run v2:web         # opens at http://localhost:8083
npm run v2:android     # build and run native Android
```

Or from `V2.0/` directly:
```bash
cd V2.0
npm install
npm run web
```

v1 (root) runs on port 8082. v2 (this folder) runs on 8083. They share the
same Supabase backend so users / projects / expenses are identical.

## Migration status

Phase 1 — POC:
- [x] `theme.ts` → Liquid Glass tokens
- [x] `components/glass/*` primitives
- [x] `components/LoadingScreen.tsx` → LiquidLoadingScreen
- [x] `pages/Auth.tsx` → Liquid Glass + Google sign-in + scroll parallax
- [ ] `pages/Dashboard.tsx`
- [ ] `pages/Projects.tsx`
- [ ] `pages/ProjectDetail.tsx`
- [ ] `pages/AddExpense.tsx`
- [ ] `pages/AddProject.tsx`
- [ ] `pages/Contacts.tsx`
- [ ] `pages/SupplierDetail.tsx`
- [ ] `pages/Debts.tsx`
- [ ] `pages/PersonalArea.tsx`
- [ ] `pages/Settings.tsx`
- [ ] `pages/ReportsCenter.tsx`

Reference: `docs/superpowers/mockups/BETA-V2.0/app-preview.html` at repo root.

# Dark Fintech Fusion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all 16 Monny screens from light neumorphic to dark fintech theme with purple gradients, glass cards, and cyan accents.

**Architecture:** Update theme.ts with dark tokens, create reusable UI components (GlassCard, DarkCard, GradientButton, etc.), then migrate each screen one at a time. No changes to navigation logic, data hooks, or business logic.

**Tech Stack:** React Native 0.81.5, Expo 54, expo-linear-gradient, expo-blur, react-native-svg, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-20-dark-fintech-redesign-design.md`

---

## File Structure

### New Files (components/ui/)

| File | Responsibility |
|------|---------------|
| `components/ui/GlassCard.tsx` | Frosted card with BlurView (iOS) / solid fallback (Android) |
| `components/ui/DarkCard.tsx` | Solid dark card for content zones |
| `components/ui/GradientButton.tsx` | Full-width cyan gradient CTA button |
| `components/ui/StatusBadge.tsx` | Colored dot + label for status display |
| `components/ui/ProgressBar.tsx` | 4px colored progress bar |
| `components/ui/TransactionRow.tsx` | Icon + title/meta + amount row |
| `components/ui/CurrencyToggle.tsx` | 3-segment currency pill selector |
| `components/ui/FilterPills.tsx` | Horizontal scroll filter chips |
| `components/ui/FormField.tsx` | Label + dark text input |
| `components/ui/FormSelector.tsx` | Label + dark selector with chevron |
| `components/ui/ToggleSwitch.tsx` | Cyan on/off switch |
| `components/ui/CircleIconButton.tsx` | Colored circular action button |
| `components/ui/AvatarCircle.tsx` | Gradient circle with initials |
| `components/ui/GradientHeader.tsx` | Reusable purple gradient header zone (Pattern A) |
| `components/ui/ScreenTopBar.tsx` | Back button + title bar (Pattern B) |
| `components/ui/SectionHeader.tsx` | Title + "show all" link row |
| `components/ui/EmptyState.tsx` | Icon + message for empty lists |
| `components/ui/SkeletonCard.tsx` | Shimmer loading placeholder |
| `components/ui/ErrorOverlay.tsx` | Error icon + message + retry button |

### Modified Files

| File | Changes |
|------|---------|
| `theme.ts` | Replace colors, shadows; add dark tokens, gradient tokens, glass tokens |
| `components/BottomNav.tsx` | Dark theme, FAB gradient, active glow, quick actions redesign |
| `components/TopHeader.tsx` | Dark theme, integrate with GradientHeader or ScreenTopBar |
| `components/LoadingScreen.tsx` | Dark bg, cyan glow pulse, new logo style |
| `pages/Dashboard.tsx` | Full redesign: gradient zone, carousel, dark cards |
| `pages/Projects.tsx` | Gradient header, summary pills, dark project cards |
| `pages/ProjectDetail.tsx` | Gradient header, glass budget card, dark transaction list |
| `pages/AddExpense.tsx` | Dark form, amount input, type toggle, receipt images |
| `pages/AddProject.tsx` | Dark form, icon picker grid |
| `pages/ActivityDetail.tsx` | Dark detail view, amount hero |
| `pages/Contacts.tsx` | Gradient header, filter tabs, dark supplier cards |
| `pages/SupplierDetail.tsx` | Gradient header, avatar, quick actions, transaction history |
| `pages/AddSupplier.tsx` | Dark form, avatar picker |
| `pages/CategoryProjects.tsx` | Gradient header, filtered project cards |
| `pages/Debts.tsx` | Gradient header, debt cards, modal redesign |
| `pages/PersonalArea.tsx` | Gradient header, avatar, info card |
| `pages/ReportsCenter.tsx` | Gradient header, summary grid, export buttons |
| `pages/Settings.tsx` | Dark list layout, currency selector |
| `pages/Auth.tsx` | Full gradient, logo, auth toggle, form fields |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install new packages**

```bash
cd "C:/Users/User/Documents/KARNAF Coding PROJECTS/monny"
npx expo install expo-linear-gradient expo-blur react-native-svg
```

- [ ] **Step 2: Verify installation**

```bash
npx expo doctor
```

Expected: no version conflicts for the three new packages.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add expo-linear-gradient, expo-blur, react-native-svg"
```

---

## Task 2: Update theme.ts

**Files:**
- Modify: `theme.ts`

- [ ] **Step 1: Replace colors object**

Replace the entire `colors` export with the new dark palette. Keep `primary`, `primaryDark`, `primaryLight` unchanged. Replace `neu*` tokens with `bg*` dark tokens. Update `accent`, status colors, and text colors to spec values. Add gradient and glass tokens.

```typescript
export const colors = {
  // Backgrounds
  bgPrimary: '#0D0B1A',
  bgSecondary: '#161427',
  bgTertiary: '#1E1B33',

  // Gradients
  gradientStart: '#6B2FA0',
  gradientMid: '#4A1D7A',
  gradientEnd: '#1A1040',
  gradientColors: ['#6B2FA0', '#4A1D7A', '#2A1050', '#0D0B1A'] as const,
  gradientLocations: [0, 0.4, 0.75, 1] as const,

  // Brand
  primary: '#00D9D9',
  primaryDark: '#0891B2',
  primaryLight: '#5EEAD4',
  accent: '#8B6BAB',

  // Status
  success: '#00E88F',
  warning: '#FFB020',
  error: '#FF4D6A',
  info: '#5B9BFF',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textTertiary: '#6B6B82',

  // Glass
  glassWhite: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  subtleBorder: 'rgba(255,255,255,0.06)',
  glassFallback: '#1E1A35', // Android fallback for GlassCard

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;
```

- [ ] **Step 2: Replace shadow helpers**

Replace `createNeuShadow`, `neuRaised`, `neuRaisedLg`, `neuPressed` with:

```typescript
const createGlowShadow = (
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number,
) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0px ${offsetY}px ${radius * 2}px ${color}`,
    } as any;
  }
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
  })!;
};

export const glowButton = createGlowShadow('#00D9D9', 4, 0.3, 10, 8);
export const glowFab = createGlowShadow('#00D9D9', 4, 0.35, 8, 8);
export const glowDot = createGlowShadow('#00D9D9', 0, 0.6, 4, 4);
export const glowCard = createGlowShadow('#00D9D9', 2, 0.15, 6, 4);
```

- [ ] **Step 3: Verify theme.ts compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add theme.ts
git commit -m "feat: replace neumorphic theme with dark fintech tokens"
```

---

## Task 3: Build Core UI Components (Batch 1 — Cards & Buttons)

**Files:**
- Create: `components/ui/GlassCard.tsx`
- Create: `components/ui/DarkCard.tsx`
- Create: `components/ui/GradientButton.tsx`
- Create: `components/ui/StatusBadge.tsx`
- Create: `components/ui/ProgressBar.tsx`

- [ ] **Step 1: Create components/ui/ directory**

```bash
mkdir -p "C:/Users/User/Documents/KARNAF Coding PROJECTS/monny/components/ui"
```

- [ ] **Step 2: Create GlassCard.tsx**

Uses `expo-blur` BlurView on iOS, solid fallback on Android. Props: `children`, `style?`. Wraps content with border, borderRadius 16, glassBorder.

- [ ] **Step 3: Create DarkCard.tsx**

Simple View with `bgSecondary`, 1px `subtleBorder`, borderRadius 16. Props: `children`, `style?`, `onPress?` (wraps in Pressable with scale animation if onPress provided).

- [ ] **Step 4: Create GradientButton.tsx**

LinearGradient from primary to primaryDark, borderRadius 14, glowButton shadow. Props: `label`, `onPress`, `variant?` ('primary' | 'outline' | 'danger'), `disabled?`.

- [ ] **Step 5: Create StatusBadge.tsx**

Colored dot (6px circle) + label text. Props: `status` ('ok' | 'warning' | 'over'), `size?` ('sm' | 'md'). Maps status to color and Hebrew text (תקין/אזהרה/חריגה).

- [ ] **Step 6: Create ProgressBar.tsx**

4px bar with bgTertiary track and colored fill. Props: `percentage`, `status` ('ok' | 'warning' | 'over'). Color maps: ok → success, warning → warning, over → error. If no status, use primary.

- [ ] **Step 7: Verify all compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add components/ui/
git commit -m "feat: add core UI components (GlassCard, DarkCard, GradientButton, StatusBadge, ProgressBar)"
```

---

## Task 4: Build Core UI Components (Batch 2 — Form & Layout)

**Files:**
- Create: `components/ui/FormField.tsx`
- Create: `components/ui/FormSelector.tsx`
- Create: `components/ui/ToggleSwitch.tsx`
- Create: `components/ui/CurrencyToggle.tsx`
- Create: `components/ui/FilterPills.tsx`
- Create: `components/ui/SectionHeader.tsx`

- [ ] **Step 1: Create FormField.tsx**

Label (textSecondary 11px) + TextInput (bgSecondary, subtleBorder, borderRadius 12, white text). Props: `label`, `value`, `onChangeText`, `placeholder?`, `keyboardType?`, `error?` (shows red border + error text).

- [ ] **Step 2: Create FormSelector.tsx**

Same styling as FormField but Pressable with value text + chevron_left icon. Props: `label`, `value`, `displayValue`, `onPress`, `icon?` (optional leading icon).

- [ ] **Step 3: Create ToggleSwitch.tsx**

44x24 track with 20px knob. Off: bgTertiary track, textTertiary knob. On: primary@0.3 track, primary knob. Animated slide. Props: `value`, `onToggle`.

- [ ] **Step 4: Create CurrencyToggle.tsx**

3-segment pill (₪/$//€). Active segment: primary bg, bgPrimary text. Inactive: glassWhite bg, textSecondary text. Props: `selected: 'ILS' | 'USD' | 'EUR'`, `onSelect: (currency: 'ILS' | 'USD' | 'EUR') => void`. Wraps in a View with glassWhite background, borderRadius 18. Type must match `Currency` from `shared/types.ts`.

- [ ] **Step 5: Create FilterPills.tsx**

Horizontal ScrollView with chip buttons. Active: primary@0.15 bg, primary text, primary@0.3 border. Inactive: glassWhite bg, textSecondary text. Props: `filters: string[]`, `activeFilter`, `onSelect`.

- [ ] **Step 6: Create SectionHeader.tsx**

Row: title (white Bold 16px) right-aligned + optional link text (primary 12px) left-aligned. Props: `title`, `linkText?`, `onLinkPress?`.

- [ ] **Step 7: Verify all compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add components/ui/
git commit -m "feat: add form and layout UI components"
```

---

## Task 5: Build Core UI Components (Batch 3 — Data Display)

**Files:**
- Create: `components/ui/TransactionRow.tsx`
- Create: `components/ui/CircleIconButton.tsx`
- Create: `components/ui/AvatarCircle.tsx`
- Create: `components/ui/GradientHeader.tsx`
- Create: `components/ui/ScreenTopBar.tsx`
- Create: `components/ui/EmptyState.tsx`
- Create: `components/ui/SkeletonCard.tsx`
- Create: `components/ui/ErrorOverlay.tsx`

- [ ] **Step 1: Create TransactionRow.tsx**

Row: icon container (38px bgTertiary rounded-10) + title (white 13px) / meta (textTertiary 10px) + amount (colored Bold 13px). Props: `icon`, `iconColor`, `title`, `meta`, `amount`, `isIncome`, `onPress?`.

- [ ] **Step 2: Create CircleIconButton.tsx**

Circular button with tinted background. Props: `icon`, `color`, `size?` (default 48), `label?`, `onPress`.

- [ ] **Step 3: Create AvatarCircle.tsx**

LinearGradient circle with centered initials (white Bold). Props: `name` (extracts first 2 chars), `size?` (default 44), `gradientColors?` (default purple pair), `imageUri?` (shows image instead).

- [ ] **Step 4: Create GradientHeader.tsx**

LinearGradient with gradientColors/gradientLocations from theme. Wraps children. Props: `children`, `style?`. Handles StatusBar transparent + light-content.

- [ ] **Step 5: Create ScreenTopBar.tsx**

Row: back button (circle, arrow-forward icon) + title (white SemiBold 16px) + optional right action. Props: `title`, `onBack`, `rightAction?`.

- [ ] **Step 6: Create EmptyState.tsx**

Centered: icon in 64px bgTertiary circle + textSecondary message + optional cyan link. Props: `icon`, `message`, `actionLabel?`, `onAction?`.

- [ ] **Step 7: Create SkeletonCard.tsx**

Dark card shape with pulsing bgTertiary rectangles inside (Animated opacity loop 0.3→0.7). Props: `height?`, `variant?` ('card' | 'row' | 'pill').

- [ ] **Step 8: Create ErrorOverlay.tsx**

Centered: cloud-off icon in error color + message + "נסה שוב" retry button. Props: `message`, `onRetry`.

- [ ] **Step 9: Verify all compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 10: Commit**

```bash
git add components/ui/
git commit -m "feat: add data display, layout, and state UI components"
```

---

## Task 6: Redesign BottomNav.tsx

**Files:**
- Modify: `components/BottomNav.tsx`

- [ ] **Step 1: Read current BottomNav.tsx**

Understand existing props, navigation callbacks, active screen logic, FAB quick actions.

- [ ] **Step 2: Restyle to dark theme**

Replace all neumorphic styles:
- Background: `bgSecondary`, top border `subtleBorder`
- Tab icons: `textTertiary` inactive, `primary` active with glow dot
- FAB: LinearGradient circle with glowFab shadow
- Quick actions menu: dark overlay, bgTertiary circular buttons with tinted backgrounds
- Keep all existing navigation callbacks and props unchanged

- [ ] **Step 3: Verify BottomNav renders**

```bash
npx expo start --web
```

Check the bottom nav appears with dark styling.

- [ ] **Step 4: Commit**

```bash
git add components/BottomNav.tsx
git commit -m "feat: redesign BottomNav with dark fintech theme"
```

---

## Task 7: Redesign LoadingScreen.tsx + TopHeader.tsx

**Files:**
- Modify: `components/LoadingScreen.tsx`
- Modify: `components/TopHeader.tsx`

- [ ] **Step 1: Restyle LoadingScreen**

- bgPrimary background
- Centered: LinearGradient rounded square (76px) with account-balance icon
- "Monny" text below in white Bold 30px
- Pulsing glow animation (Animated scale 1.0→1.05 loop + opacity)

- [ ] **Step 2: Restyle TopHeader** (Note: this file is untracked/new — create from scratch if it doesn't exist yet)

- For Pattern A screens: integrate with GradientHeader (transparent background, white text)
- For Pattern B screens: bgPrimary background, white text, back button circle
- Logout button styled as subtle glass circle

- [ ] **Step 3: Commit**

```bash
git add components/LoadingScreen.tsx components/TopHeader.tsx
git commit -m "feat: redesign LoadingScreen and TopHeader for dark theme"
```

---

## Task 8: Redesign Auth.tsx

**Files:**
- Modify: `pages/Auth.tsx`

- [ ] **Step 1: Read current Auth.tsx for form logic**

- [ ] **Step 2: Restyle to dark fintech design**

- Full gradient background (GradientHeader covering entire screen)
- Logo: LinearGradient rounded square + `account-balance` icon (HYPHENS not underscores — spec section 3.15 has a typo using underscores) + glow
- "Monny" title + tagline
- Login/signup segmented toggle (CurrencyToggle pattern but for 2 options)
- FormField for email, FormField for password (with visibility toggle)
- GradientButton for login
- Social auth placeholder buttons (show toast on press)
- Keep all auth logic (Supabase email/password) unchanged

- [ ] **Step 3: Verify auth flow works**

```bash
npx expo start --web
```

Test login screen renders correctly, login/signup toggle works, form submission works.

- [ ] **Step 4: Commit**

```bash
git add pages/Auth.tsx
git commit -m "feat: redesign Auth screen with dark gradient theme"
```

---

## Task 9: Redesign Dashboard.tsx

**Files:**
- Modify: `pages/Dashboard.tsx`

This is the most complex screen. Reference the mockup in `.superpowers/brainstorm/` for exact layout.

- [ ] **Step 1: Read current Dashboard.tsx**

Understand data flow: greeting, totals, recent activity, projects, categories, currency state.

- [ ] **Step 2: Build gradient zone**

- GradientHeader wrapping:
  - Header row: greeting (right) + CurrencyToggle (left)
  - Main carousel glass card: spent amount + change indicator + sparkline SVG
  - Two sub-cards (Income + Net balance) as glass cards side by side
  - Dot indicators

- [ ] **Step 3: Build dark zone**

- Budget category cards (3 across): DarkCard with category name, remaining, StatusBadge, ProgressBar
- Recent activity: SectionHeader + TransactionRow list (8 items)
- Recent projects: SectionHeader + horizontal ScrollView of small DarkCard project cards
- Suppliers quick view: SectionHeader + AvatarCircle row

- [ ] **Step 4: Wire up data**

Keep all existing data hooks (useProjects, useMutations), currency conversion, and navigation callbacks. Only change the rendering.

- [ ] **Step 5: Add loading/empty states**

- Show SkeletonCard while data loads
- Show EmptyState when no projects exist

- [ ] **Step 6: Verify Dashboard renders with data**

```bash
npx expo start --web
```

- [ ] **Step 7: Commit**

```bash
git add pages/Dashboard.tsx
git commit -m "feat: redesign Dashboard with carousel, gradient header, dark cards"
```

---

## Task 10: Redesign Projects.tsx + CategoryProjects.tsx

**Files:**
- Modify: `pages/Projects.tsx`
- Modify: `pages/CategoryProjects.tsx`

- [ ] **Step 1: Restyle Projects.tsx**

- GradientHeader: title + add button (glass circle) + summary pills (3 glass cards) + FilterPills
- Dark zone: Project cards using DarkCard with icon container, name/category, StatusBadge, amounts row, ProgressBar, footer

- [ ] **Step 2: Restyle CategoryProjects.tsx**

- Same pattern as Projects.tsx but filtered by category
- Header shows category name + icon

- [ ] **Step 3: Add empty/loading states**

- [ ] **Step 4: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add pages/Projects.tsx pages/CategoryProjects.tsx
git commit -m "feat: redesign Projects and CategoryProjects with dark theme"
```

---

## Task 11: Redesign ProjectDetail.tsx

**Files:**
- Modify: `pages/ProjectDetail.tsx`

- [ ] **Step 1: Restyle to dark theme**

- GradientHeader: project icon (56px), name, category, StatusBadge
- Glass card: budget (editable), spent, income, remaining, ProgressBar
- Action buttons: "הוסף הוצאה" / "הוסף הכנסה" as DarkCard buttons
- Transaction list using TransactionRow
- Notes section: DarkCards with text + timestamps
- Action menu: floating button with dark popup

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add pages/ProjectDetail.tsx
git commit -m "feat: redesign ProjectDetail with dark theme"
```

---

## Task 12: Redesign AddExpense.tsx + AddProject.tsx + AddSupplier.tsx

**Files:**
- Modify: `pages/AddExpense.tsx`
- Modify: `pages/AddProject.tsx`
- Modify: `pages/AddSupplier.tsx`

**Note:** `AddSupplier.tsx` uses `accentDark`/`accentLight` tokens that are being removed. Replace all `accentDark`/`accentLight` references with `accent` or `primary` as appropriate.

- [ ] **Step 1: Restyle AddExpense.tsx**

- ScreenTopBar with back button + title
- Type toggle: expense (red) / income (green) segmented control
- Amount section: large centered number + blinking cursor + currency chips
- Form fields: FormField and FormSelector components
- ToggleSwitch for VAT
- Receipt images: thumbnails + dashed add button
- GradientButton for save

- [ ] **Step 2: Restyle AddProject.tsx**

- ScreenTopBar
- Form fields using FormField / FormSelector
- Icon picker: 6-column grid of DarkCard circles, selected = primary border
- ToggleSwitch for VAT
- GradientButton for save

- [ ] **Step 3: Restyle AddSupplier.tsx**

- ScreenTopBar
- Avatar picker (large circle + camera icon overlay)
- Form fields
- GradientButton for save

- [ ] **Step 4: Verify all forms work (submit, edit mode, validation)**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add pages/AddExpense.tsx pages/AddProject.tsx pages/AddSupplier.tsx
git commit -m "feat: redesign form screens (AddExpense, AddProject, AddSupplier)"
```

---

## Task 13: Redesign ActivityDetail.tsx

**Files:**
- Modify: `pages/ActivityDetail.tsx`

**Note:** This file uses `accentDark`/`accentLight`/`successDark`/`warningDark`/`errorDark` tokens being removed. Replace with `accent`/`success`/`warning`/`error` equivalents.

- [ ] **Step 1: Restyle to dark theme**

- ScreenTopBar
- Amount hero: large centered, colored by type
- Detail card: DarkCard with labeled rows
- Receipt images: horizontal scroll
- Action buttons: outline style (cyan edit, red delete)
- Replace all `*Dark`/`*Light` status token usages with base tokens

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add pages/ActivityDetail.tsx
git commit -m "feat: redesign ActivityDetail with dark theme"
```

---

## Task 14: Redesign Contacts.tsx + SupplierDetail.tsx

**Files:**
- Modify: `pages/Contacts.tsx`
- Modify: `pages/SupplierDetail.tsx`

- [ ] **Step 1: Restyle Contacts.tsx**

- GradientHeader: title + add button
- Filter tabs with cyan underline active state
- Search bar: glass card style
- Supplier cards: DarkCard with AvatarCircle, name, category, balance, last active

- [ ] **Step 2: Restyle SupplierDetail.tsx**

- GradientHeader: large AvatarCircle centered, name, category, phone
- Glass summary card: balance, status, last active
- Quick actions: 3 CircleIconButtons (WhatsApp, Phone, Add)
- Transaction history: TransactionRow list grouped by project

- [ ] **Step 3: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add pages/Contacts.tsx pages/SupplierDetail.tsx
git commit -m "feat: redesign Contacts and SupplierDetail with dark theme"
```

---

## Task 15: Redesign Debts.tsx

**Files:**
- Modify: `pages/Debts.tsx`

- [ ] **Step 1: Restyle to dark theme**

- GradientHeader: title + glass summary card (total outstanding, unpaid count)
- Debt cards: DarkCard with person name, amount, due date, reminder badge, paid toggle
- Add button: floating FAB-style
- Add/edit modal: Modal with animationType="slide", bgSecondary background, glassBorder

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add pages/Debts.tsx
git commit -m "feat: redesign Debts with dark theme"
```

---

## Task 16: Redesign ReportsCenter.tsx + PersonalArea.tsx + Settings.tsx

**Files:**
- Modify: `pages/ReportsCenter.tsx`
- Modify: `pages/PersonalArea.tsx`
- Modify: `pages/Settings.tsx`

- [ ] **Step 1: Restyle ReportsCenter.tsx**

- GradientHeader: title
- Summary glass cards: 2x2 grid
- Stats row: DarkCards
- Export buttons: DarkCards with icons

- [ ] **Step 2: Restyle PersonalArea.tsx**

- GradientHeader: large AvatarCircle centered
- User info: glass card with name, email, phone
- Placeholder cards with lock icon

- [ ] **Step 3: Restyle Settings.tsx**

- Dark background, ScreenTopBar
- Section DarkCards with labeled rows, separators
- CurrencyToggle for default currency
- Placeholder rows for future settings

- [ ] **Step 4: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add pages/ReportsCenter.tsx pages/PersonalArea.tsx pages/Settings.tsx
git commit -m "feat: redesign Reports, PersonalArea, Settings with dark theme"
```

---

## Task 17: Cleanup & Final Verification

**Files:**
- Modify: `theme.ts` (remove any remaining old tokens)
- Modify: `App.tsx` (StatusBar configuration)

- [ ] **Step 1: Remove old neumorphic tokens from theme.ts**

Verify no file imports old tokens. Search for ALL removed tokens including neumorphic AND dark/light variants. If any remain, update those files.

```bash
# Search for ALL old token usage
grep -rn "neuBg\|neuBgAlt\|neuShadow\|neuLight\|neuRaised\|neuPressed\|accentDark\|accentLight\|successDark\|warningDark\|errorDark" --include="*.tsx" --include="*.ts" .
```

- [ ] **Step 2: Update App.tsx StatusBar**

Add `<StatusBar barStyle="light-content" translucent backgroundColor="transparent" />` at the root.

- [ ] **Step 3: Full app verification**

```bash
npx expo start --web
```

Walk through every screen: Auth → Dashboard → Projects → ProjectDetail → AddExpense → Contacts → SupplierDetail → Debts → Reports → Settings → PersonalArea.

Verify: dark backgrounds, purple gradients, cyan accents, glass cards, correct icons, RTL layout, data displays correctly.

- [ ] **Step 4: Final commit**

```bash
git add theme.ts App.tsx
git commit -m "chore: cleanup old neumorphic tokens, finalize dark theme migration"
```

# Monny Dark Fintech Fusion — UI Redesign Spec

**Date:** 2026-03-20
**Status:** Approved
**Approach:** Dark Fintech Fusion (Approach 2)

## Overview

Complete visual overhaul of all 16 Monny screens from the current light neumorphic theme to a dark fintech aesthetic inspired by Revolut. The design keeps Monny's brand identity (cyan primary, purple accent) while adopting dark surfaces, purple gradient headers, glassmorphic cards, and modern fintech layout patterns.

**Scope:** All 16 screens (Dashboard, Projects, ProjectDetail, AddProject, AddExpense, ActivityDetail, Contacts, SupplierDetail, AddSupplier, CategoryProjects, Debts, PersonalArea, ReportsCenter, Settings, Auth, LoadingScreen).

**Mockups:** Available in `.superpowers/brainstorm/` — `all-screens-no-emoji.html` is the primary reference.

---

## 1. Design System

### 1.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| **Backgrounds** | | |
| `bgPrimary` | `#0D0B1A` | Main app background |
| `bgSecondary` | `#161427` | Card backgrounds, elevated surfaces |
| `bgTertiary` | `#1E1B33` | Nested cards, input fields, icon containers |
| **Gradients** | | |
| `gradientStart` | `#6B2FA0` | Purple gradient start (header top) |
| `gradientMid` | `#4A1D7A` | Purple gradient middle |
| `gradientEnd` | `#1A1040` | Purple gradient end (fades into bgPrimary) |
| **Brand** | | |
| `primary` | `#00D9D9` | Primary actions, active tabs, links, progress bars |
| `primaryDark` | `#0891B2` | Pressed states, gradient end for buttons |
| `primaryLight` | `#5EEAD4` | Highlights, subtle accents |
| `accent` | `#8B6BAB` | Secondary elements (lighter purple) |
| **Status** | | |
| `success` | `#00E88F` | Income, positive balance, on track |
| `warning` | `#FFB020` | Warning status, approaching budget |
| `error` | `#FF4D6A` | Over budget, debt, errors |
| `info` | `#5B9BFF` | Informational elements |
| **Text** | | |
| `textPrimary` | `#FFFFFF` | Main text |
| `textSecondary` | `#A0A0B8` | Labels, secondary info |
| `textTertiary` | `#6B6B82` | Muted, placeholders, disabled |
| **Glass** | | |
| `glassWhite` | `rgba(255,255,255,0.08)` | Frosted card background |
| `glassBorder` | `rgba(255,255,255,0.12)` | Glass card borders |
| `subtleBorder` | `rgba(255,255,255,0.06)` | Dark card borders |

### 1.2 Typography

- **Font Family:** Open Sans (unchanged)
- **Headline:** SemiBold 600 (not Bold — lighter weight reads better on dark)
- **Large numbers:** Bold 700 (amounts, balances)
- **Body:** Regular 400
- **Labels:** Regular 400, `textSecondary` color
- **Captions:** Regular 400, `textTertiary` color, 9-11px

### 1.3 Spacing

Unchanged from current theme.ts: xs(4), sm(8), md(12), lg(16), xl(20), 2xl(24), 3xl(32).

### 1.4 Border Radii

Unchanged: sm(8), md(12), lg(16), xl(20), full(9999).

### 1.5 Card Styles

**Glass Card** (on purple gradient areas):
- Implementation: Wrap content in `<BlurView>` from `expo-blur` (intensity ~40, tint "dark") on iOS. On Android, `BlurView` fallback renders without blur — use `bgSecondary` at opacity 0.92 with a slightly lighter tint (`#1E1A35`) to maintain contrast against the purple gradient background.
- Outer border: 1px `glassBorder`
- Border radius: 16px
- Do NOT use CSS `backdrop-filter` — it does not exist in React Native StyleSheet API.

**Dark Card** (on dark background areas):
- Background: `bgSecondary`
- Border: 1px `subtleBorder`
- Border radius: 16px

**Elevated Card** (interactive/important):
- Background: `bgTertiary`
- Border: 1px gradient border (implemented via a wrapper `<LinearGradient>` with 1px padding)
- Optional: faint cyan glow shadow

### 1.6 Shadows

Replace all neumorphic shadows with React Native shadow props:
- **Button glow:** `{ shadowColor: '#00D9D9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }`
- **FAB glow:** `{ shadowColor: '#00D9D9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 8 }`
- **Active tab dot:** `{ shadowColor: '#00D9D9', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 4, elevation: 4 }`
- Note: iOS supports `shadowColor` natively. Android uses `elevation` which does not support colored shadows — approximate with a thin wrapper View or accept the platform difference.

### 1.7 Icons

- Material Icons (`@expo/vector-icons` MaterialIcons) — unchanged library
- **Icon names use hyphens** (e.g., `account-balance-wallet`, `person-add`, `create-new-folder`), NOT underscores. Underscores silently render blank.
- Icon containers: `bgTertiary` background, sizes vary by context:
  - Transaction rows: 38px, border-radius 10px
  - Project/supplier cards: 42px, border-radius 10px
  - Detail screen headers: 56px, border-radius 14px
  - Profile avatars: 64-100px, border-radius full (circle)
- Icon colors: category-specific (see per-screen specs)

---

## 2. Bottom Navigation Bar

### Layout
- Background: `bgSecondary`
- Top border: 1px `subtleBorder`
- Height: 64px + safe area inset bottom
- 5 positions (RTL order): Home, Suppliers, FAB, Debts, Projects

### Tabs

| RTL Position | Icon | Hebrew Label | Screen |
|-------------|------|-------------|--------|
| 1 (right) | `home` | בית | Dashboard |
| 2 | `people` | ספקים | Contacts |
| 3 (center) | **FAB** | — | Quick Actions |
| 4 | `folder` | פרויקטים | Projects |
| 5 (left) | `account-balance-wallet` | חובות | Debts |

### Tab States
- **Inactive:** icon + label in `textTertiary`
- **Active:** icon + label in `primary`, 4px cyan dot above icon with glow shadow

### Center FAB
- 56px circle, implemented via `<LinearGradient colors={[primary, primaryDark]} start={{x:0,y:0}} end={{x:1,y:1}}>` from `expo-linear-gradient`
- Icon: `add`, white, 26px
- Elevated -24px above bar
- Cyan glow shadow
- Press: scale 0.9, shadow intensifies

### Quick Actions Menu (FAB press)
- Full-screen backdrop: `rgba(0,0,0,0.6)`
- Menu rises from bottom with spring animation
- 4 circular buttons (48px, `bgTertiary`, glass border):
  - Add Expense (`remove` icon, `bgTertiary` with `error` at 0.15 opacity background, `error` icon color)
  - Add Income (`add` icon, `bgTertiary` with `success` at 0.15 opacity background, `success` icon color)
  - Add Project (`create-new-folder` icon, `bgTertiary` with `primary` at 0.15 opacity background, `primary` icon color)
  - Add Supplier (`person-add` icon, `bgTertiary` with `accent` at 0.15 opacity background, `accent` icon color)
- Hebrew labels below each
- FAB rotates 45deg to become X

### Visibility
- Hidden on: AddExpense, AddProject, AddSupplier, ActivityDetail (all form/detail screens)

---

## 3. Screen Specifications

### 3.1 Dashboard (Home)

**Structure:**
1. Purple gradient zone (~35% top)
2. Dark zone (scrollable, below)

**Gradient Zone:**

*Header Row:*
- Right: User greeting "שלום, {name}" — white Bold 20px
- Left: Currency toggle pill — 3 segments `[₪|$|€]`, active = `primary` background, inactive = `glassWhite`

*Swipeable Carousel (3 slides):*

Slide 1 — Spent (הוצאות):
- Glass card, full width, 16px margins
- Label: `textSecondary` 13px
- Amount: white Bold 34px
- Change indicator: `▼ ₪X` in `error` or `▲ ₪X` in `success`
- Sparkline chart: SVG, white stroke, cyan gradient fill under, cyan dot on current position
- X-axis labels: day numbers

Slide 2 — Income (הכנסות):
- Same glass card layout
- Amount in `success` green
- 5 vertical bars mini-chart

Slide 3 — Net Balance (מאזן נטו):
- Amount colored by status
- Status badge with dot: "חיובי" / "שלילי"
- Stacked horizontal bar: green vs red portions

*Dot indicators:* 3 dots centered, active = white, inactive = `glassWhite`

*Sub-cards (Income + Net):*
- Two glass cards side by side below main carousel card
- Each: label, amount, change indicator, mini-chart

**Dark Zone:**

*Budget Category Cards (3 across):*
- Dark cards, equal width
- Category name (`textSecondary` 10px)
- Remaining amount (`primary` Bold 14px)
- "נותר" label
- Status badge: dot + text (colored)
- Progress bar: 4px, colored by status
- Footer: percentage + total budget

*Recent Activity:*
- Section header: "פעילות אחרונה" + "הצג הכל" link in `primary`
- Transaction rows: icon container (38px, `bgTertiary`, colored icon) + title/meta + amount
- Separator: 1px `rgba(255,255,255,0.04)`
- 8 items max

*Recent Projects (horizontal scroll):*
- Section header: "פרויקטים אחרונים" + "הצג הכל"
- Cards: 130px wide, dark card, icon circle + name + remaining amount + progress bar
- 12px gap, horizontal scroll

*Suppliers Quick View:*
- Section header: "ספקים" + "הצג הכל"
- 4 avatar circles (44px, gradient backgrounds) with initials
- Name below (`textSecondary` 9px)
- Balance below (colored by status, 10px)

### 3.2 Projects List

**Gradient Zone:**
- Screen title: "פרויקטים" Bold 24px + add button (circle, glass)
- Summary pills: 3 glass cards (total budget / expenses / remaining)
- Filter pills: horizontal scroll, active = cyan bg/border, inactive = `glassWhite`

**Dark Zone:**
- Project cards (dark cards), each containing:
  - Top row: icon (42px colored container) + name/category + status badge
  - Amounts row: 3-column (budget / expenses / remaining)
  - Progress bar (4px, colored by status)
  - Footer: percentage + last updated date

### 3.3 Project Detail

**Gradient Zone:**
- Project icon (large, 56px colored container) + name + category + status badge
- Glass card: budget (editable), spent, income, remaining, progress bar

**Dark Zone:**
- Action buttons row: "הוסף הוצאה" / "הוסף הכנסה" (dark cards, outlined, with icons)
- Transaction list (same row style as Dashboard)
- Notes section: dark cards with text, timestamp, image thumbnails
- Bottom action menu: floating button → dark popup with edit/delete/export

### 3.4 Add/Edit Expense & Income

**Full dark background (no gradient):**
- Top bar: back arrow (`arrow_forward`) + "הוספת פעולה" + spacer
- Type toggle: expense (red active) / income (green active) — segmented control
- Amount section: large centered number (44px Bold) with blinking cyan cursor, currency chips below
- Form fields (dark inputs, `bgSecondary`, 12px radius, 1px `subtleBorder`):
  - Title (text), Category (selector with chevron), Date (selector)
  - Project (selector with icon), Supplier (selector), Payment method (selector)
- VAT toggle: dark card row with switch (cyan when on)
- Receipt images: thumbnail grid + dashed "add" box with camera icon
- Save button: full-width cyan gradient, bold text, glow shadow

### 3.5 Add/Edit Project

**Same form layout as AddExpense:**
- Fields: Name, Budget + Currency, Main Category (3-option toggle), Subcategory (selector)
- Icon picker: 6-column grid, each in 48px dark circle, selected = cyan border + glow
- VAT toggle
- Save button

### 3.6 Activity Detail

**Dark background, no gradient:**
- Amount hero: large centered, colored by type
- Detail card: dark card with labeled rows (title, date, project, supplier, payment, VAT)
- Receipt images: horizontal scroll thumbnails, tap for fullscreen
- Action buttons: "ערוך" (cyan outline) / "מחק" (red outline)

### 3.7 Contacts (Suppliers List)

**Same structure as Projects List:**
- Gradient header with title + add button
- Filter tabs: "הכל" / "חייבים לי" / "אני חייב" / "מאופסים" — active = cyan underline
- Search bar: glass card with search icon
- Supplier cards: dark cards with avatar (gradient circle, initials), name, category, balance (colored), last active

### 3.8 Supplier Detail

**Gradient header:**
- Large avatar (centered, 64px gradient circle)
- Name, category, phone below
- Glass summary card: balance (large, colored), status badge, last active

**Dark zone:**
- Quick actions: 3 circular buttons (WhatsApp green, Phone cyan, Add Transaction primary)
- Transaction history: grouped by project, same row style

### 3.9 Add/Edit Supplier

**Same form layout:**
- Avatar picker: 80px circle, camera overlay icon
- Fields: Name, Category (selector), Phone
- Save button

### 3.10 Debts

**Gradient header:**
- Title "חובות"
- Glass summary card: total outstanding, unpaid count

**Dark zone:**
- Debt cards (dark cards): person name + phone, amount (large, colored), due date, reminder badge, project link, paid toggle
- Add button: bottom-right floating, same style as FAB
- Add/edit modal: React Native `Modal` with `animationType="slide"`, glass-style background (`bgSecondary` with `glassBorder`), presented from bottom. Not a third-party bottom sheet — uses the built-in Modal component already in use.

### 3.11 Category Projects

- Same as Projects List, filtered by category
- Header: category name + icon
- Category total summary in glass pills

### 3.12 Reports Center

**Gradient header:** Title "דוחות"
- Summary glass cards: 2x2 grid (budget, spent, income, net)
- Stats row: dark cards (project count, supplier count, transaction count)
- Export buttons: dark cards with icons (share, copy, WhatsApp)

### 3.13 Personal Area

**Gradient with avatar:** Large centered circle (100px), name, email, phone
- User info glass card
- Placeholder cards for future features (lock icon)

### 3.14 Settings

**Dark background, list layout:**
- Section cards: dark cards with labeled rows
  - Currency selector (3 toggles)
  - Theme / Notifications / Export (placeholder rows)
- Rows: label right, value/chevron left, separator between

### 3.15 Auth (Login/Signup)

**Full gradient background:**
- Logo: 76px rounded square, cyan gradient, `account_balance` icon, glow shadow
- App name: "Monny" Bold 30px + tagline
- Auth toggle: login/signup segmented control (active = cyan bg)
- Email field + Password field (with visibility toggle)
- "שכחתי סיסמה" link in `primary`
- Login button: full-width cyan gradient, glow
- Divider: "או" with lines
- Social buttons: Google + Apple (dark outlined squares) — **placeholder UI only**, not functional until social auth is implemented. Buttons are visible but show "בקרוב" (coming soon) toast on press.

### 3.16 Loading Screen

- `bgPrimary` background
- Centered Monny logo (same as Auth)
- Pulsing cyan glow animation
- "Monny" text below

---

## 4. Component Patterns

### 4.1 Screen Layout Pattern

Every screen follows one of two patterns:

**Pattern A — Gradient + Dark (Dashboard, Projects, ProjectDetail, Contacts, SupplierDetail, CategoryProjects, Debts, Reports, PersonalArea, Auth):**
```
[StatusBar - transparent, light-content]
[Gradient Zone - header, summary, glass cards]
[Dark Zone - scrollable content with dark cards]
[Bottom Nav]
```

**Pattern B — Dark Only (AddExpense, AddProject, AddSupplier, ActivityDetail, Settings):**
```
[StatusBar - bgPrimary background, light-content]
[Top Bar - back button + title]
[Content - form fields / detail rows]
[Action Button]
```
Bottom nav hidden on Pattern B screens.

**StatusBar:** All screens use `barStyle="light-content"`. Pattern A screens use transparent StatusBar to blend with gradient. Pattern B screens use `bgPrimary` background.

### 4.2 Shared Components

| Component | Description |
|-----------|-------------|
| `GlassCard` | Frosted card for gradient zones |
| `DarkCard` | Solid card for dark zones |
| `StatusBadge` | Dot + label, colored by status |
| `ProgressBar` | 4px bar, colored by status |
| `TransactionRow` | Icon + title/meta + amount |
| `CurrencyToggle` | 3-segment pill selector |
| `FilterPills` | Horizontal scroll chips |
| `FormField` | Label + dark input |
| `FormSelector` | Label + dark input with chevron |
| `ToggleSwitch` | Cyan on/off switch |
| `GradientButton` | Full-width cyan gradient CTA |
| `CircleIconButton` | Colored circular action button |
| `AvatarCircle` | Gradient circle with initials |

---

## 5. Gradients Implementation

All gradients in this spec must use `<LinearGradient>` from `expo-linear-gradient`. Do NOT use CSS `linear-gradient()` syntax — it does not work in React Native.

**Common gradient patterns:**

```jsx
// Purple header gradient (Pattern A screens)
<LinearGradient
  colors={['#6B2FA0', '#4A1D7A', '#2A1050', '#0D0B1A']}
  locations={[0, 0.4, 0.75, 1]}
>

// Cyan button gradient
<LinearGradient
  colors={['#00D9D9', '#0891B2']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>

// Avatar gradient backgrounds
<LinearGradient
  colors={[color1, color2]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ borderRadius: 9999 }}
>
```

**Sparkline charts:** Require `react-native-svg` for SVG rendering. Add as dependency alongside `expo-linear-gradient`.

---

## 6. Error, Empty & Loading States

### 6.1 Loading States

- **App startup:** LoadingScreen (section 3.16) — logo + pulsing glow
- **Per-screen data loading:** Show skeleton placeholders matching card shapes:
  - Dark cards with pulsing `bgTertiary` rectangles (shimmer animation)
  - Same dimensions as populated cards
  - 3 skeleton cards for lists, 1 for summary sections

### 6.2 Empty States

Each list screen has a centered empty state when no data exists:

| Screen | Icon | Hebrew Text |
|--------|------|-------------|
| Dashboard (no projects) | `folder-open` | אין פרויקטים עדיין. לחץ + כדי להתחיל |
| Projects (no projects) | `folder-open` | אין פרויקטים. צור פרויקט חדש |
| Contacts (no suppliers) | `people-outline` | אין ספקים. הוסף ספק חדש |
| Debts (no debts) | `check-circle` | אין חובות פתוחים |
| Activity (no transactions) | `receipt-long` | אין פעולות עדיין |

Style: Icon in 64px `bgTertiary` circle, `textSecondary` 14px text below, optional cyan "הוסף" link.

### 6.3 Error States

- **Network/Supabase errors:** Full-screen overlay on affected section:
  - `error` colored icon (`cloud-off`, 48px)
  - Hebrew error message (from the hook's error)
  - "נסה שוב" retry button (cyan outline)
- **Form validation errors:** Red border on field (`error` at 0.3 opacity), error text below in `error` 11px
- **Delete confirmations:** Dark modal with `warning` icon, Hebrew confirmation text, two buttons: "ביטול" (gray outline) / "מחק" (red filled)

---

## 7. Animation & Transitions

| Element | Animation |
|---------|-----------|
| Carousel | Horizontal swipe with spring physics |
| FAB press | Scale 0.9 → 1.0, shadow pulse |
| FAB menu | Rise from bottom with spring, backdrop fade-in |
| FAB icon | Rotate 0° → 45° (+ to ×) |
| Screen transitions | Fade + slight slide (RTL-aware) |
| Tab switch | Cross-fade content, active dot glow |
| Cards press | Scale 0.98, border lightens |
| Toggle switch | Knob slides with spring, color transition |
| Amount cursor | Blink animation (1s loop) |
| Loading logo | Pulsing cyan glow (scale 1.0 → 1.05) |

---

## 6. Platform Considerations

### iOS
- `<BlurView>` from `expo-blur` works natively for glass card blur effects
- `shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius` for glow effects
- Safe area insets via `react-native-safe-area-context`

### Android
- `<BlurView>` fallback renders without blur — GlassCard uses solid `#1E1A35` at 0.92 opacity for visible contrast against purple gradient
- `elevation` for card depth (colored shadows not supported — accept platform difference)
- Status bar: transparent with `light-content`

### Shared
- RTL layout via `I18nManager.forceRTL(true)` (existing)
- All gradients via `<LinearGradient>` from `expo-linear-gradient` — never CSS syntax
- All blur via `<BlurView>` from `expo-blur` with platform-aware fallback
- SVG charts via `react-native-svg`

---

## 7. Migration Strategy

### theme.ts Changes
- Replace all `neu*` color tokens with new dark palette
- Replace neumorphic shadow objects with glow shadow objects
- Add gradient tokens
- Add glass tokens
- Keep spacing and radii unchanged

### New Dependencies (MANDATORY — install before any implementation)

```bash
npx expo install expo-linear-gradient expo-blur react-native-svg
```

- `expo-linear-gradient` — all gradient backgrounds (headers, buttons, avatars)
- `expo-blur` — glass card blur effects (BlurView with platform fallback)
- `react-native-svg` — sparkline charts, bar charts, SVG-based visualizations

Using `npx expo install` ensures version compatibility with Expo 54 / React Native 0.81.5.

### Migration Approach

Migrate screen-by-screen (not all-at-once) to avoid breaking all screens simultaneously:
1. Update `theme.ts` with new dark tokens alongside existing ones (dual tokens during migration)
2. Migrate screens one at a time starting with Dashboard
3. Remove old `neu*` tokens after all screens are migrated

### No Changes Required
- Navigation logic (App.tsx)
- Data hooks (useSupabaseData, useMutations)
- Data transformers
- Auth context
- Business logic

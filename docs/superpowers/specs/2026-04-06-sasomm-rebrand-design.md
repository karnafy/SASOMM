# SASOMM Rebrand — Logo + Name Only

**Date:** 2026-04-06
**Status:** Proposed (awaiting user review of this file)
**Author:** Claude (via brainstorming skill, with karnafy)

---

## Problem

The Monny app needs to be rebranded to **SASOMM**. The change is purely cosmetic — display name and logo files only — with zero changes to functionality, data model, infrastructure identifiers, or app store registration. The original `monny/` working directory must remain untouched as a historical anchor; the rebranded copy lives in a new sibling folder `SASOMM/`.

## Goals

1. Replace the visual brand identity (logo PNG files + display name strings) from "Monny"/"MONNY" to "SASOMM"
2. Preserve all functionality, layouts, themes, types, and data flows untouched
3. Preserve the existing `monny/` working directory byte-identical
4. Preserve git history in SASOMM by copying `.git` from monny

## Non-Goals

- No changes to logic, components, hooks, types, theme tokens, layouts, or animations
- No changes to app store identity (`bundleIdentifier`, `slug`, EAS `projectId`)
- No changes to deployment infrastructure (CloudPanel site user `karnaf-monny`, domain `monny.karnaf.ai`, SSH paths)
- No changes to internal package names (`@monn/mobile`, `@monn/shared`)
- No marketing website at `sasomm.com` (deferred to a separate phase)
- No tagline ("Money Between People") added as text — it lives only inside the logo image artwork
- No bundle ID change in App Store / Google Play (carries store-side implications, deferred)

---

## Scope of Changes

### 1. New folder

Create `c:\Users\User\Documents\KARNAF Coding PROJECTS\SASOMM\` as a **sibling** of `monny/`.

Contents copied from `monny/` excluding:

| Excluded | Reason |
|----------|--------|
| `node_modules/` | 330 MB; user runs `npm install` after |
| `.expo/` | Build cache |
| `dist/` | Build artifact |
| `GIBUI06.04/` | Today's safety backup |
| `28.2.26 MONNY/` | Older historical backup |
| `.superpowers/` | Tooling cache |
| `LOGO/` | Source artwork folder; only `ICON.png` is consumed by the app |

`.git/` **IS** copied → git history preserved on a single linear branch.

### 2. Asset replacement (in `SASOMM/assets/`)

| Existing file | Existing dims | Replaced with | New dims | Safety |
|---------------|---------------|---------------|----------|--------|
| `assets/logo-monny.png` | 2328×2481 (square) | `LOGO/ICON.png` | 1280×1280 (square) | ✅ square→square; app.json `icon` path unchanged |
| `assets/logo-icon.png` | 2328×2481 (square) | `LOGO/ICON.png` | 1280×1280 (square) | ✅ square→square; TopHeader forces 48×48 display; `require()` path unchanged |

Filenames preserved → **zero `require()` or path changes anywhere in code**.

The white wordmark `LOGO/LOGO SASOMM-04.png` is **not** consumed by the app — reserved for the marketing website phase.

### 3. Text replacement — 24 occurrences across 10 code files

Each edit reads the file first and replaces only the exact occurrence with surrounding context. No blind find-and-replace.

| File | Line(s) | Pattern → Replacement |
|------|---------|----------------------|
| `app.json` | 3 | `"name": "MONNY"` → `"name": "SASOMM"` |
| `components/TopHeader.tsx` | 91 | `<Text style={styles.logoText}>MONNY</Text>` → `SASOMM` |
| `components/LoadingScreen.tsx` | 61 | `<Text style={styles.title}>Monny</Text>` → `SASOMM` |
| `pages/Auth.tsx` | 127 | `<Text style={styles.logoText}>Monny</Text>` → `SASOMM` |
| `pages/Auth.tsx` | 287 | `'© 2026 MONNY. כל הזכויות שמורות.'` → `SASOMM` |
| `pages/Settings.tsx` | 313 | `MONNY {'גרסה'} 1.0.0` → `SASOMM` |
| `pages/Settings.tsx` | 333 | `'תקנון השימוש באפליקציית MONNY'` → `SASOMM` |
| `pages/Settings.tsx` | 340 | `'ברוכים הבאים לאפליקציית MONNY...'` → `SASOMM` |
| `pages/Settings.tsx` | 426 | `<Text style={styles.aboutAppName}>MONNY</Text>` → `SASOMM` |
| `pages/Settings.tsx` | 430 | `MONNY{' '}` → `SASOMM` |
| `pages/Settings.tsx` | 445 | `<Text>MONNY Team</Text>` → `SASOMM Team` |
| `pages/SupplierDetail.tsx` | 120 | `'...באפליקציית MONNY.'` → `SASOMM` |
| `pages/SupplierDetail.tsx` | 138 | `'MONNY - פניה מספק'` → `SASOMM` |
| `pages/ReportsCenter.tsx` | 85 | `*דו"ח סיכום - MONNY*` → `SASOMM` |
| `pages/ReportsCenter.tsx` | 95 | `_הופק על ידי MONNY_` → `SASOMM` |
| `pages/ReportsCenter.tsx` | 97 | `*דו"ח פרויקטים - MONNY*` → `SASOMM` |
| `pages/ReportsCenter.tsx` | 108 | `_הופק על ידי MONNY_` → `SASOMM` |
| `pages/ReportsCenter.tsx` | 112 | `*דו"ח ספקים - MONNY*` → `SASOMM` |
| `pages/ReportsCenter.tsx` | 134 | `_הופק על ידי MONNY_` → `SASOMM` |
| `pages/ProjectDetail.tsx` | 551 | `דוח זה הופק על ידי MONNY` → `SASOMM` |
| `pages/ActivityDetail.tsx` | 72 | `*פרטי תשלום מ-MONNY*` → `SASOMM` |
| `pages/ActivityDetail.tsx` | 80 | `_נשלח מאפליקציית MONNY_` → `SASOMM` |
| `pages/ActivityDetail.tsx` | 125 | `_הופק מאפליקציית MONNY_` → `SASOMM` |
| `pages/PersonalArea.tsx` | 192 | `Alert.alert('MONNY v1.0', ...)` → `SASOMM v1.0` |

### 4. Documentation prose updates

Replace "Monny" / "MONNY" in human prose. **Keep `monny` lowercase in paths, identifiers, and code blocks.**

| File | Update rule |
|------|-------------|
| `CLAUDE.md` | "Monny is a..." → "SASOMM is a...". Folder paths like `monny/` stay. |
| `requirements.md` | Same rule. Headers, prose, examples — yes. Identifiers — no. |
| `.claude/agents/requirements-reader.md` | "Monny project" → "SASOMM project". |

---

## Explicitly NOT Changed

| Item | Reason for not changing |
|------|------------------------|
| `app.json` `slug: "monny"` | Linked to EAS `projectId` — would orphan the cloud project |
| `app.json` `bundleIdentifier: "com.monny.app"` | Changing = new app in App Store, lost installs/reviews/push tokens |
| `app.json` `android.package: "com.monny.app"` | Same risk for Google Play |
| `app.json` `extra.eas.projectId` | Cloud infrastructure identifier |
| `package.json` `name: "@monn/mobile"` | Internal-only, not user-visible |
| `shared/package.json` `@monn/shared` | Same |
| `eas.json` | Cloud build infrastructure |
| `theme.ts` (colors, fonts, spacing, gradients) | "Don't change anything except logo and name" |
| All hooks, transformers, types in `shared/` | Untouched logic |
| All page logic in `pages/` (except text strings above) | Untouched |
| All component logic in `components/` (except text strings above) | Untouched |
| Supabase tables, schemas, policies | DB unchanged |
| Original `monny/` folder | Acts as historical anchor — zero edits |
| `.claude/settings*.json` deployment paths still containing "monny" | Infrastructure paths, separate concern |
| Folder name `monny/` itself | Separate decision — affects IDE, git remotes, settings paths |
| `28.2.26 MONNY/`, `GIBUI06.04/` historical backups | Frozen on purpose |

---

## Acceptance Criteria

1. **SASOMM/ exists** at `c:\Users\User\Documents\KARNAF Coding PROJECTS\SASOMM\`
2. **Git history preserved**: `cd SASOMM && git log --oneline | head -5` shows the same recent commits as `monny/` (e.g., `006683e feat: unify summary layout...`)
3. **Logo files swapped**: `SASOMM/assets/logo-monny.png` and `SASOMM/assets/logo-icon.png` are byte-identical to `monny/LOGO/ICON.png`
4. **No `MONNY`/`Monny` strings remain** in active SASOMM code:
   - `grep -rn "MONNY\|Monny" SASOMM/{App.tsx,app.json,pages,components,shared}` returns zero matches
   - (lowercase `monny` in identifiers/paths is fine and expected)
5. **`monny/` is byte-identical** to its state at the start of this task — confirmed by `git status` showing the same dirty/clean state as before, and no new modifications to tracked files
6. **Documentation updated**: `CLAUDE.md`, `requirements.md`, `.claude/agents/requirements-reader.md` in SASOMM/ have prose-level "Monny" → "SASOMM" replacements; paths and code blocks unchanged
7. **Self-check report** delivered listing every file changed with line counts

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| `.git` copy duplicates the repo identity — pushing from both folders to the same remote causes conflict | User should treat SASOMM/ as a fresh repo. Either delete monny/ later, or re-init the SASOMM remote to a different repo. Documented in execution report. |
| `node_modules` not copied — SASOMM/ won't run until `npm install` | Documented in execution report. User runs install once. |
| Bundle ID stays `com.monny.app` — when SASOMM is built and submitted to stores, it appears under that ID | Intentional to preserve store identity. Future store rename = separate decision with store-side implications. |
| Backup folders `28.2.26 MONNY/` and `GIBUI06.04/` are excluded — SASOMM/ has no historical backups inside it | This is correct: SASOMM/ is a fresh start. Old backups remain accessible inside `monny/`. |
| Hardcoded paths in `.claude/settings*.json` reference `monny` deployment | Infrastructure stays pointing at the monny CloudPanel site for now. SASOMM site setup is a separate phase. |

---

## Execution Order

1. Pre-flight check: confirm `monny/LOGO/ICON.png` exists, confirm sibling folder doesn't already exist
2. Create `SASOMM/` via `robocopy` excluding heavy/backup folders, including `.git`
3. Verify copy: count files, confirm `.git` and `App.tsx` exist, confirm sizes are reasonable
4. Asset swap: copy `SASOMM/LOGO/ICON.png` over both `SASOMM/assets/logo-*.png` files
5. Text replacements: 24 edits across 10 code files (each: read file, edit specific occurrence)
6. Doc edits: 3 documentation files (prose only)
7. Verification:
   - `grep -rn "MONNY\|Monny" SASOMM/{pages,components,shared,App.tsx,app.json}` → expect zero matches
   - File counts and sizes report
   - `monny/` `git status` comparison: confirm zero new modifications
8. Final report to user with full change list and next-step instructions (`npm install` + `npx expo start`)

---

## Out of Scope (Future Phases)

- **Marketing website** at `sasomm.com` — WordPress on CloudPanel, separate brainstorming session needed
- **Bundle ID rename** in App Store / Google Play — store-side implications
- **Deletion of `monny/`** after SASOMM/ is verified working — user decision
- **Database/Supabase project rename** — would break the existing app installation
- **Folder rename** of `monny/` itself — IDE/path/git impacts

---

## Spec Self-Review Checklist

- [x] No "TBD"/"TODO"/incomplete sections
- [x] Internal consistency: acceptance criteria match scope of changes
- [x] Scope check: single coherent task, focused on one rebrand operation
- [x] Ambiguity check: every change is enumerated with file + line; every "not changed" item explains why
- [x] Reversibility: zero edits to monny/ means rollback is `rm -rf SASOMM/`
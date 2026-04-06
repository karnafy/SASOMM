# SASOMM Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a sibling folder `SASOMM/` containing a rebranded copy of `monny/` with logo files and display name strings replaced from "Monny"/"MONNY" to "SASOMM", leaving `monny/` byte-identical.

**Architecture:** File copy via robocopy (preserving `.git`), in-place asset overwrite of 2 PNG files, then 24 surgical text edits across 10 code files plus 3 doc files in the new SASOMM/ folder. No logic, no types, no infrastructure changes.

**Tech Stack:** Windows robocopy, Bash, Read/Edit/Write tools, grep verification.

**Spec:** [docs/superpowers/specs/2026-04-06-sasomm-rebrand-design.md](../specs/2026-04-06-sasomm-rebrand-design.md)

---

## File Structure

**Created (top level):**
- `c:\Users\User\Documents\KARNAF Coding PROJECTS\SASOMM\` (sibling of `monny/`)

**Asset files written in SASOMM/:**
- `SASOMM/assets/logo-monny.png` (overwritten with `LOGO/ICON.png` content)
- `SASOMM/assets/logo-icon.png` (overwritten with `LOGO/ICON.png` content)

**Code files modified in SASOMM/ (10):**
- `app.json`
- `components/TopHeader.tsx`
- `components/LoadingScreen.tsx`
- `pages/Auth.tsx`
- `pages/Settings.tsx`
- `pages/SupplierDetail.tsx`
- `pages/ReportsCenter.tsx`
- `pages/ProjectDetail.tsx`
- `pages/ActivityDetail.tsx`
- `pages/PersonalArea.tsx`

**Doc files modified in SASOMM/ (3):**
- `CLAUDE.md`
- `requirements.md`
- `.claude/agents/requirements-reader.md`

**Untouched:** Original `monny/` folder (zero modifications).

---

## Task 1: Pre-flight checks and folder creation

**Files:**
- Read: `c:\Users\User\Documents\KARNAF Coding PROJECTS\monny\LOGO\ICON.png` (verify exists)
- Create: `c:\Users\User\Documents\KARNAF Coding PROJECTS\SASOMM\` (entire tree)

- [ ] **Step 1.1: Verify ICON.png exists and SASOMM/ does not exist yet**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS"
[ -f "monny/LOGO/ICON.png" ] && echo "ICON_OK" || echo "ICON_MISSING"
[ -d "SASOMM" ] && echo "SASOMM_ALREADY_EXISTS_ABORT" || echo "SASOMM_FREE"
```

Expected output: `ICON_OK` and `SASOMM_FREE`. If either fails, ABORT and report.

- [ ] **Step 1.2: Snapshot monny/ git status for end-state comparison**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS/monny"
git status --porcelain | sort > /tmp/monny-status-before.txt
wc -l /tmp/monny-status-before.txt
```

Save the line count for later comparison.

- [ ] **Step 1.3: Create SASOMM/ via robocopy with exclusions**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS"
MSYS_NO_PATHCONV=1 robocopy monny SASOMM /E /XD node_modules .expo dist GIBUI06.04 "28.2.26 MONNY" .superpowers /NFL /NDL /NJH /R:1 /W:1
echo "robocopy_exit=$?"
```

Expected: `robocopy_exit=1` or `robocopy_exit=3` (both = success in robocopy). Anything ≥ 8 = failure → ABORT.

- [ ] **Step 1.4: Verify SASOMM/ structure**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM"
[ -f "App.tsx" ] && echo "App.tsx OK" || echo "MISSING App.tsx"
[ -d ".git" ] && echo ".git OK" || echo "MISSING .git"
[ -d "pages" ] && echo "pages OK" || echo "MISSING pages"
[ -d "shared" ] && echo "shared OK" || echo "MISSING shared"
[ -f "LOGO/ICON.png" ] && echo "LOGO/ICON.png OK" || echo "MISSING LOGO"
[ ! -d "node_modules" ] && echo "node_modules excluded OK" || echo "node_modules NOT EXCLUDED"
git log --oneline | head -3
du -sh .
```

Expected: All `OK`, git log shows recent monny commits, size ~35 MB.

---

## Task 2: Asset replacement (2 PNG files)

**Files:**
- Modify: `SASOMM/assets/logo-monny.png` (overwritten)
- Modify: `SASOMM/assets/logo-icon.png` (overwritten)

- [ ] **Step 2.1: Copy LOGO/ICON.png over both asset files**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM"
cp "LOGO/ICON.png" "assets/logo-monny.png"
cp "LOGO/ICON.png" "assets/logo-icon.png"
```

- [ ] **Step 2.2: Verify both assets are byte-identical to LOGO/ICON.png**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM"
md5sum "LOGO/ICON.png" "assets/logo-monny.png" "assets/logo-icon.png"
```

Expected: All three checksums match.

---

## Task 3: Edit app.json

**Files:**
- Modify: `SASOMM/app.json:3`

- [ ] **Step 3.1: Read app.json**

Use Read tool on `c:\Users\User\Documents\KARNAF Coding PROJECTS\SASOMM\app.json`.

- [ ] **Step 3.2: Replace `"name": "MONNY"` with `"name": "SASOMM"`**

Edit:
- `old_string`: `    "name": "MONNY",`
- `new_string`: `    "name": "SASOMM",`

---

## Task 4: Edit components/TopHeader.tsx

**Files:**
- Modify: `SASOMM/components/TopHeader.tsx:91`

- [ ] **Step 4.1: Read TopHeader.tsx**

- [ ] **Step 4.2: Replace logoText**

Edit:
- `old_string`: `          <Text style={styles.logoText}>MONNY</Text>`
- `new_string`: `          <Text style={styles.logoText}>SASOMM</Text>`

---

## Task 5: Edit components/LoadingScreen.tsx

**Files:**
- Modify: `SASOMM/components/LoadingScreen.tsx:61`

- [ ] **Step 5.1: Read LoadingScreen.tsx**

- [ ] **Step 5.2: Replace title text**

Edit:
- `old_string`: `        <Text style={styles.title}>Monny</Text>`
- `new_string`: `        <Text style={styles.title}>SASOMM</Text>`

---

## Task 6: Edit pages/Auth.tsx

**Files:**
- Modify: `SASOMM/pages/Auth.tsx:127`
- Modify: `SASOMM/pages/Auth.tsx:287`

- [ ] **Step 6.1: Read Auth.tsx**

- [ ] **Step 6.2: Replace logoText**

Edit:
- `old_string`: `            <Text style={styles.logoText}>Monny</Text>`
- `new_string`: `            <Text style={styles.logoText}>SASOMM</Text>`

- [ ] **Step 6.3: Replace footer copyright**

Edit:
- `old_string`: `            {'\© 2026 MONNY. כל הזכויות שמורות.'}`
- `new_string`: `            {'\© 2026 SASOMM. כל הזכויות שמורות.'}`

---

## Task 7: Edit pages/Settings.tsx (6 occurrences)

**Files:**
- Modify: `SASOMM/pages/Settings.tsx` (lines 313, 333, 340, 426, 430, 445)

- [ ] **Step 7.1: Read Settings.tsx (verify all 6 MONNY occurrences are brand-text only)**

Read the relevant lines around 310-450 to confirm no MONNY appears outside brand text contexts.

- [ ] **Step 7.2: Use replace_all on MONNY → SASOMM (safe because all 6 are brand text)**

Edit with `replace_all: true`:
- `old_string`: `MONNY`
- `new_string`: `SASOMM`

- [ ] **Step 7.3: Verify**

```bash
grep -n "MONNY\|Monny" "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM/pages/Settings.tsx"
```

Expected: zero output.

---

## Task 8: Edit pages/SupplierDetail.tsx (2 occurrences)

**Files:**
- Modify: `SASOMM/pages/SupplierDetail.tsx` (lines 120, 138)

- [ ] **Step 8.1: Read SupplierDetail.tsx (verify both MONNY are in brand-text strings)**

- [ ] **Step 8.2: Use replace_all on MONNY → SASOMM**

Edit with `replace_all: true`:
- `old_string`: `MONNY`
- `new_string`: `SASOMM`

- [ ] **Step 8.3: Verify**

```bash
grep -n "MONNY\|Monny" "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM/pages/SupplierDetail.tsx"
```

Expected: zero output.

---

## Task 9: Edit pages/ReportsCenter.tsx (6 occurrences)

**Files:**
- Modify: `SASOMM/pages/ReportsCenter.tsx` (lines 85, 95, 97, 108, 112, 134)

- [ ] **Step 9.1: Read ReportsCenter.tsx (verify all 6 MONNY are in report header/footer text)**

- [ ] **Step 9.2: Use replace_all on MONNY → SASOMM**

Edit with `replace_all: true`:
- `old_string`: `MONNY`
- `new_string`: `SASOMM`

- [ ] **Step 9.3: Verify**

```bash
grep -n "MONNY\|Monny" "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM/pages/ReportsCenter.tsx"
```

Expected: zero output.

---

## Task 10: Edit pages/ProjectDetail.tsx (1 occurrence)

**Files:**
- Modify: `SASOMM/pages/ProjectDetail.tsx:551`

- [ ] **Step 10.1: Read ProjectDetail.tsx around line 551**

- [ ] **Step 10.2: Replace report attribution**

Edit:
- `old_string`: `              <p>דוח זה הופק על ידי MONNY - ניהול פיננסי חכם</p>`
- `new_string`: `              <p>דוח זה הופק על ידי SASOMM - ניהול פיננסי חכם</p>`

---

## Task 11: Edit pages/ActivityDetail.tsx (3 occurrences)

**Files:**
- Modify: `SASOMM/pages/ActivityDetail.tsx` (lines 72, 80, 125)

- [ ] **Step 11.1: Read ActivityDetail.tsx (verify all 3 MONNY are share-template strings)**

- [ ] **Step 11.2: Use replace_all on MONNY → SASOMM**

Edit with `replace_all: true`:
- `old_string`: `MONNY`
- `new_string`: `SASOMM`

- [ ] **Step 11.3: Verify**

```bash
grep -n "MONNY\|Monny" "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM/pages/ActivityDetail.tsx"
```

Expected: zero output.

---

## Task 12: Edit pages/PersonalArea.tsx (1 occurrence)

**Files:**
- Modify: `SASOMM/pages/PersonalArea.tsx:192`

- [ ] **Step 12.1: Read PersonalArea.tsx around line 192**

- [ ] **Step 12.2: Replace alert title**

Edit:
- `old_string`: `      onPress: () => Alert.alert('MONNY v1.0', 'ניהול פיננסי חכם'),`
- `new_string`: `      onPress: () => Alert.alert('SASOMM v1.0', 'ניהול פיננסי חכם'),`

---

## Task 13: Documentation prose updates (3 files)

**Files:**
- Modify: `SASOMM/CLAUDE.md`
- Modify: `SASOMM/requirements.md`
- Modify: `SASOMM/.claude/agents/requirements-reader.md`

**Rule:** Replace "Monny" / "MONNY" only in human prose. Keep `monny` lowercase in paths, identifiers, code blocks, file references.

- [ ] **Step 13.1: Read CLAUDE.md and find all Monny/MONNY occurrences**

Use Grep with `-n` mode on the file to enumerate exact line locations.

- [ ] **Step 13.2: Edit each prose occurrence in CLAUDE.md individually**

For each match: read context, distinguish prose vs code block / path, edit only prose. Lowercase `monny/` in paths must stay.

- [ ] **Step 13.3: Verify CLAUDE.md still has lowercase `monny` in paths**

```bash
grep -c "monny" "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM/CLAUDE.md"
grep -c "Monny\|MONNY" "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM/CLAUDE.md"
```

Expected: lowercase count > 0 (paths preserved); capitalized count = 0 (prose replaced).

- [ ] **Step 13.4: Repeat steps 13.1–13.3 for requirements.md**

- [ ] **Step 13.5: Repeat steps 13.1–13.3 for .claude/agents/requirements-reader.md**

---

## Task 14: Final verification, commit, and report

**Files:**
- Read-only: entire `SASOMM/` and `monny/`

- [ ] **Step 14.1: Verify zero MONNY/Monny in active SASOMM code**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM"
grep -rn "MONNY\|Monny" App.tsx app.json pages components shared 2>/dev/null
```

Expected: zero output. If any matches → fix before proceeding.

- [ ] **Step 14.2: Verify lowercase `monny` is preserved in identifiers/paths**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM"
grep -n '"monny"\|com\.monny\|@monn/' app.json package.json shared/package.json 2>/dev/null
```

Expected: still finds `"slug": "monny"`, `"com.monny.app"`, `"@monn/mobile"`, `"@monn/shared"`. These must NOT have changed.

- [ ] **Step 14.3: Verify monny/ is byte-identical to its starting state**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS/monny"
git status --porcelain | sort > /tmp/monny-status-after.txt
diff /tmp/monny-status-before.txt /tmp/monny-status-after.txt && echo "MONNY UNTOUCHED OK" || echo "MONNY MODIFIED - INVESTIGATE"
```

Expected: `MONNY UNTOUCHED OK`. If diff shows changes → investigate immediately.

- [ ] **Step 14.4: Verify asset files**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM"
md5sum LOGO/ICON.png assets/logo-monny.png assets/logo-icon.png
```

Expected: all three checksums identical.

- [ ] **Step 14.5: Commit the rebrand in SASOMM/**

```bash
cd "c:/Users/User/Documents/KARNAF Coding PROJECTS/SASOMM"
git add -A
git status --short
git commit -m "feat: rebrand Monny to SASOMM (logo + display name only)

- Replace assets/logo-monny.png and assets/logo-icon.png with LOGO/ICON.png
- Replace MONNY/Monny brand text in 10 code files (24 occurrences)
- Update prose in CLAUDE.md, requirements.md, requirements-reader.md
- Preserve all logic, types, theme, slug, bundleId, package names, EAS projectId"
git log --oneline | head -3
```

Expected: new commit appears at top, followed by the original monny history.

- [ ] **Step 14.6: Generate final summary report**

Output to user:
- SASOMM/ created at exact path
- File counts: total files, code edits, doc edits, asset swaps
- Confirmation that monny/ is untouched
- Next steps for user: `cd SASOMM && npm install && npx expo start`

---

## Self-Review Checklist

- [x] **Spec coverage:** Every section of the spec maps to at least one task. Asset replacement → Task 2. 24 text edits across 10 code files → Tasks 3–12. 3 doc files → Task 13. Acceptance criteria #1–7 → Task 14.
- [x] **Placeholder scan:** No "TBD", "TODO", "fill in details", or vague steps. Every Edit step shows `old_string` and `new_string` exactly.
- [x] **Type consistency:** N/A — no type definitions in this plan. Variable names and identifiers preserved exactly from spec.
- [x] **Reversibility:** Plan can be aborted at any task. Rollback = `rm -rf SASOMM/` (Task 14.3 confirms monny/ untouched).
- [x] **No assumptions:** Every command uses absolute paths or explicit `cd`. Every Edit shows exact strings as found via grep.

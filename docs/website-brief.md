# SASOMM Marketing Website — Brief & Context

> **For Claude Code (fresh session):** This brief defines a SEPARATE task — building a marketing/brand website at `sasomm.com`. It is NOT about editing the SASOMM mobile app code in this repo. Read this file fully before responding to the user.

---

## 1. What SASOMM is

A Hebrew RTL personal/project expense management mobile app (React Native + Expo + Supabase).

- **Recently rebranded** from "Monny" — see commit `9cee4ea feat: rebrand Monny to SASOMM` and `docs/superpowers/specs/2026-04-06-sasomm-rebrand-design.md` for the rebrand history.
- **Brand identity:** purple `$` symbol logo, tagline "Money Between People".
- **Target users:** Hebrew-speaking freelancers, small business owners, contractors managing project budgets and expenses.
- **Core features:** project budgets, expenses/income tracking, suppliers, debts, multi-currency (ILS / USD / EUR), WhatsApp-formatted reports, receipt photos.
- **Mobile app status:** active development. Currently deployed to `monny.karnaf.ai` as Expo Web (separate, unrelated to the site we're building).

For full product details, read `requirements.md` in this same repo.

---

## 2. The website task

Build a **marketing / brand website** at `sasomm.com` whose only job is to:

1. Showcase the SASOMM mobile app visually
2. Explain what the app does and who it's for (in Hebrew)
3. Direct visitors to download (Google Play / App Store / Web app at monny.karnaf.ai)
4. Establish a public brand presence under sasomm.com

**This is NOT:**
- A web version of the mobile app
- A dashboard for existing app users
- A SaaS product
- An e-commerce store

It is a content-driven brochure site. Static-feeling. A few pages or a long single-page.

---

## 3. Known infrastructure constraints (locked in — do not re-litigate)

| Item | Value |
|------|-------|
| Domain | `sasomm.com` (registered at Namecheap, account: KarnafSTUDIO) |
| Hosting | CloudPanel on dedicated server |
| Server IP | `38.242.155.146` |
| SSH user | `karnafstudio` (ask user for credentials when needed) |
| Existing site on same server (UNRELATED) | `monny.karnaf.ai` — site user `karnaf-monny`, do NOT touch |
| Stack | **WordPress** (locked in by user — do not propose Next.js, Astro, Gatsby, etc.) |
| New CloudPanel site user | suggest `sasomm` (separate from `karnaf-monny`) |

---

## 4. Current DNS state at Namecheap (broken — needs fixing)

`sasomm.com` currently has these records (verified by user via screenshot):

| Type | Host | Value | Status |
|------|------|-------|--------|
| CNAME | www | parkingpage.namecheap.com. | ❌ delete |
| TXT | default._domainkey | v=DKIM1;k=rsa;p=... | ✅ keep (DKIM) |
| URL Redirect | @ | http://www.sasomm.com/ | ❌ delete (circular) |

**Missing:** A record pointing `@` and `www` to `38.242.155.146`.

The user will need to add at Namecheap (you guide them):

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 38.242.155.146 | Automatic |
| A (or CNAME) | www | 38.242.155.146 (or `sasomm.com`) | Automatic |

DNS propagation: usually 15 min – 2 hours. SSL (Let's Encrypt) cannot be issued until DNS resolves.

---

## 5. Available brand assets (all in `LOGO/` folder of this repo)

| File | Description | Best use |
|------|-------------|----------|
| `LOGO/ICON.png` | Purple `$` symbol, square 1280×1280, transparent bg | Favicon, app icon, social profile |
| `LOGO/LOGO SASOMM-01.png` | Wordmark `$A$OMM` purple + "Money Between People" tagline, 842×596 | Hero on light bg, about section |
| `LOGO/LOGO SASOMM-02.png` | Wordmark only, purple, transparent | Header logo on light bg |
| `LOGO/LOGO SASOMM-03.png` | Wordmark white-on-black | Hero on dark bg, social card |
| `LOGO/LOGO SASOMM-04.png` | Wordmark **white** on transparent | **Header logo on dark bg ← most likely needed** |
| `LOGO/LOGO SASOMM-05.png` | Wordmark + tagline, square | OG image / social sharing |
| `LOGO/LOGO SASOMM-06.png` | `$` symbol only, square (same as ICON.png) | Alternate icon |
| `LOGO/LOGO SASOMM.ai` | Adobe Illustrator master file | Source — for new variants |

---

## 6. Brand colors (from `theme.ts` of this repo)

| Token | Hex | Role |
|-------|-----|------|
| accent (brand purple) | `#6B5B7B` | Logo color — primary brand identifier |
| primary | `#00D9D9` | CTAs, links, accents (cyan) |
| primaryDark | `#0891B2` | Hover/pressed CTA |
| success | `#10B981` | Positive states |
| warning | `#F59E0B` | Warnings |
| error | `#EF4444` | Errors |

**Important:** The mobile app uses a **dark fintech aesthetic** (recent redesign — see commits `e938609`, `697b302`, `7c42f7a`, `d2ee6ef`). The website should match or complement this dark, modern, fintech feel — not the older neumorphic light theme that's still mentioned in `requirements.md` (the requirements doc lags behind the dark redesign).

When in doubt about the current visual direction, look at `theme.ts` and the actual rendered app, not the docs.

---

## 7. Mobile app screens you may want to screenshot for the website

Located in `pages/`:

| Screen | What it shows |
|--------|---------------|
| `Dashboard.tsx` | Totals, financial summary, recent activity, currency switcher, mini charts |
| `Projects.tsx` | Project cards with budget progress bars |
| `ProjectDetail.tsx` | Single project: budget, expenses, incomes, notes, reports |
| `AddExpense.tsx` | Receipt upload, category, supplier picker |
| `Contacts.tsx` | Suppliers list with credit/debt status |
| `Debts.tsx` | Debt tracking with reminders |
| `ReportsCenter.tsx` | Analytics + WhatsApp report exports |

User should run the app (after `npm install && npx expo start`) and take screenshots in dark theme.

---

## 8. Workflow you must follow

### Phase 1: Bootstrap context (5 minutes)

Read these files in order:

1. `docs/website-brief.md` (this file)
2. `CLAUDE.md` — project overview
3. `requirements.md` — full app spec (note: light theme references are stale)
4. `theme.ts` — current design tokens
5. `docs/superpowers/specs/2026-04-06-sasomm-rebrand-design.md` — rebrand context

### Phase 2: Brainstorming (mandatory before any implementation)

Use `superpowers:brainstorming` skill. Ask the user **one question at a time** to extract:

1. **Tone & personality:** corporate finance / playful fintech / minimal Apple-ish / bold Revolut-ish?
2. **Site structure:** single long landing page, or multi-page (Home / Features / About / Contact)?
3. **Content priorities:** which is the #1 message above the fold?
4. **Languages:** Hebrew only, or also English?
5. **Download targets:** which app stores will the CTAs link to? (Android already? iOS? Web app at monny.karnaf.ai?)
6. **Pricing:** is the app free / freemium / paid? Do we mention pricing on the site?
7. **Social proof:** any existing testimonials, user count, or screenshots?
8. **Inspiration sites:** any Hebrew or English fintech sites the user wants to mimic?
9. **Pages required:** must-have vs nice-to-have list (About, FAQ, Blog, Contact, Privacy, Terms?)
10. **Contact:** form? email? WhatsApp? phone?
11. **Analytics:** Google Analytics, Plausible, none?
12. **Timeline:** urgent or relaxed?

Then propose 2-3 high-level approaches (e.g., "single-page minimal", "3-page brochure", "5-page with blog") with tradeoffs, present a design, get approval, and write the spec to `docs/superpowers/specs/`.

### Phase 3: Infrastructure prerequisites (parallel to Phase 2)

While brainstorming content, walk the user through these infra steps:

#### 3a. Fix DNS at Namecheap
- Delete the CNAME `www → parkingpage.namecheap.com.`
- Delete the URL Redirect `@ → http://www.sasomm.com/`
- Add A record `@` → `38.242.155.146`
- Add A record `www` → `38.242.155.146`
- Verify propagation: `nslookup sasomm.com` should return the server IP

#### 3b. CloudPanel WordPress site creation
- User logs in to CloudPanel admin (typical URL: `https://38.242.155.146:8443`)
- Add new site → WordPress
- Domain: `sasomm.com`
- Site user: `sasomm` (new, distinct from `karnaf-monny`)
- Generate strong DB credentials
- PHP 8.2+
- Wait for install
- Issue Let's Encrypt SSL after DNS propagates

#### 3c. WordPress initial setup
- Site language: Hebrew (he_IL)
- Timezone: Asia/Jerusalem
- Theme: recommend Astra, Kadence, Neve, or GeneratePress (free, fast, RTL-ready) — let user choose
- Plugins (minimal):
  - Page builder of user's choice (Elementor / Bricks / native Gutenberg blocks)
  - SEO: RankMath or Yoast
  - Caching: WP Super Cache or LiteSpeed Cache
  - Security: Wordfence or Solid Security
  - Hebrew/RTL: usually built into modern themes
- Configure RTL display
- Delete sample content

### Phase 4: Build (only after brainstorming spec is approved)

- Use `superpowers:writing-plans` to break the build into tasks
- Build pages iteratively
- Get user feedback per page/section
- Use assets from `LOGO/` directly
- Test mobile responsive
- Verify Hebrew RTL renders correctly
- Target: Lighthouse mobile 90+, LCP < 2.5s

### Phase 5: Deploy + verify

- WordPress is already hosted, so "deploy" = publish in WP admin
- Verify `https://sasomm.com` returns 200 with valid SSL
- Test from incognito + mobile device
- Submit sitemap to Google Search Console
- Verify the existing `monny.karnaf.ai` site is unaffected

---

## 9. Hard constraints — do NOT do these

| ❌ Don't | Why |
|----------|-----|
| Modify the React Native mobile app code (`pages/`, `components/`, `shared/`, `App.tsx`, `theme.ts`) | Out of scope. The website is separate. |
| Change `app.json`, `package.json`, `eas.json`, or any mobile build config | Out of scope. |
| Touch the existing `monny.karnaf.ai` site or its CloudPanel user `karnaf-monny` | Unrelated, must stay up. |
| Use Next.js, Gatsby, Astro, Hugo, Jekyll, or any non-WordPress stack | WordPress is locked in by user decision. |
| Build a SaaS / web app / dashboard | Brand site only. |
| Rename the project folder, change git remotes, or create new repos without explicit user permission | The user owns git decisions. |
| Push, deploy, or take any infrastructure action without explicit user confirmation | Production safety. |
| Re-litigate decisions already made in this brief | Saves time. |

---

## 10. Success criteria

1. ✅ `https://sasomm.com` returns a working WordPress site with valid Let's Encrypt SSL
2. ✅ Site is in Hebrew RTL, mobile-responsive
3. ✅ Brand-consistent: uses `LOGO/ICON.png` for favicon, brand purple `#6B5B7B` somewhere prominent, dark fintech aesthetic
4. ✅ Includes at minimum: hero section, "what is SASOMM" explanation, screenshots from the app, download CTAs (or "coming soon" with email signup), contact info
5. ✅ Lighthouse mobile score ≥ 90
6. ✅ No regressions to `monny.karnaf.ai`
7. ✅ User has WordPress admin access and knows how to edit content
8. ✅ This file (`docs/website-brief.md`) is referenced from the spec/plan that get created

---

## 11. Open questions Claude Code should expect to ask the user

These are NOT yet decided. Brainstorm with the user to nail them down:

- App store status: are SASOMM's Android/iOS apps published yet, or "coming soon"?
- Pricing: free, freemium, paid?
- Tagline: "Money Between People" — is this the public tagline or just a brand internal phrase?
- Brand voice: Hebrew formal / casual / playful / professional?
- Should the website include a blog?
- Email signups / newsletter?
- Social media: does SASOMM have Instagram / X / LinkedIn / Facebook? Footer links?
- Legal: privacy policy, terms of service — do they exist or need writing?
- Accessibility level: WCAG AA target?
- Multi-language: Hebrew only, or Hebrew + English toggle?

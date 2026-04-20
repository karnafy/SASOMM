# SASOMM Marketing Website — Project State

**Last updated:** 2026-04-06
**Phase:** Brainstorming (context gathering)

---

## Folder structure

```
WEBSITE/
├── STATE.md                  # This file — project tracker
├── references/
│   ├── stitch/               # Stitch AI wireframes + DESIGN.md
│   │   ├── sasomm_deep_velvet/DESIGN.md
│   │   ├── sasomm_updated_wireframes_1/
│   │   └── sasomm_updated_wireframes_2/
│   └── app-screens/          # Actual app screenshots for mockups
│       ├── dashboard.png     # TODO: user to drop Dashboard screenshot here
│       └── insights.png      # TODO: user to drop Insights screenshot here
├── specs/                    # Design specs (to be written)
├── content/                  # Hebrew copy for pages (to be written)
└── assets/                   # Logos, images used in the site build
```

---

## Required pages (from user screenshot — Apple App Store compliance driver)

1. **Home** — landing page with SASOMM pitch
2. **Privacy Policy** — required by Apple
3. **Terms of Use** — recommended
4. **Contact** — support email

## Target audience (from user direction)

- **Primary:** Home renovation contractors and homeowners managing multi-payment projects
- **Use case:** Track the many informal cash / bank transfers that flow between people during a renovation
- **Tagline is literal:** "Money Between People" = physical handoffs in living rooms, not a metaphor
- **Tone:** Warm, daily-life, relatable — NOT corporate fintech

## Brand presence principles (from user)

**"The logo should be present and large, but not shouting."**

Concrete rules:
- Logo gets real estate and breathing room — generous negative space around it
- Soft contrast, not max contrast (`#EBDCFF` on `#180D2C`, not pure `#FFF` on pure `#000`)
- No glow, no animation, no shiny effects on the logo itself
- Stable typography weight (bold, not extra-bold 900)
- Asymmetric placement in hero — not dead-centered
- Logo is the primary visual anchor but viewer's eye flows through the composition, not stuck on it

**Do:** Apple-style product page wordmarks (huge, elegant, spacious)
**Don't:** "Buy now!!!" carnival hero with shouting CTAs

---

## Infrastructure (locked in from website-brief.md)

| Item | Value |
|------|-------|
| Domain | sasomm.com (Namecheap, KarnafSTUDIO) |
| Hosting | CloudPanel, IP 38.242.155.146 |
| Stack | WordPress |
| Existing sibling | monny.karnaf.ai (untouchable) |

---

## Brand colors — reconciled

**Source of truth is the mobile app (`theme.ts`), not the Stitch DESIGN.md.**

| Role | Actual app | Stitch proposal | Decision |
|------|------------|-----------------|----------|
| Primary action / highlight | Cyan `#00D9D9` | Mint `#49df9f` | **PENDING** — needs user decision |
| Brand purple / logo | `#8B6BAB` (accent) | Purple `#6B2FA0` gradient | Aligned |
| Background base | `#0D0B1A` (deep plum-black) | `#130827` / `#180d2c` | Close enough, pick one |
| Text primary | `#FFFFFF` | `#ebdcff` | Pick one |

---

## Content references collected

### App screens (confirmed for website use)

| # | Screen | Website role | Website headline (proposed) | Source |
|---|--------|--------------|----------------------------|--------|
| 4 | **Project (שיפוץ הרצליה)** | **🔒 HERO MOCKUP** | *TBD — see narrative framework* | User screenshot 4 |
| 1 | Dashboard | Feature card 1 | הכל ביד אחת | User screenshot 1 |
| 2 | Insights | Feature card 2 | להבין לאן הולך הכסף | User screenshot 2 |
| 3 | Debts (חייבים לי) | Feature card 3 | לא לשכוח מי חייב למי | User screenshot 3 |

**Strategic shift:** The hero mockup is the **Project Detail screen** (שיפוץ הרצליה), not the Dashboard. Reason: it shows the user *their own life* inside the app (authentic project name "שיפוץ הרצליה", realistic ₪100K budget, supplier tracking, activity log with photos) — exactly the renovation contractor / homeowner persona we're targeting.

Dashboard/Insights/Debts become the 3 feature cards below the hero, each telling one pillar of the value prop.

### Proposed narrative architecture (v1 — subject to brainstorming)

```
Hero:
  Headline:  "ניהול שיפוץ זה בלאגן. SASOMM עושה את זה פשוט."
  Mockup:    Project detail (שיפוץ הרצליה)
  CTAs:      Google Play / App Store / Coming Soon

Features (3-col):
  1. [Dashboard]  הכל ביד אחת
  2. [Insights]   להבין לאן הולך הכסף
  3. [Debts]      לא לשכוח מי חייב למי

Lifestyle section:
  Photo:     Homeowner + contractor in front of renovated home
  Copy:      "זה לא רק אפליקציה. זה שקט נפשי באמצע הכאוס."

Download CTAs:
  App Store / Google Play / Web app

Footer:
  Privacy / Terms / Contact / © 2026 SASOMM
```

### Logo assets (in `LOGO/` folder)

**🔒 LOCKED: `LOGO SASOMM-04.png` is THE canonical website logo.**

- "$A$OMM" wordmark where S letters are stylized as $ dollar signs
- White on transparent background, bold rounded chunky letterforms
- Built with ~45% empty space around the mark — naturally supports the "present and large, not shouting" principle
- Use as-is for site header, hero, and any branded surface
- Do NOT substitute other variants unless user explicitly asks

Other assets (use only for specific contexts):
- `ICON.png` — purple $ icon → use only for favicon + social avatar (OG image)
- `LOGO SASOMM-02.png` — wordmark on light bg → unused (site is all dark)
- `LOGO SASOMM-05.png` — wordmark + "Money Between People" tagline → may use for OG share card

### Stitch wireframes (design direction)

- `wireframes_1` — Home layout option A
- `wireframes_2` — Home layout option B
- `DESIGN.md` — "Editorial Fintech / Neon Vault" design system

### Lifestyle imagery direction (from user)

The site must **not** be all phone mockups. Interspersed lifestyle photography is required:

- Happy people standing in front of a **renovated home** (contractor-homeowner handshake vibes)
- People **exchanging cash** in a home living room (literal "Money Between People")
- Warm, daily-life scenes — not corporate stock

**Implication:** The target audience is home-renovation contractors and homeowners managing multi-payment renovation projects. SASOMM is positioned as the tool that keeps track of the many informal cash/bank transfers that happen between people during a renovation.

### Lifestyle photo library (downloaded — `WEBSITE/assets/images/`)

All sourced from Unsplash CDN (royalty-free, commercial use OK):

| File | Subject | Used in |
|------|---------|---------|
| `renovation-painters.jpg` | Two painters on ladders painting a purple house exterior | ⭐ Moments bento — large left tile (renovation in progress) |
| `counting-cash.jpg` | Person counting dollar bills in their hands, dark warm setting | ⭐ Moments bento — top-middle ("Money Between People" — literal) |
| `couple-kitchen.jpg` | Couple cooking together in a modern kitchen | Lifestyle section — main right photo |
| `architect-plans.jpg` | Architect drawing renovation blueprints with ruler and pen | Moments bento — top-right (planning) |
| `modern-living-room.jpg` | Modern renovated open-plan living + dining room | Moments bento — bottom-middle (finished home) |
| `cozy-living-room.jpg` | Living room with sofa, blue accents, framed art | Moments bento — bottom-right (everyday peace) |
| `home-keys.jpg` | Toy house with keychain on wood table | Backup — symbolic homeownership |
| `signing-document.jpg` | Hand signing a paper document with pen | Backup — contracts/agreements |

---

## Open decisions (brainstorming checklist)

- [ ] Scope: 4 compliance pages vs. full marketing landing
- [ ] Cyan vs. mint for action color
- [ ] Hebrew only or Hebrew + English
- [ ] Download CTAs: real stores or "coming soon"
- [ ] Pricing tier section (Stitch shows Basic/Pro/Custom) — does SASOMM have pricing?
- [ ] Tagline: "Money Between People" — public or internal?
- [ ] Tone: formal / casual / playful / corporate
- [ ] Privacy Policy + Terms: exist already or need drafting?
- [ ] Contact method: email only, form, WhatsApp?
- [ ] Analytics: GA / Plausible / none

# SASOMM Backend

Server-side code for SASOMM: Supabase migrations, Edge Functions, scripts, and shared backend types.

The frontend (Expo app) lives at the project root (`App.tsx`, `pages/`, `shared/`, `components/`). This `backend/` directory is independent of the React Native bundle and is never imported by client code.

## Layout

```
backend/
├── supabase/
│   ├── config.toml         # Supabase CLI config (links project, env vars)
│   ├── migrations/         # SQL migration files (YYYYMMDDHHMMSS_<name>.sql)
│   └── functions/          # Deno-based Edge Functions
│       ├── send-email/                # → Resend
│       ├── send-whatsapp/             # → GREEN API
│       ├── send-push/                 # → Expo Push
│       ├── reset-password/            # → Supabase Admin API
│       ├── ai-scan/                   # → Anthropic Claude (manual)
│       ├── ai-scan-cron/              # → Anthropic Claude (weekly)
│       ├── payment-webhook/           # ← Israeli payment provider (Phase 2)
│       ├── usage-snapshot/            # daily cron, writes business_expenses
│       ├── generate-invoice-pdf/      # tax invoice PDF (Phase 2)
│       ├── monthly-vat-report/        # VAT submission Excel (Phase 2)
│       ├── accountant-export/         # annual ZIP for accountant (Phase 3)
│       └── contact-form-handler/      # ← sasomm.com contact form
├── scripts/                # One-off admin scripts (TS or shell)
├── types/                  # Shared backend TypeScript types
└── README.md
```

## Supabase CLI

The CLI expects its workspace at `backend/supabase/`. Use the npm aliases from project root:

```bash
npm run sb:start              # supabase start (local stack)
npm run sb:stop               # supabase stop
npm run sb:diff               # supabase db diff
npm run sb:migrate            # supabase db push (apply migrations to remote)
npm run sb:fn:serve <name>    # supabase functions serve <name> --no-verify-jwt
npm run sb:fn:deploy <name>   # supabase functions deploy <name>
npm run sb:fn:logs <name>     # supabase functions logs <name>
```

These wrap `supabase --workdir backend/supabase ...`.

## Migrations

Naming convention: `YYYYMMDDHHMMSS_<purpose>.sql` (Supabase CLI generates timestamps).

Phase 1 migration set (created in implementation plan):
- `<ts>_phase1_admin_tables.sql` — 9 new tables (feedback, admin_todos, admin_email_log, user_messages, business_expenses, leads, lead_activities, user_sessions, business_info)
- `<ts>_phase1_admin_rls.sql` — RLS policies (email-based admin guard + user-scoped exceptions)
- `<ts>_phase1_admin_views.sql` — `admin_users_view`, `admin_kpi_view`

Phase 2 / 3 migrations land in this directory as they are implemented.

## Edge Functions

Each function lives in its own directory with an `index.ts` entry point. Deno runtime (not Node). Secrets pulled from Supabase project secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GREEN_API_INSTANCE_ID`, `GREEN_API_TOKEN`, `ANTHROPIC_API_KEY`, etc.).

Every function except webhooks must verify the caller's JWT email matches `ADMIN_EMAIL` before privileged operations. Webhooks verify provider signature.

## Scripts

`scripts/` holds one-off operational scripts (e.g. data backfills, manual fixes, ad-hoc reports). Each script documents its purpose at the top.

## References

- Design spec: [docs/superpowers/specs/2026-05-11-admin-backoffice-dashboard-design.md](../docs/superpowers/specs/2026-05-11-admin-backoffice-dashboard-design.md)
- Supabase project: `bknswnzipvdtqsfhhsss` (https://bknswnzipvdtqsfhhsss.supabase.co)
- GitHub: https://github.com/karnafy/SASOMM

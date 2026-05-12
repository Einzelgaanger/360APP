# Supabase Migration (Old Project -> New Project)

This runbook migrates your data from the old Supabase project to a new one and reconnects the app.

## 1) Create and link the new Supabase project

```bash
supabase login
supabase projects list
supabase link --project-ref YOUR_NEW_PROJECT_REF
```

## 2) Apply schema to the new project

From this repo root:

```bash
supabase db push
```

This applies all migrations in `supabase/migrations`.

## 3) Export data from old project

Use your old database URL/password from old Supabase dashboard:

```bash
pg_dump "postgresql://postgres:OLD_DB_PASSWORD@db.OLD_PROJECT_REF.supabase.co:5432/postgres" \
  --data-only \
  --column-inserts \
  --no-owner \
  --no-privileges \
  > old_data.sql
```

## 4) Import data into new project

```bash
psql "postgresql://postgres:NEW_DB_PASSWORD@db.YOUR_NEW_PROJECT_REF.supabase.co:5432/postgres" \
  -f old_data.sql
```

## 5) Reconnect app env to the canonical project

This app uses **one** Supabase project for local and production: `sgttsotrvemmgmujcuay`.

Set `.env` values:

```env
VITE_SUPABASE_URL=https://sgttsotrvemmgmujcuay.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon public key from Dashboard → API>
VITE_ENABLE_APP_AI=false
```

Restart dev server after editing `.env`.

## 6) Deploy edge functions (only if needed)

```bash
supabase functions deploy
```

If you are replacing built-in AI with Claude externally, keep `VITE_ENABLE_APP_AI=false`.


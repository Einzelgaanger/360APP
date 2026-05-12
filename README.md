# Appraisal Platform

VGG appraisal platform built with React, Vite, TypeScript, Tailwind and Supabase.

## Local development

```sh
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` — optional overrides; if unset, the client uses project `sgttsotrvemmgmujcuay` defaults (same as `supabase/config.toml`). Set these on the host if you use another project or rotate the anon key.
- `VITE_ENABLE_APP_AI` (defaults to `false`)

## Database migration

To move to a new Supabase project, follow:

- `docs/supabase-migration.md`

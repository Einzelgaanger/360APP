# Appraisal Platform

VGG appraisal platform built with React, Vite, TypeScript, Tailwind and Supabase.

## Local development

```sh
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL` — must be `https://sgttsotrvemmgmujcuay.supabase.co` (same project as `supabase/config.toml`; set the same vars on your host at **build** time for production)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — that project’s anon key
- `VITE_ENABLE_APP_AI` (defaults to `false`)

## Database migration

To move to a new Supabase project, follow:

- `docs/supabase-migration.md`

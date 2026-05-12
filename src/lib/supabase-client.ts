import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const missing = [
    !SUPABASE_URL && 'VITE_SUPABASE_URL',
    !SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_PUBLISHABLE_KEY',
  ]
    .filter(Boolean)
    .join(' and ');
  throw new Error(
    `[Supabase] Missing ${missing}. Local and production must use the same project: ` +
      'https://sgttsotrvemmgmujcuay.supabase.co — anon key from Dashboard → Project Settings → API. ' +
      'Copy .env.example to .env for dev; set the same VITE_* at build time for production (Render/Vercel/etc.).'
  );
}

export const supabaseUrl = SUPABASE_URL;
export const supabasePublishableKey = SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const getFunctionUrl = (name: string) => `${supabaseUrl}/functions/v1/${name}`;

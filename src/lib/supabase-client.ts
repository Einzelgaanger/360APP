import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/** Default project (supabase/config.toml). Anon key is public (client bundle); override with VITE_* for another env. */
const DEFAULT_SUPABASE_URL = 'https://sgttsotrvemmgmujcuay.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndHRzb3RydmVtbWdtdWpjdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODM1NzUsImV4cCI6MjA5Mjk1OTU3NX0.Aq4z0ZXy646Q3RJ3nIKcV5DyPqHYzQ38RiIE-aRawx8';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;

export { supabaseUrl, supabasePublishableKey };

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const getFunctionUrl = (name: string) => `${supabaseUrl}/functions/v1/${name}`;

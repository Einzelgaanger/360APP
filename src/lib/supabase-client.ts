import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const FALLBACK_SUPABASE_URL = 'https://jniqqburulrdwcbjetug.supabase.co';
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuaXFxYnVydWxyZHdjYmpldHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NDUxNDQsImV4cCI6MjA4NDAyMTE0NH0.SBBXe4GxDn4hUJNe6gsGJyPSpo7t30xWYKonkAApbVw';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;
export const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || FALLBACK_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const getFunctionUrl = (name: string) => `${supabaseUrl}/functions/v1/${name}`;

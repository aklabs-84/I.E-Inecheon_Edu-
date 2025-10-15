// Alternative Supabase client for public read operations
// This helps bypass RLS issues for public data access
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a separate client specifically for public data access
export const supabasePublic = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Don't persist sessions for this client
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  }
});
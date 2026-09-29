import { createClient } from '@supabase/supabase-js';

// Your Supabase project URL
const supabaseUrl = 'https://ldehioknieeqlzbqbfth.supabase.co';

// Provide the anon key copy-pasted from the Supabase dashboard here
const supabaseAnonKey = 'sb_publishable__sK21JEY_qqn08ZyOJodDQ_JuiJGNBm';

// ⚡ Optimized client: reduces connection exhaustion & egress usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      // Prefer cached responses where possible
      'Cache-Control': 'max-age=60',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    // Limit realtime connections to reduce resource usage
    timeout: 10000,
  },
});
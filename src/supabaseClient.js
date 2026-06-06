import { createClient } from '@supabase/supabase-js';

// Your Supabase project URL
const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co'; 

// Provide the anon key copy-pasted from the Supabase dashboard here
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
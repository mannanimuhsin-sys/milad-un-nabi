import { createClient } from '@supabase/supabase-js';

// നിങ്ങളുടെ Supabase പ്രൊജക്റ്റ് ലിങ്ക്
const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co'; 

// നിങ്ങൾ നേരത്തെ Supabase സൈറ്റിൽ നിന്ന് കോപ്പി ചെയ്ത ആ വലിയ default key ഇവിടെ നൽകുക
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
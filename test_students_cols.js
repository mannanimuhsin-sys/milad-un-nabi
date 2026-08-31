const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo'; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectStudents() {
  const { data, error } = await supabase.from('students').select('*').eq('madrasa_id', '4224').limit(5);
  if (data && data.length > 0) {
    const s = data[0];
    console.log("Keys in student object:", Object.keys(s));
    for (const k of Object.keys(s)) {
      const val = s[k];
      const len = typeof val === 'string' ? val.length : 0;
      console.log(`Column ${k}: type=${typeof val}, length=${len}, snippet=${String(val).slice(0, 50)}`);
    }
  }
}
inspectStudents();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo'; 

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching students for madrasa 4224...");
  try {
    const { data: students, error } = await supabase.from('students').select('*').eq('madrasa_id', '4224');
    if (error) {
      console.error(error);
    } else {
      console.log("Students:", students);
    }
  } catch (err) {
    console.error(err);
  }
}

run();

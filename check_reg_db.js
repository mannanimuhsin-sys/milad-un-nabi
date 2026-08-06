const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo'; 

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log("=== CHECKING SUPABASE PROGRAM_REGISTRATIONS ===");
  try {
    const { data, error, count } = await supabase
      .from('program_registrations')
      .select('*', { count: 'exact' })
      .limit(10);
    
    if (error) {
      console.error("Error fetching program_registrations:", error);
    } else {
      console.log(`Total program_registrations rows count: ${count}`);
      console.log("Sample records:", JSON.stringify(data, null, 2));
    }

    // Check students table sample
    const { data: students, error: sErr } = await supabase
      .from('students')
      .select('*')
      .limit(5);
    if (sErr) console.error("Error fetching students:", sErr);
    else console.log("Sample students count:", students.length);

  } catch (err) {
    console.error("Exception:", err);
  }
}

checkDatabase();

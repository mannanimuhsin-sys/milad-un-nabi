const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo'; 

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOperations() {
  console.log("=== TESTING INSERT AND DELETE ON PROGRAM_REGISTRATIONS ===");
  const testMadrasa = "test_madrasa_999999";
  const testStudentId = "999999";
  const testProgName = "999999";

  try {
    // 1. Insert
    console.log("1. Testing Insert...");
    const { data: insData, error: insErr } = await supabase
      .from('program_registrations')
      .insert([{
        madrasa_id: testMadrasa,
        student_id: testStudentId,
        program_name: testProgName
      }])
      .select();

    if (insErr) {
      console.error("❌ INSERT FAILED:", insErr);
    } else {
      console.log("✅ INSERT SUCCESSFUL:", insData);
    }

    // 2. Delete
    console.log("2. Testing Delete...");
    const { data: delData, error: delErr } = await supabase
      .from('program_registrations')
      .delete()
      .eq('madrasa_id', testMadrasa)
      .eq('student_id', testStudentId)
      .select();

    if (delErr) {
      console.error("❌ DELETE FAILED:", delErr);
    } else {
      console.log("✅ DELETE SUCCESSFUL:", delData);
    }

  } catch (err) {
    console.error("Exception:", err);
  }
}

testOperations();

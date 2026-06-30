const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo'; 

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Inserting student with existing regno 4710...");
  try {
    const { data, error } = await supabase.from('students').insert([{
      name: "Duplicate Test",
      regno: "4710", // already exists for 4224 (MARIYAMBI has 4710)
      teamid: "46",
      catid: "180",
      gender: "GIRL",
      madrasa_id: "4224"
    }]).select();
    
    if (error) {
      console.log("Returned Error:", error);
    } else {
      console.log("Success! Inserted duplicate:", data);
      
      console.log("Deleting duplicate...");
      await supabase.from('students').delete().eq('id', data[0].id);
    }
  } catch (err) {
    console.error("Exception caught:", err);
  }
}

run();

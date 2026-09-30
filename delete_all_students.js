// ⚠️ WARNING: This script deletes ALL student records from Supabase!
// User confirmed explicitly on 2026-09-29.

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co';
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteAllStudents() {
  console.log('⚠️  Starting deletion of ALL students...');

  // Step 1: Count how many records exist
  const { count, error: countErr } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('❌ Count failed:', countErr.message);
    process.exit(1);
  }
  console.log(`📊 Total students found: ${count}`);

  if (!count || count === 0) {
    console.log('✅ students table is already empty. Nothing to delete.');
    process.exit(0);
  }

  // Step 2: Delete all rows — using neq on id column (always true) to bypass RLS/filter requirement
  const { error: delErr } = await supabase
    .from('students')
    .delete()
    .neq('id', -1); // matches all rows (id is never -1)

  if (delErr) {
    console.error('❌ Delete failed:', delErr.message, '| code:', delErr.code);
    console.log('\n💡 If RLS is blocking this, go to Supabase Dashboard:');
    console.log('   Table Editor → students → RLS Policies → Add policy to allow delete,');
    console.log('   OR temporarily disable RLS for this table.');
    process.exit(1);
  }

  // Step 3: Verify
  const { count: remaining } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Deletion complete! Remaining rows: ${remaining ?? 0}`);
  process.exit(0);
}

deleteAllStudents().catch(err => {
  console.error('💥 Unexpected error:', err.message);
  process.exit(1);
});

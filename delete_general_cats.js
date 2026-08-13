// Script to delete duplicate "General" categories from all registered madrasas in Supabase
// Run with: node delete_general_cats.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co';
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteGeneralCategories() {
  console.log('🔍 Fetching all "General" categories from Supabase...');

  // Fetch all categories named "General" (case-insensitive)
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, madrasa_id')
    .ilike('name', 'general'); // case-insensitive match

  if (error) {
    console.error('❌ Error fetching categories:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('✅ No "General" categories found. Nothing to delete.');
    return;
  }

  console.log(`📋 Found ${data.length} "General" category entries:`);
  data.forEach(c => {
    console.log(`   - ID: ${c.id} | Madrasa: ${c.madrasa_id} | Name: "${c.name}"`);
  });

  console.log('\n🗑️  Deleting all "General" categories...');

  const ids = data.map(c => c.id);

  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('❌ Error deleting categories:', deleteError.message);
    return;
  }

  console.log(`\n✅ Successfully deleted ${ids.length} "General" category entries from all madrasas!`);
  console.log('🌟 GENERAL Star tile remains functional (it uses generalCatIds, not the DB row).');
}

deleteGeneralCategories().catch(console.error);

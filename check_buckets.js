const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co';
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createBucket() {
  try {
    console.log('Attempting to create bucket "student-photos"...');
    const { data, error } = await supabase.storage.createBucket('student-photos', {
      public: true,
      fileSizeLimit: 1048576, // 1MB
      allowedMimeTypes: ['image/jpeg', 'image/png']
    });
    if (error) {
      console.error('Error creating bucket:', error);
    } else {
      console.log('Bucket created successfully:', data);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

createBucket();

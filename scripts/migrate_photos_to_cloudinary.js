/**
 * Migration Script: Migrate existing Base64 / Storage Photos to Cloudinary
 * 
 * Usage:
 *   node scripts/migrate_photos_to_cloudinary.js
 * 
 * Requirements:
 *   npm install cloudinary dotenv @supabase/supabase-js
 */

const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;

// 1. Supabase Credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ldehioknieeqlzbqbfth.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY_OR_ANON_KEY';

// 2. Cloudinary Credentials (Use API Secret for Backend Migration)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME',
  api_key: process.env.CLOUDINARY_API_KEY || 'YOUR_API_KEY',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YOUR_API_SECRET',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateStudentPhotos() {
  console.log('🚀 Starting Student Photos Migration to Cloudinary...');

  // Fetch all students who have a photo_url that is base64 (or not yet on Cloudinary)
  const { data: students, error } = await supabase
    .from('students')
    .select('id, name, madrasa_id, photo_url')
    .not('photo_url', 'is', null);

  if (error) {
    console.error('❌ Error fetching students:', error.message);
    return;
  }

  // Filter for records that need migration (base64 or Supabase Storage URLs)
  const toMigrate = students.filter(
    (s) => s.photo_url && (s.photo_url.startsWith('data:image/') || !s.photo_url.includes('res.cloudinary.com'))
  );

  console.log(`📊 Found ${students.length} total students with photo_url.`);
  console.log(`📦 ${toMigrate.length} students need migration to Cloudinary.`);

  if (toMigrate.length === 0) {
    console.log('✅ All student photos are already on Cloudinary or no photos found.');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toMigrate.length; i++) {
    const student = toMigrate[i];
    console.log(`[${i + 1}/${toMigrate.length}] Migrating photo for Student ID ${student.id} (${student.name})...`);

    try {
      const folderPath = `madrasas/${student.madrasa_id || 'general'}/students`;
      const publicId = `student_${student.id}_${Date.now()}`;

      // Upload base64 or source URL to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(student.photo_url, {
        folder: folderPath,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      const newCloudinaryUrl = uploadResult.secure_url;

      // Update Supabase with the new Cloudinary URL
      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_url: newCloudinaryUrl })
        .eq('id', student.id);

      if (updateError) {
        console.error(`❌ Failed to update Supabase for student ${student.id}:`, updateError.message);
        failCount++;
      } else {
        console.log(`✅ Student ${student.id} migrated successfully -> ${newCloudinaryUrl}`);
        successCount++;
      }
    } catch (uploadErr) {
      console.error(`❌ Cloudinary upload failed for student ${student.id}:`, uploadErr.message);
      failCount++;
    }
  }

  console.log('\n=========================================');
  console.log(`🎉 Migration Completed!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('=========================================\n');
}

migrateStudentPhotos();

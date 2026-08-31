// RLS Policy tester — runs as anon user to see what's allowed vs blocked
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co';
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TIMEOUT_MS = 20000;

async function tryOp(label, fn) {
  const t0 = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_20S')), TIMEOUT_MS))
    ]);
    const ms = Date.now() - t0;
    if (result.error) {
      console.log(`[${ms}ms] ❌ ${label}: ${result.error.message} (code=${result.error.code})`);
    } else {
      console.log(`[${ms}ms] ✅ ${label}: OK rows=${result.data?.length ?? 'n/a'}`);
    }
    return result;
  } catch (err) {
    console.log(`[${Date.now()-t0}ms] ⚠️  ${label}: ${err.message}`);
    return { data: null, error: { message: err.message } };
  }
}

async function main() {
  console.log('\n=== READ TESTS ===');
  await tryOp('madrasas SELECT (limit 1)', () =>
    supabase.from('madrasas').select('id,name,regNumber').limit(1)
  );
  await tryOp('students SELECT (limit 1)', () =>
    supabase.from('students').select('id,name,madrasa_id').limit(1)
  );
  await tryOp('programs SELECT (limit 1)', () =>
    supabase.from('programs').select('id,name,madrasa_id').limit(1)
  );
  await tryOp('results SELECT (limit 1)', () =>
    supabase.from('results').select('id,madrasa_id').limit(1)
  );
  await tryOp('teams SELECT (limit 1)', () =>
    supabase.from('teams').select('id,name,madrasa_id').limit(1)
  );

  console.log('\n=== WRITE TESTS ===');
  const stuRes = await tryOp('students INSERT', () =>
    supabase.from('students').insert([{
      name: '__RLS_TEST__', madrasa_id: '4224', regno: '__RLS99999__', gender: 'BOY'
    }]).select()
  );
  if (stuRes.data?.[0]) {
    await tryOp('students DELETE (cleanup)', () =>
      supabase.from('students').delete().eq('id', stuRes.data[0].id)
    );
  }

  const madRes = await tryOp('madrasas INSERT', () =>
    supabase.from('madrasas').insert([{
      name: '__RLS_TEST__', regNumber: '__RLS99999__'
    }]).select()
  );
  if (madRes.data?.[0]) {
    await tryOp('madrasas DELETE (cleanup)', () =>
      supabase.from('madrasas').delete().eq('id', madRes.data[0].id)
    );
  }

  const progRes = await tryOp('programs INSERT', () =>
    supabase.from('programs').insert([{
      name: '__RLS_TEST__', madrasa_id: '4224', code: 'RLS99', type: 'SOLO_BOY'
    }]).select()
  );
  if (progRes.data?.[0]) {
    await tryOp('programs DELETE (cleanup)', () =>
      supabase.from('programs').delete().eq('id', progRes.data[0].id)
    );
  }

  const resRes = await tryOp('results INSERT', () =>
    supabase.from('results').insert([{
      madrasa_id: '4224', student_name: '__RLS_TEST__', program_name: 'Test', place: 'First', points: 0
    }]).select()
  );
  if (resRes.data?.[0]) {
    await tryOp('results DELETE (cleanup)', () =>
      supabase.from('results').delete().eq('id', resRes.data[0].id)
    );
  }

  console.log('\nDone!');
  process.exit(0);
}

main();

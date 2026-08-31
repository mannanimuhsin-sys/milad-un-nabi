const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo'; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing step 1 login query with regNumber 4224...');
  const t0 = Date.now();
  const trimmedReg = '4224';
  const numReg = parseInt(trimmedReg, 10);
  const isNum = !isNaN(numReg) && String(numReg) === String(trimmedReg).trim();
  const loginFilterStr = isNum ? `regNumber.eq."${trimmedReg}",regNumber.eq."${numReg}"` : `regNumber.eq."${trimmedReg}"`;
  console.log('loginFilterStr:', loginFilterStr);
  const res1 = await supabase.from('madrasas').select('*').or(loginFilterStr);
  console.log('res1 time:', Date.now() - t0, 'ms. error:', res1.error, 'data:', res1.data ? res1.data.length : null);

  console.log('\nTesting step 2 fallback query...');
  const t1 = Date.now();
  const res2 = await supabase.from('madrasas').select('id,regNumber,regnumber,reg_number,name,place,adminPassword,admin_password,adminpass,viewPassword,view_password,viewpass,status');
  console.log('res2 time:', Date.now() - t1, 'ms. error:', res2.error, 'data:', res2.data ? res2.data.length : null);

  console.log('\nTesting simple eq query...');
  const t2 = Date.now();
  const res3 = await supabase.from('madrasas').select('*').eq('regNumber', trimmedReg);
  console.log('res3 time:', Date.now() - t2, 'ms. error:', res3.error, 'data:', res3.data ? res3.data.length : null);

  console.log('\nTesting fetchAllRows madrasas (what fetchMadrasas does on app load)...');
  const t3 = Date.now();
  const res4 = await supabase.from('madrasas').select('*').order('id', { ascending: true }).range(0, 999);
  console.log('res4 time:', Date.now() - t3, 'ms. error:', res4.error, 'data:', res4.data ? res4.data.length : null);
}
test();

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bwxtqprzmcabslixbtjo.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo'; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const fetchAllRows = async (table, filter) => {
  const PAGE = 1000;
  let allRows = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await filter(
      supabase.from(table).select('*').order('id', { ascending: true }).range(from, from + PAGE - 1)
    );
    if (error) return { data: allRows.length > 0 ? allRows : null, error };
    if (!data || data.length === 0) { hasMore = false; break; }
    allRows = [...allRows, ...data];
    if (data.length < PAGE) { hasMore = false; } else { from += PAGE; }
  }
  return { data: allRows, error: null };
};

async function testMadrasa(rNum) {
  console.log(`--- Testing queries for Madrasa ${rNum} ---`);
  const numericId = parseInt(rNum, 10);
  const isNumValid = !isNaN(numericId) && String(numericId) === String(rNum).trim();
  const makeFilter = (q) => {
    if (isNumValid) {
      return q.or(`madrasa_id.eq.${numericId},madrasa_id.eq.${rNum}`);
    }
    return q.eq('madrasa_id', rNum);
  };

  const tables = ['teams', 'categories', 'programs', 'timetable'];
  for (const t of tables) {
    const t0 = Date.now();
    const res = await makeFilter(supabase.from(t).select('*'));
    console.log(`Table ${t}: ${Date.now() - t0}ms, error: ${res.error?.message || null}, count: ${res.data?.length}`);
  }

  const pagedTables = ['results', 'students', 'program_registrations', 'group_registrations'];
  for (const t of pagedTables) {
    const t0 = Date.now();
    const res = await fetchAllRows(t, makeFilter);
    console.log(`Paged Table ${t}: ${Date.now() - t0}ms, error: ${res.error?.message || null}, count: ${res.data?.length}`);
  }
}

async function run() {
  await testMadrasa('4224');
}
run();

async function run() {
  const url = 'https://bwxtqprzmcabslixbtjo.supabase.co/rest/v1/teams?select=*&limit=1';
  const headers = {
    'apikey': 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo',
    'Authorization': 'Bearer sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo',
    'Origin': 'https://milad-un-nabi.vercel.app',
    'Access-Control-Request-Method': 'GET'
  };
  try {
    const res = await fetch(url, { method: 'GET', headers });
    console.log("Status:", res.status);
    console.log("Headers:");
    for (const [k, v] of res.headers.entries()) {
      console.log(`  ${k}: ${v}`);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
run();

async function run() {
  const url = 'https://bwxtqprzmcabslixbtjo.supabase.co/rest/v1/students';
  
  // Mimic browser OPTIONS preflight request
  const preflightHeaders = {
    'Origin': 'https://milad-un-nabi.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'apikey,authorization,content-type,prefer'
  };
  
  try {
    console.log("Sending OPTIONS preflight request...");
    const res = await fetch(url, { method: 'OPTIONS', headers: preflightHeaders });
    console.log("Preflight Status:", res.status);
    console.log("Preflight Headers:");
    for (const [k, v] of res.headers.entries()) {
      console.log(`  ${k}: ${v}`);
    }
    
    // Now let's try actual POST headers
    const postHeaders = {
      'apikey': 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo',
      'Authorization': 'Bearer sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Origin': 'https://milad-un-nabi.vercel.app'
    };
    
    console.log("\nSending POST request...");
    // Let's do a request but with a rollbacked transaction if possible, or just insert and delete
    const postRes = await fetch(url, {
      method: 'POST',
      headers: postHeaders,
      body: JSON.stringify({
        name: "CORS Test",
        regno: "9998",
        teamid: "1",
        catid: "1",
        gender: "BOY",
        madrasa_id: "2026"
      })
    });
    console.log("POST Status:", postRes.status);
    console.log("POST Headers:");
    for (const [k, v] of postRes.headers.entries()) {
      console.log(`  ${k}: ${v}`);
    }
    const json = await postRes.json();
    console.log("POST Response:", json);
    
    if (postRes.status === 201 && json && json.length > 0) {
      console.log("\nDeleting test student...");
      const delHeaders = {
        'apikey': 'sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo',
        'Authorization': 'Bearer sb_publishable_csYLcyRnlSZpYnKQEES1Yg_Uvg1bRWo',
        'Origin': 'https://milad-un-nabi.vercel.app'
      };
      const delRes = await fetch(`${url}?id=eq.${json[0].id}`, { method: 'DELETE', headers: delHeaders });
      console.log("Delete status:", delRes.status);
    }
  } catch (err) {
    console.error("Failed:", err);
  }
}
run();

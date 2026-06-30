async function run() {
  try {
    const res = await fetch('https://milad-un-nabi.vercel.app');
    const text = await res.text();
    console.log("HTML length:", text.length);
    
    // Find all script tags
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/g;
    let match;
    const scripts = [];
    while ((match = scriptRegex.exec(text)) !== null) {
      scripts.push(match[1]);
    }
    console.log("Found scripts:", scripts);
    
    for (const src of scripts) {
      const scriptUrl = src.startsWith('http') ? src : `https://milad-un-nabi.vercel.app${src}`;
      console.log("Fetching script:", scriptUrl);
      const scriptRes = await fetch(scriptUrl);
      const scriptText = await scriptRes.text();
      
      // Check if it contains the supabase url or key
      if (scriptText.includes('supabase.co')) {
        console.log("Found supabase.co in script!");
        const urlMatch = scriptText.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
        console.log("Supabase URL in production:", urlMatch ? urlMatch[0] : "not found");
        
        const keyMatch = scriptText.match(/sb_publishable_[a-zA-Z0-9_]+/);
        console.log("Supabase Key in production:", keyMatch ? keyMatch[0] : "not found");
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
run();

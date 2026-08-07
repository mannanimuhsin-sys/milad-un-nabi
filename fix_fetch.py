import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# FIX 1: Replace fetchSupabaseData with robust paginated version
# ============================================================

OLD_FETCH = '''  // 🔄 Function to load real-time data from Supabase (with offline fallback & LocalStorage caching)
  const fetchSupabaseData = async (rNumInput) => {
    const rNum = String(rNumInput || (loggedInMadrasa ? (loggedInMadrasa.regNumber || loggedInMadrasa.regnumber || loggedInMadrasa.reg_number) : '')).trim();
    if (!rNum) return;

    // 🚀 Load local cache immediately for instant UI render (<10ms)
    loadCachedData(rNum);

    // Prevent concurrent stacked requests on weak connections
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // If device is offline, immediately load from local cache and avoid network call
    if (!navigator.onLine) {
      loadCachedData(rNum);
      isFetchingRef.current = false;
      return;
    }

    try {
      // 15-second network timeout wrapper to protect against hung requests on 2G/3G/poor wifi
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network request timed out')), 15000)
      );

      const numericId = parseInt(rNum, 10);
      const isNumValid = !isNaN(numericId);

      const fetchPromise = Promise.all([
        queryWithRetry(() => isNumValid
          ? supabase.from('teams').select('*').or(`madrasa_id.eq.${rNum},madrasa_id.eq.${numericId}`)
          : supabase.from('teams').select('*').eq('madrasa_id', rNum)),
        queryWithRetry(() => isNumValid
          ? supabase.from('categories').select('*').or(`madrasa_id.eq.${rNum},madrasa_id.eq.${numericId}`)
          : supabase.from('categories').select('*').eq('madrasa_id', rNum)),
        queryWithRetry(() => isNumValid
          ? supabase.from('students').select('*').or(`madrasa_id.eq.${rNum},madrasa_id.eq.${numericId}`)
          : supabase.from('students').select('*').eq('madrasa_id', rNum)),
        queryWithRetry(() => isNumValid
          ? supabase.from('programs').select('*').or(`madrasa_id.eq.${rNum},madrasa_id.eq.${numericId}`)
          : supabase.from('programs').select('*').eq('madrasa_id', rNum)),
        queryWithRetry(() => isNumValid
          ? supabase.from('results').select('*').or(`madrasa_id.eq.${rNum},madrasa_id.eq.${numericId}`)
          : supabase.from('results').select('*').eq('madrasa_id', rNum)),
        queryWithRetry(() => isNumValid
          ? supabase.from('program_registrations').select('*').or(`madrasa_id.eq.${rNum},madrasa_id.eq.${numericId}`)
          : supabase.from('program_registrations').select('*').eq('madrasa_id', rNum)),
        queryWithRetry(() => isNumValid
          ? supabase.from('madrasas').select('*').or(`regNumber.eq.${rNum},regNumber.eq.${numericId},regnumber.eq.${rNum}`).maybeSingle()
          : supabase.from('madrasas').select('*').eq('regNumber', rNum).maybeSingle())
      ]);

      const [
        { data: teamsData, error: err1 },
        { data: catsData, error: err2 },
        { data: studentsData, error: err3 },
        { data: programsData, error: err4 },
        { data: resultsData, error: err5 },
        { data: regData },
        { data: madrasaData }
      ] = await Promise.race([fetchPromise, timeoutPromise]);

      // If key queries failed (e.g. network lost mid-fetch), preserve current state (no zeroing!)
      if (err1 || err2 || err3 || err4 || err5) {
        console.warn("Supabase fetch encountered errors (weak connection):", err1 || err2 || err3 || err4 || err5);
        loadCachedData(rNum);
        return;
      }

      let parsedStudents = [];
      let parsedRegs = [];

      // Update states ONLY if valid array returned
      if (Array.isArray(teamsData)) setTeams(teamsData);
      if (Array.isArray(catsData)) setCategories(catsData);
      if (Array.isArray(programsData)) setPrograms([...programsData].sort(compareProgCode));
      if (Array.isArray(studentsData)) {
        const uniqueMap = new Map();
        for (const s of studentsData) {
          const rKey = String(s.regno || s.regNo || '').trim();
          if (!rKey) {
            uniqueMap.set(s.id, s);
          } else {
            const existing = uniqueMap.get(rKey);
            if (!existing) {
              uniqueMap.set(rKey, s);
            } else if (!existing.photo_url && s.photo_url) {
              uniqueMap.set(rKey, s);
            }
          }
        }
        parsedStudents = Array.from(uniqueMap.values()).sort(compareRegNo);
        setStudents(parsedStudents);
      }
      if (Array.isArray(resultsData)) setResultsList(resultsData);

      let loadedEventName = '';
      let loadedEventYear = '';
      let loadedConvenerSadar = '';
      let loadedGenCats = [];

      const localEv = localStorage.getItem(`event_name_${rNum}`) || '';
      const localYr = localStorage.getItem(`event_year_${rNum}`) || '';
      const localCS = localStorage.getItem(`convener_sadar_${rNum}`) || '';
      const localGen = localStorage.getItem(`general_cats_${rNum}`);

      if (madrasaData) {
        const parts = (madrasaData.place || '').split('|');
        const [, , trollStatus, dbTrollLang, dbEventName, dbEventYear, dbGeneralCats, dbConvenerSadar] = parts;
        setTrollMode(trollStatus === 'troll_on');
        setTrollLang(dbTrollLang === 'EN' ? 'EN' : 'ML');

        loadedEventName = dbEventName ? decodeURIComponent(dbEventName) : localEv;
        loadedEventYear = dbEventYear ? decodeURIComponent(dbEventYear) : localYr;
        loadedConvenerSadar = dbConvenerSadar ? decodeURIComponent(dbConvenerSadar) : localCS;

        if (dbGeneralCats) {
          try { loadedGenCats = JSON.parse(decodeURIComponent(dbGeneralCats)); } catch(e){}
        } else if (localGen) {
          try { loadedGenCats = JSON.parse(localGen); } catch(e){}
        }

        if (loadedEventName) {
          setEventName(loadedEventName);
          setEventNameInput(prev => prev === '' ? loadedEventName : prev);
          try { localStorage.setItem(`event_name_${rNum}`, loadedEventName); } catch(e){}
        }
        if (loadedEventYear) {
          setEventYear(loadedEventYear);
          setEventYearInput(prev => prev === '' ? loadedEventYear : prev);
          try { localStorage.setItem(`event_year_${rNum}`, loadedEventYear); } catch(e){}
        }
        if (loadedConvenerSadar) {
          setConvenerSadar(loadedConvenerSadar);
          setConvenerSadarInput(prev => prev === '' ? loadedConvenerSadar : prev);
          try { localStorage.setItem(`convener_sadar_${rNum}`, loadedConvenerSadar); } catch(e){}
        }
        if (Array.isArray(loadedGenCats) && loadedGenCats.length > 0) {
          setGeneralCatIds(loadedGenCats);
          try { localStorage.setItem(`general_cats_${rNum}`, JSON.stringify(loadedGenCats)); } catch(e){}
        }
      }

      if (Array.isArray(regData)) {
        parsedRegs = regData.map(r => ({
          ...r,
          program_id: r.program_name
        }));
        setProgramRegistrations(parsedRegs);
      }

      // Fetch group registrations
      let parsedGroupReg = [];
      try {
        const { data: gRegData } = await supabase
          .from('group_registrations')
          .select('*')
          .eq('madrasa_id', rNum);
        if (Array.isArray(gRegData)) {
          parsedGroupReg = gRegData;
          setGroupRegistrations(gRegData);
        }
      } catch (err) {
        console.error("Group registrations fetch failed: ", err);
      }

      // Fetch timetable
      let parsedTimetable = [];
      try {
        const { data: ttData } = await supabase
          .from('timetable')
          .select('*')
          .eq('madrasa_id', rNum);
        if (Array.isArray(ttData)) {
          parsedTimetable = ttData;
          setTimetable(ttData);
        }
      } catch (err) {
        console.error("Timetable fetch failed: ", err);
      }

      // Save fresh data snapshot to LocalStorage for offline PWA cache (ONLY if fetch returned valid arrays!)
      if (Array.isArray(teamsData) && Array.isArray(resultsData) && Array.isArray(studentsData)) {
        try {
          const snapshot = {
            teams: teamsData,
            categories: catsData || [],
            programs: programsData || [],
            students: parsedStudents,
            resultsList: resultsData,
            programRegistrations: parsedRegs,
            groupRegistrations: parsedGroupReg,
            timetable: parsedTimetable,
            eventName: loadedEventName || localEv,
            eventYear: loadedEventYear || localYr,
            convenerSadar: loadedConvenerSadar || localCS,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(snapshot));
        } catch (cacheSaveErr) {
          console.warn("Could not save offline cache:", cacheSaveErr);
        }
      }

    } catch (err) {
      console.warn("Data fetch warning (slow/weak network or timeout): ", err.message);
      // Fallback to cache without clearing current state
      loadCachedData(rNum);
    } finally {
      isFetchingRef.current = false;
    }
  };'''

NEW_FETCH = '''  // Helper: fetch ALL rows of a table with automatic pagination (handles 300+ students)
  const fetchAllRows = async (table, filter, rNum) => {
    const PAGE = 500; // fetch 500 rows at a time
    let allRows = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await filter(
        supabase.from(table).select('*').range(from, from + PAGE - 1)
      );
      if (error) throw error;
      if (!data || data.length === 0) { hasMore = false; break; }
      allRows = [...allRows, ...data];
      if (data.length < PAGE) { hasMore = false; } else { from += PAGE; }
    }
    return allRows;
  };

  // 🔄 Function to load real-time data from Supabase (with offline fallback & LocalStorage caching)
  const fetchSupabaseData = async (rNumInput) => {
    const rNum = String(rNumInput || (loggedInMadrasa ? (loggedInMadrasa.regNumber || loggedInMadrasa.regnumber || loggedInMadrasa.reg_number) : '')).trim();
    if (!rNum) return;

    // 🚀 Load local cache immediately for instant UI render (<10ms)
    loadCachedData(rNum);

    // Prevent concurrent stacked requests on weak connections
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // If device is offline, immediately load from local cache and avoid network call
    if (!navigator.onLine) {
      loadCachedData(rNum);
      isFetchingRef.current = false;
      return;
    }

    try {
      const numericId = parseInt(rNum, 10);
      const isNumValid = !isNaN(numericId);

      // Build filter function for each table (supports both string and numeric madrasa_id)
      const makeFilter = (q) => isNumValid
        ? q.or(`madrasa_id.eq.${rNum},madrasa_id.eq.${numericId}`)
        : q.eq('madrasa_id', rNum);

      // Use Promise.allSettled so that a failure in one table does NOT wipe out others
      // 30-second overall timeout for large madrasas (300+ students)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network request timed out')), 30000)
      );

      const fetchPromise = Promise.allSettled([
        // Small tables — single fetch is fine
        queryWithRetry(() => makeFilter(supabase.from('teams').select('*'))),
        queryWithRetry(() => makeFilter(supabase.from('categories').select('*'))),
        queryWithRetry(() => makeFilter(supabase.from('programs').select('*'))),
        queryWithRetry(() => makeFilter(supabase.from('results').select('*'))),
        // Large tables — paginated to handle 300+ rows
        (async () => {
          const rows = await fetchAllRows('students', makeFilter, rNum);
          return { data: rows, error: null };
        })(),
        (async () => {
          const rows = await fetchAllRows('program_registrations', makeFilter, rNum);
          return { data: rows, error: null };
        })(),
        // Madrasa settings
        queryWithRetry(() => isNumValid
          ? supabase.from('madrasas').select('*').or(`regNumber.eq.${rNum},regNumber.eq.${numericId},regnumber.eq.${rNum}`).maybeSingle()
          : supabase.from('madrasas').select('*').eq('regNumber', rNum).maybeSingle()),
      ]);

      const results = await Promise.race([fetchPromise, timeoutPromise]);

      const [
        teamsResult,
        catsResult,
        programsResult,
        resultsResult,
        studentsResult,
        regResult,
        madrasaResult,
      ] = results;

      // Extract data safely (allSettled gives {status, value} or {status, reason})
      const safe = (r) => (r && r.status === 'fulfilled' && r.value) ? r.value : { data: null, error: true };

      const teamsData = safe(teamsResult).data;
      const catsData = safe(catsResult).data;
      const programsData = safe(programsResult).data;
      const resultsData = safe(resultsResult).data;
      const studentsData = safe(studentsResult).data;
      const regData = safe(regResult).data;
      const madrasaData = safe(madrasaResult).data;

      let parsedStudents = [];
      let parsedRegs = [];

      // Update states ONLY if valid non-empty array returned — NEVER zero out existing data on partial failure
      if (Array.isArray(teamsData) && teamsData.length >= 0) setTeams(teamsData);
      if (Array.isArray(catsData) && catsData.length >= 0) setCategories(catsData);
      if (Array.isArray(programsData) && programsData.length >= 0) setPrograms([...programsData].sort(compareProgCode));
      if (Array.isArray(studentsData) && studentsData.length > 0) {
        const uniqueMap = new Map();
        for (const s of studentsData) {
          const rKey = String(s.regno || s.regNo || '').trim();
          if (!rKey) {
            uniqueMap.set(s.id, s);
          } else {
            const existing = uniqueMap.get(rKey);
            if (!existing) {
              uniqueMap.set(rKey, s);
            } else if (!existing.photo_url && s.photo_url) {
              uniqueMap.set(rKey, s);
            }
          }
        }
        parsedStudents = Array.from(uniqueMap.values()).sort(compareRegNo);
        setStudents(parsedStudents);
      }
      if (Array.isArray(resultsData) && resultsData.length >= 0) setResultsList(resultsData);

      let loadedEventName = '';
      let loadedEventYear = '';
      let loadedConvenerSadar = '';
      let loadedGenCats = [];

      const localEv = localStorage.getItem(`event_name_${rNum}`) || '';
      const localYr = localStorage.getItem(`event_year_${rNum}`) || '';
      const localCS = localStorage.getItem(`convener_sadar_${rNum}`) || '';
      const localGen = localStorage.getItem(`general_cats_${rNum}`);

      if (madrasaData) {
        const parts = (madrasaData.place || '').split('|');
        const [, , trollStatus, dbTrollLang, dbEventName, dbEventYear, dbGeneralCats, dbConvenerSadar] = parts;
        setTrollMode(trollStatus === 'troll_on');
        setTrollLang(dbTrollLang === 'EN' ? 'EN' : 'ML');

        loadedEventName = dbEventName ? decodeURIComponent(dbEventName) : localEv;
        loadedEventYear = dbEventYear ? decodeURIComponent(dbEventYear) : localYr;
        loadedConvenerSadar = dbConvenerSadar ? decodeURIComponent(dbConvenerSadar) : localCS;

        if (dbGeneralCats) {
          try { loadedGenCats = JSON.parse(decodeURIComponent(dbGeneralCats)); } catch(e){}
        } else if (localGen) {
          try { loadedGenCats = JSON.parse(localGen); } catch(e){}
        }

        if (loadedEventName) {
          setEventName(loadedEventName);
          setEventNameInput(prev => prev === '' ? loadedEventName : prev);
          try { localStorage.setItem(`event_name_${rNum}`, loadedEventName); } catch(e){}
        }
        if (loadedEventYear) {
          setEventYear(loadedEventYear);
          setEventYearInput(prev => prev === '' ? loadedEventYear : prev);
          try { localStorage.setItem(`event_year_${rNum}`, loadedEventYear); } catch(e){}
        }
        if (loadedConvenerSadar) {
          setConvenerSadar(loadedConvenerSadar);
          setConvenerSadarInput(prev => prev === '' ? loadedConvenerSadar : prev);
          try { localStorage.setItem(`convener_sadar_${rNum}`, loadedConvenerSadar); } catch(e){}
        }
        if (Array.isArray(loadedGenCats) && loadedGenCats.length > 0) {
          setGeneralCatIds(loadedGenCats);
          try { localStorage.setItem(`general_cats_${rNum}`, JSON.stringify(loadedGenCats)); } catch(e){}
        }
      }

      if (Array.isArray(regData)) {
        parsedRegs = regData.map(r => ({
          ...r,
          program_id: r.program_name
        }));
        setProgramRegistrations(parsedRegs);
      }

      // Fetch group registrations (separate - not in allSettled above to keep it clean)
      let parsedGroupReg = [];
      try {
        const gRegPages = await fetchAllRows('group_registrations',
          q => q.eq('madrasa_id', rNum), rNum);
        if (Array.isArray(gRegPages)) {
          parsedGroupReg = gRegPages;
          setGroupRegistrations(gRegPages);
        }
      } catch (err) {
        console.error("Group registrations fetch failed: ", err);
      }

      // Fetch timetable
      let parsedTimetable = [];
      try {
        const { data: ttData } = await supabase
          .from('timetable')
          .select('*')
          .eq('madrasa_id', rNum);
        if (Array.isArray(ttData)) {
          parsedTimetable = ttData;
          setTimetable(ttData);
        }
      } catch (err) {
        console.error("Timetable fetch failed: ", err);
      }

      // Save fresh data snapshot to LocalStorage for offline PWA cache
      // Only save if we got meaningful data back (not partial zero-result failures)
      const gotValidData = (Array.isArray(teamsData) || Array.isArray(studentsData));
      if (gotValidData) {
        try {
          const snapshot = {
            teams: teamsData || [],
            categories: catsData || [],
            programs: programsData || [],
            students: parsedStudents.length > 0 ? parsedStudents : (studentsData || []),
            resultsList: resultsData || [],
            programRegistrations: parsedRegs,
            groupRegistrations: parsedGroupReg,
            timetable: parsedTimetable,
            eventName: loadedEventName || localEv,
            eventYear: loadedEventYear || localYr,
            convenerSadar: loadedConvenerSadar || localCS,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(snapshot));
        } catch (cacheSaveErr) {
          console.warn("Could not save offline cache:", cacheSaveErr);
        }
      }

    } catch (err) {
      console.warn("Data fetch warning (slow/weak network or timeout): ", err.message);
      // Fallback to cache without clearing current state
      loadCachedData(rNum);
    } finally {
      isFetchingRef.current = false;
    }
  };'''

if OLD_FETCH in content:
    content = content.replace(OLD_FETCH, NEW_FETCH, 1)
    print("SUCCESS: fetchSupabaseData replaced with paginated + allSettled version")
else:
    print("ERROR: Target not found")

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

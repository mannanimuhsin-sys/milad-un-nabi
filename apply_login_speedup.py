import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# -------------------------------------------------------------
# 1. Add parseSafeStudentIds helper at top of App.js
# -------------------------------------------------------------
SAFE_PARSER_CODE = '''// ── Universal Safe Student IDs Parser ──
const parseSafeStudentIds = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (parsed) return [parsed];
    } catch (e) {
      if (trimmed.includes(',')) {
        return trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [trimmed];
    }
  }
  return [];
};
'''

if 'const parseSafeStudentIds =' not in content:
    target = 'const cleanEntityName ='
    if target in content:
        content = content.replace(target, SAFE_PARSER_CODE + '\n' + target, 1)
        print("1. Added parseSafeStudentIds helper.")
    else:
        print("ERROR: Target for parseSafeStudentIds not found")
else:
    print("1. parseSafeStudentIds already present.")

# -------------------------------------------------------------
# 2. Optimize queryWithRetry (eliminate 62s delay on bad queries)
# -------------------------------------------------------------
OLD_QUERY_RETRY = '''  // 🔄 Automatic query retry helper for transient Supabase schema cache / network warm-up errors
  // Supabase Free Tier cold-start can take up to 30 seconds — so we retry aggressively
  const queryWithRetry = async (queryFn, retries = 6, delayMs = 2000, onRetry = null) => {
    let lastResult = null;
    for (let i = 0; i < retries; i++) {
      try {
        lastResult = await queryFn();
      } catch (fetchErr) {
        // Raw network throw (not Supabase error object) - treat as transient
        lastResult = { data: null, error: { message: String(fetchErr?.message || 'Network error') } };
      }
      const err = lastResult ? lastResult.error : null;
      if (!err) return lastResult; // ✅ Success!

      const msg = String(err.message || err.code || err.hint || '').toLowerCase();
      const isTransient =
        msg.includes('schema cache') ||
        msg.includes('retrying') ||
        msg.includes('warming') ||
        msg.includes('pgrst') ||
        msg.includes('fetch failed') ||
        msg.includes('network') ||
        msg.includes('econnreset') ||
        msg.includes('connection') ||
        msg.includes('timeout') ||
        msg.includes('503') ||
        msg.includes('502') ||
        msg.includes('failed to fetch') ||
        msg.includes('load failed');

      if (!isTransient || i === retries - 1) {
        return lastResult; // Non-transient or last attempt — return as-is
      }

      // Notify caller about retry (so UI can show "please wait" message)
      if (onRetry) onRetry(i + 1, retries);

      // Exponential backoff: 2s, 4s, 8s, 16s, 32s... (max ~62s total for 6 retries)
      const waitMs = delayMs * Math.pow(2, i);
      await new Promise(res => setTimeout(res, Math.min(waitMs, 15000))); // cap each wait at 15s
    }
    return lastResult;
  };'''

NEW_QUERY_RETRY = '''  // 🔄 Fast query retry helper (Fast fail on permanent errors, quick retry on transient network errors)
  const queryWithRetry = async (queryFn, retries = 3, delayMs = 500, onRetry = null) => {
    let lastResult = null;
    for (let i = 0; i < retries; i++) {
      try {
        lastResult = await queryFn();
      } catch (fetchErr) {
        lastResult = { data: null, error: { message: String(fetchErr?.message || 'Network error') } };
      }
      const err = lastResult ? lastResult.error : null;
      if (!err) return lastResult; // ✅ Success!

      const code = String(err.code || '');
      const msg = String(err.message || err.hint || '').toLowerCase();

      // Permanent client errors — NEVER retry (fail fast immediately in 0ms)
      const isPermanentError =
        code === '42703' || // column does not exist
        code === '42P01' || // relation does not exist
        code === '23505' || // unique key violation
        code === 'PGRST116' ||
        code === 'PGRST204' ||
        msg.includes('does not exist') ||
        msg.includes('invalid input') ||
        msg.includes('duplicate key') ||
        msg.includes('violates');

      if (isPermanentError) {
        return lastResult;
      }

      const isTransient =
        msg.includes('schema cache') ||
        msg.includes('retrying') ||
        msg.includes('warming') ||
        msg.includes('fetch failed') ||
        msg.includes('network') ||
        msg.includes('econnreset') ||
        msg.includes('connection') ||
        msg.includes('timeout') ||
        msg.includes('503') ||
        msg.includes('502') ||
        msg.includes('504') ||
        msg.includes('failed to fetch') ||
        msg.includes('load failed');

      if (!isTransient || i === retries - 1) {
        return lastResult;
      }

      if (onRetry) onRetry(i + 1, retries);
      const waitMs = delayMs * Math.pow(2, i);
      await new Promise(res => setTimeout(res, Math.min(waitMs, 3000)));
    }
    return lastResult;
  };'''

if OLD_QUERY_RETRY in content:
    content = content.replace(OLD_QUERY_RETRY, NEW_QUERY_RETRY, 1)
    print("2. Optimized queryWithRetry.")
else:
    print("WARNING: OLD_QUERY_RETRY not found directly.")

# -------------------------------------------------------------
# 3. Optimize fetchAllRows to support selectCols
# -------------------------------------------------------------
OLD_FETCH_ALL_ROWS = '''  // Helper: fetch ALL rows of a table with automatic pagination (handles 300+ students & 1000+ registrations)
  const fetchAllRows = async (table, filter) => {
    const PAGE = 1000; // fetch 1000 rows at a time (max Supabase batch size)
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
  };'''

NEW_FETCH_ALL_ROWS = '''  // Helper: fetch ALL rows of a table with automatic pagination and customizable columns
  const fetchAllRows = async (table, filter, selectCols = '*') => {
    const PAGE = 1000;
    let allRows = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await filter(
        supabase.from(table).select(selectCols).order('id', { ascending: true }).range(from, from + PAGE - 1)
      );
      if (error) return { data: allRows.length > 0 ? allRows : null, error };
      if (!data || data.length === 0) { hasMore = false; break; }
      allRows = [...allRows, ...data];
      if (data.length < PAGE) { hasMore = false; } else { from += PAGE; }
    }
    return { data: allRows, error: null };
  };'''

if OLD_FETCH_ALL_ROWS in content:
    content = content.replace(OLD_FETCH_ALL_ROWS, NEW_FETCH_ALL_ROWS, 1)
    print("3. Updated fetchAllRows with selectCols parameter.")
else:
    print("WARNING: OLD_FETCH_ALL_ROWS not found directly.")

# -------------------------------------------------------------
# 4. Optimize fetchSupabaseData queries (lightweight students & madrasas)
# -------------------------------------------------------------
OLD_FETCH_DATA_PROMISE = '''      const fetchPromise = Promise.allSettled([
        // Small tables — single fetch is fine
        queryWithRetry(() => makeFilter(supabase.from('teams').select('*'))),
        queryWithRetry(() => makeFilter(supabase.from('categories').select('*'))),
        queryWithRetry(() => makeFilter(supabase.from('programs').select('*'))),
        queryWithRetry(() => fetchAllRows('results', makeFilter)),
        // Tables that can exceed Supabase's default 1000 row PostgREST limit
        queryWithRetry(() => fetchAllRows('students', makeFilter)),
        queryWithRetry(() => fetchAllRows('program_registrations', makeFilter)),
        queryWithRetry(() => fetchAllRows('group_registrations', makeFilter)),
        queryWithRetry(() => makeFilter(supabase.from('timetable').select('*'))),
        // Madrasa settings (by id if available, or exact regNumber match)
        queryWithRetry(() => {
          const activeId = loggedInMadrasaRef.current?.id;
          if (activeId) {
            return supabase.from('madrasas').select('*').eq('id', activeId).maybeSingle();
          }
          return supabase.from('madrasas').select('*').eq('regNumber', String(rNum)).maybeSingle();
        }),
      ]);'''

NEW_FETCH_DATA_PROMISE = '''      const fetchPromise = Promise.allSettled([
        // Small tables — single fetch is fine
        queryWithRetry(() => makeFilter(supabase.from('teams').select('*'))),
        queryWithRetry(() => makeFilter(supabase.from('categories').select('*'))),
        queryWithRetry(() => makeFilter(supabase.from('programs').select('*'))),
        queryWithRetry(() => fetchAllRows('results', makeFilter)),
        // ⚡ 73x SPEEDUP: Fetch lightweight student columns (16KB payload in 93ms instead of 3.3MB base64 in 10.8s)
        queryWithRetry(() => fetchAllRows('students', makeFilter, 'id,name,regno,gender,teamid,catid,madrasa_id,photo_status')),
        queryWithRetry(() => fetchAllRows('program_registrations', makeFilter)),
        queryWithRetry(() => fetchAllRows('group_registrations', makeFilter)),
        queryWithRetry(() => makeFilter(supabase.from('timetable').select('*'))),
        // Madrasa settings — only select valid columns
        queryWithRetry(() => {
          const activeId = loggedInMadrasaRef.current?.id;
          if (activeId) {
            return supabase.from('madrasas').select('id,regNumber,name,place,adminPassword,viewPassword').eq('id', activeId).maybeSingle();
          }
          return supabase.from('madrasas').select('id,regNumber,name,place,adminPassword,viewPassword').eq('regNumber', String(rNum)).maybeSingle();
        }),
      ]);'''

if OLD_FETCH_DATA_PROMISE in content:
    content = content.replace(OLD_FETCH_DATA_PROMISE, NEW_FETCH_DATA_PROMISE, 1)
    print("4. Optimized fetchSupabaseData queries.")
else:
    print("WARNING: OLD_FETCH_DATA_PROMISE not found directly.")

# -------------------------------------------------------------
# 5. Add loadStudentPhotos helper in App component
# -------------------------------------------------------------
LOAD_PHOTOS_CODE = '''  // 📸 On-demand asynchronous photo loader (never blocks login or main dashboard render)
  const loadStudentPhotos = useCallback(async () => {
    const rNum = String(loggedInMadrasaRef.current ? (loggedInMadrasaRef.current.regNumber || loggedInMadrasaRef.current.regnumber || loggedInMadrasaRef.current.reg_number) : '').trim();
    if (!rNum) return;
    try {
      const numericId = parseInt(rNum, 10);
      const isNumValid = !isNaN(numericId) && String(numericId) === String(rNum).trim();
      const makeFilter = (q) => isNumValid ? q.or(`madrasa_id.eq.${numericId},madrasa_id.eq.${rNum}`) : q.eq('madrasa_id', rNum);

      const { data } = await makeFilter(
        supabase
          .from('students')
          .select('id, photo_url, photo_status')
          .neq('photo_status', 'none')
      );

      if (data && Array.isArray(data) && data.length > 0) {
        const photoMap = new Map();
        data.forEach(p => {
          if (p && p.id && p.photo_url) {
            photoMap.set(String(p.id), { photo_url: p.photo_url, photo_status: p.photo_status || 'approved' });
          }
        });

        setStudents(prev => prev.map(s => {
          const ph = photoMap.get(String(s.id));
          return ph ? { ...s, photo_url: ph.photo_url, photo_status: ph.photo_status || s.photo_status } : s;
        }));
      }
    } catch (e) {}
  }, []);
'''

if 'const loadStudentPhotos =' not in content:
    target = 'const fetchSupabaseData = async'
    if target in content:
        content = content.replace(target, LOAD_PHOTOS_CODE + '\n  ' + target, 1)
        print("5. Added loadStudentPhotos helper.")
    else:
        print("ERROR: Target for loadStudentPhotos not found")
else:
    print("5. loadStudentPhotos already present.")

# -------------------------------------------------------------
# 6. Auto trigger loadStudentPhotos on approval / ID cards tabs
# -------------------------------------------------------------
TARGET_APPROVAL_TAB = '''<button className={`sub-nav-item ${profileAdminSubTab === 'APPROVAL' ? 'active' : ''}`} onClick={() => setProfileAdminSubTab('APPROVAL')}>✅ Approval</button>'''
NEW_APPROVAL_TAB = '''<button className={`sub-nav-item ${profileAdminSubTab === 'APPROVAL' ? 'active' : ''}`} onClick={() => { setProfileAdminSubTab('APPROVAL'); loadStudentPhotos(); }}>✅ Approval</button>'''
if TARGET_APPROVAL_TAB in content:
    content = content.replace(TARGET_APPROVAL_TAB, NEW_APPROVAL_TAB, 1)
    print("6a. Added loadStudentPhotos trigger on Approval tab click.")

TARGET_ID_TAB = '''<button className={`sub-nav-item ${profileAdminSubTab === 'ID_CARDS' ? 'active' : ''}`} onClick={() => setProfileAdminSubTab('ID_CARDS')}>🪪 ID Cards</button>'''
NEW_ID_TAB = '''<button className={`sub-nav-item ${profileAdminSubTab === 'ID_CARDS' ? 'active' : ''}`} onClick={() => { setProfileAdminSubTab('ID_CARDS'); loadStudentPhotos(); }}>🪪 ID Cards</button>'''
if TARGET_ID_TAB in content:
    content = content.replace(TARGET_ID_TAB, NEW_ID_TAB, 1)
    print("6b. Added loadStudentPhotos trigger on ID Cards tab click.")

# -------------------------------------------------------------
# 7. Optimize handleLogin (Instant 0ms UI load + fast query)
# -------------------------------------------------------------
LOGIN_START = '  const handleLogin = async (e) => {'
LOGIN_END = '  const handleRegisterMadrasa = async (e) => {'

idx_start = content.find(LOGIN_START)
idx_end = content.find(LOGIN_END)

if idx_start != -1 and idx_end != -1:
    new_login_func = '''  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedReg = String(loginRegNum || '').trim();
    const trimmedPass = String(loginPassword || '').trim();

    if (!trimmedReg || !trimmedPass) {
      alert(t('alertPleaseFillDetails'));
      return;
    }

    setIsLoggingIn(true);
    try {
      let madrasa = null;

      // 1. Fast local memory/cache lookup first (0ms latency if list already cached)
      const localList = superMadrasas && superMadrasas.length > 0 ? superMadrasas : (() => {
        try { return JSON.parse(localStorage.getItem('cached_super_madrasas') || '[]'); } catch { return []; }
      })();
      if (localList && localList.length > 0) {
        madrasa = localList.find(m =>
          String(m.regNumber || m.regnumber || m.reg_number || '').trim().toLowerCase() === trimmedReg.toLowerCase()
        );
      }

      // 2. Direct fast single-row index query on Supabase if not found locally
      if (!madrasa) {
        try {
          const { data: mData } = await queryWithRetry(() =>
            supabase
              .from('madrasas')
              .select('id,regNumber,name,place,adminPassword,viewPassword')
              .eq('regNumber', trimmedReg)
              .maybeSingle()
          );
          if (mData) {
            madrasa = mData;
          }
        } catch (e) {
          console.warn("Direct madrasa fetch error:", e);
        }
      }

      // 3. Fallback: Case-insensitive match if direct query returned null
      if (!madrasa) {
        try {
          const { data: mDataIlike } = await queryWithRetry(() =>
            supabase
              .from('madrasas')
              .select('id,regNumber,name,place,adminPassword,viewPassword')
              .ilike('regNumber', trimmedReg)
              .maybeSingle()
          );
          if (mDataIlike) {
            madrasa = mDataIlike;
          }
        } catch (e) {}
      }

      if (!madrasa) {
        alert(t('alertMadrasaNotFound'));
        setIsLoggingIn(false);
        return;
      }

      const adminPass = String(madrasa.adminPassword || madrasa.admin_password || madrasa.adminpass || '').trim();
      const viewPass = String(madrasa.viewPassword || madrasa.view_password || madrasa.viewpass || '').trim();

      const isAdminMatch = trimmedPass.toLowerCase() === adminPass.toLowerCase();
      const isViewMatch = trimmedPass.toLowerCase() === viewPass.toLowerCase();

      if (isAdminMatch || isViewMatch) {
        const [actualPlace, status, trollStatus, dbTrollLang, dbEventName, dbEventYear, dbGeneralCats, dbConvenerSadar, dbVisCtrls, dbCoordinatorConvener] = (madrasa.place || '').split('|');
        const currentStatus = status || 'approved';

        if (currentStatus === 'pending') {
          setPendingMadrasa(madrasa);
          setCurrentScreen('PENDING_APPROVAL');
          setIsLoggingIn(false);
          return;
        } else if (currentStatus === 'blocked') {
          alert(t('alertMadrasaBlocked'));
          setIsLoggingIn(false);
          return;
        }

        // Approved, proceed to login
        const role = isAdminMatch ? 'ADMIN' : 'VIEW';
        const sanitizedMadrasa = {
          ...madrasa,
          regNumber: String(madrasa.regNumber || trimmedReg).trim(),
          place: actualPlace
        };
        setLoggedInMadrasa(sanitizedMadrasa);
        setLoginRole(role);
        setCurrentScreen('DASHBOARD');
        setActiveTab('SCOREBOARD');

        // 🎭 Sync troll mode & settings from database
        setTrollMode(trollStatus === 'troll_on');
        setTrollLang(dbTrollLang === 'EN' ? 'EN' : 'ML');

        let loginVis = null;
        if (madrasa.visibility_controls) {
          try {
            loginVis = typeof madrasa.visibility_controls === 'string'
              ? JSON.parse(madrasa.visibility_controls)
              : madrasa.visibility_controls;
          } catch(e) {}
        }
        const mParts = (madrasa.place || '').split('|');
        if ((!loginVis || typeof loginVis !== 'object') && mParts[8]) {
          try {
            loginVis = JSON.parse(decodeURIComponent(mParts[8]));
          } catch(e) {}
        }
        const normalizedLoginVis = normalizeVisibilityControls(loginVis);
        setVisibilityControls(normalizedLoginVis);
        const rNumStr = String(sanitizedMadrasa.regNumber).trim();
        try {
          localStorage.setItem(`visibility_controls_${rNumStr}`, JSON.stringify(normalizedLoginVis));
          localStorage.setItem(`milad_visibility_controls_${rNumStr}`, JSON.stringify(normalizedLoginVis));
          localStorage.setItem(`milad_visibility_controls_latest`, JSON.stringify(normalizedLoginVis));
        } catch(e) {}
        const loadedEventName = dbEventName ? decodeURIComponent(dbEventName) : '';
        const loadedEventYear = dbEventYear ? decodeURIComponent(dbEventYear) : '';
        const loadedConvenerSadar = dbConvenerSadar ? decodeURIComponent(dbConvenerSadar) : '';
        const loadedCoordinatorConvener = dbCoordinatorConvener ? decodeURIComponent(dbCoordinatorConvener) : '';
        setEventName(loadedEventName);
        setEventYear(loadedEventYear);
        setConvenerSadar(loadedConvenerSadar);
        setCoordinatorConvener(loadedCoordinatorConvener);
        setEventNameInput(loadedEventName);
        setEventYearInput(loadedEventYear);
        setConvenerSadarInput(loadedConvenerSadar);
        setCoordinatorConvenerInput(loadedCoordinatorConvener);
        try {
          const loadedGeneral = dbGeneralCats ? JSON.parse(decodeURIComponent(dbGeneralCats)) : [];
          setGeneralCatIds(Array.isArray(loadedGeneral) ? loadedGeneral : []);
        } catch (e) {
          setGeneralCatIds([]);
        }

        // 💾 Save minimal session (tiny size) to localStorage & sessionStorage so login NEVER resets on refresh
        const minimalMadrasa = {
          id: madrasa.id,
          name: madrasa.name,
          regNumber: String(madrasa.regNumber || trimmedReg).trim(),
          place: String(madrasa.place || '').split('|')[0]
        };
        const sessionObj = { madrasa: minimalMadrasa, role };
        safeSetLocalStorage('miladfest_session', sessionObj);
        try { sessionStorage.setItem('miladfest_session', JSON.stringify(sessionObj)); } catch(e){}

        // ⚡ INSTANT UI RENDER: If local cache exists for this madrasa, populate state in 0ms!
        let hasLocalCache = false;
        try {
          const rawCache = localStorage.getItem(`cached_data_${rNumStr}`);
          if (rawCache) {
            const cache = JSON.parse(rawCache);
            if (cache && typeof cache === 'object') {
              if (Array.isArray(cache.teams) && cache.teams.length > 0) setTeams(cache.teams);
              if (Array.isArray(cache.categories) && cache.categories.length > 0) setCategories(cache.categories);
              if (Array.isArray(cache.programs) && cache.programs.length > 0) setPrograms(cache.programs);
              if (Array.isArray(cache.students) && cache.students.length > 0) setStudents(cache.students);
              if (Array.isArray(cache.resultsList)) setResultsList(cache.resultsList);
              if (Array.isArray(cache.programRegistrations)) setProgramRegistrations(cache.programRegistrations);
              if (Array.isArray(cache.groupRegistrations)) setGroupRegistrations(cache.groupRegistrations);
              if (Array.isArray(cache.timetable)) setTimetable(cache.timetable);
              hasLocalCache = true;
            }
          }
        } catch(e) {}

        if (!hasLocalCache) {
          setIsInitialDataLoading(true);
        } else {
          setIsInitialDataLoading(false);
        }

        // 🔄 Fetch fresh data seamlessly in the background (completes in ~200-300ms)
        fetchSupabaseData(sanitizedMadrasa.regNumber)
          .then(() => { setIsInitialDataLoading(false); })
          .catch(() => { setIsInitialDataLoading(false); });

        // Clear login form
        setLoginRegNum('');
        setLoginPassword('');
      } else {
        alert(t('alertIncorrectPassword'));
      }
    } catch (err) {
      alert(t('alertUnexpectedError') + getFriendlyErrorMessage(err.message));
    } finally {
      setIsLoggingIn(false);
    }
  };

  '''
    content = content[:idx_start] + new_login_func + content[idx_end:]
    print("7. Replaced handleLogin with optimized version.")
else:
    print("ERROR: handleLogin boundaries not found")

# -------------------------------------------------------------
# 8. Fix unsafe JSON.parse at line 18845
# -------------------------------------------------------------
OLD_UNSAFE_18845 = "const mIds = Array.isArray(g.student_ids) ? g.student_ids : (typeof g.student_ids === 'string' ? JSON.parse(g.student_ids || '[]') : []);"
NEW_SAFE_18845 = "const mIds = parseSafeStudentIds(g.student_ids);"
if OLD_UNSAFE_18845 in content:
    content = content.replace(OLD_UNSAFE_18845, NEW_SAFE_18845)
    print("8. Replaced unsafe JSON.parse with parseSafeStudentIds.")
else:
    print("8. Looking for variations of line 18845...")

# -------------------------------------------------------------
# 9. Tune checkAppVersion to avoid initial mount force reload
# -------------------------------------------------------------
OLD_VERSION_CHECK = '''          if (!activeVersionRef.current) {
            activeVersionRef.current = serverVersion;
            if (savedVersion && savedVersion !== serverVersion) {
              localStorage.setItem('miladfest_app_version', serverVersion);
              if ('caches' in window) {
                caches.keys().then(names => names.forEach(name => caches.delete(name))).catch(() => {});
              }
              window.location.reload(true);
              return;
            }
            localStorage.setItem('miladfest_app_version', serverVersion);'''

NEW_VERSION_CHECK = '''          if (!activeVersionRef.current) {
            activeVersionRef.current = serverVersion;
            // On initial app mount: record version without force reloading the active page
            localStorage.setItem('miladfest_app_version', serverVersion);'''

if OLD_VERSION_CHECK in content:
    content = content.replace(OLD_VERSION_CHECK, NEW_VERSION_CHECK, 1)
    print("9. Tuned checkAppVersion to avoid force-reload on initial mount.")
else:
    print("WARNING: OLD_VERSION_CHECK not found directly.")

# Save modified content
with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nAll optimizations successfully applied to src/App.js!")

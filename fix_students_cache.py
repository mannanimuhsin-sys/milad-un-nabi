import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# FIX 1: Replace paginated fetchAllRows for students with
# a simple high-limit single query (more reliable)
# ============================================================

OLD_STUDENTS_FETCH = '''        // Large tables — paginated to handle 300+ rows
        (async () => {
          const rows = await fetchAllRows('students', makeFilter, rNum);
          return { data: rows, error: null };
        })(),
        (async () => {
          const rows = await fetchAllRows('program_registrations', makeFilter, rNum);
          return { data: rows, error: null };
        })(),'''

NEW_STUDENTS_FETCH = '''        // Students — use high-limit range query (more reliable than pagination)
        queryWithRetry(() => makeFilter(supabase.from('students').select('*').range(0, 4999))),
        queryWithRetry(() => makeFilter(supabase.from('program_registrations').select('*').range(0, 9999))),'''

if OLD_STUDENTS_FETCH in content:
    content = content.replace(OLD_STUDENTS_FETCH, NEW_STUDENTS_FETCH, 1)
    print("FIX1: Students fetch simplified to high-limit range query")
else:
    print("FIX1: Target not found")

# ============================================================
# FIX 2: Never overwrite cache students with empty/zero result
# Read existing cached students and preserve them if new data is empty
# ============================================================

OLD_CACHE_SAVE = '''      // Save fresh data snapshot to LocalStorage for offline PWA cache
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
      }'''

NEW_CACHE_SAVE = '''      // Save fresh data snapshot to LocalStorage for offline PWA cache
      // CRITICAL: Never overwrite students/programs with empty results from transient failures
      const gotValidData = (Array.isArray(teamsData) && teamsData !== null);
      if (gotValidData) {
        try {
          // Read existing cache to preserve students/programs if new fetch returned empty
          let existingCached = null;
          try {
            const existingRaw = localStorage.getItem(`cached_data_${rNum}`);
            if (existingRaw) existingCached = JSON.parse(existingRaw);
          } catch(e) {}

          const existingStudents = (existingCached && Array.isArray(existingCached.students)) ? existingCached.students : [];
          const existingPrograms = (existingCached && Array.isArray(existingCached.programs)) ? existingCached.programs : [];
          const existingRegs = (existingCached && Array.isArray(existingCached.programRegistrations)) ? existingCached.programRegistrations : [];

          // Only use fresh data if it's non-empty OR if we had nothing before
          const freshStudents = parsedStudents.length > 0 ? parsedStudents : existingStudents;
          const freshPrograms = (Array.isArray(programsData) && programsData.length > 0) ? programsData : existingPrograms;
          const freshRegs = (parsedRegs.length > 0 || existingRegs.length === 0) ? parsedRegs : existingRegs;

          const snapshot = {
            teams: teamsData || [],
            categories: catsData || [],
            programs: freshPrograms,
            students: freshStudents,
            resultsList: resultsData || [],
            programRegistrations: freshRegs,
            groupRegistrations: parsedGroupReg.length > 0 ? parsedGroupReg : ((existingCached && existingCached.groupRegistrations) || []),
            timetable: parsedTimetable.length > 0 ? parsedTimetable : ((existingCached && existingCached.timetable) || []),
            eventName: loadedEventName || localEv,
            eventYear: loadedEventYear || localYr,
            convenerSadar: loadedConvenerSadar || localCS,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(snapshot));
        } catch (cacheSaveErr) {
          console.warn("Could not save offline cache:", cacheSaveErr);
        }
      }'''

if OLD_CACHE_SAVE in content:
    content = content.replace(OLD_CACHE_SAVE, NEW_CACHE_SAVE, 1)
    print("FIX2: Cache save now preserves existing students if new fetch returned empty")
else:
    print("FIX2: Cache save target not found")

# ============================================================
# FIX 3: Students state update — also keep existing students
# if DB returned 0 (setStudents already guarded with length>0, but add clarity)
# ============================================================

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("DONE")

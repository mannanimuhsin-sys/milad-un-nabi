import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# CORE FIX: Initialize critical states from localStorage cache
# BEFORE first render - eliminates "flash of 0" completely
# ============================================================

# Helper function to inject BEFORE the states - reads cache synchronously
CACHE_HELPER = '''  // ── Synchronous cache reader (used for lazy useState initialization) ──
  const _rNum = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('miladfest_session') || 'null');
      return s && s.madrasa ? String(s.madrasa.regNumber || s.madrasa.regnumber || s.madrasa.reg_number || '').trim() : '';
    } catch { return ''; }
  })();
  const _initCache = (() => {
    if (!_rNum) return null;
    try {
      const raw = localStorage.getItem(`cached_data_${_rNum}`);
      if (!raw) return null;
      const c = JSON.parse(raw);
      return (c && typeof c === 'object') ? c : null;
    } catch { return null; }
  })();

'''

# The state declarations to replace
OLD_STATES = '''  // Master data states (Supabase online database)
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);'''

NEW_STATES = '''  // Master data states (Supabase online database)
  // ✅ Lazy initializers read from localStorage cache BEFORE first render
  // This eliminates the "flash of 0" when refreshing the page
  const [teams, setTeams] = useState(() => {
    try { return (_initCache && Array.isArray(_initCache.teams) && _initCache.teams.length > 0) ? _initCache.teams : []; } catch { return []; }
  });
  const [categories, setCategories] = useState(() => {
    try { return (_initCache && Array.isArray(_initCache.categories) && _initCache.categories.length > 0) ? _initCache.categories : []; } catch { return []; }
  });'''

OLD_AFTER_CALLBACK = '''  const [dbHasClassRange, setDbHasClassRange] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [timetableFilterCat, setTimetableFilterCat] = useState('ALL');
  const [timetableFilterGender, setTimetableFilterGender] = useState('ALL');
  const [timetableView, setTimetableView] = useState('GRID'); // 'GRID' | 'LIST'
  const [editingTimetableId, setEditingTimetableId] = useState(null);
  const [timetableFormData, setTimetableFormData] = useState({ scheduled_time: '', date: '', hour12: '09', minute: '00', ampm: 'AM', venue: '' });
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [resultsList, setResultsList] = useState([]);
  const [programRegistrations, setProgramRegistrations] = useState([]);'''

NEW_AFTER_CALLBACK = '''  const [dbHasClassRange, setDbHasClassRange] = useState(false);
  const [timetable, setTimetable] = useState(() => {
    try { return (_initCache && Array.isArray(_initCache.timetable)) ? _initCache.timetable : []; } catch { return []; }
  });
  const [timetableFilterCat, setTimetableFilterCat] = useState('ALL');
  const [timetableFilterGender, setTimetableFilterGender] = useState('ALL');
  const [timetableView, setTimetableView] = useState('GRID'); // 'GRID' | 'LIST'
  const [editingTimetableId, setEditingTimetableId] = useState(null);
  const [timetableFormData, setTimetableFormData] = useState({ scheduled_time: '', date: '', hour12: '09', minute: '00', ampm: 'AM', venue: '' });
  const [students, setStudents] = useState(() => {
    try {
      if (_initCache && Array.isArray(_initCache.students) && _initCache.students.length > 0) {
        return [..._initCache.students].sort((a, b) => {
          const aR = parseInt(a.regno || a.regNo || '0') || 0;
          const bR = parseInt(b.regno || b.regNo || '0') || 0;
          return aR - bR;
        });
      }
    } catch {}
    return [];
  });
  const [programs, setPrograms] = useState(() => {
    try {
      if (_initCache && Array.isArray(_initCache.programs) && _initCache.programs.length > 0) {
        return [..._initCache.programs].sort((a, b) => {
          const aC = parseInt(a.code) || 0;
          const bC = parseInt(b.code) || 0;
          return aC - bC || String(a.code || '').localeCompare(String(b.code || ''));
        });
      }
    } catch {}
    return [];
  });
  const [resultsList, setResultsList] = useState(() => {
    try { return (_initCache && Array.isArray(_initCache.resultsList)) ? _initCache.resultsList : []; } catch { return []; }
  });
  const [programRegistrations, setProgramRegistrations] = useState(() => {
    try { return (_initCache && Array.isArray(_initCache.programRegistrations)) ? _initCache.programRegistrations : []; } catch { return []; }
  });'''

# Apply the changes
if OLD_STATES in content:
    # Insert cache helper before the state declarations
    content = content.replace(
        '  // Master data states (Supabase online database)\n' + '  const [teams, setTeams] = useState([]);\n',
        CACHE_HELPER + '  // Master data states (Supabase online database)\n' + '  const [teams, setTeams] = useState([]);\n',
        1
    )
    print("STEP1: Cache helper inserted")
    # Now replace the states
    if OLD_STATES in content:
        content = content.replace(OLD_STATES, NEW_STATES, 1)
        print("STEP2: teams+categories states updated")
    else:
        print("STEP2: teams+categories state not found (already updated?)")
else:
    print("STEP1: OLD_STATES not found")

if OLD_AFTER_CALLBACK in content:
    content = content.replace(OLD_AFTER_CALLBACK, NEW_AFTER_CALLBACK, 1)
    print("STEP3: students/programs/registrations states updated with lazy cache init")
else:
    print("STEP3: remaining states not found")

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("DONE")

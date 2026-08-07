import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# FIX 1: Remove the loadCachedData call from INSIDE fetchSupabaseData
# This causes stale cache to overwrite freshly edited/deleted data every 15s
# ============================================================
OLD_FETCH_LOAD_CACHE = '''    // 🚀 Load local cache immediately for instant UI render (<10ms)
    loadCachedData(rNum);

    // Prevent concurrent stacked requests on weak connections'''

NEW_FETCH_LOAD_CACHE = '''    // Prevent concurrent stacked requests on weak connections'''

if OLD_FETCH_LOAD_CACHE in content:
    content = content.replace(OLD_FETCH_LOAD_CACHE, NEW_FETCH_LOAD_CACHE, 1)
    print("FIX1: Removed stale loadCachedData() call from inside fetchSupabaseData")
else:
    print("FIX1: Target not found")

# ============================================================
# FIX 2: handleDeleteStudent - add cache update after deletion
# Without this, stale cache re-introduces deleted student on next interval
# ============================================================
OLD_DELETE_STUDENT = '''  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Remove this student?')) return;
    const originalStudents = [...students];
    setStudents(prev => prev.filter(s => s.id !== id));
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        alert('Error: ' + getFriendlyErrorMessage(error.message));
        setStudents(originalStudents);
      }
    } catch (err) {
      alert('Error: ' + getFriendlyErrorMessage(err.message));
      setStudents(originalStudents);
    }
  };'''

NEW_DELETE_STUDENT = '''  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Remove this student?')) return;
    const originalStudents = [...students];
    setStudents(prev => {
      const updated = prev.filter(s => s.id !== id);
      // Update cache immediately so 15s interval doesn't re-introduce deleted student
      try {
        const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa?.regNumber}`);
        if (rawCache) {
          const cacheObj = JSON.parse(rawCache);
          cacheObj.students = updated;
          localStorage.setItem(`cached_data_${loggedInMadrasa?.regNumber}`, JSON.stringify(cacheObj));
        }
      } catch(e) {}
      return updated;
    });
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        alert('Error: ' + getFriendlyErrorMessage(error.message));
        // Rollback state and cache
        setStudents(prev => {
          try {
            const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa?.regNumber}`);
            if (rawCache) {
              const cacheObj = JSON.parse(rawCache);
              cacheObj.students = originalStudents;
              localStorage.setItem(`cached_data_${loggedInMadrasa?.regNumber}`, JSON.stringify(cacheObj));
            }
          } catch(e) {}
          return originalStudents;
        });
      }
    } catch (err) {
      alert('Error: ' + getFriendlyErrorMessage(err.message));
      setStudents(prev => {
        try {
          const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa?.regNumber}`);
          if (rawCache) {
            const cacheObj = JSON.parse(rawCache);
            cacheObj.students = originalStudents;
            localStorage.setItem(`cached_data_${loggedInMadrasa?.regNumber}`, JSON.stringify(cacheObj));
          }
        } catch(e) {}
        return originalStudents;
      });
    }
  };'''

if OLD_DELETE_STUDENT in content:
    content = content.replace(OLD_DELETE_STUDENT, NEW_DELETE_STUDENT, 1)
    print("FIX2: handleDeleteStudent - cache update added")
else:
    print("FIX2: handleDeleteStudent target not found")

# ============================================================
# FIX 3: handleDeleteTeam - add cache update and rollback on error
# ============================================================
OLD_DELETE_TEAM = '''  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Remove this team?')) return;
    setTeams(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) { alert(getFriendlyErrorMessage(error.message)); }
  };'''

NEW_DELETE_TEAM = '''  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Remove this team?')) return;
    const originalTeams = [...teams];
    setTeams(prev => {
      const updated = prev.filter(t => t.id !== id);
      try {
        const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa?.regNumber}`);
        if (rawCache) {
          const cacheObj = JSON.parse(rawCache);
          cacheObj.teams = updated;
          localStorage.setItem(`cached_data_${loggedInMadrasa?.regNumber}`, JSON.stringify(cacheObj));
        }
      } catch(e) {}
      return updated;
    });
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) {
      alert(getFriendlyErrorMessage(error.message));
      setTeams(prev => {
        try {
          const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa?.regNumber}`);
          if (rawCache) {
            const cacheObj = JSON.parse(rawCache);
            cacheObj.teams = originalTeams;
            localStorage.setItem(`cached_data_${loggedInMadrasa?.regNumber}`, JSON.stringify(cacheObj));
          }
        } catch(e) {}
        return originalTeams;
      });
    }
  };'''

if OLD_DELETE_TEAM in content:
    content = content.replace(OLD_DELETE_TEAM, NEW_DELETE_TEAM, 1)
    print("FIX3: handleDeleteTeam - cache update + rollback added")
else:
    print("FIX3: handleDeleteTeam target not found")

# ============================================================
# FIX 4: handleSaveTeamEdit - add cache update
# ============================================================
OLD_SAVE_TEAM = '''  const handleSaveTeamEdit = async () => {
    if (!editingTeamName.trim()) return;
    const targetId = editingTeamId;
    const updatedName = editingTeamName.trim();
    setTeams(prev => prev.map(t => t.id === targetId ? { ...t, name: updatedName } : t));
    setEditingTeamId(null);
    const { error } = await supabase.from('teams').update({ name: updatedName }).eq('id', targetId);
    if (error) { alert('Error: ' + getFriendlyErrorMessage(error.message)); }
  };'''

NEW_SAVE_TEAM = '''  const handleSaveTeamEdit = async () => {
    if (!editingTeamName.trim()) return;
    const targetId = editingTeamId;
    const updatedName = editingTeamName.trim();
    setTeams(prev => {
      const updated = prev.map(t => t.id === targetId ? { ...t, name: updatedName } : t);
      try {
        const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa?.regNumber}`);
        if (rawCache) {
          const cacheObj = JSON.parse(rawCache);
          cacheObj.teams = updated;
          localStorage.setItem(`cached_data_${loggedInMadrasa?.regNumber}`, JSON.stringify(cacheObj));
        }
      } catch(e) {}
      return updated;
    });
    setEditingTeamId(null);
    const { error } = await supabase.from('teams').update({ name: updatedName }).eq('id', targetId);
    if (error) { alert('Error: ' + getFriendlyErrorMessage(error.message)); }
  };'''

if OLD_SAVE_TEAM in content:
    content = content.replace(OLD_SAVE_TEAM, NEW_SAVE_TEAM, 1)
    print("FIX4: handleSaveTeamEdit - cache update added")
else:
    print("FIX4: handleSaveTeamEdit target not found")

# ============================================================
# FIX 5: Fix cache protection in fetchSupabaseData
# Only preserve existing students if there was a FETCH ERROR (not just 0 results)
# This fixes the edge case where 0 from DB is legitimate (e.g. all students deleted)
# ============================================================
OLD_CACHE_PROTECTION = '''          // Only use fresh data if it's non-empty OR if we had nothing before
          const freshStudents = parsedStudents.length > 0 ? parsedStudents : existingStudents;
          const freshPrograms = (Array.isArray(programsData) && programsData.length > 0) ? programsData : existingPrograms;
          const freshRegs = (parsedRegs.length > 0 || existingRegs.length === 0) ? parsedRegs : existingRegs;'''

NEW_CACHE_PROTECTION = '''          // Only use fresh data if it's non-empty; preserve existing ONLY if fetch failed (null result)
          // If DB returns [] (empty array), trust it — it might be a legitimate empty state
          // Only fall back to existing if DB returned null (meaning fetch failed entirely)
          const freshStudents = (studentsData !== null && parsedStudents.length > 0) ? parsedStudents
            : (studentsData === null ? existingStudents : parsedStudents);
          const freshPrograms = (Array.isArray(programsData) && programsData.length > 0) ? programsData
            : (programsData === null ? existingPrograms : programsData || []);
          const freshRegs = (parsedRegs.length > 0) ? parsedRegs
            : (regData === null ? existingRegs : parsedRegs);'''

if OLD_CACHE_PROTECTION in content:
    content = content.replace(OLD_CACHE_PROTECTION, NEW_CACHE_PROTECTION, 1)
    print("FIX5: Cache protection logic - only fallback on null (fetch error), not on empty array")
else:
    print("FIX5: Cache protection target not found")

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nDONE - all fixes applied")

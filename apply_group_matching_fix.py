import sys

file_path = r'd:\MILAD UN NABI\milad\src\App.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update isResultMatchForSingleStudent to prevent matching by name if progid is present and doesn't match
old_single_prog_match = """    let pMatch = false;
    if (pIdStr && rPid === pIdStr) pMatch = true;
    else if (pCodeStr && (rPid === pCodeStr || rPname.startsWith(pCodeStr))) pMatch = true;
    else if (pNameStr && rPname === pNameStr) pMatch = true;

    if (!pMatch) return false;"""

new_single_prog_match = """    let pMatch = false;
    if (pIdStr && (rPid === pIdStr || (!isNaN(parseInt(rPid, 10)) && parseInt(rPid, 10) === parseInt(pIdStr, 10)))) pMatch = true;
    else if (pCodeStr && (rPid === pCodeStr || rPname.startsWith(pCodeStr) || (!isNaN(parseInt(rPid, 10)) && parseInt(rPid, 10) === parseInt(pCodeStr, 10)))) pMatch = true;

    // CRITICAL: If r has a progid and it does not match program ID or code, never match by name!
    if (rPid && !pMatch) return false;

    if (!pMatch && pNameStr && rPname === pNameStr) pMatch = true;

    if (!pMatch) return false;"""

if old_single_prog_match not in content:
    print("WARNING: old_single_prog_match not found exactly. Searching...")
else:
    content = content.replace(old_single_prog_match, new_single_prog_match, 1)
    print("Replaced old_single_prog_match successfully.")

# 2. Update isResultMatchForGroup
old_group_matcher = """// ── Strict Group Result Matcher ──
// madrasaId (optional): if provided, result's madrasa_id MUST match to prevent cross-madrasa contamination
const isResultMatchForGroup = (r, g, prog = null, madrasaId = null) => {
  if (!r || !g) return false;
  // ── 0. Madrasa Guard ──
  if (madrasaId) {
    const rMId = String(r.madrasa_id || '').trim();
    const mIds = Array.isArray(madrasaId) ? madrasaId.map(String).map(s => s.trim()) : [String(madrasaId).trim()];
    if (rMId && mIds.length > 0 && !mIds.includes(rMId)) return false;
  }

  // 1. Program Match
  const rPid = String(r.progid || r.program_id || '').trim().toLowerCase();
  const gPid = String(g.program_id || '').trim().toLowerCase();
  const pId = prog ? String(prog.id || '').trim().toLowerCase() : '';
  const pCode = prog ? String(prog.code || '').trim().toLowerCase() : '';

  let pMatch = (gPid && rPid === gPid) || (pId && rPid === pId) || (pCode && rPid === pCode);
  if (!pMatch && prog && prog.name) {
    const rPname = String(r.progname || r.program_name || '').trim().toLowerCase();
    if (rPname && rPname === String(prog.name).trim().toLowerCase()) pMatch = true;
  }
  if (!pMatch) return false;

  // 2. Explicit Group ID match
  if (r.group_id && g.id && String(r.group_id) === String(g.id)) return true;

  // 3. Group Name match
  const rRawName = String(r.studentname || r.studentName || '').trim();
  const gName = String(g.group_name || '').trim();
  const rClean = cleanEntityName(rRawName);
  const gClean = cleanEntityName(gName);

  if (gClean && (
    rClean === gClean ||
    rRawName.toLowerCase() === gName.toLowerCase() ||
    rRawName.toLowerCase() === `👥 ${gName.toLowerCase()}` ||
    rClean.startsWith(gClean + ' -') ||
    rClean.startsWith(gClean + '-') ||
    rClean.startsWith(gClean + ' [')
  )) {
    return true;
  }

  // 4. Team-level match ONLY IF result is named as generic Team Group AND team ID matches
  const gTeamId = String(g.team_id || '').trim();
  const rTeamId = String(r.teamid || r.team_id || '').trim();
  if (gTeamId && rTeamId && gTeamId === rTeamId) {
    if (rClean === 'group' || rClean === 'team group') {
      return true;
    }
  }

  return false;
};"""

new_group_matcher = """// ── Strict Group Result Matcher ──
// madrasaId (optional): if provided, result's madrasa_id MUST match to prevent cross-madrasa contamination
const isResultMatchForGroup = (r, g, prog = null, madrasaId = null, catList = []) => {
  if (!r || !g) return false;
  // ── 0. Madrasa Guard ──
  if (madrasaId) {
    const rMId = String(r.madrasa_id || '').trim();
    const mIds = Array.isArray(madrasaId) ? madrasaId.map(String).map(s => s.trim()) : [String(madrasaId).trim()];
    if (rMId && mIds.length > 0 && !mIds.includes(rMId)) return false;
  }

  // ── 1. Program Match (Strict ID / Code first) ──
  const rPid = String(r.progid || r.program_id || '').trim().toLowerCase();
  const gPid = String(g.program_id || '').trim().toLowerCase();
  const pId = prog ? String(prog.id || '').trim().toLowerCase() : '';
  const pCode = prog ? String(prog.code || '').trim().toLowerCase() : '';

  let pMatch = false;
  if (rPid) {
    if (gPid && (rPid === gPid || (!isNaN(parseInt(rPid, 10)) && parseInt(rPid, 10) === parseInt(gPid, 10)))) {
      pMatch = true;
    } else if (pId && (rPid === pId || (!isNaN(parseInt(rPid, 10)) && parseInt(rPid, 10) === parseInt(pId, 10)))) {
      pMatch = true;
    } else if (pCode && (rPid === pCode || (!isNaN(parseInt(rPid, 10)) && parseInt(rPid, 10) === parseInt(pCode, 10)))) {
      pMatch = true;
    }
  }

  // CRITICAL: If r has a progid and it does NOT match program ID or code, it is a DIFFERENT program!
  // NEVER fall back to program name when r.progid is present!
  if (rPid && !pMatch) {
    return false;
  }

  // Fallback to name match ONLY IF rPid was empty or matched
  if (!pMatch) {
    if (prog && prog.name) {
      const rPname = String(r.progname || r.program_name || '').trim().toLowerCase();
      const pName = String(prog.name).trim().toLowerCase();
      if (rPname && rPname === pName) {
        pMatch = true;
      }
    }
  }
  if (!pMatch) return false;

  // ── 2. Category Match Guard ──
  // Never match results across categories (e.g. Sub Junior vs Junior vs Senior)
  const rCatName = String(r.catname || r.catName || '').trim().toLowerCase();
  if (rCatName && prog) {
    const pCatId = String(prog.catid || prog.catId || '').trim();
    const catObj = (catList || []).find(c => String(c.id) === pCatId || (c.name && c.name.toLowerCase() === pCatId.toLowerCase()));
    const pCatName = (catObj ? catObj.name : (prog.catname || prog.catName || '')).trim().toLowerCase();
    if (pCatName && !rCatName.includes('general') && !pCatName.includes('general') && rCatName !== pCatName) {
      return false;
    }
  }

  // ── 3. Team Guard (Crucial for multi-team madrasas!) ──
  // In a madrasa with multiple teams, a group belonging to one team must NEVER get another team's result!
  const gTeamId = String(g.team_id || g.teamId || '').trim();
  const rTeamId = String(r.teamid || r.team_id || r.teamId || '').trim();
  if (gTeamId && rTeamId && gTeamId !== rTeamId) {
    return false;
  }

  // ── 4. Explicit Group ID match ──
  if (r.group_id && g.id && String(r.group_id) === String(g.id)) return true;

  // ── 5. Group Name match ──
  const rRawName = String(r.studentname || r.studentName || '').trim();
  const gName = String(g.group_name || '').trim();
  const rClean = cleanEntityName(rRawName);
  const gClean = cleanEntityName(gName);

  if (gClean && (
    rClean === gClean ||
    rRawName.toLowerCase() === gName.toLowerCase() ||
    rRawName.toLowerCase() === `👥 ${gName.toLowerCase()}` ||
    rClean === `${gClean} group` ||
    rClean === `group ${gClean}` ||
    rClean.startsWith(gClean + ' -') ||
    rClean.startsWith(gClean + '-') ||
    rClean.startsWith(gClean + ' [')
  )) {
    return true;
  }

  // ── 6. Generic team-level group result (e.g. "Group" or "Team Group") ──
  if (gTeamId && rTeamId && gTeamId === rTeamId) {
    if (rClean === 'group' || rClean === 'team group' || rClean === '') {
      return true;
    }
    const rTeamName = String(r.teamname || r.teamName || '').trim().toLowerCase();
    if (rTeamName && (rClean === cleanEntityName(rTeamName) || rClean === `${cleanEntityName(rTeamName)} group`)) {
      return true;
    }
  }

  return false;
};"""

if old_group_matcher not in content:
    print("ERROR: old_group_matcher not found!")
    sys.exit(1)

content = content.replace(old_group_matcher, new_group_matcher, 1)
print("Replaced old_group_matcher successfully.")

# 3. Update call in buildQrDataFromLocal
old_qr_call = """        // Find candidate results strictly matching this group
        // Pass validMadrasaIds to prevent cross-madrasa result contamination
        const candidateGroupResults = (localResults || []).filter(r =>
          isResultMatchForGroup(r, g, prog, validMadrasaIds)
        );"""

new_qr_call = """        // Find candidate results strictly matching this group
        // Pass validMadrasaIds and localCats to prevent cross-madrasa / cross-category result contamination
        const candidateGroupResults = (localResults || []).filter(r =>
          isResultMatchForGroup(r, g, prog, validMadrasaIds, localCats)
        );"""

if old_qr_call not in content:
    print("ERROR: old_qr_call not found!")
    sys.exit(1)

content = content.replace(old_qr_call, new_qr_call, 1)
print("Replaced old_qr_call successfully.")

# 4. Update call in student card/report around line 9456
old_report_call = "isResultMatchForGroup(r, groupObj || { program_id: p.id, group_name: p.groupName, team_id: matchedStudent.teamid }, p)"
new_report_call = "isResultMatchForGroup(r, groupObj || { program_id: p.id, group_name: p.groupName, team_id: matchedStudent.teamid }, p, loggedInMadrasa?.regNumber, categories)"

if old_report_call not in content:
    print("WARNING: old_report_call not found, checking variations...")
else:
    content = content.replace(old_report_call, new_report_call, 1)
    print("Replaced old_report_call successfully.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Saved App.js successfully!")

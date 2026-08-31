import sys

file_path = r'd:\MILAD UN NABI\milad\src\App.js'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# ── 1. Replace Top-Level Helpers ──
old_top_start = "// Extracts chest number / register number from strings"
old_top_end = "const cleanEntityName = (str) => {\n  if (!str) return '';\n  return String(str)\n    .trim()\n    .toLowerCase()\n    .replace(/^[👥🏟️🚩👑🏆\\s]+/,\n '')\n    .replace(/\\s+/g, ' ')\n    .trim();\n};"

# Let's find old_top_start and the next function StudentQrCode
top_start_idx = code.find(old_top_start)
top_end_target = "// Inline component to generate and display QR code asynchronously"
top_end_idx = code.find(top_end_target, top_start_idx)

if top_start_idx == -1 or top_end_idx == -1:
    print("ERROR: top helpers start or end not found!")
    sys.exit(1)

new_top_helpers = """// ── Strict Chest / Register Number Extractor ──
// Extracts chest number / register number strictly from strings like "308 - Name", "308-Name", "308 : Name", "308"
const extractChestNumber = (rawString) => {
  if (!rawString || typeof rawString !== 'string') return '';
  const trimmed = rawString.trim();
  // Match prefix before separator: "308 - Name", "308-Name", "A-05 : Name"
  const match = trimmed.match(/^([a-zA-Z0-9_-]+)\\s*(?:[-:.]|\\s+-)\\s*(.+)$/);
  if (match && match[1]) {
    return match[1].trim();
  }
  // If pure number or single alphanumeric token: "308"
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }
  return '';
};

// ── Prize Priority Rank ──
// 1st Place (1) > 2nd Place (2) > 3rd Place (3) > Other Place (4) > No Place (99)
const getPlaceRank = (place) => {
  if (!place) return 99;
  const p = String(place).trim().toLowerCase();
  if (p === 'first' || p === '1' || p === '1st') return 1;
  if (p === 'second' || p === '2' || p === '2nd') return 2;
  if (p === 'third' || p === '3' || p === '3rd') return 3;
  if (p && p !== 'no place' && p !== '-' && p !== '0' && p !== 'no' && p !== 'none' && p !== 'null') return 4;
  return 99;
};

// ── Clean Entity Name (strips emojis and prefix tags for safe comparison) ──
const cleanEntityName = (str) => {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/^[👥🏟️🚩👑🏆\\s]+/, '')
    .replace(/\\s+/g, ' ')
    .trim();
};

// ── Strict Single Student Result Matcher ──
const isResultMatchForSingleStudent = (r, s, p = null, catList = []) => {
  if (!r || !s) return false;

  // 1. Program Match
  if (p) {
    const rPid = String(r.progid || r.program_id || '').trim().toLowerCase();
    const rPname = String(r.progname || r.program_name || '').trim().toLowerCase();
    const pIdStr = String(p.id || '').trim().toLowerCase();
    const pCodeStr = String(p.code || '').trim().toLowerCase();
    const pNameStr = String(p.name || '').trim().toLowerCase();

    let pMatch = false;
    if (pIdStr && rPid === pIdStr) pMatch = true;
    else if (pCodeStr && (rPid === pCodeStr || rPname.startsWith(pCodeStr))) pMatch = true;
    else if (pNameStr && rPname === pNameStr) pMatch = true;

    if (!pMatch) return false;
  }

  // 2. Gender Match (never match BOY to GIRL or vice versa)
  const rGender = String(r.studentgender || r.studentGender || '').trim().toUpperCase();
  const sGender = String(s.gender || '').trim().toUpperCase();
  if (rGender && sGender && rGender !== 'COMMON' && rGender !== 'ALL' && rGender !== sGender) {
    return false;
  }

  // 3. Category Match (if category present on both, they must match unless general)
  const sCatId = String(s.catid || s.catId || s.category || '').trim();
  const sCatObj = (catList || []).find(c => String(c.id) === sCatId || (c.name && c.name.toLowerCase() === sCatId.toLowerCase()));
  const sCatName = sCatObj ? sCatObj.name.toLowerCase() : sCatId.toLowerCase();
  const rCatName = String(r.catname || r.catName || '').trim().toLowerCase();
  if (rCatName && sCatName && !rCatName.includes('general') && rCatName !== sCatName && sCatId !== rCatName) {
    return false;
  }

  // 4. Exclude Group and Team results
  const rProgType = String(r.progtype || r.progType || '').trim().toUpperCase();
  if (rProgType.includes('GROUP') || rProgType.includes('TEAM')) {
    return false;
  }
  const rRawName = String(r.studentname || r.studentName || '').trim();
  if (rRawName.startsWith('👥') || rRawName.startsWith('🏟️')) {
    return false;
  }

  // 5. Student identity match (DB ID or Register / Chest Number)
  const sDbId = String(s.id || '').trim();
  const sRegNo = String(s.regno || s.regNo || '').trim();
  const sName = String(s.name || '').trim().toLowerCase();

  // A. Match by DB ID if stored on result
  const rSid = String(r.student_id || r.studentId || r.studentid || '').trim();
  if (sDbId && rSid && rSid === sDbId) return true;
  if (sRegNo && rSid && rSid.toLowerCase() === sRegNo.toLowerCase()) return true;

  // B. Match by Chest / Register number from studentname
  if (sRegNo && rRawName) {
    const rChest = extractChestNumber(rRawName);
    if (rChest && rChest.toLowerCase() === sRegNo.toLowerCase()) {
      return true;
    }

    const sRegLower = sRegNo.toLowerCase();
    const rRawLower = rRawName.toLowerCase();
    if (rRawLower === sRegLower ||
        rRawLower.startsWith(sRegLower + ' -') ||
        rRawLower.startsWith(sRegLower + '-') ||
        rRawLower.startsWith(sRegLower + ' :') ||
        rRawLower.startsWith(sRegLower + ':') ||
        rRawLower.startsWith(sRegLower + '. ') ||
        rRawLower.startsWith(sRegLower + '.')) {
      return true;
    }
  }

  // C. Fallback: Exact name match AND team match
  if (sName && rRawName) {
    const rClean = cleanEntityName(rRawName);
    const sClean = cleanEntityName(sName);
    const sTeamId = String(s.teamid || s.teamId || '').trim();
    const rTeamId = String(r.teamid || r.team_id || '').trim();
    if (rClean === sClean && (!sTeamId || !rTeamId || sTeamId === rTeamId)) {
      return true;
    }
  }

  return false;
};

// ── Strict Group Result Matcher ──
const isResultMatchForGroup = (r, g, prog = null) => {
  if (!r || !g) return false;

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
};

"""

code = code[:top_start_idx] + new_top_helpers + code[top_end_idx:]
print("Step 1: Top helpers updated.")

# ── 2. Replace buildQrDataFromLocal in handleQrScan ──
old_build_qr_start = "    // 1. Synchronous helper to build QR data object from local collections\n    const buildQrDataFromLocal = (localMadrasa, localStudents, localTeams, localCats, localProgs, localResults, localProgRegs, localGroupRegs, localPubList = []) => {"
old_build_qr_end = "      return {\n        madrasa: localMadrasa ? { ...localMadrasa, place: actualPlace } : null,\n        student: studentObj,\n        team: teamObj,\n        category: catObj,\n        results: individualEvents,\n        groupResults: resolvedGroupResults,\n        programs: localProgs || [],\n        groupRegistrations: studentGroups\n      };\n    };"

idx_start = code.find(old_build_qr_start)
idx_end = code.find(old_build_qr_end, idx_start)

if idx_start == -1 or idx_end == -1:
    print("ERROR: buildQrDataFromLocal start or end not found!")
    sys.exit(1)

new_build_qr = """    // 1. Synchronous helper to build QR data object from local collections with 100% strict matching
    const buildQrDataFromLocal = (localMadrasa, localStudents, localTeams, localCats, localProgs, localResults, localProgRegs, localGroupRegs, localPubList = []) => {
      // Find the exact student: prioritize DB id match, then exact register number match
      const studentObj = (localStudents || []).find(s => {
        if (!s) return false;
        const sId = String(s.id || '').trim();
        const sReg = String(s.regno || s.regNo || '').trim();
        if (sId && sId === studentId) return true;
        if (sReg && sReg.toLowerCase() === studentId.toLowerCase()) return true;
        return false;
      });
      if (!studentObj) return null;

      const [actualPlace] = (localMadrasa?.place || '').split('|');
      const sTeamId = String(studentObj.teamid || studentObj.teamId || '').trim();
      const teamObj = (localTeams || []).find(t => String(t.id).trim() === sTeamId || (sTeamId && t.name && t.name.toLowerCase() === sTeamId.toLowerCase()));
      const sCatId = String(studentObj.catid || studentObj.catId || studentObj.category || '').trim();
      const catObj = (localCats || []).find(c =>
        String(c.id).trim() === sCatId ||
        (sCatId && c.name && c.name.toLowerCase() === sCatId.toLowerCase()) ||
        (studentObj._resolvedCatName && c.name && c.name.toLowerCase() === studentObj._resolvedCatName.toLowerCase())
      );
      const sCatName = catObj ? catObj.name : (studentObj._resolvedCatName || sCatId);
      const sGender = studentObj.gender || '';
      const sName = String(studentObj.name || '').trim();
      const sDbId = String(studentObj.id || '').trim();
      const sRegNo = String(studentObj.regno || studentObj.regNo || '').trim();

      // A. Match all Single Event Registrations for this student in localProgRegs strictly by DB ID or Chest No
      const sRegs = (localProgRegs || []).filter(r => {
        if (!r) return false;
        const rSid = String(r.student_id || r.studentId || r.studentid || '').trim();
        if (!rSid) return false;
        if (sDbId && rSid === sDbId) return true;
        if (sRegNo && rSid.toLowerCase() === sRegNo.toLowerCase()) return true;
        if (sRegNo && (rSid.toLowerCase().startsWith(sRegNo.toLowerCase() + ' -') || rSid.toLowerCase().startsWith(sRegNo.toLowerCase() + '-'))) return true;
        return false;
      });

      // Resolve each single registration record to a program object (Strict Category & Gender Match)
      const resolvedSingleProgs = [];
      sRegs.forEach(r => {
        const rProgName = String(r.program_name || r.programName || r.progname || r.progName || '').trim();
        const rProgId = String(r.program_id || r.programId || r.progid || r.progId || '').trim();

        const matchedProg = (localProgs || []).find(p => {
          if (!p) return false;
          if (!isStudentCategoryMatch(p, sCatId, sCatName, localCats)) return false;
          if (!isStudentGenderMatch(p, sGender)) return false;

          const pId = String(p.id || '').trim();
          const pCode = String(p.code || '').trim();
          const pName = String(p.name || '').trim().toLowerCase();
          if (pId && (rProgId === pId || rProgName === pId)) return true;
          if (pCode && (rProgId.toLowerCase() === pCode.toLowerCase() || rProgName.toLowerCase() === pCode.toLowerCase())) return true;
          if (pName && (rProgName.toLowerCase() === pName || rProgId.toLowerCase() === pName)) return true;
          if (pCode && (rProgName.startsWith(pCode + ' -') || rProgName.startsWith(pCode + '-'))) return true;
          return false;
        });

        if (matchedProg) {
          resolvedSingleProgs.push(matchedProg);
        } else if (rProgName || rProgId) {
          resolvedSingleProgs.push({
            id: rProgId || rProgName,
            code: r.program_code || rProgId || '',
            name: rProgName || `Program ${rProgId}`,
            type: 'SINGLE',
            catid: sCatId
          });
        }
      });

      // Deduplicate single registered programs
      const singleProgMap = new Map();
      resolvedSingleProgs.forEach(p => {
        const key = String(p.id || p.code || p.name).trim().toLowerCase();
        if (!singleProgMap.has(key)) singleProgMap.set(key, p);
      });
      const uniqueSingleProgs = Array.from(singleProgMap.values());

      const individualEvents = [];

      // Process ONLY the programs the student ACTUALLY REGISTERED FOR
      uniqueSingleProgs.forEach(p => {
        // Find results in localResults strictly matching this student for this program
        const candidateResults = (localResults || []).filter(r =>
          isResultMatchForSingleStudent(r, studentObj, p, localCats)
        );

        // Sort candidates so the BEST place / highest points comes FIRST
        candidateResults.sort((a, b) => {
          const rankA = getPlaceRank(a.place);
          const rankB = getPlaceRank(b.place);
          if (rankA !== rankB) return rankA - rankB;
          return (Number(b.points) || 0) - (Number(a.points) || 0);
        });

        const res = candidateResults[0] || null;
        const isPub = res ? isProgramPublishedInList(res.progid || p.id, localPubList, localProgs) : false;
        const rawPlace = (res && isPub) ? String(res.place || '').trim() : '';
        const validPlace = (rawPlace && rawPlace !== 'No Place' && rawPlace !== '-' && rawPlace !== '0' && rawPlace !== 'No' && rawPlace !== 'none' && rawPlace !== 'null') ? rawPlace : null;
        const rawGrade = (res && isPub) ? String(res.grade || '').trim() : '';
        const validGrade = (rawGrade && rawGrade !== '-' && rawGrade !== 'No' && rawGrade !== '0' && rawGrade !== 'none' && rawGrade !== 'None' && rawGrade !== 'null') ? rawGrade : null;
        const validPts = (res && isPub && (validPlace || validGrade)) ? Number(res.points || 0) : null;

        individualEvents.push({
          progid: p.id,
          progname: `${p.code ? p.code + ' – ' : ''}${p.name}`,
          place: validPlace,
          grade: validGrade,
          points: validPts,
          isPublished: isPub,
          hasResult: !!(res && isPub && (validPlace || validGrade)),
          pending: !res || !isPub || (!validPlace && !validGrade)
        });
      });

      // Sort individual events alphabetically by program code
      individualEvents.sort((a, b) => {
        const progA = (localProgs || []).find(p => String(p.id) === String(a.progid));
        const progB = (localProgs || []).find(p => String(p.id) === String(b.progid));
        const codeA = progA ? String(progA.code || '') : '';
        const codeB = progB ? String(progB.code || '') : '';
        return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
      });

      // B. Match all Group Registrations where this student is a member or leader
      const isStudentInGroup = (g) => {
        if (!g) return false;
        // Leader match
        if (g.leader_id) {
          const lId = String(g.leader_id).trim();
          if (sDbId && lId === sDbId) return true;
          if (sRegNo && lId.toLowerCase() === sRegNo.toLowerCase()) return true;
          if (sRegNo && (lId.toLowerCase().startsWith(sRegNo.toLowerCase() + ' -') || lId.toLowerCase().startsWith(sRegNo.toLowerCase() + '-'))) return true;
        }

        // Member match (supports array, JSON string, objects, comma-separated string)
        let memberIds = [];
        if (Array.isArray(g.student_ids)) {
          memberIds = g.student_ids;
        } else if (typeof g.student_ids === 'string') {
          const rawStr = g.student_ids.trim();
          try {
            const parsed = JSON.parse(rawStr);
            memberIds = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            if (rawStr.includes(',')) {
              memberIds = rawStr.split(',').map(x => x.trim()).filter(Boolean);
            } else {
              memberIds = [rawStr];
            }
          }
        }
        if (!Array.isArray(memberIds)) memberIds = [memberIds];

        return memberIds.some(item => {
          if (!item) return false;
          if (typeof item === 'object' && item !== null) {
            const mDbId = String(item.id || item.student_id || item.studentId || '').trim();
            const mReg = String(item.regno || item.regNo || '').trim();
            if (sDbId && mDbId && mDbId === sDbId) return true;
            if (sRegNo && mReg && mReg.toLowerCase() === sRegNo.toLowerCase()) return true;
            if (sRegNo && mDbId && mDbId.toLowerCase() === sRegNo.toLowerCase()) return true;
            return false;
          }
          const idStr = String(item).trim();
          if (!idStr) return false;
          if (sDbId && idStr === sDbId) return true;
          if (sRegNo && idStr.toLowerCase() === sRegNo.toLowerCase()) return true;
          if (sRegNo && (idStr.toLowerCase().startsWith(sRegNo.toLowerCase() + ' -') || idStr.toLowerCase().startsWith(sRegNo.toLowerCase() + '-'))) return true;
          return false;
        });
      };

      const studentGroups = (localGroupRegs || []).filter(isStudentInGroup);

      const resolvedGroupResults = studentGroups.map(g => {
        const prog = (localProgs || []).find(p => {
          if (!isStudentCategoryMatch(p, sCatId, sCatName, localCats)) return false;
          if (!isStudentGenderMatch(p, sGender)) return false;
          return String(p.id) === String(g.program_id) ||
                 String(p.code) === String(g.program_id) ||
                 String(p.name).toLowerCase() === String(g.program_id).toLowerCase() ||
                 (p.code && String(g.program_id).startsWith(p.code)) ||
                 isProgramMatch({ program_id: g.program_id, program_name: g.program_name }, p);
        });

        // Find candidate results strictly matching this group
        const candidateGroupResults = (localResults || []).filter(r =>
          isResultMatchForGroup(r, g, prog)
        );

        // Pick BEST place result for this group
        candidateGroupResults.sort((a, b) => {
          const rankA = getPlaceRank(a.place);
          const rankB = getPlaceRank(b.place);
          if (rankA !== rankB) return rankA - rankB;
          return (Number(b.points) || 0) - (Number(a.points) || 0);
        });

        const result = candidateGroupResults[0] || null;
        const isPub = result ? isProgramPublishedInList(result.progid || g.program_id, localPubList, localProgs) : false;

        const rawPlace = (result && isPub) ? String(result.place || '').trim() : '';
        const validPlace = (rawPlace && rawPlace !== 'No Place' && rawPlace !== '-' && rawPlace !== '0' && rawPlace !== 'No' && rawPlace !== 'none' && rawPlace !== 'null') ? rawPlace : null;
        const rawGrade = (result && isPub) ? String(result.grade || '').trim() : '';
        const validGrade = (rawGrade && rawGrade !== '-' && rawGrade !== 'No' && rawGrade !== '0' && rawGrade !== 'none' && rawGrade !== 'None' && rawGrade !== 'null') ? rawGrade : null;
        const validPts = (result && isPub && (validPlace || validGrade)) ? Number(result.points || 0) : null;

        let isLeader = false;
        if (g.leader_id) {
          const lId = String(g.leader_id).trim();
          isLeader = (sDbId && lId === sDbId) || (sRegNo && lId.toLowerCase() === sRegNo.toLowerCase()) || (sName && lId.toLowerCase() === sName.toLowerCase());
        }

        return {
          progid: g.program_id,
          progname: prog ? `${prog.code ? prog.code + ' – ' : ''}${prog.name}` : (g.group_name || 'Group Program'),
          progtype: 'GROUP',
          groupName: g.group_name,
          isLeader,
          place: validPlace,
          grade: validGrade,
          points: validPts,
          isPublished: isPub && (validPlace !== null || validGrade !== null),
          hasResult: !!(result && isPub && (validPlace || validGrade)),
          isGroup: true
        };
      });

      return {
        madrasa: localMadrasa ? { ...localMadrasa, place: actualPlace } : null,
        student: studentObj,
        team: teamObj,
        category: catObj,
        results: individualEvents,
        groupResults: resolvedGroupResults,
        programs: localProgs || [],
        groupRegistrations: studentGroups
      };
    };"""

code = code[:idx_start] + new_build_qr + code[idx_end + len(old_build_qr_end):]
print("Step 2: buildQrDataFromLocal updated.")

# ── 3. Update Student Report Matching in Results Tab ──
old_report_start = "{searchRegNo.trim() && (() => {\n                          const matchedStudent = students.find(s => String(s.regno || s.regNo || '').toLowerCase() === searchRegNo.trim().toLowerCase());"
old_report_end = "                          const sResults = [];\n                          progMapForReport.forEach((pRows) => {\n                            pRows.sort((a, b) => {\n                              const rankA = getPlaceRank(a.place);\n                              const rankB = getPlaceRank(b.place);\n                              if (rankA !== rankB) return rankA - rankB;\n                              return (Number(b.points) || 0) - (Number(a.points) || 0);\n                            });\n                            sResults.push(pRows[0]);\n                          });"

idx_rep_start = code.find(old_report_start)
idx_rep_end = code.find(old_report_end, idx_rep_start)

if idx_rep_start != -1 and idx_rep_end != -1:
    new_report_block = """{searchRegNo.trim() && (() => {
                          const matchedStudent = students.find(s => String(s.regno || s.regNo || '').toLowerCase() === searchRegNo.trim().toLowerCase());
                          if (!matchedStudent) return <p style={{ color: '#ef4444', marginTop: '15px', fontWeight: '600' }}>No student found with this register number.</p>;

                          const sRegNo = matchedStudent.regno || matchedStudent.regNo || '';
                          const teamObj = teams.find(t => String(t.id) === String(matchedStudent.teamid || matchedStudent.teamId || ''));
                          const catObj = categories.find(c => String(c.id) === String(matchedStudent.catid || matchedStudent.catId || ''));

                          // Strictly gather all registered programs for this student
                          const registeredProgs = getStudentRegisteredPrograms(matchedStudent.id);

                          const sResults = [];
                          registeredProgs.forEach(p => {
                            let progResult = null;
                            if (p.isGroup) {
                              const groupObj = (groupRegistrations || []).find(g => String(g.id) === String(p.groupId));
                              const candidateResults = resultsList.filter(r => isProgPublished(r.progid) && isResultMatchForGroup(r, groupObj || { program_id: p.id, group_name: p.groupName, team_id: matchedStudent.teamid }, p));
                              candidateResults.sort((a, b) => {
                                const rankA = getPlaceRank(a.place);
                                const rankB = getPlaceRank(b.place);
                                if (rankA !== rankB) return rankA - rankB;
                                return (Number(b.points) || 0) - (Number(a.points) || 0);
                              });
                              progResult = candidateResults[0] || null;
                            } else {
                              const candidateResults = resultsList.filter(r => isProgPublished(r.progid) && isResultMatchForSingleStudent(r, matchedStudent, p, categories));
                              candidateResults.sort((a, b) => {
                                const rankA = getPlaceRank(a.place);
                                const rankB = getPlaceRank(b.place);
                                if (rankA !== rankB) return rankA - rankB;
                                return (Number(b.points) || 0) - (Number(a.points) || 0);
                              });
                              progResult = candidateResults[0] || null;
                            }

                            sResults.push({
                              progid: p.id,
                              progname: `${p.code ? p.code + ' – ' : ''}${p.name}`,
                              catname: catObj ? catObj.name : (p.catname || '-'),
                              place: progResult ? (progResult.place || 'No Place') : 'No Place',
                              grade: progResult ? (progResult.grade || '-') : '-',
                              points: progResult ? Number(progResult.points || 0) : 0,
                              hasResult: !!progResult && (progResult.place !== 'No Place' && progResult.place !== '-' && progResult.place !== '0' || progResult.grade !== '-')
                            });
                          });"""
    code = code[:idx_rep_start] + new_report_block + code[idx_rep_end + len(old_report_end):]
    print("Step 3: Student Report in Results tab updated.")
else:
    print("Warning: Student Report start/end not found, skipping step 3.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("All updates saved to App.js successfully!")

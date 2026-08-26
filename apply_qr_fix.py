import sys

file_path = r'd:\MILAD UN NABI\milad\src\App.js'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add top-level helpers
target1 = """import translations from './translations';

// Inline component to generate and display QR code asynchronously"""

replacement1 = """import translations from './translations';

// ── Strict Chest / Register Number Extractor ──
// Extracts chest number / register number from strings like "101 - Name", "101-Name", "A1: Name", "JR-05 - Name", "101"
const extractChestNumber = (rawString) => {
  if (!rawString || typeof rawString !== 'string') return '';
  const trimmed = rawString.trim();
  const match = trimmed.match(/^([^\\s\\-:.]+(?:-[^\\s\\-:.]+)?)\\s*(?:[-:.]|\\s+-)\\s*/);
  if (match && match[1]) {
    return match[1].trim();
  }
  const firstToken = trimmed.split(/\\s+/)[0];
  return firstToken || '';
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

// Inline component to generate and display QR code asynchronously"""

if target1 not in code:
    print("ERROR: target1 not found!")
    sys.exit(1)

code = code.replace(target1, replacement1, 1)
print("Step 1 (top-level helpers) added.")

# 2. Update getStudentGroupInfoForProg
target2_start = "  // Helper to extract student's group registration details for a given program\n  const getStudentGroupInfoForProg = useCallback((s, p) => {"
target2_end = "  }, [groupRegistrations, teams, isProgramMatch, isStudentCategoryMatch, isStudentGenderMatch, categories]);"

idx_start2 = code.find(target2_start)
idx_end2 = code.find(target2_end, idx_start2)

if idx_start2 == -1 or idx_end2 == -1:
    print("ERROR: target2 not found!")
    sys.exit(1)

replacement2 = """  // Helper to extract student's group registration details for a given program
  const getStudentGroupInfoForProg = useCallback((s, p) => {
    if (!s || !p || !Array.isArray(groupRegistrations)) return null;
    const sDbId = String(s.id || '').trim();
    const sRegNo = String(s.regno || s.regNo || '').trim();
    const sCatId = String(s.catid || s.catId || s.category || '');
    const sCatObj = (categories || []).find(c => String(c.id) === sCatId || (c.name && c.name.toLowerCase() === sCatId.toLowerCase()));
    const sCatName = sCatObj ? sCatObj.name : sCatId;
    const sGender = s.gender || '';

    // Gate: group program must be category & gender eligible
    if (!isStudentCategoryMatch(p, sCatId, sCatName, categories)) return null;
    if (!isStudentGenderMatch(p, sGender)) return null;

    const pIdStr = String(p.id || '').trim();
    const pCodeStr = String(p.code || '').trim().toLowerCase();
    const pNameStr = String(p.name || '').trim().toLowerCase();

    const foundGroup = groupRegistrations.find(g => {
      if (!g) return false;
      const gProgId = String(g.program_id || '').trim().toLowerCase();
      const pMatch = isProgramMatch({ program_id: g.program_id, program_name: g.program_name || g.program_id }, p) ||
        gProgId === pIdStr.toLowerCase() ||
        (pCodeStr && gProgId === pCodeStr) ||
        (pNameStr && gProgId === pNameStr);
      if (!pMatch) return false;

      // 1. Check leader ID strictly
      if (g.leader_id) {
        const lId = String(g.leader_id).trim();
        if (sDbId && lId === sDbId) return true;
        if (sRegNo && lId.toLowerCase() === sRegNo.toLowerCase()) return true;
        if (sRegNo && (lId.toLowerCase().startsWith(sRegNo.toLowerCase() + ' -') || lId.toLowerCase().startsWith(sRegNo.toLowerCase() + '-'))) return true;
      }

      // 2. Check members array (handles JSON array, strings, numbers, objects, comma-separated strings)
      let mIds = [];
      if (Array.isArray(g.student_ids)) {
        mIds = g.student_ids;
      } else if (typeof g.student_ids === 'string') {
        const rawStr = g.student_ids.trim();
        try {
          const parsed = JSON.parse(rawStr);
          mIds = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          if (rawStr.includes(',')) {
            mIds = rawStr.split(',').map(x => x.trim()).filter(Boolean);
          } else {
            mIds = [rawStr];
          }
        }
      }
      if (!Array.isArray(mIds)) mIds = [mIds];

      return mIds.some(item => {
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
    });

    if (!foundGroup) return null;

    let isLeader = false;
    if (foundGroup.leader_id) {
      const lId = String(foundGroup.leader_id).trim();
      isLeader = (sDbId && lId === sDbId) || (sRegNo && lId.toLowerCase() === sRegNo.toLowerCase());
    }

    const teamObj = (teams || []).find(t => String(t.id) === String(foundGroup.team_id));

    return {
      isRegistered: true,
      groupName: foundGroup.group_name || 'Group',
      isLeader,
      teamName: teamObj ? teamObj.name : '',
      groupId: foundGroup.id,
      teamId: foundGroup.team_id
    };
  }, [groupRegistrations, teams, isProgramMatch, isStudentCategoryMatch, isStudentGenderMatch, categories]);"""

code = code[:idx_start2] + replacement2 + code[idx_end2 + len(target2_end):]
print("Step 2 (getStudentGroupInfoForProg) updated.")

# 3. Update buildQrDataFromLocal
target3_start = "    // 1. Synchronous helper to build QR data object from local collections\n    const buildQrDataFromLocal = (localMadrasa, localStudents, localTeams, localCats, localProgs, localResults, localProgRegs, localGroupRegs, localPubList = []) => {"
target3_end = "    };\n\n    // Helper to get published programs list from any available sources"

idx_start3 = code.find(target3_start)
idx_end3 = code.find(target3_end, idx_start3)

if idx_start3 == -1 or idx_end3 == -1:
    print("ERROR: target3 not found!")
    sys.exit(1)

replacement3 = """    // 1. Synchronous helper to build QR data object from local collections
    const buildQrDataFromLocal = (localMadrasa, localStudents, localTeams, localCats, localProgs, localResults, localProgRegs, localGroupRegs, localPubList = []) => {
      const studentObj = (localStudents || []).find(s => {
        if (!s) return false;
        const sId = String(s.id || '').trim();
        const sReg = String(s.regno || s.regNo || '').trim();
        if (sId && sId === studentId) return true;
        if (sReg && sReg.toLowerCase() === studentId.toLowerCase()) return true;
        const targetNum = parseInt(studentId, 10);
        if (!isNaN(targetNum) && String(targetNum) === studentId) {
          if (parseInt(sId, 10) === targetNum) return true;
          if (parseInt(sReg, 10) === targetNum) return true;
        }
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

      // B. Match all Individual Results for this student in localResults (STRICT CHEST / REGISTER NUMBER OR DB ID ONLY)
      const studentMatchedResults = (localResults || []).filter(r => {
        if (!r) return false;
        // Gender check
        const rGender = String(r.studentgender || r.studentGender || '').trim().toUpperCase();
        const sGenderUpper = String(sGender || '').trim().toUpperCase();
        if (rGender && sGenderUpper && rGender !== 'COMMON' && rGender !== 'ALL' && rGender !== sGenderUpper) {
          return false;
        }

        const rSid = String(r.student_id || r.studentId || r.studentid || '').trim();
        if (sDbId && rSid && rSid === sDbId) return true;
        if (sRegNo && rSid && rSid.toLowerCase() === sRegNo.toLowerCase()) return true;

        const rRaw = String(r.studentname || r.studentName || '').trim();
        if (!rRaw) return false;

        // Strict Chest Number match
        const rChestNo = extractChestNumber(rRaw);
        if (sRegNo && rChestNo && rChestNo.toLowerCase() === sRegNo.toLowerCase()) return true;

        if (sRegNo) {
          const sRegLower = sRegNo.toLowerCase();
          const rRawLower = rRaw.toLowerCase();
          if (rRawLower === sRegLower ||
              rRawLower.startsWith(sRegLower + ' -') ||
              rRawLower.startsWith(sRegLower + '-') ||
              rRawLower.startsWith(sRegLower + ' :') ||
              rRawLower.startsWith(sRegLower + ':') ||
              rRawLower.startsWith(sRegLower + '.')) {
            return true;
          }
        }
        return false;
      });

      const individualEvents = [];
      const processedProgKeys = new Set();

      // 1. Process all unique registered single programs
      uniqueSingleProgs.forEach(p => {
        const pKey = String(p.id || p.code || p.name).trim().toLowerCase();
        processedProgKeys.add(pKey);
        if (p.id) processedProgKeys.add(String(p.id).trim().toLowerCase());
        if (p.code) processedProgKeys.add(String(p.code).trim().toLowerCase());

        // Find candidate results for this program
        const candidateResults = studentMatchedResults.filter(r => {
          const rPid = String(r.progid || r.program_id || '').trim().toLowerCase();
          const rPname = String(r.progname || r.program_name || '').trim().toLowerCase();
          if (p.id && rPid === String(p.id).toLowerCase()) return true;
          if (p.code && (rPid === String(p.code).toLowerCase() || rPname.startsWith(String(p.code).toLowerCase()))) return true;
          if (p.name && rPname === String(p.name).toLowerCase()) {
            const rCat = String(r.catname || r.catName || '').trim().toLowerCase();
            if (!rCat || isStudentCategoryMatch(p, rCat, rCat, localCats)) return true;
          }
          return false;
        });

        // Sort candidates so the BEST place / highest points comes FIRST (Never downgrade 1st to 3rd)
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

      // 2. Include any results that were not already in uniqueSingleProgs
      studentMatchedResults.forEach(r => {
        const rPid = String(r.progid || r.program_id || '').trim().toLowerCase();
        const rPname = String(r.progname || r.program_name || '').trim().toLowerCase();
        if (processedProgKeys.has(rPid) || processedProgKeys.has(rPname)) return;

        const prog = (localProgs || []).find(p =>
          (p.id && String(p.id).toLowerCase() === rPid) ||
          (p.code && String(p.code).toLowerCase() === rPid) ||
          (p.name && String(p.name).toLowerCase() === rPname && isStudentCategoryMatch(p, sCatId, sCatName, localCats))
        );

        if (prog && !isStudentCategoryMatch(prog, sCatId, sCatName, localCats)) return;

        processedProgKeys.add(rPid);
        if (rPname) processedProgKeys.add(rPname);
        if (prog?.id) processedProgKeys.add(String(prog.id).toLowerCase());
        if (prog?.code) processedProgKeys.add(String(prog.code).toLowerCase());

        const isPub = isProgramPublishedInList(r.progid, localPubList, localProgs);
        const rawPlace = isPub ? String(r.place || '').trim() : '';
        const validPlace = (rawPlace && rawPlace !== 'No Place' && rawPlace !== '-' && rawPlace !== '0' && rawPlace !== 'No' && rawPlace !== 'none' && rawPlace !== 'null') ? rawPlace : null;
        const rawGrade = isPub ? String(r.grade || '').trim() : '';
        const validGrade = (rawGrade && rawGrade !== '-' && rawGrade !== 'No' && rawGrade !== '0' && rawGrade !== 'none' && rawGrade !== 'None' && rawGrade !== 'null') ? rawGrade : null;
        const validPts = (isPub && (validPlace || validGrade)) ? Number(r.points || 0) : null;

        individualEvents.push({
          progid: r.progid,
          progname: r.progname || (prog ? `${prog.code ? prog.code + ' – ' : ''}${prog.name}` : (r.program_name || 'Program')),
          place: validPlace,
          grade: validGrade,
          points: validPts,
          isPublished: isPub,
          hasResult: !!(isPub && (validPlace || validGrade)),
          pending: !isPub || (!validPlace && !validGrade)
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

      // C. Match all Group Registrations where this student is a member or leader
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

        const groupTeam = (localTeams || []).find(t => String(t.id) === String(g.team_id));
        const groupTeamName = groupTeam ? String(groupTeam.name || '').trim().toLowerCase() : '';
        const gName = String(g.group_name || '').trim().toLowerCase();
        const gCleanName = cleanEntityName(gName);
        const gTeamId = String(g.team_id || '').trim();

        // Find candidate results for this group in localResults
        const candidateGroupResults = (localResults || []).filter(r => {
          if (!r) return false;
          const rPid = String(r.progid || r.program_id || '').trim().toLowerCase();
          const rProgMatch = (prog && (rPid === String(prog.id).toLowerCase() || rPid === String(prog.code).toLowerCase())) ||
                             rPid === String(g.program_id).toLowerCase();
          if (!rProgMatch) return false;

          // Strict gender check
          const rGender = String(r.studentgender || r.studentGender || '').trim().toUpperCase();
          const sGenderUpper = String(sGender || '').trim().toUpperCase();
          if (rGender && sGenderUpper && rGender !== 'COMMON' && rGender !== 'ALL' && rGender !== sGenderUpper) {
            return false;
          }

          const rName = String(r.studentname || r.student_name || '').trim().toLowerCase();
          const rCleanName = cleanEntityName(rName);
          const rTeamId = String(r.teamid || r.team_id || r.team || '').trim();

          // 1. Explicit group ID match if stored on result
          if (r.group_id && g.id && String(r.group_id) === String(g.id)) return true;

          // 2. Group name match (exact or with prefix / emoji / brackets)
          if (gCleanName && (
            rCleanName === gCleanName ||
            rName === gName ||
            rName === `👥 ${gName}` ||
            rCleanName.startsWith(gCleanName + ' -') ||
            rCleanName.startsWith(gCleanName + '-') ||
            rCleanName.startsWith(gCleanName + ' [') ||
            rCleanName.includes(gCleanName) ||
            gCleanName.includes(rCleanName)
          )) return true;

          // 3. Team-level match: Team ID matches AND result name matches team name / team group
          if (gTeamId && rTeamId && gTeamId === rTeamId) {
            if (groupTeamName && (
              rCleanName === groupTeamName ||
              rCleanName === `${groupTeamName} group` ||
              rCleanName === 'team group' ||
              rCleanName === 'group' ||
              rCleanName.includes(groupTeamName)
            )) return true;
          }
          return false;
        });

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

      // D. Include direct Team/Group results for this student's team (if not already present in resolvedGroupResults)
      if (sTeamId) {
        const teamProgResults = (localResults || []).filter(r => {
          if (!r) return false;
          if (String(r.teamid || r.team_id || '').trim() !== sTeamId) return false;
          const rPid = String(r.progid || r.program_id || '').trim();
          const prog = (localProgs || []).find(p => String(p.id) === rPid || (p.code && String(p.code) === rPid) || String(p.name).toLowerCase() === String(r.progname || '').toLowerCase());
          if (!prog) return false;
          const pType = (prog.type || r.progtype || '').toUpperCase();
          if (!pType.includes('GROUP') && !pType.includes('TEAM')) return false;
          if (!isStudentCategoryMatch(prog, sCatId, sCatName, localCats)) return false;
          if (!isStudentGenderMatch(prog, sGender)) return false;

          // Check if already in resolvedGroupResults
          const alreadyInGroup = resolvedGroupResults.some(g => String(g.progid) === String(prog.id) || String(g.progid) === String(prog.code));
          if (alreadyInGroup) return false;

          return true;
        });

        const teamProgsMap = new Map();
        teamProgResults.forEach(r => {
          const rPid = String(r.progid || r.program_id || '').trim();
          const prog = (localProgs || []).find(p => String(p.id) === rPid || (p.code && String(p.code) === rPid));
          const pKey = prog ? String(prog.id) : rPid;
          if (!teamProgsMap.has(pKey)) teamProgsMap.set(pKey, { prog, results: [] });
          teamProgsMap.get(pKey).results.push(r);
        });

        teamProgsMap.forEach(({ prog, results: pResults }, pKey) => {
          pResults.sort((a, b) => {
            const rankA = getPlaceRank(a.place);
            const rankB = getPlaceRank(b.place);
            if (rankA !== rankB) return rankA - rankB;
            return (Number(b.points) || 0) - (Number(a.points) || 0);
          });
          const bestRes = pResults[0];
          const isPub = isProgramPublishedInList(bestRes.progid || pKey, localPubList, localProgs);
          const rawPlace = isPub ? String(bestRes.place || '').trim() : '';
          const validPlace = (rawPlace && rawPlace !== 'No Place' && rawPlace !== '-' && rawPlace !== '0' && rawPlace !== 'No' && rawPlace !== 'none' && rawPlace !== 'null') ? rawPlace : null;
          const rawGrade = isPub ? String(bestRes.grade || '').trim() : '';
          const validGrade = (rawGrade && rawGrade !== '-' && rawGrade !== 'No' && rawGrade !== '0' && rawGrade !== 'none' && rawGrade !== 'None' && rawGrade !== 'null') ? rawGrade : null;
          const validPts = (isPub && (validPlace || validGrade)) ? Number(bestRes.points || 0) : null;

          resolvedGroupResults.push({
            progid: prog ? prog.id : pKey,
            progname: prog ? `${prog.code ? prog.code + ' – ' : ''}${prog.name}` : (bestRes.progname || 'Team Program'),
            progtype: 'TEAM',
            groupName: teamObj?.name ? `${teamObj.name} Team` : 'Team',
            isLeader: false,
            place: validPlace,
            grade: validGrade,
            points: validPts,
            isPublished: isPub && (validPlace !== null || validGrade !== null),
            hasResult: !!(bestRes && isPub && (validPlace || validGrade)),
            isGroup: true
          });
        });
      }

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
    };

    // Helper to get published programs list from any available sources"""

code = code[:idx_start3] + replacement3 + code[idx_end3 + len(target3_end):]
print("Step 3 (buildQrDataFromLocal) updated.")

# 4. Update View Mode Program Checklist & Results (around line 10380)
target4_start = "                                    // Find if any result exists for this program and student\n                                    const sDbIdStr = String(s.id || '').trim();"
target4_end = "                                    const pTypeBadge = pType.includes('TEAM') ? '🏟️ Team' : pType.includes('GROUP') ? '👥 Group' : '👤 Single';"

idx_start4 = code.find(target4_start)
idx_end4 = code.find(target4_end, idx_start4)

if idx_start4 == -1 or idx_end4 == -1:
    print("ERROR: target4 not found!")
    sys.exit(1)

replacement4 = """                                    // Find all matching results for this program and student (Single, Group, or Team)
                                    const sDbIdStr = String(s.id || '').trim();
                                    const sRegStr = String(sRegNo || '').trim();
                                    const sNameStr = String(s.name || '').trim().toLowerCase();

                                    const candidateProgResults = resultsList.filter(r => {
                                      if (!r) return false;
                                      if (!isProgPublished(r.progid)) return false;

                                      // 1. Program ID / Code Match
                                      const rPid = String(r.progid || r.program_id || '').trim();
                                      const pIdStr = String(p.id || '').trim();
                                      const pCodeStr = String(p.code || '').trim();
                                      let pMatch = Boolean(rPid && (rPid === pIdStr || (pCodeStr && rPid === pCodeStr) || (pCodeStr && rPid.toLowerCase() === pCodeStr.toLowerCase())));

                                      if (!pMatch && String(r.progname || '').trim().toLowerCase() === String(p.name || '').trim().toLowerCase()) {
                                        const rCat = String(r.catname || '').trim().toLowerCase();
                                        const pCatObj = categories.find(c => String(c.id) === String(p.catid || p.catId || ''));
                                        const pCatName = String(p.catname || pCatObj?.name || '').trim().toLowerCase();
                                        if (!rCat || !pCatName || rCat === pCatName) {
                                          pMatch = true;
                                        }
                                      }
                                      if (!pMatch) return false;

                                      // 2. Strict Gender Gate: Boys results for Boys, Girls results for Girls
                                      const rGender = String(r.studentgender || r.studentGender || '').trim().toUpperCase();
                                      const sGender = String(s.gender || '').trim().toUpperCase();
                                      if (rGender && sGender && rGender !== 'COMMON' && rGender !== 'ALL' && rGender !== sGender) {
                                        return false;
                                      }

                                      const rSid = String(r.student_id || r.studentid || '').trim();
                                      const rRaw = String(r.studentname || r.student_name || '').trim();
                                      const pType = (p.type || '').toUpperCase();
                                      const isGroupOrTeam = pType.includes('GROUP') || pType.includes('TEAM');

                                      // 3. Group / Team Program Resolution
                                      if (isGroupOrTeam) {
                                        const rName = rRaw.toLowerCase();
                                        const rCleanName = cleanEntityName(rName);
                                        const rTeamId = String(r.teamid || r.team_id || '').trim();

                                        // A. Match against resolved groupInfo
                                        if (groupInfo) {
                                          if (r.group_id && groupInfo.groupId && String(r.group_id) === String(groupInfo.groupId)) return true;
                                          const gName = String(groupInfo.groupName || '').trim().toLowerCase();
                                          const gCleanName = cleanEntityName(gName);
                                          if (gCleanName && (
                                            rCleanName === gCleanName ||
                                            rCleanName.startsWith(gCleanName + ' -') ||
                                            rCleanName.startsWith(gCleanName + '-') ||
                                            rCleanName.startsWith(gCleanName + ' [') ||
                                            rCleanName.includes(gCleanName) ||
                                            gCleanName.includes(rCleanName)
                                          )) return true;

                                          const gTeamId = String(groupInfo.teamId || '').trim();
                                          const gTeamName = String(groupInfo.teamName || '').trim().toLowerCase();
                                          if (gTeamId && rTeamId && gTeamId === rTeamId) {
                                            if (gTeamName && (
                                              rCleanName === gTeamName ||
                                              rCleanName === `${gTeamName} group` ||
                                              rCleanName === 'team group' ||
                                              rCleanName === 'group' ||
                                              rCleanName.includes(gTeamName)
                                            )) return true;
                                          }
                                        }

                                        // B. Check all group registrations for this student
                                        const matchingGroups = (groupRegistrations || []).filter(g => {
                                          const gProgMatch = String(g.program_id) === pIdStr || (pCodeStr && String(g.program_id) === pCodeStr) || isProgramMatch({ program_id: g.program_id, program_name: g.program_name }, p);
                                          if (!gProgMatch) return false;

                                          // Check leader
                                          if (g.leader_id) {
                                            const lId = String(g.leader_id).trim();
                                            if (sDbIdStr && lId === sDbIdStr) return true;
                                            if (sRegStr && lId.toLowerCase() === sRegStr.toLowerCase()) return true;
                                          }

                                          // Check members
                                          let mIds = [];
                                          if (Array.isArray(g.student_ids)) {
                                            mIds = g.student_ids;
                                          } else if (typeof g.student_ids === 'string') {
                                            const rawStr = g.student_ids.trim();
                                            try {
                                              const parsed = JSON.parse(rawStr);
                                              mIds = Array.isArray(parsed) ? parsed : [parsed];
                                            } catch(e) {
                                              if (rawStr.includes(',')) mIds = rawStr.split(',').map(x => x.trim()).filter(Boolean);
                                              else mIds = [rawStr];
                                            }
                                          }
                                          if (!Array.isArray(mIds)) mIds = [mIds];

                                          return mIds.some(item => {
                                            if (!item) return false;
                                            if (typeof item === 'object' && item !== null) {
                                              const mDbId = String(item.id || item.student_id || item.studentId || '').trim();
                                              const mReg = String(item.regno || item.regNo || '').trim();
                                              if (sDbIdStr && mDbId && mDbId === sDbIdStr) return true;
                                              if (sRegStr && mReg && mReg.toLowerCase() === sRegStr.toLowerCase()) return true;
                                              if (sRegStr && mDbId && mDbId.toLowerCase() === sRegStr.toLowerCase()) return true;
                                              return false;
                                            }
                                            const idStr = String(item).trim();
                                            if (!idStr) return false;
                                            if (sDbIdStr && idStr === sDbIdStr) return true;
                                            if (sRegStr && idStr.toLowerCase() === sRegStr.toLowerCase()) return true;
                                            if (sRegStr && (idStr.toLowerCase().startsWith(sRegStr.toLowerCase() + ' -') || idStr.toLowerCase().startsWith(sRegStr.toLowerCase() + '-'))) return true;
                                            return false;
                                          });
                                        });

                                        for (const g of matchingGroups) {
                                          if (r.group_id && g.id && String(r.group_id) === String(g.id)) return true;
                                          const gName = String(g.group_name || '').trim().toLowerCase();
                                          const gCleanName = cleanEntityName(gName);
                                          if (gCleanName && (
                                            rCleanName === gCleanName ||
                                            rCleanName.startsWith(gCleanName + ' -') ||
                                            rCleanName.startsWith(gCleanName + '-') ||
                                            rCleanName.startsWith(gCleanName + ' [') ||
                                            rCleanName.includes(gCleanName) ||
                                            gCleanName.includes(rCleanName)
                                          )) return true;

                                          const gTeamId = String(g.team_id || '').trim();
                                          if (gTeamId && rTeamId && gTeamId === rTeamId) {
                                            const teamObj = (teams || []).find(t => String(t.id) === gTeamId);
                                            const tName = teamObj ? teamObj.name.toLowerCase() : '';
                                            if (tName && (
                                              rCleanName === tName ||
                                              rCleanName === `${tName} group` ||
                                              rCleanName === 'team group' ||
                                              rCleanName === 'group' ||
                                              rCleanName.includes(tName)
                                            )) return true;
                                          }
                                        }

                                        // C. Direct Team-level match for student's team
                                        if (sTeamId && rTeamId && sTeamId === rTeamId) {
                                          if (teamName && (
                                            rCleanName === teamName.toLowerCase() ||
                                            rCleanName === `${teamName.toLowerCase()} group` ||
                                            rCleanName === 'team group' ||
                                            rCleanName === 'group' ||
                                            rCleanName.includes(teamName.toLowerCase())
                                          )) return true;
                                        }

                                        return false;
                                      }

                                      // 4. Single Program Resolution (STRICT REGISTER NUMBER / DB ID ONLY — NEVER BY NAME)
                                      if (sDbIdStr && rSid && rSid === sDbIdStr) return true;
                                      if (sRegStr && rSid && rSid.toLowerCase() === sRegStr.toLowerCase()) return true;

                                      const rChestNo = extractChestNumber(rRaw);
                                      if (sRegStr && rChestNo && rChestNo.toLowerCase() === sRegStr.toLowerCase()) return true;

                                      if (sRegStr) {
                                        const sRegLower = sRegStr.toLowerCase();
                                        const rRawLower = rRaw.toLowerCase();
                                        if (rRawLower === sRegLower ||
                                            rRawLower.startsWith(sRegLower + ' -') ||
                                            rRawLower.startsWith(sRegLower + '-') ||
                                            rRawLower.startsWith(sRegLower + ' :') ||
                                            rRawLower.startsWith(sRegLower + ':') ||
                                            rRawLower.startsWith(sRegLower + '.')) return true;
                                      }

                                      return false;
                                    });

                                    // Sort to guarantee 1st place / best position is selected
                                    candidateProgResults.sort((a, b) => {
                                      const rankA = getPlaceRank(a.place);
                                      const rankB = getPlaceRank(b.place);
                                      if (rankA !== rankB) return rankA - rankB;
                                      return (Number(b.points) || 0) - (Number(a.points) || 0);
                                    });

                                    const progResult = candidateProgResults[0] || null;

                                    const pType = (p.type || '').toUpperCase();
"""

code = code[:idx_start4] + replacement4 + code[idx_end4:]
print("Step 4 (View Mode program checklist matching) updated.")

# 5. Update Single Student Search in Student Report Tab (around line 9104)
target5_start = "                          const sResults = resultsList.filter(r => {"
target5_end = "                          });\n\n                          const printReport = () => {"

idx_start5 = code.find(target5_start)
idx_end5 = code.find(target5_end, idx_start5)

if idx_start5 == -1 or idx_end5 == -1:
    print("ERROR: target5 not found!")
    sys.exit(1)

replacement5 = """                          const rawMatchedResults = resultsList.filter(r => {
                            if (!isProgPublished(r.progid)) return false;
                            const rRaw = String(r.studentname || r.studentName || '').trim();
                            const rSid = String(r.studentid || r.student_id || '').trim();
                            const sIdStr = String(matchedStudent.id || '').trim();
                            const sRegStr = String(sRegNo || '').trim();
                            const sGender = String(matchedStudent.gender || '').toUpperCase();
                            const rGender = String(r.studentgender || r.studentGender || '').toUpperCase();

                            // Gender gate: never cross genders
                            if (rGender && sGender && rGender !== 'COMMON' && rGender !== 'ALL' && rGender !== sGender) return false;

                            // 1. Single match strictly by Register Number or DB ID (NEVER BY NAME)
                            if (sIdStr && rSid && rSid === sIdStr) return true;
                            if (sRegStr && rSid && rSid.toLowerCase() === sRegStr.toLowerCase()) return true;

                            const rChestNo = extractChestNumber(rRaw);
                            if (sRegStr && rChestNo && rChestNo.toLowerCase() === sRegStr.toLowerCase()) return true;

                            if (sRegStr) {
                              const sRegLower = sRegStr.toLowerCase();
                              const rRawLower = rRaw.toLowerCase();
                              if (rRawLower === sRegLower ||
                                  rRawLower.startsWith(sRegLower + ' -') ||
                                  rRawLower.startsWith(sRegLower + '-') ||
                                  rRawLower.startsWith(sRegLower + ' :') ||
                                  rRawLower.startsWith(sRegLower + ':') ||
                                  rRawLower.startsWith(sRegLower + '.')) return true;
                            }

                            // 2. Group / Team match: if student is a member/leader of the winning group
                            const studentGroupsForProg = (groupRegistrations || []).filter(g => {
                              const prog = programs.find(p => String(p.id) === String(r.progid) || (p.code && String(p.code) === String(r.progid)));
                              const pIdStr = prog ? String(prog.id) : String(r.progid);
                              const pCodeStr = prog ? String(prog.code || '') : '';
                              const gProgMatch = String(g.program_id) === pIdStr || (pCodeStr && String(g.program_id) === pCodeStr);
                              if (!gProgMatch) return false;

                              if (g.leader_id) {
                                const lId = String(g.leader_id).trim();
                                if (sIdStr && lId === sIdStr) return true;
                                if (sRegStr && lId.toLowerCase() === sRegStr.toLowerCase()) return true;
                              }

                              let mIds = [];
                              if (Array.isArray(g.student_ids)) {
                                mIds = g.student_ids;
                              } else if (typeof g.student_ids === 'string') {
                                const rawStr = g.student_ids.trim();
                                try {
                                  mIds = JSON.parse(rawStr);
                                } catch(e) {
                                  if (rawStr.includes(',')) mIds = rawStr.split(',').map(x => x.trim()).filter(Boolean);
                                  else mIds = [rawStr];
                                }
                              }
                              if (!Array.isArray(mIds)) mIds = [mIds];

                              return mIds.some(id => {
                                if (typeof id === 'object' && id !== null) {
                                  const mDbId = String(id.id || id.student_id || id.studentId || '').trim();
                                  const mReg = String(id.regno || id.regNo || '').trim();
                                  if (sIdStr && mDbId && mDbId === sIdStr) return true;
                                  if (sRegStr && mReg && mReg.toLowerCase() === sRegStr.toLowerCase()) return true;
                                  if (sRegStr && mDbId && mDbId.toLowerCase() === sRegStr.toLowerCase()) return true;
                                  return false;
                                }
                                const idStr = String(id).trim();
                                if (!idStr) return false;
                                if (sIdStr && idStr === sIdStr) return true;
                                if (sRegStr && idStr.toLowerCase() === sRegStr.toLowerCase()) return true;
                                if (sRegStr && (idStr.toLowerCase().startsWith(sRegStr.toLowerCase() + ' -') || idStr.toLowerCase().startsWith(sRegStr.toLowerCase() + '-'))) return true;
                                return false;
                              });
                            });

                            for (const g of studentGroupsForProg) {
                              if (r.group_id && g.id && String(r.group_id) === String(g.id)) return true;
                              const gName = String(g.group_name || '').trim().toLowerCase();
                              const gCleanName = cleanEntityName(gName);
                              const rRawLower = rRaw.toLowerCase();
                              const rCleanName = cleanEntityName(rRawLower);
                              if (gCleanName && (
                                rCleanName === gCleanName ||
                                rCleanName.startsWith(gCleanName + ' -') ||
                                rCleanName.startsWith(gCleanName + '-') ||
                                rCleanName.startsWith(gCleanName + ' [') ||
                                rCleanName.includes(gCleanName) ||
                                gCleanName.includes(rCleanName)
                              )) return true;

                              const gTeamId = String(g.team_id || '').trim();
                              const rTeamId = String(r.teamid || r.team_id || '').trim();
                              if (gTeamId && rTeamId && gTeamId === rTeamId) {
                                const tName = (teamObj ? teamObj.name : '').toLowerCase();
                                if (tName && (
                                  rCleanName === tName ||
                                  rCleanName === `${tName} group` ||
                                  rCleanName === 'team group' ||
                                  rCleanName === 'group' ||
                                  rCleanName.includes(tName)
                                )) return true;
                              }
                            }

                            // Direct Team match for student's team
                            const sTeamId = String(matchedStudent.teamid || matchedStudent.teamId || '').trim();
                            const rTeamId = String(r.teamid || r.team_id || '').trim();
                            if (sTeamId && rTeamId && sTeamId === rTeamId) {
                              const prog = programs.find(p => String(p.id) === String(r.progid) || (p.code && String(p.code) === String(r.progid)));
                              const pType = (prog?.type || r.progtype || '').toUpperCase();
                              if (pType.includes('GROUP') || pType.includes('TEAM')) {
                                const tName = (teamObj ? teamObj.name : '').toLowerCase();
                                const rCleanName = cleanEntityName(rRaw);
                                if (tName && (
                                  rCleanName === tName ||
                                  rCleanName === `${tName} group` ||
                                  rCleanName === 'team group' ||
                                  rCleanName === 'group' ||
                                  rCleanName.includes(tName)
                                )) return true;
                              }
                            }

                            return false;
                          });

                          // Deduplicate per program, keeping best prize place
                          const progMapForReport = new Map();
                          rawMatchedResults.forEach(r => {
                            const pKey = String(r.progid || r.program_id || r.progname || '').trim();
                            if (!progMapForReport.has(pKey)) {
                              progMapForReport.set(pKey, []);
                            }
                            progMapForReport.get(pKey).push(r);
                          });

                          const sResults = [];
                          progMapForReport.forEach((pRows) => {
                            pRows.sort((a, b) => {
                              const rankA = getPlaceRank(a.place);
                              const rankB = getPlaceRank(b.place);
                              if (rankA !== rankB) return rankA - rankB;
                              return (Number(b.points) || 0) - (Number(a.points) || 0);
                            });
                            sResults.push(pRows[0]);
                          });"""

# idx_end5 matches the start of "                          });\n\n                          const printReport = () => {"
# So replacing up to idx_end5 + len("                          });") removes the old closing `});`
code = code[:idx_start5] + replacement5 + code[idx_end5 + len("                          });"):]
print("Step 5 (Student Report single search) updated.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: All 5 steps applied cleanly to App.js!")

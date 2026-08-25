import re

file_path = r'd:\MILAD UN NABI\milad\src\App.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "{/* 🎁 PRIZES SUB-TAB */}"
end_marker = "{/* ── RESULT PUBLISH SUB-TAB ── */}"

start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos == -1 or end_pos == -1:
    print(f"Error: Markers not found. start_pos={start_pos}, end_pos={end_pos}")
    exit(1)

new_prizes_block = '''{/* 🎁 PRIZES SUB-TAB */}
                    {settingsSubTab === 'PRIZES' && (() => {
                      const getNormPlace = (placeStr) => {
                        if (!placeStr) return null;
                        const str = String(placeStr).trim().toLowerCase();
                        if (str === 'first' || str === '1' || str === '1st') return 'First';
                        if (str === 'second' || str === '2' || str === '2nd') return 'Second';
                        if (str === 'third' || str === '3' || str === '3rd') return 'Third';
                        return null;
                      };

                      // ── Fast Lookup Maps (O(1) lookups for maximum speed & mobile stability) ──
                      const safeStudents = Array.isArray(students) ? students : [];
                      const safePrograms = Array.isArray(programs) ? programs : [];
                      const safeCategories = Array.isArray(categories) ? categories : [];
                      const safeTeams = Array.isArray(teams) ? teams : [];
                      const safeGroupRegs = Array.isArray(groupRegistrations) ? groupRegistrations : [];
                      const safeProgRegs = Array.isArray(programRegistrations) ? programRegistrations : [];
                      const safeResults = Array.isArray(resultsList) ? resultsList : [];
                      const safeGenCatIds = Array.isArray(generalCatIds) ? generalCatIds.map(String) : [];

                      // Student Map by DB id and Reg No
                      const studentByIdMap = new Map();
                      const studentByRegMap = new Map();
                      safeStudents.forEach(s => {
                        if (!s) return;
                        if (s.id) studentByIdMap.set(String(s.id).trim().toLowerCase(), s);
                        const rNo = String(s.regno || s.regNo || '').trim().toLowerCase();
                        if (rNo) studentByRegMap.set(rNo, s);
                      });

                      const findStudent = (ref) => {
                        if (!ref) return null;
                        const str = String(ref).trim().toLowerCase();
                        if (studentByIdMap.has(str)) return studentByIdMap.get(str);
                        if (studentByRegMap.has(str)) return studentByRegMap.get(str);
                        if (str.includes('-')) {
                          const p = str.split('-')[0].trim();
                          if (studentByRegMap.has(p)) return studentByRegMap.get(p);
                        }
                        return safeStudents.find(s => {
                          const sName = String(s.name || '').trim().toLowerCase();
                          return sName && (sName === str || str.includes(sName));
                        }) || null;
                      };

                      // Program Map
                      const progByIdMap = new Map();
                      safePrograms.forEach(p => {
                        if (!p) return;
                        if (p.id) progByIdMap.set(String(p.id).trim().toLowerCase(), p);
                        if (p.code) progByIdMap.set(String(p.code).trim().toLowerCase(), p);
                      });

                      const findProg = (ref) => {
                        if (!ref) return null;
                        const str = String(ref).trim().toLowerCase();
                        if (progByIdMap.has(str)) return progByIdMap.get(str);
                        return safePrograms.find(p => String(p.name || '').trim().toLowerCase() === str) || null;
                      };

                      // Category Map
                      const catByIdMap = new Map();
                      safeCategories.forEach(c => {
                        if (!c) return;
                        if (c.id) catByIdMap.set(String(c.id).trim(), c);
                      });

                      // Team Map
                      const teamByIdMap = new Map();
                      safeTeams.forEach(t => {
                        if (!t) return;
                        if (t.id) teamByIdMap.set(String(t.id).trim(), t);
                      });

                      // 1. Process Published Results -> Expand Group & Team winners to individual students
                      const allWinnersExpanded = [];
                      const winnerFirstSecondPairSet = new Set(); // Key: studentId_progId for 1st/2nd place
                      const winnerThirdPairMap = new Map(); // Key: studentId_progId for 3rd place

                      safeResults.forEach(r => {
                        if (!r) return;
                        if (!isProgPublished(r.progid)) return;
                        const normPlace = getNormPlace(r.place);
                        if (!normPlace) return;

                        const pObj = findProg(r.progid) || null;
                        const pIdStr = pObj ? String(pObj.id) : String(r.progid || '');
                        const pCodeStr = pObj?.code ? String(pObj.code) : '';
                        const pName = r.progname || pObj?.name || r.progcode || 'Program';
                        const rawProgType = String(pObj?.type || r.progtype || r.progType || '').toUpperCase();
                        const isGroupProg = rawProgType.includes('GROUP') || String(r.studentname || '').startsWith('👥');
                        const isTeamProg = rawProgType.includes('TEAM') || String(r.studentname || '').startsWith('🏟️');
                        const progTypeCategory = isTeamProg ? 'TEAM' : isGroupProg ? 'GROUP' : 'SINGLE';

                        const pGender = getProgramGender(pObj) || (rawProgType.includes('BOY') ? 'BOY' : rawProgType.includes('GIRL') ? 'GIRL' : 'COMMON');

                        const cCatId = String(r.catid || r.catId || pObj?.catid || pObj?.catId || '');
                        const cObj = catByIdMap.get(cCatId) || null;
                        const catName = r.catname || cObj?.name || (cCatId === 'GENERAL' || cCatId === '-1' ? 'GENERAL' : '—');
                        const isGeneral = (pObj ? isGeneralProg(pObj) : false) || isGeneralResult(r) || cCatId === '-1' || cCatId === 'GENERAL' || safeGenCatIds.includes(cCatId);

                        if (isGroupProg || isTeamProg) {
                          // Find matching group registration
                          const matchedGroup = safeGroupRegs.find(g => {
                            if (!g) return false;
                            const gProgId = String(g.program_id || '').trim().toLowerCase();
                            const pMatch = gProgId === pIdStr.toLowerCase() || (pCodeStr && gProgId === pCodeStr.toLowerCase());
                            if (!pMatch) return false;

                            const rName = String(r.studentname || '').trim().toLowerCase().replace(/^👥\s*/, '').replace(/^🏟️\s*/, '');
                            const gName = String(g.group_name || '').trim().toLowerCase().replace(/^👥\s*/, '').replace(/^🏟️\s*/, '');
                            const rTid = String(r.teamid || r.teamId || '').trim();
                            const gTid = String(g.team_id || g.teamId || '').trim();

                            if (rTid && gTid && rTid === gTid) {
                              if (!gName || !rName || rName === gName || rName.includes(gName) || gName.includes(rName)) return true;
                            }
                            return rName === gName || (gName && (rName.includes(gName) || gName.includes(rName)));
                          });

                          let memberStudents = [];
                          if (matchedGroup) {
                            let memberIds = [];
                            try {
                              if (Array.isArray(matchedGroup.student_ids)) memberIds = matchedGroup.student_ids;
                              else if (typeof matchedGroup.student_ids === 'string') memberIds = JSON.parse(matchedGroup.student_ids || '[]');
                            } catch (e) { memberIds = []; }
                            if (!Array.isArray(memberIds)) memberIds = [memberIds];

                            const leaderId = String(matchedGroup.leader_id || '').trim();
                            if (leaderId) {
                              const ls = findStudent(leaderId);
                              if (ls && !memberStudents.find(m => String(m.id) === String(ls.id))) memberStudents.push(ls);
                            }
                            memberIds.forEach(item => {
                              let sid = '';
                              if (typeof item === 'object' && item !== null) sid = String(item.id || item.student_id || item.regno || item.regNo || '').trim();
                              else sid = String(item || '').trim();
                              if (!sid) return;
                              const s = findStudent(sid);
                              if (s && !memberStudents.find(m => String(m.id) === String(s.id))) memberStudents.push(s);
                            });
                          }

                          if (memberStudents.length === 0) {
                            allWinnersExpanded.push({
                              id: `win_${r.id || Math.random()}`,
                              studentId: r.studentid || '',
                              regNo: '—',
                              studentName: r.studentname || (matchedGroup?.group_name || 'Group'),
                              gender: pGender === 'GIRL' ? 'GIRL' : 'BOY',
                              catId: cCatId,
                              catName,
                              isGeneral,
                              progId: pIdStr,
                              progName,
                              progType: progTypeCategory,
                              progGender: pGender,
                              position: normPlace,
                              grade: r.grade || '-',
                              points: r.points || 0,
                              teamId: r.teamid || '',
                              teamName: r.teamname || teamByIdMap.get(String(r.teamid))?.name || '—',
                              isGroup: isGroupProg,
                              isTeam: isTeamProg,
                              groupLabel: matchedGroup?.group_name || r.studentname || 'Group'
                            });
                          } else {
                            memberStudents.forEach((s, idx) => {
                              const sTeam = teamByIdMap.get(String(s.teamid || s.teamId))?.name || r.teamname || '';
                              const sGender = String(s.gender || '').toUpperCase() || (pGender === 'GIRL' ? 'GIRL' : 'BOY');
                              const sId = String(s.id || '');
                              
                              if (normPlace === 'First' || normPlace === 'Second') {
                                if (sId && pIdStr) winnerFirstSecondPairSet.add(`${sId}_${pIdStr}`);
                              } else if (normPlace === 'Third') {
                                if (sId && pIdStr) winnerThirdPairMap.set(`${sId}_${pIdStr}`, { grade: r.grade || '-' });
                              }

                              allWinnersExpanded.push({
                                id: `win_${r.id || ''}_${s.id || idx}`,
                                studentId: s.id,
                                regNo: s.regno || s.regNo || '—',
                                studentName: s.name || 'Student',
                                gender: sGender,
                                catId: cCatId,
                                catName,
                                isGeneral,
                                progId: pIdStr,
                                progName,
                                progType: progTypeCategory,
                                progGender: pGender,
                                position: normPlace,
                                grade: r.grade || '-',
                                points: 0,
                                teamId: s.teamid || s.teamId || r.teamid || '',
                                teamName: sTeam,
                                isGroup: isGroupProg,
                                isTeam: isTeamProg,
                                groupLabel: matchedGroup?.group_name || r.studentname || 'Group',
                                memberIndex: idx + 1,
                                memberTotal: memberStudents.length
                              });
                            });
                          }
                        } else {
                          // SINGLE program
                          const studentObj = findStudent(r.studentid) || findStudent(r.studentname);
                          const sRegNo = studentObj ? (studentObj.regno || studentObj.regNo || '') : (r.studentname && String(r.studentname).includes('-') ? String(r.studentname).split('-')[0].trim() : '—');
                          const sName = studentObj ? studentObj.name : r.studentname;
                          const sGender = studentObj ? (studentObj.gender || 'BOY') : (r.studentgender || (pGender === 'GIRL' ? 'GIRL' : 'BOY'));
                          const sTeam = (studentObj && teamByIdMap.get(String(studentObj.teamid || studentObj.teamId))?.name) || r.teamname || teamByIdMap.get(String(r.teamid))?.name || '—';
                          const sId = String(studentObj ? studentObj.id : (r.studentid || ''));

                          if (normPlace === 'First' || normPlace === 'Second') {
                            if (sId && pIdStr) winnerFirstSecondPairSet.add(`${sId}_${pIdStr}`);
                          } else if (normPlace === 'Third') {
                            if (sId && pIdStr) winnerThirdPairMap.set(`${sId}_${pIdStr}`, { grade: r.grade || '-' });
                          }

                          allWinnersExpanded.push({
                            id: `win_${r.id || Math.random()}`,
                            studentId: sId,
                            regNo: sRegNo,
                            studentName: sName || 'Student',
                            gender: sGender,
                            catId: cCatId,
                            catName,
                            isGeneral,
                            progId: pIdStr,
                            progName,
                            progType: 'SINGLE',
                            progGender: pGender,
                            position: normPlace,
                            grade: r.grade || '-',
                            points: r.points || 0,
                            teamId: (studentObj && (studentObj.teamid || studentObj.teamId)) || r.teamid || '',
                            teamName: sTeam,
                            isGroup: false,
                            isTeam: false
                          });
                        }
                      });

                      // 2. Build list of Participants (Fast O(N) generation from registrations)
                      const allParticipantsList = [];
                      const participantPairSet = new Set(); // Prevent duplicate student-prog rows

                      // A. Single registrations
                      safeProgRegs.forEach(reg => {
                        if (!reg) return;
                        const sObj = findStudent(reg.student_id || reg.studentid || reg.studentId || reg.regno || reg.regNo);
                        if (!sObj) return;
                        const pObj = findProg(reg.program_id || reg.programId || reg.progid || reg.progId || reg.program_name || reg.programName);
                        if (!pObj) return;

                        const sId = String(sObj.id);
                        const pId = String(pObj.id);
                        const pairKey = `${sId}_${pId}`;

                        if (winnerFirstSecondPairSet.has(pairKey)) return; // Won 1st or 2nd place -> skip
                        if (participantPairSet.has(pairKey)) return; // Already added
                        participantPairSet.add(pairKey);

                        const rawProgType = String(pObj.type || pObj.program_type || pObj.progtype || '').toUpperCase();
                        const pGender = getProgramGender(pObj) || (rawProgType.includes('BOY') ? 'BOY' : rawProgType.includes('GIRL') ? 'GIRL' : 'COMMON');
                        const sGender = String(sObj.gender || 'BOY').toUpperCase();
                        const sCatId = String(sObj.catid || sObj.catId || pObj.catid || '');
                        const cObj = catByIdMap.get(sCatId) || null;
                        const catName = cObj ? cObj.name : (sCatId === 'GENERAL' || sCatId === '-1' ? 'GENERAL' : '—');
                        const isGenProg = isGeneralProg(pObj) || sCatId === '-1' || sCatId === 'GENERAL' || safeGenCatIds.includes(sCatId);
                        const sTeam = teamByIdMap.get(String(sObj.teamid || sObj.teamId))?.name || '—';

                        const isThird = winnerThirdPairMap.has(pairKey);
                        const gradeVal = isThird ? (winnerThirdPairMap.get(pairKey)?.grade || '-') : '-';

                        allParticipantsList.push({
                          id: `part_single_${sId}_${pId}`,
                          studentId: sId,
                          regNo: sObj.regno || sObj.regNo || '—',
                          studentName: sObj.name || 'Student',
                          gender: sGender,
                          catId: sCatId,
                          catName,
                          isGeneral: isGenProg,
                          progId: pId,
                          progName: pObj.name || 'Program',
                          progType: 'SINGLE',
                          progGender: pGender,
                          position: isThird ? 'Third' : 'Participant',
                          grade: gradeVal,
                          points: 0,
                          teamId: sObj.teamid || sObj.teamId || '',
                          teamName: sTeam,
                          isGroup: false,
                          isTeam: false,
                          groupLabel: ''
                        });
                      });

                      // B. Group & Team registrations
                      safeGroupRegs.forEach(g => {
                        if (!g) return;
                        const pObj = findProg(g.program_id);
                        if (!pObj) return;
                        const pId = String(pObj.id);
                        const rawProgType = String(pObj.type || pObj.program_type || pObj.progtype || '').toUpperCase();
                        const isTeamProg = rawProgType.includes('TEAM');
                        const isGroupProg = Boolean(g.group_name) || rawProgType.includes('GROUP');
                        const progTypeCategory = isTeamProg ? 'TEAM' : isGroupProg ? 'GROUP' : 'SINGLE';
                        const pGender = getProgramGender(pObj) || (rawProgType.includes('BOY') ? 'BOY' : rawProgType.includes('GIRL') ? 'GIRL' : 'COMMON');

                        let mIds = [];
                        try {
                          if (Array.isArray(g.student_ids)) mIds = g.student_ids;
                          else if (typeof g.student_ids === 'string') mIds = JSON.parse(g.student_ids || '[]');
                        } catch (e) { mIds = []; }
                        if (!Array.isArray(mIds)) mIds = [mIds];

                        const leaderId = String(g.leader_id || '').trim();
                        const memberRefs = leaderId ? [leaderId, ...mIds] : mIds;

                        memberRefs.forEach(ref => {
                          let sid = '';
                          if (typeof ref === 'object' && ref !== null) sid = String(ref.id || ref.student_id || ref.regno || ref.regNo || '').trim();
                          else sid = String(ref || '').trim();
                          if (!sid) return;
                          const sObj = findStudent(sid);
                          if (!sObj) return;

                          const sId = String(sObj.id);
                          const pairKey = `${sId}_${pId}`;

                          if (winnerFirstSecondPairSet.has(pairKey)) return; // Won 1st or 2nd place -> skip
                          if (participantPairSet.has(pairKey)) return; // Already added
                          participantPairSet.add(pairKey);

                          const sGender = String(sObj.gender || 'BOY').toUpperCase();
                          const sCatId = String(sObj.catid || sObj.catId || pObj.catid || '');
                          const cObj = catByIdMap.get(sCatId) || null;
                          const catName = cObj ? cObj.name : (sCatId === 'GENERAL' || sCatId === '-1' ? 'GENERAL' : '—');
                          const isGenProg = isGeneralProg(pObj) || sCatId === '-1' || sCatId === 'GENERAL' || safeGenCatIds.includes(sCatId);
                          const sTeam = teamByIdMap.get(String(sObj.teamid || sObj.teamId || g.team_id))?.name || '—';

                          const isThird = winnerThirdPairMap.has(pairKey);
                          const gradeVal = isThird ? (winnerThirdPairMap.get(pairKey)?.grade || '-') : '-';

                          allParticipantsList.push({
                            id: `part_grp_${sId}_${pId}`,
                            studentId: sId,
                            regNo: sObj.regno || sObj.regNo || '—',
                            studentName: sObj.name || 'Student',
                            gender: sGender,
                            catId: sCatId,
                            catName,
                            isGeneral: isGenProg,
                            progId: pId,
                            progName: pObj.name || 'Program',
                            progType: progTypeCategory,
                            progGender: pGender,
                            position: isThird ? 'Third' : 'Participant',
                            grade: gradeVal,
                            points: 0,
                            teamId: sObj.teamid || sObj.teamId || g.team_id || '',
                            teamName: sTeam,
                            isGroup: isGroupProg,
                            isTeam: isTeamProg,
                            groupLabel: g.group_name || ''
                          });
                        });
                      });

                      // 3. Determine base list according to Position / Status Filter
                      let baseList = [];
                      if (prizesPlaceFilter === 'ALL') {
                        baseList = allWinnersExpanded;
                      } else if (prizesPlaceFilter === 'FIRST') {
                        baseList = allWinnersExpanded.filter(r => r.position === 'First');
                      } else if (prizesPlaceFilter === 'SECOND') {
                        baseList = allWinnersExpanded.filter(r => r.position === 'Second');
                      } else if (prizesPlaceFilter === 'THIRD') {
                        baseList = allWinnersExpanded.filter(r => r.position === 'Third');
                      } else if (prizesPlaceFilter === 'PARTICIPANTS') {
                        baseList = allParticipantsList;
                      }

                      // 4. Apply Type, Category, Gender, and Search Filters
                      const filteredDisplayList = baseList.filter(item => {
                        if (!item) return false;

                        // Program / Event Type
                        if (prizesTypeFilter !== 'ALL') {
                          if (item.progType !== prizesTypeFilter) return false;
                        }

                        // Category
                        if (prizesCatFilter !== 'ALL') {
                          if (prizesCatFilter === 'GENERAL') {
                            if (!item.isGeneral) return false;
                          } else {
                            if (String(item.catId) !== String(prizesCatFilter)) return false;
                          }
                        }

                        // Gender / Section
                        if (prizesGenderFilter !== 'ALL') {
                          if (prizesGenderFilter === 'BOY') {
                            if (item.gender !== 'BOY' && item.progGender !== 'BOY') return false;
                          } else if (prizesGenderFilter === 'GIRL') {
                            if (item.gender !== 'GIRL' && item.progGender !== 'GIRL') return false;
                          } else if (prizesGenderFilter === 'COMMON') {
                            if (item.progGender !== 'COMMON') return false;
                          }
                        }

                        // Search
                        if (prizesStudentSearch && prizesStudentSearch.trim()) {
                          const q = prizesStudentSearch.trim().toLowerCase();
                          const rNo = String(item.regNo || '').toLowerCase();
                          const sName = String(item.studentName || '').toLowerCase();
                          const pName = String(item.progName || '').toLowerCase();
                          const tName = String(item.teamName || '').toLowerCase();
                          const cName = String(item.catName || '').toLowerCase();
                          if (!rNo.includes(q) && !sName.includes(q) && !pName.includes(q) && !tName.includes(q) && !cName.includes(q)) {
                            return false;
                          }
                        }

                        return true;
                      });

                      // 5. Stat Counts under current Type, Category, Gender filters
                      const activeFilterWinners = allWinnersExpanded.filter(item => {
                        if (!item) return false;
                        if (prizesTypeFilter !== 'ALL' && item.progType !== prizesTypeFilter) return false;
                        if (prizesCatFilter !== 'ALL') {
                          if (prizesCatFilter === 'GENERAL') { if (!item.isGeneral) return false; }
                          else if (String(item.catId) !== String(prizesCatFilter)) return false;
                        }
                        if (prizesGenderFilter !== 'ALL') {
                          if (prizesGenderFilter === 'BOY' && item.gender !== 'BOY' && item.progGender !== 'BOY') return false;
                          if (prizesGenderFilter === 'GIRL' && item.gender !== 'GIRL' && item.progGender !== 'GIRL') return false;
                          if (prizesGenderFilter === 'COMMON' && item.progGender !== 'COMMON') return false;
                        }
                        return true;
                      });

                      const activeFilterParticipants = allParticipantsList.filter(item => {
                        if (!item) return false;
                        if (prizesTypeFilter !== 'ALL' && item.progType !== prizesTypeFilter) return false;
                        if (prizesCatFilter !== 'ALL') {
                          if (prizesCatFilter === 'GENERAL') { if (!item.isGeneral) return false; }
                          else if (String(item.catId) !== String(prizesCatFilter)) return false;
                        }
                        if (prizesGenderFilter !== 'ALL') {
                          if (prizesGenderFilter === 'BOY' && item.gender !== 'BOY' && item.progGender !== 'BOY') return false;
                          if (prizesGenderFilter === 'GIRL' && item.gender !== 'GIRL' && item.progGender !== 'GIRL') return false;
                          if (prizesGenderFilter === 'COMMON' && item.progGender !== 'COMMON') return false;
                        }
                        return true;
                      });

                      const countFirst = activeFilterWinners.filter(r => r.position === 'First').length;
                      const countSecond = activeFilterWinners.filter(r => r.position === 'Second').length;
                      const countThird = activeFilterWinners.filter(r => r.position === 'Third').length;
                      const countParticipants = activeFilterParticipants.length;

                      // PDF Generator
                      const generatePrizesPDF = () => {
                        const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                        const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                        const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';
                        const activeCatObj = catByIdMap.get(String(prizesCatFilter)) || null;
                        const catLabel = prizesCatFilter === 'ALL' ? (lang === 'EN' ? 'All Categories' : 'എല്ലാ കാറ്റഗറികളും') : prizesCatFilter === 'GENERAL' ? 'GENERAL' : (activeCatObj ? activeCatObj.name : '');
                        const typeLabel = prizesTypeFilter === 'ALL' ? (lang === 'EN' ? 'All Programs' : 'എല്ലാ മത്സരങ്ങളും') : prizesTypeFilter;
                        const genderLabel = prizesGenderFilter === 'ALL' ? (lang === 'EN' ? 'All' : 'എല്ലാം') : prizesGenderFilter;
                        const posLabel = prizesPlaceFilter === 'ALL' ? (lang === 'EN' ? 'All Winners' : 'വിജയികൾ') : prizesPlaceFilter === 'PARTICIPANTS' ? (lang === 'EN' ? 'Participants' : 'പങ്കെടുത്തവർ') : prizesPlaceFilter;

                        const printRows = filteredDisplayList.map((r, idx) => {
                          const placeBadge = r.position === 'First' ? '🥇 1st Place' : r.position === 'Second' ? '🥈 2nd Place' : r.position === 'Third' ? '🥉 3rd Place' : '🎗️ Participant';
                          const placeColor = r.position === 'First' ? '#92400e' : r.position === 'Second' ? '#475569' : r.position === 'Third' ? '#9a3412' : '#047857';
                          const isGrp = r.isGroup || r.isTeam;
                          const rowBg = isGrp ? 'background:#fefce8;' : '';
                          const groupTag = isGrp ? `<span style="background:#fef3c7;color:#92400e;border-radius:3px;padding:0 4px;font-size:10px;margin-left:4px;font-weight:800;">${r.progType}</span>` : '';

                          return `<tr style="${rowBg}">
                            <td style="font-weight:700;text-align:center;">${idx + 1}</td>
                            <td style="font-weight:700;color:#1e40af;">${r.regNo || '—'}</td>
                            <td style="font-weight:700;">${r.studentName}</td>
                            <td>${r.gender || '—'}</td>
                            <td>${r.catName}</td>
                            <td style="font-weight:600;">${r.progName}${groupTag}</td>
                            <td style="font-weight:700;">${r.progType}</td>
                            <td style="font-weight:800;color:${placeColor};">${placeBadge}</td>
                            <td>${r.teamName || '—'}</td>
                          </tr>`;
                        }).join('');

                        const prizesHtml = `<!DOCTYPE html>
<html>
<head>
<title>Prizes & Awards List - ${madrasaName}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #0f172a; padding: 10px; }
  .header { text-align: center; border-bottom: 3px double #1e3a8a; padding-bottom: 10px; margin-bottom: 14px; }
  .header h1 { font-size: 22px; color: #1e3a8a; font-weight: 800; }
  .header p { font-size: 12px; color: #475569; margin-top: 3px; font-weight: 600; }
  .sub-header { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
  .sub-title { font-size: 15px; font-weight: 800; color: #1e40af; }
  .sub-meta { font-size: 11px; color: #334155; font-weight: 700; }
  .summary-bar { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
  .sum-box { flex: 1; min-width: 80px; padding: 8px; text-align: center; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; }
  .sum-val { font-size: 18px; font-weight: 900; }
  .sum-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: #1e3a8a; color: white; font-size: 11px; font-weight: 700; padding: 7px 8px; text-align: left; }
  td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
<button onclick="window.print()" class="no-print" style="margin-bottom:12px;padding:9px 20px;background:#1e40af;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">🖨️ Print / Download Prizes PDF</button>
<div class="header">
  ${eventName ? `<div style="font-size:11px;font-weight:800;color:#d97706;letter-spacing:1px;margin-bottom:3px;">${eventName} ${eventYear || ''}</div>` : ''}
  <h1>${madrasaName}</h1>
  <p>${madrasaPlace} | Reg No: ${madrasaRegNo}</p>
</div>
<div class="sub-header">
  <div class="sub-title">🎁 ${lang === 'EN' ? 'Prizes & Awards List' : 'സമ്മാനങ്ങളുടെ ലിസ്റ്റ്'} (${posLabel})</div>
  <div class="sub-meta">Type: <strong>${typeLabel}</strong> | Category: <strong>${catLabel}</strong> | Gender: <strong>${genderLabel}</strong> | Total: <strong>${filteredDisplayList.length}</strong></div>
</div>
<div class="summary-bar">
  <div class="sum-box" style="background:#fffbeb;border-color:#fcd34d;"><div class="sum-val" style="color:#b45309;">🥇 ${countFirst}</div><div class="sum-lbl" style="color:#b45309;">First</div></div>
  <div class="sum-box" style="background:#f8fafc;border-color:#cbd5e1;"><div class="sum-val" style="color:#475569;">🥈 ${countSecond}</div><div class="sum-lbl" style="color:#475569;">Second</div></div>
  <div class="sum-box" style="background:#fff7ed;border-color:#fdba74;"><div class="sum-val" style="color:#c2410c;">🥉 ${countThird}</div><div class="sum-lbl" style="color:#c2410c;">Third</div></div>
  <div class="sum-box" style="background:#ecfdf5;border-color:#a7f3d0;"><div class="sum-val" style="color:#047857;">🎗️ ${countParticipants}</div><div class="sum-lbl" style="color:#047857;">Participants</div></div>
  <div class="sum-box" style="background:#eff6ff;border-color:#bfdbfe;"><div class="sum-val" style="color:#1e40af;">📄 ${filteredDisplayList.length}</div><div class="sum-lbl" style="color:#1e40af;">Total</div></div>
</div>
<table>
  <thead>
    <tr>
      <th style="width:35px;text-align:center;">#</th>
      <th style="width:65px;">Reg No</th>
      <th>Student Name</th>
      <th style="width:45px;">Gender</th>
      <th>Category</th>
      <th>Competition</th>
      <th style="width:55px;">Type</th>
      <th>Position</th>
      <th>Team</th>
    </tr>
  </thead>
  <tbody>
    ${printRows || '<tr><td colspan="9" style="text-align:center;padding:18px;color:#94a3b8;">No records found.</td></tr>'}
  </tbody>
</table>
<div class="footer">Generated by Milad Fest Management App • Total: ${filteredDisplayList.length}</div>
</body>
</html>`;
                        openPrintDocument(prizesHtml, 'Prizes_List');
                      };

                      return (
                        <div className="settings-card-v2" style={{ maxWidth: '1000px' }}>
                          {/* Title */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              🎁 {lang === 'EN' ? 'Prizes & Awards Control' : 'സമ്മാനങ്ങളും പ്രോത്സാഹനവും (Prizes Panel)'}
                            </h3>
                          </div>

                          {/* ── FILTER 1: Program / Competition Type ── */}
                          <div className="student-filters-container" style={{ marginBottom: '14px', background: '#fff', padding: '12px 16px', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                            <div className="filter-section-title" style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              🎭 {lang === 'EN' ? '1. Filter by Program Type' : '1. പ്രോഗ്രാം തരം (Program Type)'}
                            </div>
                            <div className="filter-chips-wrapper" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {[
                                { key: 'ALL', label: lang === 'EN' ? '📁 All Programs' : '📁 All (എല്ലാം)' },
                                { key: 'SINGLE', label: lang === 'EN' ? '👤 Single' : '👤 സിംഗിൾ (Single)' },
                                { key: 'GROUP', label: lang === 'EN' ? '👥 Group' : '👥 ഗ്രൂപ്പ് (Group)' },
                                { key: 'TEAM', label: lang === 'EN' ? '🏟️ Team' : '🏟️ ടീം (Team)' },
                              ].map(f => (
                                <div
                                  key={f.key}
                                  className={`filter-chip-box ${prizesTypeFilter === f.key ? 'active' : ''}`}
                                  onClick={() => setPrizesTypeFilter(f.key)}
                                  style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '700' }}
                                >
                                  {f.label}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* ── FILTER 2: Category Filter ── */}
                          <div className="student-filters-container" style={{ marginBottom: '14px', background: '#fff', padding: '12px 16px', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                            <div className="filter-section-title" style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              📂 {lang === 'EN' ? '2. Filter by Category' : '2. കാറ്റഗറി അനുസരിച്ച് തിരിക്കുക (Category)'}
                            </div>
                            <div className="filter-chips-wrapper" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <div
                                className={`filter-chip-box ${prizesCatFilter === 'ALL' ? 'active' : ''}`}
                                onClick={() => setPrizesCatFilter('ALL')}
                                style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '700' }}
                              >
                                📁 {lang === 'EN' ? 'All Categories' : 'എല്ലാ കാറ്റഗറികളും (All)'}
                              </div>
                              {safeCategories.map(c => (
                                <div
                                  key={c.id}
                                  className={`filter-chip-box ${String(prizesCatFilter) === String(c.id) ? 'active' : ''}`}
                                  onClick={() => setPrizesCatFilter(c.id)}
                                  style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '700' }}
                                >
                                  {c.name}
                                </div>
                              ))}
                              <div
                                className={`filter-chip-box ${prizesCatFilter === 'GENERAL' ? 'active' : ''}`}
                                onClick={() => setPrizesCatFilter('GENERAL')}
                                style={{
                                  padding: '8px 14px',
                                  fontSize: '12px',
                                  background: prizesCatFilter === 'GENERAL' ? 'linear-gradient(135deg,#d97706,#b45309)' : '',
                                  color: prizesCatFilter === 'GENERAL' ? '#fff' : '',
                                  fontWeight: '800'
                                }}
                              >
                                🌟 GENERAL
                              </div>
                            </div>
                          </div>

                          {/* ── FILTER 3: Gender / Section Filter ── */}
                          <div className="student-filters-container" style={{ marginBottom: '14px', background: '#fff', padding: '12px 16px', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                            <div className="filter-section-title" style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              👥 {lang === 'EN' ? '3. Filter by Gender / Section' : '3. വിഭാഗം അനുസരിച്ച് തിരിക്കുക (Gender)'}
                            </div>
                            <div className="filter-chips-wrapper" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {[
                                { key: 'ALL', label: lang === 'EN' ? '👥 All' : '👥 All (എല്ലാം)', activeClass: 'active' },
                                { key: 'BOY', label: lang === 'EN' ? '👦 Boys' : '👦 ബോയ് (Boys)', activeClass: 'active-boy' },
                                { key: 'GIRL', label: lang === 'EN' ? '👧 Girls' : '👧 ഗേൾ (Girls)', activeClass: 'active-girl' },
                                { key: 'COMMON', label: lang === 'EN' ? '🤝 Common' : '🤝 കോമൺ (Common)', activeClass: 'active' },
                              ].map(f => (
                                <div
                                  key={f.key}
                                  className={`filter-chip-box ${prizesGenderFilter === f.key ? f.activeClass : ''}`}
                                  onClick={() => setPrizesGenderFilter(f.key)}
                                  style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '700' }}
                                >
                                  {f.label}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* ── FILTER 4: Position / Rank / Status Filter ── */}
                          <div className="student-filters-container" style={{ marginBottom: '18px', background: '#fff', padding: '12px 16px', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                            <div className="filter-section-title" style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              🏅 {lang === 'EN' ? '4. Filter by Position / Prize' : '4. സമ്മാനം / സ്ഥാനം അനുസരിച്ച് തിരിക്കുക (Position)'}
                            </div>
                            <div className="filter-chips-wrapper" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {[
                                { key: 'ALL', label: lang === 'EN' ? '🏅 All Winners' : '🏅 All (എല്ലാ വിജയികളും)' },
                                { key: 'FIRST', label: lang === 'EN' ? '🥇 First Place' : '🥇 ഫസ്റ്റ് (1st Place)' },
                                { key: 'SECOND', label: lang === 'EN' ? '🥈 Second Place' : '🥈 സെക്കൻഡ് (2nd Place)' },
                                { key: 'THIRD', label: lang === 'EN' ? '🥉 Third Place' : '🥉 തേർഡ് (3rd Place)' },
                                { key: 'PARTICIPANTS', label: lang === 'EN' ? '🎗️ Participant Members' : '🎗️ പാർട്ടിസിപ്പന്റ്സ് (പങ്കെടുത്തവർ)' },
                              ].map(f => (
                                <div
                                  key={f.key}
                                  className={`filter-chip-box ${prizesPlaceFilter === f.key ? 'active' : ''}`}
                                  onClick={() => setPrizesPlaceFilter(f.key)}
                                  style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '700' }}
                                >
                                  {f.label}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* ── Summary Stat Cards (5 Cards) ── */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1.5px solid #fcd34d', borderRadius: '14px', padding: '12px 10px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontSize: '22px', marginBottom: '2px' }}>🥇</div>
                              <div style={{ fontSize: '24px', fontWeight: '900', color: '#b45309', lineHeight: 1 }}>{countFirst}</div>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#92400e', marginTop: '4px' }}>{lang === 'EN' ? 'First Place' : 'ഫസ്റ്റ് (1st)'}</div>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '12px 10px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontSize: '22px', marginBottom: '2px' }}>🥈</div>
                              <div style={{ fontSize: '24px', fontWeight: '900', color: '#475569', lineHeight: 1 }}>{countSecond}</div>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#334155', marginTop: '4px' }}>{lang === 'EN' ? 'Second Place' : 'സെക്കൻഡ് (2nd)'}</div>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '1.5px solid #fdba74', borderRadius: '14px', padding: '12px 10px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontSize: '22px', marginBottom: '2px' }}>🥉</div>
                              <div style={{ fontSize: '24px', fontWeight: '900', color: '#c2410c', lineHeight: 1 }}>{countThird}</div>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#9a3412', marginTop: '4px' }}>{lang === 'EN' ? 'Third Place' : 'തേർഡ് (3rd)'}</div>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1.5px solid #a7f3d0', borderRadius: '14px', padding: '12px 10px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontSize: '22px', marginBottom: '2px' }}>🎗️</div>
                              <div style={{ fontSize: '24px', fontWeight: '900', color: '#047857', lineHeight: 1 }}>{countParticipants}</div>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#064e3b', marginTop: '4px' }}>{lang === 'EN' ? 'Participants' : 'പങ്കെടുത്തവർ'}</div>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1.5px solid #bfdbfe', borderRadius: '14px', padding: '12px 10px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                              <div style={{ fontSize: '22px', marginBottom: '2px' }}>🏆</div>
                              <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e40af', lineHeight: 1 }}>{filteredDisplayList.length}</div>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: '#1e3a8a', marginTop: '4px' }}>{lang === 'EN' ? 'Total Shown' : 'ലിസ്റ്റിലുള്ളവർ'}</div>
                            </div>
                          </div>

                          {/* ── Search Bar + PDF Export Bar ── */}
                          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '12px 16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
                              <input
                                type="text"
                                className="settings-input-v2"
                                placeholder={lang === 'EN' ? '🔍 Search by Reg No, Name, Program, Team...' : '🔍 രജിസ്റ്റർ നമ്പർ, പേര്, പ്രോഗ്രാം, ടീം തിരയുക...'}
                                value={prizesStudentSearch}
                                onChange={(e) => setPrizesStudentSearch(e.target.value)}
                                style={{ margin: 0, width: '100%' }}
                              />
                              {prizesStudentSearch && (
                                <button
                                  type="button"
                                  onClick={() => setPrizesStudentSearch('')}
                                  style={{ background: '#cbd5e1', border: 'none', borderRadius: '8px', padding: '9px 14px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                >
                                  ✕ Clear
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={generatePrizesPDF}
                              style={{
                                background: 'linear-gradient(135deg, #1e40af, #1d4ed8)',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '10px',
                                fontWeight: '800',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(30,64,175,0.25)',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              📄 {lang === 'EN' ? 'Download Prizes PDF' : 'സമ്മാനങ്ങളുടെ പിഡിഎഫ് (PDF)'}
                            </button>
                          </div>

                          {/* ── Prizes & Participants Data Table ── */}
                          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ background: '#1e3a8a', color: 'white', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '45px' }}>#</th>
                                  <th style={{ padding: '10px 12px', width: '75px' }}>Reg No</th>
                                  <th style={{ padding: '10px 12px' }}>Student Name</th>
                                  <th style={{ padding: '10px 12px', width: '60px' }}>Gender</th>
                                  <th style={{ padding: '10px 12px' }}>Category</th>
                                  <th style={{ padding: '10px 12px' }}>Competition</th>
                                  <th style={{ padding: '10px 12px', width: '65px' }}>Type</th>
                                  <th style={{ padding: '10px 12px' }}>Position / Status</th>
                                  <th style={{ padding: '10px 12px' }}>Team</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredDisplayList.length === 0 ? (
                                  <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontStyle: 'italic' }}>
                                      {lang === 'EN' ? 'No records found for this filter.' : 'ഈ ഫിൽട്ടറിൽ വിവരങ്ങൾ ലഭ്യമല്ല.'}
                                    </td>
                                  </tr>
                                ) : (
                                  filteredDisplayList.map((r, idx) => {
                                    const is1st = r.position === 'First';
                                    const is2nd = r.position === 'Second';
                                    const is3rd = r.position === 'Third';
                                    const isPart = r.position === 'Participant';

                                    const badgeBg = is1st ? '#fef3c7' : is2nd ? '#e2e8f0' : is3rd ? '#ffedd5' : '#dcfce7';
                                    const badgeColor = is1st ? '#92400e' : is2nd ? '#334155' : is3rd ? '#9a3412' : '#166534';
                                    const badgeBorder = is1st ? '#fcd34d' : is2nd ? '#94a3b8' : is3rd ? '#fdba74' : '#86efac';
                                    const icon = is1st ? '🥇' : is2nd ? '🥈' : is3rd ? '🥉' : '🎗️';
                                    const posLabel = is1st ? '1st Place' : is2nd ? '2nd Place' : is3rd ? '3rd Place' : (lang === 'EN' ? 'Participant' : 'പങ്കെടുത്തവർ');

                                    const isGrp = r.isGroup || r.isTeam;
                                    const rowBg = isGrp ? (idx % 2 === 0 ? '#fefce8' : '#fef9c3') : (idx % 2 === 0 ? '#fff' : '#f8fafc');

                                    return (
                                      <tr key={(r.id || '') + '_' + idx} style={{ borderBottom: '1px solid #e2e8f0', background: rowBg }}>
                                        <td style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                                        <td style={{ padding: '10px 12px', fontWeight: '800', color: '#1e40af' }}>{r.regNo || '—'}</td>
                                        <td style={{ padding: '10px 12px', fontWeight: '700', color: '#1e293b' }}>
                                          {r.studentName}
                                          {r.groupLabel && isGrp && (
                                            <span style={{ display: 'block', fontSize: '11px', color: '#92400e', fontWeight: '600', marginTop: '1px' }}>
                                              👥 {r.groupLabel} {r.memberTotal ? `(${r.memberIndex || 1}/${r.memberTotal})` : ''}
                                            </span>
                                          )}
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                          <span style={{
                                            background: r.gender === 'GIRL' ? '#fce7f3' : '#dbeafe',
                                            color: r.gender === 'GIRL' ? '#9d174d' : '#1e40af',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            fontWeight: '800'
                                          }}>
                                            {r.gender === 'GIRL' ? '👧 Girl' : '👦 Boy'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#475569', fontWeight: '600' }}>{r.catName}</td>
                                        <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>
                                          {r.progName}
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                          <span style={{
                                            background: r.progType === 'GROUP' ? '#fee2e2' : r.progType === 'TEAM' ? '#e0e7ff' : '#f1f5f9',
                                            color: r.progType === 'GROUP' ? '#991b1b' : r.progType === 'TEAM' ? '#3730a3' : '#475569',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            fontWeight: '800'
                                          }}>
                                            {r.progType}
                                          </span>
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                          <span style={{
                                            background: badgeBg,
                                            color: badgeColor,
                                            border: `1px solid ${badgeBorder}`,
                                            padding: '3px 9px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}>
                                            <span>{icon}</span> <span>{posLabel}</span>
                                          </span>
                                        </td>
                                        <td style={{ padding: '10px 12px', fontWeight: '600', color: '#475569' }}>{r.teamName || '—'}</td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
'''

new_content = content[:start_pos] + new_prizes_block + content[end_pos:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Prizes tab optimized with fast maps & bulletproof safety!")

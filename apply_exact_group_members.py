import sys

file_path = r'd:\MILAD UN NABI\milad\src\App.js'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

target_start = "                    // 👥 Helper to resolve all registered student members for a GROUP or TEAM result entry"
target_end = "                    // 🏆 Sort Results History:"

idx_start = code.find(target_start)
idx_end = code.find(target_end, idx_start)

if idx_start == -1 or idx_end == -1:
    print(f"ERROR: Start ({idx_start}) or End ({idx_end}) not found!")
    sys.exit(1)

replacement = """                    // 👥 Helper to resolve ONLY the specific student members ticked/selected for this GROUP or TEAM entry
                    const getGroupOrTeamMembers = (resultRow, programGroup) => {
                      const rTeamId = String(resultRow.teamid || resultRow.teamId || resultRow.team_id || '').trim().toLowerCase();
                      const rTeamName = String(resultRow.teamname || resultRow.teamName || '').trim().toLowerCase();
                      const rEntryName = String(resultRow.studentname || resultRow.studentName || '').trim().toLowerCase();
                      const pId = String(programGroup.progId || programGroup.progObj?.id || '').trim();
                      const pCode = String(programGroup.progObj?.code || '').trim().toLowerCase();
                      const pName = String(programGroup.progName || programGroup.progObj?.name || '').trim().toLowerCase();

                      // Resolve team object
                      const canonicalTeam = (teams || []).find(t => 
                        (rTeamId && String(t.id).toLowerCase() === rTeamId) ||
                        (rTeamName && String(t.name || '').trim().toLowerCase() === rTeamName)
                      );
                      const resolvedTeamId = canonicalTeam ? String(canonicalTeam.id).toLowerCase() : rTeamId;

                      if (!Array.isArray(groupRegistrations) || groupRegistrations.length === 0) {
                        return [];
                      }

                      // 1. Filter groupRegistrations strictly for this program and team
                      const candidateGroups = groupRegistrations.filter(g => {
                        if (!g) return false;
                        const gProgId = String(g.program_id || g.progid || g.programId || '').trim();
                        const gProgCode = String(g.program_code || g.progcode || '').trim().toLowerCase();
                        const gTeamId = String(g.team_id || g.teamid || '').trim().toLowerCase();

                        const progMatches = (pId && gProgId === pId) ||
                                            (pCode && (gProgId.toLowerCase() === pCode || gProgCode === pCode)) ||
                                            (pName && (gProgId.toLowerCase() === pName || gProgCode === pName));

                        if (!progMatches) return false;

                        const teamMatches = (resolvedTeamId && gTeamId === resolvedTeamId) ||
                                            (rTeamId && gTeamId === rTeamId) ||
                                            (rTeamName && canonicalTeam && gTeamId === String(canonicalTeam.id).toLowerCase()) ||
                                            (!resolvedTeamId && !rTeamId && !rTeamName);

                        return teamMatches;
                      });

                      // 2. Match the specific group entry by group_name (e.g. "A", "B", "C", "Majlisunnoor Team", etc.)
                      let matchedGroup = null;
                      if (rEntryName) {
                        matchedGroup = candidateGroups.find(g => {
                          const gName = String(g.group_name || '').trim().toLowerCase();
                          return gName === rEntryName || gName === `team ${rEntryName}` || `team ${gName}` === rEntryName;
                        });
                      }

                      // If not matched by exact name, but there is only 1 registered group for this team in this program, use it
                      if (!matchedGroup && candidateGroups.length === 1) {
                        matchedGroup = candidateGroups[0];
                      }

                      // If still not matched and entry name has multiple words or prefixes, check fuzzy match
                      if (!matchedGroup && candidateGroups.length > 0 && rEntryName) {
                        matchedGroup = candidateGroups.find(g => {
                          const gName = String(g.group_name || '').trim().toLowerCase();
                          return gName && (gName.includes(rEntryName) || rEntryName.includes(gName));
                        });
                      }

                      // If no matching group registration found, return empty array (DO NOT fallback to entire team!)
                      if (!matchedGroup) {
                        return [];
                      }

                      // 3. Extract ONLY the student_ids ticked for this specific matchedGroup
                      let mIds = [];
                      if (Array.isArray(matchedGroup.student_ids)) {
                        mIds = matchedGroup.student_ids;
                      } else if (typeof matchedGroup.student_ids === 'string') {
                        try {
                          mIds = JSON.parse(matchedGroup.student_ids || '[]');
                        } catch (e) {
                          mIds = matchedGroup.student_ids.split(',').map(s => s.trim());
                        }
                      }
                      if (!Array.isArray(mIds)) mIds = [mIds];

                      const lId = String(matchedGroup.leader_id || '').trim();
                      const resolvedStudents = [];
                      const addedKeys = new Set();

                      // If leader is specified, ensure leader is included
                      if (lId) {
                        const leaderSt = (students || []).find(s => 
                          String(s.id).trim() === lId || 
                          String(s.regno || s.regNo || '').trim() === lId
                        );
                        if (leaderSt) {
                          const key = String(leaderSt.id || leaderSt.regno);
                          addedKeys.add(key);
                          resolvedStudents.push({ ...leaderSt, isLeader: true });
                        }
                      }

                      mIds.forEach(item => {
                        if (!item) return;
                        let targetId = '';
                        let targetReg = '';
                        if (typeof item === 'object') {
                          targetId = String(item.id || item.student_id || '').trim();
                          targetReg = String(item.regno || item.regNo || '').trim();
                        } else {
                          targetId = String(item).trim();
                        }

                        const st = (students || []).find(s =>
                          (targetId && String(s.id).trim() === targetId) ||
                          (targetId && String(s.regno || s.regNo || '').trim() === targetId) ||
                          (targetReg && String(s.regno || s.regNo || '').trim() === targetReg)
                        );

                        if (st) {
                          const key = String(st.id || st.regno);
                          if (!addedKeys.has(key)) {
                            addedKeys.add(key);
                            const isLeader = Boolean(lId && (String(st.id).trim() === lId || String(st.regno || s.regNo || '').trim() === lId));
                            resolvedStudents.push({ ...st, isLeader });
                          }
                        } else if (typeof item === 'object' && (item.name || item.student_name)) {
                          resolvedStudents.push({
                            id: targetId || targetReg || Math.random(),
                            name: item.name || item.student_name,
                            regno: targetReg || targetId || '',
                            gender: item.gender || item.student_gender || '',
                            photo_url: item.photo_url || '',
                            isLeader: false
                          });
                        }
                      });

                      return resolvedStudents;
                    };

"""

code = code[:idx_start] + replacement + code[idx_end:]
print("Replacement prepared. Writing file...")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: Exact group member matching applied to App.js!")

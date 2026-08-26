import sys

file_path = r'd:\MILAD UN NABI\milad\src\App.js'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Locate section: "const availableCategories = (categories || []).filter(c => c && c.id && c.name);"
target_start = "                    // Available categories for filtering\n                    const availableCategories = (categories || []).filter(c => c && c.id && c.name);"
if target_start not in code:
    # try variant without comment
    target_start = "const availableCategories = (categories || []).filter(c => c && c.id && c.name);"
    if target_start not in code:
        print("ERROR: availableCategories line not found!")
        sys.exit(1)

target_end = "                        <button onClick={printResultsHistory} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>\n                          📄 Download PDF / Print\n                        </button>\n                      </div>\n                    );\n                  })()"

idx_start = code.find(target_start)
idx_end = code.find(target_end, idx_start)

if idx_start == -1 or idx_end == -1:
    print(f"ERROR: Start ({idx_start}) or End ({idx_end}) not found!")
    sys.exit(1)

replacement = """                    // Available categories for filtering
                    const availableCategories = (categories || []).filter(c => c && c.id && c.name);

                    // 👥 Helper to resolve all registered student members for a GROUP or TEAM result entry
                    const getGroupOrTeamMembers = (resultRow, programGroup) => {
                      const rTeamId = String(resultRow.teamid || resultRow.teamId || resultRow.team_id || '').trim().toLowerCase();
                      const rTeamName = String(resultRow.teamname || resultRow.teamName || '').trim().toLowerCase();
                      const rStudentName = String(resultRow.studentname || resultRow.studentName || '').trim().toLowerCase();
                      const pId = String(programGroup.progId || programGroup.progObj?.id || '').trim();
                      const pCode = String(programGroup.progObj?.code || '').trim().toLowerCase();
                      const pName = String(programGroup.progName || programGroup.progObj?.name || '').trim().toLowerCase();

                      const memberMap = new Map();

                      const addStudent = (st, isLeader = false) => {
                        if (!st) return;
                        const key = String(st.id || st.regno || st.regNo || st.name);
                        if (!memberMap.has(key)) {
                          memberMap.set(key, { ...st, isLeader });
                        }
                      };

                      // 1. Check in groupRegistrations
                      if (Array.isArray(groupRegistrations)) {
                        groupRegistrations.forEach(g => {
                          if (!g) return;
                          const gProgId = String(g.program_id || g.progid || g.programId || '').trim();
                          const gProgCode = String(g.program_code || g.progcode || '').trim().toLowerCase();
                          const gTeamId = String(g.team_id || g.teamid || '').trim().toLowerCase();
                          const gGroupName = String(g.group_name || '').trim().toLowerCase();

                          const progMatches = (pId && gProgId === pId) || 
                                              (pCode && (gProgId.toLowerCase() === pCode || gProgCode === pCode)) ||
                                              (pName && (gProgCode === pName || gProgId.toLowerCase() === pName));

                          const teamMatches = (rTeamId && gTeamId === rTeamId) ||
                                              (rTeamName && (gGroupName === rTeamName || gGroupName.includes(rTeamName) || rTeamName.includes(gGroupName))) ||
                                              (rStudentName && (gGroupName === rStudentName || rStudentName.includes(gGroupName) || gGroupName.includes(rStudentName)));

                          if (progMatches && (teamMatches || (!rTeamId && !rTeamName))) {
                            // Leader
                            const lId = String(g.leader_id || '').trim();
                            if (lId) {
                              const leaderSt = (students || []).find(s => String(s.id).trim() === lId || String(s.regno || s.regNo || '').trim() === lId);
                              if (leaderSt) addStudent(leaderSt, true);
                            }

                            // Student IDs
                            let mIds = [];
                            if (Array.isArray(g.student_ids)) mIds = g.student_ids;
                            else if (typeof g.student_ids === 'string') {
                              try { mIds = JSON.parse(g.student_ids || '[]'); } catch (e) {
                                mIds = g.student_ids.split(',').map(s => s.trim());
                              }
                            }
                            if (!Array.isArray(mIds)) mIds = [mIds];

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
                              if (st) addStudent(st, false);
                              else if (typeof item === 'object' && (item.name || item.student_name)) {
                                addStudent({
                                  id: targetId || targetReg || Math.random(),
                                  name: item.name || item.student_name,
                                  regno: targetReg || targetId || '',
                                  gender: item.gender || item.student_gender || '',
                                  photo_url: item.photo_url || ''
                                }, false);
                              }
                            });
                          }
                        });
                      }

                      // 2. Check in programRegistrations
                      if (memberMap.size === 0 && Array.isArray(programRegistrations)) {
                        programRegistrations.forEach(pr => {
                          if (!pr) return;
                          const prProgId = String(pr.program_id || pr.progid || pr.programId || '').trim();
                          const prProgCode = String(pr.program_code || pr.progcode || '').trim().toLowerCase();
                          const prTeamId = String(pr.team_id || pr.teamid || '').trim().toLowerCase();
                          const prTeamName = String(pr.team_name || pr.teamname || '').trim().toLowerCase();

                          const progMatches = (pId && prProgId === pId) || 
                                              (pCode && (prProgId.toLowerCase() === pCode || prProgCode === pCode));

                          const teamMatches = (rTeamId && prTeamId === rTeamId) ||
                                              (rTeamName && prTeamName === rTeamName);

                          if (progMatches && teamMatches) {
                            const sId = String(pr.student_id || '').trim();
                            const sReg = String(pr.regno || pr.regNo || '').trim();
                            const st = (students || []).find(s => 
                              (sId && String(s.id).trim() === sId) ||
                              (sReg && String(s.regno || s.regNo || '').trim() === sReg)
                            );
                            if (st) addStudent(st, false);
                          }
                        });
                      }

                      // 3. Fallback: match students of this team belonging to the program category
                      if (memberMap.size === 0 && (rTeamId || rTeamName) && Array.isArray(students)) {
                        const teamStudents = students.filter(s => {
                          const sTeamId = String(s.teamid || s.team_id || '').trim().toLowerCase();
                          const sTeamName = String(s.teamname || s.teamName || '').trim().toLowerCase();
                          const matchesTeam = (rTeamId && sTeamId === rTeamId) || (rTeamName && sTeamName === rTeamName);
                          if (!matchesTeam) return false;

                          if (programGroup.catObj?.id || programGroup.progObj?.catid) {
                            const pCatId = String(programGroup.catObj?.id || programGroup.progObj?.catid || '').trim();
                            const sCatId = String(s.catid || s.catId || s.category || '').trim();
                            if (pCatId && sCatId && pCatId !== sCatId) return false;
                          }
                          return true;
                        });
                        if (teamStudents.length > 0 && teamStudents.length <= 15) {
                          teamStudents.forEach(st => addStudent(st, false));
                        }
                      }

                      return Array.from(memberMap.values());
                    };

                    // 🏆 Sort Results History:
                    // 1. Most recently published program at the VERY TOP:
                    //    - If published_at timestamp exists: highest pubTime (descending)
                    //    - Then lowest pubIndex (ascending: index 0 is newest)
                    // 2. If tied, sort by latest result modification/creation time (descending)
                    // 3. Fallback: maxResultId / maxListIndex (descending)
                    const sortedProgramSections = Array.from(groupMap.values()).sort((a, b) => {
                      if (a.pubTime > 0 && b.pubTime > 0 && a.pubTime !== b.pubTime) {
                        return b.pubTime - a.pubTime;
                      }
                      if (a.pubTime > 0 && (!b.pubTime || b.pubTime === 0)) return -1;
                      if (b.pubTime > 0 && (!a.pubTime || a.pubTime === 0)) return 1;

                      if (a.pubIndex !== b.pubIndex && a.pubIndex !== 999999 && b.pubIndex !== 999999) {
                        return a.pubIndex - b.pubIndex;
                      }
                      if (a.pubIndex !== 999999 && b.pubIndex === 999999) return -1;
                      if (b.pubIndex !== 999999 && a.pubIndex === 999999) return 1;

                      if (a.latestTime !== b.latestTime && a.latestTime > 0 && b.latestTime > 0) {
                        return b.latestTime - a.latestTime;
                      }
                      if (a.maxResultId !== b.maxResultId && a.maxResultId > 0 && b.maxResultId > 0) {
                        return b.maxResultId - a.maxResultId;
                      }
                      if (a.maxListIndex !== b.maxListIndex) {
                        return b.maxListIndex - a.maxListIndex;
                      }
                      return 0;
                    });

                    sortedProgramSections.forEach(group => {
                      group.rows.sort((a, b) => {
                        const rankA = placeRank(a.place);
                        const rankB = placeRank(b.place);
                        if (rankA !== rankB) return rankA - rankB;

                        const regA = parseInt((a.studentname || '').split(' - ')[0] || '0', 10) || 0;
                        const regB = parseInt((b.studentname || '').split(' - ')[0] || '0', 10) || 0;
                        return regA - regB;
                      });
                    });

                    const printResultsHistory = () => {
                      let allRows = '';
                      let printedProgCount = 0;
                      let printedRowCount = 0;

                      sortedProgramSections.forEach(group => {
                        if (!matchesTypeFilter(group.progType)) return;
                        if (!matchesCatFilter(group)) return;

                        if (publishProgSearch) {
                          const q = publishProgSearch.toLowerCase().trim();
                          const matchProg = (group.progName || '').toLowerCase().includes(q) || (group.progObj?.code || '').toLowerCase().includes(q);
                          const matchStudent = group.rows.some(r => (r.studentname || '').toLowerCase().includes(q) || (r.teamname || '').toLowerCase().includes(q));
                          if (!matchProg && !matchStudent) return;
                        }

                        const visibleRows = group.rows.filter(r => matchesPlaceFilter(r.place));
                        if (visibleRows.length === 0) return;
                        printedProgCount++;

                        visibleRows.forEach(r => {
                          printedRowCount++;
                          const sName = r.studentname || r.studentName || '';
                          const dashIdx = sName.indexOf(' - ');
                          const regPart = dashIdx !== -1 ? sName.substring(0, dashIdx) : '';
                          const namePart = dashIdx !== -1 ? sName.substring(dashIdx + 3) : sName;
                          const isGroupOrTeam = String(group.progType || '').toUpperCase().includes('GROUP') || String(group.progType || '').toUpperCase().includes('TEAM');

                          let membersHtml = '';
                          let photoHtml = '';

                          if (isGroupOrTeam) {
                            const members = getGroupOrTeamMembers(r, group);
                            photoHtml = `<span style="font-size:18px;">👥</span>`;
                            if (members.length > 0) {
                              const memList = members.map(m => `${m.regno ? '#' + m.regno + ' ' : ''}${m.name || ''}`).join(', ');
                              membersHtml = `<div style="font-size:11px;color:#475569;margin-top:3px;"><b>Members:</b> ${memList}</div>`;
                            }
                          } else {
                            const student = students.find(s => String(s.regno || s.regNo || '') === String(regPart));
                            const hasPhoto = student && student.photo_url && student.photo_status && student.photo_status !== 'none';
                            photoHtml = hasPhoto
                              ? `<img src="${student.photo_url}" style="width:30px;height:30px;border-radius:4px;object-fit:cover;display:block;margin:0 auto;" />`
                              : `<span style="font-size:16px;">${(r.studentgender || r.studentGender) === 'BOY' ? '👦' : '👧'}</span>`;
                          }

                          const placeLabel = r.place === 'First' || r.place === '1' ? 'First' : r.place === 'Second' || r.place === '2' ? 'Second' : r.place === 'Third' || r.place === '3' ? 'Third' : r.place || '-';
                          const gradeLabel = (r.grade === '-' || r.grade === 'No' || !r.grade) ? '-' : r.grade;
                          allRows += `<tr>
                            <td>${group.progName}</td>
                            <td>${String(group.progType).includes('GROUP') ? 'GROUP' : String(group.progType).includes('TEAM') ? 'TEAM' : 'SINGLE'}</td>
                            <td>${group.catName}</td>
                            <td>${photoHtml}</td>
                            <td>${isGroupOrTeam ? '—' : regPart}</td>
                            <td><b>${isGroupOrTeam ? (namePart || sName) : namePart}</b>${membersHtml}</td>
                            <td>${isGroupOrTeam ? '—' : ((r.studentgender || r.studentGender) === 'BOY' ? 'Boy' : 'Girl')}</td>
                            <td>${r.teamname || r.teamName}</td>
                            <td>${placeLabel}</td>
                            <td>${gradeLabel}</td>
                            <td>${r.points}</td>
                          </tr>`;
                        });
                      });

                      const selectedCatObj = categories.find(c => String(c.id) === String(resultsHistoryCatFilter));
                      const catLabel = selectedCatObj ? ` | Category: ${selectedCatObj.name}` : resultsHistoryCatFilter !== 'ALL' ? ` | Category: ${resultsHistoryCatFilter}` : '';
                      const typeLabel = resultsHistoryTypeFilter !== 'ALL' ? ` | Type: ${resultsHistoryTypeFilter}` : '';
                      const placeLabel = resultsHistoryPlaceFilter === 'FIRST'
                        ? ' | 1st Place Winners'
                        : resultsHistoryPlaceFilter === 'SECOND'
                        ? ' | 2nd Place Winners'
                        : resultsHistoryPlaceFilter === 'THIRD'
                        ? ' | 3rd Place Winners'
                        : ' | All Winners';

                      const filterSummary = `${typeLabel}${catLabel}${placeLabel}`.replace(/^ \\| /, '') || 'All Results';

                      const html = `
                    <html><head><title>Results History - ${filterSummary}</title>
                    <style>body{font-family:Arial,sans-serif;padding:20px;background:#fff} h1{color:#1e1b4b;text-align:center;} .sub{text-align:center;color:#64748b;font-size:13px;margin-top:4px;margin-bottom:16px} table{width:100%;border-collapse:collapse;margin-top:10px} th{background:#1e1b4b;color:white;padding:10px} td{padding:8px;border:1px solid #e2e8f0;text-align:center;font-size:14px;}</style></head>
                    <body>
                    <h1>🏆 Results History</h1>
                    <div class="sub"><b>${filterSummary}</b> • Total: ${printedRowCount} winners across ${printedProgCount} programs</div>
                    <table><thead><tr><th>Program</th><th>Type</th><th>Category</th><th>Photo</th><th>Reg No</th><th>Student / Team</th><th>Gender</th><th>Team</th><th>Place</th><th>Grade</th><th>Points</th></tr></thead><tbody>${allRows}</tbody></table>
                    </body></html>
                  `;
                      printHtml(html);
                    };

                    const matchingSections = sortedProgramSections.filter(group => {
                      if (!matchesTypeFilter(group.progType)) return false;
                      if (!matchesCatFilter(group)) return false;

                      const hasPlaceMatches = group.rows.some(r => matchesPlaceFilter(r.place));
                      if (!hasPlaceMatches) return false;

                      if (!publishProgSearch) return true;
                      const q = publishProgSearch.toLowerCase().trim();
                      const matchProg = (group.progName || '').toLowerCase().includes(q) || (group.progObj?.code || '').toLowerCase().includes(q);
                      const matchStudent = group.rows.some(r => (r.studentname || '').toLowerCase().includes(q) || (r.teamname || '').toLowerCase().includes(q));
                      return matchProg || matchStudent;
                    });

                    return (
                      <div>
                        {/* Search & Action Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '12px', marginBottom: '14px' }}>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                            📋 {lang === 'EN' ? 'Program Results List' : 'പ്രോഗ്രാം ഫലങ്ങളുടെ ലിസ്റ്റ്'} ({matchingSections.length} {lang === 'EN' ? 'programs' : 'പ്രോഗ്രാമുകൾ'})
                          </div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                placeholder={lang === 'EN' ? '🔍 Search program / student...' : '🔍 പ്രോഗ്രാം / വിദ്യാർത്ഥി തിരയുക...'}
                                value={publishProgSearch}
                                onChange={e => setPublishProgSearch(e.target.value)}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #cbd5e1',
                                  fontSize: '13px',
                                  minWidth: '220px'
                                }}
                              />
                              {publishProgSearch && (
                                <button
                                  type="button"
                                  onClick={() => setPublishProgSearch('')}
                                  style={{ background: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={printResultsHistory}
                              style={{
                                background: '#0284c7',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(2,132,199,0.3)'
                              }}
                            >
                              <span>🖨️</span>
                              <span>{lang === 'EN' ? 'Print / PDF' : 'പ്രിന്റ് / PDF'}</span>
                            </button>
                          </div>
                        </div>

                        {/* 🎛️ Multi-level Filter Box (Type, Category, Place) */}
                        <div style={{
                          background: '#ffffff',
                          padding: '14px 16px',
                          borderRadius: '16px',
                          border: '1.5px solid #e2e8f0',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                          marginBottom: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          {/* 1. Type Filter: All, Single, Group, Team */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#475569', minWidth: '90px' }}>
                              🏷️ {lang === 'EN' ? 'Type:' : 'ഇനം:'}
                            </span>
                            {[
                              { key: 'ALL', label: 'All', icon: '🌟', count: typeCounts.all },
                              { key: 'SINGLE', label: 'Single', icon: '👤', count: typeCounts.single },
                              { key: 'GROUP', label: 'Group', icon: '👥', count: typeCounts.group },
                              { key: 'TEAM', label: 'Team', icon: '🏟️', count: typeCounts.team }
                            ].map(f => {
                              const isAct = resultsHistoryTypeFilter === f.key;
                              return (
                                <button
                                  key={f.key}
                                  type="button"
                                  onClick={() => setResultsHistoryTypeFilter(f.key)}
                                  style={{
                                    padding: '5px 13px',
                                    borderRadius: '20px',
                                    border: isAct ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
                                    background: isAct ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#f8fafc',
                                    color: isAct ? '#ffffff' : '#334155',
                                    fontWeight: '800',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: isAct ? '0 3px 10px rgba(37,99,235,0.3)' : 'none',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <span>{f.icon}</span>
                                  <span>{f.label}</span>
                                  {f.count !== undefined && (
                                    <span style={{
                                      background: isAct ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                                      color: isAct ? '#ffffff' : '#64748b',
                                      padding: '1px 6px',
                                      borderRadius: '10px',
                                      fontSize: '10.5px',
                                      fontWeight: '800'
                                    }}>
                                      {f.count}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* 2. Category Filter: All, Kiddies, Sub Junior, Junior, Senior, General... */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#475569', minWidth: '90px' }}>
                              📂 {lang === 'EN' ? 'Category:' : 'വിഭാഗം:'}
                            </span>
                            {[
                              { key: 'ALL', label: 'All', icon: '🌟', count: catCounts['ALL'] || displayHistoryResults.length },
                              ...availableCategories.map(c => ({
                                key: String(c.id),
                                label: c.name,
                                icon: '🏷️',
                                count: catCounts[String(c.id)] || 0
                              }))
                            ].map(f => {
                              const isAct = resultsHistoryCatFilter === f.key;
                              return (
                                <button
                                  key={f.key}
                                  type="button"
                                  onClick={() => setResultsHistoryCatFilter(f.key)}
                                  style={{
                                    padding: '5px 13px',
                                    borderRadius: '20px',
                                    border: isAct ? '2px solid #7c3aed' : '1.5px solid #cbd5e1',
                                    background: isAct ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#f8fafc',
                                    color: isAct ? '#ffffff' : '#334155',
                                    fontWeight: '800',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: isAct ? '0 3px 10px rgba(124,58,237,0.3)' : 'none',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <span>{f.icon}</span>
                                  <span>{f.label}</span>
                                  {f.count !== undefined && (
                                    <span style={{
                                      background: isAct ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                                      color: isAct ? '#ffffff' : '#64748b',
                                      padding: '1px 6px',
                                      borderRadius: '10px',
                                      fontSize: '10.5px',
                                      fontWeight: '800'
                                    }}>
                                      {f.count}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* 3. Place Filter: All, 1st Place, 2nd Place, 3rd Place */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#475569', minWidth: '90px' }}>
                              🏆 {lang === 'EN' ? 'Place:' : 'സ്ഥാനം:'}
                            </span>
                            {[
                              { key: 'ALL', label: 'All', icon: '🌟', count: totalWinnersCount },
                              { key: 'FIRST', label: '1st Place', icon: '🥇', count: firstCount },
                              { key: 'SECOND', label: '2nd Place', icon: '🥈', count: secondCount },
                              { key: 'THIRD', label: '3rd Place', icon: '🥉', count: thirdCount },
                            ].map(f => {
                              const isAct = resultsHistoryPlaceFilter === f.key;
                              return (
                                <button
                                  key={f.key}
                                  type="button"
                                  onClick={() => setResultsHistoryPlaceFilter(f.key)}
                                  style={{
                                    padding: '5px 13px',
                                    borderRadius: '20px',
                                    border: isAct ? '2px solid #059669' : '1.5px solid #cbd5e1',
                                    background: isAct ? 'linear-gradient(135deg, #059669, #047857)' : '#f8fafc',
                                    color: isAct ? '#ffffff' : '#334155',
                                    fontWeight: '800',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: isAct ? '0 3px 10px rgba(5,150,105,0.3)' : 'none',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <span>{f.icon}</span>
                                  <span>{f.label}</span>
                                  <span style={{
                                    background: isAct ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                                    color: isAct ? '#ffffff' : '#64748b',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    fontSize: '10.5px',
                                    fontWeight: '800'
                                  }}>
                                    {f.count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* ── Program Sections ── */}
                        {matchingSections.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '12px', border: '1.5px solid #e2e8f0', color: '#64748b', fontStyle: 'italic' }}>
                            {lang === 'EN' ? 'No results found matching the selected filters.' : 'തിരഞ്ഞെടുത്ത ഫിൽട്ടറുകൾക്ക് അനുയോജ്യമായ ഫലങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല.'}
                          </div>
                        ) : (
                          matchingSections.map(group => {
                            const visibleRows = group.rows.filter(r => matchesPlaceFilter(r.place));
                            if (visibleRows.length === 0) return null;
                            const isGroupOrTeam = String(group.progType || '').toUpperCase().includes('GROUP') || String(group.progType || '').toUpperCase().includes('TEAM');

                            return (
                              <div
                                key={group.groupKey}
                                style={{
                                  background: '#ffffff',
                                  borderRadius: '14px',
                                  border: '1.5px solid #e2e8f0',
                                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                                  marginBottom: '20px',
                                  overflow: 'hidden'
                                }}
                              >
                                {/* ── Section Header: Clean title, category, type, entries count ── */}
                                <div style={{
                                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                                  padding: '12px 16px',
                                  borderBottom: '1.5px solid #e2e8f0',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '10px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '22px' }}>🏆</span>
                                    <div>
                                      <div style={{ fontWeight: '900', fontSize: '15px', color: '#1e1b4b' }}>
                                        {group.progObj?.code ? `${group.progObj.code} - ` : ''}{group.progName}
                                      </div>
                                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '3px', fontSize: '11.5px' }}>
                                        {group.catName && (
                                          <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '1px 8px', borderRadius: '4px', fontWeight: '800' }}>
                                            {group.catName}
                                          </span>
                                        )}
                                        <span style={{ background: String(group.progType).includes('GROUP') ? '#fee2e2' : String(group.progType).includes('TEAM') ? '#fef3c7' : '#dcfce7', color: String(group.progType).includes('GROUP') ? '#991b1b' : String(group.progType).includes('TEAM') ? '#b45309' : '#166534', padding: '1px 8px', borderRadius: '4px', fontWeight: '800' }}>
                                          {String(group.progType).includes('GROUP') ? '👥 GROUP' : String(group.progType).includes('TEAM') ? '🏟️ TEAM' : '👤 SINGLE'}
                                        </span>
                                        <span style={{ color: '#64748b', fontWeight: '700' }}>
                                          ({visibleRows.length} {lang === 'EN' ? 'entries' : 'എൻട്രികൾ'})
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* ── Table of Winners for this Program ── */}
                                <div className="table-responsive-wrapper" style={{ margin: 0 }}>
                                  <table style={{ margin: 0, width: '100%' }}>
                                    <thead>
                                      <tr>
                                        <th style={{ width: '120px', textAlign: 'center' }}>Place</th>
                                        <th style={{ width: '50px', textAlign: 'center' }}>Photo</th>
                                        <th>{isGroupOrTeam ? 'Team / Group' : 'Register Number'}</th>
                                        <th>{isGroupOrTeam ? 'Entry Name' : 'Student'}</th>
                                        <th style={{ textAlign: 'center' }}>Gender</th>
                                        <th>Team</th>
                                        <th style={{ textAlign: 'center' }}>Grade</th>
                                        <th style={{ textAlign: 'center' }}>Points</th>
                                        {loginRole === 'ADMIN' && <th style={{ textAlign: 'center', width: '70px' }}>Delete</th>}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {visibleRows.map(r => {
                                        const sName = r.studentname || r.studentName || '';
                                        const dashIdx = sName.indexOf(' - ');
                                        const regPart = dashIdx !== -1 ? sName.substring(0, dashIdx) : '';
                                        const namePart = dashIdx !== -1 ? sName.substring(dashIdx + 3) : sName;
                                        const placeLabel = r.place === 'First' || r.place === '1' ? 'First' : r.place === 'Second' || r.place === '2' ? 'Second' : r.place === 'Third' || r.place === '3' ? 'Third' : r.place || '-';
                                        const gradeLabel = (r.grade === '-' || r.grade === 'No' || !r.grade) ? '-' : r.grade;

                                        const placeBg = placeLabel === 'First' ? '#fbbf24' : placeLabel === 'Second' ? '#94a3b8' : placeLabel === 'Third' ? '#f97316' : '#e2e8f0';
                                        const placeColor = placeLabel === 'First' ? '#78350f' : placeLabel === 'Second' ? '#1e293b' : placeLabel === 'Third' ? '#7c2d12' : '#475569';
                                        const placeEmoji = placeLabel === 'First' ? '🥇 1st Place' : placeLabel === 'Second' ? '🥈 2nd Place' : placeLabel === 'Third' ? '🥉 3rd Place' : placeLabel;

                                        const members = isGroupOrTeam ? getGroupOrTeamMembers(r, group) : [];
                                        const colSpan = loginRole === 'ADMIN' ? 9 : 8;

                                        return (
                                          <React.Fragment key={r.id}>
                                            {/* ── Main Result Row ── */}
                                            <tr style={{ background: placeLabel === 'First' ? '#fffdf0' : placeLabel === 'Second' ? '#f8fafc' : placeLabel === 'Third' ? '#fff9f5' : '#ffffff' }}>
                                              <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                  background: placeBg,
                                                  color: placeColor,
                                                  padding: '3px 10px',
                                                  borderRadius: '12px',
                                                  fontWeight: '800',
                                                  fontSize: '12px',
                                                  display: 'inline-block'
                                                }}>
                                                  {placeEmoji}
                                                </span>
                                              </td>
                                              <td style={{ textAlign: 'center' }}>
                                                {isGroupOrTeam ? (
                                                  <span style={{ fontSize: '20px' }}>👥</span>
                                                ) : (
                                                  renderTablePhoto(regPart, r.studentgender || r.studentGender)
                                                )}
                                              </td>
                                              <td>
                                                {isGroupOrTeam ? (
                                                  <b style={{ color: '#0f766e' }}>{r.teamname || r.teamName || '—'}</b>
                                                ) : (
                                                  <b style={{ color: '#1e40af' }}>{regPart}</b>
                                                )}
                                              </td>
                                              <td>
                                                <b>{isGroupOrTeam ? (namePart || sName) : namePart}</b>
                                              </td>
                                              <td style={{ textAlign: 'center' }}>
                                                {isGroupOrTeam ? (
                                                  <span style={{ color: '#64748b' }}>—</span>
                                                ) : (
                                                  (r.studentgender || r.studentGender) === 'BOY' ? 'Boy 👦' : 'Girl 👧'
                                                )}
                                              </td>
                                              <td><b>{r.teamname || r.teamName}</b></td>
                                              <td style={{ textAlign: 'center' }}>
                                                <span style={{ fontWeight: '800', color: gradeLabel === 'A' ? '#059669' : gradeLabel === 'B' ? '#2563eb' : gradeLabel === 'C' ? '#7c3aed' : '#94a3b8' }}>
                                                  {gradeLabel}
                                                </span>
                                              </td>
                                              <td style={{ textAlign: 'center' }}>
                                                <b style={{ color: '#0f766e' }}>{r.points} Pts</b>
                                              </td>
                                              
                                              {loginRole === 'ADMIN' && (
                                                <td style={{ textAlign: 'center' }}>
                                                  <button
                                                    onClick={() => handleDeleteResult(r.id)}
                                                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}
                                                  >
                                                    Delete
                                                  </button>
                                                </td>
                                              )}
                                            </tr>

                                            {/* ── Group / Team Participating Members Sub-Box (for Prize Distribution) ── */}
                                            {isGroupOrTeam && (
                                              <tr>
                                                <td colSpan={colSpan} style={{ padding: '0 14px 14px 14px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                  <div style={{
                                                    background: '#ffffff',
                                                    borderRadius: '12px',
                                                    border: `1.5px solid ${placeLabel === 'First' ? '#fde68a' : placeLabel === 'Second' ? '#cbd5e1' : placeLabel === 'Third' ? '#fdba74' : '#e2e8f0'}`,
                                                    overflow: 'hidden',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                                    marginTop: '6px'
                                                  }}>
                                                    {/* Sub-Box Header */}
                                                    <div style={{
                                                      background: placeLabel === 'First' ? '#fef3c7' : placeLabel === 'Second' ? '#f1f5f9' : placeLabel === 'Third' ? '#fff7ed' : '#f8fafc',
                                                      padding: '8px 14px',
                                                      borderBottom: '1px solid #e2e8f0',
                                                      display: 'flex',
                                                      justifyContent: 'space-between',
                                                      alignItems: 'center',
                                                      flexWrap: 'wrap',
                                                      gap: '6px'
                                                    }}>
                                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>
                                                        <span>{placeEmoji}</span>
                                                        <span>👥 {lang === 'EN' ? 'Participating Members:' : 'പങ്കെടുത്ത വിദ്യാർത്ഥികൾ:'}</span>
                                                        <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '1px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' }}>
                                                          {members.length} {lang === 'EN' ? 'Students' : 'വിദ്യാർത്ഥികൾ'}
                                                        </span>
                                                      </div>
                                                      <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                                                        ℹ️ {lang === 'EN' ? 'Points awarded to team only (No individual points/grades)' : 'പോയിന്റ് ടീമിന് മാത്രം (വ്യക്തിഗത പോയിന്റുകൾ ഇല്ല)'}
                                                      </div>
                                                    </div>

                                                    {/* Members Grid */}
                                                    {members.length === 0 ? (
                                                      <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                                                        {lang === 'EN' ? 'No registered student list found for this team in this program.' : 'ഈ ടീമിനായി രജിസ്റ്റർ ചെയ്ത വിദ്യാർത്ഥികളുടെ വിവരങ്ങൾ ലഭ്യമല്ല.'}
                                                      </div>
                                                    ) : (
                                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '12px 14px' }}>
                                                        {members.map((mem, mIdx) => {
                                                          const memReg = String(mem.regno || mem.regNo || '').trim();
                                                          const memName = mem.name || mem.studentname || mem.studentName || '';
                                                          const memGender = String(mem.gender || mem.studentgender || '').toUpperCase();
                                                          const memStudent = students.find(s => (memReg && String(s.regno || s.regNo || '').trim() === memReg) || (mem.id && String(s.id) === String(mem.id)));
                                                          const hasPhoto = memStudent && memStudent.photo_url && memStudent.photo_status && memStudent.photo_status !== 'none';

                                                          return (
                                                            <div
                                                              key={mIdx}
                                                              style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '9px',
                                                                background: '#f8fafc',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: '10px',
                                                                padding: '6px 12px',
                                                                minWidth: '170px',
                                                                flex: '0 0 auto',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                                              }}
                                                            >
                                                              {/* Photo / Avatar */}
                                                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #cbd5e1', flexShrink: 0, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {hasPhoto ? (
                                                                  <img src={memStudent.photo_url} alt={memName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                  <span style={{ fontSize: '18px' }}>{memGender === 'BOY' ? '👦' : memGender === 'GIRL' ? '👧' : '👤'}</span>
                                                                )}
                                                              </div>

                                                              {/* Student Info */}
                                                              <div>
                                                                <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#1e293b', lineHeight: '1.2' }}>
                                                                  {memName || '—'}
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px', fontSize: '11px' }}>
                                                                  {memReg && <b style={{ color: '#2563eb' }}>#{memReg}</b>}
                                                                  <span style={{ color: '#64748b' }}>{memGender === 'BOY' ? 'Boy 👦' : memGender === 'GIRL' ? 'Girl 👧' : ''}</span>
                                                                  {mem.isLeader && <span style={{ background: '#fef3c7', color: '#b45309', padding: '0 4px', borderRadius: '3px', fontWeight: '800', fontSize: '10px' }}>Leader</span>}
                                                                </div>
                                                              </div>
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })
                        )}"""

code = code[:idx_start] + replacement + code[idx_end:]
print("Replacement prepared. Writing file...")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: Group/Team member expansion successfully applied to App.js!")

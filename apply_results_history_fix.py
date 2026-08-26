import sys

file_path = r'd:\MILAD UN NABI\milad\src\App.js'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add resultsHistoryPlaceFilter state
target1 = "  const [publishProgSearch, setPublishProgSearch] = useState('');"
replacement1 = "  const [publishProgSearch, setPublishProgSearch] = useState('');\n  const [resultsHistoryPlaceFilter, setResultsHistoryPlaceFilter] = useState('ALL'); // 'ALL' | 'FIRST' | 'SECOND' | 'THIRD'"

if target1 not in code:
    print("ERROR: target1 not found!")
    sys.exit(1)

code = code.replace(target1, replacement1, 1)
print("Step 1 (resultsHistoryPlaceFilter state) added.")

# 2. Update Results History Section (lines ~9536 to 9874)
target2_start = "                    // 🏆 Group & Sort Results History by Program Section:"
target2_end = "                        <button onClick={printResultsHistory} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>\n                          📄 Download PDF / Print\n                        </button>\n                      </div>\n                    );\n                  })()"

idx_start2 = code.find(target2_start)
idx_end2 = code.find(target2_end, idx_start2)

if idx_start2 == -1 or idx_end2 == -1:
    print("ERROR: target2 not found!")
    sys.exit(1)

replacement2 = """                    // 🏆 Group & Sort Results History by Program Section:
                    // 1. Grouped by Program & Category
                    // 2. Sorted so the MOST RECENTLY PUBLISHED program appears at the VERY TOP (Descending by publish timestamp / index)
                    // 3. Filterable by Prize Place: All, 1st Place, 2nd Place, 3rd Place
                    const placeRank = (placeStr) => {
                      if (!placeStr) return 4;
                      const str = String(placeStr).trim().toLowerCase();
                      if (str === 'first' || str === '1' || str === '1st') return 1;
                      if (str === 'second' || str === '2' || str === '2nd') return 2;
                      if (str === 'third' || str === '3' || str === '3rd') return 3;
                      return 4;
                    };

                    const matchesPlaceFilter = (placeStr) => {
                      if (resultsHistoryPlaceFilter === 'ALL') return true;
                      const p = String(placeStr || '').trim().toLowerCase();
                      if (resultsHistoryPlaceFilter === 'FIRST') {
                        return p === 'first' || p === '1' || p === '1st';
                      }
                      if (resultsHistoryPlaceFilter === 'SECOND') {
                        return p === 'second' || p === '2' || p === '2nd';
                      }
                      if (resultsHistoryPlaceFilter === 'THIRD') {
                        return p === 'third' || p === '3' || p === '3rd';
                      }
                      return true;
                    };

                    const displayHistoryResults = resultsList.filter(r => isProgPublished(r.progid));
                    const groupMap = new Map();

                    // Retrieve publish timestamps from all available sources
                    let pubTimes = { ...(visibilityControls?.published_at || {}) };
                    const rNum = loggedInMadrasa?.regNumber;
                    if (rNum) {
                      try {
                        const storedAt = localStorage.getItem(`milad_published_at_${rNum}`);
                        if (storedAt) pubTimes = { ...JSON.parse(storedAt), ...pubTimes };
                      } catch(e) {}
                    }

                    // Count total winners for filter pills
                    let totalWinnersCount = 0;
                    let firstCount = 0;
                    let secondCount = 0;
                    let thirdCount = 0;

                    displayHistoryResults.forEach(r => {
                      const p = String(r.place || '').trim().toLowerCase();
                      if (p === 'first' || p === '1' || p === '1st') {
                        firstCount++;
                        totalWinnersCount++;
                      } else if (p === 'second' || p === '2' || p === '2nd') {
                        secondCount++;
                        totalWinnersCount++;
                      } else if (p === 'third' || p === '3' || p === '3rd') {
                        thirdCount++;
                        totalWinnersCount++;
                      } else if (p && p !== '-' && p !== 'no place') {
                        totalWinnersCount++;
                      }

                      const pKey = String(r.progid || r.progId || r.progname || '').trim();
                      const progObj = programs.find(p => String(p.id) === pKey || String(p.code) === pKey || String(p.name).toLowerCase() === pKey.toLowerCase());
                      const canonicalProgKey = progObj ? String(progObj.id) : pKey;
                      const catObj = categories.find(c => (progObj && String(c.id) === String(progObj.catid || progObj.categoryid || '')) || String(c.id) === String(r.catid || r.catId || '') || String(c.name).toLowerCase() === String(r.catname || r.catName || '').toLowerCase());
                      const catName = r.catname || r.catName || (catObj ? catObj.name : '');

                      if (!groupMap.has(canonicalProgKey)) {
                        const lookupKeys = [
                          canonicalProgKey,
                          pKey,
                          progObj?.id ? String(progObj.id) : null,
                          progObj?.code ? String(progObj.code) : null,
                          progObj?.name ? String(progObj.name).toLowerCase() : null
                        ].filter(Boolean);

                        let pubIndex = 999999;
                        if (Array.isArray(publishedPrograms)) {
                          for (const k of lookupKeys) {
                            const idx = publishedPrograms.findIndex(pid => String(pid).trim().toLowerCase() === String(k).trim().toLowerCase());
                            if (idx !== -1 && idx < pubIndex) pubIndex = idx;
                          }
                        }

                        let pubTime = 0;
                        for (const k of lookupKeys) {
                          if (pubTimes[k] && Number(pubTimes[k]) > pubTime) {
                            pubTime = Number(pubTimes[k]);
                          }
                        }

                        groupMap.set(canonicalProgKey, {
                          groupKey: canonicalProgKey,
                          progId: canonicalProgKey,
                          progObj,
                          catObj,
                          progName: r.progname || r.progName || (progObj ? progObj.name : canonicalProgKey),
                          progType: r.progtype || r.progType || (progObj ? progObj.type : ''),
                          catName: catName || (catObj ? catObj.name : ''),
                          pubIndex,
                          pubTime,
                          latestTime: 0,
                          maxResultId: 0,
                          maxListIndex: -1,
                          rows: []
                        });
                      }
                      const group = groupMap.get(canonicalProgKey);
                      const createdTime = new Date(r.created_at || r.createdAt || r.inserted_at || r.savedAt || 0).getTime();
                      if (!isNaN(createdTime) && createdTime > group.latestTime) group.latestTime = createdTime;
                      const numId = Number(r.id);
                      if (!isNaN(numId) && numId > 1000000000 && numId > group.latestTime) group.latestTime = numId;
                      if (!isNaN(numId) && numId > group.maxResultId) group.maxResultId = numId;
                      const listIdx = resultsList.indexOf(r);
                      if (listIdx > group.maxListIndex) group.maxListIndex = listIdx;

                      group.rows.push(r);
                    });

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
                        const visibleRows = group.rows.filter(r => matchesPlaceFilter(r.place));
                        if (visibleRows.length === 0) return;
                        printedProgCount++;

                        visibleRows.forEach(r => {
                          printedRowCount++;
                          const sName = r.studentname || r.studentName || '';
                          const dashIdx = sName.indexOf(' - ');
                          const regPart = dashIdx !== -1 ? sName.substring(0, dashIdx) : '';
                          const namePart = dashIdx !== -1 ? sName.substring(dashIdx + 3) : sName;

                          const student = students.find(s => String(s.regno || s.regNo || '') === String(regPart));
                          const hasPhoto = student && student.photo_url && student.photo_status && student.photo_status !== 'none';
                          const photoHtml = hasPhoto
                            ? `<img src="${student.photo_url}" style="width:30px;height:30px;border-radius:4px;object-fit:cover;display:block;margin:0 auto;" />`
                            : `<span style="font-size:16px;">${(r.studentgender || r.studentGender) === 'BOY' ? '👦' : '👧'}</span>`;

                          const placeLabel = r.place === 'First' || r.place === '1' ? 'First' : r.place === 'Second' || r.place === '2' ? 'Second' : r.place === 'Third' || r.place === '3' ? 'Third' : r.place || '-';
                          const gradeLabel = (r.grade === '-' || r.grade === 'No' || !r.grade) ? '-' : r.grade;
                          allRows += `<tr>
                            <td>${group.progName}</td>
                            <td>${String(group.progType).includes('GROUP') ? 'GROUP' : 'SINGLE'}</td>
                            <td>${group.catName}</td>
                            <td>${photoHtml}</td>
                            <td>${regPart}</td>
                            <td>${namePart}</td>
                            <td>${(r.studentgender || r.studentGender) === 'BOY' ? 'Boy' : 'Girl'}</td>
                            <td>${r.teamname || r.teamName}</td>
                            <td>${placeLabel}</td>
                            <td>${gradeLabel}</td>
                            <td>${r.points}</td>
                          </tr>`;
                        });
                      });

                      const filterTitleSuffix = resultsHistoryPlaceFilter === 'FIRST'
                        ? ' - 1st Place Winners'
                        : resultsHistoryPlaceFilter === 'SECOND'
                        ? ' - 2nd Place Winners'
                        : resultsHistoryPlaceFilter === 'THIRD'
                        ? ' - 3rd Place Winners'
                        : ' - All Winners';

                      const html = `
                    <html><head><title>Results History${filterTitleSuffix}</title>
                    <style>body{font-family:Arial,sans-serif;padding:20px;background:#fff} h1{color:#1e1b4b;text-align:center;} .sub{text-align:center;color:#64748b;font-size:13px;margin-top:4px;margin-bottom:16px} table{width:100%;border-collapse:collapse;margin-top:10px} th{background:#1e1b4b;color:white;padding:10px} td{padding:8px;border:1px solid #e2e8f0;text-align:center;font-size:14px;}</style></head>
                    <body>
                    <h1>🏆 Results History${filterTitleSuffix}</h1>
                    <div class="sub">Total: ${printedRowCount} winners across ${printedProgCount} programs</div>
                    <table><thead><tr><th>Program</th><th>Type</th><th>Category</th><th>Photo</th><th>Reg No</th><th>Student</th><th>Gender</th><th>Team</th><th>Place</th><th>Grade</th><th>Points</th></tr></thead><tbody>${allRows}</tbody></table>
                    </body></html>
                  `;
                      printHtml(html);
                    };

                    const matchingSections = sortedProgramSections.filter(group => {
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '12px', marginBottom: '12px' }}>
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

                        {/* 🏅 Place Filter Buttons: All, 1st, 2nd, 3rd (English Labels) */}
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          background: '#f8fafc',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1.5px solid #e2e8f0',
                          marginBottom: '18px'
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569', marginRight: '4px' }}>
                            🏆 {lang === 'EN' ? 'Filter Place:' : 'വിഭാഗം:'}
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
                                  padding: '6px 14px',
                                  borderRadius: '20px',
                                  border: isAct ? '2px solid #059669' : '1.5px solid #cbd5e1',
                                  background: isAct ? 'linear-gradient(135deg, #059669, #047857)' : '#ffffff',
                                  color: isAct ? '#ffffff' : '#334155',
                                  fontWeight: '800',
                                  fontSize: '12.5px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: isAct ? '0 3px 10px rgba(5,150,105,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span>{f.icon}</span>
                                <span>{f.label}</span>
                                <span style={{
                                  background: isAct ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                                  color: isAct ? '#ffffff' : '#64748b',
                                  padding: '1px 7px',
                                  borderRadius: '10px',
                                  fontSize: '11px',
                                  fontWeight: '800'
                                }}>
                                  {f.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* ── Program Sections ── */}
                        {matchingSections.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '12px', border: '1.5px solid #e2e8f0', color: '#64748b', fontStyle: 'italic' }}>
                            {lang === 'EN' ? 'No results found matching the selected filter.' : 'തിരഞ്ഞെടുത്ത ഫിൽട്ടറിന് അനുയോജ്യമായ ഫലങ്ങൾ ഒന്നും കണ്ടെത്തിയില്ല.'}
                          </div>
                        ) : (
                          matchingSections.map(group => {
                            const visibleRows = group.rows.filter(r => matchesPlaceFilter(r.place));
                            if (visibleRows.length === 0) return null;

                            return (
                              <div
                                key={group.groupKey}
                                style={{
                                  background: '#ffffff',
                                  borderRadius: '14px',
                                  border: '1.5px solid #e2e8f0',
                                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                                  marginBottom: '18px',
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
                                        <span style={{ background: String(group.progType).includes('GROUP') ? '#fee2e2' : '#dcfce7', color: String(group.progType).includes('GROUP') ? '#991b1b' : '#166534', padding: '1px 8px', borderRadius: '4px', fontWeight: '800' }}>
                                          {String(group.progType).includes('GROUP') ? 'GROUP' : 'SINGLE'}
                                        </span>
                                        <span style={{ color: '#64748b', fontWeight: '700' }}>
                                          ({visibleRows.length} {lang === 'EN' ? 'entries' : 'വിജയികൾ'})
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
                                        <th style={{ width: '110px', textAlign: 'center' }}>Place</th>
                                        <th style={{ width: '50px', textAlign: 'center' }}>Photo</th>
                                        <th>Register Number</th>
                                        <th>Student</th>
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
                                        return (
                                          <tr key={r.id}>
                                            <td style={{ textAlign: 'center' }}>
                                              <span style={{
                                                background: placeLabel === 'First' ? '#fbbf24' : placeLabel === 'Second' ? '#94a3b8' : placeLabel === 'Third' ? '#f97316' : '#e2e8f0',
                                                color: placeLabel === 'First' ? '#78350f' : placeLabel === 'Second' ? '#1e293b' : placeLabel === 'Third' ? '#7c2d12' : '#475569',
                                                padding: '3px 10px',
                                                borderRadius: '12px',
                                                fontWeight: '800',
                                                fontSize: '12px',
                                                display: 'inline-block'
                                              }}>
                                                {placeLabel === 'First' ? '🥇 1st Place' : placeLabel === 'Second' ? '🥈 2nd Place' : placeLabel === 'Third' ? '🥉 3rd Place' : placeLabel}
                                              </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{renderTablePhoto(regPart, r.studentgender || r.studentGender)}</td>
                                            <td><b style={{ color: '#1e40af' }}>{regPart}</b></td>
                                            <td><b>{namePart}</b></td>
                                            <td>{(r.studentgender || r.studentGender) === 'BOY' ? 'Boy 👦' : 'Girl 👧'}</td>
                                            <td><b>{r.teamname || r.teamName}</b></td>
                                            <td style={{ textAlign: 'center' }}>
                                              <span style={{ fontWeight: '800', color: gradeLabel === 'A' ? '#059669' : gradeLabel === 'B' ? '#2563eb' : gradeLabel === 'C' ? '#7c3aed' : '#94a3b8' }}>
                                                {gradeLabel}
                                              </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}><b style={{ color: '#0f766e' }}>{r.points} Pts</b></td>
                                            
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
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })
                        )}

                        <button onClick={printResultsHistory} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>
                          📄 Download PDF / Print
                        </button>
                      </div>
                    );
                  })()"""

code = code[:idx_start2] + replacement2 + code[idx_end2 + len(target2_end):]
print("Step 2 (Results History section) updated.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: All steps applied to App.js!")

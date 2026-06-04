import sys

with open('App.js', 'r', encoding='utf-8', errors='surrogateescape') as f:
    content = f.read()

# ===== CHANGE 1: Add new state variables after existing state declarations =====
old_state = """  const [settingsSubTab, setSettingsSubTab] = useState('TEAMS');"""
new_state = """  const [settingsSubTab, setSettingsSubTab] = useState('TEAMS');

  // Filter states for Results tab
  const [filterCat, setFilterCat] = useState('');
  const [filterProg, setFilterProg] = useState('');
  const [filterGender, setFilterGender] = useState('ALL');
  const [selectedResultGender, setSelectedResultGender] = useState('ALL');

  // Student search by reg number
  const [searchRegNo, setSearchRegNo] = useState('');"""

content = content.replace(old_state, new_state)

# ===== CHANGE 2: Replace the entire RECENT tab with the new enhanced version =====
old_recent_tab = """          {/* ---------------- \U0001f3af TAB 2: RECENT RESULTS ---------------- */}
          {activeTab === 'RECENT' && (
            <div className="card animate-tab">
              <h2>\U0001f4dc \u0d2a\u0d4d\u0d30\u0d16\u0d4d\u0d2f\u0d3e\u0d2a\u0d3f\u0d1a\u0d4d\u0d1a \u0d2b\u0d32\u0d19\u0d4d\u0d19\u0d7e (Results History)</h2>
              <div className="table-responsive-wrapper" style={{ marginTop: '15px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>\u0d2e\u0d24\u0d4d\u0d38\u0d30\u0d02</th><th>\u0d07\u0d28\u0d02</th><th>\u0d15\u0d3e\u0d31\u0d4d\u0d31\u0d17\u0d31\u0d3f</th><th>\u0d35\u0d3f\u0d26\u0d4d\u0d2f\u0d3e\u0d7c\u0d24\u0d4d\u0d25\u0d3f</th><th>\u0d32\u0d3f\u0d02\u0d17\u0d2d\u0d47\u0d26\u0d02</th><th>\u0d1f\u0d40\u0d02</th><th>\u0d38\u0d4d\u0d25\u0d3e\u0d28\u0d02</th><th>\u0d17\u0d4d\u0d30\u0d47\u0d21\u0d4d</th><th>\u0d2a\u0d4b\u0d2f\u0d3f\u0d28\u0d4d\u0d31\u0d4d</th>{loginRole === 'ADMIN' && <th>\u0d12\u0d34\u0d3f\u0d35\u0d3e\u0d15\u0d4d\u0d15\u0d41\u0d15</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {resultsList.length === 0 ? <tr><td colSpan="10">\u0d2b\u0d32\u0d19\u0d4d\u0d19\u0d7e \u0d12\u0d28\u0d4d\u0d28\u0d41\u0d02 \u0d07\u0d24\u0d41\u0d35\u0d30\u0d46 \u0d2a\u0d4d\u0d30\u0d16\u0d4d\u0d2f\u0d3e\u0d2a\u0d3f\u0d1a\u0d4d\u0d1a\u0d3f\u0d1f\u0d4d\u0d1f\u0d3f\u0d32\u0d4d\u0d32.</td></tr> :
                      resultsList.map(r => (
                        <tr key={r.id}>
                          <td>{r.progname || r.progName}</td>
                          <td><span style={{ background: (r.progtype || r.progType) === 'GROUP' ? '#ef4444' : '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{r.progtype || r.progType}</span></td>
                          <td>{r.catname || r.catName}</td>
                          <td>{r.studentname || r.studentName}</td>
                          <td>{(r.studentgender || r.studentGender) === 'BOY' ? 'Boy \U0001f466' : 'Girl \U0001f467'}</td>
                          <td><b>{r.teamname || r.teamName}</b></td>
                          <td>{r.place}</td>
                          <td>{r.grade}</td>
                          <td><b style={{ color: '#0f766e' }}>{r.points} Pts</b></td>
                          {loginRole === 'ADMIN' && <td><button onClick={() => handleDeleteResult(r.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button></td>}
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}"""

new_recent_tab = """          {/* ---------------- \U0001f3af TAB 2: RECENT RESULTS + PROGRAM WINNERS + STUDENT SEARCH ---------------- */}
          {activeTab === 'RECENT' && (
            <div className="animate-tab">

              {/* \u2500\u2500 Section 1: Program Winners Viewer \u2500\u2500 */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <h2>\U0001f3c6 \u0d2a\u0d4d\u0d30\u0d4b\u0d17\u0d4d\u0d30\u0d3e\u0d02 \u0d35\u0d3f\u0d1c\u0d2f\u0d3f\u0d15\u0d7e (Program Winners)</h2>

                {/* Filter Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                  {/* Category Filter */}
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '4px' }}>\u0d15\u0d3e\u0d31\u0d4d\u0d31\u0d17\u0d31\u0d3f</label>
                    <select className="settings-input" value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setFilterProg(''); }}>
                      <option value="">-- \u0d24\u0d3f\u0d30\u0d1e\u0d4d\u0d1e\u0d46\u0d1f\u0d41\u0d15\u0d4d\u0d15\u0d41\u0d15 --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Program Filter */}
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '4px' }}>\u0d2a\u0d4d\u0d30\u0d4b\u0d17\u0d4d\u0d30\u0d3e\u0d02</label>
                    <select className="settings-input" value={filterProg} onChange={(e) => setFilterProg(e.target.value)} disabled={!filterCat}>
                      <option value="">-- \u0d24\u0d3f\u0d30\u0d1e\u0d4d\u0d1e\u0d46\u0d1f\u0d41\u0d15\u0d4d\u0d15\u0d41\u0d15 --</option>
                      {programs.filter(p => String(p.catid || p.catId || '') === String(filterCat)).map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                    </select>
                  </div>

                  {/* Gender Filter */}
                  <div style={{ flex: '1 1 150px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', display: 'block', marginBottom: '4px' }}>\u0d32\u0d3f\u0d02\u0d17\u0d2d\u0d47\u0d26\u0d02</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['ALL', 'BOY', 'GIRL'].map(g => (
                        <button key={g} type="button" onClick={() => setFilterGender(g)}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: '8px', border: '2px solid', fontWeight: '700', cursor: 'pointer', fontSize: '11px',
                            background: filterGender === g ? (g === 'BOY' ? '#3b82f6' : g === 'GIRL' ? '#ec4899' : '#7c3aed') : '#f8fafc',
                            color: filterGender === g ? 'white' : '#475569',
                            borderColor: filterGender === g ? 'transparent' : '#e2e8f0' }}>
                          {g === 'ALL' ? '\U0001f465 All' : g === 'BOY' ? '\U0001f466 Boys' : '\U0001f467 Girls'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Winners Display */}
                {filterProg && (() => {
                  const progObj = programs.find(p => String(p.id) === String(filterProg));
                  const progResults = resultsList.filter(r => {
                    const matchProg = String(r.progid) === String(filterProg);
                    const matchGender = filterGender === 'ALL' || (r.studentgender || r.studentGender) === filterGender;
                    return matchProg && matchGender;
                  });
                  const firstResults = progResults.filter(r => r.place === 'First');
                  const secondResults = progResults.filter(r => r.place === 'Second');
                  const thirdResults = progResults.filter(r => r.place === 'Third');

                  const renderWinnerCard = (result, gradient, medal, borderColor) => {
                    const sName = result.studentname || result.studentName || '';
                    const dashIdx = sName.indexOf(' - ');
                    const regPart = dashIdx !== -1 ? sName.substring(0, dashIdx) : '';
                    const namePart = dashIdx !== -1 ? sName.substring(dashIdx + 3) : sName;
                    return (
                      <div key={result.id} style={{ background: gradient, borderRadius: '18px', padding: '20px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: `3px solid ${borderColor}`, animation: 'fadeInTab 0.5s ease' }}>
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '70px', opacity: 0.15 }}>{medal}</div>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{medal}</div>
                        <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, marginBottom: '6px' }}>{result.place}</div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '4px 10px', display: 'inline-block', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>#{regPart}</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '4px', lineHeight: 1.3 }}>{namePart}</div>
                        <div style={{ fontSize: '12px', opacity: 0.85 }}>\u0d1f\u0d40\u0d02: <b>{result.teamname || result.teamName || '-'}</b></div>
                        <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{(result.studentgender || result.studentGender) === 'BOY' ? '\U0001f466 Boy' : '\U0001f467 Girl'}</div>
                      </div>
                    );
                  };

                  return (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                        <span style={{ background: 'linear-gradient(135deg, #1e1b4b, #3730a3)', color: 'white', padding: '8px 20px', borderRadius: '20px', fontWeight: '800', fontSize: '14px' }}>\U0001f3c6 {progObj?.name || ''}</span>
                      </div>
                      {progResults.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: '20px' }}>\u0d08 \u0d2a\u0d4d\u0d30\u0d4b\u0d17\u0d4d\u0d30\u0d3e\u0d2e\u0d3f\u0d7d \u0d2b\u0d32\u0d19\u0d4d\u0d19\u0d7e \u0d07\u0d32\u0d4d\u0d32.</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                          {firstResults.map(r => renderWinnerCard(r, 'linear-gradient(135deg, #f59e0b, #d97706)', '\U0001f947', '#fbbf24'))}
                          {secondResults.map(r => renderWinnerCard(r, 'linear-gradient(135deg, #94a3b8, #64748b)', '\U0001f948', '#cbd5e1'))}
                          {thirdResults.map(r => renderWinnerCard(r, 'linear-gradient(135deg, #f97316, #c2410c)', '\U0001f949', '#fb923c'))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* \u2500\u2500 Section 2: Student Search by Register Number \u2500\u2500 */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <h2>\U0001f50d \u0d35\u0d3f\u0d26\u0d4d\u0d2f\u0d3e\u0d7c\u0d24\u0d4d\u0d25\u0d3f \u0d31\u0d3f\u0d2a\u0d4d\u0d2a\u0d4b\u0d7c\u0d1f\u0d4d\u0d1f\u0d4d (Student Report)</h2>
                <div style={{ marginTop: '10px' }}>
                  <input type="text" className="settings-input" placeholder="\u0d30\u0d1c\u0d3f\u0d38\u0d4d\u0d31\u0d4d\u0d31\u0d7c \u0d28\u0d2e\u0d4d\u0d2a\u0d7c \u0d05\u0d1f\u0d3f\u0d15\u0d4d\u0d15\u0d41\u0d15..." value={searchRegNo} onChange={(e) => setSearchRegNo(e.target.value)} style={{ maxWidth: '400px' }} />
                </div>

                {searchRegNo.trim() && (() => {
                  const matchedStudent = students.find(s => String(s.regno || s.regNo || '').toLowerCase() === searchRegNo.trim().toLowerCase());
                  if (!matchedStudent) return <p style={{ color: '#ef4444', marginTop: '15px', fontWeight: '600' }}>\u0d08 \u0d30\u0d1c\u0d3f\u0d38\u0d4d\u0d31\u0d4d\u0d31\u0d7c \u0d28\u0d2e\u0d4d\u0d2a\u0d30\u0d3f\u0d7d \u0d35\u0d3f\u0d26\u0d4d\u0d2f\u0d3e\u0d7c\u0d24\u0d4d\u0d25\u0d3f\u0d2f\u0d46 \u0d15\u0d23\u0d4d\u0d1f\u0d46\u0d24\u0d4d\u0d24\u0d3e\u0d28\u0d3e\u0d2f\u0d3f\u0d32\u0d4d\u0d32.</p>;

                  const sRegNo = matchedStudent.regno || matchedStudent.regNo || '';
                  const teamObj = teams.find(t => String(t.id) === String(matchedStudent.teamid || matchedStudent.teamId || ''));
                  const catObj = categories.find(c => String(c.id) === String(matchedStudent.catid || matchedStudent.catId || ''));
                  const sResults = resultsList.filter(r => {
                    const sName = r.studentname || r.studentName || '';
                    return sName.startsWith(sRegNo + ' - ');
                  });

                  const printReport = () => {
                    const printWindow = window.open('', '_blank');
                    const rows = sResults.map(r => {
                      let placeLabel = r.place || '-';
                      let gradeLabel = (r.grade === '-' || r.grade === 'No' || !r.grade) ? '-' : r.grade;
                      return `<tr><td>${r.progname || r.progName}</td><td>${r.catname || r.catName}</td><td>${placeLabel}</td><td>${gradeLabel}</td><td>${r.points} Pts</td></tr>`;
                    }).join('');
                    printWindow.document.write(`
                    <html><head><title>${matchedStudent.name} - Report</title>
                    <style>body{font-family:Arial,sans-serif;padding:30px;background:#fff} h1{color:#1e1b4b} table{width:100%;border-collapse:collapse;margin-top:20px} th{background:#1e1b4b;color:white;padding:10px} td{padding:10px;border:1px solid #e2e8f0;text-align:center} .header{background:linear-gradient(135deg,#1e1b4b,#3730a3);color:white;padding:30px;border-radius:12px;margin-bottom:20px} .badge{display:inline-block;background:#f59e0b;color:#78350f;padding:4px 12px;border-radius:20px;font-weight:700;font-size:14px;margin-top:8px}</style></head>
                    <body>
                    <div class='header'>
                    <h1>\U0001f3c6 ${matchedStudent.name}</h1>
                    <div class='badge'>Reg No: ${sRegNo}</div>
                    <p style='margin-top:10px;opacity:0.85'>\u0d1f\u0d40\u0d02: ${teamObj?.name || '-'} | \u0d15\u0d3e\u0d31\u0d4d\u0d31\u0d17\u0d31\u0d3f: ${catObj?.name || '-'} | ${matchedStudent.gender === 'BOY' ? 'Boy \U0001f466' : 'Girl \U0001f467'}</p>
                    </div>
                    <table><thead><tr><th>\u0d2e\u0d24\u0d4d\u0d38\u0d30\u0d02</th><th>\u0d15\u0d3e\u0d31\u0d4d\u0d31\u0d17\u0d31\u0d3f</th><th>\u0d38\u0d4d\u0d25\u0d3e\u0d28\u0d02</th><th>\u0d17\u0d4d\u0d30\u0d47\u0d21\u0d4d</th><th>\u0d2a\u0d4b\u0d2f\u0d3f\u0d28\u0d4d\u0d31\u0d4d</th></tr></thead><tbody>${rows}</tbody></table>
                    <p style='margin-top:20px;color:#64748b;font-size:13px'>\u0d06\u0d15\u0d46 \u0d2a\u0d4b\u0d2f\u0d3f\u0d28\u0d4d\u0d31\u0d4d: <b>${sResults.reduce((s, r) => s + r.points, 0)}</b></p>
                    </body></html>`);
                    printWindow.document.close();
                    printWindow.print();
                  };

                  return (
                    <div style={{ marginTop: '20px' }}>
                      {/* Student Info Card */}
                      <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #3730a3)', borderRadius: '20px', padding: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '100px', opacity: 0.08 }}>\U0001f3c6</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '2px' }}>\u0d35\u0d3f\u0d26\u0d4d\u0d2f\u0d3e\u0d7c\u0d24\u0d4d\u0d25\u0d3f \u0d31\u0d3f\u0d2a\u0d4d\u0d2a\u0d4b\u0d7c\u0d1f\u0d4d\u0d1f\u0d4d</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', marginTop: '8px' }}>{matchedStudent.name}</div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Reg: {sRegNo}</span>
                          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>\u0d1f\u0d40\u0d02: {teamObj?.name || '-'}</span>
                          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{catObj?.name || '-'}</span>
                          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{matchedStudent.gender === 'BOY' ? '\U0001f466 Boy' : '\U0001f467 Girl'}</span>
                        </div>
                        <div style={{ fontSize: '36px', fontWeight: '900', color: '#fbbf24', marginTop: '12px' }}>{sResults.reduce((s, r) => s + r.points, 0)} <span style={{ fontSize: '16px', color: '#94a3b8' }}>Total Points</span></div>
                      </div>

                      {/* Results */}
                      {sResults.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: '20px' }}>\u0d2b\u0d32\u0d19\u0d4d\u0d19\u0d7e \u0d12\u0d28\u0d4d\u0d28\u0d41\u0d02 \u0d07\u0d32\u0d4d\u0d32.</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '15px' }}>
                          {sResults.map((r, idx) => {
                            const medal = r.place === 'First' ? '\U0001f947' : r.place === 'Second' ? '\U0001f948' : r.place === 'Third' ? '\U0001f949' : '\U0001f3c5';
                            const bg = r.place === 'First' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : r.place === 'Second' ? 'linear-gradient(135deg, #94a3b8, #64748b)' : r.place === 'Third' ? 'linear-gradient(135deg, #f97316, #c2410c)' : 'linear-gradient(135deg, #6366f1, #4f46e5)';
                            return (
                              <div key={idx} style={{ background: bg, borderRadius: '14px', padding: '16px', color: 'white', boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}>
                                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{medal}</div>
                                <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>{r.progname || r.progName}</div>
                                <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px' }}>{r.catname || r.catName}</div>
                                <div style={{ fontSize: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '3px 8px', display: 'inline-block', fontWeight: '700' }}>{r.place} | {(r.grade === '-' || r.grade === 'No') ? 'No Grade' : r.grade} | {r.points} Pts</div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Download Button */}
                      <button onClick={printReport} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#78350f', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>
                        \U0001f4e5 \u0d31\u0d3f\u0d2a\u0d4d\u0d2a\u0d4b\u0d7c\u0d1f\u0d4d\u0d1f\u0d4d \u0d21\u0d57\u0d7a\u0d32\u0d4b\u0d21\u0d4d / \u0d2a\u0d4d\u0d30\u0d3f\u0d28\u0d4d\u0d31\u0d4d\u0d1f\u0d4d \u0d1a\u0d46\u0d2f\u0d4d\u0d2f\u0d41\u0d15
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* \u2500\u2500 Section 3: Results History Table \u2500\u2500 */}
              <div className="card">
                <h2>\U0001f4dc \u0d2a\u0d4d\u0d30\u0d16\u0d4d\u0d2f\u0d3e\u0d2a\u0d3f\u0d1a\u0d4d\u0d1a \u0d2b\u0d32\u0d19\u0d4d\u0d19\u0d7e (Results History)</h2>
                <div className="table-responsive-wrapper" style={{ marginTop: '15px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>\u0d2e\u0d24\u0d4d\u0d38\u0d30\u0d02</th><th>\u0d07\u0d28\u0d02</th><th>\u0d15\u0d3e\u0d31\u0d4d\u0d31\u0d17\u0d31\u0d3f</th><th>\u0d30\u0d1c\u0d3f\u0d38\u0d4d\u0d31\u0d4d\u0d31\u0d7c \u0d28\u0d2e\u0d4d\u0d2a\u0d7c</th><th>\u0d35\u0d3f\u0d26\u0d4d\u0d2f\u0d3e\u0d7c\u0d24\u0d4d\u0d25\u0d3f</th><th>\u0d32\u0d3f\u0d02\u0d17\u0d2d\u0d47\u0d26\u0d02</th><th>\u0d1f\u0d40\u0d02</th><th>\u0d38\u0d4d\u0d25\u0d3e\u0d28\u0d02</th><th>\u0d17\u0d4d\u0d30\u0d47\u0d21\u0d4d</th><th>\u0d2a\u0d4b\u0d2f\u0d3f\u0d28\u0d4d\u0d31\u0d4d</th>{loginRole === 'ADMIN' && <th>\u0d12\u0d34\u0d3f\u0d35\u0d3e\u0d15\u0d4d\u0d15\u0d41\u0d15</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {resultsList.length === 0 ? <tr><td colSpan="11">\u0d2b\u0d32\u0d19\u0d4d\u0d19\u0d7e \u0d12\u0d28\u0d4d\u0d28\u0d41\u0d02 \u0d07\u0d24\u0d41\u0d35\u0d30\u0d46 \u0d2a\u0d4d\u0d30\u0d16\u0d4d\u0d2f\u0d3e\u0d2a\u0d3f\u0d1a\u0d4d\u0d1a\u0d3f\u0d1f\u0d4d\u0d1f\u0d3f\u0d32\u0d4d\u0d32.</td></tr> :
                        resultsList.map(r => {
                          const sName = r.studentname || r.studentName || '';
                          const dashIdx = sName.indexOf(' - ');
                          const regPart = dashIdx !== -1 ? sName.substring(0, dashIdx) : '';
                          const namePart = dashIdx !== -1 ? sName.substring(dashIdx + 3) : sName;
                          const placeLabel = r.place === 'First' || r.place === '1' ? 'First' : r.place === 'Second' || r.place === '2' ? 'Second' : r.place === 'Third' || r.place === '3' ? 'Third' : r.place || '-';
                          const gradeLabel = (r.grade === '-' || r.grade === 'No' || !r.grade) ? '-' : r.grade;
                          return (
                            <tr key={r.id}>
                              <td>{r.progname || r.progName}</td>
                              <td><span style={{ background: (r.progtype || r.progType) === 'GROUP' ? '#ef4444' : '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{r.progtype || r.progType}</span></td>
                              <td>{r.catname || r.catName}</td>
                              <td><b style={{ color: '#1e40af' }}>{regPart}</b></td>
                              <td>{namePart}</td>
                              <td>{(r.studentgender || r.studentGender) === 'BOY' ? 'Boy \U0001f466' : 'Girl \U0001f467'}</td>
                              <td><b>{r.teamname || r.teamName}</b></td>
                              <td><span style={{ background: placeLabel === 'First' ? '#fbbf24' : placeLabel === 'Second' ? '#94a3b8' : placeLabel === 'Third' ? '#f97316' : '#e2e8f0', color: placeLabel === 'First' ? '#78350f' : placeLabel === 'Second' ? '#1e293b' : placeLabel === 'Third' ? '#7c2d12' : '#475569', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', fontSize: '12px' }}>{placeLabel}</span></td>
                              <td><span style={{ fontWeight: '700', color: gradeLabel === 'A' ? '#059669' : gradeLabel === 'B' ? '#2563eb' : gradeLabel === 'C' ? '#7c3aed' : '#94a3b8' }}>{gradeLabel}</span></td>
                              <td><b style={{ color: '#0f766e' }}>{r.points} Pts</b></td>
                              {loginRole === 'ADMIN' && <td><button onClick={() => handleDeleteResult(r.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button></td>}
                            </tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}"""

content = content.replace(old_recent_tab, new_recent_tab)

# ===== CHANGE 3: Viewers see blank in Settings tab =====
old_viewer_msg = """              {loginRole !== 'ADMIN' ? (
                <p style={{ color: 'red', marginTop: '15px', fontWeight: 'bold' }}>\u26a0\ufe0f \u0d28\u0d3f\u0d19\u0d4d\u0d19\u0d7e\u0d15\u0d4d\u0d15\u0d4d \u0d08 \u0d38\u0d46\u0d15\u0d4d\u0d37\u0d7b \u0d2e\u0d3e\u0d31\u0d4d\u0d31\u0d3e\u0d7b \u0d05\u0d28\u0d41\u0d35\u0d3e\u0d26\u0d2e\u0d3f\u0d32\u0d4d\u0d32! \u0d05\u0d21\u0d4d\u0d2e\u0d3f\u0d7b \u0d05\u0d15\u0d4d\u0d15\u0d57\u0d23\u0d4d\u0d1f\u0d3f\u0d7d \u0d32\u0d4b\u0d17\u0d3f\u0d7b \u0d1a\u0d46\u0d2f\u0d4d\u0d2f\u0d41\u0d15.</p>"""

new_viewer_msg = """              {loginRole !== 'ADMIN' ? (
                <div style={{ minHeight: '200px' }}></div>"""

content = content.replace(old_viewer_msg, new_viewer_msg)

with open('App.js', 'w', encoding='utf-8', errors='surrogateescape') as f:
    f.write(content)

print('All changes applied successfully!')

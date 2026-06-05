import sys

with open('App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Change 1: Add progGender state
old_prog_state = "  const [progType, setProgType] = useState('SINGLE');"
new_prog_state = "  const [progType, setProgType] = useState('SINGLE');\n  const [progGender, setProgGender] = useState('COMMON');"
content = content.replace(old_prog_state, new_prog_state)

# Change 2: Add Program tempProg insert
old_prog_insert = "const tempProg = { id: tempId, name: newProgName, code: newProgCode, catid: selectedProgCat, type: progType, madrasa_id: loggedInMadrasa.regNumber };"
new_prog_insert = "const tempProg = { id: tempId, name: newProgName, code: newProgCode, catid: selectedProgCat, type: `${progType}_${progGender}`, madrasa_id: loggedInMadrasa.regNumber };"
content = content.replace(old_prog_insert, new_prog_insert)

old_prog_insert2 = "name: savedName, code: savedCode, catid: selectedProgCat, type: progType, madrasa_id: loggedInMadrasa.regNumber"
new_prog_insert2 = "name: savedName, code: savedCode, catid: selectedProgCat, type: `${progType}_${progGender}`, madrasa_id: loggedInMadrasa.regNumber"
content = content.replace(old_prog_insert2, new_prog_insert2)

# Change 3: Mark Entry Cat & Gender
old_mark_entry_cat = """                            {/* Step 1: Category */}
                            <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                              <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '6px' }}>① കാറ്റഗറി തിരഞ്ഞെടുക്കുക</label>
                              <select className="settings-input" value={selectedResultCat} onChange={(e) => {
                                setSelectedResultCat(e.target.value);
                                setSelectedResultProg('');
                                setSelectedResultStudent('');
                              }} required>
                                <option value="">-- കാറ്റഗറി തിരഞ്ഞെടുക്കുക --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}{c.classrange ? ` (${c.classrange})` : ''}</option>)}
                              </select>
                            </div>"""

new_mark_entry_cat = """                            {/* Step 1: Category & Gender */}
                            <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                              <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '6px' }}>① കാറ്റഗറി & വിഭാഗം തിരഞ്ഞെടുക്കുക</label>
                              <select className="settings-input" value={selectedResultCat && selectedResultGender && selectedResultGender !== 'ALL' ? `${selectedResultCat}_${selectedResultGender}` : ''} onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                  setSelectedResultCat('');
                                  setSelectedResultGender('ALL');
                                } else {
                                  const [cId, g] = val.split('_');
                                  setSelectedResultCat(cId);
                                  setSelectedResultGender(g);
                                }
                                setSelectedResultProg('');
                                setSelectedResultStudent('');
                              }} required>
                                <option value="">-- കാറ്റഗറി & വിഭാഗം --</option>
                                {categories.map(c => (
                                  <React.Fragment key={c.id}>
                                    <option value={`${c.id}_BOY`}>{c.name} - ആൺകുട്ടികൾ (Boys)</option>
                                    <option value={`${c.id}_GIRL`}>{c.name} - പെൺകുട്ടികൾ (Girls)</option>
                                  </React.Fragment>
                                ))}
                              </select>
                            </div>"""
content = content.replace(old_mark_entry_cat, new_mark_entry_cat)

# Change 4: Mark Entry Program
old_mark_entry_prog = """                            {/* Step 2: Program (filtered by category) */}
                            <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                              <label style={{ fontSize: '12px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '6px' }}>② മത്സരം തിരഞ്ഞെടുക്കുക</label>
                              <select className="settings-input" value={selectedResultProg} onChange={(e) => {
                                setSelectedResultProg(e.target.value);
                                setSelectedResultStudent('');
                              }} required disabled={!selectedResultCat}>
                                <option value="">{selectedResultCat ? '-- മത്സരം തിരഞ്ഞെടുക്കുക --' : 'ആദ്യം കാറ്റഗറി തിരഞ്ഞെടുക്കുക'}</option>
                                {programs
                                  .filter(p => String(p.catid || p.catId || '') === String(selectedResultCat))
                                  .map(p => <option key={p.id} value={p.id}>{p.code} - {p.name} ({p.type === 'GROUP' ? 'Group 👥' : 'Single 👤'})</option>)
                                }
                              </select>
                            </div>"""

new_mark_entry_prog = """                            {/* Step 2: Program (filtered by category and gender) */}
                            <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                              <label style={{ fontSize: '12px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '6px' }}>② മത്സരം തിരഞ്ഞെടുക്കുക</label>
                              <select className="settings-input" value={selectedResultProg} onChange={(e) => {
                                setSelectedResultProg(e.target.value);
                                setSelectedResultStudent('');
                              }} required disabled={!selectedResultCat}>
                                <option value="">{selectedResultCat ? '-- മത്സരം തിരഞ്ഞെടുക്കുക --' : 'ആദ്യം കാറ്റഗറി തിരഞ്ഞെടുക്കുക'}</option>
                                {programs
                                  .filter(p => {
                                     if (String(p.catid || p.catId || '') !== String(selectedResultCat)) return false;
                                     if (!p.type || !p.type.includes('_')) return true;
                                     if (p.type.includes('COMMON')) return true;
                                     if (selectedResultGender !== 'ALL' && !p.type.includes(selectedResultGender)) return false;
                                     return true;
                                  })
                                  .map(p => {
                                    const pTypeBase = (p.type || '').includes('GROUP') ? 'Group 👥' : 'Single 👤';
                                    const pGender = (p.type || '').includes('BOY') ? '👦' : (p.type || '').includes('GIRL') ? '👧' : '🚻';
                                    return <option key={p.id} value={p.id}>{p.code} - {p.name} ({pTypeBase} {pGender})</option>;
                                  })
                                }
                              </select>
                            </div>"""
content = content.replace(old_mark_entry_prog, new_mark_entry_prog)

# Change 5: Mark Entry Student (General Support)
old_mark_entry_student = """                            {/* Step 3: Student (filtered by category) */}
                            <div style={{ background: '#fefce8', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                              <label style={{ fontSize: '12px', fontWeight: '700', color: '#854d0e', display: 'block', marginBottom: '6px' }}>③ വിദ്യാർത്ഥിയെ തിരഞ്ഞെടുക്കുക</label>
                              <select className="settings-input" value={selectedResultStudent} onChange={(e) => setSelectedResultStudent(e.target.value)} required disabled={!selectedResultCat}>
                                <option value="">{selectedResultCat ? '-- വിദ്യാർത്ഥിയെ തിരഞ്ഞെടുക്കുക --' : 'ആദ്യം കാറ്റഗറി തിരഞ്ഞെടുക്കുക'}</option>
                                {students
                                  .filter(s => String(s.catid || s.catId || '') === String(selectedResultCat))
                                  .map(s => {
                                    const sRegNo = s.regno || s.regNo || '';
                                    const sTeamId = s.teamid || s.teamId || '';
                                    const teamName = teams.find(t => String(t.id) === String(sTeamId))?.name || '';
                                    return <option key={s.id} value={s.id}>{sRegNo} - {s.name} ({s.gender === 'BOY' ? 'Boy 👦' : 'Girl 👧'}) [{teamName}]</option>;
                                  })
                                }
                              </select>
                            </div>"""

new_mark_entry_student = """                            {/* Step 3: Student (filtered by category & gender, supporting 'General') */}
                            <div style={{ background: '#fefce8', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                              <label style={{ fontSize: '12px', fontWeight: '700', color: '#854d0e', display: 'block', marginBottom: '6px' }}>③ വിദ്യാർത്ഥിയെ തിരഞ്ഞെടുക്കുക</label>
                              <select className="settings-input" value={selectedResultStudent} onChange={(e) => setSelectedResultStudent(e.target.value)} required disabled={!selectedResultCat}>
                                <option value="">{selectedResultCat ? '-- വിദ്യാർത്ഥിയെ തിരഞ്ഞെടുക്കുക --' : 'ആദ്യം കാറ്റഗറി തിരഞ്ഞെടുക്കുക'}</option>
                                {(() => {
                                  const selectedCatObj = categories.find(c => String(c.id) === String(selectedResultCat));
                                  const isGeneral = selectedCatObj && selectedCatObj.name.toLowerCase().includes('general');
                                  
                                  return students
                                    .filter(s => {
                                      if (selectedResultGender !== 'ALL' && s.gender !== selectedResultGender) return false;
                                      if (isGeneral) return true; // Show all students for General category!
                                      return String(s.catid || s.catId || '') === String(selectedResultCat);
                                    })
                                    .map(s => {
                                      const sRegNo = s.regno || s.regNo || '';
                                      const sTeamId = s.teamid || s.teamId || '';
                                      const teamName = teams.find(t => String(t.id) === String(sTeamId))?.name || '';
                                      const catName = categories.find(c => String(c.id) === String(s.catid || s.catId))?.name || '';
                                      return <option key={s.id} value={s.id}>{sRegNo} - {s.name} ({s.gender === 'BOY' ? '👦' : '👧'}) [{teamName}] {isGeneral ? `(${catName})` : ''}</option>;
                                    });
                                })()}
                              </select>
                            </div>"""
content = content.replace(old_mark_entry_student, new_mark_entry_student)

# Change 6: Add Student Form
old_add_student = """                            <select className="settings-input" value={selectedStudentCat} onChange={(e) => setSelectedStudentCat(e.target.value)} required>
                              <option value="">കാറ്റഗറി തിരഞ്ഞെടുക്കുക</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <select className="settings-input" value={studentGender} onChange={(e) => setStudentGender(e.target.value)}>
                              <option value="BOY">BOY (ആൺകുട്ടി)</option>
                              <option value="GIRL">GIRL (പെൺകുട്ടി)</option>
                            </select>"""

new_add_student = """                            <select className="settings-input" value={selectedStudentCat && studentGender ? `${selectedStudentCat}_${studentGender}` : ''} onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                setSelectedStudentCat('');
                                setStudentGender('BOY');
                              } else {
                                const [cId, g] = val.split('_');
                                setSelectedStudentCat(cId);
                                setStudentGender(g);
                              }
                            }} required>
                              <option value="">കാറ്റഗറി & വിഭാഗം തിരഞ്ഞെടുക്കുക</option>
                              {categories.map(c => (
                                <React.Fragment key={c.id}>
                                  <option value={`${c.id}_BOY`}>{c.name} - ആൺകുട്ടി (Boy)</option>
                                  <option value={`${c.id}_GIRL`}>{c.name} - പെൺകുട്ടി (Girl)</option>
                                </React.Fragment>
                              ))}
                            </select>"""
content = content.replace(old_add_student, new_add_student)

# Change 7: Edit Student Form
old_edit_student = """                                      <select className="settings-input" value={editingStudentData.catid || editingStudentData.catId || ''} onChange={e => setEditingStudentData({ ...editingStudentData, catid: e.target.value, catId: e.target.value })}>
                                        <option value="">കാറ്റഗറി തിരഞ്ഞെടുക്കുക</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                      </select>

                                      <select className="settings-input" value={editingStudentData.gender || ''} onChange={e => setEditingStudentData({ ...editingStudentData, gender: e.target.value })}>
                                        <option value="BOY">BOY</option>
                                        <option value="GIRL">GIRL</option>
                                      </select>"""

new_edit_student = """                                      <select className="settings-input" value={editingStudentData.catid && editingStudentData.gender ? `${editingStudentData.catid || editingStudentData.catId}_${editingStudentData.gender}` : ''} onChange={e => {
                                        const val = e.target.value;
                                        if (val) {
                                          const [cId, g] = val.split('_');
                                          setEditingStudentData({ ...editingStudentData, catid: cId, catId: cId, gender: g });
                                        }
                                      }}>
                                        <option value="">കാറ്റഗറി & വിഭാഗം തിരഞ്ഞെടുക്കുക</option>
                                        {categories.map(c => (
                                          <React.Fragment key={c.id}>
                                            <option value={`${c.id}_BOY`}>{c.name} - ആൺകുട്ടി (Boy)</option>
                                            <option value={`${c.id}_GIRL`}>{c.name} - പെൺകുട്ടി (Girl)</option>
                                          </React.Fragment>
                                        ))}
                                      </select>"""
content = content.replace(old_edit_student, new_edit_student)

# Change 8: Add Program Form
old_add_program = """                            <select className="settings-input" value={selectedProgCat} onChange={(e) => setSelectedProgCat(e.target.value)} required>
                              <option value="">കാറ്റഗറി തിരഞ്ഞെടുക്കുക</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <select className="settings-input" value={progType} onChange={(e) => setProgType(e.target.value)}>
                              <option value="SINGLE">SINGLE (വ്യക്തിഗതം)</option>
                              <option value="GROUP">GROUP (ഗ്രൂപ്പ് ഇനം)</option>
                            </select>"""

new_add_program = """                            <select className="settings-input" value={selectedProgCat && progGender ? `${selectedProgCat}_${progGender}` : ''} onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                const [cId, g] = val.split('_');
                                setSelectedProgCat(cId);
                                setProgGender(g);
                              } else {
                                setSelectedProgCat('');
                              }
                            }} required>
                              <option value="">കാറ്റഗറി & വിഭാഗം തിരഞ്ഞെടുക്കുക</option>
                              {categories.map(c => (
                                <React.Fragment key={c.id}>
                                  <option value={`${c.id}_BOY`}>{c.name} - ആൺകുട്ടികൾ (Boys)</option>
                                  <option value={`${c.id}_GIRL`}>{c.name} - പെൺകുട്ടികൾ (Girls)</option>
                                  <option value={`${c.id}_COMMON`}>{c.name} - പൊതുവായത് (Common)</option>
                                </React.Fragment>
                              ))}
                            </select>

                            <select className="settings-input" value={progType} onChange={(e) => setProgType(e.target.value)}>
                              <option value="SINGLE">SINGLE (വ്യക്തിഗതം)</option>
                              <option value="GROUP">GROUP (ഗ്രൂപ്പ് ഇനം)</option>
                            </select>"""
content = content.replace(old_add_program, new_add_program)

# Change 9: Edit Program Form
old_edit_program = """                                      <select className="settings-input" value={editingProgData.catid || editingProgData.catId || ''} onChange={e => setEditingProgData({ ...editingProgData, catid: e.target.value, catId: e.target.value })}>
                                        <option value="">കാറ്റഗറി തിരഞ്ഞെടുക്കുക</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                      </select>

                                      <select className="settings-input" value={editingProgData.type || ''} onChange={e => setEditingProgData({ ...editingProgData, type: e.target.value })}>
                                        <option value="SINGLE">SINGLE</option>
                                        <option value="GROUP">GROUP</option>
                                      </select>"""

new_edit_program = """                                      <select className="settings-input" value={editingProgData.catid ? `${editingProgData.catid || editingProgData.catId}_${(editingProgData.type || '').includes('BOY') ? 'BOY' : (editingProgData.type || '').includes('GIRL') ? 'GIRL' : 'COMMON'}` : ''} onChange={e => {
                                        const val = e.target.value;
                                        if (val) {
                                          const [cId, g] = val.split('_');
                                          const baseType = (editingProgData.type || '').split('_')[0] || 'SINGLE';
                                          setEditingProgData({ ...editingProgData, catid: cId, catId: cId, type: `${baseType}_${g}` });
                                        }
                                      }}>
                                        <option value="">കാറ്റഗറി & വിഭാഗം തിരഞ്ഞെടുക്കുക</option>
                                        {categories.map(c => (
                                          <React.Fragment key={c.id}>
                                            <option value={`${c.id}_BOY`}>{c.name} - ആൺകുട്ടികൾ (Boys)</option>
                                            <option value={`${c.id}_GIRL`}>{c.name} - പെൺകുട്ടികൾ (Girls)</option>
                                            <option value={`${c.id}_COMMON`}>{c.name} - പൊതുവായത് (Common)</option>
                                          </React.Fragment>
                                        ))}
                                      </select>

                                      <select className="settings-input" value={(editingProgData.type || '').split('_')[0] || 'SINGLE'} onChange={e => {
                                        const g = (editingProgData.type || '').includes('BOY') ? 'BOY' : (editingProgData.type || '').includes('GIRL') ? 'GIRL' : 'COMMON';
                                        setEditingProgData({ ...editingProgData, type: `${e.target.value}_${g}` });
                                      }}>
                                        <option value="SINGLE">SINGLE</option>
                                        <option value="GROUP">GROUP</option>
                                      </select>"""
content = content.replace(old_edit_program, new_edit_program)

# Change 10: Program Display Label
old_prog_display = "കാറ്റഗറി: {catObj ? catObj.name : 'Unknown'} | ഇനം: {p.type === 'GROUP' ? 'Group 👥' : 'Single 👤'}"
new_prog_display = "കാറ്റഗറി: {catObj ? catObj.name : 'Unknown'} | വിഭാഗം: {(p.type || '').includes('BOY') ? 'Boys 👦' : (p.type || '').includes('GIRL') ? 'Girls 👧' : 'Common 🚻'} | ഇനം: {(p.type || '').includes('GROUP') ? 'Group 👥' : 'Single 👤'}"
content = content.replace(old_prog_display, new_prog_display)

# Change 11: Scoreboard Category Breakdown
old_scoreboard = """                        return (
                          <div key={t.id} className={`leaderboard-item ${rankClass}`}>
                            <div className="leaderboard-rank-badge">{badgeIcon}</div>
                            <div className="leaderboard-content">
                              <div className="team-meta">
                                <span className="team-name">{t.name}</span>
                                <span className="team-score-text">{totalPts} <span>Pts</span></span>
                              </div>
                              <div className="progress-track">
                                <div className="progress-fill" style={{ width: `${barWidth}%` }}>
                                   <div className="progress-glow"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );"""

new_scoreboard = """                        return (
                          <div key={t.id} className={`leaderboard-item ${rankClass}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <div className="leaderboard-rank-badge">{badgeIcon}</div>
                                <div className="leaderboard-content" style={{ flex: 1 }}>
                                  <div className="team-meta">
                                    <span className="team-name">{t.name}</span>
                                    <span className="team-score-text">{totalPts} <span>Pts</span></span>
                                  </div>
                                  <div className="progress-track">
                                    <div className="progress-fill" style={{ width: `${barWidth}%` }}>
                                       <div className="progress-glow"></div>
                                    </div>
                                  </div>
                                </div>
                            </div>
                            
                            {/* Category Breakdown for this Team */}
                            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {categories.map(c => {
                                    // Calculate points for this category and team
                                    const catResults = resultsList.filter(r => (String(r.teamId) === String(t.id) || String(r.teamid) === String(t.id)) && r.catname === c.name);
                                    if (catResults.length === 0) return null;
                                    
                                    const boyPts = catResults.filter(r => (r.studentgender || r.studentGender) === 'BOY').reduce((sum, r) => sum + r.points, 0);
                                    const girlPts = catResults.filter(r => (r.studentgender || r.studentGender) === 'GIRL').reduce((sum, r) => sum + r.points, 0);
                                    
                                    return (
                                        <div key={c.id} style={{ fontSize: '11px', background: '#fff', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '6px', minWidth: '110px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                            <strong style={{ color: '#1e293b', display: 'block', marginBottom: '4px' }}>{c.name}</strong>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                <span>👦 <b style={{ color: '#3b82f6' }}>{boyPts}</b></span>
                                                <span>👧 <b style={{ color: '#ec4899' }}>{girlPts}</b></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                          </div>
                        );"""
content = content.replace(old_scoreboard, new_scoreboard)

# Change 12: In program table display
old_prog_type_display = "<span style={{ background: (r.progtype || r.progType) === 'GROUP' ? '#ef4444' : '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{r.progtype || r.progType}</span>"
new_prog_type_display = "<span style={{ background: String(r.progtype || r.progType).includes('GROUP') ? '#ef4444' : '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{String(r.progtype || r.progType).includes('GROUP') ? 'GROUP' : 'SINGLE'}</span>"
content = content.replace(old_prog_type_display, new_prog_type_display)

with open('App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied UI fixes successfully.")

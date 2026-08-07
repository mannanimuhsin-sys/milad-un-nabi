import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

OLD_STEP5_BLOCK = """                                        <div className="step-content">
                                          {(() => {
                                            const catObj = categories.find(c => String(c.id) === String(groupRegCat));
                                            const isGeneral = catObj && catObj.name.toLowerCase().includes('general');
                                            const groupStudentsFiltered = groupRegCat ? students.filter(s => {
                                              if (groupRegGender !== 'COMMON' && s.gender !== groupRegGender) return false;
                                              if (groupRegCat === 'GENERAL') {
                                                return generalCatIds.map(String).includes(String(s.catid || s.catId || ''));
                                              }
                                              return String(s.catid || s.catId || '') === String(groupRegCat);
                                            }) : [];

                                            return groupStudentsFiltered.length === 0 ? (
                                              <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>
                                                {lang === 'EN' ? 'No students available.' : 'വിദ്യാർത്ഥികൾ ലഭ്യമല്ല.'}
                                              </p>
                                            ) : (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                                  {lang === 'EN' ? 'Selected: ' : 'തിരഞ്ഞെടുത്തവർ: '} <b>{groupRegStudents.length}</b> {lang === 'EN' ? 'students' : 'വിദ്യാർത്ഥികൾ'}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto', paddingRight: '2px', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '10px', background: '#fff' }}>
                                                  {groupStudentsFiltered.map(s => {"""

NEW_STEP5_BLOCK = """                                        <div className="step-content">
                                          {!groupRegTeam ? (
                                            <div style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: '700' }}>
                                              ⚠️ {lang === 'EN' ? 'Please select a Competing Team in Step 04 first.' : 'ദയവായി ഘട്ടം 04-ൽ ഒരു മത്സരിക്കുന്ന ടീമിനെ തിരഞ്ഞെടുക്കുക.'}
                                            </div>
                                          ) : (() => {
                                            const catObj = categories.find(c => String(c.id) === String(groupRegCat));
                                            const isGeneral = catObj && catObj.name.toLowerCase().includes('general');

                                            // Filter by category, gender AND team
                                            const groupStudentsFiltered = groupRegCat ? students.filter(s => {
                                              if (groupRegGender !== 'COMMON' && s.gender !== groupRegGender) return false;
                                              if (groupRegCat === 'GENERAL') {
                                                if (!generalCatIds.map(String).includes(String(s.catid || s.catId || ''))) return false;
                                              } else if (String(s.catid || s.catId || '') !== String(groupRegCat)) {
                                                return false;
                                              }
                                              // ONLY show students from the selected competing team
                                              if (groupRegTeam && String(s.teamid || s.teamId || '') !== String(groupRegTeam)) return false;
                                              return true;
                                            }) : [];

                                            // Filter by student search query (reg number / name)
                                            const searchFilteredStudents = groupRegMemberSearch.trim()
                                              ? groupStudentsFiltered.filter(s => {
                                                  const q = groupRegMemberSearch.trim().toLowerCase();
                                                  const reg = String(s.regno || s.regNo || '').toLowerCase();
                                                  const name = String(s.name || '').toLowerCase();
                                                  return reg.includes(q) || name.includes(q);
                                                })
                                              : groupStudentsFiltered;

                                            const selectedTeamObj = teams.find(t => String(t.id) === String(groupRegTeam));

                                            return groupStudentsFiltered.length === 0 ? (
                                              <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>
                                                {lang === 'EN' ? 'No students found in the selected team.' : 'തിരഞ്ഞെടുത്ത ടീമിൽ വിദ്യാർത്ഥികൾ ആരുമില്ല.'}
                                              </p>
                                            ) : (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {/* 🔍 Search box for member students */}
                                                <div>
                                                  <input
                                                    type="text"
                                                    className="settings-input-v2"
                                                    placeholder={lang === 'EN' ? '🔍 Search student by Reg No or Name...' : '🔍 രജിസ്റ്റർ നമ്പർ / പേര് നൽകി സെർച്ച് ചെയ്യുക...'}
                                                    value={groupRegMemberSearch}
                                                    onChange={e => setGroupRegMemberSearch(e.target.value)}
                                                    style={{ margin: 0, padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #94a3b8', background: '#fff' }}
                                                  />
                                                </div>

                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <span>{lang === 'EN' ? 'Selected: ' : 'തിരഞ്ഞെടുത്തവർ: '} <b>{groupRegStudents.length}</b> {lang === 'EN' ? 'students' : 'വിദ്യാർത്ഥികൾ'}</span>
                                                  <span style={{ background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>🚩 {selectedTeamObj?.name}</span>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto', paddingRight: '2px', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '10px', background: '#fff' }}>
                                                  {searchFilteredStudents.length === 0 ? (
                                                    <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px', margin: 0, textAlign: 'center', padding: '10px 0' }}>
                                                      {lang === 'EN' ? 'No matching students found.' : 'സെർച്ച് ഫിൽട്ടറിന് അനുയോജ്യമായ വിദ്യാർത്ഥികൾ ലഭ്യമല്ല.'}
                                                    </p>
                                                  ) : searchFilteredStudents.map(s => {"""

if OLD_STEP5_BLOCK in content:
    content = content.replace(OLD_STEP5_BLOCK, NEW_STEP5_BLOCK, 1)
    print("STEP 3 SUCCESS: Replaced Step 05 block")
else:
    print("STEP 3 STILL FAILED")

# Also need to close the extra IIFE wrapper added by {!groupRegTeam ? ... : (() => { ... })()}
OLD_STEP5_END = """                                          <button type="button" onClick={handleSaveGroupRegistration} disabled={groupRegSaving}
                                            className="btn-premium-action"
                                            style={{ marginTop: '16px' }}>
                                            {groupRegSaving ? `⏳ ${t('saving')}` : `💾 ${lang === 'EN' ? 'Save Group Registration' : 'ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ സേവ് ചെയ്യുക'}`}
                                          </button>
                                        </div>
                                      </div>
                                    )}"""

NEW_STEP5_END = """                                          <button type="button" onClick={handleSaveGroupRegistration} disabled={groupRegSaving}
                                            className="btn-premium-action"
                                            style={{ marginTop: '16px' }}>
                                            {groupRegSaving ? `⏳ ${t('saving')}` : `💾 ${lang === 'EN' ? 'Save Group Registration' : 'ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ സേവ് ചെയ്യുക'}`}
                                          </button>
                                        </div>
                                      )})()}
                                      </div>
                                    )}"""

if OLD_STEP5_END in content:
    content = content.replace(OLD_STEP5_END, NEW_STEP5_END, 1)
    print("STEP 5 SUCCESS: Closed extra IIFE wrapper")
else:
    print("STEP 5 FAILED")

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("DONE")

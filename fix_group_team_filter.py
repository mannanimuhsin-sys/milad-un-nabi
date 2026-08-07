import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add groupRegMemberSearch state
STATE_TARGET = "  const [groupRegSummaryFilterProg, setGroupRegSummaryFilterProg] = useState('ALL');"
STATE_REPLACEMENT = """  const [groupRegSummaryFilterProg, setGroupRegSummaryFilterProg] = useState('ALL');
  const [groupRegMemberSearch, setGroupRegMemberSearch] = useState('');"""

if STATE_TARGET in content:
    content = content.replace(STATE_TARGET, STATE_REPLACEMENT, 1)
    print("STEP 1: Added groupRegMemberSearch state")
else:
    print("STEP 1 FAILED: STATE_TARGET not found")

# 2. Update Step 04 Team Dropdown onChange to reset groupRegStudents and groupRegMemberSearch
OLD_TEAM_SELECT = """                                            <select className="settings-input-v2" value={groupRegTeam} onChange={e => setGroupRegTeam(e.target.value)}>"""
NEW_TEAM_SELECT = """                                            <select className="settings-input-v2" value={groupRegTeam} onChange={e => {
                                              setGroupRegTeam(e.target.value);
                                              setGroupRegStudents([]);
                                              setGroupRegLeader('');
                                              setGroupRegMemberSearch('');
                                            }}>"""

if OLD_TEAM_SELECT in content:
    content = content.replace(OLD_TEAM_SELECT, NEW_TEAM_SELECT, 1)
    print("STEP 2: Updated Step 04 team select onChange listener")
else:
    print("STEP 2 FAILED: OLD_TEAM_SELECT not found")

# 3. Update Step 05 Student Filtering & Search Box UI
OLD_STEP5_CONTENT = """                                         <div className="step-content">
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

NEW_STEP5_CONTENT = """                                         <div className="step-content">
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

if OLD_STEP5_CONTENT in content:
    content = content.replace(OLD_STEP5_CONTENT, NEW_STEP5_CONTENT, 1)
    print("STEP 3: Updated Step 05 student filtering and search box UI")
else:
    print("STEP 3 FAILED: OLD_STEP5_CONTENT not found")

# Close the outer IIFE block cleanly
OLD_STEP5_CLOSE = """                                                 {/* Team Leader Dropdown selection */}"""
NEW_STEP5_CLOSE = """                                                 {/* Team Leader Dropdown selection */}"""

# Also update editStudentsFiltered to filter by competing team g.team_id
OLD_EDIT_STUDENTS = """                                            const editStudentsFiltered = editProg ? students.filter(s => {
                                              const sCatId = String(s.catid || s.catId || '');
                                              const sPCatId = String(editProg.catid || editProg.catId || '');
                                              if (sCatId !== sPCatId) return false;
                                              const sGender = String(s.gender || '').toUpperCase();
                                              if (editProgType.includes('BOY') && sGender !== 'BOY') return false;
                                              if (editProgType.includes('GIRL') && sGender !== 'GIRL') return false;
                                              return true;
                                            }) : [];"""

NEW_EDIT_STUDENTS = """                                            const editStudentsFiltered = editProg ? students.filter(s => {
                                              const sCatId = String(s.catid || s.catId || '');
                                              const sPCatId = String(editProg.catid || editProg.catId || '');
                                              if (sCatId !== sPCatId && groupRegCat !== 'GENERAL') return false;
                                              const sGender = String(s.gender || '').toUpperCase();
                                              if (editProgType.includes('BOY') && sGender !== 'BOY') return false;
                                              if (editProgType.includes('GIRL') && sGender !== 'GIRL') return false;
                                              if (g.team_id && String(s.teamid || s.teamId || '') !== String(g.team_id)) return false;
                                              return true;
                                            }) : [];"""

if OLD_EDIT_STUDENTS in content:
    content = content.replace(OLD_EDIT_STUDENTS, NEW_EDIT_STUDENTS, 1)
    print("STEP 4: Updated editStudentsFiltered to filter by competing team")
else:
    print("STEP 4 FAILED: OLD_EDIT_STUDENTS not found")

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("COMPLETED SCRIPT")

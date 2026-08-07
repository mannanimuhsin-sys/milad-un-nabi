import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variable groupRegSummaryFilterProg
STATE_TARGET = "  const [groupRegStudents, setGroupRegStudents] = useState([]); // array of student IDs"
STATE_REPLACEMENT = """  const [groupRegStudents, setGroupRegStudents] = useState([]); // array of student IDs
  const [groupRegSummaryFilterProg, setGroupRegSummaryFilterProg] = useState('ALL');"""

if STATE_TARGET in content:
    content = content.replace(STATE_TARGET, STATE_REPLACEMENT, 1)
    print("STEP 1: Added groupRegSummaryFilterProg state")
else:
    print("STEP 1 FAILED: STATE_TARGET not found")

# 2. Update Group Registrations Summary section (sorting, filtering, UI dropdown, PDF update)

OLD_SUMMARY_SECTION = """                                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '14px', borderLeft: '4px solid var(--primary-light)', paddingLeft: '10px' }}>
                                    {lang === 'EN' ? '📊 Group Registrations' : '📊 ഗ്രൂപ്പ് രജിസ്ട്രേഷനുകൾ'}{groupRegCat ? ` – ${(categories.find(c => String(c.id) === String(groupRegCat)) || {}).name || ''}` : ''}
                                  </h3>
                                  {!groupRegCat ? (
                                    <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                                      {lang === 'EN' ? 'Select a category to view registrations.' : 'രജിസ്ട്രേഷനുകൾ കാണാൻ ഒരു വിഭാഗം തിരഞ്ഞെടുക്കുക.'}
                                    </p>
                                  ) : (() => {
                                    const activeGroupRegs = groupRegistrations.filter(g => {
                                      const prog = programs.find(p => String(p.id) === String(g.program_id));
                                      if (!prog) return false; if (groupRegCat === 'GENERAL') { if (!isGeneralProg(prog)) return false; } else if (String(prog.catid || prog.catId || '') !== String(groupRegCat)) return false;

                                      if (groupRegGender === 'COMMON') return true;

                                      const pt = prog.type || '';
                                      const isBoyProg = pt.includes('BOY');
                                      const isGirlProg = pt.includes('GIRL');
                                      const isCommonProg = pt.includes('COMMON');

                                      if (groupRegGender === 'BOY') {
                                        if (isBoyProg) return true;
                                        if (isCommonProg) {
                                          const memberIds = Array.isArray(g.student_ids) ? g.student_ids : [];
                                          return memberIds.some(id => {
                                            const studentObj = students.find(s => String(s.id) === String(id));
                                            return studentObj && String(studentObj.gender).toUpperCase() === 'BOY';
                                          });
                                        }
                                        return false;
                                      }

                                      if (groupRegGender === 'GIRL') {
                                        if (isGirlProg) return true;
                                        if (isCommonProg) {
                                          const memberIds = Array.isArray(g.student_ids) ? g.student_ids : [];
                                          return memberIds.some(id => {
                                            const studentObj = students.find(s => String(s.id) === String(id));
                                            return studentObj && String(studentObj.gender).toUpperCase() === 'GIRL';
                                          });
                                        }
                                        return false;
                                      }

                                      return false;
                                    });

                                    const generateGroupRegsPDF = () => {
                                      const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                                      const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                                      const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';

                                      const catObj = categories.find(c => String(c.id) === String(groupRegCat));
                                      const catName = catObj ? catObj.name : (groupRegCat === 'GENERAL' ? 'GENERAL' : '');

                                      let genderLabel = '';
                                      if (groupRegGender === 'BOY') genderLabel = lang === 'EN' ? 'Boys' : 'ബോയ്സ്';
                                      else if (groupRegGender === 'GIRL') genderLabel = lang === 'EN' ? 'Girls' : 'ഗേൾസ്';
                                      else genderLabel = lang === 'EN' ? 'All' : 'എല്ലാവരും';

                                      const pdfTitle = lang === 'EN' ? 'Group Registrations List' : 'ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ ലിസ്റ്റ്';
                                      const subtitle = `${catName} | ${genderLabel}`;

                                      const rows = activeGroupRegs.map((g, idx) => {"""

NEW_SUMMARY_SECTION = """                                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '14px', borderLeft: '4px solid var(--primary-light)', paddingLeft: '10px' }}>
                                    {lang === 'EN' ? '📊 Group Registrations' : '📊 ഗ്രൂപ്പ് രജിസ്ട്രേഷനുകൾ'}{groupRegCat ? ` – ${(categories.find(c => String(c.id) === String(groupRegCat)) || {}).name || ''}` : ''}
                                  </h3>
                                  {!groupRegCat ? (
                                    <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                                      {lang === 'EN' ? 'Select a category to view registrations.' : 'രജിസ്ട്രേഷനുകൾ കാണാൻ ഒരു വിഭാഗം തിരഞ്ഞെടുക്കുക.'}
                                    </p>
                                  ) : (() => {
                                    const activeGroupRegs = groupRegistrations.filter(g => {
                                      const prog = programs.find(p => String(p.id) === String(g.program_id));
                                      if (!prog) return false; if (groupRegCat === 'GENERAL') { if (!isGeneralProg(prog)) return false; } else if (String(prog.catid || prog.catId || '') !== String(groupRegCat)) return false;

                                      if (groupRegGender === 'COMMON') return true;

                                      const pt = prog.type || '';
                                      const isBoyProg = pt.includes('BOY');
                                      const isGirlProg = pt.includes('GIRL');
                                      const isCommonProg = pt.includes('COMMON');

                                      if (groupRegGender === 'BOY') {
                                        if (isBoyProg) return true;
                                        if (isCommonProg) {
                                          const memberIds = Array.isArray(g.student_ids) ? g.student_ids : [];
                                          return memberIds.some(id => {
                                            const studentObj = students.find(s => String(s.id) === String(id));
                                            return studentObj && String(studentObj.gender).toUpperCase() === 'BOY';
                                          });
                                        }
                                        return false;
                                      }

                                      if (groupRegGender === 'GIRL') {
                                        if (isGirlProg) return true;
                                        if (isCommonProg) {
                                          const memberIds = Array.isArray(g.student_ids) ? g.student_ids : [];
                                          return memberIds.some(id => {
                                            const studentObj = students.find(s => String(s.id) === String(id));
                                            return studentObj && String(studentObj.gender).toUpperCase() === 'GIRL';
                                          });
                                        }
                                        return false;
                                      }

                                      return false;
                                    });

                                    // ✅ Sort activeGroupRegs BY PROGRAM FIRST so all entries for a single competition appear together
                                    activeGroupRegs.sort((a, b) => {
                                      const progA = programs.find(p => String(p.id) === String(a.program_id));
                                      const progB = programs.find(p => String(p.id) === String(b.program_id));

                                      const codeA = parseInt(progA?.code) || 0;
                                      const codeB = parseInt(progB?.code) || 0;
                                      if (codeA !== codeB) return codeA - codeB;

                                      const nameA = String(progA?.name || '');
                                      const nameB = String(progB?.name || '');
                                      if (nameA !== nameB) return nameA.localeCompare(nameB);

                                      return String(a.group_name || '').localeCompare(String(b.group_name || ''));
                                    });

                                    // Unique list of programs present in activeGroupRegs for the Filter Dropdown
                                    const availableGroupProgs = Array.from(
                                      new Set(activeGroupRegs.map(g => String(g.program_id)))
                                    ).map(pId => programs.find(p => String(p.id) === String(pId))).filter(Boolean);

                                    // Filter by selected Program if not 'ALL'
                                    const displayedGroupRegs = activeGroupRegs.filter(g => {
                                      if (groupRegSummaryFilterProg === 'ALL') return true;
                                      return String(g.program_id) === String(groupRegSummaryFilterProg);
                                    });

                                    const generateGroupRegsPDF = () => {
                                      const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                                      const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                                      const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';

                                      const catObj = categories.find(c => String(c.id) === String(groupRegCat));
                                      const catName = catObj ? catObj.name : (groupRegCat === 'GENERAL' ? 'GENERAL' : '');

                                      let genderLabel = '';
                                      if (groupRegGender === 'BOY') genderLabel = lang === 'EN' ? 'Boys' : 'ബോയ്സ്';
                                      else if (groupRegGender === 'GIRL') genderLabel = lang === 'EN' ? 'Girls' : 'ഗേൾസ്';
                                      else genderLabel = lang === 'EN' ? 'All' : 'എല്ലാവരും';

                                      const selectedProgObj = groupRegSummaryFilterProg !== 'ALL'
                                        ? programs.find(p => String(p.id) === String(groupRegSummaryFilterProg))
                                        : null;

                                      const pdfTitle = lang === 'EN' ? 'Group Registrations List' : 'ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ ലിസ്റ്റ്';
                                      const subtitle = `${catName} | ${genderLabel}${selectedProgObj ? ` | ${selectedProgObj.code} - ${selectedProgObj.name}` : ''}`;

                                      const rows = displayedGroupRegs.map((g, idx) => {"""

if OLD_SUMMARY_SECTION in content:
    content = content.replace(OLD_SUMMARY_SECTION, NEW_SUMMARY_SECTION, 1)
    print("STEP 2: Updated activeGroupRegs sorting and PDF generation")
else:
    print("STEP 2 FAILED: OLD_SUMMARY_SECTION not found")

# 3. Update activeGroupRegs.length in footer of PDF and return activeGroupRegs.length check to displayedGroupRegs
OLD_PDF_FOOTER = '<div class="footer">Generated by Milad Fest App • Total Group Registrations: ${activeGroupRegs.length}</div>'
NEW_PDF_FOOTER = '<div class="footer">Generated by Milad Fest App • Total Group Registrations: ${displayedGroupRegs.length}</div>'

if OLD_PDF_FOOTER in content:
    content = content.replace(OLD_PDF_FOOTER, NEW_PDF_FOOTER, 1)
    print("STEP 3: Updated PDF footer total count to displayedGroupRegs.length")
else:
    print("STEP 3 FAILED: OLD_PDF_FOOTER not found")

OLD_RETURN_CHECK = """                                    return activeGroupRegs.length === 0 ? (
                                      <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                                        {lang === 'EN' ? 'No group registrations in this category yet.' : 'ഈ വിഭാഗത്തിൽ ഗ്രൂപ്പ് രജിസ്ട്രേഷനുകൾ ഒന്നും ചെയ്തിട്ടില്ല.'}
                                      </p>
                                    ) : (
                                      <>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                                          {activeGroupRegs.map(g => {"""

NEW_RETURN_CHECK = """                                    return (
                                      <>
                                        {/* 🔍 Program Filter for Group Registrations Summary */}
                                        <div style={{ marginBottom: '14px', background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                                            🎯 {lang === 'EN' ? 'Filter by Competition / Program:' : 'മത്സരം അനുസരിച്ച് ഫിൽട്ടർ ചെയ്യുക:'}
                                          </label>
                                          <select
                                            className="settings-input-v2"
                                            value={groupRegSummaryFilterProg}
                                            onChange={e => setGroupRegSummaryFilterProg(e.target.value)}
                                            style={{ margin: 0, width: '100%', fontSize: '13px', fontWeight: '700', color: '#0f766e', background: '#f8fafc', borderColor: '#94a3b8' }}
                                          >
                                            <option value="ALL">-- {lang === 'EN' ? 'All Group Programs' : 'എല്ലാ ഗ്രൂപ്പ് പ്രോഗ്രാമുകളും'} ({activeGroupRegs.length}) --</option>
                                            {availableGroupProgs.map(p => {
                                              const count = activeGroupRegs.filter(g => String(g.program_id) === String(p.id)).length;
                                              return (
                                                <option key={p.id} value={p.id}>
                                                  {p.code} – {p.name} ({count} {lang === 'EN' ? 'groups' : 'ഗ്രൂപ്പുകൾ'})
                                                </option>
                                              );
                                            })}
                                          </select>
                                        </div>

                                        {displayedGroupRegs.length === 0 ? (
                                          <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                                            {lang === 'EN' ? 'No group registrations found matching selected filter.' : 'തിരഞ്ഞെടുത്ത ഫിൽട്ടറിന് അനുയോജ്യമായ ഗ്രൂപ്പ് രജിസ്ട്രേഷനുകൾ ഒന്നും കണ്ടെത്തിയില്ല.'}
                                          </p>
                                        ) : (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                                            {displayedGroupRegs.map(g => {"""

if OLD_RETURN_CHECK in content:
    content = content.replace(OLD_RETURN_CHECK, NEW_RETURN_CHECK, 1)
    print("STEP 4: Added Program filter dropdown UI and updated rendering loop")
else:
    print("STEP 4 FAILED: OLD_RETURN_CHECK not found")

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("ALL STEPS COMPLETED")

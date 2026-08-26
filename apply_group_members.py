import sys
sys.stdout.reconfigure(encoding='utf-8')

file_path = r'd:\MILAD UN NABI\milad\src\App.js'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Find the table body section in Results History - look for the exact table row render code
TARGET = """                                {/* ── Table of Winners for this Program ── */}
                                 <div className="table-responsive-wrapper" style={{ margin: 0 }}>
                                   <table style={{ margin: 0, width: '100%' }}>
                                     <thead>
                                       <tr>
                                         <th style={{ width: '110px', textAlign: 'center' }}>Place</th>
                                         <th style={{ width: '50px', textAlign: 'center' }}>Photo</th>
                                         <th>Reg No / Name</th>
                                         <th style={{ textAlign: 'center' }}>Gender</th>
                                         <th>Team</th>
                                         <th style={{ textAlign: 'center' }}>Grade</th>
                                         <th style={{ textAlign: 'center' }}>Points</th>
                                         {loginRole === 'ADMIN' && <th style={{ textAlign: 'center', width: '70px' }}>Delete</th>}
                                       </tr>
                                     </thead>"""

if TARGET in code:
    print("Found new table header (already updated). Checking tbody...")
    # Check if groupMembers is present
    if 'groupMembers' in code:
        print("groupMembers already present - nothing to do!")
        sys.exit(0)
    else:
        print("groupMembers NOT present - need to update tbody")
else:
    print("New header NOT found. Looking for old header...")

# Find old table header
OLD_HEADER = """                                {/* ── Table of Winners for this Program ── */}
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
                                     </thead>"""

if OLD_HEADER in code:
    print("Found OLD header.")
else:
    print("Neither old nor new header found. Searching for table header variant...")
    idx = code.find('Table of Winners for this Program')
    if idx != -1:
        print(f"Found table comment at pos {idx}:")
        print(repr(code[idx:idx+800]))
    sys.exit(1)

OLD_TBODY = """                                     <tbody>
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
                               </div>"""

if OLD_TBODY not in code:
    print("OLD tbody not found either! Let's search manually...")
    idx = code.find('visibleRows.map(r =>')
    if idx != -1:
        print(f"Found visibleRows.map at pos {idx}:")
        print(repr(code[idx:idx+400]))
    sys.exit(1)

print("Found OLD tbody. Replacing with GROUP MEMBER EXPANSION...")

NEW_TABLE = """                                {/* ── Table of Winners for this Program ── */}
                                 <div className="table-responsive-wrapper" style={{ margin: 0 }}>
                                   <table style={{ margin: 0, width: '100%' }}>
                                     <thead>
                                       <tr>
                                         <th style={{ width: '110px', textAlign: 'center' }}>Place</th>
                                         <th style={{ width: '50px', textAlign: 'center' }}>Photo</th>
                                         <th>Reg No / Name</th>
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
                                         const isGroupOrTeam = String(group.progType || '').toUpperCase().includes('GROUP') || String(group.progType || '').toUpperCase().includes('TEAM');
                                         const placeBg = placeLabel === 'First' ? '#fbbf24' : placeLabel === 'Second' ? '#94a3b8' : placeLabel === 'Third' ? '#f97316' : '#e2e8f0';
                                         const placeColor = placeLabel === 'First' ? '#78350f' : placeLabel === 'Second' ? '#1e293b' : placeLabel === 'Third' ? '#7c2d12' : '#475569';
                                         const placeEmoji = placeLabel === 'First' ? '🥇 1st Place' : placeLabel === 'Second' ? '🥈 2nd Place' : placeLabel === 'Third' ? '🥉 3rd Place' : placeLabel;
                                         const colSpan = loginRole === 'ADMIN' ? 7 : 6;
                                         const isTeamType = String(group.progType || '').toUpperCase().includes('TEAM');

                                         // ── For GROUP / TEAM: find registered members for prize distribution ──
                                         let groupMembers = [];
                                         if (isGroupOrTeam) {
                                           const teamId = String(r.teamid || r.teamId || r.team_id || '').trim();
                                           const progId = String(group.progId || group.progObj?.id || '').trim();
                                           // From groupRegistrations
                                           if (Array.isArray(groupRegistrations) && groupRegistrations.length > 0) {
                                             groupMembers = groupRegistrations.filter(gr => {
                                               const grProgId = String(gr.program_id || gr.progid || '').trim();
                                               const grTeamId = String(gr.team_id || gr.teamid || '').trim();
                                               const matchesProg = progId && (grProgId === progId || grProgId === String(group.progObj?.code || ''));
                                               const matchesTeam = teamId && grTeamId === teamId;
                                               return matchesProg && matchesTeam;
                                             });
                                           }
                                           // Fallback: match by teamid in students
                                           if (groupMembers.length === 0 && teamId && Array.isArray(students)) {
                                             groupMembers = students
                                               .filter(s => String(s.teamid || s.team_id || '').trim() === teamId)
                                               .map(s => ({
                                                 student_id: String(s.id),
                                                 regno: String(s.regno || s.regNo || '').trim(),
                                                 name: s.name || '',
                                                 gender: s.gender || '',
                                                 photo_url: s.photo_url || '',
                                                 photo_status: s.photo_status || ''
                                               }));
                                           }
                                         }

                                         return (
                                           <React.Fragment key={r.id}>
                                             {/* ── Main Result Row ── */}
                                             <tr style={{ background: placeLabel === 'First' ? '#fffbeb' : placeLabel === 'Second' ? '#f8fafc' : placeLabel === 'Third' ? '#fff7ed' : '#ffffff' }}>
                                               <td style={{ textAlign: 'center' }}>
                                                 <span style={{ background: placeBg, color: placeColor, padding: '3px 10px', borderRadius: '12px', fontWeight: '800', fontSize: '12px', display: 'inline-block' }}>
                                                   {placeEmoji}
                                                 </span>
                                               </td>
                                               <td style={{ textAlign: 'center' }}>
                                                 {isGroupOrTeam
                                                   ? <span style={{ fontSize: '22px' }}>{isTeamType ? '🏟️' : '👥'}</span>
                                                   : renderTablePhoto(regPart, r.studentgender || r.studentGender)
                                                 }
                                               </td>
                                               <td>
                                                 {isGroupOrTeam
                                                   ? <b style={{ color: '#1e1b4b', fontSize: '13px' }}>{namePart || sName}</b>
                                                   : <><b style={{ color: '#1e40af' }}>{regPart}</b>{namePart && <span style={{ color: '#334155', marginLeft: '6px' }}>{namePart}</span>}</>
                                                 }
                                               </td>
                                               <td style={{ textAlign: 'center' }}>
                                                 {!isGroupOrTeam && ((r.studentgender || r.studentGender) === 'BOY' ? 'Boy 👦' : 'Girl 👧')}
                                               </td>
                                               <td><b>{r.teamname || r.teamName}</b></td>
                                               <td style={{ textAlign: 'center' }}>
                                                 <span style={{ fontWeight: '800', color: gradeLabel === 'A' ? '#059669' : gradeLabel === 'B' ? '#2563eb' : gradeLabel === 'C' ? '#7c3aed' : '#94a3b8' }}>
                                                   {gradeLabel}
                                                 </span>
                                               </td>
                                               <td style={{ textAlign: 'center' }}><b style={{ color: '#0f766e' }}>{r.points} Pts</b></td>
                                               {loginRole === 'ADMIN' && (
                                                 <td style={{ textAlign: 'center' }}>
                                                   <button onClick={() => handleDeleteResult(r.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}>
                                                     Delete
                                                   </button>
                                                 </td>
                                               )}
                                             </tr>

                                             {/* ── Group / Team Member Cards (for prize distribution) ── */}
                                             {isGroupOrTeam && (
                                               <tr>
                                                 <td colSpan={colSpan} style={{ padding: '0 12px 14px 12px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                   <div style={{
                                                     marginTop: '8px',
                                                     background: '#ffffff',
                                                     borderRadius: '12px',
                                                     border: '2px solid ' + (placeLabel === 'First' ? '#fbbf24' : placeLabel === 'Second' ? '#94a3b8' : placeLabel === 'Third' ? '#f97316' : '#e2e8f0'),
                                                     overflow: 'hidden',
                                                     boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                                   }}>
                                                     {/* Header */}
                                                     <div style={{
                                                       background: placeLabel === 'First' ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : placeLabel === 'Second' ? 'linear-gradient(135deg,#f1f5f9,#e2e8f0)' : placeLabel === 'Third' ? 'linear-gradient(135deg,#fff7ed,#fed7aa)' : 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
                                                       padding: '8px 14px',
                                                       borderBottom: '1px solid #e2e8f0',
                                                       fontSize: '12px',
                                                       fontWeight: '800',
                                                       color: '#475569',
                                                       display: 'flex',
                                                       alignItems: 'center',
                                                       gap: '6px'
                                                     }}>
                                                       {placeEmoji} — {isTeamType ? '🏟️ Team' : '👥 Group'} Members
                                                       {groupMembers.length > 0 && (
                                                         <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '1px 8px', borderRadius: '10px', fontSize: '11px', marginLeft: '4px' }}>
                                                           {groupMembers.length} members
                                                         </span>
                                                       )}
                                                     </div>
                                                     {/* Member Cards */}
                                                     {groupMembers.length > 0 ? (
                                                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '12px 14px' }}>
                                                         {groupMembers.map((mem, mIdx) => {
                                                           const memRegno = String(mem.regno || mem.student_regno || mem.reg_no || '').trim();
                                                           const memName = mem.name || mem.student_name || mem.studentname || '';
                                                           const memGender = String(mem.gender || mem.student_gender || '').toUpperCase();
                                                           const memStudent = students.find(s =>
                                                             (memRegno && String(s.regno || s.regNo || '').trim() === memRegno) ||
                                                             (mem.student_id && String(s.id) === String(mem.student_id))
                                                           );
                                                           const hasPhoto = memStudent && memStudent.photo_url && memStudent.photo_status && memStudent.photo_status !== 'none';
                                                           return (
                                                             <div key={mIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '8px 12px', minWidth: '160px', flex: '0 0 auto' }}>
                                                               <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #cbd5e1', flexShrink: 0, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                 {hasPhoto
                                                                   ? <img src={memStudent.photo_url} alt={memName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                   : <span style={{ fontSize: '20px' }}>{memGender === 'BOY' ? '👦' : memGender === 'GIRL' ? '👧' : '👤'}</span>
                                                                 }
                                                               </div>
                                                               <div>
                                                                 <div style={{ fontWeight: '800', fontSize: '12.5px', color: '#1e293b', lineHeight: '1.3' }}>{memName || '—'}</div>
                                                                 {memRegno && <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>#{memRegno}</div>}
                                                                 <div style={{ fontSize: '11px', color: '#64748b' }}>{memGender === 'BOY' ? 'Boy 👦' : memGender === 'GIRL' ? 'Girl 👧' : ''}</div>
                                                               </div>
                                                             </div>
                                                           );
                                                         })}
                                                       </div>
                                                     ) : (
                                                       <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                                                         ℹ️ No registered member details found for this group/team.
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
                               </div>"""

code = code.replace(OLD_HEADER + OLD_TBODY, NEW_TABLE, 1)

if 'groupMembers' in code:
    print("SUCCESS: Group member expansion code injected!")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("File saved.")
else:
    print("FAILED: replacement did not work.")
    sys.exit(1)

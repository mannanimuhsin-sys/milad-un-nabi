import re

def main():
    file_path = 'src/App.js'
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Update isProgPublished to handle unconfigured madrasas
    old_pub = '''  const isProgPublished = (progId) => {
    try {
      if (!progId) return false;
      if (!Array.isArray(publishedPrograms) || publishedPrograms.length === 0) return false;
      const pIdStr = String(progId).trim();
      const pIdLower = pIdStr.toLowerCase();

      // 1. Direct match in published list
      const pubLowerSet = new Set(publishedPrograms.map(p => String(p || '').trim().toLowerCase()));
      if (pubLowerSet.has(pIdLower)) return true;

      // 2. Resolve program object by id, code, name, or composite code/name
      const progObj = Array.isArray(programs) ? programs.find(p => {
        if (!p) return false;
        const pId = String(p.id || '').trim().toLowerCase();
        const pCode = String(p.code || '').trim().toLowerCase();
        const pName = String(p.name || '').trim().toLowerCase();
        if (pId && pId === pIdLower) return true;
        if (pCode && (pCode === pIdLower || pIdLower.startsWith(pCode + ' -') || pIdLower.startsWith(pCode + '-'))) return true;
        if (pName && (pName === pIdLower || pIdLower.includes(pName))) return true;
        return false;
      }) : null;

      const checkIds = [pIdLower];
      if (progObj?.id) checkIds.push(String(progObj.id).trim().toLowerCase());
      if (progObj?.code) checkIds.push(String(progObj.code).trim().toLowerCase());
      if (progObj?.name) checkIds.push(String(progObj.name).trim().toLowerCase());

      return checkIds.some(id => pubLowerSet.has(id));
    } catch (e) {
      return false;
    }
  };'''

    new_pub = '''  const isProgPublished = (progId) => {
    try {
      if (!progId) return false;

      // 1. If individual program publishing has NEVER been configured in DB/state for this madrasa,
      // all entered results are live by default (standard mode without draft gating).
      const hasExplicitPublishConfig =
        (Array.isArray(visibilityControls?.published_programs) && visibilityControls.published_programs.length > 0) ||
        (Array.isArray(publishedPrograms) && publishedPrograms.length > 0);

      if (!hasExplicitPublishConfig) {
        return true;
      }

      const pIdStr = String(progId).trim();
      const pIdLower = pIdStr.toLowerCase();

      // 2. Direct match in published list
      const activePubList = Array.isArray(publishedPrograms) && publishedPrograms.length > 0
        ? publishedPrograms
        : (Array.isArray(visibilityControls?.published_programs) ? visibilityControls.published_programs : []);

      const pubLowerSet = new Set(activePubList.map(p => String(p || '').trim().toLowerCase()));
      if (pubLowerSet.has(pIdLower)) return true;

      // 3. Resolve program object by id, code, name, or composite code/name
      const progObj = Array.isArray(programs) ? programs.find(p => {
        if (!p) return false;
        const pId = String(p.id || '').trim().toLowerCase();
        const pCode = String(p.code || '').trim().toLowerCase();
        const pName = String(p.name || '').trim().toLowerCase();
        if (pId && pId === pIdLower) return true;
        if (pCode && (pCode === pIdLower || pIdLower.startsWith(pCode + ' -') || pIdLower.startsWith(pCode + '-'))) return true;
        if (pName && (pName === pIdLower || pIdLower.includes(pName))) return true;
        return false;
      }) : null;

      const checkIds = [pIdLower];
      if (progObj?.id) checkIds.push(String(progObj.id).trim().toLowerCase());
      if (progObj?.code) checkIds.push(String(progObj.code).trim().toLowerCase());
      if (progObj?.name) checkIds.push(String(progObj.name).trim().toLowerCase());

      return checkIds.some(id => pubLowerSet.has(id));
    } catch (e) {
      return false;
    }
  };'''

    assert old_pub in code, "Failed to find old_pub"
    code = code.replace(old_pub, new_pub)

    # 2. Update Program Winners filter to let ADMIN always view
    old_pw = '''                        const progResults = resultsList.filter(r => {
                          if (!isProgPublished(r.progid)) return false;'''
    new_pw = '''                        const progResults = resultsList.filter(r => {
                          if (loginRole !== 'ADMIN' && !isProgPublished(r.progid)) return false;'''
    assert old_pw in code, "Failed to find old_pw"
    code = code.replace(old_pw, new_pw)

    # 3. Update Bulk Certificates filter to let ADMIN always view
    old_bc = '''                      // 1. Gather all winner results with full resolved metadata
                      const allWinnerResults = resultsList.filter(r => {
                        if (!isProgPublished(r.progid)) return false;'''
    new_bc = '''                      // 1. Gather all winner results with full resolved metadata
                      const allWinnerResults = resultsList.filter(r => {
                        if (loginRole !== 'ADMIN' && !isProgPublished(r.progid)) return false;'''
    assert old_bc in code, "Failed to find old_bc"
    code = code.replace(old_bc, new_bc)

    # 4. Update Results History filter
    old_rh = '''                    const displayHistoryResults = resultsList.filter(r => isProgPublished(r.progid));'''
    new_rh = '''                    const displayHistoryResults = resultsList.filter(r => loginRole === 'ADMIN' || isProgPublished(r.progid));'''
    assert old_rh in code, "Failed to find old_rh"
    code = code.replace(old_rh, new_rh)

    # 5. Update Student Report sResults gathering & card rendering
    old_sr = '''                          // Strictly gather all registered programs for this student
                          const registeredProgs = getStudentRegisteredPrograms(matchedStudent.id);

                          const sResults = [];
                          registeredProgs.forEach(p => {
                            let progResult = null;
                            if (p.isGroup) {
                              const groupObj = (groupRegistrations || []).find(g => String(g.id) === String(p.groupId));
                              const candidateResults = resultsList.filter(r => isProgPublished(r.progid) && isResultMatchForGroup(r, groupObj || { program_id: p.id, group_name: p.groupName, team_id: matchedStudent.teamid }, p));
                              candidateResults.sort((a, b) => {
                                const rankA = getPlaceRank(a.place);
                                const rankB = getPlaceRank(b.place);
                                if (rankA !== rankB) return rankA - rankB;
                                return (Number(b.points) || 0) - (Number(a.points) || 0);
                              });
                              progResult = candidateResults[0] || null;
                            } else {
                              const candidateResults = resultsList.filter(r => isProgPublished(r.progid) && isResultMatchForSingleStudent(r, matchedStudent, p, categories));
                              candidateResults.sort((a, b) => {
                                const rankA = getPlaceRank(a.place);
                                const rankB = getPlaceRank(b.place);
                                if (rankA !== rankB) return rankA - rankB;
                                return (Number(b.points) || 0) - (Number(a.points) || 0);
                              });
                              progResult = candidateResults[0] || null;
                            }

                            sResults.push({
                              progid: p.id,
                              progname: `${p.code ? p.code + ' – ' : ''}${p.name}`,
                              catname: catObj ? catObj.name : (p.catname || '-'),
                              place: progResult ? (progResult.place || 'No Place') : 'No Place',
                              grade: progResult ? (progResult.grade || '-') : '-',
                              points: progResult ? Number(progResult.points || 0) : 0,
                              hasResult: !!progResult && (progResult.place !== 'No Place' && progResult.place !== '-' && progResult.place !== '0' || progResult.grade !== '-')
                            });
                          });'''

    new_sr = '''                          // Strictly gather all registered programs for this student
                          const registeredProgs = getStudentRegisteredPrograms(matchedStudent.id);

                          // Also find any direct results in resultsList for this student (in case registration was missing/unmatched)
                          const extraResultsForStudent = (resultsList || []).filter(r => {
                            if (loginRole !== 'ADMIN' && !isProgPublished(r.progid)) return false;
                            return isResultMatchForSingleStudent(r, matchedStudent, null, categories);
                          });

                          const combinedProgs = [...registeredProgs];
                          extraResultsForStudent.forEach(er => {
                            const erPid = String(er.progid || '').trim();
                            const alreadyIncluded = combinedProgs.some(p => String(p.id).trim() === erPid || (p.code && String(p.code).trim() === erPid));
                            if (!alreadyIncluded) {
                              const foundProg = (programs || []).find(pr => String(pr.id).trim() === erPid || (pr.code && String(pr.code).trim() === erPid));
                              if (foundProg) {
                                combinedProgs.push(foundProg);
                              } else {
                                combinedProgs.push({
                                  id: er.progid,
                                  name: er.progname || `Program ${er.progid}`,
                                  code: er.progid,
                                  type: er.progtype || 'SINGLE'
                                });
                              }
                            }
                          });

                          const sResults = [];
                          combinedProgs.forEach(p => {
                            let progResult = null;
                            if (p.isGroup) {
                              const groupObj = (groupRegistrations || []).find(g => String(g.id) === String(p.groupId));
                              const candidateResults = resultsList.filter(r => (loginRole === 'ADMIN' || isProgPublished(r.progid)) && isResultMatchForGroup(r, groupObj || { program_id: p.id, group_name: p.groupName, team_id: matchedStudent.teamid }, p));
                              candidateResults.sort((a, b) => {
                                const rankA = getPlaceRank(a.place);
                                const rankB = getPlaceRank(b.place);
                                if (rankA !== rankB) return rankA - rankB;
                                return (Number(b.points) || 0) - (Number(a.points) || 0);
                              });
                              progResult = candidateResults[0] || null;
                            } else {
                              const candidateResults = resultsList.filter(r => (loginRole === 'ADMIN' || isProgPublished(r.progid)) && isResultMatchForSingleStudent(r, matchedStudent, p, categories));
                              candidateResults.sort((a, b) => {
                                const rankA = getPlaceRank(a.place);
                                const rankB = getPlaceRank(b.place);
                                if (rankA !== rankB) return rankA - rankB;
                                return (Number(b.points) || 0) - (Number(a.points) || 0);
                              });
                              progResult = candidateResults[0] || null;
                            }

                            const hasRes = !!progResult && (
                              (progResult.place && progResult.place !== 'No Place' && progResult.place !== '-' && progResult.place !== '0') ||
                              (progResult.grade && progResult.grade !== '-' && progResult.grade !== 'No')
                            );

                            sResults.push({
                              progid: p.id,
                              progname: `${p.code ? p.code + ' – ' : ''}${p.name}`,
                              catname: catObj ? catObj.name : (p.catname || '-'),
                              place: progResult ? (progResult.place || 'No Place') : 'No Place',
                              grade: progResult ? (progResult.grade || '-') : '-',
                              points: progResult ? Number(progResult.points || 0) : 0,
                              hasResult: hasRes
                            });
                          });'''

    assert old_sr in code, "Failed to find old_sr"
    code = code.replace(old_sr, new_sr)

    # 6. Update Student Report Cards to handle pending results & medal correctly
    old_cards = '''                                  {sResults.map((r, idx) => {
                                    const medal = r.place === 'First' ? '🥇' : r.place === 'Second' ? '🥈' : r.place === 'Third' ? '🥉' : '🏅';
                                    const bg = r.place === 'First' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : r.place === 'Second' ? 'linear-gradient(135deg, #94a3b8, #64748b)' : r.place === 'Third' ? 'linear-gradient(135deg, #f97316, #c2410c)' : 'linear-gradient(135deg, #6366f1, #4f46e5)';
                                    return (
                                      <div key={idx} style={{ background: bg, borderRadius: '14px', padding: '16px', color: 'white', boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{medal}</div>
                                        <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>{r.progname || r.progName}</div>
                                        <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px' }}>{r.catname || r.catName}</div>
                                        <div style={{ fontSize: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '3px 8px', display: 'inline-block', fontWeight: '700', marginBottom: '10px' }}>{r.place} | {(r.grade === '-' || r.grade === 'No') ? 'No Grade' : r.grade} | {r.points} Pts</div>
                                        <button onClick={() => generateCertificate(r)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)', border: '1.5px solid rgba(255,255,255,0.35)', color: 'white', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', transition: 'all 0.2s ease' }}>
                                          📜 Certificate
                                        </button>
                                      </div>
                                    );
                                  })}'''

    new_cards = '''                                  {sResults.map((r, idx) => {
                                    const pLow = (r.place || '').toLowerCase();
                                    const is1st = pLow === 'first' || pLow === '1' || pLow === '1st';
                                    const is2nd = pLow === 'second' || pLow === '2' || pLow === '2nd';
                                    const is3rd = pLow === 'third' || pLow === '3' || pLow === '3rd';
                                    const medal = is1st ? '🥇' : is2nd ? '🥈' : is3rd ? '🥉' : (r.hasResult ? '🏅' : '⏳');
                                    const bg = is1st ? 'linear-gradient(135deg, #f59e0b, #d97706)' : is2nd ? 'linear-gradient(135deg, #94a3b8, #64748b)' : is3rd ? 'linear-gradient(135deg, #f97316, #c2410c)' : (r.hasResult ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #64748b, #475569)');
                                    return (
                                      <div key={idx} style={{ background: bg, borderRadius: '14px', padding: '16px', color: 'white', boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{medal}</div>
                                        <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>{r.progname || r.progName}</div>
                                        <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px' }}>{r.catname || r.catName}</div>
                                        <div style={{ fontSize: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '3px 8px', display: 'inline-block', fontWeight: '700', marginBottom: '10px' }}>
                                          {r.place} | {(r.grade === '-' || r.grade === 'No' || !r.grade) ? 'No Grade' : r.grade} | {r.points} Pts
                                        </div>
                                        {r.hasResult ? (
                                          <button onClick={() => generateCertificate(r)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)', border: '1.5px solid rgba(255,255,255,0.35)', color: 'white', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', transition: 'all 0.2s ease' }}>
                                            📜 Certificate
                                          </button>
                                        ) : (
                                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', textAlign: 'center', padding: '6px' }}>
                                            {lang === 'EN' ? 'No Prize / Result Pending' : 'ഫലം വന്നിട്ടില്ല'}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}'''

    assert old_cards in code, "Failed to find old_cards"
    code = code.replace(old_cards, new_cards)

    # 7. Update Certificate Preview Modal logic
    old_cert = '''        const placeRaw = (result.place || '').toString().toLowerCase();
        const prizeText = placeRaw === 'first' || placeRaw === '1' ? 'FIRST PRIZE' : placeRaw === 'second' || placeRaw === '2' ? 'SECOND PRIZE' : placeRaw === 'third' || placeRaw === '3' ? 'THIRD PRIZE' : (result.place ? (result.place + ' PRIZE').toUpperCase() : 'PRIZE');

        const prizeNum = placeRaw === 'first' || placeRaw === '1' ? '1' : placeRaw === 'second' || placeRaw === '2' ? '2' : '3';
        const prizeOrd = placeRaw === 'first' || placeRaw === '1' ? 'ST' : placeRaw === 'second' || placeRaw === '2' ? 'ND' : 'RD';
        const prizeMedalColor = placeRaw === 'first' || placeRaw === '1' ? '#D4A017' : placeRaw === 'second' || placeRaw === '2' ? '#A8A9AD' : '#CD7F32';
        const prizeRibbonColor = placeRaw === 'first' || placeRaw === '1' ? '#064e3b' : placeRaw === 'second' || placeRaw === '2' ? '#1e3a8a' : '#7c2d12';'''

    new_cert = '''        const pLower = (result.place || '').toString().toLowerCase().trim();
        const isFirst = pLower === 'first' || pLower === '1' || pLower === '1st' || pLower.includes('first');
        const isSecond = pLower === 'second' || pLower === '2' || pLower === '2nd' || pLower.includes('second');
        const isThird = pLower === 'third' || pLower === '3' || pLower === '3rd' || pLower.includes('third');

        const prizeText = isFirst
          ? 'FIRST PRIZE'
          : isSecond
          ? 'SECOND PRIZE'
          : isThird
          ? 'THIRD PRIZE'
          : (result.grade && result.grade !== '-' && result.grade !== 'No'
            ? `${result.grade.toUpperCase()} GRADE`
            : (result.place && !result.place.toLowerCase().includes('no') && result.place !== '-'
              ? `${result.place.toUpperCase()} PRIZE`
              : 'PARTICIPATION'));

        const prizeNum = isFirst ? '1' : isSecond ? '2' : isThird ? '3' : '★';
        const prizeOrd = isFirst ? 'ST' : isSecond ? 'ND' : isThird ? 'RD' : '';
        const prizeMedalColor = isFirst ? '#D4A017' : isSecond ? '#A8A9AD' : isThird ? '#CD7F32' : '#059669';
        const prizeRibbonColor = isFirst ? '#064e3b' : isSecond ? '#1e3a8a' : isThird ? '#7c2d12' : '#047857';'''

    assert old_cert in code, "Failed to find old_cert"
    code = code.replace(old_cert, new_cert)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)

    print("All fixes applied successfully to src/App.js!")

if __name__ == '__main__':
    main()

import re

with open(r'd:\MILAD UN NABI\milad\src\App.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update StudentIdCard on-screen preview size to 7.5cm × 9.8cm
old_studentidcard_style = """      style={{
        width: '283px',
        height: '389px',"""

new_studentidcard_style = """      style={{
        width: '283px',
        height: '370px',"""

if old_studentidcard_style in code:
    code = code.replace(old_studentidcard_style, new_studentidcard_style, 1)
    print("Updated StudentIdCard on-screen dimensions!")

# 2. Update handleDownloadPDF
old_func_signature = """  // Generate PDF of multiple ID cards — pure HTML approach (works on all devices including mobile)
  const handleDownloadPDF = useCallback(async (filteredStudentsList, paperSize = 'A4') => {"""

start_idx = code.find(old_func_signature)
if start_idx == -1:
    print("Error: Could not find handleDownloadPDF")
    exit(1)

end_signature = "  return (\n    <div className=\"main-container\">"
end_idx = code.find(end_signature, start_idx)
if end_idx == -1:
    print("Error: Could not find end of handleDownloadPDF")
    exit(1)

new_handle_download_pdf = """  // Generate PDF of multiple ID cards — pure HTML approach (works on all devices including mobile)
  const handleDownloadPDF = useCallback(async (filteredStudentsList, paperSize = 'A4') => {
    if (filteredStudentsList.length === 0) { alert(t('alertNoIdCards')); return; }
    setProfilePdfGenerating(true);
    try {
      const isA3 = paperSize === 'A3';
      // A4 Landscape: 3 columns × 2 rows = 6 cards per page (297mm × 210mm), card size: 75mm × 98mm
      // A3 Landscape: 5 columns × 2 rows = 10 cards per page (420mm × 297mm), card size: 75mm × 98mm
      const cols = isA3 ? 5 : 3;
      const rows = 2;
      const cardsPerPage = cols * rows;
      const pageSize = isA3 ? 'A3 landscape' : 'A4 landscape';

      // Build QR data URLs for all students first
      const appUrl = window.location.origin;
      const qrMap = {};
      for (const s of filteredStudentsList) {
        try {
          const qrUrl = `${appUrl}/?qr=${loggedInMadrasa.regNumber}_${s.id}`;
          qrMap[s.id] = await QRCode.toDataURL(qrUrl, { width: 140, margin: 1, color: { dark: '#064e3b', light: '#ffffff' } });
        } catch (e) { qrMap[s.id] = ''; }
      }

      // Build card HTML for each student (75mm × 98mm with guaranteed 4mm gap between rows and 5mm top/bottom cutting margins)
      const cardHtmlList = filteredStudentsList.map(s => {
        const sTeamId = s.teamid || s.teamId || '';
        const sCatId = s.catid || s.catId || '';
        const teamObj = teams.find(t => String(t.id) === String(sTeamId));
        const catObj = categories.find(c => String(c.id) === String(sCatId));
        const hasPhoto = s.photo_url && s.photo_status === 'approved';
        const isBoy = String(s.gender || '').toUpperCase() === 'BOY';
        const color = isBoy ? '#1e40af' : '#be185d';
        const bg = isBoy ? 'linear-gradient(135deg,#dbeafe,#93c5fd)' : 'linear-gradient(135deg,#fce7f3,#f9a8d4)';
        const photoHtml = hasPhoto
          ? `<img src="${s.photo_url}" crossorigin="anonymous" style="width:100%;height:100%;object-fit:cover;" />`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${bg};">
              <svg viewBox="0 0 24 24" style="width:55%;height:55%;fill:none;stroke:${color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
             </div>`;
        const qrHtml = qrMap[s.id] ? `<img src="${qrMap[s.id]}" style="width:50px;height:50px;display:block;" />` : '';
        // Dynamic font size based on name length
        const nameStr = s.name || '';
        const nameLen = nameStr.length;
        const nameFontSize = nameLen <= 10 ? '11px' : nameLen <= 16 ? '9.5px' : nameLen <= 22 ? '8px' : '7px';
        return `<div class="id-card">
          <div class="stripe"></div>
          <div class="card-header">
            ${eventName ? `<div class="event-name">${eventName}</div>` : ''}
            <div class="madrasa-name">${loggedInMadrasa ? loggedInMadrasa.name : ''}</div>
            <div class="madrasa-meta">${loggedInMadrasa ? loggedInMadrasa.regNumber : ''} | ${loggedInMadrasa ? loggedInMadrasa.place : ''}</div>
          </div>
          <div class="card-top">
            <div class="photo-box">${photoHtml}</div>
            <div class="name-box">
              <div class="student-name" style="font-size:${nameFontSize}">${nameStr}</div>
              <div class="reg-badge">
                <div class="reg-label">Register No.</div>
                <div class="reg-num">${s.regno || s.regNo || ''}</div>
              </div>
            </div>
          </div>
          <div class="details">
            <div class="detail-row detail-row-group"><span class="dl">👥 Group</span><span class="dv">${teamObj ? teamObj.name : 'N/A'}</span></div>
            <div class="detail-row detail-row-cat"><span class="dl dl-cat">🏷️ Category</span><span class="dv">${catObj ? catObj.name : 'N/A'}</span></div>
            <div class="detail-row ${isBoy ? 'detail-row-gen-b' : 'detail-row-gen-g'}"><span class="dl ${isBoy ? 'dl-boy' : 'dl-girl'}">${isBoy ? '👦' : '👧'} Gender</span><span class="dv">${isBoy ? 'Boy' : 'Girl'}</span></div>
          </div>
          <div class="qr-section"><div class="qr-section-inner"><div class="qr-scan-label">Scan QR</div>${qrHtml}</div></div>
          <div class="card-footer"><span class="footer-text">MILAD FEST • ID CARD</span></div>
        </div>`;
      });

      // Group cards into pages (6 cards per page on A4 Landscape, 10 on A3 Landscape)
      const pages = [];
      for (let i = 0; i < cardHtmlList.length; i += cardsPerPage) {
        pages.push(cardHtmlList.slice(i, i + cardsPerPage));
      }

      const pagesHtml = pages.map((pageCards, pageIndex) =>
        `<div class="page"><div class="card-grid">${pageCards.join('')}</div></div>`
      ).join('');

      const madrasaLabel = loggedInMadrasa ? loggedInMadrasa.name.replace(/\\s+/g, '_') : 'export';
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ID Cards - ${madrasaLabel} - ${paperSize}</title>
<style>
  @page {
    size: ${pageSize};
    margin: 0mm;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body {
    width: 100%;
    height: 100%;
    background: #ffffff;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .page {
    width: ${isA3 ? '420mm' : '297mm'};
    height: ${isA3 ? '297mm' : '210mm'};
    min-height: ${isA3 ? '297mm' : '210mm'};
    max-height: ${isA3 ? '297mm' : '210mm'};
    page-break-after: always;
    break-after: page;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    padding: 5mm 0;
    margin: 0 auto;
    overflow: hidden;
    background: #ffffff;
  }
  .page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(${cols}, 75mm);
    grid-template-rows: repeat(${rows}, 98mm);
    gap: ${isA3 ? '6mm 8mm' : '4mm 6mm'};
    justify-content: center;
    align-content: center;
  }
  .id-card {
    width: 75mm;
    height: 98mm;
    border: 2px solid #16a34a;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: linear-gradient(160deg, #ffffff 0%, #f0fdf4 40%, #ecfdf5 70%, #f0fff4 100%);
    position: relative;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .stripe {
    height: 3px;
    background: linear-gradient(90deg,#15803d,#fbbf24,#4ade80,#15803d);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }
  .card-header {
    background: linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%);
    padding: 3px 5px 2px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 1;
    border-bottom: 2px solid #fbbf24;
  }
  .event-name {
    font-size: 5.5px;
    font-weight: 800;
    color: #fbbf24;
    text-align: center;
    letter-spacing: 1px;
    text-transform: uppercase;
    line-height: 1.2;
    margin-bottom: 2px;
    background: rgba(251,191,36,0.15);
    border-radius: 3px;
    padding: 1px 6px;
    border: 1px solid rgba(251,191,36,0.4);
    width: 100%;
    box-sizing: border-box;
    text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  }
  .madrasa-name {
    font-size: 7.5px;
    font-weight: 900;
    color: #ffffff;
    text-align: center;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    line-height: 1.2;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    margin-bottom: 1px;
  }
  .madrasa-meta {
    font-size: 5px;
    font-weight: 700;
    color: #fef08a;
    text-align: center;
    letter-spacing: 0.2px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  }
  .card-top {
    flex-shrink: 0;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    padding: 3px 5px;
    background: rgba(21,128,61,0.06);
    border-bottom: 2px solid #fbbf24;
    gap: 5px;
    position: relative;
    z-index: 1;
  }
  .photo-box {
    flex-shrink: 0;
    width: 76px;
    height: 90px;
    border-radius: 6px;
    border: 1.5px solid #16a34a;
    overflow: hidden;
    background: #f0fdf4;
    box-shadow: 0 2px 8px rgba(22,163,74,0.25);
    align-self: center;
  }
  .name-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-width: 0;
    width: 100%;
  }
  .student-name {
    font-weight: 900;
    color: #14532d;
    text-transform: uppercase;
    line-height: 1.2;
    word-break: break-word;
    text-align: center;
    width: 100%;
  }
  .reg-badge {
    background: linear-gradient(135deg,#fbbf24,#f59e0b);
    border-radius: 5px;
    padding: 3px 5px;
    text-align: center;
    box-shadow: 0 2px 6px rgba(251,191,36,0.4);
    border: 1.5px solid #d97706;
    width: 100%;
    box-sizing: border-box;
  }
  .reg-label {
    font-size: 5px;
    font-weight: 800;
    color: #78350f;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 1px;
  }
  .reg-num {
    font-size: 18px;
    font-weight: 900;
    color: #1c1917;
    letter-spacing: 1px;
    line-height: 1;
    text-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }
  .details {
    flex-shrink: 0;
    padding: 3px 5px 2px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    position: relative;
    z-index: 1;
  }
  .detail-row {
    border-radius: 4px;
    padding: 2px 5px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .detail-row-group { background: rgba(22,163,74,0.1); border: 1px solid rgba(22,163,74,0.35); border-left: 3px solid #16a34a; }
  .detail-row-cat   { background: rgba(251,191,36,0.12); border: 1px solid rgba(217,119,6,0.35); border-left: 3px solid #f59e0b; }
  .detail-row-gen-b { background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.4); border-left: 3px solid #60a5fa; }
  .detail-row-gen-g { background: rgba(244,114,182,0.1); border: 1px solid rgba(244,114,182,0.4); border-left: 3px solid #f472b6; }
  .dl { font-size: 5px; font-weight: 900; text-transform: uppercase; color: #15803d; letter-spacing: 0.8px; }
  .dl-cat { color: #b45309; }
  .dl-boy { color: #2563eb; }
  .dl-girl { color: #be185d; }
  .dv { font-weight: 800; color: #14532d; font-size: 6.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .qr-section {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2px 0;
    position: relative;
    z-index: 1;
  }
  .qr-section-inner {
    background: rgba(255,255,255,0.97);
    border: 1.5px solid #fbbf24;
    border-radius: 5px;
    padding: 2px 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .qr-scan-label {
    font-size: 4.5px;
    font-weight: 900;
    color: #166534;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .card-footer {
    background: linear-gradient(135deg, #166534 0%, #15803d 100%);
    border-top: 2px solid #fbbf24;
    padding: 2.5px 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }
  .footer-text {
    font-size: 5px;
    color: #fef08a;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .print-floating-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #064e3b, #0f766e);
    color: #ffffff;
    border: none;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.25);
    z-index: 99999;
  }
  @media print {
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<button class="print-floating-btn no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
${pagesHtml}
<script>
  window.addEventListener('load', function() {
    setTimeout(function() { window.print(); }, 800);
  });
</script>
</body>
</html>`;

      // Open in new tab for print/save as PDF
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // Try share API on mobile first
      const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && navigator.share && navigator.canShare) {
        const htmlFile = new File([blob], `ID_Cards_${madrasaLabel}_${paperSize}.html`, { type: 'text/html' });
        if (navigator.canShare({ files: [htmlFile] })) {
          try {
            await navigator.share({ files: [htmlFile], title: `ID Cards - ${madrasaLabel}` });
            URL.revokeObjectURL(url);
            setProfilePdfGenerating(false);
            return;
          } catch (e) { /* fall through */ }
        }
      }

      const win = window.open(url, '_blank');
      if (!win) {
        // Popup blocked — fallback download
        const a = document.createElement('a');
        a.href = url;
        a.download = `ID_Cards_${madrasaLabel}_${paperSize}.html`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 15000);

    } catch (err) {
      alert(t('alertPDFGenerationFailed') + err.message);
    }
    setProfilePdfGenerating(false);
  }, [teams, categories, loggedInMadrasa, eventName, t]);
"""

code = code[:start_idx] + new_handle_download_pdf + "\n" + code[end_idx:]

# 3. Update the UI paper size label
new_ui_label = "{pdfPaperSize === 'A4' ? '6 cards/page (3×2 Landscape) • 7.5cm × 9.8cm' : '10 cards/page (5×2 Landscape) • 7.5cm × 9.8cm'}"
code = re.sub(r"\{pdfPaperSize === 'A4' \? '[^']+' : '[^']+'\} • [^\n<]+", new_ui_label, code)

with open(r'd:\MILAD UN NABI\milad\src\App.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Applied gap and cutting margin fixes successfully!")

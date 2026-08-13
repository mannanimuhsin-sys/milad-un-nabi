import { supabase } from './supabaseClient';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import './App.css';
import translations from './translations';

// Inline component to generate and display QR code asynchronously
function StudentQrCode({ madrasaReg, studentId, size = 70 }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    let active = true;
    const generate = async () => {
      const appUrl = window.location.origin;
      const scanUrl = `${appUrl}/?qr=${madrasaReg}_${studentId}`;
      try {
        const url = await QRCode.toDataURL(scanUrl, {
          width: size * 2,
          margin: 1,
          color: { dark: '#064e3b', light: '#ffffff' }
        });
        if (active) setQrUrl(url);
      } catch (err) {
        console.error("QR generation failed: ", err);
      }
    };
    if (madrasaReg && studentId) {
      generate();
    }
    return () => { active = false; };
  }, [madrasaReg, studentId, size]);

  if (!qrUrl) return <div className="qr-placeholder" style={{ width: `${size}px`, height: `${size}px`, background: '#f1f5f9', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8' }}>Generating...</div>;
  return <img src={qrUrl} alt="QR Code" style={{ width: `${size}px`, height: `${size}px`, display: 'block', margin: '0 auto' }} />;
}

// Reusable ID Card Component (Exact printed width 7.5cm × height 10cm at 96dpi)
function StudentIdCard({ student, loggedInMadrasa, teams, categories, cardRef, className = '' }) {
  const s = student;
  const sTeamId = s.teamid || s.teamId || '';
  const sCatId = s.catid || s.catId || '';
  const teamObj = teams.find(t => String(t.id) === String(sTeamId));
  const catObj = categories.find(c => String(c.id) === String(sCatId));

  const hasPhoto = s.photo_url && s.photo_status && s.photo_status === 'approved';
  const isBoy = String(s.gender).toUpperCase() === 'BOY';

  let photoContent;
  if (hasPhoto) {
    photoContent = <img src={s.photo_url} crossOrigin="anonymous" alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  } else {
    const color = isBoy ? '#1e40af' : '#be185d';
    const bg = isBoy ? 'linear-gradient(135deg,#dbeafe,#93c5fd)' : 'linear-gradient(135deg,#fce7f3,#f9a8d4)';
    photoContent = (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
        <svg viewBox="0 0 24 24" style={{ width: '55%', height: '55%', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className={`id-card ${className}`}
      style={{
        width: '283px',
        height: '435px',
        background: 'linear-gradient(160deg, #ffffff 0%, #f0fdf4 40%, #ecfdf5 70%, #f0fff4 100%)',
        borderRadius: '0',
        overflow: 'hidden',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        border: '2px solid #16a34a',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        margin: '0 auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
      }}
    >
      {/* Decorative geometric overlays — light */}
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(74,222,128,0.12)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '30px', left: '-35px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(251,191,36,0.09)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '50%', right: '-20px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(74,222,128,0.07)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Top gradient stripe */}
      <div style={{ height: '5px', background: 'linear-gradient(90deg,#15803d,#fbbf24,#4ade80,#15803d)', flexShrink: 0, position: 'relative', zIndex: 1 }} />

      {/* Header: Madrasa name + RegNo + Place */}
      <div style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)', padding: '5px 8px 4px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, borderBottom: '2px solid #fbbf24' }}>
        <div style={{ fontSize: '9.5px', fontWeight: '900', color: '#fef08a', textAlign: 'center', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1.3, marginBottom: '2px', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          {loggedInMadrasa ? loggedInMadrasa.name : ''}
        </div>
        <div style={{ fontSize: '6.5px', color: '#bbf7d0', textAlign: 'center', lineHeight: 1.3, opacity: 0.9 }}>
          {loggedInMadrasa ? loggedInMadrasa.regNumber : ''} | {loggedInMadrasa ? loggedInMadrasa.place : ''}
        </div>
      </div>

      {/* Photo LEFT + Student Name & RegNo RIGHT */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '6px 8px', background: 'rgba(21,128,61,0.06)', borderBottom: '2px solid #fbbf24', gap: '8px', position: 'relative', zIndex: 1 }}>
        {/* Photo */}
        <div style={{ flexShrink: 0, width: '108px', height: '126px', borderRadius: '8px', border: '2px solid #16a34a', overflow: 'hidden', background: '#f0fdf4', boxShadow: '0 3px 12px rgba(22,163,74,0.25)' }}>
          {photoContent}
        </div>

        {/* Name + RegNo */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', minWidth: 0, width: '100%' }}>
          {/* Student Name */}
          <div style={{ fontSize: '13px', fontWeight: '900', color: '#14532d', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.2, wordBreak: 'break-word', textAlign: 'center', width: '100%', marginBottom: '1px', textShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {s.name}
          </div>
          {/* Highlighted Reg No badge */}
          <div style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: '7px', padding: '4px 8px', boxShadow: '0 3px 10px rgba(251,191,36,0.55)', width: '100%', maxWidth: '105px', margin: '0 auto', boxSizing: 'border-box', textAlign: 'center', border: '1.5px solid #d97706' }}>
            <div style={{ fontSize: '7px', fontWeight: '800', color: '#78350f', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1px' }}>
              Register No.
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#1c1917', letterSpacing: '1.5px', lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
              {s.regno || s.regNo || ''}
            </div>
          </div>
        </div>
      </div>

      {/* Details: Group / Category / Gender */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px 10px 4px', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}>
        {/* Group */}
        <div style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.1) 0%, rgba(22,163,74,0.04) 100%)', border: '1px solid rgba(22,163,74,0.35)', borderLeft: '4px solid #16a34a', borderRadius: '5px', padding: '5px 8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '7.5px', fontWeight: '900', textTransform: 'uppercase', color: '#15803d', letterSpacing: '1px' }}>👥 Group</span>
          <span style={{ fontWeight: '800', color: '#14532d', fontSize: '10.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {teamObj ? teamObj.name : 'N/A'}
          </span>
        </div>
        {/* Category */}
        <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 100%)', border: '1px solid rgba(217,119,6,0.35)', borderLeft: '4px solid #f59e0b', borderRadius: '5px', padding: '5px 8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '7.5px', fontWeight: '900', textTransform: 'uppercase', color: '#b45309', letterSpacing: '1px' }}>🏷️ Category</span>
          <span style={{ fontWeight: '800', color: '#14532d', fontSize: '10.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {catObj ? catObj.name : 'N/A'}
          </span>
        </div>
        {/* Gender */}
        <div style={{ background: `linear-gradient(135deg, ${isBoy ? 'rgba(96,165,250,0.1)' : 'rgba(244,114,182,0.1)'} 0%, rgba(255,255,255,0) 100%)`, border: `1px solid ${isBoy ? 'rgba(96,165,250,0.4)' : 'rgba(244,114,182,0.4)'}`, borderLeft: `4px solid ${isBoy ? '#60a5fa' : '#f472b6'}`, borderRadius: '5px', padding: '5px 8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '7.5px', fontWeight: '900', textTransform: 'uppercase', color: isBoy ? '#2563eb' : '#be185d', letterSpacing: '1px' }}>{isBoy ? '👦' : '👧'} Gender</span>
          <span style={{ fontWeight: '800', color: '#14532d', fontSize: '10.5px' }}>
            {s.gender === 'BOY' ? 'Boy' : 'Girl'}
          </span>
        </div>
      </div>

      {/* QR Code — centered with bordered panel */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'rgba(255,255,255,0.96)', border: '2px solid #fbbf24', borderRadius: '8px', padding: '5px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', boxShadow: '0 3px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(22,163,74,0.15)' }}>
          <div style={{ fontSize: '6px', fontWeight: '900', color: '#166534', textTransform: 'uppercase', letterSpacing: '1.5px' }}>🔍 Scan QR</div>
          <StudentQrCode madrasaReg={loggedInMadrasa?.regNumber} studentId={s.id} size={62} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)', padding: '8px 8px', textAlign: 'center', flexShrink: 0, position: 'relative', zIndex: 1, borderTop: '2px solid #fbbf24' }}>
        <span style={{ fontSize: '8.5px', color: '#fef08a', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          MILAD FEST • ID CARD
        </span>
      </div>
    </div>
  );
}

// Universal download helper to handle web and native mobile sharing
const downloadFile = async (dataUrlOrBlob, filename, mimeType = 'image/png') => {
  try {
    let blob;
    if (typeof dataUrlOrBlob === 'string' && dataUrlOrBlob.startsWith('data:')) {
      const arr = dataUrlOrBlob.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      blob = dataUrlOrBlob;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: blob.type || mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
          text: `Download ${filename}`
        });
        return;
      }
    }

    // Fallback to traditional link download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Download/Share failed:', error);
      alert('Failed to save file: ' + error.message);
    }
  }
};

// Universal Mobile-Safe Print & PDF Viewer helper supporting Mobile/Android Chrome, iOS Safari, Tablets, and Desktop browsers
const openPrintDocument = (htmlContent, title = 'Document') => {
  // Inject Universal Perfect PDF Print CSS (prevents half-split rows, repeats table headers on page breaks, and enforces crisp borders & colors)
  const injectPrintCss = (html) => {
    if (!html) return html;
    const printStyles = `<style id="universal-print-engine-styles">
      @media print {
        html, body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        table {
          border-collapse: collapse !important;
          width: 100% !important;
          overflow: visible !important;
        }
        thead {
          display: table-header-group !important;
        }
        tfoot {
          display: table-footer-group !important;
        }
        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        th, td {
          border-color: #94a3b8 !important;
        }
        .page-break {
          page-break-after: always !important;
          break-after: page !important;
        }
      }
    </style>`;
    if (html.includes('</head>')) {
      return html.replace('</head>', `${printStyles}</head>`);
    }
    return printStyles + html;
  };

  htmlContent = injectPrintCss(htmlContent);
  let win = null;
  try {
    // Synchronous window.open prevents popup blockers on mobile browsers
    win = window.open('', '_blank');
  } catch (e) {
    console.warn("window.open failed:", e);
  }

  if (win && !win.closed) {
    try {
      win.document.open();
      win.document.write(htmlContent);
      win.document.close();
      try { win.document.title = title; } catch(e){}

      const triggerPrint = () => {
        try {
          win.focus();
          if (win.document.fonts && win.document.fonts.ready) {
            win.document.fonts.ready.then(() => {
              setTimeout(() => { try { win.print(); } catch(e){} }, 450);
            });
          } else {
            setTimeout(() => { try { win.print(); } catch(e){} }, 650);
          }
        } catch(e) {}
      };

      if (win.document.readyState === 'complete') {
        triggerPrint();
      } else {
        win.onload = triggerPrint;
        setTimeout(triggerPrint, 1200);
      }
      return;
    } catch(err) {
      console.error("Failed writing to opened print window:", err);
    }
  }

  // Universal Fallback for mobile popup blockers or in-app WebViews (Instagram/WhatsApp/Facebook browser):
  const existingModal = document.getElementById('mobile-print-modal-container');
  if (existingModal) existingModal.remove();

  const container = document.createElement('div');
  container.id = 'mobile-print-modal-container';
  container.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(15,23,42,0.96);display:flex;flex-direction:column;font-family:Segoe UI, system-ui, sans-serif;animation:cropperFadeIn 0.2s ease-out;';

  const topBar = document.createElement('div');
  topBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#1e293b;border-bottom:1px solid #334155;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
  topBar.innerHTML = `
    <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%;color:#f8fafc;">📄 ${title}</div>
    <div style="display:flex;gap:8px;">
      <button id="mobile-print-btn-action" style="background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;box-shadow:0 2px 8px rgba(22,163,74,0.4);">🖨️ Print / Save PDF</button>
      <button id="mobile-print-btn-close" style="background:#475569;color:#fff;border:none;padding:8px 12px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;">✕ Close</button>
    </div>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'flex:1;width:100%;height:100%;border:none;background:#ffffff;';

  container.appendChild(topBar);
  container.appendChild(iframe);
  document.body.appendChild(container);

  const doc = iframe.contentWindow.document || iframe.contentDocument;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  const doIframePrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch(e) {
      alert("Please tap 'Print / Save PDF' button to save or print.");
    }
  };

  const btnAction = document.getElementById('mobile-print-btn-action');
  const btnClose = document.getElementById('mobile-print-btn-close');
  if (btnAction) btnAction.onclick = doIframePrint;
  if (btnClose) btnClose.onclick = () => container.remove();

  setTimeout(doIframePrint, 800);
};

// Print HTML helper supporting Mobile/Android Chrome, iOS Safari, Tablets, and Desktop browsers
const printHtml = (htmlContent, title = 'Document') => {
  openPrintDocument(htmlContent, title);
};

// Helper to download HTML content as PDF via browser print-to-PDF
const downloadHtmlAsPdf = (htmlContent, filename = 'document.pdf') => {
  openPrintDocument(htmlContent, filename.replace('.pdf', ''));
};

const getTrollReaction = (rank, teamName, lang, offset = 0) => {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) + offset;

  if (rank === 1) {
    const reactions = lang === 'ML' ? [
      { emoji: '🤣', text: 'ബിരിയാണി ചെമ്പ് തുറക്കാൻ റെഡിയായിക്കോളൂ, ഞങ്ങൾ കപ്പും കൊണ്ടേ വരൂ! 🥘' },
      { emoji: '🤣', text: 'ഒരു കവിൾ സുലൈമാനി കുടിച്ച് ഞങ്ങൾ ഒന്നാം സ്ഥാനത്ത് തന്നെയുണ്ട്! 😎' },
      { emoji: '🤣', text: 'കാറ്റും കോലും വകവെക്കാതെ ഞങ്ങളുടെ യാത്ര മുന്നോട്ട് തന്നെയാണ്! 🏆' },
      { emoji: '🤣', text: 'ഞങ്ങളുടെ വേഗത കൂട്ടാൻ ഇനി വേറെ ഗിയർ നോക്കേണ്ടി വരും! ✨' },
      { emoji: '🤣', text: 'ആരും പേടിക്കണ്ട, കപ്പ് ഞങ്ങൾ സൂക്ഷിച്ചു വീട്ടിൽ എത്തിച്ചോളാം! 🏆' },
      { emoji: '🤣', text: 'മുന്നിൽ നിൽക്കുന്നതിന്റെ ആ ഒരു സന്തോഷം അനുഭവിച്ചു തന്നെ അറിയണം! ✨' },
      { emoji: '🤣', text: 'ഞങ്ങളെ പിന്തുടരുന്ന സുഹൃത്തുക്കൾക്ക് ചായ കുടിക്കാൻ വേണമെങ്കിൽ സമയം തരാം! 😜' },
      { emoji: '🤣', text: 'ക്ഷമയോടെ കാത്തിരിക്കൂ, ഞങ്ങളുടെ സ്കോർ ബോർഡ് ഇനിയും ഉയരും! 🔥' },
      { emoji: '🤣', text: 'വിജയത്തിന്റെ നല്ലൊരു പാതയിൽ ഞങ്ങൾ യാത്ര തുടങ്ങിക്കഴിഞ്ഞു! 🚀' },
      { emoji: '🤣', text: 'എല്ലാവരും ഒപ്പം വരാൻ നോക്കൂ, ഞങ്ങൾ ചെറുതായൊന്ന് വിശ്രമിക്കാം! 🏁' }
    ] : [
      { emoji: '🤣', text: 'Get the Biryani ready, we are coming home with the cup! 🏆' },
      { emoji: '🤣', text: 'Sipping our Sulaimani, relaxed right here at the first spot! 😎' },
      { emoji: '🤣', text: 'Unstoppable! We are sailing strong to the finish line! ⛵' },
      { emoji: '🤣', text: 'We might need to find a higher gear to go any faster! ✨' },
      { emoji: '🤣', text: 'Do not worry, we will deliver the cup safely to our cabinet! 🏡' },
      { emoji: '🤣', text: 'Leading the board is a joy you have to experience to believe! 🤩' },
      { emoji: '🤣', text: 'We can pause for a tea break if our friends behind need to catch up! ☕' },
      { emoji: '🤣', text: 'Stay tuned, our scoreboard is only going higher! 📈' },
      { emoji: '🤣', text: 'We are well on our way to a beautiful victory! 🛣️' },
      { emoji: '🤣', text: 'Try to catch up, everyone, we are taking a little breather! 🛌' }
    ];
    return reactions[index % reactions.length];
  } else {
    const reactions = lang === 'ML' ? [
      { emoji: '😭', text: 'മുന്നിലുള്ളവർ ഒന്ന് തിരിഞ്ഞു നോക്കിക്കോളൂ, ദാ തൊട്ടുപുറകിലുണ്ട്! 🏃‍♂️' },
      { emoji: '😭', text: 'ലീഡ് കണ്ട് സന്തോഷിക്കേണ്ട, കളി ഇനിയും ബാക്കിയുണ്ട് കൂട്ടുകാരേ! ⏳' },
      { emoji: '😭', text: 'പതുക്കെയാണെങ്കിലും ലക്ഷ്യത്തിലേക്ക് തന്നെയാണ് ഞങ്ങളുടെ യാത്ര! 🚶‍♂️' },
      { emoji: '😭', text: 'ഒരു ചെറിയ ഇടവേളക്ക് ശേഷം ഞങ്ങൾ ഇതാ വീണ്ടും വരുന്നു! 🚀' },
      { emoji: '😭', text: 'വിജയം അത്ര എളുപ്പത്തിൽ വിട്ടുകൊടുക്കാൻ ഞങ്ങൾക്ക് മനസ്സില്ല! 🏆' },
      { emoji: '😭', text: 'മത്സരം അവസാന നിമിഷം വരെ ആവേശകരമാക്കാൻ ഞങ്ങൾ റെഡിയാണ്! 🏁' },
      { emoji: '😭', text: 'നിങ്ങളുടെ ഒന്നാം സ്ഥാനം താത്കാലികം മാത്രമാണ് സുഹൃത്തുക്കളെ! 😎' },
      { emoji: '😭', text: 'തളരില്ല ഞങ്ങൾ, അവസാന നിമിഷം വരെ പോരാടും! 💪' },
      { emoji: '😭', text: 'ദാ എത്തിക്കഴിഞ്ഞു! ഇനി കപ്പിനായുള്ള ഫൈനൽ പോരാട്ടമാണ്! ⚡' },
      { emoji: '😭', text: 'മുന്നിലുള്ളവരുടെ നെഞ്ചിടിപ്പ് കൂട്ടാൻ ഞങ്ങൾ വേഗത കൂട്ടുന്നു! 💓' }
    ] : [
      { emoji: '😭', text: 'Those in front, look back! We are right on your heels! 👀' },
      { emoji: '😭', text: 'Do not celebrate the lead yet, the game is far from over! ⚡' },
      { emoji: '😭', text: 'Slowly but surely, our steps are headed straight for the target! 🎯' },
      { emoji: '😭', text: 'After a quick pause, we are building up speed again! 🔥' },
      { emoji: '😭', text: 'We are not going to hand over the trophy that easily! 💪' },
      { emoji: '😭', text: 'We are ready to keep this exciting right down to the final second! 💥' },
      { emoji: '😭', text: 'Your first place is only temporary, dear friends! ⏳' },
      { emoji: '😭', text: 'We never give up, we will fight until the last event! 🔥' },
      { emoji: '😭', text: 'We have arrived! The battle for the cup starts now! 🏆' },
      { emoji: '😭', text: 'We are speeding up to make those in front a little nervous! 🏃‍♂️' }
    ];
    return reactions[index % reactions.length];
  }
};

const compareRegNo = (a, b) => {
  const regA = a.regno || a.regNo || '';
  const regB = b.regno || b.regNo || '';
  return String(regA).localeCompare(String(regB), undefined, { numeric: true, sensitivity: 'base' });
};

const compareProgCode = (a, b) => {
  const codeA = a.code || '';
  const codeB = b.code || '';
  return String(codeA).localeCompare(String(codeB), undefined, { numeric: true, sensitivity: 'base' });
};

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('miladfest_lang') || 'EN');

  const toggleLanguage = () => {
    const nextLang = lang === 'EN' ? 'ML' : 'EN';
    setLang(nextLang);
    localStorage.setItem('miladfest_lang', nextLang);
  };

  const t = useCallback((key) => {
    if (!translations[lang]) return key;
    return translations[lang][key] || translations['EN'][key] || key;
  }, [lang]);

  const getFriendlyErrorMessage = useCallback((errorMsg) => {
    if (!errorMsg) return '';
    const m = String(errorMsg).toLowerCase();
    if (m.includes('schema cache') || m.includes('retrying')) {
      return lang === 'EN'
        ? 'Database is warming up. Please try again in a moment.'
        : 'ഡാറ്റാബേസ് കണക്റ്റിവിറ്റി പുതുക്കുകയാണ്. ദയവായി നിമിഷങ്ങൾക്കകം വീണ്ടും ശ്രമിക്കുക.';
    }
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('network')) {
      return lang === 'EN'
        ? 'Database connection failed!\n\nIf you are using Brave browser, an Ad-blocker, or Privacy extension, please DISABLE it for this site (turn off Shields / pause blocker) and try again. Also ensure you have a stable internet connection.'
        : 'ഡാറ്റാബേസ് കണക്ഷൻ പരാജയപ്പെട്ടു!\n\nനിങ്ങൾ Brave ബ്രൗസർ, Ad-blocker അല്ലെങ്കിൽ Privacy extension ഉപയോഗിക്കുന്നുണ്ടെങ്കിൽ, ദയവായി ഈ സൈറ്റിനായി അത് ഓഫ് ചെയ്യുക (Shields ഓഫ് ചെയ്യുക / ബ്ലോക്കർ പോസ് ചെയ്യുക). നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ മികച്ചതാണെന്നും ഉറപ്പുവരുത്തുക.';
    }
    return errorMsg;
  }, [lang]);

  // 🔄 Automatic query retry helper for transient Supabase schema cache / network warm-up errors
  const queryWithRetry = async (queryFn, retries = 3, delayMs = 600) => {
    let lastResult = null;
    for (let i = 0; i < retries; i++) {
      lastResult = await queryFn();
      const err = lastResult ? lastResult.error : null;
      if (!err) return lastResult; // Success!

      const msg = String(err.message || '').toLowerCase();
      const isTransient = msg.includes('schema cache') || msg.includes('retrying') || msg.includes('pgrst') || msg.includes('fetch failed') || msg.includes('network');
      if (!isTransient || i === retries - 1) {
        return lastResult;
      }
      await new Promise(res => setTimeout(res, delayMs));
    }
    return lastResult;
  };
  // 🛡️ Helper to safely set LocalStorage items without crashing on quota limits (5MB) - Supports function updators
  const safeSetLocalStorage = (key, value) => {
    let valStr = '';
    if (typeof value === 'function') {
      try {
        const currentRaw = localStorage.getItem(key) || sessionStorage.getItem(key);
        valStr = value(currentRaw);
      } catch (e) {
        valStr = '';
      }
    } else {
      valStr = typeof value === 'string' ? value : JSON.stringify(value);
    }
    try {
      localStorage.setItem(key, valStr);
      return true;
    } catch (e) {
      console.warn(`LocalStorage quota exceeded for key "${key}", attempting automatic storage cleanup...`, e);
      try {
        const keysToClean = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k !== 'miladfest_session' && k !== key) {
            if (k.startsWith('cached_regs_') || k.startsWith('photo_') || k.includes('temp')) {
              keysToClean.push(k);
            }
          }
        }
        keysToClean.forEach(k => { try { localStorage.removeItem(k); } catch(err){} });
        localStorage.setItem(key, valStr);
        return true;
      } catch (e2) {
        try { sessionStorage.setItem(key, valStr); } catch(e3){}
        return false;
      }
    }
  };

  // ── Persistent session: restore from localStorage or sessionStorage on render ──
  const savedSession = (() => {
    try {
      const raw = localStorage.getItem('miladfest_session') || sessionStorage.getItem('miladfest_session') || 'null';
      const s = JSON.parse(raw);
      if (s && s.madrasa) {
        s.madrasa.regNumber = String(s.madrasa.regNumber || s.madrasa.regnumber || s.madrasa.reg_number || '').trim();
      }
      return s;
    } catch { return null; }
  })();

  const [currentScreen, setCurrentScreen] = useState(savedSession ? 'DASHBOARD' : 'LOGIN');
  const [activeTab, setActiveTabState] = useState(() => {
    try { return sessionStorage.getItem('milad_active_tab') || 'SCOREBOARD'; } catch { return 'SCOREBOARD'; }
  });
  const setActiveTab = useCallback((tab) => {
    try { sessionStorage.setItem('milad_active_tab', tab); } catch(e){}
    setActiveTabState(tab);
  }, []);
  const [activeCertificate, setActiveCertificate] = useState(null);
  const [loginRole, setLoginRole] = useState(savedSession ? savedSession.role : '');
  const [secretKey, setSecretKey] = useState('');

  // Madrasa registration states (Supabase)
  const [loggedInMadrasa, setLoggedInMadrasa] = useState(savedSession ? savedSession.madrasa : null);
  const [regName, setRegName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regPlace, setRegPlace] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [viewPassword, setViewPassword] = useState('');

  // Login states
  const [loginRegNum, setLoginRegNum] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Projector Mode States
  const [isProjectorActive, setIsProjectorActive] = useState(false);
  const [projectorSlide, setProjectorSlide] = useState(0); // 0: Overall, 1: Category, 2: Recent Winners
  const [selectedRecentProgIndex, setSelectedRecentProgIndex] = useState(0);

  // Event / Program Name SFtates (stored in localStorage)
  const [eventName, setEventName] = useState('');
  const [eventYear, setEventYear] = useState('');
  const [eventNameInput, setEventNameInput] = useState('');
  const [eventYearInput, setEventYearInput] = useState('');
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  // 🔑 Ref mirrors — closures in polling intervals read these (never stale)
  const isEditingEventRef = useRef(false);

  // Sadar Muallim & Coordinator / Convener States
  const [convenerSadar, setConvenerSadar] = useState('');
  const [convenerSadarInput, setConvenerSadarInput] = useState('');
  const [isEditingConvenerSadar, setIsEditingConvenerSadar] = useState(false);
  const isEditingConvenerSadarRef = useRef(false);

  const [coordinatorConvener, setCoordinatorConvener] = useState('');
  const [coordinatorConvenerInput, setCoordinatorConvenerInput] = useState('');
  const [isEditingCoordinatorConvener, setIsEditingCoordinatorConvener] = useState(false);
  const isEditingCoordinatorConvenerRef = useRef(false);

  // Troll Mode States
  const [trollMode, setTrollMode] = useState(false);
  const [trollLang, setTrollLang] = useState('ML');
  const [trollOffsets, setTrollOffsets] = useState({});

  // PWA Install states
  // eslint-disable-next-line no-unused-vars
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const deferredPromptRef = useRef(null);
  const isFetchingRef = useRef(false);
  const fetchReqIdRef = useRef(0);
  const lastFetchRNumRef = useRef('');
  const [isInitialDataLoading, setIsInitialDataLoading] = useState(false);
  const loggedInMadrasaRef = useRef(loggedInMadrasa);
  useEffect(() => {
    loggedInMadrasaRef.current = loggedInMadrasa;
  }, [loggedInMadrasa]);

  // 🔄 Keep editing refs in sync with state so polling closures always see the live value
  useEffect(() => { isEditingEventRef.current = isEditingEvent; }, [isEditingEvent]);
  useEffect(() => { isEditingConvenerSadarRef.current = isEditingConvenerSadar; }, [isEditingConvenerSadar]);
  useEffect(() => { isEditingCoordinatorConvenerRef.current = isEditingCoordinatorConvener; }, [isEditingCoordinatorConvener]);

  // Super admin panel states
  const [superMadrasas, setSuperMadrasas] = useState([]);
  const [pendingMadrasa, setPendingMadrasa] = useState(null);
  const [editingMadrasaId, setEditingMadrasaId] = useState(null);
  const [editingMadrasaData, setEditingMadrasaData] = useState({});
  const [superSearchTerm, setSuperSearchTerm] = useState('');

  // ── Synchronous cache reader (used for lazy useState initialization) ──
  const _rNum = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('miladfest_session') || 'null');
      return s && s.madrasa ? String(s.madrasa.regNumber || s.madrasa.regnumber || s.madrasa.reg_number || '').trim() : '';
    } catch { return ''; }
  })();
  const _initCache = (() => {
    if (!_rNum) return null;
    try {
      const raw = localStorage.getItem(`cached_data_${_rNum}`);
      if (!raw) return null;
      const c = JSON.parse(raw);
      return (c && typeof c === 'object') ? c : null;
    } catch { return null; }
  })();

  // Master data states (Supabase online database)
  // ✅ Lazy initializers read from localStorage cache BEFORE first render
  // This eliminates the "flash of 0" when refreshing the page
  const [teams, setTeams] = useState(() => {
    try { return (_initCache && Array.isArray(_initCache.teams) && _initCache.teams.length > 0) ? _initCache.teams : []; } catch { return []; }
  });
  const [categories, setCategories] = useState(() => {
    try { return (_initCache && Array.isArray(_initCache.categories) && _initCache.categories.length > 0) ? _initCache.categories : []; } catch { return []; }
  });

  const [dbHasClassRange, setDbHasClassRange] = useState(false);
  const [timetable, setTimetable] = useState(() => {
    try { return (_initCache && Array.isArray(_initCache.timetable)) ? _initCache.timetable : []; } catch { return []; }
  });
  const [timetableFilterCat, setTimetableFilterCat] = useState('ALL');
  const [timetableFilterGender, setTimetableFilterGender] = useState('ALL');
  const [timetableView, setTimetableView] = useState('GRID'); // 'GRID' | 'LIST'
  const [editingTimetableId, setEditingTimetableId] = useState(null);
  const [timetableFormData, setTimetableFormData] = useState({ scheduled_time: '', date: '', hour12: '09', minute: '00', ampm: 'AM', venue: '' });
  const [students, setStudents] = useState(() => {
    try {
      if (_initCache && Array.isArray(_initCache.students) && _initCache.students.length > 0) {
        return [..._initCache.students].sort((a, b) => {
          const aR = parseInt(a.regno || a.regNo || '0') || 0;
          const bR = parseInt(b.regno || b.regNo || '0') || 0;
          return aR - bR;
        });
      }
    } catch {}
    return [];
  });
  const [programs, setPrograms] = useState(() => {
    try {
      if (_initCache && Array.isArray(_initCache.programs) && _initCache.programs.length > 0) {
        return [..._initCache.programs].sort((a, b) => {
          const aC = parseInt(a.code) || 0;
          const bC = parseInt(b.code) || 0;
          return aC - bC || String(a.code || '').localeCompare(String(b.code || ''));
        });
      }
    } catch {}
    return [];
  });
  const [resultsList, setResultsList] = useState(() => {
    try { return (_initCache && Array.isArray(_initCache.resultsList)) ? _initCache.resultsList : []; } catch { return []; }
  });
  const [programRegistrations, setProgramRegistrations] = useState(() => {
    try { return (_initCache && Array.isArray(_initCache.programRegistrations)) ? _initCache.programRegistrations : []; } catch { return []; }
  });

  // 📡 Network status tracking (Offline / Weak Network fallback)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dynamic Points system state
  const [pointSystem, setPointSystem] = useState({
    p1: 5, p2: 3, p3: 1, gA: 5, gB: 3, gC: 1,
    gp1: 10, gp2: 6, gp3: 2, gpA: 5, gpB: 3, gpC: 1,
    tp1: 15, tp2: 10, tp3: 5, tpA: 5, tpB: 3, tpC: 1
  });

  // Input form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newCatName, setNewCatName] = useState('');

  // Student form states
  const [newStudentName, setNewStudentName] = useState('');
  const [studentRegNo, setStudentRegNo] = useState('');
  const [selectedStudentTeam, setSelectedStudentTeam] = useState('');
  const [selectedStudentCat, setSelectedStudentCat] = useState('');
  const [studentGender, setStudentGender] = useState('BOY');

  // Bulk upload states
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState(null); // { success, failed }

  // Program form states
  const [newProgName, setNewProgName] = useState('');
  const [newProgCode, setNewProgCode] = useState('');
  const [selectedProgCat, setSelectedProgCat] = useState('');
  const [progType, setProgType] = useState('SINGLE');
  const [progGender, setProgGender] = useState('COMMON');

  // Mark entry states
  const [selectedResultCat, setSelectedResultCat] = useState('');
  const [selectedResultGender, setSelectedResultGender] = useState('ALL');
  const [selectedResultProg, setSelectedResultProg] = useState('');
  const [selectedResultStudent, setSelectedResultStudent] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('1');
  const [selectedGrade, setSelectedGrade] = useState('A');
  const [markEntrySection, setMarkEntrySection] = useState('SINGLE'); // 'SINGLE' | 'GROUP'
  // Result inline-edit states (Mark Entry saved list)
  const [editingResultId, setEditingResultId] = useState(null);
  const [editingResultPlace, setEditingResultPlace] = useState('1');
  const [editingResultGrade, setEditingResultGrade] = useState('A');
  const [editingResultStudent, setEditingResultStudent] = useState('');

  // Editing states
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingStudentData, setEditingStudentData] = useState({});
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [editingProgId, setEditingProgId] = useState(null);
  const [editingProgData, setEditingProgData] = useState({});
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatClassRange, setEditingCatClassRange] = useState('');
  const [newCatClassRange, setNewCatClassRange] = useState('');
  const [settingsSubTab, setSettingsSubTabState] = useState(() => {
    try { return sessionStorage.getItem('milad_settings_subtab') || 'TEAMS'; } catch { return 'TEAMS'; }
  });
  const setSettingsSubTab = useCallback((subtab) => {
    try { sessionStorage.setItem('milad_settings_subtab', subtab); } catch(e){}
    setSettingsSubTabState(subtab);
  }, []);
  const [resultsSubTab, setResultsSubTab] = useState('PROGRAM_WINNERS');
  const [showAllStudentsMarks, setShowAllStudentsMarks] = useState(false);

  // GENERAL category feature: virtual composite category
  const [generalCatIds, setGeneralCatIds] = useState([]); // IDs of categories included in GENERAL
  const [showGeneralModal, setShowGeneralModal] = useState(false); // show/hide GENERAL options modal
  const [generalModalTemp, setGeneralModalTemp] = useState([]); // temp selection inside modal

  // Helper: check if a program belongs to the GENERAL category
  // catid === -1 means explicitly saved as GENERAL (our sentinel value)
  const isGeneralProg = useCallback((p) => {
    if (!p) return false;
    const pCatId = String(p.catid ?? p.catId ?? '');
    if (pCatId === '-1' || pCatId === 'GENERAL') return true;
    const catObj = categories.find(c => String(c.id) === pCatId);
    if (catObj && (catObj.name || '').toLowerCase().includes('general')) return true;
    return false;
  }, [categories]);

  // Helper: check if a result record belongs to the GENERAL category
  const isGeneralResult = useCallback((r) => {
    if (!r) return false;
    const rCatId = String(r.catid || r.catId || '');
    if (rCatId === '-1' || rCatId === 'GENERAL') return true;
    const rCatName = (r.catname || r.catName || '').toLowerCase();
    if (rCatName === 'general' || rCatName.includes('general')) return true;
    const prog = programs.find(p => String(p.id) === String(r.progid || r.progId || ''));
    if (prog && isGeneralProg(prog)) return true;
    return false;
  }, [programs, isGeneralProg]);

  // Filter states for Results tab
  const [filterCat, setFilterCat] = useState('');
  const [filterProg, setFilterProg] = useState('');
  const [filterGender, setFilterGender] = useState('ALL');

  // Poster modal state
  const [posterModal, setPosterModal] = useState(null); // { result, progObj, catObj }
  const [posterLang, setPosterLang] = useState('ML'); // 'ML' = Malayalam, 'EN' = English
  const posterRef = useRef(null);

  // Student search by reg number
  const [searchRegNo, setSearchRegNo] = useState('');
  const [bulkCertCat, setBulkCertCat] = useState('ALL');
  const [bulkCertGender, setBulkCertGender] = useState('ALL');

  // Champion section states
  const [champCat, setChampCat] = useState('');
  const [champGender, setChampGender] = useState('BOYS');

  // Filter states for Students list in Master Settings
  const [studentFilterTeam, setStudentFilterTeam] = useState('ALL');
  const [studentFilterCat, setStudentFilterCat] = useState('ALL');
  const [studentFilterGender, setStudentFilterGender] = useState('ALL');

  // Filter state for Programs list in Master Settings
  const [programFilterCat, setProgramFilterCat] = useState('ALL');
  const [programFilterGender, setProgramFilterGender] = useState('ALL');

  // Judge Sheet states
  const [judgeSheetCat, setJudgeSheetCat] = useState('');
  const [judgeSheetGender, setJudgeSheetGender] = useState('');
  const [judgeSheetProg, setJudgeSheetProg] = useState('');

  // Entry Form states
  const [entryFormCat, setEntryFormCat] = useState('');
  const [entryFormGender, setEntryFormGender] = useState('');
  const [entryFormTeam, setEntryFormTeam] = useState('');
  const [showEntryForm, setShowEntryForm] = useState(false);

  // ── Register Tab States ──
  const [regTabCat, setRegTabCat] = useState('');
  const [regTabGender, setRegTabGender] = useState('BOY');
  const [regTabStudent, setRegTabStudent] = useState('');
  const [regTabCheckedProgs, setRegTabCheckedProgs] = useState([]);
  const [regTabSaving, setRegTabSaving] = useState(false);
  const [regTabSection, setRegTabSection] = useState('SINGLE'); // 'SINGLE' | 'GROUP'
  const regTabDirtyRef = React.useRef(false); // true when user has unsaved checkbox changes

  // ── Prizes Tab States ──
  const [prizesCatFilter, setPrizesCatFilter] = useState('ALL');
  const [prizesPlaceFilter, setPrizesPlaceFilter] = useState('ALL'); // 'ALL' | 'FIRST' | 'SECOND' | 'THIRD'
  const [prizesStudentSearch, setPrizesStudentSearch] = useState('');
  const [prizesActiveTab, setPrizesActiveTab] = useState('WINNERS'); // 'WINNERS' | 'ENCOURAGEMENT'
  const [encouragementSubMode, setEncouragementSubMode] = useState('CONTESTANTS'); // 'CONTESTANTS' | 'ALL_STUDENTS'

  const isStudentMatch = useCallback((r, studentObj) => {
    if (!r || !studentObj) return false;
    const rSid = String(r.student_id || r.studentId || r.studentid || r.student_name || r.studentName || '').trim();
    const sId = String(studentObj.id || '').trim();
    const sReg = String(studentObj.regno || studentObj.regNo || '').trim();
    const sName = String(studentObj.name || '').trim();

    if (!rSid) return false;
    if (rSid === sId) return true;
    if (sReg && rSid === sReg) return true;

    const rSidNum = parseInt(rSid, 10);
    const sRegNum = parseInt(sReg, 10);
    if (!isNaN(rSidNum) && !isNaN(sRegNum) && rSidNum === sRegNum) return true;

    if (rSid.includes(' - ')) {
      const regPart = rSid.split(' - ')[0].trim();
      if (regPart && (regPart === sReg || parseInt(regPart, 10) === sRegNum)) return true;
    }

    if (sName && rSid.toLowerCase().includes(sName.toLowerCase())) return true;

    return false;
  }, []);

  const isProgramMatch = useCallback((r, p, exactOnly = false) => {
    if (!r || !p) return false;
    const pId = String(p.id || '').trim().toLowerCase();
    const pCode = String(p.code || '').trim().toLowerCase();
    const pName = String(p.name || '').trim().toLowerCase();

    const rProgName = String(r.program_name || r.programName || r.progname || r.progName || '').trim().toLowerCase();
    const rProgId = String(r.program_id || r.programId || r.progid || r.progId || '').trim().toLowerCase();

    // 1. Direct Exact Program ID / Code Match (Highest Accuracy)
    if ((rProgId && (rProgId === pId || rProgId === pCode || rProgId === pName)) ||
        (rProgName && (rProgName === pId || rProgName === pCode || rProgName === pName))) {
      return true;
    }

    if (exactOnly) return false;

    // 2. Direct Exact Program Name Match
    if (rProgName && pName && rProgName === pName) {
      return true;
    }

    // 3. Numeric Code match
    const pCodeNum = parseInt(pCode, 10);
    const rProgIdNum = parseInt(rProgId || rProgName, 10);
    if (!isNaN(pCodeNum) && !isNaN(rProgIdNum) && pCodeNum === rProgIdNum) {
      return true;
    }

    return false;
  }, []);

  // 🔍 Helper to resolve student by ID first, then by regno (prevents matching wrong student when ID matches another student's regno)
  const findStudentByRef = useCallback((refId) => {
    if (!refId) return null;
    const rStr = String(refId).trim();
    if (!rStr) return null;
    const byId = students.find(s => String(s.id).trim() === rStr);
    if (byId) return byId;
    return students.find(s => String(s.regno || s.regNo || '').trim() === rStr) || null;
  }, [students]);

  const getStudentRegisteredPrograms = useCallback((studentId, customRegs = null) => {
    if (!studentId) return [];
    const targetRegs = customRegs || programRegistrations;
    const studentObj = findStudentByRef(studentId);

    const findProgForReg = (r, studentCatId = null, studentGender = null) => {
      const isGenderMatch = (p) => {
        if (!studentGender || !p.type) return true;
        const pt = String(p.type).toUpperCase();
        const sg = String(studentGender).toUpperCase();
        if (sg === 'BOY' && pt.includes('GIRL') && !pt.includes('BOY')) return false;
        if (sg === 'GIRL' && pt.includes('BOY') && !pt.includes('GIRL')) return false;
        return true;
      };

      // Priority 1: Exact ID / Code match within student's Category + Gender match
      if (studentCatId) {
        const exactCatGenMatch = programs.find(p =>
          (String(p.catid || p.catId || '') === String(studentCatId) || String(p.category || '').toLowerCase() === String(studentCatId).toLowerCase()) &&
          isGenderMatch(p) &&
          isProgramMatch(r, p, true)
        );
        if (exactCatGenMatch) return exactCatGenMatch;
      }

      // Priority 2: Exact ID / Code match across all programs + Gender match
      const exactGenMatch = programs.find(p => isGenderMatch(p) && isProgramMatch(r, p, true));
      if (exactGenMatch) return exactGenMatch;

      // Priority 3: Name / Code match within student's Category + Gender match
      if (studentCatId) {
        const catGenMatch = programs.find(p =>
          (String(p.catid || p.catId || '') === String(studentCatId) || String(p.category || '').toLowerCase() === String(studentCatId).toLowerCase()) &&
          isGenderMatch(p) &&
          isProgramMatch(r, p, false)
        );
        if (catGenMatch) return catGenMatch;
      }

      // Priority 4: Name / Code match across all programs + Gender match
      const genMatch = programs.find(p => isGenderMatch(p) && isProgramMatch(r, p, false));
      if (genMatch) return genMatch;

    // Priority 5: Fallback match across all programs
    const fallback = programs.find(p => isProgramMatch(r, p, false));
    if (fallback) return fallback;

    // Priority 6: Synthesize fallback program object from registration record
    const pIdStr = String(r.program_id || r.programId || r.progid || r.progId || r.prog_name || r.program_name || r.id || '').trim();
    const pNameStr = String(r.program_name || r.programName || r.progname || r.progName || r.prog_name || (pIdStr ? `Program ${pIdStr}` : 'Program')).trim();
    const pCodeStr = String(r.program_code || r.programCode || r.progcode || pIdStr || 'P').trim();

    if (!pNameStr) return null;
    return {
      id: pIdStr || ('p_' + Math.random()),
      code: pCodeStr,
      name: pNameStr,
      type: r.program_type || r.progtype || r.type || 'COMMON',
      catid: r.category_id || r.catid || r.catId || ''
    };
  };

    let sRegs = [];
    if (!studentObj) {
      sRegs = targetRegs.filter(r => String(r.student_id || r.studentId || r.studentid || '') === String(studentId));
    } else {
      sRegs = targetRegs.filter(r => isStudentMatch(r, studentObj));
    }

    const studentCatId = studentObj ? (studentObj.catid || studentObj.catId || studentObj.category || '') : null;
    const studentGender = studentObj ? (studentObj.gender || '') : null;
    const rawProgs = sRegs.map(r => findProgForReg(r, studentCatId, studentGender)).filter(Boolean);

    // Deduplicate so every program appears EXACTLY ONCE for the student
    const uniqueMap = new Map();
    rawProgs.forEach(p => {
      const pKey = String(p.code || p.id || '').trim().toLowerCase() || String(p.name || '').trim().toLowerCase();
      if (!uniqueMap.has(pKey)) {
        uniqueMap.set(pKey, p);
      }
    });

    return Array.from(uniqueMap.values());
  }, [programRegistrations, programs, students, isStudentMatch, isProgramMatch]);

  const getStudentRegisteredProgIds = useCallback((studentId, customRegs = null) => {
    if (!studentId) return [];
    const matchedProgs = getStudentRegisteredPrograms(studentId, customRegs);
    return Array.from(new Set(matchedProgs.map(p => String(p.id))));
  }, [getStudentRegisteredPrograms]);

  // ── Group Registration States ──
  const [groupRegistrations, setGroupRegistrations] = useState([]);
  const [groupRegCat, setGroupRegCat] = useState('');
  const [groupRegGender, setGroupRegGender] = useState('BOY');
  const [groupRegProgram, setGroupRegProgram] = useState('');
  const [groupRegName, setGroupRegName] = useState('');
  const [groupRegTeam, setGroupRegTeam] = useState('');
  const [groupRegLeader, setGroupRegLeader] = useState('');
  const [groupRegStudents, setGroupRegStudents] = useState([]); // array of student IDs
  const [groupRegSummaryFilterProg, setGroupRegSummaryFilterProg] = useState('ALL');
  const [groupRegMemberSearch, setGroupRegMemberSearch] = useState('');
  const [groupRegSaving, setGroupRegSaving] = useState(false);
  // Edit states for group registration
  const [editingGroupRegId, setEditingGroupRegId] = useState(null);
  const [editingGroupRegName, setEditingGroupRegName] = useState('');
  const [editingGroupRegStudents, setEditingGroupRegStudents] = useState([]);
  const [editingGroupRegLeader, setEditingGroupRegLeader] = useState('');
  const [editingGroupRegSaving, setEditingGroupRegSaving] = useState(false);

  const checkIsStudentRegisteredForProg = useCallback((s, p) => {
    if (!s || !p) return false;
    try {
      const isGroup = (p.type || '').includes('GROUP');
      if (isGroup) {
        const inGroupTable = groupRegistrations.some(g => {
          if (!g) return false;
          const pMatch = isProgramMatch({ program_id: g.program_id, program_name: g.program_id }, p) ||
            String(g.program_id || '') === String(p.id || '') ||
            String(g.program_id || '') === String(p.code || '') ||
            String(g.program_id || '').toLowerCase() === String(p.name || '').toLowerCase();
          if (!pMatch) return false;

          let mIds = [];
          if (Array.isArray(g.student_ids)) {
            mIds = g.student_ids;
          } else if (typeof g.student_ids === 'string') {
            try { mIds = JSON.parse(g.student_ids || '[]'); } catch (e) { mIds = [g.student_ids]; }
          }
          return mIds.some(id =>
            String(id || '').trim() === String(s.id || '').trim() ||
            String(id || '').trim() === String(s.regno || s.regNo || '').trim()
          );
        });
        const inProgRegTable = programRegistrations.some(r => isProgramMatch(r, p) && isStudentMatch(r, s));
        return inGroupTable || inProgRegTable;
      } else {
        // 1. Direct DB match using isProgramMatch & isStudentMatch
        if (programRegistrations.some(r => isProgramMatch(r, p) && isStudentMatch(r, s))) return true;

        // 2. Fast Fallback check on raw programRegistrations by student regNo or ID matching p.code, p.id, or p.name
        const sDbId = String(s.id || '').trim();
        const sRegNo = s.regno || s.regNo || '';
        const sRegStr = String(sRegNo || '').trim();
        const pCodeStr = String(p.code || '').trim();
        const pIdStr = String(p.id || '').trim();
        const pNameStr = String(p.name || '').trim().toLowerCase();

        return programRegistrations.some(r => {
          if (!r) return false;
          const rSid = String(r.student_id || r.studentId || r.studentid || '').trim();
          const sMatch = rSid && (
            rSid === sDbId ||
            (sRegStr && rSid === sRegStr) ||
            (sRegStr && !isNaN(parseInt(rSid, 10)) && parseInt(rSid, 10) === parseInt(sRegStr, 10))
          );
          if (!sMatch) return false;

          const rPid = String(r.program_id || r.program_name || r.progid || r.programName || '').trim();
          if (!rPid) return false;

          if (rPid === pCodeStr || rPid === pIdStr) return true;
          if (pNameStr && rPid.toLowerCase() === pNameStr) return true;
          return false;
        });
      }
    } catch (e) {
      return false;
    }
  }, [groupRegistrations, programRegistrations, isProgramMatch, isStudentMatch]);


  // ── Visibility Control Helpers & States (Defaulting to ALL ON) ──
  const DEFAULT_VISIBILITY_CONTROLS = {
    scoreboard: true,
    results_PROGRAM_WINNERS: true,
    results_STUDENT_REPORT: true,
    results_RESULTS_HISTORY: true,
    results_CHAMPIONS: true,
  };

  const normalizeVisibilityControls = (raw) => {
    let parsed = raw;
    if (typeof raw === 'string') {
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    }
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_VISIBILITY_CONTROLS };
    }
    return {
      scoreboard: parsed.scoreboard !== undefined ? Boolean(parsed.scoreboard) : DEFAULT_VISIBILITY_CONTROLS.scoreboard,
      results_PROGRAM_WINNERS: parsed.results_PROGRAM_WINNERS !== undefined ? Boolean(parsed.results_PROGRAM_WINNERS) : DEFAULT_VISIBILITY_CONTROLS.results_PROGRAM_WINNERS,
      results_STUDENT_REPORT: parsed.results_STUDENT_REPORT !== undefined ? Boolean(parsed.results_STUDENT_REPORT) : DEFAULT_VISIBILITY_CONTROLS.results_STUDENT_REPORT,
      results_RESULTS_HISTORY: parsed.results_RESULTS_HISTORY !== undefined ? Boolean(parsed.results_RESULTS_HISTORY) : DEFAULT_VISIBILITY_CONTROLS.results_RESULTS_HISTORY,
      results_CHAMPIONS: parsed.results_CHAMPIONS !== undefined ? Boolean(parsed.results_CHAMPIONS) : DEFAULT_VISIBILITY_CONTROLS.results_CHAMPIONS,
    };
  };

  const [visibilityControls, setVisibilityControls] = useState(() => {
    if (_rNum) {
      try {
        const stored = localStorage.getItem(`milad_visibility_controls_${_rNum}`) ||
                       localStorage.getItem(`visibility_controls_${_rNum}`) ||
                       localStorage.getItem('milad_visibility_controls_latest');
        if (stored) return normalizeVisibilityControls(stored);
        if (_initCache && _initCache.visibilityControls) return normalizeVisibilityControls(_initCache.visibilityControls);
      } catch (e) {}
    }
    return { ...DEFAULT_VISIBILITY_CONTROLS };
  });

  // ── Profile Tab States ──
  const [profileRegNo, setProfileRegNo] = useState('');
  const [profileStudent, setProfileStudent] = useState(null);
  const [profileStep, setProfileStep] = useState('INPUT'); // INPUT, FOUND, UPLOADING, WAITING, APPROVED
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [profileCropMode, setProfileCropMode] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);

  // Admin Profile states
  const [profileAdminSubTab, setProfileAdminSubTab] = useState('APPROVAL');
  const [profileAdminCatFilter, setProfileAdminCatFilter] = useState('ALL');
  const [profileAdminTeamFilter, setProfileAdminTeamFilter] = useState('ALL');
  const [profileAdminGenderFilter, setProfileAdminGenderFilter] = useState('ALL');
  const [profilePdfGenerating, setProfilePdfGenerating] = useState(false);
  const [pdfPaperSize, setPdfPaperSize] = useState('A4');

  // QR Code scan modal states
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState(null);
  const [qrModalLoading, setQrModalLoading] = useState(false);

  // ── Manual Cropper States & Refs ──
  const [cropperSrc, setCropperSrc] = useState(null);
  const [cropperZoom, setCropperZoom] = useState(1);
  const [cropperImageDims, setCropperImageDims] = useState(null);
  const [cropperFilename, setCropperFilename] = useState('photo.jpg');
  const [cropperTargetStudent, setCropperTargetStudent] = useState(null);
  

  const cropperImageRef = useRef(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });

  // Refs for ID card rendering
  const idCardRef = useRef(null);
  const idCardGalleryRef = useRef(null);

  // Helper to render student photo or gender silhouette
  const renderStudentPhoto = (regNo, gender, size = '60px', borderRadius = '10px') => {
    const student = students.find(s => String(s.regno || s.regNo || '') === String(regNo));
    const hasPhoto = student && student.photo_url && student.photo_status && student.photo_status !== 'none';

    if (hasPhoto) {
      return (
        <div style={{ width: size, height: size, minWidth: size, borderRadius: borderRadius, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: 'white' }}>
          <img src={student.photo_url} alt="student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      );
    }

    const isBoy = String(gender).toUpperCase() === 'BOY' || String(gender).toUpperCase() === 'BOYS';
    return (
      <div style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isBoy ? 'linear-gradient(135deg, #dbeafe, #93c5fd)' : 'linear-gradient(135deg, #fce7f3, #f9a8d4)',
        border: '2px solid rgba(255,255,255,0.4)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        overflow: 'hidden'
      }}>
        {isBoy ? (
          <svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="#be185d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
            <path d="M12 9c0.8 0 1.5-0.5 1.5-1.2S12.8 6.5 12 6.5s-1.5 0.5-1.5 1.2S11.2 9 12 9z" fill="#f9a8d4" />
          </svg>
        )}
      </div>
    );
  };

  const renderTablePhoto = (regNo, gender) => {
    const student = students.find(s => String(s.regno || s.regNo || '') === String(regNo));
    const hasPhoto = student && student.photo_url && student.photo_status && student.photo_status !== 'none';

    if (hasPhoto) {
      return (
        <img src={student.photo_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', display: 'block', margin: '0 auto', border: '1px solid #cbd5e1' }} />
      );
    }

    const isBoy = String(gender).toUpperCase() === 'BOY' || String(gender).toUpperCase() === 'BOYS';
    return (
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '6px',
        background: isBoy ? '#dbeafe' : '#fce7f3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        border: '1px solid #cbd5e1',
        fontSize: '14px'
      }}>
        {isBoy ? '👦' : '👧'}
      </div>
    );
  };

  // 🗄️ Helper to load cached database snapshot from LocalStorage when offline or network fails
  const loadCachedData = (rNum) => {
    if (!rNum) return false;
    try {
      const raw = localStorage.getItem(`cached_data_${rNum}`);
      const localEv = localStorage.getItem(`event_name_${rNum}`);
      const localYr = localStorage.getItem(`event_year_${rNum}`);
      const localCS = localStorage.getItem(`convener_sadar_${rNum}`);
      const localCC = localStorage.getItem(`coordinator_convener_${rNum}`);
      const localGen = localStorage.getItem(`general_cats_${rNum}`);

      if (raw) {
        let cached;
        try {
          cached = JSON.parse(raw);
        } catch (parseErr) {
          // Corrupted cache — auto-clear to prevent repeated crashes on computers
          console.warn('Corrupted cache detected, auto-clearing...', parseErr);
          try { localStorage.removeItem(`cached_data_${rNum}`); } catch(e){}
          return false;
        }
        // Validate cached object before using it
        if (cached && typeof cached === 'object') {
          if (cached.teams && Array.isArray(cached.teams) && cached.teams.length > 0) setTeams(cached.teams);
          if (cached.categories && Array.isArray(cached.categories) && cached.categories.length > 0) setCategories(cached.categories);
          if (cached.programs && Array.isArray(cached.programs) && cached.programs.length > 0) setPrograms([...cached.programs].sort(compareProgCode));
          if (cached.students && Array.isArray(cached.students) && cached.students.length > 0) setStudents([...cached.students].sort(compareRegNo));
          if (cached.resultsList && Array.isArray(cached.resultsList) && cached.resultsList.length > 0) setResultsList(cached.resultsList);
          if (cached.programRegistrations && Array.isArray(cached.programRegistrations)) setProgramRegistrations(cached.programRegistrations);
          if (cached.groupRegistrations && Array.isArray(cached.groupRegistrations)) setGroupRegistrations(cached.groupRegistrations);
          if (cached.timetable && Array.isArray(cached.timetable)) setTimetable(cached.timetable);
          if (cached.visibilityControls && typeof cached.visibilityControls === 'object') {
            setVisibilityControls(normalizeVisibilityControls(cached.visibilityControls));
          } else {
            const savedV = localStorage.getItem(`milad_visibility_controls_${rNum}`) || localStorage.getItem(`visibility_controls_${rNum}`) || localStorage.getItem('milad_visibility_controls_latest');
            if (savedV) {
              try { setVisibilityControls(normalizeVisibilityControls(savedV)); } catch(e){}
            } else {
              setVisibilityControls({ ...DEFAULT_VISIBILITY_CONTROLS });
            }
          }

          const evToSet = localEv || cached.eventName || '';
          const yrToSet = localYr || cached.eventYear || '';
          const csToSet = localCS || cached.convenerSadar || '';
          const ccToSet = localCC || cached.coordinatorConvener || '';

          setEventName(evToSet);
          if (!isEditingEventRef.current && (evToSet || !eventNameInput)) setEventNameInput(evToSet);
          setEventYear(yrToSet);
          if (!isEditingEventRef.current && (yrToSet || !eventYearInput)) setEventYearInput(yrToSet);
          // Only update convenerSadar state/input if user is NOT currently editing
          if (!isEditingConvenerSadarRef.current) {
            setConvenerSadar(csToSet);
            // Only overwrite input if we have a real value, or input is currently blank
            if (csToSet || !convenerSadarInput) setConvenerSadarInput(csToSet);
          }
          // Only update coordinatorConvener state/input if user is NOT currently editing
          if (!isEditingCoordinatorConvenerRef.current) {
            setCoordinatorConvener(ccToSet);
            if (ccToSet || !coordinatorConvenerInput) setCoordinatorConvenerInput(ccToSet);
          }
          return true;
        }
      } else {
        // No local cache snapshot for this madrasa - purge old tenant state!
        setTeams([]);
        setCategories([]);
        setPrograms([]);
        setStudents([]);
        setResultsList([]);
        setProgramRegistrations([]);
        setGroupRegistrations([]);
        setTimetable([]);
        setEventName(localEv || '');
        setEventNameInput(localEv || '');
        setEventYear(localYr || '');
        setEventYearInput(localYr || '');
        setConvenerSadar(localCS || '');
        setConvenerSadarInput(localCS || '');
        setCoordinatorConvener(localCC || '');
        setCoordinatorConvenerInput(localCC || '');
        return false;
      }

      if (localGen) {
        try {
          const parsedGen = JSON.parse(localGen);
          if (Array.isArray(parsedGen)) setGeneralCatIds(parsedGen);
        } catch(e){
          // Corrupted general_cats cache — clear it
          try { localStorage.removeItem(`general_cats_${rNum}`); } catch(e2){}
        }
      }
      return true;
    } catch (e) {
      console.error("Error reading cached data:", e);
      // If outer try fails (e.g. localStorage quota or access error), clean up if possible
      try { localStorage.removeItem(`cached_data_${rNum}`); } catch(e2){}
      return false;
    }
  };

  // Helper: fetch ALL rows of a table with automatic pagination (handles 300+ students & 1000+ registrations)
  const fetchAllRows = async (table, filter) => {
    const PAGE = 1000; // fetch 1000 rows at a time (max Supabase batch size)
    let allRows = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await filter(
        supabase.from(table).select('*').range(from, from + PAGE - 1)
      );
      if (error) return { data: allRows.length > 0 ? allRows : null, error };
      if (!data || data.length === 0) { hasMore = false; break; }
      allRows = [...allRows, ...data];
      if (data.length < PAGE) { hasMore = false; } else { from += PAGE; }
    }
    return { data: allRows, error: null };
  };

  // 🔄 Function to load real-time data from Supabase (with offline fallback & LocalStorage caching)
  const fetchSupabaseData = async (rNumInput) => {
    const rNum = String(rNumInput || (loggedInMadrasa ? (loggedInMadrasa.regNumber || loggedInMadrasa.regnumber || loggedInMadrasa.reg_number) : '')).trim();
    if (!rNum) return;

    fetchReqIdRef.current++;
    const currentReqId = fetchReqIdRef.current;

    // Prevent concurrent stacked requests on weak connections
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!navigator.onLine) {
      isFetchingRef.current = false;
      return;
    }

    try {
      const numericId = parseInt(rNum, 10);
      const isNumValid = !isNaN(numericId) && String(numericId) === String(rNum).trim();

      // Build filter function for each table (supports both string and numeric madrasa_id)
      const makeFilter = (q) => {
        if (isNumValid) {
          return q.or(`madrasa_id.eq.${numericId},madrasa_id.eq.${rNum}`);
        }
        return q.eq('madrasa_id', rNum);
      };

      // Use Promise.allSettled so that a failure in one table does NOT wipe out others
      // 30-second overall timeout for large madrasas (300+ students)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network request timed out')), 30000)
      );

      const fetchPromise = Promise.allSettled([
        // Small tables — single fetch is fine
        queryWithRetry(() => makeFilter(supabase.from('teams').select('*'))),
        queryWithRetry(() => makeFilter(supabase.from('categories').select('*'))),
        queryWithRetry(() => makeFilter(supabase.from('programs').select('*'))),
        queryWithRetry(() => fetchAllRows('results', makeFilter)),
        // Tables that can exceed Supabase's default 1000 row PostgREST limit
        queryWithRetry(() => fetchAllRows('students', makeFilter)),
        queryWithRetry(() => fetchAllRows('program_registrations', makeFilter)),
        queryWithRetry(() => fetchAllRows('group_registrations', makeFilter)),
        queryWithRetry(() => makeFilter(supabase.from('timetable').select('*'))),
        // Madrasa settings (by id if available, or exact regNumber match)
        queryWithRetry(() => {
          const activeId = loggedInMadrasaRef.current?.id;
          if (activeId) {
            return supabase.from('madrasas').select('*').eq('id', activeId).maybeSingle();
          }
          return supabase.from('madrasas').select('*').eq('regNumber', String(rNum)).maybeSingle();
        }),
      ]);

      const results = await Promise.race([fetchPromise, timeoutPromise]);

      const [
        teamsResult,
        catsResult,
        programsResult,
        resultsResult,
        studentsResult,
        regResult,
        gRegResult,
        timetableResult,
        madrasaResult,
      ] = results;

      // Extract data safely (allSettled gives {status, value} or {status, reason})
      const safe = (r) => (r && r.status === 'fulfilled' && r.value) ? r.value : { data: null, error: true };

      const teamsData = safe(teamsResult).data;
      const catsData = safe(catsResult).data;
      const programsData = safe(programsResult).data;
      const resultsData = safe(resultsResult).data;
      const studentsData = safe(studentsResult).data;
      const regData = safe(regResult).data;
      const groupRegData = safe(gRegResult).data;
      const timetableData = safe(timetableResult).data;
      const madrasaData = safe(madrasaResult).data;
      let fetchedVisibility = null;
      if (madrasaData) {
        if (madrasaData.place) {
          const parts = madrasaData.place.split('|');
          if (parts[8]) {
            try {
              fetchedVisibility = JSON.parse(decodeURIComponent(parts[8]));
            } catch (e) {
              try { fetchedVisibility = JSON.parse(parts[8]); } catch (e2) {}
            }
          }
        }
        if ((!fetchedVisibility || typeof fetchedVisibility !== 'object') && madrasaData.visibility_controls) {
          try {
            fetchedVisibility = typeof madrasaData.visibility_controls === 'string'
              ? JSON.parse(madrasaData.visibility_controls)
              : madrasaData.visibility_controls;
          } catch (e) {}
        }
      }
      // ⚠️ VISIBILITY CONTROLS SYNC STRATEGY:
      // • ADMIN role  → prefer localStorage (so 5-second polling never reverts a toggle they just set)
      // • VIEW role   → always use DB value (so admin's ON/OFF reaches view users immediately)
      try {
        if (loginRole === 'ADMIN') {
          // ADMIN: prefer localStorage so their own toggle is never overwritten by polling
          const localVis = localStorage.getItem(`milad_visibility_controls_${rNum}`) ||
                           localStorage.getItem(`visibility_controls_${rNum}`);
          if (localVis) {
            setVisibilityControls(normalizeVisibilityControls(localVis));
          } else if (fetchedVisibility) {
            const normalizedVis = normalizeVisibilityControls(fetchedVisibility);
            setVisibilityControls(normalizedVis);
            try {
              localStorage.setItem(`visibility_controls_${rNum}`, JSON.stringify(normalizedVis));
              localStorage.setItem(`milad_visibility_controls_${rNum}`, JSON.stringify(normalizedVis));
              localStorage.setItem('milad_visibility_controls_latest', JSON.stringify(normalizedVis));
            } catch (e) {}
          }
        } else {
          // VIEW role: always pull fresh from DB so admin's changes are immediately visible
          if (fetchedVisibility) {
            const normalizedVis = normalizeVisibilityControls(fetchedVisibility);
            setVisibilityControls(normalizedVis);
          } else {
            // DB had no value — fall back to DEFAULT (all ON) so view user is not locked out
            setVisibilityControls({ ...DEFAULT_VISIBILITY_CONTROLS });
          }
        }
      } catch (e) {}

      let parsedStudents = [];
      let parsedRegs = [];

      // 🔒 MULTI-TENANT IDENTITY VALIDATION & RACE CONDITION PROTECTION
      const currentActiveRegNumber = String(loggedInMadrasaRef.current ? (loggedInMadrasaRef.current.regNumber || loggedInMadrasaRef.current.regnumber || loggedInMadrasaRef.current.reg_number) : '').trim();
      if (currentReqId !== fetchReqIdRef.current) {
        isFetchingRef.current = false;
        return;
      }
      if (rNum && currentActiveRegNumber && String(rNum).trim() !== String(currentActiveRegNumber).trim()) {
        console.warn(`[TENANT-GUARD] Aborted fetch response for Madrasa ${rNum} because active logged-in Madrasa is ${currentActiveRegNumber}.`);
        isFetchingRef.current = false;
        return;
      }

      // Database is SINGLE SOURCE OF TRUTH: update states cleanly from DB response
      if (Array.isArray(teamsData)) setTeams(teamsData);
      if (Array.isArray(catsData)) setCategories(catsData);
      if (Array.isArray(programsData)) setPrograms([...programsData].sort(compareProgCode));
      if (Array.isArray(studentsData)) {
        const uniqueMap = new Map();
        for (const s of studentsData) {
          const sKey = String(s.id || '').trim();
          if (!sKey) continue;
          uniqueMap.set(sKey, s);
        }
        parsedStudents = Array.from(uniqueMap.values()).sort(compareRegNo);
        setStudents(parsedStudents);
      }
      if (Array.isArray(resultsData)) setResultsList(resultsData);
      if (Array.isArray(groupRegData)) setGroupRegistrations(groupRegData);
      if (Array.isArray(timetableData)) setTimetable(timetableData);

      // 🗄️ Keep LocalStorage cache 100% updated with fresh database snapshot
      if (rNum && parsedStudents.length > 0) {
        try {
          const cacheObj = {
            teams: Array.isArray(teamsData) ? teamsData : teams,
            categories: Array.isArray(catsData) ? catsData : categories,
            programs: Array.isArray(programsData) ? programsData : programs,
            students: parsedStudents,
            resultsList: Array.isArray(resultsData) ? resultsData : resultsList,
            programRegistrations: parsedRegs,
            groupRegistrations: Array.isArray(groupRegData) ? groupRegData : groupRegistrations,
            timetable: Array.isArray(timetableData) ? timetableData : timetable,
            // Always snapshot the CURRENT in-memory controls (which may already include admin
            // toggles from this session) rather than the raw DB value that may be stale.
            visibilityControls: (() => {
              try {
                const lv = localStorage.getItem(`milad_visibility_controls_${rNum}`) ||
                           localStorage.getItem(`visibility_controls_${rNum}`);
                if (lv) return JSON.parse(lv);
              } catch(e) {}
              return madrasaData?.visibility_controls || null;
            })()
          };
          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cacheObj));
        } catch (e) {}
      }

      let loadedEventName = '';
      let loadedEventYear = '';
      let loadedConvenerSadar = '';
      let loadedCoordinatorConvener = '';
      let loadedGenCats = [];

      const localEv = localStorage.getItem(`event_name_${rNum}`) || '';
      const localYr = localStorage.getItem(`event_year_${rNum}`) || '';
      const localCS = localStorage.getItem(`convener_sadar_${rNum}`) || '';
      const localCC = localStorage.getItem(`coordinator_convener_${rNum}`) || '';
      const localGen = localStorage.getItem(`general_cats_${rNum}`);

      if (madrasaData) {
        const parts = (madrasaData.place || '').split('|');
        const [, , trollStatus, dbTrollLang, dbEventName, dbEventYear, dbGeneralCats, dbConvenerSadar, dbVisCtrls, dbCoordinatorConvener] = parts;
        setTrollMode(trollStatus === 'troll_on');
        setTrollLang(dbTrollLang === 'EN' ? 'EN' : 'ML');

        // DB is strict authority — if DB has no custom event name/convener set, clear state & purge stale local cache
        loadedEventName = dbEventName ? decodeURIComponent(dbEventName) : '';
        loadedEventYear = dbEventYear ? decodeURIComponent(dbEventYear) : '';
        loadedConvenerSadar = dbConvenerSadar ? decodeURIComponent(dbConvenerSadar) : '';
        loadedCoordinatorConvener = dbCoordinatorConvener ? decodeURIComponent(dbCoordinatorConvener) : '';

        // Only purge localStorage for event name/year if DB truly has none set
        if (!dbEventName) { try { localStorage.removeItem(`event_name_${rNum}`); } catch(e){} }
        if (!dbEventYear) { try { localStorage.removeItem(`event_year_${rNum}`); } catch(e){} }
        // NEVER purge convener/coordinator from localStorage during active editing —
        // Only purge when user is not editing AND DB has confirmed empty
        if (!dbConvenerSadar && !isEditingConvenerSadarRef.current && !convenerSadarInput) {
          try { localStorage.removeItem(`convener_sadar_${rNum}`); } catch(e){}
        }
        if (!dbCoordinatorConvener && !isEditingCoordinatorConvenerRef.current && !coordinatorConvenerInput) {
          try { localStorage.removeItem(`coordinator_convener_${rNum}`); } catch(e){}
        }

        if (dbGeneralCats) {
          try { loadedGenCats = JSON.parse(decodeURIComponent(dbGeneralCats)); } catch(e){}
        } else if (localGen) {
          try { loadedGenCats = JSON.parse(localGen); } catch(e){}
        }

        setEventName(loadedEventName);
        if (!isEditingEventRef.current && (loadedEventName || !eventNameInput)) setEventNameInput(loadedEventName);
        try { localStorage.setItem(`event_name_${rNum}`, loadedEventName); } catch(e){}

        setEventYear(loadedEventYear);
        if (!isEditingEventRef.current && (loadedEventYear || !eventYearInput)) setEventYearInput(loadedEventYear);
        try { localStorage.setItem(`event_year_${rNum}`, loadedEventYear); } catch(e){}

        // Only update convenerSadar if user is NOT currently editing
        if (!isEditingConvenerSadarRef.current) {
          setConvenerSadar(loadedConvenerSadar);
          // Only overwrite input if DB has a value, or input is blank (don't clear typed text)
          if (loadedConvenerSadar || !convenerSadarInput) setConvenerSadarInput(loadedConvenerSadar);
          if (loadedConvenerSadar) { try { localStorage.setItem(`convener_sadar_${rNum}`, loadedConvenerSadar); } catch(e){} }
        } else if (loadedConvenerSadar) {
          // Even if editing, update the canonical state (not input) and persist to localStorage
          setConvenerSadar(loadedConvenerSadar);
          try { localStorage.setItem(`convener_sadar_${rNum}`, loadedConvenerSadar); } catch(e){}
        }

        // Only update coordinatorConvener if user is NOT currently editing
        if (!isEditingCoordinatorConvenerRef.current) {
          setCoordinatorConvener(loadedCoordinatorConvener);
          if (loadedCoordinatorConvener || !coordinatorConvenerInput) setCoordinatorConvenerInput(loadedCoordinatorConvener);
          if (loadedCoordinatorConvener) { try { localStorage.setItem(`coordinator_convener_${rNum}`, loadedCoordinatorConvener); } catch(e){} }
        } else if (loadedCoordinatorConvener) {
          setCoordinatorConvener(loadedCoordinatorConvener);
          try { localStorage.setItem(`coordinator_convener_${rNum}`, loadedCoordinatorConvener); } catch(e){}
        }
        if (Array.isArray(loadedGenCats) && loadedGenCats.length > 0) {
          setGeneralCatIds(loadedGenCats);
          try { localStorage.setItem(`general_cats_${rNum}`, JSON.stringify(loadedGenCats)); } catch(e){}
        }
      }

      // ── Handle Program Registrations (Bulletproof LocalStorage Fallback & Merge) ──
      let loadedRegs = [];
      let cachedRegs = [];
      try {
        const cRegs = localStorage.getItem(`cached_regs_${rNum}`);
        if (cRegs) {
          cachedRegs = JSON.parse(cRegs);
        } else {
          const rawCache = localStorage.getItem(`cached_data_${rNum}`);
          if (rawCache) {
            const cacheObj = JSON.parse(rawCache);
            if (Array.isArray(cacheObj.programRegistrations)) {
              cachedRegs = cacheObj.programRegistrations;
            }
          }
        }
      } catch (e) {}

      if (Array.isArray(regData)) {
        loadedRegs = regData.map(r => ({
          ...r,
          program_id: String(r.program_id || r.program_name || ''),
          program_name: String(r.program_name || r.program_id || '')
        }));
      }

      // If DB query succeeded and returned rows, use loadedRegs as authority. Otherwise fallback to cache.
      const finalRegs = (Array.isArray(regData)) ? loadedRegs : cachedRegs;

      if (finalRegs && finalRegs.length >= 0) {
        try {
          localStorage.setItem(`cached_regs_${rNum}`, JSON.stringify(finalRegs));
          const rawCache = localStorage.getItem(`cached_data_${rNum}`);
          let cacheObj = {};
          if (rawCache) { try { cacheObj = JSON.parse(rawCache) || {}; } catch(e){} }
          cacheObj.programRegistrations = finalRegs;
          cacheObj.savedAt = new Date().toISOString();
          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cacheObj));
        } catch (e) {}

        setProgramRegistrations(finalRegs);
      }


      // Fetch timetable
      let parsedTimetable = [];
      try {
        const { data: ttData } = await supabase
          .from('timetable')
          .select('*')
          .eq('madrasa_id', rNum);
        if (Array.isArray(ttData)) {
          parsedTimetable = ttData;
          setTimetable(ttData);
        }
      } catch (err) {
        console.error("Timetable fetch failed: ", err);
      }

      // Save fresh data snapshot to LocalStorage for offline PWA cache
      // CRITICAL: Never overwrite students/programs with empty results from transient failures
      const gotValidData = (Array.isArray(teamsData) && teamsData !== null);
      if (gotValidData) {
        try {
          // Read existing cache to preserve students/programs if new fetch returned empty
          let existingCached = null;
          try {
            const existingRaw = localStorage.getItem(`cached_data_${rNum}`);
            if (existingRaw) existingCached = JSON.parse(existingRaw);
          } catch(e) {}

          const existingStudents = (existingCached && Array.isArray(existingCached.students)) ? existingCached.students : [];
          const existingPrograms = (existingCached && Array.isArray(existingCached.programs)) ? existingCached.programs : [];
          const existingRegs = (existingCached && Array.isArray(existingCached.programRegistrations)) ? existingCached.programRegistrations : [];

          // Only overwrite cache if fresh data is available; preserve existing cache if fetch returns empty
          const freshStudents = (Array.isArray(parsedStudents) && parsedStudents.length > 0) ? parsedStudents : existingStudents;
          const freshPrograms = (Array.isArray(programsData) && programsData.length > 0) ? programsData : existingPrograms;
          const freshRegs = (Array.isArray(finalRegs) && finalRegs.length > 0) ? finalRegs : existingRegs;

          // Preserve visibilityControls from existing cache or latest localStorage key — never lose toggle settings
          let preservedVisibility = (existingCached && existingCached.visibilityControls) ? existingCached.visibilityControls : null;
          if (!preservedVisibility) {
            const vRaw = localStorage.getItem(`milad_visibility_controls_${rNum}`) || localStorage.getItem(`visibility_controls_${rNum}`) || localStorage.getItem('milad_visibility_controls_latest');
            if (vRaw) { try { preservedVisibility = JSON.parse(vRaw); } catch(e){} }
          }
          const finalSnapshotVisibility = normalizeVisibilityControls(preservedVisibility || visibilityControls);

          const snapshot = {
            teams: teamsData || [],
            categories: catsData || [],
            programs: freshPrograms,
            students: freshStudents,
            resultsList: resultsData || [],
            programRegistrations: freshRegs,
            groupRegistrations: (Array.isArray(groupRegData) && groupRegData.length > 0) ? groupRegData : ((existingCached && existingCached.groupRegistrations) || []),
            timetable: parsedTimetable.length > 0 ? parsedTimetable : ((existingCached && existingCached.timetable) || []),
            eventName: loadedEventName || localEv,
            eventYear: loadedEventYear || localYr,
            convenerSadar: loadedConvenerSadar || localCS,
            coordinatorConvener: loadedCoordinatorConvener || localCC,
            visibilityControls: finalSnapshotVisibility,
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(snapshot));
        } catch (cacheSaveErr) {
          console.warn("Could not save offline cache:", cacheSaveErr);
        }
      }

    } catch (err) {
      console.warn("Data fetch warning (slow/weak network or timeout): ", err.message);
      // Fallback to cache without clearing current state
      loadCachedData(rNum);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Check if classrange column exists in categories table
  const checkClassRangeColumn = async () => {
    try {
      const { error } = await supabase.from('categories').select('classrange').limit(1);
      if (error) {
        if (error.message && (error.message.includes('classrange') || error.code === 'PGRST204')) {
          setDbHasClassRange(false);
          return;
        }
      }
      setDbHasClassRange(true);
    } catch (e) {
      setDbHasClassRange(false);
    }
  };


  // Code to add default categories to Supabase
  const checkAndInsertDefaultCategories = async (rNum) => {
    const { data } = await supabase.from('categories').select('*').eq('madrasa_id', rNum);
    if (data && data.length === 0) {
      const defaultCats = [
        { name: 'Kiddies', madrasa_id: rNum }, { name: 'Sub Junior', madrasa_id: rNum },
        { name: 'Junior', madrasa_id: rNum }, { name: 'Senior', madrasa_id: rNum },
        { name: 'Super Senior', madrasa_id: rNum }
      ];
      await supabase.from('categories').insert(defaultCats);
      const { data: updatedCats } = await supabase.from('categories').select('*').eq('madrasa_id', rNum);
      if (updatedCats) setCategories(updatedCats);
    }
  };

  const fetchMadrasas = async () => {
    // 1. Helper to extract any known local madrasas from local storage
    const getLocalMadrasas = () => {
      const madrasaMap = new Map();
      try {
        const cached = localStorage.getItem('cached_super_madrasas');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            parsed.forEach(m => { if (m && m.regNumber) madrasaMap.set(String(m.regNumber), m); });
          }
        }
      } catch (e) {}

      try {
        const session = JSON.parse(localStorage.getItem('miladfest_session') || 'null');
        if (session && session.madrasa && session.madrasa.regNumber) {
          if (!madrasaMap.has(String(session.madrasa.regNumber))) {
            madrasaMap.set(String(session.madrasa.regNumber), session.madrasa);
          }
        }
      } catch (e) {}

      return Array.from(madrasaMap.values());
    };

    // Load local madrasas immediately for instant UI render
    const localList = getLocalMadrasas();
    if (localList.length > 0) {
      setSuperMadrasas(localList);
    }

    // 2. Fetch fresh madrasas list from Supabase with automatic retry & timeout handling
    try {
      const { data, error } = await queryWithRetry(() =>
        supabase
          .from('madrasas')
          .select('*')
          .order('id', { ascending: false }),
        4,
        1000
      );

      if (error) {
        console.warn('Failed to load madrasas:', error.message);
      } else if (data && Array.isArray(data) && data.length > 0) {
        const freshMap = new Map();
        data.forEach(m => { if (m && m.regNumber) freshMap.set(String(m.regNumber), m); });

        localList.forEach(m => {
          if (m && m.regNumber && !freshMap.has(String(m.regNumber))) {
            freshMap.set(String(m.regNumber), m);
          }
        });

        const mergedList = Array.from(freshMap.values());
        setSuperMadrasas(mergedList);
        try {
          localStorage.setItem('cached_super_madrasas', JSON.stringify(mergedList));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching madrasas:', err);
    }
  };

  useEffect(() => {
    // Only fetch madrasas list on screens that actually need it — avoids unnecessary network calls on every tab switch
    if (currentScreen === 'LOGIN' || currentScreen === 'SUPER_ADMIN' || currentScreen === 'PENDING_APPROVAL') {
      fetchMadrasas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen]);

  // 🔄 Automatic App Version & Auto-Reload Checker (Detects GitHub/hosting deployments and auto-refreshes client browsers)
  const activeVersionRef = useRef(null);
  useEffect(() => {
    let isChecking = false;

    // Purge any old service workers so all mobile/desktop devices always get fresh releases
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(r => r.unregister());
      }).catch(() => {});
    }

    // Handle ChunkLoadError or stale asset load failures across iOS Safari & Android Chrome
    const handleGlobalError = (event) => {
      const msg = String(event?.message || event?.reason || '');
      if (msg.includes('Loading chunk') || msg.includes('ChunkLoadError') || msg.includes('Unexpected token')) {
        const lastReload = parseInt(localStorage.getItem('miladfest_chunk_reload') || '0', 10);
        if (Date.now() - lastReload > 10000) {
          localStorage.setItem('miladfest_chunk_reload', String(Date.now()));
          if ('caches' in window) {
            caches.keys().then(names => names.forEach(name => caches.delete(name))).catch(() => {});
          }
          window.location.reload(true);
        }
      }
    };
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);

    const checkAppVersion = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const serverVersion = data && (data.buildTime || data.version) ? String(data.buildTime || data.version) : null;
          if (!serverVersion) return;

          const savedVersion = localStorage.getItem('miladfest_app_version');

          if (!activeVersionRef.current) {
            activeVersionRef.current = serverVersion;
            if (savedVersion && savedVersion !== serverVersion) {
              localStorage.setItem('miladfest_app_version', serverVersion);
              if ('caches' in window) {
                caches.keys().then(names => names.forEach(name => caches.delete(name))).catch(() => {});
              }
              window.location.reload(true);
              return;
            }
            localStorage.setItem('miladfest_app_version', serverVersion);
          } else if (serverVersion && activeVersionRef.current !== serverVersion) {
            console.log('[AUTO-UPDATE] New release detected! Updating app across all devices...');
            activeVersionRef.current = serverVersion;
            localStorage.setItem('miladfest_app_version', serverVersion);

            const isUserTyping = typeof document !== 'undefined' && document.activeElement &&
              (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

            if (!isUserTyping) {
              if ('caches' in window) {
                caches.keys().then(names => names.forEach(name => caches.delete(name))).catch(() => {});
              }
              window.location.reload(true);
            }
          }
        }
      } catch (e) {
      } finally {
        isChecking = false;
      }
    };

    checkAppVersion();
    const interval = setInterval(checkAppVersion, 15000);

    const handleFocus = () => { checkAppVersion(); };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, []);

  useEffect(() => {
    // 🧹 Auto-purge any stale leftover default names from LocalStorage if DB does not have them
    if (loggedInMadrasa) {
      const rNum = String(loggedInMadrasa.regNumber || loggedInMadrasa.regnumber || loggedInMadrasa.reg_number || '').trim();
      if (rNum) {
        try {
          const lEv = localStorage.getItem(`event_name_${rNum}`) || '';
          const lCs = localStorage.getItem(`convener_sadar_${rNum}`) || '';
          if (lEv.includes('മധുര') || lEv.includes('Madhura') || lEv.includes('Madeena')) {
            localStorage.removeItem(`event_name_${rNum}`);
          }
          if (lCs.includes('Muhsin') || lCs.includes('Mannani')) {
            localStorage.removeItem(`convener_sadar_${rNum}`);
          }
        } catch(e){}
      }
    }
  }, [loggedInMadrasa]);

  useEffect(() => {
    if (loggedInMadrasa) {
      const rNum = loggedInMadrasa.regNumber;

      // Check schema column availability
      checkClassRangeColumn();

      // Detect madrasa switch — purge stale state immediately
      if (lastFetchRNumRef.current && lastFetchRNumRef.current !== String(rNum).trim()) {
        // Different madrasa logged in — reset everything before loading new data
        setTeams([]);
        setCategories([]);
        setPrograms([]);
        setStudents([]);
        setResultsList([]);
        setProgramRegistrations([]);
        setGroupRegistrations([]);
        setTimetable([]);
        setVisibilityControls({ scoreboard: true, results_PROGRAM_WINNERS: true, results_STUDENT_REPORT: true, results_RESULTS_HISTORY: true, results_CHAMPIONS: true });
        setEventName('');
        setEventYear('');
        setConvenerSadar('');
        setCoordinatorConvener('');
        setGeneralCatIds([]);
        isFetchingRef.current = false;
      }
      lastFetchRNumRef.current = String(rNum).trim();

      // Show loading indicator if no local cache exists yet
      const hasCache = !!localStorage.getItem(`cached_data_${rNum}`);
      if (!hasCache) {
        setIsInitialDataLoading(true);
      }

      // Immediately load cached data snapshot from local storage (instant offline UI!)
      loadCachedData(rNum);

      // Fetch fresh data from online database if online
      if (navigator.onLine) {
        fetchSupabaseData(rNum)
          .then(() => { setIsInitialDataLoading(false); })
          .catch(() => { setIsInitialDataLoading(false); });
      } else {
        setIsInitialDataLoading(false);
      }

      // 🔄 Realtime auto-refresh interval (every 5 seconds) only when online and not currently fetching
      const intervalId = setInterval(() => {
        if (navigator.onLine && !isFetchingRef.current) {
          fetchSupabaseData(rNum);
        }
      }, 5000);

      // 🔄 Sync immediately when user switches back to this browser tab
      const handleFocus = () => {
        if (navigator.onLine) {
          fetchSupabaseData(rNum);
        }
      };
      window.addEventListener('focus', handleFocus);

      // Points system is still stored in localStorage - safely parsed
      try {
        const storedPoints = localStorage.getItem(`points_${rNum}`);
        if (storedPoints) {
          setPointSystem(JSON.parse(storedPoints));
        } else {
          setPointSystem({
            p1: 5, p2: 3, p3: 1, gA: 5, gB: 3, gC: 1,
            gp1: 10, gp2: 6, gp3: 2, gpA: 5, gpB: 3, gpC: 1,
            tp1: 15, tp2: 10, tp3: 5, tpA: 5, tpB: 3, tpC: 1
          });
        }
      } catch (e) {
        console.error("Failed to parse stored points", e);
        setPointSystem({
          p1: 5, p2: 3, p3: 1, gA: 5, gB: 3, gC: 1,
          gp1: 10, gp2: 6, gp3: 2, gpA: 5, gpB: 3, gpC: 1,
          tp1: 15, tp2: 10, tp3: 5, tpA: 5, tpB: 3, tpC: 1
        });
      }

      // Load visibility controls safely from madrasa-specific cache
      try {
        const storedControls = localStorage.getItem(`milad_visibility_controls_${rNum}`) ||
                               localStorage.getItem(`visibility_controls_${rNum}`);
        if (storedControls) {
          setVisibilityControls(JSON.parse(storedControls));
        }
      } catch (e) {
        console.error("Failed to parse stored visibility controls", e);
      }

      // Checker to set default categories on first login if database is empty
      checkAndInsertDefaultCategories(rNum);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener('focus', handleFocus);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInMadrasa]);

  // 📺 Projector Mode Synchronization & Slide Rotation Effect
  useEffect(() => {
    if (!isProjectorActive || !loggedInMadrasa) return;

    const rNum = loggedInMadrasa.regNumber;

    // Auto-refresh from Supabase every 30 seconds
    const dataInterval = setInterval(() => {
      fetchSupabaseData(rNum);
    }, 30000);

    // Slide rotation every 10 seconds
    const slideInterval = setInterval(() => {
      setProjectorSlide(prev => (prev + 1) % 3);
    }, 10000);

    // ESC key support to exit projector mode
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProjectorActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(dataInterval);
      clearInterval(slideInterval);
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProjectorActive, loggedInMadrasa]);

  // 🎭 Troll Mode Auto-Rotate: ഓരോ 10 മിനിറ്റിലും dialog cycle ആകും
  useEffect(() => {
    if (!trollMode || !teams || teams.length === 0) return;

    const trollInterval = setInterval(() => {
      setTrollOffsets(prev => {
        const updated = { ...prev };
        teams.forEach(team => {
          updated[team.id] = ((prev[team.id] || 0) + 1) % 10;
        });
        return updated;
      });
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(trollInterval);
  }, [trollMode, teams]);

  // ── QR Code URL Parameter Handler ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrParam = params.get('qr');
    if (qrParam) {
      // Format: madrasaRegNum_studentId
      const parts = qrParam.split('_');
      if (parts.length >= 2) {
        const madrasaReg = parts[0];
        const studentId = parts.slice(1).join('_');
        handleQrScan(madrasaReg, studentId);
      }
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // QR scan data fetcher - INSTANT (<10ms) via LocalStorage/State with background network sync
  const handleQrScan = async (madrasaRegInput, studentIdInput) => {
    const madrasaReg = String(madrasaRegInput || '').trim();
    const studentId = String(studentIdInput || '').trim();
    if (!madrasaReg || !studentId) return;

    setQrModalOpen(true);

    // 1. Synchronous helper to build QR data object from local collections
    const buildQrDataFromLocal = (localMadrasa, localStudents, localTeams, localCats, localProgs, localResults, localProgRegs, localGroupRegs) => {
      const studentObj = (localStudents || []).find(s =>
        String(s.id) === studentId ||
        String(s.regno || s.regNo || '').trim() === studentId
      );
      if (!studentObj) return null;

      const [actualPlace] = (localMadrasa?.place || '').split('|');
      const teamObj = (localTeams || []).find(t => String(t.id) === String(studentObj.teamid || studentObj.teamId || ''));
      const catObj = (localCats || []).find(c => String(c.id) === String(studentObj.catid || studentObj.catId || ''));

      const sDbId = studentObj.id;
      const sRegNo = String(studentObj.regno || studentObj.regNo || '').trim();
      const sName = String(studentObj.name || '').trim();

      // Individual program registrations
      const userRegs = (localProgRegs || []).filter(r =>
        String(r.student_id) === String(sDbId) ||
        (sRegNo && String(r.student_id) === sRegNo)
      );
      const individualProgIds = userRegs.map(r => String(r.program_name || r.program_id || ''));

      // Matched results
      const matchedResults = (localResults || []).filter(r => {
        const rName = String(r.studentname || r.studentName || '').trim();
        if (r.student_id && (String(r.student_id) === String(sDbId) || (sRegNo && String(r.student_id) === sRegNo))) return true;
        if (sRegNo && (rName.startsWith(sRegNo + ' -') || rName.startsWith(sRegNo + '-') || rName.startsWith(sRegNo + ' ') || rName === sRegNo)) return true;
        if (sName && rName.toLowerCase().includes(sName.toLowerCase())) return true;
        return false;
      }).map(r => {
        const prog = (localProgs || []).find(p => String(p.id) === String(r.progid) || p.code === String(r.progid) || p.name === String(r.progid));
        return {
          ...r,
          progname: r.progname || (prog ? prog.name : 'Unknown Program'),
        };
      });

      const resultMap = new Map();
      matchedResults.forEach(r => {
        const pKey = String(r.progid);
        if (!resultMap.has(pKey)) resultMap.set(pKey, r);
        else {
          const existing = resultMap.get(pKey);
          if ((!existing.place || existing.place === 'No Place') && r.place && r.place !== 'No Place') {
            resultMap.set(pKey, r);
          }
        }
      });
      const studentResults = Array.from(resultMap.values());

      const resultProgIds = studentResults.map(r => String(r.progid));
      const registeredWithNoResult = individualProgIds
        .filter(pid => pid && !resultProgIds.includes(String(pid)))
        .map(pid => {
          const prog = (localProgs || []).find(p => String(p.id) === String(pid) || p.code === String(pid) || p.name === String(pid));
          return {
            progid: pid,
            progname: prog ? `${prog.code ? prog.code + ' – ' : ''}${prog.name}` : 'Program #' + pid,
            place: null,
            grade: null,
            pending: true
          };
        });

      const allIndividualResults = [...studentResults, ...registeredWithNoResult].sort((a, b) => {
        const progA = (localProgs || []).find(p => String(p.id) === String(a.progid));
        const progB = (localProgs || []).find(p => String(p.id) === String(b.progid));
        const codeA = progA ? String(progA.code || '') : '';
        const codeB = progB ? String(progB.code || '') : '';
        return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
      });

      const studentGroups = (localGroupRegs || []).filter(g => {
        const memberIds = Array.isArray(g.student_ids) ? g.student_ids : [];
        return memberIds.some(id => String(id) === String(sDbId) || (sRegNo && String(id) === sRegNo));
      });

      const resolvedGroupResults = studentGroups.map(g => {
        const prog = (localProgs || []).find(p => String(p.id) === String(g.program_id));
        const result = (localResults || []).find(r => String(r.progid) === String(g.program_id) && r.studentname === g.group_name);
        return {
          progid: g.program_id,
          progname: prog ? prog.name : 'Unknown Program',
          progtype: 'GROUP',
          groupName: g.group_name,
          place: result ? result.place : null,
          grade: result ? result.grade : null,
          isGroup: true
        };
      });

      return {
        madrasa: localMadrasa ? { ...localMadrasa, place: actualPlace } : null,
        student: studentObj,
        team: teamObj,
        category: catObj,
        results: allIndividualResults,
        groupResults: resolvedGroupResults,
        programs: localProgs || [],
        groupRegistrations: studentGroups
      };
    };

    // 🚀 2. Check LocalStorage cache & state first for INSTANT UI render (<10ms)
    let localData = null;
    try {
      const rawCache = localStorage.getItem(`cached_data_${madrasaReg}`);
      if (rawCache) {
        const c = JSON.parse(rawCache);
        localData = buildQrDataFromLocal(
          c.madrasa || loggedInMadrasa,
          c.students || students,
          c.teams || teams,
          c.categories || categories,
          c.programs || programs,
          c.resultsList || resultsList,
          c.programRegistrations || programRegistrations,
          c.groupRegistrations || groupRegistrations
        );
      }
    } catch(e) {}

    if (!localData && students.length > 0) {
      localData = buildQrDataFromLocal(
        loggedInMadrasa,
        students,
        teams,
        categories,
        programs,
        resultsList,
        programRegistrations,
        groupRegistrations
      );
    }

    if (localData) {
      setQrModalData(localData);
      setQrModalLoading(false);
    } else {
      setQrModalLoading(true);
    }

    // 🌐 3. Background network sync to fetch fresh student data from Supabase
    try {
      const sIdInt = parseInt(studentId, 10);
      const isSIdNum = !isNaN(sIdInt) && String(sIdInt) === String(studentId).trim();
      const mRegInt = parseInt(madrasaReg, 10);
      const isMRegNum = !isNaN(mRegInt) && String(mRegInt) === String(madrasaReg).trim();

      const mIds = isMRegNum ? [madrasaReg, mRegInt] : [madrasaReg];
      const mIdList = Array.from(new Set(mIds));

      const [
        { data: madrasaData },
        { data: studentDataList },
        { data: resultsData },
        { data: teamsData },
        { data: catsData },
        { data: progsData },
        { data: regData },
        { data: gRegsData }
      ] = await Promise.all([
        supabase.from('madrasas').select('*').in('regNumber', mIdList).maybeSingle(),
        isSIdNum ? supabase.from('students').select('*').in('madrasa_id', mIdList).or(`id.eq."${sIdInt}",regno.eq."${studentId}"`) : supabase.from('students').select('*').in('madrasa_id', mIdList).or(`id.eq."${studentId}",regno.eq."${studentId}"`),
        supabase.from('results').select('*').in('madrasa_id', mIdList),
        supabase.from('teams').select('*').in('madrasa_id', mIdList),
        supabase.from('categories').select('*').in('madrasa_id', mIdList),
        supabase.from('programs').select('*').in('madrasa_id', mIdList),
        supabase.from('program_registrations').select('*').in('madrasa_id', mIdList),
        supabase.from('group_registrations').select('*').in('madrasa_id', mIdList)
      ]);

      const fetchedStudent = Array.isArray(studentDataList) ? studentDataList[0] : null;

      if (!fetchedStudent && !localData) {
        setQrModalData({ error: lang === 'EN' ? 'Student not found!' : 'വിദ്യാർത്ഥിയെ കണ്ടെത്താനായില്ല!' });
        setQrModalLoading(false);
        return;
      }

      if (fetchedStudent) {
        const freshData = buildQrDataFromLocal(
          madrasaData || loggedInMadrasa,
          [fetchedStudent],
          teamsData || teams,
          catsData || categories,
          progsData || programs,
          resultsData || resultsList,
          regData || programRegistrations,
          gRegsData || groupRegistrations
        );

        if (freshData) {
          setQrModalData(freshData);
        }
      }
    } catch (err) {
      console.warn("QR network fetch warning:", err);
      if (!localData) {
        setQrModalData({ error: lang === 'EN' ? 'Network error scanning QR' : 'QR സ്കാൻ ചെയ്യുന്നതിൽ തടസ്സം നേരിട്ടു!' });
      }
    } finally {
      setQrModalLoading(false);
    }
  };

  // Generate QR code data URL
  // eslint-disable-next-line no-unused-vars
  const generateQrDataUrl = useCallback(async (madrasaReg, studentId) => {
    const appUrl = window.location.origin;
    const qrUrl = `${appUrl}/?qr=${madrasaReg}_${studentId}`;
    try {
      return await QRCode.toDataURL(qrUrl, { width: 200, margin: 1, color: { dark: '#064e3b', light: '#ffffff' } });
    } catch { return null; }
  }, []);


  // PWA Install prompt setup – auto show notification popup
  useEffect(() => {
    // Detect if already running as installed PWA (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      // App is installed & running standalone – never show the popup
      setShowInstallPopup(false);
      return;
    }

    // Detect iOS device / macOS Safari (Apple ecosystem)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    setIsIosDevice(isIos);

    // Auto-show the install notification popup (only in browser mode)
    setShowInstallPopup(true);

    // Android / Chrome – capture the install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Track when app gets installed
    const handleAppInstalled = () => {
      setShowInstallPopup(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle the "Install" button click (Android)
  const handleInstallApp = async () => {
    const prompt = deferredPromptRef.current;
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPopup(false);
      }
      deferredPromptRef.current = null;
      setDeferredPrompt(null);
    } else {
      // Fallback if beforeinstallprompt hasn't fired
      alert(t('alertBrowserInstallPrompt'));
      setShowInstallPopup(false);
    }
  };

  // Handle "Cancel" button – just dismiss the popup
  const handleDismissInstall = () => {
    setShowInstallPopup(false);
  };



  const saveToStorage = (key, data) => {
    if (!loggedInMadrasa) return;
    localStorage.setItem(`${key}_${loggedInMadrasa.regNumber}`, JSON.stringify(data));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedReg = String(loginRegNum || '').trim();
    const trimmedPass = String(loginPassword || '').trim();

    if (!trimmedReg || !trimmedPass) {
      alert(t('alertPleaseFillDetails'));
      return;
    }

    setIsLoggingIn(true);
    try {
      let madrasa = null;
      const numReg = parseInt(trimmedReg, 10);
      const isNum = !isNaN(numReg) && String(numReg) === String(trimmedReg).trim();
      const loginFilterStr = isNum ? `regNumber.eq."${trimmedReg}",regNumber.eq."${numReg}"` : `regNumber.eq."${trimmedReg}"`;

      // 1. Direct targeted query on regNumber
      try {
        const { data: mData } = await queryWithRetry(() =>
          supabase
            .from('madrasas')
            .select('*')
            .or(loginFilterStr)
        );
        if (mData && mData.length > 0) {
          madrasa = mData[0];
        }
      } catch (e) {
        console.warn("Direct madrasa fetch error:", e);
      }

      // 2. Fallback: Search all madrasas if regNumber format differs
      // ⚡ EGRESS FIX: Only fetch login-required columns (NO photos/heavy data)
      if (!madrasa) {
        try {
          const { data: allMadrasas } = await queryWithRetry(() =>
            supabase.from('madrasas').select('id,regNumber,regnumber,reg_number,name,place,adminPassword,admin_password,adminpass,viewPassword,view_password,viewpass,status')
          );
          if (allMadrasas && allMadrasas.length > 0) {
            madrasa = allMadrasas.find(m =>
              String(m.regNumber || m.regnumber || m.reg_number || '').trim().toLowerCase() === trimmedReg.toLowerCase()
            );
          }
        } catch (e) {}
      }

      // 3. Fallback to LocalStorage superMadrasas cache if device is offline or DB empty
      if (!madrasa) {
        const localList = superMadrasas && superMadrasas.length > 0 ? superMadrasas : (() => {
          try { return JSON.parse(localStorage.getItem('cached_super_madrasas') || '[]'); } catch { return []; }
        })();
        madrasa = localList.find(m =>
          String(m.regNumber || m.regnumber || m.reg_number || '').trim().toLowerCase() === trimmedReg.toLowerCase()
        );
      }

      if (!madrasa) {
        alert(t('alertMadrasaNotFound'));
        setIsLoggingIn(false);
        return;
      }

      const adminPass = String(madrasa.adminPassword || madrasa.admin_password || madrasa.adminpass || '').trim();
      const viewPass = String(madrasa.viewPassword || madrasa.view_password || madrasa.viewpass || '').trim();

      const isAdminMatch = trimmedPass.toLowerCase() === adminPass.toLowerCase();
      const isViewMatch = trimmedPass.toLowerCase() === viewPass.toLowerCase();

      if (isAdminMatch || isViewMatch) {
        const [actualPlace, status, trollStatus, dbTrollLang, dbEventName, dbEventYear, dbGeneralCats, dbConvenerSadar, dbVisCtrls, dbCoordinatorConvener] = (madrasa.place || '').split('|');
        const currentStatus = status || 'approved'; // Default to approved if no suffix

        if (currentStatus === 'pending') {
          setPendingMadrasa(madrasa);
          setCurrentScreen('PENDING_APPROVAL');
          setIsLoggingIn(false);
          return;
        } else if (currentStatus === 'blocked') {
          alert(t('alertMadrasaBlocked'));
          setIsLoggingIn(false);
          return;
        }

        // Approved, proceed to login
        const role = isAdminMatch ? 'ADMIN' : 'VIEW';
        const sanitizedMadrasa = {
          ...madrasa,
          regNumber: String(madrasa.regNumber || madrasa.regnumber || madrasa.reg_number || trimmedReg).trim(),
          place: actualPlace
        };
        setLoggedInMadrasa(sanitizedMadrasa);
        setLoginRole(role);
        setCurrentScreen('DASHBOARD');
        setActiveTab('SCOREBOARD');

        // 🎭 Sync troll mode & settings from database
        setTrollMode(trollStatus === 'troll_on');
        setTrollLang(dbTrollLang === 'EN' ? 'EN' : 'ML');

        let loginVis = null;
        if (madrasa.visibility_controls) {
          try {
            loginVis = typeof madrasa.visibility_controls === 'string'
              ? JSON.parse(madrasa.visibility_controls)
              : madrasa.visibility_controls;
          } catch(e) {}
        }
        const mParts = (madrasa.place || '').split('|');
        if ((!loginVis || typeof loginVis !== 'object') && mParts[8]) {
          try {
            loginVis = JSON.parse(decodeURIComponent(mParts[8]));
          } catch(e) {}
        }
        const normalizedLoginVis = normalizeVisibilityControls(loginVis);
        setVisibilityControls(normalizedLoginVis);
        const rNumStr = String(sanitizedMadrasa.regNumber).trim();
        try {
          localStorage.setItem(`visibility_controls_${rNumStr}`, JSON.stringify(normalizedLoginVis));
          localStorage.setItem(`milad_visibility_controls_${rNumStr}`, JSON.stringify(normalizedLoginVis));
          localStorage.setItem(`milad_visibility_controls_latest`, JSON.stringify(normalizedLoginVis));
        } catch(e) {}
        const loadedEventName = dbEventName ? decodeURIComponent(dbEventName) : '';
        const loadedEventYear = dbEventYear ? decodeURIComponent(dbEventYear) : '';
        const loadedConvenerSadar = dbConvenerSadar ? decodeURIComponent(dbConvenerSadar) : '';
        const loadedCoordinatorConvener = dbCoordinatorConvener ? decodeURIComponent(dbCoordinatorConvener) : '';
        setEventName(loadedEventName);
        setEventYear(loadedEventYear);
        setConvenerSadar(loadedConvenerSadar);
        setCoordinatorConvener(loadedCoordinatorConvener);
        // At login time, always set inputs (user can't be typing yet at login)
        setEventNameInput(loadedEventName);
        setEventYearInput(loadedEventYear);
        setConvenerSadarInput(loadedConvenerSadar);
        setCoordinatorConvenerInput(loadedCoordinatorConvener);
        try {
          const loadedGeneral = dbGeneralCats ? JSON.parse(decodeURIComponent(dbGeneralCats)) : [];
          setGeneralCatIds(Array.isArray(loadedGeneral) ? loadedGeneral : []);
        } catch (e) {
          setGeneralCatIds([]);
        }

        // 💾 Save minimal session (tiny size) to localStorage & sessionStorage so login NEVER resets on refresh
        const minimalMadrasa = {
          id: madrasa.id,
          name: madrasa.name,
          regNumber: String(madrasa.regNumber || madrasa.regnumber || madrasa.reg_number || '').trim(),
          place: String(madrasa.place || '').split('|')[0]
        };
        const sessionObj = { madrasa: minimalMadrasa, role };
        safeSetLocalStorage('miladfest_session', sessionObj);
        try { sessionStorage.setItem('miladfest_session', JSON.stringify(sessionObj)); } catch(e){}

        // Load data immediately for this logged in madrasa
        fetchSupabaseData(sanitizedMadrasa.regNumber);

        // Clear login form
        setLoginRegNum('');
        setLoginPassword('');
      } else {
        alert(t('alertIncorrectPassword'));
      }
    } catch (err) {
      alert(t('alertUnexpectedError') + getFriendlyErrorMessage(err.message));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterMadrasa = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regNumber.trim() || !regPlace.trim() || !adminPassword.trim() || !viewPassword.trim()) {
      alert(t('alertPleaseFillDetails'));
      return;
    }

    try {
      // Check if the regNumber is unique in Supabase
      const { data: existing, error: checkError } = await queryWithRetry(() =>
        supabase
          .from('madrasas')
          .select('regNumber')
          .eq('regNumber', regNumber)
      );

      if (checkError) {
        alert(t('alertUnexpectedError') + getFriendlyErrorMessage(checkError.message));
        return;
      }

      if (existing && existing.length > 0) {
        alert(t('alertRegNumberExists'));
        return;
      }

      // Insert Madrasa with pending suffix in place
      const { error } = await queryWithRetry(() =>
        supabase
          .from('madrasas')
          .insert([
            {
              name: regName,
              regNumber: regNumber,
              place: `${regPlace}|pending`,
              adminPassword: adminPassword,
              viewPassword: viewPassword
            }
          ])
      );

      if (error) {
        alert(t('alertUnexpectedError') + getFriendlyErrorMessage(error.message));
      } else {
        alert(t('alertRegistrationSubmitted'));
        const tempMadrasa = { name: regName, regNumber, place: `${regPlace}|pending`, adminPassword, viewPassword };
        setPendingMadrasa(tempMadrasa);
        setSuperMadrasas(prev => {
          const updated = [tempMadrasa, ...prev.filter(m => String(m.regNumber) !== String(regNumber))];
          try { localStorage.setItem('cached_super_madrasas', JSON.stringify(updated)); } catch(e){}
          return updated;
        });
        setRegName(''); setRegNumber(''); setRegPlace(''); setAdminPassword(''); setViewPassword('');
        setCurrentScreen('PENDING_APPROVAL');
      }
    } catch (err) {
      alert(t('alertUnexpectedError') + getFriendlyErrorMessage(err.message));
    }
  };



  // Helper to safely construct full 10-part place string for Supabase:
  // Parts: PLACE|STATUS|TROLL_STATUS|TROLL_LANG|EVENT_NAME|EVENT_YEAR|GENERAL_CATS|CONVENER_SADAR|VISIBILITY_CONTROLS|COORDINATOR_CONVENER
  const makePlaceString = (rawPlace, overrides = {}) => {
    const parts = (rawPlace || '').split('|');
    const actualPlace = overrides.place !== undefined ? overrides.place : (parts[0] || (loggedInMadrasa ? loggedInMadrasa.place : ''));
    const status = overrides.status !== undefined ? overrides.status : (parts[1] || 'approved');
    const trollSt = overrides.trollStatus !== undefined ? overrides.trollStatus : (parts[2] || (trollMode ? 'troll_on' : 'troll_off'));
    const trollLng = overrides.trollLang !== undefined ? overrides.trollLang : (parts[3] || (trollLang === 'EN' ? 'EN' : 'ML'));
    const evName = overrides.eventName !== undefined ? overrides.eventName : (parts[4] ? parts[4] : (eventName ? encodeURIComponent(eventName) : ''));
    const evYear = overrides.eventYear !== undefined ? overrides.eventYear : (parts[5] ? parts[5] : (eventYear ? encodeURIComponent(eventYear) : ''));
    const genCats = overrides.generalCats !== undefined ? overrides.generalCats : (parts[6] ? parts[6] : (generalCatIds.length > 0 ? encodeURIComponent(JSON.stringify(generalCatIds)) : ''));
    const csVal = overrides.convenerSadar !== undefined ? overrides.convenerSadar : (parts[7] ? parts[7] : (convenerSadar ? encodeURIComponent(convenerSadar) : ''));
    let rawVisVal = overrides.visibilityControls !== undefined ? overrides.visibilityControls : (parts[8] || (visibilityControls ? JSON.stringify(visibilityControls) : null));
    if (typeof rawVisVal === 'string') {
      try { rawVisVal = JSON.parse(decodeURIComponent(rawVisVal)); } catch (e) {
        try { rawVisVal = JSON.parse(rawVisVal); } catch (e2) {}
      }
    }
    const normalizedVisObj = normalizeVisibilityControls(rawVisVal);
    const visCtrls = encodeURIComponent(JSON.stringify(normalizedVisObj));
    const ccVal = overrides.coordinatorConvener !== undefined ? overrides.coordinatorConvener : (parts[9] ? parts[9] : (coordinatorConvener ? encodeURIComponent(coordinatorConvener) : ''));

    return `${actualPlace}|${status}|${trollSt}|${trollLng}|${evName}|${evYear}|${genCats}|${csVal}|${visCtrls}|${ccVal}`;
  };

  const handleApproveMadrasa = async (madrasa) => {
    const updatedPlace = makePlaceString(madrasa.place, { status: 'approved' });
    setSuperMadrasas(prev => prev.map(m => m.id === madrasa.id ? { ...m, place: updatedPlace } : m));

    try {
      const { error } = await supabase
        .from('madrasas')
        .update({ place: updatedPlace })
        .eq('id', madrasa.id);

      if (error) {
        alert('Error approving madrasa: ' + getFriendlyErrorMessage(error.message));
        fetchMadrasas();
      } else {
        alert('✅ Madrasa approved successfully!');
      }
    } catch (err) {
      alert('Error approving madrasa: ' + getFriendlyErrorMessage(err.message));
      fetchMadrasas();
    }
  };

  const handleBlockMadrasa = async (madrasa) => {
    const updatedPlace = makePlaceString(madrasa.place, { status: 'blocked' });
    setSuperMadrasas(prev => prev.map(m => m.id === madrasa.id ? { ...m, place: updatedPlace } : m));

    try {
      const { error } = await supabase
        .from('madrasas')
        .update({ place: updatedPlace })
        .eq('id', madrasa.id);

      if (error) {
        alert('Error blocking madrasa: ' + getFriendlyErrorMessage(error.message));
        fetchMadrasas();
      } else {
        alert('🛑 Madrasa blocked!');
      }
    } catch (err) {
      alert('Error blocking madrasa: ' + getFriendlyErrorMessage(err.message));
      fetchMadrasas();
    }
  };

  const handleDeleteMadrasa = async (id) => {
    if (!window.confirm('Remove this madrasa? All registered data will be deleted.')) return;
    const originalSuper = [...superMadrasas];
    setSuperMadrasas(prev => prev.filter(m => m.id !== id));

    try {
      const { error } = await supabase
        .from('madrasas')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Error deleting madrasa: ' + getFriendlyErrorMessage(error.message));
        setSuperMadrasas(originalSuper);
      } else {
        alert('🗑️ Madrasa deleted successfully!');
      }
    } catch (err) {
      alert('Error deleting madrasa: ' + getFriendlyErrorMessage(err.message));
      setSuperMadrasas(originalSuper);
    }
  };

  const startEditMadrasa = (madrasa) => {
    const [actualPlace] = (madrasa.place || '').split('|');
    setEditingMadrasaId(madrasa.id);
    setEditingMadrasaData({
      ...madrasa,
      name: madrasa.name || '',
      regNumber: madrasa.regNumber || madrasa.regnumber || madrasa.reg_number || '',
      tempPlace: actualPlace || '',
      adminPassword: madrasa.adminPassword || madrasa.admin_password || '',
      viewPassword: madrasa.viewPassword || madrasa.view_password || ''
    });
  };

  const handleSaveMadrasaEdit = async () => {
    const name = (editingMadrasaData.name || '').trim();
    const regNumber = (editingMadrasaData.regNumber || '').trim();
    const tempPlace = (editingMadrasaData.tempPlace || '').trim();
    const adminPassword = (editingMadrasaData.adminPassword || '').trim();
    const viewPassword = (editingMadrasaData.viewPassword || '').trim();

    if (!name || !regNumber || !tempPlace) {
      alert('Please fill in Name, Register Number, and Place!');
      return;
    }

    // Check if the regNumber is unique among other madrasas
    const duplicate = superMadrasas.find(
      m => String(m.regNumber) === String(regNumber) && m.id !== editingMadrasaId
    );
    if (duplicate) {
      alert('This register number already exists!');
      return;
    }

    const updatedPlace = makePlaceString(editingMadrasaData.place, { place: tempPlace });

    const updatePayload = {
      name,
      regNumber,
      place: updatedPlace,
      ...(adminPassword ? { adminPassword } : {}),
      ...(viewPassword ? { viewPassword } : {})
    };

    const originalSuper = [...superMadrasas];
    setSuperMadrasas(prev => prev.map(m => m.id === editingMadrasaId ? { ...m, ...updatePayload, place: updatedPlace } : m));
    const targetId = editingMadrasaId;
    setEditingMadrasaId(null);

    try {
      const { error } = await supabase
        .from('madrasas')
        .update(updatePayload)
        .eq('id', targetId);

      if (error) {
        alert('Error updating madrasa: ' + getFriendlyErrorMessage(error.message));
        setSuperMadrasas(originalSuper);
      } else {
        alert('✅ Madrasa details updated successfully!');
      }
    } catch (err) {
      alert('Error updating madrasa: ' + getFriendlyErrorMessage(err.message));
      setSuperMadrasas(originalSuper);
    }
  };

  // ── LIVE SCORE POSTER GENERATOR (Admin Only) ──
  const handleGenerateLivePoster = () => {
    try {
      const canvas = document.createElement('canvas');
      const W = 1080;
      const H = 1350; // 4:5 portrait ratio (WhatsApp/Instagram friendly)
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // --- Background Gradient ---
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.5, '#1e293b');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // --- Decorative border glow ---
      ctx.save();
      ctx.strokeStyle = 'rgba(251,191,36,0.25)';
      ctx.lineWidth = 3;
      ctx.strokeRect(18, 18, W - 36, H - 36);
      ctx.strokeStyle = 'rgba(251,191,36,0.08)';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, W - 20, H - 20);
      ctx.restore();

      // --- Helper: draw rounded rect ---
      const roundRect = (x, y, w, h, r, fill, stroke, strokeW) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeW || 2; ctx.stroke(); }
      };

      // --- Helper: wrap text ---
      const wrapText = (text, x, y, maxW, lineH) => {
        const words = text.split(' ');
        let line = '';
        let curY = y;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          if (ctx.measureText(testLine).width > maxW && n > 0) {
            ctx.fillText(line.trim(), x, curY);
            line = words[n] + ' ';
            curY += lineH;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), x, curY);
        return curY;
      };

      const madrasaName = loggedInMadrasa ? (loggedInMadrasa.name || '') : '';
      const madrasaPlace = loggedInMadrasa ? (loggedInMadrasa.place || '') : '';
      const madrasaReg = loggedInMadrasa ? (loggedInMadrasa.regNumber || '') : '';
      const festName = eventName || 'Milad Fest';

      // --- HEADER SECTION ---
      // Top glow strip
      const topGlow = ctx.createLinearGradient(0, 0, W, 0);
      topGlow.addColorStop(0, 'rgba(251,191,36,0)');
      topGlow.addColorStop(0.5, 'rgba(251,191,36,0.15)');
      topGlow.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, W, 120);

      // Star/Crescent decorative icon (unicode)
      ctx.font = 'bold 52px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('☪️', W / 2, 72);

      // Madrasa Name
      ctx.font = 'bold 42px Arial';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      wrapText(madrasaName.toUpperCase(), W / 2, 130, W - 80, 48);

      // Place & Reg
      ctx.font = '26px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${madrasaPlace}  |  Reg: ${madrasaReg}`, W / 2, 195);

      // Divider line
      const divGrad = ctx.createLinearGradient(60, 0, W - 60, 0);
      divGrad.addColorStop(0, 'rgba(251,191,36,0)');
      divGrad.addColorStop(0.5, 'rgba(251,191,36,0.8)');
      divGrad.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(60, 218); ctx.lineTo(W - 60, 218); ctx.stroke();

      // Event Name (Big heading)
      ctx.font = 'bold 54px Arial';
      const evGrad = ctx.createLinearGradient(0, 230, W, 300);
      evGrad.addColorStop(0, '#fbbf24');
      evGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = evGrad;
      ctx.textAlign = 'center';
      wrapText(festName, W / 2, 275, W - 80, 62);

      // "LIVE SCOREBOARD" subtitle
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#22d3ee';
      ctx.fillText('🔴 LIVE SCOREBOARD', W / 2, 345);

      // --- TEAM SCORES ---
      const sortedTeams = [...teams].sort((a, b) => getTeamTotalPoints(b.id) - getTeamTotalPoints(a.id));
      const medals = ['🥇', '🥈', '🥉'];
      const rankColors = [
        { bg: 'rgba(251,191,36,0.15)', border: '#fbbf24', text: '#fbbf24', pts: '#fff' },
        { bg: 'rgba(148,163,184,0.12)', border: '#94a3b8', text: '#94a3b8', pts: '#e2e8f0' },
        { bg: 'rgba(180,83,9,0.12)', border: '#b45309', text: '#cd7c3a', pts: '#e2e8f0' },
      ];

      let cardY = 380;

      sortedTeams.slice(0, 5).forEach((team, idx) => {
        const pts = getTeamTotalPoints(team.id);
        const isFirst = idx === 0;
        const col = rankColors[idx] || { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)', text: '#64748b', pts: '#94a3b8' };
        const cardH = isFirst ? 190 : 140;
        const cardX = isFirst ? 40 : 70;
        const cardW = isFirst ? W - 80 : W - 140;

        // Card background
        roundRect(cardX, cardY, cardW, cardH, 18, col.bg, col.border, isFirst ? 2.5 : 1.5);

        // Rank badge
        if (isFirst) {
          // Glowing 1st place crown
          ctx.font = '56px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(medals[0] || `#${idx + 1}`, cardX + 24, cardY + 72);

          // Team Name
          ctx.font = 'bold 52px Arial';
          ctx.fillStyle = col.text;
          ctx.textAlign = 'left';
          const teamNameX = cardX + 100;
          const tn = team.name || 'Team';
          const tnMax = cardW - 200;
          if (ctx.measureText(tn).width > tnMax) {
            ctx.font = 'bold 38px Arial';
          }
          ctx.fillText(tn, teamNameX, cardY + 68);

          // Points
          ctx.font = 'bold 44px Arial';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'right';
          ctx.fillText(`${pts} pts`, cardX + cardW - 24, cardY + 68);

          // "LEADING" badge
          roundRect(cardX + 24, cardY + 100, 160, 40, 10, '#fbbf24', null, 0);
          ctx.font = 'bold 20px Arial';
          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.fillText('🏆 LEADING', cardX + 104, cardY + 126);

          cardY += cardH + 20;
        } else {
          // 2nd, 3rd... smaller cards
          ctx.font = '34px Arial';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#fff';
          ctx.fillText(medals[idx] || `#${idx + 1}`, cardX + 18, cardY + 88);

          ctx.font = `bold ${idx <= 2 ? 36 : 30}px Arial`;
          ctx.fillStyle = col.text;
          ctx.textAlign = 'left';
          const tn2 = team.name || 'Team';
          const tn2Max = cardW - 170;
          if (ctx.measureText(tn2).width > tn2Max) {
            ctx.font = `bold 26px Arial`;
          }
          ctx.fillText(tn2, cardX + 72, cardY + 88);

          ctx.font = 'bold 34px Arial';
          ctx.fillStyle = col.pts;
          ctx.textAlign = 'right';
          ctx.fillText(`${pts} pts`, cardX + cardW - 18, cardY + 88);

          cardY += cardH + 14;
        }
      });

      // --- FOOTER ---
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      // Bottom divider
      const divGrad2 = ctx.createLinearGradient(60, 0, W - 60, 0);
      divGrad2.addColorStop(0, 'rgba(251,191,36,0)');
      divGrad2.addColorStop(0.5, 'rgba(251,191,36,0.5)');
      divGrad2.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.strokeStyle = divGrad2;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(60, H - 55); ctx.lineTo(W - 60, H - 55); ctx.stroke();

      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(100,116,139,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(`Updated: ${dateStr}, ${timeStr}`, W / 2, H - 26);

      // --- DOWNLOAD ---
      const link = document.createElement('a');
      link.download = `${festName.replace(/\s+/g, '_')}_LiveScore_${dateStr.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.warn('Poster generation error:', e);
      alert('Poster download failed. Please try again.');
    }
  };

  const handleToggleTrollMode = async () => {
    const newTrollMode = !trollMode;
    setTrollMode(newTrollMode);

    if (loggedInMadrasa) {
      try {
        const { data: madrasaData } = await supabase
          .from('madrasas')
          .select('place')
          .eq('regNumber', loggedInMadrasa.regNumber)
          .maybeSingle();

        const fullPlace = madrasaData ? madrasaData.place : loggedInMadrasa.place;
        const updatedPlace = makePlaceString(fullPlace, { trollStatus: newTrollMode ? 'troll_on' : 'troll_off' });

        await supabase
          .from('madrasas')
          .update({ place: updatedPlace })
          .eq('regNumber', loggedInMadrasa.regNumber);
      } catch (err) {
        console.error("Failed to sync troll mode to DB:", err);
      }
    }
  };

  const handleToggleTrollLang = async () => {
    const newTrollLang = trollLang === 'EN' ? 'ML' : 'EN';
    setTrollLang(newTrollLang);

    if (loggedInMadrasa) {
      try {
        const { data: madrasaData } = await supabase
          .from('madrasas')
          .select('place')
          .eq('regNumber', loggedInMadrasa.regNumber)
          .maybeSingle();

        const fullPlace = madrasaData ? madrasaData.place : loggedInMadrasa.place;
        const updatedPlace = makePlaceString(fullPlace, { trollLang: newTrollLang });

        await supabase
          .from('madrasas')
          .update({ place: updatedPlace })
          .eq('regNumber', loggedInMadrasa.regNumber);
      } catch (err) {
        console.error("Failed to sync troll lang to DB:", err);
      }
    }
  };

  // 🚩 1. TEAM ACTIONS (SUPABASE) - BULLETPROOF & NON-FLICKERING
  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || !loggedInMadrasa) return;
    const rNum = loggedInMadrasa.regNumber;
    const tempId = 'temp_' + Date.now();
    const savedName = newTeamName.trim();
    const newTeamObj = { id: tempId, name: savedName, madrasa_id: String(rNum) };

    setTeams(prev => {
      const updated = [...prev, newTeamObj];
      safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
        const cacheObj = rawCache ? JSON.parse(rawCache) : {};
        cacheObj.teams = updated;
        return JSON.stringify(cacheObj);
      });
      return updated;
    });
    setNewTeamName('');

    try {
      const numReg = parseInt(rNum, 10);
      const mIdVal = (!isNaN(numReg) && String(numReg) === String(rNum).trim()) ? numReg : String(rNum);
      const { data, error } = await supabase
        .from('teams')
        .insert([{ name: savedName, madrasa_id: mIdVal }])
        .select();

      if (error) {
        alert('Error adding team: ' + getFriendlyErrorMessage(error.message));
        setTeams(prev => {
          const reverted = prev.filter(t => t.id !== tempId);
          safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
            const cacheObj = rawCache ? JSON.parse(rawCache) : {};
            cacheObj.teams = reverted;
            return JSON.stringify(cacheObj);
          });
          return reverted;
        });
      } else if (data && data[0]) {
        const realTeam = data[0];
        setTeams(prev => {
          const finalized = prev.map(t => String(t.id) === String(tempId) ? realTeam : t);
          safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
            const cacheObj = rawCache ? JSON.parse(rawCache) : {};
            cacheObj.teams = finalized;
            return JSON.stringify(cacheObj);
          });
          return finalized;
        });
      }
    } catch (err) {
      alert('Error adding team: ' + getFriendlyErrorMessage(err.message));
      setTeams(prev => {
        const reverted = prev.filter(t => t.id !== tempId);
        safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
          const cacheObj = rawCache ? JSON.parse(rawCache) : {};
          cacheObj.teams = reverted;
          return JSON.stringify(cacheObj);
        });
        return reverted;
      });
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm(lang === 'EN' ? 'Remove this team?' : 'ഈ ടീം നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?')) return;
    const rNum = loggedInMadrasa?.regNumber;
    const originalTeams = [...teams];
    setTeams(prev => {
      const updated = prev.filter(t => String(t.id) !== String(id));
      if (rNum) {
        safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
          const cacheObj = rawCache ? JSON.parse(rawCache) : {};
          cacheObj.teams = updated;
          return JSON.stringify(cacheObj);
        });
      }
      return updated;
    });
    try {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) {
        alert(getFriendlyErrorMessage(error.message));
        setTeams(prev => {
          if (rNum) {
            safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
              const cacheObj = rawCache ? JSON.parse(rawCache) : {};
              cacheObj.teams = originalTeams;
              return JSON.stringify(cacheObj);
            });
          }
          return originalTeams;
        });
      }
    } catch (e) {}
  };

  const handleSaveTeamEdit = async () => {
    if (!editingTeamName.trim()) return;
    const rNum = loggedInMadrasa?.regNumber;
    const targetId = editingTeamId;
    const updatedName = editingTeamName.trim();
    setTeams(prev => {
      const updated = prev.map(t => String(t.id) === String(targetId) ? { ...t, name: updatedName } : t);
      if (rNum) {
        safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
          const cacheObj = rawCache ? JSON.parse(rawCache) : {};
          cacheObj.teams = updated;
          return JSON.stringify(cacheObj);
        });
      }
      return updated;
    });
    setEditingTeamId(null);
    try {
      const { error } = await supabase.from('teams').update({ name: updatedName }).eq('id', targetId);
      if (error) { alert('Error updating team: ' + getFriendlyErrorMessage(error.message)); }
    } catch (e) {}
  };

  // 📂 2. CATEGORY ACTIONS
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim() || !loggedInMadrasa) return;
    const tempId = 'temp_' + Date.now();
    const savedName = newCatName.trim();
    const savedRange = newCatClassRange.trim();
    setCategories(prev => [...prev, { id: tempId, name: savedName, classrange: dbHasClassRange ? savedRange : '', madrasa_id: loggedInMadrasa.regNumber }]);
    setNewCatName('');
    setNewCatClassRange('');

    const insertPayload = { name: savedName, madrasa_id: loggedInMadrasa.regNumber };
    if (dbHasClassRange) {
      insertPayload.classrange = savedRange;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([insertPayload])
        .select();

      if (error) {
        alert('Error: ' + getFriendlyErrorMessage(error.message));
        setCategories(prev => prev.filter(c => c.id !== tempId));
      } else if (data && data[0]) {
        const realCat = data[0];
        setCategories(prev => prev.map(c => c.id === tempId ? realCat : c));
      }
    } catch (err) {
      alert('Error: ' + getFriendlyErrorMessage(err.message));
      setCategories(prev => prev.filter(c => c.id !== tempId));
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Remove this category?')) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { alert(getFriendlyErrorMessage(error.message)); }
  };

  const handleSaveCatEdit = async () => {
    if (!editingCatName.trim()) return;
    const targetId = editingCatId;
    const savedName = editingCatName.trim();
    const savedRange = editingCatClassRange.trim();
    setCategories(prev => prev.map(c => c.id === targetId ? { ...c, name: savedName, classrange: dbHasClassRange ? savedRange : '' } : c));
    setEditingCatId(null);

    const updatePayload = { name: savedName };
    if (dbHasClassRange) {
      updatePayload.classrange = savedRange;
    }

    const { error } = await supabase.from('categories').update(updatePayload).eq('id', targetId);
    if (error) {
      alert('Error: ' + getFriendlyErrorMessage(error.message));
    }
    // On success: do NOT re-fetch — the optimistic update already placed the
    // category in the correct position. Re-fetching would return rows in DB
    // insertion order and move the edited category to the bottom.
  };

  // 🧑‍🎓 3. STUDENT ACTIONS (DB uses lowercase: regno, teamid, catid)
  const handleAddStudent = async (e) => {
    e.preventDefault();
    const trimmedName = newStudentName.trim();
    const trimmedRegNo = studentRegNo.trim();

    if (!trimmedName || !trimmedRegNo || !selectedStudentTeam || !selectedStudentCat || !loggedInMadrasa) {
      alert(lang === 'EN' ? 'Please fill in all details!' : 'ദയവായി എല്ലാ വിവരങ്ങളും പൂരിപ്പിക്കുക!');
      return;
    }

    // 🚫 1. Check duplicate register number in local state
    const existingInState = students.find(s => String(s.regno || s.regNo || '').trim() === trimmedRegNo);
    if (existingInState) {
      alert(lang === 'EN'
        ? `Student with Register Number "${trimmedRegNo}" already exists (${existingInState.name})!`
        : `രജിസ്റ്റർ നമ്പർ "${trimmedRegNo}" നിലവിൽ മറ്റൊരു വിദ്യാർത്ഥിക്ക് (${existingInState.name}) നൽകിയിട്ടുണ്ട്! ഡൂപ്ലിക്കേറ്റ് ആഡ് ചെയ്യാൻ സാധ്യമല്ല.`);
      return;
    }

    // 🚫 2. Check duplicate register number in Supabase
    try {
      const { data: dbExisting } = await supabase
        .from('students')
        .select('id, name')
        .eq('madrasa_id', loggedInMadrasa.regNumber)
        .eq('regno', trimmedRegNo)
        .maybeSingle();

      if (dbExisting) {
        alert(lang === 'EN'
          ? `Register Number "${trimmedRegNo}" already exists in database (${dbExisting.name})!`
          : `രജിസ്റ്റർ നമ്പർ "${trimmedRegNo}" ഡാറ്റാബേസിൽ നിലവിലുണ്ട് (${dbExisting.name})! ഡൂപ്ലിക്കേറ്റ് എൻട്രി അനുവദിക്കില്ല.`);
        return;
      }
    } catch (err) {
      // ignore network check error and proceed
    }

    // 🔒 DB-FIRST: Only add student to UI AFTER confirmed database insert (prevents fake students in category lists)
    try {
      const { data, error } = await supabase.from('students').insert([{
        name: trimmedName, regno: trimmedRegNo,
        teamid: selectedStudentTeam, catid: selectedStudentCat,
        gender: studentGender, madrasa_id: loggedInMadrasa.regNumber
      }]).select();
      if (error) {
        alert('Error: ' + getFriendlyErrorMessage(error.message));
      } else {
        setNewStudentName(''); setStudentRegNo('');
        if (data && data[0]) {
          const insertedStudent = data[0];
          // Add the confirmed DB record (with real ID) to state and cache
          setStudents(prev => {
            const deduped = prev.filter(s => String(s.id) !== String(insertedStudent.id) && String(s.regno || s.regNo || '').trim() !== trimmedRegNo);
            const updated = [...deduped, insertedStudent].sort(compareRegNo);
            try {
              const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa?.regNumber}`);
              if (rawCache) {
                const cacheObj = JSON.parse(rawCache);
                cacheObj.students = updated;
                localStorage.setItem(`cached_data_${loggedInMadrasa?.regNumber}`, JSON.stringify(cacheObj));
              }
            } catch (e) {}
            return updated;
          });
        }
      }
    } catch (err) {
      alert('Error: ' + getFriendlyErrorMessage(err.message));
    }
  };

  // ── BULK UPLOAD: Parse Excel/CSV file ──
  const handleExcelFileRead = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkUploadResult(null);
    setBulkUploadData([]);
    // Capture the input element reference BEFORE any async work
    const inputEl = e.target;
    const reader = new FileReader();
    reader.onload = (evt) => {
      // Reset input here (after file is safely read) so same file can be re-selected
      try { inputEl.value = ''; } catch (_) { }
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // header:1 ensures first row becomes keys; defval:'', raw:false for string values
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
        if (!rows || rows.length === 0) {
          alert('Excel file is empty or could not be read. Please check the file.');
          return;
        }
        // Normalize column names (case-insensitive, trim whitespace)
        const normalized = rows.map((row, idx) => {
          const keys = Object.keys(row);
          const get = (names) => {
            for (const n of names) {
              const k = keys.find(k => k.trim().toLowerCase() === n.toLowerCase());
              if (k !== undefined) return String(row[k]).trim();
            }
            return '';
          };
          return {
            _row: idx + 2, // Excel row number (header=1)
            name: get(['student name', 'name', 'student_name', 'studentname', 'പേര്', 'sname']),
            regno: get(['register number', 'regno', 'reg no', 'chest number', 'register_number', 'chestnumber', 'reg number', 'chest no', 'chestno', 'reg', 'രജിസ്റ്റർ നമ്പർ', 'register']),
            teamName: get(['team', 'team name', 'team_name', 'teamname', 'ടീം', 'house']),
            catName: get(['category', 'cat', 'category name', 'cat name', 'category_name', 'കാറ്റഗറി', 'class', 'group']),
            gender: get(['gender', 'sex', 'ജഡർ', 'ജെൻഡർ', 'ലിംഗം', 'g', 'gen']),
          };
        }).filter(r => r.name && r.name.length > 0); // skip empty rows
        if (normalized.length === 0) {
          // Show first row keys to help debug
          const sampleKeys = Object.keys(rows[0] || {}).join(', ');
          alert('No valid student rows found.\n\nColumn headers found in your file:\n' + sampleKeys + '\n\nRequired headers: Student Name, Register Number, Team, Category, Gender');
          return;
        }
        setBulkUploadData(normalized);
      } catch (err) {
        alert('Excel file read error: ' + err.message);
      }
    };
    reader.onerror = () => {
      alert('Failed to read the file. Please try again or use a different file.');
    };
    reader.readAsArrayBuffer(file);
  };

  // ── BULK UPLOAD: Submit all students ──
  const handleBulkUploadSubmit = async () => {
    if (!bulkUploadData.length || !loggedInMadrasa) return;
    setBulkUploading(true);
    setBulkUploadResult(null);

    let successCount = 0;
    const failedRows = [];

    // Resolve team & category ids by name (case-insensitive)
    const resolveTeam = (name) => {
      if (!name) return null;
      const t = teams.find(t => t.name.trim().toLowerCase() === name.trim().toLowerCase());
      return t ? t.id : null;
    };
    const resolveCat = (name) => {
      if (!name) return null;
      // Check if GENERAL
      if (name.trim().toUpperCase() === 'GENERAL') return 'GENERAL';
      const c = categories.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());
      return c ? c.id : null;
    };
    const resolveGender = (val) => {
      if (!val) return 'BOY';
      const v = val.trim().toUpperCase();
      if (v === 'GIRL' || v === 'GIRLS' || v === 'F' || v === 'FEMALE' || v === 'പെൺ' || v === 'G') return 'GIRL';
      return 'BOY';
    };

    // Prepare records
    const records = [];
    const existingRegs = new Set(students.map(s => String(s.regno || s.regNo || '').trim().toLowerCase()));
    const uploadRegs = new Set();

    for (const row of bulkUploadData) {
      const reg = row.regno ? String(row.regno).trim() : '';
      const regLower = reg.toLowerCase();
      const teamid = resolveTeam(row.teamName);
      let catid = resolveCat(row.catName);
      const gender = resolveGender(row.gender);

      if (!row.name.trim() || !reg || !teamid || !catid) {
        failedRows.push({ row: row._row, name: row.name, reason: !teamid ? `Team "${row.teamName}" not found` : !catid ? `Category "${row.catName}" not found` : 'Missing name/regno' });
        continue;
      }

      if (existingRegs.has(regLower) || uploadRegs.has(regLower)) {
        failedRows.push({ row: row._row, name: row.name, reason: `Register Number "${reg}" already exists (Duplicate)` });
        continue;
      }

      uploadRegs.add(regLower);
      existingRegs.add(regLower);

      // For GENERAL, resolve to actual generalCatIds[0] or keep 'GENERAL' marker
      // The app uses generalCatIds for GENERAL check; store actual catid
      if (catid === 'GENERAL') {
        if (generalCatIds.length > 0) {
          catid = generalCatIds[0]; // use first general cat id
        } else {
          failedRows.push({ row: row._row, name: row.name, reason: 'No GENERAL category configured' });
          continue;
        }
      }
      records.push({ name: row.name.trim(), regno: reg, teamid, catid, gender, madrasa_id: loggedInMadrasa.regNumber });
    }

    // Insert in batches of 50
    const BATCH = 50;
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      try {
        const { error } = await supabase.from('students').insert(batch);
        if (error) {
          // Mark all in batch as failed
          batch.forEach((r, j) => failedRows.push({ row: bulkUploadData[i + j]?._row || '?', name: r.name, reason: getFriendlyErrorMessage(error.message) }));
        } else {
          successCount += batch.length;
        }
      } catch (err) {
        batch.forEach((r, j) => failedRows.push({ row: bulkUploadData[i + j]?._row || '?', name: r.name, reason: getFriendlyErrorMessage(err.message) }));
      }
    }

    setBulkUploadResult({ success: successCount, failed: failedRows });
    setBulkUploading(false);
    if (successCount > 0) {
      setBulkUploadData([]);
      fetchSupabaseData(loggedInMadrasa.regNumber);
    }
  };


  const startEditStudent = (student) => {
    setEditingStudentId(student.id);
    setEditingStudentData({ ...student });
  };

  const handleSaveStudentEdit = async () => {
    const trimmedReg = String(editingStudentData.regno || '').trim();
    if (!trimmedReg) { alert('Register Number cannot be empty!'); return; }

    const isColliding = students.some(s => s.id !== editingStudentId && String(s.regno || s.regNo || '').trim().toLowerCase() === trimmedReg.toLowerCase());
    if (isColliding) {
      alert(`Register Number "${trimmedReg}" is already assigned to another student!`);
      return;
    }

    let studentCatId = editingStudentData.catid;
    if (String(studentCatId).toUpperCase() === 'GENERAL' || isNaN(parseInt(studentCatId, 10))) {
      const genCat = categories.find(c => c.name.toLowerCase().includes('general')) || categories[0];
      if (genCat) studentCatId = genCat.id;
    }
    const finalStudentCatId = !isNaN(parseInt(studentCatId, 10)) ? parseInt(studentCatId, 10) : (categories[0]?.id || 1);

    const updatedStudentObj = {
      ...editingStudentData,
      regno: trimmedReg,
      catid: finalStudentCatId
    };

    const originalStudents = [...students];
    setStudents(prev => {
      const updated = prev.map(s => s.id === editingStudentId ? { ...s, ...updatedStudentObj } : s).sort(compareRegNo);
      try {
        const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa?.regNumber}`);
        if (rawCache) {
          const cacheObj = JSON.parse(rawCache);
          cacheObj.students = updated;
          localStorage.setItem(`cached_data_${loggedInMadrasa?.regNumber}`, JSON.stringify(cacheObj));
        }
      } catch (e) {}
      return updated;
    });

    const targetId = editingStudentId;
    setEditingStudentId(null);

    try {
      const { error } = await supabase.from('students').update({
        name: updatedStudentObj.name,
        regno: updatedStudentObj.regno,
        gender: updatedStudentObj.gender,
        teamid: updatedStudentObj.teamid,
        catid: updatedStudentObj.catid
      }).eq('id', targetId);
      if (error) {
        alert('Error: ' + getFriendlyErrorMessage(error.message));
        setStudents(originalStudents);
      }
    } catch (err) {
      alert('Error: ' + getFriendlyErrorMessage(err.message));
      setStudents(originalStudents);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Remove this student?')) return;
    const originalStudents = [...students];
    setStudents(prev => {
      const updated = prev.filter(s => s.id !== id);
      // Update cache immediately so 15s interval doesn't re-introduce deleted student
      try {
        const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa?.regNumber}`);
        if (rawCache) {
          const cacheObj = JSON.parse(rawCache);
          cacheObj.students = updated;
          localStorage.setItem(`cached_data_${loggedInMadrasa?.regNumber}`, JSON.stringify(cacheObj));
        }
      } catch(e) {}
      return updated;
    });
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        alert('Error: ' + getFriendlyErrorMessage(error.message));
        // Rollback state and cache
        setStudents(prev => {
          try {
            const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa?.regNumber}`);
            if (rawCache) {
              const cacheObj = JSON.parse(rawCache);
              cacheObj.students = originalStudents;
              localStorage.setItem(`cached_data_${loggedInMadrasa?.regNumber}`, JSON.stringify(cacheObj));
            }
          } catch(e) {}
          return originalStudents;
        });
      }
    } catch (err) {
      alert('Error: ' + getFriendlyErrorMessage(err.message));
      setStudents(prev => {
        try {
          const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa?.regNumber}`);
          if (rawCache) {
            const cacheObj = JSON.parse(rawCache);
            cacheObj.students = originalStudents;
            localStorage.setItem(`cached_data_${loggedInMadrasa?.regNumber}`, JSON.stringify(cacheObj));
          }
        } catch(e) {}
        return originalStudents;
      });
    }
  };

  // 🏆 4. PROGRAM ACTIONS (DB uses lowercase: catid)
  const handleAddProgram = async (e) => {
    e.preventDefault();
    if (!newProgName.trim() || !newProgCode.trim() || !selectedProgCat || !loggedInMadrasa) {
      alert(lang === 'EN' ? 'Please fill in all details!' : 'ദയവായി എല്ലാ വിവരങ്ങളും പൂരിപ്പിക്കുക!');
      return;
    }

    let dbCatId = selectedProgCat;
    // GENERAL programs always get catid = -1 (our sentinel for General category)
    // This ensures isGeneralProg() reliably identifies them everywhere
    if (String(dbCatId).toUpperCase() === 'GENERAL' || isNaN(parseInt(dbCatId, 10))) {
      dbCatId = -1;
    }
    const finalProgCatId = !isNaN(parseInt(dbCatId, 10)) ? parseInt(dbCatId, 10) : -1;

    const savedName = newProgName.trim();
    const savedCode = newProgCode.trim();
    const tempId = 'temp_' + Date.now();
    const tempProg = { id: tempId, name: savedName, code: savedCode, catid: finalProgCatId, type: `${progType}_${progGender}`, madrasa_id: loggedInMadrasa.regNumber };

    // 🚀 Instant state + LocalStorage cache update (<1ms)
    setPrograms(prev => {
      const updated = [...prev, tempProg].sort(compareProgCode);
      try {
        const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa.regNumber}`);
        if (rawCache) {
          const cacheObj = JSON.parse(rawCache);
          cacheObj.programs = updated;
          localStorage.setItem(`cached_data_${loggedInMadrasa.regNumber}`, JSON.stringify(cacheObj));
        }
      } catch (e) {}
      return updated;
    });

    setNewProgName(''); setNewProgCode('');

    try {
      const { data, error } = await queryWithRetry(() =>
        supabase.from('programs').insert([{
          name: savedName,
          code: savedCode,
          catid: finalProgCatId,
          type: `${progType}_${progGender}`,
          madrasa_id: loggedInMadrasa.regNumber
        }]).select()
      );

      if (error) {
        console.error('Program insert error:', error);
        const errMsg = getFriendlyErrorMessage(error.message || JSON.stringify(error));
        alert((lang === 'EN' ? 'Error saving program:\n' : 'പ്രോഗ്രാം സേവ് ചെയ്യൽ പരാജയപ്പെട്ടു:\n') + errMsg);
        // Keep program in local state but mark as failed so user knows
        setPrograms(prev => prev.map(p => p.id === tempId ? { ...p, _saveError: true } : p));
      } else if (data && data[0]) {
        const realProg = data[0];
        setPrograms(prev => prev.map(p => p.id === tempId ? realProg : p).sort(compareProgCode));
        // Update cache with real program
        try {
          const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa.regNumber}`);
          if (rawCache) {
            const cacheObj = JSON.parse(rawCache);
            cacheObj.programs = (cacheObj.programs || []).map(p => p.id === tempId ? realProg : p);
            localStorage.setItem(`cached_data_${loggedInMadrasa.regNumber}`, JSON.stringify(cacheObj));
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Program insert exception:', err);
      const errMsg = getFriendlyErrorMessage(err.message || String(err));
      alert((lang === 'EN' ? 'Error saving program:\n' : 'പ്രോഗ്രാം സേവ് ചെയ്യൽ പരാജയപ്പെട്ടു:\n') + errMsg);
      setPrograms(prev => prev.map(p => p.id === tempId ? { ...p, _saveError: true } : p));
    }
  };

  const handleDeleteProgram = async (id) => {
    const prog = programs.find(p => p.id === id);
    const progName = prog ? `${prog.name || ''} (${prog.code || ''})` : 'this program';
    const confirmed = window.confirm(
      lang === 'EN'
        ? `⚠️ Delete "${progName}"?\n\nThis will ALSO permanently delete:\n• Timetable entry\n• All registrations (students & groups)\n• All results/marks for this program\n\nThis cannot be undone!`
        : `⚠️ "${progName}" ഡിലീറ്റ് ചെയ്യണോ?\n\nഇനിപ്പറയുന്നവ കൂടി ശാശ്വതമായി ഡിലീറ്റ് ആകും:\n• ടൈംടേബിൾ എൻട്രി\n• എല്ലാ രജിസ്‌ട്രേഷനുകളും (students & groups)\n• ഈ പ്രോഗ്രാമിന്റെ എല്ലാ results/marks\n\nഇത് പഴയ നിലയിലേക്ക് തിരിക്കാൻ കഴിയില്ല!`
    );
    if (!confirmed) return;
    if (!loggedInMadrasa) return;
    const madrasaId = String(loggedInMadrasa.regNumber).trim();
    const programIdStr = String(id);

    // ── 1. Cascade delete from Supabase ────────────────────────────────────────
    const deleteOps = await Promise.allSettled([
      // Delete the program row itself
      supabase.from('programs').delete().eq('id', id),
      // Delete timetable entry for this program in this madrasa
      supabase.from('timetable').delete().eq('madrasa_id', madrasaId).eq('program_id', programIdStr),
      // Delete all program_registrations for this program + madrasa
      supabase.from('program_registrations').delete().eq('madrasa_id', madrasaId).eq('prog_id', programIdStr),
      // Delete group_registrations for this program
      supabase.from('group_registrations').delete().eq('madrasa_id', madrasaId).eq('program_id', programIdStr),
      // Delete results for this program
      supabase.from('results').delete().eq('madrasa_id', madrasaId).eq('progid', programIdStr),
    ]);

    // Collect any errors (but don't block UI update on non-critical ones)
    const errors = deleteOps
      .filter(r => r.status === 'rejected' || r.value?.error)
      .map(r => r.value?.error?.message || r.reason?.message || '');
    if (errors.length > 0) {
      console.error('Cascade delete partial errors:', errors);
    }

    // ── 2. Purge from React state + localStorage cache ──────────────────────────
    const updateCache = (updater) => {
      try {
        const rawCache = localStorage.getItem(`cached_data_${madrasaId}`);
        if (rawCache) {
          const cacheObj = JSON.parse(rawCache);
          updater(cacheObj);
          localStorage.setItem(`cached_data_${madrasaId}`, JSON.stringify(cacheObj));
        }
      } catch (e) {}
    };

    setPrograms(prev => {
      const updated = prev.filter(p => p.id !== id);
      updateCache(c => { c.programs = updated; });
      return updated;
    });
    setTimetable(prev => {
      const updated = prev.filter(t => String(t.program_id) !== programIdStr);
      updateCache(c => { c.timetable = updated; });
      return updated;
    });
    setProgramRegistrations(prev => {
      const updated = prev.filter(r => String(r.prog_id) !== programIdStr && String(r.progid) !== programIdStr);
      updateCache(c => { c.programRegistrations = updated; });
      return updated;
    });
    setGroupRegistrations(prev => {
      const updated = prev.filter(r => String(r.program_id) !== programIdStr && String(r.program_id) !== programIdStr);
      updateCache(c => { c.groupRegistrations = updated; });
      return updated;
    });
    setResultsList(prev => {
      const updated = prev.filter(r => String(r.progid) !== programIdStr && String(r.progId) !== programIdStr);
      updateCache(c => { c.resultsList = updated; });
      return updated;
    });
  };

  const handleSaveProgEdit = async () => {
    let dbCatId = editingProgData.catid;
    // GENERAL programs always get catid = -1 (sentinel value)
    if (String(dbCatId).toUpperCase() === 'GENERAL' || isNaN(parseInt(dbCatId, 10))) {
      dbCatId = -1;
    }
    const finalProgCatId = !isNaN(parseInt(dbCatId, 10)) ? parseInt(dbCatId, 10) : -1;

    const updatedData = { ...editingProgData, catid: finalProgCatId };
    setPrograms(prev => {
      const updated = prev.map(p => p.id === editingProgId ? { ...p, ...updatedData } : p).sort(compareProgCode);
      try {
        const rawCache = localStorage.getItem(`cached_data_${loggedInMadrasa.regNumber}`);
        if (rawCache) {
          const cacheObj = JSON.parse(rawCache);
          cacheObj.programs = updated;
          localStorage.setItem(`cached_data_${loggedInMadrasa.regNumber}`, JSON.stringify(cacheObj));
        }
      } catch (e) {}
      return updated;
    });

    const targetId = editingProgId;
    setEditingProgId(null);

    const { error } = await supabase.from('programs').update({
      name: updatedData.name,
      code: updatedData.code,
      catid: updatedData.catid,
      type: updatedData.type
    }).eq('id', targetId);
    if (error) { alert('Error: ' + getFriendlyErrorMessage(error.message)); }
  };

  const handleSaveTimetableEntry = async (programId) => {
    if (!loggedInMadrasa) return;
    const madrasaId = loggedInMadrasa.regNumber;
    const { date, hour12, minute, ampm, scheduled_time, venue } = timetableFormData;

    let finalScheduledTime = null;
    if (date) {
      let h = parseInt(hour12 || '12', 10);
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      const hStr = String(h).padStart(2, '0');
      const minStr = String(minute || '00').padStart(2, '0');
      finalScheduledTime = new Date(`${date}T${hStr}:${minStr}:00`).toISOString();
    } else if (scheduled_time) {
      finalScheduledTime = new Date(scheduled_time).toISOString();
    }

    // Optimistic update
    const updatedEntry = {
      madrasa_id: madrasaId,
      program_id: String(programId),
      scheduled_time: finalScheduledTime,
      venue: (venue || '').trim()
    };

    setTimetable(prev => {
      let updated;
      const exists = prev.some(t => String(t.program_id) === String(programId));
      if (exists) {
        updated = prev.map(t => String(t.program_id) === String(programId) ? { ...t, ...updatedEntry } : t);
      } else {
        updated = [...prev, updatedEntry];
      }
      try {
        const rawCache = localStorage.getItem(`cached_data_${madrasaId}`);
        if (rawCache) {
          const cacheObj = JSON.parse(rawCache);
          cacheObj.timetable = updated;
          localStorage.setItem(`cached_data_${madrasaId}`, JSON.stringify(cacheObj));
        }
      } catch (e) {}
      return updated;
    });

    setEditingTimetableId(null);

    // Save to Supabase
    const { error } = await supabase
      .from('timetable')
      .upsert([updatedEntry], { onConflict: 'madrasa_id,program_id' });

    if (error) {
      if (error.code === 'PGRST204' || (error.message && error.message.includes('timetable'))) {
        // Table not found error
        alert((lang === 'EN' ? 'Database setup required!\nPlease run this SQL in your Supabase SQL Editor to create the timetable table:\n\n' : 'ഡാറ്റാബേസ് സെറ്റപ്പ് ആവശ്യമാണ്!\nSupabase SQL Editor-ൽ ഈ കോഡ് റൺ ചെയ്യുക:\n\n') +
          `CREATE TABLE timetable (
  id BIGSERIAL PRIMARY KEY,
  madrasa_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ,
  venue TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT timetable_madrasa_program_unique UNIQUE (madrasa_id, program_id)
);

-- Enable RLS
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON timetable FOR SELECT USING (true);
CREATE POLICY "Allow all access" ON timetable FOR ALL USING (true);`);
      } else {
        alert('Error saving timetable: ' + error.message);
      }
      // Re-fetch to sync
      fetchSupabaseData(madrasaId);
    }
  };

  const handleClearTimetableEntry = async (programId) => {
    if (!window.confirm(lang === 'EN' ? 'Clear timetable for this program?' : 'ഈ പ്രോഗ്രാമിന്റെ ടൈംടേബിൾ ഒഴിവാക്കണോ?')) return;
    if (!loggedInMadrasa) return;
    const madrasaId = loggedInMadrasa.regNumber;

    setTimetable(prev => {
      const updated = prev.filter(t => String(t.program_id) !== String(programId));
      try {
        const rawCache = localStorage.getItem(`cached_data_${madrasaId}`);
        if (rawCache) {
          const cacheObj = JSON.parse(rawCache);
          cacheObj.timetable = updated;
          localStorage.setItem(`cached_data_${madrasaId}`, JSON.stringify(cacheObj));
        }
      } catch (e) {}
      return updated;
    });

    const { error } = await supabase
      .from('timetable')
      .delete()
      .eq('madrasa_id', madrasaId)
      .eq('program_id', String(programId));

    if (error) {
      alert('Error clearing timetable: ' + error.message);
      fetchSupabaseData(madrasaId);
    }
  };

  // ⚙️ 5. CUSTOM MARK SYSTEM SAVE
  const handleSavePoints = (e) => {
    e.preventDefault();
    saveToStorage('points', pointSystem);
    alert(t('alertPointsUpdated'));
  };

  // 📝 6. MARK ENTRY ACTIONS (SUPABASE)
  const handleAddResult = async (e) => {
    e.preventDefault();
    if (!selectedResultProg || !selectedResultStudent || !loggedInMadrasa) {
      alert(t('alertPleaseSelectProgStudent')); return;
    }

    const progObj = programs.find(p => String(p.id) === String(selectedResultProg));
    if (!progObj) { alert(t('alertUnexpectedError') + 'Program not found'); return; }

    const isGroup = (progObj.type || '').includes('GROUP');
    const isTeam = (progObj.type || '').includes('TEAM');
    let studentObj = null;
    let groupObj = null;
    let teamObj = null;

    if (isTeam) {
      teamObj = teams.find(t => String(t.id) === String(selectedResultStudent));
      if (!teamObj) { alert(t('alertUnexpectedError') + 'Team not found'); return; }
    } else if (isGroup) {
      groupObj = groupRegistrations.find(g => String(g.id) === String(selectedResultStudent));
      if (!groupObj) { alert(t('alertUnexpectedError') + 'Group not found'); return; }
    } else {
      studentObj = students.find(s => String(s.id) === String(selectedResultStudent));
      if (!studentObj) { alert(t('alertUnexpectedError') + 'Student not found'); return; }
    }

    // Dynamic point calculation
    let pts = 0;
    if (isTeam) {
      if (selectedPlace === '1') pts = Number(pointSystem.tp1 || 0);
      else if (selectedPlace === '2') pts = Number(pointSystem.tp2 || 0);
      else if (selectedPlace === '3') pts = Number(pointSystem.tp3 || 0);
      if (selectedGrade === 'A') pts += Number(pointSystem.tpA || 0);
      else if (selectedGrade === 'B') pts += Number(pointSystem.tpB || 0);
      else if (selectedGrade === 'C') pts += Number(pointSystem.tpC || 0);
    } else if (isGroup) {
      if (selectedPlace === '1') pts = Number(pointSystem.gp1);
      else if (selectedPlace === '2') pts = Number(pointSystem.gp2);
      else if (selectedPlace === '3') pts = Number(pointSystem.gp3);
      if (selectedGrade === 'A') pts += Number(pointSystem.gpA);
      else if (selectedGrade === 'B') pts += Number(pointSystem.gpB);
      else if (selectedGrade === 'C') pts += Number(pointSystem.gpC);
    } else {
      if (selectedPlace === '1') pts = Number(pointSystem.p1);
      else if (selectedPlace === '2') pts = Number(pointSystem.p2);
      else if (selectedPlace === '3') pts = Number(pointSystem.p3);
      if (selectedGrade === 'A') pts += Number(pointSystem.gA);
      else if (selectedGrade === 'B') pts += Number(pointSystem.gB);
      else if (selectedGrade === 'C') pts += Number(pointSystem.gC);
    }

    const computedStudentName = isTeam
      ? `🏟️ ${teamObj.name}`
      : isGroup
      ? groupObj.group_name
      : `${studentObj.regno || studentObj.regNo || ''} - ${studentObj.name}`;

    // ── Duplicate result check ──────────────────────────────────────────────────────
    // Prevent assigning multiple positions to the same student/group/team in the same program.
    const sRegStr = (isGroup || isTeam) ? '' : String(studentObj.regno || studentObj.regNo || '').trim();
    const sNameStr = isTeam ? String(teamObj.name || '').trim().toLowerCase() : isGroup ? String(groupObj.group_name || '').trim().toLowerCase() : String(studentObj.name || '').trim().toLowerCase();
    const sDbIdStr = isTeam ? String(teamObj.id || '').trim() : isGroup ? String(groupObj.id || '').trim() : String(studentObj.id || '').trim();
    const pIdStr = String(progObj.id || '').trim();
    const pCodeStr = String(progObj.code || '').trim();

    const alreadyExists = resultsList.some(r => {
      const rPid = String(r.progid || r.program_id || '').trim();
      const pMatch = rPid === pIdStr || (pCodeStr && rPid === pCodeStr) || String(r.progname || '').trim().toLowerCase() === String(progObj.name || '').trim().toLowerCase();
      if (!pMatch) return false;

      const rName = String(r.studentname || r.student_name || '').trim().toLowerCase();
      if (sDbIdStr && String(r.student_id || r.studentid || r.teamid || '') === sDbIdStr) return true;
      if (sRegStr && (rName.includes(sRegStr) || rName.startsWith(sRegStr))) return true;
      if (sNameStr && rName.includes(sNameStr)) return true;
      return false;
    });

    if (alreadyExists) {
      alert(
        lang === 'EN'
          ? `⚠️ A result for this student/group/team is already saved in "${progObj.name}".\nPlease edit or delete the existing result below.`
          : `⚠️ ഈ വിദ്യാർത്ഥിക്ക്/ഗ്രൂപ്പിന്/ടീമിന് "${progObj.name}" മത്സരത്തിൽ ഇതിനകം ഫലം നൽകിയിട്ടുണ്ട്.\nതിരുത്തണമെങ്കിൽ താഴെ എഡിറ്റ് ചെയ്യുക.`
      );
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    const resultRecord = {
      progid: progObj.id,
      progname: progObj.name,
      progtype: progObj.type,
      catname: (categories.find(c => String(c.id) === String(progObj.catid)) || {}).name || '',
      studentname: computedStudentName,
      studentgender: isTeam ? (progObj.type.includes('BOY') ? 'BOY' : progObj.type.includes('GIRL') ? 'GIRL' : 'COMMON') : isGroup ? (progObj.type.includes('BOY') ? 'BOY' : progObj.type.includes('GIRL') ? 'GIRL' : 'COMMON') : studentObj.gender,
      teamid: isTeam ? teamObj.id : isGroup ? groupObj.team_id : studentObj.teamid,
      teamname: isTeam
        ? teamObj.name
        : isGroup
        ? ((teams.find(t => String(t.id) === String(groupObj.team_id)) || {}).name || '')
        : ((teams.find(t => String(t.id) === String(studentObj.teamid)) || {}).name || ''),
      place: selectedPlace === '0' ? 'No Place' : selectedPlace === '1' ? 'First' : selectedPlace === '2' ? 'Second' : 'Third',
      grade: selectedGrade === 'No' ? '-' : selectedGrade,
      points: pts,
      madrasa_id: loggedInMadrasa.regNumber
    };

    try {
      const { data, error } = await supabase
        .from('results')
        .insert([resultRecord])
        .select();

      if (error) {
        alert(t('alertUnexpectedError') + getFriendlyErrorMessage(error.message));
      } else {
        alert(t('alertResultDeclared'));
        if (data && data[0]) {
          setResultsList(prev => {
            const updated = [...prev, data[0]];
            const rNum = loggedInMadrasa?.regNumber;
            if (rNum) {
              safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
                let cacheObj = {};
                try { cacheObj = JSON.parse(rawCache) || {}; } catch(e) {}
                cacheObj.resultsList = updated;
                return JSON.stringify(cacheObj);
              });
            }
            return updated;
          });
        }
      }
    } catch (err) {
      alert(t('alertUnexpectedError') + getFriendlyErrorMessage(err.message));
    }
  };

  const handleDeleteResult = async (id) => {
    if (!window.confirm(lang === 'EN' ? 'Remove this result?' : 'ഈ ഫലം ഒഴിവാക്കണമെന്നുറപ്പാണോ?')) return;
    const rNum = loggedInMadrasa?.regNumber;
    const originalResults = [...resultsList];
    const updatedResults = originalResults.filter(r => String(r.id) !== String(id));
    
    // 1. Instant UI update
    setResultsList(updatedResults);

    // 2. Instant LocalStorage Cache update so background sync doesn't restore deleted result
    if (rNum) {
      safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
        let cacheObj = {};
        try { cacheObj = JSON.parse(rawCache) || {}; } catch(e) {}
        cacheObj.resultsList = updatedResults;
        return JSON.stringify(cacheObj);
      });
    }

    try {
      const targetId = !isNaN(Number(id)) ? Number(id) : id;
      const { error } = await supabase.from('results').delete().eq('id', targetId);
      if (error) {
        alert(t('alertUnexpectedError') + getFriendlyErrorMessage(error.message));
        setResultsList(originalResults);
        if (rNum) {
          safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
            let cacheObj = {};
            try { cacheObj = JSON.parse(rawCache) || {}; } catch(e) {}
            cacheObj.resultsList = originalResults;
            return JSON.stringify(cacheObj);
          });
        }
      }
    } catch (err) {
      alert(t('alertUnexpectedError') + getFriendlyErrorMessage(err.message));
      setResultsList(originalResults);
      if (rNum) {
        safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
          let cacheObj = {};
          try { cacheObj = JSON.parse(rawCache) || {}; } catch(e) {}
          cacheObj.resultsList = originalResults;
          return JSON.stringify(cacheObj);
        });
      }
    }
  };

  const handleUpdateResult = async () => {
    if (!editingResultId || !loggedInMadrasa) return;
    // Find the existing record
    const existing = resultsList.find(r => String(r.id) === String(editingResultId));
    if (!existing) return;

    const progObj = programs.find(p => String(p.id) === String(existing.progid));
    const isGroup = progObj && (progObj.type || '').includes('GROUP');
    const isTeam = progObj && (progObj.type || '').includes('TEAM');

    // Resolve new student/group info
    let newStudentName = existing.studentname;
    let newTeamId = existing.teamid;
    let newTeamName = existing.teamname;
    let newGender = existing.studentgender;

    if (editingResultStudent && editingResultStudent !== existing.studentname) {
      if (isTeam) {
        const tObj = teams.find(t => String(t.id) === String(editingResultStudent));
        if (tObj) {
          newStudentName = `🏟️ ${tObj.name}`;
          newTeamId = tObj.id;
          newTeamName = tObj.name;
          newGender = progObj.type.includes('BOY') ? 'BOY' : progObj.type.includes('GIRL') ? 'GIRL' : 'COMMON';
        }
      } else if (isGroup) {
        const gObj = groupRegistrations.find(g => String(g.id) === String(editingResultStudent));
        if (gObj) {
          newStudentName = gObj.group_name;
          newTeamId = gObj.team_id;
          newTeamName = (teams.find(t => String(t.id) === String(gObj.team_id)) || {}).name || '';
          newGender = progObj.type.includes('BOY') ? 'BOY' : progObj.type.includes('GIRL') ? 'GIRL' : 'COMMON';
        }
      } else {
        const sObj = students.find(s => String(s.id) === String(editingResultStudent));
        if (sObj) {
          newStudentName = `${sObj.regno || sObj.regNo || ''} - ${sObj.name}`;
          newTeamId = sObj.teamid;
          newTeamName = (teams.find(t => String(t.id) === String(sObj.teamid)) || {}).name || '';
          newGender = sObj.gender;
        }
      }
    }

    // Recalculate points
    let pts = 0;
    const placeVal = editingResultPlace;
    const gradeVal = editingResultGrade;
    if (isTeam) {
      if (placeVal === '1') pts = Number(pointSystem.tp1 || 0);
      else if (placeVal === '2') pts = Number(pointSystem.tp2 || 0);
      else if (placeVal === '3') pts = Number(pointSystem.tp3 || 0);
      if (gradeVal === 'A') pts += Number(pointSystem.tpA || 0);
      else if (gradeVal === 'B') pts += Number(pointSystem.tpB || 0);
      else if (gradeVal === 'C') pts += Number(pointSystem.tpC || 0);
    } else if (isGroup) {
      if (placeVal === '1') pts = Number(pointSystem.gp1);
      else if (placeVal === '2') pts = Number(pointSystem.gp2);
      else if (placeVal === '3') pts = Number(pointSystem.gp3);
      if (gradeVal === 'A') pts += Number(pointSystem.gpA);
      else if (gradeVal === 'B') pts += Number(pointSystem.gpB);
      else if (gradeVal === 'C') pts += Number(pointSystem.gpC);
    } else {
      if (placeVal === '1') pts = Number(pointSystem.p1);
      else if (placeVal === '2') pts = Number(pointSystem.p2);
      else if (placeVal === '3') pts = Number(pointSystem.p3);
      if (gradeVal === 'A') pts += Number(pointSystem.gA);
      else if (gradeVal === 'B') pts += Number(pointSystem.gB);
      else if (gradeVal === 'C') pts += Number(pointSystem.gC);
    }

    const placeLabel = placeVal === '0' ? 'No Place' : placeVal === '1' ? 'First' : placeVal === '2' ? 'Second' : 'Third';
    const gradeLabel = gradeVal === 'No' ? '-' : gradeVal;

    const updatedRecord = {
      studentname: newStudentName,
      teamid: newTeamId,
      teamname: newTeamName,
      studentgender: newGender,
      place: placeLabel,
      grade: gradeLabel,
      points: pts
    };

    const originalResults = [...resultsList];
    const updatedList = originalResults.map(r => String(r.id) === String(editingResultId) ? { ...r, ...updatedRecord } : r);
    setResultsList(updatedList);
    const rNum = loggedInMadrasa?.regNumber;
    if (rNum) {
      safeSetLocalStorage(`cached_data_${rNum}`, (rawCache) => {
        let cacheObj = {};
        try { cacheObj = JSON.parse(rawCache) || {}; } catch(e) {}
        cacheObj.resultsList = updatedList;
        return JSON.stringify(cacheObj);
      });
    }
    const targetId = editingResultId;
    setEditingResultId(null);

    try {
      const { error } = await supabase
        .from('results')
        .update(updatedRecord)
        .eq('id', targetId);

      if (error) {
        alert((lang === 'EN' ? 'Update failed: ' : 'അപ്ഡേറ്റ് പരാജയപ്പെട്ടു: ') + getFriendlyErrorMessage(error.message));
        setResultsList(originalResults);
      } else {
        alert(lang === 'EN' ? '✅ Result updated successfully!' : '✅ ഫലം വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു!');
      }
    } catch (err) {
      alert((lang === 'EN' ? 'Update failed: ' : 'അപ്ഡേറ്റ് പരാജയപ്പെട്ടു: ') + getFriendlyErrorMessage(err.message));
      setResultsList(originalResults);
    }
  };

  const handleSaveGroupRegistration = async () => {
    if (!groupRegProgram) { alert(t('alertPleaseSelectProgStudent')); return; }
    if (!groupRegName.trim()) { alert(lang === 'EN' ? 'Please enter a group name' : 'ഗ്രൂപ്പ് പേര് നൽകുക'); return; }
    if (!groupRegTeam) { alert(lang === 'EN' ? 'Please select a team' : 'ടീം തിരഞ്ഞെടുക്കുക'); return; }
    if (groupRegStudents.length === 0) { alert(lang === 'EN' ? 'Please select at least one student' : 'കുറഞ്ഞത് ഒരു വിദ്യാർത്ഥിയെയെങ്കിലും തിരഞ്ഞെടുക്കുക'); return; }

    // Resolve Leader ID
    const chosenLeader = groupRegLeader || (groupRegStudents.length > 0 ? groupRegStudents[0] : null);

    setGroupRegSaving(true);
    try {
      const madrasaId = loggedInMadrasa.regNumber;

      let insertData = {
        madrasa_id: madrasaId,
        program_id: String(groupRegProgram),
        group_name: groupRegName.trim(),
        team_id: String(groupRegTeam),
        student_ids: groupRegStudents, // JSON array of student IDs
        leader_id: chosenLeader ? String(chosenLeader) : null
      };

      // 🚀 Instant state + LocalStorage cache update (<1ms)
      const tempGroup = {
        id: 'temp_greg_' + Date.now(),
        ...insertData
      };
      setGroupRegistrations(prev => {
        const updated = [tempGroup, ...prev];
        try {
          const rawCache = localStorage.getItem(`cached_data_${madrasaId}`);
          if (rawCache) {
            const cacheObj = JSON.parse(rawCache);
            cacheObj.groupRegistrations = updated;
            localStorage.setItem(`cached_data_${madrasaId}`, JSON.stringify(cacheObj));
          }
        } catch (e) {}
        return updated;
      });

      let { data: insData, error } = await supabase
        .from('group_registrations')
        .insert([insertData])
        .select();

      if (error && error.message && error.message.includes('leader_id')) {
        delete insertData.leader_id;
        const reordered = chosenLeader
          ? [String(chosenLeader), ...groupRegStudents.filter(id => String(id) !== String(chosenLeader))]
          : groupRegStudents;
        insertData.student_ids = reordered;
        const res = await supabase.from('group_registrations').insert([insertData]).select();
        error = res.error;
        insData = res.data;
      }

      if (error) {
        if (error.code === 'PGRST205') {
          alert((lang === 'EN' ? 'Database setup required!\nPlease run this SQL in your Supabase SQL Editor to create the group_registrations table:\n\n' : 'ഡാറ്റാബേസ് സെറ്റപ്പ് ആവശ്യമാണ്!\nSupabase SQL Editor-ൽ ഈ കോഡ് റൺ ചെയ്യുക:\n\n') +
            `CREATE TABLE group_registrations (
  id BIGSERIAL PRIMARY KEY,
  madrasa_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  group_name TEXT NOT NULL,
  team_id TEXT NOT NULL,
  leader_id TEXT,
  student_ids JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);`);
        } else {
          alert('Group registration error: ' + getFriendlyErrorMessage(error.message));
        }
        // Rollback on DB error
        if (loggedInMadrasa) fetchSupabaseData(loggedInMadrasa.regNumber);
      } else {
        alert(lang === 'EN' ? 'Group registration saved successfully!' : 'ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ വിജയിച്ചു!');
        setGroupRegName('');
        setGroupRegLeader('');
        setGroupRegStudents([]);
        fetchReqIdRef.current++;
        const { data: gRegData } = await supabase
          .from('group_registrations')
          .select('*')
          .eq('madrasa_id', madrasaId);
        if (gRegData) setGroupRegistrations(gRegData);
      }
    } catch (err) {
      alert(t('alertUploadFailed') + err.message);
    }
    setGroupRegSaving(false);
  };

  const handleDeleteGroupRegistration = async (id) => {
    if (!window.confirm(lang === 'EN' ? 'Remove this group registration?' : 'ഈ ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ ഒഴിവാക്കണോ?')) return;

    // Optimistic delete
    setGroupRegistrations(prev => prev.filter(g => g.id !== id));

    try {
      const { error } = await supabase
        .from('group_registrations')
        .delete()
        .eq('id', id);

      if (error) {
        alert(error.message);
        // Refresh to restore if error
        const { data: gRegData } = await supabase
          .from('group_registrations')
          .select('*')
          .eq('madrasa_id', loggedInMadrasa.regNumber);
        if (gRegData) setGroupRegistrations(gRegData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGroupRegistration = async (id) => {
    if (!editingGroupRegName.trim()) { alert(lang === 'EN' ? 'Please enter a group name' : 'ഗ്രൂപ്പ് പേര് നൽകുക'); return; }
    if (editingGroupRegStudents.length === 0) { alert(lang === 'EN' ? 'Please select at least one student' : 'കുറഞ്ഞത് ഒരു വിദ്യാർത്ഥിയെയെങ്കിലും തിരഞ്ഞെടുക്കുക'); return; }
    const chosenLeader = editingGroupRegLeader || editingGroupRegStudents[0] || null;
    setEditingGroupRegSaving(true);
    try {
      const updateData = {
        group_name: editingGroupRegName.trim(),
        student_ids: editingGroupRegStudents,
        leader_id: chosenLeader ? String(chosenLeader) : null
      };
      let { error } = await supabase.from('group_registrations').update(updateData).eq('id', id);
      if (error) {
        if (error.message && error.message.includes('leader_id')) {
          // Fallback: update without leader_id
          const { error: e2 } = await supabase.from('group_registrations').update({
            group_name: updateData.group_name,
            student_ids: updateData.student_ids
          }).eq('id', id);
          if (e2) throw new Error(e2.message);
        } else {
          throw new Error(error.message);
        }
      }
      setGroupRegistrations(prev => prev.map(g => g.id === id
        ? { ...g, group_name: editingGroupRegName.trim(), student_ids: editingGroupRegStudents, leader_id: chosenLeader }
        : g
      ));
      setEditingGroupRegId(null);
      alert(lang === 'EN' ? 'Group registration updated!' : 'ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ അപ്ഡേറ്റ് ചെയ്തു!');
    } catch (err) {
      alert((lang === 'EN' ? 'Update failed: ' : 'അപ്ഡേറ്റ് പരാജയപ്പെട്ടു: ') + err.message);
    }
    setEditingGroupRegSaving(false);
  };


  // Redirect hidden resultsSubTab for VIEW role
  useEffect(() => {
    if (loginRole === 'VIEW' && visibilityControls) {
      const visible = ['PROGRAM_WINNERS', 'STUDENT_REPORT', 'RESULTS_HISTORY', 'CHAMPIONS']
        .filter(key => visibilityControls['results_' + key]);
      if (visible.length > 0 && !visible.includes(resultsSubTab)) {
        setResultsSubTab(visible[0]);
      }
    }
  }, [visibilityControls, loginRole, resultsSubTab]);


  const getTeamTotalPoints = (teamId) => {
    return resultsList.filter(r => String(r.teamId) === String(teamId) || String(r.teamid) === String(teamId)).reduce((sum, r) => sum + r.points, 0);
  };

  // ══════════════════════════════════════════════════════════════════════
  // 👤 PROFILE TAB HANDLERS
  // ══════════════════════════════════════════════════════════════════════

  // Look up student by register number
  const handleProfileLookup = async () => {
    if (!profileRegNo.trim()) { alert(t('alertEnterRegNo')); return; }

    // First try local state for quick response
    let found = students.find(s => String(s.regno || s.regNo || '') === String(profileRegNo.trim()));

    // If not in local state, fetch fresh from Supabase
    if (!found && loggedInMadrasa) {
      try {
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('madrasa_id', loggedInMadrasa.regNumber)
          .eq('regno', profileRegNo.trim())
          .maybeSingle();
        found = data;
      } catch (e) { /* ignore */ }
    }

    if (!found) { alert(t('alertStudentNotFound')); return; }

    // Resolve category name: try local state first, then Supabase directly
    const catIdVal = found.catid ?? found.catId;
    let resolvedCatName = '';
    // Try local categories state
    if (categories.length > 0 && catIdVal != null) {
      const catRef = String(catIdVal);
      const localCat = categories.find(c =>
        String(c.id) === catRef ||
        c.name === catRef ||
        c.name?.toLowerCase() === catRef.toLowerCase()
      );
      resolvedCatName = localCat ? localCat.name : '';
    }
    // If still not resolved, fetch category directly from Supabase
    if (!resolvedCatName && catIdVal != null && loggedInMadrasa) {
      try {
        const { data: catData } = await supabase
          .from('categories')
          .select('id, name')
          .eq('madrasa_id', loggedInMadrasa.regNumber);
        if (catData && catData.length > 0) {
          // refresh categories state so future lookups work too
          setCategories(catData);
          const catRef = String(catIdVal);
          const fetchedCat = catData.find(c =>
            String(c.id) === catRef ||
            c.name === catRef ||
            c.name?.toLowerCase() === catRef.toLowerCase()
          );
          resolvedCatName = fetchedCat ? fetchedCat.name : '';
        }
      } catch (e) { /* ignore */ }
    }

    // Attach resolved names directly to the student object
    const enrichedStudent = { ...found, _resolvedCatName: resolvedCatName };
    setProfileStudent(enrichedStudent);
    const status = found.photo_status || 'none';
    if (status === 'approved') setProfileStep('APPROVED');
    else if (status === 'pending') setProfileStep('WAITING');
    else setProfileStep('FOUND');
  };


  const handleProfileReset = () => {
    setProfileRegNo('');
    setProfileStudent(null);
    setProfileStep('INPUT');
    setProfilePhotoFile(null);
    setProfilePhotoPreview(null);
    setProfileCropMode(false);
  };

  // Helper to dynamically update photo cropper transform & clamped position
  const updateCropperTransform = useCallback((zoomValue, offX, offY) => {
    if (!cropperImageRef.current || !cropperImageDims) return;
    const { displayW, displayH } = cropperImageDims;
    const VIEWPORT = 320;

    const curZoom = zoomValue !== undefined ? zoomValue : cropperZoom;
    const curW = displayW * curZoom;
    const curH = displayH * curZoom;

    // Maximum drag offsets to prevent white space gaps inside the 320px viewport
    const maxOffX = Math.max(0, (curW - VIEWPORT) / 2);
    const maxOffY = Math.max(0, (curH - VIEWPORT) / 2);

    const targetX = offX !== undefined ? offX : dragStateRef.current.offsetX;
    const targetY = offY !== undefined ? offY : dragStateRef.current.offsetY;

    const clampedX = Math.min(maxOffX, Math.max(-maxOffX, targetX));
    const clampedY = Math.min(maxOffY, Math.max(-maxOffY, targetY));

    dragStateRef.current.offsetX = clampedX;
    dragStateRef.current.offsetY = clampedY;

    cropperImageRef.current.style.transform =
      `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px)) scale(${curZoom})`;
  }, [cropperImageDims, cropperZoom]);

  // Handle photo file selection — open manual cropper (supports Admin mode student re-upload!)
  const handleProfilePhotoSelect = (e, targetStudent = null) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    // Reset file input value so selecting the same file again triggers onChange
    e.target.value = '';

    setCropperTargetStudent(targetStudent || null);
    setCropperFilename(file.name || 'photo.jpg');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const naturalW = img.width;
        const naturalH = img.height;
        const VIEWPORT = 320;
        const baseScale = VIEWPORT / Math.min(naturalW, naturalH);
        const displayW = naturalW * baseScale;
        const displayH = naturalH * baseScale;

        // Head-friendly initial offset: for portrait photos, move UP so face/head is visible
        // Negative offsetY moves image upward → top of photo (face/head) shown first
        const initOffsetX = 0;
        const initOffsetY = naturalH > naturalW ? -((displayH - VIEWPORT) * 0.28) : 0;

        setCropperImageDims({ width: naturalW, height: naturalH, baseScale, displayW, displayH });
        setCropperZoom(1);

        dragStateRef.current = {
          isDragging: false,
          startX: 0,
          startY: 0,
          offsetX: initOffsetX,
          offsetY: initOffsetY,
          initialPinchDist: 0,
          initialZoom: 1
        };

        setCropperSrc(ev.target.result);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Reset cropper alignment to initial position
  const handleResetPosition = () => {
    if (!cropperImageDims) return;
    const { width: naturalW, height: naturalH, displayH } = cropperImageDims;
    const VIEWPORT = 320;
    const initOffsetX = 0;
    // Negative: move image UP so face/head appears at the top of the circle
    const initOffsetY = naturalH > naturalW ? -((displayH - VIEWPORT) * 0.28) : 0;

    setCropperZoom(1);
    dragStateRef.current.offsetX = initOffsetX;
    dragStateRef.current.offsetY = initOffsetY;
    updateCropperTransform(1, initOffsetX, initOffsetY);
  };

  // Confirm crop: draw viewport selection onto 400x400 output canvas
  const handleCropConfirm = () => {
    if (!cropperSrc || !cropperImageDims) return;

    const VIEWPORT = 320;
    const { width: naturalW, height: naturalH, baseScale } = cropperImageDims;
    const zoom = cropperZoom;
    const { offsetX, offsetY } = dragStateRef.current;

    // Total scale factor S (natural -> viewport pixels)
    const S = baseScale * zoom;
    const cropSizeInNatural = VIEWPORT / S;

    // Center coordinates in natural image space
    const centerX_nat = (naturalW / 2) - (offsetX / S);
    const centerY_nat = (naturalH / 2) - (offsetY / S);

    // Top-left corner coordinates in natural image space
    let srcX = centerX_nat - (cropSizeInNatural / 2);
    let srcY = centerY_nat - (cropSizeInNatural / 2);

    srcX = Math.max(0, Math.min(naturalW - cropSizeInNatural, srcX));
    srcY = Math.max(0, Math.min(naturalH - cropSizeInNatural, srcY));

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = async () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, srcX, srcY, cropSizeInNatural, cropSizeInNatural, 0, 0, 400, 400);

      const base64DataUrl = canvas.toDataURL('image/jpeg', 0.92);

      if (cropperTargetStudent) {
        // Admin Mode re-upload: update DB & local state immediately with approved status
        const sId = cropperTargetStudent.id;
        const sName = cropperTargetStudent.name;

        setStudents(prev => {
          const updated = prev.map(s => String(s.id) === String(sId) ? { ...s, photo_url: base64DataUrl, photo_status: 'approved' } : s);
          if (loggedInMadrasa) {
            try {
              const rNum = String(loggedInMadrasa.regNumber || loggedInMadrasa.regnumber || loggedInMadrasa.reg_number || '').trim();
              const raw = localStorage.getItem(`cached_data_${rNum}`);
              if (raw) {
                const cacheObj = JSON.parse(raw);
                cacheObj.students = updated;
                localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cacheObj));
              }
            } catch (e) {}
          }
          return updated;
        });

        try {
          const { error } = await queryWithRetry(() =>
            supabase.from('students').update({ photo_url: base64DataUrl, photo_status: 'approved' }).eq('id', sId)
          );
          if (error) {
            alert('Cloud update warning: ' + getFriendlyErrorMessage(error.message));
          } else {
            alert(lang === 'EN' ? `✅ Photo updated and approved for ${sName}!` : `✅ ${sName} എന്ന വിദ്യാർത്ഥിയുടെ ഫോട്ടോ സക്സസ്ഫുളായി ക്രോപ്പ് ചെയ്ത് സേവ് ചെയ്തു!`);
          }
        } catch (err) {
          console.error("Admin photo crop error:", err);
        }
      } else {
        // View Mode photo upload preview
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], cropperFilename, { type: 'image/jpeg' });
            setProfilePhotoFile(croppedFile);
            setProfilePhotoPreview(base64DataUrl);
            setProfileCropMode(true);
          }
        }, 'image/jpeg', 0.88);
      }

      // Close cropper modal
      handleCropCancel();
    };
    img.src = cropperSrc;
  };

  // Cancel cropper
  const handleCropCancel = () => {
    setCropperSrc(null);
    setCropperImageDims(null);
    setCropperTargetStudent(null);
    setCropperZoom(1);
  };

  // Upload photo — stored as base64 directly in DB (no Storage bucket needed)
  const handleProfilePhotoUpload = async () => {
    if (!profilePhotoFile) { alert(t('alertNoPhotoSelected')); return; }
    if (!profileStudent) { alert(t('alertNoStudentSelected')); return; }
    if (!loggedInMadrasa) { alert(t('alertSessionExpired')); return; }
    setProfileUploading(true);
    try {
      // Compress image to ≤200KB before storing as base64
      const compressImage = (file, maxKB = 200) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            canvas.getContext('2d').drawImage(img, 0, 0, 300, 300);
            let quality = 0.85;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);
            // Reduce quality until under maxKB
            while (dataUrl.length > maxKB * 1024 * 1.37 && quality > 0.3) {
              quality -= 0.1;
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            resolve(dataUrl);
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });

      const base64DataUrl = await compressImage(profilePhotoFile);

      const { error: updateError } = await supabase.from('students').update({
        photo_url: base64DataUrl,
        photo_status: 'pending'
      }).eq('id', profileStudent.id);

      if (updateError) { alert(t('alertUploadFailed') + updateError.message); setProfileUploading(false); return; }

      setProfileStep('WAITING');
      setProfilePhotoFile(null);
      setProfilePhotoPreview(null);
      setProfileCropMode(false);
      if (loggedInMadrasa) fetchSupabaseData(loggedInMadrasa.regNumber);
    } catch (err) {
      alert(t('alertUnexpectedError') + err.message);
    }
    setProfileUploading(false);
  };

  // Admin: Approve photo (1-second instant approval with LocalStorage Cache Persistence)
  const handleApprovePhoto = async (studentId) => {
    setStudents(prev => {
      const updated = prev.map(s => String(s.id) === String(studentId) ? { ...s, photo_status: 'approved' } : s);
      if (loggedInMadrasa) {
        try {
          const rNum = String(loggedInMadrasa.regNumber || loggedInMadrasa.regnumber || loggedInMadrasa.reg_number || '').trim();
          const raw = localStorage.getItem(`cached_data_${rNum}`);
          if (raw) {
            const cacheObj = JSON.parse(raw);
            cacheObj.students = updated;
            localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cacheObj));
          }
        } catch (e) {}
      }
      return updated;
    });

    try {
      const { error } = await queryWithRetry(() =>
        supabase.from('students').update({ photo_status: 'approved' }).eq('id', studentId)
      );
      if (error) console.error("Approve failed:", error.message);
    } catch (err) {
      console.error("Approve photo error:", err);
    }
  };

  // Admin: Approve All Pending Photos (Single Click Instant Bulk Approve with LocalStorage Cache Persistence)
  const handleApproveAllPendingPhotos = async () => {
    const unapprovedStudents = students.filter(s => s.photo_url && String(s.photo_url).trim().length > 5 && s.photo_status !== 'approved');
    if (unapprovedStudents.length === 0) {
      alert(lang === 'EN' ? 'All uploaded photos are already approved!' : 'എല്ലാ ഫോട്ടോകളും ഇതിനകം അപ്പ്രൂവ് ചെയ്തിട്ടുണ്ട്!');
      return;
    }

    const pendingIds = unapprovedStudents.map(s => s.id);

    setStudents(prev => {
      const updated = prev.map(s => pendingIds.map(String).includes(String(s.id)) ? { ...s, photo_status: 'approved' } : s);
      if (loggedInMadrasa) {
        try {
          const rNum = String(loggedInMadrasa.regNumber || loggedInMadrasa.regnumber || loggedInMadrasa.reg_number || '').trim();
          const raw = localStorage.getItem(`cached_data_${rNum}`);
          if (raw) {
            const cacheObj = JSON.parse(raw);
            cacheObj.students = updated;
            localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cacheObj));
          }
        } catch (e) {}
      }
      return updated;
    });

    try {
      const { error } = await queryWithRetry(() =>
        supabase.from('students').update({ photo_status: 'approved' }).in('id', pendingIds)
      );
      if (error) {
        alert('⚠️ Cloud update warning: ' + getFriendlyErrorMessage(error.message));
      } else {
        alert(lang === 'EN' ? `✅ Approved ${unapprovedStudents.length} photo(s) instantly!` : `✅ ${unapprovedStudents.length} ഫോട്ടോകൾ ഒറ്റ സെക്കന്റിൽ അപ്പ്രൂവ് ചെയ്തു!`);
      }
    } catch (err) {
      alert('Approve error: ' + getFriendlyErrorMessage(err.message));
    }
  };

  // Admin: Clean Corrupted/Broken Photos
  const handleCleanCorruptedPhotos = async () => {
    const corrupted = students.filter(s => (s.photo_url && String(s.photo_url).trim().length <= 30) || (s.photo_status === 'pending' && !s.photo_url));
    if (corrupted.length === 0) {
      alert(lang === 'EN' ? 'All uploaded photos are healthy!' : 'എല്ലാ ഫോട്ടോകളും കൃത്യമാണ്, തകരാറുള്ള ഫോട്ടോകൾ ഒന്നുമില്ല!');
      return;
    }
    const corruptedIds = corrupted.map(s => s.id);
    setStudents(prev => prev.map(s => corruptedIds.map(String).includes(String(s.id)) ? { ...s, photo_url: null, photo_status: 'none' } : s));

    try {
      const { error } = await queryWithRetry(() =>
        supabase.from('students').update({ photo_url: null, photo_status: 'none' }).in('id', corruptedIds)
      );
      if (!error) {
        alert(lang === 'EN' ? `Cleaned ${corrupted.length} corrupted photo(s)!` : `${corrupted.length} തകരാറുള്ള ഫോട്ടോകൾ ക്ലിയർ ചെയ്തു!`);
      }
    } catch (e) {}
  };

  // Admin: Delete photo
  const handleDeletePhoto = async (student) => {
    if (!window.confirm(lang === 'EN' ? "Delete this student's photo?" : 'ഈ വിദ്യാർത്ഥിയുടെ ഫോട്ടോ ഇല്ലാതാക്കണമെന്നുറപ്പാണോ?')) return;
    // 🚀 Instant optimistic UI update
    setStudents(prev => {
      const updated = prev.map(s => String(s.id) === String(student.id) ? { ...s, photo_url: null, photo_status: 'none' } : s);
      if (loggedInMadrasa) {
        try {
          const rNum = String(loggedInMadrasa.regNumber || loggedInMadrasa.regnumber || loggedInMadrasa.reg_number || '').trim();
          const raw = localStorage.getItem(`cached_data_${rNum}`);
          if (raw) {
            const cacheObj = JSON.parse(raw);
            cacheObj.students = updated;
            localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cacheObj));
          }
        } catch (e) {}
      }
      return updated;
    });

    try {
      const { error } = await queryWithRetry(() =>
        supabase.from('students').update({ photo_url: null, photo_status: 'none' }).eq('id', student.id)
      );
      if (error) console.error("Delete photo error:", error.message);
    } catch (err) {
      console.error("Delete photo error:", err);
    }
  };

  // Admin: Edit photo (re-upload with cropper)
  const handleAdminPhotoReUpload = async (studentId, file) => {
    if (!file || !loggedInMadrasa) return;
    const targetStudent = students.find(s => String(s.id) === String(studentId));
    handleProfilePhotoSelect({ target: { files: [file], value: '' } }, targetStudent || { id: studentId });
  };

  // Download single ID card as image
  const handleDownloadIdCard = async (cardElement, studentName) => {
    if (!cardElement) return;
    try {
      const canvas = await html2canvas(cardElement, { scale: 3, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
      const dataUrl = canvas.toDataURL('image/png');
      await downloadFile(dataUrl, `ID_Card_${studentName.replace(/\s+/g, '_')}.png`, 'image/png');
    } catch (err) { alert(t('alertDownloadFailed') + err.message); }
  };

  // Download QR Scan Poster as image
  const handleDownloadPoster = async () => {
    const element = document.getElementById('qr-student-poster');
    if (!element || !qrModalData?.student) return;
    try {
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
      const dataUrl = canvas.toDataURL('image/png');
      await downloadFile(dataUrl, `Poster_${qrModalData.student.name.replace(/\s+/g, '_')}.png`, 'image/png');
    } catch (err) {
      alert(t('alertDownloadFailed') + err.message);
    }
  };

  // Download QR Scan Poster as PDF
  const handleDownloadPosterPdf = async () => {
    const element = document.getElementById('qr-student-poster');
    if (!element || !qrModalData?.student) return;
    try {
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190; // A4 is 210mm wide (10mm margins on left/right)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let finalW = imgWidth;
      let finalH = imgHeight;
      if (finalH > 277) { // A4 is 297mm high (10mm margins on top/bottom)
        finalH = 277;
        finalW = (canvas.width * finalH) / canvas.height;
      }

      const x = (210 - finalW) / 2;
      const y = (297 - finalH) / 2;

      pdf.addImage(imgData, 'PNG', x, y, finalW, finalH);
      const pdfBlob = pdf.output('blob');
      await downloadFile(pdfBlob, `Poster_${qrModalData.student.name.replace(/\s+/g, '_')}.pdf`, 'application/pdf');
    } catch (err) {
      alert(t('alertPDFGenerationFailed') + err.message);
    }
  };

  // Generate PDF of multiple ID cards — pure HTML approach (works on all devices including mobile)
  const handleDownloadPDF = useCallback(async (filteredStudentsList, paperSize = 'A4') => {
    if (filteredStudentsList.length === 0) { alert(t('alertNoIdCards')); return; }
    setProfilePdfGenerating(true);
    try {
      const isA3 = paperSize === 'A3';
      const cols = isA3 ? 5 : 2;
      const rows = isA3 ? 2 : 2;
      const cardsPerPage = cols * rows;
      const pageSize = isA3 ? 'A3 landscape' : 'A4 portrait';

      // Build QR data URLs for all students first
      const appUrl = window.location.origin;
      const qrMap = {};
      for (const s of filteredStudentsList) {
        try {
          const qrUrl = `${appUrl}/?qr=${loggedInMadrasa.regNumber}_${s.id}`;
          qrMap[s.id] = await QRCode.toDataURL(qrUrl, { width: 160, margin: 1, color: { dark: '#064e3b', light: '#ffffff' } });
        } catch (e) { qrMap[s.id] = ''; }
      }

      // Build card HTML for each student
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
        const qrHtml = qrMap[s.id] ? `<img src="${qrMap[s.id]}" style="width:68px;height:68px;display:block;" />` : '';
        return `<div class="id-card">
          <div class="stripe"></div>
          <div class="card-header">
            <div class="madrasa-name">${loggedInMadrasa ? loggedInMadrasa.name : ''}</div>
            <div class="madrasa-meta">${loggedInMadrasa ? loggedInMadrasa.regNumber : ''} | ${loggedInMadrasa ? loggedInMadrasa.place : ''}</div>
          </div>
          <div class="card-top">
            <div class="photo-box">${photoHtml}</div>
            <div class="name-box">
              <div class="student-name">${s.name || ''}</div>
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

      // Group cards into pages
      const pages = [];
      for (let i = 0; i < cardHtmlList.length; i += cardsPerPage) {
        pages.push(cardHtmlList.slice(i, i + cardsPerPage));
      }

      const pagesHtml = pages.map(pageCards =>
        `<div class="page"><div class="card-grid">${pageCards.join('')}</div></div>`
      ).join('');

      const madrasaLabel = loggedInMadrasa ? loggedInMadrasa.name.replace(/\s+/g, '_') : 'export';
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ID Cards - ${madrasaLabel} - ${paperSize}</title>
<style>
  @page { size: ${pageSize}; margin: 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { page-break-after: always; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .page:last-child { page-break-after: auto; }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(${cols}, 75mm);
    grid-template-rows: repeat(${rows}, 100mm);
    gap: 4mm;
  }
  .id-card {
    width: 75mm; height: 100mm;
    border: 2px solid #16a34a;
    overflow: hidden;
    display: flex; flex-direction: column;
    background: linear-gradient(160deg, #ffffff 0%, #f0fdf4 40%, #ecfdf5 70%, #f0fff4 100%);
    position: relative;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .stripe { height: 4px; background: linear-gradient(90deg,#15803d,#fbbf24,#4ade80,#15803d); flex-shrink: 0; position: relative; z-index: 1; }
  .card-header {
    background: linear-gradient(135deg, #166534 0%, #15803d 100%);
    padding: 4px 6px 3px; flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center;
    position: relative; z-index: 1;
    border-bottom: 2px solid #fbbf24;
  }
  .madrasa-name { font-size: 7px; font-weight: 900; color: #fef08a; text-align: center; letter-spacing: 0.3px; text-transform: uppercase; line-height: 1.3; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
  .madrasa-meta { font-size: 5.5px; color: #bbf7d0; text-align: center; opacity: 0.9; }
  .card-top { flex-shrink: 0; display: flex; flex-direction: row; align-items: center; padding: 5px 6px; background: rgba(21,128,61,0.06); border-bottom: 2px solid #fbbf24; gap: 6px; position: relative; z-index: 1; }
  .photo-box { flex-shrink: 0; width: 108px; height: 126px; border-radius: 8px; border: 2px solid #16a34a; overflow: hidden; background: #f0fdf4; box-shadow: 0 3px 10px rgba(22,163,74,0.25); }
  .name-box { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-width: 0; width: 100%; }
  .student-name { font-size: 10.5px; font-weight: 900; color: #14532d; text-transform: uppercase; line-height: 1.2; word-break: break-word; text-align: center; width: 100%; }
  .reg-badge { background: linear-gradient(135deg,#fbbf24,#f59e0b); border-radius: 6px; padding: 3px 6px; text-align: center; box-shadow: 0 3px 8px rgba(251,191,36,0.4); border: 1.5px solid #d97706; width: 100%; max-width: 95px; margin: 0 auto; box-sizing: border-box; }
  .reg-label { font-size: 5.5px; font-weight: 800; color: #78350f; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 1px; }
  .reg-num { font-size: 19px; font-weight: 900; color: #1c1917; letter-spacing: 1px; line-height: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }
  .details { flex-shrink: 0; padding: 4px 5px; display: flex; flex-direction: column; gap: 3px; position: relative; z-index: 1; }
  .detail-row { border-radius: 4px; padding: 4px 6px; display: flex; flex-direction: column; gap: 1px; }
  .detail-row-group { background: rgba(22,163,74,0.1); border: 1px solid rgba(22,163,74,0.35); border-left: 3px solid #16a34a; }
  .detail-row-cat   { background: rgba(251,191,36,0.12); border: 1px solid rgba(217,119,6,0.35); border-left: 3px solid #f59e0b; }
  .detail-row-gen-b { background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.4); border-left: 3px solid #60a5fa; }
  .detail-row-gen-g { background: rgba(244,114,182,0.1); border: 1px solid rgba(244,114,182,0.4); border-left: 3px solid #f472b6; }
  .dl { font-size: 5.5px; font-weight: 900; text-transform: uppercase; color: #15803d; letter-spacing: 0.8px; }
  .dl-cat { color: #b45309; }
  .dl-boy { color: #2563eb; }
  .dl-girl { color: #be185d; }
  .dv { font-weight: 800; color: #14532d; font-size: 7px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .qr-section { flex: 1; display: flex; justify-content: center; align-items: center; position: relative; z-index: 1; }
  .qr-section-inner { background: rgba(255,255,255,0.97); border: 2px solid #fbbf24; border-radius: 7px; padding: 4px 7px; display: flex; flex-direction: column; align-items: center; gap: 2px; box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
  .qr-scan-label { font-size: 4.5px; font-weight: 900; color: #166534; text-transform: uppercase; letter-spacing: 1.2px; }
  .card-footer { background: linear-gradient(135deg, #166534 0%, #15803d 100%); border-top: 2px solid #fbbf24; padding: 4px 5px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; z-index: 1; }
  .footer-text { font-size: 5.5px; color: #fef08a; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; }
</style>
</head>
<body>
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
  }, [teams, categories, loggedInMadrasa, t]);

  return (
    <div className="main-container">

      {/* ✂️ PROFESSIONAL MANUAL PHOTO CROPPER MODAL */}
      {cropperSrc && cropperImageDims && (
        <div className="cropper-modal-overlay">
          <div className="cropper-modal-card">
            {/* Header */}
            <div className="cropper-modal-header">
              <div className="cropper-modal-title">
                ✂️ {lang === 'EN' ? 'Crop & Position Photo' : 'ഫോട്ടോ ക്രോപ്പ് ചെയ്യുക'}
              </div>
              <div className="cropper-modal-subtitle">
                {lang === 'EN'
                  ? '👆 Drag to move  •  🔍 Pinch or slider to zoom  •  🎯 Center your face'
                  : 'ഡ്രാഗ് ചെയ്ത് മുഖം നടുക്ക് ആക്കുക • സൂം ചെയ്യുക'}
              </div>
              {cropperTargetStudent && (
                <div className="cropper-target-badge">
                  👤 {cropperTargetStudent.name} ({cropperTargetStudent.regno || cropperTargetStudent.regNo || ''})
                </div>
              )}
            </div>

            {/* Circular Viewport */}
            <div
              className="cropper-viewport-container"
              onMouseDown={(e) => {
                dragStateRef.current.isDragging = true;
                dragStateRef.current.startX = e.clientX;
                dragStateRef.current.startY = e.clientY;
              }}
              onMouseMove={(e) => {
                if (!dragStateRef.current.isDragging) return;
                const dx = e.clientX - dragStateRef.current.startX;
                const dy = e.clientY - dragStateRef.current.startY;
                dragStateRef.current.startX = e.clientX;
                dragStateRef.current.startY = e.clientY;
                updateCropperTransform(cropperZoom, dragStateRef.current.offsetX + dx, dragStateRef.current.offsetY + dy);
              }}
              onMouseUp={() => { dragStateRef.current.isDragging = false; }}
              onMouseLeave={() => { dragStateRef.current.isDragging = false; }}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                setCropperZoom(prev => {
                  const next = Math.min(3.5, Math.max(1.0, prev + delta));
                  updateCropperTransform(next);
                  return next;
                });
              }}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  dragStateRef.current.isDragging = true;
                  dragStateRef.current.startX = e.touches[0].clientX;
                  dragStateRef.current.startY = e.touches[0].clientY;
                } else if (e.touches.length === 2) {
                  dragStateRef.current.isDragging = false;
                  const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                  );
                  dragStateRef.current.initialPinchDist = dist;
                  dragStateRef.current.initialZoom = cropperZoom;
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 1 && dragStateRef.current.isDragging) {
                  e.preventDefault();
                  const dx = e.touches[0].clientX - dragStateRef.current.startX;
                  const dy = e.touches[0].clientY - dragStateRef.current.startY;
                  dragStateRef.current.startX = e.touches[0].clientX;
                  dragStateRef.current.startY = e.touches[0].clientY;
                  updateCropperTransform(cropperZoom, dragStateRef.current.offsetX + dx, dragStateRef.current.offsetY + dy);
                } else if (e.touches.length === 2 && dragStateRef.current.initialPinchDist > 0) {
                  e.preventDefault();
                  const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                  );
                  const scaleFactor = dist / dragStateRef.current.initialPinchDist;
                  const nextZoom = Math.min(3.5, Math.max(1.0, dragStateRef.current.initialZoom * scaleFactor));
                  setCropperZoom(nextZoom);
                  updateCropperTransform(nextZoom);
                }
              }}
              onTouchEnd={(e) => {
                if (e.touches.length < 2) dragStateRef.current.initialPinchDist = 0;
                if (e.touches.length === 0) dragStateRef.current.isDragging = false;
              }}
            >
              {/* Scaled Image */}
              <img
                ref={cropperImageRef}
                src={cropperSrc}
                alt="crop view"
                style={{
                  width: `${cropperImageDims.displayW}px`,
                  height: `${cropperImageDims.displayH}px`,
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${dragStateRef.current.offsetX}px), calc(-50% + ${dragStateRef.current.offsetY}px)) scale(${cropperZoom})`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  display: 'block'
                }}
                draggable={false}
              />
              {/* Face position guide - dashed oval showing ideal face placement */}
              <div style={{
                position: 'absolute',
                top: '8%',
                left: '22%',
                width: '56%',
                height: '50%',
                borderRadius: '50%',
                border: '1.5px dashed rgba(250, 204, 21, 0.55)',
                pointerEvents: 'none',
                zIndex: 5
              }} />
              {/* Circular border ring */}
              <div className="cropper-ring-overlay" />
              {/* Subtle alignment crosshair grid */}
              <div className="cropper-grid-overlay" />
            </div>

            {/* Zoom hint */}
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>
              {lang === 'EN' ? '💛 Align face within the dashed guide' : '💛 മുഖം ഡോട്ടഡ് ഗൈഡിൽ ഒതുക്കുക'}
            </div>

            {/* Slider & Controls */}
            <div className="cropper-slider-wrapper">
              <span className="cropper-slider-icon">🔍−</span>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.02"
                value={cropperZoom}
                onChange={(e) => {
                  const z = parseFloat(e.target.value);
                  setCropperZoom(z);
                  updateCropperTransform(z);
                }}
                className="cropper-range-input"
              />
              <span className="cropper-slider-icon">+</span>
              <span className="cropper-zoom-badge">{Math.round(cropperZoom * 100)}%</span>
            </div>

            {/* Reset alignment button */}
            <div className="cropper-reset-row">
              <button onClick={handleResetPosition} className="cropper-btn-reset">
                🔄 {lang === 'EN' ? 'Reset to Top' : 'തല ഭാഗം കാണിക്കുക'}
              </button>
            </div>

            {/* Action buttons */}
            <div className="cropper-actions-row">
              <button onClick={handleCropCancel} className="cropper-btn-cancel">
                ✕ {lang === 'EN' ? 'Cancel' : 'റദ്ദാക്കുക'}
              </button>
              <button onClick={handleCropConfirm} className="cropper-btn-confirm">
                ✓ {lang === 'EN' ? 'Crop & Use Photo' : 'ക്രോപ്പ് ചെയ്ത് നൽകുക'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 LOGIN SCREEN */}
      {currentScreen === 'LOGIN' && (
        <div className="executive-login-container">
          {/* Floating Language Toggle */}
          <button
            onClick={toggleLanguage}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            🌐 {lang === 'EN' ? 'മലയാളം' : 'English'}
          </button>

          <div className="executive-login-card">
            <div className="login-brand-section">
              <img src="/logo192_black.png" alt="Milad Fest Logo" style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'cover', marginBottom: '10px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
              <h2>{t('appName')}</h2>
              <p className="subtitle">{t('loginSubtitle')}</p>
            </div>

            {/* 📲 PWA Install Popup - Custom Notification Popup shown before credential inputs */}
            {showInstallPopup && (
              <div className="pwa-notification-popup">
                <div className="pwa-popup-header">
                  <span className="pwa-popup-icon">📲</span>
                  <div className="pwa-popup-title-area">
                    <h4>{lang === 'EN' ? 'Install Milad Fest' : 'Milad Fest ഇൻസ്റ്റാൾ ചെയ്യാം'}</h4>
                    <p>{lang === 'EN' ? 'Install app for a faster experience' : 'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്താൽ വളരെ പെട്ടെന്ന് ഉപയോഗിക്കാം'}</p>
                  </div>
                </div>

                {!isIosDevice ? (
                  /* Android UI */
                  <div className="pwa-popup-body">
                    <p className="pwa-popup-description">
                      {lang === 'EN' ? 'Install Milad Fest application on your mobile.' : 'മീലാദ് ഫെസ്റ്റ് ആപ്ലിക്കേഷൻ നിങ്ങളുടെ മൊബൈലിലേക്ക് ഇൻസ്റ്റാൾ ചെയ്യുക.'}
                    </p>
                    <div className="pwa-popup-actions">
                      <button onClick={handleInstallApp} className="btn-popup-install">
                        Install App
                      </button>
                      <button onClick={handleDismissInstall} className="btn-popup-cancel">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* iOS UI (iPhone/iPad) */
                  <div className="pwa-popup-body">
                    <div className="ios-steps-container">
                      <p className="ios-steps-title">{lang === 'EN' ? 'How to install:' : 'ഇൻസ്റ്റാൾ ചെയ്യേണ്ട രൂപം:'}</p>
                      <ol className="ios-steps-list">
                        {lang === 'EN' ? (
                          <>
                            <li>Press the <strong>Share</strong> (⎙) button in Safari browser.</li>
                            <li>Scroll down and select <strong>'Add to Home Screen'</strong>.</li>
                            <li>Press the <strong>'Add'</strong> button in the top right.</li>
                          </>
                        ) : (
                          <>
                            <li>സഫാരി ബ്രൗസറിലെ <strong>Share</strong> (⎙) ബട്ടൺ അമർത്തുക.</li>
                            <li>താഴേക്ക് സ്ക്രോൾ ചെയ്ത് <strong>'Add to Home Screen'</strong> എന്നത് സെലക്ട് ചെയ്യുക.</li>
                            <li>മുകളിൽ വലതുഭാഗത്തുള്ള <strong>'Add'</strong> ബട്ടൺ അമർത്തുക.</li>
                          </>
                        )}
                      </ol>
                    </div>
                    <div className="pwa-popup-actions">
                      <button onClick={handleDismissInstall} className="btn-popup-install">
                        OK
                      </button>
                      <button onClick={handleDismissInstall} className="btn-popup-cancel">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="executive-form-group">
                <label>{t('regNumberLabel')}</label>
                <input type="tel" inputMode="numeric" pattern="[0-9]*" className="executive-input" style={{ paddingLeft: '15px' }} placeholder={t('regNumberPlaceholder')} value={loginRegNum} onChange={(e) => setLoginRegNum(e.target.value)} required />
              </div>
              <div className="executive-form-group">
                <label>{t('passwordLabel')}</label>
                <input type="tel" inputMode="numeric" pattern="[0-9]*" className="executive-input" style={{ paddingLeft: '15px' }} placeholder={t('passwordPlaceholder')} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-executive-gold" disabled={isLoggingIn}>
                {isLoggingIn ? t('loggingIn') : t('loginBtn')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <span onClick={() => {
                setRegName(''); setRegNumber(''); setRegPlace(''); setAdminPassword(''); setViewPassword('');
                setCurrentScreen('REGISTER_FORM');
              }} style={{ color: '#94a3b8', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }} className="admin-premium-link">
                {t('newMadrasaReg')}
              </span>
            </div>

            <div className="admin-only-footer">
              <span onClick={() => { setCurrentScreen('REGISTER_LOCK'); }} className="admin-premium-link">{t('adminControlPanel')}</span>
            </div>
          </div>
        </div>
      )}



      {/* 🔐 SECURITY LOCK */}
      {currentScreen === 'REGISTER_LOCK' && (
        <div className="executive-login-container">
          <div className="executive-login-card">
            <div className="login-brand-section"><h2>🔐 Security Lock</h2></div>
            <div className="executive-form-group">
              <input type="tel" inputMode="numeric" pattern="[0-9]*" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Secret Key" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} />
            </div>
            <div className="flex-button-group">
              <button onClick={() => {
                if (secretKey === '0633123') {
                  setCurrentScreen('SUPER_ADMIN_PANEL');
                  setSecretKey('');
                  fetchMadrasas();
                } else {
                  alert('Invalid Key!');
                }
              }} className="btn-executive-gold">Continue</button>
              <button onClick={() => setCurrentScreen('LOGIN')} className="btn-executive-secondary">Back</button>
            </div>
          </div>
        </div>
      )}

      {/* 📝 REGISTRATION FORM */}
      {currentScreen === 'REGISTER_FORM' && (
        <div className="executive-login-container">
          <div className="executive-login-card">
            <h2>📝 New Madrasa Registration</h2>
            <form onSubmit={handleRegisterMadrasa} style={{ marginTop: '15px' }}>
              <div className="executive-form-group">
                <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Madrasa Name</label>
                <input type="text" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Enter Madrasa Name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
              </div>
              <div className="executive-form-group">
                <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Register Number</label>
                <input type="tel" inputMode="numeric" pattern="[0-9]*" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Enter Register Number" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} required />
              </div>
              <div className="executive-form-group">
                <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Location / Place</label>
                <input type="text" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Enter Location" value={regPlace} onChange={(e) => setRegPlace(e.target.value)} required />
              </div>
              <div className="executive-form-group">
                <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Admin Password</label>
                <input type="tel" inputMode="numeric" pattern="[0-9]*" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Set Admin Password (numbers)" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
              </div>
              <div className="executive-form-group">
                <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '4px' }}>View Password</label>
                <input type="tel" inputMode="numeric" pattern="[0-9]*" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Set View Password (numbers)" value={viewPassword} onChange={(e) => setViewPassword(e.target.value)} required />
              </div>
              <div className="flex-button-group">
                <button type="submit" className="btn-executive-gold">Register</button>
                <button type="button" onClick={() => setCurrentScreen('LOGIN')} className="btn-executive-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⏳ PENDING APPROVAL SCREEN */}
      {currentScreen === 'PENDING_APPROVAL' && pendingMadrasa && (
        <div className="executive-login-container">
          <div className="executive-login-card" style={{ textAlign: 'center' }}>
            <div className="login-brand-section">
              <span style={{ fontSize: '50px' }}>⏳</span>
              <h2 style={{ marginTop: '15px', color: 'white' }}>Waiting for Approval</h2>
              <p className="subtitle" style={{ color: '#94a3b8', fontSize: '14px', marginTop: '10px' }}>
                Your madrasa (<b>{pendingMadrasa.name}</b>) is pending approval.
              </p>
            </div>

            <div style={{ margin: '25px 0', background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p style={{ color: '#e2e8f0', fontSize: '14px', marginBottom: '15px' }}>
                Click the WhatsApp button below to send an approval request message.
              </p>

              <a
                href={`https://wa.me/917559950633?text=${encodeURIComponent(`Hello Admin,\nPlease approve our Madrasa registration.\n\nMadrasa Name: ${pendingMadrasa.name}\nRegister Number: ${pendingMadrasa.regNumber}\nPlace: ${(pendingMadrasa.place || '').split('|')[0]}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: '#25D366',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  marginTop: '10px',
                  fontSize: '15px',
                  transition: 'background 0.3s'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.054L2 22l5.13-1.346a9.921 9.921 0 004.882 1.28h.005c5.507 0 9.99-4.478 9.99-9.985 0-2.667-1.037-5.176-2.923-7.062A9.919 9.919 0 0012.012 2zm5.727 14.128c-.315.442-1.077.85-1.485.91-.376.056-.84.09-2.28-.49-1.846-.743-3.023-2.62-3.115-2.742-.092-.122-.767-.999-.767-1.998 0-.999.524-1.49.71-1.696.186-.206.406-.258.54-.258.136 0 .272.001.39.006.124.005.289-.046.452.348.169.406.576 1.393.626 1.493.05.1.084.218.016.353-.067.135-.102.218-.203.336-.1.118-.21.265-.3.353-.1.1-.205.208-.088.406.117.199.52.85 1.115 1.378.767.68 1.412.89 1.614.99.203.1.32.084.44-.053.117-.137.507-.588.642-.789.137-.2.271-.169.457-.1.187.068 1.182.556 1.385.657.203.1.339.152.39.237.05.084.05 1.238-.266 1.68z" />
                </svg>
                WhatsApp Approval
              </a>
            </div>

            <button onClick={() => { setCurrentScreen('LOGIN'); setPendingMadrasa(null); }} className="btn-executive-secondary">Back</button>
          </div>
        </div>
      )}

      {/* ⚙️ SUPER ADMIN PANEL */}
      {currentScreen === 'SUPER_ADMIN_PANEL' && (
        <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
          <header className="dash-header" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}>
            <div>
              <h1 style={{ color: 'white' }}>⚙️ Super Admin Control Panel</h1>
              <p>Registered Madrasa Management System</p>
            </div>
            <button onClick={() => setCurrentScreen('LOGIN')} className="btn-logout-top">Login Screen</button>
          </header>

          {/* Stats section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', margin: 0, padding: '15px' }}>
              <h4 style={{ color: '#1e40af', fontSize: '14px', margin: 0 }}>Total Madrasas</h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#1d4ed8' }}>{superMadrasas.length}</p>
            </div>
            <div className="card" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', margin: 0, padding: '15px' }}>
              <h4 style={{ color: '#065f46', fontSize: '14px', margin: 0 }}>Approved</h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#047857' }}>
                {superMadrasas.filter(m => !(m.place || '').includes('|pending') && !(m.place || '').includes('|blocked')).length}
              </p>
            </div>
            <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a', margin: 0, padding: '15px' }}>
              <h4 style={{ color: '#92400e', fontSize: '14px', margin: 0 }}>Pending Madrasas</h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#d97706' }}>
                {superMadrasas.filter(m => (m.place || '').includes('|pending')).length}
              </p>
            </div>
            <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca', margin: 0, padding: '15px' }}>
              <h4 style={{ color: '#991b1b', fontSize: '14px', margin: 0 }}>Blocked</h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#dc2626' }}>
                {superMadrasas.filter(m => (m.place || '').includes('|blocked')).length}
              </p>
            </div>
          </div>

          {/* Madrasa List */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>📜 Registered Madrasas</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="🔍 Register Number / Name..."
                    value={superSearchTerm}
                    onChange={e => setSuperSearchTerm(e.target.value)}
                    className="settings-input"
                    style={{ padding: '8px 30px 8px 12px', width: '260px', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  {superSearchTerm && (
                    <button
                      onClick={() => setSuperSearchTerm('')}
                      style={{ position: 'absolute', right: '8px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', lineHeight: 1 }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="table-responsive-wrapper" style={{ marginTop: '15px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Register Number</th>
                    <th>Place</th>
                    <th>Admin Password</th>
                    <th>Viewers Password</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredMadrasas = superMadrasas.filter(m => {
                      if (!superSearchTerm.trim()) return true;
                      const term = superSearchTerm.trim().toLowerCase();
                      const regNo = (m.regNumber || '').toString().toLowerCase();
                      const name = (m.name || '').toLowerCase();
                      const place = ((m.place || '').split('|')[0] || '').toLowerCase();
                      return regNo.includes(term) || name.includes(term) || place.includes(term);
                    });

                    if (filteredMadrasas.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                            {superSearchTerm ? `No madrasa found for "${superSearchTerm}".` : 'No madrasas registered.'}
                          </td>
                        </tr>
                      );
                    }

                    return filteredMadrasas.map(m => {
                      const [place, status] = (m.place || '').split('|');
                      const currentStatus = status || 'approved';
                      const isEditing = editingMadrasaId === m.id;

                      return (
                        <tr key={m.id} style={{ background: currentStatus === 'pending' ? '#fffbeb' : currentStatus === 'blocked' ? '#fef2f2' : 'none' }}>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="settings-input"
                                style={{ padding: '5px', fontSize: '13px' }}
                                value={editingMadrasaData.name || ''}
                                onChange={e => setEditingMadrasaData({ ...editingMadrasaData, name: e.target.value })}
                              />
                            ) : (
                              <b>{m.name}</b>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="settings-input"
                                style={{ padding: '5px', fontSize: '13px' }}
                                value={editingMadrasaData.regNumber || ''}
                                onChange={e => setEditingMadrasaData({ ...editingMadrasaData, regNumber: e.target.value })}
                              />
                            ) : (
                              m.regNumber
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="settings-input"
                                style={{ padding: '5px', fontSize: '13px' }}
                                value={editingMadrasaData.tempPlace || ''}
                                onChange={e => setEditingMadrasaData({ ...editingMadrasaData, tempPlace: e.target.value })}
                              />
                            ) : (
                              place
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="settings-input"
                                style={{ padding: '5px', fontSize: '13px' }}
                                value={editingMadrasaData.adminPassword || ''}
                                onChange={e => setEditingMadrasaData({ ...editingMadrasaData, adminPassword: e.target.value })}
                              />
                            ) : (
                              <span style={{ fontFamily: 'monospace' }}>{m.adminPassword}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="settings-input"
                                style={{ padding: '5px', fontSize: '13px' }}
                                value={editingMadrasaData.viewPassword || ''}
                                onChange={e => setEditingMadrasaData({ ...editingMadrasaData, viewPassword: e.target.value })}
                              />
                            ) : (
                              <span style={{ fontFamily: 'monospace' }}>{m.viewPassword}</span>
                            )}
                          </td>
                          <td>
                            <span style={{
                              background: currentStatus === 'approved' ? '#10b981' : currentStatus === 'pending' ? '#f59e0b' : '#ef4444',
                              color: 'white',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              {currentStatus === 'approved' ? 'APPROVED' : currentStatus === 'pending' ? 'PENDING' : 'BLOCKED'}
                            </span>
                          </td>
                          <td>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                <button onClick={handleSaveMadrasaEdit} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Save</button>
                                <button onClick={() => setEditingMadrasaId(null)} style={{ background: '#64748b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {currentStatus !== 'approved' && (
                                  <button onClick={() => handleApproveMadrasa(m)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Approve</button>
                                )}
                                {currentStatus !== 'blocked' && (
                                  <button onClick={() => handleBlockMadrasa(m)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Block</button>
                                )}
                                <button onClick={() => startEditMadrasa(m)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                                <button onClick={() => handleDeleteMadrasa(m.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🕌 MAIN DASHBOARD WITH BOTTOM NAV */}
      {currentScreen === 'DASHBOARD' && (
        <div className="dashboard-container">

          {/* 📡 Offline Status Banner */}
          {!isOnline && (
            <div style={{
              background: 'linear-gradient(135deg, #b45309, #d97706)',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '10px',
              marginBottom: '14px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <span>📡</span>
              <span>
                {lang === 'EN'
                  ? 'Offline Mode — Showing last saved data (Network weak/disconnected)'
                  : 'ഓഫ്‌ലൈൻ മോഡ് — സേവ് ചെയ്ത വിവരങ്ങളാണ് കാണിക്കുന്നത് (നെറ്റ്‌വർക്ക് ലഭ്യമല്ല)'}
              </span>
            </div>
          )}

          <header className="dash-header">
            <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '700', wordBreak: 'break-word', whiteSpace: 'normal', margin: 0 }}>
                {loggedInMadrasa ? loggedInMadrasa.name : ''}
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.8 }}>
                {t('regNo')} {loggedInMadrasa ? loggedInMadrasa.regNumber : ''} | {loggedInMadrasa ? loggedInMadrasa.place : ''} ({t(loginRole === 'ADMIN' ? 'adminMode' : 'viewMode')})
              </p>
            </div>
            <div className="header-buttons-wrapper">
              <button
                onClick={toggleLanguage}
                className="btn-logout-top lang-btn-top"
              >
                🌐 {lang === 'EN' ? 'മലയാളം' : 'English'}
              </button>
              <button onClick={() => {
                // 🔒 MULTI-TENANT PURGE: Clear session + ALL React state on logout
                fetchReqIdRef.current++;
                isFetchingRef.current = false;
                lastFetchRNumRef.current = '';
                try { localStorage.removeItem('miladfest_session'); } catch(e){}
                try { sessionStorage.removeItem('miladfest_session'); } catch(e){}
                setLoggedInMadrasa(null);
                setLoginRole('');
                setCurrentScreen('LOGIN');
                setStudents([]);
                setTeams([]);
                setCategories([]);
                setPrograms([]);
                setResultsList([]);
                setProgramRegistrations([]);
                setGroupRegistrations([]);
                setTimetable([]);
                setVisibilityControls({ scoreboard: true, results_PROGRAM_WINNERS: true, results_STUDENT_REPORT: true, results_RESULTS_HISTORY: true, results_CHAMPIONS: true });
                setIsInitialDataLoading(false);
                setEventName('');
                setEventYear('');
                setConvenerSadar('');
                setCoordinatorConvener('');
                setGeneralCatIds([]);
              }} className="btn-logout-top logout-btn-top">{t('logoutBtn')}</button>
            </div>
          </header>

          {/* Loading spinner while first-time data loads for new madrasa after login */}
          {isInitialDataLoading && (
            <div className="card animate-tab" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>⏳</div>
              <h3 style={{ color: '#0f766e', marginBottom: '8px', fontSize: '18px', fontWeight: '800' }}>
                {lang === 'EN' ? 'Loading data...' : 'ഡേറ്റ ലോഡ് ചെയ്യുന്നു...'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                {lang === 'EN' ? 'Fetching latest information from server.' : 'സെർവറിൽ നിന്ന് ഏറ്റവും പുതിയ വിവരങ്ങൾ ലഭ്യമാക്കുന്നു.'}
              </p>
            </div>
          )}
          {/* ---------------- 🎯 TAB 1: SCOREBOARD ---------------- */}
          {!isInitialDataLoading && activeTab === 'SCOREBOARD' && (
            loginRole === 'VIEW' && !visibilityControls.scoreboard ? (
              <div className="card animate-tab" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
                <h2 style={{ color: '#0f766e', marginBottom: '10px' }}>
                  {lang === 'EN' ? 'Results not yet published' : 'ഫലം പ്രസിദ്ധീകരിച്ചിട്ടില്ല'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '15px' }}>
                  {lang === 'EN' ? 'The scoreboard has been temporarily hidden by the administrator.' : 'സ്കോർബോർഡ് അഡ്മിനിസ്ട്രേറ്റർ താത്കാലികമായി മറച്ചു വെച്ചിരിക്കുകയാണ്.'}
                </p>
              </div>
            ) : (
              <div className="card animate-tab scoreboard-main-card">
                <div className="scoreboard-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', margin: '0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>{t('liveScoreboard')}</h2>
                      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{t('realTimePoints')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {loginRole === 'ADMIN' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={handleToggleTrollMode}
                            style={{
                              background: trollMode ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #059669, #047857)',
                              color: '#fff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                              transition: 'all 0.2s'
                            }}
                            className="troll-mode-toggle-btn"
                          >
                            {trollMode ? (lang === 'EN' ? '😎 Troll Mode: Active' : '😎 ട്രോൾ മോഡ്: ഓൺ') : (lang === 'EN' ? '😜 Troll Mode: Off' : '😜 ട്രോൾ മോഡ്: ഓഫ്')}
                          </button>
                          {trollMode && (
                            <button
                              onClick={handleToggleTrollLang}
                              style={{
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                transition: 'all 0.2s'
                              }}
                              className="troll-lang-toggle-btn"
                            >
                              🗣️ {lang === 'EN' ? `Trolls: ${trollLang === 'ML' ? 'Malayalam' : 'English'}` : `ട്രോൾ: ${trollLang === 'ML' ? 'മലയാളം' : 'English'}`}
                            </button>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => setIsProjectorActive(true)}
                        style={{
                          background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s'
                        }}
                        className="projector-trigger-btn"
                      >
                        📺 {lang === 'EN' ? 'Projector Mode' : 'പ്രൊജക്ടർ മോഡ്'}
                      </button>
                      {loginRole === 'ADMIN' && (
                        <button
                          onClick={handleGenerateLivePoster}
                          style={{
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 10px rgba(109,40,217,0.35)',
                            transition: 'all 0.2s'
                          }}
                          title={lang === 'EN' ? 'Download Live Score Poster' : 'ലൈവ് സ്കോർ പോസ്റ്റർ ഡൗൺലോഡ്'}
                        >
                          🖼️ {lang === 'EN' ? 'Score Poster' : 'സ്കോർ പോസ്റ്റർ'}
                        </button>
                      )}
                      <div className="live-badge">
                        <span className="live-dot"></span> {t('liveBadge')}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  {teams.length === 0 ? <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>{t('noTeamsMsg')}</p> :
                    <div className="live-leaderboard">
                      {(() => {
                        const sortedTeams = [...teams].sort((a, b) => getTeamTotalPoints(b.id) - getTeamTotalPoints(a.id));
                        const maxPts = sortedTeams.length > 0 ? getTeamTotalPoints(sortedTeams[0].id) : 0;
                        const graphMax = maxPts > 0 ? maxPts : 10;

                        // Build rank with tie-handling: equal points → same rank
                        let currentRank = 1;
                        const teamRanks = sortedTeams.map((t, idx) => {
                          if (idx > 0 && getTeamTotalPoints(t.id) < getTeamTotalPoints(sortedTeams[idx - 1].id)) {
                            currentRank = idx + 1;
                          }
                          return currentRank;
                        });

                        return sortedTeams.map((team, idx) => {
                          const totalPts = getTeamTotalPoints(team.id);
                          const barWidth = Math.max(8, (totalPts / graphMax) * 100);
                          const rank = teamRanks[idx];
                          const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
                          const badgeIcon = rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';

                          return (
                            <div key={team.id} className={`leaderboard-item ${rankClass}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <div className="leaderboard-rank-badge">{badgeIcon}</div>
                                <div className="leaderboard-content" style={{ flex: 1 }}>
                                  <div className="team-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span className="team-name">{team.name}</span>
                                      {trollMode && (() => {
                                        const reaction = getTrollReaction(rank, team.name, trollLang, trollOffsets[team.id] || 0);
                                        return (
                                          <div
                                            className="troll-badge-container"
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setTrollOffsets(prev => ({ ...prev, [team.id]: (prev[team.id] || 0) + 1 }));
                                            }}
                                            title={lang === 'EN' ? 'Click to change reaction!' : 'മാറ്റാൻ ക്ലിക്ക് ചെയ്യുക!'}
                                          >
                                            <span className="troll-emoji-avatar animate-troll-emoji" style={{ fontSize: '22px' }}>
                                              {reaction.emoji}
                                            </span>
                                            <div className="troll-speech-bubble">
                                              {reaction.text}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                    <span className="team-score-text">{totalPts} <span>{t('points')}</span></span>
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
                                  const catResults = resultsList.filter(r => (String(r.teamId) === String(team.id) || String(r.teamid) === String(team.id)) && r.catname === c.name);
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
                          );
                        });
                      })()}
                    </div>
                  }
                </div>
              </div>
            )
          )}

          {/* ---------------- 🎯 TAB 2: RECENT RESULTS + PROGRAM WINNERS + STUDENT SEARCH ---------------- */}
          {activeTab === 'RECENT' && (
            loginRole === 'VIEW' && !['PROGRAM_WINNERS', 'STUDENT_REPORT', 'RESULTS_HISTORY', 'CHAMPIONS'].some(key => visibilityControls['results_' + key]) ? (
              <div className="card animate-tab" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
                <h2 style={{ color: '#0f766e', marginBottom: '10px' }}>
                  {lang === 'EN' ? 'Results not yet published' : 'ഫലം പ്രസിദ്ധീകരിച്ചിട്ടില്ല'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '15px' }}>
                  {lang === 'EN' ? 'Results have been temporarily hidden by the administrator.' : 'ഫലങ്ങൾ അഡ്മിനിസ്ട്രേറ്റർ താത്കാലികമായി മറച്ചു വെച്ചിരിക്കുകയാണ്.'}
                </p>
              </div>
            ) : (
              <div className="card animate-tab">
                <h2 style={{ marginBottom: '18px' }}>🏆 Results</h2>

                {/* Results Card Grid Navigation */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { key: 'PROGRAM_WINNERS', icon: '🏆', label: 'Program Winners', grad: 'linear-gradient(135deg, #f59e0b, #d97706)', actBg: '#fffbeb', actBorder: '#fcd34d' },
                    { key: 'STUDENT_REPORT', icon: '🔍📜', label: 'Student Report & Certificate', grad: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', actBg: '#eff6ff', actBorder: '#93c5fd' },
                    { key: 'RESULTS_HISTORY', icon: '🗂', label: 'Results History', grad: 'linear-gradient(135deg, #10b981, #047857)', actBg: '#ecfdf5', actBorder: '#6ee7b7' },
                    { key: 'CHAMPIONS', icon: '🏅', label: 'Champions', grad: 'linear-gradient(135deg, #7c3aed, #4c1d95)', actBg: '#f5f3ff', actBorder: '#c4b5fd' },
                  ].filter(tab => {
                    if (loginRole === 'VIEW') {
                      return visibilityControls['results_' + tab.key];
                    }
                    return true;
                  }).map(tab => {
                    const isActive = resultsSubTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setResultsSubTab(tab.key)}
                        style={{
                          border: `2px solid ${isActive ? tab.actBorder : '#e2e8f0'}`,
                          borderRadius: '14px',
                          padding: '14px 10px',
                          cursor: 'pointer',
                          background: isActive ? tab.actBg : '#f8fafc',
                          textAlign: 'center',
                          transition: 'all 0.22s ease',
                          boxShadow: isActive ? `0 4px 18px rgba(0,0,0,0.10)` : '0 1px 4px rgba(0,0,0,0.04)',
                          transform: isActive ? 'translateY(-2px)' : 'none',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {isActive && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: tab.grad, borderRadius: '14px 14px 0 0' }} />
                        )}
                        <div style={{ fontSize: '28px', marginBottom: '4px', filter: isActive ? 'none' : 'grayscale(0.3)' }}>{tab.icon}</div>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: isActive ? '#1e293b' : '#475569', lineHeight: 1.3, marginBottom: '2px' }}>{tab.label}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="settings-content" style={{ marginTop: '0' }}>

                  {/* ── Section 1: Program Winners Viewer ── */}
                  {resultsSubTab === 'PROGRAM_WINNERS' && (
                    loginRole === 'VIEW' && !visibilityControls.results_PROGRAM_WINNERS ? (
                      <div className="card animate-tab" style={{ textAlign: 'center', padding: '45px 20px', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #fecaca', boxShadow: '0 4px 20px rgba(239,68,68,0.08)' }}>
                        <div style={{ fontSize: '56px', marginBottom: '14px' }}>🔒</div>
                        <h3 style={{ color: '#991b1b', marginBottom: '8px', fontSize: '20px', fontWeight: '800' }}>
                          {lang === 'EN' ? 'Program Winners Hidden' : 'വിജയികളുടെ പട്ടിക മറച്ചിരിക്കുന്നു'}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '14.5px', maxWidth: '480px', margin: '0 auto 16px' }}>
                          {lang === 'EN'
                            ? 'Program winners section has been hidden by the administrator.'
                            : 'ഓരോ പ്രോഗ്രാമിന്റെയും വിജയികളുടെ പട്ടിക അഡ്മിനിസ്ട്രേറ്റർ താത്കാലികമായി മറച്ചു വെച്ചിരിക്കുകയാണ്.'}
                        </p>
                        <div style={{ display: 'inline-block', padding: '8px 22px', background: '#fee2e2', color: '#991b1b', borderRadius: '24px', fontSize: '13px', fontWeight: '800', border: '1px solid #fca5a5' }}>
                          🚫 {lang === 'EN' ? 'Section Disabled (Hidden Mode)' : 'വിഭാഗം ഓഫാണ് (ഹൈഡ് ആണ്)'}
                        </div>
                      </div>
                    ) : (
                    <div style={{ marginBottom: '20px' }}>

                      {/* Filter Row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                        {/* Category Filter */}
                        <div style={{ flex: '1 1 200px' }}>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '4px' }}>Category</label>
                          <select className="settings-input" value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setFilterProg(''); }}>
                            <option value="">-- Select --</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            <option value="GENERAL">🌟 GENERAL</option>
                          </select>
                        </div>

                        {/* Program Filter */}
                        <div style={{ flex: '1 1 200px' }}>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '4px' }}>Program</label>
                          <select className="settings-input" value={filterProg} onChange={(e) => setFilterProg(e.target.value)} disabled={!filterCat}>
                            <option value="">-- Select --</option>
                            {programs.filter(p => {
                              const catMatch = filterCat === 'GENERAL' ? isGeneralProg(p) : String(p.catid || p.catId || '') === String(filterCat);
                              if (!catMatch) return false;
                              if (filterGender === 'ALL') return true;
                              const pType = (p.type || '').toUpperCase();
                              if (filterGender === 'BOY') return pType.includes('BOY') || (!pType.includes('BOY') && !pType.includes('GIRL'));
                              if (filterGender === 'GIRL') return pType.includes('GIRL') || (!pType.includes('BOY') && !pType.includes('GIRL'));
                              return true;
                            }).map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                          </select>
                        </div>

                        {/* Gender Filter */}
                        <div style={{ flex: '1 1 150px' }}>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', display: 'block', marginBottom: '4px' }}>Gender</label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {['ALL', 'BOY', 'GIRL'].map(g => (
                              <button key={g} type="button" onClick={() => {
                                setFilterGender(g);
                                // Reset program selection if it doesn't match new gender
                                if (g !== 'ALL' && filterProg) {
                                  const selProg = programs.find(p => String(p.id) === String(filterProg));
                                  if (selProg) {
                                    const pType = (selProg.type || '').toUpperCase();
                                    const isBoyProg = pType.includes('BOY');
                                    const isGirlProg = pType.includes('GIRL');
                                    if ((g === 'BOY' && isGirlProg) || (g === 'GIRL' && isBoyProg)) {
                                      setFilterProg('');
                                    }
                                  }
                                }
                              }}
                                style={{
                                  flex: 1, padding: '7px 4px', borderRadius: '8px', border: '2px solid', fontWeight: '700', cursor: 'pointer', fontSize: '11px',
                                  background: filterGender === g ? (g === 'BOY' ? '#3b82f6' : g === 'GIRL' ? '#ec4899' : '#7c3aed') : '#f8fafc',
                                  color: filterGender === g ? 'white' : '#475569',
                                  borderColor: filterGender === g ? 'transparent' : '#e2e8f0'
                                }}>
                                {g === 'ALL' ? '👥 All' : g === 'BOY' ? '👦 Boys' : '👧 Girls'}
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
                          const rGender = (r.studentgender || r.studentGender || '').toUpperCase();
                          const matchGender = filterGender === 'ALL' || rGender === filterGender.toUpperCase();
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
                          const genderVal = result.studentgender || result.studentGender || '';
                          const catObj2 = categories.find(c => String(c.id) === String(filterCat));
                          return (
                            <div key={result.id} style={{
                              background: gradient,
                              borderRadius: '20px',
                              padding: '16px 20px',
                              color: 'white',
                              position: 'relative',
                              overflow: 'hidden',
                              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                              border: `2px solid ${borderColor}`,
                              animation: 'fadeInTab 0.5s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '15px'
                            }}>
                              <div style={{ flex: 1, zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '28px' }}>{medal}</span>
                                  <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9 }}>{result.place}</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '3px 8px', display: 'inline-block', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>#{regPart}</div>
                                <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '4px', lineHeight: 1.25, letterSpacing: '0.5px' }}>{namePart}</div>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}>Team: <span style={{ fontWeight: '800' }}>{result.teamname || result.teamName || '-'}</span></div>
                                <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px' }}>
                                  {genderVal.toUpperCase() === 'BOY' ? '👦 Boy' : '👧 Girl'}
                                </div>
                                {/* Poster Button */}
                                <button
                                  onClick={() => setPosterModal({ result, regPart, namePart, genderVal, progObj, catObj: catObj2 })}
                                  style={{
                                    marginTop: '10px',
                                    background: 'rgba(255,255,255,0.25)',
                                    border: '1px solid rgba(255,255,255,0.5)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    padding: '5px 12px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    backdropFilter: 'blur(4px)'
                                  }}
                                >
                                  🖼️ View Poster
                                </button>
                              </div>
                              {/* Photo frame */}
                              <div style={{ position: 'relative', zIndex: 1 }}>
                                {renderStudentPhoto(regPart, genderVal, '85px', '12px')}
                              </div>
                              {/* Background subtle watermark medal */}
                              <div style={{ position: 'absolute', bottom: '-20px', right: '-15px', fontSize: '100px', opacity: 0.08, pointerEvents: 'none' }}>{medal}</div>
                            </div>
                          );
                        };

                        return (
                          <div style={{ marginTop: '20px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                              <span style={{ background: 'linear-gradient(135deg, #1e1b4b, #3730a3)', color: 'white', padding: '8px 20px', borderRadius: '20px', fontWeight: '800', fontSize: '14px' }}>🏆 {progObj ? progObj.name : ''}</span>
                            </div>
                            {progResults.length === 0 ? (
                              <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: '20px' }}>No results for this program.</p>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                                {firstResults.map(r => renderWinnerCard(r, 'linear-gradient(135deg, #f59e0b, #d97706)', '🥇', '#fbbf24'))}
                                {secondResults.map(r => renderWinnerCard(r, 'linear-gradient(135deg, #94a3b8, #64748b)', '🥈', '#cbd5e1'))}
                                {thirdResults.map(r => renderWinnerCard(r, 'linear-gradient(135deg, #f97316, #c2410c)', '🥉', '#fb923c'))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )
                )}

                  {/* ── Section 2: Student Search by Register Number ── */}
                  {resultsSubTab === 'STUDENT_REPORT' && (
                    loginRole === 'VIEW' && !visibilityControls.results_STUDENT_REPORT ? (
                      <div className="card animate-tab" style={{ textAlign: 'center', padding: '45px 20px', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #fecaca', boxShadow: '0 4px 20px rgba(239,68,68,0.08)' }}>
                        <div style={{ fontSize: '56px', marginBottom: '14px' }}>🔒</div>
                        <h3 style={{ color: '#991b1b', marginBottom: '8px', fontSize: '20px', fontWeight: '800' }}>
                          {lang === 'EN' ? 'Student Report & Certificate Hidden' : 'വിദ്യാർത്ഥി റിപ്പോർട്ടും സർട്ടിഫിക്കറ്റും മറച്ചിരിക്കുന്നു'}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '14.5px', maxWidth: '480px', margin: '0 auto 16px' }}>
                          {lang === 'EN'
                            ? 'Student search and certificate section has been hidden by the administrator.'
                            : 'വിദ്യാർത്ഥി റിപ്പോർട്ടും സർട്ടിഫിക്കറ്റും അഡ്മിനിസ്ട്രേറ്റർ താത്കാലികമായി മറച്ചു വെച്ചിരിക്കുകയാണ്.'}
                        </p>
                        <div style={{ display: 'inline-block', padding: '8px 22px', background: '#fee2e2', color: '#991b1b', borderRadius: '24px', fontSize: '13px', fontWeight: '800', border: '1px solid #fca5a5' }}>
                          {lang === 'EN' ? '🔒 Admin Hidden' : '🔒 Admin Hide ചെയ്തു'}
                        </div>
                      </div>
                    ) : (() => {
                    const generateBulkCertificates = () => {
                      const winnerResults = resultsList.filter(r => {
                        const p = (r.place || '').toString().toLowerCase();
                        const isWinner = p === 'first' || p === '1' || p === 'second' || p === '2' || p === 'third' || p === '3';
                        if (!isWinner) return false;

                        const sName = r.studentname || r.studentName || '';
                        const dashIdx = sName.indexOf(' - ');
                        const regPart = dashIdx !== -1 ? sName.substring(0, dashIdx) : '';
                        const student = students.find(s => String(s.regno || s.regNo || '').toLowerCase() === String(regPart).toLowerCase());
                        const prog = programs.find(p => String(p.id) === String(r.progid));

                        // Category Filter
                        if (bulkCertCat !== 'ALL') {
                          if (bulkCertCat === 'GENERAL') {
                            if (!isGeneralResult(r)) return false;
                          } else {
                            const rCatId = String(r.catid || r.catId || (prog ? prog.catid || prog.catId : '') || (student ? student.catid || student.catId : ''));
                            const catObj = categories.find(c => String(c.id) === String(bulkCertCat));
                            const targetCatName = catObj ? catObj.name : '';

                            if (rCatId !== String(bulkCertCat) && (r.catname || r.catName) !== targetCatName) {
                              return false;
                            }
                          }
                        }

                        // Gender / Division Filter
                        if (bulkCertGender !== 'ALL') {
                          const genderVal = (r.studentgender || r.studentGender || (student ? student.gender : '') || (prog ? prog.type : '')).toUpperCase();
                          const progType = (r.progtype || r.progType || (prog ? prog.type : '')).toUpperCase();

                          if (bulkCertGender === 'BOY') {
                            if (!genderVal.includes('BOY') && !progType.includes('BOY')) return false;
                          } else if (bulkCertGender === 'GIRL') {
                            if (!genderVal.includes('GIRL') && !progType.includes('GIRL')) return false;
                          } else if (bulkCertGender === 'COMMON') {
                            if (!genderVal.includes('COMMON') && !progType.includes('COMMON')) return false;
                          }
                        }

                        return true;
                      });

                      if (winnerResults.length === 0) {
                        alert(
                          lang === 'EN'
                            ? 'No 1st, 2nd, or 3rd place winners found matching the selected Category and Gender filters.'
                            : 'സെലക്ട് ചെയ്ത കാറ്റഗറിയിലും ജെൻഡറിലും 1, 2, 3 സ്ഥാനങ്ങൾ ലഭിച്ച വിജയികളാരും ഇല്ല.'
                        );
                        return;
                      }

                      const logoUrl = window.location.origin + '/logo192.png';
                      const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                      const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                      const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';

                      const certificatesPagesHtml = winnerResults.map(result => {
                        const sName = result.studentname || result.studentName || '';
                        const dashIdx = sName.indexOf(' - ');
                        const regPart = dashIdx !== -1 ? sName.substring(0, dashIdx) : '';
                        const namePart = dashIdx !== -1 ? sName.substring(dashIdx + 3) : sName;

                        const student = students.find(s => String(s.regno || s.regNo || '').toLowerCase() === String(regPart).toLowerCase()) || {
                          name: namePart,
                          regno: regPart,
                          gender: (result.studentgender || result.studentGender || 'BOY').toUpperCase()
                        };

                        const sRegNo = student.regno || student.regNo || regPart;
                        const teamObj = teams.find(t => String(t.id) === String(student.teamid || student.teamId || '')) || teams.find(t => t.name === (result.teamname || result.teamName));
                        const catObj = categories.find(c => String(c.id) === String(student.catid || student.catId || '')) || categories.find(c => c.name === (result.catname || result.catName));

                        const placeRaw = (result.place || '').toString().toLowerCase();
                        const prizeText = placeRaw === 'first' || placeRaw === '1' ? 'First Prize' : placeRaw === 'second' || placeRaw === '2' ? 'Second Prize' : placeRaw === 'third' || placeRaw === '3' ? 'Third Prize' : (result.place ? result.place + ' Prize' : 'Prize');

                        const prog = programs.find(p => String(p.id) === String(result.progid));
                        const progName = result.progname || result.progName || (prog ? prog.name : '');
                        const catName = result.catname || result.catName || (catObj ? catObj.name : '');
                        const progAndCatText = `${progName}${catName && !progName.toLowerCase().includes(catName.toLowerCase()) ? ` (${catName})` : ''}`;

                        const madrasaNameText = madrasaName ? madrasaName.toUpperCase() : 'MADRASA NAME';
                        const madrasaPlaceText = madrasaPlace ? madrasaPlace.toUpperCase() : 'PLACE';
                        const eventNameText = eventName ? eventName : 'EVENT NAME';
                        const eventYearText = eventYear ? eventYear : '2026';
                        const eventAndYearText = `${eventNameText} ${eventYearText}`;

                        return `
<div class="certificate-wrapper">
  <!-- Right Green Geometric Banner with Arabic Calligraphy */}
  <div class="cert-right-banner">
        <svg width="380" height="740" viewBox="0 0 380 740" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="islamicPattern_${result.id || Math.random()}" width="70" height="70" patternUnits="userSpaceOnUse">
          <path d="M35 0 L70 35 L35 70 L0 35 Z" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.35"/>
          <path d="M0 0 L70 70 M70 0 L0 70" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.2"/>
          <circle cx="35" cy="35" r="14" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.25"/>
          <polygon points="35,12 42,27 58,27 44,37 50,53 35,43 20,53 26,37 12,27 28,27" stroke="#0d6e53" stroke-width="0.6" fill="none" opacity="0.25"/>
        </pattern>
        <linearGradient id="ferruleGrad_${result.id || Math.random()}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#94a3b8"/>
          <stop offset="50%" style="stop-color:#f1f5f9"/>
          <stop offset="100%" style="stop-color:#64748b"/>
        </linearGradient>
      </defs>
      
      <!-- Green Polygon Cut Path -->
      <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="#064e3b" />
      <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="url(#islamicPattern_${result.id || Math.random()})" opacity="0.8" />
      <path d="M120 0 L160 360 L270 510 L230 540 L290 740" stroke="#022c22" stroke-width="4" fill="none"/>

      <!-- WHITE MILAD FEST LOGO (TOP RIGHT) -->
      <g transform="translate(195, 40)">
        <path d="M 90 20 C 45 20 15 55 15 100 C 15 145 45 180 90 180 C 65 170 42 142 42 100 C 42 58 65 30 90 20 Z" fill="#ffffff"/>
        <path d="M 68 85 C 68 62 82 52 90 48 C 98 52 112 62 112 85 Z" fill="#ffffff"/>
        <path d="M 90 41 C 88 41 87 42 87 44 C 87 46 89 47 90 47 C 91 47 93 46 93 44 C 93 42 92 41 90 41 Z M 90 38 L 90 41" stroke="#ffffff" stroke-width="1.8" fill="none"/>
        <path d="M 52 95 L 52 75 L 56 68 L 60 75 L 60 95 Z" fill="#ffffff"/>
        <rect x="54" y="62" width="4" height="6" fill="#ffffff"/>
        <path d="M 120 95 L 120 75 L 124 68 L 128 75 L 128 95 Z" fill="#ffffff"/>
        <rect x="122" y="62" width="4" height="6" fill="#ffffff"/>
        <path d="M 50 95 L 130 95 L 130 120 L 50 120 Z" fill="#ffffff"/>
        <path d="M 83 120 L 83 104 C 83 100 97 100 97 104 L 97 120 Z" fill="#064e3b"/>
        <path d="M 62 120 L 62 108 C 62 105 73 105 73 108 L 73 120 Z" fill="#064e3b"/>
        <path d="M 107 120 L 107 108 C 107 105 118 105 118 108 L 118 120 Z" fill="#064e3b"/>
        <text x="90" y="156" text-anchor="middle" fill="#ffffff" font-family="'Inter', sans-serif" font-weight="900" font-size="18" letter-spacing="1.4">MILAD FEST</text>
      </g>

      <!-- ARTISTIC PAINT BRUSHES & WATERCOLOR SPLASH -->
      <g transform="translate(160, 290)">
        <g opacity="0.85">
          <path d="M 70 170 C 10 110, -20 210, 20 290 C 50 350, 130 390, 180 310 C 220 240, 150 140, 70 170 Z" fill="#0d6e53" opacity="0.35"/>
          <path d="M 90 130 C 30 70, 10 190, 60 250 C 110 310, 200 270, 170 170 C 150 110, 120 100, 90 130 Z" fill="#047857" opacity="0.45"/>
          <path d="M 30 210 C -30 170, -20 270, 40 330 C 100 380, 160 350, 130 270 C 100 210, 60 220, 30 210 Z" fill="#10b981" opacity="0.3"/>
          <circle cx="15" cy="130" r="3.5" fill="#6ee7b7"/>
          <circle cx="10" cy="155" r="2.5" fill="#34d399"/>
          <circle cx="30" cy="100" r="4.5" fill="#10b981"/>
          <circle cx="0" cy="200" r="3" fill="#059669"/>
          <circle cx="-15" cy="240" r="5" fill="#6ee7b7"/>
          <circle cx="-10" cy="275" r="3" fill="#34d399"/>
          <circle cx="20" cy="340" r="3.5" fill="#10b981"/>
          <circle cx="55" cy="370" r="4.5" fill="#059669"/>
          <circle cx="100" cy="400" r="3" fill="#6ee7b7"/>
          <circle cx="135" cy="380" r="3.5" fill="#34d399"/>
          <circle cx="170" cy="350" r="2.5" fill="#10b981"/>
          <circle cx="195" cy="300" r="4" fill="#059669"/>
          <circle cx="205" cy="250" r="3" fill="#6ee7b7"/>
        </g>

        <g transform="rotate(-10, 100, 250)">
          <!-- Brush 1: Flat Wash Brush (Left) -->
          <g transform="translate(20, 30) rotate(-10)">
            <path d="M 30 180 L 44 180 L 40 390 L 34 390 Z" fill="#143023" stroke="#064e3b" stroke-width="1"/>
            <rect x="27" y="130" width="18" height="50" rx="2" fill="url(#ferruleGrad_${result.id || Math.random()})"/>
            <line x1="27" y1="145" x2="45" y2="145" stroke="#475569" stroke-width="1"/>
            <line x1="27" y1="160" x2="45" y2="160" stroke="#475569" stroke-width="1"/>
            <path d="M 25 45 L 47 45 L 45 130 L 27 130 Z" fill="#064e3b"/>
            <path d="M 25 45 L 47 45 L 46 75 L 26 75 Z" fill="#047857"/>
            <path d="M 25 45 L 47 45 L 47 58 L 25 58 Z" fill="#34d399" opacity="0.85"/>
            <line x1="30" y1="48" x2="31" y2="128" stroke="#022c22" stroke-width="0.8" opacity="0.6"/>
            <line x1="36" y1="48" x2="36" y2="128" stroke="#6ee7b7" stroke-width="0.8" opacity="0.6"/>
            <line x1="42" y1="48" x2="41" y2="128" stroke="#022c22" stroke-width="0.8" opacity="0.6"/>
          </g>

          <!-- Brush 2: Medium Round Brush (Center) -->
          <g transform="translate(70, 10) rotate(4)">
            <path d="M 34 190 L 42 190 L 40 410 L 36 410 Z" fill="#0f291e" stroke="#064e3b" stroke-width="1"/>
            <path d="M 32 140 L 44 140 L 42 190 L 34 190 Z" fill="url(#ferruleGrad_${result.id || Math.random()})"/>
            <line x1="33" y1="155" x2="43" y2="155" stroke="#475569" stroke-width="1"/>
            <line x1="33" y1="170" x2="43" y2="170" stroke="#475569" stroke-width="1"/>
            <path d="M 38 35 C 30 65, 30 105, 32 140 L 44 140 C 46 105, 46 65, 38 35 Z" fill="#047857"/>
            <path d="M 38 35 C 33 55, 32 75, 33 95 L 43 95 C 44 75, 43 55, 38 35 Z" fill="#10b981"/>
            <path d="M 38 35 C 35 48, 34 60, 35 70 L 41 70 C 42 60, 41 48, 38 35 Z" fill="#6ee7b7"/>
          </g>

          <!-- Brush 3: Fine Detail Brush (Right) -->
          <g transform="translate(110, 50) rotate(14)">
            <path d="M 28 170 L 34 170 L 32 380 L 30 380 Z" fill="#0d241a" stroke="#064e3b" stroke-width="0.8"/>
            <rect x="27" y="130" width="8" height="40" rx="1" fill="url(#ferruleGrad_${result.id || Math.random()})"/>
            <line x1="27" y1="145" x2="35" y2="145" stroke="#475569" stroke-width="0.8"/>
            <path d="M 31 55 C 26 80, 26 105, 27 130 L 35 130 C 36 105, 36 80, 31 55 Z" fill="#047857"/>
            <path d="M 31 55 C 28 70, 27 85, 28 100 L 34 100 C 35 85, 34 70, 31 55 Z" fill="#34d399"/>
          </g>
        </g>
      </g>
    </svg>
  </div>

  <!-- Content Section */}
  <div class="cert-content">
    
    <!-- Top Header */}
    <div class="cert-header">
      <div class="cert-logo-section">
        <img src="${logoUrl}" class="cert-app-logo" style="width:75px; height:75px; object-fit:contain; border-radius:12px; box-shadow: 0 2px 8px rgba(6,78,59,0.15);" alt="Milad Fest Logo" />
        <div class="cert-org-details">
          <div class="cert-madrasa-name">${madrasaNameText}</div>
          <div class="cert-madrasa-place">${madrasaPlaceText}</div>
        </div>
      </div>

      <div class="cert-event-section">
        <div class="cert-event-name">${eventNameText}</div>
        <div class="cert-event-sub">Milad_fest ${eventYearText}</div>
      </div>
    </div>

    <!-- Main Title */}
    <div>
      <div class="cert-title-section">
        <div class="cert-main-title">Certificate</div>
        <div class="cert-sub-title">Of Excellence</div>
      </div>

      <div class="cert-pill-badge">
        This Certificate is proudly presented to
      </div>

      <div class="cert-student-name">
        ${student.name}
      </div>

      <div class="cert-description">
        in recognition of securing <strong class="cert-highlight">${prizeText}</strong> in the <strong class="cert-highlight">${progAndCatText}</strong> competition at the <strong>${eventAndYearText}</strong> , Your dedication have earned you this distinguished achievement.
      </div>
    </div>

    <!-- Signatures */}
    <div class="cert-signatures">
      <div class="cert-sign-col">
        <div class="cert-sign-name">${coordinatorConvener || ''}</div>
        <div class="cert-sign-line"></div>
        <div class="cert-sign-label">Convener / Coordinator</div>
      </div>
      <div class="cert-sign-col">
        <div class="cert-sign-name">${convenerSadar || ''}</div>
        <div class="cert-sign-line"></div>
        <div class="cert-sign-label">Sadar Muallim</div>
      </div>
    </div>

  </div>
</div>`;
                      }).join('');

                      const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bulk Certificates (${winnerResults.length} Winners)</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Amiri:wght@700&family=Aref+Ruqaa:wght@700&family=Scheherazade+New:wght@700&display=swap" rel="stylesheet">
<script>
  window.onload = function() {
    setTimeout(function() {
      window.print();
    }, 800);
  };
</script>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #e2e8f0; color: #0f172a; }

  @media print {
    .no-print { display: none !important; }
    html, body {
      width: 297mm;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .certificate-wrapper {
      width: 297mm !important;
      height: 210mm !important;
      max-width: 297mm !important;
      max-height: 210mm !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
  }

  @media screen {
    body { padding-top: 70px; padding-bottom: 40px; }
    .certificate-wrapper {
      width: 1000px;
      height: 705px;
      margin: 25px auto;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      border-radius: 6px;
    }
  }

  .certificate-wrapper {
    position: relative;
    background: #ffffff;
    overflow: hidden;
  }

  .cert-right-banner {
    position: absolute; top: 0; right: 0; width: 380px; height: 740px;
    pointer-events: none; z-index: 1;
  }

  .cert-content {
    position: relative; z-index: 2; padding: 45px 50px 45px 55px;
    height: 100%; width: 720px; display: flex; flex-direction: column;
    justify-content: space-between;
  }

  .cert-header { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; }
  .cert-logo-section { display: flex; align-items: center; gap: 16px; }
  .cert-app-logo { width: 75px; height: 75px; object-fit: contain; border-radius: 14px; box-shadow: 0 3px 10px rgba(6,78,59,0.18); }
  .cert-org-details { display: flex; flex-direction: column; }
  .cert-madrasa-name { font-size: 23px; font-weight: 900; color: #064e3b; text-transform: uppercase; letter-spacing: 0.6px; line-height: 1.15; }
  .cert-madrasa-place { font-size: 17px; font-weight: 800; color: #064e3b; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 3px; opacity: 0.95; }
  .cert-event-section { text-align: left; }
  .cert-event-name { font-size: 24px; font-weight: 900; color: #064e3b; text-transform: uppercase; letter-spacing: 0.6px; line-height: 1.15; }
  .cert-event-sub { font-size: 14px; font-weight: 700; color: #064e3b; letter-spacing: 0.6px; margin-top: 4px; opacity: 0.95; }

  .cert-title-section { margin-top: 15px; }
  .cert-main-title { font-size: 54px; font-weight: 900; color: #0f172a; letter-spacing: -1.5px; line-height: 1; font-family: 'Inter', sans-serif; }
  .cert-sub-title { font-size: 28px; font-weight: 600; color: #064e3b; line-height: 1.2; margin-top: 2px; font-family: 'Inter', sans-serif; }

  .cert-pill-badge {
    display: inline-block; background: #064e3b; color: #ffffff; font-size: 13.5px;
    font-weight: 600; padding: 7px 22px; border-radius: 20px; margin-top: 22px;
    letter-spacing: 0.2px; box-shadow: 0 4px 12px rgba(6,78,59,0.25);
  }

  .cert-student-name { font-size: 38px; font-weight: 800; color: #064e3b; margin-top: 14px; margin-bottom: 12px; font-family: 'Inter', sans-serif; }
  .cert-description { font-size: 13.5px; color: #334155; line-height: 1.65; max-width: 630px; font-weight: 400; }
  .cert-description strong { color: #0f172a; }
  .cert-description strong.cert-highlight { font-weight: 700; font-style: italic; }

  .cert-signatures { display: flex; gap: 70px; margin-top: 35px; align-items: flex-end; }
  .cert-sign-col { display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 170px; }
  .cert-sign-name { font-size: 13.5px; font-weight: 700; color: #0f172a; min-height: 22px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 3px; font-family: 'Inter', sans-serif; }
  .cert-sign-line { width: 100%; height: 1.5px; background-color: #000000; margin-bottom: 6px; }
  .cert-sign-label { font-size: 11.5px; font-weight: 700; color: #334155; letter-spacing: 0.3px; }
</style>
</head>
<body>
  <div class="no-print" style="position: fixed; top: 0; left: 0; right: 0; background: #064e3b; color: white; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; z-index: 99999; box-shadow: 0 4px 15px rgba(0,0,0,0.25);">
    <span style="font-weight: 800; font-size: 14px; font-family: sans-serif;">📜 Certificates Preview (${winnerResults.length} Certificates)</span>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="background: #fbbf24; color: #78350f; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">🖨️ Save as PDF / Print</button>
      <button onclick="window.close()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">✕ Close</button>
    </div>
  </div>

  ${certificatesPagesHtml}
</body>
</html>
`;

                      printHtml(html, `MiladFest_Bulk_Certificates_${winnerResults.length}`);
                    };

                    return (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: loginRole === 'ADMIN' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
                          gap: '16px',
                          marginTop: '10px',
                          marginBottom: '20px'
                        }}>
                          {/* Card 1: Single Student Register Number Search */}
                          <div style={{
                            background: 'white',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '16px',
                            padding: '20px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🔍</span>
                                <span>{lang === 'EN' ? 'Student Report & Single Certificate' : 'സ്റ്റുഡന്റ് റിപ്പോർട്ട് & സർട്ടിഫിക്കറ്റ്'}</span>
                              </div>
                              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px', lineHeight: '1.4' }}>
                                {lang === 'EN'
                                  ? 'Enter register number to view student performance report and print individual certificate.'
                                  : 'വിദ്യാർത്ഥിയുടെ ഫലങ്ങളും സർട്ടിഫിക്കറ്റും കാണാൻ താഴെ രജിസ്റ്റർ നമ്പർ നൽകുക.'
                                }
                              </p>
                            </div>
                            <input
                              type="text"
                              className="settings-input-v2"
                              placeholder={lang === 'EN' ? 'Enter Register Number (e.g. 101)...' : 'രജിസ്റ്റർ നമ്പർ നൽകുക (e.g. 101)...'}
                              value={searchRegNo}
                              onChange={(e) => setSearchRegNo(e.target.value)}
                              style={{ width: '100%', fontSize: '14px', padding: '10px 14px' }}
                            />
                          </div>

                          {/* Card 2 (ADMIN MODE ONLY): Bulk Certificate Generation & PDF Export */}
                          {loginRole === 'ADMIN' && (
                            <div style={{
                              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                              border: '1.5px solid #bbf7d0',
                              borderRadius: '16px',
                              padding: '20px',
                              boxShadow: '0 4px 15px rgba(22,163,74,0.06)'
                            }}>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>📜</span>
                                <span>{lang === 'EN' ? 'Bulk Certificate (PDF / Print)' : 'സർട്ടിഫിക്കറ്റ് (Bulk PDF / പ്രിന്റ്)'}</span>
                              </div>
                              <p style={{ fontSize: '12px', color: '#15803d', marginBottom: '14px', lineHeight: '1.4' }}>
                                {lang === 'EN'
                                  ? 'Filter 1st, 2nd & 3rd place winners by category and gender division to export all certificates into PDF.'
                                  : 'കാറ്റഗറിയും ജെൻഡറും സെലക്ട് ചെയ്ത് 1, 2, 3 വിജയികളുടെ എല്ലാ സർട്ടിഫിക്കറ്റുകളും ഒന്നിച്ച് PDF ആക്കുക.'
                                }
                              </p>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                                {/* Category Dropdown */}
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '4px' }}>
                                    {lang === 'EN' ? 'Category' : 'കാറ്റഗറി'}
                                  </label>
                                  <select
                                    className="settings-input-v2"
                                    value={bulkCertCat}
                                    onChange={(e) => setBulkCertCat(e.target.value)}
                                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: 'white' }}
                                  >
                                    <option value="ALL">{lang === 'EN' ? 'All Categories (എല്ലാം)' : 'All Categories (എല്ലാ കാറ്റഗറിയും)'}</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    <option value="GENERAL">🌟 GENERAL (പൊതുവിഭാഗം)</option>
                                  </select>
                                </div>

                                {/* Gender / Division Dropdown */}
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '4px' }}>
                                    {lang === 'EN' ? 'Gender / Division' : 'വിഭാഗം (Division)'}
                                  </label>
                                  <select
                                    className="settings-input-v2"
                                    value={bulkCertGender}
                                    onChange={(e) => setBulkCertGender(e.target.value)}
                                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: 'white' }}
                                  >
                                    <option value="ALL">{lang === 'EN' ? 'All (എല്ലാം)' : 'All (എല്ലാം)'}</option>
                                    <option value="BOY">👦 {lang === 'EN' ? 'Boys' : 'ബോയ്സ്'}</option>
                                    <option value="GIRL">👧 {lang === 'EN' ? 'Girls' : 'ഗേൾസ്'}</option>
                                    <option value="COMMON">👥 {lang === 'EN' ? 'Common' : 'കോമൺ'}</option>
                                  </select>
                                </div>
                              </div>

                              {/* PDF / Print Button */}
                              <button
                                onClick={generateBulkCertificates}
                                style={{
                                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '11px 16px',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  fontWeight: '800',
                                  fontSize: '13px',
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                🖨️ {lang === 'EN' ? 'PDF / Print All Certificates' : 'PDF / പ്രിന്റ് ഓൾ സർട്ടിഫിക്കറ്റുകൾ'}
                              </button>
                            </div>
                          )}
                        </div>

                      {searchRegNo.trim() && (() => {
                        const matchedStudent = students.find(s => String(s.regno || s.regNo || '').toLowerCase() === searchRegNo.trim().toLowerCase());
                        if (!matchedStudent) return <p style={{ color: '#ef4444', marginTop: '15px', fontWeight: '600' }}>No student found with this register number.</p>;

                        const sRegNo = matchedStudent.regno || matchedStudent.regNo || '';
                        const teamObj = teams.find(t => String(t.id) === String(matchedStudent.teamid || matchedStudent.teamId || ''));
                        const catObj = categories.find(c => String(c.id) === String(matchedStudent.catid || matchedStudent.catId || ''));
                        const sResults = resultsList.filter(r => {
                          const sName = r.studentname || r.studentName || '';
                          return sName.startsWith(sRegNo + ' - ');
                        });

                        const printReport = () => {
                          const rows = sResults.map(r => {
                            let placeLabel = r.place || '-';
                            let gradeLabel = (r.grade === '-' || r.grade === 'No' || !r.grade) ? '-' : r.grade;
                            return `<tr><td>${r.progname || r.progName}</td><td>${r.catname || r.catName}</td><td>${placeLabel}</td><td>${gradeLabel}</td><td>${r.points} Pts</td></tr>`;
                          }).join('');
                          const html = `
                    <html><head><title>${matchedStudent.name} - Report</title>
                    <style>body{font-family:Arial,sans-serif;padding:30px;background:#fff} h1{color:#1e1b4b} table{width:100%;border-collapse:collapse;margin-top:20px} th{background:#1e1b4b;color:white;padding:10px} td{padding:10px;border:1px solid #e2e8f0;text-align:center} .header{background:linear-gradient(135deg,#1e1b4b,#3730a3);color:white;padding:30px;border-radius:12px;margin-bottom:20px} .badge{display:inline-block;background:#f59e0b;color:#78350f;padding:4px 12px;border-radius:20px;font-weight:700;font-size:14px;margin-top:8px}</style></head>
                    <body>
                    <div class='header'>
                    <h1>🏆 ${matchedStudent.name}</h1>
                    <div class='badge'>Reg No: ${sRegNo}</div>
                    <p style='margin-top:10px;opacity:0.85'>Team: ${teamObj ? teamObj.name : '' || '-'} | Category: ${catObj ? catObj.name : '' || '-'} | ${matchedStudent.gender === 'BOY' ? 'Boy 👦' : 'Girl 👧'}</p>
                    </div>
                    <table><thead><tr><th>Program</th><th>Category</th><th>Place</th><th>Grade</th><th>Points</th></tr></thead><tbody>${rows}</tbody></table>
                    <p style='margin-top:20px;color:#64748b;font-size:13px'>Total Points: <b>${sResults.reduce((s, r) => s + r.points, 0)}</b></p>
                    </body></html>`;
                          printHtml(html);
                        };

                        const generateCertificate = (result) => {
                          setActiveCertificate({
                            student: matchedStudent,
                            result: result
                          });
                        };

                        return (
                          <div style={{ marginTop: '20px' }}>
                            {/* Student Info Card */}
                            <div style={{
                              background: 'linear-gradient(135deg, #1e1b4b, #3730a3)',
                              borderRadius: '24px',
                              padding: '24px',
                              color: 'white',
                              position: 'relative',
                              overflow: 'hidden',
                              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: '20px',
                              flexWrap: 'wrap'
                            }}>
                              {/* Profile Photo */}
                              <div style={{ position: 'relative', zIndex: 1 }}>
                                {renderStudentPhoto(sRegNo, matchedStudent.gender, '100px', '16px')}
                              </div>
                              <div style={{ flex: 1, minWidth: '200px', zIndex: 1 }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '2px' }}>Student Profile & Report</div>
                                <div style={{ fontSize: '26px', fontWeight: '900', marginTop: '6px', letterSpacing: '0.5px' }}>{matchedStudent.name}</div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                  <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Reg: {sRegNo}</span>
                                  <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Team: {teamObj ? teamObj.name : '' || '-'}</span>
                                  <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Category: {catObj ? catObj.name : '' || '-'}</span>
                                  <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{matchedStudent.gender === 'BOY' ? '👦 Boy' : '👧 Girl'}</span>
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: '#fbbf24', marginTop: '14px' }}>
                                  {sResults.reduce((s, r) => s + r.points, 0)}{' '}
                                  <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '600' }}>Total Points</span>
                                </div>
                              </div>
                              <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '100px', opacity: 0.05, pointerEvents: 'none' }}>🏆</div>
                            </div>

                            {/* Results */}
                            {sResults.length === 0 ? (
                              <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: '20px' }}>No results.</p>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '15px' }}>
                                {sResults.map((r, idx) => {
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
                                })}
                              </div>
                            )}

                            {/* Download / Print Report Button */}
                            <button onClick={printReport} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#78350f', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>
                              📥 Download / Print Report
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()
                  )}

                  {/* ── Section 3: Results History Table ── */}
                  {resultsSubTab === 'RESULTS_HISTORY' && (
                    loginRole === 'VIEW' && !visibilityControls.results_RESULTS_HISTORY ? (
                      <div className="card animate-tab" style={{ textAlign: 'center', padding: '45px 20px', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #fecaca', boxShadow: '0 4px 20px rgba(239,68,68,0.08)' }}>
                        <div style={{ fontSize: '56px', marginBottom: '14px' }}>🔒</div>
                        <h3 style={{ color: '#991b1b', marginBottom: '8px', fontSize: '20px', fontWeight: '800' }}>
                          {lang === 'EN' ? 'Results History Hidden' : 'ഫലങ്ങളുടെ ഹിസ്റ്ററി മറച്ചിരിക്കുന്നു'}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '14.5px', maxWidth: '480px', margin: '0 auto 16px' }}>
                          {lang === 'EN'
                            ? 'Results history has been hidden by the administrator.'
                            : 'ഫലങ്ങളുടെ ഹിസ്റ്ററി അഡ്മിനിസ്ട്രേറ്റർ താത്കാലികമായി മറച്ചു വെച്ചിരിക്കുകയാണ്.'}
                        </p>
                        <div style={{ display: 'inline-block', padding: '8px 22px', background: '#fee2e2', color: '#991b1b', borderRadius: '24px', fontSize: '13px', fontWeight: '800', border: '1px solid #fca5a5' }}>
                          {lang === 'EN' ? '🔒 Admin Hidden' : '🔒 Admin Hide ചെയ്തു'}
                        </div>
                      </div>
                    ) : (() => {
                    // 🏆 Group & Sort Results History:
                    // 1. Newest program results entered at the top (sorted by latest entry ID)
                    // 2. Grouped strictly by Category within each Program (Senior all 3 places together, then Junior all 3 places together)
                    // 3. Sorted by Position within each Category (First -> Second -> Third -> No Place)
                    const placeRank = (placeStr) => {
                      if (!placeStr) return 4;
                      const str = String(placeStr).trim().toLowerCase();
                      if (str === 'first' || str === '1' || str === '1st') return 1;
                      if (str === 'second' || str === '2' || str === '2nd') return 2;
                      if (str === 'third' || str === '3' || str === '3rd') return 3;
                      return 4;
                    };

                    const groupMap = new Map();
                    resultsList.forEach(r => {
                      const pKey = String(r.progid || r.progId || r.progname || '').trim();
                      const cKey = String(r.catid || r.catId || r.catname || '').trim();
                      const groupKey = `${pKey}___${cKey}`;
                      if (!groupMap.has(groupKey)) {
                        groupMap.set(groupKey, {
                          latestId: parseInt(r.id, 10) || 0,
                          progId: pKey,
                          catId: cKey,
                          rows: []
                        });
                      }
                      const group = groupMap.get(groupKey);
                      const rId = parseInt(r.id, 10) || 0;
                      if (rId > group.latestId) group.latestId = rId;
                      group.rows.push(r);
                    });

                    const sortedGroups = Array.from(groupMap.values()).sort((a, b) => b.latestId - a.latestId);

                    const sortedResultsHistoryList = [];
                    sortedGroups.forEach(group => {
                      group.rows.sort((a, b) => {
                        const rankA = placeRank(a.place);
                        const rankB = placeRank(b.place);
                        if (rankA !== rankB) return rankA - rankB;

                        const regA = parseInt((a.studentname || '').split(' - ')[0] || '0', 10) || 0;
                        const regB = parseInt((b.studentname || '').split(' - ')[0] || '0', 10) || 0;
                        return regA - regB;
                      });
                      sortedResultsHistoryList.push(...group.rows);
                    });

                    const printResultsHistory = () => {
                      const rows = sortedResultsHistoryList.map(r => {
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
                        return `<tr>
                      <td>${r.progname || r.progName}</td>
                      <td>${String(r.progtype || r.progType).includes('GROUP') ? 'GROUP' : 'SINGLE'}</td>
                      <td>${r.catname || r.catName}</td>
                      <td>${photoHtml}</td>
                      <td>${regPart}</td>
                      <td>${namePart}</td>
                      <td>${(r.studentgender || r.studentGender) === 'BOY' ? 'Boy' : 'Girl'}</td>
                      <td>${r.teamname || r.teamName}</td>
                      <td>${placeLabel}</td>
                      <td>${gradeLabel}</td>
                      <td>${r.points}</td>
                    </tr>`;
                      }).join('');

                      const html = `
                    <html><head><title>Results History</title>
                    <style>body{font-family:Arial,sans-serif;padding:20px;background:#fff} h1{color:#1e1b4b;text-align:center;} table{width:100%;border-collapse:collapse;margin-top:20px} th{background:#1e1b4b;color:white;padding:10px} td{padding:8px;border:1px solid #e2e8f0;text-align:center;font-size:14px;}</style></head>
                    <body>
                    <h1>🏆 Results History</h1>
                    <table><thead><tr><th>Program</th><th>Type</th><th>Category</th><th>Photo</th><th>Reg No</th><th>Student</th><th>Gender</th><th>Team</th><th>Place</th><th>Grade</th><th>Points</th></tr></thead><tbody>${rows}</tbody></table>
                    </body></html>
                  `;
                      printHtml(html);
                    };

                    return (
                      <div>
                        <div className="table-responsive-wrapper" style={{ marginTop: '15px' }}>
                          <table>
                            <thead>
                              <tr>
                                <th>Program</th><th>Type</th><th>Category</th><th>Photo</th><th>Register Number</th><th>Student</th><th>Gender</th><th>Team</th><th>Place</th><th>Grade</th><th>Points</th>{loginRole === 'ADMIN' && <th>Delete</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {sortedResultsHistoryList.length === 0 ? <tr><td colSpan="12">No results announced yet.</td></tr> :
                                sortedResultsHistoryList.map(r => {
                                  const sName = r.studentname || r.studentName || '';
                                  const dashIdx = sName.indexOf(' - ');
                                  const regPart = dashIdx !== -1 ? sName.substring(0, dashIdx) : '';
                                  const namePart = dashIdx !== -1 ? sName.substring(dashIdx + 3) : sName;
                                  const placeLabel = r.place === 'First' || r.place === '1' ? 'First' : r.place === 'Second' || r.place === '2' ? 'Second' : r.place === 'Third' || r.place === '3' ? 'Third' : r.place || '-';
                                  const gradeLabel = (r.grade === '-' || r.grade === 'No' || !r.grade) ? '-' : r.grade;
                                  return (
                                    <tr key={r.id}>
                                      <td>{r.progname || r.progName}</td>
                                      <td><span style={{ background: String(r.progtype || r.progType).includes('GROUP') ? '#ef4444' : '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{String(r.progtype || r.progType).includes('GROUP') ? 'GROUP' : 'SINGLE'}</span></td>
                                      <td>{r.catname || r.catName}</td>
                                      <td>{renderTablePhoto(regPart, r.studentgender || r.studentGender)}</td>
                                      <td><b style={{ color: '#1e40af' }}>{regPart}</b></td>
                                      <td>{namePart}</td>
                                      <td>{(r.studentgender || r.studentGender) === 'BOY' ? 'Boy 👦' : 'Girl 👧'}</td>
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
                        <button onClick={printResultsHistory} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>
                          📄 Download PDF / Print
                        </button>
                      </div>
                    );
                  })()
                  )}

                  {/* ── Section 4: Champion Section ── */}
                  {resultsSubTab === 'CHAMPIONS' && (
                    loginRole === 'VIEW' && !visibilityControls.results_CHAMPIONS ? (
                      <div className="card animate-tab" style={{ textAlign: 'center', padding: '45px 20px', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #fecaca', boxShadow: '0 4px 20px rgba(239,68,68,0.08)' }}>
                        <div style={{ fontSize: '56px', marginBottom: '14px' }}>🔒</div>
                        <h3 style={{ color: '#991b1b', marginBottom: '8px', fontSize: '20px', fontWeight: '800' }}>
                          {lang === 'EN' ? 'Champions Hidden' : 'ചാമ്പ്യന്മാർ മറച്ചിരിക്കുന്നു'}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '14.5px', maxWidth: '480px', margin: '0 auto 16px' }}>
                          {lang === 'EN'
                            ? 'Individual champions section has been hidden by the administrator.'
                            : 'വ്യക്തിഗത ചാമ്പ്യന്മാരുടെ വിഭാഗം അഡ്മിനിസ്ട്രേറ്റർ താത്കാലികമായി മറച്ചു വെച്ചിരിക്കുകയാണ്.'}
                        </p>
                        <div style={{ display: 'inline-block', padding: '8px 22px', background: '#fee2e2', color: '#991b1b', borderRadius: '24px', fontSize: '13px', fontWeight: '800', border: '1px solid #fca5a5' }}>
                          {lang === 'EN' ? '🔒 Admin Hidden' : '🔒 Admin Hide ചെയ്തു'}
                        </div>
                      </div>
                    ) : (
                    <div style={{ marginTop: '10px' }}>

                      {/* Category Selector */}
                      <div style={{ marginTop: '15px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '6px' }}>Select Category</label>
                        <select className="settings-input" value={champCat} onChange={(e) => { setChampCat(e.target.value); setChampGender('BOYS'); }}>
                          <option value="">-- Select Category --</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          <option value="GENERAL">🌟 GENERAL</option>
                        </select>
                      </div>

                      {/* Gender Tabs */}
                      {champCat && (
                        <div style={{ marginTop: '15px' }}>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', display: 'block', marginBottom: '6px' }}>Gender</label>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['BOYS', 'GIRLS', 'GENERAL'].map(g => (
                              <button key={g} type="button"
                                onClick={() => { setChampGender(g); }}
                                style={{
                                  padding: '8px 18px', borderRadius: '10px', border: '2px solid',
                                  fontWeight: '700', cursor: 'pointer', fontSize: '13px',
                                  background: champGender === g
                                    ? (g === 'BOYS' ? '#3b82f6' : g === 'GIRLS' ? '#ec4899' : '#10b981')
                                    : '#f8fafc',
                                  color: champGender === g ? 'white' : '#475569',
                                  borderColor: champGender === g ? 'transparent' : '#e2e8f0',
                                  transition: 'all 0.2s'
                                }}>
                                {g === 'BOYS' ? '👦 Boys' : g === 'GIRLS' ? '👧 Girls' : '👥 General'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Champion Rankings by Total Points across all programs */}
                      {champCat && (() => {
                        const selectedCatObj = categories.find(c => String(c.id) === String(champCat));
                        const catName = (selectedCatObj || {}).name || '';

                        // Filter results for this category and exclude group events
                        const isChampGeneral = champCat === 'GENERAL';

                        const catResults = resultsList.filter(r => {
                          const rCatName = r.catname || r.catName || '';
                          const matchCat = isChampGeneral
                            ? isGeneralResult(r)
                            : rCatName === catName;
                          return matchCat && !(r.progtype || '').includes('GROUP');
                        });

                        // Filter by gender division
                        const genderFilteredResults = catResults.filter(r => {
                          const gender = (r.studentgender || r.studentGender || '').toUpperCase();
                          if (champGender === 'BOYS') return gender === 'BOY';
                          if (champGender === 'GIRLS') return gender === 'GIRL';
                          return true; // GENERAL: include everyone
                        });

                        if (genderFilteredResults.length === 0) return (
                          <p style={{ marginTop: '20px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                            No results in this Category / Division.
                          </p>
                        );

                        // Aggregate total points per student
                        const studentMap = {};
                        genderFilteredResults.forEach(r => {
                          const sName = r.studentname || r.studentName || '';
                          if (!studentMap[sName]) {
                            const dashIdx = sName.indexOf(' - ');
                            studentMap[sName] = {
                              key: sName,
                              regPart: dashIdx !== -1 ? sName.substring(0, dashIdx) : '',
                              namePart: dashIdx !== -1 ? sName.substring(dashIdx + 3) : sName,
                              teamname: r.teamname || r.teamName || '-',
                              studentgender: r.studentgender || r.studentGender || '',
                              totalPoints: 0
                            };
                          }
                          studentMap[sName].totalPoints += r.points;
                        });

                        // Sort descending by total points
                        const sortedStudents = Object.values(studentMap).sort((a, b) => b.totalPoints - a.totalPoints);

                        // Assign ranks with tie handling
                        let currentRank = 1;
                        const rankedStudents = sortedStudents.map((s, i) => {
                          if (i > 0 && s.totalPoints < sortedStudents[i - 1].totalPoints) currentRank = i + 1;
                          return { ...s, rank: currentRank };
                        });

                        const displayStudents = rankedStudents.filter(s => s.rank <= 3);

                        const rankConfig = {
                          1: { medal: '🥇', gradient: 'linear-gradient(135deg, #f59e0b, #b45309)', border: '#fbbf24', label: 'FIRST PLACE' },
                          2: { medal: '🥈', gradient: 'linear-gradient(135deg, #94a3b8, #475569)', border: '#cbd5e1', label: 'SECOND PLACE' },
                          3: { medal: '🥉', gradient: 'linear-gradient(135deg, #f97316, #b45309)', border: '#fb923c', label: 'THIRD PLACE' }
                        };

                        return (
                          <div style={{ marginTop: '22px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                              <span style={{ background: 'linear-gradient(135deg, #1e1b4b, #3730a3)', color: 'white', padding: '8px 22px', borderRadius: '20px', fontWeight: '800', fontSize: '14px' }}>
                                🏆 {catName} — {champGender === 'BOYS' ? '👦 Boys' : champGender === 'GIRLS' ? '👧 Girls' : '👥 General'}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                              {displayStudents.map(student => {
                                const cfg = rankConfig[student.rank] || rankConfig[3];
                                const sameRankCount = rankedStudents.filter(s => s.rank === student.rank).length;
                                const rankLabel = sameRankCount > 1 ? `${cfg.label} (TIE)` : cfg.label;

                                return (
                                  <div key={student.key} style={{
                                    background: cfg.gradient,
                                    borderRadius: '24px',
                                    padding: '20px',
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                                    border: `3px solid ${cfg.border}`,
                                    animation: 'fadeInTab 0.5s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '15px'
                                  }}>
                                    <div style={{ flex: 1, zIndex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '32px' }}>{cfg.medal}</span>
                                        <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9 }}>{rankLabel}</span>
                                      </div>
                                      <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '3px 8px', display: 'inline-block', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>#{student.regPart}</div>
                                      <div style={{ fontSize: '20px', fontWeight: '900', marginBottom: '4px', lineHeight: 1.25, letterSpacing: '0.5px' }}>{student.namePart}</div>
                                      <div style={{ fontSize: '12px', opacity: 0.9 }}>Team: <span style={{ fontWeight: '800' }}>{student.teamname}</span></div>
                                      <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px' }}>
                                        {(student.studentgender || '').toUpperCase() === 'BOY' ? '👦 Boy' : '👧 Girl'}
                                      </div>
                                      <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.25)', borderRadius: '8px', padding: '6px 12px', display: 'inline-block', fontWeight: '900', fontSize: '16px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                        ⭐ {student.totalPoints} Pts
                                      </div>
                                    </div>
                                    {/* Photo frame */}
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                      {renderStudentPhoto(student.regPart, student.studentgender, '95px', '14px')}
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '-20px', right: '-15px', fontSize: '110px', opacity: 0.07, pointerEvents: 'none' }}>{cfg.medal}</div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* ── Complete Registered Students Mark List Section (Collapsible) ── */}
                            {(() => {
                              // Filter all registered students in this category & gender division
                              const categoryStudents = students.filter(s => {
                                if (!s) return false;
                                if (isChampGeneral) {
                                  const sCatId = String(s.catid || s.catId || '');
                                  if (generalCatIds.length > 0 && !generalCatIds.map(String).includes(sCatId)) return false;
                                } else {
                                  if (String(s.catid || s.catId || '') !== String(champCat)) return false;
                                }
                                const sGender = String(s.gender || '').toUpperCase();
                                if (champGender === 'BOYS' && sGender !== 'BOY') return false;
                                if (champGender === 'GIRLS' && sGender !== 'GIRL') return false;
                                return true;
                              });

                              // Map individual total points for every student
                              const allStudentMarks = categoryStudents.map(s => {
                                const sRegNo = String(s.regno || s.regNo || '').trim();
                                const sNameStr = String(s.name || '').trim().toLowerCase();
                                const sIdStr = String(s.id || '').trim();
                                const sTeamId = String(s.teamid || s.teamId || '').trim();
                                const teamObj = teams.find(t => String(t.id) === sTeamId);
                                const teamName = teamObj ? teamObj.name : '-';

                                const totalPts = resultsList.filter(r => {
                                  if ((r.progtype || '').includes('GROUP')) return false; // exclude group events from individual total
                                  const rStudentName = String(r.studentname || r.student_name || '').trim();
                                  const rStudentId = String(r.student_id || r.studentid || '').trim();
                                  if (sIdStr && rStudentId === sIdStr) return true;
                                  if (sRegNo && (rStudentName.startsWith(sRegNo) || rStudentName.includes(sRegNo))) return true;
                                  if (sNameStr && rStudentName.toLowerCase().includes(sNameStr)) return true;
                                  return false;
                                }).reduce((sum, r) => sum + (Number(r.points) || 0), 0);

                                return {
                                  id: s.id,
                                  regNo: sRegNo,
                                  name: s.name,
                                  gender: s.gender,
                                  teamName: teamName,
                                  totalPoints: totalPts
                                };
                              });

                              // Sort descending by points; equal points sorted by regNo ascending
                              allStudentMarks.sort((a, b) => {
                                if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
                                return (parseInt(a.regNo, 10) || 0) - (parseInt(b.regNo, 10) || 0);
                              });

                              // Assign rank strings: >0 points get 1, 2, 3...; 0 points get "0"
                              let rTracker = 1;
                              const finalRankedAllStudents = allStudentMarks.map((st, idx) => {
                                if (st.totalPoints === 0) {
                                  return { ...st, rankStr: '0' };
                                } else {
                                  if (idx > 0 && st.totalPoints < allStudentMarks[idx - 1].totalPoints) {
                                    rTracker = idx + 1;
                                  }
                                  return { ...st, rankStr: String(rTracker) };
                                }
                              });

                              // PDF Generator for complete category mark list
                              const generateCategoryStudentMarksPDF = () => {
                                const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                                const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                                const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';
                                const divTitle = champGender === 'BOYS' ? 'Boys' : champGender === 'GIRLS' ? 'Girls' : 'General';
                                const reportTitle = `Category Individual Student Marks & Rankings`;

                                const rowsHtml = finalRankedAllStudents.map((st) => {
                                  const isZero = st.totalPoints === 0;
                                  return `
                                    <tr style="${isZero ? 'color:#64748b;background:#f8fafc;' : ''}">
                                      <td style="text-align:center;font-weight:bold;">${st.rankStr === '0' ? '0' : '#' + st.rankStr}</td>
                                      <td style="text-align:center;font-weight:bold;">#${st.regNo}</td>
                                      <td><strong>${st.name}</strong> (${st.gender === 'BOY' ? 'Boy' : 'Girl'})</td>
                                      <td>${st.teamName}</td>
                                      <td style="text-align:center;font-weight:bold;color:${isZero ? '#94a3b8' : '#059669'};">${st.totalPoints} Pts</td>
                                    </tr>
                                  `;
                                }).join('');

                                const printWin = window.open('', '_blank');
                                printWin.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>${reportTitle} - ${madrasaName}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; padding: 10px; }
  .header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 22px; color: #1e3a5f; margin-bottom: 4px; }
  .header p { font-size: 13px; color: #64748b; }
  .title-bar { background: #f1f5f9; padding: 10px 14px; border-radius: 8px; font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
  th { background: #1e3a5f; color: white; font-weight: 700; text-transform: uppercase; font-size: 11px; }
  tr:nth-child(even) { background: #f8fafc; }
  .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 8px; }
</style>
</head>
<body>
  <div class="header">
    <h1>${madrasaName} ${madrasaPlace ? '(' + madrasaPlace + ')' : ''}</h1>
    <p>Reg. No: ${madrasaRegNo} | Milad Fest Individual Student Marks Report</p>
  </div>
  <div class="title-bar">
    <span>🏆 ${catName} — ${divTitle} Division (Complete Student Mark List)</span>
    <span>Total Students: ${finalRankedAllStudents.length}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:10%;text-align:center;">Position</th>
        <th style="width:15%;text-align:center;">Reg. No</th>
        <th>Student Name</th>
        <th style="width:25%;">Team Name</th>
        <th style="width:15%;text-align:center;">Total Points</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <div class="footer">
    Generated on: ${new Date().toLocaleString()} | Official Milad Fest Record
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>
                                `);
                                printWin.document.close();
                              };

                              return (
                                <div style={{ marginTop: '26px', background: '#ffffff', borderRadius: '18px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                                  <button
                                    type="button"
                                    onClick={() => setShowAllStudentsMarks(prev => !prev)}
                                    style={{
                                      width: '100%',
                                      padding: '14px 20px',
                                      background: showAllStudentsMarks ? 'linear-gradient(135deg, #1e293b, #0f172a)' : '#ffffff',
                                      color: showAllStudentsMarks ? '#ffffff' : '#1e293b',
                                      border: 'none',
                                      fontWeight: '800',
                                      fontSize: '14px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span>📋</span>
                                      <span>
                                        {lang === 'EN' ? 'Complete Category Student Marks & Rankings' : 'എല്ലാ വിദ്യാർത്ഥികളുടെയും മാർക്ക് വിവരങ്ങൾ (ലിസ്റ്റ്)'}
                                      </span>
                                      <span style={{
                                        fontSize: '11px',
                                        background: showAllStudentsMarks ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                                        color: showAllStudentsMarks ? '#ffffff' : '#475569',
                                        padding: '3px 10px',
                                        borderRadius: '12px',
                                        fontWeight: '800'
                                      }}>
                                        {finalRankedAllStudents.length} {lang === 'EN' ? 'Students' : 'വിദ്യാർത്ഥികൾ'}
                                      </span>
                                    </span>
                                    <span style={{ fontSize: '14px', fontWeight: '800' }}>
                                      {showAllStudentsMarks ? (lang === 'EN' ? '▲ Hide' : '▲ മറക്കുക') : (lang === 'EN' ? '▼ Show List' : '▼ കാണിക്കുക')}
                                    </span>
                                  </button>

                                  {showAllStudentsMarks && (
                                    <div style={{ padding: '20px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                                      {loginRole === 'ADMIN' && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                                          <button
                                            type="button"
                                            onClick={generateCategoryStudentMarksPDF}
                                            style={{
                                              padding: '10px 20px',
                                              background: 'linear-gradient(135deg, #047857, #065f46)',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '12px',
                                              fontWeight: '800',
                                              fontSize: '13px',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              boxShadow: '0 4px 12px rgba(4,120,87,0.25)',
                                              transition: 'all 0.2s'
                                            }}
                                          >
                                            📥 {lang === 'EN' ? 'Download All Students Mark List (PDF)' : 'ഡൗൺലോഡ് മാർക്ക് ലിസ്റ്റ് (PDF)'}
                                          </button>
                                        </div>
                                      )}

                                      {finalRankedAllStudents.length === 0 ? (
                                        <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                                          {lang === 'EN' ? 'No registered students found in this category / division.' : 'ഈ കാറ്റഗറിയിൽ വിദ്യാർത്ഥികളാരും രജിസ്റ്റർ ചെയ്തിട്ടില്ല.'}
                                        </p>
                                      ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                                                <th style={{ padding: '10px 12px', textAlign: 'center', width: '80px' }}>{lang === 'EN' ? 'Position' : 'സ്ഥാനം'}</th>
                                                <th style={{ padding: '10px 12px', textAlign: 'center', width: '90px' }}>{lang === 'EN' ? 'Reg. No' : 'രജി. നമ്പർ'}</th>
                                                <th style={{ padding: '10px 12px' }}>{lang === 'EN' ? 'Student Name' : 'വിദ്യാർത്ഥിയുടെ പേര്'}</th>
                                                <th style={{ padding: '10px 12px' }}>{lang === 'EN' ? 'Team Name' : 'ടീം'}</th>
                                                <th style={{ padding: '10px 12px', textAlign: 'center', width: '110px' }}>{lang === 'EN' ? 'Total Points' : 'മൊത്തം മാർക്ക്'}</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {finalRankedAllStudents.map(st => {
                                                const isZero = st.totalPoints === 0;
                                                return (
                                                  <tr key={st.id || st.regNo + st.name} style={{ borderBottom: '1px solid #f1f5f9', background: isZero ? '#fafafa' : 'transparent' }}>
                                                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: isZero ? '#94a3b8' : '#1e293b' }}>
                                                      {st.rankStr === '0' ? <span style={{ color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '8px', fontSize: '11px' }}>0</span> : <span style={{ color: st.rankStr === '1' ? '#d97706' : st.rankStr === '2' ? '#475569' : st.rankStr === '3' ? '#c2410c' : '#2563eb' }}>#{st.rankStr}</span>}
                                                    </td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: '#0f172a' }}>
                                                      #{st.regNo}
                                                    </td>
                                                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#1e293b' }}>
                                                      {st.name} <span style={{ fontSize: '12px' }}>{(st.gender || '').toUpperCase() === 'BOY' ? '👦' : '👧'}</span>
                                                    </td>
                                                    <td style={{ padding: '10px 12px', color: '#475569', fontWeight: '600' }}>
                                                      {st.teamName}
                                                    </td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                      <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        fontWeight: '800',
                                                        fontSize: '12px',
                                                        background: isZero ? '#f1f5f9' : '#ecfdf5',
                                                        color: isZero ? '#94a3b8' : '#047857',
                                                        border: isZero ? '1px solid #e2e8f0' : '1px solid #a7f3d0'
                                                      }}>
                                                        ⭐ {st.totalPoints} Pts
                                                      </span>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}

                    </div>
                  )
                  )}
                </div>
              </div>
            )
          )}

          {/* ---------------- 🎯 TAB 2.5: PROFILE ---------------- */}
          {!isInitialDataLoading && activeTab === 'PROFILE' && (
            <div className="card animate-tab">
              <h2 style={{ marginBottom: '18px' }}>👤 {loginRole === 'ADMIN' ? (lang === 'EN' ? 'Photo Approval & ID Cards' : 'ഫോട്ടോ അപ്പ്രൂവൽ & ഐഡി കാർഡുകൾ') : (lang === 'EN' ? 'Student Photo & ID Card' : 'വിദ്യാർത്ഥി ഫോട്ടോ & ഐഡി കാർഡ്')}</h2>

              {/* ══════════ VIEW MODE ══════════ */}
              {loginRole !== 'ADMIN' ? (
                <div className="profile-container">

                  {/* Step 1: Register number input */}
                  {profileStep === 'INPUT' && (
                    <div className="profile-reg-input-card">
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🪪</div>
                        <h3 style={{ color: '#1e293b', fontSize: '18px', fontWeight: '700' }}>Student ID Card</h3>
                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Enter your register number to access your profile</p>
                      </div>
                      <input
                        type="text"
                        className="settings-input"
                        placeholder="Enter Register Number"
                        value={profileRegNo}
                        onChange={(e) => setProfileRegNo(e.target.value)}
                        style={{ textAlign: 'center', fontSize: '18px', padding: '14px', marginBottom: '12px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleProfileLookup} className="btn-add-action" style={{ flex: 1 }}>Confirm</button>
                        <button onClick={handleProfileReset} className="btn-add-action" style={{ flex: 1, background: '#94a3b8' }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Student found - show details + upload */}
                  {profileStep === 'FOUND' && profileStudent && (() => {
                    const _foundTeam = teams.find(t => String(t.id) === String(profileStudent.teamid ?? profileStudent.teamId ?? ''));

                    // Robust category lookup: try ID match first, then name-based fallback
                    const _catRef = String(profileStudent.catid ?? profileStudent.catId ?? profileStudent.catname ?? profileStudent.catName ?? '');
                    const _foundCat = _catRef
                      ? categories.find(c =>
                        String(c.id) === _catRef ||
                        c.name === _catRef ||
                        c.name?.toLowerCase() === _catRef.toLowerCase()
                      )
                      : undefined;

                    const _isBoy = (profileStudent.gender || '').toUpperCase() === 'BOY';

                    return (
                      <div className="profile-reg-input-card">
                        {/* ── Student info card ── */}
                        <div style={{
                          background: 'linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 100%)',
                          border: '2px solid #16a34a',
                          borderRadius: '16px',
                          padding: '20px 16px 16px',
                          marginBottom: '16px',
                          textAlign: 'center',
                          boxShadow: '0 4px 20px rgba(22,163,74,0.12)'
                        }}>
                          <div style={{ fontSize: '40px', marginBottom: '6px' }}>🎓</div>
                          <h3 style={{
                            color: '#14532d',
                            fontWeight: '800',
                            fontSize: '18px',
                            letterSpacing: '0.3px',
                            marginBottom: '14px'
                          }}>{profileStudent.name}</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {/* Reg No */}
                            <div style={{
                              background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                              borderRadius: '10px',
                              padding: '8px 6px',
                              boxShadow: '0 2px 8px rgba(251,191,36,0.4)',
                              gridColumn: '1 / -1'
                            }}>
                              <div style={{ fontSize: '10px', fontWeight: '700', color: '#78350f', textTransform: 'uppercase', letterSpacing: '1px' }}>📋 Register No.</div>
                              <div style={{ fontSize: '22px', fontWeight: '900', color: '#1c1917', letterSpacing: '2px', lineHeight: 1.2 }}>{profileStudent.regno || profileStudent.regNo}</div>
                            </div>
                            {/* Team */}
                            <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderLeft: '3px solid #16a34a', borderRadius: '8px', padding: '8px 6px', textAlign: 'left' }}>
                              <div style={{ fontSize: '9px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>🚩 Team</div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#14532d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{_foundTeam ? _foundTeam.name : <span style={{ color: '#ef4444' }}>Not found</span>}</div>
                            </div>
                            {/* Category */}
                            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(217,119,6,0.3)', borderLeft: '3px solid #f59e0b', borderRadius: '8px', padding: '8px 6px', textAlign: 'left' }}>
                              <div style={{ fontSize: '9px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>📂 Category</div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#14532d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {profileStudent._resolvedCatName || (_foundCat ? _foundCat.name : <span style={{ color: '#ef4444' }}>Not assigned</span>)}
                              </div>
                            </div>
                            {/* Gender */}
                            <div style={{ background: _isBoy ? 'rgba(96,165,250,0.1)' : 'rgba(244,114,182,0.1)', border: `1px solid ${_isBoy ? 'rgba(96,165,250,0.35)' : 'rgba(244,114,182,0.35)'}`, borderLeft: `3px solid ${_isBoy ? '#60a5fa' : '#f472b6'}`, borderRadius: '8px', padding: '8px 6px', textAlign: 'left', gridColumn: '1 / -1' }}>
                              <div style={{ fontSize: '9px', fontWeight: '700', color: _isBoy ? '#2563eb' : '#be185d', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>{_isBoy ? '👦' : '👧'} Gender</div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#14532d' }}>{_isBoy ? 'Boy' : 'Girl'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Photo Upload Area */}
                        <div className="photo-upload-area">
                          {!profilePhotoPreview ? (
                            <>
                              <div style={{ fontSize: '48px', marginBottom: '10px', filter: 'drop-shadow(0 2px 6px rgba(22,163,74,0.3))' }}>📸</div>
                              <p style={{ color: '#15803d', fontSize: '17px', fontWeight: '800', marginBottom: '6px' }}>
                                {lang === 'EN' ? 'Upload Your Photo' : 'ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക'}
                              </p>
                              <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px', lineHeight: 1.4 }}>
                                {lang === 'EN' ? 'Select a clear front-facing photo. You can crop & adjust after selecting.' : 'ക്രോപ്പ് ചെയ്ത് ശരിയായ ഭാഗം തിരഞ്ഞെടുക്കാം'}
                              </p>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px 28px', width: 'auto', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', fontWeight: '700', fontSize: '14px', borderRadius: '12px', boxShadow: '0 4px 14px rgba(22,163,74,0.4)', transition: 'all 0.2s ease' }}>
                                📷 {lang === 'EN' ? 'Select Photo' : 'ഫോട്ടോ തിരഞ്ഞെടുക്കുക'}
                                <input type="file" accept="image/*" onChange={handleProfilePhotoSelect} style={{ display: 'none' }} />
                              </label>
                            </>
                          ) : (
                            <>
                              <div style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #16a34a', margin: '0 auto 14px', boxShadow: '0 4px 20px rgba(22,163,74,0.25), 0 0 0 6px rgba(22,163,74,0.1)' }}>
                                <img src={profilePhotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              {profileCropMode && (
                                <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700', marginBottom: '10px', textAlign: 'center', background: 'rgba(22,163,74,0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(22,163,74,0.25)' }}>
                                  ✂️ {lang === 'EN' ? 'Cropped — Ready to Upload' : 'ക്രോപ്പ് ചെയ്തു — അപ്‌ലോഡ് ചെയ്യാം'}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button onClick={handleProfilePhotoUpload} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', cursor: 'pointer', padding: '12px 26px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', fontWeight: '800', fontSize: '14px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 14px rgba(22,163,74,0.4)' }} disabled={profileUploading}>
                                  {profileUploading ? '⏳ Uploading...' : '✅ ' + (lang === 'EN' ? 'Upload Photo' : 'ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക')}
                                </button>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', cursor: 'pointer', padding: '12px 22px', background: 'linear-gradient(135deg, #475569, #334155)', color: '#f1f5f9', fontWeight: '700', fontSize: '13px', borderRadius: '12px', border: 'none', boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
                                  ✂️ {lang === 'EN' ? 'Re-crop' : 'വീണ്ടും ക്രോപ്പ്'}
                                  <input type="file" accept="image/*" onChange={handleProfilePhotoSelect} style={{ display: 'none' }} />
                                </label>
                              </div>
                            </>
                          )}
                        </div>

                        <button onClick={handleProfileReset} className="btn-add-action" style={{ background: '#94a3b8', marginTop: '12px' }}>← {lang === 'EN' ? 'Back' : 'തിരിച്ചു'}</button>
                      </div>
                    );
                  })()}


                  {/* Step 3: Waiting for approval */}
                  {profileStep === 'WAITING' && profileStudent && (
                    <div className="profile-reg-input-card">
                      <div className="waiting-approval-box">
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
                        <h3 style={{ color: '#1e293b', fontWeight: '700', marginBottom: '6px' }}>Waiting for Approval</h3>
                        <p style={{ color: '#64748b', fontSize: '13px' }}>Your photo has been uploaded and is pending admin approval.</p>
                        <div style={{ margin: '16px auto', width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #e2e8f0' }}>
                          {profileStudent.photo_url ? (
                            <img src={profileStudent.photo_url} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '36px' }}>👤</div>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f766e' }}>{profileStudent.name}</p>
                      </div>
                      <button onClick={handleProfileReset} className="btn-add-action" style={{ background: '#94a3b8', marginTop: '12px' }}>← Back</button>
                    </div>
                  )}

                  {/* Step 4: Approved - Show ID Card */}
                  {profileStep === 'APPROVED' && profileStudent && (
                    <div>
                      {/* Professional ID Card */}
                      <StudentIdCard
                        student={profileStudent}
                        loggedInMadrasa={loggedInMadrasa}
                        teams={teams}
                        categories={categories}
                        cardRef={idCardRef}
                      />

                      {/* Download Button */}
                      <button
                        onClick={() => handleDownloadIdCard(idCardRef.current, profileStudent.name)}
                        className="btn-add-action"
                        style={{ marginTop: '16px', background: 'linear-gradient(135deg, #064e3b, #0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        📥 Download ID Card
                      </button>
                      <button onClick={handleProfileReset} className="btn-add-action" style={{ background: '#94a3b8', marginTop: '8px' }}>← Back</button>
                    </div>
                  )}
                </div>

              ) : (

                /* ══════════ ADMIN MODE ══════════ */
                <div className="profile-container">
                  {/* Admin Sub-tabs */}
                  <div className="sub-tab-nav" style={{ marginBottom: '16px' }}>
                    <button className={`sub-nav-item ${profileAdminSubTab === 'APPROVAL' ? 'active' : ''}`} onClick={() => setProfileAdminSubTab('APPROVAL')}>✅ Approval</button>
                    <button className={`sub-nav-item ${profileAdminSubTab === 'ID_CARDS' ? 'active' : ''}`} onClick={() => setProfileAdminSubTab('ID_CARDS')}>🪪 ID Cards</button>
                  </div>


                  {/* ── Photo Stats Summary Cards ── */}
                  {(() => {
                    const totalStudents = students.length;
                    const uploadedCount = students.filter(s => s.photo_url && String(s.photo_url).trim().length > 5 && s.photo_status !== 'none').length;
                    const approvedCount = students.filter(s => s.photo_url && String(s.photo_url).trim().length > 5 && s.photo_status === 'approved').length;

                    const statCards = [
                      {
                        icon: '🧑‍🎓',
                        label: lang === 'EN' ? 'Total Students' : 'ആകെ വിദ്യാർത്ഥികൾ',
                        value: totalStudents,
                        color: '#1e40af',
                        bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                        border: '#93c5fd',
                        valueColor: '#1e40af',
                      },
                      {
                        icon: '📸',
                        label: lang === 'EN' ? 'Photos Uploaded' : 'ഫോട്ടോ അപ്‌ലോഡ്',
                        value: uploadedCount,
                        color: '#92400e',
                        bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                        border: '#fcd34d',
                        valueColor: '#b45309',
                      },
                      {
                        icon: '✅',
                        label: lang === 'EN' ? 'Approved' : 'അപ്‌പ്രൂവ്ഡ്',
                        value: approvedCount,
                        color: '#14532d',
                        bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                        border: '#86efac',
                        valueColor: '#15803d',
                      },
                    ];

                    return (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                        {statCards.map((card, i) => (
                          <div key={i} style={{
                            flex: 1,
                            background: card.bg,
                            border: `1.5px solid ${card.border}`,
                            borderRadius: '14px',
                            padding: '14px 10px',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          }}>
                            <div style={{ fontSize: '22px', marginBottom: '4px' }}>{card.icon}</div>
                            <div style={{
                              fontSize: '28px',
                              fontWeight: '900',
                              color: card.valueColor,
                              lineHeight: 1,
                              marginBottom: '5px',
                            }}>{card.value}</div>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: card.color,
                              opacity: 0.8,
                              letterSpacing: '0.3px',
                              lineHeight: '1.2',
                            }}>{card.label}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Pending Action Bar */}
                  {(() => {
                    const uploadedCount = students.filter(s => s.photo_url && String(s.photo_url).trim().length > 5 && s.photo_status !== 'none').length;
                    const approvedCount = students.filter(s => s.photo_url && String(s.photo_url).trim().length > 5 && s.photo_status === 'approved').length;
                    const pendingCount = uploadedCount - approvedCount;

                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                        {pendingCount > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', color: '#b91c1c' }}>
                            ⏳ <span>{pendingCount} {lang === 'EN' ? 'photo(s) pending approval' : 'ഫോട്ടോകൾ അപ്‌പ്രൂവലിനായി കാത്തിരിക്കുന്നു'}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', color: '#15803d' }}>
                            🎉 <span>{lang === 'EN' ? 'All uploaded photos are approved!' : 'എല്ലാ ഫോട്ടോകളും അപ്‌പ്രൂവ് ചെയ്തു കഴിഞ്ഞു!'}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {pendingCount > 0 && (
                            <button
                              onClick={handleApproveAllPendingPhotos}
                              style={{
                                background: 'linear-gradient(135deg, #059669, #047857)',
                                color: 'white',
                                border: 'none',
                                padding: '10px 18px',
                                borderRadius: '10px',
                                fontWeight: '800',
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              ⚡ {lang === 'EN' ? `Approve All Pending (${pendingCount})` : `ഒറ്റ ക്ലിക്കിൽ എല്ലാം അപ്പ്രൂവ് ചെയ്യുക (${pendingCount})`}
                            </button>
                          )}

                          <button
                            onClick={handleCleanCorruptedPhotos}
                            style={{
                              background: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #cbd5e1',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              fontWeight: '700',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            title="Clean corrupted photos"
                          >
                            🧹 {lang === 'EN' ? 'Clean Bad Photos' : 'ക്ലിയർ ചെയ്യുക'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Section A: APPROVAL ── */}
                  {profileAdminSubTab === 'APPROVAL' && (

                    <div>
                      {/* Category filter chips */}
                      <div className="student-filters-container" style={{ marginBottom: '16px' }}>
                        <div className="filter-section-title">📂 Filter by Category</div>
                        <div className="filter-chips-wrapper">
                          <div className={`filter-chip-box ${profileAdminCatFilter === 'ALL' ? 'active' : ''}`} onClick={() => setProfileAdminCatFilter('ALL')}>📁 All</div>
                          {categories.map(c => (
                            <div key={c.id} className={`filter-chip-box ${String(profileAdminCatFilter) === String(c.id) ? 'active' : ''}`} onClick={() => setProfileAdminCatFilter(c.id)}>{c.name}</div>
                          ))}
                          <div className={`filter-chip-box ${profileAdminCatFilter === 'GENERAL' ? 'active' : ''}`} onClick={() => setProfileAdminCatFilter('GENERAL')} style={{ background: profileAdminCatFilter === 'GENERAL' ? 'linear-gradient(135deg,#d97706,#b45309)' : '', fontWeight: 'bold' }}>🌟 GENERAL</div>
                        </div>
                      </div>

                      {/* Approval list */}
                      <div className="settings-list-box" style={{ maxHeight: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                          <h3 style={{ margin: 0 }}>📋 Students Photo Approval</h3>
                          {students.some(s => s.photo_url && String(s.photo_url).trim().length > 5 && s.photo_status !== 'approved') && (
                            <button
                              onClick={handleApproveAllPendingPhotos}
                              style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                            >
                              ⚡ {lang === 'EN' ? 'Approve All' : 'എല്ലാം അപ്പ്രൂവ് ചെയ്യുക'}
                            </button>
                          )}
                        </div>
                        {(() => {
                          const filtered = students.filter(s => {
                            const sCat = String(s.catid || s.catId || '');
                            const matchCat = profileAdminCatFilter === 'ALL'
                              || (profileAdminCatFilter === 'GENERAL' ? (sCat === '-1' || sCat === 'GENERAL' || generalCatIds.map(String).includes(sCat)) : sCat === String(profileAdminCatFilter));
                            const hasPhoto = s.photo_url && String(s.photo_url).trim().length > 5 && s.photo_status !== 'none';
                            return matchCat && hasPhoto;
                          });

                          if (filtered.length === 0) return <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No photos pending for approval.</p>;

                          return filtered.map(s => {
                            const sTeamId = s.teamid || s.teamId || '';
                            const sCatId = s.catid || s.catId || '';
                            const teamObj = teams.find(t => String(t.id) === String(sTeamId));
                            const catObj = categories.find(c => String(c.id) === String(sCatId));
                            const isPending = s.photo_status === 'pending';
                            const isApproved = s.photo_status === 'approved';

                            return (
                              <div key={s.id} className="approval-item">
                                <div className="approval-item-left">
                                  <div className="approval-photo-thumb">
                                    {s.photo_url ? (
                                      <img src={s.photo_url} alt={s.name} />
                                    ) : (
                                      <span>👤</span>
                                    )}
                                  </div>
                                  <div>
                                    <strong>{s.regno || s.regNo || ''}</strong> - {s.name}
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                      Team: {teamObj ? teamObj.name : 'N/A'}
                                      {profileAdminCatFilter === 'ALL' && <> | Category: {catObj ? catObj.name : 'N/A'}</>}
                                    </div>
                                    <div style={{ marginTop: '4px' }}>
                                      <span className={`approval-status-badge ${isApproved ? 'status-approved' : 'status-pending'}`}>
                                        {isApproved ? '✅ Approved' : '⏳ Pending'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="approval-actions">
                                  {isPending && (
                                    <button onClick={() => handleApprovePhoto(s.id)} className="approval-btn approve-btn" title="Approve">✅</button>
                                  )}
                                  <label className="approval-btn edit-btn" title="Re-upload Photo">
                                    ✏️
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleProfilePhotoSelect(e, s)} />
                                  </label>
                                  <button onClick={() => handleDeletePhoto(s)} className="approval-btn delete-btn" title="Delete Photo">🗑️</button>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* ── Section B: ID CARDS ── */}
                  {profileAdminSubTab === 'ID_CARDS' && (
                    <div>
                      {/* Filters */}
                      <div className="student-filters-container" style={{ marginBottom: '16px' }}>
                        <div>
                          <div className="filter-section-title">📂 Category</div>
                          <div className="filter-chips-wrapper">
                            <div className={`filter-chip-box ${profileAdminCatFilter === 'ALL' ? 'active' : ''}`} onClick={() => setProfileAdminCatFilter('ALL')}>📁 All</div>
                            {categories.map(c => (
                              <div key={c.id} className={`filter-chip-box ${String(profileAdminCatFilter) === String(c.id) ? 'active' : ''}`} onClick={() => setProfileAdminCatFilter(c.id)}>{c.name}</div>
                            ))}
                            <div className={`filter-chip-box ${profileAdminCatFilter === 'GENERAL' ? 'active' : ''}`} onClick={() => setProfileAdminCatFilter('GENERAL')} style={{ background: profileAdminCatFilter === 'GENERAL' ? 'linear-gradient(135deg,#d97706,#b45309)' : '', fontWeight: 'bold' }}>🌟 GENERAL</div>
                          </div>
                        </div>
                        <div>
                          <div className="filter-section-title">🚩 Team</div>
                          <div className="filter-chips-wrapper">
                            <div className={`filter-chip-box ${profileAdminTeamFilter === 'ALL' ? 'active' : ''}`} onClick={() => setProfileAdminTeamFilter('ALL')}>👥 All</div>
                            {teams.map(t => (
                              <div key={t.id} className={`filter-chip-box ${String(profileAdminTeamFilter) === String(t.id) ? 'active' : ''}`} onClick={() => setProfileAdminTeamFilter(t.id)}>{t.name}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="filter-section-title">👦/👧 Division</div>
                          <div className="filter-chips-wrapper">
                            <div className={`filter-chip-box ${profileAdminGenderFilter === 'ALL' ? 'active' : ''}`} onClick={() => setProfileAdminGenderFilter('ALL')}>👥 All</div>
                            <div className={`filter-chip-box ${profileAdminGenderFilter === 'BOY' ? 'active-boy' : ''}`} onClick={() => setProfileAdminGenderFilter('BOY')}>👦 Boys</div>
                            <div className={`filter-chip-box ${profileAdminGenderFilter === 'GIRL' ? 'active-girl' : ''}`} onClick={() => setProfileAdminGenderFilter('GIRL')}>👧 Girls</div>
                          </div>
                        </div>
                      </div>

                      {/* PDF Export Button */}
                      {(() => {
                        const approvedFiltered = students.filter(s => {
                          const sCat = String(s.catid || s.catId || '');
                          const matchCat = profileAdminCatFilter === 'ALL'
                            || (profileAdminCatFilter === 'GENERAL' ? (sCat === '-1' || sCat === 'GENERAL' || generalCatIds.map(String).includes(sCat)) : sCat === String(profileAdminCatFilter));
                          const matchTeam = profileAdminTeamFilter === 'ALL' || String(s.teamid || s.teamId || '') === String(profileAdminTeamFilter);
                          const matchGender = profileAdminGenderFilter === 'ALL' || (s.gender || '') === profileAdminGenderFilter;
                          return matchCat && matchTeam && matchGender;
                        });

                        return (
                          <>
                            {/* Paper Size Selector */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>🖨️ Paper Size:</span>
                              <button
                                onClick={() => setPdfPaperSize('A4')}
                                style={{
                                  padding: '6px 18px', borderRadius: '6px', border: '2px solid',
                                  borderColor: pdfPaperSize === 'A4' ? '#7c3aed' : '#e2e8f0',
                                  background: pdfPaperSize === 'A4' ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : '#ffffff',
                                  color: pdfPaperSize === 'A4' ? '#ffffff' : '#475569',
                                  fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                              >A4</button>
                              <button
                                onClick={() => setPdfPaperSize('A3')}
                                style={{
                                  padding: '6px 18px', borderRadius: '6px', border: '2px solid',
                                  borderColor: pdfPaperSize === 'A3' ? '#7c3aed' : '#e2e8f0',
                                  background: pdfPaperSize === 'A3' ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : '#ffffff',
                                  color: pdfPaperSize === 'A3' ? '#ffffff' : '#475569',
                                  fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                              >A3</button>
                              <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
                                {pdfPaperSize === 'A4' ? '4 cards/page (2×2)' : '10 cards/page (5×2)'} • 300 DPI • 7.5cm × 10cm
                              </span>
                            </div>
                            <button
                              onClick={() => handleDownloadPDF(approvedFiltered, pdfPaperSize)}
                              disabled={profilePdfGenerating || approvedFiltered.length === 0}
                              className="btn-add-action"
                              style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                              {profilePdfGenerating ? '⏳ Generating PDF...' : `📄 Download ${pdfPaperSize} PDF (${approvedFiltered.length} cards)`}
                            </button>

                            {/* ID Card Gallery Grid */}
                            <div className="id-card-grid" ref={idCardGalleryRef}>
                              {approvedFiltered.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '30px 0', gridColumn: '1 / -1' }}>No approved ID cards found for the selected filters.</p>
                              ) : (
                                approvedFiltered.map(s => {
                                  return (
                                    <div key={s.id} className="id-card-gallery-item">
                                      <StudentIdCard
                                        student={s}
                                        loggedInMadrasa={loggedInMadrasa}
                                        teams={teams}
                                        categories={categories}
                                        className="id-card-mini"
                                      />
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
          }

          {/* ---------------- 📅 TAB: TIMETABLE ---------------- */}
          {!isInitialDataLoading && activeTab === 'TIMETABLE' && (
            <div className="card animate-tab">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>📅 {t('timetableTitle')}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setTimetableView(prev => prev === 'GRID' ? 'LIST' : 'GRID')}
                    className="btn-add-action"
                    style={{ background: '#0f766e', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '14px' }}
                  >
                    {timetableView === 'GRID' ? '📝 List View' : '🎴 Grid View'}
                  </button>
                  {loginRole === 'ADMIN' && (
                    <button
                      onClick={() => {
                        // Build scheduled programs for print
                        const scheduledItems = programs
                          .map(p => {
                            const entry = timetable.find(tt => String(tt.program_id) === String(p.id));
                            const cat = categories.find(c => String(c.id) === String(p.catid));
                            return { program: p, scheduled_time: entry?.scheduled_time || null, venue: entry?.venue || '', category: cat };
                          })
                          .filter(item => item.scheduled_time)
                          .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

                        const formatDT = (iso) => {
                          if (!iso) return '-';
                          return new Date(iso).toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
                        };

                        const madrasaName = loggedInMadrasa?.name || 'MILAD FEST';
                        const regNum = loggedInMadrasa?.regNumber || '';
                        const placeRaw = (loggedInMadrasa?.place || '').split('|')[0].trim();

                        // Group by category, then by gender within each category
                        const catOrder = categories.map(c => ({ id: String(c.id), name: c.name }));
                        const grouped = {};
                        scheduledItems.forEach(item => {
                          const catName = item.category?.name || 'Common';
                          const pType = (item.program.type || '').toUpperCase();
                          let gKey = 'COMMON';
                          if (pType.includes('BOY')) gKey = 'BOY';
                          else if (pType.includes('GIRL')) gKey = 'GIRL';
                          if (!grouped[catName]) grouped[catName] = { BOY: [], GIRL: [], COMMON: [] };
                          grouped[catName][gKey].push(item);
                        });

                        const orderedCatNames = catOrder.map(c => c.name).filter(n => grouped[n]);
                        Object.keys(grouped).forEach(n => { if (!orderedCatNames.includes(n)) orderedCatNames.push(n); });

                        const gLbl = { BOY: '&#128102; Boys', GIRL: '&#128103; Girls', COMMON: '&#128101; Common' };
                        const gBg = { BOY: '#1e40af', GIRL: '#be185d', COMMON: '#0f766e' };

                        let sectionsHtml = '';
                        if (scheduledItems.length === 0) {
                          sectionsHtml = '<p style="text-align:center;padding:40px;color:#64748b;font-style:italic;">No programs scheduled yet.</p>';
                        } else {
                          orderedCatNames.forEach(catName => {
                            const catData = grouped[catName];
                            sectionsHtml += `<div style="margin-bottom:28px;">
                              <div style="font-size:17px;font-weight:800;color:#fff;background:linear-gradient(135deg,#1e293b,#334155);padding:10px 18px;border-radius:10px 10px 0 0;letter-spacing:.5px;">${catName}</div>`;
                            ['BOY', 'GIRL', 'COMMON'].forEach(gKey => {
                              const items = catData[gKey] || [];
                              if (!items.length) return;
                              sectionsHtml += `
                              <div style="border:1px solid #e2e8f0;border-top:none;">
                                <div style="font-size:12px;font-weight:700;color:#fff;background:${gBg[gKey]};padding:6px 18px;letter-spacing:1px;text-transform:uppercase;">${gLbl[gKey]}</div>
                                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                                  <thead>
                                    <tr style="background:#f1f5f9;">
                                      <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;width:60px;">Code</th>
                                      <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;">Program Name</th>
                                      <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;width:170px;">&#9200; Time</th>
                                      <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;width:140px;">&#128205; Venue</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${items.map((item, idx) => `
                                      <tr style="background:${idx % 2 === 0 ? '#f8fafc' : '#fff'};">
                                        <td style="padding:9px 12px;font-weight:700;color:#0f766e;border-bottom:1px solid #f1f5f9;">${item.program.code}</td>
                                        <td style="padding:9px 12px;font-weight:600;border-bottom:1px solid #f1f5f9;">${item.program.name}</td>
                                        <td style="padding:9px 12px;color:#0369a1;font-weight:600;border-bottom:1px solid #f1f5f9;">${formatDT(item.scheduled_time)}</td>
                                        <td style="padding:9px 12px;color:#475569;border-bottom:1px solid #f1f5f9;">${item.venue || '&#8212;'}</td>
                                      </tr>`).join('')}
                                  </tbody>
                                </table>
                              </div>`;
                            });
                            sectionsHtml += '</div>';
                          });
                        }

                        const timetablePrintHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${madrasaName} - Program Timetable</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    body { font-family:Arial,Helvetica,sans-serif; background:#fff; color:#1e293b; }
    .page { padding:28px 32px; max-width:960px; margin:0 auto; }
    .header { display:flex; align-items:flex-start; justify-content:space-between; padding:20px 24px; background:linear-gradient(135deg,#064e3b,#0f766e); border-radius:12px; margin-bottom:26px; color:#fff; }
    .header h1 { font-size:22px; font-weight:900; line-height:1.2; }
    .header .sub { font-size:12px; color:#bbf7d0; margin-top:5px; }
    .header .tt-title { font-size:15px; font-weight:700; color:#fef08a; margin-top:8px; }
    .stats { background:rgba(255,255,255,0.15); border-radius:10px; padding:10px 16px; text-align:center; }
    .stats .num { font-size:28px; font-weight:900; color:#fef08a; line-height:1; }
    .stats .lbl { font-size:10px; color:#bbf7d0; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-top:3px; }
    .footer { margin-top:24px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:14px; }
    .footer strong { color:#0f766e; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .page { padding:16px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#a7f3d0;text-transform:uppercase;margin-bottom:6px;">${eventName ? eventName + (eventYear ? ' — Milad_fest ' + eventYear : '') : '&#128332; MILAD FEST &#8211; Official Schedule'}</div>
        <h1>${madrasaName}</h1>
        <div class="sub">Reg No: <strong style="color:#fef08a;">${regNum}</strong>${placeRaw ? ` &nbsp;|&nbsp; ${placeRaw}` : ''}</div>
        <div class="tt-title">&#128197; Program Timetable</div>
      </div>
      <div class="stats">
        <div class="num">${scheduledItems.length}</div>
        <div class="lbl">Programs</div>
      </div>
    </div>

    ${sectionsHtml}

    <div class="footer">
      Printed from <strong>MILAD FEST App</strong> &nbsp;|&nbsp; ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();},700);};</script>
</body>
</html>`;

                        // Open as blob URL in new tab — works on both desktop and Android (no blank PDF)
                        const blob = new Blob([timetablePrintHtml], { type: 'text/html;charset=utf-8' });
                        const blobUrl = URL.createObjectURL(blob);
                        const win = window.open(blobUrl, '_blank');
                        if (!win) {
                          // Popup blocked: fallback to direct download
                          const a = document.createElement('a');
                          a.href = blobUrl;
                          a.download = `${madrasaName.replace(/\s+/g, '-')}-Timetable.html`;
                          a.click();
                        }
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 12000);
                      }}
                      className="btn-add-action"
                      style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '14px' }}
                    >
                      🖨️ {t('printTimetable')}
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="category-chips-container" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => setTimetableFilterCat('ALL')}
                  className={`category-chip ${timetableFilterCat === 'ALL' ? 'active' : ''}`}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    background: timetableFilterCat === 'ALL' ? '#0f766e' : '#f1f5f9',
                    color: timetableFilterCat === 'ALL' ? '#fff' : '#475569',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {t('allCategories')}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setTimetableFilterCat(cat.id)}
                    className={`category-chip ${String(timetableFilterCat) === String(cat.id) ? 'active' : ''}`}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: 'none',
                      background: String(timetableFilterCat) === String(cat.id) ? '#0f766e' : '#f1f5f9',
                      color: String(timetableFilterCat) === String(cat.id) ? '#fff' : '#475569',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
                {generalCatIds.length > 0 && (
                  <button
                    onClick={() => setTimetableFilterCat('GENERAL')}
                    className={`category-chip ${timetableFilterCat === 'GENERAL' ? 'active' : ''}`}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: 'none',
                      background: timetableFilterCat === 'GENERAL' ? 'linear-gradient(135deg,#d97706,#b45309)' : '#f1f5f9',
                      color: timetableFilterCat === 'GENERAL' ? '#fff' : '#475569',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    🌟 GENERAL
                  </button>
                )}
              </div>

              {/* Gender Filter Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[['ALL', '🌐 All', '#475569'], ['BOY', '👦 Boys', '#1e40af'], ['GIRL', '👧 Girls', '#be185d'], ['COMMON', '🤝 Common', '#0f766e']].map(([key, label, activeColor]) => (
                  <button
                    key={key}
                    onClick={() => setTimetableFilterGender(key)}
                    style={{
                      padding: '5px 14px',
                      borderRadius: '20px',
                      border: `2px solid ${timetableFilterGender === key ? activeColor : '#e2e8f0'}`,
                      background: timetableFilterGender === key ? activeColor : '#fff',
                      color: timetableFilterGender === key ? '#fff' : '#475569',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Print Only Header */}
              <div className="timetable-print-only-header" style={{ display: 'none', textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#0f766e', margin: '0 0 5px 0' }}>{loggedInMadrasa?.name || 'MILAD FEST'}</h1>
                <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold' }}>📅 {t('timetableTitle')}</p>
                <div style={{ borderBottom: '2px solid #0f766e', margin: '15px 0' }}></div>
              </div>

              {/* Timetable List / Grid */}
              {(() => {
                const mappedTimetable = programs.map(p => {
                  const entry = timetable.find(t => String(t.program_id) === String(p.id));
                  let cat = categories.find(c => String(c.id) === String(p.catid));
                  // For General programs (catid=-1), provide a synthetic category
                  if (!cat && isGeneralProg(p)) {
                    cat = { id: -1, name: 'GENERAL', color: '#d97706' };
                  }
                  return {
                    program: p,
                    scheduled_time: entry?.scheduled_time || null,
                    venue: entry?.venue || '',
                    category: cat
                  };
                });

                // Helper to derive gender key from program type
                const getGenderKey = (prog) => {
                  const pType = (prog.type || '').toUpperCase();
                  if (pType.includes('BOY')) return 'BOY';
                  if (pType.includes('GIRL')) return 'GIRL';
                  return 'COMMON';
                };

                // Filter by category
                const filteredTimetable = mappedTimetable.filter(item => {
                  // Category filter
                  let catMatch = true;
                  if (timetableFilterCat !== 'ALL') {
                    if (timetableFilterCat === 'GENERAL') {
                      catMatch = isGeneralProg(item.program);
                    } else {
                      catMatch = String(item.program.catid) === String(timetableFilterCat);
                    }
                  }
                  // Gender filter
                  let genderMatch = true;
                  if (timetableFilterGender !== 'ALL') {
                    genderMatch = getGenderKey(item.program) === timetableFilterGender;
                  }
                  return catMatch && genderMatch;
                });

                // In view mode, we hide unscheduled programs from visitors to keep the schedule tidy
                // but always show all programs for admins so they can schedule them.
                const displayedTimetable = loginRole === 'ADMIN'
                  ? filteredTimetable
                  : filteredTimetable.filter(item => item.scheduled_time);

                // Sort: Scheduled first (time asc), then unscheduled
                const sortedTimetable = [...displayedTimetable].sort((a, b) => {
                  if (a.scheduled_time && b.scheduled_time) {
                    return new Date(a.scheduled_time) - new Date(b.scheduled_time);
                  }
                  if (a.scheduled_time) return -1;
                  if (b.scheduled_time) return 1;
                  return a.program.code.localeCompare(b.program.code);
                });

                if (sortedTimetable.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>📅</div>
                      <p>{t('noTimetable')}</p>
                    </div>
                  );
                }

                const startEditingTimetable = (item) => {
                  setEditingTimetableId(item.program.id);
                  let dateVal = '';
                  let h12Val = '09';
                  let minVal = '00';
                  let ampmVal = 'AM';

                  if (item.scheduled_time) {
                    const d = new Date(item.scheduled_time);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    dateVal = `${yyyy}-${mm}-${dd}`;

                    let hours = d.getHours();
                    ampmVal = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    if (hours === 0) hours = 12;
                    h12Val = String(hours).padStart(2, '0');

                    let mins = d.getMinutes();
                    let roundedMins = Math.round(mins / 5) * 5;
                    if (roundedMins >= 60) roundedMins = 55;
                    minVal = String(roundedMins).padStart(2, '0');
                  } else {
                    const d = new Date();
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    dateVal = `${yyyy}-${mm}-${dd}`;
                  }

                  setTimetableFormData({
                    date: dateVal,
                    hour12: h12Val,
                    minute: minVal,
                    ampm: ampmVal,
                    venue: item.venue || ''
                  });
                };

                // Function to format date & time nicely
                const formatDateTime = (isoString) => {
                  if (!isoString) return '';
                  const date = new Date(isoString);
                  return date.toLocaleString(lang === 'EN' ? 'en-US' : 'ml-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                };

                // Helper to get relative time badge
                const getStatusBadge = (isoString) => {
                  if (!isoString) return null;
                  const date = new Date(isoString);
                  const now = new Date();
                  const diffMs = date - now;

                  if (diffMs > 0) {
                    return <span className="status-badge upcoming" style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{t('upcomingBadge')}</span>;
                  } else if (diffMs <= 0 && diffMs > -3600000) { // 1 hour duration assumption
                    return <span className="status-badge now-live" style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>{t('ongoingBadge')}</span>;
                  } else {
                    return <span className="status-badge done" style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{t('doneBadge')}</span>;
                  }
                };

                return (
                  <div>
                    {timetableView === 'GRID' ? (
                      /* GRID VIEW */
                      <div className="timetable-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {sortedTimetable.map(item => {
                          const isEditing = editingTimetableId === item.program.id;
                          const hasTime = !!item.scheduled_time;
                          const categoryColor = item.category?.color || '#0f766e';

                          return (
                            <div
                              key={item.program.id}
                              className={`timetable-card-item ${hasTime ? 'scheduled' : 'unscheduled'}`}
                              style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '16px',
                                background: '#fff',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                position: 'relative',
                                borderLeft: `5px solid ${categoryColor}`,
                                transition: 'transform 0.2s, box-shadow 0.2s'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', background: `${categoryColor}20`, color: categoryColor, padding: '3px 8px', borderRadius: '6px' }}>
                                      {item.category?.name || 'Common'}
                                    </span>
                                    {(() => {
                                      const gk = getGenderKey(item.program);
                                      const gConfig = { BOY: { label: '👦 Boys', bg: '#dbeafe', color: '#1e40af' }, GIRL: { label: '👧 Girls', bg: '#fce7f3', color: '#be185d' }, COMMON: { label: '🤝 Common', bg: '#d1fae5', color: '#065f46' } };
                                      const gc = gConfig[gk];
                                      return <span style={{ fontSize: '10px', fontWeight: 'bold', background: gc.bg, color: gc.color, padding: '2px 7px', borderRadius: '6px' }}>{gc.label}</span>;
                                    })()}
                                  </div>
                                  {getStatusBadge(item.scheduled_time)}
                                </div>

                                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#1e293b' }}>
                                  {item.program.name}
                                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px', fontWeight: 'normal' }}>
                                    ({item.program.code})
                                  </span>
                                </h3>

                                {isEditing ? (
                                  /* Admin Editing Form */
                                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div>
                                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>📅 Date</label>
                                      <input
                                        type="date"
                                        value={timetableFormData.date || ''}
                                        onChange={(e) => setTimetableFormData(prev => ({ ...prev, date: e.target.value }))}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>⏰ Time (12-Hour AM/PM)</label>
                                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <select
                                          value={timetableFormData.hour12 || '09'}
                                          onChange={(e) => setTimetableFormData(prev => ({ ...prev, hour12: e.target.value }))}
                                          style={{ flex: 1, padding: '6px 4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold', background: '#fff' }}
                                        >
                                          {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                                            <option key={h} value={h}>{h}</option>
                                          ))}
                                        </select>
                                        <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#475569' }}>:</span>
                                        <select
                                          value={timetableFormData.minute || '00'}
                                          onChange={(e) => setTimetableFormData(prev => ({ ...prev, minute: e.target.value }))}
                                          style={{ flex: 1, padding: '6px 4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold', background: '#fff' }}
                                        >
                                          {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                          ))}
                                        </select>
                                        <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #0284c7' }}>
                                          <button
                                            type="button"
                                            onClick={() => setTimetableFormData(prev => ({ ...prev, ampm: 'AM' }))}
                                            style={{
                                              padding: '6px 10px',
                                              fontSize: '13px',
                                              fontWeight: 'bold',
                                              border: 'none',
                                              cursor: 'pointer',
                                              background: (timetableFormData.ampm || 'AM') === 'AM' ? '#0284c7' : '#f0f9ff',
                                              color: (timetableFormData.ampm || 'AM') === 'AM' ? '#ffffff' : '#0369a1'
                                            }}
                                          >
                                            AM
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setTimetableFormData(prev => ({ ...prev, ampm: 'PM' }))}
                                            style={{
                                              padding: '6px 10px',
                                              fontSize: '13px',
                                              fontWeight: 'bold',
                                              border: 'none',
                                              cursor: 'pointer',
                                              background: timetableFormData.ampm === 'PM' ? '#0284c7' : '#f0f9ff',
                                              color: timetableFormData.ampm === 'PM' ? '#ffffff' : '#0369a1'
                                            }}
                                          >
                                            PM
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>📍 {t('setVenue')}</label>
                                      <input
                                        type="text"
                                        placeholder={t('venuePlaceholder')}
                                        value={timetableFormData.venue || ''}
                                        onChange={(e) => setTimetableFormData(prev => ({ ...prev, venue: e.target.value }))}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                      <button
                                        onClick={() => handleSaveTimetableEntry(item.program.id)}
                                        className="btn-add-action"
                                        style={{ padding: '6px 12px', fontSize: '12px', flex: 1, background: '#10b981', color: '#fff', fontWeight: 'bold' }}
                                      >
                                        💾 Save
                                      </button>
                                      <button
                                        onClick={() => setEditingTimetableId(null)}
                                        className="btn-add-action"
                                        style={{ padding: '6px 12px', fontSize: '12px', flex: 1, background: '#64748b', color: '#fff' }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Display Info */
                                  <div style={{ marginTop: '12px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                                      <span>⏰</span>
                                      <strong>{hasTime ? formatDateTime(item.scheduled_time) : <span style={{ color: '#94a3b8', fontWeight: 'normal', fontStyle: 'italic' }}>{t('noTimetable')}</span>}</strong>
                                    </div>
                                    {item.venue && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                                        <span>📍</span>
                                        <strong>{item.venue}</strong>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {loginRole === 'ADMIN' && !isEditing && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                  <button
                                    onClick={() => startEditingTimetable(item)}
                                    className="btn-add-action"
                                    style={{ flex: 1, padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                  >
                                    ✏️ Edit
                                  </button>
                                  {hasTime && (
                                    <button
                                      onClick={() => handleClearTimetableEntry(item.program.id)}
                                      className="btn-add-action"
                                      style={{ padding: '4px 8px', fontSize: '12px', background: '#ef4444' }}
                                    >
                                      🗑️ Clear
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* LIST / TABLE VIEW */
                      <div className="timetable-list-layout" style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 'bold' }}>Code</th>
                              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 'bold' }}>Program</th>
                              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 'bold' }}>Category</th>
                              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 'bold' }}>Time</th>
                              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 'bold' }}>Venue</th>
                              <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 'bold' }}>Status</th>
                              {loginRole === 'ADMIN' && <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 'bold', width: '120px' }}>Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {sortedTimetable.map(item => {
                              const isEditing = editingTimetableId === item.program.id;
                              const hasTime = !!item.scheduled_time;
                              const categoryColor = item.category?.color || '#0f766e';

                              return (
                                <tr key={item.program.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#475569' }}>{item.program.code}</td>
                                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1e293b' }}>{item.program.name}</td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 'bold', background: `${categoryColor}20`, color: categoryColor, padding: '3px 8px', borderRadius: '6px', display: 'inline-block' }}>
                                        {item.category?.name || 'Common'}
                                      </span>
                                      {(() => {
                                        const gk = getGenderKey(item.program);
                                        const gConfig = { BOY: { label: '👦 Boys', bg: '#dbeafe', color: '#1e40af' }, GIRL: { label: '👧 Girls', bg: '#fce7f3', color: '#be185d' }, COMMON: { label: '🤝 Common', bg: '#d1fae5', color: '#065f46' } };
                                        const gc = gConfig[gk];
                                        return <span style={{ fontSize: '10px', fontWeight: 'bold', background: gc.bg, color: gc.color, padding: '2px 7px', borderRadius: '6px', display: 'inline-block' }}>{gc.label}</span>;
                                      })()}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 16px', color: '#1e293b' }}>
                                    {isEditing ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px' }}>
                                        <input
                                          type="date"
                                          value={timetableFormData.date || ''}
                                          onChange={(e) => setTimetableFormData(prev => ({ ...prev, date: e.target.value }))}
                                          style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                          <select
                                            value={timetableFormData.hour12 || '09'}
                                            onChange={(e) => setTimetableFormData(prev => ({ ...prev, hour12: e.target.value }))}
                                            style={{ flex: 1, padding: '4px 2px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
                                          >
                                            {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                                              <option key={h} value={h}>{h}</option>
                                            ))}
                                          </select>
                                          <span style={{ fontWeight: 'bold' }}>:</span>
                                          <select
                                            value={timetableFormData.minute || '00'}
                                            onChange={(e) => setTimetableFormData(prev => ({ ...prev, minute: e.target.value }))}
                                            style={{ flex: 1, padding: '4px 2px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
                                          >
                                            {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                                              <option key={m} value={m}>{m}</option>
                                            ))}
                                          </select>
                                          <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid #0284c7' }}>
                                            <button
                                              type="button"
                                              onClick={() => setTimetableFormData(prev => ({ ...prev, ampm: 'AM' }))}
                                              style={{
                                                padding: '3px 6px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: (timetableFormData.ampm || 'AM') === 'AM' ? '#0284c7' : '#f0f9ff',
                                                color: (timetableFormData.ampm || 'AM') === 'AM' ? '#ffffff' : '#0369a1'
                                              }}
                                            >
                                              AM
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setTimetableFormData(prev => ({ ...prev, ampm: 'PM' }))}
                                              style={{
                                                padding: '3px 6px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: timetableFormData.ampm === 'PM' ? '#0284c7' : '#f0f9ff',
                                                color: timetableFormData.ampm === 'PM' ? '#ffffff' : '#0369a1'
                                              }}
                                            >
                                              PM
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : hasTime ? (
                                      formatDateTime(item.scheduled_time)
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{t('noTimetable')}</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#334155' }}>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        placeholder={t('venuePlaceholder')}
                                        value={timetableFormData.venue}
                                        onChange={(e) => setTimetableFormData(prev => ({ ...prev, venue: e.target.value }))}
                                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', width: '120px' }}
                                      />
                                    ) : (
                                      item.venue || '-'
                                    )}
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>{getStatusBadge(item.scheduled_time)}</td>
                                  {loginRole === 'ADMIN' && (
                                    <td style={{ padding: '12px 16px' }}>
                                      {isEditing ? (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                          <button
                                            onClick={() => handleSaveTimetableEntry(item.program.id)}
                                            className="btn-add-action"
                                            style={{ padding: '3px 6px', fontSize: '11px', background: '#10b981' }}
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => {
                                              const rNum = loggedInMadrasa?.regNumber;
                                              const newName = eventNameInput.trim();
                                              const newYear = eventYearInput.trim();
                                              const numReg = parseInt(rNum, 10);
                                              const isNumValid = !isNaN(numReg) && String(numReg) === String(rNum).trim();
                                              const mFilterStr = isNumValid ? `regNumber.eq."${rNum}",regNumber.eq."${numReg}"` : `regNumber.eq."${rNum}"`;
                                              (async () => {
                                                const { data: md } = await queryWithRetry(() =>
                                                  supabase.from('madrasas').select('place').or(mFilterStr).maybeSingle()
                                                );
                                                const updatedPlace = makePlaceString(md ? md.place : '', {
                                                  eventName: encodeURIComponent(newName),
                                                  eventYear: encodeURIComponent(newYear)
                                                });
                                                const { error } = await queryWithRetry(() =>
                                                  supabase.from('madrasas').update({ place: updatedPlace }).or(mFilterStr)
                                                );
                                              })();
                                              setEditingTimetableId(null);
                                            }}
                                            className="btn-add-action"
                                            style={{ padding: '3px 6px', fontSize: '11px', background: '#64748b' }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                          <button
                                            onClick={() => startEditingTimetable(item)}
                                            className="btn-add-action"
                                            style={{ padding: '3px 6px', fontSize: '11px' }}
                                          >
                                            Edit
                                          </button>
                                          {hasTime && (
                                            <button
                                              onClick={() => handleClearTimetableEntry(item.program.id)}
                                              className="btn-add-action"
                                              style={{ padding: '3px 6px', fontSize: '11px', background: '#ef4444' }}
                                            >
                                              Clear
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ---------------- 🎯 TAB 3: MASTER SETTINGS ---------------- */}
          {activeTab === 'SETTINGS' && (
            <div className="card animate-tab">
              <h2>⚙️ Master Settings (Admin control panel)</h2>

              {loginRole !== 'ADMIN' ? (
                <div style={{ minHeight: '200px' }}></div>
              ) : (
                <div>
                  {/* Settings sub tab navigation – Revamped grid of tiles */}
                  <div className="executive-settings-nav-grid">
                    <div className={`executive-nav-tile ${settingsSubTab === 'TEAMS' ? 'active' : ''}`} onClick={() => setSettingsSubTab('TEAMS')}>
                      <div className="tile-icon-wrapper">🚩</div>
                      <div className="tile-label">Teams</div>
                    </div>
                    <div className={`executive-nav-tile ${settingsSubTab === 'CATEGORIES' ? 'active' : ''}`} onClick={() => setSettingsSubTab('CATEGORIES')}>
                      <div className="tile-icon-wrapper">📂</div>
                      <div className="tile-label">Categories</div>
                    </div>
                    <div className={`executive-nav-tile ${settingsSubTab === 'STUDENTS' ? 'active' : ''}`} onClick={() => setSettingsSubTab('STUDENTS')}>
                      <div className="tile-icon-wrapper">🧑‍🎓</div>
                      <div className="tile-label">Students</div>
                    </div>
                    <div className={`executive-nav-tile ${settingsSubTab === 'PROGRAMS' ? 'active' : ''}`} onClick={() => setSettingsSubTab('PROGRAMS')}>
                      <div className="tile-icon-wrapper">🏆</div>
                      <div className="tile-label">Programs</div>
                    </div>
                    <div className={`executive-nav-tile ${settingsSubTab === 'REGISTER' ? 'active' : ''}`} onClick={() => setSettingsSubTab('REGISTER')}>
                      <div className="tile-icon-wrapper">📋</div>
                      <div className="tile-label">Register</div>
                    </div>
                    <div className={`executive-nav-tile ${settingsSubTab === 'MARK_ENTRY' ? 'active' : ''}`} onClick={() => setSettingsSubTab('MARK_ENTRY')}>
                      <div className="tile-icon-wrapper">📝</div>
                      <div className="tile-label">Mark Entry</div>
                    </div>
                    <div className={`executive-nav-tile ${settingsSubTab === 'POINTS' ? 'active' : ''}`} onClick={() => setSettingsSubTab('POINTS')}>
                      <div className="tile-icon-wrapper">⚙️</div>
                      <div className="tile-label">Point Structure</div>
                    </div>
                    <div className={`executive-nav-tile ${settingsSubTab === 'JUDGE_SHEET' ? 'active' : ''}`} onClick={() => setSettingsSubTab('JUDGE_SHEET')}>
                      <div className="tile-icon-wrapper">👥</div>
                      <div className="tile-label">Student List</div>
                    </div>
                    <div className={`executive-nav-tile ${settingsSubTab === 'CONTROL' ? 'active' : ''}`} onClick={() => setSettingsSubTab('CONTROL')}>
                      <div className="tile-icon-wrapper">🔏</div>
                      <div className="tile-label">Control</div>
                    </div>
                    <div className={`executive-nav-tile ${settingsSubTab === 'PRIZES' ? 'active' : ''}`} onClick={() => setSettingsSubTab('PRIZES')}>
                      <div className="tile-icon-wrapper">🎁</div>
                      <div className="tile-label">{lang === 'EN' ? 'Prizes' : 'സമ്മാനങ്ങൾ'}</div>
                    </div>
                  </div>

                  <div className="settings-content">
                    {/* TEAMS SUB-TAB */}
                    {settingsSubTab === 'TEAMS' && (
                      <div className="settings-card-v2">
                        <div className="settings-form-box-v2">
                          <h3>🚩 Add New Team</h3>
                          <form onSubmit={handleAddTeam} className="settings-form">
                            <input type="text" className="settings-input-v2" placeholder="Team Name (eg: Team A)" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required />
                            <button type="submit" className="btn-premium-action">Add Team</button>
                          </form>
                        </div>

                        {/* ✨ Program / Event Name Section */}
                        <div className="settings-form-box-v2" style={{ marginTop: '20px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1.5px solid #86efac', borderRadius: '14px', padding: '18px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#166534', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🏷️ {lang === 'EN' ? 'Event Name' : 'ഇവന്റ് നാമം'}
                          </h3>
                          {eventName && !isEditingEvent ? (
                            <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #bbf7d0', marginBottom: '10px' }}>
                              <div style={{ fontSize: '18px', fontWeight: '800', color: '#15803d', letterSpacing: '0.5px' }}>{eventName}</div>
                              {eventYear && <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>📅 {eventYear}</div>}
                              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button
                                  onClick={() => { setEventNameInput(eventName); setEventYearInput(eventYear); setIsEditingEvent(true); }}
                                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                                >✏️ {lang === 'EN' ? 'Edit' : 'എഡിറ്റ്'}</button>
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(lang === 'EN' ? 'Are you sure you want to clear Event Name?' : 'ഇവന്റ് നാമം നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?')) return;
                                    setEventName('');
                                    setEventYear('');
                                    setEventNameInput('');
                                    setEventYearInput('');
                                    setIsEditingEvent(false);
                                    const rNum = loggedInMadrasa?.regNumber;
                                    if (rNum) {
                                      try {
                                        localStorage.removeItem(`event_name_${rNum}`);
                                        localStorage.removeItem(`event_year_${rNum}`);
                                        const cachedRaw = localStorage.getItem(`cached_data_${rNum}`);
                                        if (cachedRaw) {
                                          const cached = JSON.parse(cachedRaw);
                                          cached.eventName = '';
                                          cached.eventYear = '';
                                          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cached));
                                        }
                                      } catch(e){}
                                      try {
                                        const numReg = parseInt(rNum, 10);
                                        const isNumValid = !isNaN(numReg) && String(numReg) === String(rNum).trim();
                                        const mFilterStr = isNumValid ? `regNumber.eq."${rNum}",regNumber.eq.${numReg}` : `regNumber.eq."${rNum}"`;
                                        const { data: md } = await queryWithRetry(() =>
                                          supabase.from('madrasas').select('place').or(mFilterStr).maybeSingle()
                                        );
                                        const updatedPlace = makePlaceString(md ? md.place : '', {
                                          eventName: '',
                                          eventYear: ''
                                        });
                                        await queryWithRetry(() =>
                                          supabase.from('madrasas').update({ place: updatedPlace }).or(mFilterStr)
                                        );
                                      } catch (err) {}
                                    }
                                  }}
                                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                                >🗑️ {lang === 'EN' ? 'Clear' : 'നീക്കം ചെയ്യുക'}</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <input
                                type="text"
                                className="settings-input-v2"
                                placeholder={lang === 'EN' ? 'Event Name (any language)' : 'ഇവന്റിന്റെ പേര് (ഏത് ഭാഷയിലും)'}
                                value={eventNameInput}
                                onFocus={() => setIsEditingEvent(true)}
                                onChange={e => setEventNameInput(e.target.value)}
                              />
                              <input
                                type="text"
                                className="settings-input-v2"
                                placeholder={lang === 'EN' ? 'Year (eg: 2025)' : 'വർഷം (eg: 2025)'}
                                value={eventYearInput}
                                onFocus={() => setIsEditingEvent(true)}
                                onChange={e => setEventYearInput(e.target.value)}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={async () => {
                                    // Allow saving empty string to clear event name
                                    const rNum = loggedInMadrasa?.regNumber;
                                    const newName = eventNameInput.trim();
                                    const newYear = eventYearInput.trim();
                                    setEventName(newName);
                                    setEventYear(newYear);
                                    setIsEditingEvent(false);
                                    if (rNum) {
                                      try {
                                        localStorage.setItem(`event_name_${rNum}`, newName);
                                        localStorage.setItem(`event_year_${rNum}`, newYear);
                                        const cachedRaw = localStorage.getItem(`cached_data_${rNum}`);
                                        if (cachedRaw) {
                                          const cached = JSON.parse(cachedRaw);
                                          cached.eventName = newName;
                                          cached.eventYear = newYear;
                                          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cached));
                                        }
                                      } catch(e){}
                                      try {
                                        const numReg = parseInt(rNum, 10);
                                        const isNumValid = !isNaN(numReg) && String(numReg) === String(rNum).trim();
                                        const mFilterStr = isNumValid ? `regNumber.eq."${rNum}",regNumber.eq.${numReg}` : `regNumber.eq."${rNum}"`;
                                        const { data: md } = await queryWithRetry(() =>
                                          supabase.from('madrasas').select('place').or(mFilterStr).maybeSingle()
                                        );
                                        const updatedPlace = makePlaceString(md ? md.place : '', {
                                          eventName: encodeURIComponent(newName),
                                          eventYear: encodeURIComponent(newYear)
                                        });
                                        const { error } = await queryWithRetry(() =>
                                          supabase.from('madrasas').update({ place: updatedPlace }).or(mFilterStr)
                                        );
                                        if (error) {
                                          alert('⚠️ Cloud Save Warning (Saved on this device): ' + getFriendlyErrorMessage(error.message));
                                        } else {
                                          alert(lang === 'EN' ? '✅ Event Name saved!' : '✅ ഇവന്റ് പേര് സേവ് ചെയ്തു!');
                                        }
                                      } catch (err) { alert('Saved locally! Cloud error: ' + getFriendlyErrorMessage(err.message)); }
                                    }
                                  }}
                                  style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '800', flex: 1 }}
                                >💾 {isEditingEvent ? (lang === 'EN' ? 'Update' : 'അപ്ഡേറ്റ്') : (lang === 'EN' ? 'Save' : 'സേവ്')}</button>
                                {isEditingEvent && (
                                  <button
                                    onClick={() => setIsEditingEvent(false)}
                                    style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                                  >{lang === 'EN' ? 'Cancel' : 'റദ്ദാക്കുക'}</button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 👤 Sadar Muallim Section */}
                        <div className="settings-form-box-v2" style={{ marginTop: '20px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1.5px solid #93c5fd', borderRadius: '14px', padding: '18px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e40af', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            👤 sadar muallim
                          </h3>
                          {convenerSadar && !isEditingConvenerSadar ? (
                            <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #bfdbfe', marginBottom: '10px' }}>
                              <div style={{ fontSize: '17px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '0.5px' }}>{convenerSadar}</div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button
                                  onClick={() => { setConvenerSadarInput(convenerSadar); setIsEditingConvenerSadar(true); }}
                                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                                >✏️ {lang === 'EN' ? 'Edit' : 'എഡിറ്റ്'}</button>
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(lang === 'EN' ? 'Are you sure you want to clear Sadar Muallim name?' : 'സദ്ർ മുഅല്ലിം പേര് നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?')) return;
                                    setConvenerSadar('');
                                    setConvenerSadarInput('');
                                    setIsEditingConvenerSadar(false);
                                    const rNum = loggedInMadrasa?.regNumber;
                                    if (rNum) {
                                      try {
                                        localStorage.removeItem(`convener_sadar_${rNum}`);
                                        const cachedRaw = localStorage.getItem(`cached_data_${rNum}`);
                                        if (cachedRaw) {
                                          const cached = JSON.parse(cachedRaw);
                                          cached.convenerSadar = '';
                                          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cached));
                                        }
                                      } catch(e){}
                                      try {
                                        const madrasaId = loggedInMadrasa?.id;
                                        const numReg = parseInt(rNum, 10);
                                        const isNumValid = !isNaN(numReg) && String(numReg) === String(rNum).trim();
                                        const mFilterStr = isNumValid ? `regNumber.eq."${rNum}",regNumber.eq.${numReg}` : `regNumber.eq."${rNum}"`;
                                        
                                        let mdPlace = '';
                                        let targetId = madrasaId;
                                        if (targetId) {
                                          const { data: md } = await queryWithRetry(() =>
                                            supabase.from('madrasas').select('id, place').eq('id', targetId).maybeSingle()
                                          );
                                          if (md) mdPlace = md.place || '';
                                        } else {
                                          const { data: md } = await queryWithRetry(() =>
                                            supabase.from('madrasas').select('id, place').or(mFilterStr).maybeSingle()
                                          );
                                          if (md) {
                                            mdPlace = md.place || '';
                                            targetId = md.id;
                                          }
                                        }
                                        
                                        const updatedPlace = makePlaceString(mdPlace, {
                                          convenerSadar: '',
                                          coordinatorConvener: coordinatorConvener ? encodeURIComponent(coordinatorConvener) : ''
                                        });

                                        let error = null;
                                        if (targetId) {
                                          const res = await queryWithRetry(() =>
                                            supabase.from('madrasas').update({ place: updatedPlace }).eq('id', targetId)
                                          );
                                          error = res.error;
                                        } else {
                                          const res = await queryWithRetry(() =>
                                            supabase.from('madrasas').update({ place: updatedPlace }).or(mFilterStr)
                                          );
                                          error = res.error;
                                        }

                                        if (error) {
                                          alert('⚠️ Cloud Save Warning (Saved on this device): ' + getFriendlyErrorMessage(error.message));
                                        } else {
                                          alert(lang === 'EN' ? '✅ Sadar Muallim cleared!' : '✅ സദ്ർ മുഅല്ലിം പേര് നീക്കം ചെയ്തു!');
                                        }
                                      } catch (err) { alert('Saved locally! Cloud error: ' + getFriendlyErrorMessage(err.message)); }
                                    }
                                  }}
                                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                                >🗑️ {lang === 'EN' ? 'Clear' : 'നീക്കം ചെയ്യുക'}</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <input
                                type="text"
                                className="settings-input-v2"
                                placeholder={lang === 'EN' ? 'Sadar Muallim (any language)' : 'സദ്ർ മുഅല്ലിം പേര് (ഏത് ഭാഷയിലും)'}
                                value={convenerSadarInput}
                                onFocus={() => setIsEditingConvenerSadar(true)}
                                onChange={e => setConvenerSadarInput(e.target.value)}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={async () => {
                                    const rNum = loggedInMadrasa?.regNumber;
                                    const newCS = convenerSadarInput.trim();
                                    setConvenerSadar(newCS);
                                    setIsEditingConvenerSadar(false);
                                    if (rNum) {
                                      try {
                                        localStorage.setItem(`convener_sadar_${rNum}`, newCS);
                                        const cachedRaw = localStorage.getItem(`cached_data_${rNum}`);
                                        if (cachedRaw) {
                                          const cached = JSON.parse(cachedRaw);
                                          cached.convenerSadar = newCS;
                                          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cached));
                                        }
                                      } catch(e){}
                                      try {
                                        const madrasaId = loggedInMadrasa?.id;
                                        const numReg = parseInt(rNum, 10);
                                        const isNumValid = !isNaN(numReg) && String(numReg) === String(rNum).trim();
                                        const mFilterStr = isNumValid ? `regNumber.eq."${rNum}",regNumber.eq.${numReg}` : `regNumber.eq."${rNum}"`;
                                        
                                        let mdPlace = '';
                                        let targetId = madrasaId;
                                        if (targetId) {
                                          const { data: md } = await queryWithRetry(() =>
                                            supabase.from('madrasas').select('id, place').eq('id', targetId).maybeSingle()
                                          );
                                          if (md) mdPlace = md.place || '';
                                        } else {
                                          const { data: md } = await queryWithRetry(() =>
                                            supabase.from('madrasas').select('id, place').or(mFilterStr).maybeSingle()
                                          );
                                          if (md) {
                                            mdPlace = md.place || '';
                                            targetId = md.id;
                                          }
                                        }
                                        
                                        const updatedPlace = makePlaceString(mdPlace, {
                                          convenerSadar: encodeURIComponent(newCS),
                                          coordinatorConvener: coordinatorConvener ? encodeURIComponent(coordinatorConvener) : ''
                                        });

                                        let error = null;
                                        if (targetId) {
                                          const res = await queryWithRetry(() =>
                                            supabase.from('madrasas').update({ place: updatedPlace }).eq('id', targetId)
                                          );
                                          error = res.error;
                                        } else {
                                          const res = await queryWithRetry(() =>
                                            supabase.from('madrasas').update({ place: updatedPlace }).or(mFilterStr)
                                          );
                                          error = res.error;
                                        }

                                        if (error) {
                                          alert('⚠️ Cloud Save Warning (Saved on this device): ' + getFriendlyErrorMessage(error.message));
                                        } else {
                                          alert(lang === 'EN' ? '✅ Sadar Muallim saved!' : '✅ സദ്ർ മുഅല്ലിം പേര് സേവ് ചെയ്തു!');
                                        }
                                      } catch (err) { alert('Saved locally! Cloud error: ' + getFriendlyErrorMessage(err.message)); }
                                    }
                                  }}
                                  style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '800', flex: 1 }}
                                >💾 {isEditingConvenerSadar ? (lang === 'EN' ? 'Update' : 'അപ്ഡേറ്റ്') : (lang === 'EN' ? 'Save' : 'സേവ്')}</button>
                                {isEditingConvenerSadar && (
                                  <button
                                    onClick={() => setIsEditingConvenerSadar(false)}
                                    style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                                  >{lang === 'EN' ? 'Cancel' : 'റദ്ദാക്കുക'}</button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 👤 Coordinator / Convener Section */}
                        <div className="settings-form-box-v2" style={{ marginTop: '20px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1.5px solid #93c5fd', borderRadius: '14px', padding: '18px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e40af', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            👤 coordinator / convenar
                          </h3>
                          {coordinatorConvener && !isEditingCoordinatorConvener ? (
                            <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #bfdbfe', marginBottom: '10px' }}>
                              <div style={{ fontSize: '17px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '0.5px' }}>{coordinatorConvener}</div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button
                                  onClick={() => { setCoordinatorConvenerInput(coordinatorConvener); setIsEditingCoordinatorConvener(true); }}
                                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                                >✏️ {lang === 'EN' ? 'Edit' : 'എഡിറ്റ്'}</button>
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(lang === 'EN' ? 'Are you sure you want to clear Coordinator / Convener name?' : 'കോഡിനേറ്റർ / കൺവീനർ പേര് നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?')) return;
                                    setCoordinatorConvener('');
                                    setCoordinatorConvenerInput('');
                                    setIsEditingCoordinatorConvener(false);
                                    const rNum = loggedInMadrasa?.regNumber;
                                    if (rNum) {
                                      try {
                                        localStorage.removeItem(`coordinator_convener_${rNum}`);
                                        const cachedRaw = localStorage.getItem(`cached_data_${rNum}`);
                                        if (cachedRaw) {
                                          const cached = JSON.parse(cachedRaw);
                                          cached.coordinatorConvener = '';
                                          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cached));
                                        }
                                      } catch(e){}
                                      try {
                                        const madrasaId = loggedInMadrasa?.id;
                                        const numReg = parseInt(rNum, 10);
                                        const isNumValid = !isNaN(numReg) && String(numReg) === String(rNum).trim();
                                        const mFilterStr = isNumValid ? `regNumber.eq."${rNum}",regNumber.eq.${numReg}` : `regNumber.eq."${rNum}"`;
                                        
                                        let mdPlace = '';
                                        let targetId = madrasaId;
                                        if (targetId) {
                                          const { data: md } = await queryWithRetry(() =>
                                            supabase.from('madrasas').select('id, place').eq('id', targetId).maybeSingle()
                                          );
                                          if (md) mdPlace = md.place || '';
                                        } else {
                                          const { data: md } = await queryWithRetry(() =>
                                            supabase.from('madrasas').select('id, place').or(mFilterStr).maybeSingle()
                                          );
                                          if (md) {
                                            mdPlace = md.place || '';
                                            targetId = md.id;
                                          }
                                        }
                                        
                                        const updatedPlace = makePlaceString(mdPlace, {
                                          coordinatorConvener: '',
                                          convenerSadar: convenerSadar ? encodeURIComponent(convenerSadar) : ''
                                        });

                                        let error = null;
                                        if (targetId) {
                                          const res = await queryWithRetry(() =>
                                            supabase.from('madrasas').update({ place: updatedPlace }).eq('id', targetId)
                                          );
                                          error = res.error;
                                        } else {
                                          const res = await queryWithRetry(() =>
                                            supabase.from('madrasas').update({ place: updatedPlace }).or(mFilterStr)
                                          );
                                          error = res.error;
                                        }

                                        if (error) {
                                          alert('⚠️ Cloud Save Warning (Saved on this device): ' + getFriendlyErrorMessage(error.message));
                                        } else {
                                          alert(lang === 'EN' ? '✅ Coordinator / Convener cleared!' : '✅ കോഡിനേറ്റർ / കൺവീനർ പേര് നീക്കം ചെയ്തു!');
                                        }
                                      } catch (err) { alert('Saved locally! Cloud error: ' + getFriendlyErrorMessage(err.message)); }
                                    }
                                  }}
                                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                                >🗑️ {lang === 'EN' ? 'Clear' : 'നീക്കം ചെയ്യുക'}</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <input
                                type="text"
                                className="settings-input-v2"
                                placeholder={lang === 'EN' ? 'Coordinator / Convener (any language)' : 'കോഡിനേറ്റർ / കൺവീനർ പേര് (ഏത് ഭാഷയിലും)'}
                                value={coordinatorConvenerInput}
                                onFocus={() => setIsEditingCoordinatorConvener(true)}
                                onChange={e => setCoordinatorConvenerInput(e.target.value)}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={async () => {
                                    const rNum = loggedInMadrasa?.regNumber;
                                    const newCC = coordinatorConvenerInput.trim();
                                    setCoordinatorConvener(newCC);
                                    setIsEditingCoordinatorConvener(false);
                                    if (rNum) {
                                      try {
                                        localStorage.setItem(`coordinator_convener_${rNum}`, newCC);
                                        const cachedRaw = localStorage.getItem(`cached_data_${rNum}`);
                                        if (cachedRaw) {
                                          const cached = JSON.parse(cachedRaw);
                                          cached.coordinatorConvener = newCC;
                                          localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cached));
                                        }
                                      } catch(e){}
                                      try {
                                        const madrasaId = loggedInMadrasa?.id;
                                        const numReg = parseInt(rNum, 10);
                                        const isNumValid = !isNaN(numReg) && String(numReg) === String(rNum).trim();
                                        const mFilterStr = isNumValid ? `regNumber.eq."${rNum}",regNumber.eq.${numReg}` : `regNumber.eq."${rNum}"`;
                                        
                                        let mdPlace = '';
                                        let targetId = madrasaId;
                                        if (targetId) {
                                          const { data: md } = await queryWithRetry(() =>
                                            supabase.from('madrasas').select('id, place').eq('id', targetId).maybeSingle()
                                          );
                                          if (md) mdPlace = md.place || '';
                                        } else {
                                          const { data: md } = await queryWithRetry(() =>
                                            supabase.from('madrasas').select('id, place').or(mFilterStr).maybeSingle()
                                          );
                                          if (md) {
                                            mdPlace = md.place || '';
                                            targetId = md.id;
                                          }
                                        }
                                        
                                        const updatedPlace = makePlaceString(mdPlace, {
                                          coordinatorConvener: encodeURIComponent(newCC),
                                          convenerSadar: convenerSadar ? encodeURIComponent(convenerSadar) : ''
                                        });

                                        let error = null;
                                        if (targetId) {
                                          const res = await queryWithRetry(() =>
                                            supabase.from('madrasas').update({ place: updatedPlace }).eq('id', targetId)
                                          );
                                          error = res.error;
                                        } else {
                                          const res = await queryWithRetry(() =>
                                            supabase.from('madrasas').update({ place: updatedPlace }).or(mFilterStr)
                                          );
                                          error = res.error;
                                        }

                                        if (error) {
                                          alert('⚠️ Cloud Save Warning (Saved on this device): ' + getFriendlyErrorMessage(error.message));
                                        } else {
                                          alert(lang === 'EN' ? '✅ Coordinator / Convener saved!' : '✅ കോഡിനേറ്റർ / കൺവീനർ പേര് സേവ് ചെയ്തു!');
                                        }
                                      } catch (err) { alert('Saved locally! Cloud error: ' + getFriendlyErrorMessage(err.message)); }
                                    }
                                  }}
                                  style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '800', flex: 1 }}
                                >💾 {isEditingCoordinatorConvener ? (lang === 'EN' ? 'Update' : 'അപ്ഡേറ്റ്') : (lang === 'EN' ? 'Save' : 'സേവ്')}</button>
                                {isEditingCoordinatorConvener && (
                                  <button
                                    onClick={() => setIsEditingCoordinatorConvener(false)}
                                    style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                                  >{lang === 'EN' ? 'Cancel' : 'റദ്ദാക്കുക'}</button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={{ marginTop: '20px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>📜 Existing Teams</h3>
                          {teams.length === 0 ? <p style={{ color: '#666', fontStyle: 'italic' }}>No teams added.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {teams.map(t => (
                                <div key={t.id} className={`settings-item-row-v2 ${editingTeamId === t.id ? 'editing' : ''}`}>
                                  {editingTeamId === t.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                      <input type="text" className="settings-input-v2" value={editingTeamName} onChange={e => setEditingTeamName(e.target.value)} />
                                      <div className="action-buttons-group">
                                        <button onClick={handleSaveTeamEdit} className="btn-premium-action-small primary">Save</button>
                                        <button onClick={() => setEditingTeamId(null)} className="btn-premium-action-small secondary">Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <span style={{ fontWeight: '600', color: '#334155' }}>{t.name}</span>
                                      <div>
                                        <button onClick={() => { setEditingTeamId(t.id); setEditingTeamName(t.name); }} className="btn-row-action-v2 edit" title="Edit">✏️</button>
                                        <button onClick={() => handleDeleteTeam(t.id)} className="btn-row-action-v2 delete" title="Delete">❌</button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CATEGORIES SUB-TAB */}
                    {settingsSubTab === 'CATEGORIES' && (
                      <>
                        <div className="settings-card-v2">
                          <div className="settings-form-box-v2">
                            <h3>📂 Add New Category</h3>
                            <form onSubmit={handleAddCategory} className="settings-form">
                              <input type="text" className="settings-input-v2" placeholder="Category Name (eg: Junior)" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                              <input type="text" className="settings-input-v2" placeholder="Which classes? (eg: 1 to 4)" value={newCatClassRange} onChange={(e) => setNewCatClassRange(e.target.value)} />
                              {!dbHasClassRange && (
                                <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '-4px', marginBottom: '8px', background: '#fffbeb', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fde68a', lineHeight: '1.4' }}>
                                  ⚠️ {lang === 'EN' ? "To enable 'Which classes?' (Class Range) saving, please run this SQL query in your Supabase SQL Editor:\n\nALTER TABLE categories ADD COLUMN classrange TEXT;" : "ക്ലാസ്സ് റേഞ്ച് (Which classes?) ഫീച്ചർ എനേബിൾ ചെയ്യാൻ Supabase SQL Editor-ൽ ഈ കോഡ് റൺ ചെയ്യുക:\n\nALTER TABLE categories ADD COLUMN classrange TEXT;"}
                                </div>
                              )}
                              <button type="submit" className="btn-premium-action">Add Category</button>
                            </form>
                          </div>
                          <div style={{ marginTop: '20px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>📜 Existing Categories</h3>
                            {categories.filter(c => c.name.toLowerCase() !== 'general').length === 0 ? <p style={{ color: '#666', fontStyle: 'italic' }}>No categories added.</p> : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {categories.filter(c => c.name.toLowerCase() !== 'general').map(c => (
                                  <div key={c.id} className={`settings-item-row-v2 ${editingCatId === c.id ? 'editing' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                                    {editingCatId === c.id ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                        <input type="text" className="settings-input-v2" value={editingCatName} onChange={e => setEditingCatName(e.target.value)} placeholder="Category Name" />
                                        <input type="text" className="settings-input-v2" value={editingCatClassRange} onChange={e => setEditingCatClassRange(e.target.value)} placeholder="Which classes? (eg: 1 to 4)" />
                                        <div className="action-buttons-group">
                                          <button onClick={handleSaveCatEdit} className="btn-premium-action-small primary">Save</button>
                                          <button onClick={() => setEditingCatId(null)} className="btn-premium-action-small secondary">Cancel</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                        <div>
                                          <span style={{ fontWeight: '700', color: '#334155' }}>{c.name}</span>
                                          {c.classrange && (
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', background: '#eff6ff', display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>📚 Class: {c.classrange}</div>
                                          )}
                                        </div>
                                        <div>
                                          <button onClick={() => { setEditingCatId(c.id); setEditingCatName(c.name); setEditingCatClassRange(c.classrange || ''); }} className="btn-row-action-v2 edit" title="Edit">✏️</button>
                                          <button onClick={() => handleDeleteCategory(c.id)} className="btn-row-action-v2 delete" title="Delete">❌</button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* ── GENERAL Special Tile ── */}
                            <div style={{ marginTop: '20px', border: '2px solid #f59e0b', borderRadius: '14px', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', padding: '16px', boxShadow: '0 4px 14px rgba(245,158,11,0.15)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: '900', fontSize: '18px', letterSpacing: '3px', color: '#b45309', textTransform: 'uppercase' }}>🌟 GENERAL</div>
                                  <div style={{ fontSize: '11.5px', color: '#92400e', marginTop: '4px', fontWeight: '600' }}>
                                    {generalCatIds.length === 0
                                      ? 'No categories selected yet. Click Options to configure.'
                                      : `Includes: ${generalCatIds.map(id => { const cat = categories.find(c => String(c.id) === String(id)); return cat ? cat.name : ''; }).filter(Boolean).join(', ')}`
                                    }
                                  </div>
                                </div>
                                <button
                                  onClick={() => { setGeneralModalTemp([...generalCatIds]); setShowGeneralModal(true); }}
                                  style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(180,83,9,0.25)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                                >
                                  ⚙️ Options
                                </button>
                              </div>
                              {generalCatIds.length > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', marginBottom: '6px' }}>Students in GENERAL:</div>
                                  <div style={{ fontWeight: '800', fontSize: '20px', color: '#92400e' }}>
                                    {students.filter(s => generalCatIds.map(String).includes(String(s.catid || s.catId || ''))).length} Students
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ── GENERAL Options Modal ── */}
                        {showGeneralModal && (
                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                            <div style={{ background: 'white', borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                  <div style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '2px', color: '#b45309' }}>🌟 GENERAL Options</div>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Select categories to include in GENERAL</div>
                                </div>
                                <button onClick={() => setShowGeneralModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: '700' }}>✕</button>
                              </div>

                              {categories.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No categories available. Add categories first.</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                                  {categories.map(c => {
                                    const isSelected = generalModalTemp.map(String).includes(String(c.id));
                                    return (
                                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', border: `2px solid ${isSelected ? '#f59e0b' : '#e2e8f0'}`, background: isSelected ? '#fffbeb' : '#f8fafc', transition: 'all 0.2s' }}>
                                        <div>
                                          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{c.name}</div>
                                          {c.classrange && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>📚 Class: {c.classrange}</div>}
                                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                            {students.filter(s => String(s.catid || s.catId || '') === String(c.id)).length} students
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => {
                                            if (isSelected) {
                                              setGeneralModalTemp(prev => prev.filter(id => String(id) !== String(c.id)));
                                            } else {
                                              setGeneralModalTemp(prev => [...prev, c.id]);
                                            }
                                          }}
                                          style={{ background: isSelected ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #e2e8f0, #cbd5e1)', color: isSelected ? 'white' : '#475569', border: 'none', padding: '8px 18px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', minWidth: '90px' }}
                                        >
                                          {isSelected ? '✅ Selected' : 'Select'}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                  onClick={async () => {
                                    setGeneralCatIds(generalModalTemp);
                                    const rNum = loggedInMadrasa ? loggedInMadrasa.regNumber : '';
                                    setShowGeneralModal(false);
                                    if (rNum) {
                                      try {
                                        localStorage.setItem(`general_cats_${rNum}`, JSON.stringify(generalModalTemp));
                                      } catch(e){}
                                      try {
                                        const numReg = parseInt(rNum, 10);
                                        const isNumValid = !isNaN(numReg) && String(numReg) === String(rNum).trim();
                                        const mFilterStr = isNumValid ? `regNumber.eq."${rNum}",regNumber.eq.${numReg}` : `regNumber.eq."${rNum}"`;
                                        const { data: md } = await queryWithRetry(() =>
                                          supabase.from('madrasas').select('place').or(mFilterStr).maybeSingle()
                                        );
                                        const updatedPlace = makePlaceString(md ? md.place : '', {
                                          generalCats: encodeURIComponent(JSON.stringify(generalModalTemp))
                                        });
                                        const { error } = await queryWithRetry(() =>
                                          supabase.from('madrasas').update({ place: updatedPlace }).or(mFilterStr)
                                        );
                                        if (error) {
                                          alert('⚠️ Cloud Save Warning (Saved locally): ' + getFriendlyErrorMessage(error.message));
                                        } else {
                                          alert(lang === 'EN' ? '✅ GENERAL Categories saved!' : '✅ ജനറൽ കാറ്റഗറികൾ സേവ് ചെയ്തു!');
                                        }
                                      } catch (err) { alert('Saved locally! Cloud error: ' + getFriendlyErrorMessage(err.message)); }
                                    }
                                  }}
                                  style={{ flex: 1, background: 'linear-gradient(135deg, #d97706, #b45309)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(180,83,9,0.3)' }}
                                >
                                  💾 Save
                                </button>
                                <button
                                  onClick={() => setShowGeneralModal(false)}
                                  style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* STUDENTS SUB-TAB */}
                    {settingsSubTab === 'STUDENTS' && (
                      <div className="settings-card-v2">
                        <div className="settings-form-box-v2">
                          <h3>🧑‍🎓 Add New Student</h3>
                          <form onSubmit={handleAddStudent} className="settings-form">
                            <input type="text" className="settings-input-v2" placeholder="Student Name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} required />
                            <input type="text" className="settings-input-v2" placeholder="Register Number / Chest Number" value={studentRegNo} onChange={(e) => setStudentRegNo(e.target.value)} required />

                            <select className="settings-input-v2" value={selectedStudentTeam} onChange={(e) => setSelectedStudentTeam(e.target.value)} required>
                              <option value="">Select Team</option>
                              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>

                            <select className="settings-input-v2" value={selectedStudentCat && studentGender ? `${selectedStudentCat}_${studentGender}` : ''} onChange={(e) => {
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
                              <option value="">Select Category & Gender</option>
                              {categories.map(c => (
                                <React.Fragment key={c.id}>
                                  <option value={`${c.id}_BOY`}>{c.name} - Boy</option>
                                  <option value={`${c.id}_GIRL`}>{c.name} - Girl</option>
                                </React.Fragment>
                              ))}
                              {generalCatIds.length > 0 && (
                                <React.Fragment>
                                  <option value="GENERAL_BOY">GENERAL - Boys</option>
                                  <option value="GENERAL_GIRL">GENERAL - Girls</option>
                                </React.Fragment>
                              )}
                            </select>

                            <button type="submit" className="btn-premium-action">Add Student</button>
                          </form>
                        </div>
                        {/* BULK_UPLOAD_PANEL_START */}
                        <div style={{ marginTop: '12px', borderRadius: '14px', overflow: 'hidden', border: '2px dashed #16a34a' }}>
                          <div onClick={() => { setShowBulkUpload(p => !p); setBulkUploadData([]); setBulkUploadResult(null); }} style={{ background: 'linear-gradient(135deg,#14532d,#166534)', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>📤 Bulk Add Students (Excel / CSV)</span>
                            <span style={{ color: '#86efac', fontSize: '20px' }}>{showBulkUpload ? '▲' : '▼'}</span>
                          </div>
                          {showBulkUpload && (
                            <div style={{ background: '#0f172a', padding: '16px' }}>
                              <div style={{ background: '#1e293b', borderRadius: '10px', padding: '12px', marginBottom: '14px', fontSize: '12px', color: '#94a3b8' }}>
                                <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#86efac' }}>📋 Excel Column Format (Header Row Required):</p>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead><tr style={{ borderBottom: '1px solid #334155' }}>{['Student Name', 'Register Number', 'Team', 'Category', 'Gender'].map(h => <th key={h} style={{ padding: '4px 8px', textAlign: 'left', color: '#f8fafc', fontWeight: '600', fontSize: '11px' }}>{h}</th>)}</tr></thead>
                                  <tbody><tr><td style={{ padding: '4px 8px', color: '#cbd5e1', fontSize: '11px' }}>Ahmed Ali</td><td style={{ padding: '4px 8px', color: '#cbd5e1', fontSize: '11px' }}>101</td><td style={{ padding: '4px 8px', color: '#cbd5e1', fontSize: '11px' }}>Red Team</td><td style={{ padding: '4px 8px', color: '#cbd5e1', fontSize: '11px' }}>Junior</td><td style={{ padding: '4px 8px', color: '#cbd5e1', fontSize: '11px' }}>Boy / Girl</td></tr></tbody>
                                </table>
                                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '11px' }}>Team name &amp; Category name must exactly match your account settings.</p>
                              </div>
                              <label style={{ display: 'block', background: '#1e293b', border: '2px dashed #334155', borderRadius: '10px', padding: '18px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px' }}>
                                <input type='file' accept='.xlsx,.xls,.csv' onChange={handleExcelFileRead} style={{ display: 'none' }} />
                                <span style={{ color: '#86efac', fontSize: '28px' }}>📁</span>
                                <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '13px' }}>Click to choose Excel (.xlsx) or CSV file</p>
                              </label>
                              {bulkUploadData.length > 0 && (
                                <div style={{ marginBottom: '14px' }}>
                                  <p style={{ color: '#86efac', fontWeight: '700', fontSize: '13px', margin: '0 0 8px' }}>✅ {bulkUploadData.length} students found – preview:</p>
                                  <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #334155' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                      <thead><tr style={{ background: '#1e293b' }}>{['#', 'Name', 'Reg No', 'Team', 'Category', 'Gender'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                                      <tbody>
                                        {bulkUploadData.slice(0, 10).map((r, i) => (
                                          <tr key={i} style={{ background: i % 2 === 0 ? '#0f172a' : '#1e293b' }}>
                                            <td style={{ padding: '6px 10px', color: '#64748b' }}>{r._row}</td>
                                            <td style={{ padding: '6px 10px', color: '#f8fafc', fontWeight: '500' }}>{r.name}</td>
                                            <td style={{ padding: '6px 10px', color: '#f8fafc' }}>{r.regno}</td>
                                            <td style={{ padding: '6px 10px', color: '#fbbf24' }}>{r.teamName}</td>
                                            <td style={{ padding: '6px 10px', color: '#a78bfa' }}>{r.catName}</td>
                                            <td style={{ padding: '6px 10px', color: (r.gender || '').toUpperCase().startsWith('G') ? '#f472b6' : '#60a5fa' }}>{r.gender || 'Boy'}</td>
                                          </tr>
                                        ))}
                                        {bulkUploadData.length > 10 && <tr><td colSpan={6} style={{ padding: '8px 10px', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>...and {bulkUploadData.length - 10} more rows</td></tr>}
                                      </tbody>
                                    </table>
                                  </div>
                                  <button onClick={handleBulkUploadSubmit} disabled={bulkUploading} style={{ marginTop: '12px', width: '100%', padding: '14px', background: bulkUploading ? '#374151' : 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: bulkUploading ? 'not-allowed' : 'pointer' }}>
                                    {bulkUploading ? '⏳ Uploading...' : ('🚀 Upload ' + bulkUploadData.length + ' Students')}
                                  </button>
                                </div>
                              )}
                              {bulkUploadResult && (
                                <div style={{ borderRadius: '10px', overflow: 'hidden', marginTop: '10px' }}>
                                  <div style={{ background: '#16a34a', padding: '10px 14px', color: '#fff', fontWeight: '700', fontSize: '13px' }}>✅ {bulkUploadResult.success} students added successfully!</div>
                                  {bulkUploadResult.failed.length > 0 && (
                                    <div style={{ background: '#7f1d1d', padding: '10px 14px' }}>
                                      <p style={{ color: '#fca5a5', fontWeight: '700', margin: '0 0 6px', fontSize: '13px' }}>❌ {bulkUploadResult.failed.length} rows failed:</p>
                                      {bulkUploadResult.failed.map((f, fi) => <p key={fi} style={{ color: '#fca5a5', margin: '2px 0', fontSize: '12px' }}>Row {f.row}: {f.name} – {f.reason}</p>)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {/* BULK_UPLOAD_PANEL_END */}
                        <div style={{ marginTop: '20px' }}>
                          {(() => {
                            const filteredStudents = students.filter(s => {
                              const matchTeam = studentFilterTeam === 'ALL' || String(s.teamid || s.teamId || '') === String(studentFilterTeam);
                              const sCat = String(s.catid || s.catId || '');
                              const matchCat = studentFilterCat === 'ALL'
                                || (studentFilterCat === 'GENERAL' ? (sCat === '-1' || sCat === 'GENERAL' || generalCatIds.map(String).includes(sCat)) : sCat === String(studentFilterCat));
                              const matchGender = studentFilterGender === 'ALL' || (s.gender || '') === studentFilterGender;
                              return matchTeam && matchCat && matchGender;
                            });

                            const generateStudentsPDF = (mode) => {
                              const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                              const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                              const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';

                              let pdfTitle = 'Registered Students List';

                              // Build smart subtitle: team names + gender, no labels
                              let teamPart = '';
                              if (studentFilterTeam === 'ALL') {
                                teamPart = teams.map(t => t.name).join(' & ');
                              } else {
                                const tObj = teams.find(t => String(t.id) === String(studentFilterTeam));
                                teamPart = tObj ? tObj.name : '';
                              }
                              let genderPart = '';
                              if (studentFilterGender === 'BOY') genderPart = 'Boys';
                              else if (studentFilterGender === 'GIRL') genderPart = 'Girls';
                              else genderPart = 'Common';

                              const subtitle = [teamPart, genderPart].filter(Boolean).join(' | ');

                              let contentHtml = '';

                              if (mode === 'CATEGORIZED') {
                                // Group by category
                                const catsToShow = categories.filter(c => {
                                  return filteredStudents.some(s => String(s.catid || s.catId || '') === String(c.id));
                                });

                                if (catsToShow.length === 0) {
                                  contentHtml = '<p style="color:#94a3b8;text-align:center;padding:30px">No students found.</p>';
                                } else {
                                  contentHtml = catsToShow.map(cat => {
                                    const catStudents = filteredStudents.filter(s => String(s.catid || s.catId || '') === String(cat.id));
                                    const rows = catStudents.map((s, idx) => {
                                      const sRegNo = s.regno || s.regNo || '';
                                      return `<tr>
                                        <td>${idx + 1}</td>
                                        <td><strong>${sRegNo}</strong></td>
                                        <td>${s.name}</td>
                                        <td class="check-cell"></td>
                                      </tr>`;
                                    }).join('');

                                    return `
                                      <div class="cat-section">
                                        <div class="cat-heading">${cat.name}${cat.classrange ? ' <span class="cat-range">(Class: ' + cat.classrange + ')</span>' : ''}</div>
                                        <table>
                                          <thead>
                                            <tr>
                                              <th style="width: 8%">Sl.No</th>
                                              <th style="width: 20%">Reg. No</th>
                                              <th>Student Name</th>
                                              <th style="width: 12%">✓</th>
                                            </tr>
                                          </thead>
                                          <tbody>${rows}</tbody>
                                        </table>
                                      </div>`;
                                  }).join('');
                                }
                              } else {
                                // Simple list of currently filtered students
                                const rows = filteredStudents.map((s, idx) => {
                                  const sRegNo = s.regno || s.regNo || '';
                                  return `<tr>
                                    <td>${idx + 1}</td>
                                    <td><strong>${sRegNo}</strong></td>
                                    <td>${s.name}</td>
                                    <td class="check-cell"></td>
                                  </tr>`;
                                }).join('');

                                contentHtml = `
                                  <table>
                                    <thead>
                                      <tr>
                                        <th style="width: 8%">Sl.No</th>
                                        <th style="width: 18%">Reg. No</th>
                                        <th>Student Name</th>
                                        <th style="width: 12%">✓</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${rows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:30px">No students found matching current filters.</td></tr>'}
                                    </tbody>
                                  </table>`;
                              }

                              const printWindow = window.open('', '_blank');
                              printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>${pdfTitle} - ${madrasaName}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Serif+Malayalam:wght@400;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; }
  .notice-board {
    border: 4px solid #1e3a5f;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }
  .notice-header {
    background: linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%);
    color: white;
    text-align: center;
    padding: 28px 20px 20px;
    position: relative;
  }
  .notice-header::after {
    content: '';
    display: block;
    width: 80px;
    height: 3px;
    background: #f59e0b;
    margin: 12px auto 0;
    border-radius: 2px;
  }
  .madrasa-name {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .madrasa-sub {
    font-size: 13px;
    opacity: 0.85;
    letter-spacing: 0.5px;
  }
  .notice-title-bar {
    background: #f59e0b;
    color: #78350f;
    text-align: center;
    padding: 10px;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .notice-body { padding: 20px 25px 30px; }
  .cat-section { margin-bottom: 28px; }
  .cat-heading {
    background: linear-gradient(90deg, #1e3a5f, #2d6a4f);
    color: white;
    font-size: 14px;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 6px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cat-heading::before { content: '📂'; }
  .cat-range { font-size: 11px; opacity: 0.8; font-weight: 400; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th {
    background: #f1f5f9;
    color: #1e3a5f;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 8px 12px;
    text-align: left;
    border-bottom: 2px solid #cbd5e1;
  }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 13px;
    vertical-align: middle;
  }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f8fafc; }
  td strong { color: #1e40af; }
  .check-cell {
    border: 1.5px solid #94a3b8 !important;
    border-radius: 3px;
    background: #fff !important;
    min-width: 28px;
    height: 24px;
  }
  .footer {
    text-align: center;
    padding: 15px;
    font-size: 11px;
    color: #94a3b8;
    border-top: 1px solid #e2e8f0;
    margin-top: 10px;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  .print-btn {
    display: block;
    margin: 20px auto;
    padding: 12px 32px;
    background: linear-gradient(135deg, #1e3a5f, #2d6a4f);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.25);
  }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Print / Download PDF</button>
<div class="notice-board">
  <div class="notice-header">
    ${eventName ? `<div style="font-size:13px;font-weight:700;letter-spacing:2px;color:#fef08a;text-transform:uppercase;margin-bottom:2px;">${eventName}</div><div style="font-size:11px;color:#bbf7d0;letter-spacing:1px;font-weight:600;margin-bottom:6px;">Milad_fest${eventYear ? ' ' + eventYear : ''}</div>` : ''}
    <div class="madrasa-name">${madrasaName}</div>
    <div class="madrasa-sub">${madrasaPlace} | Reg. No: ${madrasaRegNo}</div>
  </div>
  <div class="notice-title-bar">🧑‍🎓 ${pdfTitle} — ${subtitle}</div>
  <div class="notice-body">
    ${contentHtml}
  </div>
  <div class="footer">Generated by Milad Fest App • Total Students: ${filteredStudents.length}</div>
</div>
</body></html>`);
                              printWindow.document.close();
                              printWindow.print();
                            };

                            return (
                              <>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>📜 Registered Students ({filteredStudents.length})</h3>

                                {/* 🔍 Interactive Filters */}
                                <div className="student-filters-container" style={{ border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', padding: '14px', marginBottom: '16px' }}>
                                  {/* 1. Team Filter */}
                                  <div style={{ marginBottom: '10px' }}>
                                    <div className="filter-section-title">🚩 Select Team</div>
                                    <div className="filter-chips-wrapper">
                                      <div
                                        className={`filter-chip-box ${studentFilterTeam === 'ALL' ? 'active' : ''}`}
                                        onClick={() => setStudentFilterTeam('ALL')}
                                      >
                                        👥 All
                                      </div>
                                      {teams.map(t => (
                                        <div
                                          key={t.id}
                                          className={`filter-chip-box ${String(studentFilterTeam) === String(t.id) ? 'active' : ''}`}
                                          onClick={() => setStudentFilterTeam(t.id)}
                                        >
                                          {t.name}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* 2. Category Filter */}
                                  <div style={{ marginBottom: '10px' }}>
                                    <div className="filter-section-title">📂 Select Category</div>
                                    <div className="filter-chips-wrapper">
                                      <div
                                        className={`filter-chip-box ${studentFilterCat === 'ALL' ? 'active' : ''}`}
                                        onClick={() => setStudentFilterCat('ALL')}
                                      >
                                        📁 All
                                      </div>
                                      {categories.map(c => (
                                        <div
                                          key={c.id}
                                          className={`filter-chip-box ${String(studentFilterCat) === String(c.id) ? 'active' : ''}`}
                                          onClick={() => setStudentFilterCat(c.id)}
                                        >
                                          {c.name}
                                        </div>
                                      ))}
                                      {generalCatIds.length > 0 && (
                                        <div
                                          className={`filter-chip-box ${studentFilterCat === 'GENERAL' ? 'active' : ''}`}
                                          onClick={() => setStudentFilterCat('GENERAL')}
                                          style={{ background: studentFilterCat === 'GENERAL' ? 'linear-gradient(135deg,#d97706,#b45309)' : '', fontWeight: '800', letterSpacing: '1px' }}
                                        >
                                          🌟 GENERAL
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* 3. Gender Filter */}
                                  <div>
                                    <div className="filter-section-title">👦/👧 Select Gender</div>
                                    <div className="filter-chips-wrapper">
                                      <div
                                        className={`filter-chip-box ${studentFilterGender === 'ALL' ? 'active' : ''}`}
                                        onClick={() => setStudentFilterGender('ALL')}
                                      >
                                        👥 All
                                      </div>
                                      <div
                                        className={`filter-chip-box ${studentFilterGender === 'BOY' ? 'active-boy' : ''}`}
                                        onClick={() => setStudentFilterGender('BOY')}
                                      >
                                        👦 Boys
                                      </div>
                                      <div
                                        className={`filter-chip-box ${studentFilterGender === 'GIRL' ? 'active-girl' : ''}`}
                                        onClick={() => setStudentFilterGender('GIRL')}
                                      >
                                        👧 Girls
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* PDF Download buttons for Students */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', marginBottom: '16px' }}>
                                  <button
                                    onClick={() => generateStudentsPDF('FILTERED')}
                                    style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--primary-deep))', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                                  >
                                    📄 Download PDF (Current Filter)
                                  </button>
                                  <button
                                    onClick={() => generateStudentsPDF('CATEGORIZED')}
                                    style={{ background: 'linear-gradient(135deg, #022c22, #064e3b)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                                  >
                                    📂 Download PDF by Categories
                                  </button>
                                </div>

                                {/* 📜 Student List */}
                                <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                                  {students.length === 0 ? (
                                    <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No students registered.</p>
                                  ) : filteredStudents.length === 0 ? (
                                    <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No students found matching the selected filters.</p>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {filteredStudents.map(s => {
                                        const sRegNo = s.regno || s.regNo || '';
                                        const sTeamId = s.teamid || s.teamId || '';
                                        const sCatId = s.catid || s.catId || '';
                                        const teamObj = teams.find(t => String(t.id) === String(sTeamId));
                                        const catObj = categories.find(c => String(c.id) === String(sCatId));

                                        return (
                                          <div key={s.id} className={`settings-item-row-v2 ${editingStudentId === s.id ? 'editing' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                                            {editingStudentId === s.id ? (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <input type="text" className="settings-input-v2" value={editingStudentData.name || ''} onChange={e => setEditingStudentData({ ...editingStudentData, name: e.target.value })} placeholder="Name" />
                                                <input type="text" className="settings-input-v2" value={editingStudentData.regno || editingStudentData.regNo || ''} onChange={e => setEditingStudentData({ ...editingStudentData, regno: e.target.value, regNo: e.target.value })} placeholder="Register Number" />

                                                <select className="settings-input-v2" value={editingStudentData.teamid || editingStudentData.teamId || ''} onChange={e => setEditingStudentData({ ...editingStudentData, teamid: e.target.value, teamId: e.target.value })}>
                                                  <option value="">Select Team</option>
                                                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>

                                                <select className="settings-input-v2" value={editingStudentData.catid && editingStudentData.gender ? `${editingStudentData.catid || editingStudentData.catId}_${editingStudentData.gender}` : ''} onChange={e => {
                                                  const val = e.target.value;
                                                  if (val) {
                                                    const [cId, g] = val.split('_');
                                                    setEditingStudentData({ ...editingStudentData, catid: cId, catId: cId, gender: g });
                                                  }
                                                }}>
                                                  <option value="">Select Category & Gender</option>
                                                  {categories.map(c => (
                                                    <React.Fragment key={c.id}>
                                                      <option value={`${c.id}_BOY`}>{c.name} - Boy</option>
                                                      <option value={`${c.id}_GIRL`}>{c.name} - Girl</option>
                                                    </React.Fragment>
                                                  ))}
                                                  {generalCatIds.length > 0 && (
                                                    <React.Fragment>
                                                      <option value="GENERAL_BOY">GENERAL - Boys</option>
                                                      <option value="GENERAL_GIRL">GENERAL - Girls</option>
                                                    </React.Fragment>
                                                  )}
                                                </select>

                                                <div className="action-buttons-group">
                                                  <button onClick={handleSaveStudentEdit} className="btn-premium-action-small primary">Save</button>
                                                  <button onClick={() => setEditingStudentId(null)} className="btn-premium-action-small secondary">Cancel</button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                  <span style={{
                                                    background: s.gender === 'BOY' ? '#dbeafe' : '#fce7f3',
                                                    color: s.gender === 'BOY' ? '#1e40af' : '#be185d',
                                                    borderRadius: '8px', padding: '4px 10px', fontWeight: '800', fontSize: '13px',
                                                    border: `1px solid ${s.gender === 'BOY' ? '#93c5fd' : '#f9a8d4'}`
                                                  }}>{sRegNo}</span>
                                                  <div>
                                                    <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{s.name} {s.gender === 'BOY' ? '👦' : '👧'}</span>
                                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>
                                                      Group: {teamObj ? teamObj.name : 'Unknown'} | Cat: {catObj ? catObj.name : 'Unknown'}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div>
                                                  <button onClick={() => startEditStudent(s)} className="btn-row-action-v2 edit" title="Edit">✏️</button>
                                                  <button onClick={() => handleDeleteStudent(s.id)} className="btn-row-action-v2 delete" title="Delete">❌</button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* PROGRAMS SUB-TAB */}
                    {settingsSubTab === 'PROGRAMS' && (
                      <div className="settings-card-v2">
                        <div className="settings-form-box-v2">
                          <h3>🏆 Add New Program</h3>
                          <form onSubmit={handleAddProgram} className="settings-form">
                            <input type="text" className="settings-input-v2" placeholder="Program Name (eg: Speech)" value={newProgName} onChange={(e) => setNewProgName(e.target.value)} required />
                            <input type="text" className="settings-input-v2" placeholder="Program Code (eg: P101)" value={newProgCode} onChange={(e) => setNewProgCode(e.target.value)} required />

                            <select className="settings-input-v2" value={selectedProgCat && progGender ? `${selectedProgCat}_${progGender}` : ''} onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                const [cId, g] = val.split('_');
                                setSelectedProgCat(cId);
                                setProgGender(g);
                              } else {
                                setSelectedProgCat('');
                              }
                            }} required>
                              <option value="">Select Category & Gender</option>
                              {categories.map(c => (
                                <React.Fragment key={c.id}>
                                  <option value={`${c.id}_BOY`}>{c.name} - Boys</option>
                                  <option value={`${c.id}_GIRL`}>{c.name} - Girls</option>
                                  <option value={`${c.id}_COMMON`}>{c.name} - Common</option>
                                </React.Fragment>
                              ))}
                              <React.Fragment>
                                <option value="GENERAL_BOY">GENERAL - Boys</option>
                                <option value="GENERAL_GIRL">GENERAL - Girls</option>
                                <option value="GENERAL_COMMON">GENERAL - Common</option>
                              </React.Fragment>
                            </select>

                            <select className="settings-input-v2" value={progType} onChange={(e) => setProgType(e.target.value)}>
                              <option value="SINGLE">SINGLE (Individual)</option>
                              <option value="GROUP">GROUP (Group Event)</option>
                              <option value="TEAM">TEAM (Team Event)</option>
                            </select>

                            <button type="submit" className="btn-premium-action">Add Program</button>
                          </form>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                          <div className="settings-list-box" style={{ maxHeight: 'none' }}>
                            {(() => {
                              // isGeneralProg is defined at component level (useCallback) — accessible here via closure

                              // Filtered programs based on selected category chip + gender chip
                              const genderMatch = (p) => {
                                if (programFilterGender === 'ALL') return true;
                                const t = (p.type || '').toUpperCase();
                                if (programFilterGender === 'BOY') return t.includes('BOY');
                                if (programFilterGender === 'GIRL') return t.includes('GIRL');
                                if (programFilterGender === 'COMMON') return !t.includes('BOY') && !t.includes('GIRL');
                                return true;
                              };
                              const filteredPrograms = (programFilterCat === 'ALL'
                                ? programs
                                : programFilterCat === 'GENERAL'
                                  ? programs.filter(isGeneralProg)
                                  : programs.filter(p => String(p.catid || p.catId || '') === String(programFilterCat))
                              ).filter(genderMatch);

                              // PDF generator function
                              const generateProgramsPDF = (catIdFilter) => {
                                const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                                const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                                const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';

                                // Apply the currently active gender filter to any program list
                                const pdfGenderMatch = (p) => {
                                  if (programFilterGender === 'ALL') return true;
                                  const t = (p.type || '').toUpperCase();
                                  if (programFilterGender === 'BOY') return t.includes('BOY');
                                  if (programFilterGender === 'GIRL') return t.includes('GIRL');
                                  if (programFilterGender === 'COMMON') return !t.includes('BOY') && !t.includes('GIRL');
                                  return true;
                                };

                                const pdfGenderLabel = programFilterGender === 'BOY' ? ' — Boys' : programFilterGender === 'GIRL' ? ' — Girls' : programFilterGender === 'COMMON' ? ' — Common' : '';

                                let catSections = '';
                                let pdfTotalCount = 0;

                                if (catIdFilter === 'ALL' || catIdFilter === 'GENERAL') {
                                  // 1. Standard DB Categories (for ALL)
                                  if (catIdFilter === 'ALL') {
                                    categories.forEach(cat => {
                                      const catProgs = programs.filter(p => String(p.catid || p.catId || '') === String(cat.id)).filter(pdfGenderMatch);
                                      if (catProgs.length === 0) return;
                                      pdfTotalCount += catProgs.length;
                                      const rows = catProgs.map(p => {
                                        const divLabel = (p.type || '').includes('BOY') ? 'Boys' : (p.type || '').includes('GIRL') ? 'Girls' : 'Common';
                                        const typeLabel = (p.type || '').includes('GROUP') ? 'Group' : 'Single';
                                        return `<tr><td>${p.code}</td><td>${p.name}</td><td>${divLabel}</td><td>${typeLabel}</td></tr>`;
                                      }).join('');
                                      catSections += `
                                      <div class="cat-section">
                                        <div class="cat-heading">${cat.name}${cat.classrange ? ' <span class="cat-range">(Class: ' + cat.classrange + ')</span>' : ''}</div>
                                        <table>
                                          <thead><tr><th>Code</th><th>Program Name</th><th>Gender</th><th>Type</th></tr></thead>
                                          <tbody>${rows}</tbody>
                                        </table>
                                      </div>`;
                                    });
                                  }

                                  // 2. GENERAL Category section (for ALL or GENERAL)
                                  const genProgs = programs.filter(isGeneralProg).filter(pdfGenderMatch);

                                  if (genProgs.length > 0) {
                                    if (catIdFilter === 'GENERAL') pdfTotalCount = genProgs.length;
                                    else if (catIdFilter === 'ALL' && !categories.some(c => genProgs.every(p => String(p.catid || p.catId || '') === String(c.id)))) {
                                      // add standalone general progs count
                                      const standaloneGen = genProgs.filter(p => !categories.some(c => String(c.id) === String(p.catid || p.catId || '')));
                                      pdfTotalCount += standaloneGen.length;
                                    }
                                    const rows = genProgs.map(p => {
                                      const divLabel = (p.type || '').includes('BOY') ? 'Boys' : (p.type || '').includes('GIRL') ? 'Girls' : 'Common';
                                      const typeLabel = (p.type || '').includes('GROUP') ? 'Group' : 'Single';
                                      return `<tr><td>${p.code}</td><td>${p.name}</td><td>${divLabel}</td><td>${typeLabel}</td></tr>`;
                                    }).join('');
                                    catSections += `
                                    <div class="cat-section">
                                      <div class="cat-heading">GENERAL</div>
                                      <table>
                                        <thead><tr><th>Code</th><th>Program Name</th><th>Gender</th><th>Type</th></tr></thead>
                                        <tbody>${rows}</tbody>
                                      </table>
                                    </div>`;
                                  }
                                } else {
                                  const cat = categories.find(c => String(c.id) === String(catIdFilter));
                                  const catProgs = programs.filter(p => String(p.catid || p.catId || '') === String(catIdFilter)).filter(pdfGenderMatch);
                                  if (catProgs.length > 0 && cat) {
                                    pdfTotalCount = catProgs.length;
                                    const rows = catProgs.map(p => {
                                      const divLabel = (p.type || '').includes('BOY') ? 'Boys' : (p.type || '').includes('GIRL') ? 'Girls' : 'Common';
                                      const typeLabel = (p.type || '').includes('GROUP') ? 'Group' : 'Single';
                                      return `<tr><td>${p.code}</td><td>${p.name}</td><td>${divLabel}</td><td>${typeLabel}</td></tr>`;
                                    }).join('');
                                    catSections += `
                                    <div class="cat-section">
                                      <div class="cat-heading">${cat.name}${cat.classrange ? ' <span class="cat-range">(Class: ' + cat.classrange + ')</span>' : ''}</div>
                                      <table>
                                        <thead><tr><th>Code</th><th>Program Name</th><th>Gender</th><th>Type</th></tr></thead>
                                        <tbody>${rows}</tbody>
                                      </table>
                                    </div>`;
                                  }
                                }

                                const printWindow = window.open('', '_blank');
                                printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Programs List - ${madrasaName}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Serif+Malayalam:wght@400;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; }
  .notice-board {
    border: 4px solid #1e3a5f;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 30px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }
  .notice-header {
    background: linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%);
    color: white;
    text-align: center;
    padding: 28px 20px 20px;
    position: relative;
  }
  .notice-header::after {
    content: '';
    display: block;
    width: 80px;
    height: 3px;
    background: #f59e0b;
    margin: 12px auto 0;
    border-radius: 2px;
  }
  .madrasa-name {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .madrasa-sub {
    font-size: 13px;
    opacity: 0.85;
    letter-spacing: 0.5px;
  }
  .notice-title-bar {
    background: #f59e0b;
    color: #78350f;
    text-align: center;
    padding: 10px;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .notice-body { padding: 20px 25px 30px; }
  .cat-section { margin-bottom: 28px; }
  .cat-heading {
    background: linear-gradient(90deg, #1e3a5f, #2d6a4f);
    color: white;
    font-size: 14px;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 6px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cat-heading::before { content: '📂'; }
  .cat-range { font-size: 11px; opacity: 0.8; font-weight: 400; }
  table { width: 100%; border-collapse: collapse; }
  th {
    background: #f1f5f9;
    color: #1e3a5f;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 8px 12px;
    text-align: left;
    border-bottom: 2px solid #cbd5e1;
  }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 13px;
    vertical-align: middle;
  }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f8fafc; }
  td:first-child { font-weight: 700; color: #1e40af; }
  .footer {
    text-align: center;
    padding: 15px;
    font-size: 11px;
    color: #94a3b8;
    border-top: 1px solid #e2e8f0;
    margin-top: 10px;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  .print-btn {
    display: block;
    margin: 20px auto;
    padding: 12px 32px;
    background: linear-gradient(135deg, #1e3a5f, #2d6a4f);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Print / Download PDF</button>
<div class="notice-board">
  <div class="notice-header">
    ${eventName ? `<div style="font-size:13px;font-weight:700;letter-spacing:2px;color:#fef08a;text-transform:uppercase;margin-bottom:2px;">${eventName}</div><div style="font-size:11px;color:#bbf7d0;letter-spacing:1px;font-weight:600;margin-bottom:6px;">Milad_fest${eventYear ? ' ' + eventYear : ''}</div>` : ''}
    <div class="madrasa-name">${madrasaName}</div>
    <div class="madrasa-sub">${madrasaPlace} | Reg. No: ${madrasaRegNo}</div>
  </div>
  <div class="notice-title-bar">🏆 Programs List — ${catIdFilter === 'ALL' ? 'All Categories' : catIdFilter === 'GENERAL' ? 'GENERAL' : (categories.find(c => String(c.id) === String(catIdFilter)) || {}).name || ''}${pdfGenderLabel}</div>
  <div class="notice-body">
    ${catSections || '<p style="color:#94a3b8;text-align:center;padding:30px">No programs found.</p>'}
  </div>
  <div class="footer">Generated by Milad Fest App • Total Programs: ${pdfTotalCount}</div>
</div>
</body></html>`);
                                printWindow.document.close();
                                printWindow.print();
                              };

                              return (
                                <>
                                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>📜 Programs ({programs.length})</h3>

                                  {/* Category filter chips */}
                                  <div className="student-filters-container" style={{ border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', padding: '14px', marginBottom: '16px' }}>
                                    <div>
                                      <div className="filter-section-title">📂 Filter by Category</div>
                                      <div className="filter-chips-wrapper">
                                        <div
                                          className={`filter-chip-box ${programFilterCat === 'ALL' ? 'active' : ''}`}
                                          onClick={() => setProgramFilterCat('ALL')}
                                        >
                                          📁 All
                                        </div>
                                        {categories.map(c => (
                                          <div
                                            key={c.id}
                                            className={`filter-chip-box ${String(programFilterCat) === String(c.id) ? 'active' : ''}`}
                                            onClick={() => setProgramFilterCat(c.id)}
                                          >
                                            {c.name}
                                          </div>
                                        ))}
                                        <div
                                          className={`filter-chip-box ${programFilterCat === 'GENERAL' ? 'active' : ''}`}
                                          onClick={() => setProgramFilterCat('GENERAL')}
                                          style={{
                                            background: programFilterCat === 'GENERAL' ? 'linear-gradient(135deg,#d97706,#b45309)' : '',
                                            color: programFilterCat === 'GENERAL' ? '#fff' : '',
                                            fontWeight: '800',
                                            letterSpacing: '1px'
                                          }}
                                        >
                                          🌟 GENERAL
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Gender filter chips */}
                                  <div style={{ marginTop: '10px' }}>
                                    <div className="filter-section-title">⚧ Filter by Gender</div>
                                    <div className="filter-chips-wrapper">
                                      {[
                                        { key: 'ALL', label: '🔀 All' },
                                        { key: 'BOY', label: '👦 Boys' },
                                        { key: 'GIRL', label: '👧 Girls' },
                                        { key: 'COMMON', label: '🚻 Common' },
                                      ].map(({ key, label }) => (
                                        <div
                                          key={key}
                                          className={`filter-chip-box ${programFilterGender === key ? 'active' : ''}`}
                                          onClick={() => setProgramFilterGender(key)}
                                          style={
                                            key === 'BOY' && programFilterGender === 'BOY'
                                              ? { background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: '#fff' }
                                              : key === 'GIRL' && programFilterGender === 'GIRL'
                                                ? { background: 'linear-gradient(135deg,#be185d,#9d174d)', color: '#fff' }
                                                : key === 'COMMON' && programFilterGender === 'COMMON'
                                                  ? { background: 'linear-gradient(135deg,#0f766e,#115e59)', color: '#fff' }
                                                  : {}
                                          }
                                        >
                                          {label}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* PDF Download buttons */}

                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', marginBottom: '16px' }}>
                                    <button
                                      onClick={() => generateProgramsPDF('ALL')}
                                      style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--primary-deep))', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                                    >
                                      📄 All Programs PDF
                                    </button>
                                    {categories.map(c => {
                                      const hasProgs = programs.some(p => String(p.catid || p.catId || '') === String(c.id));
                                      if (!hasProgs) return null;
                                      return (
                                        <button
                                          key={c.id}
                                          onClick={() => generateProgramsPDF(c.id)}
                                          style={{ background: 'linear-gradient(135deg, #022c22, #064e3b)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                                        >
                                          📄 {c.name}
                                        </button>
                                      );
                                    })}
                                    <button
                                      key="GENERAL"
                                      onClick={() => generateProgramsPDF('GENERAL')}
                                      style={{ background: 'linear-gradient(135deg, #b45309, #78350f)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                                    >
                                      📄 GENERAL
                                    </button>
                                  </div>

                                  {/* Programs grouped by category */}
                                  <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {(() => {
                                      const dbCatsToShow = programFilterCat === 'ALL'
                                        ? categories.filter(c => filteredPrograms.some(p => String(p.catid || p.catId || '') === String(c.id)))
                                        : programFilterCat === 'GENERAL'
                                          ? []
                                          : categories.filter(c => String(c.id) === String(programFilterCat));

                                      const standaloneGenProgs = filteredPrograms.filter(p => isGeneralProg(p));

                                      const showGeneralBlock = (programFilterCat === 'ALL' && standaloneGenProgs.length > 0) || programFilterCat === 'GENERAL';

                                      if (dbCatsToShow.length === 0 && !showGeneralBlock) {
                                        return (
                                          <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                                            {programs.length === 0 ? 'No programs added.' : 'No programs in this category.'}
                                          </p>
                                        );
                                      }

                                      const renderProgRow = (p) => (
                                        <div key={p.id} className={`settings-item-row-v2 ${editingProgId === p.id ? 'editing' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                                          {editingProgId === p.id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                              <input type="text" className="settings-input-v2" value={editingProgData.name || ''} onChange={e => setEditingProgData({ ...editingProgData, name: e.target.value })} placeholder="Name" />
                                              <input type="text" className="settings-input-v2" value={editingProgData.code || ''} onChange={e => setEditingProgData({ ...editingProgData, code: e.target.value })} placeholder="Code" />

                                              <select className="settings-input-v2" value={editingProgData.catid ? `${editingProgData.catid || editingProgData.catId}_${(editingProgData.type || '').includes('BOY') ? 'BOY' : (editingProgData.type || '').includes('GIRL') ? 'GIRL' : 'COMMON'}` : ''} onChange={e => {
                                                const val = e.target.value;
                                                if (val) {
                                                  const [cId, g] = val.split('_');
                                                  const baseType = (editingProgData.type || '').split('_')[0] || 'SINGLE';
                                                  setEditingProgData({ ...editingProgData, catid: cId, catId: cId, type: `${baseType}_${g}` });
                                                }
                                              }}>
                                                <option value="">Select Category & Division</option>
                                                {categories.map(c => (
                                                  <React.Fragment key={c.id}>
                                                    <option value={`${c.id}_BOY`}>{c.name} - Boys</option>
                                                    <option value={`${c.id}_GIRL`}>{c.name} - Girls</option>
                                                    <option value={`${c.id}_COMMON`}>{c.name} - Common</option>
                                                  </React.Fragment>
                                                ))}
                                                <React.Fragment>
                                                  <option value="GENERAL_BOY">GENERAL - Boys</option>
                                                  <option value="GENERAL_GIRL">GENERAL - Girls</option>
                                                  <option value="GENERAL_COMMON">GENERAL - Common</option>
                                                </React.Fragment>
                                              </select>

                                              <select className="settings-input-v2" value={(editingProgData.type || '').split('_')[0] || 'SINGLE'} onChange={e => {
                                                const g = (editingProgData.type || '').includes('BOY') ? 'BOY' : (editingProgData.type || '').includes('GIRL') ? 'GIRL' : 'COMMON';
                                                setEditingProgData({ ...editingProgData, type: `${e.target.value}_${g}` });
                                              }}>
                                                <option value="SINGLE">SINGLE</option>
                                                <option value="GROUP">GROUP</option>
                                              </select>

                                              <div className="action-buttons-group">
                                                <button onClick={handleSaveProgEdit} className="btn-premium-action-small primary">Save</button>
                                                <button onClick={() => setEditingProgId(null)} className="btn-premium-action-small secondary">Cancel</button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{
                                                  background: 'var(--dash-bg)',
                                                  color: 'var(--primary-deep)',
                                                  borderRadius: '8px', padding: '4px 10px', fontWeight: '800', fontSize: '13px',
                                                  border: '1px solid #cbd5e1'
                                                }}>{p.code}</span>
                                                <div>
                                                  <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{p.name}</span>
                                                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>
                                                    Gender: {(p.type || '').includes('BOY') ? 'Boys 👦' : (p.type || '').includes('GIRL') ? 'Girls 👧' : 'Common 🚻'} | Type: {(p.type || '').includes('GROUP') ? 'Group 👥' : 'Single 👤'}
                                                  </div>
                                                </div>
                                              </div>
                                              <div>
                                                <button onClick={() => { setEditingProgId(p.id); setEditingProgData({ ...p }); }} className="btn-row-action-v2 edit" title="Edit">✏️</button>
                                                <button onClick={() => handleDeleteProgram(p.id)} className="btn-row-action-v2 delete" title="Delete">❌</button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );

                                      return (
                                        <>
                                          {dbCatsToShow.map(cat => {
                                            const catProgs = filteredPrograms.filter(p => String(p.catid || p.catId || '') === String(cat.id));
                                            if (catProgs.length === 0) return null;
                                            return (
                                              <div key={cat.id} style={{ marginTop: '16px' }}>
                                                {/* Category heading */}
                                                <div style={{
                                                  background: 'linear-gradient(90deg, var(--primary-deep), var(--primary-light))',
                                                  color: 'white',
                                                  padding: '10px 14px',
                                                  borderRadius: '8px',
                                                  fontWeight: '700',
                                                  fontSize: '13px',
                                                  marginBottom: '10px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '8px',
                                                  boxShadow: '0 2px 6px rgba(6, 78, 59, 0.12)'
                                                }}>
                                                  📂 {cat.name}
                                                  {cat.classrange && <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: '400' }}>(Class: {cat.classrange})</span>}
                                                  <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '2px 10px', fontSize: '11px' }}>{catProgs.length} programs</span>
                                                </div>
                                                {/* Programs in this category */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                  {catProgs.map(renderProgRow)}
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {showGeneralBlock && (
                                            <div key="GENERAL" style={{ marginTop: '16px' }}>
                                              {/* Category heading */}
                                              <div style={{
                                                background: 'linear-gradient(90deg, #b45309, #d97706)',
                                                color: 'white',
                                                padding: '10px 14px',
                                                borderRadius: '8px',
                                                fontWeight: '700',
                                                fontSize: '13px',
                                                marginBottom: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: '0 2px 6px rgba(180, 83, 9, 0.2)'
                                              }}>
                                                🌟 GENERAL
                                                <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '2px 10px', fontSize: '11px' }}>{standaloneGenProgs.length} programs</span>
                                              </div>
                                              {/* Programs in GENERAL */}
                                              {standaloneGenProgs.length === 0 ? (
                                                <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                                                  No general programs added yet. Use "Add New Program" form above with GENERAL category.
                                                </p>
                                              ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                  {standaloneGenProgs.map(renderProgRow)}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* REGISTER SUB-TAB */}
                    {settingsSubTab === 'REGISTER' && (() => {
                      // ── Single Registration Data Filters ──
                      const regCatObj = categories.find(c => String(c.id) === String(regTabCat));
                      const isRegGeneral = regCatObj && regCatObj.name.toLowerCase().includes('general');

                      const regStudentsFiltered = regTabCat ? students.filter(s => {
                        if (regTabGender !== 'COMMON' && s.gender !== regTabGender) return false;
                        if (regTabCat === 'GENERAL') {
                          return generalCatIds.map(String).includes(String(s.catid || s.catId || ''));
                        }
                        if (isRegGeneral) return true;
                        return String(s.catid || s.catId || '') === String(regTabCat);
                      }) : [];

                      // Only show SINGLE programs in Single Registration mode
                      const regPrograms = regTabCat ? programs.filter(p => {
                        const pt = p.type || '';
                        if (pt.includes('GROUP')) return false;

                        const isGeneral = isGeneralProg(p);
                        let catMatch = false;
                        if (regTabCat === 'GENERAL') {
                          catMatch = isGeneral;
                        } else if (isRegGeneral) {
                          catMatch = isGeneral || String(p.catid || p.catId || '') === String(regTabCat);
                        } else {
                          catMatch = String(p.catid || p.catId || '') === String(regTabCat) || isGeneral;
                        }
                        if (!catMatch) return false;

                        if (regTabGender === 'COMMON') return true;
                        if (pt.includes('COMMON')) return true;
                        if (regTabGender === 'BOY' && (pt.includes('BOY') || pt.includes('BOYS'))) return true;
                        if (regTabGender === 'GIRL' && (pt.includes('GIRL') || pt.includes('GIRLS'))) return true;
                        return false;
                      }) : [];

                      const selectedStudentObj = findStudentByRef(regTabStudent);

                      const handleSaveRegistrations = async () => {
                        if (!regTabStudent) { alert(t('alertPleaseSelectStudent')); return; }
                        setRegTabSaving(true);
                        try {
                          const madrasaId = loggedInMadrasa.regNumber;
                          const studentObj = selectedStudentObj || students.find(s => String(s.id) === String(regTabStudent));
                          if (!studentObj) {
                            alert(t('alertStudentNotFound'));
                            setRegTabSaving(false);
                            return;
                          }

                          const sDbId = String(studentObj.id);
                          const sRegNo = String(studentObj.regno || studentObj.regNo || '');

                          // Collect string representations of matching student IDs to delete in ONE atomic query
                          const idsToDelete = Array.from(new Set([
                            sDbId,
                            ...(sRegNo ? [sRegNo] : [])
                          ])).filter(Boolean).map(String);

                          const targetIdToInsert = sRegNo ? sRegNo : sDbId;

                          // Normalize checked programs to database IDs, prioritizing student's category programs
                          const sCatId = studentObj.catid || studentObj.catId || studentObj.category || '';
                          const normalizedCheckedProgs = Array.from(new Set(regTabCheckedProgs.map(pId => {
                            const pObj = regPrograms.find(p => String(p.id) === String(pId) || String(p.code) === String(pId)) ||
                                         programs.find(p => (String(p.catid || p.catId || '') === String(sCatId)) && (String(p.id) === String(pId) || String(p.code) === String(pId) || String(p.name || '').toLowerCase() === String(pId).toLowerCase())) ||
                                         programs.find(p => String(p.id) === String(pId) || String(p.code) === String(pId) || String(p.name || '').toLowerCase() === String(pId).toLowerCase());
                            return pObj ? String(pObj.id) : String(pId);
                          })));

                          // Build optimistic local entries using normalized IDs
                          const otherRegs = programRegistrations.filter(r => !idsToDelete.some(id => String(r.student_id) === String(id)));
                          const newLocalEntries = normalizedCheckedProgs.map(pId => {
                            const pObj = programs.find(p => String(p.id) === String(pId));
                            return {
                              id: 'temp_reg_' + Date.now() + '_' + Math.random(),
                              madrasa_id: madrasaId,
                              student_id: targetIdToInsert,
                              program_name: String(pObj ? pObj.name : pId),
                              program_id: String(pObj ? pObj.id : pId)
                            };
                          });
                          const mappedOptimistic = [...otherRegs, ...newLocalEntries];

                          // 🔒 VERIFIED SAVE FLOW: Perform DB operations first, confirm DB success, then update React state & cache
                          try {
                            const numMadrasaId = parseInt(madrasaId, 10);
                            const isMIdNum = !isNaN(numMadrasaId) && String(numMadrasaId) === String(madrasaId).trim();
                            const mIds = isMIdNum ? [madrasaId, numMadrasaId] : [madrasaId];

                            if (idsToDelete.length > 0) {
                              for (const idVal of idsToDelete) {
                                await supabase
                                  .from('program_registrations')
                                  .delete()
                                  .in('madrasa_id', Array.from(new Set(mIds)))
                                  .eq('student_id', idVal);
                              }
                            }

                            if (normalizedCheckedProgs.length > 0) {
                              const buildRows = (mId, sId) => normalizedCheckedProgs.map(pId => {
                                const pObj = programs.find(p => String(p.id) === String(pId) || String(p.code) === String(pId));
                                const progCodeOrId = pObj ? String(pObj.code || pObj.id) : String(pId);
                                return {
                                  madrasa_id: String(mId),
                                  student_id: String(sId),
                                  program_name: progCodeOrId
                                };
                              });

                              const rowsToInsert = buildRows(madrasaId, targetIdToInsert);
                              const { error: insErr } = await supabase.from('program_registrations').insert(rowsToInsert);
                              if (insErr) {
                                throw new Error(insErr.message);
                              }
                            }

                            // Update local state & LocalStorage cache AFTER DB confirmation
                            fetchReqIdRef.current++;
                            regTabDirtyRef.current = false;
                            setProgramRegistrations(mappedOptimistic);
                            setRegTabCheckedProgs(normalizedCheckedProgs);

                            safeSetLocalStorage(`cached_regs_${madrasaId}`, JSON.stringify(mappedOptimistic));
                            safeSetLocalStorage(`cached_data_${madrasaId}`, (rawCache) => {
                              let cacheObj = {};
                              try { cacheObj = JSON.parse(rawCache) || {}; } catch(e){}
                              cacheObj.programRegistrations = mappedOptimistic;
                              cacheObj.savedAt = new Date().toISOString();
                              return JSON.stringify(cacheObj);
                            });

                            alert(t('alertSavedRegistrations')
                              .replace('{count}', normalizedCheckedProgs.length)
                              .replace('{studentName}', studentObj?.name || '')
                            );
                          } catch (dbErr) {
                            alert(t('alertUploadFailed') + getFriendlyErrorMessage(dbErr.message));
                            if (loggedInMadrasa) fetchSupabaseData(loggedInMadrasa.regNumber);
                          } finally {
                            setRegTabSaving(false);
                          }
                        } catch (err) {
                          alert(t('alertUploadFailed') + getFriendlyErrorMessage(err.message));
                          setRegTabSaving(false);
                        }
                      };

                      const handleDownloadRegSummaryPDF = () => {
                        const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                        const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                        const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';

                        const catName = regCatObj ? regCatObj.name : (regTabCat === 'GENERAL' ? 'GENERAL' : '');

                        let genderLabel = '';
                        if (regTabGender === 'BOY') genderLabel = lang === 'EN' ? 'Boys' : 'ആൺകുട്ടികൾ';
                        else if (regTabGender === 'GIRL') genderLabel = lang === 'EN' ? 'Girls' : 'പെൺകുട്ടികൾ';
                        else genderLabel = lang === 'EN' ? 'All' : 'എല്ലാവരും';

                        const subtitle = `${catName} | ${genderLabel}`;

                        const rows = regStudentsFiltered.map((s, idx) => {
                          const sRegNo = s.regno || s.regNo || '';
                          const sProgs = getStudentRegisteredPrograms(s.id);

                          const sGroupProgs = groupRegistrations
                            .filter(g => {
                              const studentIds = Array.isArray(g.student_ids) ? g.student_ids : [];
                              return studentIds.map(String).includes(String(s.id));
                            })
                            .map(g => programs.find(pr => String(pr.id) === String(g.program_id)))
                            .filter(Boolean);

                          const progsText = sProgs.length > 0
                            ? sProgs.map(p => `<span class="prog-badge">${p.code} – ${p.name}</span>`).join(' ')
                            : `<span class="no-prog">${lang === 'EN' ? 'No single programs' : 'സിംഗിൾ പ്രോഗ്രാമുകൾ ഇല്ല'}</span>`;

                          const groupProgsText = sGroupProgs.length > 0
                            ? sGroupProgs.map(p => `<span class="prog-badge-group">${p.code} – ${p.name}</span>`).join(' ')
                            : `<span class="no-prog">${lang === 'EN' ? 'No group programs' : 'ഗ്രൂപ്പ് പ്രോഗ്രാമുകൾ ഇല്ല'}</span>`;

                          return `<tr>
                            <td style="width: 8%; text-align: center;">${idx + 1}</td>
                            <td style="width: 12%; font-weight: bold; color: #1e40af;">${sRegNo}</td>
                            <td style="width: 25%; font-weight: 600;">${s.name} ${s.gender === 'BOY' ? '👦' : '👧'}</td>
                            <td style="width: 27%;">${progsText}</td>
                            <td style="width: 28%;">${groupProgsText}</td>
                          </tr>`;
                        }).join('');

                        const contentHtml = `
                          <table>
                            <thead>
                              <tr>
                                <th style="width: 8%; text-align: center;">${lang === 'EN' ? 'Sl.No' : 'ക്രമ നമ്പർ'}</th>
                                <th style="width: 12%;">${lang === 'EN' ? 'Reg. No' : 'രജി. നമ്പർ'}</th>
                                <th style="width: 25%;">${lang === 'EN' ? 'Student Name' : 'വിദ്യാർത്ഥിയുടെ പേര്'}</th>
                                <th style="width: 27%;">${lang === 'EN' ? 'Single Programs' : 'സിംഗിൾ പ്രോഗ്രാമുകൾ'}</th>
                                <th style="width: 28%;">${lang === 'EN' ? 'Group Programs' : 'ഗ്രൂപ്പ് പ്രോഗ്രാമുകൾ'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${rows}
                            </tbody>
                          </table>`;

                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                      <title>Registration Summary - ${madrasaName}</title>
                      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Serif+Malayalam:wght@400;700&display=swap" rel="stylesheet">
                      <style>
                        @page { size: A4; margin: 15mm 10mm; }
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Inter', 'Noto Serif Malayalam', sans-serif; background: #fff; color: #1e293b; padding: 10px; }
                        .notice-board {
                          border: 3px solid #059669;
                          border-radius: 12px;
                          overflow: hidden;
                          margin-bottom: 20px;
                          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        }
                        .notice-header {
                          background: linear-gradient(135deg, #064e3b 0%, #0f766e 100%);
                          color: white;
                          text-align: center;
                          padding: 20px 15px;
                          position: relative;
                        }
                        .notice-header::after {
                          content: '';
                          display: block;
                          width: 60px;
                          height: 3px;
                          background: #fbbf24;
                          margin: 8px auto 0;
                          border-radius: 2px;
                        }
                        .fest-title {
                          font-size: 14px;
                          font-weight: 800;
                          color: #fbbf24;
                          text-transform: uppercase;
                          letter-spacing: 2px;
                          margin-bottom: 4px;
                        }
                        .madrasa-name {
                          font-size: 22px;
                          font-weight: 800;
                          letter-spacing: 0.5px;
                          margin-bottom: 2px;
                        }
                        .madrasa-sub {
                          font-size: 12px;
                          opacity: 0.9;
                        }
                        .notice-title-bar {
                          background: #fbbf24;
                          color: #78350f;
                          text-align: center;
                          padding: 8px;
                          font-size: 14px;
                          font-weight: 800;
                          letter-spacing: 0.5px;
                          text-transform: uppercase;
                        }
                        .notice-body { padding: 15px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                        th {
                          background: #f1f5f9;
                          color: #064e3b;
                          font-size: 11px;
                          font-weight: 700;
                          text-transform: uppercase;
                          padding: 8px 10px;
                          text-align: left;
                          border-bottom: 2px solid #cbd5e1;
                        }
                        td {
                          padding: 8px 10px;
                          border-bottom: 1px solid #e2e8f0;
                          font-size: 12px;
                          vertical-align: middle;
                        }
                        tr:last-child td { border-bottom: none; }
                        tr:nth-child(even) td { background: #f8fafc; }
                        .prog-badge {
                          display: inline-block;
                          background: #e6f4ea;
                          color: #137333;
                          border: 1px solid #a3cfbb;
                          border-radius: 4px;
                          padding: 2px 6px;
                          margin: 2px;
                          font-size: 10.5px;
                          font-weight: 600;
                        }
                        .prog-badge-group {
                          display: inline-block;
                          background: #eff6ff;
                          color: #1e40af;
                          border: 1px solid #bfdbfe;
                          border-radius: 4px;
                          padding: 2px 6px;
                          margin: 2px;
                          font-size: 10.5px;
                          font-weight: 600;
                        }
                        .no-prog {
                          color: #94a3b8;
                          font-style: italic;
                          font-size: 11px;
                        }
                        @media print {
                          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                          .no-print { display: none !important; }
                        }
                        .print-btn {
                          display: block;
                          margin: 10px auto 20px;
                          padding: 10px 24px;
                          background: linear-gradient(135deg, #064e3b, #0f766e);
                          color: white;
                          border: none;
                          border-radius: 6px;
                          font-size: 14px;
                          font-weight: 700;
                          cursor: pointer;
                          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                        }
                      </style>
                      </head>
                      <body>
                      <button class="print-btn no-print" onclick="window.print()">🖨️ ${lang === 'EN' ? 'Print / Download PDF' : 'പ്രിന്റ് ചെയ്യുക / പിഡിഎഫ് ഡൗൺലോഡ്'}</button>
                      <div class="notice-board">
                        <div class="notice-header">
                          <div class="fest-title">✨ MILAD FEST ✨</div>
                          <div class="madrasa-name">${madrasaName}</div>
                          <div class="madrasa-sub">${madrasaPlace} | Reg. No: ${madrasaRegNo}</div>
                        </div>
                        <div class="notice-title-bar">📊 ${lang === 'EN' ? 'Registration Summary' : 'രജിസ്ട്രേഷൻ സംഗ്രഹം'} — ${subtitle}</div>
                        <div class="notice-body">
                          ${contentHtml}
                        </div>
                      </div>
                      </body>
                      </html>
                        `);
                        printWindow.document.close();
                      };

                      return (
                        <div className="settings-card-v2">
                          {/* Navigation Tabs for Single vs Group Registration */}
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                            <button
                              type="button"
                              onClick={() => setRegTabSection('SINGLE')}
                              style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                fontWeight: '800',
                                fontSize: '14px',
                                cursor: 'pointer',
                                background: regTabSection === 'SINGLE' ? 'var(--primary-light)' : 'transparent',
                                color: regTabSection === 'SINGLE' ? 'white' : '#475569',
                                transition: 'all 0.2s'
                              }}
                            >
                              👤 {lang === 'EN' ? 'Single Registration' : 'സിംഗിൾ രജിസ്ട്രേഷൻ'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRegTabSection('GROUP')}
                              style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                fontWeight: '800',
                                fontSize: '14px',
                                cursor: 'pointer',
                                background: regTabSection === 'GROUP' ? 'var(--primary-light)' : 'transparent',
                                color: regTabSection === 'GROUP' ? 'white' : '#475569',
                                transition: 'all 0.2s'
                              }}
                            >
                              👥 {lang === 'EN' ? 'Group Registration' : 'ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ'}
                            </button>
                          </div>

                          {regTabSection === 'SINGLE' ? (
                            // ── SINGLE REGISTRATION VIEW ──
                            <div className="register-layout-split" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>

                                {/* LEFT: Step Form */}
                                <div className="settings-form-box-v2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  <h3>{t('registerStudentsTitle')}</h3>

                                  <div className="stepper-timeline">
                                    {/* Step 1: Category */}
                                    <div className={`step-box ${regTabCat ? 'filled' : 'active'}`}>
                                      <div className="step-header">
                                        <div className="step-number">01</div>
                                        <div className="step-title">{t('selectCategoryStep')}</div>
                                      </div>
                                      <div className="step-content">
                                        <select className="settings-input-v2" value={regTabCat} onChange={e => {
                                          setRegTabCat(e.target.value);
                                          setRegTabStudent('');
                                          setRegTabCheckedProgs([]);
                                        }}>
                                          <option value="">{t('selectCategoryFirst')}</option>
                                          {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                          ))}
                                          {generalCatIds.length > 0 && (
                                            <option value="GENERAL">🌟 GENERAL</option>
                                          )}
                                        </select>
                                      </div>
                                    </div>

                                    {/* Step 2: Division / Gender */}
                                    {regTabCat && (
                                      <div className={`step-box ${regTabGender ? 'filled' : 'active'}`}>
                                        <div className="step-header">
                                          <div className="step-number">02</div>
                                          <div className="step-title">{t('selectDivisionStep')}</div>
                                        </div>
                                        <div className="step-content">
                                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {[
                                              { val: 'BOY', label: t('boys') },
                                              { val: 'GIRL', label: t('girls') },
                                              { val: 'COMMON', label: t('allGenders') }
                                            ].map(opt => (
                                              <button key={opt.val} type="button"
                                                onClick={() => { setRegTabGender(opt.val); setRegTabStudent(''); setRegTabCheckedProgs([]); }}
                                                className="btn-premium-action-small"
                                                style={{
                                                  padding: '10px 16px', borderRadius: '10px', border: 'none',
                                                  fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                                                  background: regTabGender === opt.val
                                                    ? (opt.val === 'BOY' ? '#2563eb' : opt.val === 'GIRL' ? '#db2777' : '#0f766e')
                                                    : '#e2e8f0',
                                                  color: regTabGender === opt.val ? 'white' : '#475569',
                                                  boxShadow: regTabGender === opt.val ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                                                  transition: 'all 0.2s'
                                                }}
                                              >{opt.label}</button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Step 3: Select Student */}
                                    {regTabCat && (
                                      <div className={`step-box ${regTabStudent ? 'filled' : 'active'}`}>
                                        <div className="step-header">
                                          <div className="step-number">03</div>
                                          <div className="step-title">{t('selectStudentStep')}</div>
                                        </div>
                                        <div className="step-content">
                                          {regStudentsFiltered.length === 0 ? (
                                            <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>{lang === 'EN' ? 'No students in this category/division.' : 'ഈ വിഭാഗത്തിൽ/ഡിവിഷനിൽ വിദ്യാർത്ഥികൾ ഇല്ല.'}</p>
                                          ) : (
                                            <select className="settings-input-v2" value={regTabStudent} onChange={e => {
                                              const sid = e.target.value;
                                              setRegTabStudent(sid);
                                              const sObj = students.find(s2 => String(s2.id) === String(sid));
                                              const existing = getStudentRegisteredProgIds(sid);
                                              setRegTabCheckedProgs(existing);
                                            }}>
                                              <option value="">{t('selectStudentFirst')}</option>
                                              {regStudentsFiltered.map(s => {
                                                const sRegNo = s.regno || s.regNo || '';
                                                const sCount = getStudentRegisteredPrograms(s.id).length;
                                                return (
                                                  <option key={s.id} value={s.id}>
                                                    {sRegNo} - {s.name} ({s.gender === 'BOY' ? '👦' : '👧'}){sCount > 0 ? ` [${sCount} ${t('programsLabel')}]` : ''}
                                                  </option>
                                                );
                                              })}
                                            </select>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Step 4: Program Checklist */}
                                    {regTabStudent && (
                                      <div className="step-box active">
                                        <div className="step-header">
                                          <div className="step-number">04</div>
                                          <div className="step-title">{lang === 'EN' ? `Select Programs for ${selectedStudentObj ? selectedStudentObj.name : ''}` : `${selectedStudentObj ? selectedStudentObj.name : ''} എന്ന വിദ്യാർത്ഥിക്ക് പ്രോഗ്രാമുകൾ തിരഞ്ഞെടുക്കുക`}</div>
                                        </div>
                                        <div className="step-content">
                                          {regPrograms.length === 0 ? (
                                            <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '12px 0', margin: 0 }}>{t('noPrograms')}</p>
                                          ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              {/* Select All / Clear All */}
                                              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                                <button type="button" onClick={() => { regTabDirtyRef.current = true; setRegTabCheckedProgs(regPrograms.map(p => String(p.id))); }}
                                                  className="btn-premium-action-small secondary" style={{ flex: 1, background: '#dcfce7', color: '#166534' }}>
                                                  {t('selectAll')}
                                                </button>
                                                <button type="button" onClick={() => { regTabDirtyRef.current = true; setRegTabCheckedProgs([]); }}
                                                  className="btn-premium-action-small secondary" style={{ flex: 1, background: '#fee2e2', color: '#991b1b' }}>
                                                  {t('clearAll')}
                                                </button>
                                              </div>
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto', paddingRight: '2px' }}>
                                                {regPrograms.map(p => {
                                                  const isChecked = regTabCheckedProgs.includes(String(p.id)) || regTabCheckedProgs.includes(String(p.code)) || regTabCheckedProgs.includes(String(p.name || ''));
                                                  const pTypeLabel = (p.type || '').includes('GROUP') ? `${t('group')} 👥` : `${t('single')} 👤`;
                                                  return (
                                                    <label key={p.id} style={{
                                                      display: 'flex', alignItems: 'center', gap: '10px',
                                                      padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                                                      background: isChecked ? '#eff6ff' : '#ffffff',
                                                      border: `1.5px solid ${isChecked ? '#3b82f6' : '#e2e8f0'}`,
                                                      transition: 'all 0.15s'
                                                    }}>
                                                      <input type="checkbox" checked={isChecked}
                                                        onChange={e => {
                                                          regTabDirtyRef.current = true;
                                                          if (e.target.checked) {
                                                            setRegTabCheckedProgs(prev => Array.from(new Set([...prev, String(p.id)])));
                                                          } else {
                                                            setRegTabCheckedProgs(prev => prev.filter(id => id !== String(p.id) && id !== String(p.code) && id.toLowerCase() !== String(p.name || '').toLowerCase()));
                                                          }
                                                        }}
                                                        style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                                                      />
                                                      <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>{p.code} – {p.name}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{pTypeLabel}</div>
                                                      </div>
                                                      {isChecked && <span style={{ color: '#2563eb', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap' }}>{lang === 'EN' ? '✓ Checked' : '✓ തിരഞ്ഞെടുത്തു'}</span>}
                                                    </label>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                          <button type="button" onClick={handleSaveRegistrations} disabled={regTabSaving}
                                            className="btn-premium-action"
                                            style={{ marginTop: '16px' }}>
                                            {regTabSaving ? `⏳ ${t('saving')}` : `💾 ${t('saveRegistrationsBtn')} (${regTabCheckedProgs.length} ${lang === 'EN' ? 'selected' : 'തിരഞ്ഞെടുത്തു'})`}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* RIGHT: Registration Summary */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '14px', borderLeft: '4px solid var(--primary-light)', paddingLeft: '10px' }}>
                                    {lang === 'EN' ? '📊 Registration Summary' : '📊 രജിസ്ട്രേഷൻ സംഗ്രഹം'}{regTabCat ? ` – ${regCatObj?.name || ''}` : ''}
                                  </h3>
                                  {!regTabCat ? (
                                    <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>{lang === 'EN' ? 'Select a category to view registrations.' : 'രജിസ്ട്രേഷനുകൾ കാണാൻ ഒരു വിഭാഗം തിരഞ്ഞെടുക്കുക.'}</p>
                                  ) : regStudentsFiltered.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>{lang === 'EN' ? 'No students in this category/division.' : 'ഈ വിഭാഗത്തിൽ/ഡിവിഷനിൽ വിദ്യാർത്ഥികൾ ഇല്ല.'}</p>
                                  ) : (
                                    <>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {regStudentsFiltered.map(s => {
                                          const sRegNo = s.regno || s.regNo || '';
                                          const sProgs = getStudentRegisteredPrograms(s.id);
                                          const isSelected = String(regTabStudent) === String(s.id);
                                          return (
                                            <div key={s.id}
                                              style={{
                                                padding: '12px', borderRadius: '12px', cursor: 'pointer',
                                                background: '#ffffff',
                                                border: `1.5px solid ${isSelected ? 'var(--primary-light)' : '#e2e8f0'}`,
                                                boxShadow: isSelected ? '0 4px 12px rgba(15, 118, 110, 0.08)' : 'none',
                                                transition: 'all 0.15s'
                                              }}
                                              onClick={() => {
                                                const sid = String(s.id);
                                                setRegTabStudent(sid);
                                                const existing = getStudentRegisteredProgIds(sid);
                                                setRegTabCheckedProgs(existing);
                                              }}>
                                              <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{
                                                  background: s.gender === 'BOY' ? '#dbeafe' : '#fce7f3',
                                                  color: s.gender === 'BOY' ? '#1e40af' : '#be185d',
                                                  borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: '800'
                                                }}>{sRegNo}</span>
                                                <span style={{ color: isSelected ? 'var(--primary-deep)' : '#1e293b' }}>{s.name}</span>
                                                <span>{s.gender === 'BOY' ? '👦' : '👧'}</span>
                                              </div>
                                              {sProgs.length > 0 ? (
                                                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                  {sProgs.map(p => (
                                                    <span key={p.id} style={{
                                                      background: '#e6f4ea', color: '#137333', borderRadius: '6px',
                                                      padding: '2px 8px', fontSize: '10px', fontWeight: '700', border: '1px solid #cbd5e1'
                                                    }}>{p.code} – {p.name}</span>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>{lang === 'EN' ? 'No programs registered yet' : 'പ്രോഗ്രാമുകൾ ഒന്നും രജിസ്റ്റർ ചെയ്തിട്ടില്ല'}</div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={handleDownloadRegSummaryPDF}
                                        className="btn-premium-action"
                                        style={{
                                          marginTop: '16px',
                                          background: 'linear-gradient(135deg, #10b981, #059669)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '8px'
                                        }}
                                      >
                                        📄 {lang === 'EN' ? 'Download PDF Summary' : 'പിഡിഎഫ് സമ്മറി ഡൗൺലോഡ് ചെയ്യുക'}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // ── GROUP REGISTRATION VIEW ──
                            <div className="register-layout-split" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>

                                {/* LEFT: Group Step Form */}
                                <div className="settings-form-box-v2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                  <h3>{lang === 'EN' ? 'Group Registration' : 'ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ'}</h3>

                                  <div className="stepper-timeline">
                                    {/* Step 1: Category */}
                                    <div className={`step-box ${groupRegCat ? 'filled' : 'active'}`}>
                                      <div className="step-header">
                                        <div className="step-number">01</div>
                                        <div className="step-title">{t('selectCategoryStep')}</div>
                                      </div>
                                      <div className="step-content">
                                        <select className="settings-input-v2" value={groupRegCat} onChange={e => {
                                          setGroupRegCat(e.target.value);
                                          setGroupRegProgram('');
                                          setGroupRegStudents([]);
                                        }}>
                                          <option value="">{t('selectCategoryFirst')}</option>
                                          {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                          ))}
                                          {generalCatIds.length > 0 && (
                                            <option value="GENERAL">🌟 GENERAL</option>
                                          )}
                                        </select>
                                      </div>
                                    </div>

                                    {/* Step 2: Division / Gender */}
                                    {groupRegCat && (
                                      <div className={`step-box ${groupRegGender ? 'filled' : 'active'}`}>
                                        <div className="step-header">
                                          <div className="step-number">02</div>
                                          <div className="step-title">{t('selectDivisionStep')}</div>
                                        </div>
                                        <div className="step-content">
                                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {[
                                              { val: 'BOY', label: t('boys') },
                                              { val: 'GIRL', label: t('girls') },
                                              { val: 'COMMON', label: t('allGenders') }
                                            ].map(opt => (
                                              <button key={opt.val} type="button"
                                                onClick={() => { setGroupRegGender(opt.val); setGroupRegProgram(''); setGroupRegStudents([]); }}
                                                className="btn-premium-action-small"
                                                style={{
                                                  padding: '10px 16px', borderRadius: '10px', border: 'none',
                                                  fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                                                  background: groupRegGender === opt.val
                                                    ? (opt.val === 'BOY' ? '#2563eb' : opt.val === 'GIRL' ? '#db2777' : '#0f766e')
                                                    : '#e2e8f0',
                                                  color: groupRegGender === opt.val ? 'white' : '#475569',
                                                  boxShadow: groupRegGender === opt.val ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                                                  transition: 'all 0.2s'
                                                }}
                                              >{opt.label}</button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Step 3: Select Program */}
                                    {groupRegCat && (
                                      <div className={`step-box ${groupRegProgram ? 'filled' : 'active'}`}>
                                        <div className="step-header">
                                          <div className="step-number">03</div>
                                          <div className="step-title">{lang === 'EN' ? 'Select Group Program' : 'ഗ്രൂപ്പ് പ്രോഗ്രാം തിരഞ്ഞെടുക്കുക'}</div>
                                        </div>
                                        <div className="step-content">
                                          {(() => {
                                            const groupProgs = programs.filter(p => {
                                              if (groupRegCat === 'GENERAL') { if (!isGeneralProg(p)) return false; } else if (String(p.catid || p.catId || '') !== String(groupRegCat)) return false;
                                              const pt = p.type || '';
                                              if (!pt.includes('GROUP')) return false;
                                              if (groupRegGender === 'COMMON') return true;
                                              if (pt.includes('COMMON')) return true;
                                              if (groupRegGender === 'BOY' && pt.includes('BOY')) return true;
                                              if (groupRegGender === 'GIRL' && pt.includes('GIRL')) return true;
                                              return false;
                                            });

                                            return groupProgs.length === 0 ? (
                                              <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>
                                                {lang === 'EN' ? 'No group programs in this category/division.' : 'ഈ വിഭാഗത്തിൽ/ഡിവിഷനിൽ ഗ്രൂപ്പ് പ്രോഗ്രാമുകൾ ഇല്ല.'}
                                              </p>
                                            ) : (
                                              <select className="settings-input-v2" value={groupRegProgram} onChange={e => {
                                                setGroupRegProgram(e.target.value);
                                                setGroupRegStudents([]);
                                              }}>
                                                <option value="">-- {lang === 'EN' ? 'Select Program' : 'പ്രോഗ്രാം തിരഞ്ഞെടുക്കുക'} --</option>
                                                {groupProgs.map(p => (
                                                  <option key={p.id} value={p.id}>{p.code} – {p.name}</option>
                                                ))}
                                              </select>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    )}

                                    {/* Step 4: Group Name & Team */}
                                    {groupRegProgram && (
                                      <div className={`step-box ${(groupRegName.trim() && groupRegTeam) ? 'filled' : 'active'}`}>
                                        <div className="step-header">
                                          <div className="step-number">04</div>
                                          <div className="step-title">{lang === 'EN' ? 'Group Name & Competing Team' : 'ഗ്രൂപ്പ് പേരും മത്സരിക്കുന്ന ടീമും'}</div>
                                        </div>
                                        <div className="step-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                          <div>
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                              {lang === 'EN' ? 'Group / Batch Name' : 'ഗ്രൂപ്പ് പേര്'}
                                            </label>
                                            <input
                                              type="text"
                                              className="settings-input-v2"
                                              placeholder={lang === 'EN' ? 'e.g. Sanghaganam Group A' : 'ഉദാ: സംഘഗാനം ഗ്രൂപ്പ് എ'}
                                              value={groupRegName}
                                              onChange={e => setGroupRegName(e.target.value)}
                                            />
                                          </div>
                                          <div>
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                              {lang === 'EN' ? 'Competing Team (Points go here)' : 'മത്സരിക്കുന്ന ടീം (പോയിന്റുകൾ ഇവിടെ ലഭിക്കും)'}
                                            </label>
                                            <select className="settings-input-v2" value={groupRegTeam} onChange={e => {
                                              setGroupRegTeam(e.target.value);
                                              setGroupRegStudents([]);
                                              setGroupRegLeader('');
                                              setGroupRegMemberSearch('');
                                            }}>
                                              <option value="">-- {lang === 'EN' ? 'Select Team' : 'ടീം തിരഞ്ഞെടുക്കുക'} --</option>
                                              {teams.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Step 5: Select Members */}
                                    {groupRegProgram && (
                                      <div className="step-box active">
                                        <div className="step-header">
                                          <div className="step-number">05</div>
                                          <div className="step-title">{lang === 'EN' ? 'Select Member Students' : 'അംഗങ്ങളായ വിദ്യാർത്ഥികളെ തിരഞ്ഞെടുക്കുക'}</div>
                                        </div>
                                        <div className="step-content">
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
                                                  ) : searchFilteredStudents.map(s => {
                                                    const sRegNo = s.regno || s.regNo || '';
                                                    const isChecked = groupRegStudents.includes(String(s.id));
                                                    const isLeader = groupRegLeader ? String(groupRegLeader) === String(s.id) : (groupRegStudents.length > 0 && String(groupRegStudents[0]) === String(s.id));
                                                    const teamName = (teams.find(t => String(t.id) === String(s.teamid || s.teamId)) || {}).name || '';

                                                    return (
                                                      <label key={s.id} style={{
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
                                                        background: isChecked ? (isLeader ? '#f0fdf4' : '#eff6ff') : 'transparent',
                                                        border: isLeader && isChecked ? '1px solid #86efac' : '1px solid transparent',
                                                        transition: 'all 0.15s'
                                                      }}>
                                                        <input type="checkbox" checked={isChecked}
                                                          onChange={e => {
                                                            if (e.target.checked) {
                                                              setGroupRegStudents(prev => [...prev, String(s.id)]);
                                                              if (!groupRegLeader) setGroupRegLeader(String(s.id));
                                                            } else {
                                                              const next = groupRegStudents.filter(id => id !== String(s.id));
                                                              setGroupRegStudents(next);
                                                              if (String(groupRegLeader) === String(s.id)) {
                                                                setGroupRegLeader(next.length > 0 ? next[0] : '');
                                                              }
                                                            }
                                                          }}
                                                          style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                                                        />
                                                        <div style={{ flex: 1, fontSize: '13px', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                          <div>
                                                            <b>{sRegNo}</b> - {s.name} <span style={{ fontSize: '11px', color: '#64748b' }}>({teamName})</span>
                                                          </div>
                                                          {isChecked && isLeader && (
                                                            <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', border: '1px solid #86efac' }}>
                                                              👑 {lang === 'EN' ? 'Leader' : 'ടീം ലീഡർ'}
                                                            </span>
                                                          )}
                                                        </div>
                                                      </label>
                                                    );
                                                  })}
                                                </div>

                                                {/* Team Leader Dropdown selection */}
                                                {groupRegStudents.length > 0 && (
                                                  <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '6px' }}>
                                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                      <span>👑</span> {lang === 'EN' ? 'Select Team Leader (Required for Judge Sheet):' : 'ടീം ലീഡറെ തിരഞ്ഞെടുക്കുക (ജഡ്ജ് ഷീറ്റിനായി):'}
                                                    </label>
                                                    <select
                                                      className="settings-input-v2"
                                                      value={groupRegLeader || (groupRegStudents.length > 0 ? groupRegStudents[0] : '')}
                                                      onChange={e => setGroupRegLeader(e.target.value)}
                                                      style={{ background: '#fff', fontSize: '13px', fontWeight: '700', color: '#064e3b' }}
                                                    >
                                                      {groupRegStudents.map(sId => {
                                                        const st = students.find(s => String(s.id) === String(sId));
                                                        if (!st) return null;
                                                        const sReg = st.regno || st.regNo || '';
                                                        return (
                                                          <option key={st.id} value={st.id}>
                                                            {sReg} - {st.name}
                                                          </option>
                                                        );
                                                      })}
                                                    </select>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })()}

                                          <button type="button" onClick={handleSaveGroupRegistration} disabled={groupRegSaving}
                                            className="btn-premium-action"
                                            style={{ marginTop: '16px' }}>
                                            {groupRegSaving ? `⏳ ${t('saving')}` : `💾 ${lang === 'EN' ? 'Save Group Registration' : 'ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ സേവ് ചെയ്യുക'}`}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* RIGHT: Group Registration Summary */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '14px', borderLeft: '4px solid var(--primary-light)', paddingLeft: '10px' }}>
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

                                      const rows = displayedGroupRegs.map((g, idx) => {
                                        const prog = programs.find(p => String(p.id) === String(g.program_id));
                                        const team = teams.find(t => String(t.id) === String(g.team_id));

                                        const memberIds = Array.isArray(g.student_ids) ? g.student_ids : [];
                                        const memberNames = memberIds.map(id => {
                                          const studentObj = students.find(s => String(s.id) === String(id));
                                          return studentObj ? `${studentObj.regno || studentObj.regNo || ''} - ${studentObj.name}` : '';
                                        }).filter(Boolean);

                                        return `<tr>
                                          <td>${idx + 1}</td>
                                          <td><strong>${g.group_name}</strong></td>
                                          <td><span class="badge-team">${team ? team.name : ''}</span></td>
                                          <td><strong>${prog ? prog.code : ''}</strong> - ${prog ? prog.name : ''}</td>
                                          <td>${memberNames.join(', ') || '<span style="font-style: italic; color: #94a3b8">None</span>'}</td>
                                        </tr>`;
                                      }).join('');

                                      const contentHtml = `
                                        <table>
                                          <thead>
                                            <tr>
                                              <th style="width: 8%">${lang === 'EN' ? 'Sl.No' : 'ക്രമനമ്പർ'}</th>
                                              <th style="width: 25%">${lang === 'EN' ? 'Group Name' : 'ഗ്രൂപ്പ് പേര്'}</th>
                                              <th style="width: 15%">${lang === 'EN' ? 'Team' : 'ടീം'}</th>
                                              <th style="width: 25%">${lang === 'EN' ? 'Program' : 'പ്രോഗ്രാം'}</th>
                                              <th>${lang === 'EN' ? 'Members' : 'അംഗങ്ങൾ'}</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            ${rows || `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:30px">${lang === 'EN' ? 'No group registrations found matching current filters.' : 'ഫിൽട്ടറിന് അനുയോജ്യമായ ഗ്രൂപ്പ് രജിസ്ട്രേഷനുകൾ ഒന്നും കണ്ടെത്തിയില്ല.'}</td></tr>`}
                                          </tbody>
                                        </table>`;

                                      const printWindow = window.open('', '_blank');
                                      printWindow.document.write(`
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                    <title>${pdfTitle} - ${madrasaName}</title>
                                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Serif+Malayalam:wght@400;700&display=swap" rel="stylesheet">
                                    <style>
                                      @page { size: A4 landscape; margin: 15mm 15mm; }
                                      * { margin: 0; padding: 0; box-sizing: border-box; }
                                      body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; }
                                      .notice-board {
                                        border: 4px solid #0f766e;
                                        border-radius: 12px;
                                        overflow: hidden;
                                        margin-bottom: 30px;
                                        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                                      }
                                      .notice-header {
                                        background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
                                        color: white;
                                        text-align: center;
                                        padding: 24px 20px 18px;
                                        position: relative;
                                      }
                                      .notice-header::after {
                                        content: '';
                                        display: block;
                                        width: 80px;
                                        height: 3px;
                                        background: #f59e0b;
                                        margin: 10px auto 0;
                                        border-radius: 2px;
                                      }
                                      .madrasa-name {
                                        font-size: 24px;
                                        font-weight: 800;
                                        letter-spacing: 1px;
                                        margin-bottom: 4px;
                                      }
                                      .madrasa-sub {
                                        font-size: 13px;
                                        opacity: 0.85;
                                        letter-spacing: 0.5px;
                                      }
                                      .notice-title-bar {
                                        background: #fbbf24;
                                        color: #78350f;
                                        text-align: center;
                                        padding: 10px;
                                        font-size: 15px;
                                        font-weight: 800;
                                        letter-spacing: 1px;
                                        text-transform: uppercase;
                                      }
                                      .notice-body { padding: 20px 25px 30px; }
                                      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #cbd5e1 !important; }
                                      thead { display: table-header-group !important; }
                                      tr { page-break-inside: avoid !important; break-inside: avoid !important; }
                                      th {
                                        background: #f1f5f9 !important;
                                        color: #0f766e !important;
                                        font-size: 12px;
                                        font-weight: 700;
                                        text-transform: uppercase;
                                        letter-spacing: 1px;
                                        padding: 10px 12px;
                                        text-align: left;
                                        border: 1px solid #cbd5e1 !important;
                                      }
                                      td {
                                        padding: 10px 12px;
                                        border: 1px solid #e2e8f0 !important;
                                        font-size: 13px;
                                        vertical-align: middle;
                                      }
                                      tr:last-child td { border-bottom: none; }
                                      tr:nth-child(even) td { background: #f8fafc; }
                                      td strong { color: #0f766e; }
                                      .badge-team {
                                        background: #fef3c7;
                                        color: #d97706;
                                        font-size: 11px;
                                        font-weight: 800;
                                        padding: 2px 6px;
                                        border-radius: 4px;
                                        text-transform: uppercase;
                                      }
                                      .footer {
                                        text-align: center;
                                        padding: 15px;
                                        font-size: 11px;
                                        color: #94a3b8;
                                        border-top: 1px solid #e2e8f0;
                                        margin-top: 10px;
                                      }
                                      @media print {
                                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                        .no-print { display: none !important; }
                                      }
                                      .print-btn {
                                        display: block;
                                        margin: 20px auto;
                                        padding: 12px 32px;
                                        background: linear-gradient(135deg, #0f766e, #115e59);
                                        color: white;
                                        border: none;
                                        border-radius: 8px;
                                        font-size: 15px;
                                        font-weight: 700;
                                        cursor: pointer;
                                        box-shadow: 0 4px 15px rgba(0,0,0,0.25);
                                      }
                                    </style>
                                    </head>
                                    <body>
                                    <button class="print-btn no-print" onclick="window.print()">${lang === 'EN' ? '🖨️ Print / Download PDF' : '🖨️ പ്രിന്റ് / PDF ഡൗൺലോഡ്'}</button>
                                    <div class="notice-board">
                                      <div class="notice-header">
                                        ${eventName ? `<div style="font-size:13px;font-weight:700;letter-spacing:2px;color:#fef08a;text-transform:uppercase;margin-bottom:2px;">${eventName}</div><div style="font-size:11px;color:#bbf7d0;letter-spacing:1px;font-weight:600;margin-bottom:6px;">Milad_fest${eventYear ? ' ' + eventYear : ''}</div>` : ''}
                                        <div class="madrasa-name">${madrasaName}</div>
                                        <div class="madrasa-sub">${madrasaPlace} | Reg. No: ${madrasaRegNo}</div>
                                      </div>
                                      <div class="notice-title-bar">👥 ${pdfTitle} — ${subtitle}</div>
                                      <div class="notice-body">
                                        ${contentHtml}
                                      </div>
                                      <div class="footer">Generated by Milad Fest App • Total Group Registrations: ${displayedGroupRegs.length}</div>
                                    </div>
                                    </body></html>`);
                                      printWindow.document.close();
                                      printWindow.print();
                                    };

                                    return (
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
                                          <>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                                            {displayedGroupRegs.map(g => {
                                            const prog = programs.find(p => String(p.id) === String(g.program_id));
                                            const team = teams.find(t => String(t.id) === String(g.team_id));

                                            // Resolve member student names
                                            const memberIds = Array.isArray(g.student_ids) ? g.student_ids : [];
                                            const memberNames = memberIds.map(id => {
                                              const studentObj = students.find(s => String(s.id) === String(id));
                                              return studentObj ? `${studentObj.regno || studentObj.regNo || ''} ${studentObj.name}` : '';
                                            }).filter(Boolean);

                                            // Get eligible students for this program (same logic as add form)
                                            const editProg = prog;
                                            const editProgType = editProg ? (editProg.type || '') : '';
                                            const editStudentsFiltered = editProg ? students.filter(s => {
                                              const sCatId = String(s.catid || s.catId || '');
                                              const sPCatId = String(editProg.catid || editProg.catId || '');
                                              if (sCatId !== sPCatId && groupRegCat !== 'GENERAL') return false;
                                              const sGender = String(s.gender || '').toUpperCase();
                                              if (editProgType.includes('BOY') && sGender !== 'BOY') return false;
                                              if (editProgType.includes('GIRL') && sGender !== 'GIRL') return false;
                                              if (g.team_id && String(s.teamid || s.teamId || '') !== String(g.team_id)) return false;
                                              return true;
                                            }) : [];

                                            const isEditing = editingGroupRegId === g.id;

                                            return (
                                              <div key={g.id}
                                                style={{
                                                  padding: '12px', borderRadius: '12px',
                                                  background: isEditing ? '#f0fdf4' : '#ffffff',
                                                  border: isEditing ? '2px solid #34d399' : '1.5px solid #e2e8f0',
                                                  boxShadow: 'none',
                                                  transition: 'all 0.15s',
                                                  position: 'relative'
                                                }}
                                              >
                                                {/* Action buttons */}
                                                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px' }}>
                                                  {!isEditing && (
                                                    <button
                                                      onClick={() => {
                                                        setEditingGroupRegId(g.id);
                                                        setEditingGroupRegName(g.group_name || '');
                                                        const ids = Array.isArray(g.student_ids) ? g.student_ids.map(String) : [];
                                                        setEditingGroupRegStudents(ids);
                                                        setEditingGroupRegLeader(g.leader_id ? String(g.leader_id) : (ids[0] || ''));
                                                      }}
                                                      className="btn-row-action-v2 edit" style={{ padding: '4px', fontSize: '12px' }} title={lang === 'EN' ? 'Edit' : 'എഡിറ്റ്'}>✏️</button>
                                                  )}
                                                  {!isEditing && (
                                                    <button onClick={() => handleDeleteGroupRegistration(g.id)}
                                                      className="btn-row-action-v2 delete" style={{ padding: '4px', fontSize: '12px' }} title={lang === 'EN' ? 'Delete' : 'ഡിലീറ്റ്'}>❌</button>
                                                  )}
                                                </div>

                                                {/* View mode */}
                                                {!isEditing ? (
                                                  <>
                                                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', paddingRight: '55px' }}>
                                                      {g.group_name} <span style={{ fontSize: '11px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', padding: '1px 5px', fontWeight: '800', marginLeft: '6px' }}>{team?.name}</span>
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>
                                                      📚 {prog?.code} – {prog?.name}
                                                    </div>
                                                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#1e293b' }}>
                                                      <span style={{ fontWeight: '700', color: '#475569' }}>{lang === 'EN' ? 'Members: ' : 'അംഗങ്ങൾ: '}</span>
                                                      {memberNames.join(', ') || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>None</span>}
                                                    </div>
                                                  </>
                                                ) : (
                                                  /* Edit mode */
                                                  <div style={{ paddingRight: '30px' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f766e', marginBottom: '10px' }}>
                                                      ✏️ {lang === 'EN' ? 'Edit Group Registration' : 'ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ എഡിറ്റ്'}
                                                    </div>

                                                    {/* Group Name */}
                                                    <div style={{ marginBottom: '8px' }}>
                                                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                        {lang === 'EN' ? 'Group Name' : 'ഗ്രൂപ്പ് പേര്'}
                                                      </label>
                                                      <input
                                                        type="text"
                                                        className="settings-input-v2"
                                                        value={editingGroupRegName}
                                                        onChange={e => setEditingGroupRegName(e.target.value)}
                                                        placeholder={lang === 'EN' ? 'Group Name' : 'ഗ്രൂപ്പ് പേര്'}
                                                        style={{ fontSize: '13px', padding: '7px 10px' }}
                                                      />
                                                    </div>

                                                    {/* Program & Team (read only) */}
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>
                                                      📚 {prog?.code} – {prog?.name} &nbsp;|&nbsp;
                                                      <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: '4px', padding: '1px 5px', fontWeight: '800' }}>{team?.name}</span>
                                                    </div>

                                                    {/* Student Checkboxes */}
                                                    <div style={{ marginBottom: '8px' }}>
                                                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                                        {lang === 'EN' ? 'Members' : 'അംഗങ്ങൾ'} <span style={{ color: '#0f766e', fontWeight: '800' }}>({editingGroupRegStudents.length} {lang === 'EN' ? 'selected' : 'തിരഞ്ഞെടുത്തത്'})</span>
                                                      </div>
                                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', background: '#fff' }}>
                                                        {editStudentsFiltered.length === 0 ? (
                                                          <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px', margin: 0 }}>{lang === 'EN' ? 'No students available.' : 'വിദ്യാർത്ഥികൾ ലഭ്യമല്ല.'}</p>
                                                        ) : editStudentsFiltered.map(s => {
                                                          const sRegNo = s.regno || s.regNo || '';
                                                          const isChecked = editingGroupRegStudents.includes(String(s.id));
                                                          const isLeader = editingGroupRegLeader ? String(editingGroupRegLeader) === String(s.id) : (editingGroupRegStudents.length > 0 && String(editingGroupRegStudents[0]) === String(s.id));
                                                          const teamName = (teams.find(t => String(t.id) === String(s.teamid || s.teamId)) || {}).name || '';
                                                          return (
                                                            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 7px', borderRadius: '6px', cursor: 'pointer', background: isChecked ? (isLeader ? '#f0fdf4' : '#eff6ff') : 'transparent', border: isLeader && isChecked ? '1px solid #86efac' : '1px solid transparent' }}>
                                                              <input type="checkbox" checked={isChecked}
                                                                onChange={e => {
                                                                  if (e.target.checked) {
                                                                    setEditingGroupRegStudents(prev => [...prev, String(s.id)]);
                                                                    if (!editingGroupRegLeader) setEditingGroupRegLeader(String(s.id));
                                                                  } else {
                                                                    const next = editingGroupRegStudents.filter(id => id !== String(s.id));
                                                                    setEditingGroupRegStudents(next);
                                                                    if (String(editingGroupRegLeader) === String(s.id)) setEditingGroupRegLeader(next[0] || '');
                                                                  }
                                                                }}
                                                                style={{ width: '15px', height: '15px', accentColor: '#3b82f6', cursor: 'pointer' }}
                                                              />
                                                              <div style={{ flex: 1, fontSize: '12px', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <span><b>{sRegNo}</b> - {s.name} <span style={{ fontSize: '10px', color: '#64748b' }}>({teamName})</span></span>
                                                                {isChecked && isLeader && <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', fontWeight: '800', padding: '1px 5px', borderRadius: '4px' }}>👑 {lang === 'EN' ? 'Leader' : 'ലീഡർ'}</span>}
                                                              </div>
                                                            </label>
                                                          );
                                                        })}
                                                      </div>
                                                    </div>

                                                    {/* Leader selector */}
                                                    {editingGroupRegStudents.length > 0 && (
                                                      <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '10px' }}>
                                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                                                          👑 {lang === 'EN' ? 'Team Leader:' : 'ടീം ലീഡർ:'}
                                                        </label>
                                                        <select
                                                          className="settings-input-v2"
                                                          value={editingGroupRegLeader || editingGroupRegStudents[0] || ''}
                                                          onChange={e => setEditingGroupRegLeader(e.target.value)}
                                                          style={{ background: '#fff', fontSize: '12px', fontWeight: '700', color: '#064e3b', padding: '6px 10px' }}
                                                        >
                                                          {editingGroupRegStudents.map(sId => {
                                                            const st = students.find(s => String(s.id) === String(sId));
                                                            if (!st) return null;
                                                            const sReg = st.regno || st.regNo || '';
                                                            return <option key={st.id} value={st.id}>{sReg} - {st.name}</option>;
                                                          })}
                                                        </select>
                                                      </div>
                                                    )}

                                                    {/* Save / Cancel buttons */}
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                      <button
                                                        onClick={() => handleUpdateGroupRegistration(g.id)}
                                                        disabled={editingGroupRegSaving}
                                                        className="btn-premium-action-small primary"
                                                        style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                                                      >
                                                        {editingGroupRegSaving ? `⏳ ${lang === 'EN' ? 'Saving...' : 'സേവ് ചെയ്യുന്നു...'}` : `💾 ${lang === 'EN' ? 'Save Changes' : 'മാറ്റങ്ങൾ സേവ് ചെയ്യുക'}`}
                                                      </button>
                                                      <button
                                                        onClick={() => setEditingGroupRegId(null)}
                                                        className="btn-premium-action-small secondary"
                                                        style={{ padding: '8px 12px', fontSize: '12px' }}
                                                      >
                                                        {lang === 'EN' ? 'Cancel' : 'റദ്ദ്'}
                                                      </button>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={generateGroupRegsPDF}
                                          className="btn-premium-action"
                                          style={{
                                            marginTop: '16px',
                                            background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                          }}
                                        >
                                          📄 {lang === 'EN' ? 'Download PDF' : 'PDF ഡൗൺലോഡ് ചെയ്യുക'}
                                        </button>
                                      </>
                                    )}
                                  </>
                                );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}


                    {/* MARK_ENTRY SUB-TAB */}
                    {settingsSubTab === 'MARK_ENTRY' && (() => {
                      const selectedCatObj = categories.find(c => String(c.id) === String(selectedResultCat));
                      const isGeneralCat = selectedResultCat === 'GENERAL' ||
                        (selectedResultCat && String(selectedResultCat).toUpperCase().includes('GENERAL')) ||
                        (selectedCatObj && selectedCatObj.name && String(selectedCatObj.name).toUpperCase().includes('GENERAL'));
                      const safeGenIds = Array.isArray(generalCatIds) ? generalCatIds.map(String) : [];

                      return (
                      <div className="settings-card-v2">
                        {/* Navigation Tabs for Single vs Group Mark Entry */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setMarkEntrySection('SINGLE');
                              setSelectedResultCat('');
                              setSelectedResultGender('ALL');
                              setSelectedResultProg('');
                              setSelectedResultStudent('');
                            }}
                            style={{
                              padding: '10px 20px',
                              borderRadius: '10px',
                              border: 'none',
                              fontWeight: '800',
                              fontSize: '14px',
                              cursor: 'pointer',
                              background: markEntrySection === 'SINGLE' ? 'var(--primary-light)' : 'transparent',
                              color: markEntrySection === 'SINGLE' ? 'white' : '#475569',
                              transition: 'all 0.2s'
                            }}
                          >
                            👤 {lang === 'EN' ? 'Single Entry' : 'സിംഗിൾ മാർക്ക് എൻട്രി'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMarkEntrySection('GROUP');
                              setSelectedResultCat('');
                              setSelectedResultGender('ALL');
                              setSelectedResultProg('');
                              setSelectedResultStudent('');
                            }}
                            style={{
                              padding: '10px 20px',
                              borderRadius: '10px',
                              border: 'none',
                              fontWeight: '800',
                              fontSize: '14px',
                              cursor: 'pointer',
                              background: markEntrySection === 'GROUP' ? 'var(--primary-light)' : 'transparent',
                              color: markEntrySection === 'GROUP' ? 'white' : '#475569',
                              transition: 'all 0.2s'
                            }}
                          >
                            👥 {lang === 'EN' ? 'Group Entry' : 'ഗ്രൂപ്പ് മാർക്ക് എൻട്രി'}
                          </button>
                        </div>

                        <div className="settings-form-box-v2">
                          <h3>
                            {markEntrySection === 'SINGLE'
                              ? (lang === 'EN' ? '📝 Single Event Mark Entry' : '📝 സിംഗിൾ മാർക്ക് എൻട്രി')
                              : (lang === 'EN' ? '📝 Group Event Mark Entry' : '📝 ഗ്രൂപ്പ് മാർക്ക് എൻട്രി')
                            }
                          </h3>
                          <form onSubmit={handleAddResult} className="settings-form">
                            <div className="stepper-timeline">

                              {/* Step 1: Category & Gender */}
                              <div className={`step-box ${selectedResultCat ? 'filled' : 'active'}`}>
                                <div className="step-header">
                                  <div className="step-number">01</div>
                                  <div className="step-title">Select Category & Division</div>
                                </div>
                                <div className="step-content">
                                  <select className="settings-input-v2" value={selectedResultCat && selectedResultGender && selectedResultGender !== 'ALL' ? `${selectedResultCat}_${selectedResultGender}` : ''} onChange={(e) => {
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
                                    <option value="">-- Category & Division --</option>
                                    {categories.map(c => (
                                      <React.Fragment key={c.id}>
                                        <option value={`${c.id}_BOY`}>{c.name} - Boys</option>
                                        <option value={`${c.id}_GIRL`}>{c.name} - Girls</option>
                                        <option value={`${c.id}_COMMON`}>{c.name} - Common</option>
                                      </React.Fragment>
                                    ))}
                                    {generalCatIds.length > 0 && (
                                      <React.Fragment>
                                        <option value="GENERAL_BOY">GENERAL - Boys</option>
                                        <option value="GENERAL_GIRL">GENERAL - Girls</option>
                                        <option value="GENERAL_COMMON">GENERAL - Common</option>
                                      </React.Fragment>
                                    )}
                                  </select>
                                </div>
                              </div>

                              {/* Step 2: Program (filtered by category, gender and single/group mode) */}
                              <div className={`step-box ${selectedResultProg ? 'filled' : 'active'}`}>
                                <div className="step-header">
                                  <div className="step-number">02</div>
                                  <div className="step-title">Select Program</div>
                                </div>
                                <div className="step-content">
                                  <select className="settings-input-v2" value={selectedResultProg} onChange={(e) => {
                                    setSelectedResultProg(e.target.value);
                                    setSelectedResultStudent('');
                                  }} required disabled={!selectedResultCat}>
                                    <option value="">{selectedResultCat ? '-- Select Program --' : 'Select Category First'}</option>
                                    {programs
                                      .filter(p => {
                                        if (selectedResultCat === 'GENERAL') {
                                           if (!isGeneralProg(p)) return false;
                                         } else if (String(p.catid || p.catId || '') !== String(selectedResultCat)) {
                                           return false;
                                         }
                                        if (markEntrySection === 'SINGLE' && (p.type || '').includes('GROUP')) return false;
                                        if (markEntrySection === 'SINGLE' && (p.type || '').includes('TEAM')) return false;
                                        if (markEntrySection === 'GROUP' && !(p.type || '').includes('GROUP')) return false;
                                        if (markEntrySection === 'GROUP' && (p.type || '').includes('TEAM')) return false;
                                        if (markEntrySection === 'TEAM' && !(p.type || '').includes('TEAM')) return false;
                                        if (!p.type || !p.type.includes('_')) return true;
                                        if (p.type.includes('COMMON')) return true;
                                        if (selectedResultGender !== 'ALL' && !p.type.includes(selectedResultGender)) return false;
                                        return true;
                                      })
                                      .map(p => {
                                        const pType = (p.type || '').toUpperCase();
                                        const pTypeBase = pType.includes('TEAM') ? 'Team 🏟️' : pType.includes('GROUP') ? 'Group 👥' : 'Single 👤';
                                        const pGender = pType.includes('BOY') ? '👦' : pType.includes('GIRL') ? '👧' : '🚻';
                                        return <option key={p.id} value={p.id}>{p.code} - {p.name} ({pTypeBase} {pGender})</option>;
                                      })
                                    }
                                  </select>
                                </div>
                              </div>

                              {/* Step 3: Student / Group / Team Selector */}
                              <div className={`step-box ${selectedResultStudent ? 'filled' : 'active'}`}>
                                <div className="step-header">
                                  <div className="step-number">03</div>
                                  <div className="step-title">
                                    {markEntrySection === 'TEAM' ? 'Select Team' : markEntrySection === 'GROUP' ? 'Select Group' : 'Select Student'}
                                  </div>
                                </div>
                                <div className="step-content">
                                  {(() => {
                                    const progObj = programs.find(p => String(p.id) === String(selectedResultProg));
                                    const isGroup = progObj && (progObj.type || '').includes('GROUP');
                                    const isTeam = progObj && (progObj.type || '').includes('TEAM');

                                     if (isTeam) {
                                       // Render Team Selector
                                       return (
                                         <select className="settings-input-v2" value={selectedResultStudent} onChange={(e) => setSelectedResultStudent(e.target.value)} required disabled={!selectedResultProg}>
                                           <option value="">{teams.length === 0 ? '-- No Teams --' : '-- Select Team --'}</option>
                                           {teams.map(team => (
                                             <option key={team.id} value={team.id}>
                                               🏟️ {team.name}
                                             </option>
                                           ))}
                                         </select>
                                       );
                                     } else if (isGroup) {
                                       // Render Group Selector
                                       const filteredGroups = groupRegistrations.filter(g => {
                                         if (!progObj) return false;
                                         return isProgramMatch({ program_id: g.program_id, program_name: g.program_id }, progObj) ||
                                           String(g.program_id) === String(progObj.id) ||
                                           String(g.program_id) === String(progObj.code) ||
                                           String(g.program_id).toLowerCase() === String(progObj.name || '').toLowerCase();
                                       });
                                       return (
                                         <select className="settings-input-v2" value={selectedResultStudent} onChange={(e) => setSelectedResultStudent(e.target.value)} required disabled={!selectedResultProg}>
                                           <option value="">{filteredGroups.length === 0 ? '-- No Groups Registered for this Program --' : '-- Select Group --'}</option>
                                           {filteredGroups.map(g => {
                                             const teamObj = teams.find(t => String(t.id) === String(g.team_id));
                                             return (
                                               <option key={g.id} value={g.id}>
                                                 {g.group_name} [{teamObj ? teamObj.name : 'No Team'}]
                                               </option>
                                             );
                                           })}
                                         </select>
                                       );
                                     } else {
                                       // Render Student Selector (using checkIsStudentRegisteredForProg)
                                       const selectedCatObj = categories.find(c => String(c.id) === String(selectedResultCat));
                                       const isGeneral = selectedCatObj && selectedCatObj.name.toLowerCase().includes('general');

                                       const registeredCandidates = selectedResultProg && progObj
                                         ? students.filter(s => {
                                             if (selectedResultGender !== 'ALL' && selectedResultGender !== 'COMMON' && s.gender !== selectedResultGender) return false;
                                             if (selectedResultCat === 'GENERAL') {
                                               if (!generalCatIds.map(String).includes(String(s.catid || s.catId || ''))) return false;
                                             } else if (!isGeneral) {
                                               if (String(s.catid || s.catId || '') !== String(selectedResultCat)) return false;
                                             }
                                             return checkIsStudentRegisteredForProg(s, progObj);
                                           }).sort((a, b) => (parseInt(a.regno || a.regNo || '0', 10) || 0) - (parseInt(b.regno || b.regNo || '0', 10) || 0))
                                         : [];

                                       const candidatesToDisplay = (selectedResultProg && progObj) ? registeredCandidates : students.filter(s => {
                                         if (selectedResultGender !== 'ALL' && selectedResultGender !== 'COMMON' && s.gender !== selectedResultGender) return false;
                                         if (selectedResultCat === 'GENERAL') {
                                           return generalCatIds.map(String).includes(String(s.catid || s.catId || ''));
                                         }
                                         if (isGeneral) return true;
                                         return String(s.catid || s.catId || '') === String(selectedResultCat);
                                       }).sort((a, b) => (parseInt(a.regno || a.regNo || '0', 10) || 0) - (parseInt(b.regno || b.regNo || '0', 10) || 0));

                                       return (
                                         <select className="settings-input-v2" value={selectedResultStudent} onChange={(e) => setSelectedResultStudent(e.target.value)} required disabled={!selectedResultCat}>
                                           <option value="">{selectedResultCat ? (candidatesToDisplay.length === 0 ? '-- No Students Registered for this Program --' : '-- Select Student --') : 'Select Category First'}</option>
                                           {candidatesToDisplay.map(s => {
                                             const sRegNo = s.regno || s.regNo || '';
                                             const sTeamId = s.teamid || s.teamId || '';
                                             const teamName = (teams.find(t => String(t.id) === String(sTeamId)) || {}).name || '';
                                             const catName = (categories.find(c => String(c.id) === String(s.catid || s.catId)) || {}).name || '';
                                             return <option key={s.id} value={s.id}>{sRegNo} - {s.name} ({s.gender === 'BOY' ? '👦' : '👧'}) [{teamName}] {isGeneral ? `(${catName})` : ''}</option>;
                                           })}
                                         </select>
                                       );
                                     }
                                  })()}
                                </div>
                              </div>

                              {/* Step 4: Place & Grade (Segmented Controls) */}
                              <div className="step-box active">
                                <div className="step-header">
                                  <div className="step-number">04</div>
                                  <div className="step-title">Result Position & Grade</div>
                                </div>
                                <div className="step-content">
                                  <div className="segmented-control-group">
                                    <div className="segmented-control-label">🏆 Select Place</div>
                                    <div className="segmented-control">
                                      {[
                                        { val: '1', label: '1st Place', className: 'place-1' },
                                        { val: '2', label: '2nd Place', className: 'place-2' },
                                        { val: '3', label: '3rd Place', className: 'place-3' },
                                        { val: '0', label: 'No Place' }
                                      ].map(opt => (
                                        <button
                                          key={opt.val}
                                          type="button"
                                          className={`segmented-option ${selectedPlace === opt.val ? `active ${opt.className || ''}` : ''}`}
                                          onClick={() => setSelectedPlace(opt.val)}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="segmented-control-group" style={{ marginTop: '12px' }}>
                                    <div className="segmented-control-label">🎖️ Select Grade</div>
                                    <div className="segmented-control">
                                      {[
                                        { val: 'A', label: 'A Grade', className: 'grade-a' },
                                        { val: 'B', label: 'B Grade', className: 'grade-b' },
                                        { val: 'C', label: 'C Grade', className: 'grade-c' },
                                        { val: 'No', label: 'No Grade' }
                                      ].map(opt => (
                                        <button
                                          key={opt.val}
                                          type="button"
                                          className={`segmented-option ${selectedGrade === opt.val ? `active ${opt.className || ''}` : ''}`}
                                          onClick={() => setSelectedGrade(opt.val)}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <button type="submit" className="btn-premium-action" style={{ marginTop: '16px', background: 'linear-gradient(135deg, #e21c34 0%, #9a0f20 100%)', boxShadow: '0 4px 12px rgba(226, 28, 52, 0.2)' }}>
                                    💾 Save Result
                                  </button>
                                </div>
                              </div>

                            </div>
                          </form>

                          {/* ── Saved Results for this Program ── */}
                          {selectedResultProg && (() => {
                            const progObj = programs.find(p => String(p.id) === String(selectedResultProg));
                            const isGroup = progObj && (progObj.type || '').includes('GROUP');

                            const progSavedResults = resultsList.filter(r => {
                              if (!r || !progObj) return false;
                              const rPid = String(r.progid || r.program_id || r.prog_id || r.program_name || r.programName || '').trim();
                              const pId = String(progObj.id || '').trim();
                              const pCode = String(progObj.code || '').trim();
                              const pName = String(progObj.name || '').trim().toLowerCase();
                              return rPid === pId || rPid === pCode || (pName && rPid.toLowerCase() === pName);
                            });

                            if (progSavedResults.length === 0) return null;

                            const replacementOptions = isGroup
                              ? groupRegistrations.filter(g => {
                                  if (!progObj) return false;
                                  return isProgramMatch({ program_id: g.program_id, program_name: g.program_id }, progObj) ||
                                    String(g.program_id) === String(progObj.id) ||
                                    String(g.program_id) === String(progObj.code) ||
                                    String(g.program_id).toLowerCase() === String(progObj.name || '').toLowerCase();
                                })
                              : students.filter(s => {
                                  if (!s) return false;
                                  if (selectedResultGender && selectedResultGender !== 'ALL' && selectedResultGender !== 'COMMON') {
                                    if (String(s.gender || '').toUpperCase() !== String(selectedResultGender).toUpperCase()) return false;
                                  }
                                  const sCatId = String(s.catid || s.catId || '');
                                  if (isGeneralCat) {
                                    if (safeGenIds.length > 0 && !safeGenIds.includes(sCatId)) return false;
                                  } else {
                                    if (sCatId !== String(selectedResultCat)) return false;
                                  }
                                  if (progObj) {
                                    return checkIsStudentRegisteredForProg(s, progObj);
                                  }
                                  return true;
                                });

                            const placeEmoji = { 'First': '🥇', 'Second': '🥈', 'Third': '🥉', 'No Place': '—' };
                            const gradeBgColor = { 'A': '#dcfce7', 'B': '#dbeafe', 'C': '#fef9c3', '-': '#f1f5f9' };
                            const gradeTextColor = { 'A': '#15803d', 'B': '#1d4ed8', 'C': '#a16207', '-': '#94a3b8' };

                            return (
                              <div style={{ marginTop: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0' }}>
                                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#064e3b' }}>
                                    📋 {lang === 'EN' ? 'Saved Results' : 'സേവ് ചെയ്ത ഫലങ്ങൾ'}
                                  </span>
                                  <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: '800' }}>
                                    {progSavedResults.length} {lang === 'EN' ? 'entries' : 'എൻട്രികൾ'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {progSavedResults.map(r => {
                                    const isEditing = String(editingResultId) === String(r.id);
                                    if (isEditing) {
                                      return (
                                        <div key={r.id} style={{ background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', border: '2px solid #059669', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                          <div style={{ fontWeight: '800', color: '#064e3b', fontSize: '13px' }}>
                                            ✏️ {lang === 'EN' ? 'Editing Result' : 'ഫലം എഡിറ്റ് ചെയ്യുന്നു'}
                                          </div>

                                          <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                                              {isGroup ? (lang === 'EN' ? 'Change Group' : 'ഗ്രൂപ്പ് മാറ്റുക') : (lang === 'EN' ? 'Change Student' : 'വിദ്യാർത്ഥിയെ മാറ്റുക')}
                                            </label>
                                            <select className="settings-input-v2" value={editingResultStudent} onChange={e => setEditingResultStudent(e.target.value)} style={{ fontSize: '13px' }}>
                                              <option value="">{lang === 'EN' ? `-- Keep current (${r.studentname}) --` : `-- നിലവിലുള്ളത് നിലനിർത്തുക --`}</option>
                                              {isGroup
                                                ? replacementOptions.map(g => {
                                                  const tName = (teams.find(t => String(t.id) === String(g.team_id)) || {}).name || '';
                                                  return <option key={g.id} value={g.id}>{g.group_name} [{tName}]</option>;
                                                })
                                                : replacementOptions.map(s => {
                                                  const sReg = s.regno || s.regNo || '';
                                                  const tName = (teams.find(t => String(t.id) === String(s.teamid)) || {}).name || '';
                                                  return <option key={s.id} value={s.id}>{sReg} - {s.name} ({s.gender === 'BOY' ? '👦' : '👧'}) [{tName}]</option>;
                                                })
                                              }
                                            </select>
                                          </div>

                                          <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>🏆 {lang === 'EN' ? 'Place' : 'സ്ഥാനം'}</label>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                              {[{ val: '1', label: '🥇 1st' }, { val: '2', label: '🥈 2nd' }, { val: '3', label: '🥉 3rd' }, { val: '0', label: '— No Place' }].map(opt => (
                                                <button key={opt.val} type="button" onClick={() => setEditingResultPlace(opt.val)} style={{ padding: '6px 12px', borderRadius: '8px', border: '2px solid', fontSize: '12px', fontWeight: '800', cursor: 'pointer', borderColor: editingResultPlace === opt.val ? '#059669' : '#cbd5e1', background: editingResultPlace === opt.val ? '#059669' : '#fff', color: editingResultPlace === opt.val ? '#fff' : '#475569' }}>{opt.label}</button>
                                              ))}
                                            </div>
                                          </div>

                                          <div>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>🎖️ {lang === 'EN' ? 'Grade' : 'ഗ്രേഡ്'}</label>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                              {[{ val: 'A', label: 'A Grade' }, { val: 'B', label: 'B Grade' }, { val: 'C', label: 'C Grade' }, { val: 'No', label: 'No Grade' }].map(opt => (
                                                <button key={opt.val} type="button" onClick={() => setEditingResultGrade(opt.val)} style={{ padding: '6px 12px', borderRadius: '8px', border: '2px solid', fontSize: '12px', fontWeight: '800', cursor: 'pointer', borderColor: editingResultGrade === opt.val ? '#2563eb' : '#cbd5e1', background: editingResultGrade === opt.val ? '#2563eb' : '#fff', color: editingResultGrade === opt.val ? '#fff' : '#475569' }}>{opt.label}</button>
                                              ))}
                                            </div>
                                          </div>

                                          <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="button" onClick={handleUpdateResult} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                                              ✅ {lang === 'EN' ? 'Save Changes' : 'മാറ്റങ്ങൾ സേവ് ചെയ്യുക'}
                                            </button>
                                            <button type="button" onClick={() => { setEditingResultId(null); setEditingResultStudent(''); }} style={{ padding: '10px 16px', borderRadius: '8px', border: '2px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                                              ✕ {lang === 'EN' ? 'Cancel' : 'റദ്ദാക്കുക'}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={r.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>{placeEmoji[r.place] || '—'}</span>
                                        <div style={{ flex: 1, minWidth: '120px' }}>
                                          <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>{r.studentname}</div>
                                          <div style={{ fontSize: '11px', color: '#64748b' }}>{r.teamname || ''}</div>
                                        </div>
                                        <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: '800' }}>{r.place}</span>
                                        <span style={{ background: gradeBgColor[r.grade] || '#f1f5f9', color: gradeTextColor[r.grade] || '#94a3b8', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: '800' }}>{r.grade === '-' ? 'No Grade' : r.grade + ' Grade'}</span>
                                        <span style={{ background: '#f0fdf4', color: '#059669', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: '800' }}>{r.points} pts</span>
                                        <button type="button" onClick={() => {
                                          setEditingResultId(r.id);
                                          const pMap = { 'First': '1', 'Second': '2', 'Third': '3', 'No Place': '0' };
                                          setEditingResultPlace(pMap[r.place] || '1');
                                          const gMap = { 'A': 'A', 'B': 'B', 'C': 'C', '-': 'No' };
                                          setEditingResultGrade(gMap[r.grade] || 'No');
                                          setEditingResultStudent('');
                                        }} style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #3b82f6', background: '#eff6ff', color: '#2563eb', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                                          ✏️ {lang === 'EN' ? 'Edit' : 'എഡിറ്റ്'}
                                        </button>
                                        <button type="button" onClick={() => handleDeleteResult(r.id)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #ef4444', background: '#fef2f2', color: '#dc2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                                          🗑️ {lang === 'EN' ? 'Delete' : 'ഡിലീറ്റ്'}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ); })()}

                    {/* POINTS SETUP SUB-TAB */}
                    {settingsSubTab === 'POINTS' && (
                      <div className="settings-card-v2">
                        <div className="settings-form-box-v2">
                          <h3>⚙️ Design Point Structure</h3>
                          <form onSubmit={handleSavePoints} className="settings-form">

                            <h4 style={{ margin: '10px 0 14px', color: 'var(--primary-light)', fontSize: '14px', fontWeight: '800', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px' }}>
                              👤 Single Events Points
                            </h4>
                            <div className="points-card-container-v2">
                              <div className="points-card-v2">
                                <label>🥇 First Place</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.p1} onChange={e => setPointSystem({ ...pointSystem, p1: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>🥈 Second Place</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.p2} onChange={e => setPointSystem({ ...pointSystem, p2: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>🥉 Third Place</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.p3} onChange={e => setPointSystem({ ...pointSystem, p3: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                            </div>
                            <div className="points-card-container-v2">
                              <div className="points-card-v2">
                                <label>A Grade</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.gA} onChange={e => setPointSystem({ ...pointSystem, gA: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>B Grade</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.gB} onChange={e => setPointSystem({ ...pointSystem, gB: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>C Grade</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.gC} onChange={e => setPointSystem({ ...pointSystem, gC: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                            </div>

                            <h4 style={{ margin: '20px 0 14px', color: '#ef4444', fontSize: '14px', fontWeight: '800', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px' }}>
                              👥 Group Events Points
                            </h4>
                            <div className="points-card-container-v2">
                              <div className="points-card-v2">
                                <label>🥇 First Place</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.gp1} onChange={e => setPointSystem({ ...pointSystem, gp1: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>🥈 Second Place</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.gp2} onChange={e => setPointSystem({ ...pointSystem, gp2: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>🥉 Third Place</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.gp3} onChange={e => setPointSystem({ ...pointSystem, gp3: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                            </div>
                            <div className="points-card-container-v2">
                              <div className="points-card-v2">
                                <label>A Grade</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.gpA} onChange={e => setPointSystem({ ...pointSystem, gpA: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>B Grade</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.gpB} onChange={e => setPointSystem({ ...pointSystem, gpB: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>C Grade</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.gpC} onChange={e => setPointSystem({ ...pointSystem, gpC: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                            </div>

                            <h4 style={{ margin: '20px 0 14px', color: '#f97316', fontSize: '14px', fontWeight: '800', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px' }}>
                              🏟️ Team Events Points
                            </h4>
                            <div className="points-card-container-v2">
                              <div className="points-card-v2">
                                <label>🥇 First Place</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.tp1 ?? 15} onChange={e => setPointSystem({ ...pointSystem, tp1: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>🥈 Second Place</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.tp2 ?? 10} onChange={e => setPointSystem({ ...pointSystem, tp2: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>🥉 Third Place</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.tp3 ?? 5} onChange={e => setPointSystem({ ...pointSystem, tp3: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                            </div>
                            <div className="points-card-container-v2">
                              <div className="points-card-v2">
                                <label>A Grade</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.tpA ?? 5} onChange={e => setPointSystem({ ...pointSystem, tpA: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>B Grade</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.tpB ?? 3} onChange={e => setPointSystem({ ...pointSystem, tpB: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                              <div className="points-card-v2">
                                <label>C Grade</label>
                                <input type="number" className="settings-input-v2" value={pointSystem.tpC ?? 1} onChange={e => setPointSystem({ ...pointSystem, tpC: e.target.value })} required style={{ textAlign: 'center', fontSize: '16px', fontWeight: '800' }} />
                              </div>
                            </div>

                            <button type="submit" className="btn-premium-action" style={{ marginTop: '10px' }}>Save Points Structure</button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* JUDGE SHEET SUB-TAB */}
                    {settingsSubTab === 'JUDGE_SHEET' && (() => {
                      // Filter programs based on selected category and gender
                      const judgeCatObj = categories.find(c => String(c.id) === String(judgeSheetCat));
                      const isJudgeGeneral = judgeCatObj && judgeCatObj.name.toLowerCase().includes('general');

                      const judgePrograms = programs.filter(p => {
                        if (!judgeSheetCat) return false;
                        if (judgeSheetCat === 'GENERAL') {
                          if (!isGeneralProg(p)) return false;
                        } else if (isJudgeGeneral) {
                          if (!isGeneralProg(p) && String(p.catid || p.catId || '') !== String(judgeSheetCat)) return false;
                        } else {
                          if (String(p.catid || p.catId || '') !== String(judgeSheetCat)) return false;
                        }
                        if (!judgeSheetGender) return true;
                        if ((p.type || '').includes('COMMON')) return true;
                        return (p.type || '').includes(judgeSheetGender);
                      });

                      const selectedProgObj = programs.find(p => String(p.id) === String(judgeSheetProg));
                      const selectedCatObj = categories.find(c => String(c.id) === String(judgeSheetCat));

                      // Students registered for this program: strictly use program_registrations
                      const isGroupProg = selectedProgObj && (selectedProgObj.type || '').includes('GROUP');

                      // Build items for Judge Sheet (Single student vs Group/Team)
                      const judgeItems = (judgeSheetProg && selectedProgObj) ? (() => {
                        if (isGroupProg) {
                          // 1. Get explicit group registrations for this program
                          const progGroupRegs = groupRegistrations.filter(g =>
                            String(g.program_id) === String(selectedProgObj.id) ||
                            String(g.program_id) === String(selectedProgObj.code)
                          );

                          if (progGroupRegs.length > 0) {
                            return progGroupRegs.map(g => {
                              const teamObj = teams.find(t => String(t.id) === String(g.team_id));
                              const teamName = g.group_name || (teamObj ? teamObj.name : 'Team');
                              const studentIds = Array.isArray(g.student_ids)
                                ? g.student_ids
                                : (typeof g.student_ids === 'string' ? JSON.parse(g.student_ids || '[]') : []);

                              const leaderId = g.leader_id || (studentIds.length > 0 ? studentIds[0] : null);
                              const leaderStudent = students.find(s => String(s.id) === String(leaderId) || String(s.regno || s.regNo || '').trim() === String(leaderId).trim());
                              const memberStudents = students.filter(s =>
                                studentIds.map(String).some(id => String(s.id) === String(id) || String(s.regno || s.regNo || '').trim() === String(id).trim()) &&
                                String(s.id) !== String(leaderId)
                              );

                              return {
                                id: g.id,
                                isGroup: true,
                                teamName: teamName,
                                teamCode: teamObj ? teamObj.name : '',
                                leaderStudent: leaderStudent,
                                leaderRegNo: leaderStudent ? (leaderStudent.regno || leaderStudent.regNo || '') : '',
                                leaderName: leaderStudent ? leaderStudent.name : '',
                                memberStudents: memberStudents,
                                memberRegNos: memberStudents.map(m => m.regno || m.regNo || '').filter(Boolean),
                                allStudentIds: studentIds
                              };
                            });
                          } else {
                            // Group program fallback: filter registered students for this group program (strictly isolated by selected Category & Gender)
                            const matchingRegs = programRegistrations.filter(r => isProgramMatch(r, selectedProgObj));
                            const baseStudents = students.filter(s => {
                              if (!s) return false;
                              if (judgeSheetGender && judgeSheetGender !== 'COMMON' && judgeSheetGender !== 'ALL') {
                                if (String(s.gender || '').toUpperCase() !== String(judgeSheetGender).toUpperCase()) return false;
                              }
                              const sCatId = String(s.catid || s.catId || '');
                              if (judgeSheetCat === 'GENERAL' || isJudgeGeneral) {
                                if (generalCatIds.length > 0 && !generalCatIds.map(String).includes(sCatId)) return false;
                              } else if (judgeSheetCat) {
                                if (sCatId !== String(judgeSheetCat)) return false;
                              }
                              return matchingRegs.some(r => isStudentMatch(r, s));
                            });

                            const teamGroupMap = {};
                            baseStudents.forEach(s => {
                              const tId = String(s.teamid || s.teamId || 'no_team');
                              if (!teamGroupMap[tId]) teamGroupMap[tId] = [];
                              teamGroupMap[tId].push(s);
                            });

                            return Object.keys(teamGroupMap).map(tId => {
                              const teamSts = teamGroupMap[tId].sort((a, b) => (parseInt(a.regno || a.regNo || '0') || 0) - (parseInt(b.regno || b.regNo || '0') || 0));
                              const teamObj = teams.find(t => String(t.id) === String(tId));
                              const leaderStudent = teamSts[0];
                              const memberStudents = teamSts.slice(1);

                              return {
                                id: `team_${tId}`,
                                isGroup: true,
                                teamName: teamObj ? teamObj.name : 'Team',
                                teamCode: teamObj ? teamObj.name : '',
                                leaderStudent: leaderStudent,
                                leaderRegNo: leaderStudent ? (leaderStudent.regno || leaderStudent.regNo || '') : '',
                                leaderName: leaderStudent ? leaderStudent.name : '',
                                memberStudents: memberStudents,
                                memberRegNos: memberStudents.map(m => m.regno || m.regNo || '').filter(Boolean),
                                allStudentIds: teamSts.map(s => s.id)
                              };
                            });
                          }
                        } else {
                          // Single program: Individual students registered for this program ONLY (strictly isolated by selected Category & Gender)
                          const matchingRegs = programRegistrations.filter(r => isProgramMatch(r, selectedProgObj));
                          const baseStudents = students.filter(s => {
                            if (!s) return false;

                            // 1. Gender Filter (strictly match selected division: BOY / GIRL / COMMON)
                            if (judgeSheetGender && judgeSheetGender !== 'COMMON' && judgeSheetGender !== 'ALL') {
                              if (String(s.gender || '').toUpperCase() !== String(judgeSheetGender).toUpperCase()) return false;
                            }

                            // 2. Category Filter (strictly match selected category: Senior, Junior, etc.)
                            const sCatId = String(s.catid || s.catId || '');
                            if (judgeSheetCat === 'GENERAL' || isJudgeGeneral) {
                              if (generalCatIds.length > 0 && !generalCatIds.map(String).includes(sCatId)) return false;
                            } else if (judgeSheetCat) {
                              if (sCatId !== String(judgeSheetCat)) return false;
                            }

                            // 3. Program Registration Check
                            if (matchingRegs.length > 0) {
                              return matchingRegs.some(r => isStudentMatch(r, s));
                            }
                            return checkIsStudentRegisteredForProg(s, selectedProgObj);
                          });

                          return baseStudents
                            .sort((a, b) => (parseInt(a.regno || a.regNo || '0') || 0) - (parseInt(b.regno || b.regNo || '0') || 0))
                            .map(s => ({
                              id: s.id,
                              isGroup: false,
                              student: s,
                              regNo: s.regno || s.regNo || '',
                              name: s.name || '',
                              teamObj: teams.find(t => String(t.id) === String(s.teamid || s.teamId || ''))
                            }));
                        }
                      })() : [];

                      const buildJudgeSheetHtml = () => {
                        const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                        const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                        const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';
                        const catName = selectedCatObj ? selectedCatObj.name : '';
                        const genderLabel = judgeSheetGender === 'BOY' ? 'Boys' : judgeSheetGender === 'GIRL' ? 'Girls' : 'Common';
                        const progName = selectedProgObj ? `${selectedProgObj.code} - ${selectedProgObj.name}` : '';

                        const rows = judgeItems.map((item, idx) => {
                          if (item.isGroup) {
                            return `<tr style="min-height:50px; height:50px;">
                              <td style="text-align:center; font-weight:700; border:1.5px solid #cbd5e1;">${idx + 1}</td>
                              <td style="text-align:center; font-weight:800; font-size:13px; color:#064e3b; background:#ecfdf5; border:1.5px solid #cbd5e1;">${item.leaderRegNo || '-'}</td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                            </tr>`;
                          } else {
                            return `<tr style="min-height:45px; height:45px;">
                              <td style="text-align:center; font-weight:700; border:1.5px solid #cbd5e1;">${idx + 1}</td>
                              <td style="text-align:center; font-weight:800; font-size:13px; color:#064e3b; background:#ecfdf5; border:1.5px solid #cbd5e1;">${item.regNo}</td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                            </tr>`;
                          }
                        }).join('');

                        return `
<!DOCTYPE html>
<html>
<head>
<title>Judge Sheet - ${progName}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 12mm 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; }
  .sheet-wrapper { border: 3px solid #064e3b; border-radius: 10px; overflow: hidden; }
  .sheet-header {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f766e 100%);
    color: white;
    text-align: center;
    padding: 16px 20px 12px;
  }
  .festival-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    opacity: 0.9;
    margin-bottom: 4px;
  }
  .madrasa-name {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 1px;
    margin-bottom: 3px;
  }
  .madrasa-meta {
    font-size: 11px;
    opacity: 0.8;
  }
  .sheet-subtitle-bar {
    background: #f59e0b;
    padding: 8px 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
    flex-wrap: wrap;
  }
  .subtitle-item { display: flex; align-items: center; gap: 6px; }
  .subtitle-label { font-size: 10px; font-weight: 700; color: #78350f; text-transform: uppercase; letter-spacing: 0.5px; }
  .subtitle-value { font-size: 13px; font-weight: 800; color: #1c1917; }
  .sheet-body { padding: 14px 18px 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead tr { background: linear-gradient(90deg, #064e3b, #0f766e); color: white; }
  th {
    padding: 8px 6px;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid rgba(255,255,255,0.2);
    text-align: center;
  }
  td { padding: 8px 6px; border: 1.5px solid #cbd5e1; min-height: 36px; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .sheet-footer {
    margin-top: 28px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 10px;
  }
  .signature-box {
    text-align: center;
    width: 200px;
  }
  .signature-line {
    border-top: 1.5px solid #1e293b;
    padding-top: 5px;
    font-weight: 700;
    color: #1e293b;
    font-size: 12px;
  }
  .footer-center {
    text-align: center;
    color: #94a3b8;
    font-size: 10px;
  }
</style>
</head>
<body>
<div class="sheet-wrapper">
  <div class="sheet-header">
    <div class="festival-title">${eventName ? eventName : '✦ Milad Fest ✦'}</div>
    ${eventName ? `<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#a7f3d0;opacity:0.9;margin-bottom:3px;">Milad_fest${eventYear ? ' ' + eventYear : ''}</div>` : ''}
    <div class="madrasa-name">${madrasaName}</div>
    <div class="madrasa-meta">Reg No: ${madrasaRegNo} | ${madrasaPlace}</div>
  </div>
  <div class="sheet-subtitle-bar">
    <div class="subtitle-item">
      <span class="subtitle-label">Category:</span>
      <span class="subtitle-value">${catName} (${genderLabel})</span>
    </div>
    <div class="subtitle-item">
      <span class="subtitle-label">Program:</span>
      <span class="subtitle-value">${progName}</span>
    </div>
    <div class="subtitle-item">
      <span class="subtitle-label">${isGroupProg ? 'Total Teams:' : 'Total Participants:'}</span>
      <span class="subtitle-value">${judgeItems.length} ${isGroupProg ? 'Teams' : 'Students'}</span>
    </div>
  </div>
  <div class="sheet-body">
    <table>
      <thead>
        <tr>
          <th style="width:45px; text-align:center;">Sl.No</th>
          <th style="width:90px; text-align:center;">Reg. No</th>
          <th style="width:80px; text-align:center;">Chance No</th>
          <th style="width:75px; text-align:center;">Judge 1</th>
          <th style="width:75px; text-align:center;">Judge 2</th>
          <th style="width:75px; text-align:center;">Total</th>
          <th style="width:65px; text-align:center;">Grade</th>
          <th style="width:65px; text-align:center;">Rank</th>
          <th style="text-align:center;">Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="9" style="text-align:center;color:#94a3b8;padding:30px">No entries registered.</td></tr>'}
      </tbody>
    </table>
    <div class="sheet-footer">
      <div class="signature-box">
        <div style="height:50px"></div>
        <div class="signature-line">Judge Signature 1</div>
      </div>
      <div class="footer-center">
        <div>Milad Fest | ${catName} | ${progName}</div>
        <div style="margin-top:3px">Printed: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
      <div class="signature-box">
        <div style="height:50px"></div>
        <div class="signature-line">Judge Signature 2</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
                      };

                      const handlePrintJudgeSheet = () => {
                        if (!judgeSheetProg) { alert('Please select a program first!'); return; }
                        printHtml(buildJudgeSheetHtml());
                      };

                      const handleDownloadJudgeSheetPDF = () => {
                        if (!judgeSheetProg) { alert('Please select a program first!'); return; }
                        const progName = selectedProgObj ? `${selectedProgObj.code}_${selectedProgObj.name}` : 'JudgeSheet';
                        downloadHtmlAsPdf(buildJudgeSheetHtml(), `JudgeSheet_${progName}.pdf`);
                      };

                      return (
                        <div className="settings-card-container">
                          {/* Toggle tabs: Judge Sheet vs Entry Form */}
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                            <button
                              type="button"
                              onClick={() => setShowEntryForm(false)}
                              style={{
                                padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                                background: !showEntryForm ? 'var(--primary-light)' : 'transparent',
                                color: !showEntryForm ? 'white' : '#64748b',
                                transition: 'all 0.2s'
                              }}
                            >📋 Judge Sheet</button>
                            <button
                              type="button"
                              onClick={() => setShowEntryForm(true)}
                              style={{
                                padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                                background: showEntryForm ? 'var(--primary-light)' : 'transparent',
                                color: showEntryForm ? 'white' : '#64748b',
                                transition: 'all 0.2s'
                              }}
                            >📝 Entry Form</button>
                          </div>

                          {/* ── JUDGE SHEET (existing) ── */}
                          {!showEntryForm && (
                            <>
                              <div className="settings-form-box">
                                <h3>📋 Judge Evaluation Sheet</h3>
                                <div className="settings-form">

                                  {/* Step 1: Category & Gender */}
                                  <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '6px' }}>① Select Category & Division</label>
                                    <select className="settings-input" value={judgeSheetCat && judgeSheetGender ? `${judgeSheetCat}_${judgeSheetGender}` : ''} onChange={e => {
                                      const val = e.target.value;
                                      if (!val) { setJudgeSheetCat(''); setJudgeSheetGender(''); }
                                      else { const [cId, g] = val.split('_'); setJudgeSheetCat(cId); setJudgeSheetGender(g); }
                                      setJudgeSheetProg('');
                                    }}>
                                      <option value="">-- Select Category & Division --</option>
                                      {categories.map(c => (
                                        <React.Fragment key={c.id}>
                                          <option value={`${c.id}_BOY`}>{c.name} - Boys</option>
                                          <option value={`${c.id}_GIRL`}>{c.name} - Girls</option>
                                          <option value={`${c.id}_COMMON`}>{c.name} - Common</option>
                                        </React.Fragment>
                                      ))}
                                      {generalCatIds.length > 0 && (
                                        <React.Fragment>
                                          <option value="GENERAL_BOY">GENERAL - Boys</option>
                                          <option value="GENERAL_GIRL">GENERAL - Girls</option>
                                          <option value="GENERAL_COMMON">GENERAL - Common</option>
                                        </React.Fragment>
                                      )}
                                    </select>
                                  </div>

                                  {/* Step 2: Program */}
                                  <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '6px' }}>② Select Program</label>
                                    <select className="settings-input" value={judgeSheetProg} onChange={e => setJudgeSheetProg(e.target.value)} disabled={!judgeSheetCat}>
                                      <option value="">{judgeSheetCat ? '-- Select Program --' : 'Select Category First'}</option>
                                      {judgePrograms.map(p => {
                                        const pTypeLabel = (p.type || '').includes('GROUP') ? 'Group 👥' : 'Single 👤';
                                        const pGenderLabel = (p.type || '').includes('BOY') ? '👦' : (p.type || '').includes('GIRL') ? '👧' : '🚻';
                                        return <option key={p.id} value={p.id}>{p.code} - {p.name} ({pTypeLabel} {pGenderLabel})</option>;
                                      })}
                                    </select>
                                  </div>

                                  {/* Preview info */}
                                  {judgeSheetProg && (
                                    <div style={{ background: '#fefce8', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#854d0e', marginBottom: '4px' }}>📊 Preview</div>
                                      <div style={{ fontSize: '13px', color: '#1e293b' }}>
                                        <strong>{judgeItems.length}</strong> {isGroupProg ? 'teams' : 'participants'} registered in{' '}
                                        <strong>{selectedProgObj ? selectedProgObj.name : ''}</strong>
                                      </div>
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      onClick={handlePrintJudgeSheet}
                                      disabled={!judgeSheetProg}
                                      className="btn-add-action"
                                      style={{ flex: 1, background: judgeSheetProg ? '#0f766e' : '#94a3b8', cursor: judgeSheetProg ? 'pointer' : 'not-allowed' }}
                                    >
                                      🖨️ Print Judge Sheet
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleDownloadJudgeSheetPDF}
                                      disabled={!judgeSheetProg}
                                      className="btn-add-action"
                                      style={{ flex: 1, background: judgeSheetProg ? '#064e3b' : '#94a3b8', cursor: judgeSheetProg ? 'pointer' : 'not-allowed' }}
                                    >
                                      📥 Download Judge Sheet PDF
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Preview list */}
                              <div className="settings-list-box" style={{ maxHeight: 'none' }}>
                                <h3>📋 {judgeSheetProg ? `${isGroupProg ? 'Teams' : 'Participants'} – ${selectedProgObj ? selectedProgObj.name : ''}` : 'Select a Program'}</h3>
                                {!judgeSheetProg ? (
                                  <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>Please select a category and program above.</p>
                                ) : judgeItems.length === 0 ? (
                                  <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>No entries registered in this category/division.</p>
                                ) : (
                                  <>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                      📌 {judgeItems.length} {isGroupProg ? 'teams' : 'participants'} will appear on the sheet.
                                    </div>
                                    {judgeItems.map((item, idx) => {
                                      if (item.isGroup) {
                                        return (
                                          <div key={item.id} style={{
                                            display: 'flex', flexDirection: 'column', gap: '4px',
                                            padding: '10px 12px', borderBottom: '1px solid #e2e8f0',
                                            background: idx % 2 === 0 ? '#f8fafc' : '#fff'
                                          }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#064e3b' }}>
                                                🚩 {item.teamName}
                                              </div>
                                              {item.teamCode && (
                                                <span style={{ fontSize: '11px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', padding: '1px 6px', fontWeight: '800' }}>
                                                  {item.teamCode}
                                                </span>
                                              )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>
                                              👑 Leader: <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px' }}>Reg No: {item.leaderRegNo || '-'}</span> {item.leaderName ? `(${item.leaderName})` : ''}
                                            </div>
                                            {item.memberStudents && item.memberStudents.length > 0 && (
                                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                👥 Members: {item.memberStudents.map(m => `Reg No: ${m.regno || m.regNo || ''} (${m.name})`).join(', ')}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      } else {
                                        const s = item.student;
                                        const sRegNo = item.regNo;
                                        const teamObj = item.teamObj;
                                        return (
                                          <div key={item.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '8px 10px', borderBottom: '1px solid #e2e8f0',
                                            background: idx % 2 === 0 ? '#f8fafc' : '#fff'
                                          }}>
                                            <span style={{
                                              background: '#064e3b', color: 'white', borderRadius: '6px',
                                              padding: '3px 8px', fontWeight: '700', fontSize: '13px', minWidth: '50px', textAlign: 'center'
                                            }}>{sRegNo}</span>
                                            <span style={{ flex: 1, fontSize: '13px', color: '#1e293b' }}>{s.name}</span>
                                            <span style={{ fontSize: '11px', color: '#64748b' }}>{teamObj ? teamObj.name : ''}</span>
                                            <span style={{ fontSize: '11px', color: s.gender === 'BOY' ? '#3b82f6' : '#ec4899' }}
                                            >{s.gender === 'BOY' ? '👦' : '👧'}</span>
                                          </div>
                                        );
                                      }
                                    })}
                                    {/* Download Participants PDF button */}
                                    <div style={{ padding: '12px 10px 4px' }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const catName = selectedCatObj ? selectedCatObj.name : '';
                                          const genderLabel = judgeSheetGender === 'BOY' ? 'Boys' : judgeSheetGender === 'GIRL' ? 'Girls' : 'Common';
                                          const progName = selectedProgObj ? `${selectedProgObj.code} - ${selectedProgObj.name}` : '';
                                          const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';

                                          const rows = judgeItems.map((item, idx) => {
                                            if (item.isGroup) {
                                              const leaderDisplay = item.leaderRegNo ? `Reg No: <b>${item.leaderRegNo}</b> (${item.leaderName})` : '-';
                                              const membersDisplay = item.memberStudents && item.memberStudents.length > 0
                                                ? item.memberStudents.map(m => `Reg No: ${m.regno || m.regNo || ''} (${m.name})`).join(', ')
                                                : '';

                                              return `<tr style="background:${idx % 2 === 0 ? '#f8fafc' : '#fff'}">
                                            <td style="text-align:left;font-weight:800;font-size:13px;color:#064e3b;padding:10px 12px;border:1px solid #cbd5e1">🚩 ${item.teamName}</td>
                                            <td style="padding:10px 12px;font-size:12px;color:#1e293b;border:1px solid #cbd5e1">👑 ${leaderDisplay}</td>
                                            <td style="padding:10px 12px;font-size:11px;color:#475569;border:1px solid #cbd5e1">👥 ${membersDisplay}</td>
                                          </tr>`;
                                            } else {
                                              const sRegNo = item.regNo;
                                              const sName = item.name;
                                              const teamName = item.teamObj ? item.teamObj.name : '';
                                              return `<tr style="background:${idx % 2 === 0 ? '#f8fafc' : '#fff'}">
                                            <td style="text-align:center;font-weight:800;font-size:13px;color:#064e3b;background:#ecfdf5;padding:8px 10px;border:1px solid #cbd5e1">${sRegNo}</td>
                                            <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#1e293b;border:1px solid #cbd5e1">${sName}</td>
                                            <td style="padding:8px 12px;font-size:12px;color:#475569;border:1px solid #cbd5e1">${teamName}</td>
                                          </tr>`;
                                            }
                                          }).join('');

                                          const html = `<!DOCTYPE html><html><head><title>${isGroupProg ? 'Teams' : 'Participants'} - ${progName}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 15mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#fff; color:#1e293b; }
  .wrapper { border:3px solid #064e3b; border-radius:10px; overflow:hidden; }
  .hdr { background:linear-gradient(135deg,#064e3b,#0f766e); color:#fff; text-align:center; padding:16px 20px 12px; }
  .hdr-title { font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; opacity:0.85; margin-bottom:4px; }
  .hdr-name { font-size:20px; font-weight:800; margin-bottom:2px; }
  .subtitle-bar { background:#f59e0b; padding:7px 20px; display:flex; justify-content:center; gap:24px; flex-wrap:wrap; }
  .sl { display:flex; align-items:center; gap:5px; }
  .sl-lbl { font-size:9px; font-weight:700; color:#78350f; text-transform:uppercase; }
  .sl-val { font-size:12px; font-weight:800; color:#1c1917; }
  .body { padding:14px 16px 18px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  thead tr { background:linear-gradient(90deg,#064e3b,#0f766e); color:#fff; }
  th { padding:9px 10px; font-weight:700; font-size:11px; text-transform:uppercase; border:1px solid rgba(255,255,255,0.2); text-align:left; }
  td { padding:9px 10px; border:1px solid #cbd5e1; }
</style></head><body>
<div class="wrapper">
  <div class="hdr"><div class="hdr-title">${eventName ? eventName : '✦ Milad Fest ✦'}</div>${eventName ? `<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#a7f3d0;margin:1px 0 2px;">Milad_fest${eventYear ? ' ' + eventYear : ''}</div>` : ''}<div class="hdr-name">${madrasaName}</div></div>
  <div class="subtitle-bar">
    <div class="sl"><span class="sl-lbl">Category:</span><span class="sl-val">${catName} (${genderLabel})</span></div>
    <div class="sl"><span class="sl-lbl">Program:</span><span class="sl-val">${progName}</span></div>
    <div class="sl"><span class="sl-lbl">Total:</span><span class="sl-val">${judgeItems.length} ${isGroupProg ? 'Teams' : 'Participants'}</span></div>
  </div>
  <div class="body">
    <table><thead><tr>
      ${isGroupProg ? '<th style="width:140px">Team</th><th style="width:180px">Leader</th><th>Members</th>' : '<th style="width:100px">Reg. No</th><th>Student Name</th><th style="width:150px">Team</th>'}
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:20px">No entries registered.</td></tr>'}</tbody></table>
  </div>
</div></body></html>`;
                                          downloadHtmlAsPdf(html, `Participants_${progName}.pdf`);
                                        }}
                                        className="btn-add-action"
                                        style={{ width: '100%', background: '#1d4ed8' }}
                                      >
                                        📄 Download ${isGroupProg ? 'Teams' : 'Participants'} PDF
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          )}

                          {/* ── ENTRY FORM (new) ── */}
                          {showEntryForm && (() => {
                            // Filter students by category, gender, and team
                            const efCatObj = categories.find(c => String(c.id) === String(entryFormCat));
                            const isEfGeneral = efCatObj && efCatObj.name.toLowerCase().includes('general');

                            const efStudents = (entryFormCat && entryFormTeam) ? students.filter(s => {
                              // Gender filter
                              if (entryFormGender && entryFormGender !== 'COMMON' && s.gender !== entryFormGender) return false;
                              // Team filter
                              if (String(s.teamid || s.teamId || '') !== String(entryFormTeam)) return false;
                              // Category filter
                              if (entryFormCat === 'GENERAL') {
                                return generalCatIds.map(String).includes(String(s.catid || s.catId || ''));
                              }
                              if (isEfGeneral) return true;
                              return String(s.catid || s.catId || '') === String(entryFormCat);
                            }).sort((a, b) => {
                              const aReg = parseInt(a.regno || a.regNo || '0') || 0;
                              const bReg = parseInt(b.regno || b.regNo || '0') || 0;
                              return aReg - bReg;
                            }) : [];

                            // Get programs for this category+gender (both single and group)
                            const efAllPrograms = entryFormCat ? programs.filter(p => {
                              if (entryFormCat === 'GENERAL') {
                                 if (!isGeneralProg(p)) return false;
                               } else if (isEfGeneral) {
                                 if (!isGeneralProg(p) && String(p.catid || p.catId || '') !== String(entryFormCat)) return false;
                               } else {
                                 if (String(p.catid || p.catId || '') !== String(entryFormCat)) return false;
                               }
                              if (!entryFormGender || entryFormGender === 'COMMON') return true;
                              const pt = (p.type || '').toUpperCase();
                              if (pt.includes('COMMON') || (!pt.includes('BOY') && !pt.includes('GIRL'))) return true;
                              return pt.includes((entryFormGender || '').toUpperCase());
                            }) : [];

                            const efSinglePrograms = efAllPrograms.filter(p => !(p.type || '').includes('GROUP'));
                            const efGroupPrograms = efAllPrograms.filter(p => (p.type || '').includes('GROUP'));

                            // Teams that have students in this category+gender
                            const efTeamsWithStudents = entryFormCat ? teams.filter(t => {
                              return students.some(s => {
                                if (entryFormGender && entryFormGender !== 'COMMON' && s.gender !== entryFormGender) return false;
                                if (String(s.teamid || s.teamId || '') !== String(t.id)) return false;
                                if (entryFormCat === 'GENERAL') {
                                  return generalCatIds.map(String).includes(String(s.catid || s.catId || ''));
                                }
                                if (isEfGeneral) return true;
                                return String(s.catid || s.catId || '') === String(entryFormCat);
                              });
                            }) : [];

                            const efSelectedTeamObj = teams.find(t => String(t.id) === String(entryFormTeam));

                            // PDF generation
                            const handleDownloadEntryFormPDF = () => {
                              if (!entryFormCat || !entryFormTeam) {
                                alert('Please select a category and team first!');
                                return;
                              }
                              const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                              const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                              const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';
                              const catName = efCatObj ? efCatObj.name : (entryFormCat === 'GENERAL' ? 'GENERAL' : '');
                              const genderLabel = entryFormGender === 'BOY' ? 'Boys' : entryFormGender === 'GIRL' ? 'Girls' : 'Common';
                              const teamName = efSelectedTeamObj ? efSelectedTeamObj.name : '';

                              const allProgs = [...efSinglePrograms, ...efGroupPrograms];

                              // Build column headers for programs
                              const progHeaders = allProgs.map((p) => {
                                const headerLabel = p.name ? `${p.name} (${p.code})` : (p.code || '');
                                return `<th style="background:#f1f5f9;color:#0f172a;border:1px solid #94a3b8;padding:4px 2px;font-size:9px;min-width:24px;max-width:34px;height:85px;vertical-align:middle;text-align:center;box-sizing:border-box;"><div style="writing-mode:vertical-rl;text-orientation:mixed;white-space:nowrap;display:inline-block;margin:0 auto;line-height:1.3;transform:rotate(180deg);color:#0f172a;font-weight:700;">${headerLabel}</div></th>`;
                              }).join('');

                              // Single/Group separator header
                              const singleColSpan = efSinglePrograms.length;
                              const groupColSpan = efGroupPrograms.length;

                              let programGroupHeader = '';
                              if (singleColSpan > 0) {
                                programGroupHeader += `<th colspan="${singleColSpan}" style="text-align:center;background:#dbeafe;color:#1e40af;font-size:10px;padding:5px 2px;border:1px solid #94a3b8">Single (${singleColSpan})</th>`;
                              }
                              if (groupColSpan > 0) {
                                programGroupHeader += `<th colspan="${groupColSpan}" style="text-align:center;background:#fce7f3;color:#be185d;font-size:10px;padding:5px 2px;border:1px solid #94a3b8">Group (${groupColSpan})</th>`;
                              }

                              // Build student rows
                              const rows = efStudents.map((s) => {
                                const sRegNo = s.regno || s.regNo || '';
                                const sName = s.name || '';
                                let singleCount = 0;
                                let groupCount = 0;

                                const progCells = allProgs.map((p) => {
                                  const isGroup = (p.type || '').includes('GROUP');
                                  let isRegistered = false;

                                  if (isGroup) {
                                    const inGroupTable = groupRegistrations.some(g => {
                                      const pMatch = String(g.program_id) === String(p.id) || String(g.program_id) === String(p.code) || String(g.program_id) === String(p.name);
                                      if (!pMatch) return false;
                                      const mIds = Array.isArray(g.student_ids) ? g.student_ids : (typeof g.student_ids === 'string' ? JSON.parse(g.student_ids || '[]') : []);
                                      return mIds.some(id => String(id) === String(s.id) || String(id) === String(s.regno || s.regNo || '').trim());
                                    });
                                    const inProgRegTable = programRegistrations.some(r => isProgramMatch(r, p) && isStudentMatch(r, s));
                                    isRegistered = inGroupTable || inProgRegTable;
                                    if (isRegistered) groupCount++;
                                  } else {
                                    isRegistered = programRegistrations.some(r => isProgramMatch(r, p) && isStudentMatch(r, s));
                                    if (isRegistered) singleCount++;
                                  }

                                  return `<td style="text-align:center;padding:4px 2px;font-size:14px;font-weight:800;color:#064e3b;border:1px solid #cbd5e1;${isRegistered ? 'background:#dcfce7;' : ''}">${isRegistered ? '✓' : ''}</td>`;
                                }).join('');

                                const totalCount = singleCount + groupCount;

                                return `<tr>
                                  <td style="text-align:center;font-weight:700;font-size:12px;color:#064e3b;background:#ecfdf5;padding:6px 4px;border:1px solid #cbd5e1;white-space:nowrap">${sRegNo}</td>
                                  <td style="padding:6px 6px;font-size:11px;font-weight:600;color:#1e293b;border:1px solid #cbd5e1;white-space:nowrap">${sName}</td>
                                  ${progCells}
                                  <td style="text-align:center;font-weight:800;font-size:12px;color:#064e3b;background:#f0fdf4;padding:4px;border:1px solid #cbd5e1">${singleCount}</td>
                                  <td style="text-align:center;font-weight:800;font-size:12px;color:#7c3aed;background:#f5f3ff;padding:4px;border:1px solid #cbd5e1">${groupCount}</td>
                                  <td style="text-align:center;font-weight:900;font-size:13px;color:#b45309;background:#fffbeb;padding:4px;border:1px solid #cbd5e1">${totalCount}</td>
                                </tr>`;
                              }).join('');

                              const html = `
<!DOCTYPE html>
<html>
<head>
<title>Entry Form - ${catName} ${genderLabel} - ${teamName}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 10mm 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; }
  .sheet-wrapper { border: 3px solid #064e3b; border-radius: 10px; overflow: hidden; }
  .sheet-header {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f766e 100%);
    color: white; text-align: center; padding: 14px 20px 10px;
  }
  .festival-title { font-size: 18px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px; }
  .madrasa-info { display: flex; justify-content: center; gap: 30px; margin-top: 6px; flex-wrap: wrap; }
  .madrasa-info-item { display: flex; align-items: center; gap: 6px; }
  .info-label { font-size: 9px; font-weight: 600; color: #94d0b0; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-value { font-size: 12px; font-weight: 800; color: #fbbf24; }
  .category-bar {
    background: #f59e0b; padding: 8px 20px;
    display: flex; justify-content: center; align-items: center; gap: 30px; flex-wrap: wrap;
  }
  .cat-item { display: flex; align-items: center; gap: 6px; }
  .cat-label { font-size: 10px; font-weight: 700; color: #78350f; text-transform: uppercase; }
  .cat-value { font-size: 14px; font-weight: 900; color: #1c1917; }
  .sheet-body { padding: 10px 12px 14px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr.group-header th { border: 1px solid #94a3b8; }
  tr.prog-header th { border: 1px solid #94a3b8; }
  th { padding: 6px 4px; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; }
  .main-header th { background: linear-gradient(90deg, #064e3b, #0f766e); color: white; border: 1px solid rgba(255,255,255,0.2); }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .sheet-footer {
    margin-top: 16px; display: flex; justify-content: space-between;
    padding: 0 10px; font-size: 10px; color: #94a3b8;
  }
</style>
</head>
<body>
<div class="sheet-wrapper">
  <div class="sheet-header">
    <div class="festival-title">${eventName ? eventName : '✦ Milad Fest ✦'}</div>
    ${eventName ? `<div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#a7f3d0;opacity:0.9;margin-bottom:3px;">Milad_fest${eventYear ? ' ' + eventYear : ''}</div>` : ''}
    <div class="madrasa-info">
      <div class="madrasa-info-item"><span class="info-label">Madrasa:</span><span class="info-value">${madrasaName}</span></div>
      <div class="madrasa-info-item"><span class="info-label">Reg No:</span><span class="info-value">${madrasaRegNo}</span></div>
      <div class="madrasa-info-item"><span class="info-label">Place:</span><span class="info-value">${madrasaPlace}</span></div>
    </div>
  </div>
  <div class="category-bar">
    <div class="cat-item"><span class="cat-label">Category:</span><span class="cat-value">${catName}</span></div>
    <div class="cat-item"><span class="cat-label">Division:</span><span class="cat-value">${genderLabel}</span></div>
    <div class="cat-item"><span class="cat-label">Team:</span><span class="cat-value">${teamName}</span></div>
  </div>
  <div class="sheet-body">
    <table>
      <thead>
        <tr class="group-header">
          <th rowspan="2" style="background:#064e3b;color:white;width:55px;border:1px solid rgba(255,255,255,0.2)">Reg</th>
          <th rowspan="2" style="background:#064e3b;color:white;min-width:100px;text-align:left;padding-left:8px;border:1px solid rgba(255,255,255,0.2)">Name</th>
          ${programGroupHeader}
          <th rowspan="2" style="background:#064e3b;color:white;width:30px;font-size:9px;border:1px solid rgba(255,255,255,0.2)">S</th>
          <th rowspan="2" style="background:#064e3b;color:white;width:30px;font-size:9px;border:1px solid rgba(255,255,255,0.2)">G</th>
          <th rowspan="2" style="background:#b45309;color:white;width:35px;font-size:9px;border:1px solid rgba(255,255,255,0.2)">Total</th>
        </tr>
        <tr class="prog-header" style="background:#f1f5f9">
          ${progHeaders}
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="' + (allProgs.length + 5) + '" style="text-align:center;color:#94a3b8;padding:30px">No students found.</td></tr>'}
      </tbody>
    </table>
    <div class="sheet-footer">
      <div>Total Students: ${efStudents.length} | Single Programs: ${singleColSpan} | Group Programs: ${groupColSpan} | Total Programs: ${allProgs.length}</div>
      <div>Printed: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>
</div>
</body>
</html>`;
                              const catName2 = efCatObj ? efCatObj.name : (entryFormCat === 'GENERAL' ? 'General' : 'Entry');
                              const teamName2 = efSelectedTeamObj ? efSelectedTeamObj.name : 'Team';
                              downloadHtmlAsPdf(html, `EntryForm_${catName2}_${teamName2}.pdf`);
                            };

                            return (
                              <>
                                <div className="settings-form-box">
                                  <h3>📝 Entry Form</h3>
                                  <div className="settings-form">

                                    {/* Step 1: Category & Division */}
                                    <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '6px' }}>① Select Category & Division</label>
                                      <select className="settings-input" value={entryFormCat && entryFormGender ? `${entryFormCat}_${entryFormGender}` : ''} onChange={e => {
                                        const val = e.target.value;
                                        if (!val) { setEntryFormCat(''); setEntryFormGender(''); }
                                        else { const [cId, g] = val.split('_'); setEntryFormCat(cId); setEntryFormGender(g); }
                                        setEntryFormTeam('');
                                      }}>
                                        <option value="">-- Select Category & Division --</option>
                                        {categories.map(c => (
                                          <React.Fragment key={c.id}>
                                            <option value={`${c.id}_BOY`}>{c.name} - Boys</option>
                                            <option value={`${c.id}_GIRL`}>{c.name} - Girls</option>
                                            <option value={`${c.id}_COMMON`}>{c.name} - Common</option>
                                          </React.Fragment>
                                        ))}
                                        {generalCatIds.length > 0 && (
                                          <React.Fragment>
                                            <option value="GENERAL_BOY">GENERAL - Boys</option>
                                            <option value="GENERAL_GIRL">GENERAL - Girls</option>
                                            <option value="GENERAL_COMMON">GENERAL - Common</option>
                                          </React.Fragment>
                                        )}
                                      </select>
                                    </div>

                                    {/* Step 2: Team */}
                                    <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '6px' }}>② Select Team</label>
                                      <select className="settings-input" value={entryFormTeam} onChange={e => setEntryFormTeam(e.target.value)} disabled={!entryFormCat}>
                                        <option value="">{entryFormCat ? '-- Select Team --' : 'Select Category First'}</option>
                                        {efTeamsWithStudents.map(t => (
                                          <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Preview info */}
                                    {entryFormTeam && (
                                      <div style={{ background: '#fefce8', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#854d0e', marginBottom: '6px' }}>📊 Preview</div>
                                        <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: '1.6' }}>
                                          <strong>{efStudents.length}</strong> students in <strong>{efSelectedTeamObj ? efSelectedTeamObj.name : ''}</strong><br />
                                          <span style={{ color: '#064e3b' }}>Single Programs: <strong>{efSinglePrograms.length}</strong></span> |
                                          <span style={{ color: '#7c3aed' }}> Group Programs: <strong>{efGroupPrograms.length}</strong></span> |
                                          <span style={{ color: '#b45309' }}> Total: <strong>{efAllPrograms.length}</strong></span>
                                        </div>
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={handleDownloadEntryFormPDF}
                                      disabled={!entryFormTeam}
                                      className="btn-add-action"
                                      style={{ background: entryFormTeam ? '#064e3b' : '#94a3b8', cursor: entryFormTeam ? 'pointer' : 'not-allowed' }}
                                    >
                                      📥 Download Entry Form PDF
                                    </button>
                                  </div>
                                </div>

                                {/* Preview table */}
                                {entryFormTeam && efStudents.length > 0 && (
                                  <div className="settings-list-box" style={{ maxHeight: 'none', overflowX: 'auto' }}>
                                    <h3>📝 Entry Form Preview – {efSelectedTeamObj ? efSelectedTeamObj.name : ''}</h3>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                      📌 {efStudents.length} students | {efSinglePrograms.length} single + {efGroupPrograms.length} group programs
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                        <thead>
                                          <tr>
                                            <th rowSpan={2} style={{ background: '#064e3b', color: 'white', padding: '6px 4px', border: '1px solid #94a3b8', width: '50px' }}>Reg</th>
                                            <th rowSpan={2} style={{ background: '#064e3b', color: 'white', padding: '6px 4px', border: '1px solid #94a3b8', textAlign: 'left', minWidth: '80px' }}>Name</th>
                                            {efSinglePrograms.length > 0 && <th colSpan={efSinglePrograms.length} style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 2px', border: '1px solid #94a3b8', fontSize: '10px' }}>Single ({efSinglePrograms.length})</th>}
                                            {efGroupPrograms.length > 0 && <th colSpan={efGroupPrograms.length} style={{ background: '#fce7f3', color: '#be185d', padding: '4px 2px', border: '1px solid #94a3b8', fontSize: '10px' }}>Group ({efGroupPrograms.length})</th>}
                                            <th rowSpan={2} style={{ background: '#064e3b', color: 'white', padding: '4px', border: '1px solid #94a3b8', width: '25px', fontSize: '9px' }}>S</th>
                                            <th rowSpan={2} style={{ background: '#064e3b', color: 'white', padding: '4px', border: '1px solid #94a3b8', width: '25px', fontSize: '9px' }}>G</th>
                                            <th rowSpan={2} style={{ background: '#b45309', color: 'white', padding: '4px', border: '1px solid #94a3b8', width: '30px', fontSize: '9px' }}>Total</th>
                                          </tr>
                                          <tr>
                                            {[...efSinglePrograms, ...efGroupPrograms].map(p => (
                                              <th key={p.id} style={{ background: '#f1f5f9', padding: '4px 2px', border: '1px solid #cbd5e1', fontSize: '9px', height: '80px', verticalAlign: 'middle', textAlign: 'center', boxSizing: 'border-box' }}>
                                                <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', whiteSpace: 'nowrap', display: 'inline-block', margin: '0 auto', lineHeight: '1.3' }}>
                                                  {p.name ? `${p.name} (${p.code})` : (p.code || '')}
                                                </div>
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {efStudents.map((s, idx) => {
                                            const sRegNo = s.regno || s.regNo || '';
                                            let sc = 0, gc = 0;
                                            const allProgsArr = [...efSinglePrograms, ...efGroupPrograms];
                                            return (
                                              <tr key={s.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                                <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '11px', color: '#064e3b', background: '#ecfdf5', padding: '5px 3px', border: '1px solid #cbd5e1' }}>{sRegNo}</td>
                                                <td style={{ padding: '5px 4px', fontWeight: '600', color: '#1e293b', border: '1px solid #cbd5e1', whiteSpace: 'nowrap', fontSize: '10px' }}>{s.name}</td>
                                                                                                 {allProgsArr.map(p => {
                                                   const isGroup = (p.type || '').includes('GROUP');
                                                   const isReg = checkIsStudentRegisteredForProg(s, p);
                                                   if (isReg) {
                                                     if (isGroup) gc++;
                                                     else sc++;
                                                   }
                                                   return <td key={p.id} style={{ textAlign: 'center', padding: '3px', border: '1px solid #cbd5e1', fontSize: '12px', background: isReg ? '#ecfdf5' : '' }}>{isReg ? '✓' : ''}</td>;
                                                 })}
                                                <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '11px', color: '#064e3b', background: '#f0fdf4', padding: '3px', border: '1px solid #cbd5e1' }}>{sc}</td>
                                                <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '11px', color: '#7c3aed', background: '#f5f3ff', padding: '3px', border: '1px solid #cbd5e1' }}>{gc}</td>
                                                <td style={{ textAlign: 'center', fontWeight: '900', fontSize: '12px', color: '#b45309', background: '#fffbeb', padding: '3px', border: '1px solid #cbd5e1' }}>{sc + gc}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      );
                    })()}
                    {/* CONTROL SUB-TAB */}
                    {settingsSubTab === 'CONTROL' && (() => {
                      const handleToggleVisibility = async (key) => {
                        let newControls;
                        if (key === 'ALL_ON') {
                          newControls = {
                            scoreboard: true,
                            results_PROGRAM_WINNERS: true,
                            results_STUDENT_REPORT: true,
                            results_RESULTS_HISTORY: true,
                            results_CHAMPIONS: true,
                          };
                        } else if (key === 'ALL_OFF') {
                          newControls = {
                            scoreboard: false,
                            results_PROGRAM_WINNERS: false,
                            results_STUDENT_REPORT: false,
                            results_RESULTS_HISTORY: false,
                            results_CHAMPIONS: false,
                          };
                        } else {
                          newControls = normalizeVisibilityControls({
                            ...visibilityControls,
                            [key]: !visibilityControls[key]
                          });
                        }

                        // 1. Instant optimistic UI update (< 10ms)
                        setVisibilityControls(newControls);

                        const rNum = String(loggedInMadrasa ? (loggedInMadrasa.regNumber || loggedInMadrasa.regnumber || loggedInMadrasa.reg_number) : '').trim();
                        try {
                          // Save to all local storage keys & main cache object so it NEVER gets overwritten
                          localStorage.setItem('milad_visibility_controls_latest', JSON.stringify(newControls));
                          if (rNum) {
                            localStorage.setItem(`milad_visibility_controls_${rNum}`, JSON.stringify(newControls));
                            localStorage.setItem(`visibility_controls_${rNum}`, JSON.stringify(newControls));

                            const raw = localStorage.getItem(`cached_data_${rNum}`);
                            if (raw) {
                              const cacheObj = JSON.parse(raw);
                              cacheObj.visibilityControls = newControls;
                              localStorage.setItem(`cached_data_${rNum}`, JSON.stringify(cacheObj));
                            }
                          }
                        } catch (e) {}

                        // 2. Save to Supabase cloud (Dual strategy: update both place column part 8 AND visibility_controls column)
                        if (rNum || loggedInMadrasa?.id) {
                          try {
                            const mId = loggedInMadrasa?.id;
                            const numReg = parseInt(rNum, 10);
                            const isNumValid = !isNaN(numReg) && String(numReg) === String(rNum).trim();

                            let md = null;
                            if (mId) {
                              const { data } = await queryWithRetry(() =>
                                supabase.from('madrasas').select('place').eq('id', mId).maybeSingle()
                              );
                              md = data;
                            }
                            if (!md && isNumValid) {
                              const { data } = await queryWithRetry(() =>
                                supabase.from('madrasas').select('place').or(`regNumber.eq.${rNum},regNumber.eq.${numReg}`).maybeSingle()
                              );
                              md = data;
                            }
                            if (!md && rNum) {
                              const { data } = await queryWithRetry(() =>
                                supabase.from('madrasas').select('place').eq('regNumber', String(rNum)).maybeSingle()
                              );
                              md = data;
                            }

                            const updatedPlace = makePlaceString(md ? md.place : '', {
                              visibilityControls: encodeURIComponent(JSON.stringify(newControls))
                            });

                            // Update place column (always exists in schema and stores part 8 visibilityControls)
                            if (mId) {
                              await queryWithRetry(() =>
                                supabase.from('madrasas').update({ place: updatedPlace }).eq('id', mId)
                              );
                            } else if (isNumValid) {
                              await queryWithRetry(() =>
                                supabase.from('madrasas').update({ place: updatedPlace }).or(`regNumber.eq.${rNum},regNumber.eq.${numReg}`)
                              );
                            } else if (rNum) {
                              await queryWithRetry(() =>
                                supabase.from('madrasas').update({ place: updatedPlace }).eq('regNumber', String(rNum))
                              );
                            }

                            // Secondary fallback: update visibility_controls column if it exists
                            try {
                              if (mId) {
                                await supabase.from('madrasas').update({ visibility_controls: JSON.stringify(newControls) }).eq('id', mId);
                              } else if (rNum) {
                                await supabase.from('madrasas').update({ visibility_controls: JSON.stringify(newControls) }).eq('regNumber', String(rNum));
                              }
                            } catch (e2) {}
                          } catch (e) {
                            console.warn("Supabase visibility_controls update error:", e);
                          }
                        }
                      };

                      return (
                        <div className="settings-card-v2">
                          <div className="settings-form-box-v2" style={{ maxWidth: '640px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                              <h3>👁️ {lang === 'EN' ? 'Visibility Control Panel' : 'കാഴ്ച നിയന്ത്രണ പാനൽ'}</h3>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleVisibility('ALL_ON')}
                                  style={{
                                    padding: '6px 14px', background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7',
                                    borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer'
                                  }}
                                >
                                  {lang === 'EN' ? '✓ Turn All ON' : '✓ എല്ലാം ഓൺ ആക്കുക'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleVisibility('ALL_OFF')}
                                  style={{
                                    padding: '6px 14px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5',
                                    borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer'
                                  }}
                                >
                                  {lang === 'EN' ? '✕ Turn All OFF' : '✕ എല്ലാം ഓഫാക്കുക'}
                                </button>
                              </div>
                            </div>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                              {lang === 'EN'
                                ? 'Toggle which sections are visible to parents/viewers (VIEW role). Admin always sees everything.'
                                : 'രക്ഷിതാക്കൾക്ക് (VIEW റോൾ) ഏതൊക്കെ വിഭാഗങ്ങൾ കാണാമെന്ന് നിയന്ത്രിക്കുക. അഡ്മിന് എപ്പോഴും എല്ലാം കാണാം.'}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {/* Scoreboard Toggle */}
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px', background: visibilityControls.scoreboard ? '#f0fdf4' : '#f8fafc',
                                border: `1px solid ${visibilityControls.scoreboard ? '#bbf7d0' : '#e2e8f0'}`,
                                borderRadius: '12px', transition: 'all 0.2s ease'
                              }}>
                                <div>
                                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {lang === 'EN' ? 'Live Scoreboard' : 'ലൈവ് സ്കോർബോർഡ്'}
                                    <span style={{
                                      fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: '800',
                                      background: visibilityControls.scoreboard ? '#dcfce7' : '#f1f5f9',
                                      color: visibilityControls.scoreboard ? '#15803d' : '#64748b'
                                    }}>
                                      {visibilityControls.scoreboard ? (lang === 'EN' ? 'VISIBLE' : 'ഓൺ (ON)') : (lang === 'EN' ? 'HIDDEN' : 'ഓഫ് (OFF)')}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                    {lang === 'EN' ? 'Show overall team rankings and leaderboard' : 'ടീമുകളുടെ റാങ്കിംഗും പോയിന്റുകളും കാണിക്കുക'}
                                  </div>
                                </div>
                                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                                  <input
                                    type="checkbox"
                                    checked={!!visibilityControls.scoreboard}
                                    onChange={() => handleToggleVisibility('scoreboard')}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                  />
                                  <span style={{
                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: visibilityControls.scoreboard ? 'var(--primary-light)' : '#cbd5e1',
                                    transition: '.3s', borderRadius: '24px'
                                  }}>
                                    <span style={{
                                      position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                                      backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                                      transform: visibilityControls.scoreboard ? 'translateX(24px)' : 'none'
                                    }}></span>
                                  </span>
                                </label>
                              </div>

                              <div style={{ fontWeight: '800', fontSize: '13px', color: '#475569', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {lang === 'EN' ? 'Results Sub-Sections' : 'ഫല വിഭാഗങ്ങൾ'}
                              </div>

                              {[
                                { key: 'results_PROGRAM_WINNERS', label: lang === 'EN' ? 'Program Winners' : 'വിജയികളുടെ പട്ടിക', desc: lang === 'EN' ? 'Show winners for each individual program' : 'ഓരോ പ്രോഗ്രാമിന്റെയും വിജയികളെ കാണിക്കുക' },
                                { key: 'results_STUDENT_REPORT', label: lang === 'EN' ? 'Student Report & Certificate' : 'വിദ്യാർത്ഥി റിപ്പോർട്ടും സർട്ടിഫിക്കറ്റും', desc: lang === 'EN' ? 'Allow parents to search student details & download ID cards/posters' : 'വിദ്യാർത്ഥികളുടെ ഫലങ്ങൾ തിരയാനും കാർഡുകൾ ഡൗൺലോഡ് ചെയ്യാനും അനുവദിക്കുക' },
                                { key: 'results_RESULTS_HISTORY', label: lang === 'EN' ? 'Results History' : 'ഫലങ്ങളുടെ ഹിസ്റ്ററി', desc: lang === 'EN' ? 'Show chronological timeline of declared results' : 'പ്രഖ്യാപിച്ച ഫലങ്ങൾ സമയക്രമത്തിൽ കാണിക്കുക' },
                                { key: 'results_CHAMPIONS', label: lang === 'EN' ? 'Individual Champions' : 'വ്യക്തിഗത ചാമ്പ്യന്മാർ', desc: lang === 'EN' ? 'Show category-wise individual championship leaders' : 'ഓരോ വിഭാഗത്തിലെയും വ്യക്തിഗത ചാമ്പ്യന്മാരെ കാണിക്കുക' }
                              ].map(item => {
                                const isVisible = !!visibilityControls[item.key];
                                return (
                                  <div key={item.key} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '14px 16px', background: isVisible ? '#f0fdf4' : '#f8fafc',
                                    border: `1px solid ${isVisible ? '#bbf7d0' : '#e2e8f0'}`,
                                    borderRadius: '12px', transition: 'all 0.2s ease'
                                  }}>
                                    <div>
                                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {item.label}
                                        <span style={{
                                          fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: '800',
                                          background: isVisible ? '#dcfce7' : '#f1f5f9',
                                          color: isVisible ? '#15803d' : '#64748b'
                                        }}>
                                          {isVisible ? (lang === 'EN' ? 'VISIBLE' : 'ഓൺ (ON)') : (lang === 'EN' ? 'HIDDEN' : 'ഓഫ് (OFF)')}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                        {item.desc}
                                      </div>
                                    </div>
                                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                                      <input
                                        type="checkbox"
                                        checked={isVisible}
                                        onChange={() => handleToggleVisibility(item.key)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                      />
                                      <span style={{
                                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: isVisible ? 'var(--primary-light)' : '#cbd5e1',
                                        transition: '.3s', borderRadius: '24px'
                                      }}>
                                        <span style={{
                                          position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                                          backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                                          transform: isVisible ? 'translateX(24px)' : 'none'
                                        }}></span>
                                      </span>
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 🎁 PRIZES SUB-TAB */}
                    {settingsSubTab === 'PRIZES' && (() => {
                      const getNormPlace = (placeStr) => {
                        if (!placeStr) return null;
                        const str = String(placeStr).trim().toLowerCase();
                        if (str === 'first' || str === '1' || str === '1st') return 'First';
                        if (str === 'second' || str === '2' || str === '2nd') return 'Second';
                        if (str === 'third' || str === '3' || str === '3rd') return 'Third';
                        return null;
                      };

                      // Filter results by selected category
                      const catFilteredResults = resultsList.filter(r => {
                        if (!r.place || r.place === 'No Place') return false;
                        const norm = getNormPlace(r.place);
                        if (!norm) return false;

                        if (prizesCatFilter === 'ALL') return true;
                        const rCatId = String(r.catid || r.catId || '');
                        if (prizesCatFilter === 'GENERAL') {
                          if (isGeneralResult(r)) return true;
                          return false;
                        }
                        if (rCatId === String(prizesCatFilter)) return true;
                        const pObj = programs.find(p => String(p.id) === String(r.progid));
                        if (pObj && String(pObj.catid || pObj.catId || '') === String(prizesCatFilter)) return true;
                        return false;
                      });

                      const firstWinners = catFilteredResults.filter(r => getNormPlace(r.place) === 'First');
                      const secondWinners = catFilteredResults.filter(r => getNormPlace(r.place) === 'Second');
                      const thirdWinners = catFilteredResults.filter(r => getNormPlace(r.place) === 'Third');

                      const displayWinners = catFilteredResults.filter(r => {
                        const norm = getNormPlace(r.place);
                        if (prizesPlaceFilter === 'FIRST') return norm === 'First';
                        if (prizesPlaceFilter === 'SECOND') return norm === 'Second';
                        if (prizesPlaceFilter === 'THIRD') return norm === 'Third';
                        return true;
                      });

                      // PDF Generator for Winners List
                      const generatePrizesPDF = () => {
                        const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                        const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                        const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';
                        const activeCatObj = categories.find(c => String(c.id) === String(prizesCatFilter));
                        const catLabel = prizesCatFilter === 'ALL' ? (lang === 'EN' ? 'All Categories' : 'എല്ലാ കാറ്റഗറികളും') : prizesCatFilter === 'GENERAL' ? 'GENERAL' : (activeCatObj ? activeCatObj.name : '');

                        const printRows = displayWinners.map((r, idx) => {
                          const norm = getNormPlace(r.place);
                          const placeBadge = norm === 'First' ? '🥇 1st Place' : norm === 'Second' ? '🥈 2nd Place' : '🥉 3rd Place';
                          const pObj = programs.find(p => String(p.id) === String(r.progid));
                          const pName = r.progname || (pObj ? pObj.name : r.progcode || '—');
                          const cObj = categories.find(c => String(c.id) === String(r.catid || (pObj ? pObj.catid : '')));
                          const cName = r.catname || (cObj ? cObj.name : '—');
                          const sObj = students.find(s => String(s.id) === String(r.studentid) || String(s.regno || s.regNo || '').trim() === String(r.studentid).trim());
                          const regNo = sObj ? (sObj.regno || sObj.regNo || '—') : '—';
                          const studentName = r.studentname || (sObj ? sObj.name : '—');
                          const teamName = r.teamname || (teams.find(t => String(t.id) === String(r.teamid)) || {}).name || '—';

                          return `<tr>
                            <td style="font-weight:700;text-align:center;">${idx + 1}</td>
                            <td style="font-weight:700;color:#1e40af;">${regNo}</td>
                            <td style="font-weight:700;">${studentName}</td>
                            <td>${cName}</td>
                            <td style="font-weight:600;">${pName}</td>
                            <td style="font-weight:800;color:${norm === 'First' ? '#92400e' : norm === 'Second' ? '#475569' : '#9a3412'};">${placeBadge}</td>
                            <td>${teamName}</td>
                          </tr>`;
                        }).join('');

                        const printWin = window.open('', '_blank');
                        printWin.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Prizes & Winners List - ${madrasaName}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #0f172a; padding: 10px; }
  .header { text-align: center; border-bottom: 3px double #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 24px; color: #1e3a8a; font-weight: 800; }
  .header p { font-size: 13px; color: #475569; margin-top: 3px; font-weight: 600; }
  .sub-header { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .sub-title { font-size: 16px; font-weight: 800; color: #1e40af; }
  .sub-meta { font-size: 12px; color: #334155; font-weight: 700; }
  .summary-bar { display: flex; gap: 10px; margin-bottom: 16px; }
  .sum-box { flex: 1; padding: 10px; text-align: center; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; }
  .sum-val { font-size: 20px; font-weight: 900; }
  .sum-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #1e3a8a; color: white; font-size: 12px; font-weight: 700; padding: 8px 10px; text-align: left; }
  td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
<button onclick="window.print()" class="no-print" style="margin-bottom:14px;padding:10px 24px;background:#1e40af;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">🖨️ Print / Download Winners PDF</button>
<div class="header">
  ${eventName ? `<div style="font-size:12px;font-weight:800;color:#d97706;letter-spacing:1px;margin-bottom:4px;">${eventName} ${eventYear || ''}</div>` : ''}
  <h1>${madrasaName}</h1>
  <p>${madrasaPlace} | Reg No: ${madrasaRegNo}</p>
</div>
<div class="sub-header">
  <div class="sub-title">🎁 ${lang === 'EN' ? 'Prizes & Winners List' : 'സമ്മാനങ്ങളും വിജയികളുടെ ലിസ്റ്റും'}</div>
  <div class="sub-meta">📂 Category: <strong>${catLabel}</strong> | Total: <strong>${displayWinners.length}</strong></div>
</div>
<div class="summary-bar">
  <div class="sum-box" style="background:#fffbeb;border-color:#fcd34d;"><div class="sum-val" style="color:#b45309;">🥇 ${firstWinners.length}</div><div class="sum-lbl" style="color:#b45309;">First Place</div></div>
  <div class="sum-box" style="background:#f8fafc;border-color:#cbd5e1;"><div class="sum-val" style="color:#475569;">🥈 ${secondWinners.length}</div><div class="sum-lbl" style="color:#475569;">Second Place</div></div>
  <div class="sum-box" style="background:#fff7ed;border-color:#fdba74;"><div class="sum-val" style="color:#c2410c;">🥉 ${thirdWinners.length}</div><div class="sum-lbl" style="color:#c2410c;">Third Place</div></div>
  <div class="sum-box" style="background:#f0fdf4;border-color:#86efac;"><div class="sum-val" style="color:#15803d;">🏆 ${catFilteredResults.length}</div><div class="sum-lbl" style="color:#15803d;">Total Winners</div></div>
</div>
<table>
  <thead>
    <tr>
      <th style="width:40px;text-align:center;">#</th>
      <th style="width:70px;">Reg No</th>
      <th>Student Name</th>
      <th>Category</th>
      <th>Competition / Program</th>
      <th>Position</th>
      <th>Team</th>
    </tr>
  </thead>
  <tbody>
    ${printRows || '<tr><td colspan="7" style="text-align:center;padding:20px;color:#94a3b8;">No winner records found.</td></tr>'}
  </tbody>
</table>
<div class="footer">Generated by Milad Fest Management App • Total Entries: ${displayWinners.length}</div>
</body>
</html>`);
                        printWin.document.close();
                        printWin.print();
                      };

                      // PDF Generator for Encouragement List
                      const generateEncouragementPDF = (contestantList, modeTitle) => {
                        const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                        const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                        const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';
                        const activeCatObj = categories.find(c => String(c.id) === String(prizesCatFilter));
                        const catLabel = prizesCatFilter === 'ALL' ? (lang === 'EN' ? 'All Categories' : 'എല്ലാ കാറ്റഗറികളും') : prizesCatFilter === 'GENERAL' ? 'GENERAL' : (activeCatObj ? activeCatObj.name : '');

                        const printRows = contestantList.map((s, idx) => {
                          const regNo = s.regno || s.regNo || '—';
                          const cObj = categories.find(c => String(c.id) === String(s.catid || s.catId || ''));
                          const cName = cObj ? cObj.name : '—';
                          const tObj = teams.find(t => String(t.id) === String(s.teamid || s.teamId || ''));
                          const tName = tObj ? tObj.name : '—';
                          const sProgs = getStudentRegisteredPrograms(s.id);
                          const progNames = sProgs.map(p => p.name).join(', ') || '—';

                          return `<tr>
                            <td style="font-weight:700;text-align:center;">${idx + 1}</td>
                            <td style="font-weight:700;color:#1e40af;">${regNo}</td>
                            <td style="font-weight:700;">${s.name}</td>
                            <td>${cName}</td>
                            <td style="font-size:11px;">${progNames}</td>
                            <td>${tName}</td>
                          </tr>`;
                        }).join('');

                        const encouragementHtml = `<!DOCTYPE html>
<html>
<head>
<title>Encouragement List - ${madrasaName}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #0f172a; padding: 10px; }
  .header { text-align: center; border-bottom: 3px double #065f46; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 24px; color: #065f46; font-weight: 800; }
  .header p { font-size: 13px; color: #475569; margin-top: 3px; font-weight: 600; }
  .sub-header { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .sub-title { font-size: 16px; font-weight: 800; color: #047857; }
  .sub-meta { font-size: 12px; color: #064e3b; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #047857; color: white; font-size: 12px; font-weight: 700; padding: 8px 10px; text-align: left; }
  td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
<button onclick="window.print()" class="no-print" style="margin-bottom:14px;padding:10px 24px;background:#047857;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">🖨️ Print / Download Encouragement PDF</button>
<div class="header">
  ${eventName ? `<div style="font-size:12px;font-weight:800;color:#d97706;letter-spacing:1px;margin-bottom:4px;">${eventName} ${eventYear || ''}</div>` : ''}
  <h1>${madrasaName}</h1>
  <p>${madrasaPlace} | Reg No: ${madrasaRegNo}</p>
</div>
<div class="sub-header">
  <div class="sub-title">🎗️ ${modeTitle}</div>
  <div class="sub-meta">📂 Category: <strong>${catLabel}</strong> | Total: <strong>${contestantList.length}</strong></div>
</div>
<table>
  <thead>
    <tr>
      <th style="width:40px;text-align:center;">#</th>
      <th style="width:80px;">Reg No</th>
      <th>Student Name</th>
      <th>Category</th>
      <th>Registered Competitions</th>
      <th>Team</th>
    </tr>
  </thead>
  <tbody>
    ${printRows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">No student records found.</td></tr>'}
  </tbody>
</table>
<div class="footer">Generated by Milad Fest Management App • Total Students: ${contestantList.length}</div>
</body>
</html>`;
                        openPrintDocument(encouragementHtml, 'Encouragement_List');
                      };

                      return (
                        <div className="settings-card-v2" style={{ maxWidth: '1000px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              🎁 {lang === 'EN' ? 'Prizes & Awards Control' : 'സമ്മാനങ്ങളും പ്രോത്സാഹനവും (Prizes Panel)'}
                            </h3>
                          </div>

                          {/* ── Category Filter Chips ── */}
                          <div className="student-filters-container" style={{ marginBottom: '18px', background: '#fff', padding: '14px 16px', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                            <div className="filter-section-title" style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                              📂 {lang === 'EN' ? 'Filter by Category' : 'കാറ്റഗറി അനുസരിച്ച് തിരിക്കുക'}
                            </div>
                            <div className="filter-chips-wrapper" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <div
                                className={`filter-chip-box ${prizesCatFilter === 'ALL' ? 'active' : ''}`}
                                onClick={() => setPrizesCatFilter('ALL')}
                              >
                                📁 {lang === 'EN' ? 'All Categories' : 'എല്ലാ കാറ്റഗറികളും (All)'}
                              </div>
                              {categories.map(c => (
                                <div
                                  key={c.id}
                                  className={`filter-chip-box ${String(prizesCatFilter) === String(c.id) ? 'active' : ''}`}
                                  onClick={() => setPrizesCatFilter(c.id)}
                                >
                                  {c.name}
                                </div>
                              ))}
                              <div
                                className={`filter-chip-box ${prizesCatFilter === 'GENERAL' ? 'active' : ''}`}
                                onClick={() => setPrizesCatFilter('GENERAL')}
                                style={{
                                  background: prizesCatFilter === 'GENERAL' ? 'linear-gradient(135deg,#d97706,#b45309)' : '',
                                  color: prizesCatFilter === 'GENERAL' ? '#fff' : '',
                                  fontWeight: '800'
                                }}
                              >
                                🌟 GENERAL
                              </div>
                            </div>
                          </div>

                          {/* ── Sub Tab Navigation ── */}
                          <div className="sub-tab-nav" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                            <button
                              className={`sub-nav-item ${prizesActiveTab === 'WINNERS' ? 'active' : ''}`}
                              onClick={() => setPrizesActiveTab('WINNERS')}
                              style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: '800' }}
                            >
                              🏆 {lang === 'EN' ? 'Winners List (1st, 2nd, 3rd)' : 'വിജയികളുടെ ലിസ്റ്റ് (1st, 2nd, 3rd)'}
                            </button>
                            <button
                              className={`sub-nav-item ${prizesActiveTab === 'ENCOURAGEMENT' ? 'active' : ''}`}
                              onClick={() => setPrizesActiveTab('ENCOURAGEMENT')}
                              style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: '800' }}
                            >
                              🎗️ {lang === 'EN' ? 'Encouragement / Participation' : 'പ്രോത്സാഹനം (പങ്കെടുത്തവർ)'}
                            </button>
                          </div>

                          {/* ── SECTION 1: WINNERS LIST ── */}
                          {prizesActiveTab === 'WINNERS' && (
                            <div>
                              {/* ── Summary Stat Cards ── */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1.5px solid #fcd34d', borderRadius: '14px', padding: '14px 12px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                                  <div style={{ fontSize: '24px', marginBottom: '2px' }}>🥇</div>
                                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#b45309', lineHeight: 1 }}>{firstWinners.length}</div>
                                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#92400e', marginTop: '4px' }}>{lang === 'EN' ? 'First Place' : 'ഫസ്റ്റ് (1st)'}</div>
                                </div>
                                <div style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '14px 12px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                                  <div style={{ fontSize: '24px', marginBottom: '2px' }}>🥈</div>
                                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#475569', lineHeight: 1 }}>{secondWinners.length}</div>
                                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginTop: '4px' }}>{lang === 'EN' ? 'Second Place' : 'സെക്കൻഡ് (2nd)'}</div>
                                </div>
                                <div style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '1.5px solid #fdba74', borderRadius: '14px', padding: '14px 12px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                                  <div style={{ fontSize: '24px', marginBottom: '2px' }}>🥉</div>
                                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#c2410c', lineHeight: 1 }}>{thirdWinners.length}</div>
                                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#9a3412', marginTop: '4px' }}>{lang === 'EN' ? 'Third Place' : 'തേർഡ് (3rd)'}</div>
                                </div>
                                <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1.5px solid #86efac', borderRadius: '14px', padding: '14px 12px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                                  <div style={{ fontSize: '24px', marginBottom: '2px' }}>🏆</div>
                                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#15803d', lineHeight: 1 }}>{catFilteredResults.length}</div>
                                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#166534', marginTop: '4px' }}>{lang === 'EN' ? 'Total Winners' : 'ആകെ വിജയികൾ'}</div>
                                </div>
                              </div>

                              {/* ── Student Prize Search Box ── */}
                              <div style={{ background: 'linear-gradient(135deg, #f8fafc, #eff6ff)', border: '1.5px solid #bfdbfe', borderRadius: '14px', padding: '16px 18px', marginBottom: '20px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e40af', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  🔍 {lang === 'EN' ? 'Search Student Prizes by Reg No / Name' : 'രജിസ്റ്റർ നമ്പർ നൽകി ഒരു വിദ്യാർത്ഥിയുടെ സമ്മാനങ്ങൾ തിരയുക'}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <input
                                    type="text"
                                    className="settings-input-v2"
                                    placeholder={lang === 'EN' ? 'Enter Register No (eg: 101) or Student Name...' : 'രജിസ്റ്റർ നമ്പർ അല്ലെങ്കിൽ പേര് ടൈപ്പ് ചെയ്യുക...'}
                                    value={prizesStudentSearch}
                                    onChange={(e) => setPrizesStudentSearch(e.target.value)}
                                    style={{ flex: 1, minWidth: '220px', margin: 0 }}
                                  />
                                  {prizesStudentSearch && (
                                    <button onClick={() => setPrizesStudentSearch('')} style={{ background: '#cbd5e1', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: 'pointer' }}>
                                      ✕ Clear
                                    </button>
                                  )}
                                </div>

                                {/* Results of Student Search */}
                                {(() => {
                                  if (!prizesStudentSearch.trim()) return null;
                                  const term = prizesStudentSearch.trim().toLowerCase();

                                  const matchedStudent = students.find(s => {
                                    const rNo = String(s.regno || s.regNo || '').trim().toLowerCase();
                                    const sName = String(s.name || '').trim().toLowerCase();
                                    return rNo === term || rNo.includes(term) || sName.includes(term);
                                  });

                                  const matchedResults = resultsList.filter(r => {
                                    const rSid = String(r.studentid || '').trim().toLowerCase();
                                    const rSName = String(r.studentname || '').trim().toLowerCase();
                                    if (matchedStudent) {
                                      const sDbId = String(matchedStudent.id).toLowerCase();
                                      const sRegNo = String(matchedStudent.regno || matchedStudent.regNo || '').toLowerCase();
                                      if (rSid === sDbId || rSid === sRegNo) return true;
                                    }
                                    return rSid === term || rSName.includes(term);
                                  });

                                  if (!matchedStudent && matchedResults.length === 0) {
                                    return (
                                      <div style={{ marginTop: '12px', color: '#dc2626', fontStyle: 'italic', fontSize: '13px', fontWeight: '600' }}>
                                        ⚠️ {lang === 'EN' ? 'No records found for this Reg No/Name.' : 'ഈ രജിസ്റ്റർ നമ്പറിൽ/പേരിൽ വിവരങ്ങൾ ലഭ്യമല്ല.'}
                                      </div>
                                    );
                                  }

                                  const sTeamObj = matchedStudent ? teams.find(t => String(t.id) === String(matchedStudent.teamid || matchedStudent.teamId || '')) : null;
                                  const sCatObj = matchedStudent ? categories.find(c => String(c.id) === String(matchedStudent.catid || matchedStudent.catId || '')) : null;

                                  return (
                                    <div style={{ marginTop: '14px', background: '#fff', borderRadius: '12px', border: '1px solid #93c5fd', padding: '14px 16px', boxShadow: '0 2px 8px rgba(30,64,175,0.08)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                        <div>
                                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#1e3a8a' }}>
                                            🧑‍🎓 {matchedStudent ? matchedStudent.name : matchedResults[0]?.studentname}
                                          </div>
                                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                                            🆔 Reg No: <strong>{matchedStudent ? (matchedStudent.regno || matchedStudent.regNo) : prizesStudentSearch}</strong> | 
                                            📂 Category: <strong>{sCatObj ? sCatObj.name : '—'}</strong> | 
                                            🚩 Team: <strong>{sTeamObj ? sTeamObj.name : (matchedResults[0]?.teamname || '—')}</strong>
                                          </div>
                                        </div>
                                        <div style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '800' }}>
                                          🏆 {matchedResults.length} {lang === 'EN' ? 'Prizes Won' : 'സമ്മാനങ്ങൾ'}
                                        </div>
                                      </div>

                                      {matchedResults.length === 0 ? (
                                        <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: '13px' }}>
                                          {lang === 'EN' ? 'No prizes recorded yet for this student.' : 'ഈ വിദ്യാർത്ഥിക്ക് ഇതുവരെ സമ്മാനങ്ങൾ ഒന്നും ലഭിച്ചിട്ടില്ല.'}
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          {matchedResults.map((res, i) => {
                                            const normPlace = getNormPlace(res.place);
                                            const badgeBg = normPlace === 'First' ? '#fef3c7' : normPlace === 'Second' ? '#e2e8f0' : normPlace === 'Third' ? '#ffedd5' : '#f1f5f9';
                                            const badgeBorder = normPlace === 'First' ? '#fcd34d' : normPlace === 'Second' ? '#94a3b8' : normPlace === 'Third' ? '#fdba74' : '#cbd5e1';
                                            const badgeColor = normPlace === 'First' ? '#92400e' : normPlace === 'Second' ? '#334155' : normPlace === 'Third' ? '#9a3412' : '#475569';
                                            const icon = normPlace === 'First' ? '🥇' : normPlace === 'Second' ? '🥈' : normPlace === 'Third' ? '🥉' : '🎗️';

                                            return (
                                              <div key={res.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: badgeBg, border: `1px solid ${badgeBorder}`, borderRadius: '10px', padding: '10px 14px' }}>
                                                <div>
                                                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
                                                    🎭 {res.progname || res.progcode}
                                                  </div>
                                                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                                    Grade: <strong>{res.grade || '-'}</strong> | Points: <strong>{res.points || 0}</strong>
                                                  </div>
                                                </div>
                                                <div style={{ fontSize: '14px', fontWeight: '900', color: badgeColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                  <span>{icon}</span> <span>{normPlace || res.place}</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* ── Place Filter Chips + PDF Button Bar ── */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                                <div className="filter-chips-wrapper" style={{ display: 'flex', gap: '6px' }}>
                                  {[
                                    { key: 'ALL', label: 'All Prizes' },
                                    { key: 'FIRST', label: '🥇 First' },
                                    { key: 'SECOND', label: '🥈 Second' },
                                    { key: 'THIRD', label: '🥉 Third' },
                                  ].map(f => (
                                    <div
                                      key={f.key}
                                      className={`filter-chip-box ${prizesPlaceFilter === f.key ? 'active' : ''}`}
                                      onClick={() => setPrizesPlaceFilter(f.key)}
                                      style={{ padding: '6px 14px', fontSize: '12px' }}
                                    >
                                      {f.label}
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={generatePrizesPDF}
                                  style={{
                                    background: 'linear-gradient(135deg, #1e40af, #1d4ed8)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '9px 18px',
                                    borderRadius: '10px',
                                    fontWeight: '800',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(30,64,175,0.25)'
                                  }}
                                >
                                  📄 {lang === 'EN' ? 'Download Winners PDF' : 'വിജയികളുടെ പിഡിഎഫ് (PDF)'}
                                </button>
                              </div>

                              {/* ── Winners Table ── */}
                              <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                  <thead>
                                    <tr style={{ background: '#1e3a8a', color: 'white', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                                      <th style={{ padding: '10px 12px', textAlignment: 'center', width: '50px' }}>#</th>
                                      <th style={{ padding: '10px 12px', width: '80px' }}>Reg No</th>
                                      <th style={{ padding: '10px 12px' }}>Student Name</th>
                                      <th style={{ padding: '10px 12px' }}>Category</th>
                                      <th style={{ padding: '10px 12px' }}>Competition</th>
                                      <th style={{ padding: '10px 12px' }}>Position</th>
                                      <th style={{ padding: '10px 12px' }}>Team</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {displayWinners.length === 0 ? (
                                      <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontStyle: 'italic' }}>
                                          {lang === 'EN' ? 'No winners recorded for this filter.' : 'ഈ ഫിൽട്ടറിൽ സമ്മാനാർഹർ ലഭ്യമല്ല.'}
                                        </td>
                                      </tr>
                                    ) : (
                                      displayWinners.map((r, idx) => {
                                        const norm = getNormPlace(r.place);
                                        const pObj = programs.find(p => String(p.id) === String(r.progid));
                                        const pName = r.progname || (pObj ? pObj.name : r.progcode || '—');
                                        const cObj = categories.find(c => String(c.id) === String(r.catid || (pObj ? pObj.catid : '')));
                                        const cName = r.catname || (cObj ? cObj.name : '—');
                                        const sObj = students.find(s => String(s.id) === String(r.studentid) || String(s.regno || s.regNo || '').trim() === String(r.studentid).trim());
                                        const regNo = sObj ? (sObj.regno || sObj.regNo || '—') : '—';
                                        const studentName = r.studentname || (sObj ? sObj.name : '—');
                                        const teamName = r.teamname || (teams.find(t => String(t.id) === String(r.teamid)) || {}).name || '—';

                                        const badgeBg = norm === 'First' ? '#fef3c7' : norm === 'Second' ? '#e2e8f0' : '#ffedd5';
                                        const badgeColor = norm === 'First' ? '#92400e' : norm === 'Second' ? '#334155' : '#9a3412';
                                        const icon = norm === 'First' ? '🥇' : norm === 'Second' ? '🥈' : '🥉';

                                        return (
                                          <tr key={r.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                                            <td style={{ padding: '10px 12px', fontWeight: '800', color: '#1e40af' }}>{regNo}</td>
                                            <td style={{ padding: '10px 12px', fontWeight: '700', color: '#1e293b' }}>{studentName}</td>
                                            <td style={{ padding: '10px 12px', color: '#475569' }}>{cName}</td>
                                            <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>{pName}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                              <span style={{ background: badgeBg, color: badgeColor, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <span>{icon}</span> <span>{norm}</span>
                                              </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', fontWeight: '600', color: '#475569' }}>{teamName}</td>
                                          </tr>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* ── SECTION 2: ENCOURAGEMENT (PROTSAHANAM) ── */}
                          {prizesActiveTab === 'ENCOURAGEMENT' && (() => {
                            // Find students who registered in programs but didn't win 1st, 2nd, 3rd
                            const winnerStudentIds = new Set(
                              resultsList
                                .filter(r => getNormPlace(r.place) !== null)
                                .map(r => String(r.studentid || '').trim())
                            );

                            // Non-prize contestants (MUST have at least 1 single/group registered program and not be a winner)
                            const nonPrizeContestants = students.filter(s => {
                              const sCat = String(s.catid || s.catId || '');
                              if (prizesCatFilter !== 'ALL') {
                                if (prizesCatFilter === 'GENERAL') {
                                  if (sCat !== '-1' && sCat !== 'GENERAL' && !generalCatIds.map(String).includes(sCat)) return false;
                                } else if (sCat !== String(prizesCatFilter)) {
                                  return false;
                                }
                              }

                              // 🚀 Verify student is TRULY registered in at least 1 competition (Single or Group)
                              const sProgs = getStudentRegisteredPrograms(s.id);
                              if (!sProgs || sProgs.length === 0) return false;

                              const sId = String(s.id);
                              const sRegNo = String(s.regno || s.regNo || '');
                              const isWinner = winnerStudentIds.has(sId) || winnerStudentIds.has(sRegNo) || winnerStudentIds.has(s.name);
                              return !isWinner;
                            });

                            // All category students
                            const allCategoryStudents = students.filter(s => {
                              if (prizesCatFilter === 'ALL') return true;
                              const sCat = String(s.catid || s.catId || '');
                              if (prizesCatFilter === 'GENERAL') {
                                return (sCat === '-1' || sCat === 'GENERAL' || generalCatIds.map(String).includes(sCat));
                              }
                              return sCat === String(prizesCatFilter);
                            });

                            const activeList = encouragementSubMode === 'CONTESTANTS' ? nonPrizeContestants : allCategoryStudents;
                            const titleLabel = encouragementSubMode === 'CONTESTANTS'
                              ? (lang === 'EN' ? 'Non-prize Contestants (Registered in Competitions)' : 'മത്സരത്തിൽ പങ്കെടുത്തവർ (ഫസ്റ്റ്, സെക്കൻഡ്, തേർഡ് ലഭിക്കാത്തവർ)')
                              : (lang === 'EN' ? 'All Registered Students' : 'സ്റ്റുഡന്റ് ലിസ്റ്റിൽ രജിസ്റ്റർ ചെയ്തവർ');

                            return (
                              <div>
                                {/* Sub Mode Selection Chips */}
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => setEncouragementSubMode('CONTESTANTS')}
                                    style={{
                                      flex: 1,
                                      padding: '10px 14px',
                                      borderRadius: '10px',
                                      border: encouragementSubMode === 'CONTESTANTS' ? '2px solid #059669' : '1px solid #cbd5e1',
                                      background: encouragementSubMode === 'CONTESTANTS' ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : '#fff',
                                      color: encouragementSubMode === 'CONTESTANTS' ? '#047857' : '#475569',
                                      fontWeight: '800',
                                      fontSize: '13px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🎭 {lang === 'EN' ? 'Registered in Competitions' : 'മത്സരത്തിൽ പങ്കെടുത്തവർ'} ({nonPrizeContestants.length})
                                  </button>
                                  <button
                                    onClick={() => setEncouragementSubMode('ALL_STUDENTS')}
                                    style={{
                                      flex: 1,
                                      padding: '10px 14px',
                                      borderRadius: '10px',
                                      border: encouragementSubMode === 'ALL_STUDENTS' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                                      background: encouragementSubMode === 'ALL_STUDENTS' ? 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' : '#fff',
                                      color: encouragementSubMode === 'ALL_STUDENTS' ? '#0369a1' : '#475569',
                                      fontWeight: '800',
                                      fontSize: '13px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🧑‍🎓 {lang === 'EN' ? 'Registered in Student List' : 'സ്റ്റുഡന്റ് ലിസ്റ്റിൽ ഉള്ളവർ'} ({allCategoryStudents.length})
                                  </button>
                                </div>

                                {/* encouragement Top Action Bar */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                                    🎗️ {titleLabel} — <span style={{ color: '#059669' }}>{activeList.length} Students</span>
                                  </div>

                                  <button
                                    onClick={() => generateEncouragementPDF(activeList, titleLabel)}
                                    style={{
                                      background: 'linear-gradient(135deg, #059669, #047857)',
                                      color: 'white',
                                      border: 'none',
                                      padding: '9px 18px',
                                      borderRadius: '10px',
                                      fontWeight: '800',
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      boxShadow: '0 4px 12px rgba(5,150,105,0.25)'
                                    }}
                                  >
                                    📄 {lang === 'EN' ? 'Download Encouragement PDF' : 'പ്രോത്സാഹന പിഡിഎഫ് (PDF)'}
                                  </button>
                                </div>

                                {/* Encouragement Table */}
                                <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                      <tr style={{ background: '#047857', color: 'white', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>#</th>
                                        <th style={{ padding: '10px 12px', width: '80px' }}>Reg No</th>
                                        <th style={{ padding: '10px 12px' }}>Student Name</th>
                                        <th style={{ padding: '10px 12px' }}>Category</th>
                                        <th style={{ padding: '10px 12px' }}>Registered Competitions</th>
                                        <th style={{ padding: '10px 12px' }}>Team</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {activeList.length === 0 ? (
                                        <tr>
                                          <td colSpan="6" style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontStyle: 'italic' }}>
                                            {lang === 'EN' ? 'No students found in this list.' : 'വിവരങ്ങൾ ലഭ്യമല്ല.'}
                                          </td>
                                        </tr>
                                      ) : (
                                        activeList.map((s, idx) => {
                                          const regNo = s.regno || s.regNo || '—';
                                          const cObj = categories.find(c => String(c.id) === String(s.catid || s.catId || ''));
                                          const cName = cObj ? cObj.name : '—';
                                          const tObj = teams.find(t => String(t.id) === String(s.teamid || s.teamId || ''));
                                          const tName = tObj ? tObj.name : '—';
                                          const sProgs = getStudentRegisteredPrograms(s.id);
                                          const progNames = sProgs.map(p => p.name).join(', ') || '—';

                                          return (
                                            <tr key={s.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                              <td style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                                              <td style={{ padding: '10px 12px', fontWeight: '800', color: '#047857' }}>{regNo}</td>
                                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#1e293b' }}>{s.name}</td>
                                              <td style={{ padding: '10px 12px', color: '#475569' }}>{cName}</td>
                                              <td style={{ padding: '10px 12px', fontSize: '12px', color: '#334155' }}>{progNames}</td>
                                              <td style={{ padding: '10px 12px', fontWeight: '600', color: '#475569' }}>{tName}</td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}

                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* 🔍 QR SCAN SCANNER/POSTER MODAL */}
      {qrModalOpen && (
        <div className="qr-modal-overlay">
          <div className="qr-modal-container">
            {qrModalLoading ? (
              <div className="qr-modal-loading" style={{ textAlign: 'center', padding: '30px 0' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
                <p style={{ color: '#475569', fontWeight: '600' }}>Loading student data...</p>
              </div>
            ) : qrModalData?.error ? (
              <div className="qr-modal-error" style={{ textAlign: 'center', padding: '20px 0' }}>
                <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>⚠️ Error</h3>
                <p style={{ color: '#64748b', marginBottom: '20px' }}>{qrModalData.error}</p>
                <button onClick={() => setQrModalOpen(false)} className="btn-add-action" style={{ background: '#64748b' }}>Close</button>
              </div>
            ) : qrModalData?.student ? (
              <div>
                {/* Poster Element to download */}
                <div id="qr-student-poster" className="qr-student-poster">
                  <div className="poster-header">
                    <h2 className="poster-madrasa-name">{qrModalData.madrasa?.name || 'Milad Festival'}</h2>
                    <p className="poster-madrasa-info">Reg No: {qrModalData.madrasa?.regNumber || ''} | {qrModalData.madrasa?.place || ''}</p>
                    <div className="poster-title-badge">MILAD FESTIVAL PARTICIPANT</div>
                  </div>

                  <div className="poster-body">
                    <div className="poster-student-section">
                      <div className="poster-photo-container">
                        {qrModalData.student.photo_url ? (
                          <img src={qrModalData.student.photo_url} alt={qrModalData.student.name} />
                        ) : (
                          <div className="poster-photo-placeholder">👤</div>
                        )}
                      </div>
                      <div className="poster-student-details">
                        <h3 className="poster-student-name">{qrModalData.student.name}</h3>
                        <div className="poster-reg-badge">Reg No: {qrModalData.student.regno || qrModalData.student.regNo || ''}</div>

                        <div className="poster-meta-grid">
                          <div className="poster-meta-item">
                            <span className="lbl">Group</span>
                            <span className="val">{qrModalData.team?.name || 'N/A'}</span>
                          </div>
                          <div className="poster-meta-item">
                            <span className="lbl">Category</span>
                            <span className="val">{qrModalData.category?.name || 'N/A'}</span>
                          </div>
                          <div className="poster-meta-item">
                            <span className="lbl">Gender</span>
                            <span className="val">{qrModalData.student.gender === 'BOY' ? 'Boy' : 'Girl'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="poster-events-section">
                      <h4 className="events-section-title">🏆 Registered Programs & Results</h4>
                      {(() => {
                        const individualList = qrModalData.results || [];
                        const groupList = qrModalData.groupResults || [];
                        const hasEvents = individualList.length > 0 || groupList.length > 0;

                        if (!hasEvents) {
                          return <p className="no-events-text">No registered programs or results found for this student.</p>;
                        }

                        return (
                          <div className="poster-events-table">
                            <div className="events-table-header">
                              <span>Program</span>
                              <span style={{ textAlign: 'center' }}>Place</span>
                              <span style={{ textAlign: 'center' }}>Grade</span>
                            </div>

                            {/* Individual Events */}
                            {individualList.map((r, idx) => (
                              <div key={`ind_${idx}`} className="events-table-row">
                                <span className="event-name">
                                  <b>{r.progname}</b>
                                  <span style={{ fontSize: '10px', color: '#2563eb', marginLeft: '5px', background: '#dbeafe', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>
                                    Single 👤
                                  </span>
                                </span>
                                <span className={`event-place ${r.place === 'First' ? 'gold' : r.place === 'Second' ? 'silver' : r.place === 'Third' ? 'bronze' : ''}`}>
                                  {r.place === 'No Place' || !r.place ? '' : r.place}
                                </span>
                                <span className="event-grade">
                                  {r.grade === '-' || r.grade === 'No' || !r.grade ? '' : r.grade}
                                </span>
                              </div>
                            ))}

                            {/* Group Events */}
                            {groupList.map((g, idx) => (
                              <div key={`grp_${idx}`} className="events-table-row">
                                <span className="event-name">
                                  <b>{g.progname}</b>
                                  <span style={{ fontSize: '10px', color: '#d97706', marginLeft: '5px', background: '#fef3c7', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>
                                    Group 👥 ({g.groupName})
                                  </span>
                                </span>
                                <span className={`event-place ${g.place === 'First' ? 'gold' : g.place === 'Second' ? 'silver' : g.place === 'Third' ? 'bronze' : ''}`}>
                                  {g.place === 'No Place' || g.place === '-' || !g.place ? '-' : g.place}
                                </span>
                                <span className="event-grade">
                                  {g.grade === '-' || g.grade === 'No' || !g.grade ? '-' : g.grade}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="poster-footer">
                    <p>MILAD FEST • OFFICIAL EVENT CARD</p>
                  </div>
                </div>

                {/* Modal actions */}
                <div className="qr-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                  <button onClick={handleDownloadPoster} className="btn-add-action" style={{ background: 'linear-gradient(135deg, #059669, #047857)', flex: 1, minWidth: '120px', margin: 0 }}>
                    🖼️ Download Image
                  </button>
                  <button onClick={handleDownloadPosterPdf} className="btn-add-action" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', flex: 1, minWidth: '120px', margin: 0 }}>
                    📄 Download PDF
                  </button>
                  <button onClick={() => setQrModalOpen(false)} className="btn-add-action" style={{ background: '#64748b', flex: 1, minWidth: '120px', margin: 0 }}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="qr-modal-error" style={{ textAlign: 'center', padding: '20px 0' }}>
                <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>⚠️ Unknown State</h3>
                <button onClick={() => setQrModalOpen(false)} className="btn-add-action" style={{ background: '#64748b' }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📱 NAVIGATION BOTTOM BAR */}
      {currentScreen === 'DASHBOARD' && (
        <nav className="bottom-nav-bar">
          <button className={`nav-tab-item ${activeTab === 'SCOREBOARD' ? 'active' : ''}`} onClick={() => setActiveTab('SCOREBOARD')}>
            <span className="nav-icon">📊</span><span>{t('navScoreboard')}</span>
          </button>
          <button className={`nav-tab-item ${activeTab === 'RECENT' ? 'active' : ''}`} onClick={() => setActiveTab('RECENT')}>
            <span className="nav-icon">📜</span><span>{t('navResults')}</span>
          </button>
          <button className={`nav-tab-item ${activeTab === 'TIMETABLE' ? 'active' : ''}`} onClick={() => setActiveTab('TIMETABLE')}>
            <span className="nav-icon">📅</span><span>{t('navTimetable')}</span>
          </button>
          <button className={`nav-tab-item ${activeTab === 'PROFILE' ? 'active' : ''}`} onClick={() => setActiveTab('PROFILE')}>
            <span className="nav-icon">👤</span><span>{t('navProfile')}</span>
          </button>
          <button className={`nav-tab-item ${activeTab === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActiveTab('SETTINGS')}>
            <span className="nav-icon">⚙️</span><span>{t('navSettings')}</span>
          </button>
        </nav>
      )}

      {/* 📺 LIVE RESULTS PROJECTOR OVERLAY */}
      {isProjectorActive && (
        <div className="projector-overlay">
          {/* Confetti container (glowing particles) */}
          <div className="projector-confetti-container">
            {Array.from({ length: 40 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 8;
              const duration = 4 + Math.random() * 6;
              const size = 6 + Math.random() * 10;
              const color = ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6', '#ec4899'][Math.floor(Math.random() * 5)];
              return (
                <div
                  key={i}
                  className="projector-confetti"
                  style={{
                    left: `${left}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px'
                  }}
                />
              );
            })}
          </div>

          {/* Top Header */}
          <header className="projector-header">
            <div className="projector-header-left">
              <div className="projector-live-badge">
                <span className="projector-live-dot"></span> LIVE
              </div>
              {eventName && (
                <div style={{ lineHeight: '1.2', marginBottom: '2px' }}>
                  <div style={{
                    fontSize: 'clamp(18px, 3vw, 28px)',
                    fontWeight: '900',
                    color: '#fbbf24',
                    letterSpacing: '1px',
                    textShadow: '0 0 20px rgba(251,191,36,0.5)',
                    textTransform: 'uppercase'
                  }}>
                    {eventName}
                  </div>
                  {eventYear && (
                    <div style={{ fontSize: 'clamp(11px, 1.5vw, 14px)', fontWeight: '700', color: '#a7f3d0', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>
                      Milad_fest {eventYear}
                    </div>
                  )}
                </div>
              )}
              <h1 className="projector-title" style={{ fontSize: eventName ? 'clamp(13px, 2vw, 18px)' : undefined, opacity: eventName ? 0.85 : 1 }}>{loggedInMadrasa ? loggedInMadrasa.name : 'MILAD FESTIVAL'}</h1>
            </div>
            <div className="projector-nav-pills">
              <span className={`projector-nav-pill ${projectorSlide === 0 ? 'active' : ''}`} onClick={() => setProjectorSlide(0)}>
                🏆 {lang === 'EN' ? 'Overall Standings' : 'ആകെ പോയിന്റ് നില'}
              </span>
              <span className={`projector-nav-pill ${projectorSlide === 1 ? 'active' : ''}`} onClick={() => setProjectorSlide(1)}>
                📂 {lang === 'EN' ? 'Category Standings' : 'വിഭാഗം തിരിച്ച്'}
              </span>
              <span className={`projector-nav-pill ${projectorSlide === 2 ? 'active' : ''}`} onClick={() => setProjectorSlide(2)}>
                🥇 {lang === 'EN' ? 'Recent Winners' : 'വിജയികൾ'}
              </span>
            </div>
            <button className="projector-close-btn" onClick={() => setIsProjectorActive(false)}>
              ✕ Exit
            </button>
          </header>

          {/* Main Slide Viewer */}
          <div className="projector-body">

            {/* SLIDE 0: OVERALL LEADERBOARD */}
            {projectorSlide === 0 && (
              <div className="projector-slide animate-projector-slide">
                <h2 className="projector-slide-title">🏆 {lang === 'EN' ? 'OVERALL POINT STANDINGS' : 'ആകെ പോയിന്റ് നിലവാരം'}</h2>
                {teams.length === 0 ? (
                  <div className="projector-empty">{t('noTeamsMsg')}</div>
                ) : (
                  (() => {
                    const sortedTeams = [...teams].sort((a, b) => getTeamTotalPoints(b.id) - getTeamTotalPoints(a.id));
                    const countClass = sortedTeams.length <= 2 ? 'count-2' : sortedTeams.length === 3 ? 'count-3' : 'count-4plus';
                    const maxPts = sortedTeams.length > 0 ? getTeamTotalPoints(sortedTeams[0].id) : 0;
                    const graphMax = maxPts > 0 ? maxPts : 10;

                    let currentRank = 1;
                    const teamRanks = sortedTeams.map((t, idx) => {
                      if (idx > 0 && getTeamTotalPoints(t.id) < getTeamTotalPoints(sortedTeams[idx - 1].id)) {
                        currentRank = idx + 1;
                      }
                      return currentRank;
                    });

                    return (
                      <div className={`projector-leaderboard-grid ${countClass}`}>
                        {sortedTeams.map((team, idx) => {
                          const totalPts = getTeamTotalPoints(team.id);
                          const barWidth = Math.max(5, (totalPts / graphMax) * 100);
                          const rank = teamRanks[idx];
                          const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
                          const badgeIcon = rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';

                          return (
                            <div key={team.id} className={`projector-leaderboard-card ${rankClass}`}>
                              <div className="projector-card-header">
                                <span className="projector-rank-badge">{badgeIcon}</span>
                                <span className="projector-team-name" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <span>{team.name}</span>
                                  {(() => {
                                    const reaction = getTrollReaction(rank, team.name, trollLang, trollOffsets[team.id] || 0);
                                    const mainEmoji = rank === 1 ? '🤣' : '😭';
                                    return (
                                      <span
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTrollOffsets(prev => ({ ...prev, [team.id]: (prev[team.id] || 0) + 1 }));
                                        }}
                                      >
                                        <span className="animate-troll-emoji" style={{ fontSize: '26px' }}>{mainEmoji}</span>
                                        <span className="projector-troll-bubble">{reaction.text}</span>
                                      </span>
                                    );
                                  })()}
                                </span>
                                <span className="projector-team-score">{totalPts} <span className="score-lbl">{t('points')}</span></span>
                              </div>
                              <div className="projector-bar-track">
                                <div className="projector-bar-fill" style={{ width: `${barWidth}%` }}>
                                  <div className="projector-bar-glow"></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* SLIDE 1: CATEGORY STANDINGS */}
            {projectorSlide === 1 && (
              <div className="projector-slide animate-projector-slide">
                <h2 className="projector-slide-title">📂 {lang === 'EN' ? 'CATEGORY STANDINGS' : 'വിഭാഗം തിരിച്ചുള്ള പോയിന്റ് നിലവാരം'}</h2>
                {categories.length === 0 && generalCatIds.length === 0 ? (
                  <div className="projector-empty">{lang === 'EN' ? 'No categories added.' : 'വിഭാഗങ്ങൾ ഒന്നും ചേർത്തിട്ടില്ല.'}</div>
                ) : (
                  <div className="projector-categories-grid">
                    {[
                      ...categories,
                      { id: 'GENERAL', name: 'GENERAL', isGeneral: true }
                    ].map(c => {
                      // Get team points breakdown for this category (including boys/girls split)
                      const teamPointsList = teams.map(t => {
                        const catResults = resultsList.filter(r => {
                          const teamMatch = String(r.teamId || r.teamid || '') === String(t.id);
                          if (!teamMatch) return false;

                          if (c.isGeneral) {
                            const rCatName = r.catname || r.catName || '';
                            const rCatId = String(r.catid || r.catId || '');
                            if (rCatName === 'GENERAL' || rCatId === '-1' || rCatId === 'GENERAL' || (generalCatIds && generalCatIds.map(String).includes(rCatId))) return true;
                            const prog = programs.find(p => String(p.id) === String(r.progid || r.progId || ''));
                            if (prog && isGeneralProg(prog)) return true;
                            return false;
                          } else {
                            const rCatName = r.catname || r.catName || '';
                            const rCatId = String(r.catid || r.catId || '');
                            if (rCatName === c.name || rCatId === String(c.id)) return true;
                            const prog = programs.find(p => String(p.id) === String(r.progid || r.progId || ''));
                            if (prog && String(prog.catid || prog.catId || '') === String(c.id) && !isGeneralProg(prog)) return true;
                            return false;
                          }
                        });

                        const pts = catResults.reduce((sum, r) => sum + (Number(r.points) || 0), 0);

                        const boyPts = catResults.filter(r => {
                          let g = String(r.studentgender || r.studentGender || r.gender || '').toUpperCase();
                          if (!g) {
                            const st = students.find(s => String(s.id) === String(r.studentid || r.studentId || ''));
                            if (st && st.gender) g = String(st.gender).toUpperCase();
                          }
                          if (!g) {
                            const prog = programs.find(p => String(p.id) === String(r.progid || r.progId || ''));
                            if (prog && prog.type) g = String(prog.type).toUpperCase();
                          }
                          return g.includes('BOY') || g === 'MALE' || g === 'M';
                        }).reduce((sum, r) => sum + (Number(r.points) || 0), 0);

                        const girlPts = catResults.filter(r => {
                          let g = String(r.studentgender || r.studentGender || r.gender || '').toUpperCase();
                          if (!g) {
                            const st = students.find(s => String(s.id) === String(r.studentid || r.studentId || ''));
                            if (st && st.gender) g = String(st.gender).toUpperCase();
                          }
                          if (!g) {
                            const prog = programs.find(p => String(p.id) === String(r.progid || r.progId || ''));
                            if (prog && prog.type) g = String(prog.type).toUpperCase();
                          }
                          return g.includes('GIRL') || g === 'FEMALE' || g === 'F';
                        }).reduce((sum, r) => sum + (Number(r.points) || 0), 0);

                        return { team: t, points: pts, boyPts, girlPts };
                      }).sort((a, b) => b.points - a.points);

                      return (
                        <div key={c.id} className="projector-category-card">
                          <h3 className="projector-category-name">{c.isGeneral ? '📁 🌟 GENERAL' : `📁 ${c.name}`}</h3>
                          <div className="projector-category-teams-list">
                            {teamPointsList.map((tp, idx) => (
                              <div key={tp.team.id} className="projector-category-team-row">
                                <span className="team-rank-index">{idx + 1}.</span>
                                <span className="team-title">{tp.team.name}</span>
                                <span className="team-pts">{tp.points} <span className="score-lbl">{t('points')}</span></span>
                                <span className="team-gender-pts">
                                  <span className="team-boy-pts">👦 <b>{tp.boyPts}</b></span>
                                  <span className="team-girl-pts">👧 <b>{tp.girlPts}</b></span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 2: RECENT WINNERS - POSTER MODE */}
            {projectorSlide === 2 && (
              <div className="projector-slide animate-projector-slide" style={{ padding: 0, overflow: 'hidden' }}>
                {resultsList.length === 0 ? (
                  <div className="projector-empty">{t('noResultsAdded')}</div>
                ) : (
                  (() => {
                    // 1. Group results into distinct declared program runs (by program metadata: progid/name, catname, and program type)
                    const groupsMap = new Map();

                    resultsList.forEach(r => {
                      const rProgId = String(r.progid || r.progId || '').trim();
                      const rProgName = String(r.progname || r.progName || '').trim();
                      const rCatName = String(r.catname || r.catName || '').trim();

                      // Look up matching program metadata first to determine official PROGRAM gender type
                      const progObj = programs.find(p => {
                        const pId = String(p.id || '');
                        const pCode = String(p.code || '');
                        const pName = String(p.name || '').trim().toLowerCase();
                        return (rProgId && (pId === rProgId || pCode === rProgId)) || (rProgName && pName === rProgName.toLowerCase());
                      });

                      const pType = String(progObj?.type || r.progtype || r.progType || '').toUpperCase();
                      const genderKey = (pType.includes('BOY') && !pType.includes('GIRL'))
                        ? 'BOY'
                        : (pType.includes('GIRL') && !pType.includes('BOY'))
                          ? 'GIRL'
                          : 'COMMON';

                      const groupKey = `${rProgId || rProgName}_${rCatName}_${genderKey}`;

                      if (!groupsMap.has(groupKey)) {
                        groupsMap.set(groupKey, {
                          groupKey,
                          progId: rProgId,
                          progName: rProgName,
                          catName: rCatName,
                          genderKey,
                          results: [],
                          latestTime: 0,
                          latestId: 0
                        });
                      }

                      const group = groupsMap.get(groupKey);
                      group.results.push(r);

                      const rTime = new Date(r.created_at || r.createdAt || r.inserted_at || 0).getTime();
                      if (!isNaN(rTime) && rTime > group.latestTime) group.latestTime = rTime;

                      const rId = Number(r.id) || 0;
                      if (rId > group.latestId) group.latestId = rId;
                    });

                    // 2. Sort distinct program groups descending by latest timestamp / latest ID
                    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
                      if (a.latestTime !== b.latestTime && a.latestTime > 0 && b.latestTime > 0) {
                        return b.latestTime - a.latestTime;
                      }
                      if (a.latestId !== b.latestId) {
                        return b.latestId - a.latestId;
                      }
                      return b.groupKey.localeCompare(a.groupKey);
                    });

                    if (sortedGroups.length === 0) return <div className="projector-empty">{t('noResultsAdded')}</div>;

                    // Ensure active index is within bounds
                    const activeIdx = Math.min(Math.max(0, selectedRecentProgIndex || 0), sortedGroups.length - 1);
                    const activeGroup = sortedGroups[activeIdx];

                    // 3. Find matching program object metadata
                    const prog = programs.find(p => {
                      const pId = String(p.id || '');
                      const pCode = String(p.code || '');
                      const pCatObj = categories.find(c => String(c.id) === String(p.catid || p.catId));
                      const pCatName = pCatObj ? pCatObj.name : (p.catname || p.catName || '');
                      const pType = String(p.type || '').toUpperCase();
                      const pGender = pType.includes('BOY') && !pType.includes('GIRL') ? 'BOY' : pType.includes('GIRL') && !pType.includes('BOY') ? 'GIRL' : 'COMMON';

                      const idMatch = (pId && pId === activeGroup.progId) || (pCode && pCode === activeGroup.progId);
                      const catMatch = !pCatName || !activeGroup.catName || pCatName.toLowerCase() === activeGroup.catName.toLowerCase();
                      const genderMatch = pGender === activeGroup.genderKey;

                      return idMatch && catMatch && genderMatch;
                    }) || programs.find(p => String(p.name || '').trim().toLowerCase() === activeGroup.progName.toLowerCase()) || {
                      code: activeGroup.progId || 'RES',
                      name: activeGroup.progName || 'Program',
                      type: activeGroup.genderKey,
                      catname: activeGroup.catName
                    };

                    const catObj = categories.find(c => String(c.id) === String(prog.catid || prog.catId));
                    const catName = catObj ? catObj.name : (prog.catname || prog.catName || activeGroup.catName || '');

                    const pType = String(prog.type || activeGroup.genderKey || '').toUpperCase();
                    const isBoyProg = pType.includes('BOY') && !pType.includes('GIRL');
                    const isGirlProg = pType.includes('GIRL') && !pType.includes('BOY');
                    const genderText = isBoyProg
                      ? (lang === 'EN' ? 'Boys' : 'ബോയ്സ്')
                      : isGirlProg
                        ? (lang === 'EN' ? 'Girls' : 'ഗേൾസ്')
                        : (lang === 'EN' ? 'Common' : 'കോമൺ');
                    const genderColor = isBoyProg ? '#60a5fa' : isGirlProg ? '#f472b6' : '#fbbf24';

                    // Filter results for ONLY this single active program group!
                    const progResults = activeGroup.results;

                    // Helper to normalize place values ('1', 'First', '1st')
                    const getNormPlace = (pl) => {
                      if (!pl) return '';
                      const s = String(pl).trim().toLowerCase();
                      if (s === 'first' || s === '1' || s === '1st') return 'First';
                      if (s === 'second' || s === '2' || s === '2nd') return 'Second';
                      if (s === 'third' || s === '3' || s === '3rd') return 'Third';
                      return '';
                    };

                    // Group winners by place (support multiple winners per place)
                    const firstWinners = progResults.filter(r => getNormPlace(r.place) === 'First');
                    const secondWinners = progResults.filter(r => getNormPlace(r.place) === 'Second');
                    const thirdWinners = progResults.filter(r => getNormPlace(r.place) === 'Third');

                    const renderPosterWinnerCard = (w, placeLabel, medalEmoji, placeClass) => {
                      if (!w) return null;
                      const rawName = w.studentname || '';
                      const regNoPart = rawName.includes(' - ') ? rawName.split(' - ')[0].trim() : '';
                      const namePart = rawName.includes(' - ') ? rawName.split(' - ').slice(1).join(' - ').trim() : rawName;

                      // Robust multi-factor student photo lookup
                      const studentObj = students.find(s => {
                        const sReg = String(s.regno || s.regNo || '').trim();
                        const sId = String(s.id || '').trim();
                        const sName = String(s.name || '').trim().toLowerCase();

                        if (regNoPart && sReg === regNoPart) return true;
                        if (w.studentid && sId === String(w.studentid).trim()) return true;
                        if (namePart && sName === namePart.toLowerCase()) return true;
                        if (rawName && sName === rawName.toLowerCase()) return true;
                        return false;
                      });

                      const targetRegNo = studentObj ? (studentObj.regno || studentObj.regNo || regNoPart) : regNoPart;
                      const targetGender = studentObj?.gender || w.studentgender || activeGroup.genderKey;
                      const teamName = w.teamname || teams.find(t => String(t.id) === String(w.teamId || w.teamid))?.name || '';
                      const grade = (w.grade && w.grade !== '-' && w.grade !== 'No') ? w.grade : '';

                      const hasPhoto = studentObj && studentObj.photo_url && studentObj.photo_status && studentObj.photo_status !== 'none';
                      const isBoyCard = String(targetGender).toUpperCase().includes('BOY');

                      return (
                        <div key={w.id || `${placeClass}-${regNoPart || namePart}`} className={`winner-poster-card ${placeClass}`}>
                          <div className="winner-poster-medal-ring">
                            <span className="winner-poster-medal-emoji">{medalEmoji}</span>
                          </div>
                          <div className="winner-poster-photo-wrap">
                            {hasPhoto ? (
                              <img src={studentObj.photo_url} alt={namePart} className="winner-poster-photo" />
                            ) : (
                              <div className={`winner-poster-photo-placeholder ${isBoyCard ? 'boy' : 'girl'}`}>
                                <svg viewBox="0 0 24 24" width="55%" height="55%" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="winner-poster-place-label">{placeLabel}</div>
                          <div className="winner-poster-info">
                            <div className="winner-poster-name">{namePart || rawName}</div>
                            {targetRegNo && (
                              <div className="winner-poster-reg">🔖 {targetRegNo}</div>
                            )}
                            {teamName && (
                              <div className="winner-poster-team">🏫 {teamName}</div>
                            )}
                            {catName && (
                              <div className="winner-poster-cat">📁 {catName}</div>
                            )}
                            {grade && (
                              <div className="winner-poster-grade">{grade}</div>
                            )}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div className="winner-poster-container">
                        {/* Decorative background shimmer */}
                        <div className="winner-poster-bg-shimmer" />

                        {/* 🔄 Recent Program Selector / Navigator (if multiple programs exist) */}
                        {sortedGroups.length > 1 && (
                          <div className="winner-poster-nav-bar" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            marginBottom: '14px',
                            position: 'relative',
                            zIndex: 10
                          }}>
                            <button
                              onClick={() => setSelectedRecentProgIndex(prev => Math.max(0, prev - 1))}
                              disabled={activeIdx === 0}
                              style={{
                                background: activeIdx === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(251,191,36,0.2)',
                                color: activeIdx === 0 ? '#64748b' : '#fbbf24',
                                border: '1px solid rgba(251,191,36,0.3)',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                cursor: activeIdx === 0 ? 'default' : 'pointer',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}
                            >
                              ◀ {lang === 'EN' ? 'Latest' : 'പുതിയത്'}
                            </button>

                            <select
                              value={activeIdx}
                              onChange={(e) => setSelectedRecentProgIndex(Number(e.target.value))}
                              style={{
                                background: '#0f172a',
                                color: '#fbbf24',
                                border: '1px solid rgba(251,191,36,0.4)',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '700',
                                maxWidth: '240px'
                              }}
                            >
                              {sortedGroups.map((grp, idx) => (
                                <option key={grp.groupKey} value={idx}>
                                  {idx === 0 ? '🔥 ' : ''}{grp.progName} ({grp.catName} - {grp.genderKey})
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => setSelectedRecentProgIndex(prev => Math.min(sortedGroups.length - 1, prev + 1))}
                              disabled={activeIdx === sortedGroups.length - 1}
                              style={{
                                background: activeIdx === sortedGroups.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(251,191,36,0.2)',
                                color: activeIdx === sortedGroups.length - 1 ? '#64748b' : '#fbbf24',
                                border: '1px solid rgba(251,191,36,0.3)',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                cursor: activeIdx === sortedGroups.length - 1 ? 'default' : 'pointer',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}
                            >
                              {lang === 'EN' ? 'Older' : 'പഴയത്'} ▶
                            </button>
                          </div>
                        )}

                        {/* Program Heading */}
                        <div className="winner-poster-header">
                          <div className="winner-poster-header-top">
                            <span className="winner-poster-trophy-icon">🏆</span>
                            <span className="winner-poster-prog-code">{prog.code || activeGroup.progId || 'RES'}</span>
                            <span className="winner-poster-cat-badge" style={{ color: genderColor, borderColor: genderColor }}>
                              {isBoyProg ? '👦' : isGirlProg ? '👧' : '🌐'} {genderText}
                            </span>
                            {catName && (
                              <span className="winner-poster-catname-badge">📁 {catName}</span>
                            )}
                          </div>
                          <h2 className="winner-poster-prog-title">{prog.name || activeGroup.progName}</h2>
                          <div className="winner-poster-subtitle">
                            {lang === 'EN' ? 'RESULT ANNOUNCED' : 'ഫലം പ്രഖ്യാപിച്ചു'}
                          </div>
                        </div>

                        {/* Winners Row */}
                        <div className="winner-poster-cards-row">
                          {/* 2nd Place first (left) */}
                          <div className="winner-poster-place-group silver-group">
                            {secondWinners.length === 0 ? (
                              <div className="winner-poster-empty-place">
                                <span style={{ fontSize: '40px' }}>🥈</span>
                                <span style={{ color: '#64748b', fontSize: '13px', marginTop: '8px' }}>
                                  {lang === 'EN' ? '2nd Place' : 'രണ്ടാം സ്ഥാനം'}
                                </span>
                              </div>
                            ) : (
                              secondWinners.map(w => renderPosterWinnerCard(w,
                                lang === 'EN' ? '🥈 2nd Place' : '🥈 രണ്ടാം സ്ഥാനം',
                                '🥈', 'silver'))
                            )}
                          </div>

                          {/* 1st Place (center - bigger) */}
                          <div className="winner-poster-place-group gold-group">
                            {firstWinners.length === 0 ? (
                              <div className="winner-poster-empty-place">
                                <span style={{ fontSize: '50px' }}>🥇</span>
                                <span style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
                                  {lang === 'EN' ? '1st Place' : 'ഒന്നാം സ്ഥാനം'}
                                </span>
                              </div>
                            ) : (
                              firstWinners.map(w => renderPosterWinnerCard(w,
                                lang === 'EN' ? '🥇 1st Place' : '🥇 ഒന്നാം സ്ഥാനം',
                                '🥇', 'gold'))
                            )}
                          </div>

                          {/* 3rd Place (right) */}
                          <div className="winner-poster-place-group bronze-group">
                            {thirdWinners.length === 0 ? (
                              <div className="winner-poster-empty-place">
                                <span style={{ fontSize: '40px' }}>🥉</span>
                                <span style={{ color: '#64748b', fontSize: '13px', marginTop: '8px' }}>
                                  {lang === 'EN' ? '3rd Place' : 'മൂന്നാം സ്ഥാനം'}
                                </span>
                              </div>
                            ) : (
                              thirdWinners.map(w => renderPosterWinnerCard(w,
                                lang === 'EN' ? '🥉 3rd Place' : '🥉 മൂന്നാം സ്ഥാനം',
                                '🥉', 'bronze'))
                            )}
                          </div>
                        </div>

                        {/* Footer sparkle line */}
                        <div className="winner-poster-footer-line" />
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📜 INLINE CERTIFICATE PREVIEW MODAL */}
      {activeCertificate && (() => {
        const { student, result } = activeCertificate;
        const sRegNo = student.regno || student.regNo || '';
        const teamObj = teams.find(t => String(t.id) === String(student.teamid || student.teamId || ''));
        const catObj = categories.find(c => String(c.id) === String(student.catid || student.catId || ''));
        const prog = programs.find(p => String(p.id) === String(result.progid));

        const madrasaName = (loggedInMadrasa ? loggedInMadrasa.name : 'MADRASA NAME').toUpperCase();
        const madrasaPlace = (loggedInMadrasa ? loggedInMadrasa.place : 'LOCATION').toUpperCase();
        const eventNameText = eventName || 'EVENT NAME';
        const eventYearText = eventYear || '2026';

        const placeRaw = (result.place || '').toString().toLowerCase();
        const prizeText = placeRaw === 'first' || placeRaw === '1' ? 'First Prize' : placeRaw === 'second' || placeRaw === '2' ? 'Second Prize' : placeRaw === 'third' || placeRaw === '3' ? 'Third Prize' : (result.place ? result.place + ' Prize' : 'Prize');

        const progName = result.progname || result.progName || (prog ? prog.name : '');
        const catName = result.catname || result.catName || (catObj ? catObj.name : '');
        const progAndCatText = `${progName}${catName && !progName.toLowerCase().includes(catName.toLowerCase()) ? ` (${catName})` : ''}`;
        const eventAndYearText = `${eventNameText} ${eventYearText}`;

        const logoUrl = window.location.origin + '/logo192.png';

        const handleModalDownloadPdf = async () => {
          const certArea = document.getElementById('modalCertificateArea');
          if (!certArea) return;
          try {
            const originalTransform = certArea.style.transform;
            certArea.style.transform = 'none';
            await new Promise(r => setTimeout(r, 60));
            const canvas = await html2canvas(certArea, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              width: 1050,
              height: 740
            });
            certArea.style.transform = originalTransform;
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
              orientation: 'landscape',
              unit: 'mm',
              format: 'a4'
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
            const pdfBlob = pdf.output('blob');
            const fileName = `Certificate_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_${(result.progname || result.progName || '').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            await downloadFile(pdfBlob, fileName, 'application/pdf');
          } catch (err) {
            alert('Failed to save PDF: ' + err.message);
          }
        };

        const handleModalDownload = async () => {
          const certArea = document.getElementById('modalCertificateArea');
          if (!certArea) return;
          try {
            const originalTransform = certArea.style.transform;
            certArea.style.transform = 'none';
            await new Promise(r => setTimeout(r, 60));
            const canvas = await html2canvas(certArea, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              width: 1050,
              height: 740
            });
            certArea.style.transform = originalTransform;
            const dataUrl = canvas.toDataURL('image/png');
            await downloadFile(dataUrl, `Certificate_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_${(result.progname || result.progName || '').replace(/[^a-zA-Z0-9]/g, '_')}.png`, 'image/png');
          } catch (err) {
            alert('Failed to save image: ' + err.message);
          }
        };

        const handleModalPrint = () => {
          const certArea = document.getElementById('modalCertificateArea');
          if (!certArea) return;
          const html = `
<!DOCTYPE html>
<html>
<head>
<title>Certificate - ${student.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Amiri:wght@700&family=Aref+Ruqaa:wght@700&family=Scheherazade+New:wght@700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
  .certificate-wrapper {
    width: 1050px;
    height: 740px;
    position: relative;
    background: #ffffff;
    overflow: hidden;
  }
  .cert-right-banner {
    position: absolute; top: 0; right: 0; width: 380px; height: 740px;
    pointer-events: none; z-index: 1;
  }
  .cert-content {
    position: relative; z-index: 2; padding: 45px 50px 45px 55px;
    height: 100%; width: 720px; display: flex; flex-direction: column;
    justify-content: space-between;
  }
  .cert-header { display: flex; justify-content: space-between; align-items: flex-start; width: 100%; }
  .cert-logo-section { display: flex; align-items: center; gap: 16px; }
  .cert-app-logo { width: 75px; height: 75px; object-fit: contain; border-radius: 14px; box-shadow: 0 3px 10px rgba(6,78,59,0.18); }
  .cert-org-details { display: flex; flex-direction: column; }
  .cert-madrasa-name { font-size: 23px; font-weight: 900; color: #064e3b; text-transform: uppercase; letter-spacing: 0.6px; line-height: 1.15; }
  .cert-madrasa-place { font-size: 17px; font-weight: 800; color: #064e3b; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 3px; opacity: 0.95; }
  .cert-event-section { text-align: left; }
  .cert-event-name { font-size: 24px; font-weight: 900; color: #064e3b; text-transform: uppercase; letter-spacing: 0.6px; line-height: 1.15; }
  .cert-event-sub { font-size: 14px; font-weight: 700; color: #064e3b; letter-spacing: 0.6px; margin-top: 4px; opacity: 0.95; }

  .cert-title-section { margin-top: 15px; }
  .cert-main-title { font-size: 54px; font-weight: 900; color: #0f172a; letter-spacing: -1.5px; line-height: 1; font-family: 'Inter', sans-serif; }
  .cert-sub-title { font-size: 28px; font-weight: 600; color: #064e3b; line-height: 1.2; margin-top: 2px; font-family: 'Inter', sans-serif; }

  .cert-pill-badge {
    display: inline-block; background: #064e3b; color: #ffffff; font-size: 13.5px;
    font-weight: 600; padding: 7px 22px; border-radius: 20px; margin-top: 22px;
    letter-spacing: 0.2px; box-shadow: 0 4px 12px rgba(6,78,59,0.25);
  }

  .cert-student-name { font-size: 38px; font-weight: 800; color: #064e3b; margin-top: 14px; margin-bottom: 12px; font-family: 'Inter', sans-serif; }
  .cert-description { font-size: 13.5px; color: #334155; line-height: 1.65; max-width: 630px; font-weight: 400; }
  .cert-description strong { color: #0f172a; }
  .cert-description strong.cert-highlight { font-weight: 700; font-style: italic; }

  .cert-signatures { display: flex; gap: 70px; margin-top: 35px; align-items: flex-end; }
  .cert-sign-col { display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 170px; }
  .cert-sign-name { font-size: 13.5px; font-weight: 700; color: #0f172a; min-height: 22px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 3px; font-family: 'Inter', sans-serif; }
  .cert-sign-line { width: 100%; height: 1.5px; background-color: #000000; margin-bottom: 6px; }
  .cert-sign-label { font-size: 11.5px; font-weight: 700; color: #334155; letter-spacing: 0.3px; }
</style>
</head>
<body>
<div class="certificate-wrapper" id="certificateArea">
  <div class="cert-right-banner">
        <svg width="380" height="740" viewBox="0 0 380 740" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="islamicPattern_single" width="70" height="70" patternUnits="userSpaceOnUse">
          <path d="M35 0 L70 35 L35 70 L0 35 Z" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.35"/>
          <path d="M0 0 L70 70 M70 0 L0 70" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.2"/>
          <circle cx="35" cy="35" r="14" stroke="#0d6e53" stroke-width="0.8" fill="none" opacity="0.25"/>
          <polygon points="35,12 42,27 58,27 44,37 50,53 35,43 20,53 26,37 12,27 28,27" stroke="#0d6e53" stroke-width="0.6" fill="none" opacity="0.25"/>
        </pattern>
        <linearGradient id="ferruleGrad_single" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#94a3b8"/>
          <stop offset="50%" style="stop-color:#f1f5f9"/>
          <stop offset="100%" style="stop-color:#64748b"/>
        </linearGradient>
      </defs>
      
      <!-- Green Polygon Cut Path -->
      <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="#064e3b" />
      <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="url(#islamicPattern_single)" opacity="0.8" />
      <path d="M120 0 L160 360 L270 510 L230 540 L290 740" stroke="#022c22" stroke-width="4" fill="none"/>

      <!-- WHITE MILAD FEST LOGO (TOP RIGHT) -->
      <g transform="translate(195, 40)">
        <path d="M 90 20 C 45 20 15 55 15 100 C 15 145 45 180 90 180 C 65 170 42 142 42 100 C 42 58 65 30 90 20 Z" fill="#ffffff"/>
        <path d="M 68 85 C 68 62 82 52 90 48 C 98 52 112 62 112 85 Z" fill="#ffffff"/>
        <path d="M 90 41 C 88 41 87 42 87 44 C 87 46 89 47 90 47 C 91 47 93 46 93 44 C 93 42 92 41 90 41 Z M 90 38 L 90 41" stroke="#ffffff" stroke-width="1.8" fill="none"/>
        <path d="M 52 95 L 52 75 L 56 68 L 60 75 L 60 95 Z" fill="#ffffff"/>
        <rect x="54" y="62" width="4" height="6" fill="#ffffff"/>
        <path d="M 120 95 L 120 75 L 124 68 L 128 75 L 128 95 Z" fill="#ffffff"/>
        <rect x="122" y="62" width="4" height="6" fill="#ffffff"/>
        <path d="M 50 95 L 130 95 L 130 120 L 50 120 Z" fill="#ffffff"/>
        <path d="M 83 120 L 83 104 C 83 100 97 100 97 104 L 97 120 Z" fill="#064e3b"/>
        <path d="M 62 120 L 62 108 C 62 105 73 105 73 108 L 73 120 Z" fill="#064e3b"/>
        <path d="M 107 120 L 107 108 C 107 105 118 105 118 108 L 118 120 Z" fill="#064e3b"/>
        <text x="90" y="156" text-anchor="middle" fill="#ffffff" font-family="'Inter', sans-serif" font-weight="900" font-size="18" letter-spacing="1.4">MILAD FEST</text>
      </g>

      <!-- ARTISTIC PAINT BRUSHES & WATERCOLOR SPLASH -->
      <g transform="translate(160, 290)">
        <g opacity="0.85">
          <path d="M 70 170 C 10 110, -20 210, 20 290 C 50 350, 130 390, 180 310 C 220 240, 150 140, 70 170 Z" fill="#0d6e53" opacity="0.35"/>
          <path d="M 90 130 C 30 70, 10 190, 60 250 C 110 310, 200 270, 170 170 C 150 110, 120 100, 90 130 Z" fill="#047857" opacity="0.45"/>
          <path d="M 30 210 C -30 170, -20 270, 40 330 C 100 380, 160 350, 130 270 C 100 210, 60 220, 30 210 Z" fill="#10b981" opacity="0.3"/>
          <circle cx="15" cy="130" r="3.5" fill="#6ee7b7"/>
          <circle cx="10" cy="155" r="2.5" fill="#34d399"/>
          <circle cx="30" cy="100" r="4.5" fill="#10b981"/>
          <circle cx="0" cy="200" r="3" fill="#059669"/>
          <circle cx="-15" cy="240" r="5" fill="#6ee7b7"/>
          <circle cx="-10" cy="275" r="3" fill="#34d399"/>
          <circle cx="20" cy="340" r="3.5" fill="#10b981"/>
          <circle cx="55" cy="370" r="4.5" fill="#059669"/>
          <circle cx="100" cy="400" r="3" fill="#6ee7b7"/>
          <circle cx="135" cy="380" r="3.5" fill="#34d399"/>
          <circle cx="170" cy="350" r="2.5" fill="#10b981"/>
          <circle cx="195" cy="300" r="4" fill="#059669"/>
          <circle cx="205" cy="250" r="3" fill="#6ee7b7"/>
        </g>

        <g transform="rotate(-10, 100, 250)">
          <!-- Brush 1: Flat Wash Brush (Left) -->
          <g transform="translate(20, 30) rotate(-10)">
            <path d="M 30 180 L 44 180 L 40 390 L 34 390 Z" fill="#143023" stroke="#064e3b" stroke-width="1"/>
            <rect x="27" y="130" width="18" height="50" rx="2" fill="url(#ferruleGrad_single)"/>
            <line x1="27" y1="145" x2="45" y2="145" stroke="#475569" stroke-width="1"/>
            <line x1="27" y1="160" x2="45" y2="160" stroke="#475569" stroke-width="1"/>
            <path d="M 25 45 L 47 45 L 45 130 L 27 130 Z" fill="#064e3b"/>
            <path d="M 25 45 L 47 45 L 46 75 L 26 75 Z" fill="#047857"/>
            <path d="M 25 45 L 47 45 L 47 58 L 25 58 Z" fill="#34d399" opacity="0.85"/>
            <line x1="30" y1="48" x2="31" y2="128" stroke="#022c22" stroke-width="0.8" opacity="0.6"/>
            <line x1="36" y1="48" x2="36" y2="128" stroke="#6ee7b7" stroke-width="0.8" opacity="0.6"/>
            <line x1="42" y1="48" x2="41" y2="128" stroke="#022c22" stroke-width="0.8" opacity="0.6"/>
          </g>

          <!-- Brush 2: Medium Round Brush (Center) -->
          <g transform="translate(70, 10) rotate(4)">
            <path d="M 34 190 L 42 190 L 40 410 L 36 410 Z" fill="#0f291e" stroke="#064e3b" stroke-width="1"/>
            <path d="M 32 140 L 44 140 L 42 190 L 34 190 Z" fill="url(#ferruleGrad_single)"/>
            <line x1="33" y1="155" x2="43" y2="155" stroke="#475569" stroke-width="1"/>
            <line x1="33" y1="170" x2="43" y2="170" stroke="#475569" stroke-width="1"/>
            <path d="M 38 35 C 30 65, 30 105, 32 140 L 44 140 C 46 105, 46 65, 38 35 Z" fill="#047857"/>
            <path d="M 38 35 C 33 55, 32 75, 33 95 L 43 95 C 44 75, 43 55, 38 35 Z" fill="#10b981"/>
            <path d="M 38 35 C 35 48, 34 60, 35 70 L 41 70 C 42 60, 41 48, 38 35 Z" fill="#6ee7b7"/>
          </g>

          <!-- Brush 3: Fine Detail Brush (Right) -->
          <g transform="translate(110, 50) rotate(14)">
            <path d="M 28 170 L 34 170 L 32 380 L 30 380 Z" fill="#0d241a" stroke="#064e3b" stroke-width="0.8"/>
            <rect x="27" y="130" width="8" height="40" rx="1" fill="url(#ferruleGrad_single)"/>
            <line x1="27" y1="145" x2="35" y2="145" stroke="#475569" stroke-width="0.8"/>
            <path d="M 31 55 C 26 80, 26 105, 27 130 L 35 130 C 36 105, 36 80, 31 55 Z" fill="#047857"/>
            <path d="M 31 55 C 28 70, 27 85, 28 100 L 34 100 C 35 85, 34 70, 31 55 Z" fill="#34d399"/>
          </g>
        </g>
      </g>
    </svg>
  </div>

  <div class="cert-content">
    <div class="cert-header">
      <div class="cert-logo-section">
        <img src="${logoUrl}" class="cert-app-logo" style="width:75px; height:75px; object-fit:contain; border-radius:12px; box-shadow: 0 2px 8px rgba(6,78,59,0.15);" alt="Milad Fest Logo" />
        <div class="cert-org-details">
          <div class="cert-madrasa-name">${madrasaName}</div>
          <div class="cert-madrasa-place">${madrasaPlace}</div>
        </div>
      </div>

      <div class="cert-event-section">
        <div class="cert-event-name">${eventNameText}</div>
        <div class="cert-event-sub">Milad_fest ${eventYearText}</div>
      </div>
    </div>

    <div>
      <div class="cert-title-section">
        <div class="cert-main-title">Certificate</div>
        <div class="cert-sub-title">Of Excellence</div>
      </div>

      <div class="cert-pill-badge">
        This Certificate is proudly presented to
      </div>

      <div class="cert-student-name">
        ${student.name}
      </div>

      <div class="cert-description">
        in recognition of securing <strong class="cert-highlight">${prizeText}</strong> in the <strong class="cert-highlight">${progAndCatText}</strong> competition at the <strong>${eventAndYearText}</strong> , Your dedication have earned you this distinguished achievement.
      </div>
    </div>

    <div class="cert-signatures">
      <div class="cert-sign-col">
        <div class="cert-sign-name">${coordinatorConvener || ''}</div>
        <div class="cert-sign-line"></div>
        <div class="cert-sign-label">Convener / Coordinator</div>
      </div>
      <div class="cert-sign-col">
        <div class="cert-sign-name">${convenerSadar || ''}</div>
        <div class="cert-sign-line"></div>
        <div class="cert-sign-label">Sadar Muallim</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
          `;
          printHtml(html);
        };

        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9990,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1050px', marginBottom: '15px', color: 'white' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>📜 Certificate Preview</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleModalDownloadPdf}
                  style={{ background: '#10b981', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '13px' }}
                >
                  📥 Download PDF
                </button>
                <button
                  onClick={handleModalDownload}
                  style={{ background: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '13px' }}
                >
                  🖼️ Download Image
                </button>
                <button
                  onClick={handleModalPrint}
                  style={{ background: '#fbbf24', border: 'none', color: '#78350f', cursor: 'pointer', padding: '6px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '13px' }}
                >
                  🖨️ Print
                </button>
                <button
                  onClick={() => setActiveCertificate(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 14px', borderRadius: '8px', fontWeight: '700' }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Certificate viewport wrapper */}
            <div style={{
              width: '100%',
              maxWidth: '1050px',
              height: '740px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0f172a',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              <div
                id="modalCertificateArea"
                style={{
                  width: '1050px',
                  height: '740px',
                  position: 'absolute',
                  background: '#ffffff',
                  overflow: 'hidden',
                  transform: 'scale(calc(min(90vw, 1050px) / 1050))',
                  transformOrigin: 'center center',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                {/* Right Green Geometric Banner with Arabic Calligraphy */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '380px', height: '740px', pointerEvents: 'none', zIndex: 1 }}>
                                    <svg width="380" height="740" viewBox="0 0 380 740" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="islamicPattern_modal" width="70" height="70" patternUnits="userSpaceOnUse">
                        <path d="M35 0 L70 35 L35 70 L0 35 Z" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.35"/>
                        <path d="M0 0 L70 70 M70 0 L0 70" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.2"/>
                        <circle cx="35" cy="35" r="14" stroke="#0d6e53" strokeWidth="0.8" fill="none" opacity="0.25"/>
                        <polygon points="35,12 42,27 58,27 44,37 50,53 35,43 20,53 26,37 12,27 28,27" stroke="#0d6e53" strokeWidth="0.6" fill="none" opacity="0.25"/>
                      </pattern>
                      <linearGradient id="ferruleGrad_modal" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#94a3b8' }}/>
                        <stop offset="50%" style={{ stopColor: '#f1f5f9' }}/>
                        <stop offset="100%" style={{ stopColor: '#64748b' }}/>
                      </linearGradient>
                    </defs>
                    
                    <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="#064e3b" />
                    <path d="M120 0 L380 0 L380 740 L290 740 L230 540 L270 510 L160 360 L120 0 Z" fill="url(#islamicPattern_modal)" opacity="0.8" />
                    <path d="M120 0 L160 360 L270 510 L230 540 L290 740" stroke="#022c22" strokeWidth="4" fill="none"/>

                    {/* WHITE MILAD FEST LOGO (TOP RIGHT) */}
                    <g transform="translate(195, 40)">
                      <path d="M 90 20 C 45 20 15 55 15 100 C 15 145 45 180 90 180 C 65 170 42 142 42 100 C 42 58 65 30 90 20 Z" fill="#ffffff"/>
                      <path d="M 68 85 C 68 62 82 52 90 48 C 98 52 112 62 112 85 Z" fill="#ffffff"/>
                      <path d="M 90 41 C 88 41 87 42 87 44 C 87 46 89 47 90 47 C 91 47 93 46 93 44 C 93 42 92 41 90 41 Z M 90 38 L 90 41" stroke="#ffffff" strokeWidth="1.8" fill="none"/>
                      <path d="M 52 95 L 52 75 L 56 68 L 60 75 L 60 95 Z" fill="#ffffff"/>
                      <rect x="54" y="62" width="4" height="6" fill="#ffffff"/>
                      <path d="M 120 95 L 120 75 L 124 68 L 128 75 L 128 95 Z" fill="#ffffff"/>
                      <rect x="122" y="62" width="4" height="6" fill="#ffffff"/>
                      <path d="M 50 95 L 130 95 L 130 120 L 50 120 Z" fill="#ffffff"/>
                      <path d="M 83 120 L 83 104 C 83 100 97 100 97 104 L 97 120 Z" fill="#064e3b"/>
                      <path d="M 62 120 L 62 108 C 62 105 73 105 73 108 L 73 120 Z" fill="#064e3b"/>
                      <path d="M 107 120 L 107 108 C 107 105 118 105 118 108 L 118 120 Z" fill="#064e3b"/>
                      <text x="90" y="156" textAnchor="middle" fill="#ffffff" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="18" letterSpacing="1.4">MILAD FEST</text>
                    </g>

                    {/* ARTISTIC PAINT BRUSHES & WATERCOLOR SPLASH */}
                    <g transform="translate(160, 290)">
                      <g opacity="0.85">
                        <path d="M 70 170 C 10 110, -20 210, 20 290 C 50 350, 130 390, 180 310 C 220 240, 150 140, 70 170 Z" fill="#0d6e53" opacity="0.35"/>
                        <path d="M 90 130 C 30 70, 10 190, 60 250 C 110 310, 200 270, 170 170 C 150 110, 120 100, 90 130 Z" fill="#047857" opacity="0.45"/>
                        <path d="M 30 210 C -30 170, -20 270, 40 330 C 100 380, 160 350, 130 270 C 100 210, 60 220, 30 210 Z" fill="#10b981" opacity="0.3"/>
                        <circle cx="15" cy="130" r="3.5" fill="#6ee7b7"/>
                        <circle cx="10" cy="155" r="2.5" fill="#34d399"/>
                        <circle cx="30" cy="100" r="4.5" fill="#10b981"/>
                        <circle cx="0" cy="200" r="3" fill="#059669"/>
                        <circle cx="-15" cy="240" r="5" fill="#6ee7b7"/>
                        <circle cx="-10" cy="275" r="3" fill="#34d399"/>
                        <circle cx="20" cy="340" r="3.5" fill="#10b981"/>
                        <circle cx="55" cy="370" r="4.5" fill="#059669"/>
                        <circle cx="100" cy="400" r="3" fill="#6ee7b7"/>
                        <circle cx="135" cy="380" r="3.5" fill="#34d399"/>
                        <circle cx="170" cy="350" r="2.5" fill="#10b981"/>
                        <circle cx="195" cy="300" r="4" fill="#059669"/>
                        <circle cx="205" cy="250" r="3" fill="#6ee7b7"/>
                      </g>

                      <g transform="rotate(-10, 100, 250)">
                        <g transform="translate(20, 30) rotate(-10)">
                          <path d="M 30 180 L 44 180 L 40 390 L 34 390 Z" fill="#143023" stroke="#064e3b" strokeWidth="1"/>
                          <rect x="27" y="130" width="18" height="50" rx="2" fill="url(#ferruleGrad_modal)"/>
                          <line x1="27" y1="145" x2="45" y2="145" stroke="#475569" strokeWidth="1"/>
                          <line x1="27" y1="160" x2="45" y2="160" stroke="#475569" strokeWidth="1"/>
                          <path d="M 25 45 L 47 45 L 45 130 L 27 130 Z" fill="#064e3b"/>
                          <path d="M 25 45 L 47 45 L 46 75 L 26 75 Z" fill="#047857"/>
                          <path d="M 25 45 L 47 45 L 47 58 L 25 58 Z" fill="#34d399" opacity="0.85"/>
                          <line x1="30" y1="48" x2="31" y2="128" stroke="#022c22" strokeWidth="0.8" opacity="0.6"/>
                          <line x1="36" y1="48" x2="36" y2="128" stroke="#6ee7b7" strokeWidth="0.8" opacity="0.6"/>
                          <line x1="42" y1="48" x2="41" y2="128" stroke="#022c22" strokeWidth="0.8" opacity="0.6"/>
                        </g>

                        <g transform="translate(70, 10) rotate(4)">
                          <path d="M 34 190 L 42 190 L 40 410 L 36 410 Z" fill="#0f291e" stroke="#064e3b" strokeWidth="1"/>
                          <path d="M 32 140 L 44 140 L 42 190 L 34 190 Z" fill="url(#ferruleGrad_modal)"/>
                          <line x1="33" y1="155" x2="43" y2="155" stroke="#475569" strokeWidth="1"/>
                          <line x1="33" y1="170" x2="43" y2="170" stroke="#475569" strokeWidth="1"/>
                          <path d="M 38 35 C 30 65, 30 105, 32 140 L 44 140 C 46 105, 46 65, 38 35 Z" fill="#047857"/>
                          <path d="M 38 35 C 33 55, 32 75, 33 95 L 43 95 C 44 75, 43 55, 38 35 Z" fill="#10b981"/>
                          <path d="M 38 35 C 35 48, 34 60, 35 70 L 41 70 C 42 60, 41 48, 38 35 Z" fill="#6ee7b7"/>
                        </g>

                        <g transform="translate(110, 50) rotate(14)">
                          <path d="M 28 170 L 34 170 L 32 380 L 30 380 Z" fill="#0d241a" stroke="#064e3b" strokeWidth="0.8"/>
                          <rect x="27" y="130" width="8" height="40" rx="1" fill="url(#ferruleGrad_modal)"/>
                          <line x1="27" y1="145" x2="35" y2="145" stroke="#475569" strokeWidth="0.8"/>
                          <path d="M 31 55 C 26 80, 26 105, 27 130 L 35 130 C 36 105, 36 80, 31 55 Z" fill="#047857"/>
                          <path d="M 31 55 C 28 70, 27 85, 28 100 L 34 100 C 35 85, 34 70, 31 55 Z" fill="#34d399"/>
                        </g>
                      </g>
                    </g>
                  </svg>
                </div>

                {/* Content Section */}
                <div style={{
                  position: 'relative', zIndex: 2, padding: '45px 50px 45px 55px',
                  height: '100%', width: '720px', display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* Top Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img src={logoUrl} alt="Milad Fest Logo" style={{ width: '62px', height: '62px', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 2px 8px rgba(6,78,59,0.15)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '19px', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2 }}>{madrasaName}</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{madrasaPlace}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2 }}>{eventNameText}</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#064e3b', letterSpacing: '0.5px', marginTop: '3px', opacity: 0.9 }}>Milad_fest {eventYearText}</div>
                    </div>
                  </div>

                  {/* Main Title & Body */}
                  <div>
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ fontSize: '54px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>Certificate</div>
                      <div style={{ fontSize: '28px', fontWeight: 600, color: '#064e3b', lineHeight: 1.2, marginTop: '2px', fontFamily: "'Inter', sans-serif" }}>Of Excellence</div>
                    </div>

                    <div style={{
                      display: 'inline-block', background: '#064e3b', color: '#ffffff', fontSize: '13.5px',
                      fontWeight: 600, padding: '7px 22px', borderRadius: '20px', marginTop: '22px',
                      letterSpacing: '0.2px', boxShadow: '0 4px 12px rgba(6,78,59,0.25)'
                    }}>
                      This Certificate is proudly presented to
                    </div>

                    <div style={{ fontSize: '38px', fontWeight: 800, color: '#064e3b', marginTop: '14px', marginBottom: '12px', fontFamily: "'Inter', sans-serif" }}>
                      {student.name}
                    </div>

                    <div style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.65, maxWidth: '630px', fontWeight: 400 }}>
                      in recognition of securing <strong style={{ color: '#0f172a', fontWeight: 700, fontStyle: 'italic' }}>{prizeText}</strong> in the <strong style={{ color: '#0f172a', fontWeight: 700, fontStyle: 'italic' }}>{progAndCatText}</strong> competition at the <strong style={{ color: '#0f172a', fontWeight: 700 }}>{eventAndYearText}</strong> , Your dedication have earned you this distinguished achievement.
                    </div>
                  </div>

                  {/* Signatures */}
                  <div style={{ display: 'flex', gap: '70px', marginTop: '35px', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '170px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', minHeight: '22px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '3px', fontFamily: "'Inter', sans-serif" }}>{coordinatorConvener || ''}</div>
                      <div style={{ width: '100%', height: '1.5px', backgroundColor: '#000000', marginBottom: '6px' }}></div>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', letterSpacing: '0.3px' }}>Convener / Coordinator</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '170px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', minHeight: '22px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '3px', fontFamily: "'Inter', sans-serif" }}>{convenerSadar || ''}</div>
                      <div style={{ width: '100%', height: '1.5px', backgroundColor: '#000000', marginBottom: '6px' }}></div>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', letterSpacing: '0.3px' }}>Sadar Muallim</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Winner Poster Modal ── */}
      {posterModal && (() => {
        const { result, regPart, namePart, genderVal, progObj: pm_prog, catObj: pm_cat } = posterModal;
        const isML = posterLang === 'ML';
        const isBoy = genderVal.toUpperCase() === 'BOY';
        const pm_student = students.find(s => String(s.regno || s.regNo || '') === String(regPart));
        const hasPhoto = pm_student && pm_student.photo_url && pm_student.photo_status && pm_student.photo_status !== 'none';
        const teamName = result.teamname || result.teamName || '-';

        // Malayalam text helpers
        const placeML = result.place === 'First' ? 'ഒന്നാം സ്ഥാനം' : result.place === 'Second' ? 'രണ്ടാം സ്ഥാനം' : 'മൂന്നാം സ്ഥാനം';
        const placeEN = result.place === 'First' ? '1st Place' : result.place === 'Second' ? '2nd Place' : '3rd Place';
        const placeShortML = result.place === 'First' ? '1-ാം' : result.place === 'Second' ? '2-ാം' : '3-ാം';
        const genderML = isBoy ? 'ബോയ്സ്' : 'ഗേൾസ്';
        const genderEN = isBoy ? 'Boys' : 'Girls';
        const catNameML = pm_cat ? pm_cat.name : '';
        const catNameEN = pm_cat ? pm_cat.name : '';
        const progNameML = pm_prog ? pm_prog.name : '';
        const progNameEN = pm_prog ? pm_prog.name : '';
        const eventTitle = eventName || 'മിലാദ് ഫെസ്റ്റ്';
        const congratsML = 'അഭിനന്ദനങ്ങൾ';
        const congratsEN = 'Congratulations';
        const medalEmoji = result.place === 'First' ? '🥇' : result.place === 'Second' ? '🥈' : '🥉';
        const rankBg = result.place === 'First' ? 'linear-gradient(135deg, #f59e0b, #b45309)' :
          result.place === 'Second' ? 'linear-gradient(135deg, #94a3b8, #475569)' :
            'linear-gradient(135deg, #f97316, #9a3412)';

        const bodyTextML = `${genderML} ${catNameML} വിഭാഗം ${progNameML} മത്സരത്തിൽ ${placeML} കരസ്ഥമാക്കി`;
        const bodyTextEN = `Secured ${placeEN} in ${genderEN} ${catNameEN} – ${progNameEN}`;

        const handleDownloadPoster = async () => {
          if (!posterRef.current) return;
          try {
            const canvas = await html2canvas(posterRef.current, { scale: 3, useCORS: true, backgroundColor: null });
            const link = document.createElement('a');
            link.download = `winner_poster_${namePart.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          } catch (e) { console.error('Poster download error:', e); }
        };

        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9995,
            background: 'rgba(5, 20, 10, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '16px', overflowY: 'auto'
          }}>
            {/* Header bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '420px', marginBottom: '12px' }}>
              {/* Language toggle */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ML', 'EN'].map(l => (
                  <button key={l} onClick={() => setPosterLang(l)} style={{
                    padding: '6px 14px', borderRadius: '20px', fontWeight: '800',
                    fontSize: '12px', border: 'none', cursor: 'pointer',
                    background: posterLang === l ? '#16a34a' : 'rgba(255,255,255,0.12)',
                    color: 'white'
                  }}>{l === 'ML' ? 'മലയാളം' : 'English'}</button>
                ))}
              </div>
              <button onClick={() => setPosterModal(null)} style={{
                background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white',
                cursor: 'pointer', padding: '6px 14px', borderRadius: '8px', fontWeight: '700'
              }}>✕ Close</button>
            </div>

            {/* ── POSTER CANVAS ── */}
            <div ref={posterRef} style={{
              width: '400px',
              minHeight: '500px',
              background: 'linear-gradient(145deg, #0d4a1f 0%, #1a7a35 40%, #0d5c22 70%, #0a3d18 100%)',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
              fontFamily: isML ? '\'Noto Sans Malayalam\', \'Manjari\', sans-serif' : '\'Poppins\', \'Inter\', sans-serif',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Decorative diagonal stripes */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'linear-gradient(135deg, rgba(74,222,128,0.15), transparent)', borderRadius: '0 24px 0 200px', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '150px', height: '150px', background: 'linear-gradient(315deg, rgba(74,222,128,0.1), transparent)', borderRadius: '0 150px 0 24px', pointerEvents: 'none' }} />
              {/* Diagonal lines accent */}
              <div style={{ position: 'absolute', top: 0, right: '60px', width: '3px', height: '100%', background: 'rgba(74,222,128,0.08)', transform: 'rotate(15deg)', transformOrigin: 'top right', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 0, right: '90px', width: '2px', height: '100%', background: 'rgba(74,222,128,0.05)', transform: 'rotate(15deg)', transformOrigin: 'top right', pointerEvents: 'none' }} />

              {/* Top header */}
              <div style={{ padding: '20px 20px 14px', zIndex: 2, position: 'relative' }}>
                {/* Congratulations vertical text on left */}
                <div style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)',
                  transformOrigin: 'center center',
                  fontSize: isML ? '13px' : '11px',
                  fontWeight: '900',
                  color: 'rgba(74,222,128,0.6)',
                  letterSpacing: '3px',
                  whiteSpace: 'nowrap',
                  fontStyle: 'italic'
                }}>{isML ? congratsML : congratsEN}</div>

                <div style={{ marginLeft: '30px' }}>
                  {/* Event Name in Malayalam */}
                  <div style={{ fontSize: isML ? '17px' : '15px', fontWeight: '900', color: '#fef08a', textAlign: 'center', lineHeight: 1.3, textShadow: '0 2px 8px rgba(0,0,0,0.5)', letterSpacing: isML ? '0.5px' : '1px' }}>{eventTitle}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#86efac', textAlign: 'center', letterSpacing: '2px', marginTop: '3px' }}>MILAD FEST 2026</div>
                </div>

                {/* Thin separator */}
                <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #4ade80, transparent)', margin: '12px 20px 0' }} />
              </div>

              {/* Body: Rank badge + Photo side-by-side */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '0 24px 16px', zIndex: 2, position: 'relative' }}>
                {/* Left: white card area */}
                <div style={
                  {
                    flex: 1,
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '18px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
                  }
                }>
                  {/* Rank circle */}
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: rankBg,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                    border: '3px solid white',
                    marginBottom: '10px',
                    flexShrink: 0
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', lineHeight: 1 }}>{placeShortML}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: '1px' }}>Rank</div>
                  </div>

                  {/* Body text */}
                  <div style={{ textAlign: 'center', color: '#166534', fontSize: isML ? '12px' : '11px', fontWeight: '700', lineHeight: 1.5, marginBottom: '10px' }}>
                    {isML ? bodyTextML : bodyTextEN}
                  </div>

                  {/* Congratulations big text */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: isML ? '22px' : '20px',
                    fontWeight: '900',
                    color: '#15803d',
                    lineHeight: 1.2,
                    textShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}>
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {isML ? '✨ ' + congratsML + ' ✨' : '✨ ' + congratsEN + ' ✨'}
                    </span>
                  </div>
                </div>

                {/* Right: Photo circle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '110px', height: '110px',
                    borderRadius: '50%',
                    border: '4px solid #4ade80',
                    boxShadow: '0 0 0 4px rgba(74,222,128,0.3), 0 10px 30px rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                    background: isBoy ? 'linear-gradient(135deg, #dbeafe, #93c5fd)' : 'linear-gradient(135deg, #fce7f3, #f9a8d4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {hasPhoto ? (
                      <img src={pm_student.photo_url} alt={namePart} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                    ) : (
                      <svg viewBox="0 0 24 24" style={{ width: '60%', height: '60%', fill: 'none', stroke: isBoy ? '#1e40af' : '#be185d', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Dark info strip */}
              <div style={{
                background: 'linear-gradient(135deg, #064e3b, #065f46)',
                margin: '0 16px 16px',
                borderRadius: '16px',
                padding: '14px 16px',
                zIndex: 2,
                position: 'relative',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}>
                {/* Student name */}
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', textAlign: 'center', letterSpacing: '0.5px', marginBottom: '8px', lineHeight: 1.2 }}>
                  {namePart}
                </div>
                {/* Register No */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <div style={{ background: 'rgba(74,222,128,0.2)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', color: '#86efac', border: '1px solid rgba(74,222,128,0.4)' }}>
                    {isML ? 'രജി. നം: ' : 'Reg No: '}#{regPart}
                  </div>
                  <div style={{ background: 'rgba(251,191,36,0.2)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', color: '#fde68a', border: '1px solid rgba(251,191,36,0.4)' }}>
                    {isML ? 'ടീം: ' : 'Team: '}{teamName}
                  </div>
                </div>
                {/* Place badge */}
                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <span style={{ background: rankBg, borderRadius: '20px', padding: '4px 16px', fontSize: '12px', fontWeight: '900', color: 'white', letterSpacing: '1px' }}>
                    {medalEmoji} {isML ? placeML : placeEN}
                  </span>
                </div>
              </div>

              {/* Bottom sparkle strip */}
              <div style={{ height: '6px', background: 'linear-gradient(90deg, #15803d, #4ade80, #fbbf24, #4ade80, #15803d)', flexShrink: 0 }} />
            </div>

            {/* Download button */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={handleDownloadPoster} style={{
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: 'white', border: 'none', borderRadius: '12px',
                padding: '12px 28px', fontSize: '14px', fontWeight: '800',
                cursor: 'pointer', boxShadow: '0 6px 20px rgba(22,163,74,0.4)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>🖼️ {isML ? 'ചിത്രം ഡൗൺലോഡ്' : 'Download PNG'}</button>
            </div>
          </div>
        );
      })()}

    </div>
  )
}

export default App;

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
        <div style={{ flexShrink: 0, width: '74px', height: '84px', borderRadius: '8px', border: '2px solid #16a34a', overflow: 'hidden', background: '#f0fdf4', boxShadow: '0 3px 12px rgba(22,163,74,0.25)' }}>
          {photoContent}
        </div>

        {/* Name + RegNo */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', gap: '5px', minWidth: 0 }}>
          {/* Student Name */}
          <div style={{ fontSize: '14px', fontWeight: '900', color: '#14532d', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.2, wordBreak: 'break-word', textAlign: 'center', marginBottom: '1px', textShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {s.name}
          </div>
          {/* Highlighted Reg No badge */}
          <div style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: '7px', padding: '4px 6px', boxShadow: '0 3px 10px rgba(251,191,36,0.55)', width: '100%', boxSizing: 'border-box', textAlign: 'center', border: '1.5px solid #d97706' }}>
            <div style={{ fontSize: '7.5px', fontWeight: '800', color: '#78350f', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1px' }}>
              Register No.
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#1c1917', letterSpacing: '1.5px', lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
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

// Hidden iframe-based printing helper to bypass popup blockers
const printHtml = (htmlContent) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '1024px';
  iframe.style.height = '768px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document || iframe.contentDocument;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  let printed = false;
  const runPrint = () => {
    if (printed) return;
    printed = true;
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Print failed:', e);
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  };

  // Wait for resources to load, or fallback after 1000ms
  iframe.contentWindow.addEventListener('load', () => {
    setTimeout(runPrint, 400);
  });
  setTimeout(runPrint, 1000);
};

// Helper to download HTML content as PDF via browser print-to-PDF
const downloadHtmlAsPdf = (htmlContent, filename = 'document.pdf') => {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      setTimeout(() => {
        // Set the document title to control the filename in Save dialog
        win.document.title = filename.replace('.pdf', '');
        win.focus();
        win.print();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      }, 600);
    };
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } else {
    // Fallback: direct download as HTML
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.pdf', '.html');
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

const getTrollReaction = (rank, teamName, lang, offset = 0) => {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) + offset;

  if (rank === 1) {
    const reactions = lang === 'ML' ? [
      { emoji: '🏆', text: 'ബിരിയാണി ചെമ്പ് തുറക്കാൻ റെഡിയായിക്കോളൂ, ഞങ്ങൾ കപ്പും കൊണ്ടേ വരൂ! 🥘' },
      { emoji: '☕', text: 'ഒരു കവിൾ സുലൈമാനി കുടിച്ച് ഞങ്ങൾ ഒന്നാം സ്ഥാനത്ത് തന്നെയുണ്ട്! 😎' },
      { emoji: '⛵', text: 'കാറ്റും കോലും വകവെക്കാതെ ഞങ്ങളുടെ യാത്ര മുന്നോട്ട് തന്നെയാണ്! 🏆' },
      { emoji: '🚀', text: 'ഞങ്ങളുടെ വേഗത കൂട്ടാൻ ഇനി വേറെ ഗിയർ നോക്കേണ്ടി വരും! ✨' },
      { emoji: '🏡', text: 'ആരും പേടിക്കണ്ട, കപ്പ് ഞങ്ങൾ സൂക്ഷിച്ചു വീട്ടിൽ എത്തിച്ചോളാം! 🏆' },
      { emoji: '🤩', text: 'മുന്നിൽ നിൽക്കുന്നതിന്റെ ആ ഒരു സന്തോഷം അനുഭവിച്ചു തന്നെ അറിയണം! ✨' },
      { emoji: '☕', text: 'ഞങ്ങളെ പിന്തുടരുന്ന സുഹൃത്തുക്കൾക്ക് ചായ കുടിക്കാൻ വേണമെങ്കിൽ സമയം തരാം! 😜' },
      { emoji: '📈', text: 'ക്ഷമയോടെ കാത്തിരിക്കൂ, ഞങ്ങളുടെ സ്കോർ ബോർഡ് ഇനിയും ഉയരും! 🔥' },
      { emoji: '🛣️', text: 'വിജയത്തിന്റെ നല്ലൊരു പാതയിൽ ഞങ്ങൾ യാത്ര തുടങ്ങിക്കഴിഞ്ഞു! 🚀' },
      { emoji: '🛌', text: 'എല്ലാവരും ഒപ്പം വരാൻ നോക്കൂ, ഞങ്ങൾ ചെറുതായൊന്ന് വിശ്രമിക്കാം! 🏁' }
    ] : [
      { emoji: '🥘', text: 'Get the Biryani ready, we are coming home with the cup! 🏆' },
      { emoji: '☕', text: 'Sipping our Sulaimani, relaxed right here at the first spot! 😎' },
      { emoji: '🏆', text: 'Unstoppable! We are sailing strong to the finish line! ⛵' },
      { emoji: '🚀', text: 'We might need to find a higher gear to go any faster! ✨' },
      { emoji: '🏆', text: 'Do not worry, we will deliver the cup safely to our cabinet! 🏡' },
      { emoji: '✨', text: 'Leading the board is a joy you have to experience to believe! 🤩' },
      { emoji: '😜', text: 'We can pause for a tea break if our friends behind need to catch up! ☕' },
      { emoji: '🔥', text: 'Stay tuned, our scoreboard is only going higher! 📈' },
      { emoji: '🚀', text: 'We are well on our way to a beautiful victory! 🛣️' },
      { emoji: '🏁', text: 'Try to catch up, everyone, we are taking a little breather! 🛌' }
    ];
    return reactions[index % reactions.length];
  } else if (rank === 2 || rank === 3) {
    const reactions = lang === 'ML' ? [
      { emoji: '👀', text: 'മുന്നിലുള്ളവർ ഒന്ന് തിരിഞ്ഞു നോക്കിക്കോളൂ, ദാ തൊട്ടുപുറകിലുണ്ട്! 🏃‍♂️' },
      { emoji: '⚡', text: 'ലീഡ് കണ്ട് സന്തോഷിക്കേണ്ട, കളി ഇനിയും ബാക്കിയുണ്ട് കൂട്ടുകാരേ! ⏳' },
      { emoji: '🎯', text: 'പതുക്കെയാണെങ്കിലും ലക്ഷ്യത്തിലേക്ക് തന്നെയാണ് ഞങ്ങളുടെ യാത്ര! 🚶‍♂️' },
      { emoji: '🔥', text: 'ഒരു ചെറിയ ഇടവേളക്ക് ശേഷം ഞങ്ങൾ ഇതാ വീണ്ടും വരുന്നു! 🚀' },
      { emoji: '💪', text: 'വിജയം അത്ര എളുപ്പത്തിൽ വിട്ടുകൊടുക്കാൻ ഞങ്ങൾക്ക് മനസ്സില്ല! 🏆' },
      { emoji: '💥', text: 'മത്സരം അവസാന നിമിഷം വരെ ആവേശകരമാക്കാൻ ഞങ്ങൾ റെഡിയാണ്! 🏁' },
      { emoji: '⏳', text: 'നിങ്ങളുടെ ഒന്നാം സ്ഥാനം താത്കാലികം മാത്രമാണ് സുഹൃത്തുക്കളെ! 😎' },
      { emoji: '🔥', text: 'തളരില്ല ഞങ്ങൾ, അവസാന നിമിഷം വരെ പോരാടും! 💪' },
      { emoji: '🏆', text: 'ദാ എത്തിക്കഴിഞ്ഞു! ഇനി കപ്പിനായുള്ള ഫൈനൽ പോരാട്ടമാണ്! ⚡' },
      { emoji: '🏃‍♂️', text: 'മുന്നിലുള്ളവരുടെ നെഞ്ചിടിപ്പ് കൂട്ടാൻ ഞങ്ങൾ വേഗത കൂട്ടുന്നു! 💓' }
    ] : [
      { emoji: '🏃‍♂️', text: 'Those in front, look back! We are right on your heels! 👀' },
      { emoji: '⏳', text: 'Do not celebrate the lead yet, the game is far from over! ⚡' },
      { emoji: '🚶‍♂️', text: 'Slowly but surely, our steps are headed straight for the target! 🎯' },
      { emoji: '🚀', text: 'After a quick pause, we are building up speed again! 🔥' },
      { emoji: '🏆', text: 'We are not going to hand over the trophy that easily! 💪' },
      { emoji: '🏁', text: 'We are ready to keep this exciting right down to the final second! 💥' },
      { emoji: '😎', text: 'Your first place is only temporary, dear friends! ⏳' },
      { emoji: '💪', text: 'We never give up, we will fight until the last event! 🔥' },
      { emoji: '⚡', text: 'We have arrived! The battle for the cup starts now! 🏆' },
      { emoji: '💓', text: 'We are speeding up to make those in front a little nervous! 🏃‍♂️' }
    ];
    return reactions[index % reactions.length];
  } else {
    const reactions = lang === 'ML' ? [
      { emoji: '🧠', text: 'ഞങ്ങൾ തോൽക്കാൻ തയ്യാറല്ല, കളി ഇനിയും പഠിപ്പിച്ചു തരാം! 📖' },
      { emoji: '🥘', text: 'ബിരിയാണിക്കുള്ള അരി ഇപ്പോൾ തന്നെ അടുപ്പത്ത് വെച്ചോളൂ! 🔥' },
      { emoji: '🙌', text: 'പോയിന്റുകൾ കുറവാണെങ്കിലും ഞങ്ങളുടെ ആവേശത്തിന് ഒട്ടും കുറവില്ല! 💥' },
      { emoji: '🍿', text: 'കളിയിലെ വലിയ ട്വിസ്റ്റുകൾ ഇനിയും വരാനിരിക്കുന്നതേയുള്ളൂ! ⏳' },
      { emoji: '🚶‍♂️', text: 'എല്ലാവരും ഒന്ന് മുന്നോട്ട് പൊയ്ക്കോളൂ, ഞങ്ങൾ വഴി തടസ്സപ്പെടുത്തില്ല! 🛣️' },
      { emoji: '🗺️', text: 'പതുക്കെപ്പോയാൽ വഴിയിലെ ഭംഗിയുള്ള കാഴ്ചകൾ നന്നായി ആസ്വദിക്കാം! 🚶‍♂️' },
      { emoji: '🤫', text: 'ഇത് ഞങ്ങളുടെ തന്ത്രപരമായ മുന്നൊരുക്കമാണ്, അവസാനം കാണാം! ⚡' },
      { emoji: '✨', text: 'സ്കോർ ബോർഡിൽ അത്ഭുതങ്ങൾ സംഭവിക്കാൻ ഒരു നിമിഷം മതി! 📈' },
      { emoji: '🧗‍♂️', text: 'വിഷമിക്കേണ്ട കൂട്ടുകാരേ, താഴെനിന്നുള്ള കയറ്റത്തിന് ഒരു പ്രത്യേക ഭംഗിയുണ്ട്! 🏔️' },
      { emoji: '☕', text: 'ഞങ്ങൾ വരുന്നുണ്ട്, ചായക്കടയിൽ ഞങ്ങൾക്കായി ഒരു സീറ്റ് മാറ്റിവെക്കണേ! 👋' }
    ] : [
      { emoji: '📖', text: 'We are not giving up, there is still time to show our best! 🧠' },
      { emoji: '🔥', text: 'You can start boiling the rice for the Biryani now! 🥘' },
      { emoji: '💥', text: 'Points might be low, but our energy is touching the sky! 🙌' },
      { emoji: '⏳', text: 'The biggest twists of the tournament are yet to come! 🍿' },
      { emoji: '🛣️', text: 'Go ahead, everyone! We promise not to block the way! 🚶‍♂️' },
      { emoji: '🚶‍♂️', text: 'Going slow lets us enjoy the scenic views along the journey! 🗺️' },
      { emoji: '⚡', text: 'This is just a strategic buildup, wait for the finale! 🤫' },
      { emoji: '📈', text: 'It only takes one moment for a miracle on the scoreboard! ✨' },
      { emoji: '🏔️', text: 'No worries! Climbing up from the bottom is the best journey! 🧗‍♂️' },
      { emoji: '👋', text: 'We are on our way, save a cup of tea for us at the counter! ☕' }
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
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('network')) {
      return lang === 'EN'
        ? 'Database connection failed!\n\nIf you are using Brave browser, an Ad-blocker, or Privacy extension, please DISABLE it for this site (turn off Shields / pause blocker) and try again. Also ensure you have a stable internet connection.'
        : 'ഡാറ്റാബേസ് കണക്ഷൻ പരാജയപ്പെട്ടു!\n\nനിങ്ങൾ Brave ബ്രൗസർ, Ad-blocker അല്ലെങ്കിൽ Privacy extension ഉപയോഗിക്കുന്നുണ്ടെങ്കിൽ, ദയവായി ഈ സൈറ്റിനായി അത് ഓഫ് ചെയ്യുക (Shields ഓഫ് ചെയ്യുക / ബ്ലോക്കർ പോസ് ചെയ്യുക). നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ മികച്ചതാണെന്നും ഉറപ്പുവരുത്തുക.';
    }
    return errorMsg;
  }, [lang]);

  // ── Persistent session: restore from localStorage on first render ──
  const savedSession = (() => {
    try { return JSON.parse(localStorage.getItem('miladfest_session') || 'null'); } catch { return null; }
  })();

  const [currentScreen, setCurrentScreen] = useState(savedSession ? 'DASHBOARD' : 'LOGIN');
  const [activeTab, setActiveTab] = useState('SCOREBOARD');
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

  // Event / Program Name States (stored in localStorage)
  const [eventName, setEventName] = useState('');
  const [eventYear, setEventYear] = useState('');
  const [eventNameInput, setEventNameInput] = useState('');
  const [eventYearInput, setEventYearInput] = useState('');
  const [isEditingEvent, setIsEditingEvent] = useState(false);

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

  // Super admin panel states
  const [superMadrasas, setSuperMadrasas] = useState([]);
  const [pendingMadrasa, setPendingMadrasa] = useState(null);
  const [editingMadrasaId, setEditingMadrasaId] = useState(null);
  const [editingMadrasaData, setEditingMadrasaData] = useState({});

  // Master data states (Supabase online database)
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dbHasClassRange, setDbHasClassRange] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [timetableFilterCat, setTimetableFilterCat] = useState('ALL');
  const [timetableView, setTimetableView] = useState('GRID'); // 'GRID' | 'LIST'
  const [editingTimetableId, setEditingTimetableId] = useState(null);
  const [timetableFormData, setTimetableFormData] = useState({ scheduled_time: '', venue: '' });
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [resultsList, setResultsList] = useState([]);
  const [programRegistrations, setProgramRegistrations] = useState([]);

  // Dynamic Points system state
  const [pointSystem, setPointSystem] = useState({
    p1: 5, p2: 3, p3: 1, gA: 5, gB: 3, gC: 1,
    gp1: 10, gp2: 6, gp3: 2, gpA: 5, gpB: 3, gpC: 1
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
  const [settingsSubTab, setSettingsSubTab] = useState('TEAMS');
  const [resultsSubTab, setResultsSubTab] = useState('PROGRAM_WINNERS');

  // GENERAL category feature: virtual composite category
  const [generalCatIds, setGeneralCatIds] = useState([]); // IDs of categories included in GENERAL
  const [showGeneralModal, setShowGeneralModal] = useState(false); // show/hide GENERAL options modal
  const [generalModalTemp, setGeneralModalTemp] = useState([]); // temp selection inside modal

  // Filter states for Results tab
  const [filterCat, setFilterCat] = useState('');
  const [filterProg, setFilterProg] = useState('');
  const [filterGender, setFilterGender] = useState('ALL');

  // Student search by reg number
  const [searchRegNo, setSearchRegNo] = useState('');

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

  // ── Group Registration States ──
  const [groupRegistrations, setGroupRegistrations] = useState([]);
  const [groupRegCat, setGroupRegCat] = useState('');
  const [groupRegGender, setGroupRegGender] = useState('BOY');
  const [groupRegProgram, setGroupRegProgram] = useState('');
  const [groupRegName, setGroupRegName] = useState('');
  const [groupRegTeam, setGroupRegTeam] = useState('');
  const [groupRegLeader, setGroupRegLeader] = useState('');
  const [groupRegStudents, setGroupRegStudents] = useState([]); // array of student IDs
  const [groupRegSaving, setGroupRegSaving] = useState(false);
  // Edit states for group registration
  const [editingGroupRegId, setEditingGroupRegId] = useState(null);
  const [editingGroupRegName, setEditingGroupRegName] = useState('');
  const [editingGroupRegStudents, setEditingGroupRegStudents] = useState([]);
  const [editingGroupRegLeader, setEditingGroupRegLeader] = useState('');
  const [editingGroupRegSaving, setEditingGroupRegSaving] = useState(false);

  // ── Visibility Control States (for VIEW role hide/show) ──
  const [visibilityControls, setVisibilityControls] = useState({
    scoreboard: true,
    results_PROGRAM_WINNERS: true,
    results_STUDENT_REPORT: true,
    results_RESULTS_HISTORY: true,
    results_CHAMPIONS: true,
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

  // 🔄 Function to load real-time data from Supabase
  const fetchSupabaseData = async (rNum) => {
    try {
      const [
        { data: teamsData },
        { data: catsData },
        { data: studentsData },
        { data: programsData },
        { data: resultsData },
        { data: regData },
        { data: madrasaData }
      ] = await Promise.all([
        supabase.from('teams').select('*').eq('madrasa_id', rNum),
        supabase.from('categories').select('*').eq('madrasa_id', rNum),
        supabase.from('students').select('*').eq('madrasa_id', rNum),
        supabase.from('programs').select('*').eq('madrasa_id', rNum),
        supabase.from('results').select('*').eq('madrasa_id', rNum),
        supabase.from('program_registrations').select('*').eq('madrasa_id', rNum),
        supabase.from('madrasas').select('place').eq('regNumber', rNum).maybeSingle()
      ]);

      if (teamsData) setTeams(teamsData);
      if (catsData) setCategories(catsData);
      if (studentsData) setStudents([...studentsData].sort(compareRegNo));
      if (programsData) setPrograms([...programsData].sort(compareProgCode));
      if (resultsData) setResultsList(resultsData);
      if (madrasaData) {
        const [, , trollStatus, dbTrollLang] = (madrasaData.place || '').split('|');
        setTrollMode(trollStatus === 'troll_on');
        setTrollLang(dbTrollLang === 'EN' ? 'EN' : 'ML');
      }
      if (regData) {
        const mappedRegs = regData.map(r => ({
          ...r,
          program_id: r.program_name
        }));
        setProgramRegistrations(mappedRegs);
      }

      // Fetch group registrations in a separate block so that a missing table won't block the rest of the application
      try {
        const { data: gRegData } = await supabase
          .from('group_registrations')
          .select('*')
          .eq('madrasa_id', rNum);
        if (gRegData) setGroupRegistrations(gRegData);
      } catch (err) {
        console.error("Group registrations fetch failed: ", err);
      }

      // Fetch timetable in a separate block so that a missing table won't block the rest of the application
      try {
        const { data: ttData } = await supabase
          .from('timetable')
          .select('*')
          .eq('madrasa_id', rNum);
        if (ttData) setTimetable(ttData);
      } catch (err) {
        console.error("Timetable fetch failed: ", err);
      }
    } catch (err) {
      console.error("Data fetch error: ", err);
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


  useEffect(() => {
    if (loggedInMadrasa) {
      const rNum = loggedInMadrasa.regNumber;

      // Check schema column availability
      checkClassRangeColumn();

      // Fetch data from online database
      fetchSupabaseData(rNum);
      // Points system is still stored in localStorage - safely parsed
      try {
        const storedPoints = localStorage.getItem(`points_${rNum}`);
        if (storedPoints) {
          setPointSystem(JSON.parse(storedPoints));
        } else {
          setPointSystem({
            p1: 5, p2: 3, p3: 1, gA: 5, gB: 3, gC: 1,
            gp1: 10, gp2: 6, gp3: 2, gpA: 5, gpB: 3, gpC: 1
          });
        }
      } catch (e) {
        console.error("Failed to parse stored points", e);
        setPointSystem({
          p1: 5, p2: 3, p3: 1, gA: 5, gB: 3, gC: 1,
          gp1: 10, gp2: 6, gp3: 2, gpA: 5, gpB: 3, gpC: 1
        });
      }

      // Load visibility controls from localStorage
      try {
        const storedControls = localStorage.getItem(`visibility_controls_${rNum}`);
        if (storedControls) {
          setVisibilityControls(JSON.parse(storedControls));
        } else {
          setVisibilityControls({
            scoreboard: true,
            results_PROGRAM_WINNERS: true,
            results_STUDENT_REPORT: true,
            results_RESULTS_HISTORY: true,
            results_CHAMPIONS: true,
          });
        }
      } catch (e) {
        console.error("Failed to parse stored visibility controls", e);
      }

      // Load GENERAL category selection from localStorage
      try {
        const storedGeneral = localStorage.getItem(`general_cat_ids_${rNum}`);
        if (storedGeneral) {
          setGeneralCatIds(JSON.parse(storedGeneral));
        } else {
          setGeneralCatIds([]);
        }
      } catch (e) {
        console.error("Failed to parse stored general category IDs", e);
      }

      // Load Event Name & Year from localStorage
      try {
        const storedEventName = localStorage.getItem(`event_name_${rNum}`) || '';
        const storedEventYear = localStorage.getItem(`event_year_${rNum}`) || '';
        setEventName(storedEventName);
        setEventYear(storedEventYear);
        setEventNameInput(storedEventName);
        setEventYearInput(storedEventYear);
      } catch (e) {
        console.error("Failed to load event name/year", e);
      }

      // Checker to set default categories on first login if database is empty
      checkAndInsertDefaultCategories(rNum);
    }
  }, [loggedInMadrasa]);

  // 📺 Projector Mode Synchronization & Slide Rotation Effect
  useEffect(() => {
    if (!isProjectorActive || !loggedInMadrasa) return;

    const rNum = loggedInMadrasa.regNumber;
    
    // Auto-refresh from Supabase every 30 seconds
    const dataInterval = setInterval(() => {
      console.log("Projector mode: auto-refreshing data...");
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

  // QR scan data fetcher
  const handleQrScan = async (madrasaReg, studentId) => {
    setQrModalLoading(true);
    setQrModalOpen(true);
    try {
      const [{ data: madrasaData }, { data: studentData }, { data: resultsData }, { data: teamsData }, { data: catsData }, { data: progsData }] = await Promise.all([
        supabase.from('madrasas').select('*').eq('regNumber', madrasaReg).maybeSingle(),
        supabase.from('students').select('*').eq('id', studentId).maybeSingle(),
        supabase.from('results').select('*').eq('madrasa_id', madrasaReg),
        supabase.from('teams').select('*').eq('madrasa_id', madrasaReg),
        supabase.from('categories').select('*').eq('madrasa_id', madrasaReg),
        supabase.from('programs').select('*').eq('madrasa_id', madrasaReg)
      ]);

      if (!studentData) {
        setQrModalData({ error: 'Student not found!' });
        setQrModalLoading(false);
        return;
      }

      const [actualPlace] = (madrasaData?.place || '').split('|');
      const teamObj = teamsData?.find(t => String(t.id) === String(studentData.teamid || studentData.teamId || ''));
      const catObj = catsData?.find(c => String(c.id) === String(studentData.catid || studentData.catId || ''));

      // --- Find individual programs via program_registrations (most reliable) ---
      let individualProgIds = [];
      try {
        const { data: regData } = await supabase
          .from('program_registrations')
          .select('*')
          .eq('madrasa_id', madrasaReg)
          .eq('student_id', parseInt(studentId, 10));
        if (regData && regData.length > 0) {
          individualProgIds = regData.map(r => String(r.program_name || r.program_id || ''));
        }
      } catch (e) {
        console.warn('program_registrations fetch failed:', e);
      }

      // Match results: by program_id from registrations OR by studentname field (fallback)
      const studentRegNo = studentData.regno || studentData.regNo || '';
      const studentResults = (resultsData || []).filter(r => {
        const rStudentName = r.studentname || '';
        const matchByRegNo = studentRegNo && (
          rStudentName.startsWith(studentRegNo + ' -') ||
          rStudentName.startsWith(studentRegNo + '-')
        );
        const matchByProgId = individualProgIds.length > 0 && individualProgIds.includes(String(r.progid));
        return matchByRegNo || matchByProgId;
      }).map(r => {
        const prog = progsData?.find(p => String(p.id) === String(r.progid));
        return {
          ...r,
          progname: r.progname || (prog ? prog.name : 'Unknown Program'),
        };
      });

      // If we have registered prog IDs but no results yet, show those programs with pending result
      const resultProgIds = studentResults.map(r => String(r.progid));
      const registeredWithNoResult = individualProgIds
        .filter(pid => !resultProgIds.includes(pid))
        .map(pid => {
          const prog = progsData?.find(p => String(p.id) === pid);
          return {
            progid: pid,
            progname: prog ? prog.name : 'Program #' + pid,
            place: null,
            grade: null,
            pending: true
          };
        });

      const allIndividualResults = [...studentResults, ...registeredWithNoResult];

      // Safe fetch of group registrations
      let studentGroups = [];
      try {
        const { data: gRegs } = await supabase
          .from('group_registrations')
          .select('*')
          .eq('madrasa_id', madrasaReg);
        
        if (gRegs) {
          studentGroups = gRegs.filter(g => {
            const memberIds = Array.isArray(g.student_ids) ? g.student_ids : [];
            return memberIds.includes(String(studentId)) || memberIds.includes(Number(studentId));
          });
        }
      } catch (err) {
        console.warn("Error fetching group registrations in QR Scan: ", err);
      }

      // Resolve group results for this student
      const resolvedGroupResults = studentGroups.map(g => {
        const prog = progsData?.find(p => String(p.id) === String(g.program_id));
        const result = (resultsData || []).find(r => String(r.progid) === String(g.program_id) && r.studentname === g.group_name);
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

      setQrModalData({
        madrasa: madrasaData ? { ...madrasaData, place: actualPlace } : null,
        student: studentData,
        team: teamObj,
        category: catObj,
        results: allIndividualResults,
        groupResults: resolvedGroupResults,
        programs: progsData || [],
        groupRegistrations: studentGroups
      });
    } catch (err) {
      setQrModalData({ error: 'Failed to load data: ' + err.message });
    }
    setQrModalLoading(false);
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

  // Code to add default categories to Supabase
  const checkAndInsertDefaultCategories = async (rNum) => {
    const { data } = await supabase.from('categories').select('*').eq('madrasa_id', rNum);
    if (data && data.length === 0) {
      const defaultCats = [
        { name: 'Kiddies', madrasa_id: rNum }, { name: 'Sub Junior', madrasa_id: rNum },
        { name: 'Junior', madrasa_id: rNum }, { name: 'Senior', madrasa_id: rNum },
        { name: 'Super Senior', madrasa_id: rNum }, { name: 'General', madrasa_id: rNum }
      ];
      await supabase.from('categories').insert(defaultCats);
      const { data: updatedCats } = await supabase.from('categories').select('*').eq('madrasa_id', rNum);
      if (updatedCats) setCategories(updatedCats);
    }
  };

  const saveToStorage = (key, data) => {
    if (!loggedInMadrasa) return;
    localStorage.setItem(`${key}_${loggedInMadrasa.regNumber}`, JSON.stringify(data));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginRegNum.trim() || !loginPassword.trim()) {
      alert(t('alertPleaseFillDetails'));
      return;
    }

    setIsLoggingIn(true);
    try {
      const { data: madrasa, error } = await supabase
        .from('madrasas')
        .select('*')
        .eq('regNumber', loginRegNum)
        .maybeSingle();

      if (error) {
        alert(t('alertUnexpectedError') + error.message);
        return;
      }

      if (!madrasa) {
        alert(t('alertMadrasaNotFound'));
        return;
      }

      if (loginPassword === madrasa.adminPassword || loginPassword === madrasa.viewPassword) {
        const [actualPlace, status, trollStatus, dbTrollLang] = (madrasa.place || '').split('|');
        const currentStatus = status || 'approved'; // Default to approved if no suffix

        if (currentStatus === 'pending') {
          setPendingMadrasa(madrasa);
          setCurrentScreen('PENDING_APPROVAL');
          return;
        } else if (currentStatus === 'blocked') {
          alert(t('alertMadrasaBlocked'));
          return;
        }

        // Approved, proceed to login
        const role = loginPassword === madrasa.adminPassword ? 'ADMIN' : 'VIEW';
        const sanitizedMadrasa = { ...madrasa, place: actualPlace };
        setLoggedInMadrasa(sanitizedMadrasa);
        setLoginRole(role);
        setCurrentScreen('DASHBOARD');
        setActiveTab('SCOREBOARD');

        // 🎭 Sync troll mode from database
        setTrollMode(trollStatus === 'troll_on');
        setTrollLang(dbTrollLang === 'EN' ? 'EN' : 'ML');

        // 💾 Save session to localStorage for auto-login
        localStorage.setItem('miladfest_session', JSON.stringify({ madrasa: sanitizedMadrasa, role }));

        // Clear login form
        setLoginRegNum('');
        setLoginPassword('');
      } else {
        alert(t('alertIncorrectPassword'));
      }
    } catch (err) {
      alert(t('alertUnexpectedError') + err.message);
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
      const { data: existing, error: checkError } = await supabase
        .from('madrasas')
        .select('regNumber')
        .eq('regNumber', regNumber);

      if (checkError) {
        alert(t('alertUnexpectedError') + checkError.message);
        return;
      }

      if (existing && existing.length > 0) {
        alert(t('alertRegNumberExists'));
        return;
      }

      // Insert Madrasa with pending suffix in place
      const { error } = await supabase
        .from('madrasas')
        .insert([
          {
            name: regName,
            regNumber: regNumber,
            place: `${regPlace}|pending`,
            adminPassword: adminPassword,
            viewPassword: viewPassword
          }
        ]);

      if (error) {
        alert(t('alertUnexpectedError') + error.message);
      } else {
        alert(t('alertRegistrationSubmitted'));
        const tempMadrasa = { name: regName, regNumber, place: `${regPlace}|pending` };
        setPendingMadrasa(tempMadrasa);
        setRegName(''); setRegNumber(''); setRegPlace(''); setAdminPassword(''); setViewPassword('');
        setCurrentScreen('PENDING_APPROVAL');
      }
    } catch (err) {
      alert(t('alertUnexpectedError') + err.message);
    }
  };

  const fetchMadrasas = async () => {
    try {
      const { data, error } = await supabase
        .from('madrasas')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        alert('Failed to load madrasas: ' + error.message);
      } else if (data) {
        setSuperMadrasas(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveMadrasa = async (madrasa) => {
    const [actualPlace] = (madrasa.place || '').split('|');
    const updatedPlace = `${actualPlace}|approved`;
    const { error } = await supabase
      .from('madrasas')
      .update({ place: updatedPlace })
      .eq('id', madrasa.id);

    if (error) {
      alert('Error approving madrasa: ' + error.message);
    } else {
      alert('Madrasa approved successfully!');
      fetchMadrasas();
    }
  };

  const handleBlockMadrasa = async (madrasa) => {
    const [actualPlace] = (madrasa.place || '').split('|');
    const updatedPlace = `${actualPlace}|blocked`;
    const { error } = await supabase
      .from('madrasas')
      .update({ place: updatedPlace })
      .eq('id', madrasa.id);

    if (error) {
      alert('Error blocking madrasa: ' + error.message);
    } else {
      alert('Madrasa blocked!');
      fetchMadrasas();
    }
  };

  const handleDeleteMadrasa = async (id) => {
    if (!window.confirm('Remove this madrasa? All registered data will be deleted.')) return;
    const { error } = await supabase
      .from('madrasas')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error deleting madrasa: ' + error.message);
    } else {
      alert('Madrasa deleted successfully!');
      fetchMadrasas();
    }
  };

  const startEditMadrasa = (madrasa) => {
    const [actualPlace] = (madrasa.place || '').split('|');
    setEditingMadrasaId(madrasa.id);
    setEditingMadrasaData({
      ...madrasa,
      tempPlace: actualPlace
    });
  };

  const handleSaveMadrasaEdit = async () => {
    if (!editingMadrasaData.name.trim() || !editingMadrasaData.regNumber.trim() || !editingMadrasaData.tempPlace.trim() || !editingMadrasaData.adminPassword.trim() || !editingMadrasaData.viewPassword.trim()) {
      alert('Please fill in all details!');
      return;
    }

    // Check if the regNumber is unique among other madrasas
    const duplicate = superMadrasas.find(
      m => m.regNumber === editingMadrasaData.regNumber && m.id !== editingMadrasaId
    );
    if (duplicate) {
      alert('This register number already exists!');
      return;
    }

    const [, status] = (editingMadrasaData.place || '').split('|');
    const currentStatus = status || 'approved';
    const updatedPlace = `${editingMadrasaData.tempPlace}|${currentStatus}`;

    const { error } = await supabase
      .from('madrasas')
      .update({
        name: editingMadrasaData.name,
        regNumber: editingMadrasaData.regNumber,
        place: updatedPlace,
        adminPassword: editingMadrasaData.adminPassword,
        viewPassword: editingMadrasaData.viewPassword
      })
      .eq('id', editingMadrasaId);

    if (error) {
      alert('Error updating madrasa: ' + error.message);
    } else {
      alert('Madrasa details updated successfully!');
      setEditingMadrasaId(null);
      fetchMadrasas();
    }
  };

  const handleToggleTrollMode = async () => {
    const newTrollMode = !trollMode;
    setTrollMode(newTrollMode);
    
    if (loggedInMadrasa) {
      try {
        // Fetch current place from Supabase to preserve location name and status
        const { data: madrasaData } = await supabase
          .from('madrasas')
          .select('place')
          .eq('regNumber', loggedInMadrasa.regNumber)
          .maybeSingle();

        const fullPlace = madrasaData ? madrasaData.place : loggedInMadrasa.place;
        const [actualPlace, status, , currentTrollLang] = (fullPlace || '').split('|');
        const activeTrollLang = currentTrollLang === 'EN' ? 'EN' : 'ML';
        const updatedPlace = `${actualPlace || ''}|${status || 'approved'}|${newTrollMode ? 'troll_on' : 'troll_off'}|${activeTrollLang}`;

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
        const [actualPlace, status, currentTrollStatus] = (fullPlace || '').split('|');
        const activeTrollStatus = currentTrollStatus || (trollMode ? 'troll_on' : 'troll_off');
        const updatedPlace = `${actualPlace || ''}|${status || 'approved'}|${activeTrollStatus}|${newTrollLang}`;

        await supabase
          .from('madrasas')
          .update({ place: updatedPlace })
          .eq('regNumber', loggedInMadrasa.regNumber);
      } catch (err) {
        console.error("Failed to sync troll lang to DB:", err);
      }
    }
  };

  // 🚩 1. TEAM ACTIONS (SUPABASE)
  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || !loggedInMadrasa) return;
    // Optimistic update
    const tempId = 'temp_' + Date.now();
    setTeams(prev => [...prev, { id: tempId, name: newTeamName, madrasa_id: loggedInMadrasa.regNumber }]);
    const savedName = newTeamName;
    setNewTeamName('');
    const { error } = await supabase
      .from('teams')
      .insert([{ name: savedName, madrasa_id: loggedInMadrasa.regNumber }]);
    if (error) {
      alert('Error: ' + error.message);
      setTeams(prev => prev.filter(t => t.id !== tempId));
    } else {
      fetchSupabaseData(loggedInMadrasa.regNumber);
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Remove this team?')) return;
    setTeams(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) { alert(error.message); fetchSupabaseData(loggedInMadrasa.regNumber); }
  };

  const handleSaveTeamEdit = async () => {
    if (!editingTeamName.trim()) return;
    setTeams(prev => prev.map(t => t.id === editingTeamId ? { ...t, name: editingTeamName } : t));
    setEditingTeamId(null);
    const { error } = await supabase.from('teams').update({ name: editingTeamName }).eq('id', editingTeamId);
    if (error) { alert('Error: ' + error.message); fetchSupabaseData(loggedInMadrasa.regNumber); }
  };

  // 📂 2. CATEGORY ACTIONS
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim() || !loggedInMadrasa) return;
    const tempId = 'temp_' + Date.now();
    setCategories(prev => [...prev, { id: tempId, name: newCatName, classrange: dbHasClassRange ? newCatClassRange : '', madrasa_id: loggedInMadrasa.regNumber }]);
    const savedName = newCatName;
    const savedRange = newCatClassRange;
    setNewCatName('');
    setNewCatClassRange('');

    const insertPayload = { name: savedName, madrasa_id: loggedInMadrasa.regNumber };
    if (dbHasClassRange) {
      insertPayload.classrange = savedRange;
    }

    const { error } = await supabase
      .from('categories')
      .insert([insertPayload]);
    if (error) {
      alert('Error: ' + error.message);
      setCategories(prev => prev.filter(c => c.id !== tempId));
    } else {
      fetchSupabaseData(loggedInMadrasa.regNumber);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Remove this category?')) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { alert(error.message); fetchSupabaseData(loggedInMadrasa.regNumber); }
  };

  const handleSaveCatEdit = async () => {
    if (!editingCatName.trim()) return;
    setCategories(prev => prev.map(c => c.id === editingCatId ? { ...c, name: editingCatName, classrange: dbHasClassRange ? editingCatClassRange : '' } : c));
    const savedName = editingCatName;
    const savedRange = editingCatClassRange;
    const targetId = editingCatId;
    setEditingCatId(null);

    const updatePayload = { name: savedName };
    if (dbHasClassRange) {
      updatePayload.classrange = savedRange;
    }

    const { error } = await supabase.from('categories').update(updatePayload).eq('id', targetId);
    if (error) {
      alert('Error: ' + error.message);
      // Roll back to server state on failure
      fetchSupabaseData(loggedInMadrasa.regNumber);
    }
    // On success: do NOT re-fetch — the optimistic update already placed the
    // category in the correct position. Re-fetching would return rows in DB
    // insertion order and move the edited category to the bottom.
  };

  // 🧑‍🎓 3. STUDENT ACTIONS (DB uses lowercase: regno, teamid, catid)
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !studentRegNo.trim() || !selectedStudentTeam || !selectedStudentCat || !loggedInMadrasa) {
      alert('Please fill in all details!'); return;
    }
    const tempId = 'temp_' + Date.now();
    const tempStudent = { id: tempId, name: newStudentName, regno: studentRegNo, teamid: selectedStudentTeam, catid: selectedStudentCat, gender: studentGender, madrasa_id: loggedInMadrasa.regNumber };
    setStudents(prev => [...prev, tempStudent].sort(compareRegNo));

    try {
      const { error } = await supabase.from('students').insert([{
        name: tempStudent.name, regno: tempStudent.regno, teamid: tempStudent.teamid,
        catid: tempStudent.catid, gender: tempStudent.gender, madrasa_id: tempStudent.madrasa_id
      }]);
      if (error) {
        alert('Error: ' + getFriendlyErrorMessage(error.message));
        setStudents(prev => prev.filter(s => s.id !== tempId));
      } else {
        setNewStudentName(''); setStudentRegNo('');
        fetchSupabaseData(loggedInMadrasa.regNumber);
      }
    } catch (err) {
      alert('Error: ' + getFriendlyErrorMessage(err.message));
      setStudents(prev => prev.filter(s => s.id !== tempId));
    }
  };

  // ── BULK UPLOAD: Parse Excel/CSV file ──
  const handleExcelFileRead = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkUploadResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        // Normalize column names (case-insensitive)
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
            name: get(['student name', 'name', 'student_name', 'studentname', 'പേര്']),
            regno: get(['register number', 'regno', 'reg no', 'chest number', 'register_number', 'chestnumber', 'reg number', 'രജിസ്റ്റർ നമ്പർ']),
            teamName: get(['team', 'team name', 'team_name', 'teamname', 'ടീം']),
            catName: get(['category', 'cat', 'category name', 'cat name', 'category_name', 'കാറ്റഗറി']),
            gender: get(['gender', 'sex', 'ജെൻഡർ', 'ലിംഗം']),
          };
        }).filter(r => r.name); // skip empty rows
        setBulkUploadData(normalized);
      } catch (err) {
        alert('Excel file read error: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
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
    for (const row of bulkUploadData) {
      const teamid = resolveTeam(row.teamName);
      let catid = resolveCat(row.catName);
      const gender = resolveGender(row.gender);

      if (!row.name.trim() || !row.regno.trim() || !teamid || !catid) {
        failedRows.push({ row: row._row, name: row.name, reason: !teamid ? `Team "${row.teamName}" not found` : !catid ? `Category "${row.catName}" not found` : 'Missing name/regno' });
        continue;
      }
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
      records.push({ name: row.name.trim(), regno: row.regno.trim(), teamid, catid, gender, madrasa_id: loggedInMadrasa.regNumber });
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
    const originalStudents = [...students];
    setStudents(prev => prev.map(s => s.id === editingStudentId ? { ...s, ...editingStudentData } : s).sort(compareRegNo));
    const targetId = editingStudentId;
    setEditingStudentId(null);
    try {
      const { error } = await supabase.from('students').update({
        name: editingStudentData.name,
        regno: editingStudentData.regno,
        gender: editingStudentData.gender,
        teamid: editingStudentData.teamid,
        catid: editingStudentData.catid
      }).eq('id', targetId);
      if (error) {
        alert('Error: ' + getFriendlyErrorMessage(error.message));
        setStudents(originalStudents);
      } else {
        fetchSupabaseData(loggedInMadrasa.regNumber);
      }
    } catch (err) {
      alert('Error: ' + getFriendlyErrorMessage(err.message));
      setStudents(originalStudents);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Remove this student?')) return;
    const originalStudents = [...students];
    setStudents(prev => prev.filter(s => s.id !== id));
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        alert('Error: ' + getFriendlyErrorMessage(error.message));
        setStudents(originalStudents);
      } else {
        fetchSupabaseData(loggedInMadrasa.regNumber);
      }
    } catch (err) {
      alert('Error: ' + getFriendlyErrorMessage(err.message));
      setStudents(originalStudents);
    }
  };

  // 🏆 4. PROGRAM ACTIONS (DB uses lowercase: catid)
  const handleAddProgram = async (e) => {
    e.preventDefault();
    if (!newProgName.trim() || !newProgCode.trim() || !selectedProgCat || !loggedInMadrasa) return;
    const tempId = 'temp_' + Date.now();
    const tempProg = { id: tempId, name: newProgName, code: newProgCode, catid: selectedProgCat, type: `${progType}_${progGender}`, madrasa_id: loggedInMadrasa.regNumber };
    setPrograms(prev => [...prev, tempProg].sort(compareProgCode));
    const savedName = newProgName; const savedCode = newProgCode;
    setNewProgName(''); setNewProgCode('');
    const { error } = await supabase.from('programs').insert([{
      name: savedName, code: savedCode, catid: selectedProgCat, type: `${progType}_${progGender}`, madrasa_id: loggedInMadrasa.regNumber
    }]);
    if (error) {
      alert('Error: ' + error.message);
      setPrograms(prev => prev.filter(p => p.id !== tempId));
    } else {
      fetchSupabaseData(loggedInMadrasa.regNumber);
    }
  };

  const handleDeleteProgram = async (id) => {
    if (!window.confirm('Remove this program?')) return;
    setPrograms(prev => prev.filter(p => p.id !== id));
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (error) { alert(error.message); fetchSupabaseData(loggedInMadrasa.regNumber); }
  };

  const handleSaveProgEdit = async () => {
    setPrograms(prev => prev.map(p => p.id === editingProgId ? { ...p, ...editingProgData } : p).sort(compareProgCode));
    setEditingProgId(null);
    const { error } = await supabase.from('programs').update({
      name: editingProgData.name, code: editingProgData.code,
      catid: editingProgData.catid, type: editingProgData.type
    }).eq('id', editingProgId);
    if (error) { alert('Error: ' + error.message); fetchSupabaseData(loggedInMadrasa.regNumber); }
  };

  const handleSaveTimetableEntry = async (programId) => {
    if (!loggedInMadrasa) return;
    const madrasaId = loggedInMadrasa.regNumber;
    const { scheduled_time, venue } = timetableFormData;

    // Optimistic update
    const updatedEntry = {
      madrasa_id: madrasaId,
      program_id: String(programId),
      scheduled_time: scheduled_time ? new Date(scheduled_time).toISOString() : null,
      venue: venue.trim()
    };

    setTimetable(prev => {
      const exists = prev.some(t => String(t.program_id) === String(programId));
      if (exists) {
        return prev.map(t => String(t.program_id) === String(programId) ? { ...t, ...updatedEntry } : t);
      } else {
        return [...prev, updatedEntry];
      }
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

    setTimetable(prev => prev.filter(t => String(t.program_id) !== String(programId)));

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
    let studentObj = null;
    let groupObj = null;

    if (isGroup) {
      groupObj = groupRegistrations.find(g => String(g.id) === String(selectedResultStudent));
      if (!groupObj) { alert(t('alertUnexpectedError') + 'Group not found'); return; }
    } else {
      studentObj = students.find(s => String(s.id) === String(selectedResultStudent));
      if (!studentObj) { alert(t('alertUnexpectedError') + 'Student not found'); return; }
    }

    // Dynamic point calculation
    let pts = 0;
    if (selectedPlace === '1') pts = isGroup ? Number(pointSystem.gp1) : Number(pointSystem.p1);
    else if (selectedPlace === '2') pts = isGroup ? Number(pointSystem.gp2) : Number(pointSystem.p2);
    else if (selectedPlace === '3') pts = isGroup ? Number(pointSystem.gp3) : Number(pointSystem.p3);

    if (selectedGrade === 'A') pts += isGroup ? Number(pointSystem.gpA) : Number(pointSystem.gA);
    else if (selectedGrade === 'B') pts += isGroup ? Number(pointSystem.gpB) : Number(pointSystem.gB);
    else if (selectedGrade === 'C') pts += isGroup ? Number(pointSystem.gpC) : Number(pointSystem.gC);

    const resultRecord = {
      progid: progObj.id,
      progname: progObj.name,
      progtype: progObj.type,
      catname: (categories.find(c => String(c.id) === String(progObj.catid)) || {}).name || '',
      studentname: isGroup ? groupObj.group_name : `${studentObj.regno || studentObj.regNo || ''} - ${studentObj.name}`,
      studentgender: isGroup ? (progObj.type.includes('BOY') ? 'BOY' : progObj.type.includes('GIRL') ? 'GIRL' : 'COMMON') : studentObj.gender,
      teamid: isGroup ? groupObj.team_id : studentObj.teamid,
      teamname: isGroup 
        ? ((teams.find(t => String(t.id) === String(groupObj.team_id)) || {}).name || '')
        : ((teams.find(t => String(t.id) === String(studentObj.teamid)) || {}).name || ''),
      place: selectedPlace === '0' ? 'No Place' : selectedPlace === '1' ? 'First' : selectedPlace === '2' ? 'Second' : 'Third',
      grade: selectedGrade === 'No' ? '-' : selectedGrade,
      points: pts,
      madrasa_id: loggedInMadrasa.regNumber
    };

    const { error } = await supabase
      .from('results')
      .insert([resultRecord]);

    if (error) {
      alert(t('alertUnexpectedError') + error.message);
    } else {
      alert(t('alertResultDeclared'));
      fetchSupabaseData(loggedInMadrasa.regNumber);
    }
  };

  const handleDeleteResult = async (id) => {
    if (!window.confirm(lang === 'EN' ? 'Remove this result?' : 'ഈ ഫലം ഒഴിവാക്കണമെന്നുറപ്പാണോ?')) return;
    const { error } = await supabase.from('results').delete().eq('id', id);
    if (error) alert(t('alertUnexpectedError') + error.message);
    else if (loggedInMadrasa) fetchSupabaseData(loggedInMadrasa.regNumber);
  };

  const handleUpdateResult = async () => {
    if (!editingResultId || !loggedInMadrasa) return;
    // Find the existing record
    const existing = resultsList.find(r => String(r.id) === String(editingResultId));
    if (!existing) return;

    const progObj = programs.find(p => String(p.id) === String(existing.progid));
    const isGroup = progObj && (progObj.type || '').includes('GROUP');

    // Resolve new student/group info
    let newStudentName = existing.studentname;
    let newTeamId = existing.teamid;
    let newTeamName = existing.teamname;
    let newGender = existing.studentgender;

    if (editingResultStudent && editingResultStudent !== existing.studentname) {
      if (isGroup) {
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
    if (placeVal === '1') pts = isGroup ? Number(pointSystem.gp1) : Number(pointSystem.p1);
    else if (placeVal === '2') pts = isGroup ? Number(pointSystem.gp2) : Number(pointSystem.p2);
    else if (placeVal === '3') pts = isGroup ? Number(pointSystem.gp3) : Number(pointSystem.p3);
    if (gradeVal === 'A') pts += isGroup ? Number(pointSystem.gpA) : Number(pointSystem.gA);
    else if (gradeVal === 'B') pts += isGroup ? Number(pointSystem.gpB) : Number(pointSystem.gB);
    else if (gradeVal === 'C') pts += isGroup ? Number(pointSystem.gpC) : Number(pointSystem.gC);

    const placeLabel = placeVal === '0' ? 'No Place' : placeVal === '1' ? 'First' : placeVal === '2' ? 'Second' : 'Third';
    const gradeLabel = gradeVal === 'No' ? '-' : gradeVal;

    const { error } = await supabase
      .from('results')
      .update({
        studentname: newStudentName,
        teamid: newTeamId,
        teamname: newTeamName,
        studentgender: newGender,
        place: placeLabel,
        grade: gradeLabel,
        points: pts
      })
      .eq('id', editingResultId);

    if (error) {
      alert((lang === 'EN' ? 'Update failed: ' : 'അപ്ഡേറ്റ് പരാജയപ്പെട്ടു: ') + error.message);
    } else {
      alert(lang === 'EN' ? '✅ Result updated successfully!' : '✅ ഫലം വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു!');
      setEditingResultId(null);
      fetchSupabaseData(loggedInMadrasa.regNumber);
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

      let { error } = await supabase
        .from('group_registrations')
        .insert([insertData]);

      // If leader_id column doesn't exist yet, retry without leader_id column but putting leader as 1st element of student_ids
      if (error && error.message && error.message.includes('leader_id')) {
        delete insertData.leader_id;
        const reordered = chosenLeader 
          ? [String(chosenLeader), ...groupRegStudents.filter(id => String(id) !== String(chosenLeader))]
          : groupRegStudents;
        insertData.student_ids = reordered;
        const res = await supabase.from('group_registrations').insert([insertData]);
        error = res.error;
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
          throw new Error(error.message);
        }
      } else {
        alert(lang === 'EN' ? 'Group registration saved successfully!' : 'ഗ്രൂപ്പ് രജിസ്ട്രേഷൻ വിജയിച്ചു!');
        setGroupRegName('');
        setGroupRegLeader('');
        setGroupRegStudents([]);
        
        // Refresh group registrations
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
  const handleProfileLookup = () => {
    if (!profileRegNo.trim()) { alert(t('alertEnterRegNo')); return; }
    const found = students.find(s => String(s.regno || s.regNo || '') === String(profileRegNo.trim()));
    if (!found) { alert(t('alertStudentNotFound')); return; }
    setProfileStudent(found);
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

  // Handle photo file selection — open manual cropper
  const handleProfilePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset the input so the same file can be re-selected after cancel
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Store filename for later use
        setCropperFilename(file.name || 'photo.jpg');
        // Set image source — triggers the cropper modal
        setCropperSrc(ev.target.result);
        // Compute initial dims so we can centre the image in the viewport
        setCropperImageDims({ width: img.width, height: img.height });
        // Reset zoom & drag offset
        setCropperZoom(1);
        dragStateRef.current = { isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 };
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Confirm crop: draw whatever is visible in the 260x260 viewport onto a 300x300 canvas
  const handleCropConfirm = () => {
    const imgEl = cropperImageRef.current;
    if (!imgEl || !cropperSrc || !cropperImageDims) return;

    // The circular viewport on screen is 260 px wide/tall
    const VIEWPORT = 260;

    // Current rendered size of the image element (zoom applied via CSS transform)
    const naturalW = cropperImageDims.width;
    const naturalH = cropperImageDims.height;

    // Compute the rendered size (longest side fills viewport * zoom)
    const scale = (VIEWPORT / Math.min(naturalW, naturalH)) * cropperZoom;
    const renderedW = naturalW * scale;
    const renderedH = naturalH * scale;

    // Drag offsets are in CSS pixels relative to rendered image centre
    const { offsetX, offsetY } = dragStateRef.current;

    // Centre of viewport in rendered-image coordinates
    const centreX = renderedW / 2 - offsetX;
    const centreY = renderedH / 2 - offsetY;

    // Top-left of the crop square in natural-image coordinates
    const cropSize = VIEWPORT / scale;   // natural pixels covered by viewport
    const srcX = (centreX / scale) - cropSize / 2;
    const srcY = (centreY / scale) - cropSize / 2;

    // Draw onto 300×300 output canvas
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, srcX, srcY, cropSize, cropSize, 0, 0, 300, 300);
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], cropperFilename, { type: 'image/jpeg' });
          setProfilePhotoFile(croppedFile);
          setProfilePhotoPreview(canvas.toDataURL('image/jpeg', 0.9));
          setProfileCropMode(true);
        }
        // Close cropper
        setCropperSrc(null);
        setCropperImageDims(null);
      }, 'image/jpeg', 0.9);
    };
    img.src = cropperSrc;
  };

  // Cancel cropper without keeping anything
  const handleCropCancel = () => {
    setCropperSrc(null);
    setCropperImageDims(null);
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

  // Admin: Approve photo
  const handleApprovePhoto = async (studentId) => {
    const { error } = await supabase.from('students').update({ photo_status: 'approved' }).eq('id', studentId);
    if (error) alert(t('alertUnexpectedError') + error.message);
    else if (loggedInMadrasa) fetchSupabaseData(loggedInMadrasa.regNumber);
  };

  // Admin: Delete photo
  const handleDeletePhoto = async (student) => {
    if (!window.confirm(lang === 'EN' ? "Delete this student's photo?" : 'ഈ വിദ്യാർത്ഥിയുടെ ഫോട്ടോ ഇല്ലാതാക്കണമെന്നുറപ്പാണോ?')) return;
    // Photo stored as base64 in DB — just null it out
    const { error } = await supabase.from('students').update({ photo_url: null, photo_status: 'none' }).eq('id', student.id);
    if (error) alert(t('alertUnexpectedError') + error.message);
    else if (loggedInMadrasa) fetchSupabaseData(loggedInMadrasa.regNumber);
  };

  // Admin: Edit photo (re-upload as base64)
  const handleAdminPhotoReUpload = async (studentId, file) => {
    if (!file || !loggedInMadrasa) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        canvas.getContext('2d').drawImage(img, 0, 0, 300, 300);
        const base64DataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const { error } = await supabase.from('students').update({ photo_url: base64DataUrl, photo_status: 'pending' }).eq('id', studentId);
        if (error) alert(t('alertUnexpectedError') + error.message);
        else if (loggedInMadrasa) fetchSupabaseData(loggedInMadrasa.regNumber);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
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
  .card-top { flex-shrink: 0; display: flex; flex-direction: row; align-items: center; padding: 4px 5px; background: rgba(21,128,61,0.06); border-bottom: 2px solid #fbbf24; gap: 5px; position: relative; z-index: 1; }
  .photo-box { flex-shrink: 0; width: 50px; height: 58px; border-radius: 7px; border: 2px solid #16a34a; overflow: hidden; background: #f0fdf4; box-shadow: 0 3px 10px rgba(22,163,74,0.25); }
  .name-box { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .student-name { font-size: 10px; font-weight: 900; color: #14532d; text-transform: uppercase; line-height: 1.2; word-break: break-word; text-align: center; }
  .reg-badge { background: linear-gradient(135deg,#fbbf24,#f59e0b); border-radius: 5px; padding: 3px 5px; text-align: center; box-shadow: 0 3px 10px rgba(251,191,36,0.55); border: 1px solid #d97706; }
  .reg-label { font-size: 5px; font-weight: 800; color: #78350f; text-transform: uppercase; letter-spacing: 0.8px; }
  .reg-num { font-size: 18px; font-weight: 900; color: #1c1917; letter-spacing: 1px; line-height: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }
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

      {/* ✂️ MANUAL PHOTO CROPPER MODAL */}
      {cropperSrc && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ color: '#fff', fontSize: '16px', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>
            📸 Move & Zoom to Crop
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
            Drag to reposition • Scroll/pinch to zoom
          </div>

          {/* Circular viewport */}
          <div
            style={{
              width: '260px', height: '260px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid #22c55e',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
              position: 'relative',
              cursor: 'grab',
              touchAction: 'none',
              userSelect: 'none'
            }}
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
              dragStateRef.current.offsetX += dx;
              dragStateRef.current.offsetY += dy;
              if (cropperImageRef.current) {
                cropperImageRef.current.style.transform =
                  `translate(${dragStateRef.current.offsetX}px, ${dragStateRef.current.offsetY}px) scale(${cropperZoom})`;
              }
            }}
            onMouseUp={() => { dragStateRef.current.isDragging = false; }}
            onMouseLeave={() => { dragStateRef.current.isDragging = false; }}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              setCropperZoom(prev => {
                const next = Math.min(5, Math.max(0.5, prev + delta));
                if (cropperImageRef.current) {
                  cropperImageRef.current.style.transform =
                    `translate(${dragStateRef.current.offsetX}px, ${dragStateRef.current.offsetY}px) scale(${next})`;
                }
                return next;
              });
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                dragStateRef.current.isDragging = true;
                dragStateRef.current.startX = e.touches[0].clientX;
                dragStateRef.current.startY = e.touches[0].clientY;
              }
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              if (e.touches.length === 1 && dragStateRef.current.isDragging) {
                const dx = e.touches[0].clientX - dragStateRef.current.startX;
                const dy = e.touches[0].clientY - dragStateRef.current.startY;
                dragStateRef.current.startX = e.touches[0].clientX;
                dragStateRef.current.startY = e.touches[0].clientY;
                dragStateRef.current.offsetX += dx;
                dragStateRef.current.offsetY += dy;
                if (cropperImageRef.current) {
                  cropperImageRef.current.style.transform =
                    `translate(${dragStateRef.current.offsetX}px, ${dragStateRef.current.offsetY}px) scale(${cropperZoom})`;
                }
              }
            }}
            onTouchEnd={() => { dragStateRef.current.isDragging = false; }}
          >
            <img
              ref={cropperImageRef}
              src={cropperSrc}
              alt="crop"
              style={{
                width: '260px',
                height: '260px',
                objectFit: 'cover',
                transform: `translate(0px, 0px) scale(${cropperZoom})`,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                display: 'block'
              }}
              draggable={false}
            />
          </div>

          {/* Zoom slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', width: '260px' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>🔍−</span>
            <input
              type="range" min="0.5" max="3" step="0.05"
              value={cropperZoom}
              onChange={(e) => {
                const z = parseFloat(e.target.value);
                setCropperZoom(z);
                if (cropperImageRef.current) {
                  cropperImageRef.current.style.transform =
                    `translate(${dragStateRef.current.offsetX}px, ${dragStateRef.current.offsetY}px) scale(${z})`;
                }
              }}
              style={{ flex: 1, accentColor: '#22c55e' }}
            />
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>+</span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={handleCropCancel}
              style={{
                padding: '12px 28px', borderRadius: '10px', border: 'none',
                background: '#475569', color: '#fff', fontWeight: '700',
                fontSize: '14px', cursor: 'pointer'
              }}
            >✕ Cancel</button>
            <button
              onClick={handleCropConfirm}
              style={{
                padding: '12px 28px', borderRadius: '10px', border: 'none',
                background: '#16a34a', color: '#fff', fontWeight: '700',
                fontSize: '14px', cursor: 'pointer'
              }}
            >✓ Crop & Use</button>
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
            <h2>📜 Registered Madrasas</h2>
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
                  {superMadrasas.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ color: '#64748b', fontStyle: 'italic' }}>No madrasas registered.</td>
                    </tr>
                  ) : (
                    superMadrasas.map(m => {
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🕌 MAIN DASHBOARD WITH BOTTOM NAV */}
      {currentScreen === 'DASHBOARD' && (
        <div className="dashboard-container">

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
                // 🔓 Clear saved session on explicit logout
                localStorage.removeItem('miladfest_session');
                setCurrentScreen('LOGIN');
                setLoggedInMadrasa(null);
                setLoginRole('');
              }} className="btn-logout-top logout-btn-top">{t('logoutBtn')}</button>
            </div>
          </header>

          {/* ---------------- 🎯 TAB 1: SCOREBOARD ---------------- */}
          {activeTab === 'SCOREBOARD' && (
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
                    { key: 'STUDENT_REPORT',  icon: '🔍📜', label: 'Student Report & Certificate', grad: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', actBg: '#eff6ff', actBorder: '#93c5fd' },
                    { key: 'RESULTS_HISTORY', icon: '🗂', label: 'Results History', grad: 'linear-gradient(135deg, #10b981, #047857)', actBg: '#ecfdf5', actBorder: '#6ee7b7' },
                    { key: 'CHAMPIONS',       icon: '🏅', label: 'Champions', grad: 'linear-gradient(135deg, #7c3aed, #4c1d95)', actBg: '#f5f3ff', actBorder: '#c4b5fd' },
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
              <div style={{ marginBottom: '20px' }}>

                {/* Filter Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
                  {/* Category Filter */}
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '4px' }}>Category</label>
                    <select className="settings-input" value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setFilterProg(''); }}>
                      <option value="">-- Select --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {generalCatIds.length > 0 && <option value="GENERAL">🌟 GENERAL</option>}
                    </select>
                  </div>

                  {/* Program Filter */}
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '4px' }}>Program</label>
                    <select className="settings-input" value={filterProg} onChange={(e) => setFilterProg(e.target.value)} disabled={!filterCat}>
                      <option value="">-- Select --</option>
                      {programs.filter(p => {
                        const catMatch = String(p.catid || p.catId || '') === String(filterCat);
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
                          style={{ flex: 1, padding: '7px 4px', borderRadius: '8px', border: '2px solid', fontWeight: '700', cursor: 'pointer', fontSize: '11px',
                            background: filterGender === g ? (g === 'BOY' ? '#3b82f6' : g === 'GIRL' ? '#ec4899' : '#7c3aed') : '#f8fafc',
                            color: filterGender === g ? 'white' : '#475569',
                            borderColor: filterGender === g ? 'transparent' : '#e2e8f0' }}>
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
              )}

              {/* ── Section 2: Student Search by Register Number ── */}
              {resultsSubTab === 'STUDENT_REPORT' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginTop: '10px' }}>
                  <input type="text" className="settings-input" placeholder="Enter Register Number..." value={searchRegNo} onChange={(e) => setSearchRegNo(e.target.value)} style={{ maxWidth: '400px' }} />
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
              )}

              {/* ── Section 3: Results History Table ── */}
              {resultsSubTab === 'RESULTS_HISTORY' && (() => {
                const printResultsHistory = () => {
                  const rows = resultsList.map(r => {
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
                      {resultsList.length === 0 ? <tr><td colSpan="12">No results announced yet.</td></tr> :
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
              })()}

              {/* ── Section 4: Champion Section ── */}
              {resultsSubTab === 'CHAMPIONS' && (
              <div style={{ marginTop: '10px' }}>

                {/* Category Selector */}
                <div style={{ marginTop: '15px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '6px' }}>Select Category</label>
                  <select className="settings-input" value={champCat} onChange={(e) => { setChampCat(e.target.value); setChampGender('BOYS'); }}>
                    <option value="">-- Select Category --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {generalCatIds.length > 0 && <option value="GENERAL">🌟 GENERAL</option>}
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
                  const generalCatNames = generalCatIds.map(id => {
                    const cObj = categories.find(c => String(c.id) === String(id));
                    return cObj ? cObj.name : '';
                  }).filter(Boolean);

                  const catResults = resultsList.filter(r => {
                    const rCatName = r.catname || r.catName || '';
                    const matchCat = isChampGeneral 
                      ? (rCatName === 'GENERAL' || generalCatNames.includes(rCatName))
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
                                  <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9 }}>{cfg.label}</span>
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
                    </div>
                  );
                })()}
              </div>
              )}
              </div>
            </div>
            )
          )}

          {/* ---------------- 🎯 TAB 2.5: PROFILE ---------------- */}
          {activeTab === 'PROFILE' && (
            <div className="card animate-tab">
              <h2 style={{ marginBottom: '18px' }}>👤 Profile</h2>

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
                  {profileStep === 'FOUND' && profileStudent && (
                    <div className="profile-reg-input-card">
                      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '36px', marginBottom: '6px' }}>🎓</div>
                        <h3 style={{ color: '#1e293b', fontWeight: '700' }}>{profileStudent.name}</h3>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '8px', fontSize: '13px', color: '#475569' }}>
                          <span>📋 {profileStudent.regno || profileStudent.regNo}</span>
                          <span>🚩 {(teams.find(t => String(t.id) === String(profileStudent.teamid || profileStudent.teamId)) || {}).name || 'N/A'}</span>
                          <span>📂 {(categories.find(c => String(c.id) === String(profileStudent.catid || profileStudent.catId)) || {}).name || 'N/A'}</span>
                          <span>{profileStudent.gender === 'BOY' ? '👦 Boy' : '👧 Girl'}</span>
                        </div>
                      </div>

                      {/* Photo Upload Area */}
                      <div className="photo-upload-area">
                        {!profilePhotoPreview ? (
                          <>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
                            <p style={{ color: '#475569', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Upload Your Photo</p>
                            <label className="btn-add-action" style={{ display: 'inline-block', cursor: 'pointer', padding: '10px 24px', width: 'auto' }}>
                              Select Photo
                              <input type="file" accept="image/*" onChange={handleProfilePhotoSelect} style={{ display: 'none' }} />
                            </label>
                          </>
                        ) : (
                          <>
                            <div style={{ width: '140px', height: '140px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #064e3b', margin: '0 auto 12px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}>
                              <img src={profilePhotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            {profileCropMode && (
                              <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
                                ✂️ Manually Cropped — Ready to Upload
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                              <button onClick={handleProfilePhotoUpload} className="btn-add-action" style={{ width: 'auto', padding: '10px 24px' }} disabled={profileUploading}>
                                {profileUploading ? '⏳ Uploading...' : '✅ Upload'}
                              </button>
                              <label className="btn-add-action" style={{ width: 'auto', padding: '10px 24px', background: '#64748b', cursor: 'pointer' }}>
                                🔄 Change
                                <input type="file" accept="image/*" onChange={handleProfilePhotoSelect} style={{ display: 'none' }} />
                              </label>
                            </div>
                          </>
                        )}
                      </div>

                      <button onClick={handleProfileReset} className="btn-add-action" style={{ background: '#94a3b8', marginTop: '12px' }}>← Back</button>
                    </div>
                  )}

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
                          {generalCatIds.length > 0 && (
                            <div className={`filter-chip-box ${profileAdminCatFilter === 'GENERAL' ? 'active' : ''}`} onClick={() => setProfileAdminCatFilter('GENERAL')} style={{ background: profileAdminCatFilter === 'GENERAL' ? 'linear-gradient(135deg,#d97706,#b45309)' : '', fontWeight: 'bold' }}>🌟 GENERAL</div>
                          )}
                        </div>
                      </div>

                      {/* Approval list */}
                      <div className="settings-list-box" style={{ maxHeight: 'none' }}>
                        <h3>📋 Students Photo Approval</h3>
                        {(() => {
                          const filtered = students.filter(s => {
                            const matchCat = profileAdminCatFilter === 'ALL'
                              || (profileAdminCatFilter === 'GENERAL' ? generalCatIds.map(String).includes(String(s.catid || s.catId || '')) : String(s.catid || s.catId || '') === String(profileAdminCatFilter));
                            const hasPhoto = s.photo_url && s.photo_status && s.photo_status !== 'none';
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
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleAdminPhotoReUpload(s.id, e.target.files[0]); }} />
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
                          const matchCat = profileAdminCatFilter === 'ALL'
                            || (profileAdminCatFilter === 'GENERAL' ? generalCatIds.map(String).includes(String(s.catid || s.catId || '')) : String(s.catid || s.catId || '') === String(profileAdminCatFilter));
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
          {activeTab === 'TIMETABLE' && (
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
                        const gBg  = { BOY: '#1e40af', GIRL: '#be185d', COMMON: '#0f766e' };

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
        <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#a7f3d0;text-transform:uppercase;margin-bottom:6px;">&#128332; MILAD FEST &#8211; Official Schedule</div>
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
      Printed from <strong>MILAD FEST App</strong> &nbsp;|&nbsp; ${new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
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
                          a.download = `${madrasaName.replace(/\s+/g,'-')}-Timetable.html`;
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
                  return {
                    program: p,
                    scheduled_time: entry?.scheduled_time || null,
                    venue: entry?.venue || '',
                    category: categories.find(c => String(c.id) === String(p.catid))
                  };
                });

                // Filter by category
                const filteredTimetable = mappedTimetable.filter(item => {
                  if (timetableFilterCat === 'ALL') return true;
                  if (timetableFilterCat === 'GENERAL') {
                    const pCatId = String(item.program.catid || item.program.catId || '');
                    const catObj = categories.find(c => String(c.id) === pCatId);
                    return pCatId === 'GENERAL' || (catObj && (catObj.name || '').toLowerCase().includes('general'));
                  }
                  return String(item.program.catid) === String(timetableFilterCat);
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
                                  <span style={{ fontSize: '11px', fontWeight: 'bold', background: `${categoryColor}20`, color: categoryColor, padding: '3px 8px', borderRadius: '6px' }}>
                                    {item.category?.name || 'Common'}
                                  </span>
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
                                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div>
                                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>⏰ {t('setTime')}</label>
                                      <input 
                                        type="datetime-local" 
                                        value={timetableFormData.scheduled_time}
                                        onChange={(e) => setTimetableFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>📍 {t('setVenue')}</label>
                                      <input 
                                        type="text" 
                                        placeholder={t('venuePlaceholder')}
                                        value={timetableFormData.venue}
                                        onChange={(e) => setTimetableFormData(prev => ({ ...prev, venue: e.target.value }))}
                                        style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                      <button 
                                        onClick={() => handleSaveTimetableEntry(item.program.id)}
                                        className="btn-add-action"
                                        style={{ padding: '4px 8px', fontSize: '12px', flex: 1, background: '#10b981' }}
                                      >
                                        💾 Save
                                      </button>
                                      <button 
                                        onClick={() => setEditingTimetableId(null)}
                                        className="btn-add-action"
                                        style={{ padding: '4px 8px', fontSize: '12px', flex: 1, background: '#64748b' }}
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
                                    onClick={() => {
                                      setEditingTimetableId(item.program.id);
                                      let localDateTime = '';
                                      if (item.scheduled_time) {
                                        const d = new Date(item.scheduled_time);
                                        const tzoffset = d.getTimezoneOffset() * 60000;
                                        localDateTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
                                      }
                                      setTimetableFormData({
                                        scheduled_time: localDateTime,
                                        venue: item.venue
                                      });
                                    }}
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
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', background: `${categoryColor}20`, color: categoryColor, padding: '3px 8px', borderRadius: '6px' }}>
                                      {item.category?.name || 'Common'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 16px', color: '#1e293b' }}>
                                    {isEditing ? (
                                      <input 
                                        type="datetime-local" 
                                        value={timetableFormData.scheduled_time}
                                        onChange={(e) => setTimetableFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                      />
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
                                            onClick={() => setEditingTimetableId(null)}
                                            className="btn-add-action"
                                            style={{ padding: '3px 6px', fontSize: '11px', background: '#64748b' }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                          <button 
                                            onClick={() => {
                                              setEditingTimetableId(item.program.id);
                                              let localDateTime = '';
                                              if (item.scheduled_time) {
                                                const d = new Date(item.scheduled_time);
                                                const tzoffset = d.getTimezoneOffset() * 60000;
                                                localDateTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
                                              }
                                              setTimetableFormData({
                                                scheduled_time: localDateTime,
                                                venue: item.venue
                                              });
                                            }}
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
                            🏷️ {lang === 'EN' ? 'Program Name' : 'പ്രോഗ്രാം നാമം'}
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
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <input
                                type="text"
                                className="settings-input-v2"
                                placeholder={lang === 'EN' ? 'Program / Event Name (any language)' : 'പ്രോഗ്രാമിന്റെ പേര് (ഏത് ഭാഷയിലും)'}
                                value={eventNameInput}
                                onChange={e => setEventNameInput(e.target.value)}
                              />
                              <input
                                type="text"
                                className="settings-input-v2"
                                placeholder={lang === 'EN' ? 'Year (eg: 2025)' : 'വർഷം (eg: 2025)'}
                                value={eventYearInput}
                                onChange={e => setEventYearInput(e.target.value)}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => {
                                    if (!eventNameInput.trim()) return;
                                    const rNum = loggedInMadrasa?.regNumber;
                                    if (rNum) {
                                      localStorage.setItem(`event_name_${rNum}`, eventNameInput.trim());
                                      localStorage.setItem(`event_year_${rNum}`, eventYearInput.trim());
                                    }
                                    setEventName(eventNameInput.trim());
                                    setEventYear(eventYearInput.trim());
                                    setIsEditingEvent(false);
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
                          {categories.length === 0 ? <p style={{ color: '#666', fontStyle: 'italic' }}>No categories added.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {categories.map(c => (
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
                                onClick={() => {
                                  setGeneralCatIds(generalModalTemp);
                                  const rNum = loggedInMadrasa ? loggedInMadrasa.regNumber : '';
                                  if (rNum) localStorage.setItem(`general_cat_ids_${rNum}`, JSON.stringify(generalModalTemp));
                                  setShowGeneralModal(false);
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
                                  <thead><tr style={{ borderBottom: '1px solid #334155' }}>{['Student Name','Register Number','Team','Category','Gender'].map(h => <th key={h} style={{ padding: '4px 8px', textAlign: 'left', color: '#f8fafc', fontWeight: '600', fontSize: '11px' }}>{h}</th>)}</tr></thead>
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
                                      <thead><tr style={{ background: '#1e293b' }}>{['#','Name','Reg No','Team','Category','Gender'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#94a3b8', fontWeight: '600', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                                      <tbody>
                                        {bulkUploadData.slice(0, 10).map((r, i) => (
                                          <tr key={i} style={{ background: i % 2 === 0 ? '#0f172a' : '#1e293b' }}>
                                            <td style={{ padding: '6px 10px', color: '#64748b' }}>{r._row}</td>
                                            <td style={{ padding: '6px 10px', color: '#f8fafc', fontWeight: '500' }}>{r.name}</td>
                                            <td style={{ padding: '6px 10px', color: '#f8fafc' }}>{r.regno}</td>
                                            <td style={{ padding: '6px 10px', color: '#fbbf24' }}>{r.teamName}</td>
                                            <td style={{ padding: '6px 10px', color: '#a78bfa' }}>{r.catName}</td>
                                            <td style={{ padding: '6px 10px', color: (r.gender||'').toUpperCase().startsWith('G') ? '#f472b6' : '#60a5fa' }}>{r.gender || 'Boy'}</td>
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
                              const matchCat = studentFilterCat === 'ALL'
                                || (studentFilterCat === 'GENERAL' ? generalCatIds.map(String).includes(String(s.catid || s.catId || '')) : String(s.catid || s.catId || '') === String(studentFilterCat));
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
                            </select>

                            <button type="submit" className="btn-premium-action">Add Program</button>
                          </form>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                        <div className="settings-list-box" style={{ maxHeight: 'none' }}>
                          {(() => {
                            // Helper to check if a program is a General category program
                            const isGeneralProg = (p) => {
                              const pCatId = String(p.catid || p.catId || '');
                              if (pCatId === 'GENERAL') return true;
                              const catObj = categories.find(c => String(c.id) === pCatId);
                              if (catObj && (catObj.name || '').toLowerCase().includes('general')) return true;
                              return false;
                            };

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
                                const genProgs = programs.filter(p => {
                                  const pCatId = String(p.catid || p.catId || '');
                                  if (pCatId === 'GENERAL') return true;
                                  if ((categories.find(c => String(c.id) === pCatId)?.name || '').toLowerCase().includes('general')) {
                                    return true;
                                  }
                                  return false;
                                }).filter(pdfGenderMatch);

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

                                    const standaloneGenProgs = filteredPrograms.filter(p => {
                                      const pCatId = String(p.catid || p.catId || '');
                                      if (pCatId === 'GENERAL') return true;
                                      if (programFilterCat === 'GENERAL') return isGeneralProg(p);
                                      const catObj = categories.find(c => String(c.id) === pCatId);
                                      if (catObj && (catObj.name || '').toLowerCase().includes('general')) return true;
                                      return false;
                                    });

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
                        if (String(p.catid || p.catId || '') !== String(regTabCat)) return false;
                        const pt = p.type || '';
                        if (pt.includes('GROUP')) return false;
                        if (regTabGender === 'COMMON') return true;
                        if (pt.includes('COMMON')) return true;
                        if (regTabGender === 'BOY' && pt.includes('BOY')) return true;
                        if (regTabGender === 'GIRL' && pt.includes('GIRL')) return true;
                        return false;
                      }) : [];

                      const selectedStudentObj = students.find(s => String(s.id) === String(regTabStudent));

                      const handleSaveRegistrations = async () => {
                        if (!regTabStudent) { alert(t('alertPleaseSelectStudent')); return; }
                        setRegTabSaving(true);
                        try {
                          const madrasaId = loggedInMadrasa.regNumber;
                          const studentIdInt = parseInt(regTabStudent, 10);
                          
                          const { error: deleteError } = await supabase.from('program_registrations')
                            .delete()
                            .eq('madrasa_id', madrasaId)
                            .eq('student_id', studentIdInt);

                          if (deleteError) {
                            throw new Error(deleteError.message);
                          }

                          if (regTabCheckedProgs.length > 0) {
                            const inserts = regTabCheckedProgs.map(pId => ({
                              madrasa_id: madrasaId,
                              student_id: studentIdInt,
                              program_name: String(pId)
                            }));
                            const { error: insertError } = await supabase.from('program_registrations').insert(inserts);
                            if (insertError) {
                              throw new Error(insertError.message);
                            }
                          }

                          const { data: newRegs, error: fetchError } = await supabase
                            .from('program_registrations').select('*').eq('madrasa_id', madrasaId);
                          if (fetchError) {
                            throw new Error(fetchError.message);
                          }
                          if (newRegs) {
                            const mapped = newRegs.map(r => ({
                              ...r,
                              program_id: r.program_name
                            }));
                            setProgramRegistrations(mapped);
                          }
                          alert(t('alertSavedRegistrations')
                            .replace('{count}', regTabCheckedProgs.length)
                            .replace('{studentName}', selectedStudentObj?.name || '')
                          );
                        } catch (err) {
                          alert(t('alertUploadFailed') + err.message);
                        }
                        setRegTabSaving(false);
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
                          const sProgs = programRegistrations
                            .filter(r => String(r.student_id) === String(s.id))
                            .map(r => programs.find(pr => String(pr.id) === String(r.program_id)))
                            .filter(Boolean);

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
                                              { val: 'BOY',    label: t('boys') },
                                              { val: 'GIRL',   label: t('girls') },
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
                                              const existing = programRegistrations
                                                .filter(r => String(r.student_id) === String(sid))
                                                .map(r => String(r.program_id));
                                              setRegTabCheckedProgs(existing);
                                            }}>
                                              <option value="">{t('selectStudentFirst')}</option>
                                              {regStudentsFiltered.map(s => {
                                                const sRegNo = s.regno || s.regNo || '';
                                                const sCount = programRegistrations.filter(r => String(r.student_id) === String(s.id)).length;
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
                                                <button type="button" onClick={() => setRegTabCheckedProgs(regPrograms.map(p => String(p.id)))}
                                                  className="btn-premium-action-small secondary" style={{ flex: 1, background: '#dcfce7', color: '#166534' }}>
                                                  {t('selectAll')}
                                                </button>
                                                <button type="button" onClick={() => setRegTabCheckedProgs([])}
                                                  className="btn-premium-action-small secondary" style={{ flex: 1, background: '#fee2e2', color: '#991b1b' }}>
                                                  {t('clearAll')}
                                                </button>
                                              </div>
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto', paddingRight: '2px' }}>
                                                {regPrograms.map(p => {
                                                  const isChecked = regTabCheckedProgs.includes(String(p.id));
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
                                                          if (e.target.checked) {
                                                            setRegTabCheckedProgs(prev => [...prev, String(p.id)]);
                                                          } else {
                                                            setRegTabCheckedProgs(prev => prev.filter(id => id !== String(p.id)));
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
                                          const sProgs = programRegistrations
                                            .filter(r => String(r.student_id) === String(s.id))
                                            .map(r => programs.find(pr => String(pr.id) === String(r.program_id)))
                                            .filter(Boolean);
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
                                                setRegTabStudent(String(s.id));
                                                const existing = programRegistrations
                                                  .filter(r => String(r.student_id) === String(s.id))
                                                  .map(r => String(r.program_id));
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
                                              { val: 'BOY',    label: t('boys') },
                                              { val: 'GIRL',   label: t('girls') },
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
                                              if (String(p.catid || p.catId || '') !== String(groupRegCat)) return false;
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
                                            <select className="settings-input-v2" value={groupRegTeam} onChange={e => setGroupRegTeam(e.target.value)}>
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
                                          {(() => {
                                            const catObj = categories.find(c => String(c.id) === String(groupRegCat));
                                            const isGeneral = catObj && catObj.name.toLowerCase().includes('general');
                                            const groupStudentsFiltered = groupRegCat ? students.filter(s => {
                                              if (groupRegGender !== 'COMMON' && s.gender !== groupRegGender) return false;
                                              if (groupRegCat === 'GENERAL') {
                                                return generalCatIds.map(String).includes(String(s.catid || s.catId || ''));
                                              }
                                              if (isGeneral) return true;
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
                                                  {groupStudentsFiltered.map(s => {
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
                                      if (!prog || String(prog.catid || prog.catId || '') !== String(groupRegCat)) return false;
                                      
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

                                      const rows = activeGroupRegs.map((g, idx) => {
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
                                      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                                      th {
                                        background: #f1f5f9;
                                        color: #0f766e;
                                        font-size: 12px;
                                        font-weight: 700;
                                        text-transform: uppercase;
                                        letter-spacing: 1px;
                                        padding: 10px 12px;
                                        text-align: left;
                                        border-bottom: 2px solid #cbd5e1;
                                      }
                                      td {
                                        padding: 10px 12px;
                                        border-bottom: 1px solid #e2e8f0;
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
                                        <div class="madrasa-name">${madrasaName}</div>
                                        <div class="madrasa-sub">${madrasaPlace} | Reg. No: ${madrasaRegNo}</div>
                                      </div>
                                      <div class="notice-title-bar">👥 ${pdfTitle} — ${subtitle}</div>
                                      <div class="notice-body">
                                        ${contentHtml}
                                      </div>
                                      <div class="footer">Generated by Milad Fest App • Total Group Registrations: ${activeGroupRegs.length}</div>
                                    </div>
                                    </body></html>`);
                                      printWindow.document.close();
                                      printWindow.print();
                                    };

                                    return activeGroupRegs.length === 0 ? (
                                      <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                                        {lang === 'EN' ? 'No group registrations in this category yet.' : 'ഈ വിഭാഗത്തിൽ ഗ്രൂപ്പ് രജിസ്ട്രേഷനുകൾ ഒന്നും ചെയ്തിട്ടില്ല.'}
                                      </p>
                                    ) : (
                                      <>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                                          {activeGroupRegs.map(g => {
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
                                              if (sCatId !== sPCatId) return false;
                                              const sGender = String(s.gender || '').toUpperCase();
                                              if (editProgType.includes('BOY') && sGender !== 'BOY') return false;
                                              if (editProgType.includes('GIRL') && sGender !== 'GIRL') return false;
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
                    {settingsSubTab === 'MARK_ENTRY' && (
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
                                         if (String(p.catid || p.catId || '') !== String(selectedResultCat)) return false;
                                         if (markEntrySection === 'SINGLE' && (p.type || '').includes('GROUP')) return false;
                                         if (markEntrySection === 'GROUP' && !(p.type || '').includes('GROUP')) return false;
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
                                </div>
                              </div>

                              {/* Step 3: Student or Group Selector (filtered by category & gender, supporting 'General') */}
                              <div className={`step-box ${selectedResultStudent ? 'filled' : 'active'}`}>
                                <div className="step-header">
                                  <div className="step-number">03</div>
                                  <div className="step-title">
                                    {markEntrySection === 'GROUP' ? "Select Group" : "Select Student"}
                                  </div>
                                </div>
                                <div className="step-content">
                                  {(() => {
                                    const progObj = programs.find(p => String(p.id) === String(selectedResultProg));
                                    const isGroup = progObj && (progObj.type || '').includes('GROUP');

                                    if (isGroup) {
                                      // Render Group Selector
                                      const filteredGroups = groupRegistrations.filter(g => String(g.program_id) === String(selectedResultProg));
                                      return (
                                        <select className="settings-input-v2" value={selectedResultStudent} onChange={(e) => setSelectedResultStudent(e.target.value)} required disabled={!selectedResultProg}>
                                          <option value="">-- Select Group --</option>
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
                                      // Render Student Selector (original logic)
                                      const selectedCatObj = categories.find(c => String(c.id) === String(selectedResultCat));
                                      const isGeneral = selectedCatObj && selectedCatObj.name.toLowerCase().includes('general');

                                      // If a program is selected, filter by registered students only
                                      const regStudentIds = selectedResultProg
                                        ? new Set(programRegistrations
                                            .filter(r => String(r.program_id) === String(selectedResultProg))
                                            .map(r => String(r.student_id)))
                                        : null;

                                      return (
                                        <select className="settings-input-v2" value={selectedResultStudent} onChange={(e) => setSelectedResultStudent(e.target.value)} required disabled={!selectedResultCat}>
                                          <option value="">{selectedResultCat ? '-- Select Student --' : 'Select Category First'}</option>
                                          {students
                                            .filter(s => {
                                              if (selectedResultGender !== 'ALL' && selectedResultGender !== 'COMMON' && s.gender !== selectedResultGender) return false;
                                              if (regStudentIds && regStudentIds.size > 0) return regStudentIds.has(String(s.id));
                                              if (selectedResultCat === 'GENERAL') {
                                                return generalCatIds.map(String).includes(String(s.catid || s.catId || ''));
                                              }
                                              if (isGeneral) return true; // Show all students for General category!
                                              return String(s.catid || s.catId || '') === String(selectedResultCat);
                                            })
                                            .map(s => {
                                              const sRegNo = s.regno || s.regNo || '';
                                              const sTeamId = s.teamid || s.teamId || '';
                                              const teamName = (teams.find(t => String(t.id) === String(sTeamId)) || {}).name || '';
                                              const catName = (categories.find(c => String(c.id) === String(s.catid || s.catId)) || {}).name || '';
                                              return <option key={s.id} value={s.id}>{sRegNo} - {s.name} ({s.gender === 'BOY' ? '👦' : '👧'}) [{teamName}] {isGeneral ? `(${catName})` : ''}</option>;
                                            })
                                          }
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
                            const progSavedResults = resultsList.filter(r => String(r.progid) === String(selectedResultProg));
                            const progObj = programs.find(p => String(p.id) === String(selectedResultProg));
                            const isGroup = progObj && (progObj.type || '').includes('GROUP');
                            if (progSavedResults.length === 0) return null;

                            const replacementOptions = isGroup
                              ? groupRegistrations.filter(g => String(g.program_id) === String(selectedResultProg))
                              : (() => {
                                  const regStudentIds = new Set(
                                    programRegistrations
                                      .filter(r => String(r.program_id) === String(selectedResultProg))
                                      .map(r => String(r.student_id))
                                  );
                                  return students.filter(s => {
                                    if (selectedResultGender !== 'ALL' && s.gender !== selectedResultGender) return false;
                                    if (regStudentIds.size > 0) return regStudentIds.has(String(s.id));
                                    return String(s.catid || s.catId || '') === String(selectedResultCat);
                                  });
                                })();

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
                    )}

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

                            <button type="submit" className="btn-premium-action" style={{ marginTop: '10px' }}>Save Points Structure</button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* JUDGE SHEET SUB-TAB */}
                    {settingsSubTab === 'JUDGE_SHEET' && (() => {
                      // Filter programs based on selected category and gender
                      const judgePrograms = programs.filter(p => {
                        if (!judgeSheetCat) return false;
                        if (String(p.catid || p.catId || '') !== String(judgeSheetCat)) return false;
                        if (!judgeSheetGender) return true;
                        if ((p.type || '').includes('COMMON')) return true;
                        return (p.type || '').includes(judgeSheetGender);
                      });

                      const selectedProgObj = programs.find(p => String(p.id) === String(judgeSheetProg));
                      const selectedCatObj = categories.find(c => String(c.id) === String(judgeSheetCat));

                      // Students registered for this program: prefer program_registrations, fall back to category+gender
                      const isGeneral = selectedCatObj && selectedCatObj.name.toLowerCase().includes('general');
                      const isGroupProg = selectedProgObj && (selectedProgObj.type || '').includes('GROUP');

                      // Build items for Judge Sheet (Single student vs Group/Team)
                      const judgeItems = judgeSheetProg ? (() => {
                        if (isGroupProg) {
                          // 1. Get explicit group registrations for this program
                          const progGroupRegs = groupRegistrations.filter(g => String(g.program_id) === String(judgeSheetProg));
                          
                          if (progGroupRegs.length > 0) {
                            return progGroupRegs.map(g => {
                              const teamObj = teams.find(t => String(t.id) === String(g.team_id));
                              const teamName = g.group_name || (teamObj ? teamObj.name : 'Team');
                              const studentIds = Array.isArray(g.student_ids) 
                                ? g.student_ids 
                                : (typeof g.student_ids === 'string' ? JSON.parse(g.student_ids || '[]') : []);
                              
                              const leaderId = g.leader_id || (studentIds.length > 0 ? studentIds[0] : null);
                              const leaderStudent = students.find(s => String(s.id) === String(leaderId));
                              const memberStudents = students.filter(s => 
                                studentIds.map(String).includes(String(s.id)) && String(s.id) !== String(leaderId)
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
                            // Fallback: If no explicit group registrations, group registered students by team
                            const regStudentIds = new Set(
                              programRegistrations
                                .filter(r => String(r.program_id) === String(judgeSheetProg))
                                .map(r => String(r.student_id))
                            );
                            const baseStudents = regStudentIds.size > 0
                              ? students.filter(s => regStudentIds.has(String(s.id)))
                              : students.filter(s => {
                                  if (judgeSheetGender && s.gender !== judgeSheetGender) return false;
                                  if (judgeSheetCat === 'GENERAL') {
                                    return generalCatIds.map(String).includes(String(s.catid || s.catId || ''));
                                  }
                                  if (isGeneral) return true;
                                  return String(s.catid || s.catId || '') === String(judgeSheetCat);
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
                          // Single program: Individual students
                          const regStudentIds = new Set(
                            programRegistrations
                              .filter(r => String(r.program_id) === String(judgeSheetProg))
                              .map(r => String(r.student_id))
                          );
                          const baseStudents = regStudentIds.size > 0
                            ? students.filter(s => regStudentIds.has(String(s.id)))
                            : students.filter(s => {
                                if (judgeSheetGender && s.gender !== judgeSheetGender) return false;
                                if (judgeSheetCat === 'GENERAL') {
                                  return generalCatIds.map(String).includes(String(s.catid || s.catId || ''));
                                }
                                if (isGeneral) return true;
                                return String(s.catid || s.catId || '') === String(judgeSheetCat);
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

                        const rows = judgeItems.map((item) => {
                          if (item.isGroup) {
                            const leaderDisplay = item.leaderRegNo 
                              ? `<b>Reg No: ${item.leaderRegNo}</b> ${item.leaderName ? `(${item.leaderName})` : ''}`
                              : (item.leaderName || '-');

                            const membersDisplay = item.memberStudents && item.memberStudents.length > 0
                              ? item.memberStudents.map(m => `Reg No: ${m.regno || m.regNo || ''}${m.name ? ` (${m.name})` : ''}`).join(', ')
                              : (item.memberRegNos.length > 0 ? `Reg Nos: ${item.memberRegNos.join(', ')}` : '');

                            return `<tr style="min-height:55px; height:55px;">
                              <td style="text-align:left; padding:8px 12px; border:1.5px solid #cbd5e1; vertical-align:middle;">
                                <div style="font-weight:800; font-size:13px; color:#064e3b; margin-bottom:3px; display:flex; align-items:center; justify-space-between;">
                                  <span>🚩 ${item.teamName}</span>
                                  ${item.teamCode ? `<span style="font-size:11px; background:#dcfce7; color:#15803d; padding:1px 6px; border-radius:4px; margin-left:8px;">${item.teamCode}</span>` : ''}
                                </div>
                                <div style="font-size:11px; font-weight:700; color:#1e293b;">
                                  👑 Leader: ${leaderDisplay}
                                </div>
                                ${membersDisplay ? `
                                  <div style="font-size:10px; color:#64748b; margin-top:2px;">
                                    👥 Members: ${membersDisplay}
                                  </div>
                                ` : ''}
                              </td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                              <td style="text-align:center; border:1.5px solid #cbd5e1;"></td>
                            </tr>`;
                          } else {
                            return `<tr>
                              <td style="text-align:center;font-weight:800;font-size:13px;color:#064e3b;background:#ecfdf5">${item.regNo}</td>
                              <td style="text-align:center"></td>
                              <td style="text-align:center"></td>
                              <td style="text-align:center"></td>
                              <td style="text-align:center"></td>
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
  @page { size: A4 landscape; margin: 15mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; }
  .sheet-wrapper { border: 3px solid #064e3b; border-radius: 10px; overflow: hidden; }
  .sheet-header {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f766e 100%);
    color: white;
    text-align: center;
    padding: 18px 20px 14px;
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
    padding: 9px 8px;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid rgba(255,255,255,0.2);
    text-align: center;
  }
  td { padding: 10px 8px; border: 1.5px solid #cbd5e1; min-height: 36px; }
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
    <div class="festival-title">✦ Milad Fest ✦</div>
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
          <th style="${isGroupProg ? 'width:320px;text-align:left;padding-left:12px;' : 'width:110px;'}">${isGroupProg ? 'Team & Members (ടീം & അംഗങ്ങൾ)' : 'Reg. No'}</th>
          <th style="width:100px">Chance No</th>
          <th style="width:120px">Marks (1)</th>
          <th style="width:120px">Marks (2)</th>
          <th style="width:110px">Position</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:30px">No entries registered.</td></tr>'}
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
  <div class="hdr"><div class="hdr-title">✦ Milad Fest ✦</div><div class="hdr-name">${madrasaName}</div></div>
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
                              if (String(p.catid || p.catId || '') !== String(entryFormCat)) return false;
                              if (!entryFormGender || entryFormGender === 'COMMON') return true;
                              if ((p.type || '').includes('COMMON')) return true;
                              return (p.type || '').includes(entryFormGender);
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
                              const progHeaders = allProgs.map((p, idx) => {
                                const headerLabel = p.name ? `${p.name} (${p.code})` : (p.code || '');
                                return `<th style="background:#f1f5f9;border:1px solid #94a3b8;padding:4px 2px;font-size:9px;min-width:22px;max-width:32px;height:80px;vertical-align:middle;text-align:center;box-sizing:border-box;"><div style="writing-mode:vertical-rl;text-orientation:mixed;white-space:nowrap;display:inline-block;margin:0 auto;line-height:1.3;transform:rotate(180deg);">${headerLabel}</div></th>`;
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
                                    // Check group_registrations: student_ids contains this student
                                    isRegistered = groupRegistrations.some(g => {
                                      if (String(g.program_id) !== String(p.id)) return false;
                                      const memberIds = Array.isArray(g.student_ids) ? g.student_ids : [];
                                      return memberIds.some(id => String(id) === String(s.id));
                                    });
                                    if (isRegistered) groupCount++;
                                  } else {
                                    // Check program_registrations
                                    isRegistered = programRegistrations.some(r =>
                                      String(r.program_id || r.program_name) === String(p.id) &&
                                      String(r.student_id) === String(s.id)
                                    );
                                    if (isRegistered) singleCount++;
                                  }

                                  return `<td style="text-align:center;padding:4px 2px;font-size:14px;border:1px solid #cbd5e1;${isRegistered ? 'background:#ecfdf5;' : ''}">${isRegistered ? '✓' : ''}</td>`;
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
  thead tr.prog-header th { border: 1px solid #94a3b8; }
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
    <div class="festival-title">✦ Milad Fest ✦</div>
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
                                        <strong>{efStudents.length}</strong> students in <strong>{efSelectedTeamObj ? efSelectedTeamObj.name : ''}</strong><br/>
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
                                                let isReg = false;
                                                if (isGroup) {
                                                  isReg = groupRegistrations.some(g => {
                                                    if (String(g.program_id) !== String(p.id)) return false;
                                                    const mIds = Array.isArray(g.student_ids) ? g.student_ids : [];
                                                    return mIds.some(id => String(id) === String(s.id));
                                                  });
                                                  if (isReg) gc++;
                                                } else {
                                                  isReg = programRegistrations.some(r =>
                                                    String(r.program_id || r.program_name) === String(p.id) &&
                                                    String(r.student_id) === String(s.id)
                                                  );
                                                  if (isReg) sc++;
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
                      const handleToggleVisibility = (key) => {
                        const newControls = {
                          ...visibilityControls,
                          [key]: !visibilityControls[key]
                        };
                        setVisibilityControls(newControls);
                        localStorage.setItem(`visibility_controls_${loggedInMadrasa.regNumber}`, JSON.stringify(newControls));
                      };

                      return (
                        <div className="settings-card-v2">
                          <div className="settings-form-box-v2" style={{ maxWidth: '600px' }}>
                            <h3>👁️ {lang === 'EN' ? 'Visibility Control Panel' : 'കാഴ്ച നിയന്ത്രണ പാനൽ'}</h3>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                              {lang === 'EN' 
                                ? 'Toggle which sections are visible to parents/viewers (VIEW role). Admin always sees everything.' 
                                : 'രക്ഷിതാക്കൾക്ക് (VIEW റോൾ) ഏതൊക്കെ বিভাগങ്ങൾ കാണാമെന്ന് നിയന്ത്രിക്കുക. അഡ്മിന് എപ്പോഴും എല്ലാം കാണാം.'}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {/* Scoreboard Toggle */}
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0',
                                borderRadius: '12px'
                              }}>
                                <div>
                                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                                    {lang === 'EN' ? 'Live Scoreboard' : 'ലൈവ് സ്കോർബോർഡ്'}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                    {lang === 'EN' ? 'Show overall team rankings and leaderboard' : 'ടീമുകളുടെ റാങ്കിംഗും പോയിന്റുകളും കാണിക്കുക'}
                                  </div>
                                </div>
                                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={visibilityControls.scoreboard} 
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
                                {lang === 'EN' ? 'Results Sub-Sections' : 'ഫലം বিভাগങ്ങൾ'}
                              </div>

                              {[
                                { key: 'results_PROGRAM_WINNERS', label: lang === 'EN' ? 'Program Winners' : 'വിജയികളുടെ പട്ടിക', desc: lang === 'EN' ? 'Show winners for each individual program' : 'ഓരോ പ്രോഗ്രാമിന്റെയും വിജയികളെ കാണിക്കുക' },
                                { key: 'results_STUDENT_REPORT', label: lang === 'EN' ? 'Student Report & Certificate' : 'വിദ്യാർത്ഥി റിപ്പോർട്ടും സർട്ടിഫിക്കറ്റും', desc: lang === 'EN' ? 'Allow parents to search student details & download ID cards/posters' : 'വിദ്യാർത്ഥികളുടെ ഫലങ്ങൾ തിരയാനും കാർഡുകൾ ഡൗൺലോഡ് ചെയ്യാനും അനുവദിക്കുക' },
                                { key: 'results_RESULTS_HISTORY', label: lang === 'EN' ? 'Results History' : 'ഫലങ്ങളുടെ ഹിസ്റ്ററി', desc: lang === 'EN' ? 'Show chronological timeline of declared results' : 'പ്രഖ്യാപിച്ച ഫലങ്ങൾ സമയക്രമത്തിൽ കാണിക്കുക' },
                                { key: 'results_CHAMPIONS', label: lang === 'EN' ? 'Individual Champions' : 'വ്യക്തിഗത ചാമ്പ്യന്മാർ', desc: lang === 'EN' ? 'Show category-wise individual championship leaders' : 'ഓരോ വിഭാഗത്തിലെയും വ്യക്തിഗത ചാമ്പ്യന്മാരെ കാണിക്കുക' }
                              ].map(item => (
                                <div key={item.key} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0',
                                  borderRadius: '12px'
                                }}>
                                  <div>
                                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                                      {item.label}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                      {item.desc}
                                    </div>
                                  </div>
                                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={visibilityControls[item.key]} 
                                      onChange={() => handleToggleVisibility(item.key)}
                                      style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                      backgroundColor: visibilityControls[item.key] ? 'var(--primary-light)' : '#cbd5e1',
                                      transition: '.3s', borderRadius: '24px'
                                    }}>
                                      <span style={{
                                        position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                                        backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                                        transform: visibilityControls[item.key] ? 'translateX(24px)' : 'none'
                                      }}></span>
                                    </span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
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
                    {eventName}{eventYear ? ` ${eventYear}` : ''}
                  </div>
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
                  <div className="projector-leaderboard-grid">
                    {(() => {
                      const sortedTeams = [...teams].sort((a, b) => getTeamTotalPoints(b.id) - getTeamTotalPoints(a.id));
                      const maxPts = sortedTeams.length > 0 ? getTeamTotalPoints(sortedTeams[0].id) : 0;
                      const graphMax = maxPts > 0 ? maxPts : 10;
                      
                      let currentRank = 1;
                      const teamRanks = sortedTeams.map((t, idx) => {
                        if (idx > 0 && getTeamTotalPoints(t.id) < getTeamTotalPoints(sortedTeams[idx - 1].id)) {
                          currentRank = idx + 1;
                        }
                        return currentRank;
                      });

                      return sortedTeams.map((team, idx) => {
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
                                {trollMode && (() => {
                                  const reaction = getTrollReaction(rank, team.name, trollLang, trollOffsets[team.id] || 0);
                                  return (
                                    <span 
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTrollOffsets(prev => ({ ...prev, [team.id]: (prev[team.id] || 0) + 1 }));
                                      }}
                                    >
                                      <span className="animate-troll-emoji" style={{ fontSize: '26px' }}>{reaction.emoji}</span>
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
                      });
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 1: CATEGORY STANDINGS */}
            {projectorSlide === 1 && (
              <div className="projector-slide animate-projector-slide">
                <h2 className="projector-slide-title">📂 {lang === 'EN' ? 'CATEGORY STANDINGS' : 'വിഭാഗം തിരിച്ചുള്ള പോയിന്റ് നിലവാരം'}</h2>
                {categories.length === 0 ? (
                  <div className="projector-empty">{lang === 'EN' ? 'No categories added.' : 'വിഭാഗങ്ങൾ ഒന്നും ചേർത്തിട്ടില്ല.'}</div>
                ) : (
                  <div className="projector-categories-grid">
                    {categories.map(c => {
                      // Get team points breakdown for this category
                      const teamPointsList = teams.map(t => {
                        const catResults = resultsList.filter(r => (String(r.teamId) === String(t.id) || String(r.teamid) === String(t.id)) && r.catname === c.name);
                        const pts = catResults.reduce((sum, r) => sum + r.points, 0);
                        return { team: t, points: pts };
                      }).sort((a, b) => b.points - a.points);

                      return (
                        <div key={c.id} className="projector-category-card">
                          <h3 className="projector-category-name">📁 {c.name}</h3>
                          <div className="projector-category-teams-list">
                            {teamPointsList.map((tp, idx) => (
                              <div key={tp.team.id} className="projector-category-team-row">
                                <span className="team-rank-index">{idx + 1}.</span>
                                <span className="team-title">{tp.team.name}</span>
                                <span className="team-pts">{tp.points} <span className="score-lbl">{t('points')}</span></span>
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

            {/* SLIDE 2: RECENT WINNERS */}
            {projectorSlide === 2 && (
              <div className="projector-slide animate-projector-slide">
                <h2 className="projector-slide-title">🏆 {lang === 'EN' ? 'RECENT WINNERS & ANNOUNCEMENTS' : 'സമീപകാല പ്രഖ്യാപിത ഫലങ്ങൾ'}</h2>
                {resultsList.length === 0 ? (
                  <div className="projector-empty">{t('noResultsAdded')}</div>
                ) : (
                  <div className="projector-winners-grid">
                    {/* Get the 3 most unique program results declared recently */}
                    {(() => {
                      const recentProgs = Array.from(new Set(resultsList.map(r => r.progid || r.progId))).slice(0, 3);
                      
                      return recentProgs.map(progId => {
                        const prog = programs.find(p => String(p.id) === String(progId));
                        const progResults = resultsList.filter(r => String(r.progid || r.progId) === String(progId));
                        
                        if (!prog) return null;

                        const firstW = progResults.find(r => r.place === 'First');
                        const secondW = progResults.find(r => r.place === 'Second');
                        const thirdW = progResults.find(r => r.place === 'Third');

                        return (
                          <div key={progId} className="projector-winner-card">
                            <div className="projector-winner-card-header">
                              <span className="winner-prog-code">{prog.code}</span>
                              <span className="winner-prog-name">{prog.name}</span>
                              <span className="winner-prog-cat">({prog.catname || 'Common'})</span>
                            </div>
                            <div className="projector-winners-list">
                              {/* 1st Place */}
                              {firstW && (
                                <div className="projector-winner-row gold">
                                  <span className="medal">🥇</span>
                                  <div className="winner-info">
                                    <span className="winner-name">{firstW.studentname}</span>
                                    <span className="winner-team">{firstW.teamname || teams.find(t => String(t.id) === String(firstW.teamId || firstW.teamid))?.name || ''}</span>
                                  </div>
                                  <span className="winner-grade-badge">{firstW.grade === '-' || firstW.grade === 'No' ? '' : firstW.grade}</span>
                                </div>
                              )}
                              {/* 2nd Place */}
                              {secondW && (
                                <div className="projector-winner-row silver">
                                  <span className="medal">🥈</span>
                                  <div className="winner-info">
                                    <span className="winner-name">{secondW.studentname}</span>
                                    <span className="winner-team">{secondW.teamname || teams.find(t => String(t.id) === String(secondW.teamId || secondW.teamid))?.name || ''}</span>
                                  </div>
                                  <span className="winner-grade-badge">{secondW.grade === '-' || secondW.grade === 'No' ? '' : secondW.grade}</span>
                                </div>
                              )}
                              {/* 3rd Place */}
                              {thirdW && (
                                <div className="projector-winner-row bronze">
                                  <span className="medal">🥉</span>
                                  <div className="winner-info">
                                    <span className="winner-name">{thirdW.studentname}</span>
                                    <span className="winner-team">{thirdW.teamname || teams.find(t => String(t.id) === String(thirdW.teamId || thirdW.teamid))?.name || ''}</span>
                                  </div>
                                  <span className="winner-grade-badge">{thirdW.grade === '-' || thirdW.grade === 'No' ? '' : thirdW.grade}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
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
        
        const placeText = result.place === 'First' ? '1st Place' : result.place === 'Second' ? '2nd Place' : result.place === 'Third' ? '3rd Place' : result.place || 'Participation';
        const gradeText = (result.grade && result.grade !== '-' && result.grade !== 'No') ? result.grade : '';
        const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
        const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
        const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';
        
        const logoUrl = window.location.origin + '/logo192.png';
        const signatureUrl = window.location.origin + '/signature.png';
        const resultDate = result.created_at ? new Date(result.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

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
              backgroundColor: '#fffdf7',
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
            // Temporarily reset transform for rendering high-res image
            const originalTransform = certArea.style.transform;
            certArea.style.transform = 'none';
            await new Promise(r => setTimeout(r, 60));
            const canvas = await html2canvas(certArea, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#fffdf7',
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
          // Generate same HTML template and print via printHtml
          const html = `
<!DOCTYPE html>
<html>
<head>
<title>Certificate - ${student.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;500;600;700&family=Great+Vibes&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
  .certificate-wrapper {
    width: 1050px;
    height: 740px;
    position: relative;
    background: radial-gradient(circle, #ffffff 0%, #faf8f2 100%);
    overflow: hidden;
  }
  .cert-border-outer {
    position: absolute;
    top: 16px; left: 16px; right: 16px; bottom: 16px;
    border: 4px solid #1b5e20;
    border-radius: 4px;
  }
  .cert-border-inner {
    position: absolute;
    top: 26px; left: 26px; right: 26px; bottom: 26px;
    border: 1.5px solid #c5a44e;
    border-radius: 2px;
  }
  
  .corner-ornament-outer {
    position: absolute;
    width: 50px;
    height: 50px;
    z-index: 10;
  }
  .corner-ornament-outer.tl { top: 26px; left: 26px; border-top: 4px solid #1b5e20; border-left: 4px solid #1b5e20; }
  .corner-ornament-outer.tr { top: 26px; right: 26px; border-top: 4px solid #1b5e20; border-right: 4px solid #1b5e20; }
  .corner-ornament-outer.bl { bottom: 26px; left: 26px; border-bottom: 4px solid #1b5e20; border-left: 4px solid #1b5e20; }
  .corner-ornament-outer.br { bottom: 26px; right: 26px; border-bottom: 4px solid #1b5e20; border-right: 4px solid #1b5e20; }

  .corner-ornament-inner {
    position: absolute;
    width: 36px;
    height: 36px;
    z-index: 10;
  }
  .corner-ornament-inner.tl { top: 34px; left: 34px; border-top: 2px solid #c5a44e; border-left: 2px solid #c5a44e; }
  .corner-ornament-inner.tr { top: 34px; right: 34px; border-top: 2px solid #c5a44e; border-right: 2px solid #c5a44e; }
  .corner-ornament-inner.bl { bottom: 34px; left: 34px; border-bottom: 2px solid #c5a44e; border-left: 2px solid #c5a44e; }
  .corner-ornament-inner.br { bottom: 34px; right: 34px; border-bottom: 2px solid #c5a44e; border-right: 2px solid #c5a44e; }
  
  .cert-content {
    position: relative;
    z-index: 2;
    padding: 40px 75px 45px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }
  
  .cert-header { text-align: center; width: 100%; }
  .cert-event-name {
    font-family: 'Cinzel', 'Playfair Display', 'Times New Roman', serif;
    font-size: 22px; font-weight: 900; letter-spacing: 5px; text-transform: uppercase;
    color: #b8860b;
    text-shadow: 0 1px 3px rgba(184,134,11,0.25);
    margin-bottom: 0px;
  }
  .cert-event-sub {
    font-family: 'Inter', sans-serif; font-size: 10px; color: #888;
    letter-spacing: 2.5px; font-weight: 700; text-transform: uppercase;
    margin-bottom: 8px;
  }
  .cert-logo {
    width: 72px; height: 72px; border-radius: 50%; object-fit: cover;
    margin-bottom: 6px; border: 2.5px solid #c5a44e;
    box-shadow: 0 4px 12px rgba(27,94,32,0.15);
  }
  .cert-org-name {
    font-family: 'Cinzel', 'Playfair Display', 'Times New Roman', serif; font-size: 22px; font-weight: 800;
    color: #1b5e20; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 2px;
  }
  .cert-org-details { font-family: 'Inter', sans-serif; font-size: 11px; color: #555; letter-spacing: 1.5px; font-weight: 600; text-transform: uppercase; }
  
  .cert-diamond-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px auto;
    width: 400px;
  }
  .cert-diamond-line-left {
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, #c5a44e);
  }
  .cert-diamond-line-right {
    flex: 1;
    height: 1px;
    background: linear-gradient(to left, transparent, #c5a44e);
  }
  .cert-diamond-center {
    width: 8px;
    height: 8px;
    background-color: #1b5e20;
    transform: rotate(45deg);
    margin: 0 10px;
    border: 1.5px solid #c5a44e;
  }
  
  .cert-title-wrapper { text-align: center; }
  .cert-title {
    font-family: 'Cinzel', 'Playfair Display', 'Times New Roman', serif; font-size: 46px; font-weight: 900;
    color: #1b5e20; letter-spacing: 8px; text-transform: uppercase; margin-bottom: 2px;
    text-shadow: 0 2px 4px rgba(27,94,32,0.06);
  }
  .cert-subtitle { font-family: 'Great Vibes', cursive; font-size: 24px; color: #b8860b; margin-bottom: 2px; }
  
  .cert-body { text-align: center; width: 100%; }
  .cert-presented {
    font-family: 'Inter', sans-serif; font-size: 13px; color: #555; letter-spacing: 2px;
    text-transform: uppercase; font-weight: 500; margin-bottom: 12px;
  }
  .cert-student-name {
    font-family: 'Playfair Display', serif; font-size: 38px; font-weight: 800;
    color: #111111; border-bottom: 2px solid #c5a44e; display: inline-block;
    padding-bottom: 4px; margin-bottom: 14px; letter-spacing: 1px; text-transform: uppercase;
  }
  .cert-details-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
    margin: 15px 0;
    font-family: 'Inter', sans-serif;
  }
  .cert-detail-col {
    text-align: center;
  }
  .cert-detail-lbl {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    display: block;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .cert-detail-val {
    font-size: 15px;
    font-weight: 700;
    color: #1b5e20;
  }
  .cert-detail-divider {
    width: 1px;
    height: 24px;
    background-color: #c5a44e;
  }
  
  .cert-achievement { text-align: center; margin: 5px 0; }
  .cert-achievement-label {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: #555;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    font-weight: 500;
    margin-bottom: 6px;
  }
  .cert-program-name {
    font-family: 'Cinzel', 'Playfair Display', 'Times New Roman', serif; font-size: 24px; font-weight: 700;
    color: #1b5e20; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;
  }
  .cert-award-ribbon {
    display: inline-block;
    background: linear-gradient(135deg, #1b5e20 0%, #124016 100%);
    border: 2px solid #c5a44e;
    padding: 8px 24px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(27,94,32,0.15);
  }
  .cert-award-place {
    font-family: 'Cinzel', 'Playfair Display', 'Times New Roman', serif;
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .cert-award-grade {
    font-family: 'Cinzel', 'Playfair Display', 'Times New Roman', serif;
    font-size: 18px;
    font-weight: 700;
    color: #c5a44e;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-left: 12px;
    padding-left: 12px;
    border-left: 1px solid rgba(255,255,255,0.3);
  }
  
  .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; width: 100%; padding: 0 30px; }
  .cert-date-section { text-align: left; min-width: 150px; }
  .cert-date-value { font-size: 14px; font-weight: 600; color: #333; font-family: 'Inter', sans-serif; }
  .cert-date-label {
    font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888;
    border-top: 1px solid #ccc; padding-top: 4px; margin-top: 4px; font-weight: 600;
  }
  .cert-sign-section { text-align: center; min-width: 180px; }
  .cert-signature-img { width: 120px; height: 40px; object-fit: contain; margin-bottom: 2px; }
  .cert-sign-line { border-top: 1px solid #ccc; padding-top: 4px; }
  .cert-sign-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #111; font-weight: 700; }
  .cert-sign-role { font-size: 9px; color: #777; letter-spacing: 0.5px; margin-top: 2px; }
  
  .cert-watermark {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 350px; height: 350px; opacity: 0.035; z-index: 0; pointer-events: none;
  }
</style>
</head>
<body>
<div class="certificate-wrapper" id="certificateArea">
  <div class="cert-border-outer"></div>
  <div class="cert-border-inner"></div>
  
  <div class="corner-ornament-outer tl"></div>
  <div class="corner-ornament-outer tr"></div>
  <div class="corner-ornament-outer bl"></div>
  <div class="corner-ornament-outer br"></div>

  <div class="corner-ornament-inner tl"></div>
  <div class="corner-ornament-inner tr"></div>
  <div class="corner-ornament-inner bl"></div>
  <div class="corner-ornament-inner br"></div>
  
  <img src="${logoUrl}" class="cert-watermark" alt="" />
  
  <div class="cert-content">
    <div class="cert-header">
      ${eventName ? `<div class="cert-event-name">${eventName}</div><div class="cert-event-sub">Milad_fest${eventYear ? ' ' + eventYear : ''}</div>` : ''}
      <img src="${logoUrl}" class="cert-logo" alt="Logo" />
      <div class="cert-org-name">${madrasaName}</div>
      <div class="cert-org-details">Reg No: ${madrasaRegNo} | ${madrasaPlace}</div>
    </div>
    
    <div class="cert-diamond-divider">
      <div class="cert-diamond-line-left"></div>
      <div class="cert-diamond-center"></div>
      <div class="cert-diamond-line-right"></div>
    </div>
    
    <div class="cert-title-wrapper">
      <div class="cert-title">Certificate</div>
      <div class="cert-subtitle">of Achievement</div>
    </div>
    
    <div class="cert-body">
      <div class="cert-presented">This is proudly presented to</div>
      <div class="cert-student-name">${student.name}</div>
      
      <div class="cert-details-row">
        <div class="cert-detail-col">
          <div class="cert-detail-lbl">Register No</div>
          <div class="cert-detail-val">${sRegNo}</div>
        </div>
        <div class="cert-detail-divider"></div>
        <div class="cert-detail-col">
          <div class="cert-detail-lbl">Team</div>
          <div class="cert-detail-val">${teamObj ? teamObj.name : '-'}</div>
        </div>
        <div class="cert-detail-divider"></div>
        <div class="cert-detail-col">
          <div class="cert-detail-lbl">Category</div>
          <div class="cert-detail-val">${catObj ? catObj.name : '-'}</div>
        </div>
        <div class="cert-detail-divider"></div>
        <div class="cert-detail-col">
          <div class="cert-detail-lbl">Gender</div>
          <div class="cert-detail-val">${student.gender === 'BOY' ? 'Boy' : 'Girl'}</div>
        </div>
      </div>
    </div>
    
    <div class="cert-achievement">
      <div class="cert-achievement-label">For Outstanding Performance in</div>
      <div class="cert-program-name">${result.progname || result.progName}</div>
      <div class="cert-award-ribbon">
        <span class="cert-award-place">${placeText}</span>
        ${gradeText ? `<span class="cert-award-grade">Grade: ${gradeText}</span>` : ''}
      </div>
    </div>
    
    <div class="cert-footer">
      <div class="cert-date-section">
        <div class="cert-date-value">${resultDate}</div>
        <div class="cert-date-label">Date</div>
      </div>
      <div class="cert-sign-section">
        ${signatureUrl ? `<img src="${signatureUrl}" class="cert-signature-img" alt="Signature" />` : ''}
        <div class="cert-sign-line" style="margin-top: ${signatureUrl ? '0px' : '40px'}">
          <div class="cert-sign-label">Programme Convener</div>
          <div class="cert-sign-role">MILAD FEST Committee</div>
        </div>
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
              <button 
                onClick={() => setActiveCertificate(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 14px', borderRadius: '8px', fontWeight: '700' }}
              >
                ✕ Close
              </button>
            </div>

            {/* Certificate viewport wrapper (scales the certificate on small screens) */}
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
                  background: 'radial-gradient(circle, #ffffff 0%, #faf8f2 100%)',
                  overflow: 'hidden',
                  transform: 'scale(calc(min(90vw, 1050px) / 1050))',
                  transformOrigin: 'center center'
                }}
              >
                {/* Borders */}
                <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', bottom: '16px', border: '4px solid #1b5e20', borderRadius: '4px' }}></div>
                <div style={{ position: 'absolute', top: '26px', left: '26px', right: '26px', bottom: '26px', border: '1.5px solid #c5a44e', borderRadius: '2px' }}></div>
                
                {/* Corner ornaments (Outer Green) */}
                <div style={{ position: 'absolute', width: '50px', height: '50px', zIndex: 10, top: '26px', left: '26px', borderTop: '4px solid #1b5e20', borderLeft: '4px solid #1b5e20' }}></div>
                <div style={{ position: 'absolute', width: '50px', height: '50px', zIndex: 10, top: '26px', right: '26px', borderTop: '4px solid #1b5e20', borderRight: '4px solid #1b5e20' }}></div>
                <div style={{ position: 'absolute', width: '50px', height: '50px', zIndex: 10, bottom: '26px', left: '26px', borderBottom: '4px solid #1b5e20', borderLeft: '4px solid #1b5e20' }}></div>
                <div style={{ position: 'absolute', width: '50px', height: '50px', zIndex: 10, bottom: '26px', right: '26px', borderBottom: '4px solid #1b5e20', borderRight: '4px solid #1b5e20' }}></div>

                {/* Corner ornaments (Inner Gold) */}
                <div style={{ position: 'absolute', width: '36px', height: '36px', zIndex: 10, top: '34px', left: '34px', borderTop: '2px solid #c5a44e', borderLeft: '2px solid #c5a44e' }}></div>
                <div style={{ position: 'absolute', width: '36px', height: '36px', zIndex: 10, top: '34px', right: '34px', borderTop: '2px solid #c5a44e', borderRight: '2px solid #c5a44e' }}></div>
                <div style={{ position: 'absolute', width: '36px', height: '36px', zIndex: 10, bottom: '34px', left: '34px', borderBottom: '2px solid #c5a44e', borderLeft: '2px solid #c5a44e' }}></div>
                <div style={{ position: 'absolute', width: '36px', height: '36px', zIndex: 10, bottom: '34px', right: '34px', borderBottom: '2px solid #c5a44e', borderRight: '2px solid #c5a44e' }}></div>
                
                {/* Watermark logo */}
                <img src={logoUrl} alt="" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '350px', height: '350px', opacity: 0.035, zIndex: 0, pointerEvents: 'none' }} />
                
                {/* Certificate Content */}
                <div style={{ position: 'relative', zIndex: 2, padding: '40px 75px 45px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif" }}>
                  
                  {/* Header */}
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    {eventName && (
                      <>
                        <div style={{ fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif", fontSize: '22px', fontWeight: 900, letterSpacing: '5px', textTransform: 'uppercase', color: '#b8860b', textShadow: '0 1px 3px rgba(184,134,11,0.25)', marginBottom: '0px' }}>{eventName}</div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: '#888', letterSpacing: '2.5px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Milad_fest{eventYear ? ' ' + eventYear : ''}</div>
                      </>
                    )}
                    <img src={logoUrl} alt="Logo" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', marginBottom: '6px', border: '2.5px solid #c5a44e', boxShadow: '0 4px 12px rgba(27,94,32,0.15)' }} />
                    <div style={{ fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif", fontSize: '22px', fontWeight: 800, color: '#1b5e20', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '2px' }}>{madrasaName}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#555', letterSpacing: '1.5px', fontWeight: 600, textTransform: 'uppercase' }}>Reg No: {madrasaRegNo} | {madrasaPlace}</div>
                  </div>
                  
                  {/* Decorative Diamond Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px auto', width: '400px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #c5a44e)' }}></div>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#1b5e20', transform: 'rotate(45deg)', margin: '0 10px', border: '1.5px solid #c5a44e' }}></div>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #c5a44e)' }}></div>
                  </div>
                  
                  {/* Title */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif", fontSize: '46px', fontWeight: 900, color: '#1b5e20', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '2px', textShadow: '0 2px 4px rgba(27,94,32,0.06)' }}>Certificate</div>
                    <div style={{ fontFamily: "'Great Vibes', cursive", fontSize: '24px', color: '#b8860b', marginBottom: '2px' }}>of Achievement</div>
                  </div>
                  
                  {/* Recipient and details */}
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#555', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500, marginBottom: '12px' }}>This is proudly presented to</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '38px', fontWeight: 800, color: '#111111', borderBottom: '2px solid #c5a44e', display: 'inline-block', paddingBottom: '4px', marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>{student.name}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', margin: '15px 0', fontFamily: "'Inter', sans-serif" }}>
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', display: 'block', fontWeight: '600', marginBottom: '2px' }}>Register No</span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#1b5e20' }}>{sRegNo}</span>
                      </div>
                      <div style={{ width: '1px', height: '24px', backgroundColor: '#c5a44e' }}></div>
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', display: 'block', fontWeight: '600', marginBottom: '2px' }}>Team</span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#1b5e20' }}>{teamObj ? teamObj.name : '-'}</span>
                      </div>
                      <div style={{ width: '1px', height: '24px', backgroundColor: '#c5a44e' }}></div>
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', display: 'block', fontWeight: '600', marginBottom: '2px' }}>Category</span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#1b5e20' }}>{catObj ? catObj.name : '-'}</span>
                      </div>
                      <div style={{ width: '1px', height: '24px', backgroundColor: '#c5a44e' }}></div>
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', display: 'block', fontWeight: '600', marginBottom: '2px' }}>Gender</span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#1b5e20' }}>{student.gender === 'BOY' ? 'Boy' : 'Girl'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Achievement details */}
                  <div style={{ textAlign: 'center', margin: '5px 0' }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500, marginBottom: '6px' }}>For Outstanding Performance in</div>
                    <div style={{ fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif", fontSize: '24px', fontWeight: 700, color: '#1b5e20', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>{result.progname || result.progName}</div>
                    <div style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #1b5e20 0%, #124016 100%)',
                      border: '2px solid #c5a44e',
                      padding: '8px 24px',
                      borderRadius: '4px',
                      boxShadow: '0 4px 12px rgba(27,94,32,0.15)'
                    }}>
                      <span style={{
                        fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif",
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#ffffff',
                        letterSpacing: '2px',
                        textTransform: 'uppercase'
                      }}>
                        {placeText}
                      </span>
                      {gradeText && (
                        <span style={{
                          fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif",
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#c5a44e',
                          letterSpacing: '2px',
                          textTransform: 'uppercase',
                          marginLeft: '12px',
                          paddingLeft: '12px',
                          borderLeft: '1px solid rgba(255,255,255,0.3)'
                        }}>
                          Grade: {gradeText}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Signatures and Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', padding: '0 30px' }}>
                    <div style={{ textAlign: 'left', minWidth: '150px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', fontFamily: "'Inter', sans-serif" }}>{resultDate}</div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', borderTop: '1px solid #ccc', paddingTop: '4px', marginTop: '4px', fontWeight: '600' }}>Date</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: '180px' }}>
                      {signatureUrl && <img src={signatureUrl} alt="Signature" style={{ width: '120px', height: '40px', objectFit: 'contain', marginBottom: '2px' }} />}
                      <div style={{ borderTop: '1px solid #ccc', paddingTop: '4px', marginTop: signatureUrl ? '0px' : '40px' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#111', fontWeight: '700' }}>Programme Convener</div>
                        <div style={{ fontSize: '9px', color: '#777', letterSpacing: '0.5px', marginTop: '2px' }}>MILAD FEST Committee</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                onClick={handleModalDownloadPdf}
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '12px 24px', fontSize: '14px', fontWeight: '800',
                  cursor: 'pointer', boxShadow: '0 6px 20px rgba(5, 150, 105, 0.3)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                📄 Download PDF
              </button>
              <button 
                onClick={handleModalDownload}
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '12px 24px', fontSize: '14px', fontWeight: '800',
                  cursor: 'pointer', boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                🖼️ Save Image (PNG)
              </button>
              <button 
                onClick={handleModalPrint}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '12px 24px', fontSize: '14px', fontWeight: '800',
                  cursor: 'pointer', boxShadow: '0 6px 20px rgba(2, 132, 199, 0.3)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                🖨️ Print (A4 Landscape)
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  )
}

export default App;

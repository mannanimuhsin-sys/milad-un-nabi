import { supabase } from './supabaseClient';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import './App.css';
import translations from './translations';

// Inline component to generate and display QR code asynchronously
function StudentQrCode({ madrasaReg, studentId }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    let active = true;
    const generate = async () => {
      const appUrl = window.location.origin;
      const scanUrl = `${appUrl}/?qr=${madrasaReg}_${studentId}`;
      try {
        const url = await QRCode.toDataURL(scanUrl, {
          width: 150,
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
  }, [madrasaReg, studentId]);

  if (!qrUrl) return <div className="qr-placeholder" style={{ width: '70px', height: '70px', background: '#f1f5f9', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8' }}>Generating...</div>;
  return <img src={qrUrl} alt="QR Code" style={{ width: '70px', height: '70px', display: 'block', margin: '0 auto' }} />;
}

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

  // ── Persistent session: restore from localStorage on first render ──
  const savedSession = (() => {
    try { return JSON.parse(localStorage.getItem('miladfest_session') || 'null'); } catch { return null; }
  })();

  const [currentScreen, setCurrentScreen] = useState(savedSession ? 'DASHBOARD' : 'LOGIN');
  const [activeTab, setActiveTab] = useState('SCOREBOARD');
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

  // Judge Sheet states
  const [judgeSheetCat, setJudgeSheetCat] = useState('');
  const [judgeSheetGender, setJudgeSheetGender] = useState('');
  const [judgeSheetProg, setJudgeSheetProg] = useState('');

  // ── Register Tab States ──
  const [regTabCat, setRegTabCat] = useState('');
  const [regTabGender, setRegTabGender] = useState('BOY');
  const [regTabStudent, setRegTabStudent] = useState('');
  const [regTabCheckedProgs, setRegTabCheckedProgs] = useState([]);
  const [regTabSaving, setRegTabSaving] = useState(false);

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
        { data: regData }
      ] = await Promise.all([
        supabase.from('teams').select('*').eq('madrasa_id', rNum),
        supabase.from('categories').select('*').eq('madrasa_id', rNum),
        supabase.from('students').select('*').eq('madrasa_id', rNum),
        supabase.from('programs').select('*').eq('madrasa_id', rNum),
        supabase.from('results').select('*').eq('madrasa_id', rNum),
        supabase.from('program_registrations').select('*').eq('madrasa_id', rNum)
      ]);

      if (teamsData) setTeams(teamsData);
      if (catsData) setCategories(catsData);
      if (studentsData) setStudents(studentsData);
      if (programsData) setPrograms(programsData);
      if (resultsData) setResultsList(resultsData);
      if (regData) setProgramRegistrations(regData);
    } catch (err) {
      console.error("Data fetch error: ", err);
    }
  };

  useEffect(() => {
    if (loggedInMadrasa) {
      const rNum = loggedInMadrasa.regNumber;

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

      // Find programs this student is registered in (from results)
      const studentRegNo = studentData.regno || studentData.regNo || '';
      const studentResults = (resultsData || []).filter(r => {
        const rStudentName = r.studentname || '';
        return rStudentName.includes(studentRegNo + ' -') || rStudentName.includes(studentRegNo + ' -');
      });

      setQrModalData({
        madrasa: madrasaData ? { ...madrasaData, place: actualPlace } : null,
        student: studentData,
        team: teamObj,
        category: catObj,
        results: studentResults,
        programs: progsData || []
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
      alert("ബ്രൗസർ മെനു (⋮) ടാപ്പ് ചെയ്ത് 'Install app' അല്ലെങ്കിൽ 'Add to Home screen' തിരഞ്ഞെടുക്കുക.");
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
      alert('Please fill in all details!');
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
        alert('Error occurred: ' + error.message);
        return;
      }

      if (!madrasa) {
        alert('Madrasa not found!');
        return;
      }

      if (loginPassword === madrasa.adminPassword || loginPassword === madrasa.viewPassword) {
        const [actualPlace, status] = (madrasa.place || '').split('|');
        const currentStatus = status || 'approved'; // Default to approved if no suffix

        if (currentStatus === 'pending') {
          setPendingMadrasa(madrasa);
          setCurrentScreen('PENDING_APPROVAL');
          return;
        } else if (currentStatus === 'blocked') {
          alert('Your madrasa is blocked! Please contact the admin.');
          return;
        }

        // Approved, proceed to login
        const role = loginPassword === madrasa.adminPassword ? 'ADMIN' : 'VIEW';
        const sanitizedMadrasa = { ...madrasa, place: actualPlace };
        setLoggedInMadrasa(sanitizedMadrasa);
        setLoginRole(role);
        setCurrentScreen('DASHBOARD');
        setActiveTab('SCOREBOARD');

        // 💾 Save session to localStorage for auto-login
        localStorage.setItem('miladfest_session', JSON.stringify({ madrasa: sanitizedMadrasa, role }));

        // Clear login form
        setLoginRegNum('');
        setLoginPassword('');
      } else {
        alert('Incorrect password!');
      }
    } catch (err) {
      alert('Error occurred: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterMadrasa = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regNumber.trim() || !regPlace.trim() || !adminPassword.trim() || !viewPassword.trim()) {
      alert('Please fill in all details!');
      return;
    }

    try {
      // Check if the regNumber is unique in Supabase
      const { data: existing, error: checkError } = await supabase
        .from('madrasas')
        .select('regNumber')
        .eq('regNumber', regNumber);

      if (checkError) {
        alert('Error occurred: ' + checkError.message);
        return;
      }

      if (existing && existing.length > 0) {
        alert('This register number already exists! Please use a different number.');
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
        alert('Registration failed: ' + error.message);
      } else {
        alert('Madrasa registration submitted! Waiting for Super Admin approval.');
        const tempMadrasa = { name: regName, regNumber, place: `${regPlace}|pending` };
        setPendingMadrasa(tempMadrasa);
        setRegName(''); setRegNumber(''); setRegPlace(''); setAdminPassword(''); setViewPassword('');
        setCurrentScreen('PENDING_APPROVAL');
      }
    } catch (err) {
      alert('Error occurred: ' + err.message);
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
    setCategories(prev => [...prev, { id: tempId, name: newCatName, classrange: newCatClassRange, madrasa_id: loggedInMadrasa.regNumber }]);
    const savedName = newCatName;
    const savedRange = newCatClassRange;
    setNewCatName('');
    setNewCatClassRange('');
    const { error } = await supabase
      .from('categories')
      .insert([{ name: savedName, classrange: savedRange, madrasa_id: loggedInMadrasa.regNumber }]);
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
    setCategories(prev => prev.map(c => c.id === editingCatId ? { ...c, name: editingCatName, classrange: editingCatClassRange } : c));
    setEditingCatId(null);
    const { error } = await supabase.from('categories').update({ name: editingCatName, classrange: editingCatClassRange }).eq('id', editingCatId);
    if (error) { alert('Error: ' + error.message); fetchSupabaseData(loggedInMadrasa.regNumber); }
  };

  // 🧑‍🎓 3. STUDENT ACTIONS (DB uses lowercase: regno, teamid, catid)
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !studentRegNo.trim() || !selectedStudentTeam || !selectedStudentCat || !loggedInMadrasa) {
      alert('Please fill in all details!'); return;
    }
    const tempId = 'temp_' + Date.now();
    const tempStudent = { id: tempId, name: newStudentName, regno: studentRegNo, teamid: selectedStudentTeam, catid: selectedStudentCat, gender: studentGender, madrasa_id: loggedInMadrasa.regNumber };
    setStudents(prev => [...prev, tempStudent]);
    setNewStudentName(''); setStudentRegNo('');
    const { error } = await supabase.from('students').insert([{
      name: tempStudent.name, regno: tempStudent.regno, teamid: tempStudent.teamid,
      catid: tempStudent.catid, gender: tempStudent.gender, madrasa_id: tempStudent.madrasa_id
    }]);
    if (error) {
      alert('Error: ' + error.message);
      setStudents(prev => prev.filter(s => s.id !== tempId));
    } else {
      fetchSupabaseData(loggedInMadrasa.regNumber);
    }
  };

  const startEditStudent = (student) => {
    setEditingStudentId(student.id);
    setEditingStudentData({ ...student });
  };

  const handleSaveStudentEdit = async () => {
    setStudents(prev => prev.map(s => s.id === editingStudentId ? { ...s, ...editingStudentData } : s));
    setEditingStudentId(null);
    const { error } = await supabase.from('students').update({
      name: editingStudentData.name,
      regno: editingStudentData.regno,
      gender: editingStudentData.gender,
      teamid: editingStudentData.teamid,
      catid: editingStudentData.catid
    }).eq('id', editingStudentId);
    if (error) { alert('Error: ' + error.message); fetchSupabaseData(loggedInMadrasa.regNumber); }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Remove this student?')) return;
    setStudents(prev => prev.filter(s => s.id !== id));
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) { alert(error.message); fetchSupabaseData(loggedInMadrasa.regNumber); }
  };

  // 🏆 4. PROGRAM ACTIONS (DB uses lowercase: catid)
  const handleAddProgram = async (e) => {
    e.preventDefault();
    if (!newProgName.trim() || !newProgCode.trim() || !selectedProgCat || !loggedInMadrasa) return;
    const tempId = 'temp_' + Date.now();
    const tempProg = { id: tempId, name: newProgName, code: newProgCode, catid: selectedProgCat, type: `${progType}_${progGender}`, madrasa_id: loggedInMadrasa.regNumber };
    setPrograms(prev => [...prev, tempProg]);
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
    setPrograms(prev => prev.map(p => p.id === editingProgId ? { ...p, ...editingProgData } : p));
    setEditingProgId(null);
    const { error } = await supabase.from('programs').update({
      name: editingProgData.name, code: editingProgData.code,
      catid: editingProgData.catid, type: editingProgData.type
    }).eq('id', editingProgId);
    if (error) { alert('Error: ' + error.message); fetchSupabaseData(loggedInMadrasa.regNumber); }
  };

  // ⚙️ 5. CUSTOM MARK SYSTEM SAVE
  const handleSavePoints = (e) => {
    e.preventDefault();
    saveToStorage('points', pointSystem);
    alert('Points structure updated successfully!');
  };

  // 📝 6. MARK ENTRY ACTIONS (SUPABASE)
  const handleAddResult = async (e) => {
    e.preventDefault();
    if (!selectedResultProg || !selectedResultStudent || !loggedInMadrasa) {
      alert('Please select a program and student!'); return;
    }

    const studentObj = students.find(s => String(s.id) === String(selectedResultStudent));
    const progObj = programs.find(p => String(p.id) === String(selectedResultProg));
    if (!studentObj || !progObj) { alert('Data is invalid!'); return; }

    const isGroup = progObj.type === 'GROUP';

    // Dynamic point calculation
    let pts = 0;
    if (selectedPlace === '1') pts = isGroup ? Number(pointSystem.gp1) : Number(pointSystem.p1);
    else if (selectedPlace === '2') pts = isGroup ? Number(pointSystem.gp2) : Number(pointSystem.p2);
    else if (selectedPlace === '3') pts = isGroup ? Number(pointSystem.gp3) : Number(pointSystem.p3);

    if (selectedGrade === 'A') pts += isGroup ? Number(pointSystem.gpA) : Number(pointSystem.gA);
    else if (selectedGrade === 'B') pts += isGroup ? Number(pointSystem.gpB) : Number(pointSystem.gB);
    else if (selectedGrade === 'C') pts += isGroup ? Number(pointSystem.gpC) : Number(pointSystem.gC);

    const { error } = await supabase
      .from('results')
      .insert([
        {
          progid: progObj.id,
          progname: progObj.name,
          progtype: progObj.type,
          catname: (categories.find(c => String(c.id) === String(progObj.catid)) || {}).name || '',
          studentname: `${studentObj.regno || studentObj.regNo || ''} - ${studentObj.name}`,
          studentgender: studentObj.gender,
          teamid: studentObj.teamid,
          teamname: (teams.find(t => String(t.id) === String(studentObj.teamid)) || {}).name || '',
          place: selectedPlace === '0' ? 'No Place' : selectedPlace === '1' ? 'First' : selectedPlace === '2' ? 'Second' : 'Third',
          grade: selectedGrade === 'No' ? '-' : selectedGrade,
          points: pts,
          madrasa_id: loggedInMadrasa.regNumber
        }
      ]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Result declared successfully!');
      fetchSupabaseData(loggedInMadrasa.regNumber);
    }
  };

  const handleDeleteResult = async (id) => {
    if (!window.confirm('Remove this result?')) return;
    const { error } = await supabase.from('results').delete().eq('id', id);
    if (error) alert(error.message);
    else if (loggedInMadrasa) fetchSupabaseData(loggedInMadrasa.regNumber);
  };

  const getTeamTotalPoints = (teamId) => {
    return resultsList.filter(r => String(r.teamId) === String(teamId) || String(r.teamid) === String(teamId)).reduce((sum, r) => sum + r.points, 0);
  };

  // ══════════════════════════════════════════════════════════════════════
  // 👤 PROFILE TAB HANDLERS
  // ══════════════════════════════════════════════════════════════════════

  // Look up student by register number
  const handleProfileLookup = () => {
    if (!profileRegNo.trim()) { alert('Please enter a register number!'); return; }
    const found = students.find(s => String(s.regno || s.regNo || '') === String(profileRegNo.trim()));
    if (!found) { alert('Student not found! Please check the register number.'); return; }
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
    if (!profilePhotoFile) { alert('No photo selected!'); return; }
    if (!profileStudent) { alert('No student selected!'); return; }
    if (!loggedInMadrasa) { alert('Session expired. Please log in again.'); return; }
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

      if (updateError) { alert('Upload failed: ' + updateError.message); setProfileUploading(false); return; }

      setProfileStep('WAITING');
      setProfilePhotoFile(null);
      setProfilePhotoPreview(null);
      setProfileCropMode(false);
      if (loggedInMadrasa) fetchSupabaseData(loggedInMadrasa.regNumber);
    } catch (err) {
      alert('Unexpected error: ' + err.message);
    }
    setProfileUploading(false);
  };

  // Admin: Approve photo
  const handleApprovePhoto = async (studentId) => {
    const { error } = await supabase.from('students').update({ photo_status: 'approved' }).eq('id', studentId);
    if (error) alert('Error: ' + error.message);
    else if (loggedInMadrasa) fetchSupabaseData(loggedInMadrasa.regNumber);
  };

  // Admin: Delete photo
  const handleDeletePhoto = async (student) => {
    if (!window.confirm('Delete this student\'s photo?')) return;
    // Photo stored as base64 in DB — just null it out
    const { error } = await supabase.from('students').update({ photo_url: null, photo_status: 'none' }).eq('id', student.id);
    if (error) alert('Error: ' + error.message);
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
        if (error) alert('Error: ' + error.message);
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
      const link = document.createElement('a');
      link.download = `ID_Card_${studentName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { alert('Download failed: ' + err.message); }
  };

  // Download QR Scan Poster as image
  const handleDownloadPoster = async () => {
    const element = document.getElementById('qr-student-poster');
    if (!element || !qrModalData?.student) return;
    try {
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Poster_${qrModalData.student.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Poster download failed: ' + err.message);
    }
  };

  // Generate PDF of multiple ID cards (landscape CR80: 3.375" × 2.125")
  const handleDownloadPDF = useCallback(async (filteredStudentsList, paperSize = 'A4') => {
    if (filteredStudentsList.length === 0) { alert('No ID cards to export!'); return; }
    setProfilePdfGenerating(true);
    try {
      // Standard CR80 ID card size in mm
      const cardW = 85.725; // 3.375 inches × 25.4
      const cardH = 53.975; // 2.125 inches × 25.4
      const marginX = 10;   // page margin mm
      const marginY = 10;   // page margin mm
      const gap = 5;        // gap between cards mm (for cutting)

      // Page dimensions
      const pageW = paperSize === 'A3' ? 297 : 210;
      const pageH = paperSize === 'A3' ? 420 : 297;

      // Calculate grid
      const cols = Math.floor((pageW - 2 * marginX + gap) / (cardW + gap));
      const rows = Math.floor((pageH - 2 * marginY + gap) / (cardH + gap));
      const cardsPerPage = cols * rows;

      const pdf = new jsPDF('p', 'mm', paperSize.toLowerCase());
      let cardIndex = 0;

      for (let i = 0; i < filteredStudentsList.length; i++) {
        const s = filteredStudentsList[i];
        if (!s.photo_url || s.photo_status !== 'approved') continue;

        // Temp DOM element: 338px × 213px (≈ 3.375" × 2.125" at ~100px/in)
        // scale:3 → canvas ≈ 1014×639px → ~300 DPI for print
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.width = '338px';
        tempDiv.style.height = '213px';
        document.body.appendChild(tempDiv);

        const sTeamId = s.teamid || s.teamId || '';
        const sCatId = s.catid || s.catId || '';
        const teamObj = teams.find(t => String(t.id) === String(sTeamId));
        const catObj = categories.find(c => String(c.id) === String(sCatId));

        // Generate QR code
        const appUrl = window.location.origin;
        const qrUrl = `${appUrl}/?qr=${loggedInMadrasa.regNumber}_${s.id}`;
        let qrDataUrl = '';
        try {
          qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 150, margin: 1, color: { dark: '#064e3b', light: '#ffffff' } });
        } catch (e) {
          console.error(e);
        }

        // Landscape card HTML — NO border-radius on outer card
        tempDiv.innerHTML = `
          <div style="width:338px;height:213px;background:#fff;border-radius:0;overflow:hidden;font-family:Segoe UI,system-ui,sans-serif;border:2px solid #064e3b;box-sizing:border-box;display:flex;flex-direction:column;position:relative;">
            <div style="height:4px;background:linear-gradient(90deg,#022c22,#fbbf24,#059669);flex-shrink:0;"></div>
            <div style="flex:1;display:flex;flex-direction:row;overflow:hidden;">
              <div style="width:118px;background:linear-gradient(135deg,#022c22,#064e3b);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 6px;box-sizing:border-box;flex-shrink:0;border-right:3px solid #fbbf24;">
                <div style="font-size:8px;font-weight:800;color:#fbbf24;text-align:center;letter-spacing:0.4px;text-transform:uppercase;margin-bottom:5px;line-height:1.3;">${loggedInMadrasa ? loggedInMadrasa.name : ''}</div>
                <div style="font-size:6px;color:#cbd5e1;text-align:center;margin-bottom:8px;line-height:1.3;">${loggedInMadrasa ? loggedInMadrasa.regNumber : ''} | ${loggedInMadrasa ? loggedInMadrasa.place : ''}</div>
                <div style="width:70px;height:70px;border-radius:50%;border:3px solid #fbbf24;overflow:hidden;background:#f1f5f9;">
                  <img src="${s.photo_url}" crossorigin="anonymous" style="width:100%;height:100%;object-fit:cover;" />
                </div>
              </div>
              <div style="flex:1;display:flex;flex-direction:column;padding:9px 10px 5px 11px;box-sizing:border-box;min-width:0;">
                <div style="font-size:12px;font-weight:800;color:#0f172a;text-transform:uppercase;margin-bottom:4px;letter-spacing:0.2px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.name}</div>
                <div style="font-size:9px;font-weight:700;color:#fff;background:linear-gradient(135deg,#022c22,#059669);display:inline-block;padding:2px 9px;border-radius:9999px;margin-bottom:7px;letter-spacing:0.4px;align-self:flex-start;">Reg No: ${s.regno || s.regNo || ''}</div>
                <div style="display:flex;gap:4px;margin-bottom:0;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:3px;padding:3px 6px;flex:1;min-width:0;">
                    <div style="font-size:6px;font-weight:800;text-transform:uppercase;color:#64748b;margin-bottom:1px;letter-spacing:0.3px;">Group</div>
                    <div style="font-weight:700;color:#1e293b;font-size:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${teamObj ? teamObj.name : 'N/A'}</div>
                  </div>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:3px;padding:3px 6px;flex:1;min-width:0;">
                    <div style="font-size:6px;font-weight:800;text-transform:uppercase;color:#64748b;margin-bottom:1px;letter-spacing:0.3px;">Category</div>
                    <div style="font-weight:700;color:#1e293b;font-size:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${catObj ? catObj.name : 'N/A'}</div>
                  </div>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:3px;padding:3px 6px;flex:1;min-width:0;">
                    <div style="font-size:6px;font-weight:800;text-transform:uppercase;color:#64748b;margin-bottom:1px;letter-spacing:0.3px;">Division</div>
                    <div style="font-weight:700;color:#1e293b;font-size:8px;">${s.gender === 'BOY' ? 'Boy' : 'Girl'}</div>
                  </div>
                </div>
                <div style="margin-top:auto;display:flex;justify-content:flex-end;align-items:flex-end;">
                  ${qrDataUrl ? `<img src="${qrDataUrl}" style="width:48px;height:48px;display:block;" />` : ''}
                </div>
              </div>
            </div>
            <div style="height:15px;background:#f1f5f9;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span style="font-size:6px;color:#64748b;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">MILAD FEST • ID CARD</span>
            </div>
          </div>
        `;

        // scale:3 on 338×213px DOM → ~1014×639px canvas → ≈300 DPI for 3.375"×2.125" card
        const canvas = await html2canvas(tempDiv.firstElementChild, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL('image/png');

        // New page when needed
        if (cardIndex > 0 && cardIndex % cardsPerPage === 0) {
          pdf.addPage();
        }

        // Position on page
        const posInPage = cardIndex % cardsPerPage;
        const col = posInPage % cols;
        const row = Math.floor(posInPage / cols);
        const x = marginX + col * (cardW + gap);
        const y = marginY + row * (cardH + gap);

        pdf.addImage(imgData, 'PNG', x, y, cardW, cardH);
        cardIndex++;
      }

      if (cardIndex === 0) {
        alert('No approved photos found to export!');
        setProfilePdfGenerating(false);
        return;
      }

      pdf.save(`ID_Cards_${loggedInMadrasa ? loggedInMadrasa.name.replace(/\s+/g, '_') : 'export'}_${paperSize}.pdf`);
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    }
    setProfilePdfGenerating(false);
  }, [teams, categories, loggedInMadrasa]);

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
            <div>
              <h1>{loggedInMadrasa ? loggedInMadrasa.name : ''}</h1>
              <p>{t('regNo')} {loggedInMadrasa ? loggedInMadrasa.regNumber : ''} | {loggedInMadrasa ? loggedInMadrasa.place : ''} ({t(loginRole === 'ADMIN' ? 'adminMode' : 'viewMode')})</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={toggleLanguage} 
                className="btn-logout-top"
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}
              >
                🌐 {lang === 'EN' ? 'മലയാളം' : 'English'}
              </button>
              <button onClick={() => {
                // 🔓 Clear saved session on explicit logout
                localStorage.removeItem('miladfest_session');
                setCurrentScreen('LOGIN');
                setLoggedInMadrasa(null);
                setLoginRole('');
              }} className="btn-logout-top">{t('logoutBtn')}</button>
            </div>
          </header>

          {/* ---------------- 🎯 TAB 1: SCOREBOARD ---------------- */}
          {activeTab === 'SCOREBOARD' && (
            <div className="card animate-tab scoreboard-main-card">
              <div className="scoreboard-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', margin: '0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>{t('liveScoreboard')}</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{t('realTimePoints')}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

                      return sortedTeams.map((t, idx) => {
                        const totalPts = getTeamTotalPoints(t.id);
                        const barWidth = Math.max(8, (totalPts / graphMax) * 100);
                        const rank = teamRanks[idx];
                        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
                        const badgeIcon = rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
                        
                        return (
                          <div key={t.id} className={`leaderboard-item ${rankClass}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <div className="leaderboard-rank-badge">{badgeIcon}</div>
                                <div className="leaderboard-content" style={{ flex: 1 }}>
                                  <div className="team-meta">
                                    <span className="team-name">{t.name}</span>
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
                        );
                      });
                    })()}
                  </div>
                }
              </div>
            </div>
          )}

          {/* ---------------- 🎯 TAB 2: RECENT RESULTS + PROGRAM WINNERS + STUDENT SEARCH ---------------- */}
          {activeTab === 'RECENT' && (
            <div className="card animate-tab">
              <h2 style={{ marginBottom: '18px' }}>🏆 Results</h2>

              {/* Results Card Grid Navigation */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { key: 'PROGRAM_WINNERS', icon: '🏆', label: 'Program Winners', grad: 'linear-gradient(135deg, #f59e0b, #d97706)', actBg: '#fffbeb', actBorder: '#fcd34d' },
                  { key: 'STUDENT_REPORT',  icon: '🔍📜', label: 'Student Report & Certificate', grad: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', actBg: '#eff6ff', actBorder: '#93c5fd' },
                  { key: 'RESULTS_HISTORY', icon: '🗂', label: 'Results History', grad: 'linear-gradient(135deg, #10b981, #047857)', actBg: '#ecfdf5', actBorder: '#6ee7b7' },
                  { key: 'CHAMPIONS',       icon: '🏅', label: 'Champions', grad: 'linear-gradient(135deg, #7c3aed, #4c1d95)', actBg: '#f5f3ff', actBorder: '#c4b5fd' },
                ].map(tab => {
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
                    </select>
                  </div>

                  {/* Program Filter */}
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '4px' }}>Program</label>
                    <select className="settings-input" value={filterProg} onChange={(e) => setFilterProg(e.target.value)} disabled={!filterCat}>
                      <option value="">-- Select --</option>
                      {programs.filter(p => String(p.catid || p.catId || '') === String(filterCat)).map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                    </select>
                  </div>

                  {/* Gender Filter */}
                  <div style={{ flex: '1 1 150px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', display: 'block', marginBottom: '4px' }}>Gender</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['ALL', 'BOY', 'GIRL'].map(g => (
                        <button key={g} type="button" onClick={() => setFilterGender(g)}
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
                    <h1>🏆 ${matchedStudent.name}</h1>
                    <div class='badge'>Reg No: ${sRegNo}</div>
                    <p style='margin-top:10px;opacity:0.85'>Team: ${teamObj ? teamObj.name : '' || '-'} | Category: ${catObj ? catObj.name : '' || '-'} | ${matchedStudent.gender === 'BOY' ? 'Boy 👦' : 'Girl 👧'}</p>
                    </div>
                    <table><thead><tr><th>Program</th><th>Category</th><th>Place</th><th>Grade</th><th>Points</th></tr></thead><tbody>${rows}</tbody></table>
                    <p style='margin-top:20px;color:#64748b;font-size:13px'>Total Points: <b>${sResults.reduce((s, r) => s + r.points, 0)}</b></p>
                    </body></html>`);
                    printWindow.document.close();
                    printWindow.print();
                  };

                  const generateCertificate = (result) => {
                    const certWindow = window.open('', '_blank');
                    const placeText = result.place === 'First' ? '1st Place' : result.place === 'Second' ? '2nd Place' : result.place === 'Third' ? '3rd Place' : result.place || 'Participation';
                    const gradeText = (result.grade && result.grade !== '-' && result.grade !== 'No') ? result.grade : '';
                    const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                    const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                    const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';
                    const logoUrl = window.location.origin + '/logo192.png';
                    const signatureUrl = window.location.origin + '/signature.png';
                    const resultDate = result.created_at ? new Date(result.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                    
                    certWindow.document.write(`
<!DOCTYPE html>
<html><head><title>Certificate - ${matchedStudent.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Great+Vibes&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Inter', sans-serif; 
    display: flex; 
    flex-direction: column;
    justify-content: center; 
    align-items: center; 
    min-height: 100vh; 
    background: #f0f0f0; 
    padding: 20px;
    gap: 16px;
  }
  .certificate-wrapper {
    width: 1050px;
    height: 740px;
    position: relative;
    background: #fffdf7;
    overflow: hidden;
    box-shadow: 0 25px 80px rgba(0,0,0,0.15);
  }
  .cert-border-outer {
    position: absolute;
    top: 12px; left: 12px; right: 12px; bottom: 12px;
    border: 3px solid #1a5e3a;
    border-radius: 4px;
  }
  .cert-border-inner {
    position: absolute;
    top: 20px; left: 20px; right: 20px; bottom: 20px;
    border: 1.5px solid #c5a44e;
    border-radius: 2px;
  }
  .corner-ornament {
    position: absolute;
    width: 70px;
    height: 70px;
    opacity: 0.15;
  }
  .corner-ornament.tl { top: 24px; left: 24px; border-top: 4px solid #1a5e3a; border-left: 4px solid #1a5e3a; }
  .corner-ornament.tr { top: 24px; right: 24px; border-top: 4px solid #1a5e3a; border-right: 4px solid #1a5e3a; }
  .corner-ornament.bl { bottom: 24px; left: 24px; border-bottom: 4px solid #1a5e3a; border-left: 4px solid #1a5e3a; }
  .corner-ornament.br { bottom: 24px; right: 24px; border-bottom: 4px solid #1a5e3a; border-right: 4px solid #1a5e3a; }
  
  .cert-content {
    position: relative;
    z-index: 2;
    padding: 45px 60px 35px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }
  
  .cert-header { text-align: center; width: 100%; }
  .cert-logo {
    width: 80px; height: 80px; border-radius: 16px; object-fit: cover;
    margin-bottom: 8px; border: 2px solid #1a5e3a;
    box-shadow: 0 4px 15px rgba(26,94,58,0.2);
  }
  .cert-org-name {
    font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 800;
    color: #1a5e3a; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 2px;
  }
  .cert-org-details { font-size: 11px; color: #666; letter-spacing: 1px; font-weight: 500; }
  
  .cert-divider {
    width: 350px; height: 2px;
    background: linear-gradient(90deg, transparent, #c5a44e, #1a5e3a, #c5a44e, transparent);
    margin: 10px auto;
  }
  
  .cert-title-wrapper { text-align: center; }
  .cert-title {
    font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 900;
    color: #1a5e3a; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 4px;
    text-shadow: 0 2px 4px rgba(26,94,58,0.1);
  }
  .cert-subtitle { font-family: 'Great Vibes', cursive; font-size: 20px; color: #c5a44e; margin-bottom: 2px; }
  
  .cert-body { text-align: center; width: 100%; }
  .cert-presented {
    font-size: 14px; color: #555; letter-spacing: 2px;
    text-transform: uppercase; font-weight: 500; margin-bottom: 10px;
  }
  .cert-student-name {
    font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 800;
    color: #1a3a5c; border-bottom: 3px solid #c5a44e; display: inline-block;
    padding-bottom: 6px; margin-bottom: 12px; letter-spacing: 1px;
  }
  .cert-details-grid { display: flex; justify-content: center; gap: 25px; margin-bottom: 14px; flex-wrap: wrap; }
  .cert-detail-item {
    background: linear-gradient(135deg, #f8f6f0, #f0ede4); border: 1px solid #e0dcc8;
    border-radius: 10px; padding: 8px 20px; text-align: center; min-width: 120px;
  }
  .cert-detail-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; font-weight: 600; margin-bottom: 2px; }
  .cert-detail-value { font-size: 14px; font-weight: 700; color: #1a3a5c; }
  
  .cert-achievement { text-align: center; margin: 5px 0; }
  .cert-program-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #1a5e3a; margin-bottom: 8px; }
  .cert-place-badge {
    display: inline-block; background: linear-gradient(135deg, #c5a44e, #a08530); color: white;
    padding: 8px 32px; border-radius: 30px; font-size: 16px; font-weight: 800;
    letter-spacing: 3px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(197,164,78,0.4);
  }
  .cert-grade-text { margin-top: 6px; font-size: 13px; color: #888; font-weight: 500; }
  
  .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; width: 100%; padding: 0 30px; }
  .cert-date-section { text-align: center; }
  .cert-date-value { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 4px; }
  .cert-date-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; border-top: 1.5px solid #ccc; padding-top: 5px; min-width: 140px; }
  .cert-sign-section { text-align: center; }
  .cert-signature-img { width: 150px; height: auto; margin-bottom: 2px; }
  .cert-sign-line { border-top: 1.5px solid #ccc; padding-top: 5px; min-width: 180px; }
  .cert-sign-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; font-weight: 600; }
  .cert-sign-role { font-size: 9px; color: #aaa; letter-spacing: 1px; }
  
  .cert-watermark {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 300px; height: 300px; opacity: 0.03; z-index: 0; pointer-events: none;
  }
  
  /* Action buttons */
  .cert-actions {
    display: flex; gap: 12px; justify-content: center; margin-top: 4px;
  }
  .btn-download {
    background: linear-gradient(135deg, #1a5e3a, #2d8659); color: white; border: none;
    padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700;
    cursor: pointer; box-shadow: 0 6px 24px rgba(26,94,58,0.4);
    display: flex; align-items: center; gap: 8px; transition: all 0.2s ease;
  }
  .btn-download:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(26,94,58,0.5); }
  .btn-back {
    background: linear-gradient(135deg, #64748b, #475569); color: white; border: none;
    padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700;
    cursor: pointer; box-shadow: 0 6px 24px rgba(100,116,139,0.4);
    display: flex; align-items: center; gap: 8px; transition: all 0.2s ease;
  }
  .btn-back:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(100,116,139,0.5); }
  
  @media print {
    body { background: white; padding: 0; margin: 0; }
    .certificate-wrapper { box-shadow: none; width: 100%; height: 100vh; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="certificate-wrapper" id="certificateArea">
  <div class="cert-border-outer"></div>
  <div class="cert-border-inner"></div>
  <div class="corner-ornament tl"></div>
  <div class="corner-ornament tr"></div>
  <div class="corner-ornament bl"></div>
  <div class="corner-ornament br"></div>
  
  <img src="${logoUrl}" class="cert-watermark" alt="" />
  
  <div class="cert-content">
    <div class="cert-header">
      <img src="${logoUrl}" class="cert-logo" alt="Logo" />
      <div class="cert-org-name">${madrasaName}</div>
      <div class="cert-org-details">Reg No: ${madrasaRegNo} | ${madrasaPlace}</div>
    </div>
    
    <div class="cert-divider"></div>
    
    <div class="cert-title-wrapper">
      <div class="cert-title">Certificate</div>
      <div class="cert-subtitle">of Achievement</div>
    </div>
    
    <div class="cert-body">
      <div class="cert-presented">This is proudly presented to</div>
      <div class="cert-student-name">${matchedStudent.name}</div>
      
      <div class="cert-details-grid">
        <div class="cert-detail-item">
          <div class="cert-detail-label">Register No</div>
          <div class="cert-detail-value">${sRegNo}</div>
        </div>
        <div class="cert-detail-item">
          <div class="cert-detail-label">Team</div>
          <div class="cert-detail-value">${teamObj ? teamObj.name : '-'}</div>
        </div>
        <div class="cert-detail-item">
          <div class="cert-detail-label">Category</div>
          <div class="cert-detail-value">${catObj ? catObj.name : '-'}</div>
        </div>
        <div class="cert-detail-item">
          <div class="cert-detail-label">Gender</div>
          <div class="cert-detail-value">${matchedStudent.gender === 'BOY' ? 'Boy' : 'Girl'}</div>
        </div>
      </div>
    </div>
    
    <div class="cert-achievement">
      <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">For Outstanding Performance in</div>
      <div class="cert-program-name">${result.progname || result.progName}</div>
      <div class="cert-place-badge">${placeText}</div>
      ${gradeText ? '<div class="cert-grade-text">Grade: <b>' + gradeText + '</b></div>' : ''}
    </div>
    
    <div class="cert-footer">
      <div class="cert-date-section">
        <div class="cert-date-value">${resultDate}</div>
        <div class="cert-date-label">Date</div>
      </div>
      <div class="cert-sign-section">
        <img src="${signatureUrl}" class="cert-signature-img" alt="Signature" />
        <div class="cert-sign-line">
          <div class="cert-sign-label">Programme Convener</div>
          <div class="cert-sign-role">MILAD FEST Committee</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="cert-actions no-print">
  <button class="btn-download" onclick="downloadAsImage()">📥 Download Image</button>
  <button class="btn-back" onclick="window.close()">⬅️ Back</button>
</div>

<script>
function downloadAsImage() {
  var btn = document.querySelector('.btn-download');
  btn.textContent = '⏳ Generating...';
  btn.disabled = true;
  html2canvas(document.getElementById('certificateArea'), {
    scale: 2,
    useCORS: true,
    backgroundColor: '#fffdf7',
    width: 1050,
    height: 740
  }).then(function(canvas) {
    var link = document.createElement('a');
    link.download = 'Certificate_${matchedStudent.name.replace(/[^a-zA-Z0-9]/g, '_')}_${(result.progname || result.progName || '').replace(/[^a-zA-Z0-9]/g, '_')}.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    btn.innerHTML = '📥 Download Image';
    btn.disabled = false;
  }).catch(function(err) {
    alert('Error generating image: ' + err.message);
    btn.innerHTML = '📥 Download Image';
    btn.disabled = false;
  });
}
</script>
</body></html>`);
                    certWindow.document.close();
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
                  const printWindow = window.open('', '_blank');
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

                  printWindow.document.write(`
                    <html><head><title>Results History</title>
                    <style>body{font-family:Arial,sans-serif;padding:20px;background:#fff} h1{color:#1e1b4b;text-align:center;} table{width:100%;border-collapse:collapse;margin-top:20px} th{background:#1e1b4b;color:white;padding:10px} td{padding:8px;border:1px solid #e2e8f0;text-align:center;font-size:14px;}</style></head>
                    <body>
                    <h1>🏆 Results History</h1>
                    <table><thead><tr><th>Program</th><th>Type</th><th>Category</th><th>Photo</th><th>Reg No</th><th>Student</th><th>Gender</th><th>Team</th><th>Place</th><th>Grade</th><th>Points</th></tr></thead><tbody>${rows}</tbody></table>
                    </body></html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
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
                  </select>
                </div>

                {/* Gender Tabs */}
                {champCat && (
                  <div style={{ marginTop: '15px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', display: 'block', marginBottom: '6px' }}>Division</label>
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

                  // Filter results for this category
                  const catResults = resultsList.filter(r =>
                    (r.catname || r.catName || '') === catName
                  );

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
                        type="tel"
                        inputMode="numeric"
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
                      <div className="id-card" ref={idCardRef}>
                        <div className="id-card-header">
                          <div className="id-card-madrasa-name">{loggedInMadrasa ? loggedInMadrasa.name : ''}</div>
                          <div className="id-card-madrasa-info">Reg No: {loggedInMadrasa ? loggedInMadrasa.regNumber : ''} | {loggedInMadrasa ? loggedInMadrasa.place : ''}</div>
                        </div>
                        <div className="id-card-body">
                          <div className="id-card-photo">
                            {profileStudent.photo_url ? (
                              <img src={profileStudent.photo_url} alt={profileStudent.name} crossOrigin="anonymous" />
                            ) : (
                              <div className="id-card-photo-placeholder">👤</div>
                            )}
                          </div>
                          <div className="id-card-name">{profileStudent.name}</div>
                          <div className="id-card-regno">Reg No: {profileStudent.regno || profileStudent.regNo || ''}</div>
                          <div className="id-card-details-grid">
                            <div className="id-card-detail-item">
                              <span className="label">Group</span>
                              <span className="value">{(teams.find(t => String(t.id) === String(profileStudent.teamid || profileStudent.teamId)) || {}).name || 'N/A'}</span>
                            </div>
                            <div className="id-card-detail-item">
                              <span className="label">Category</span>
                              <span className="value">{(categories.find(c => String(c.id) === String(profileStudent.catid || profileStudent.catId)) || {}).name || 'N/A'}</span>
                            </div>
                            <div className="id-card-detail-item">
                              <span className="label">General</span>
                              <span className="value">{profileStudent.gender === 'BOY' ? 'Boy' : 'Girl'}</span>
                            </div>
                          </div>
                          <div className="id-card-qr-container">
                            <StudentQrCode madrasaReg={loggedInMadrasa?.regNumber} studentId={profileStudent.id} />
                          </div>
                        </div>
                        <div className="id-card-footer">
                          <span>MILAD FEST • ID CARD</span>
                        </div>
                      </div>

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
                        </div>
                      </div>

                      {/* Approval list */}
                      <div className="settings-list-box" style={{ maxHeight: 'none' }}>
                        <h3>📋 Students Photo Approval</h3>
                        {(() => {
                          const filtered = students.filter(s => {
                            const matchCat = profileAdminCatFilter === 'ALL' || String(s.catid || s.catId || '') === String(profileAdminCatFilter);
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
                          if (s.photo_status !== 'approved') return false;
                          const matchCat = profileAdminCatFilter === 'ALL' || String(s.catid || s.catId || '') === String(profileAdminCatFilter);
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
                                {pdfPaperSize === 'A4' ? '8 cards/page' : '18 cards/page'} • 300 DPI • 3.375" × 2.125"
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
                                  const sTeamId = s.teamid || s.teamId || '';
                                  const sCatId = s.catid || s.catId || '';
                                  const teamObj = teams.find(t => String(t.id) === String(sTeamId));
                                  const catObj = categories.find(c => String(c.id) === String(sCatId));

                                  return (
                                    <div key={s.id} className="id-card-gallery-item">
                                      <div className="id-card id-card-mini">
                                        <div className="id-card-header">
                                          <div className="id-card-madrasa-name">{loggedInMadrasa ? loggedInMadrasa.name : ''}</div>
                                          <div className="id-card-madrasa-info">Reg No: {loggedInMadrasa ? loggedInMadrasa.regNumber : ''} | {loggedInMadrasa ? loggedInMadrasa.place : ''}</div>
                                        </div>
                                        <div className="id-card-body">
                                          <div className="id-card-photo">
                                            {s.photo_url ? (
                                              <img src={s.photo_url} alt={s.name} crossOrigin="anonymous" />
                                            ) : (
                                              <div className="id-card-photo-placeholder">👤</div>
                                            )}
                                          </div>
                                          <div className="id-card-name">{s.name}</div>
                                          <div className="id-card-regno">Reg No: {s.regno || s.regNo || ''}</div>
                                          <div className="id-card-details-grid">
                                            <div className="id-card-detail-item">
                                              <span className="label">Group</span>
                                              <span className="value">{teamObj ? teamObj.name : 'N/A'}</span>
                                            </div>
                                            <div className="id-card-detail-item">
                                              <span className="label">Category</span>
                                              <span className="value">{catObj ? catObj.name : 'N/A'}</span>
                                            </div>
                                            <div className="id-card-detail-item">
                                              <span className="label">General</span>
                                              <span className="value">{s.gender === 'BOY' ? 'Boy' : 'Girl'}</span>
                                            </div>
                                          </div>
                                          <div className="id-card-qr-container">
                                            <StudentQrCode madrasaReg={loggedInMadrasa?.regNumber} studentId={s.id} />
                                          </div>
                                        </div>
                                        <div className="id-card-footer">
                                          <span>MILAD FEST • ID CARD</span>
                                        </div>
                                      </div>
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
          )}

          {/* ---------------- 🎯 TAB 3: MASTER SETTINGS ---------------- */}
          {activeTab === 'SETTINGS' && (
            <div className="card animate-tab">
              <h2>⚙️ Master Settings (Admin Control Panel)</h2>

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
                      <div className="settings-card-v2">
                        <div className="settings-form-box-v2">
                          <h3>📂 Add New Category</h3>
                          <form onSubmit={handleAddCategory} className="settings-form">
                            <input type="text" className="settings-input-v2" placeholder="Category Name (eg: Junior)" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                            <input type="text" className="settings-input-v2" placeholder="Which classes? (eg: 1 to 4)" value={newCatClassRange} onChange={(e) => setNewCatClassRange(e.target.value)} />
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
                        </div>
                      </div>
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
                              <option value="">Select Category & Division</option>
                              {categories.map(c => (
                                <React.Fragment key={c.id}>
                                  <option value={`${c.id}_BOY`}>{c.name} - Boy</option>
                                  <option value={`${c.id}_GIRL`}>{c.name} - Girl</option>
                                </React.Fragment>
                              ))}
                            </select>

                            <button type="submit" className="btn-premium-action">Add Student</button>
                          </form>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                          {(() => {
                            const filteredStudents = students.filter(s => {
                              const matchTeam = studentFilterTeam === 'ALL' || String(s.teamid || s.teamId || '') === String(studentFilterTeam);
                              const matchCat = studentFilterCat === 'ALL' || String(s.catid || s.catId || '') === String(studentFilterCat);
                              const matchGender = studentFilterGender === 'ALL' || (s.gender || '') === studentFilterGender;
                              return matchTeam && matchCat && matchGender;
                            });

                            const generateStudentsPDF = (mode) => {
                              const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                              const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                              const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';

                              let pdfTitle = 'Registered Students List';
                              let subtitleParts = [];

                              if (studentFilterTeam !== 'ALL') {
                                const tObj = teams.find(t => String(t.id) === String(studentFilterTeam));
                                if (tObj) subtitleParts.push(`Team: ${tObj.name}`);
                              }
                              if (studentFilterCat !== 'ALL') {
                                const cObj = categories.find(c => String(c.id) === String(studentFilterCat));
                                if (cObj) subtitleParts.push(`Category: ${cObj.name}`);
                              }
                              if (studentFilterGender !== 'ALL') {
                                subtitleParts.push(`Division: ${studentFilterGender === 'BOY' ? 'Boys' : 'Girls'}`);
                              }

                              const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' | ') : 'All Students';

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
                                      const teamObj = teams.find(t => String(t.id) === String(s.teamid || s.teamId || ''));
                                      const genderLabel = s.gender === 'BOY' ? 'Boy' : 'Girl';
                                      return `<tr>
                                        <td>${idx + 1}</td>
                                        <td><strong>${sRegNo}</strong></td>
                                        <td>${s.name}</td>
                                        <td>${teamObj ? teamObj.name : 'N/A'}</td>
                                        <td>${genderLabel}</td>
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
                                              <th style="width: 25%">Team / Group</th>
                                              <th style="width: 15%">Division</th>
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
                                  const teamObj = teams.find(t => String(t.id) === String(s.teamid || s.teamId || ''));
                                  const catObj = categories.find(c => String(c.id) === String(s.catid || s.catId || ''));
                                  const genderLabel = s.gender === 'BOY' ? 'Boy' : 'Girl';
                                  return `<tr>
                                    <td>${idx + 1}</td>
                                    <td><strong>${sRegNo}</strong></td>
                                    <td>${s.name}</td>
                                    <td>${teamObj ? teamObj.name : 'N/A'}</td>
                                    <td>${catObj ? catObj.name : 'N/A'}</td>
                                    <td>${genderLabel}</td>
                                  </tr>`;
                                }).join('');

                                contentHtml = `
                                  <table>
                                    <thead>
                                      <tr>
                                        <th style="width: 8%">Sl.No</th>
                                        <th style="width: 18%">Reg. No</th>
                                        <th>Student Name</th>
                                        <th style="width: 22%">Team / Group</th>
                                        <th style="width: 22%">Category</th>
                                        <th style="width: 12%">Division</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${rows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:30px">No students found matching current filters.</td></tr>'}
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
                                    </div>
                                  </div>

                                  {/* 3. Gender Filter */}
                                  <div>
                                    <div className="filter-section-title">👦/👧 Select Division</div>
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
                                                  <option value="">Select Category & Division</option>
                                                  {categories.map(c => (
                                                    <React.Fragment key={c.id}>
                                                      <option value={`${c.id}_BOY`}>{c.name} - Boy</option>
                                                      <option value={`${c.id}_GIRL`}>{c.name} - Girl</option>
                                                    </React.Fragment>
                                                  ))}
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
                              <option value="">Select Category & Division</option>
                              {categories.map(c => (
                                <React.Fragment key={c.id}>
                                  <option value={`${c.id}_BOY`}>{c.name} - Boys</option>
                                  <option value={`${c.id}_GIRL`}>{c.name} - Girls</option>
                                  <option value={`${c.id}_COMMON`}>{c.name} - Common</option>
                                </React.Fragment>
                              ))}
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
                            // Category filter chips
                            const filteredPrograms = programFilterCat === 'ALL'
                              ? programs
                              : programs.filter(p => String(p.catid || p.catId || '') === String(programFilterCat));

                            // PDF generator function
                            const generateProgramsPDF = (catIdFilter) => {
                              const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                              const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                              const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';

                              const catsToShow = catIdFilter === 'ALL'
                                ? categories
                                : categories.filter(c => String(c.id) === String(catIdFilter));

                              const catSections = catsToShow.map(cat => {
                                const catProgs = programs.filter(p => String(p.catid || p.catId || '') === String(cat.id));
                                if (catProgs.length === 0) return '';
                                const rows = catProgs.map(p => {
                                  const divLabel = (p.type || '').includes('BOY') ? 'Boys' : (p.type || '').includes('GIRL') ? 'Girls' : 'Common';
                                  const typeLabel = (p.type || '').includes('GROUP') ? 'Group' : 'Single';
                                  return `<tr><td>${p.code}</td><td>${p.name}</td><td>${divLabel}</td><td>${typeLabel}</td></tr>`;
                                }).join('');
                                return `
                                  <div class="cat-section">
                                    <div class="cat-heading">${cat.name}${cat.classrange ? ' <span class="cat-range">(Class: ' + cat.classrange + ')</span>' : ''}</div>
                                    <table>
                                      <thead><tr><th>Code</th><th>Program Name</th><th>Division</th><th>Type</th></tr></thead>
                                      <tbody>${rows}</tbody>
                                    </table>
                                  </div>`;
                              }).join('');

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
  <div class="notice-title-bar">🏆 Programs List — ${catIdFilter === 'ALL' ? 'All Categories' : (categories.find(c => String(c.id) === String(catIdFilter)) || {}).name || ''}</div>
  <div class="notice-body">
    ${catSections || '<p style="color:#94a3b8;text-align:center;padding:30px">No programs found.</p>'}
  </div>
  <div class="footer">Generated by Milad Fest App • Total Programs: ${catIdFilter === 'ALL' ? programs.length : programs.filter(p => String(p.catid || p.catId || '') === String(catIdFilter)).length}</div>
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
                                    </div>
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
                                </div>

                                {/* Programs grouped by category */}
                                <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
                                  {programs.length === 0 ? (
                                    <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No programs added.</p>
                                  ) : filteredPrograms.length === 0 ? (
                                    <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No programs in this category.</p>
                                  ) : (() => {
                                    // Group by category
                                    const catsToShow = programFilterCat === 'ALL'
                                      ? categories.filter(c => filteredPrograms.some(p => String(p.catid || p.catId || '') === String(c.id)))
                                      : categories.filter(c => String(c.id) === String(programFilterCat));

                                    return catsToShow.map(cat => {
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
                                            {catProgs.map(p => (
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
                                                          Division: {(p.type || '').includes('BOY') ? 'Boys 👦' : (p.type || '').includes('GIRL') ? 'Girls 👧' : 'Common 🚻'} | Type: {(p.type || '').includes('GROUP') ? 'Group 👥' : 'Single 👤'}
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
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    });
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
                      // Students filtered by selected category + gender
                      const regCatObj = categories.find(c => String(c.id) === String(regTabCat));
                      const isRegGeneral = regCatObj && regCatObj.name.toLowerCase().includes('general');

                      const regStudentsFiltered = regTabCat ? students.filter(s => {
                        if (regTabGender !== 'COMMON' && s.gender !== regTabGender) return false;
                        if (isRegGeneral) return true;
                        return String(s.catid || s.catId || '') === String(regTabCat);
                      }) : [];

                      // Programs for selected category + gender
                      const regPrograms = regTabCat ? programs.filter(p => {
                        if (String(p.catid || p.catId || '') !== String(regTabCat)) return false;
                        const pt = p.type || '';
                        if (regTabGender === 'COMMON') return true;
                        if (pt.includes('COMMON')) return true;
                        if (regTabGender === 'BOY' && pt.includes('BOY')) return true;
                        if (regTabGender === 'GIRL' && pt.includes('GIRL')) return true;
                        return false;
                      }) : [];

                      const selectedStudentObj = students.find(s => String(s.id) === String(regTabStudent));

                      const handleSaveRegistrations = async () => {
                        if (!regTabStudent) { alert('Please select a student!'); return; }
                        setRegTabSaving(true);
                        try {
                          const madrasaId = loggedInMadrasa.regNumber;
                          const studentIdInt = parseInt(regTabStudent, 10);
                          
                          // Remove old registrations for this student
                          const { error: deleteError } = await supabase.from('program_registrations')
                            .delete()
                            .eq('madrasa_id', madrasaId)
                            .eq('student_id', studentIdInt);

                          if (deleteError) {
                            throw new Error(deleteError.message);
                          }

                          // Insert newly checked programs
                          if (regTabCheckedProgs.length > 0) {
                            const inserts = regTabCheckedProgs.map(pId => ({
                              madrasa_id: madrasaId,
                              student_id: studentIdInt,
                              program_id: parseInt(pId, 10)
                            }));
                            const { error: insertError } = await supabase.from('program_registrations').insert(inserts);
                            if (insertError) {
                              throw new Error(insertError.message);
                            }
                          }

                          // Refresh
                          const { data: newRegs, error: fetchError } = await supabase
                            .from('program_registrations').select('*').eq('madrasa_id', madrasaId);
                          if (fetchError) {
                            throw new Error(fetchError.message);
                          }
                          if (newRegs) setProgramRegistrations(newRegs);
                          alert(`✅ Saved! ${regTabCheckedProgs.length} program(s) registered for ${selectedStudentObj?.name || ''}`);
                        } catch (err) {
                          alert('Error saving: ' + err.message);
                        }
                        setRegTabSaving(false);
                      };


                      return (
                        <div className="settings-card-v2">
                          {/* We can do a responsive split layout: Left is Form (with Stepper), Right is Live Summary */}
                          <div className="register-layout-split" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                              
                              {/* LEFT: Step Form */}
                              <div className="settings-form-box-v2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h3>📋 Register Students for Programs</h3>

                                <div className="stepper-timeline">
                                  {/* Step 1: Category */}
                                  <div className={`step-box ${regTabCat ? 'filled' : 'active'}`}>
                                    <div className="step-header">
                                      <div className="step-number">01</div>
                                      <div className="step-title">Select Category</div>
                                    </div>
                                    <div className="step-content">
                                      <select className="settings-input-v2" value={regTabCat} onChange={e => {
                                        setRegTabCat(e.target.value);
                                        setRegTabStudent('');
                                        setRegTabCheckedProgs([]);
                                      }}>
                                        <option value="">-- Select Category --</option>
                                        {categories.map(c => (
                                          <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Step 2: Division / Gender */}
                                  {regTabCat && (
                                    <div className={`step-box ${regTabGender ? 'filled' : 'active'}`}>
                                      <div className="step-header">
                                        <div className="step-number">02</div>
                                        <div className="step-title">Select Division</div>
                                      </div>
                                      <div className="step-content">
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                          {[
                                            { val: 'BOY',    label: '👦 Boys' },
                                            { val: 'GIRL',   label: '👧 Girls' },
                                            { val: 'COMMON', label: '🚻 General' }
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
                                        <div className="step-title">Select Student</div>
                                      </div>
                                      <div className="step-content">
                                        {regStudentsFiltered.length === 0 ? (
                                          <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>No students in this category/division.</p>
                                        ) : (
                                          <select className="settings-input-v2" value={regTabStudent} onChange={e => {
                                            const sid = e.target.value;
                                            setRegTabStudent(sid);
                                            const existing = programRegistrations
                                              .filter(r => String(r.student_id) === String(sid))
                                              .map(r => String(r.program_id));
                                            setRegTabCheckedProgs(existing);
                                          }}>
                                            <option value="">-- Select Student --</option>
                                            {regStudentsFiltered.map(s => {
                                              const sRegNo = s.regno || s.regNo || '';
                                              const sCount = programRegistrations.filter(r => String(r.student_id) === String(s.id)).length;
                                              return (
                                                <option key={s.id} value={s.id}>
                                                  {sRegNo} - {s.name} ({s.gender === 'BOY' ? '👦' : '👧'}){sCount > 0 ? ` [${sCount} progs]` : ''}
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
                                        <div className="step-title">Select Programs for {selectedStudentObj ? selectedStudentObj.name : ''}</div>
                                      </div>
                                      <div className="step-content">
                                        {regPrograms.length === 0 ? (
                                          <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '12px 0', margin: 0 }}>No programs in this category/division.</p>
                                        ) : (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {/* Select All / Clear All */}
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                              <button type="button" onClick={() => setRegTabCheckedProgs(regPrograms.map(p => String(p.id)))}
                                                className="btn-premium-action-small secondary" style={{ flex: 1, background: '#dcfce7', color: '#166534' }}>
                                                Select All
                                              </button>
                                              <button type="button" onClick={() => setRegTabCheckedProgs([])}
                                                className="btn-premium-action-small secondary" style={{ flex: 1, background: '#fee2e2', color: '#991b1b' }}>
                                                Clear All
                                              </button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto', paddingRight: '2px' }}>
                                              {regPrograms.map(p => {
                                                const isChecked = regTabCheckedProgs.includes(String(p.id));
                                                const pTypeLabel = (p.type || '').includes('GROUP') ? 'Group 👥' : 'Single 👤';
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
                                                    {isChecked && <span style={{ color: '#2563eb', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap' }}>✓ Checked</span>}
                                                  </label>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}

                                        <button type="button" onClick={handleSaveRegistrations} disabled={regTabSaving}
                                          className="btn-premium-action"
                                          style={{ marginTop: '16px' }}>
                                          {regTabSaving ? '⏳ Saving...' : `💾 Save Registration (${regTabCheckedProgs.length} selected)`}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* RIGHT: Registration Summary */}
                              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: '14px', borderLeft: '4px solid var(--primary-light)', paddingLeft: '10px' }}>
                                  📊 Registration Summary {regTabCat ? `– ${regCatObj?.name || ''}` : ''}
                                </h3>
                                {!regTabCat ? (
                                  <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Select a category to view registrations.</p>
                                ) : regStudentsFiltered.length === 0 ? (
                                  <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No students in this category/division.</p>
                                ) : (
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
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>No programs registered yet</div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* MARK_ENTRY SUB-TAB */}
                    {settingsSubTab === 'MARK_ENTRY' && (
                      <div className="settings-card-v2">
                        <div className="settings-form-box-v2">
                          <h3>📝 Mark Entry (Mark Entry System)</h3>
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
                                      </React.Fragment>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Step 2: Program (filtered by category and gender) */}
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

                              {/* Step 3: Student (filtered by category & gender, supporting 'General') */}
                              <div className={`step-box ${selectedResultStudent ? 'filled' : 'active'}`}>
                                <div className="step-header">
                                  <div className="step-number">03</div>
                                  <div className="step-title">Select Student</div>
                                </div>
                                <div className="step-content">
                                  <select className="settings-input-v2" value={selectedResultStudent} onChange={(e) => setSelectedResultStudent(e.target.value)} required disabled={!selectedResultCat}>
                                    <option value="">{selectedResultCat ? '-- Select Student --' : 'Select Category First'}</option>
                                    {(() => {
                                      const selectedCatObj = categories.find(c => String(c.id) === String(selectedResultCat));
                                      const isGeneral = selectedCatObj && selectedCatObj.name.toLowerCase().includes('general');

                                      // If a program is selected, filter by registered students only
                                      const regStudentIds = selectedResultProg
                                        ? new Set(programRegistrations
                                            .filter(r => String(r.program_id) === String(selectedResultProg))
                                            .map(r => String(r.student_id)))
                                        : null;

                                      return students
                                        .filter(s => {
                                          if (selectedResultGender !== 'ALL' && s.gender !== selectedResultGender) return false;
                                          if (regStudentIds && regStudentIds.size > 0) return regStudentIds.has(String(s.id));
                                          if (isGeneral) return true; // Show all students for General category!
                                          return String(s.catid || s.catId || '') === String(selectedResultCat);
                                        })
                                        .map(s => {
                                          const sRegNo = s.regno || s.regNo || '';
                                          const sTeamId = s.teamid || s.teamId || '';
                                          const teamName = (teams.find(t => String(t.id) === String(sTeamId)) || {}).name || '';
                                          const catName = (categories.find(c => String(c.id) === String(s.catid || s.catId)) || {}).name || '';
                                          return <option key={s.id} value={s.id}>{sRegNo} - {s.name} ({s.gender === 'BOY' ? '👦' : '👧'}) [{teamName}] {isGeneral ? `(${catName})` : ''}</option>;
                                        });
                                    })()}
                                  </select>
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
                      const judgeStudents = judgeSheetProg ? (() => {
                        const regStudentIds = new Set(
                          programRegistrations
                            .filter(r => String(r.program_id) === String(judgeSheetProg))
                            .map(r => String(r.student_id))
                        );
                        const baseStudents = regStudentIds.size > 0
                          ? students.filter(s => regStudentIds.has(String(s.id)))
                          : students.filter(s => {
                              if (judgeSheetGender && s.gender !== judgeSheetGender) return false;
                              if (isGeneral) return true;
                              return String(s.catid || s.catId || '') === String(judgeSheetCat);
                            });
                        return baseStudents.sort((a, b) => {
                          const aReg = parseInt(a.regno || a.regNo || '0') || 0;
                          const bReg = parseInt(b.regno || b.regNo || '0') || 0;
                          return aReg - bReg;
                        });
                      })() : [];

                      const handleDownloadJudgeSheetPDF = () => {
                        if (!judgeSheetProg) {
                          alert('Please select a program first!');
                          return;
                        }
                        const madrasaName = loggedInMadrasa ? loggedInMadrasa.name : '';
                        const madrasaPlace = loggedInMadrasa ? loggedInMadrasa.place : '';
                        const madrasaRegNo = loggedInMadrasa ? loggedInMadrasa.regNumber : '';
                        const catName = selectedCatObj ? selectedCatObj.name : '';
                        const genderLabel = judgeSheetGender === 'BOY' ? 'Boys' : judgeSheetGender === 'GIRL' ? 'Girls' : 'Common';
                        const progName = selectedProgObj ? `${selectedProgObj.code} - ${selectedProgObj.name}` : '';

                        const rows = judgeStudents.map((s, idx) => {
                          const sRegNo = s.regno || s.regNo || '';
                          return `<tr>
                            <td style="text-align:center;font-weight:700;font-size:13px">${sRegNo}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                          </tr>`;
                        }).join('');

                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(`
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
  .subtitle-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .subtitle-label {
    font-size: 10px;
    font-weight: 700;
    color: #78350f;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .subtitle-value {
    font-size: 13px;
    font-weight: 800;
    color: #1c1917;
  }
  .sheet-body { padding: 14px 18px 18px; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  thead tr {
    background: linear-gradient(90deg, #064e3b, #0f766e);
    color: white;
  }
  th {
    padding: 9px 8px;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid rgba(255,255,255,0.2);
    text-align: center;
  }
  td {
    padding: 10px 8px;
    border: 1.5px solid #cbd5e1;
    min-height: 36px;
    height: 36px;
  }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:hover { background: #f0fdf4; }
  .reg-no-cell {
    text-align: center;
    font-weight: 800;
    font-size: 13px;
    color: #064e3b;
    background: #ecfdf5;
    width: 100px;
  }
  .name-cell { width: 180px; }
  .chance-cell { width: 90px; text-align: center; }
  .marks-cell { width: 90px; text-align: center; }
  .position-cell { width: 90px; text-align: center; }
  .team-cell { width: 120px; }
  .sheet-footer {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 10px;
    font-size: 11px;
    color: #64748b;
  }
  .signature-box {
    text-align: center;
    width: 200px;
  }
  .signature-line {
    border-top: 1.5px solid #1e293b;
    padding-top: 5px;
    font-weight: 600;
    color: #1e293b;
    font-size: 11px;
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
      <span class="subtitle-label">Total Participants:</span>
      <span class="subtitle-value">${judgeStudents.length}</span>
    </div>
  </div>
  <div class="sheet-body">
    <table>
      <thead>
        <tr>
          <th style="width:100px">Reg. No</th>
          <th style="width:180px">Student Name</th>
          <th style="width:90px">Chance No</th>
          <th style="width:90px">Marks</th>
          <th style="width:90px">Position</th>
          <th>Team Name</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:30px">No students registered.</td></tr>'}
      </tbody>
    </table>
    <div class="sheet-footer">
      <div class="signature-box">
        <div style="height:40px"></div>
        <div class="signature-line">Judge Signature</div>
      </div>
      <div style="text-align:center;color:#94a3b8">
        <div style="font-size:10px">Milad Fest | ${catName} | ${progName}</div>
        <div style="font-size:10px;margin-top:2px">Printed: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
      <div class="signature-box">
        <div style="height:40px"></div>
        <div class="signature-line">Coordinator Signature</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`);
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => printWindow.print(), 600);
                      };

                      return (
                        <div className="settings-card-container">
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
                                    <strong>{judgeStudents.length}</strong> participants registered in{' '}
                                    <strong>{selectedProgObj ? selectedProgObj.name : ''}</strong>
                                  </div>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={handleDownloadJudgeSheetPDF}
                                disabled={!judgeSheetProg}
                                className="btn-add-action"
                                style={{ background: judgeSheetProg ? '#064e3b' : '#94a3b8', cursor: judgeSheetProg ? 'pointer' : 'not-allowed' }}
                              >
                                📥 Download Judge Sheet PDF
                              </button>
                            </div>
                          </div>

                          {/* Preview list */}
                          <div className="settings-list-box" style={{ maxHeight: 'none' }}>
                            <h3>📋 {judgeSheetProg ? `Participants – ${selectedProgObj ? selectedProgObj.name : ''}` : 'Select a Program'}</h3>
                            {!judgeSheetProg ? (
                              <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>Please select a category and program above.</p>
                            ) : judgeStudents.length === 0 ? (
                              <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>No students registered in this category/division.</p>
                            ) : (
                              <>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                  📌 {judgeStudents.length} participants will appear on the sheet, sorted by Reg. No.
                                </div>
                                {judgeStudents.map((s, idx) => {
                                  const sRegNo = s.regno || s.regNo || '';
                                  const teamObj = teams.find(t => String(t.id) === String(s.teamid || s.teamId || ''));
                                  return (
                                    <div key={s.id} style={{
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
                                })}
                              </>
                            )}
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
                            <span className="lbl">General</span>
                            <span className="val">{qrModalData.student.gender === 'BOY' ? 'Boy' : 'Girl'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="poster-events-section">
                      <h4 className="events-section-title">🏆 Registered Programs & Results</h4>
                      {qrModalData.results && qrModalData.results.length > 0 ? (
                        <div className="poster-events-table">
                          <div className="events-table-header">
                            <span>Program</span>
                            <span style={{ textAlign: 'center' }}>Place</span>
                            <span style={{ textAlign: 'center' }}>Grade</span>
                          </div>
                          {qrModalData.results.map((r, idx) => (
                            <div key={idx} className="events-table-row">
                              <span className="event-name">
                                <b>{r.progname}</b> 
                                <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '5px' }}>
                                  ({(r.progtype || '').includes('GROUP') ? 'Group' : 'Single'})
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
                        </div>
                      ) : (
                        <p className="no-events-text">No registered programs or results found for this student.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="poster-footer">
                    <p>MILAD FEST • OFFICIAL EVENT CARD</p>
                  </div>
                </div>

                {/* Modal actions */}
                <div className="qr-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button onClick={handleDownloadPoster} className="btn-add-action" style={{ background: 'linear-gradient(135deg, #059669, #047857)', flex: 1, margin: 0 }}>
                    📥 Download Poster
                  </button>
                  <button onClick={() => setQrModalOpen(false)} className="btn-add-action" style={{ background: '#64748b', flex: 1, margin: 0 }}>
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
              <h1 className="projector-title">{loggedInMadrasa ? loggedInMadrasa.name : 'MILAD FESTIVAL'}</h1>
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
                              <span className="projector-team-name">{team.name}</span>
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
    </div>
  )
}

export default App;
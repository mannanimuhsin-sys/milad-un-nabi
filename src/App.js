import { supabase } from './supabaseClient';
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('LOGIN');
  const [activeTab, setActiveTab] = useState('SCOREBOARD');
  const [loginRole, setLoginRole] = useState('');
  const [secretKey, setSecretKey] = useState('');

  // മദ്രസ രജിസ്ട്രേഷൻ സ്റ്റേറ്റുകൾ (Supabase)
  const [loggedInMadrasa, setLoggedInMadrasa] = useState(null);
  const [regName, setRegName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regPlace, setRegPlace] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [viewPassword, setViewPassword] = useState('');

  // ലോഗിൻ സ്റ്റേറ്റുകൾ
  const [loginRegNum, setLoginRegNum] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // സൂപ്പർ അഡ്മിൻ പാനലിലെ സ്റ്റേറ്റുകൾ
  const [superMadrasas, setSuperMadrasas] = useState([]);
  const [pendingMadrasa, setPendingMadrasa] = useState(null);
  const [editingMadrasaId, setEditingMadrasaId] = useState(null);
  const [editingMadrasaData, setEditingMadrasaData] = useState({});

  // മാസ്റ്റർ ഡാറ്റാ സ്റ്റേറ്റുകൾ (Supabase ഓൺലൈൻ ഡാറ്റാബേസ്)
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [resultsList, setResultsList] = useState([]);

  // ഡൈനാമിക് പോയിന്റ് സിസ്റ്റം സ്റ്റേറ്റ്
  const [pointSystem, setPointSystem] = useState({
    p1: 5, p2: 3, p3: 1, gA: 5, gB: 3, gC: 1,
    gp1: 10, gp2: 6, gp3: 2, gpA: 5, gpB: 3, gpC: 1
  });

  // ഇൻപുട്ട് ഫോം സ്റ്റേറ്റുകൾ
  const [newTeamName, setNewTeamName] = useState('');
  const [newCatName, setNewCatName] = useState('');

  // സ്റ്റുഡന്റ് ഫോം സ്റ്റേറ്റുകൾ
  const [newStudentName, setNewStudentName] = useState('');
  const [studentRegNo, setStudentRegNo] = useState('');
  const [selectedStudentTeam, setSelectedStudentTeam] = useState('');
  const [selectedStudentCat, setSelectedStudentCat] = useState('');
  const [studentGender, setStudentGender] = useState('BOY');

  // പ്രോഗ്രാം ഫോം സ്റ്റേറ്റുകൾ
  const [newProgName, setNewProgName] = useState('');
  const [newProgCode, setNewProgCode] = useState('');
  const [selectedProgCat, setSelectedProgCat] = useState('');
  const [progType, setProgType] = useState('SINGLE');
  const [progGender, setProgGender] = useState('COMMON');

  // മാർക്ക് എന്ററി സ്റ്റേറ്റുകൾ
  const [selectedResultCat, setSelectedResultCat] = useState('');
  const [selectedResultGender, setSelectedResultGender] = useState('ALL');
  const [selectedResultProg, setSelectedResultProg] = useState('');
  const [selectedResultStudent, setSelectedResultStudent] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('1');
  const [selectedGrade, setSelectedGrade] = useState('A');

  // എഡിറ്റിംഗ് സ്റ്റേറ്റുകൾ
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


  // 🔄 സുപർബേസിൽ നിന്നും തത്സമയം വിവരങ്ങൾ ലോഡ് ചെയ്യാനുള്ള ഫങ്ഷൻ
  const fetchSupabaseData = async (rNum) => {
    try {
      const [
        { data: teamsData },
        { data: catsData },
        { data: studentsData },
        { data: programsData },
        { data: resultsData }
      ] = await Promise.all([
        supabase.from('teams').select('*').eq('madrasa_id', rNum),
        supabase.from('categories').select('*').eq('madrasa_id', rNum),
        supabase.from('students').select('*').eq('madrasa_id', rNum),
        supabase.from('programs').select('*').eq('madrasa_id', rNum),
        supabase.from('results').select('*').eq('madrasa_id', rNum)
      ]);

      if (teamsData) setTeams(teamsData);
      if (catsData) setCategories(catsData);
      if (studentsData) setStudents(studentsData);
      if (programsData) setPrograms(programsData);
      if (resultsData) setResultsList(resultsData);
    } catch (err) {
      console.error("Data fetch error: ", err);
    }
  };

  useEffect(() => {
    if (loggedInMadrasa) {
      const rNum = loggedInMadrasa.regNumber;

      // ഓൺലൈൻ ഡാറ്റാബേസിൽ നിന്ന് വിവരങ്ങൾ എടുക്കുന്നു
      fetchSupabaseData(rNum);

      // പോയിന്റ് സിസ്റ്റം ഇപ്പോഴും ലോക്കൽ സ്റ്റോറേജിൽ സൂക്ഷിക്കുന്നു
      setPointSystem(JSON.parse(localStorage.getItem(`points_${rNum}`)) || {
        p1: 5, p2: 3, p3: 1, gA: 5, gB: 3, gC: 1,
        gp1: 10, gp2: 6, gp3: 2, gpA: 5, gpB: 3, gpC: 1
      });

      // ആദ്യമായി ലോഗിൻ ചെയ്യുമ്പോൾ ഡാറ്റാബേസിൽ കാറ്റഗറി ഒന്നുമില്ലെങ്കിൽ ഡിഫോൾട്ട് ആയി സെറ്റ് ചെയ്യാനുള്ള ഒരു ചെക്കർ
      checkAndInsertDefaultCategories(rNum);
    }
  }, [loggedInMadrasa]);

  // ഡിഫോൾട്ട് കാറ്റഗറികൾ സുപർബേസിലേക്ക് ആഡ് ചെയ്യാനുള്ള കോഡ്
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
      alert('വിവരങ്ങൾ പൂർണ്ണമായി നൽകുക!');
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
        alert('തകരാർ സംഭവിച്ചു: ' + error.message);
        return;
      }

      if (!madrasa) {
        alert('മദ്രസ കണ്ടെത്താനായില്ല!');
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
          alert('നിങ്ങളുടെ മദ്രസ ബ്ലോക്ക് ചെയ്തിരിക്കുന്നു! ദയവായി അഡ്മിനുമായി ബന്ധപ്പെടുക.');
          return;
        }

        // Approved, proceed to login
        const role = loginPassword === madrasa.adminPassword ? 'ADMIN' : 'VIEW';
        const sanitizedMadrasa = { ...madrasa, place: actualPlace };
        setLoggedInMadrasa(sanitizedMadrasa);
        setLoginRole(role);
        setCurrentScreen('DASHBOARD');
        setActiveTab('SCOREBOARD');

        // Clear login form
        setLoginRegNum('');
        setLoginPassword('');
      } else {
        alert('പാസ്‌വേർഡ് തെറ്റാണ്!');
      }
    } catch (err) {
      alert('തകരാർ സംഭവിച്ചു: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterMadrasa = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regNumber.trim() || !regPlace.trim() || !adminPassword.trim() || !viewPassword.trim()) {
      alert('എല്ലാ വിവരങ്ങളും പൂരിപ്പിക്കുക!');
      return;
    }

    try {
      // Check if the regNumber is unique in Supabase
      const { data: existing, error: checkError } = await supabase
        .from('madrasas')
        .select('regNumber')
        .eq('regNumber', regNumber);

      if (checkError) {
        alert('തകരാർ സംഭവിച്ചു: ' + checkError.message);
        return;
      }

      if (existing && existing.length > 0) {
        alert('ഈ രജിസ്റ്റർ നമ്പർ നിലവിലുണ്ട്! മറ്റ് നമ്പർ ഉപയോഗിക്കുക.');
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
        alert('രജിസ്ട്രേഷൻ പരാജയപ്പെട്ടു: ' + error.message);
      } else {
        alert('മദ്രസ രജിസ്ട്രേഷൻ സമർപ്പിച്ചു! സൂപ്പർ അഡ്മിൻ അപ്പ്രൂവലിനായി കാത്തിരിക്കുക.');
        const tempMadrasa = { name: regName, regNumber, place: `${regPlace}|pending` };
        setPendingMadrasa(tempMadrasa);
        setRegName(''); setRegNumber(''); setRegPlace(''); setAdminPassword(''); setViewPassword('');
        setCurrentScreen('PENDING_APPROVAL');
      }
    } catch (err) {
      alert('തകരാർ സംഭവിച്ചു: ' + err.message);
    }
  };

  const fetchMadrasas = async () => {
    try {
      const { data, error } = await supabase
        .from('madrasas')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        alert('മദ്രസകൾ ലോഡ് ചെയ്യുന്നതിൽ പരാജയം: ' + error.message);
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
      alert('അപ്പ്രൂവ് ചെയ്യുന്നതിൽ തകരാർ: ' + error.message);
    } else {
      alert('മദ്രസ വിജകരമായി അപ്പ്രൂവ് ചെയ്തു!');
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
      alert('ബ്ലോക്ക് ചെയ്യുന്നതിൽ തകരാർ: ' + error.message);
    } else {
      alert('മദ്രസ ബ്ലോക്ക് ചെയ്തു!');
      fetchMadrasas();
    }
  };

  const handleDeleteMadrasa = async (id) => {
    if (!window.confirm('ഈ മദ്രസ ഒഴിവാക്കണോ? രജിസ്റ്റർ ചെയ്ത വിവരങ്ങൾ എല്ലാം ഇല്ലാതാകും.')) return;
    const { error } = await supabase
      .from('madrasas')
      .delete()
      .eq('id', id);

    if (error) {
      alert('ഒഴിവാക്കുന്നതിൽ തകരാർ: ' + error.message);
    } else {
      alert('മദ്രസ വിജകരമായി ഒഴിവാക്കി!');
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
      alert('എല്ലാ വിവരങ്ങളും പൂരിപ്പിക്കുക!');
      return;
    }

    // Check if the regNumber is unique among other madrasas
    const duplicate = superMadrasas.find(
      m => m.regNumber === editingMadrasaData.regNumber && m.id !== editingMadrasaId
    );
    if (duplicate) {
      alert('ഈ രജിസ്റ്റർ നമ്പർ നിലവിലുണ്ട്!');
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
      alert('അപ്ഡേറ്റ് ചെയ്യുന്നതിൽ തകരാർ: ' + error.message);
    } else {
      alert('മദ്രസ വിവരങ്ങൾ വിജകരമായി അപ്ഡേറ്റ് ചെയ്തു!');
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
    if (!window.confirm('ഈ ടീം ഒഴിവാക്കണോ?')) return;
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
    if (!window.confirm('ഈ കാറ്റഗറി ഒഴിവാക്കണോ?')) return;
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
      alert('എല്ലാ വിവരങ്ങളും പൂരിപ്പിക്കുക!'); return;
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
    if (!window.confirm('ഈ കുട്ടിയെ ഒഴിവാക്കണോ?')) return;
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
    if (!window.confirm('ഈ പ്രോഗ്രാം ഒഴിവാക്കണോ?')) return;
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
    alert('പുതിയ പോയിന്റ് ഘടന വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു!');
  };

  // 📝 6. MARK ENTRY ACTIONS (SUPABASE)
  const handleAddResult = async (e) => {
    e.preventDefault();
    if (!selectedResultProg || !selectedResultStudent || !loggedInMadrasa) {
      alert('മത്സരവും കുട്ടിയെയും തിരഞ്ഞെടുക്കുക!'); return;
    }

    const studentObj = students.find(s => String(s.id) === String(selectedResultStudent));
    const progObj = programs.find(p => String(p.id) === String(selectedResultProg));
    if (!studentObj || !progObj) { alert('വിവരങ്ങൾ കൃത്യമല്ല!'); return; }

    const isGroup = progObj.type === 'GROUP';

    // ഡൈനാമിക് പോയിന്റ് കണക്കുകൂട്ടൽ
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
      alert('റിസൾട്ട് വിജയകരമായി പ്രഖ്യാപിച്ചു!');
      fetchSupabaseData(loggedInMadrasa.regNumber);
    }
  };

  const handleDeleteResult = async (id) => {
    if (!window.confirm('ഈ റിസൾട്ട് ഒഴിവാക്കണോ?')) return;
    const { error } = await supabase.from('results').delete().eq('id', id);
    if (error) alert(error.message);
    else if (loggedInMadrasa) fetchSupabaseData(loggedInMadrasa.regNumber);
  };

  const getTeamTotalPoints = (teamId) => {
    return resultsList.filter(r => String(r.teamId) === String(teamId) || String(r.teamid) === String(teamId)).reduce((sum, r) => sum + r.points, 0);
  };

  return (
    <div className="main-container">

      {/* 🔐 LOGIN SCREEN */}
      {currentScreen === 'LOGIN' && (
        <div className="executive-login-container">
          <div className="executive-login-card">
            <div className="login-brand-section">
              <span className="mosque-icon-wrapper"><h3>🕌</h3></span>
              <h2>MILAD FEST</h2>
              <p className="subtitle">മദ്രസ ലോഗിൻ സിസ്റ്റം</p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="executive-form-group">
                <label>മദ്രസ രജിസ്റ്റർ നമ്പർ</label>
                <input type="text" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Reg Number" value={loginRegNum} onChange={(e) => setLoginRegNum(e.target.value)} required />
              </div>
              <div className="executive-form-group">
                <label>പാസ്‌വേർഡ്</label>
                <input type="password" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-executive-gold" disabled={isLoggingIn}>
                {isLoggingIn ? 'ലോഗിൻ ചെയ്യുന്നു...' : 'ലോഗിൻ ചെയ്യുക'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <span onClick={() => {
                setRegName(''); setRegNumber(''); setRegPlace(''); setAdminPassword(''); setViewPassword('');
                setCurrentScreen('REGISTER_FORM');
              }} style={{ color: '#94a3b8', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }} className="admin-premium-link">
                📝 പുതിയ മദ്രസ രജിസ്ട്രേഷൻ
              </span>
            </div>

            <div className="admin-only-footer">
              <span onClick={() => { setCurrentScreen('REGISTER_LOCK'); }} className="admin-premium-link">⚙️ Admin Control Panel</span>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 SECURITY LOCK */}
      {currentScreen === 'REGISTER_LOCK' && (
        <div className="executive-login-container">
          <div className="executive-login-card">
            <div className="login-brand-section"><h2>🔐 സെക്യൂരിറ്റി ലോക്ക്</h2></div>
            <div className="executive-form-group">
              <input type="password" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Secret Key" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} />
            </div>
            <div className="flex-button-group">
              <button onClick={() => {
                if (secretKey === '0633123') {
                  setCurrentScreen('SUPER_ADMIN_PANEL');
                  setSecretKey('');
                  fetchMadrasas();
                } else {
                  alert('തെറ്റായ കീ!');
                }
              }} className="btn-executive-gold">തുടരുക</button>
              <button onClick={() => setCurrentScreen('LOGIN')} className="btn-executive-secondary">ബാക്ക്</button>
            </div>
          </div>
        </div>
      )}

      {/* 📝 REGISTRATION FORM */}
      {currentScreen === 'REGISTER_FORM' && (
        <div className="executive-login-container">
          <div className="executive-login-card">
            <h2>📝 പുതിയ മദ്രസ രജിസ്ട്രേഷൻ</h2>
            <form onSubmit={handleRegisterMadrasa} style={{ marginTop: '15px' }}>
              <div className="executive-form-group">
                <input type="text" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Madrasa Name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
              </div>
              <div className="executive-form-group">
                <input type="text" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Register Number" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} required />
              </div>
              <div className="executive-form-group">
                <input type="text" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Location" value={regPlace} onChange={(e) => setRegPlace(e.target.value)} required />
              </div>
              <div className="executive-form-group">
                <input type="password" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="Admin Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
              </div>
              <div className="executive-form-group">
                <input type="password" className="executive-input" style={{ paddingLeft: '15px' }} placeholder="View Password" value={viewPassword} onChange={(e) => setViewPassword(e.target.value)} required />
              </div>
              <div className="flex-button-group">
                <button type="submit" className="btn-executive-gold">രജിസ്റ്റർ ചെയ്യുക</button>
                <button type="button" onClick={() => setCurrentScreen('LOGIN')} className="btn-executive-secondary">ക്ാൻസൽ</button>
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
              <h2 style={{ marginTop: '15px', color: 'white' }}>അപ്പ്രൂവലിനായി കാത്തിരിക്കുന്നു</h2>
              <p className="subtitle" style={{ color: '#94a3b8', fontSize: '14px', marginTop: '10px' }}>
                നിങ്ങളുടെ മദ്രസ (<b>{pendingMadrasa.name}</b>) അപ്പ്രൂവലിനായി കാത്തിരിക്കുകയാണ് അല്ലെങ്കിൽ പെൻഡിങ് ആണ്.
              </p>
            </div>

            <div style={{ margin: '25px 0', background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p style={{ color: '#e2e8f0', fontSize: '14px', marginBottom: '15px' }}>
                അപ്പ്രൂവ് ചെയ്യുന്നതിനായി താഴെയുള്ള വാട്സ്ആപ്പ് ബട്ടൺ ക്ലിക്ക് ചെയ്ത് മെസ്സേജ് അയക്കുക.
              </p>

              <a
                href={`https://wa.me/917559950633?text=${encodeURIComponent(`ഹലോ അഡ്മിൻ,\nഞങ്ങളുടെ മദ്രസ രജിസ്ട്രേഷൻ അപ്പ്രൂവ് ചെയ്യണം.\n\nമദ്രസയുടെ പേര്: ${pendingMadrasa.name}\nരജിസ്റ്റർ നമ്പർ: ${pendingMadrasa.regNumber}\nസ്ഥലം: ${(pendingMadrasa.place || '').split('|')[0]}`)}`}
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
                WhatsApp അപ്പ്രൂവൽ
              </a>
            </div>

            <button onClick={() => { setCurrentScreen('LOGIN'); setPendingMadrasa(null); }} className="btn-executive-secondary">ബാക്ക്</button>
          </div>
        </div>
      )}

      {/* ⚙️ SUPER ADMIN PANEL */}
      {currentScreen === 'SUPER_ADMIN_PANEL' && (
        <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
          <header className="dash-header" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}>
            <div>
              <h1 style={{ color: 'white' }}>⚙️ സൂപ്പർ അഡ്മിൻ കൺട്രോൾ പാനൽ</h1>
              <p>രജിസ്റ്റർ ചെയ്ത മദ്രസകളുടെ മാനേജ്‌മെന്റ് സിസ്റ്റം</p>
            </div>
            <button onClick={() => setCurrentScreen('LOGIN')} className="btn-logout-top">ലോഗിൻ സ്ക്രീൻ</button>
          </header>

          {/* Stats section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', margin: 0, padding: '15px' }}>
              <h4 style={{ color: '#1e40af', fontSize: '14px', margin: 0 }}>ആകെ മദ്രസകൾ</h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#1d4ed8' }}>{superMadrasas.length}</p>
            </div>
            <div className="card" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', margin: 0, padding: '15px' }}>
              <h4 style={{ color: '#065f46', fontSize: '14px', margin: 0 }}>അപ്പ്രൂവ് ചെയ്തവ</h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#047857' }}>
                {superMadrasas.filter(m => !(m.place || '').includes('|pending') && !(m.place || '').includes('|blocked')).length}
              </p>
            </div>
            <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a', margin: 0, padding: '15px' }}>
              <h4 style={{ color: '#92400e', fontSize: '14px', margin: 0 }}>പെൻഡിങ് മദ്രസകൾ</h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#d97706' }}>
                {superMadrasas.filter(m => (m.place || '').includes('|pending')).length}
              </p>
            </div>
            <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca', margin: 0, padding: '15px' }}>
              <h4 style={{ color: '#991b1b', fontSize: '14px', margin: 0 }}>ബ്ലോക്ക് ചെയ്തവ</h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#dc2626' }}>
                {superMadrasas.filter(m => (m.place || '').includes('|blocked')).length}
              </p>
            </div>
          </div>

          {/* Madrasa List */}
          <div className="card">
            <h2>📜 രജിസ്റ്റർ ചെയ്ത മദ്രസകൾ</h2>
            <div className="table-responsive-wrapper" style={{ marginTop: '15px' }}>
              <table>
                <thead>
                  <tr>
                    <th>പേര്</th>
                    <th>രജിസ്റ്റർ നമ്പർ</th>
                    <th>സ്ഥലം</th>
                    <th>അഡ്മിൻ പാസ്‌വേർഡ്</th>
                    <th>വ്യൂവേഴ്സ് പാസ്‌വേർഡ്</th>
                    <th>സ്റ്റാറ്റസ്</th>
                    <th>നിയന്ത്രണം</th>
                  </tr>
                </thead>
                <tbody>
                  {superMadrasas.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ color: '#64748b', fontStyle: 'italic' }}>മദ്രസകൾ ഒന്നും രജിസ്റ്റർ ചെയ്തിട്ടില്ല.</td>
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
              <p>Reg No: {loggedInMadrasa ? loggedInMadrasa.regNumber : ''} | {loggedInMadrasa ? loggedInMadrasa.place : ''} ({loginRole} MODE)</p>
            </div>
            <button onClick={() => { setCurrentScreen('LOGIN'); setLoggedInMadrasa(null); }} className="btn-logout-top">ലോഗ് ഔട്ട്</button>
          </header>

          {/* ---------------- 🎯 TAB 1: SCOREBOARD ---------------- */}
          {activeTab === 'SCOREBOARD' && (
            <div className="card animate-tab scoreboard-main-card">
              <div className="scoreboard-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', margin: '0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>📊 ലൈവ് സ്കോർബോർഡ്</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>തത്സമയ പോയിന്റ് നില (Live Points)</p>
                  </div>
                  <div className="live-badge">
                    <span className="live-dot"></span> LIVE
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                {teams.length === 0 ? <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>ടീമുകൾ ഒന്നും ചേർത്തിട്ടില്ല. മാസ്റ്റർ സെറ്റിങ്സിൽ പോയി ടീമുകൾ ആഡ് ചെയ്യുക.</p> :
                  <div className="live-leaderboard">
                    {(() => {
                      const sortedTeams = [...teams].sort((a, b) => getTeamTotalPoints(b.id) - getTeamTotalPoints(a.id));
                      const maxPts = sortedTeams.length > 0 ? getTeamTotalPoints(sortedTeams[0].id) : 0;
                      const graphMax = maxPts > 0 ? maxPts : 10;

                      return sortedTeams.map((t, idx) => {
                        const totalPts = getTeamTotalPoints(t.id);
                        const barWidth = Math.max(8, (totalPts / graphMax) * 100); 
                        const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
                        const badgeIcon = idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅';
                        
                        return (
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
              <h2 style={{ marginBottom: '18px' }}>🏆 ഫലങ്ങൾ (Results)</h2>

              {/* Results Card Grid Navigation */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { key: 'PROGRAM_WINNERS', icon: '🏆', label: 'പ്രോഗ്രാം വിജയികൾ', sub: 'Program Winners', grad: 'linear-gradient(135deg, #f59e0b, #d97706)', actBg: '#fffbeb', actBorder: '#fcd34d' },
                  { key: 'STUDENT_REPORT',  icon: '🔍', label: 'വിദ്യാർത്ഥി റിപ്പോർട്ട്', sub: 'Student Report', grad: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', actBg: '#eff6ff', actBorder: '#93c5fd' },
                  { key: 'RESULTS_HISTORY', icon: '📜', label: 'പ്രഖ്യാപിച്ച ഫലങ്ങൾ', sub: 'Results History', grad: 'linear-gradient(135deg, #10b981, #047857)', actBg: '#ecfdf5', actBorder: '#6ee7b7' },
                  { key: 'CHAMPIONS',       icon: '🏅', label: 'ചാമ്പ്യൻ', sub: 'Champions', grad: 'linear-gradient(135deg, #7c3aed, #4c1d95)', actBg: '#f5f3ff', actBorder: '#c4b5fd' },
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
                      <div style={{ fontSize: '10px', color: isActive ? '#64748b' : '#94a3b8', fontWeight: '500' }}>{tab.sub}</div>
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
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '4px' }}>കാറ്റഗറി</label>
                    <select className="settings-input" value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setFilterProg(''); }}>
                      <option value="">-- തിരഞ്ഞെടുക്കുക --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Program Filter */}
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '4px' }}>പ്രോഗ്രാം</label>
                    <select className="settings-input" value={filterProg} onChange={(e) => setFilterProg(e.target.value)} disabled={!filterCat}>
                      <option value="">-- തിരഞ്ഞെടുക്കുക --</option>
                      {programs.filter(p => String(p.catid || p.catId || '') === String(filterCat)).map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                    </select>
                  </div>

                  {/* Gender Filter */}
                  <div style={{ flex: '1 1 150px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', display: 'block', marginBottom: '4px' }}>ലിംഗഭേദം</label>
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
                    return (
                      <div key={result.id} style={{ background: gradient, borderRadius: '18px', padding: '20px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: `3px solid ${borderColor}`, animation: 'fadeInTab 0.5s ease' }}>
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '70px', opacity: 0.15 }}>{medal}</div>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{medal}</div>
                        <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, marginBottom: '6px' }}>{result.place}</div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '4px 10px', display: 'inline-block', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>#{regPart}</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '4px', lineHeight: 1.3 }}>{namePart}</div>
                        <div style={{ fontSize: '12px', opacity: 0.85 }}>ടീം: <b>{result.teamname || result.teamName || '-'}</b></div>
                        <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{(result.studentgender || result.studentGender) === 'BOY' ? '👦 Boy' : '👧 Girl'}</div>
                      </div>
                    );
                  };

                  return (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                        <span style={{ background: 'linear-gradient(135deg, #1e1b4b, #3730a3)', color: 'white', padding: '8px 20px', borderRadius: '20px', fontWeight: '800', fontSize: '14px' }}>🏆 {progObj ? progObj.name : ''}</span>
                      </div>
                      {progResults.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: '20px' }}>ഈ പ്രോഗ്രാമിൽ ഫലങ്ങൾ ഇല്ല.</p>
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
                  <input type="text" className="settings-input" placeholder="രജിസ്റ്റർ നമ്പർ അടിക്കുക..." value={searchRegNo} onChange={(e) => setSearchRegNo(e.target.value)} style={{ maxWidth: '400px' }} />
                </div>

                {searchRegNo.trim() && (() => {
                  const matchedStudent = students.find(s => String(s.regno || s.regNo || '').toLowerCase() === searchRegNo.trim().toLowerCase());
                  if (!matchedStudent) return <p style={{ color: '#ef4444', marginTop: '15px', fontWeight: '600' }}>ഈ രജിസ്റ്റർ നമ്പരിൽ വിദ്യാർത്ഥിയെ കണ്ടെത്താനായില്ല.</p>;

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
                    <p style='margin-top:10px;opacity:0.85'>ടീം: ${teamObj ? teamObj.name : '' || '-'} | കാറ്റഗറി: ${catObj ? catObj.name : '' || '-'} | ${matchedStudent.gender === 'BOY' ? 'Boy 👦' : 'Girl 👧'}</p>
                    </div>
                    <table><thead><tr><th>മത്സരം</th><th>കാറ്റഗറി</th><th>സ്ഥാനം</th><th>ഗ്രേഡ്</th><th>പോയിന്റ്</th></tr></thead><tbody>${rows}</tbody></table>
                    <p style='margin-top:20px;color:#64748b;font-size:13px'>ആകെ പോയിന്റ്: <b>${sResults.reduce((s, r) => s + r.points, 0)}</b></p>
                    </body></html>`);
                    printWindow.document.close();
                    printWindow.print();
                  };

                  return (
                    <div style={{ marginTop: '20px' }}>
                      {/* Student Info Card */}
                      <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #3730a3)', borderRadius: '20px', padding: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '100px', opacity: 0.08 }}>🏆</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '2px' }}>വിദ്യാർത്ഥി റിപ്പോർട്ട്</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', marginTop: '8px' }}>{matchedStudent.name}</div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Reg: {sRegNo}</span>
                          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>ടീം: {teamObj ? teamObj.name : '' || '-'}</span>
                          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{catObj ? catObj.name : '' || '-'}</span>
                          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{matchedStudent.gender === 'BOY' ? '👦 Boy' : '👧 Girl'}</span>
                        </div>
                        <div style={{ fontSize: '36px', fontWeight: '900', color: '#fbbf24', marginTop: '12px' }}>{sResults.reduce((s, r) => s + r.points, 0)} <span style={{ fontSize: '16px', color: '#94a3b8' }}>Total Points</span></div>
                      </div>

                      {/* Results */}
                      {sResults.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: '20px' }}>ഫലങ്ങൾ ഒന്നും ഇല്ല.</p>
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
                                <div style={{ fontSize: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '3px 8px', display: 'inline-block', fontWeight: '700' }}>{r.place} | {(r.grade === '-' || r.grade === 'No') ? 'No Grade' : r.grade} | {r.points} Pts</div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Download Button */}
                      <button onClick={printReport} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#78350f', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>
                        📥 റിപ്പോർട്ട് ഡൗൺലോഡ് / പ്രിന്റ്ട് ചെയ്യുക
                      </button>
                    </div>
                  );
                })()}
              </div>
              )}

              {/* ── Section 3: Results History Table ── */}
              {resultsSubTab === 'RESULTS_HISTORY' && (
              <div>
                <div className="table-responsive-wrapper" style={{ marginTop: '15px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>മത്സരം</th><th>ഇനം</th><th>കാറ്റഗറി</th><th>രജിസ്റ്റർ നമ്പർ</th><th>വിദ്യാർത്ഥി</th><th>ലിംഗഭേദം</th><th>ടീം</th><th>സ്ഥാനം</th><th>ഗ്രേഡ്</th><th>പോയിന്റ്</th>{loginRole === 'ADMIN' && <th>ഒഴിവാക്കുക</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {resultsList.length === 0 ? <tr><td colSpan="11">ഫലങ്ങൾ ഒന്നും ഇതുവരെ പ്രഖ്യാപിച്ചിട്ടില്ല.</td></tr> :
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
              </div>
              )}

              {/* ── Section 4: Champion Section ── */}
              {resultsSubTab === 'CHAMPIONS' && (
              <div style={{ marginTop: '10px' }}>

                {/* Category Selector */}
                <div style={{ marginTop: '15px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af', display: 'block', marginBottom: '6px' }}>കാറ്റഗറി തിരഞ്ഞെടുക്കുക</label>
                  <select className="settings-input" value={champCat} onChange={(e) => { setChampCat(e.target.value); setChampGender('BOYS'); }}>
                    <option value="">-- കാറ്റഗറി തിരഞ്ഞെടുക്കുക --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Gender Tabs */}
                {champCat && (
                  <div style={{ marginTop: '15px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', display: 'block', marginBottom: '6px' }}>വിഭാഗം</label>
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
                      ഈ കാറ്റഗറിയിൽ / വിഭാഗത്തിൽ ഫലങ്ങൾ ഒന്നും ഇല്ല.
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
                              background: cfg.gradient, borderRadius: '20px', padding: '22px 20px',
                              color: 'white', position: 'relative', overflow: 'hidden',
                              boxShadow: '0 10px 35px rgba(0,0,0,0.25)',
                              border: `3px solid ${cfg.border}`,
                              animation: 'fadeInTab 0.5s ease'
                            }}>
                              <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '80px', opacity: 0.12 }}>{cfg.medal}</div>
                              <div style={{ fontSize: '36px', marginBottom: '8px' }}>{cfg.medal}</div>
                              <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, marginBottom: '6px' }}>{cfg.label}</div>
                              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '3px 10px', display: 'inline-block', fontSize: '11px', fontWeight: '700', marginBottom: '8px' }}>#{student.regPart}</div>
                              <div style={{ fontSize: '19px', fontWeight: '900', marginBottom: '6px', lineHeight: 1.3 }}>{student.namePart}</div>
                              <div style={{ fontSize: '12px', opacity: 0.85 }}>ടീം: <b>{student.teamname}</b></div>
                              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>{student.studentgender === 'BOY' ? '👦 Boy' : '👧 Girl'}</div>
                              <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '6px 12px', display: 'inline-block', fontWeight: '800', fontSize: '16px' }}>⭐ {student.totalPoints} Pts</div>
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

          {/* ---------------- 🎯 TAB 3: MASTER SETTINGS ---------------- */}
          {activeTab === 'SETTINGS' && (
            <div className="card animate-tab">
              <h2>⚙️ മാസ്റ്റർ സെറ്റിങ്സ് (Admin Control Panel)</h2>

              {loginRole !== 'ADMIN' ? (
                <div style={{ minHeight: '200px' }}></div>
              ) : (
                <div>
                  {/* Settings sub tab navigation */}
                  <div className="sub-tab-nav">
                    <button className={`sub-nav-item ${settingsSubTab === 'TEAMS' ? 'active' : ''}`} onClick={() => setSettingsSubTab('TEAMS')}>🚩 ടീമുകൾ</button>
                    <button className={`sub-nav-item ${settingsSubTab === 'CATEGORIES' ? 'active' : ''}`} onClick={() => setSettingsSubTab('CATEGORIES')}>📂 കാറ്റഗറികൾ</button>
                    <button className={`sub-nav-item ${settingsSubTab === 'STUDENTS' ? 'active' : ''}`} onClick={() => setSettingsSubTab('STUDENTS')}>🧑‍🎓 വിദ്യാർത്ഥികൾ</button>
                    <button className={`sub-nav-item ${settingsSubTab === 'PROGRAMS' ? 'active' : ''}`} onClick={() => setSettingsSubTab('PROGRAMS')}>🏆 പ്രോഗ്രാമുകൾ</button>
                    <button className={`sub-nav-item ${settingsSubTab === 'MARK_ENTRY' ? 'active' : ''}`} onClick={() => setSettingsSubTab('MARK_ENTRY')}>📝 മാർക്ക് എൻട്രി</button>
                    <button className={`sub-nav-item ${settingsSubTab === 'POINTS' ? 'active' : ''}`} onClick={() => setSettingsSubTab('POINTS')}>⚙️ പോയിന്റ് ഘടന</button>
                  </div>

                  <div className="settings-content">
                    {/* TEAMS SUB-TAB */}
                    {settingsSubTab === 'TEAMS' && (
                      <div className="settings-card-container">
                        <div className="settings-form-box">
                          <h3>🚩 പുതിയ ടീം ചേർക്കുക</h3>
                          <form onSubmit={handleAddTeam} className="settings-form">
                            <input type="text" className="settings-input" placeholder="Team Name (ഉദാ: Team A)" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required />
                            <button type="submit" className="btn-add-action">ചേർക്കുക (Add Team)</button>
                          </form>
                        </div>
                        <div className="settings-list-box">
                          <h3>📜 നിലവിലുള്ള ടീമുകൾ</h3>
                          {teams.length === 0 ? <p style={{ color: '#666', fontStyle: 'italic' }}>ടീമുകൾ ഒന്നും ചേർത്തിട്ടില്ല.</p> : (
                            teams.map(t => (
                              <div key={t.id} className="settings-item-row">
                                {editingTeamId === t.id ? (
                                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <input type="text" className="settings-input" value={editingTeamName} onChange={e => setEditingTeamName(e.target.value)} />
                                    <button onClick={handleSaveTeamEdit} className="btn-add-action" style={{ width: 'auto', padding: '8px 12px', background: 'green' }}>Save</button>
                                    <button onClick={() => setEditingTeamId(null)} className="btn-add-action" style={{ width: 'auto', padding: '8px 12px', background: 'gray' }}>Cancel</button>
                                  </div>
                                ) : (
                                  <>
                                    <span>{t.name}</span>
                                    <div>
                                      <button onClick={() => { setEditingTeamId(t.id); setEditingTeamName(t.name); }} className="settings-action-btn" title="Edit">✏️</button>
                                      <button onClick={() => handleDeleteTeam(t.id)} className="settings-action-btn" title="Delete">❌</button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* CATEGORIES SUB-TAB */}
                    {settingsSubTab === 'CATEGORIES' && (
                      <div className="settings-card-container">
                        <div className="settings-form-box">
                          <h3>📂 പുതിയ കാറ്റഗറി ചേർക്കുക</h3>
                          <form onSubmit={handleAddCategory} className="settings-form">
                            <input type="text" className="settings-input" placeholder="Category Name (ഉദാ: Junior)" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                            <input type="text" className="settings-input" placeholder="ഏതൊക്കെ ക്ലാസ്? (ഉദാ: 1 മുതൽ 4 വരെ)" value={newCatClassRange} onChange={(e) => setNewCatClassRange(e.target.value)} />
                            <button type="submit" className="btn-add-action">ചേർക്കുക (Add Category)</button>
                          </form>
                        </div>
                        <div className="settings-list-box">
                          <h3>📜 നിലവിലുള്ള കാറ്റഗറികൾ</h3>
                          {categories.length === 0 ? <p style={{ color: '#666', fontStyle: 'italic' }}>കാറ്റഗറികൾ ഒന്നും ചേർത്തിട്ടില്ല.</p> : (
                            categories.map(c => (
                              <div key={c.id} className="settings-item-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                                {editingCatId === c.id ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                                    <input type="text" className="settings-input" value={editingCatName} onChange={e => setEditingCatName(e.target.value)} placeholder="Category Name" />
                                    <input type="text" className="settings-input" value={editingCatClassRange} onChange={e => setEditingCatClassRange(e.target.value)} placeholder="ഏതൊക്കെ ക്ലാസ്? (ഉദാ: 1 മുതൽ 4 വരെ)" />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button onClick={handleSaveCatEdit} className="btn-add-action" style={{ width: 'auto', padding: '8px 12px', background: 'green' }}>Save</button>
                                      <button onClick={() => setEditingCatId(null)} className="btn-add-action" style={{ width: 'auto', padding: '8px 12px', background: 'gray' }}>Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div>
                                      <span style={{ fontWeight: '600' }}>{c.name}</span>
                                      {c.classrange && (
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>📚 ക്ലാസ്: {c.classrange}</div>
                                      )}
                                    </div>
                                    <div>
                                      <button onClick={() => { setEditingCatId(c.id); setEditingCatName(c.name); setEditingCatClassRange(c.classrange || ''); }} className="settings-action-btn" title="Edit">✏️</button>
                                      <button onClick={() => handleDeleteCategory(c.id)} className="settings-action-btn" title="Delete">❌</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* STUDENTS SUB-TAB */}
                    {settingsSubTab === 'STUDENTS' && (
                      <div className="settings-card-container">
                        <div className="settings-form-box">
                          <h3>🧑‍🎓 പുതിയ വിദ്യാർത്ഥിയെ ചേർക്കുക</h3>
                          <form onSubmit={handleAddStudent} className="settings-form">
                            <input type="text" className="settings-input" placeholder="വിദ്യാർത്ഥിയുടെ പേര്" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} required />
                            <input type="text" className="settings-input" placeholder="രജിസ്റ്റർ നമ്പർ / ചെസ്റ്റ് നമ്പർ" value={studentRegNo} onChange={(e) => setStudentRegNo(e.target.value)} required />

                            <select className="settings-input" value={selectedStudentTeam} onChange={(e) => setSelectedStudentTeam(e.target.value)} required>
                              <option value="">ടീം തിരഞ്ഞെടുക്കുക</option>
                              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>

                            <select className="settings-input" value={selectedStudentCat && studentGender ? `${selectedStudentCat}_${studentGender}` : ''} onChange={(e) => {
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
                            </select>

                            <button type="submit" className="btn-add-action">ചേർക്കുക (Add Student)</button>
                          </form>
                        </div>
                        <div className="settings-list-box">
                          <h3>📜 രജിസ്റ്റർ ചെയ്ത വിദ്യാർത്ഥികൾ ({students.length})</h3>
                          {students.length === 0 ? <p style={{ color: '#666', fontStyle: 'italic' }}>കുട്ടികൾ ആരും രജിസ്റ്റർ ചെയ്തിട്ടില്ല.</p> : (
                            students.map(s => {
                              const sRegNo = s.regno || s.regNo || '';
                              const sTeamId = s.teamid || s.teamId || '';
                              const sCatId = s.catid || s.catId || '';
                              const teamObj = teams.find(t => String(t.id) === String(sTeamId));
                              const catObj = categories.find(c => String(c.id) === String(sCatId));

                              return (
                                <div key={s.id} className="settings-item-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                                  {editingStudentId === s.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <input type="text" className="settings-input" value={editingStudentData.name || ''} onChange={e => setEditingStudentData({ ...editingStudentData, name: e.target.value })} placeholder="പേര്" />
                                      <input type="text" className="settings-input" value={editingStudentData.regno || editingStudentData.regNo || ''} onChange={e => setEditingStudentData({ ...editingStudentData, regno: e.target.value, regNo: e.target.value })} placeholder="രജിസ്റ്റർ നമ്പർ" />

                                      <select className="settings-input" value={editingStudentData.teamid || editingStudentData.teamId || ''} onChange={e => setEditingStudentData({ ...editingStudentData, teamid: e.target.value, teamId: e.target.value })}>
                                        <option value="">ടീം തിരഞ്ഞെടുക്കുക</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                      </select>

                                      <select className="settings-input" value={editingStudentData.catid && editingStudentData.gender ? `${editingStudentData.catid || editingStudentData.catId}_${editingStudentData.gender}` : ''} onChange={e => {
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
                                      </select>

                                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        <button onClick={handleSaveStudentEdit} className="btn-add-action" style={{ width: 'auto', padding: '8px 12px', background: 'green' }}>Save</button>
                                        <button onClick={() => setEditingStudentId(null)} className="btn-add-action" style={{ width: 'auto', padding: '8px 12px', background: 'gray' }}>Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                      <div>
                                        <strong>{sRegNo}</strong> - {s.name} ({s.gender === 'BOY' ? '👦' : '👧'})
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                          ടീം: {teamObj ? teamObj.name : 'Unknown'} | കാറ്റഗറി: {catObj ? catObj.name : 'Unknown'}
                                        </div>
                                      </div>
                                      <div>
                                        <button onClick={() => startEditStudent(s)} className="settings-action-btn" title="Edit">✏️</button>
                                        <button onClick={() => handleDeleteStudent(s.id)} className="settings-action-btn" title="Delete">❌</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* PROGRAMS SUB-TAB */}
                    {settingsSubTab === 'PROGRAMS' && (
                      <div className="settings-card-container">
                        <div className="settings-form-box">
                          <h3>🏆 പുതിയ മത്സരം (Program) ചേർക്കുക</h3>
                          <form onSubmit={handleAddProgram} className="settings-form">
                            <input type="text" className="settings-input" placeholder="മത്സരത്തിന്റെ പേര് (ഉദാ: പ്രസംഗം)" value={newProgName} onChange={(e) => setNewProgName(e.target.value)} required />
                            <input type="text" className="settings-input" placeholder="മത്സര കോഡ് (ഉദാ: P101)" value={newProgCode} onChange={(e) => setNewProgCode(e.target.value)} required />

                            <select className="settings-input" value={selectedProgCat && progGender ? `${selectedProgCat}_${progGender}` : ''} onChange={(e) => {
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
                            </select>

                            <button type="submit" className="btn-add-action">ചേർക്കുക (Add Program)</button>
                          </form>
                        </div>
                        <div className="settings-list-box">
                          <h3>📜 പ്രോഗ്രാമുകൾ ({programs.length})</h3>
                          {programs.length === 0 ? <p style={{ color: '#666', fontStyle: 'italic' }}>പ്രോഗ്രാമുകൾ ഒന്നും ചേർത്തിട്ടില്ല.</p> : (
                            programs.map(p => {
                              const pCatId = p.catid || p.catId || '';
                              const catObj = categories.find(c => String(c.id) === String(pCatId));
                              return (
                                <div key={p.id} className="settings-item-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                                  {editingProgId === p.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <input type="text" className="settings-input" value={editingProgData.name || ''} onChange={e => setEditingProgData({ ...editingProgData, name: e.target.value })} placeholder="പേര്" />
                                      <input type="text" className="settings-input" value={editingProgData.code || ''} onChange={e => setEditingProgData({ ...editingProgData, code: e.target.value })} placeholder="കോഡ്" />

                                      <select className="settings-input" value={editingProgData.catid ? `${editingProgData.catid || editingProgData.catId}_${(editingProgData.type || '').includes('BOY') ? 'BOY' : (editingProgData.type || '').includes('GIRL') ? 'GIRL' : 'COMMON'}` : ''} onChange={e => {
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
                                      </select>

                                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        <button onClick={handleSaveProgEdit} className="btn-add-action" style={{ width: 'auto', padding: '8px 12px', background: 'green' }}>Save</button>
                                        <button onClick={() => setEditingProgId(null)} className="btn-add-action" style={{ width: 'auto', padding: '8px 12px', background: 'gray' }}>Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                      <div>
                                        <strong>{p.code}</strong> - {p.name}
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                          കാറ്റഗറി: {catObj ? catObj.name : 'Unknown'} | വിഭാഗം: {(p.type || '').includes('BOY') ? 'Boys 👦' : (p.type || '').includes('GIRL') ? 'Girls 👧' : 'Common 🚻'} | ഇനം: {(p.type || '').includes('GROUP') ? 'Group 👥' : 'Single 👤'}
                                        </div>
                                      </div>
                                      <div>
                                        <button onClick={() => { setEditingProgId(p.id); setEditingProgData({ ...p }); }} className="settings-action-btn" title="Edit">✏️</button>
                                        <button onClick={() => handleDeleteProgram(p.id)} className="settings-action-btn" title="Delete">❌</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* MARK_ENTRY SUB-TAB */}
                    {settingsSubTab === 'MARK_ENTRY' && (
                      <div className="settings-card-container">
                        <div className="settings-form-box">
                          <h3>📝 മാർക്ക് എൻട്രി (Mark Entry System)</h3>
                          <form onSubmit={handleAddResult} className="settings-form">

                            {/* Step 1: Category & Gender */}
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
                            </div>

                            {/* Step 2: Program (filtered by category and gender) */}
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
                            </div>

                            {/* Step 3: Student (filtered by category & gender, supporting 'General') */}
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
                                      const teamName = (teams.find(t => String(t.id) === String(sTeamId)) || {}).name || '';
                                      const catName = (categories.find(c => String(c.id) === String(s.catid || s.catId)) || {}).name || '';
                                      return <option key={s.id} value={s.id}>{sRegNo} - {s.name} ({s.gender === 'BOY' ? '👦' : '👧'}) [{teamName}] {isGeneral ? `(${catName})` : ''}</option>;
                                    });
                                })()}
                              </select>
                            </div>

                            {/* Step 4: Place & Grade */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <select className="settings-input" value={selectedPlace} onChange={(e) => setSelectedPlace(e.target.value)}>
                                <option value="1">ഒന്നാം സ്ഥാനം (First)</option>
                                <option value="2">രണ്ടാം സ്ഥാനം (Second)</option>
                                <option value="3">മൂന്നാം സ്ഥാനം (Third)</option>
                                <option value="0">സ്ഥാനമില്ല (No Place)</option>
                              </select>
                              <select className="settings-input" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                                <option value="A">A Grade</option>
                                <option value="B">B Grade</option>
                                <option value="C">C Grade</option>
                                <option value="No">No Grade</option>
                              </select>
                            </div>
                            <button type="submit" className="btn-add-action" style={{ background: '#e21c34' }}>💾 Save Result</button>                          </form>
                        </div>
                      </div>
                    )}

                    {/* POINTS SETUP SUB-TAB */}
                    {settingsSubTab === 'POINTS' && (
                      <div className="settings-card-container">
                        <div className="settings-form-box">
                          <h3>⚙️ പോയിന്റ് ഘടന രൂപകൽപ്പന ചെയ്യുക</h3>
                          <form onSubmit={handleSavePoints} className="settings-form">
                            <h5 style={{ margin: '5px 0', color: '#0f766e' }}>വ്യക്തിഗത ഇനങ്ങൾ (Single Events Points):</h5>
                            <div className="points-grid-setup">
                              <div className="points-setup-card">
                                <label>ഒന്നാം സ്ഥാനം</label>
                                <input type="number" className="settings-input" value={pointSystem.p1} onChange={e => setPointSystem({ ...pointSystem, p1: e.target.value })} required />
                              </div>
                              <div className="points-setup-card">
                                <label>രണ്ടാം സ്ഥാനം</label>
                                <input type="number" className="settings-input" value={pointSystem.p2} onChange={e => setPointSystem({ ...pointSystem, p2: e.target.value })} required />
                              </div>
                              <div className="points-setup-card">
                                <label>മൂന്നാം സ്ഥാനം</label>
                                <input type="number" className="settings-input" value={pointSystem.p3} onChange={e => setPointSystem({ ...pointSystem, p3: e.target.value })} required />
                              </div>
                            </div>
                            <div className="points-grid-setup">
                              <div className="points-setup-card">
                                <label>A Grade</label>
                                <input type="number" className="settings-input" value={pointSystem.gA} onChange={e => setPointSystem({ ...pointSystem, gA: e.target.value })} required />
                              </div>
                              <div className="points-setup-card">
                                <label>B Grade</label>
                                <input type="number" className="settings-input" value={pointSystem.gB} onChange={e => setPointSystem({ ...pointSystem, gB: e.target.value })} required />
                              </div>
                              <div className="points-setup-card">
                                <label>C Grade</label>
                                <input type="number" className="settings-input" value={pointSystem.gC} onChange={e => setPointSystem({ ...pointSystem, gC: e.target.value })} required />
                              </div>
                            </div>

                            <h5 style={{ margin: '5px 0', color: '#ef4444' }}>ഗ്രൂപ്പ് ഇനങ്ങൾ (Group Events Points):</h5>
                            <div className="points-grid-setup">
                              <div className="points-setup-card">
                                <label>ഒന്നാം സ്ഥാനം</label>
                                <input type="number" className="settings-input" value={pointSystem.gp1} onChange={e => setPointSystem({ ...pointSystem, gp1: e.target.value })} required />
                              </div>
                              <div className="points-setup-card">
                                <label>രണ്ടാം സ്ഥാനം</label>
                                <input type="number" className="settings-input" value={pointSystem.gp2} onChange={e => setPointSystem({ ...pointSystem, gp2: e.target.value })} required />
                              </div>
                              <div className="points-setup-card">
                                <label>മൂന്നാം സ്ഥാനം</label>
                                <input type="number" className="settings-input" value={pointSystem.gp3} onChange={e => setPointSystem({ ...pointSystem, gp3: e.target.value })} required />
                              </div>
                            </div>
                            <div className="points-grid-setup">
                              <div className="points-setup-card">
                                <label>A Grade</label>
                                <input type="number" className="settings-input" value={pointSystem.gpA} onChange={e => setPointSystem({ ...pointSystem, gpA: e.target.value })} required />
                              </div>
                              <div className="points-setup-card">
                                <label>B Grade</label>
                                <input type="number" className="settings-input" value={pointSystem.gpB} onChange={e => setPointSystem({ ...pointSystem, gpB: e.target.value })} required />
                              </div>
                              <div className="points-setup-card">
                                <label>C Grade</label>
                                <input type="number" className="settings-input" value={pointSystem.gpC} onChange={e => setPointSystem({ ...pointSystem, gpC: e.target.value })} required />
                              </div>
                            </div>

                            <button type="submit" className="btn-add-action" style={{ background: '#0f766e' }}>പോയിന്റ് ഘടന മാറ്റുക (Save Points)</button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* 📱 NAVIGATION BOTTOM BAR */}
      {currentScreen === 'DASHBOARD' && (
        <nav className="bottom-nav-bar">
          <button className={`nav-tab-item ${activeTab === 'SCOREBOARD' ? 'active' : ''}`} onClick={() => setActiveTab('SCOREBOARD')}>
            <span className="nav-icon">📊</span><span>സ്കോർബോർഡ്</span>
          </button>
          <button className={`nav-tab-item ${activeTab === 'RECENT' ? 'active' : ''}`} onClick={() => setActiveTab('RECENT')}>
            <span className="nav-icon">📜</span><span>ഫലങ്ങൾ</span>
          </button>
          <button className={`nav-tab-item ${activeTab === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActiveTab('SETTINGS')}>
            <span className="nav-icon">⚙️</span><span>മാസ്റ്റർ സെറ്റിങ്സ്</span>
          </button>
        </nav>
      )}
    </div>
  )
}

export default App;
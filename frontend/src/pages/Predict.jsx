import React, { useState, useRef, useEffect } from 'react';
import { uploadAndPredict, searchPatients } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Upload, 
  Image as ImageIcon, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Heart,
  Calendar,
  AlertTriangle,
  ZoomIn,
  Download,
  Eye,
  Info,
  Search,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Activity,
  UserCheck,
  ShieldAlert
} from 'lucide-react';

const Predict = () => {
  const { user } = useAuth();
  // Wizard Steps: 1 = Patient Details, 2 = Retinal Upload, 3 = Inference Results
  const [step, setStep] = useState(1);

  // Auto skip to step 2 if the logged-in user is a patient
  useEffect(() => {
    if (user?.role === 'patient') {
      setStep(2);
    }
  }, [user]);

  // Step 1: Patient Selection/Creation State
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // New Patient Form State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  
  const [bmi, setBmi] = useState('');
  const [bmiCategory, setBmiCategory] = useState('');

  // Step 2: Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Step 3: Results State
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Interactive Zoom
  const [zoomScale, setZoomScale] = useState(2.2);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const zoomContainerRef = useRef(null);

  // Auto BMI calculation effect
  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const heightM = h / 100.0;
      const bmiVal = w / (heightM * heightM);
      const roundedBmi = bmiVal.toFixed(2);
      setBmi(roundedBmi);
      
      if (bmiVal < 18.5) setBmiCategory('Underweight');
      else if (bmiVal < 25.0) setBmiCategory('Normal');
      else if (bmiVal < 30.0) setBmiCategory('Overweight');
      else setBmiCategory('Obese');
    } else {
      setBmi('');
      setBmiCategory('');
    }
  }, [height, weight]);

  // Search autocomplete handler
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await searchPatients(searchQuery);
        setSearchResults(res.data);
      } catch (err) {
        console.error("Error searching patients:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClearSelectedPatient = () => {
    setSelectedPatient(null);
  };

  const handleNextToUpload = () => {
    if (activeTab === 'search' && !selectedPatient) {
      setError("Please search and select a patient first.");
      return;
    }
    if (activeTab === 'create') {
      if (!fullName || !age || !gender || !phone || !email || !height || !weight) {
        setError("Please fill out all required patient demographics.");
        return;
      }
    }
    setError('');
    setStep(2);
  };

  const handleBackToPatient = () => {
    setStep(1);
  };

  // Upload validation & preview
  const handleFileChange = (file) => {
    setError('');
    setResult(null);

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, JPEG, or PNG image.');
      return;
    }

    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handlePredict = async () => {
    if (!selectedFile) return;

    console.log("Submitting Patient:", {
      patient_name: user?.role === 'patient' ? (user?.full_name || user?.username) : (activeTab === 'search' ? selectedPatient?.full_name : fullName),
      age: user?.role === 'patient' ? user?.patient?.age : (activeTab === 'search' ? selectedPatient?.age : parseInt(age, 10)),
      gender: user?.role === 'patient' ? user?.patient?.gender : (activeTab === 'search' ? selectedPatient?.gender : gender),
      phone: user?.role === 'patient' ? user?.patient?.phone : (activeTab === 'search' ? selectedPatient?.phone : phone)
    });

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    if (user?.role === 'patient') {
      formData.append('patient_id', user.patient_id || (user.patient && user.patient.id));
    } else if (activeTab === 'search' && selectedPatient) {
      formData.append('patient_id', selectedPatient.id);
    } else {
      formData.append('full_name', fullName);
      formData.append('age', parseInt(age, 10));
      formData.append('gender', gender);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('height', parseFloat(height));
      formData.append('weight', parseFloat(weight));
      if (notes.trim()) formData.append('notes', notes);
    }

    try {
      const res = await uploadAndPredict(formData);
      setResult(res.data);
      setStep(3);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Inference engine error. Please ensure the backend is active.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async (predictionId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/report/${predictionId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) throw new Error('Failed to download report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `report_${predictionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report. Please try again.');
    }
  };

  const handleReset = () => {
    setSelectedPatient(null);
    setFullName('');
    setAge('');
    setGender('');
    setPhone('');
    setEmail('');
    setHeight('');
    setWeight('');
    setNotes('');
    setSelectedFile(null);
    setImagePreview(null);
    setResult(null);
    setError('');
    setStep(1);
    setActiveTab('search');
  };

  const handleMouseMoveZoom = (e) => {
    if (!zoomContainerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomCoords({ x, y });
  };

  const getRiskBadgeStyles = (level) => {
    switch (level) {
      case 'Healthy':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50';
      case 'Low Risk':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50';
      case 'Moderate Risk':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50';
      case 'High Risk':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-950/40 dark:text-slate-400 border border-slate-200 dark:border-slate-900/50';
    }
  };

  const getBmiBadgeStyles = (category) => {
    switch (category) {
      case 'Normal':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20';
      case 'Underweight':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20';
      case 'Overweight':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20';
      case 'Obese':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20';
      default:
        return '';
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-10rem)] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Retinal Fundus Image Scan
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Screen patients using AI-driven deep learning analysis on retinal scans to identify cardiovascular disease risk points.
          </p>
        </div>

        {/* Wizard Progress Steps Indicator */}
        <div className="flex justify-between items-center max-w-md mx-auto mb-8 relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0"></div>
          
          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center">
            <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border transition ${
              step >= 1 
                ? 'bg-teal-600 text-white border-teal-600' 
                : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}>
              1
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">Patient</span>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center">
            <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border transition ${
              step >= 2 
                ? 'bg-teal-600 text-white border-teal-600' 
                : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}>
              2
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">Retinal Upload</span>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center">
            <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border transition ${
              step >= 3 
                ? 'bg-teal-600 text-white border-teal-600' 
                : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}>
              3
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">Inference Results</span>
          </div>
        </div>

        {/* Warning Alert Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-xl mb-8 flex items-start space-x-3 text-amber-800 dark:text-amber-400 text-sm font-medium">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
          <span>
            This screening portal is for academic demonstration only. The classification models are trained on research retinal datasets and do not reflect certified clinical settings. Do not base medical decisions on these results.
          </span>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 p-4 rounded-xl mb-8 flex items-center space-x-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard step contents */}
        
        {/* Step 1: Patient Selection/Creation */}
        {step === 1 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
            
            {/* Tab Headers */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab('search'); setError(''); }}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'search'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Search Existing Patient
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('create'); setError(''); }}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'create'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Register New Patient
              </button>
            </div>

            {/* Tab: Search Patients */}
            {activeTab === 'search' && (
              <div className="space-y-6">
                {!selectedPatient ? (
                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Search Patient (ID, Name, or Phone)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Start typing to search (e.g. Jane, PAT-2026)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none text-sm"
                      />
                    </div>

                    {/* Suggestions list */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                        {searchResults.map((pat) => (
                          <button
                            key={pat.id}
                            type="button"
                            onClick={() => handleSelectPatient(pat)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-sm transition"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">{pat.full_name}</span>
                              <span className="text-xs text-slate-400 ml-2">({pat.gender}, {pat.age} yrs)</span>
                            </div>
                            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">{pat.patient_id}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                      <p className="text-xs text-slate-400 italic mt-2">No patients matching search criteria. Try another keyword or register them.</p>
                    )}
                  </div>
                ) : (
                  /* Selected Patient Confirmation Card */
                  <div className="bg-teal-50/50 dark:bg-teal-950/10 border border-teal-200 dark:border-teal-900/60 p-5 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm font-bold text-teal-800 dark:text-teal-300">Selected Active Patient</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSelectedPatient}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-500"
                      >
                        Change Patient
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 mb-0.5">Patient ID</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPatient.patient_id}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 mb-0.5">Full Name</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPatient.full_name}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 mb-0.5">Age / Gender</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPatient.age} / {selectedPatient.gender}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 mb-0.5">BMI / Category</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPatient.bmi} ({selectedPatient.bmi_category})</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 mb-0.5">Phone Number</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPatient.phone}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Create Patient */}
            {activeTab === 'create' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Age *</label>
                    <input
                      type="number"
                      placeholder="45"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. +123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Height (cm) *</label>
                    <input
                      type="number"
                      placeholder="170"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Weight (kg) *</label>
                    <input
                      type="number"
                      placeholder="70"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Auto BMI Display */}
                  <div className="flex items-end gap-2">
                    <div className="w-1/2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Calculated BMI</label>
                      <input
                        type="text"
                        value={bmi}
                        readOnly
                        placeholder="-"
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-300 font-bold focus:outline-none"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                      <span className={`block w-full text-center px-3.5 py-2 text-sm font-bold rounded-lg border border-slate-200/50 dark:border-slate-800/80 ${getBmiBadgeStyles(bmiCategory) || 'bg-slate-50 text-slate-400 dark:bg-slate-900/50'}`}>
                        {bmiCategory || 'Auto'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Medical History Notes (Optional)</label>
                  <textarea
                    placeholder="Provide any chronic diagnostics, comments, or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleNextToUpload}
              className="mt-8 w-full flex items-center justify-center py-3.5 px-4 border border-transparent font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md transition duration-150 text-sm"
            >
              <span>Proceed to Retinal Upload</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Retinal Image Upload */}
        {step === 2 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
            
            {/* Display active patient summary */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Screening Target Patient</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {user?.role === 'patient' ? (user?.full_name || user?.username) : (activeTab === 'search' ? selectedPatient?.full_name : fullName)}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  ({user?.role === 'patient' ? (user?.patient?.patient_id || 'Personal Account') : (activeTab === 'search' ? selectedPatient?.patient_id : 'New Patient Registry')})
                </span>
                {user?.role === 'patient' && user?.patient && (
                  <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>Age: <strong>{user.patient.age}</strong></span>
                    <span>Gender: <strong>{user.patient.gender}</strong></span>
                    <span>BMI: <strong>{user.patient.bmi} ({user.patient.bmi_category})</strong></span>
                    <span>Phone: <strong>{user.patient.phone}</strong></span>
                  </div>
                )}
              </div>
              {user?.role !== 'patient' && (
                <button
                  type="button"
                  onClick={handleBackToPatient}
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >
                  Change Patient Info
                </button>
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            {!imagePreview ? (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-slate-700/50'
                    : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  accept=".jpg,.jpeg,.png"
                />
                <Upload className="h-12 w-12 text-slate-400 mb-4 animate-bounce" />
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-lg">
                  Drag and drop retinal image here
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  or click to browse local files (PNG, JPG, JPEG up to 10MB)
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Selected Image Preview */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-inner flex justify-center items-center aspect-square max-h-[300px] mx-auto w-full">
                  <img
                    src={imagePreview}
                    alt="Retinal Fundus Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                    className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow transition"
                    title="Remove Image"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {/* Confirm upload action panel */}
                <div>
                  <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300 mb-4">
                    <ImageIcon className="h-5 w-5 text-teal-600" />
                    <span className="font-semibold max-w-[200px] truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    Confirm this is a centered, clear colored retinal fundus image before scanning. High noise or out-of-focus optics may corrupt the CNN inference model.
                  </p>
                  
                  <div className="flex gap-2">
                    {user?.role !== 'patient' && (
                      <button
                        onClick={handleBackToPatient}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center p-3 border border-slate-300 dark:border-slate-700 text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 transition"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={handlePredict}
                      disabled={isLoading}
                      className="flex-grow flex items-center justify-center py-3 px-4 border border-transparent font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 shadow disabled:opacity-50 transition duration-150"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                          <span>Processing Inference Pipeline...</span>
                        </div>
                      ) : (
                        <span>Run AI Predict Scan</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Diagnostic Results */}
        {step === 3 && result && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
            
            {/* Header banner */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Diagnostic Screening Assessment Complete</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{new Date(result.scan_date || result.timestamp).toLocaleString()}</span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">{result.scan_id || `SCAN-${result.id}`}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`http://localhost:8000/report/${result.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Report</span>
                </a>
                <button
                  onClick={() => handleDownloadReport(result.id, `${result.scan_id || `REPORT-${result.id}`}.pdf`)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Report PDF</span>
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8">
              
              {/* Diagnosis results summary row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                
                {/* Result Block */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 md:col-span-2">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Diagnostic Classification</p>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-xl font-black shadow-sm ${
                      result.prediction === "Healthy"
                        ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800"
                        : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800"
                    }`}>
                      {result.prediction === "Healthy" ? (
                        <CheckCircle2 className="h-6 w-6 mr-2 text-green-600 dark:text-green-400" />
                      ) : (
                        <Heart className="h-6 w-6 mr-2 text-red-600 dark:text-red-400 animate-pulse" />
                      )}
                      <span>{result.prediction}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center space-x-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Risk Level Category:</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${getRiskBadgeStyles(result.risk_level)}`}>
                      {result.risk_level || 'Healthy'}
                    </span>
                  </div>
                </div>

                {/* Confidence Block */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/85 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Classifier Confidence</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{result.confidence}%</p>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className={`h-full rounded-full ${result.prediction === 'Healthy' ? 'bg-green-500' : 'bg-red-500'}`} 
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Side-by-Side Sync-Zoom Images */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Interactive Sync-Zoom Comparison
                  </h4>
                  <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <ZoomIn className="h-3.5 w-3.5 text-slate-400" />
                      <span>Scale:</span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="3.5"
                      step="0.1"
                      value={zoomScale}
                      onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                      className="w-24 accent-teal-600"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6">{zoomScale}x</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8" ref={zoomContainerRef}>
                  
                  {/* Original Image */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Original Retinal Scan</span>
                    <div
                      className="relative overflow-hidden w-full aspect-square bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 cursor-crosshair group shadow-inner"
                      onMouseMove={handleMouseMoveZoom}
                      onMouseEnter={() => setIsZoomed(true)}
                      onMouseLeave={() => setIsZoomed(false)}
                    >
                      <img
                        src={`http://localhost:8000/${result.image_path}`}
                        alt="Original retinal scan"
                        className="max-h-full max-w-full object-contain w-full h-full select-none"
                        style={{
                          transform: isZoomed ? `scale(${zoomScale})` : 'scale(1)',
                          transformOrigin: isZoomed ? `${zoomCoords.x}% ${zoomCoords.y}%` : '50% 50%'
                        }}
                      />
                    </div>
                  </div>

                  {/* Heatmap Image */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">AI Attention (Grad-CAM)</span>
                    <div
                      className="relative overflow-hidden w-full aspect-square bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 cursor-crosshair group shadow-inner"
                      onMouseMove={handleMouseMoveZoom}
                      onMouseEnter={() => setIsZoomed(true)}
                      onMouseLeave={() => setIsZoomed(false)}
                    >
                      <img
                        src={`http://localhost:8000/${result.gradcam_image}`}
                        alt="Grad-CAM visual heatmap"
                        className="max-h-full max-w-full object-contain w-full h-full select-none"
                        style={{
                          transform: isZoomed ? `scale(${zoomScale})` : 'scale(1)',
                          transformOrigin: isZoomed ? `${zoomCoords.x}% ${zoomCoords.y}%` : '50% 50%'
                        }}
                      />
                    </div>
                  </div>

                </div>
                {isZoomed && (
                  <p className="text-center text-xs text-slate-400 mt-2">
                    * Cursor hovers pan both views in synchronization.
                  </p>
                )}
              </div>

              {/* Explainability legend details */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-8">
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5 text-teal-600" />
                  <span>Explainability Spectrum Legend</span>
                </h4>
                <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                    Grad-CAM maps gradients of the target class in the final convolutional layer. Colors indicate the regions influencing the CNN classifier's decision.
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low</span>
                    <div className="h-3.5 w-40 rounded bg-gradient-to-r from-blue-600 via-green-400 via-yellow-300 to-red-600 border border-slate-200 dark:border-slate-700"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center py-3.5 px-4 border border-slate-300 dark:border-slate-700 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition"
              >
                <span>Scan Another Patient</span>
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Predict;

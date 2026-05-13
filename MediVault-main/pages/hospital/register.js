import { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import {
  MdLocalHospital, MdVerifiedUser, MdHealthAndSafety,
} from 'react-icons/md';
import {
  FiArrowLeft, FiClock, FiMapPin, FiPhone, FiMail, FiHash, FiUpload,
  FiCheck, FiX, FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiGlobe,
  FiFileText, FiTrash2,
} from 'react-icons/fi';
import { FaHospital } from 'react-icons/fa';
import apiClient from '../../utils/api';
import ipfsService from '../../utils/ipfs';

// ── Constants ──────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const HOSPITAL_TYPES = [
  { value: 'private',    label: 'Private Hospital' },
  { value: 'government', label: 'Government Hospital' },
  { value: 'trust',      label: 'Trust Hospital' },
  { value: 'charitable', label: 'Charitable Hospital' },
  { value: 'clinic',     label: 'Clinic / Nursing Home' },
  { value: 'diagnostic', label: 'Diagnostic Centre' },
];

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_LABELS = {
  Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday',
  Fri:'Friday', Sat:'Saturday', Sun:'Sunday',
};

const DOCS_CONFIG = [
  { key:'registrationCert', label:'Hospital Registration Certificate', required:true,  accept:'.pdf',                hint:'PDF only · max 10 MB' },
  { key:'licenseCert',      label:'License Certificate',               required:true,  accept:'.pdf',                hint:'PDF only · max 10 MB' },
  { key:'addressProof',     label:'Address Proof',                     required:true,  accept:'.pdf,.jpg,.jpeg,.png',hint:'PDF/JPG/PNG · max 10 MB' },
  { key:'nabh',             label:'NABH / NABL Accreditation',         required:false, accept:'.pdf',                hint:'Optional · PDF only · max 10 MB' },
  { key:'taxReg',           label:'Tax Registration',                  required:false, accept:'.pdf',                hint:'Optional · PDF only · max 10 MB' },
];

// ── Validation helpers ─────────────────────────────────────────────────────────

const validatePhone  = (p) => /^\+91[2-9]\d{9}$/.test(p);
const validatePincode= (p) => /^\d{6}$/.test(p);
const validateGSTIN  = (g) => !g || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g);
const validateEmail  = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const validatePassword = (p) =>
  p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p);

const defaultHours = DAYS.reduce((acc, d) => ({
  ...acc,
  [d]: { open: d !== 'Sun', start: '09:00', end: '17:00' },
}), {});

// ── Shared CSS ─────────────────────────────────────────────────────────────────

const inputCls =
  'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm bg-white';

const SectionHeader = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="text-xs font-bold text-white">{num}</span>
    </div>
    <h3 className="text-base font-semibold text-gray-800">{label}</h3>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────

export default function HospitalRegisterPage() {
  const router  = useRouter();
  const [step,          setStep]         = useState('form'); // 'form' | 'pending'
  const [loading,       setLoading]      = useState(false);
  const [hospitalId,    setHospitalId]   = useState('');
  const [showPin,       setShowPin]      = useState(false);
  const [showPinConf,   setShowPinConf]  = useState(false);
  const [errors,        setErrors]       = useState({});

  // ── Form state ──
  const [form, setForm] = useState({
    // Section 1 — Basic Info
    name: '', hospitalType: '', registrationNumber: '', licenseNumber: '',
    gstin: '', yearEstablished: '', website: '', numberOfBeds: '',
    specialisations: '',
    // Section 2 — Contact
    email: '', phone: '+91', altPhone: '', emergencyPhone: '',
    // Section 3 — Address
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '',
    landmark: '', googleMapsLink: '',
    // Section 4 — Emergency
    emergencyAvailable: false,
    // Section 5 — Admin Credentials
    adminName: '', adminEmail: '', adminPhone: '+91',
    adminPin: '', adminPinConfirm: '', pinLength: '6',
  });

  // ── Working hours state ──
  const [workingHours, setWorkingHours] = useState(defaultHours);

  // ── Document upload state ──
  const [docFiles,     setDocFiles]     = useState({});
  const [docUrls,      setDocUrls]      = useState({});
  const [docUploading, setDocUploading] = useState({});
  const fileInputRefs = useRef({});

  // ── Handlers ──

  const update = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [field]: val }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const toggleDay = (day) =>
    setWorkingHours(p => ({ ...p, [day]: { ...p[day], open: !p[day].open } }));

  const updateHours = (day, key, val) =>
    setWorkingHours(p => ({ ...p, [day]: { ...p[day], [key]: val } }));

  const handleFilePick = async (docKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMB = 10;
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`File too large (max ${maxMB} MB)`);
      e.target.value = '';
      return;
    }

    setDocFiles(p => ({ ...p, [docKey]: file }));
    setDocUploading(p => ({ ...p, [docKey]: true }));

    try {
      const result = await ipfsService.uploadToIPFS(file, {
        name: `hospital-doc-${docKey}-${Date.now()}`,
        type: 'hospital_document',
      });
      setDocUrls(p => ({ ...p, [docKey]: result.url }));
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed. Try again.');
      setDocFiles(p => ({ ...p, [docKey]: null }));
      setDocUrls(p => ({ ...p, [docKey]: '' }));
      if (e.target) e.target.value = '';
    } finally {
      setDocUploading(p => ({ ...p, [docKey]: false }));
    }
  };

  const removeDoc = (docKey) => {
    setDocFiles(p => ({ ...p, [docKey]: null }));
    setDocUrls(p => ({ ...p, [docKey]: '' }));
    if (fileInputRefs.current[docKey]) fileInputRefs.current[docKey].value = '';
  };

  // ── Validation ──

  const validate = () => {
    const e = {};

    // Section 1
    if (!form.name.trim())               e.name               = 'Hospital name is required';
    if (!form.hospitalType)              e.hospitalType        = 'Hospital type is required';
    if (!form.registrationNumber.trim()) e.registrationNumber  = 'Registration number is required';
    if (form.gstin && !validateGSTIN(form.gstin)) e.gstin     = 'Invalid GSTIN format';
    if (form.yearEstablished && (isNaN(form.yearEstablished) || form.yearEstablished < 1800 || form.yearEstablished > new Date().getFullYear()))
      e.yearEstablished = 'Enter a valid year';
    if (form.numberOfBeds && (isNaN(form.numberOfBeds) || form.numberOfBeds < 0))
      e.numberOfBeds = 'Enter a valid number';

    // Section 2
    if (!form.email.trim())              e.email     = 'Email is required';
    else if (!validateEmail(form.email)) e.email     = 'Enter a valid email address';
    if (!form.phone.trim())              e.phone     = 'Phone is required';
    else if (!validatePhone(form.phone)) e.phone     = 'Enter valid +91XXXXXXXXXX number';
    if (form.altPhone && !validatePhone(form.altPhone))
      e.altPhone = 'Enter valid +91XXXXXXXXXX number';
    if (form.emergencyPhone && !validatePhone(form.emergencyPhone))
      e.emergencyPhone = 'Enter valid +91XXXXXXXXXX number';

    // Section 3
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address is required';
    if (!form.city.trim())         e.city         = 'City is required';
    if (!form.state)               e.state        = 'State is required';
    if (!form.pincode.trim())      e.pincode      = 'Pincode is required';
    else if (!validatePincode(form.pincode)) e.pincode = 'Pincode must be 6 digits';

    // Section 5 — Admin
    if (!form.adminName.trim())        e.adminName    = 'Admin name is required';
    if (!form.adminEmail.trim())       e.adminEmail   = 'Admin email is required';
    else if (!validateEmail(form.adminEmail)) e.adminEmail = 'Enter a valid email address';
    if (!form.adminPhone.trim())       e.adminPhone   = 'Admin phone is required';
    else if (!validatePhone(form.adminPhone)) e.adminPhone = 'Enter valid +91XXXXXXXXXX number';
    const pinLen = parseInt(form.pinLength) || 6;
    if (!form.adminPin)                e.adminPin     = 'PIN is required';
    else if (!/^\d+$/.test(form.adminPin))  e.adminPin = 'PIN must be numeric digits only';
    else if (form.adminPin.length !== pinLen) e.adminPin = `PIN must be exactly ${pinLen} digits`;
    if (!form.adminPinConfirm)         e.adminPinConfirm = 'Please confirm your PIN';
    else if (form.adminPin !== form.adminPinConfirm)
      e.adminPinConfirm = 'PINs do not match';

    // Section 6 — Required docs
    DOCS_CONFIG.filter(d => d.required).forEach(d => {
      if (!docUrls[d.key]) e[d.key] = `${d.label} is required`;
    });

    return e;
  };

  // ── Submit ──

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      // Scroll to first error
      const firstErrKey = Object.keys(errs)[0];
      document.getElementById(firstErrKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Build documents array
    const documents = DOCS_CONFIG
      .filter(d => docUrls[d.key])
      .map(d => ({ type: d.key, label: d.label, url: docUrls[d.key] }));

    setLoading(true);
    try {
      const res = await apiClient.post('/hospital/register', {
        // Basic
        name:               form.name.trim(),
        hospitalType:       form.hospitalType,
        registrationNumber: form.registrationNumber.trim(),
        licenseNumber:      form.licenseNumber.trim() || undefined,
        gstin:              form.gstin.trim()          || undefined,
        yearEstablished:    form.yearEstablished       ? parseInt(form.yearEstablished) : undefined,
        numberOfBeds:       form.numberOfBeds          ? parseInt(form.numberOfBeds)    : undefined,
        website:            form.website.trim()        || undefined,
        specialisations:    form.specialisations.trim()|| undefined,
        // Contact
        email:              form.email.trim(),
        phone:              form.phone.trim(),
        altPhone:           form.altPhone.trim()       || undefined,
        emergencyPhone:     form.emergencyPhone.trim() || undefined,
        // Address
        addressLine1:       form.addressLine1.trim(),
        addressLine2:       form.addressLine2.trim()   || undefined,
        city:               form.city.trim(),
        state:              form.state,
        pincode:            form.pincode.trim(),
        landmark:           form.landmark.trim()       || undefined,
        googleMapsLink:     form.googleMapsLink.trim() || undefined,
        // Working hours & emergency
        workingHours,
        emergencyAvailable: form.emergencyAvailable,
        // Documents
        documents,
        // Admin credentials
        adminName:          form.adminName.trim(),
        adminEmail:         form.adminEmail.trim(),
        adminPhone:         form.adminPhone.trim(),
        adminPin:           form.adminPin,
        pinLength:          parseInt(form.pinLength) || 6,
      });

      const id = res.data.data?.id || '';
      setHospitalId(id);

      // Write to localStorage so AdminDashboard can show it immediately
      try {
        localStorage.setItem('hospital_registration_pending', JSON.stringify({
          tempId: id,
          name: form.name.trim(),
          registrationNumber: form.registrationNumber.trim(),
          hospitalType: form.hospitalType,
          city: form.city.trim(),
          state: form.state,
          email: form.email.trim(),
          phone: form.phone.trim(),
          specialisations: form.specialisations.trim() || undefined,
          submittedAt: new Date().toISOString(),
          status: 'pending',
        }));
      } catch (_) {}

      toast.success('Registration submitted for verification!');
      setStep('pending');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──

  return (
    <>
      <Head><title>Register Hospital – MediVault</title></Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-800 to-blue-900 flex items-start justify-center p-4 py-8">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        </div>

        {/* Back to Home */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 border border-white border-opacity-30 text-white text-sm font-medium rounded-xl backdrop-blur-sm transition-all"
          >
            <FiArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>

        {/* Card */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 mt-12">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-2xl">
                <MdLocalHospital className="h-10 w-10 text-cyan-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-cyan-700">MediVault</h1>
            <p className="text-gray-500 text-sm mt-1">Hospital Registration</p>
          </div>

          {/* ── PENDING SCREEN ── */}
          {step === 'pending' && (
            <div className="text-center py-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <FiClock className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Registration Submitted Successfully!</h2>
              <p className="text-gray-600 leading-relaxed mb-6 max-w-md mx-auto">
                Your hospital registration is under review by our team. This usually takes{' '}
                <strong>2–3 working days</strong>. You will receive an SMS and email once a
                decision is made at <strong className="text-cyan-700">{form.adminEmail}</strong>.
              </p>

              <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-6 py-4 mb-6 inline-block text-left">
                <p className="text-xs text-gray-500 mb-1">Application Reference ID</p>
                <p className="text-lg font-bold text-cyan-700 tracking-wider">{hospitalId}</p>
                <p className="text-xs text-gray-400 mt-1">Save this ID for follow-up queries</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-6 text-sm text-gray-600 text-left space-y-1">
                <p><span className="font-medium">Hospital:</span> {form.name}</p>
                <p><span className="font-medium">Admin Email:</span> {form.adminEmail}</p>
                <p><span className="font-medium">Status check:</span>{' '}
                  <span className="text-cyan-600">/hospital/status/{hospitalId}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-md"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => router.push('/hospital/login')}
                  className="px-6 py-3 border-2 border-cyan-200 text-cyan-600 font-semibold rounded-xl hover:bg-cyan-50 transition-all"
                >
                  Sign In to Hospital Portal
                </button>
              </div>
            </div>
          )}

          {/* ── REGISTRATION FORM ── */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} noValidate className="space-y-8">

              {/* Info banner */}
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 flex gap-3">
                <MdVerifiedUser className="h-5 w-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-cyan-800 leading-relaxed">
                  After submission, a platform admin will verify your registration within 2–3 working days.
                  Once verified, your hospital dashboard will be activated.
                </p>
              </div>

              {/* ── SECTION 1 — Basic Information ── */}
              <div>
                <SectionHeader num="1" label="Basic Information" />
                <div className="space-y-4">
                  {/* Hospital Name */}
                  <div id="name">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Hospital Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <FaHospital className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={update('name')}
                        placeholder="Apollo Hospitals, AIIMS, etc."
                        className={`${inputCls} pl-10 ${errors.name ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Hospital Type */}
                  <div id="hospitalType">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Hospital Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.hospitalType}
                      onChange={update('hospitalType')}
                      className={`${inputCls} ${errors.hospitalType ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                    >
                      <option value="">Select type…</option>
                      {HOSPITAL_TYPES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    {errors.hospitalType && <p className="text-red-500 text-xs mt-1">{errors.hospitalType}</p>}
                  </div>

                  {/* Reg Number + License */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div id="registrationNumber">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Registration Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <FiHash className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={form.registrationNumber}
                          onChange={update('registrationNumber')}
                          placeholder="HOS/2024/XXXXX"
                          className={`${inputCls} pl-10 ${errors.registrationNumber ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                        />
                      </div>
                      {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number</label>
                      <input
                        type="text"
                        value={form.licenseNumber}
                        onChange={update('licenseNumber')}
                        placeholder="License / Approval No."
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* GSTIN + Year Established */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div id="gstin">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        GSTIN <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.gstin}
                        onChange={update('gstin')}
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={15}
                        className={`${inputCls} ${errors.gstin ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                      {errors.gstin && <p className="text-red-500 text-xs mt-1">{errors.gstin}</p>}
                    </div>
                    <div id="yearEstablished">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Year Established <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="number"
                        value={form.yearEstablished}
                        onChange={update('yearEstablished')}
                        placeholder="e.g. 1998"
                        min="1800"
                        max={new Date().getFullYear()}
                        className={`${inputCls} ${errors.yearEstablished ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                      {errors.yearEstablished && <p className="text-red-500 text-xs mt-1">{errors.yearEstablished}</p>}
                    </div>
                  </div>

                  {/* Website + Number of Beds */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Website <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <FiGlobe className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="url"
                          value={form.website}
                          onChange={update('website')}
                          placeholder="https://yourhospital.com"
                          className={`${inputCls} pl-10`}
                        />
                      </div>
                    </div>
                    <div id="numberOfBeds">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Number of Beds <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="number"
                        value={form.numberOfBeds}
                        onChange={update('numberOfBeds')}
                        placeholder="e.g. 200"
                        min="0"
                        className={`${inputCls} ${errors.numberOfBeds ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                      {errors.numberOfBeds && <p className="text-red-500 text-xs mt-1">{errors.numberOfBeds}</p>}
                    </div>
                  </div>

                  {/* Specialisations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Specialisations <span className="text-gray-400 font-normal">(comma-separated, optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.specialisations}
                      onChange={update('specialisations')}
                      placeholder="Cardiology, Orthopaedics, Neurology"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* ── SECTION 2 — Contact Details ── */}
              <div>
                <SectionHeader num="2" label="Contact Details" />
                <div className="space-y-4">
                  {/* Official Email */}
                  <div id="email">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Official Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={update('email')}
                        placeholder="admin@hospital.com"
                        className={`${inputCls} pl-10 ${errors.email ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  {/* Official Phone + Alternate Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div id="phone">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Official Phone <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={update('phone')}
                          placeholder="+91XXXXXXXXXX"
                          className={`${inputCls} pl-10 ${errors.phone ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div id="altPhone">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Alternate Phone <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          value={form.altPhone}
                          onChange={update('altPhone')}
                          placeholder="+91XXXXXXXXXX"
                          className={`${inputCls} pl-10 ${errors.altPhone ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                        />
                      </div>
                      {errors.altPhone && <p className="text-red-500 text-xs mt-1">{errors.altPhone}</p>}
                    </div>
                  </div>

                  {/* Emergency Phone */}
                  <div id="emergencyPhone">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Emergency Phone <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3.5 top-3.5 h-4 w-4 text-red-400" />
                      <input
                        type="tel"
                        value={form.emergencyPhone}
                        onChange={update('emergencyPhone')}
                        placeholder="+91XXXXXXXXXX"
                        className={`${inputCls} pl-10 ${errors.emergencyPhone ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                    </div>
                    {errors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyPhone}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* ── SECTION 3 — Address ── */}
              <div>
                <SectionHeader num="3" label="Address" />
                <div className="space-y-4">
                  {/* Address Line 1 */}
                  <div id="addressLine1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Street Address Line 1 <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.addressLine1}
                        onChange={update('addressLine1')}
                        placeholder="Street / Building / Area"
                        className={`${inputCls} pl-10 ${errors.addressLine1 ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                    </div>
                    {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
                  </div>

                  {/* Address Line 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Street Address Line 2 <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.addressLine2}
                      onChange={update('addressLine2')}
                      placeholder="Flat, Floor, Building Name"
                      className={inputCls}
                    />
                  </div>

                  {/* City / State / Pincode */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div id="city">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={update('city')}
                        placeholder="New Delhi"
                        className={`${inputCls} ${errors.city ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div id="state">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        State <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={form.state}
                        onChange={update('state')}
                        className={`${inputCls} ${errors.state ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      >
                        <option value="">Select…</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>
                    <div id="pincode">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Pincode <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.pincode}
                        onChange={update('pincode')}
                        placeholder="110001"
                        maxLength={6}
                        className={`${inputCls} ${errors.pincode ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                      {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                    </div>
                  </div>

                  {/* Landmark + Google Maps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Landmark <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.landmark}
                        onChange={update('landmark')}
                        placeholder="Near ABC Metro Station"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Google Maps Link <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="url"
                        value={form.googleMapsLink}
                        onChange={update('googleMapsLink')}
                        placeholder="https://maps.google.com/…"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* ── SECTION 4 — Working Hours ── */}
              <div>
                <SectionHeader num="4" label="Working Hours" />
                <div className="space-y-2">
                  {DAYS.map(day => (
                    <div
                      key={day}
                      className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                    >
                      <span className="w-24 text-sm font-medium text-gray-700 flex-shrink-0">
                        {DAY_LABELS[day]}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                          workingHours[day].open
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        {workingHours[day].open
                          ? <><FiCheck className="h-3 w-3" /> Open</>
                          : <><FiX className="h-3 w-3" /> Closed</>
                        }
                      </button>
                      {workingHours[day].open && (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={workingHours[day].start}
                            onChange={e => updateHours(day, 'start', e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                          />
                          <span className="text-gray-400 text-xs">to</span>
                          <input
                            type="time"
                            value={workingHours[day].end}
                            onChange={e => updateHours(day, 'end', e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Emergency 24x7 */}
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="emergencyAvailable"
                      checked={form.emergencyAvailable}
                      onChange={update('emergencyAvailable')}
                      className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                    />
                    <label htmlFor="emergencyAvailable" className="text-sm text-gray-700 font-medium">
                      Emergency services available 24×7
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* ── SECTION 5 — Admin Credentials ── */}
              <div>
                <SectionHeader num="5" label="Hospital Admin Account" />
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex gap-2">
                  <FiAlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    These credentials will be used to log in to the hospital dashboard once your
                    registration is approved. Keep them secure.
                  </p>
                </div>
                <div className="space-y-4">
                  {/* Admin Name */}
                  <div id="adminName">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Admin Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.adminName}
                        onChange={update('adminName')}
                        placeholder="Full name of hospital admin"
                        className={`${inputCls} pl-10 ${errors.adminName ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                    </div>
                    {errors.adminName && <p className="text-red-500 text-xs mt-1">{errors.adminName}</p>}
                  </div>

                  {/* Admin Email + Admin Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div id="adminEmail">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Admin Email <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          value={form.adminEmail}
                          onChange={update('adminEmail')}
                          placeholder="login@hospital.com"
                          className={`${inputCls} pl-10 ${errors.adminEmail ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                        />
                      </div>
                      {errors.adminEmail && <p className="text-red-500 text-xs mt-1">{errors.adminEmail}</p>}
                    </div>
                    <div id="adminPhone">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Admin Phone <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          value={form.adminPhone}
                          onChange={update('adminPhone')}
                          placeholder="+91XXXXXXXXXX"
                          className={`${inputCls} pl-10 ${errors.adminPhone ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                        />
                      </div>
                      {errors.adminPhone && <p className="text-red-500 text-xs mt-1">{errors.adminPhone}</p>}
                    </div>
                  </div>

                  {/* PIN Length Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      PIN Length <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-3">
                      {['4', '6'].map(len => (
                        <button
                          key={len}
                          type="button"
                          onClick={() => { setForm(p => ({ ...p, pinLength: len, adminPin: '', adminPinConfirm: '' })); setErrors(p => ({ ...p, adminPin: '', adminPinConfirm: '' })); }}
                          className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.pinLength === len ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                          {len}-digit PIN
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admin PIN */}
                  <div id="adminPin">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Admin PIN <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type={showPin ? 'text' : 'password'}
                        inputMode="numeric"
                        value={form.adminPin}
                        onChange={e => { setForm(p => ({ ...p, adminPin: e.target.value.replace(/\D/g, '').slice(0, parseInt(form.pinLength) || 6) })); setErrors(p => ({ ...p, adminPin: '' })); }}
                        placeholder={`Enter ${form.pinLength}-digit PIN`}
                        maxLength={parseInt(form.pinLength) || 6}
                        className={`${inputCls} pl-10 pr-10 tracking-widest text-lg ${errors.adminPin ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(v => !v)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPin ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.adminPin && <p className="text-red-500 text-xs mt-1">{errors.adminPin}</p>}
                    {form.adminPin && (
                      <p className={`text-xs mt-1 ${form.adminPin.length === (parseInt(form.pinLength) || 6) ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {form.adminPin.length} / {form.pinLength} digits entered
                      </p>
                    )}
                  </div>

                  {/* Confirm PIN */}
                  <div id="adminPinConfirm">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm PIN <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type={showPinConf ? 'text' : 'password'}
                        inputMode="numeric"
                        value={form.adminPinConfirm}
                        onChange={e => { setForm(p => ({ ...p, adminPinConfirm: e.target.value.replace(/\D/g, '').slice(0, parseInt(form.pinLength) || 6) })); setErrors(p => ({ ...p, adminPinConfirm: '' })); }}
                        placeholder={`Re-enter ${form.pinLength}-digit PIN`}
                        maxLength={parseInt(form.pinLength) || 6}
                        className={`${inputCls} pl-10 pr-10 tracking-widest text-lg ${errors.adminPinConfirm ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPinConf(v => !v)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPinConf ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.adminPinConfirm && <p className="text-red-500 text-xs mt-1">{errors.adminPinConfirm}</p>}
                    {form.adminPinConfirm && form.adminPin && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${form.adminPin === form.adminPinConfirm ? 'text-emerald-600' : 'text-red-500'}`}>
                        {form.adminPin === form.adminPinConfirm ? <FiCheck className="h-3 w-3" /> : <FiX className="h-3 w-3" />}
                        {form.adminPin === form.adminPinConfirm ? 'PINs match' : 'PINs do not match'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* ── SECTION 6 — Documents ── */}
              <div>
                <SectionHeader num="6" label="Document Upload" />
                <p className="text-sm text-gray-500 mb-4">
                  Upload the required documents. All files are securely stored and only accessible to the verification team.
                </p>
                <div className="space-y-4">
                  {DOCS_CONFIG.map(doc => {
                    const file    = docFiles[doc.key];
                    const url     = docUrls[doc.key];
                    const loading = docUploading[doc.key];
                    const hasError= !!errors[doc.key];

                    return (
                      <div key={doc.key} id={doc.key}>
                        <div className={`border-2 rounded-xl p-4 transition-colors ${
                          url
                            ? 'border-emerald-200 bg-emerald-50'
                            : hasError
                              ? 'border-red-200 bg-red-50'
                              : 'border-dashed border-gray-200 bg-gray-50 hover:border-cyan-300 hover:bg-cyan-50'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${url ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                              <FiFileText className={`h-5 w-5 ${url ? 'text-emerald-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium text-gray-800">{doc.label}</p>
                                {doc.required
                                  ? <span className="text-xs text-red-500 font-medium">Required</span>
                                  : <span className="text-xs text-gray-400">Optional</span>
                                }
                              </div>
                              <p className="text-xs text-gray-400 mb-2">{doc.hint}</p>

                              {url ? (
                                <div className="flex items-center gap-2">
                                  <FiCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                  <span className="text-xs text-emerald-700 truncate font-medium">
                                    {file?.name || 'Uploaded'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {file?.size ? `(${(file.size / 1024 / 1024).toFixed(1)} MB)` : ''}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeDoc(doc.key)}
                                    className="ml-auto text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"
                                  >
                                    <FiTrash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : loading ? (
                                <div className="flex items-center gap-2">
                                  <svg className="h-4 w-4 animate-spin text-cyan-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                  <span className="text-xs text-cyan-700">Uploading…</span>
                                </div>
                              ) : (
                                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                  <FiUpload className="h-3.5 w-3.5" />
                                  Choose file
                                  <input
                                    ref={el => fileInputRefs.current[doc.key] = el}
                                    type="file"
                                    accept={doc.accept}
                                    className="sr-only"
                                    onChange={e => handleFilePick(doc.key, e)}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                        {errors[doc.key] && <p className="text-red-500 text-xs mt-1">{errors[doc.key]}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={loading || Object.values(docUploading).some(Boolean)}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:from-cyan-300 disabled:to-teal-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <><MdHealthAndSafety className="h-5 w-5" /> Submit for Verification</>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Already registered?{' '}
                <Link href="/login" className="text-cyan-600 font-medium hover:underline">Sign In</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

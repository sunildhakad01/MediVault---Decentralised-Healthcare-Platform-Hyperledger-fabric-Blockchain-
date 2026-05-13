import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { MdLocalHospital, MdHealthAndSafety } from 'react-icons/md';
import {
  FiArrowLeft, FiClock, FiMapPin, FiPhone, FiMail, FiGlobe, FiCheck,
  FiX, FiUpload, FiFileText, FiTrash2, FiAlertCircle,
} from 'react-icons/fi';
import apiClient from '../../../utils/api';

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
  Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',
  Fri:'Friday',Sat:'Saturday',Sun:'Sunday',
};
const DEFAULT_HOURS = DAYS.reduce((a, d) => ({
  ...a, [d]: { open: d !== 'Sun', start: '09:00', end: '17:00' },
}), {});

const DOCS_CONFIG = [
  { key:'registrationCert', label:'Hospital Registration Certificate', required:true,  accept:'.pdf',                hint:'PDF only · max 10 MB' },
  { key:'licenseCert',      label:'License Certificate',               required:true,  accept:'.pdf',                hint:'PDF only · max 10 MB' },
  { key:'addressProof',     label:'Address Proof',                     required:true,  accept:'.pdf,.jpg,.jpeg,.png',hint:'PDF/JPG/PNG · max 10 MB' },
  { key:'nabh',             label:'NABH / NABL Accreditation',         required:false, accept:'.pdf',                hint:'Optional · PDF only · max 10 MB' },
  { key:'taxReg',           label:'Tax Registration',                  required:false, accept:'.pdf',                hint:'Optional · PDF only · max 10 MB' },
];

const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm bg-white';

const validatePhone   = (p) => /^\+91[2-9]\d{9}$/.test(p);
const validatePincode = (p) => /^\d{6}$/.test(p);
const validateGSTIN   = (g) => !g || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g);

const SectionHeader = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="text-xs font-bold text-white">{num}</span>
    </div>
    <h3 className="text-base font-semibold text-gray-800">{label}</h3>
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function HospitalResubmitPage() {
  const router = useRouter();
  const { id }  = router.query;

  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError,   setFetchError]   = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name:'', hospitalType:'', licenseNumber:'', gstin:'',
    yearEstablished:'', website:'', numberOfBeds:'', specialisations:'',
    email:'', phone:'+91', altPhone:'', emergencyPhone:'',
    addressLine1:'', addressLine2:'', city:'', state:'', pincode:'',
    landmark:'', googleMapsLink:'', emergencyAvailable: false,
  });
  const [workingHours, setWorkingHours] = useState(DEFAULT_HOURS);
  const [docFiles,     setDocFiles]     = useState({});
  const [docUrls,      setDocUrls]      = useState({});
  const [docUploading, setDocUploading] = useState({});
  const fileRefs = useRef({});

  // ── Fetch existing hospital data ──
  useEffect(() => {
    if (!id) return;
    apiClient.get(`/hospital/${id}`)
      .then(res => {
        const h = res.data?.data;
        if (!h) { setFetchError('Hospital not found'); return; }
        if (h.status !== 'rejected') {
          router.replace('/hospital/dashboard');
          return;
        }
        setRejectionReason(h.rejectionReason || '');

        // Pre-fill form from existing data
        setForm({
          name:             h.name            || '',
          hospitalType:     h.hospitalType    || '',
          licenseNumber:    h.licenseNumber   || '',
          gstin:            h.gstin           || '',
          yearEstablished:  h.yearEstablished ? String(h.yearEstablished) : '',
          website:          h.website         || '',
          numberOfBeds:     h.numberOfBeds    ? String(h.numberOfBeds)   : '',
          specialisations:  h.specialisations || '',
          email:            h.email           || '',
          phone:            h.phone           || '+91',
          altPhone:         h.altPhone        || '',
          emergencyPhone:   h.emergencyPhone  || '',
          addressLine1:     h.addressLine1    || '',
          addressLine2:     h.addressLine2    || '',
          city:             h.city            || '',
          state:            h.state           || '',
          pincode:          h.pincode         || '',
          landmark:         h.landmark        || '',
          googleMapsLink:   h.googleMapsLink  || '',
          emergencyAvailable: !!h.emergencyAvailable,
        });

        // Pre-fill working hours
        if (h.workingHours && Object.keys(h.workingHours).length) {
          setWorkingHours(h.workingHours);
        }

        // Pre-fill existing document URLs
        if (Array.isArray(h.documents)) {
          const urls = {};
          h.documents.forEach(d => { if (d.type && d.url) urls[d.type] = d.url; });
          setDocUrls(urls);
        }
      })
      .catch(() => setFetchError('Failed to load hospital data. Please try again.'))
      .finally(() => setFetchLoading(false));
  }, [id, router]);

  // ── Form helpers ──
  const update = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [field]: val }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const toggleDay   = (day) => setWorkingHours(p => ({ ...p, [day]: { ...p[day], open: !p[day].open } }));
  const updateHours = (day, key, val) => setWorkingHours(p => ({ ...p, [day]: { ...p[day], [key]: val } }));

  const handleFilePick = async (docKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); e.target.value = ''; return; }

    setDocFiles(p => ({ ...p, [docKey]: file }));
    setDocUploading(p => ({ ...p, [docKey]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('docType', docKey);
      const res = await apiClient.post('/hospital/document-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        setDocUrls(p => ({ ...p, [docKey]: res.data.url }));
        toast.success('Document uploaded');
      } else { throw new Error(res.data?.error); }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Try again.');
      setDocFiles(p => ({ ...p, [docKey]: null }));
      if (e.target) e.target.value = '';
    } finally { setDocUploading(p => ({ ...p, [docKey]: false })); }
  };

  const removeDoc = (docKey) => {
    setDocFiles(p => ({ ...p, [docKey]: null }));
    setDocUrls(p => ({ ...p, [docKey]: '' }));
    if (fileRefs.current[docKey]) fileRefs.current[docKey].value = '';
  };

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!form.name.trim())         e.name         = 'Hospital name is required';
    if (!form.hospitalType)        e.hospitalType  = 'Hospital type is required';
    if (!form.email.trim())        e.email         = 'Email is required';
    if (!form.phone.trim())        e.phone         = 'Phone is required';
    else if (!validatePhone(form.phone)) e.phone   = 'Enter valid +91XXXXXXXXXX number';
    if (form.altPhone && !validatePhone(form.altPhone))       e.altPhone       = 'Enter valid +91XXXXXXXXXX';
    if (form.emergencyPhone && !validatePhone(form.emergencyPhone)) e.emergencyPhone = 'Enter valid +91XXXXXXXXXX';
    if (!form.addressLine1.trim()) e.addressLine1  = 'Address is required';
    if (!form.city.trim())         e.city          = 'City is required';
    if (!form.state)               e.state         = 'State is required';
    if (!form.pincode.trim())      e.pincode       = 'Pincode is required';
    else if (!validatePincode(form.pincode)) e.pincode = 'Pincode must be 6 digits';
    if (form.gstin && !validateGSTIN(form.gstin)) e.gstin = 'Invalid GSTIN format';
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
      toast.error('Please fix the errors before submitting');
      return;
    }

    const documents = DOCS_CONFIG
      .filter(d => docUrls[d.key])
      .map(d => ({ type: d.key, label: d.label, url: docUrls[d.key] }));

    setSubmitting(true);
    try {
      await apiClient.put(`/hospital/${id}/resubmit`, {
        ...form,
        yearEstablished: form.yearEstablished ? parseInt(form.yearEstablished) : undefined,
        numberOfBeds:    form.numberOfBeds    ? parseInt(form.numberOfBeds)    : undefined,
        workingHours, documents,
      });
      toast.success('Application resubmitted successfully!');
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Resubmission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  // ── Render ──
  return (
    <>
      <Head><title>Resubmit Application – MediVault</title></Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-800 to-blue-900 flex items-start justify-center p-4 py-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/hospital/status"
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 border border-white border-opacity-30 text-white text-sm font-medium rounded-xl backdrop-blur-sm transition-all"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Status
          </Link>
        </div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 mt-12">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-2xl">
                <MdLocalHospital className="h-10 w-10 text-cyan-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-cyan-700">MediVault</h1>
            <p className="text-gray-500 text-sm mt-1">Resubmit Hospital Application</p>
          </div>

          {/* Loading */}
          {fetchLoading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <svg className="h-6 w-6 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-gray-500 text-sm">Loading your application…</span>
            </div>
          )}

          {/* Error */}
          {!fetchLoading && fetchError && (
            <div className="text-center py-8">
              <FiAlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-700 mb-4">{fetchError}</p>
              <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-cyan-500 text-white rounded-xl text-sm">Retry</button>
            </div>
          )}

          {/* Done state */}
          {done && (
            <div className="text-center py-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <FiClock className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Resubmitted!</h2>
              <p className="text-gray-600 leading-relaxed max-w-md mx-auto mb-6">
                Your updated application is now under review. Our team will notify you within <strong>2–3 working days</strong>.
              </p>
              <button
                onClick={() => router.push('/hospital/status')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-md"
              >
                Check Status
              </button>
            </div>
          )}

          {/* Form */}
          {!fetchLoading && !fetchError && !done && (
            <form onSubmit={handleSubmit} noValidate className="space-y-8">

              {/* Rejection reason banner */}
              {rejectionReason && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl px-5 py-4">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Rejection Reason — Please Address This</p>
                  <p className="text-red-800 text-sm leading-relaxed">{rejectionReason}</p>
                </div>
              )}

              {/* ── SECTION 1 — Basic Info ── */}
              <div>
                <SectionHeader num="1" label="Basic Information" />
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.name} onChange={update('name')} className={`${inputCls} ${errors.name ? 'border-red-400' : ''}`} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital Type <span className="text-red-400">*</span></label>
                    <select value={form.hospitalType} onChange={update('hospitalType')} className={`${inputCls} ${errors.hospitalType ? 'border-red-400' : ''}`}>
                      <option value="">Select type…</option>
                      {HOSPITAL_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    {errors.hospitalType && <p className="text-red-500 text-xs mt-1">{errors.hospitalType}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number</label>
                      <input type="text" value={form.licenseNumber} onChange={update('licenseNumber')} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">GSTIN <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="text" value={form.gstin} onChange={update('gstin')} maxLength={15} className={`${inputCls} ${errors.gstin ? 'border-red-400' : ''}`} />
                      {errors.gstin && <p className="text-red-500 text-xs mt-1">{errors.gstin}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Year Established</label>
                      <input type="number" value={form.yearEstablished} onChange={update('yearEstablished')} placeholder="e.g. 1998" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Beds</label>
                      <input type="number" value={form.numberOfBeds} onChange={update('numberOfBeds')} placeholder="e.g. 200" className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Website <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <FiGlobe className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                      <input type="url" value={form.website} onChange={update('website')} placeholder="https://yourhospital.com" className={`${inputCls} pl-10`} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialisations <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                    <input type="text" value={form.specialisations} onChange={update('specialisations')} placeholder="Cardiology, Neurology, Orthopaedics" className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* ── SECTION 2 — Contact ── */}
              <div>
                <SectionHeader num="2" label="Contact Details" />
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Official Email <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                      <input type="email" value={form.email} onChange={update('email')} className={`${inputCls} pl-10 ${errors.email ? 'border-red-400' : ''}`} />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Official Phone <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <FiPhone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <input type="tel" value={form.phone} onChange={update('phone')} className={`${inputCls} pl-10 ${errors.phone ? 'border-red-400' : ''}`} />
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Alternate Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                      <div className="relative">
                        <FiPhone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <input type="tel" value={form.altPhone} onChange={update('altPhone')} className={`${inputCls} pl-10 ${errors.altPhone ? 'border-red-400' : ''}`} />
                      </div>
                      {errors.altPhone && <p className="text-red-500 text-xs mt-1">{errors.altPhone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Emergency Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                    <div className="relative">
                      <FiPhone className="absolute left-3.5 top-3.5 h-4 w-4 text-red-400" />
                      <input type="tel" value={form.emergencyPhone} onChange={update('emergencyPhone')} className={`${inputCls} pl-10 ${errors.emergencyPhone ? 'border-red-400' : ''}`} />
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                      <input type="text" value={form.addressLine1} onChange={update('addressLine1')} className={`${inputCls} pl-10 ${errors.addressLine1 ? 'border-red-400' : ''}`} />
                    </div>
                    {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
                  </div>

                  <input type="text" value={form.addressLine2} onChange={update('addressLine2')} placeholder="Flat, Floor, Building Name (optional)" className={inputCls} />

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-red-400">*</span></label>
                      <input type="text" value={form.city} onChange={update('city')} className={`${inputCls} ${errors.city ? 'border-red-400' : ''}`} />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">State <span className="text-red-400">*</span></label>
                      <select value={form.state} onChange={update('state')} className={`${inputCls} ${errors.state ? 'border-red-400' : ''}`}>
                        <option value="">Select…</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode <span className="text-red-400">*</span></label>
                      <input type="text" value={form.pincode} onChange={update('pincode')} maxLength={6} className={`${inputCls} ${errors.pincode ? 'border-red-400' : ''}`} />
                      {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Landmark <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="text" value={form.landmark} onChange={update('landmark')} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Maps Link <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="url" value={form.googleMapsLink} onChange={update('googleMapsLink')} className={inputCls} />
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
                    <div key={day} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <span className="w-24 text-sm font-medium text-gray-700 flex-shrink-0">{DAY_LABELS[day]}</span>
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                          workingHours[day]?.open
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        {workingHours[day]?.open ? <><FiCheck className="h-3 w-3" /> Open</> : <><FiX className="h-3 w-3" /> Closed</>}
                      </button>
                      {workingHours[day]?.open && (
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={workingHours[day].start} onChange={e => updateHours(day,'start',e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:ring-1 focus:ring-cyan-500 focus:outline-none" />
                          <span className="text-gray-400 text-xs">to</span>
                          <input type="time" value={workingHours[day].end}   onChange={e => updateHours(day,'end',e.target.value)}   className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:ring-1 focus:ring-cyan-500 focus:outline-none" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-2">
                    <input type="checkbox" id="ea" checked={form.emergencyAvailable} onChange={update('emergencyAvailable')} className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500" />
                    <label htmlFor="ea" className="text-sm text-gray-700 font-medium">Emergency services available 24×7</label>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* ── SECTION 5 — Documents ── */}
              <div>
                <SectionHeader num="5" label="Documents" />
                <p className="text-sm text-gray-500 mb-4">Update or re-upload documents as needed. Previously uploaded documents are pre-filled.</p>
                <div className="space-y-4">
                  {DOCS_CONFIG.map(doc => {
                    const url      = docUrls[doc.key];
                    const file     = docFiles[doc.key];
                    const uploading= docUploading[doc.key];
                    return (
                      <div key={doc.key} id={doc.key}>
                        <div className={`border-2 rounded-xl p-4 transition-colors ${url ? 'border-emerald-200 bg-emerald-50' : errors[doc.key] ? 'border-red-200 bg-red-50' : 'border-dashed border-gray-200 bg-gray-50 hover:border-cyan-300'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${url ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                              <FiFileText className={`h-5 w-5 ${url ? 'text-emerald-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium text-gray-800">{doc.label}</p>
                                {doc.required ? <span className="text-xs text-red-500">Required</span> : <span className="text-xs text-gray-400">Optional</span>}
                              </div>
                              <p className="text-xs text-gray-400 mb-2">{doc.hint}</p>
                              {url ? (
                                <div className="flex items-center gap-2">
                                  <FiCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                  <span className="text-xs text-emerald-700 font-medium truncate">
                                    {file?.name || 'Previously uploaded'}
                                  </span>
                                  <button type="button" onClick={() => removeDoc(doc.key)} className="ml-auto text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0">
                                    <FiTrash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : uploading ? (
                                <div className="flex items-center gap-2">
                                  <svg className="h-4 w-4 animate-spin text-cyan-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                  <span className="text-xs text-cyan-700">Uploading…</span>
                                </div>
                              ) : (
                                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                                  <FiUpload className="h-3.5 w-3.5" />
                                  {url ? 'Replace file' : 'Choose file'}
                                  <input ref={el => fileRefs.current[doc.key] = el} type="file" accept={doc.accept} className="sr-only" onChange={e => handleFilePick(doc.key, e)} />
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
                disabled={submitting || Object.values(docUploading).some(Boolean)}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:from-cyan-300 disabled:to-teal-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base"
              >
                {submitting ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Submitting…</>
                ) : (
                  <><MdHealthAndSafety className="h-5 w-5" /> Resubmit for Verification</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

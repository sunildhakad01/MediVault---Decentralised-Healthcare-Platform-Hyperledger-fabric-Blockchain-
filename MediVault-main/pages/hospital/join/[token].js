import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import {
  FiUser, FiMail, FiPhone, FiCheck, FiX, FiAlertCircle,
  FiLoader, FiUpload, FiEye, FiEyeOff,
} from 'react-icons/fi';
import { MdLocalHospital, MdVerifiedUser } from 'react-icons/md';
import apiClient from '../../../utils/api';

const DEGREES = ['MBBS', 'MD', 'MS', 'BDS', 'BAMS', 'BHMS', 'DNB', 'DM', 'MCh', 'Other'];
const MEDICAL_COUNCILS = [
  'National Medical Commission (NMC)',
  'Andhra Pradesh Medical Council', 'Arunachal Pradesh Medical Council', 'Assam Medical Council',
  'Bihar Medical Council', 'Chhattisgarh Medical Council', 'Delhi Medical Council',
  'Goa Medical Council', 'Gujarat Medical Council', 'Haryana Medical Council',
  'Himachal Pradesh Medical Council', 'Jharkhand Medical Council', 'Karnataka Medical Council',
  'Kerala Medical Council', 'Madhya Pradesh Medical Council', 'Maharashtra Medical Council',
  'Manipur Medical Council', 'Meghalaya Medical Council', 'Mizoram Medical Council',
  'Nagaland Medical Council', 'Odisha Medical Council', 'Punjab Medical Council',
  'Rajasthan Medical Council', 'Tamil Nadu Medical Council', 'Telangana State Medical Council',
  'Tripura Medical Council', 'Uttar Pradesh Medical Council', 'Uttarakhand Medical Council',
  'West Bengal Medical Council',
];
const LANGUAGES = ['Hindi', 'English', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati', 'Punjabi', 'Other'];

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 text-gray-800';

export default function HospitalJoinPage() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);

  const [form, setForm] = useState({
    medicalCouncilRegNo: '',
    medicalCouncil: '',
    degree: 'MBBS',
    specialization: '',
    experienceYears: '',
    languagesSpoken: [],
    bio: '',
    pin: '',
    pinConfirm: '',
  });

  useEffect(() => {
    if (!token) return;
    apiClient.get(`/hospital/join/${token}`)
      .then(res => {
        setInvite(res.data.data.invite);
        setHospital(res.data.data.hospital);
      })
      .catch(err => setError(err.response?.data?.error || 'Invalid or expired invite link'))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleLanguage = (lang) => {
    setForm(f => ({
      ...f,
      languagesSpoken: f.languagesSpoken.includes(lang)
        ? f.languagesSpoken.filter(l => l !== lang)
        : [...f.languagesSpoken, lang],
    }));
  };

  const handleSubmit = async () => {
    if (!form.medicalCouncilRegNo || !form.medicalCouncil || !form.degree || !form.specialization || !form.experienceYears) {
      toast.error('Please fill all required professional fields');
      return;
    }
    if (!form.pin || form.pin.length < 6) {
      toast.error('PIN must be at least 6 digits');
      return;
    }
    if (form.pin !== form.pinConfirm) {
      toast.error('PINs do not match');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/hospital/join/${token}/submit`, {
        ...form,
        fullName: invite.fullName,
        email: invite.email,
        phone: invite.phone,
      });
      setSubmitted(true);
      toast.success('Registration submitted! The hospital will review and approve your details.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Validating invite link…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="p-4 bg-red-100 rounded-2xl w-fit mx-auto mb-4">
            <FiAlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invite Link Invalid</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="p-4 bg-emerald-100 rounded-2xl w-fit mx-auto mb-4">
            <FiCheck className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-600 text-sm mb-2">
            Thank you, Dr. {invite?.fullName}. Your details have been submitted to{' '}
            <strong>{hospital?.name}</strong> for review.
          </p>
          <p className="text-gray-500 text-xs mb-6">
            You will receive an SMS and email once approved. You can then log in to MediVault.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Join {hospital?.name} — MediVault</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl">
                <MdLocalHospital className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">You've been invited to join</p>
                <h1 className="text-xl font-bold text-gray-900">{hospital?.name}</h1>
                <p className="text-sm text-gray-500">{hospital?.city}, {hospital?.state}</p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                  <MdVerifiedUser className="h-3.5 w-3.5" /> Verified Hospital
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400">Department</p>
                <p className="text-sm font-semibold text-gray-800">{invite?.department}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400">Designation</p>
                <p className="text-sm font-semibold text-gray-800">{invite?.designation}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs text-gray-400">Consultation Fee</p>
                <p className="text-sm font-semibold text-gray-800">₹{invite?.consultationFee}</p>
              </div>
            </div>
            {invite?.message && (
              <div className="mt-3 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 text-sm text-cyan-800 italic">
                "{invite.message}"
              </div>
            )}
          </div>

          {/* Pre-filled personal info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
            <h2 className="font-semibold text-gray-900 mb-4">Your Details (Pre-filled)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: FiUser, label: 'Full Name', value: invite?.fullName },
                { icon: FiMail, label: 'Email', value: invite?.email },
                { icon: FiPhone, label: 'Phone', value: invite?.phone },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Professional info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
            <h2 className="font-semibold text-gray-900 mb-4">Professional Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Council Reg. No. *</label>
                <input value={form.medicalCouncilRegNo} onChange={e => setForm(f => ({ ...f, medicalCouncilRegNo: e.target.value }))} placeholder="MCI/2019/XXXXX" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Medical Council *</label>
                <select value={form.medicalCouncil} onChange={e => setForm(f => ({ ...f, medicalCouncil: e.target.value }))} className={inputCls}>
                  <option value="">Select council…</option>
                  {MEDICAL_COUNCILS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Degree *</label>
                <select value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} className={inputCls}>
                  {DEGREES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Specialization *</label>
                <input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} placeholder="e.g. Cardiology" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Experience (years) *</label>
                <input type="number" min={0} value={form.experienceYears} onChange={e => setForm(f => ({ ...f, experienceYears: e.target.value }))} placeholder="5" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Languages Spoken</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${form.languagesSpoken.includes(lang) ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Short Bio (optional)</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Brief professional summary…" rows={2} maxLength={500} className={`${inputCls} resize-none`} />
              </div>
            </div>
          </div>

          {/* Set PIN */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
            <h2 className="font-semibold text-gray-900 mb-1">Set Your Login PIN</h2>
            <p className="text-xs text-gray-400 mb-4">You will use this PIN to log in to MediVault. Min 6 digits.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">PIN *</label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    value={form.pin}
                    onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                    placeholder="Enter 6-digit PIN"
                    className={inputCls}
                  />
                  <button type="button" onClick={() => setShowPin(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPin ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm PIN *</label>
                <div className="relative">
                  <input
                    type={showPinConfirm ? 'text' : 'password'}
                    inputMode="numeric"
                    value={form.pinConfirm}
                    onChange={e => setForm(f => ({ ...f, pinConfirm: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                    placeholder="Re-enter PIN"
                    className={inputCls}
                  />
                  <button type="button" onClick={() => setShowPinConfirm(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPinConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 mb-5">
            By submitting, your profile will be sent to <strong>{hospital?.name}</strong> for review. You will receive an SMS and email once approved and can then log in.
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm disabled:opacity-50"
          >
            {submitting ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</> : <><FiCheck className="h-5 w-5" /> Submit Registration</>}
          </button>
        </div>
      </div>
    </>
  );
}

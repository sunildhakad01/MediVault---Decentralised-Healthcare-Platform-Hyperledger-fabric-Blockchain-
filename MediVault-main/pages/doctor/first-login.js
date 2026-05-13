import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import {
  FiLock, FiEye, FiEyeOff, FiCheck, FiUser, FiCalendar, FiChevronRight,
} from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import apiClient from '../../utils/api';

const STEP_LABELS = ['Set PIN', 'Complete Profile', 'Set Schedule'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LANGUAGES = ['Hindi', 'English', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati', 'Punjabi', 'Other'];
const SLOT_DURATIONS = [15, 20, 30, 45, 60];

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 text-gray-800';

export default function DoctorFirstLogin() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');

  // Step 1 — Change PIN
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);

  // Step 2 — Complete Profile
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState([]);
  const [profileSaving, setProfileSaving] = useState(false);

  // Step 3 — Availability
  const [availDays, setAvailDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(20);
  const [availSaving, setAvailSaving] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('mv_doctor_name') || '';
    const hospName = localStorage.getItem('mv_hospital_name') || '';
    setDoctorName(name);
    setHospitalName(hospName);

    // If firstLoginCompleted is already true, redirect away
    apiClient.get('/doctor/profile').then(res => {
      const meta = res.data?.data?.metadata || {};
      if (meta.firstLoginCompleted) router.replace('/doctor/dashboard');
    }).catch(() => {});
  }, []);

  const toggleLanguage = (lang) => {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const toggleDay = (day) => {
    setAvailDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleChangePin = async () => {
    if (!pin || pin.length < 6) { toast.error('PIN must be at least 6 digits'); return; }
    if (pin !== pinConfirm) { toast.error('PINs do not match'); return; }
    setPinSaving(true);
    try {
      await apiClient.post('/auth/change-pin', { newPin: pin });
      toast.success('PIN updated successfully');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update PIN');
    } finally {
      setPinSaving(false);
    }
  };

  const handleCompleteProfile = async () => {
    setProfileSaving(true);
    try {
      if (bio || languages.length > 0) {
        await apiClient.put('/doctor/profile', { bio, languagesSpoken: languages });
      }
      setStep(3);
    } catch {
      // Non-critical — skip
      setStep(3);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSetAvailability = async () => {
    setAvailSaving(true);
    try {
      await apiClient.post('/availability/weekly', {
        schedule: availDays.map(day => ({
          dayOfWeek: day, isAvailable: true,
          startTime, endTime, slotDurationMinutes: slotDuration,
        })),
      });
    } catch {
      // Non-critical — continue
    } finally {
      setAvailSaving(false);
    }
    await finishFirstLogin();
  };

  const finishFirstLogin = async () => {
    try {
      await apiClient.post('/doctor/complete-first-login');
    } catch { /* best-effort */ }
    router.replace('/doctor/dashboard');
    toast.success(`Welcome Dr. ${doctorName}! Your profile is now live.`);
  };

  return (
    <>
      <Head><title>Set Up Your Account — MediVault</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <MdLocalHospital className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, Dr. {doctorName || 'Doctor'}</h1>
            {hospitalName && <p className="text-sm text-gray-500 mt-1">Registered at <strong>{hospitalName}</strong></p>}
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <div key={n} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${done ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {done ? <FiCheck className="h-3 w-3" /> : <span>{n}</span>}
                    {label}
                  </div>
                  {i < STEP_LABELS.length - 1 && <FiChevronRight className="h-4 w-4 text-gray-300" />}
                </div>
              );
            })}
          </div>

          {/* ── Step 1: Set PIN ── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-cyan-100 rounded-xl">
                  <FiLock className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Set Your PIN</h2>
                  <p className="text-xs text-gray-400">You must set a new PIN before continuing</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">New PIN (min 6 digits) *</label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="Enter 6-digit PIN"
                      className={inputCls}
                    />
                    <button type="button" onClick={() => setShowPin(v => !v)} className="absolute right-3 top-2.5 text-gray-400">
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
                      value={pinConfirm}
                      onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="Re-enter PIN"
                      className={inputCls}
                    />
                    <button type="button" onClick={() => setShowPinConfirm(v => !v)} className="absolute right-3 top-2.5 text-gray-400">
                      {showPinConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {pin && pinConfirm && pin !== pinConfirm && (
                  <p className="text-xs text-red-500">PINs do not match</p>
                )}
              </div>
              <button
                onClick={handleChangePin}
                disabled={pinSaving || pin.length < 6 || pin !== pinConfirm}
                className="w-full mt-5 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 transition-all"
              >
                {pinSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiCheck className="h-5 w-5" />}
                Set PIN
              </button>
            </div>
          )}

          {/* ── Step 2: Complete Profile ── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-cyan-100 rounded-xl">
                  <FiUser className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Complete Your Profile</h2>
                  <p className="text-xs text-gray-400">Optional — helps patients find and trust you</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Languages Spoken</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${languages.includes(lang) ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Short Bio (optional)</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Brief professional summary visible to patients…"
                    rows={3}
                    maxLength={500}
                    className={`${inputCls} resize-none`}
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/500</p>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(3)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-500 text-sm rounded-xl hover:bg-gray-50">
                  Complete Later
                </button>
                <button
                  onClick={handleCompleteProfile}
                  disabled={profileSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50"
                >
                  {profileSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiCheck className="h-4 w-4" />}
                  Save & Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Set Availability ── */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-cyan-100 rounded-xl">
                  <FiCalendar className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Set Your Schedule</h2>
                  <p className="text-xs text-gray-400">Configure your default consultation availability</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Available Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${availDays.includes(day) ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Start Time</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">End Time</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Default Slot Duration</label>
                  <div className="flex gap-2">
                    {SLOT_DURATIONS.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSlotDuration(d)}
                        className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${slotDuration === d ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300'}`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={finishFirstLogin} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-500 text-sm rounded-xl hover:bg-gray-50">
                  Do This Later
                </button>
                <button
                  onClick={handleSetAvailability}
                  disabled={availSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50"
                >
                  {availSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiCheck className="h-4 w-4" />}
                  Save & Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

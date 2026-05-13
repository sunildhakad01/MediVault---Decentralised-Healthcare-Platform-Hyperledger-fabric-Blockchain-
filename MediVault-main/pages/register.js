import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdLocalHospital, MdHealthAndSafety } from 'react-icons/md';
import { FiCheck } from 'react-icons/fi';

const STEPS = {
  CONTACT: 'contact',
  OTP: 'otp',
  PIN: 'pin',
};

export default function RegisterPage() {
  const router = useRouter();
  const { initiateRegistration, verifyOTP, setPin: setPinFn } = useAuth();

  const roleFromQuery = router.query.role;

  const [step,          setStep]          = useState(STEPS.CONTACT);
  const [contactMethod, setContactMethod] = useState('email');
  const [contactValue,  setContactValue]  = useState('');
  const [sessionId,     setSessionId]     = useState('');
  const [otp,           setOtp]           = useState('');
  const [tempToken,     setTempToken]     = useState('');
  const [pin,           setPin]           = useState('');
  const [pinConfirm,    setPinConfirm]    = useState('');
  const [pinLength,     setPinLength]     = useState(6);
  const [userType,      setUserType]      = useState('patient');
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    if (roleFromQuery === 'doctor' || roleFromQuery === 'patient' || roleFromQuery === 'hospital') {
      setUserType(roleFromQuery);
    }
  }, [roleFromQuery]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!contactValue.trim()) return toast.error('Enter your contact');
    setLoading(true);
    try {
      const res = await initiateRegistration(contactMethod, contactValue.trim());
      setSessionId(res.sessionId);
      setStep(STEPS.OTP);
      toast.success(`OTP sent to your ${contactMethod}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await verifyOTP(sessionId, otp);
      setTempToken(res.tempToken);
      setStep(STEPS.PIN);
      toast.success('OTP verified!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    if (pin.length !== pinLength) return toast.error(`PIN must be exactly ${pinLength} digits`);
    if (pin !== pinConfirm) return toast.error('PINs do not match');
    setLoading(true);
    try {
      const res = await setPinFn(tempToken, pin, pinLength, userType, {});
      toast.success(`Account created! Your MediVault ID: ${res.userId}`);
      // Store the contact method so the profile registration step knows
      // whether the user signed up with email or mobile.
      if (userType === 'patient') {
        localStorage.setItem('mv_registration_method', contactMethod);
      }
      const dest =
        userType === 'doctor'  ? '/doctor/register'  :
        userType === 'patient' ? '/patient/register' :
        userType === 'hospital' ? '/hospital/register' :
        '/';
      router.push(dest);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Contact', 'Verify OTP', 'Set PIN'];
  const currentStepIndex = Object.values(STEPS).indexOf(step);

  const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors";
  const btnActiveCls = "border-emerald-500 bg-emerald-50 text-emerald-700";
  const btnInactiveCls = "border-gray-300 text-gray-600 hover:border-emerald-300";
  const primaryBtn = "w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg";
  const disabledBtn = "w-full bg-gradient-to-r from-emerald-300 to-teal-300 text-white font-semibold py-3 rounded-xl cursor-not-allowed";

  return (
    <>
      <Head><title>Register – MediVault</title></Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-emerald-800 to-cyan-900 flex items-center justify-center p-4">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-20 w-56 h-56 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-10 left-20 w-56 h-56 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl">
                <MdLocalHospital className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-emerald-700">MediVault</h1>
            <p className="text-gray-500 text-sm mt-1">Create Your Account</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between mb-8">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${i < currentStepIndex
                    ? 'bg-emerald-500 text-white'
                    : i === currentStepIndex
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                    : 'bg-gray-100 text-gray-400'}`}>
                  {i < currentStepIndex ? <FiCheck className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs mt-1 font-medium ${i === currentStepIndex ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Step 1: Contact ── */}
          {step === STEPS.CONTACT && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {roleFromQuery && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium mb-2 ${
                  roleFromQuery === 'doctor'
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <span>Registering as:</span>
                  <span className="font-bold capitalize">{roleFromQuery}</span>
                  <Link href="/register/role-select" className="ml-auto text-xs underline opacity-70 hover:opacity-100">
                    Change
                  </Link>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Method</label>
                <div className="flex gap-3">
                  {['email', 'mobile'].map(m => (
                    <button key={m} type="button"
                      onClick={() => setContactMethod(m)}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-medium text-sm transition-colors
                        ${contactMethod === m ? btnActiveCls : btnInactiveCls}`}>
                      {m === 'email' ? 'Email' : 'Mobile'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {contactMethod === 'email' ? 'Email Address' : 'Mobile Number (+91XXXXXXXXXX)'}
                </label>
                <input
                  type={contactMethod === 'email' ? 'email' : 'tel'}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={contactMethod === 'email' ? 'you@email.com' : '+91XXXXXXXXXX'}
                  className={inputCls}
                  autoFocus
                />
              </div>

              <button type="submit" disabled={loading} className={loading ? disabledBtn : primaryBtn}>
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-emerald-600 font-medium hover:underline">Sign In</Link>
              </p>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <p className="text-sm text-gray-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                Enter the 6-digit OTP sent to <strong className="text-emerald-700">{contactValue}</strong>
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className={`${inputCls} text-center text-3xl tracking-widest`}
                maxLength={6}
                autoFocus
              />
              <button type="submit" disabled={loading || otp.length !== 6}
                className={loading || otp.length !== 6 ? disabledBtn : primaryBtn}>
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => setStep(STEPS.CONTACT)}
                className="w-full text-sm text-gray-500 hover:text-emerald-600 font-medium transition-colors">
                ← Back
              </button>
            </form>
          )}

          {/* ── Step 3: Set PIN ── */}
          {step === STEPS.PIN && (
            <form onSubmit={handleSetPin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN Length</label>
                <div className="flex gap-3">
                  {[4, 6].map(l => (
                    <button key={l} type="button"
                      onClick={() => setPinLength(l)}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-medium text-sm transition-colors
                        ${pinLength === l ? btnActiveCls : btnInactiveCls}`}>
                      {l} digits
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Create PIN</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                  placeholder={`${pinLength}-digit PIN`}
                  className={`${inputCls} tracking-widest text-xl`}
                  maxLength={pinLength}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm PIN</label>
                <input
                  type="password"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                  placeholder={`Confirm ${pinLength}-digit PIN`}
                  className={`${inputCls} tracking-widest text-xl`}
                  maxLength={pinLength}
                />
              </div>

              <p className="text-xs text-gray-400">
                Avoid sequential (1234) or repeated (1111) digits.
              </p>
              <button type="submit"
                disabled={loading || pin.length !== pinLength || pinConfirm.length !== pinLength}
                className={loading || pin.length !== pinLength || pinConfirm.length !== pinLength ? disabledBtn : primaryBtn}>
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { MdLocalHospital, MdHealthAndSafety } from 'react-icons/md';
import { FiArrowLeft, FiEye, FiEyeOff, FiMail, FiLock, FiShield } from 'react-icons/fi';
import { FaHospital } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const STEPS = { EMAIL: 'email', PIN: 'pin' };

export default function HospitalLoginPage() {
  const router = useRouter();
  const { setAuthUser } = useAuth();

  const [step,    setStep]    = useState(STEPS.EMAIL);
  const [email,   setEmail]   = useState('');
  const [pin,     setPin]     = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Enter your admin email address');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return toast.error('Enter a valid email address');
    setStep(STEPS.PIN);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!pin) return toast.error('Enter your PIN');
    if (!/^\d{4,6}$/.test(pin)) return toast.error('PIN must be 4 or 6 digits');
    setLoading(true);

    try {
      const res = await fetch('/api/hospital/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Login failed. Check your credentials.');
        setPin('');
        return;
      }

      // Store token and user info
      localStorage.setItem('mv_token',     data.jwt);
      localStorage.setItem('mv_refresh',   data.refreshToken);
      localStorage.setItem('mv_user_type', data.user?.userType || 'hospital_admin');
      localStorage.setItem('mv_user_id',   data.user?.userId  || '');
      if (data.user?.hospital) localStorage.setItem('mv_hospital_id', data.user.hospital);

      // Inject into auth context
      setAuthUser(data.user);

      toast.success(`Welcome back, ${data.user?.name || 'Admin'}!`);
      router.push('/hospital/dashboard');
    } catch (err) {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Hospital Sign In – MediVault</title></Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-800 to-blue-900 flex items-center justify-center p-4">
        {/* Back button */}
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
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-2xl shadow-md">
                <MdLocalHospital className="h-10 w-10 text-cyan-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Hospital Portal</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to manage your hospital</p>
          </div>

          {/* Step 1 — Email */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleContinue} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@yourhospital.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Continue
              </button>

              <p className="text-center text-sm text-gray-500 pt-2">
                Don&apos;t have an account?{' '}
                <Link href="/hospital/register" className="text-cyan-600 hover:text-cyan-700 font-semibold">
                  Register Hospital
                </Link>
              </p>
            </form>
          )}

          {/* Step 2 — PIN */}
          {step === STEPS.PIN && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                <FiMail className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 font-medium truncate">{email}</span>
                <button
                  type="button"
                  onClick={() => setStep(STEPS.EMAIL)}
                  className="ml-auto text-xs text-cyan-600 hover:text-cyan-700 font-semibold"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Admin PIN
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter your 4 or 6-digit PIN"
                    maxLength={6}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPin ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <FiShield className="h-4 w-4" />
                )}
                {loading ? 'Signing in…' : 'Sign In to Hospital Portal'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Not a hospital admin?{' '}
                <Link href="/login" className="text-cyan-600 hover:text-cyan-700 font-semibold">
                  Patient / Doctor login
                </Link>
              </p>
            </form>
          )}

          {/* Trust badges */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <FiShield className="h-3.5 w-3.5 text-teal-400" />
              Secured
            </span>
            <span className="flex items-center gap-1">
              <MdHealthAndSafety className="h-3.5 w-3.5 text-teal-400" />
              HIPAA Compliant
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

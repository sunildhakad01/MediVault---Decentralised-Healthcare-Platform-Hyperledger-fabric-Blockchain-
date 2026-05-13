import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdLocalHospital, MdHealthAndSafety, MdAdminPanelSettings } from 'react-icons/md';
import { FiEye, FiEyeOff, FiShield, FiArrowLeft } from 'react-icons/fi';

const STEPS = { IDENTIFIER: 'identifier', PIN: 'pin' };

export default function LoginPage() {
  const router  = useRouter();
  const { login } = useAuth();

  const [step,       setStep]       = useState(STEPS.IDENTIFIER);
  const [identifier, setIdentifier] = useState('');
  const [pin,        setPin]        = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showPin,    setShowPin]    = useState(false);

  const handleContinue = (e) => {
    e.preventDefault();
    if (!identifier.trim()) return toast.error('Enter your email, phone or MediVault ID');
    setStep(STEPS.PIN);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (pin.length < 4) return toast.error('Enter your PIN');
    setLoading(true);

    const deviceInfo = {
      fingerprint: btoa(navigator.userAgent + screen.width + screen.height),
      userAgent: navigator.userAgent,
    };

    try {
      const result = await login(identifier, pin, deviceInfo);
      toast.success('Welcome back!');
      const dest =
        result.user?.userType === 'doctor'         ? '/doctor/dashboard'   :
        result.user?.userType === 'patient'        ? '/patient/dashboard'  :
        result.user?.userType === 'admin'          ? '/admin/dashboard'    :
        result.user?.userType === 'hospital_admin' ? '/hospital/dashboard' :
        result.user?.userType === 'hospital'       ? '/hospital/dashboard' :
        '/';
      router.push(dest);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      if (err.response?.status !== 429) setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Sign In – MediVault</title></Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-emerald-800 to-cyan-900 flex items-center justify-center p-4">
        {/* Back to Home button — top-left corner */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 border border-white border-opacity-30 text-white text-sm font-medium rounded-xl backdrop-blur-sm transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <FiArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>

        {/* Admin Portal button — top-right corner */}
        <div className="absolute top-4 right-4 z-10">
          <Link
            href="/admin/login"
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 border border-white border-opacity-30 text-white text-sm font-medium rounded-xl backdrop-blur-sm transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <FiShield className="h-4 w-4" />
            <MdAdminPanelSettings className="h-4 w-4" />
            Admin Portal
          </Link>
        </div>

        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl">
                <MdLocalHospital className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-emerald-700">MediVault</h1>
            <p className="text-gray-500 text-sm mt-1">Secure Healthcare on Blockchain</p>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {step === STEPS.IDENTIFIER ? 'Sign In' : 'Enter Your PIN'}
          </h2>

          {/* Step 1 – Identifier */}
          {step === STEPS.IDENTIFIER && (
            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email / Phone / MediVault ID
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="user@email.com or MV-IND-XXXXXX"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Continue
              </button>
              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/register/role-select" className="text-emerald-600 font-medium hover:underline">
                  Register
                </Link>
              </p>
            </form>
          )}

          {/* Step 2 – PIN */}
          {step === STEPS.PIN && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-700 truncate">{identifier}</span>
                <button type="button" onClick={() => setStep(STEPS.IDENTIFIER)}
                  className="text-emerald-600 text-sm hover:underline ml-2 font-medium">
                  Change
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN</label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setPin(v);
                    }}
                    placeholder="Enter 4 or 6-digit PIN"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 tracking-widest text-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    maxLength={6}
                    autoFocus
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPin ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link href="/forgot-pin" className="text-sm text-emerald-600 hover:underline font-medium">
                  Forgot PIN?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || pin.length < 4}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-emerald-300 disabled:to-teal-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    <MdHealthAndSafety className="h-5 w-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

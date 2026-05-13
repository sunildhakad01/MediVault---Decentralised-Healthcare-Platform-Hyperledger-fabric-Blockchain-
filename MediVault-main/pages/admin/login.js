import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { MdAdminPanelSettings, MdSecurity } from 'react-icons/md';
import { FiEye, FiEyeOff, FiShield, FiArrowLeft, FiPhone } from 'react-icons/fi';
import apiClient from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const STEPS = { IDENTIFIER: 'identifier', PIN: 'pin', OTP: 'otp' };

export default function AdminLoginPage() {
  const router = useRouter();
  const { login: authLogin, setAuthUser } = useAuth();

  const [step, setStep] = useState(STEPS.IDENTIFIER);
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState('');
  const [tempToken, setTempToken] = useState('');

  const handleContinue = async (e) => {
    e.preventDefault();
    const val = identifier.trim();
    if (!val) return toast.error('Enter admin email or phone');
    setStep(STEPS.PIN);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!pin) return toast.error('Enter your PIN');
    setLoading(true);
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      };
      // Use AuthContext login so user state is set and sidebar shows admin navigation
      const data = await authLogin(identifier.trim(), pin, deviceInfo);

      // Admin 2FA: backend sends OTP instead of JWT
      if (data.requires2FA) {
        setOtpSessionId(data.sessionId || '');
        setTempToken(data.tempToken || '');
        setStep(STEPS.OTP);
        toast.success('OTP sent to your registered phone/email');
        setLoading(false);
        return;
      }

      if (!data.jwt) throw new Error('Login failed — no token received');

      if (data.user?.userType !== 'admin') {
        toast.error('This account is not an admin account.');
        // Clear tokens set by authLogin since this user is not admin
        ['mv_token', 'mv_refresh', 'mv_user_id', 'mv_user_type'].forEach(k => localStorage.removeItem(k));
        setLoading(false);
        return;
      }

      // Set legacy admin session for backward-compat with existing components
      localStorage.setItem('mv_admin_session', JSON.stringify({
        email: data.user.email || identifier,
        name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || 'Administrator',
        role: data.user.role || 'super_admin',
        userId: data.user.userId,
        loginAt: Date.now(),
      }));

      toast.success('Welcome, Administrator!');
      router.push('/admin/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/verify-otp', {
        sessionId: otpSessionId,
        otp,
        tempToken,
      });
      if (!data.jwt) throw new Error('OTP verification failed');

      localStorage.setItem('mv_token', data.jwt);
      if (data.refreshToken) localStorage.setItem('mv_refresh', data.refreshToken);
      localStorage.setItem('mv_user_id', data.user.userId || '');
      localStorage.setItem('mv_user_type', 'admin');
      localStorage.setItem('mv_admin_session', JSON.stringify({
        email: data.user.email,
        name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || 'Administrator',
        role: data.user.role || 'super_admin',
        userId: data.user.userId,
        loginAt: Date.now(),
      }));
      // Update AuthContext so sidebar shows admin navigation
      setAuthUser(data.user);

      toast.success('Welcome, Administrator!');
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Admin Portal – MediVault</title></Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" />
        </div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

          <Link href="/" className="absolute top-4 left-4 flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 transition-colors">
            <FiArrowLeft className="h-4 w-4" />
            Home
          </Link>

          <div className="text-center mb-8 mt-4">
            <div className="flex justify-center mb-3">
              <div className="p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl shadow-inner">
                <MdAdminPanelSettings className="h-12 w-12 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center justify-center gap-1">
              <MdSecurity className="h-4 w-4 text-indigo-500" />
              MediVault Healthcare Management
            </p>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {step === STEPS.IDENTIFIER && 'Administrator Sign In'}
            {step === STEPS.PIN && 'Enter Admin PIN'}
            {step === STEPS.OTP && 'Verify OTP'}
          </h2>

          {/* Dev-mode credentials hint */}
          {process.env.NODE_ENV !== 'production' && step !== STEPS.OTP && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
              <p className="font-semibold mb-1">Dev mode — default credentials</p>
              <p>Email: <span className="font-mono">admin@medivault.in</span></p>
              <p>PIN: <span className="font-mono">123456</span></p>
              <p className="mt-1 text-amber-700">OTP will print in the backend terminal</p>
            </div>
          )}

          {/* Step 1 — Identifier */}
          {step === STEPS.IDENTIFIER && (
            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Admin Email or Phone
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email@domain.com or 9876543210"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <FiShield className="h-5 w-5" />
                Continue
              </button>
              <p className="text-center text-sm text-gray-400">
                Restricted access — authorised personnel only
              </p>
            </form>
          )}

          {/* Step 2 — PIN */}
          {step === STEPS.PIN && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-700 truncate">{identifier}</span>
                <button
                  type="button"
                  onClick={() => { setStep(STEPS.IDENTIFIER); setPin(''); }}
                  className="text-indigo-600 text-sm hover:underline ml-2 font-medium"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Admin PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter your PIN"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 tracking-widest text-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    maxLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || pin.length < 4}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-indigo-300 disabled:to-purple-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating…
                  </>
                ) : (
                  <>
                    <MdAdminPanelSettings className="h-5 w-5" />
                    Access Admin Dashboard
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 3 — OTP */}
          {step === STEPS.OTP && (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <FiPhone className="h-4 w-4 shrink-0" />
                  OTP sent to your registered phone/email. Valid for 10 minutes.
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  6-Digit OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter OTP"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 tracking-widest text-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-center"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-indigo-300 disabled:to-purple-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <FiShield className="h-5 w-5" />
                    Verify & Sign In
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setStep(STEPS.PIN); setOtp(''); }}
                className="w-full text-sm text-indigo-600 hover:underline"
              >
                Back to PIN entry
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

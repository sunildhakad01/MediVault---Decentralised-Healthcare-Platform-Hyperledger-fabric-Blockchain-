import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdLocalHospital, MdHealthAndSafety } from 'react-icons/md';
import { FiCheckCircle, FiArrowLeft } from 'react-icons/fi';

const STEPS = { IDENTIFIER: 'identifier', OTP: 'otp', RESET: 'reset', DONE: 'done' };

export default function ForgotPinPage() {
  const router = useRouter();
  const { initiateForgotPin, verifyForgotPinOTP, resetPin } = useAuth();

  const [step,       setStep]       = useState(STEPS.IDENTIFIER);
  const [identifier, setIdentifier] = useState('');
  const [sessionId,  setSessionId]  = useState('');
  const [otp,        setOtp]        = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPin,     setNewPin]     = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinLength,  setPinLength]  = useState(6);
  const [loading,    setLoading]    = useState(false);

  const handleInitiate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await initiateForgotPin(identifier.trim());
      if (res.sessionId) setSessionId(res.sessionId);
      setStep(STEPS.OTP);
      toast.success('OTP sent (if account exists)');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyForgotPinOTP(sessionId, otp);
      setResetToken(res.resetToken);
      setStep(STEPS.RESET);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPin !== pinConfirm) return toast.error('PINs do not match');
    setLoading(true);
    try {
      await resetPin(resetToken, newPin, pinLength);
      setStep(STEPS.DONE);
      toast.success('PIN reset successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error resetting PIN');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors";
  const btnActiveCls = "border-emerald-500 bg-emerald-50 text-emerald-700";
  const btnInactiveCls = "border-gray-300 text-gray-600 hover:border-emerald-300";
  const primaryBtn = "w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg";
  const disabledBtn = "w-full bg-gradient-to-r from-emerald-300 to-teal-300 text-white font-semibold py-3 rounded-xl cursor-not-allowed";

  return (
    <>
      <Head><title>Forgot PIN – MediVault</title></Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-emerald-800 to-cyan-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-56 h-56 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-10 right-20 w-56 h-56 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        </div>

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

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl">
                <MdLocalHospital className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-emerald-700">MediVault</h1>
            <p className="text-gray-500 text-sm mt-1">Reset Your PIN</p>
          </div>

          {step === STEPS.IDENTIFIER && (
            <form onSubmit={handleInitiate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email / Phone / MediVault ID
                </label>
                <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                  placeholder="user@email.com" autoFocus className={inputCls} />
              </div>
              <button type="submit" disabled={loading} className={loading ? disabledBtn : primaryBtn}>
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
              <p className="text-center text-sm">
                <Link href="/login" className="text-emerald-600 hover:underline font-medium">
                  ← Back to Login
                </Link>
              </p>
            </form>
          )}

          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <p className="text-sm text-gray-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                Enter the OTP sent to <strong className="text-emerald-700">{identifier}</strong>
              </p>
              <input type="text" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} autoFocus
                className={`${inputCls} text-center text-3xl tracking-widest`} />
              <button type="submit" disabled={loading || otp.length !== 6}
                className={loading || otp.length !== 6 ? disabledBtn : primaryBtn}>
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
            </form>
          )}

          {step === STEPS.RESET && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="flex gap-3">
                {[4, 6].map(l => (
                  <button key={l} type="button" onClick={() => setPinLength(l)}
                    className={`flex-1 py-2.5 rounded-xl border-2 font-medium text-sm transition-colors
                      ${pinLength === l ? btnActiveCls : btnInactiveCls}`}>
                    {l} digits
                  </button>
                ))}
              </div>
              <input type="password" value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                placeholder={`New ${pinLength}-digit PIN`} maxLength={pinLength}
                className={`${inputCls} tracking-widest text-xl`} />
              <input type="password" value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                placeholder="Confirm PIN" maxLength={pinLength}
                className={`${inputCls} tracking-widest text-xl`} />
              <button type="submit"
                disabled={loading || newPin.length !== pinLength || pinConfirm.length !== pinLength}
                className={loading || newPin.length !== pinLength || pinConfirm.length !== pinLength ? disabledBtn : primaryBtn}>
                {loading ? 'Resetting…' : 'Reset PIN'}
              </button>
            </form>
          )}

          {step === STEPS.DONE && (
            <div className="text-center space-y-5">
              <div className="flex justify-center">
                <div className="p-4 bg-emerald-100 rounded-full">
                  <FiCheckCircle className="h-12 w-12 text-emerald-500" />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">PIN Reset Successfully!</p>
                <p className="text-sm text-gray-500 mt-1">You can now sign in with your new PIN</p>
              </div>
              <Link href="/login"
                className="block w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md text-center">
                Go to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

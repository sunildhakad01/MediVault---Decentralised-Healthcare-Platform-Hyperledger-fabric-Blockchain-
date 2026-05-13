import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  MdLocalHospital, MdVerifiedUser,
} from 'react-icons/md';
import {
  FiClock, FiX, FiAlertCircle, FiLogOut, FiRefreshCw, FiMail, FiPhone,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../utils/api';

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

// ── Status screens ─────────────────────────────────────────────────────────────

function PendingScreen({ hospital, onLogout }) {
  return (
    <div className="text-center py-4">
      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <FiClock className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification in Progress</h2>
      <p className="text-gray-600 leading-relaxed max-w-md mx-auto mb-6">
        Your hospital registration is under review by our team.
        This usually takes <strong>2–3 working days</strong>. You will receive an
        SMS and email once a decision is made.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 mb-6 text-left space-y-2 max-w-sm mx-auto">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Reference ID</span>
          <span className="font-bold text-amber-700">{hospital.id}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Hospital</span>
          <span className="font-medium text-gray-800">{hospital.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Submitted on</span>
          <span className="text-gray-700">{fmt(hospital.submittedAt)}</span>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-8 text-sm text-gray-600 max-w-sm mx-auto">
        <p className="flex items-center gap-2 mb-1">
          <FiMail className="h-4 w-4 text-gray-400" />
          support@medivault.in
        </p>
        <p className="flex items-center gap-2">
          <FiPhone className="h-4 w-4 text-gray-400" />
          1800-XXX-XXXX (toll free)
        </p>
      </div>

      <button
        onClick={onLogout}
        className="flex items-center gap-2 mx-auto px-5 py-2.5 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-all text-sm"
      >
        <FiLogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}

function RejectedScreen({ hospital, onLogout }) {
  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <FiX className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Rejected</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Unfortunately your registration was not approved. Please review the reason below and resubmit with corrections.
        </p>
      </div>

      {hospital.rejectionReason && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl px-6 py-4 mb-6">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Rejection Reason</p>
          <p className="text-red-800 text-sm leading-relaxed">{hospital.rejectionReason}</p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Reference ID</span>
          <span className="font-bold text-gray-800">{hospital.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Rejected on</span>
          <span className="text-gray-700">{fmt(hospital.verifiedAt)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/hospital/resubmit/${hospital.id}`}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-md"
        >
          <FiRefreshCw className="h-4 w-4" />
          Edit &amp; Resubmit
        </Link>
        <a
          href="mailto:support@medivault.in"
          className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm"
        >
          <FiMail className="h-4 w-4" />
          Contact Support
        </a>
        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-all text-sm"
        >
          <FiLogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function SuspendedScreen({ hospital, onLogout }) {
  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <FiAlertCircle className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital Account Suspended</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Your hospital account has been suspended by the platform administrator.
        </p>
      </div>

      {hospital.suspensionReason && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl px-6 py-4 mb-6">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-2">Suspension Reason</p>
          <p className="text-orange-800 text-sm leading-relaxed">{hospital.suspensionReason}</p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-6 text-sm text-gray-600">
        <p className="mb-2">To resolve this issue, contact our support team:</p>
        <p className="flex items-center gap-2 mb-1">
          <FiMail className="h-4 w-4 text-gray-400" />
          <a href="mailto:support@medivault.in" className="text-cyan-600 underline">support@medivault.in</a>
        </p>
        <p className="flex items-center gap-2">
          <FiPhone className="h-4 w-4 text-gray-400" />
          1800-XXX-XXXX (toll free, Mon–Sat 9 AM – 6 PM IST)
        </p>
      </div>

      <div className="text-center">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-all text-sm"
        >
          <FiLogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function HospitalStatusPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const hospitalId = localStorage.getItem('mv_hospital_id');
    if (!hospitalId) {
      // No hospital ID — could be a fresh session; redirect to login
      router.replace('/login');
      return;
    }

    apiClient.get(`/hospital/${hospitalId}/status`)
      .then(res => {
        const h = res.data?.data;
        if (!h) { setError('Hospital not found'); return; }

        // If approved, redirect to dashboard
        if (h.status === 'approved') {
          router.replace('/hospital/dashboard');
          return;
        }
        setHospital(h);
      })
      .catch(() => setError('Failed to load hospital status. Please try again.'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <Head><title>Verification Status – MediVault</title></Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-800 to-blue-900 flex items-center justify-center p-4">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-2xl">
                <MdLocalHospital className="h-10 w-10 text-cyan-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-cyan-700">MediVault</h1>
            <p className="text-gray-500 text-sm mt-1">Hospital Verification Status</p>
          </div>

          {loading && (
            <div className="flex flex-col items-center py-12 gap-4">
              <svg className="h-8 w-8 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-500 text-sm">Checking status…</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-8">
              <FiAlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-700 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && hospital && (
            <>
              {hospital.status === 'pending'   && <PendingScreen   hospital={hospital} onLogout={handleLogout} />}
              {hospital.status === 'rejected'  && <RejectedScreen  hospital={hospital} onLogout={handleLogout} />}
              {hospital.status === 'suspended' && <SuspendedScreen hospital={hospital} onLogout={handleLogout} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

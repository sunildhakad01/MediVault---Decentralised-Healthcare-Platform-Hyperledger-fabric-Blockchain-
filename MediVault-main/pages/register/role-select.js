import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaHospitalUser, FaUserMd } from 'react-icons/fa';
import { MdLocalHospital, MdHealthAndSafety } from 'react-icons/md';
import { FiArrowRight } from 'react-icons/fi';

export default function RoleSelectPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest =
        user.userType === 'doctor'  ? '/doctor/dashboard'  :
        user.userType === 'admin'   ? '/admin/dashboard'   :
        '/patient/dashboard';
      router.replace(dest);
    }
  }, [isAuthenticated, user, router]);

  return (
    <>
      <Head><title>Join MediVault – Choose Your Role</title></Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-emerald-800 to-cyan-900 flex items-center justify-center p-4">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl">
                <MdLocalHospital className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-emerald-700">MediVault</h1>
            <p className="text-gray-500 text-sm mt-1">How are you joining today?</p>
          </div>

          {/* Role Cards */}
          <div className="space-y-4 mb-6">
            {/* Patient */}
            <button
              onClick={() => router.push('/register?role=patient')}
              className="w-full flex items-center gap-4 p-5 border-2 border-gray-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 group text-left"
            >
              <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition shrink-0">
                <FaHospitalUser className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-800 group-hover:text-emerald-700 transition">
                  Register as Patient
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Book appointments, access records, order medicines
                </p>
              </div>
              <FiArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition shrink-0" />
            </button>

            {/* Doctor */}
            <button
              onClick={() => router.push('/register?role=doctor')}
              className="w-full flex items-center gap-4 p-5 border-2 border-gray-200 rounded-2xl hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 group text-left"
            >
              <div className="p-3 bg-teal-100 rounded-xl group-hover:bg-teal-200 transition shrink-0">
                <FaUserMd className="h-8 w-8 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-800 group-hover:text-teal-700 transition">
                  Register as Doctor
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage patients, issue prescriptions, track appointments
                </p>
              </div>
              <FiArrowRight className="h-5 w-5 text-gray-400 group-hover:text-teal-600 transition shrink-0" />
            </button>

            {/* Hospital */}
            <button
              onClick={() => router.push('/register?role=hospital')}
              className="w-full flex items-center gap-4 p-5 border-2 border-gray-200 rounded-2xl hover:border-cyan-400 hover:bg-cyan-50 transition-all duration-200 group text-left"
            >
              <div className="p-3 bg-cyan-100 rounded-xl group-hover:bg-cyan-200 transition shrink-0">
                <MdLocalHospital className="h-8 w-8 text-cyan-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-800 group-hover:text-cyan-700 transition">
                  Register a Hospital
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Onboard your hospital, manage doctors &amp; appointments
                </p>
              </div>
              <FiArrowRight className="h-5 w-5 text-gray-400 group-hover:text-cyan-600 transition shrink-0" />
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Sign In */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full border-2 border-emerald-200 text-emerald-700 font-semibold py-3 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition"
          >
            <MdHealthAndSafety className="h-5 w-5" />
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </>
  );
}

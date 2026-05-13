import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import {
  FiHeart,
  FiActivity,
  FiShield,
  FiUsers,
  FiCalendar,
  FiShoppingBag,
  FiFileText,
  FiTrendingUp,
  FiCheckCircle,
  FiStar,
  FiArrowRight,
  FiPlay,
  FiAward,
  FiClock,
  FiGlobe,
  FiLock,
  FiUserCheck,
  FiSmartphone,
  FiZap,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdSecurity,
  MdVerifiedUser,
  MdHealthAndSafety,
  MdMedicalServices,
  MdVaccines,
  MdBiotech,
  MdPrecisionManufacturing,
  MdEmergency,
  MdPhoneCallback,
  MdLocalPharmacy,
  MdMonitorHeart,
  MdPsychology,
  MdBloodtype,
  MdCoronavirus,
  MdElderly,
} from "react-icons/md";
import {
  FaStethoscope,
  FaSyringe,
  FaHeartbeat,
  FaNotesMedical,
  FaAmbulance,
  FaUserMd,
  FaPrescriptionBottleAlt,
  FaHospitalUser,
  FaMicroscope,
  FaXRay,
  FaThermometerHalf,
} from "react-icons/fa";
import { Card, Button, Badge } from "../components/common";
import LoadingSpinner from "../components/common/LoadingSpinner";
import apiClient from "../utils/api";

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalHospitals: 0,
    totalAppointments: 0,
  });

  const [showSignInOptions, setShowSignInOptions] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const whoAreYouRef = useRef(null);

  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Redirect logged-in users straight to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const dest =
        user.userType === 'doctor' ? '/doctor/dashboard' :
        user.userType === 'admin'  ? '/admin/dashboard'  :
        '/patient/dashboard';
      router.replace(dest);
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated) { setLoading(false); return; }
    const controller = new AbortController();
    apiClient.get('/admin/stats', { signal: controller.signal }).then(res => {
      const d = res.data?.data || res.data || {};
      setStats({
        totalDoctors: d.totalDoctors || 0,
        totalPatients: d.totalPatients || 0,
        totalHospitals: d.totalHospitals || 0,
        totalAppointments: d.totalAppointments || 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
    return () => controller.abort();
  }, [isAuthenticated]);

  // Show landing page for non-registered users
  return (
    <>
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-teal-900 via-emerald-800 to-cyan-900 text-white overflow-hidden">
        {/* Medical Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-32 right-10 w-72 h-72 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-32 left-32 w-72 h-72 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>

          {/* Floating Medical Icons */}
          <div className="absolute top-20 right-1/4 opacity-10 animate-float">
            <FaStethoscope className="h-16 w-16 text-white" />
          </div>
          <div className="absolute bottom-20 left-1/4 opacity-10 animate-float animation-delay-3000">
            <FaHeartbeat className="h-12 w-12 text-white" />
          </div>
          <div className="absolute top-1/2 right-20 opacity-10 animate-float animation-delay-1000">
            <MdVaccines className="h-14 w-14 text-white" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-8">
                <div className="relative">
                  <div className="p-4 bg-white bg-opacity-20 rounded-3xl backdrop-blur-lg border border-white border-opacity-30 shadow-2xl">
                    <div className="relative">
                      <MdLocalHospital className="h-16 w-16" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full animate-ping"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="mb-6">
                <span className="inline-flex items-center bg-white text-emerald-700 border border-emerald-300 px-4 py-2 text-sm font-semibold rounded-full shadow-md">
                  <FaStethoscope className="mr-2 h-4 w-4 text-emerald-600" />
                  Blockchain Healthcare Platform
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                  Revolutionary
                </span>
                <br />
                <span className="text-white flex items-center gap-4">
                  Healthcare
                  <FaHeartbeat className="h-16 w-16 text-emerald-400 animate-pulse" />
                </span>
                <br />
                <span className="bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-transparent">
                  on Blockchain
                </span>
              </h1>

              <p className="text-xl lg:text-2xl mb-8 text-emerald-100 leading-relaxed">
                Experience the future of healthcare with our decentralized
                platform. Secure medical records, verified doctors, and
                transparent treatment powered by blockchain technology.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Button
                  size="large"
                  onClick={() => setShowSignInOptions(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-emerald-500/25 transform hover:-translate-y-1 transition-all duration-300 rounded-xl"
                >
                  <MdHealthAndSafety className="mr-2 h-5 w-5" />
                  Sign In
                  <FiArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="large"
                  onClick={() => whoAreYouRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="border-2 border-white text-white hover:bg-white hover:text-teal-700 px-8 py-4 text-lg font-semibold backdrop-blur-sm hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 rounded-xl"
                >
                  <FaHospitalUser className="mr-2 h-5 w-5" />
                  New User? Register
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-emerald-200">
                <div className="flex items-center space-x-2 bg-white bg-opacity-10 rounded-full px-4 py-2 backdrop-blur-sm">
                  <FiShield className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Blockchain Secured
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-white bg-opacity-10 rounded-full px-4 py-2 backdrop-blur-sm">
                  <MdVerifiedUser className="h-5 w-5" />
                  <span className="text-sm font-medium">Doctor Verified</span>
                </div>
                <div className="flex items-center space-x-2 bg-white bg-opacity-10 rounded-full px-4 py-2 backdrop-blur-sm">
                  <FiGlobe className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Globally Accessible
                  </span>
                </div>
              </div>
            </div>

            {/* Right Content - Medical Stats Dashboard */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-6 bg-gradient-to-br from-white/10 to-emerald-500/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 rounded-2xl group">
                  <div className="text-center">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full w-fit mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                      <FaUserMd className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {stats.totalDoctors}
                    </h3>
                    <p className="text-emerald-200 text-sm font-medium">
                      Verified Doctors
                    </p>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-white/10 to-cyan-500/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 rounded-2xl group">
                  <div className="text-center">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full w-fit mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                      <FaHospitalUser className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {stats.totalPatients}
                    </h3>
                    <p className="text-emerald-200 text-sm font-medium">
                      Active Patients
                    </p>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-white/10 to-purple-500/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 rounded-2xl group">
                  <div className="text-center">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full w-fit mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                      <MdLocalHospital className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {stats.totalHospitals}
                    </h3>
                    <p className="text-emerald-200 text-sm font-medium">
                      Verified Hospitals
                    </p>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-white/10 to-orange-500/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 rounded-2xl group">
                  <div className="text-center">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-full w-fit mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                      <FaStethoscope className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {stats.totalAppointments}
                    </h3>
                    <p className="text-emerald-200 text-sm font-medium">
                      Consultations Done
                    </p>
                  </div>
                </Card>
              </div>

              {/* Medical Floating Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full opacity-20 animate-bounce animation-delay-1000"></div>
              <div className="absolute bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full opacity-30 animate-pulse"></div>
              <div className="absolute top-1/2 -right-8 opacity-20">
                <FaHeartbeat className="h-8 w-8 text-emerald-300 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
            </div>
            <FaHeartbeat className="h-4 w-4 text-emerald-300 mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ── Who Are You? – 7 Stakeholder Cards ──────────────────────────── */}
      <section ref={whoAreYouRef} className="py-24 bg-white relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 text-sm font-semibold mb-6 rounded-full">
              <MdHealthAndSafety className="mr-2 h-4 w-4" />
              Built for Every Healthcare Stakeholder
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Who Are{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                You?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              MediVault serves every participant in the healthcare ecosystem. Choose your role to get started — every stakeholder can interact with others through patient-consented data sharing.
            </p>
          </div>

          {/* Active Cards — Patient, Doctor, Hospital */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Patient */}
            <button
              onClick={() => router.push("/register?role=patient")}
              className="group p-8 bg-gradient-to-br from-white to-emerald-50 border-2 border-transparent hover:border-emerald-300 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-left"
            >
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl w-fit mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FaHospitalUser className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Patient</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Own your health records, book appointments, manage everything in one place
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {["Lifelong Health Record", "Book Appointments", "Digital Prescriptions", "Consent Control", "Insurance & Schemes"].map((f) => (
                  <span key={f} className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">{f}</span>
                ))}
              </div>
              <div className="flex items-center text-emerald-600 font-semibold text-sm group-hover:text-emerald-700">
                Get Started
                <FiArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Doctor */}
            <button
              onClick={() => router.push("/register?role=doctor")}
              className="group p-8 bg-gradient-to-br from-white to-teal-50 border-2 border-transparent hover:border-teal-300 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-left"
            >
              <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl w-fit mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FaUserMd className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Doctor</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Access patient history, prescribe digitally, manage your appointments
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {["Patient History", "Digital Prescriptions", "Appointments", "AI Insights", "Hospital Affiliations"].map((f) => (
                  <span key={f} className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-medium">{f}</span>
                ))}
              </div>
              <div className="flex items-center text-teal-600 font-semibold text-sm group-hover:text-teal-700">
                Get Started
                <FiArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Hospital */}
            <button
              onClick={() => router.push("/hospital/register")}
              className="group p-8 bg-gradient-to-br from-white to-cyan-50 border-2 border-transparent hover:border-cyan-300 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-left"
            >
              <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl w-fit mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MdLocalHospital className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hospital</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Manage your doctors, patients, and records on one verified platform
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {["Doctor Management", "Patient Records", "Lab Uploads", "Appointments", "Analytics"].map((f) => (
                  <span key={f} className="text-xs bg-cyan-100 text-cyan-700 px-2.5 py-1 rounded-full font-medium">{f}</span>
                ))}
              </div>
              <div className="flex items-center text-cyan-600 font-semibold text-sm group-hover:text-cyan-700">
                Register Hospital
                <FiArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Scroll arrow to reveal Coming Soon Cards */}
          <div className="flex flex-col items-center mt-4 mb-2">
            <p className="text-sm text-gray-400 font-medium mb-2">More roles coming soon</p>
            <button
              onClick={() => setShowComingSoon(prev => !prev)}
              aria-label={showComingSoon ? "Hide coming soon roles" : "Show coming soon roles"}
              className="flex flex-col items-center group focus:outline-none"
            >
              <div className={`w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white shadow-sm group-hover:border-emerald-400 group-hover:shadow-md transition-all duration-300 ${showComingSoon ? "rotate-180" : "animate-bounce"}`}>
                <svg className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Coming Soon Cards — Researcher, Insurance, Government, Pharmacy */}
          <div
            className="overflow-hidden transition-all duration-500"
            style={{ maxHeight: showComingSoon ? "600px" : "0px", opacity: showComingSoon ? 1 : 0 }}
          >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
            {[
              {
                icon: FaMicroscope,
                title: "Researcher",
                desc: "Access anonymised health data and request patient consent for studies",
                tags: ["Anonymised Data", "Consent Studies", "Population Analytics"],
              },
              {
                icon: FiShield,
                title: "Insurance Company",
                desc: "Verify policyholder records and process claims automatically",
                tags: ["Claim Processing", "Record Verification", "Policy Management"],
              },
              {
                icon: MdVerifiedUser,
                title: "Government Agency",
                desc: "Access population health analytics and verify scheme eligibility",
                tags: ["Health Analytics", "Scheme Verification", "Aggregate Data"],
              },
              {
                icon: MdLocalPharmacy,
                title: "Pharmacy",
                desc: "List your medicines, receive digital prescriptions, manage orders",
                tags: ["Digital Rx", "Order Management", "Stock & Pricing"],
              },
            ].map(({ icon: Icon, title, desc, tags }) => (
              <div
                key={title}
                className="relative p-6 bg-gray-50 border-2 border-gray-100 rounded-2xl cursor-not-allowed select-none"
                style={{ opacity: 0.65 }}
              >
                <div className="absolute top-3 right-3 bg-gray-200 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
                  Coming Soon
                </div>
                <div className="p-3 bg-gray-300 rounded-xl w-fit mb-4">
                  <Icon className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-base font-bold text-gray-500 mb-1">{title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-3">{desc}</p>
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span key={t} className="text-xs bg-gray-200 text-gray-400 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ── How It Works — 5-Step Flow ───────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10">
            <FaHeartbeat className="h-32 w-32 text-emerald-600" />
          </div>
          <div className="absolute bottom-10 right-10">
            <FaStethoscope className="h-28 w-28 text-teal-600" />
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              From Sign-Up to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                Secure Access
              </span>
            </h2>
            <p className="text-gray-600 text-lg">Five simple steps — the same for every stakeholder</p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch justify-center gap-3">
            {[
              { label: "Register", desc: "Create your account by role", icon: FiUserCheck, num: "01", color: "emerald" },
              { label: "Verify", desc: "OTP & identity verification", icon: FiShield, num: "02", color: "teal" },
              { label: "Connect", desc: "Link with your institution", icon: FiUsers, num: "03", color: "cyan" },
              { label: "Consent", desc: "Patient grants data access", icon: FiLock, num: "04", color: "blue" },
              { label: "Access", desc: "Role-specific secure dashboard", icon: FiActivity, num: "05", color: "indigo" },
            ].map(({ label, desc, icon: Icon, num, color }, i) => (
              <div key={label} className="flex flex-row md:flex-col items-center gap-3 md:gap-0 flex-1">
                <div className={`relative flex flex-col items-center bg-white rounded-2xl p-5 shadow-sm border-2 border-${color}-100 hover:shadow-md transition-shadow flex-1 w-full`}>
                  <div className="text-xs font-bold text-gray-300 mb-2">{num}</div>
                  <div className={`p-3 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl shadow mb-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className={`text-sm font-bold text-${color}-700 mb-1`}>{label}</div>
                  <div className="text-xs text-gray-500 text-center leading-relaxed">{desc}</div>
                </div>
                {i < 4 && (
                  <div className="flex items-center justify-center md:w-full md:h-8">
                    <FiArrowRight className="h-5 w-5 text-gray-300 rotate-0 md:rotate-0 flex-shrink-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Patient Consent is at the Center ─────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <FiLock className="absolute top-6 left-8 h-24 w-24" />
          <FiShield className="absolute bottom-6 right-8 h-28 w-28" />
          <FiUsers className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-64 w-64" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-5 bg-white bg-opacity-20 rounded-2xl w-fit mx-auto mb-6 backdrop-blur-sm shadow-lg">
            <FiLock className="h-10 w-10" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-5">
            Patient Consent is at the Center of Everything
          </h2>
          <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            No health data is ever shared without explicit patient approval. Doctors, hospitals, insurers, and researchers must all request access — and only the patient can grant it.
            Your data belongs to you. Always.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: FiShield, text: "Zero data shared without consent" },
              { icon: FiLock, text: "Revoke any permission, any time" },
              { icon: FiCheckCircle, text: "Full audit trail on every share" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center justify-center gap-3 bg-white bg-opacity-15 rounded-xl px-4 py-4 backdrop-blur-sm">
                <Icon className="h-5 w-5 flex-shrink-0 text-emerald-300" />
                <span className="font-medium text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Showcase */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white to-cyan-50/50"></div>

        {/* Medical Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20">
            <FaStethoscope className="h-32 w-32 text-emerald-600" />
          </div>
          <div className="absolute bottom-20 right-20">
            <MdLocalHospital className="h-40 w-40 text-teal-600" />
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <FaHeartbeat className="h-64 w-64 text-cyan-600" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 text-sm font-semibold mb-6 rounded-full">
              <MdHealthAndSafety className="mr-2 h-4 w-4" />
              Advanced Medical Platform
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why Choose{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                MediVault?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience the perfect blend of cutting-edge blockchain technology
              and compassionate healthcare, designed to revolutionize your
              medical journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Enhanced Feature Cards with Medical Icons */}
            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group bg-gradient-to-br from-white to-emerald-50 border-2 border-transparent hover:border-emerald-200 rounded-2xl">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FiLock className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Military-Grade Security
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Your medical data is protected by advanced blockchain encryption
                and decentralized storage, ensuring complete privacy and
                unbreachable security.
              </p>
              <div className="mt-4 flex justify-center space-x-2">
                <MdSecurity className="h-5 w-5 text-emerald-500" />
                <MdBiotech className="h-5 w-5 text-teal-500" />
                <FiShield className="h-5 w-5 text-cyan-500" />
              </div>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group bg-gradient-to-br from-white to-cyan-50 border-2 border-transparent hover:border-cyan-200 rounded-2xl">
              <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-3xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FaUserMd className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Verified Medical Professionals
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Every doctor undergoes rigorous verification through our
                blockchain-based credentialing system, ensuring you receive care
                from qualified professionals.
              </p>
              <div className="mt-4 flex justify-center space-x-2">
                <MdVerifiedUser className="h-5 w-5 text-cyan-500" />
                <FaStethoscope className="h-5 w-5 text-blue-500" />
                <MdMedicalServices className="h-5 w-5 text-indigo-500" />
              </div>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group bg-gradient-to-br from-white to-purple-50 border-2 border-transparent hover:border-purple-200 rounded-2xl">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FaNotesMedical className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Comprehensive Health Records
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Access your complete medical history, prescriptions, and
                treatment records anytime, anywhere, with full ownership and
                control over your health data.
              </p>
              <div className="mt-4 flex justify-center space-x-2">
                <FiFileText className="h-5 w-5 text-purple-500" />
                <MdHealthAndSafety className="h-5 w-5 text-pink-500" />
                <FaXRay className="h-5 w-5 text-indigo-500" />
              </div>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group bg-gradient-to-br from-white to-orange-50 border-2 border-transparent hover:border-orange-200 rounded-2xl">
              <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FaStethoscope className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Smart Medical Appointments
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Book consultations with verified doctors through our smart
                contract system with transparent pricing, automated scheduling,
                and instant confirmations.
              </p>
              <div className="mt-4 flex justify-center space-x-2">
                <FiCalendar className="h-5 w-5 text-orange-500" />
                <MdPhoneCallback className="h-5 w-5 text-red-500" />
                <FiClock className="h-5 w-5 text-yellow-500" />
              </div>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group bg-gradient-to-br from-white to-indigo-50 border-2 border-transparent hover:border-indigo-200 rounded-2xl">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MdLocalPharmacy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Verified Medicine Marketplace
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Purchase prescribed medicines directly through our platform with
                complete traceability, authenticity verification, and quality
                assurance guarantees.
              </p>
              <div className="mt-4 flex justify-center space-x-2">
                <FaPrescriptionBottleAlt className="h-5 w-5 text-indigo-500" />
                <FaSyringe className="h-5 w-5 text-purple-500" />
                <MdVaccines className="h-5 w-5 text-blue-500" />
              </div>
            </Card>

            <Card className="p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group bg-gradient-to-br from-white to-teal-50 border-2 border-transparent hover:border-teal-200 rounded-2xl">
              <div className="p-4 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-3xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MdMonitorHeart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                AI-Powered Health Analytics
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Track your health journey with advanced analytics, AI-driven
                insights, and personalized recommendations powered by blockchain
                transparency.
              </p>
              <div className="mt-4 flex justify-center space-x-2">
                <FiTrendingUp className="h-5 w-5 text-teal-500" />
                <MdPsychology className="h-5 w-5 text-emerald-500" />
                <FaMicroscope className="h-5 w-5 text-green-500" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-teal-900 via-emerald-800 to-cyan-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>

          {/* Medical Background Elements */}
          <div className="absolute top-1/4 right-1/4 opacity-5">
            <FaHeartbeat className="h-32 w-32 text-white animate-pulse" />
          </div>
          <div className="absolute bottom-1/4 left-1/4 opacity-5">
            <FaStethoscope className="h-24 w-24 text-white" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-3 text-sm font-semibold mb-6 rounded-full">
              <FaAmbulance className="mr-2 h-4 w-4" />
              Simple Medical Process
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Get Started in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
                3 Simple Steps
              </span>
            </h2>
            <p className="text-xl text-emerald-100 leading-relaxed">
              Join the future of healthcare with our streamlined onboarding
              process designed for both patients and medical professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 - Enhanced */}
            <div className="text-center relative">
              <div className="relative mb-8">
                <div className="p-8 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full w-fit mx-auto shadow-2xl relative">
                  <span className="text-3xl font-bold">1</span>
                  <div className="absolute -top-2 -right-2 p-2 bg-white rounded-full">
                    <FiSmartphone className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="hidden md:block absolute top-1/2 left-full w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent transform -translate-y-1/2"></div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
                <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                  <FiSmartphone className="h-6 w-6 text-emerald-300" />
                  Sign In to Your Account
                </h3>
                <p className="text-emerald-100 leading-relaxed">
                  Sign up or log in using your mobile number or email address.
                  Verify your identity with a secure OTP and get instant access
                  to your personal healthcare dashboard.
                </p>
                <div className="mt-4 flex justify-center space-x-2">
                  <FiSmartphone className="h-5 w-5 text-emerald-300" />
                  <MdSecurity className="h-5 w-5 text-teal-300" />
                  <FiShield className="h-5 w-5 text-cyan-300" />
                </div>
              </div>
            </div>

            {/* Step 2 - Enhanced */}
            <div className="text-center relative">
              <div className="relative mb-8">
                <div className="p-8 bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-full w-fit mx-auto shadow-2xl relative">
                  <span className="text-3xl font-bold">2</span>
                  <div className="absolute -top-2 -right-2 p-2 bg-white rounded-full">
                    <FaUserMd className="h-4 w-4 text-cyan-600" />
                  </div>
                </div>
                <div className="hidden md:block absolute top-1/2 left-full w-full h-1 bg-gradient-to-r from-cyan-500 to-transparent transform -translate-y-1/2"></div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
                <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                  <FaHospitalUser className="h-6 w-6 text-cyan-300" />
                  Create Your Medical Profile
                </h3>
                <p className="text-emerald-100 leading-relaxed">
                  Register as a patient or doctor with secure IPFS storage. Your
                  medical data is encrypted and stored on the blockchain with
                  complete privacy and ownership control.
                </p>
                <div className="mt-4 flex justify-center space-x-2">
                  <MdVerifiedUser className="h-5 w-5 text-cyan-300" />
                  <FaNotesMedical className="h-5 w-5 text-blue-300" />
                  <MdHealthAndSafety className="h-5 w-5 text-indigo-300" />
                </div>
              </div>
            </div>

            {/* Step 3 - Enhanced */}
            <div className="text-center">
              <div className="mb-8">
                <div className="p-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full w-fit mx-auto shadow-2xl relative">
                  <span className="text-3xl font-bold">3</span>
                  <div className="absolute -top-2 -right-2 p-2 bg-white rounded-full">
                    <FaHeartbeat className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
                <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                  <MdMonitorHeart className="h-6 w-6 text-purple-300" />
                  Start Your Health Journey
                </h3>
                <p className="text-emerald-100 leading-relaxed">
                  Book appointments, manage prescriptions, access medical
                  records, and take complete control of your healthcare with
                  transparency, security, and innovation.
                </p>
                <div className="mt-4 flex justify-center space-x-2">
                  <FaStethoscope className="h-5 w-5 text-purple-300" />
                  <FaPrescriptionBottleAlt className="h-5 w-5 text-pink-300" />
                  <MdLocalPharmacy className="h-5 w-5 text-indigo-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Call to Action */}
      <section className="py-24 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10"></div>

          {/* Medical Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10">
              <FaStethoscope className="h-24 w-24 text-white animate-pulse" />
            </div>
            <div className="absolute top-20 right-20">
              <FaHeartbeat className="h-32 w-32 text-white" />
            </div>
            <div className="absolute bottom-20 left-20">
              <MdLocalHospital className="h-28 w-28 text-white" />
            </div>
            <div className="absolute bottom-10 right-10">
              <FaUserMd className="h-20 w-20 text-white animate-pulse" />
            </div>
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="p-6 bg-white bg-opacity-20 rounded-3xl w-fit mx-auto backdrop-blur-lg shadow-2xl">
              <div className="relative">
                <MdHealthAndSafety className="h-16 w-16" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full animate-ping"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-cyan-200">
              Healthcare Experience?
            </span>
          </h2>
          <p className="text-xl lg:text-2xl mb-12 text-emerald-100 leading-relaxed">
            Join thousands of patients and doctors already using our secure,
            decentralized healthcare platform. Take control of your health data
            and experience the future of medicine today.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="large"
              onClick={() => setShowSignInOptions(true)}
              className="bg-white text-emerald-600 hover:bg-emerald-50 px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 rounded-2xl"
            >
              <MdHealthAndSafety className="mr-3 h-6 w-6" />
              Sign In
              <FiArrowRight className="ml-3 h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="large"
              onClick={() => whoAreYouRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 px-12 py-6 text-xl font-bold backdrop-blur-sm hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 rounded-2xl"
            >
              <FaHospitalUser className="mr-3 h-6 w-6" />
              New User? Register
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-emerald-200">
            <div className="flex items-center justify-center space-x-2 bg-white bg-opacity-10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <FiCheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="font-medium">Blockchain Secured</span>
            </div>
            <div className="flex items-center justify-center space-x-2 bg-white bg-opacity-10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <FiCheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="font-medium">HIPAA Compliant</span>
            </div>
            <div className="flex items-center justify-center space-x-2 bg-white bg-opacity-10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <FiCheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="font-medium">24/7 Available</span>
            </div>
            <div className="flex items-center justify-center space-x-2 bg-white bg-opacity-10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <FiCheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="font-medium">Global Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Platform Features Grid */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-emerald-25 to-teal-25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 text-sm font-semibold mb-6 rounded-full">
              <MdLocalHospital className="mr-2 h-4 w-4" />
              Complete Medical Ecosystem
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                Modern Healthcare
              </span>
            </h2>
            <p className="text-gray-600 text-lg">
              Comprehensive healthcare management powered by blockchain
              technology
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: FaNotesMedical,
                text: "Secure Medical Records",
                color: "emerald",
                bgColor: "emerald-50",
              },
              {
                icon: FaUserMd,
                text: "Doctor Verification",
                color: "teal",
                bgColor: "teal-50",
              },
              {
                icon: FaStethoscope,
                text: "Smart Appointments",
                color: "cyan",
                bgColor: "cyan-50",
              },
              {
                icon: FaPrescriptionBottleAlt,
                text: "Medicine Tracking",
                color: "blue",
                bgColor: "blue-50",
              },
              {
                icon: MdBiotech,
                text: "IPFS Storage",
                color: "indigo",
                bgColor: "indigo-50",
              },
              {
                icon: FiShield,
                text: "Blockchain Security",
                color: "purple",
                bgColor: "purple-50",
              },
              {
                icon: MdPhoneCallback,
                text: "Real-time Chat",
                color: "pink",
                bgColor: "pink-50",
              },
              {
                icon: MdEmergency,
                text: "Live Notifications",
                color: "red",
                bgColor: "red-50",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-6 bg-${feature.bgColor} rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-${feature.color}-100 group`}
              >
                <div
                  className={`p-2 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-xl shadow-sm group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-gray-900 font-semibold text-sm">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Additional Medical Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full w-fit mx-auto mb-4">
                <MdHealthAndSafety className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">99.9%</h3>
              <p className="text-gray-600 font-medium">Platform Uptime</p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
              <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full w-fit mx-auto mb-4">
                <FaThermometerHalf className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">&lt;2s</h3>
              <p className="text-gray-600 font-medium">Average Response Time</p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full w-fit mx-auto mb-4">
                <MdCoronavirus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">256-bit</h3>
              <p className="text-gray-600 font-medium">Encryption Standard</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    {/* ── Sign In Options Modal ──────────────────────────────────────────── */}
    {showSignInOptions && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
        onClick={() => setShowSignInOptions(false)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => setShowSignInOptions(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none font-bold transition-colors"
          >
            ×
          </button>

          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl">
                <MdLocalHospital className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Sign In to MediVault</h2>
            <p className="text-gray-500 text-sm mt-1">Choose your role to continue</p>
          </div>

          {/* Active roles */}
          <div className="space-y-3 mb-4">
            {[
              { label: 'Patient',  icon: <FaHospitalUser className="h-5 w-5" />,   href: '/login', color: 'from-emerald-500 to-teal-500' },
              { label: 'Doctor',   icon: <FaUserMd className="h-5 w-5" />,          href: '/login', color: 'from-teal-500 to-cyan-500' },
              { label: 'Hospital', icon: <MdLocalHospital className="h-5 w-5" />,   href: '/login', color: 'from-cyan-500 to-blue-500' },
            ].map(({ label, icon, href, color }) => (
              <button
                key={label}
                onClick={() => { setShowSignInOptions(false); router.push(href); }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-white font-semibold bg-gradient-to-r ${color} hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
              >
                {icon}
                <span>Sign In as {label}</span>
                <FiArrowRight className="ml-auto h-4 w-4" />
              </button>
            ))}
          </div>

          {/* Coming soon roles */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Coming Soon</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Researcher',        icon: <FaMicroscope className="h-4 w-4" /> },
              { label: 'Insurance Company', icon: <FiShield className="h-4 w-4" /> },
              { label: 'Government Agency', icon: <FiGlobe className="h-4 w-4" /> },
              { label: 'Pharmacy',          icon: <MdLocalPharmacy className="h-4 w-4" /> },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed select-none"
              >
                {icon}
                <span className="truncate">{label}</span>
                <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Soon</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default HomePage;

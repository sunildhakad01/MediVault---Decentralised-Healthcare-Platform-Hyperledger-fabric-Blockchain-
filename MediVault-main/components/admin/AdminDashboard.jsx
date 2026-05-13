import { useState, useEffect, useCallback } from "react";
import {
  FiUsers,
  FiCalendar,
  FiActivity,
  FiTrendingUp,
  FiPlusCircle,
  FiEye,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiBarChart,
  FiDatabase,
  FiLock,
  FiGlobe,
  FiServer,
  FiMonitor,
  FiXCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiLogOut,
  FiBell,
} from "react-icons/fi";
import {
  MdAdminPanelSettings,
  MdSecurity,
  MdVerifiedUser,
  MdHealthAndSafety,
  MdMedicalServices,
  MdInventory,
  MdLocalHospital,
} from "react-icons/md";
import {
  FaUserMd,
  FaStethoscope,
  FaHospitalUser,
  FaPrescriptionBottleAlt,
  FaHospital,
} from "react-icons/fa";

import { Card, Badge, Button } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import { useRouter } from "next/router";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";

// ─── Mock data used when Fabric backend is unavailable ───────────────────────
const MOCK_STATS = {
  totalDoctors: 12,
  approvedDoctors: 9,
  pendingDoctors: 3,
  totalPatients: 48,
  totalMedicines: 31,
  activeMedicines: 28,
  totalAppointments: 124,
  activeAppointments: 7,
};

// ─── Hospital type label helper ───────────────────────────────────────────────
const hospitalTypeLabel = (type) => {
  const map = {
    government: "Government",
    private: "Private",
    clinic: "Clinic / Nursing Home",
    diagnostic: "Diagnostic Centre",
  };
  return map[type] || type;
};


// ─── Component ────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const router = useRouter();

  const [adminSession, setAdminSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(MOCK_STATS);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalTab, setHospitalTab] = useState("pending"); // 'pending' | 'all'
  const [actionLoading, setActionLoading] = useState(null); // hospitalId being processed
  const [reasonModal, setReasonModal] = useState(null); // { hospitalId, action } | null
  const [reasonText, setReasonText] = useState('');

  // ── Load admin session ──────────────────────────────────────────────────────
  useEffect(() => {
    const session = JSON.parse(
      localStorage.getItem("mv_admin_session") || "null"
    );
    if (!session) {
      router.replace("/admin/login");
      return;
    }
    setAdminSession(session);
  }, [router]);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, hospitalsRes] = await Promise.all([
        apiClient.get("/admin/stats").catch(() => null),
        apiClient.get("/admin/hospitals"),
      ]);

      if (statsRes?.data?.data) {
        setStats(statsRes.data.data);
      }

      let list = Array.isArray(hospitalsRes.data?.data)
        ? hospitalsRes.data.data
        : Array.isArray(hospitalsRes.data?.hospitals)
          ? hospitalsRes.data.hospitals
          : [];

      // Append any locally-cached pending registration not yet in the list
      try {
        const pending = JSON.parse(localStorage.getItem('hospital_registration_pending') || 'null');
        if (pending?.tempId && !list.some((h) => h.id === pending.tempId)) {
          list = [...list, pending];
        }
      } catch (_) {}

      setHospitals(list);
    } catch (err) {
      console.error("Failed to load hospitals:", err);
      toast.error("Failed to load hospital data. Please refresh.");
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminSession) { fetchData(); }
  }, [adminSession, fetchData]);

  // ── Hospital verification actions ──────────────────────────────────────────
  const openReasonModal = (hospitalId, action) => {
    setReasonText('');
    setReasonModal({ hospitalId, action });
  };

  const handleHospitalAction = async (hospitalId, action, reason) => {
    setActionLoading(hospitalId);
    setReasonModal(null);
    try {
      await apiClient.put(`/admin/hospitals/${hospitalId}/verify`, { action, reason });

      const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'suspend' ? 'suspended' : 'approved';
      setHospitals((prev) => prev.map((h) => h.id === hospitalId ? { ...h, status: newStatus } : h));
      toast.success(action === 'approve' ? 'Hospital approved' : action === 'reject' ? 'Hospital rejected' : action === 'suspend' ? 'Hospital suspended' : 'Hospital reinstated');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/admin/auth/logout');
    } catch (_) {
      // API failure must NOT block sign out
    } finally {
      [
        'mv_admin_session', 'mv_token', 'mv_refresh',
        'mv_user_id', 'mv_user_type',
      ].forEach((k) => localStorage.removeItem(k));
      window.location.href = '/admin/login';
    }
  };

  // ── Derived hospital stats ──────────────────────────────────────────────────
  const hospitalStats = {
    total: hospitals.length,
    pending: hospitals.filter((h) => h.status === "pending").length,
    approved: hospitals.filter((h) => h.status === "approved").length,
    rejected: hospitals.filter((h) => h.status === "rejected").length,
  };

  const displayedHospitals =
    hospitalTab === "pending"
      ? hospitals.filter((h) => h.status === "pending")
      : hospitals;

  // ── Status badge helpers ────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    if (status === "approved")
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none shadow-md text-xs">
          <FiCheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    if (status === "rejected")
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-none shadow-md text-xs">
          <FiXCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    return (
      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none shadow-md text-xs">
        <FiClock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="p-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-2xl">
              <MdAdminPanelSettings className="h-16 w-16 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-300 rounded-full animate-ping"></div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-6 text-gray-700 font-bold text-lg">
            Loading Admin Dashboard...
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Connecting to Hyperledger Fabric network
          </p>
        </div>
      </div>
    );
  }

  // ── Guard: no session ───────────────────────────────────────────────────────
  if (!adminSession) return null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <MdAdminPanelSettings className="absolute top-20 right-20 h-32 w-32 text-indigo-600 animate-pulse" />
        <FaStethoscope className="absolute bottom-20 left-20 h-24 w-24 text-purple-600" />
        <MdHealthAndSafety className="absolute top-1/2 left-1/4 h-28 w-28 text-blue-600 animate-pulse" />
      </div>

      {/* ── Welcome Header ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 rounded-2xl p-8 text-white shadow-2xl border-2 border-indigo-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-12 translate-y-12"></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm border border-white border-opacity-30 shadow-lg">
              <MdAdminPanelSettings className="h-12 w-12" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                Healthcare Admin Dashboard
                <MdHealthAndSafety className="h-8 w-8" />
              </h1>
              <p className="text-indigo-100 text-lg flex items-center gap-2">
                <MdSecurity className="h-4 w-4" />
                Hyperledger Fabric — complete healthcare management
              </p>
              <div className="mt-4 flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 bg-white bg-opacity-10 rounded-lg px-3 py-1">
                  <FiDatabase className="h-4 w-4" />
                  <span>Fabric Network</span>
                </div>
                <div className="flex items-center space-x-2 bg-white bg-opacity-10 rounded-lg px-3 py-1">
                  <FiShield className="h-4 w-4" />
                  <span>{adminSession.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-15 hover:bg-opacity-25 border border-white border-opacity-30 rounded-xl text-white text-sm font-medium transition-all duration-200"
          >
            <FiLogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Key Metrics Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg">
              <FaUserMd className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-teal-700 font-bold uppercase tracking-wide">
                Total Doctors
              </p>
              <p className="text-3xl font-bold text-teal-600">
                {stats.totalDoctors}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <FiCheckCircle className="h-3 w-3 text-emerald-500" />
                {stats.approvedDoctors} approved
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
              <FaHospitalUser className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-blue-700 font-bold uppercase tracking-wide">
                Total Patients
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalPatients}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MdVerifiedUser className="h-3 w-3 text-blue-500" />
                registered users
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
              <FaPrescriptionBottleAlt className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-purple-700 font-bold uppercase tracking-wide">
                Medicines
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalMedicines}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MdInventory className="h-3 w-3 text-emerald-500" />
                {stats.activeMedicines} active
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
              <FiCalendar className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-orange-700 font-bold uppercase tracking-wide">
                Appointments
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {stats.totalAppointments}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <FiActivity className="h-3 w-3 text-orange-500" />
                {stats.activeAppointments} active
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Hospital Analytics Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-cyan-50 to-teal-50 border-2 border-cyan-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg">
              <FaHospital className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-cyan-700 font-bold uppercase tracking-wide">
                Total Hospitals
              </p>
              <p className="text-3xl font-bold text-cyan-600">
                {hospitalStats.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">on platform</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
              <FiClock className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-yellow-700 font-bold uppercase tracking-wide">
                Pending
              </p>
              <p className="text-3xl font-bold text-yellow-600">
                {hospitalStats.pending}
              </p>
              <p className="text-xs text-gray-500 mt-1">awaiting review</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg">
              <FiCheckCircle className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-emerald-700 font-bold uppercase tracking-wide">
                Approved
              </p>
              <p className="text-3xl font-bold text-emerald-600">
                {hospitalStats.approved}
              </p>
              <p className="text-xs text-gray-500 mt-1">verified & live</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
              <FiXCircle className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-red-700 font-bold uppercase tracking-wide">
                Rejected
              </p>
              <p className="text-3xl font-bold text-red-600">
                {hospitalStats.rejected}
              </p>
              <p className="text-xs text-gray-500 mt-1">not approved</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Hospital Verification Section ────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 shadow-xl">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
                <MdLocalHospital className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Hospital Verification
                </h2>
                <p className="text-gray-600">
                  Review and approve hospital registration requests
                </p>
              </div>
            </div>

            {/* Tab toggle */}
            <div className="flex rounded-xl overflow-hidden border-2 border-indigo-200 shadow-md">
              <button
                onClick={() => setHospitalTab("pending")}
                className={`px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                  hospitalTab === "pending"
                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                    : "bg-white text-gray-600 hover:bg-indigo-50"
                }`}
              >
                Pending
                {hospitalStats.pending > 0 && (
                  <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs rounded-full px-2 py-0.5 font-bold">
                    {hospitalStats.pending}
                  </span>
                )}
              </button>
              <button
                onClick={() => setHospitalTab("all")}
                className={`px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                  hospitalTab === "all"
                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                    : "bg-white text-gray-600 hover:bg-indigo-50"
                }`}
              >
                All Hospitals
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {displayedHospitals.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-white to-indigo-50 rounded-2xl border-2 border-indigo-200">
                <div className="p-4 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full w-fit mx-auto mb-4 shadow-lg">
                  <FiCheckCircle className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {hospitalTab === "pending"
                    ? "No pending approvals"
                    : "No hospitals registered yet"}
                </h3>
                <p className="text-gray-600">
                  {hospitalTab === "pending"
                    ? "All hospital requests have been reviewed"
                    : "Hospital registrations will appear here"}
                </p>
              </div>
            ) : (
              displayedHospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  className="p-6 bg-gradient-to-br from-white to-indigo-50 rounded-2xl border-2 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div className="p-3 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-xl shadow-md flex-shrink-0">
                        <FaHospital className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-lg font-bold text-gray-900">
                            {hospital.name}
                          </p>
                          {getStatusBadge(hospital.status)}
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                            {hospitalTypeLabel(hospital.hospitalType)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-mono mt-1">
                          Reg# {hospital.registrationNumber}
                        </p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FiMapPin className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                            {hospital.city}, {hospital.state}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiMail className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                            {hospital.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiPhone className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                            {hospital.phone}
                          </span>
                          {hospital.specialisations && (
                            <span className="flex items-center gap-1">
                              <MdMedicalServices className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                              <span className="truncate">
                                {hospital.specialisations}
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <FiClock className="h-3 w-3" />
                          Submitted:{" "}
                          {new Date(hospital.submittedAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {hospital.status === "pending" && (
                      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <Button
                          onClick={() => handleHospitalAction(hospital.id, "approve")}
                          disabled={actionLoading === hospital.id}
                          className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white text-sm shadow-lg disabled:opacity-60"
                        >
                          {actionLoading === hospital.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          ) : <FiCheckCircle className="h-4 w-4 mr-1" />}
                          Approve
                        </Button>
                        <Button
                          onClick={() => openReasonModal(hospital.id, "reject")}
                          disabled={actionLoading === hospital.id}
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm shadow-lg disabled:opacity-60"
                        >
                          <FiXCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {hospital.status === "approved" && (
                      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <Button
                          onClick={() => openReasonModal(hospital.id, "suspend")}
                          disabled={actionLoading === hospital.id}
                          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm shadow-lg disabled:opacity-60"
                        >
                          <FiClock className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      </div>
                    )}
                    {hospital.status === "suspended" && (
                      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <Button
                          onClick={() => handleHospitalAction(hospital.id, "reinstate")}
                          disabled={actionLoading === hospital.id}
                          className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white text-sm shadow-lg disabled:opacity-60"
                        >
                          <FiCheckCircle className="h-4 w-4 mr-1" />
                          Reinstate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
        <div className="p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
              <FiActivity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Quick Actions
              </h2>
              <p className="text-gray-600">
                Administrative tools and management functions
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Button
              onClick={() => router.push("/admin/medicines/add")}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 rounded-xl"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <FiPlusCircle className="h-6 w-6" />
                </div>
                <span>Add Medicine</span>
              </div>
            </Button>
            <Button
              onClick={() => router.push("/admin/doctors")}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 rounded-xl"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <FiEye className="h-6 w-6" />
                </div>
                <span>Review Doctors</span>
              </div>
            </Button>
            <Button
              onClick={() => router.push("/admin/analytics")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 rounded-xl"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <FiTrendingUp className="h-6 w-6" />
                </div>
                <span>View Analytics</span>
              </div>
            </Button>
            <Button
              onClick={() => router.push("/admin/appointments")}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 rounded-xl"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <FiCalendar className="h-6 w-6" />
                </div>
                <span>Appointments</span>
              </div>
            </Button>
            <Button
              onClick={() => router.push("/admin/announcements")}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 rounded-xl"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <FiBell className="h-6 w-6" />
                </div>
                <span>Announcements</span>
              </div>
            </Button>
          </div>
        </div>
      </Card>

      {/* ── System Statistics ────────────────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-xl">
        <div className="p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
              <FiBarChart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                System Statistics
              </h2>
              <p className="text-gray-600">
                Healthcare platform performance metrics
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-blue-200 shadow-lg">
              <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl w-fit mx-auto mb-4 shadow-md">
                <FiActivity className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalAppointments}
              </p>
              <p className="text-sm text-gray-600 font-medium">
                Total Consultations
              </p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-white to-emerald-50 rounded-2xl border-2 border-emerald-200 shadow-lg">
              <div className="p-4 bg-gradient-to-r from-emerald-100 to-green-100 rounded-2xl w-fit mx-auto mb-4 shadow-md">
                <FiTrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-emerald-600 mb-2">
                {stats.totalDoctors > 0
                  ? Math.round(
                      (stats.approvedDoctors / stats.totalDoctors) * 100
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-gray-600 font-medium">
                Doctor Approval Rate
              </p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-purple-200 shadow-lg">
              <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl w-fit mx-auto mb-4 shadow-md">
                <FaPrescriptionBottleAlt className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-2">
                {stats.totalMedicines > 0
                  ? Math.round(
                      (stats.activeMedicines / stats.totalMedicines) * 100
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-gray-600 font-medium">
                Active Medicines
              </p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-white to-cyan-50 rounded-2xl border-2 border-cyan-200 shadow-lg">
              <div className="p-4 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-2xl w-fit mx-auto mb-4 shadow-md">
                <FaHospital className="h-8 w-8 text-cyan-600" />
              </div>
              <p className="text-3xl font-bold text-cyan-600 mb-2">
                {hospitalStats.total > 0
                  ? Math.round(
                      (hospitalStats.approved / hospitalStats.total) * 100
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-gray-600 font-medium">
                Hospital Approval Rate
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Platform Health ──────────────────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 shadow-xl">
        <div className="p-8">
          <div className="flex items-start space-x-6">
            <div className="p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-lg">
              <FiMonitor className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Platform Health & Status
                <MdHealthAndSafety className="h-6 w-6 text-teal-600" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border-2 border-teal-200 shadow-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg">
                      <FiCheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">
                      System Status:
                    </p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                    <FiActivity className="h-4 w-4" />
                    Operational
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border-2 border-teal-200 shadow-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                      <FiDatabase className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">
                      Blockchain:
                    </p>
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    Hyperledger Fabric
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border-2 border-teal-200 shadow-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                      <FiUsers className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">
                      Total Users:
                    </p>
                  </div>
                  <p className="text-lg font-bold text-purple-600">
                    {stats.totalDoctors + stats.totalPatients}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border-2 border-teal-200 shadow-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg">
                      <FiGlobe className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">Network:</p>
                  </div>
                  <p className="text-lg font-bold text-orange-600 flex items-center gap-2">
                    <FiServer className="h-4 w-4" />
                    Fabric v2.x
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Security & Compliance ────────────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200 shadow-xl">
        <div className="p-8">
          <div className="flex items-start space-x-6">
            <div className="p-4 bg-gradient-to-r from-gray-500 to-blue-500 rounded-2xl shadow-lg">
              <FiShield className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Security & Compliance Overview
                <MdSecurity className="h-6 w-6 text-gray-600" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiLock className="h-5 w-5 text-emerald-600" />
                    Security Features
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-emerald-100 rounded-full">
                        <FiCheckCircle className="h-3 w-3 text-emerald-600" />
                      </div>
                      Hyperledger Fabric immutable ledger
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-emerald-100 rounded-full">
                        <FiCheckCircle className="h-3 w-3 text-emerald-600" />
                      </div>
                      Encrypted patient data on-chain
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-emerald-100 rounded-full">
                        <FiCheckCircle className="h-3 w-3 text-emerald-600" />
                      </div>
                      PIN-based admin authentication
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MdHealthAndSafety className="h-5 w-5 text-blue-600" />
                    Compliance Standards
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-blue-100 rounded-full">
                        <FiCheckCircle className="h-3 w-3 text-blue-600" />
                      </div>
                      HIPAA-compliant data handling
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-blue-100 rounded-full">
                        <FiCheckCircle className="h-3 w-3 text-blue-600" />
                      </div>
                      Hospital credential verification
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 bg-blue-100 rounded-full">
                        <FiCheckCircle className="h-3 w-3 text-blue-600" />
                      </div>
                      Audit trail via Fabric chaincode
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Admin Guidelines ─────────────────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-l-8 border-indigo-400 border-2 border-indigo-200 shadow-xl">
        <div className="p-8">
          <div className="flex items-start space-x-6">
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
              <MdAdminPanelSettings className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                Administrative Guidelines & Best Practices
                <MdSecurity className="h-5 w-5 text-indigo-600" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border-2 border-indigo-100 shadow-md">
                  <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <FiShield className="h-5 w-5" />
                    System Management
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <FiCheckCircle className="h-4 w-4 text-teal-600" />
                      Review hospital applications promptly
                    </li>
                    <li className="flex items-center gap-2">
                      <MdVerifiedUser className="h-4 w-4 text-blue-600" />
                      Verify medical credentials thoroughly
                    </li>
                    <li className="flex items-center gap-2">
                      <FiMonitor className="h-4 w-4 text-purple-600" />
                      Monitor Fabric network health
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6 border-2 border-indigo-100 shadow-md">
                  <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <MdHealthAndSafety className="h-5 w-5" />
                    Healthcare Compliance
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <FiDatabase className="h-4 w-4 text-orange-600" />
                      Maintain secure patient data standards
                    </li>
                    <li className="flex items-center gap-2">
                      <MdMedicalServices className="h-4 w-4 text-emerald-600" />
                      Ensure medicine inventory accuracy
                    </li>
                    <li className="flex items-center gap-2">
                      <FiActivity className="h-4 w-4 text-red-600" />
                      Track platform usage analytics
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      {/* Reason Modal */}
      {reasonModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {reasonModal.action === 'reject' ? 'Reject Hospital' : reasonModal.action === 'suspend' ? 'Suspend Hospital' : 'Confirm Action'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {reasonModal.action === 'reject' ? 'Please provide a reason for rejection. This will be shared with the hospital.' : 'Please provide a reason for suspension. This will be shared with the hospital.'}
            </p>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Enter reason here..."
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setReasonModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={() => reasonText.trim() && handleHospitalAction(reasonModal.hospitalId, reasonModal.action, reasonText.trim())}
                disabled={!reasonText.trim()}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${reasonModal.action === 'reject' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                Confirm {reasonModal.action === 'reject' ? 'Rejection' : 'Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

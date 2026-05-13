import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  FiSearch,
  FiFileText,
  FiArrowLeft,
  FiSave,
  FiRefreshCw,
  FiCalendar,
  FiUser,
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiShield,
  FiInfo,
  FiClock,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdVerifiedUser,
  MdHistory,
  MdMedicalServices,
  MdHealthAndSafety,
  MdSecurity,
} from "react-icons/md";
import {
  FaUserMd,
  FaStethoscope,
  FaNotesMedical,
  FaHospitalUser,
} from "react-icons/fa";

import LoadingSpinner from "../common/LoadingSpinner";
import toast from "react-hot-toast";
import { formatDateDMY } from "../../utils/helpers";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const apiFetch = async (path, options = {}) => {
  // Use mv_token (the key set by devAuthStore login), fall back to legacy "token"
  const token = typeof window !== "undefined"
    ? (localStorage.getItem("mv_token") || localStorage.getItem("token"))
    : null;
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw Object.assign(new Error(errData.error || `Request failed: ${res.status}`), { status: res.status });
  }
  return res.json();
};

/** Non-blocking Fabric access log */
const logFabricAccess = (patientId, recordId, recordType) => {
  apiFetch("/api/consultations/log-access", {
    method: "POST",
    body: JSON.stringify({ patientId, recordId, recordType }),
  }).catch(() => {});
};


const maskPatientId = (id) => {
  if (!id) return "—";
  // Keep prefix and last 4 chars, mask the middle
  const str = String(id);
  if (str.length <= 8) return str;
  return str.substring(0, 8) + "****" + str.slice(-4);
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border border-blue-300",
  in_progress: "bg-teal-100 text-teal-800 border border-teal-300",
  completed: "bg-green-100 text-green-800 border border-green-300",
  cancelled: "bg-red-100 text-red-800 border border-red-300",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
      statusColors[status] || "bg-gray-100 text-gray-700 border border-gray-300"
    }`}
  >
    <FiActivity className="w-3 h-3" />
    {status ? status.replace("_", " ").toUpperCase() : "UNKNOWN"}
  </span>
);

// ─── FabricTx info box ────────────────────────────────────────────────────────
const FabricTxBox = ({ txId }) => (
  <div className="mt-2 flex items-start gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2 text-xs text-teal-800">
    <FiShield className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
    <div>
      <span className="font-semibold">Fabric Log:</span>{" "}
      <span className="font-mono break-all">{txId}</span>
    </div>
  </div>
);

// ─── Past Record Row ──────────────────────────────────────────────────────────
const PastRecordRow = ({ appt, onViewFabric }) => {
  const handleView = () => {
    logFabricAccess(appt.patientId, appt.id, "AppointmentRecord");
    if (appt.fabricTxId) onViewFabric(appt.id);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Date</p>
            <p className="font-semibold text-gray-800">
              {formatDateDMY(appt.appointmentDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Patient ID</p>
            <p className="font-mono text-gray-700">{maskPatientId(appt.patientId)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Diagnosis / Reason</p>
            <p className="text-gray-700 truncate max-w-[200px]">
              {appt.consultationNote?.diagnosis || appt.reason || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Status</p>
            <StatusBadge status={appt.status} />
          </div>
        </div>
        {appt.fabricTxId && (
          <button
            onClick={handleView}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <FiShield className="w-3.5 h-3.5" />
            View Fabric Log
          </button>
        )}
      </div>
      {appt._showFabric && appt.fabricTxId && (
        <FabricTxBox txId={appt.fabricTxId} />
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DoctorMedicalRecords = () => {
  const router = useRouter();

  // Doctor profile
  const [doctorId, setDoctorId] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Search / patient lookup
  const [searchInput, setSearchInput] = useState("");
  const [appointmentIdInput, setAppointmentIdInput] = useState("");
  const [searching, setSearching] = useState(false);

  // Active consultation
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [consultationForm, setConsultationForm] = useState({
    chiefComplaint: "",
    examinationFindings: "",
    diagnosis: "",
    treatmentPlan: "",
    followUpDate: "",
    referral: "",
  });
  const [savingNotes, setSavingNotes] = useState(false);
  const [existingNote, setExistingNote] = useState(null);

  // Past records
  const [pastRecords, setPastRecords] = useState([]);
  const [pastLoading, setPastLoading] = useState(false);
  const [fabricOpen, setFabricOpen] = useState({}); // appointmentId -> bool

  // ── Load doctor profile on mount ─────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        setProfileLoading(true);

        // Try cached doctor ID first (set during login in AuthContext)
        const cachedId = typeof window !== "undefined" ? localStorage.getItem("mv_doctor_id") : null;

        const res = await apiFetch("/doctor/me");
        if (res.success && res.data) {
          setDoctorProfile(res.data);
          setDoctorId(res.data.id);
          // Cache for other components
          if (typeof window !== "undefined") {
            localStorage.setItem("mv_doctor_id", res.data.id);
          }
        } else if (cachedId) {
          // Fall back to cached profile (profile not in devDataStore yet — show partial UI)
          setDoctorId(cachedId);
          const cachedData = localStorage.getItem("mv_doctor_data");
          if (cachedData) {
            try { setDoctorProfile(JSON.parse(cachedData)); } catch (_) {}
          }
        } else {
          toast.error(
            "Doctor profile not found. Please complete your registration first.",
            { duration: 4000 }
          );
          setTimeout(() => router.push("/doctor/register"), 2500);
        }
      } catch (err) {
        if (err.status === 404) {
          toast.error("Please complete your doctor registration before accessing medical records.");
          setTimeout(() => router.push("/doctor/register"), 2500);
        } else {
          toast.error("Failed to load doctor profile. Please refresh.");
        }
      } finally {
        setProfileLoading(false);
      }
    };
    init();
  }, []);

  // ── Load past records whenever doctorId is known ─────────────────────────
  const loadPastRecords = useCallback(async () => {
    if (!doctorId) return;
    try {
      setPastLoading(true);
      const res = await apiFetch(`/doctor/${doctorId}/appointments`);
      if (res.success) {
        // Fetch consultation notes for each appointment that has a fabricTxId potential
        const records = res.data || [];
        setPastRecords(records.map((a) => ({ ...a, _showFabric: false })));
      }
    } catch {
      toast.error("Failed to load past records");
    } finally {
      setPastLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadPastRecords();
  }, [loadPastRecords]);

  // ── Find patient by ID / phone ───────────────────────────────────────────
  const handleFindPatient = async () => {
    if (!searchInput.trim()) {
      toast.error("Enter a Patient ID or phone number");
      return;
    }
    if (!doctorId) {
      toast.error("Doctor profile not loaded");
      return;
    }
    try {
      setSearching(true);
      const res = await apiFetch(`/doctor/${doctorId}/appointments`);
      if (!res.success) throw new Error(res.error || "Failed to fetch appointments");

      const all = res.data || [];
      const q = searchInput.trim().toLowerCase();

      // Match by patientId (PAT-YYYYMMDD-XXXXX) or phone
      const matched = all.filter(
        (a) =>
          a.patientId?.toLowerCase().includes(q) ||
          a.patient?.phone?.includes(q) ||
          a.patient?.userId?.toLowerCase().includes(q)
      );

      if (matched.length === 0) {
        toast.error("No appointments found for that patient");
        return;
      }

      // Prefer in_progress, else most recent
      const inProgress = matched.find((a) => a.status === "in_progress");
      const selected = inProgress || matched[0];

      activateConsultation(selected);
    } catch (err) {
      toast.error(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  // ── Open specific appointment by ID ────────────────────────────────────
  const handleOpenByAppointmentId = async () => {
    const apptId = appointmentIdInput.trim();
    if (!apptId) {
      toast.error("Enter an appointment ID");
      return;
    }
    // Try to find it in already-loaded past records first
    const found = pastRecords.find(
      (a) => a.id?.toLowerCase() === apptId.toLowerCase()
    );
    if (found) {
      activateConsultation(found);
      return;
    }
    toast.error("Appointment not found. Load past records or check the ID.");
  };

  // ── Activate the consultation view ──────────────────────────────────────
  const activateConsultation = async (appt) => {
    setActiveAppointment(appt);
    setConsultationForm({
      chiefComplaint: appt.reason || "",
      examinationFindings: "",
      diagnosis: "",
      treatmentPlan: "",
      followUpDate: "",
      referral: "",
    });
    setExistingNote(null);

    // Non-blocking fabric log for viewing patient record
    logFabricAccess(appt.patientId, appt.id, "AppointmentRecord");

    // Try to load existing consultation note
    try {
      const res = await apiFetch(`/api/consultations/appointment/${appt.id}`);
      if (res.success && res.data) {
        const n = res.data;
        setExistingNote(n);
        setConsultationForm({
          chiefComplaint: n.chiefComplaint || appt.reason || "",
          examinationFindings: n.examinationFindings || "",
          diagnosis: n.diagnosis || "",
          treatmentPlan: n.treatmentPlan || "",
          followUpDate: n.followUpDate || "",
          referral: n.referral || "",
        });
      }
    } catch {
      // Not critical — proceed without existing note
    }
  };

  // ── Save consultation notes ──────────────────────────────────────────────
  const handleSaveNotes = async () => {
    if (!activeAppointment) return;
    try {
      setSavingNotes(true);
      const payload = {
        appointmentId: activeAppointment.id,
        patientId: activeAppointment.patientId,
        ...consultationForm,
      };
      const res = await apiFetch("/api/consultations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.success) throw new Error(res.error || "Save failed");
      toast.success("Consultation notes saved successfully");
      setExistingNote(res.data);
      // Refresh past records to pick up any updated fabricTxId
      loadPastRecords();
    } catch (err) {
      toast.error(err.message || "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // ── Toggle fabric log inline display ────────────────────────────────────
  const handleToggleFabric = (apptId) => {
    setPastRecords((prev) =>
      prev.map((a) =>
        a.id === apptId ? { ...a, _showFabric: !a._showFabric } : a
      )
    );
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="text-center">
          <div className="p-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-2xl mb-6 mx-auto w-fit">
            <FaNotesMedical className="h-14 w-14 text-white animate-pulse" />
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-700 font-bold text-lg">
            Loading Medical Records...
          </p>
        </div>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-2xl p-10 text-center">
          <div className="p-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full w-fit mx-auto mb-6 shadow-xl">
            <FaUserMd className="h-14 w-14 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Doctor Registration Required
          </h3>
          <p className="text-gray-600 mb-6">
            You need to be registered as a healthcare professional to access
            medical records.
          </p>
          <button
            onClick={() => router.push("/doctor/register")}
            className="w-full py-3 px-6 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-colors shadow-lg"
          >
            Register as Doctor
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-x-10 translate-y-10" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/doctor/dashboard")}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl border border-white/30">
                <FaNotesMedical className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Medical Records &amp; Consultations
                </h1>
                <p className="text-teal-100 text-sm mt-0.5 flex items-center gap-1.5">
                  <MdSecurity className="w-3.5 h-3.5" />
                  Fabric-audited patient consultation portal
                </p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl border border-white/30">
            <MdVerifiedUser className="w-4 h-4" />
            <span className="text-sm font-semibold">
              Dr. {doctorProfile.fullName || doctorProfile.id}
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 1: Search / Select Patient ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-md">
            <FiSearch className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Search / Select Patient
            </h2>
            <p className="text-sm text-gray-500">
              Look up by Patient ID (PAT-YYYYMMDD-XXXXX) or phone number, or
              enter an Appointment ID directly
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient ID / Phone search */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Patient ID or Phone Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFindPatient()}
                  placeholder="PAT-20240101-ABCDE or +91..."
                  className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-300 transition-colors"
                />
              </div>
              <button
                onClick={handleFindPatient}
                disabled={searching}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shadow-md"
              >
                {searching ? (
                  <LoadingSpinner size="small" color="white" />
                ) : (
                  <FiSearch className="w-4 h-4" />
                )}
                Find Patient
              </button>
            </div>
          </div>

          {/* Direct appointment ID */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Or enter Appointment ID directly
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={appointmentIdInput}
                  onChange={(e) => setAppointmentIdInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleOpenByAppointmentId()
                  }
                  placeholder="APT-XXXXXXXX or UUID"
                  className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-300 transition-colors"
                />
              </div>
              <button
                onClick={handleOpenByAppointmentId}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
              >
                <MdMedicalServices className="w-4 h-4" />
                Open
              </button>
            </div>
          </div>
        </div>

        {existingNote && (
          <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-800">
            <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            Existing consultation note found and loaded. Saving will overwrite.
          </div>
        )}
      </div>

      {/* ── Section 2: Active Consultation ─────────────────────────────── */}
      {activeAppointment && (
        <div className="bg-white rounded-2xl border-2 border-teal-200 shadow-lg overflow-hidden">
          {/* Consultation header bar */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaStethoscope className="h-6 w-6 text-white" />
              <div>
                <h2 className="text-lg font-bold text-white">
                  Active Consultation
                </h2>
                <p className="text-teal-100 text-xs mt-0.5">
                  Appointment {activeAppointment.id}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveAppointment(null);
                setExistingNote(null);
              }}
              className="text-white/70 hover:text-white text-sm underline"
            >
              Close
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Patient info panel */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <FiShield className="w-3.5 h-3.5" /> Patient ID
                </p>
                <p className="font-mono text-sm font-semibold text-gray-800">
                  {maskPatientId(activeAppointment.patientId)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <FiInfo className="w-3.5 h-3.5" /> Chief Complaint
                </p>
                <p className="text-sm text-gray-700">
                  {activeAppointment.reason || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <FiActivity className="w-3.5 h-3.5" /> Status
                </p>
                <StatusBadge status={activeAppointment.status} />
              </div>
            </div>

            {/* Consultation form */}
            <div className="space-y-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-teal-600" />
                Consultation Notes
              </h3>

              {/* Chief complaint */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Chief Complaint
                </label>
                <input
                  type="text"
                  value={consultationForm.chiefComplaint}
                  onChange={(e) =>
                    setConsultationForm((f) => ({
                      ...f,
                      chiefComplaint: e.target.value,
                    }))
                  }
                  placeholder="e.g. Persistent cough for 3 days"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>

              {/* Examination findings */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Examination Findings
                </label>
                <textarea
                  rows={3}
                  value={consultationForm.examinationFindings}
                  onChange={(e) =>
                    setConsultationForm((f) => ({
                      ...f,
                      examinationFindings: e.target.value,
                    }))
                  }
                  placeholder="BP, Pulse, Temperature, auscultation findings, etc."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition-colors resize-none"
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Diagnosis
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    (include ICD note if applicable, e.g. Hypertension — I10)
                  </span>
                </label>
                <input
                  type="text"
                  value={consultationForm.diagnosis}
                  onChange={(e) =>
                    setConsultationForm((f) => ({
                      ...f,
                      diagnosis: e.target.value,
                    }))
                  }
                  placeholder="e.g. Acute pharyngitis — J02.9"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>

              {/* Treatment plan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Treatment Plan
                </label>
                <textarea
                  rows={3}
                  value={consultationForm.treatmentPlan}
                  onChange={(e) =>
                    setConsultationForm((f) => ({
                      ...f,
                      treatmentPlan: e.target.value,
                    }))
                  }
                  placeholder="Medications, dosage, rest, dietary advice, investigations ordered..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Follow-up date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <FiCalendar className="w-4 h-4 text-teal-500" />
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={consultationForm.followUpDate}
                    onChange={(e) =>
                      setConsultationForm((f) => ({
                        ...f,
                        followUpDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition-colors"
                  />
                  {consultationForm.followUpDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateDMY(consultationForm.followUpDate)}
                    </p>
                  )}
                </div>

                {/* Referral */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Referral (optional)
                  </label>
                  <input
                    type="text"
                    value={consultationForm.referral}
                    onChange={(e) =>
                      setConsultationForm((f) => ({
                        ...f,
                        referral: e.target.value,
                      }))
                    }
                    placeholder="Refer to Dr. / Department"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition-colors"
                  />
                </div>
              </div>

              {/* Save button */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <FiShield className="w-3.5 h-3.5 text-teal-500" />
                  Saved notes are logged to Hyperledger Fabric for audit
                </p>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 shadow-lg"
                >
                  {savingNotes ? (
                    <>
                      <LoadingSpinner size="small" color="white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      Save Notes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 3: Past Records ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl shadow-md">
              <MdHistory className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Patient Appointment Records
              </h2>
              <p className="text-sm text-gray-500">
                All appointments for your patients — click "View Fabric Log"
                where available
              </p>
            </div>
          </div>
          <button
            onClick={loadPastRecords}
            disabled={pastLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors"
          >
            {pastLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              <FiRefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>

        {pastLoading && pastRecords.length === 0 ? (
          <div className="py-12 text-center">
            <LoadingSpinner size="large" />
            <p className="mt-3 text-gray-500 text-sm">Loading records...</p>
          </div>
        ) : pastRecords.length === 0 ? (
          <div className="py-16 text-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="p-6 bg-gradient-to-r from-gray-300 to-blue-300 rounded-full w-fit mx-auto mb-4">
              <MdHistory className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              No Records Found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Appointment records for your patients will appear here once
              appointments are booked.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastRecords.map((appt) => (
              <PastRecordRow
                key={appt.id}
                appt={appt}
                onViewFabric={handleToggleFabric}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Privacy notice ──────────────────────────────────────────────── */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-md flex-shrink-0">
          <MdHealthAndSafety className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            Data Privacy &amp; Audit Trail
            <FiShield className="h-4 w-4 text-indigo-600" />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700">
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                Patient IDs are masked in the UI for privacy
              </li>
              <li className="flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                All record views are logged to Hyperledger Fabric
              </li>
            </ul>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                Consultation notes are immutably recorded on-chain
              </li>
              <li className="flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                Adhere to patient confidentiality at all times
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorMedicalRecords;

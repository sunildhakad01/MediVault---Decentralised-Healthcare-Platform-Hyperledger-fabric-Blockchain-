import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import {
  FiUsers,
  FiSearch,
  FiUser,
  FiCalendar,
  FiFileText,
  FiActivity,
  FiClock,
  FiAlertCircle,
  FiArrowLeft,
  FiRefreshCw,
  FiChevronRight,
  FiX,
  FiBell,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdHealthAndSafety,
  MdMedicalServices,
  MdSchedule,
  MdBiotech,
} from "react-icons/md";
import toast from "react-hot-toast";
import apiClient from "../../utils/api";
import { formatDateDMY } from "../../utils/helpers";

const getAptDate = (apt) =>
  apt?.appointment_date || apt?.date || apt?.scheduled_date || null;

const maskPatientId = (id) => {
  if (!id) return "—";
  const s = String(id);
  if (s.length <= 5) return s;
  return `${s.slice(0, 3)}${"*".repeat(s.length - 5)}${s.slice(-2)}`;
};

const statusConfig = {
  scheduled: {
    label: "Scheduled",
    cls: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  completed: {
    label: "Completed",
    cls: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-red-100 text-red-700 border border-red-200",
  },
  pending: {
    label: "Pending",
    cls: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  },
  "no-show": {
    label: "No-show",
    cls: "bg-gray-100 text-gray-600 border border-gray-200",
  },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status?.toLowerCase()] || {
    label: status || "Unknown",
    cls: "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ─── Patient Detail Panel ────────────────────────────────────────────────────

const PatientDetailPanel = ({ patient, onClose }) => {
  const router = useRouter();

  // Extract patient name and phone from the most recent appointment's patient data
  const patientName = patient.lastAppointment?.patientName
    || patient.lastAppointment?.patient?.fullName
    || patient.appointments?.[0]?.patientName
    || patient.appointments?.[0]?.patient?.fullName
    || null;

  const patientPhone = patient.lastAppointment?.patientPhone
    || patient.lastAppointment?.patient?.phone
    || patient.appointments?.[0]?.patientPhone
    || patient.appointments?.[0]?.patient?.phone
    || null;

  const patientEmail = patient.lastAppointment?.patientEmail
    || patient.lastAppointment?.patient?.email
    || null;

  const handleSendReminder = () => {
    if (!patientPhone && !patientEmail) {
      toast("No contact info available for this patient", { icon: "ℹ️" });
      return;
    }
    // In a real app this would trigger SMS/email; for dev we just show a success toast
    toast.success(
      `Appointment reminder sent${patientPhone ? ` to ${patientPhone}` : ""}!`,
      { duration: 3000 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FiUser className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-cyan-100 font-medium uppercase tracking-wide">
                Patient
              </p>
              <h2 className="text-white font-bold text-lg leading-tight">
                {patientName || maskPatientId(patient.patientId)}
              </h2>
              {patientName && (
                <p className="text-cyan-100 text-xs mt-0.5 font-mono">
                  {maskPatientId(patient.patientId)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Contact info strip */}
        {(patientPhone || patientEmail) && (
          <div className="bg-teal-50 border-b border-teal-100 px-6 py-3 flex items-center gap-4 flex-wrap flex-shrink-0">
            {patientPhone && (
              <a
                href={`tel:${patientPhone}`}
                className="flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-900 transition-colors"
              >
                <FiPhone className="h-3.5 w-3.5" />
                {patientPhone}
              </a>
            )}
            {patientEmail && (
              <a
                href={`mailto:${patientEmail}`}
                className="flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-900 transition-colors truncate"
              >
                <FiMail className="h-3.5 w-3.5" />
                {patientEmail}
              </a>
            )}
            <button
              onClick={handleSendReminder}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <FiBell className="h-3.5 w-3.5" />
              Send Reminder
            </button>
          </div>
        )}
        {!patientPhone && !patientEmail && (
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-gray-400 italic">Contact info not available</span>
            <button
              onClick={handleSendReminder}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-semibold rounded-lg transition-colors"
            >
              <FiBell className="h-3.5 w-3.5" />
              Send Reminder
            </button>
          </div>
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-gray-500 font-medium">Total Visits</p>
            <p className="text-xl font-bold text-teal-600">
              {patient.appointments.length}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-gray-500 font-medium">Last Visit</p>
            <p className="text-sm font-semibold text-gray-700">
              {formatDateDMY(patient.lastAppointment?.appointment_date || patient.lastAppointment?.date)}
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-xs text-gray-500 font-medium">Last Status</p>
            <div className="mt-0.5 flex justify-center">
              <StatusBadge status={patient.lastAppointment?.status} />
            </div>
          </div>
        </div>

        {/* Appointments list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <MdSchedule className="h-4 w-4 text-teal-500" />
            Appointment History
          </h3>

          {patient.appointments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No appointments found.
            </p>
          ) : (
            <div className="space-y-3">
              {patient.appointments.map((apt, idx) => {
                const aptDate = getAptDate(apt);
                const aptTime = apt.appointment_time || apt.time || "";
                const reason =
                  apt.reason ||
                  apt.chief_complaint ||
                  apt.notes ||
                  "—";
                return (
                  <div
                    key={apt.id || apt._id || idx}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <FiCalendar className="h-4 w-4 text-teal-500 flex-shrink-0" />
                        {formatDateDMY(aptDate)}
                        {aptTime && (
                          <span className="text-gray-500 font-normal">
                            {aptTime}
                          </span>
                        )}
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <FiFileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{reason}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="border-t border-gray-100 px-6 py-4 bg-white flex-shrink-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">
            Actions
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => router.push("/doctor/records")}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-teal-200 hover:shadow-md hover:border-teal-300 transition-all group"
            >
              <FiFileText className="h-5 w-5 text-teal-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-teal-700 text-center leading-tight">
                View Records
              </span>
            </button>
            <button
              onClick={() => router.push("/doctor/prescribe")}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 hover:shadow-md hover:border-purple-300 transition-all group"
            >
              <MdMedicalServices className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-purple-700 text-center leading-tight">
                New Prescription
              </span>
            </button>
            <button
              onClick={() => router.push("/doctor/lab-orders")}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 hover:shadow-md hover:border-orange-300 transition-all group"
            >
              <MdBiotech className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-orange-700 text-center leading-tight">
                Order Lab Test
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Patient Card ────────────────────────────────────────────────────────────

const PatientCard = ({ patient, onClick }) => {
  const lastApt = patient.lastAppointment;
  const lastDate = getAptDate(lastApt);
  const reason = lastApt?.reason || lastApt?.chief_complaint || lastApt?.notes || "—";

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-teal-200 transition-all duration-200 group overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-teal-500" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl flex items-center justify-center border border-teal-200 flex-shrink-0">
              <FiUser className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base tracking-wide">
                {patient.lastAppointment?.patientName
                  || patient.lastAppointment?.patient?.fullName
                  || patient.appointments?.[0]?.patientName
                  || patient.appointments?.[0]?.patient?.fullName
                  || maskPatientId(patient.patientId)}
              </p>
              {(patient.lastAppointment?.patientPhone || patient.lastAppointment?.patient?.phone
                || patient.appointments?.[0]?.patientPhone) && (
                <p className="text-xs text-teal-600 mt-0.5 flex items-center gap-1">
                  <FiPhone className="h-3 w-3" />
                  {patient.lastAppointment?.patientPhone || patient.lastAppointment?.patient?.phone
                    || patient.appointments?.[0]?.patientPhone}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <FiActivity className="h-3 w-3" />
                {patient.appointments.length}{" "}
                {patient.appointments.length === 1 ? "visit" : "visits"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={lastApt?.status} />
            <FiChevronRight className="h-4 w-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCalendar className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
            <span className="font-medium text-gray-500 mr-1">Last visit:</span>
            <span className="font-semibold text-gray-800">
              {formatDateDMY(lastDate)}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <FiFileText className="h-3.5 w-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
            <span className="font-medium text-gray-500 mr-1 flex-shrink-0">
              Reason:
            </span>
            <span className="text-gray-700 line-clamp-1">{reason}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────

const CardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-1 bg-gradient-to-r from-cyan-200 to-teal-200" />
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const DoctorPatients = () => {
  const router = useRouter();

  const [allPatients, setAllPatients] = useState([]); // grouped by patientId
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // ── Fetch & group ──────────────────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const doctorId = localStorage.getItem("mv_doctor_id");
      if (!doctorId) {
        toast.error("Doctor session not found. Please log in again.");
        router.push("/doctor/login");
        return;
      }

      const response = await apiClient.get(
        `/doctor/${doctorId}/appointments`
      );

      const appointments =
        response?.data?.appointments ||
        response?.data?.data ||
        response?.data ||
        [];

      if (!Array.isArray(appointments)) {
        throw new Error("Unexpected response format from server.");
      }

      // Group by patient ID
      const patientMap = {};
      appointments.forEach((apt) => {
        const pid =
          apt.patient_id ||
          apt.patientId ||
          apt.patient?.id ||
          apt.patient?._id ||
          null;
        if (!pid) return;

        if (!patientMap[pid]) {
          patientMap[pid] = {
            patientId: pid,
            appointments: [],
            lastAppointment: null,
          };
        }
        patientMap[pid].appointments.push(apt);
      });

      // Sort each patient's appointments by date desc and pick the most recent
      const patientList = Object.values(patientMap).map((p) => {
        const sorted = [...p.appointments].sort((a, b) => {
          const dateA = new Date(getAptDate(a) || 0).getTime();
          const dateB = new Date(getAptDate(b) || 0).getTime();
          return dateB - dateA;
        });
        return {
          ...p,
          appointments: sorted,
          lastAppointment: sorted[0] || null,
        };
      });

      // Sort patients by most-recent-appointment date desc
      patientList.sort((a, b) => {
        const da = new Date(
          a.lastAppointment?.appointment_date ||
            a.lastAppointment?.date ||
            0
        ).getTime();
        const db = new Date(
          b.lastAppointment?.appointment_date ||
            b.lastAppointment?.date ||
            0
        ).getTime();
        return db - da;
      });

      setAllPatients(patientList);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load patients.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // ── Search filter (derived — no extra state needed) ────────────────────────
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return allPatients;
    return allPatients.filter((p) => {
      const idMatch = String(p.patientId).toLowerCase().includes(q);
      const reasonMatch = p.appointments.some((apt) => {
        const r = apt.reason || apt.chief_complaint || apt.notes || "";
        return r.toLowerCase().includes(q);
      });
      return idMatch || reasonMatch;
    });
  }, [searchTerm, allPatients]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: allPatients.length,
    returning: allPatients.filter((p) => p.appointments.length > 1).length,
    singleVisit: allPatients.filter((p) => p.appointments.length === 1).length,
    totalAppointments: allPatients.reduce(
      (s, p) => s + p.appointments.length,
      0
    ),
  }), [allPatients]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.push("/doctor/dashboard")}
            className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl shadow-md">
            <FiUsers className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              My Patients
              <MdHealthAndSafety className="h-7 w-7 text-teal-500" />
            </h1>
            <p className="text-gray-500 mt-0.5">
              Patients derived from your appointment history
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Patients",
            value: stats.total,
            icon: FiUsers,
            color: "from-cyan-500 to-teal-500",
            bg: "from-cyan-50 to-teal-50",
            border: "border-teal-200",
            text: "text-teal-700",
          },
          {
            label: "Returning",
            value: stats.returning,
            icon: FiActivity,
            color: "from-emerald-500 to-green-500",
            bg: "from-emerald-50 to-green-50",
            border: "border-emerald-200",
            text: "text-emerald-700",
          },
          {
            label: "Single Visit",
            value: stats.singleVisit,
            icon: FiUser,
            color: "from-purple-500 to-indigo-500",
            bg: "from-purple-50 to-indigo-50",
            border: "border-purple-200",
            text: "text-purple-700",
          },
          {
            label: "Total Appointments",
            value: stats.totalAppointments,
            icon: FiCalendar,
            color: "from-orange-500 to-amber-500",
            bg: "from-orange-50 to-amber-50",
            border: "border-orange-200",
            text: "text-orange-700",
          },
        ].map(({ label, value, icon: Icon, color, bg, border, text }) => (
          <div
            key={label}
            className={`bg-gradient-to-br ${bg} rounded-2xl border ${border} p-5 flex items-center gap-4`}
          >
            <div
              className={`p-3 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide ${text}`}>
                {label}
              </p>
              <p className={`text-2xl font-bold ${text}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient ID or appointment reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <FiX className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Results label */}
      {!loading && !error && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-bold text-teal-600">{filtered.length}</span>{" "}
            of <span className="font-bold">{allPatients.length}</span> patients
          </p>
          <button
            onClick={fetchPatients}
            className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 font-medium transition-colors"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <FiAlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Failed to load patients
          </h3>
          <p className="text-gray-500 max-w-sm mb-6">{error}</p>
          <button
            onClick={fetchPatients}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl shadow hover:shadow-md transition-all"
          >
            <FiRefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-2xl flex items-center justify-center mb-5 border border-teal-200">
            <FiUsers className="h-10 w-10 text-teal-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {allPatients.length === 0 ? "No patients yet" : "No results found"}
          </h3>
          <p className="text-gray-500 max-w-sm">
            {allPatients.length === 0
              ? "Patients will appear here once they book appointments with you."
              : "Try adjusting your search term."}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 text-sm text-teal-600 hover:text-teal-800 font-medium underline underline-offset-2"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Patient grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((patient) => (
            <PatientCard
              key={patient.patientId}
              patient={patient}
              onClick={() => setSelectedPatient(patient)}
            />
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedPatient && (
        <PatientDetailPanel
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
};

export default DoctorPatients;

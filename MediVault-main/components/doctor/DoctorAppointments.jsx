import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiCheck,
  FiX,
  FiEye,
  FiFileText,
  FiActivity,
  FiFilter,
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiMoreVertical,
  FiEdit3,
  FiPhone,
  FiMail,
  FiArrowLeft,
  FiShield,
  FiInfo,
  FiRefreshCw,
} from "react-icons/fi";
import {
  MdVideoCall,
  MdLocalHospital,
  MdVerifiedUser,
  MdHealthAndSafety,
  MdMedicalServices,
  MdSchedule,
  MdEmergency,
  MdBiotech,
  MdSecurity,
  MdPayment,
  MdInventory,
  MdMonitorHeart,
  MdPersonalInjury,
  MdAccountBalance,
  MdFavorite,
} from "react-icons/md";
import {
  FaUserMd,
  FaStethoscope,
  FaHospitalUser,
  FaPrescriptionBottleAlt,
  FaHeartbeat,
  FaNotesMedical,
  FaAmbulance,
  FaSyringe,
  FaUserNurse,
  FaMicroscope,
  FaXRay,
  FaThermometerHalf,
  FaBrain,
  FaEye,
  FaTooth,
  FaBone,
  FaLungs,
} from "react-icons/fa";
import { Card, Button, Input, Select, Badge, Modal } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatDate, formatTime, getRelativeTime } from "../../utils/helpers";
import toast from "react-hot-toast";
import apiClient from "../../utils/api";

// Mask a patient ID: show first 3 and last 2 chars, star the rest
const maskPatientId = (id) => {
  if (!id) return "—";
  const str = String(id);
  if (str.length <= 5) return str.slice(0, 2) + "***";
  return str.slice(0, 3) + "***" + str.slice(-2);
};

const getStatusColor = (status) => {
  switch (status) {
    case "in_progress":
      return "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200";
    case "scheduled":
    case "confirmed":
      return "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200";
    case "completed":
      return "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200";
    case "no_show":
      return "bg-gradient-to-br from-red-50 to-pink-50 border-red-200";
    default:
      return "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return <FiCheckCircle className="h-5 w-5 text-emerald-600" />;
    case "in_progress":
      return <FiAlertCircle className="h-5 w-5 text-emerald-600" />;
    case "scheduled":
    case "confirmed":
      return <FiClock className="h-5 w-5 text-blue-600" />;
    case "no_show":
      return <FiX className="h-5 w-5 text-red-600" />;
    default:
      return <FiClock className="h-5 w-5 text-gray-400" />;
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none">
          <FiCheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none">
          <FiAlertCircle className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
      );
    case "confirmed":
      return (
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none">
          <FiCheckCircle className="w-3 h-3 mr-1" />
          Confirmed
        </Badge>
      );
    case "scheduled":
      return (
        <Badge className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white border-none">
          <FiClock className="w-3 h-3 mr-1" />
          Scheduled
        </Badge>
      );
    case "no_show":
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-none">
          <FiX className="w-3 h-3 mr-1" />
          No Show
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gradient-to-r from-gray-400 to-slate-400 text-white border-none">
          {status}
        </Badge>
      );
  }
};

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth)) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

const AppointmentCard = ({
  appointment,
  onViewDetails,
  onStatusChange,
  onPrescribe,
  doctorData,
}) => {
  const [actionLoading, setActionLoading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      await onStatusChange(appointment._id || appointment.id, newStatus);
    } finally {
      setActionLoading(false);
    }
  };

  const status = appointment.status;
  const canMarkNoShow = status === "scheduled" || status === "confirmed";

  return (
    <div
      className={`transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${getStatusColor(
        status
      )} border-2 border-l-8 rounded-2xl overflow-hidden`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white rounded-xl shadow-lg border-2 border-teal-200">
              {getStatusIcon(status)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MdSchedule className="h-5 w-5 text-teal-600" />
                Token #{appointment.tokenNumber ?? appointment._id?.slice(-4) ?? appointment.id}
              </h3>
              <p className="text-gray-600 font-medium flex items-center gap-2">
                <FiCalendar className="h-4 w-4" />
                {appointment.date || appointment.appointmentDate} &bull;{" "}
                {appointment.timeSlot?.start || appointment.from} -{" "}
                {appointment.timeSlot?.end || appointment.to}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(status)}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
              <FiMoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-white rounded-xl p-4 mb-6 border-2 border-teal-200 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center border-2 border-teal-200 shadow-lg flex-shrink-0">
              <FaHospitalUser className="h-8 w-8 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-lg mb-0.5">
                {appointment.patientName || appointment.patient?.fullName || "Patient"}
              </h4>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm mb-1">
                {(() => {
                  const age = calcAge(appointment.patient?.dob);
                  const gender = appointment.patient?.gender;
                  const blood = appointment.patient?.bloodGroup;
                  return (
                    <>
                      {age !== null && (
                        <span className="text-gray-600">Age: <span className="font-semibold text-gray-800">{age} yrs</span></span>
                      )}
                      {gender && (
                        <span className="text-gray-600">Gender: <span className="font-semibold text-gray-800 capitalize">{gender}</span></span>
                      )}
                      {blood && (
                        <span className="text-gray-600">Blood: <span className="font-semibold text-red-600">{blood}</span></span>
                      )}
                    </>
                  );
                })()}
              </div>
              {(appointment.patientPhone || appointment.patient?.phone) && (
                <p className="text-teal-700 text-sm flex items-center gap-1.5 mb-0.5">
                  <FiPhone className="h-3.5 w-3.5" />
                  {appointment.patientPhone || appointment.patient?.phone}
                </p>
              )}
              <p className="text-gray-500 text-sm flex items-center gap-1.5">
                <MdSecurity className="h-3.5 w-3.5" />
                ID: {appointment.patientId || appointment.patient?.id || "—"}
              </p>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={() => onViewDetails(appointment)}
              className="border-2 border-teal-300 text-teal-700 hover:bg-teal-50 flex-shrink-0"
            >
              <FiEye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <FiClock className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-bold text-blue-900">Time Slot</p>
              </div>
              <p className="text-blue-800 font-medium">
                {appointment.timeSlot?.start || appointment.from} -{" "}
                {appointment.timeSlot?.end || appointment.to}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <FiCalendar className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-bold text-purple-900">Date</p>
              </div>
              <p className="text-purple-800 font-medium">
                {appointment.date || appointment.appointmentDate}
              </p>
            </div>
          </div>

          {(appointment.reason || appointment.condition) && (
            <div className="bg-white rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center space-x-2 mb-2">
                <MdMedicalServices className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-900">
                  Reason / Condition
                </p>
              </div>
              <p className="text-emerald-800 font-medium">
                {appointment.reason || appointment.condition}
              </p>
            </div>
          )}

          {appointment.message && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <FaNotesMedical className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-bold text-blue-900">
                  Patient Message
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                <p className="text-blue-800 italic">"{appointment.message}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {(status === "scheduled" || status === "confirmed" || status === "in_progress") && (
            <Button
              size="small"
              disabled={actionLoading}
              onClick={() => onPrescribe(appointment)}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              <FaPrescriptionBottleAlt className="h-4 w-4 mr-2" />
              Prescribe Medicine
            </Button>
          )}

          {status === "in_progress" && (
            <Button
              size="small"
              disabled={actionLoading}
              onClick={() => handleStatusChange("completed")}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              {actionLoading ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <FiCheck className="h-4 w-4 mr-2" />
                  Complete
                </>
              )}
            </Button>
          )}

          {status === "completed" && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
              <FiCheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-700 font-medium text-sm">
                Consultation completed
              </span>
            </div>
          )}

          {canMarkNoShow && (
            <Button
              size="small"
              disabled={actionLoading}
              onClick={() => handleStatusChange("no_show")}
              variant="outline"
              className="border-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              <FiX className="h-4 w-4 mr-2" />
              No Show
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const AppointmentDetailsModal = ({ appointment, isOpen, onClose }) => {
  if (!appointment) return null;

  const status = appointment.status;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Details"
      size="large"
    >
      <div className="space-y-8">
        {/* Appointment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MdSchedule className="h-6 w-6 text-blue-600" />
              Appointment Information
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-blue-200">
                <p className="text-sm font-bold text-blue-900 mb-1">
                  Token Number
                </p>
                <p className="text-blue-800 font-medium">
                  #{appointment.tokenNumber ?? appointment._id?.slice(-4) ?? appointment.id}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-blue-200">
                <p className="text-sm font-bold text-blue-900 mb-1">
                  Date &amp; Time
                </p>
                <p className="text-blue-800 font-medium">
                  {appointment.date || appointment.appointmentDate}
                </p>
                <p className="text-blue-700">
                  {appointment.timeSlot?.start || appointment.from} -{" "}
                  {appointment.timeSlot?.end || appointment.to}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-blue-200">
                <p className="text-sm font-bold text-blue-900 mb-2">Status</p>
                {getStatusBadge(status)}
              </div>
              {(appointment.reason || appointment.condition) && (
                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <p className="text-sm font-bold text-blue-900 mb-1">
                    Reason / Condition
                  </p>
                  <p className="text-blue-800 font-medium">
                    {appointment.reason || appointment.condition}
                  </p>
                </div>
              )}
              {appointment.message && (
                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <p className="text-sm font-bold text-blue-900 mb-2">
                    Patient Message
                  </p>
                  <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                    <p className="text-blue-800 italic">
                      "{appointment.message}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaHospitalUser className="h-6 w-6 text-teal-600" />
              Patient Information
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-teal-200">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center border-2 border-teal-200">
                    <FaHospitalUser className="h-8 w-8 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {appointment.patientName || appointment.patient?.fullName || "Patient"}
                    </h4>
                    {(appointment.patientPhone || appointment.patient?.phone) && (
                      <p className="text-teal-700 text-sm flex items-center gap-1.5 mt-0.5">
                        <FiPhone className="h-3.5 w-3.5" />
                        {appointment.patientPhone || appointment.patient?.phone}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm mt-0.5">
                      ID: {maskPatientId(appointment.patientId)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const router = useRouter();

  const getTodayString = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchAppointments = useCallback(async () => {
    const doctorId = localStorage.getItem("mv_doctor_id");
    if (!doctorId) {
      setLoading(false);
      setError("No doctor ID found. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch profile + ALL appointments (no date restriction so past bookings show up too)
      const [profileRes, apptRes] = await Promise.allSettled([
        apiClient.get(`/doctor/${doctorId}`),
        apiClient.get(`/doctor/${doctorId}/appointments`),
      ]);

      if (profileRes.status === "fulfilled") {
        const profilePayload = profileRes.value.data;
        setDoctorData(profilePayload?.data ?? profilePayload ?? null);
      }

      if (apptRes.status === "fulfilled") {
        const apptPayload = apptRes.value.data;
        const list =
          apptPayload?.data ??
          apptPayload?.appointments ??
          (Array.isArray(apptPayload) ? apptPayload : []);
        setAppointments(list);
        setFilteredAppointments(list);
      } else {
        // API failed — fall back to empty list gracefully
        console.warn("Appointments API failed:", apptRes.reason);
        setAppointments([]);
        setFilteredAppointments([]);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Client-side filter + search
  useEffect(() => {
    let filtered = appointments;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (appt) =>
          (appt._id || appt.id || "").toString().toLowerCase().includes(term) ||
          (appt.patientId || "").toString().toLowerCase().includes(term) ||
          (appt.reason || appt.condition || "").toLowerCase().includes(term)
      );
    }

    if (filterStatus !== "all") {
      if (filterStatus === "active") {
        filtered = filtered.filter(
          (appt) =>
            appt.status === "scheduled" ||
            appt.status === "confirmed" ||
            appt.status === "in_progress"
        );
      } else if (filterStatus === "completed") {
        filtered = filtered.filter((appt) => appt.status === "completed");
      } else {
        filtered = filtered.filter((appt) => appt.status === filterStatus);
      }
    }

    if (filterDate !== "all") {
      const now = new Date();
      const todayMs = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();

      filtered = filtered.filter((appt) => {
        const raw = appt.date || appt.appointmentDate;
        if (!raw) return false;
        const apptDay = new Date(raw);
        const apptMs = new Date(
          apptDay.getFullYear(),
          apptDay.getMonth(),
          apptDay.getDate()
        ).getTime();

        switch (filterDate) {
          case "today":
            return apptMs === todayMs;
          case "upcoming":
            return apptMs > todayMs;
          case "overdue":
            return (
              apptMs < todayMs &&
              appt.status !== "completed" &&
              appt.status !== "no_show"
            );
          default:
            return true;
        }
      });
    }

    // Sort by date ascending (queue order), then by token number
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.appointmentDate || 0);
      const dateB = new Date(b.date || b.appointmentDate || 0);
      if (dateA - dateB !== 0) return dateA - dateB;
      return (a.tokenNumber ?? 0) - (b.tokenNumber ?? 0);
    });

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, filterStatus, filterDate]);

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handlePrescribe = (appointment) => {
    const params = new URLSearchParams();
    const patientId = appointment.patientId || appointment.patient?.id || '';
    const apptId = appointment._id || appointment.id || '';
    const patientName = appointment.patientName || appointment.patient?.fullName || '';
    const patientAge = calcAge(appointment.patient?.dob);
    const patientGender = appointment.patient?.gender || '';
    const patientBlood = appointment.patient?.bloodGroup || '';
    if (patientId) params.set('patientId', patientId);
    if (apptId) params.set('appointmentId', apptId);
    if (patientName) params.set('patientName', patientName);
    if (patientAge !== null) params.set('patientAge', String(patientAge));
    if (patientGender) params.set('patientGender', patientGender);
    if (patientBlood) params.set('patientBlood', patientBlood);
    router.push(`/doctor/prescribe?${params.toString()}`);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await apiClient.put(`/doctor/appointments/${appointmentId}/status`, {
        status: newStatus,
      });

      // Optimistically update local state
      setAppointments((prev) =>
        prev.map((appt) =>
          (appt._id || appt.id) === appointmentId
            ? { ...appt, status: newStatus }
            : appt
        )
      );

      const labels = {
        in_progress: "Consultation started",
        completed: "Appointment completed",
        no_show: "Marked as no-show",
      };
      toast.success(labels[newStatus] || "Status updated");
    } catch (err) {
      console.error("Error updating appointment status:", err);
      toast.error("Failed to update appointment status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="p-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-2xl">
              <MdSchedule className="h-12 w-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-300 rounded-full animate-ping"></div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-medium">
            Loading appointments...
          </p>
          <p className="text-sm text-gray-500">Accessing patient schedules</p>
        </div>
      </div>
    );
  }

  if (error && !doctorData) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
          <div className="text-center py-12">
            <div className="relative mb-6">
              <div className="p-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full w-fit mx-auto shadow-lg">
                <FaUserMd className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <MdEmergency className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <MdHealthAndSafety className="h-5 w-5 text-red-600" />
              Access Denied
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/doctor/register")}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 w-full"
              >
                <FaUserMd className="mr-2 h-4 w-4" />
                Register as Doctor
              </Button>
              <div className="flex items-center justify-center space-x-2 text-sm text-red-600">
                <FiShield className="h-4 w-4" />
                <span>Medical License Verification Required</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const stats = {
    total: appointments.length,
    active: appointments.filter(
      (apt) =>
        apt.status === "scheduled" ||
        apt.status === "confirmed" ||
        apt.status === "in_progress"
    ).length,
    completed: appointments.filter((apt) => apt.status === "completed").length,
    today: appointments.filter((apt) => {
      const now = new Date();
      const todayMs = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();
      const raw = apt.date || apt.appointmentDate;
      if (!raw) return false;
      const d = new Date(raw);
      return (
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() ===
        todayMs
      );
    }).length,
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 relative">
      {/* Medical Background Elements */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <MdSchedule className="absolute top-20 right-20 h-32 w-32 text-teal-600 animate-pulse" />
        <FaStethoscope className="absolute bottom-20 left-20 h-24 w-24 text-cyan-600" />
        <MdLocalHospital className="absolute top-1/2 left-1/4 h-28 w-28 text-blue-600 animate-pulse animation-delay-2000" />
      </div>

      {/* Enhanced Header */}
      <div className="mb-12 relative z-10">
        <div className="flex items-center space-x-6 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/doctor/dashboard")}
            className="border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
          >
            <FiArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-lg">
              <MdSchedule className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
                My Appointments
                <MdHealthAndSafety className="h-8 w-8 text-teal-600" />
              </h1>
              <p className="text-xl text-gray-600">
                Manage your patient consultations and medical schedules
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div></div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-none px-4 py-2">
              <FaUserMd className="w-4 h-4 mr-2" />
              Dr.{" "}
              {doctorData?.name ||
                doctorData?.fullName ||
                `Doctor #${doctorData?.id}`}
            </Badge>
            {doctorData?.status === "approved" || doctorData?.isApproved ? (
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none px-4 py-2">
                <MdVerifiedUser className="w-4 h-4 mr-2" />
                Verified
              </Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none px-4 py-2">
                <FiClock className="w-4 h-4 mr-2" />
                Pending Approval
              </Badge>
            )}
            <Button
              variant="outline"
              size="small"
              onClick={fetchAppointments}
              className="border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <FiRefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg">
              <MdSchedule className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-blue-700 font-bold uppercase tracking-wide">
                Total Appointments
              </p>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg">
              <FiClock className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-emerald-700 font-bold uppercase tracking-wide">
                Active
              </p>
              <p className="text-3xl font-bold text-emerald-600">
                {stats.active}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
              <FiCheckCircle className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-purple-700 font-bold uppercase tracking-wide">
                Completed
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.completed}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center p-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
              <FiAlertCircle className="h-8 w-8" />
            </div>
            <div className="ml-6">
              <p className="text-sm text-orange-700 font-bold uppercase tracking-wide">
                Today
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {stats.today}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FiFilter className="h-6 w-6 text-blue-600" />
            Filter Appointments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">
                <FiSearch className="h-4 w-4 text-blue-600" />
                Search Appointments
              </label>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by appointment ID, patient ID, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 focus:ring-blue-500 focus:border-blue-500 border-2 border-blue-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">
                <MdVerifiedUser className="h-4 w-4 text-blue-600" />
                Status Filter
              </label>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 border-2 border-blue-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="no_show">No Show</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">
                <FiCalendar className="h-4 w-4 text-blue-600" />
                Date Filter
              </label>
              <Select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 border-2 border-blue-200"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 border-2 border-gray-200">
        <p className="text-gray-600 font-medium flex items-center gap-2">
          <MdSchedule className="h-5 w-5 text-teal-600" />
          Showing{" "}
          <span className="font-bold text-teal-600">
            {filteredAppointments.length}
          </span>{" "}
          of <span className="font-bold">{appointments.length}</span>{" "}
          appointments
        </p>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length > 0 ? (
        <div className="space-y-8">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id || appointment.id}
              appointment={appointment}
              onViewDetails={handleViewDetails}
              onStatusChange={handleStatusChange}
              onPrescribe={handlePrescribe}
              doctorData={doctorData}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200">
          <div className="p-6 bg-gradient-to-r from-gray-100 to-slate-100 rounded-full w-fit mx-auto mb-6">
            <MdSchedule className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {searchTerm || filterStatus !== "all" || filterDate !== "all"
              ? "No appointments found"
              : "No appointments today"}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
            {searchTerm || filterStatus !== "all" || filterDate !== "all"
              ? "Try adjusting your search filters to see more results."
              : "You don't have any patient appointments scheduled for today."}
          </p>
        </Card>
      )}

      {/* Details Modal */}
      <AppointmentDetailsModal
        appointment={selectedAppointment}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
};

export default DoctorAppointments;

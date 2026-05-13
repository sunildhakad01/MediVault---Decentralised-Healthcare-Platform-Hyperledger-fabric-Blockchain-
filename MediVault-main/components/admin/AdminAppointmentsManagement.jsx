import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiSearch,
  FiFilter,
  FiEye,
  FiCheck,
  FiX,
  FiArrowLeft,
  FiMoreVertical,
  FiShield,
  FiActivity,
  FiTrendingUp,
  FiUsers,
  FiRefreshCw,
  FiDownload,
  FiMail,
  FiPhone,
  FiMapPin,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdVerifiedUser,
  MdPendingActions,
  MdEventNote,
  MdHealthAndSafety,
  MdMedicalServices,
  MdSecurity,
  MdEmergency,
  MdSchedule,
  MdBiotech,
  MdMonitorHeart,
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
} from "react-icons/fa";
import { Card, Button, Input, Select, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import { truncateAddress } from "../../utils/helpers";
import toast from "react-hot-toast";

const AppointmentDetailsModal = ({
  isOpen,
  onClose,
  appointment,
  doctorData,
  patientData,
  loading,
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none";
      case "cancelled":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-none";
      case "pending":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-none";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "emergency":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-none";
      case "urgent":
        return "bg-gradient-to-r from-orange-500 to-red-500 text-white border-none";
      case "normal":
        return "bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-none";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-none";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border-2 border-teal-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg">
                <MdSchedule className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Appointment Details
                  <MdHealthAndSafety className="h-6 w-6 text-teal-600" />
                </h3>
                <p className="text-teal-600 font-medium">#{appointment?.id}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={onClose}
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              <FiX className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Appointment Information */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MdSchedule className="h-6 w-6 text-blue-600" />
                    Appointment Information
                  </h4>
                  <div className="space-y-4">
                    {[
                      { label: "Appointment ID", value: `#${appointment?.id}` },
                      {
                        label: "Date & Time",
                        value: appointment?.appointmentDate,
                      },
                      {
                        label: "Duration",
                        value: `${appointment?.from} - ${appointment?.to}`,
                      },
                      { label: "Condition", value: appointment?.condition },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200"
                      >
                        <span className="text-gray-600 font-medium">
                          {item.label}:
                        </span>
                        <span className="font-bold text-gray-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200">
                      <span className="text-gray-600 font-medium">Status:</span>
                      <Badge className={getStatusColor(appointment?.status)}>
                        <FiCheckCircle className="w-3 h-3 mr-1" />
                        {appointment?.status || "Pending"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200">
                      <span className="text-gray-600 font-medium">
                        Urgency:
                      </span>
                      <Badge className={getUrgencyColor(appointment?.urgency)}>
                        <FiAlertCircle className="w-3 h-3 mr-1" />
                        {appointment?.urgency || "Normal"}
                      </Badge>
                    </div>
                  </div>

                  {appointment?.message && (
                    <div className="mt-6 pt-6 border-t border-blue-200">
                      <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FaNotesMedical className="h-5 w-5 text-blue-600" />
                        Patient Message
                      </h5>
                      <div className="bg-white p-4 rounded-xl border-2 border-blue-200">
                        <p className="text-gray-700 leading-relaxed">
                          {appointment.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MdLocalHospital className="h-6 w-6 text-emerald-600" />
                    Payment Information
                  </h4>
                  <div className="space-y-4">
                    {[
                      { label: "Appointment Fee", value: "0.0025 ETH" },
                      { label: "Transaction Hash", value: "0x1234...5678" },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200"
                      >
                        <span className="text-gray-600 font-medium">
                          {item.label}:
                        </span>
                        <span className="font-bold text-gray-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200">
                      <span className="text-gray-600 font-medium">
                        Payment Status:
                      </span>
                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none">
                        <FiCheckCircle className="w-3 h-3 mr-1" />
                        Paid
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Doctor & Patient Information */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FaUserMd className="h-6 w-6 text-purple-600" />
                    Doctor Information
                  </h4>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                      <FaStethoscope className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        Dr.{" "}
                        {doctorData?.name ||
                          appointment?.doctorName ||
                          `Doctor #${appointment?.doctorId}`}
                      </p>
                      <p className="text-purple-600 font-medium">
                        ID: #{appointment?.doctorId}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        icon: FiMapPin,
                        text: truncateAddress(appointment?.doctorAddress),
                      },
                      ...(doctorData?.specialization
                        ? [
                            {
                              icon: MdMedicalServices,
                              text: doctorData.specialization,
                            },
                          ]
                        : []),
                      ...(doctorData?.email
                        ? [{ icon: FiMail, text: doctorData.email }]
                        : []),
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-white rounded-xl border border-purple-200"
                      >
                        <item.icon className="h-4 w-4 mr-3 text-purple-600" />
                        <span className="text-gray-700">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FaHospitalUser className="h-6 w-6 text-orange-600" />
                    Patient Information
                  </h4>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                      <FaHospitalUser className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {patientData?.name ||
                          `Patient #${appointment?.patientId}`}
                      </p>
                      <p className="text-orange-600 font-medium">
                        ID: #{appointment?.patientId}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        icon: FiMapPin,
                        text: truncateAddress(appointment?.patientAddress),
                      },
                      ...(patientData?.age
                        ? [
                            {
                              icon: FiUser,
                              text: `Age: ${patientData.age} years`,
                            },
                          ]
                        : []),
                      ...(patientData?.bloodGroup
                        ? [
                            {
                              icon: FiActivity,
                              text: `Blood Group: ${patientData.bloodGroup}`,
                            },
                          ]
                        : []),
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-white rounded-xl border border-orange-200"
                      >
                        <item.icon className="h-4 w-4 mr-3 text-orange-600" />
                        <span className="text-gray-700">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MdMedicalServices className="h-6 w-6 text-teal-600" />
                    Admin Actions
                  </h4>
                  <div className="space-y-3">
                    {[
                      { icon: FiMail, text: "Contact Doctor", color: "teal" },
                      { icon: FiMail, text: "Contact Patient", color: "cyan" },
                      {
                        icon: FiDownload,
                        text: "Download Report",
                        color: "blue",
                      },
                    ].map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={`w-full justify-start border-2 border-${action.color}-300 text-${action.color}-700 hover:bg-${action.color}-50`}
                      >
                        <action.icon className="h-4 w-4 mr-3" />
                        {action.text}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
              <FiDownload className="h-4 w-4 mr-2" />
              Export Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentCard = ({
  appointment,
  onViewDetails,
  doctorData,
  patientData,
}) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none";
      case "cancelled":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-none";
      case "pending":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-none";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "emergency":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-none";
      case "urgent":
        return "bg-gradient-to-r from-orange-500 to-red-500 text-white border-none";
      case "normal":
        return "bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-none";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-none";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <MdSchedule className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Appointment #{appointment.id}
              </h3>
              <p className="text-blue-600 font-medium flex items-center gap-1">
                <FiCalendar className="h-4 w-4" />
                {appointment.appointmentDate}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge className={getStatusColor(appointment.status)}>
              <FiCheckCircle className="w-3 h-3 mr-1" />
              {appointment.status || "Pending"}
            </Badge>
            <Badge className={getUrgencyColor(appointment.urgency)}>
              <FiAlertCircle className="w-3 h-3 mr-1" />
              {appointment.urgency || "Normal"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-xl border-2 border-purple-200">
            <p className="text-sm text-purple-600 font-bold uppercase tracking-wide mb-2">
              Doctor
            </p>
            <p className="font-bold text-gray-900 flex items-center gap-2">
              <FaUserMd className="h-4 w-4 text-purple-600" />
              Dr.{" "}
              {doctorData?.name ||
                appointment.doctorName ||
                `Doctor #${appointment.doctorId}`}
            </p>
            <p className="text-sm text-purple-600 font-medium">
              ID: #{appointment.doctorId}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-emerald-200">
            <p className="text-sm text-emerald-600 font-bold uppercase tracking-wide mb-2">
              Patient
            </p>
            <p className="font-bold text-gray-900 flex items-center gap-2">
              <FaHospitalUser className="h-4 w-4 text-emerald-600" />
              {patientData?.name || `Patient #${appointment.patientId}`}
            </p>
            <p className="text-sm text-emerald-600 font-medium">
              ID: #{appointment.patientId}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Start Time", value: appointment.from, color: "blue" },
            { label: "End Time", value: appointment.to, color: "emerald" },
            { label: "Fee", value: "0.0025 ETH", color: "purple" },
          ].map((item, index) => (
            <div
              key={index}
              className="text-center bg-white p-3 rounded-xl border-2 border-gray-200"
            >
              <p className={`text-lg font-bold text-${item.color}-600`}>
                {item.value}
              </p>
              <p className="text-xs text-gray-500 font-medium">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="bg-white p-4 rounded-xl border-2 border-teal-200">
            <p className="text-sm text-teal-600 font-bold uppercase tracking-wide mb-2">
              Medical Condition
            </p>
            <p className="font-bold text-gray-900 flex items-center gap-2">
              <FaNotesMedical className="h-4 w-4 text-teal-600" />
              {appointment.condition}
            </p>
          </div>
        </div>

        {appointment.message && (
          <div className="mb-6">
            <div className="bg-white p-4 rounded-xl border-2 border-orange-200">
              <p className="text-sm text-orange-600 font-bold uppercase tracking-wide mb-2">
                Patient Message
              </p>
              <p className="text-sm text-gray-700 line-clamp-2">
                {appointment.message}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FiClock className="h-4 w-4" />
            <span className="font-medium">
              Booked {new Date().toLocaleDateString()}
            </span>
          </div>
          <Button
            variant="outline"
            size="small"
            onClick={() => onViewDetails(appointment)}
            className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-bold"
          >
            <FiEye className="h-4 w-4 mr-2" />
            View Details
            <FiArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

const AdminAppointmentsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get("/admin/stats");
        const stats = data.data || data.stats || {};
        // Populate stat counters from the API response
        // Appointments are managed per-hospital and per-doctor; we show summary stats only
        setAppointments([]);
        setFilteredAppointments([]);
        setDoctors([]);
        setPatients([]);
        setAdminData({
          totalAppointments: stats.totalAppointments || 0,
          completedAppointments: stats.completedAppointments || 0,
          pendingAppointments: stats.pendingAppointments || 0,
          emergencyAppointments: stats.emergencyAppointments || 0,
          totalDoctors: stats.totalDoctors || 0,
        });
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast.error("Failed to load appointments data");
        // Set adminData to empty object so we still render the page
        setAdminData({
          totalAppointments: 0,
          completedAppointments: 0,
          pendingAppointments: 0,
          emergencyAppointments: 0,
          totalDoctors: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Filter and sort appointments
  useEffect(() => {
    let filtered = appointments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((appointment) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          appointment.id.toString().includes(searchLower) ||
          appointment.doctorId.toString().includes(searchLower) ||
          appointment.patientId.toString().includes(searchLower) ||
          appointment.condition?.toLowerCase().includes(searchLower) ||
          appointment.doctorName?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((appointment) => {
        const status = appointment.status?.toLowerCase() || "pending";
        return status === statusFilter;
      });
    }

    // Urgency filter
    if (urgencyFilter !== "all") {
      filtered = filtered.filter((appointment) => {
        const urgency = appointment.urgency?.toLowerCase() || "normal";
        return urgency === urgencyFilter;
      });
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date();
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        switch (dateFilter) {
          case "today":
            return appointmentDate.toDateString() === today.toDateString();
          case "week":
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return appointmentDate >= weekAgo;
          case "month":
            const monthAgo = new Date(
              today.getTime() - 30 * 24 * 60 * 60 * 1000
            );
            return appointmentDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort appointments
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.appointmentDate) - new Date(a.appointmentDate);
        case "doctor":
          return (a.doctorName || "").localeCompare(b.doctorName || "");
        case "patient":
          return a.patientId - b.patientId;
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        case "urgency":
          const urgencyOrder = { emergency: 3, urgent: 2, normal: 1 };
          return (
            urgencyOrder[b.urgency?.toLowerCase() || "normal"] -
            urgencyOrder[a.urgency?.toLowerCase() || "normal"]
          );
        case "recent":
        default:
          return Number(b.id) - Number(a.id);
      }
    });

    setFilteredAppointments(filtered);
  }, [
    appointments,
    searchTerm,
    statusFilter,
    urgencyFilter,
    dateFilter,
    sortBy,
  ]);

  const handleViewDetails = async (appointment) => {
    setSelectedAppointment(appointment);
    setDetailsModal(true);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const { data } = await apiClient.get("/admin/stats");
      const stats = data.stats || data || {};
      setAdminData({
        totalAppointments: stats.totalAppointments || 0,
        completedAppointments: stats.completedAppointments || 0,
        pendingAppointments: stats.pendingAppointments || 0,
        emergencyAppointments: stats.emergencyAppointments || 0,
        totalDoctors: stats.totalDoctors || 0,
      });
      toast.success("Stats refreshed");
    } catch (error) {
      console.error("Error refreshing appointments:", error);
      toast.error("Failed to refresh appointments");
    } finally {
      setRefreshing(false);
    }
  };

  const exportAppointmentsData = () => {
    const exportData = filteredAppointments.map((appointment) => ({
      id: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      doctorName: appointment.doctorName,
      appointmentDate: appointment.appointmentDate,
      timeSlot: `${appointment.from} - ${appointment.to}`,
      condition: appointment.condition,
      status: appointment.status || "Pending",
      urgency: appointment.urgency || "Normal",
      message: appointment.message,
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `appointments-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Appointments data exported successfully!");
  };

  const getDoctorData = (doctorId) => {
    return doctors.find((d) => d.id === doctorId);
  };

  const getPatientData = (patientId) => {
    return patients.find((p) => p.id === patientId);
  };

  const totalAppointments = adminData?.totalAppointments || 0;
  const completedAppointments = adminData?.completedAppointments || 0;
  const pendingAppointments = adminData?.pendingAppointments || 0;
  const emergencyAppointments = adminData?.emergencyAppointments || 0;

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
            Loading appointments management...
          </p>
          <p className="text-sm text-gray-500">
            Connecting to healthcare network
          </p>
        </div>
      </div>
    );
  }

  // adminData is always set after loading completes (even on error with defaults)

  return (
    <div className="space-y-8 relative">
      {/* Medical Background Elements */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <MdSchedule className="absolute top-20 right-20 h-32 w-32 text-teal-600 animate-pulse" />
        <FaHeartbeat className="absolute bottom-20 left-20 h-24 w-24 text-cyan-600" />
        <MdLocalHospital className="absolute top-1/2 left-1/4 h-28 w-28 text-blue-600 animate-pulse animation-delay-2000" />
      </div>

      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-2xl p-8 text-white shadow-2xl border-2 border-teal-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-12 translate-y-12"></div>

        <div className="flex items-center justify-between relative z-10 mb-6">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm border border-white border-opacity-30 shadow-lg">
              <MdSchedule className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                Appointments Management
                <MdHealthAndSafety className="h-8 w-8" />
              </h1>
              <p className="text-teal-100 text-lg flex items-center gap-2">
                <MdSecurity className="h-4 w-4" />
                Monitor and manage all platform appointments
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/dashboard")}
              className="border-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm"
            >
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              loading={refreshing}
              disabled={refreshing}
              className="border-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={exportAppointmentsData}
              className="border-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm"
            >
              <FiDownload className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Info Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <FiShield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <MdVerifiedUser className="h-5 w-5" />
                Admin Panel - Appointments Management
              </h3>
              <p className="text-purple-700 flex items-center gap-2">
                <MdSecurity className="h-4 w-4" />
                Logged in as Admin • Total Appointments: {totalAppointments}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Total Appointments",
            value: totalAppointments,
            icon: MdSchedule,
            color: "blue",
            description: "All scheduled appointments",
          },
          {
            title: "Completed",
            value: completedAppointments,
            icon: FiCheckCircle,
            color: "emerald",
            description: "Successfully completed",
          },
          {
            title: "Pending",
            value: pendingAppointments,
            icon: FiClock,
            color: "yellow",
            description: "Awaiting consultation",
          },
          {
            title: "Emergency",
            value: emergencyAppointments,
            icon: MdEmergency,
            color: "red",
            description: "Urgent medical cases",
          },
        ].map((stat, index) => (
          <Card
            key={index}
            className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 border-2 border-${stat.color}-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="p-6 text-center">
              <div
                className={`p-4 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-2xl w-fit mx-auto mb-4 shadow-lg`}
              >
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <p className={`text-3xl font-bold text-${stat.color}-600 mb-2`}>
                {stat.value}
              </p>
              <p
                className={`text-sm font-bold uppercase tracking-wide text-${stat.color}-700 mb-1`}
              >
                {stat.title}
              </p>
              <p className="text-xs text-gray-600">{stat.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FiSearch className="h-6 w-6 text-indigo-600" />
            Search & Filter Appointments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wide">
                Search Appointments
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" />
                <Input
                  type="text"
                  placeholder="Search by ID, doctor, patient, condition..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-indigo-200 focus:border-indigo-500"
                />
              </div>
            </div>
            {[
              {
                label: "Status",
                value: statusFilter,
                setter: setStatusFilter,
                options: [
                  { value: "all", label: "All Status" },
                  { value: "pending", label: "Pending" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" },
                ],
              },
              {
                label: "Urgency",
                value: urgencyFilter,
                setter: setUrgencyFilter,
                options: [
                  { value: "all", label: "All Urgency" },
                  { value: "emergency", label: "Emergency" },
                  { value: "urgent", label: "Urgent" },
                  { value: "normal", label: "Normal" },
                ],
              },
              {
                label: "Date Range",
                value: dateFilter,
                setter: setDateFilter,
                options: [
                  { value: "all", label: "All Time" },
                  { value: "today", label: "Today" },
                  { value: "week", label: "Last Week" },
                  { value: "month", label: "Last Month" },
                ],
              },
              {
                label: "Sort by",
                value: sortBy,
                setter: setSortBy,
                options: [
                  { value: "recent", label: "Most Recent" },
                  { value: "date", label: "Appointment Date" },
                  { value: "doctor", label: "Doctor Name" },
                  { value: "patient", label: "Patient ID" },
                  { value: "status", label: "Status" },
                  { value: "urgency", label: "Urgency Level" },
                ],
              },
            ].map((filter, index) => (
              <div key={index}>
                <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wide">
                  {filter.label}
                </label>
                <Select
                  value={filter.value}
                  onChange={(e) => filter.setter(e.target.value)}
                  className="border-2 border-indigo-200 focus:border-indigo-500"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white rounded-xl border-2 border-indigo-200">
            <div className="flex items-center justify-between text-sm">
              <p className="font-bold text-indigo-900">
                Showing {filteredAppointments.length} of {totalAppointments}{" "}
                appointments
              </p>
              <div className="flex items-center space-x-6 text-indigo-700">
                {[
                  {
                    label: "Completed",
                    count: filteredAppointments.filter(
                      (a) => a.status?.toLowerCase() === "completed"
                    ).length,
                  },
                  {
                    label: "Pending",
                    count: filteredAppointments.filter(
                      (a) => !a.status || a.status?.toLowerCase() === "pending"
                    ).length,
                  },
                  {
                    label: "Emergency",
                    count: filteredAppointments.filter(
                      (a) => a.urgency?.toLowerCase() === "emergency"
                    ).length,
                  },
                ].map((item, index) => (
                  <span key={index} className="font-medium">
                    {item.label}:{" "}
                    <span className="font-bold">{item.count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Emergency Appointments Alert */}
      {emergencyAppointments > 0 && (
        <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-l-8 border-red-500 border-2 border-red-200">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg">
                <MdEmergency className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  Emergency Appointments Alert
                </h3>
                <p className="text-red-800 leading-relaxed">
                  There are {emergencyAppointments} emergency appointment
                  {emergencyAppointments > 1 ? "s" : ""} that require immediate
                  medical attention.
                </p>
              </div>
              <Button
                onClick={() => setUrgencyFilter("emergency")}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg"
              >
                <FaAmbulance className="h-4 w-4 mr-2" />
                View Emergency
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Appointments List — per-hospital/per-doctor scope */}
      <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200">
        <div className="text-center py-16">
          <div className="p-6 bg-gradient-to-r from-teal-400 to-blue-400 rounded-full w-fit mx-auto mb-6 shadow-lg">
            <MdEventNote className="h-16 w-16 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Appointment Details
          </h3>
          <p className="text-gray-600 text-lg leading-relaxed max-w-lg mx-auto">
            Appointment details are managed per-hospital and per-doctor. Use the statistics above for an overview, and navigate to individual hospital or doctor panels to review specific appointments.
          </p>
        </div>
      </Card>

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={detailsModal}
        onClose={() => {
          setDetailsModal(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        doctorData={
          selectedAppointment
            ? getDoctorData(selectedAppointment.doctorId)
            : null
        }
        patientData={
          selectedAppointment
            ? getPatientData(selectedAppointment.patientId)
            : null
        }
        loading={false}
      />

      {/* Enhanced Summary Analytics */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MdMonitorHeart className="h-6 w-6 text-purple-600" />
            Appointment Analytics Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Completion Rate",
                value: `${
                  totalAppointments > 0
                    ? Math.round(
                        (completedAppointments / totalAppointments) * 100
                      )
                    : 0
                }%`,
                color: "emerald",
                icon: FiCheckCircle,
              },
              {
                title: "Avg per Doctor",
                value:
                  (adminData?.totalDoctors || 0) > 0
                    ? Math.round(totalAppointments / adminData.totalDoctors)
                    : 0,
                color: "blue",
                icon: FaUserMd,
              },
              {
                title: "Emergency Rate",
                value: `${
                  totalAppointments > 0
                    ? Math.round(
                        (emergencyAppointments / totalAppointments) * 100
                      )
                    : 0
                }%`,
                color: "red",
                icon: MdEmergency,
              },
            ].map((metric, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-2xl border-2 border-purple-200 hover:shadow-lg transition-all duration-200"
              >
                <div
                  className={`p-4 bg-gradient-to-r from-${metric.color}-500 to-${metric.color}-600 rounded-2xl w-fit mx-auto mb-4 shadow-lg`}
                >
                  <metric.icon className="h-8 w-8 text-white" />
                </div>
                <p
                  className={`text-4xl font-bold text-${metric.color}-600 mb-2`}
                >
                  {metric.value}
                </p>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  {metric.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* System Status */}
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
        <div className="p-6">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl shadow-lg">
              <MdHealthAndSafety className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                Appointment System Status: All Systems Operational
                <FiActivity className="h-6 w-6 text-emerald-600" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-emerald-200">
                  <ul className="text-sm text-emerald-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <MdSchedule className="h-4 w-4 text-teal-600" />
                      Appointment booking system operational
                    </li>
                    <li className="flex items-center gap-2">
                      <MdSecurity className="h-4 w-4 text-blue-600" />
                      Patient data security maintained
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-4 border border-emerald-200">
                  <ul className="text-sm text-emerald-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <FaStethoscope className="h-4 w-4 text-purple-600" />
                      Doctor verification systems active
                    </li>
                    <li className="flex items-center gap-2">
                      <FiClock className="h-4 w-4 text-emerald-600" />
                      Last updated: {new Date().toLocaleString()}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminAppointmentsManagement;

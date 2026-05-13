import { useState, useEffect } from "react";
import apiClient from "../../utils/api";
import {
  FiCalendar,
  FiShoppingBag,
  FiFileText,
  FiActivity,
  FiHeart,
  FiClock,
  FiUser,
  FiTrendingUp,
  FiShield,
  FiPhone,
  FiMail,
  FiMapPin,
} from "react-icons/fi";
import {
  MdHealthAndSafety,
  MdLocalHospital,
  MdMedicalServices,
  MdMonitorHeart,
  MdPersonalInjury,
  MdVerifiedUser,
  MdEmergency,
  MdLocalPharmacy,
  MdFavorite,
  MdOutlineHealthAndSafety,
  MdBloodtype,
  MdVaccines,
  MdBiotech,
  MdSecurity,
  MdNotifications,
  MdSchedule,
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
  FaBandAid,
  FaVials,
  FaAllergies,
} from "react-icons/fa";
import { Card, Badge, Button } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import { useRouter } from "next/router";

const PatientDashboard = () => {
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions] = useState([]);
  const [orders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    activeAppointments: 0,
    totalPrescriptions: 0,
    totalOrders: 0,
    unreadNotifications: 0,
    todayAppointments: 0,
    activePrescriptions: 0,
    totalLabReports: 0,
  });

  const router = useRouter();

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);

        // Get patient ID from localStorage.
        // On first login it may not be cached yet, so fall back to the REST profile endpoint.
        let patientId = localStorage.getItem("mv_patient_id");
        let restProfile = null;

        if (!patientId) {
          try {
            const profileRes = await apiClient.get("/patient/profile");
            restProfile = profileRes.data?.data;
            if (restProfile?.id) {
              localStorage.setItem("mv_patient_id", restProfile.id);
              patientId = restProfile.id;
            }
          } catch (_) {}
        }

        if (!patientId) {
          // Patient is genuinely not registered yet
          setLoading(false);
          return;
        }

        // Patient IS registered in DB — try Fabric for richer blockchain data,
        // fall back to REST profile so the dashboard always renders.
        try {
          const { data } = await apiClient.get(`/contracts/patient/${patientId}`);
          if (data?.data) {
            setPatientData(data.data);
          } else {
            throw new Error("empty blockchain response");
          }
        } catch (_) {
          // Fabric unavailable or data not yet synced — use REST profile as fallback
          if (!restProfile) {
            try {
              const profileRes = await apiClient.get("/patient/profile");
              restProfile = profileRes.data?.data;
            } catch (_) {}
          }
          setPatientData(restProfile || { id: patientId });
        }

        // Fetch live stats in parallel
        const today = new Date().toDateString();
        const todayISO = new Date().toISOString().slice(0, 10);

        const [notifRes, apptRes, rxRes, labRes] = await Promise.allSettled([
          apiClient.get("/patient/notifications"),
          apiClient.get("/patient/appointments"),
          apiClient.get("/patient/prescriptions"),
          apiClient.get("/patient/lab-reports"),
        ]);

        // Unread notification count
        let unreadNotifications = 0;
        if (notifRes.status === "fulfilled") {
          const list = notifRes.value?.data?.data || notifRes.value?.data || [];
          unreadNotifications = list.filter((n) => !n.read).length;
        }

        // Today's appointments
        let todayAppointments = 0;
        let totalAppointments = 0;
        if (apptRes.status === "fulfilled") {
          const list = apptRes.value?.data?.data || apptRes.value?.data || [];
          setAppointments(list);
          totalAppointments = list.length;
          todayAppointments = list.filter((a) => {
            const d = a.appointmentDate || a.date || "";
            return (
              new Date(d).toDateString() === today ||
              String(d).startsWith(todayISO)
            );
          }).length;
        }

        // Active prescriptions (follow-up date >= today)
        let activePrescriptions = 0;
        let totalPrescriptions = 0;
        if (rxRes.status === "fulfilled") {
          const list = rxRes.value?.data?.data || rxRes.value?.data || [];
          totalPrescriptions = list.length;
          activePrescriptions = list.filter((rx) => {
            const followUp = rx.followUpDate || rx.followUp;
            if (!followUp) return false;
            return new Date(followUp) >= new Date(todayISO);
          }).length;
        }

        // Total lab reports
        let totalLabReports = 0;
        if (labRes.status === "fulfilled") {
          const list = labRes.value?.data?.data || labRes.value?.data || [];
          totalLabReports = Array.isArray(list) ? list.length : 0;
        }

        setStats({
          totalAppointments,
          activeAppointments: todayAppointments,
          totalPrescriptions,
          totalOrders: 0,
          unreadNotifications,
          todayAppointments,
          activePrescriptions,
          totalLabReports,
        });
      } catch (error) {
        console.error("Error fetching patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, []);

  const formatDate = (timestamp) => {
    // Convert BigInt to Number for date operations
    const timeInMs = Number(timestamp) * 1000;
    return new Date(timeInMs).toLocaleDateString();
  };

  const getAppointmentStatus = (appointment) => {
    if (appointment.isOpen) {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none">
          <MdSchedule className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none">
          <MdVerifiedUser className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-2xl">
              <FaHospitalUser className="h-12 w-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-300 rounded-full animate-ping"></div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-medium">
            Loading patient dashboard...
          </p>
          <p className="text-sm text-gray-500">Fetching your medical data</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="text-center py-12">
            <div className="relative mb-6">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-fit mx-auto shadow-lg">
                <FaHospitalUser className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <MdEmergency className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <MdHealthAndSafety className="h-5 w-5 text-blue-600" />
              Patient Registration Required
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              You need to register as a patient on our secure healthcare
              platform to access your medical dashboard and health services.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/patient/register")}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 w-full"
              >
                <FaHospitalUser className="mr-2 h-4 w-4" />
                Register as Patient
              </Button>
              <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                <FiShield className="h-4 w-4" />
                <span>HIPAA Compliant & Blockchain Secured</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Medical Background Elements */}
      <div className="absolute inset-0 opacity-5 overflow-hidden">
        <FaHeartbeat className="absolute top-20 right-20 h-32 w-32 text-blue-600 animate-pulse" />
        <FaStethoscope className="absolute bottom-20 left-20 h-24 w-24 text-emerald-600" />
        <MdLocalHospital className="absolute top-1/2 left-1/4 h-28 w-28 text-indigo-600 animate-pulse animation-delay-2000" />
      </div>

      {/* Enhanced Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
        {/* Medical Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <FaStethoscope className="absolute top-4 right-8 h-16 w-16 animate-pulse" />
          <FaHeartbeat className="absolute bottom-4 left-8 h-12 w-12" />
          <MdMonitorHeart className="absolute top-1/2 right-1/3 h-20 w-20 animate-pulse animation-delay-3000" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm border border-white border-opacity-30 shadow-lg">
                <FaHospitalUser className="h-12 w-12" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full border-4 border-white flex items-center justify-center">
                <MdVerifiedUser className="h-4 w-4 text-emerald-700" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                Welcome to Your Health Dashboard
                <MdHealthAndSafety className="h-8 w-8 text-blue-200" />
              </h1>
              <div className="flex items-center space-x-4 text-blue-100">
                <div className="flex items-center space-x-2">
                  <MdPersonalInjury className="h-5 w-5" />
                  <span className="font-medium">
                    Patient ID: {patientData.uniquePatientId || `#${patientData.id?.toString()}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MdSecurity className="h-5 w-5" />
                  <span className="font-medium">Blockchain Verified</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-blue-100 text-sm">Today's Date</p>
              <p className="text-white font-semibold">
                {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <FaHeartbeat className="h-8 w-8 text-emerald-300 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Appointments */}
        <Card
          className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          onClick={() => router.push("/patient/appointments")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <FaStethoscope className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Today&apos;s Appointments
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.todayAppointments}
                </p>
              </div>
            </div>
            <div className="text-blue-400">
              <MdSchedule className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Active Prescriptions */}
        <Card
          className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          onClick={() => router.push("/patient/prescriptions")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                <MdMonitorHeart className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-600">
                  Active Prescriptions
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.activePrescriptions}
                </p>
              </div>
            </div>
            <div className="text-emerald-400">
              <MdFavorite className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Total Lab Reports */}
        <Card
          className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          onClick={() => router.push("/patient/lab-reports")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <FaPrescriptionBottleAlt className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Lab Reports
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalLabReports}
                </p>
              </div>
            </div>
            <div className="text-purple-400">
              <FaSyringe className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Notifications with unread badge */}
        <Card
          className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          onClick={() => router.push("/patient/notifications")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl shadow-lg relative">
                <MdNotifications className="h-8 w-8 text-white" />
                {stats.unreadNotifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {stats.unreadNotifications > 9
                      ? "9+"
                      : stats.unreadNotifications}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600">
                  Notifications
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.unreadNotifications}
                </p>
                <p className="text-xs text-orange-500">unread</p>
              </div>
            </div>
            <div className="text-orange-400">
              <FiShoppingBag className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Quick Actions */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MdMedicalServices className="h-6 w-6 text-blue-600" />
          Quick Medical Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button
            onClick={() => router.push("/patient/appointment")}
            className="flex items-center justify-center space-x-3 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white transform hover:scale-105 transition-all duration-200 rounded-xl shadow-lg"
          >
            <FaStethoscope className="h-6 w-6" />
            <span className="font-semibold">Book Appointment</span>
          </Button>
          <Button
            onClick={() => router.push("/patient/prescriptions")}
            className="flex items-center justify-center space-x-3 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white transform hover:scale-105 transition-all duration-200 rounded-xl shadow-lg"
          >
            <FaPrescriptionBottleAlt className="h-6 w-6" />
            <span className="font-semibold">My Prescriptions</span>
          </Button>
          <Button
            onClick={() => router.push("/patient/history")}
            className="flex items-center justify-center space-x-3 h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transform hover:scale-105 transition-all duration-200 rounded-xl shadow-lg"
          >
            <FaNotesMedical className="h-6 w-6" />
            <span className="font-semibold">Medical History</span>
          </Button>
          <Button
            onClick={() => router.push("/patient/invoices")}
            className="flex items-center justify-center space-x-3 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white transform hover:scale-105 transition-all duration-200 rounded-xl shadow-lg"
          >
            <FiActivity className="h-6 w-6" />
            <span className="font-semibold">Bills &amp; Payments</span>
          </Button>
          <Button
            onClick={() => router.push("/patient/notifications")}
            className="flex items-center justify-center space-x-3 h-16 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white transform hover:scale-105 transition-all duration-200 rounded-xl shadow-lg"
          >
            <MdNotifications className="h-6 w-6" />
            <span className="font-semibold">Notifications</span>
          </Button>
          <Button
            onClick={() => router.push("/patient/profile")}
            className="flex items-center justify-center space-x-3 h-16 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white transform hover:scale-105 transition-all duration-200 rounded-xl shadow-lg"
          >
            <FiUser className="h-6 w-6" />
            <span className="font-semibold">My Profile</span>
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Recent Appointments */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FaStethoscope className="h-5 w-5 text-blue-600" />
              Recent Appointments
            </h2>
            <Button
              variant="outline"
              size="small"
              onClick={() => router.push("/patient/appointments")}
              className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {appointments.slice(0, 3).map((appointment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                    <FaUserMd className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <MdVerifiedUser className="h-4 w-4 text-blue-600" />
                      Dr. {appointment.doctor?.fullName || appointment.doctor?.name || appointment.doctorId}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {appointment.doctor?.specialization || "General Physician"}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <FiClock className="h-3 w-3" />
                      {appointment.appointmentDate || appointment.date}
                      {appointment.from && ` · ${appointment.from}${appointment.to ? ` – ${appointment.to}` : ''}`}
                    </p>
                  </div>
                </div>
                {getAppointmentStatus(appointment)}
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="text-center py-8 bg-white rounded-xl border border-blue-200">
                <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <FaStethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  No appointments yet
                </h3>
                <p className="text-sm text-gray-500">
                  Book your first consultation with a verified doctor
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Enhanced Recent Prescriptions */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FaPrescriptionBottleAlt className="h-5 w-5 text-purple-600" />
              Recent Prescriptions
            </h2>
            <Button
              variant="outline"
              size="small"
              onClick={() => router.push("/patient/prescriptions")}
              className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {prescriptions.slice(0, 3).map((prescription, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                    <FaSyringe className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <MdLocalPharmacy className="h-4 w-4 text-purple-600" />
                      Medicine ID: #{prescription.medicineId?.toString()}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <FiClock className="h-3 w-3" />
                      {formatDate(prescription.date)}
                    </p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none">
                  <MdVerifiedUser className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            ))}
            {prescriptions.length === 0 && (
              <div className="text-center py-8 bg-white rounded-xl border border-purple-200">
                <div className="p-4 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                  <FaPrescriptionBottleAlt className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  No prescriptions yet
                </h3>
                <p className="text-sm text-gray-500">
                  Your prescribed medications will appear here
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Enhanced Medical History Summary */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FaNotesMedical className="h-6 w-6 text-emerald-600" />
          Medical History Overview
        </h2>
        <div className="space-y-4">
          {patientData.medicalHistory &&
          patientData.medicalHistory.length > 0 ? (
            patientData.medicalHistory.slice(0, 3).map((record, index) => (
              <div
                key={index}
                className="p-4 bg-white rounded-xl border border-emerald-200 shadow-sm"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <MdOutlineHealthAndSafety className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-gray-800 flex-1">{record}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-emerald-200">
              <div className="p-4 bg-emerald-100 rounded-full w-fit mx-auto mb-4">
                <MdMonitorHeart className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                No medical history recorded yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Your medical history will appear here after doctor consultations
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-emerald-600">
                <MdSecurity className="h-4 w-4" />
                <span>All medical data is encrypted and secure</span>
              </div>
            </div>
          )}
          {patientData.medicalHistory &&
            patientData.medicalHistory.length > 3 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => router.push("/patient/history")}
                  className="border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <FaNotesMedical className="mr-2 h-4 w-4" />
                  View Complete History
                </Button>
              </div>
            )}
        </div>
      </Card>

      {/* Enhanced Recent Orders */}
      <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MdLocalPharmacy className="h-6 w-6 text-orange-600" />
            Recent Medicine Orders
          </h2>
          <Button
            variant="outline"
            size="small"
            onClick={() => router.push("/patient/orders")}
            className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            View All
          </Button>
        </div>
        <div className="space-y-4">
          {orders.slice(0, 3).map((order, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl">
                  <FaPrescriptionBottleAlt className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <MdVaccines className="h-4 w-4 text-orange-600" />
                    Medicine ID: #{order.medicineId?.toString()}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FiActivity className="h-3 w-3" />
                      Qty: {order.quantity?.toString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock className="h-3 w-3" />
                      {formatDate(order.date)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 mb-1">
                  {order.payAmount
                    ? `${parseFloat(order.payAmount) / 1e18} ETH`
                    : "N/A"}
                </p>
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none">
                  <MdVerifiedUser className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-8 bg-white rounded-xl border border-orange-200">
              <div className="p-4 bg-orange-100 rounded-full w-fit mx-auto mb-4">
                <MdLocalPharmacy className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">
                No medicine orders yet
              </h3>
              <p className="text-sm text-gray-500">
                Your pharmaceutical purchases will appear here
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Enhanced Health Tips & Emergency Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200">
          <div className="flex items-start space-x-4">
            <div className="p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-lg">
              <MdOutlineHealthAndSafety className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Health & Wellness Tips
                <FaHeartbeat className="h-5 w-5 text-teal-600 animate-pulse" />
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-teal-100 rounded-full">
                    <FaStethoscope className="h-3 w-3 text-teal-600" />
                  </div>
                  <p className="text-sm text-gray-700">
                    Schedule regular check-ups with your doctor
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-cyan-100 rounded-full">
                    <FaPrescriptionBottleAlt className="h-3 w-3 text-cyan-600" />
                  </div>
                  <p className="text-sm text-gray-700">
                    Take prescribed medications as directed
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-emerald-100 rounded-full">
                    <MdMonitorHeart className="h-3 w-3 text-emerald-600" />
                  </div>
                  <p className="text-sm text-gray-700">
                    Maintain a healthy diet and exercise routine
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <FaNotesMedical className="h-3 w-3 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-700">
                    Keep track of symptoms and health changes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
          <div className="flex items-start space-x-4">
            <div className="p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-lg">
              <MdEmergency className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Emergency Information
                <FaAmbulance className="h-5 w-5 text-red-600" />
              </h3>
              <div className="space-y-3">
                <a href="tel:108" className="flex items-center space-x-3 p-3 bg-red-100 rounded-lg hover:bg-red-200 transition-colors">
                  <FaAmbulance className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-bold text-red-800">Ambulance</p>
                    <p className="text-sm text-red-700 font-mono">108</p>
                  </div>
                </a>
                <a href="tel:100" className="flex items-center space-x-3 p-3 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                  <FiPhone className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-bold text-blue-800">Police</p>
                    <p className="text-sm text-blue-700 font-mono">100</p>
                  </div>
                </a>
                <a href="tel:104" className="flex items-center space-x-3 p-3 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                  <MdLocalHospital className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-bold text-green-800">Health Helpline</p>
                    <p className="text-sm text-green-700 font-mono">104</p>
                  </div>
                </a>
                <a href="tel:1091" className="flex items-center space-x-3 p-3 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors">
                  <MdEmergency className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-bold text-purple-800">Women Helpline</p>
                    <p className="text-sm text-purple-700 font-mono">1091</p>
                  </div>
                </a>
                <div className="mt-4">
                  <Button
                    onClick={() => router.push("/patient/emergency")}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                  >
                    <MdEmergency className="mr-2 h-4 w-4" />
                    Emergency Medical Info
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Emergency Numbers ─────────────────────────────────────────────── */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-red-700 font-semibold text-sm sm:text-base">
          <span className="flex items-center gap-2">
            🚑 <span>Ambulance: <strong>108</strong></span>
          </span>
          <span className="hidden sm:block text-red-300">|</span>
          <span className="flex items-center gap-2">
            🚔 <span>Police: <strong>100</strong></span>
          </span>
          <span className="hidden sm:block text-red-300">|</span>
          <span className="flex items-center gap-2">
            📞 <span>Health Helpline: <strong>104</strong></span>
          </span>
          <span className="hidden sm:block text-red-300">|</span>
          <span className="flex items-center gap-2">
            🆘 <span>Women Helpline: <strong>1091</strong></span>
          </span>
        </div>
      </div>

      {/* Medical Platform Features */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MdBiotech className="h-6 w-6 text-indigo-600" />
          Your Healthcare Platform Features
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FaStethoscope, name: "Consultations", color: "blue" },
            {
              icon: FaPrescriptionBottleAlt,
              name: "Prescriptions",
              color: "emerald",
            },
            { icon: MdLocalPharmacy, name: "Pharmacy", color: "purple" },
            { icon: FaNotesMedical, name: "Medical Records", color: "teal" },
            { icon: MdMonitorHeart, name: "Health Monitoring", color: "pink" },
            { icon: MdVaccines, name: "Immunizations", color: "orange" },
            { icon: FaXRay, name: "Lab Results", color: "cyan" },
            { icon: MdSecurity, name: "Data Security", color: "indigo" },
          ].map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col items-center p-4 bg-white rounded-xl border border-${feature.color}-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}
            >
              <div
                className={`p-3 bg-gradient-to-r from-${feature.color}-100 to-${feature.color}-200 rounded-lg mb-2`}
              >
                <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
              </div>
              <span className={`text-xs font-medium text-${feature.color}-700`}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm flex items-center justify-center gap-2">
            <MdHealthAndSafety className="h-4 w-4" />
            All services are HIPAA compliant and blockchain secured
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PatientDashboard;

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FiUser,
  FiSearch,
  FiFilter,
  FiEye,
  FiCheck,
  FiX,
  FiArrowLeft,
  FiMoreVertical,
  FiShield,
  FiClock,
  FiActivity,
  FiTrendingUp,
  FiUsers,
  FiRefreshCw,
  FiDownload,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
  FiHeart,
  FiDatabase,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdVerifiedUser,
  MdPendingActions,
  MdMedicalServices,
  MdAdminPanelSettings,
  MdHealthAndSafety,
  MdSecurity,
  MdBiotech,
  MdPersonalInjury,
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
  FaXRay,
  FaThermometerHalf,
  FaBrain,
  FaEye,
  FaTooth,
  FaBone,
  FaLungs,
  FaUserShield,
  FaCertificate,
} from "react-icons/fa";

import { Card, Button, Input, Select, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import { truncateAddress } from "../../utils/helpers";
import toast from "react-hot-toast";

const DoctorDetailsModal = ({
  isOpen,
  onClose,
  doctor,
  onApprove,
  onReject,
  loading,
}) => {
  // doctorData is sourced directly from the REST API doctor object
  const doctorData = doctor;
  const fetchingData = false;

  if (!isOpen) return null;

  const isApproved = doctor?.status === "approved";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-gradient-to-br from-white to-blue-50 rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border-2 border-blue-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-lg">
                <FaUserMd className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Doctor Details
                  <MdHealthAndSafety className="h-6 w-6 text-teal-600" />
                </h3>
                <p className="text-gray-600">ID: #{doctor?.id}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={onClose}
              className="border-2 border-gray-300 hover:bg-gray-50 shadow-md"
            >
              <FiX className="h-5 w-5" />
            </Button>
          </div>

          {fetchingData ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-gray-200">
              <div className="p-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full w-fit mx-auto mb-6 shadow-lg">
                <LoadingSpinner size="large" />
              </div>
              <p className="text-gray-700 font-medium text-lg">
                Loading doctor details...
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Fetching professional information
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enhanced Basic Information */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg">
                        <FaUserMd className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        Basic Information
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Full Name:
                        </span>
                        <span className="font-bold text-gray-900">
                          {doctorData?.fullName || doctorData?.name || doctor?.fullName || doctor?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Doctor ID:
                        </span>
                        <span className="font-bold text-teal-600">
                          #{doctor?.id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Wallet Address:
                        </span>
                        <span className="font-mono text-sm font-bold text-gray-900">
                          {truncateAddress(doctor?.accountAddress)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Status:
                        </span>
                        <Badge
                          className={`border-none shadow-md ${
                            isApproved
                              ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                              : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                          }`}
                        >
                          {isApproved ? (
                            <>
                              <MdVerifiedUser className="w-3 h-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            <>
                              <FiClock className="w-3 h-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Specialization:
                        </span>
                        <span className="font-bold text-blue-600">
                          {doctorData?.specialization || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Degree:
                        </span>
                        <span className="font-bold text-indigo-600">
                          {doctorData?.degree || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Experience:
                        </span>
                        <span className="font-bold text-purple-600">
                          {doctorData?.experience || doctorData?.experienceYears
                            ? `${doctorData.experience || doctorData.experienceYears} years`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Consultation Fee:
                        </span>
                        <span className="font-bold text-green-600">
                          {doctorData?.consultationFee
                            ? `₹${Number(doctorData.consultationFee).toLocaleString("en-IN")}`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                        <FiMail className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        Contact Information
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Email:
                        </span>
                        <span className="font-bold text-gray-900">
                          {doctorData?.email || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Phone:
                        </span>
                        <span className="font-bold text-gray-900">
                          {doctorData?.phone || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Clinic / Hospital:
                        </span>
                        <span className="font-bold text-gray-900">
                          {doctorData?.clinicName || doctorData?.hospitalName || "N/A"}
                        </span>
                      </div>
                      {(doctorData?.clinicCity || doctorData?.clinicAddress) && (
                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200 shadow-sm">
                          <span className="text-gray-600 font-medium">
                            Clinic Address:
                          </span>
                          <span className="font-bold text-gray-900 text-right">
                            {[doctorData.clinicAddress, doctorData.clinicCity, doctorData.clinicState]
                              .filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200 shadow-sm">
                        <span className="text-gray-600 font-medium">
                          Reg. No.:
                        </span>
                        <span className="font-bold text-gray-900">
                          {doctorData?.medicalCouncilRegNo || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Enhanced Professional Information */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                        <FiTrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        Professional Stats
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center mb-6">
                      <div className="p-6 bg-white rounded-2xl border-2 border-emerald-200 shadow-lg">
                        <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl w-fit mx-auto mb-3">
                          <FiActivity className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-blue-600 mb-1">
                          {Number(doctor?.appointmentCount) || 0}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Total Consultations
                        </p>
                      </div>
                      <div className="p-6 bg-white rounded-2xl border-2 border-emerald-200 shadow-lg">
                        <div className="p-3 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl w-fit mx-auto mb-3">
                          <FiCheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <p className="text-3xl font-bold text-emerald-600 mb-1">
                          {Number(doctor?.successfulTreatmentCount) || 0}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Successful Treatments
                        </p>
                      </div>
                    </div>
                    <div className="text-center p-6 bg-white rounded-2xl border-2 border-emerald-200 shadow-lg">
                      <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl w-fit mx-auto mb-3">
                        <FiStar className="h-6 w-6 text-purple-600" />
                      </div>
                      <p className="text-3xl font-bold text-purple-600 mb-1">
                        {doctor?.appointmentCount > 0
                          ? Math.round(
                              (Number(doctor.successfulTreatmentCount) /
                                Number(doctor.appointmentCount)) *
                                100
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Success Rate
                      </p>
                    </div>
                  </div>
                </Card>

                {doctorData?.qualifications &&
                  doctorData.qualifications.length > 0 && (
                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
                      <div className="p-6">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                            <FaCertificate className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="text-xl font-bold text-gray-900">
                            Qualifications
                          </h4>
                        </div>
                        <div className="space-y-4">
                          {doctorData.qualifications.map((qual, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-br from-white to-purple-50 p-4 rounded-2xl border-2 border-purple-200 shadow-lg"
                            >
                              <div className="font-bold text-gray-900 text-lg mb-1">
                                {qual.degree}
                              </div>
                              <div className="text-sm text-purple-700 font-medium mb-1">
                                {qual.institution}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <FiCalendar className="h-3 w-3" />
                                {qual.year}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}

                {doctorData?.bio && (
                  <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 shadow-xl">
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-lg">
                          <FaNotesMedical className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                          Professional Bio
                        </h4>
                      </div>
                      <div className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-sm">
                        <p className="text-gray-700 leading-relaxed">
                          {doctorData.bio}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-2 border-gray-300 hover:bg-gray-50 shadow-md"
            >
              Close
            </Button>
            {!isApproved && (
              <>
                <Button
                  onClick={() => onReject(doctor.id)}
                  loading={loading}
                  disabled={loading}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg"
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => onApprove(doctor.id)}
                  loading={loading}
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg"
                >
                  <FiCheck className="h-4 w-4 mr-2" />
                  Approve Doctor
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DoctorCard = ({
  doctor,
  onViewDetails,
  onApprove,
  onReject,
  loading,
}) => {
  // doctorData is sourced directly from the REST API doctor object
  const doctorData = doctor;
  const fetchingData = false;

  const doctorName = doctorData?.fullName || doctorData?.name || doctor.fullName || doctor.name;
  const isApproved = doctor.status === "approved";
  const successRate =
    doctor.appointmentCount > 0
      ? Math.round(
          (Number(doctor.successfulTreatmentCount) /
            Number(doctor.appointmentCount)) *
            100
        )
      : 0;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      <div className="p-8">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-r from-teal-500 to-cyan-500 overflow-hidden">
            {(doctorData?.profileImage || doctorData?.profilePhoto) ? (
              <img
                src={doctorData.profileImage || doctorData.profilePhoto}
                alt={`Dr. ${doctorName || "Doctor"}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <FaUserMd className="h-10 w-10 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MdHealthAndSafety className="h-5 w-5 text-teal-600" />
                  Dr. {doctorName || `Doctor #${doctor.id}`}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <MdSecurity className="h-3 w-3" />
                  ID: #{doctor.id}{doctor.email ? ` • ${doctor.email}` : ''}
                </p>
              </div>
              <Badge
                className={`text-xs border-none shadow-md ${
                  isApproved
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                    : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                }`}
              >
                {isApproved ? (
                  <>
                    <MdVerifiedUser className="w-3 h-3 mr-1" />
                    Approved
                  </>
                ) : (
                  <>
                    <MdPendingActions className="w-3 h-3 mr-1" />
                    Pending
                  </>
                )}
              </Badge>
            </div>

            {/* Specialization & Degree */}
            <div className="bg-white rounded-xl p-3 border-2 border-blue-100 shadow-sm mb-3">
              <div className="flex flex-wrap items-center gap-2">
                {doctorData?.specialization && (
                  <p className="text-sm font-bold text-blue-600 flex items-center gap-1">
                    <MdMedicalServices className="h-4 w-4" />
                    {doctorData.specialization}
                  </p>
                )}
                {doctorData?.degree && (
                  <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
                    {doctorData.degree}
                  </span>
                )}
              </div>
            </div>

            {/* Clinic / Hospital */}
            {(doctorData?.clinicName || doctorData?.hospitalName) && (
              <div className="bg-white rounded-xl px-3 py-2 border-2 border-teal-100 shadow-sm mb-3 flex items-center gap-2">
                <MdLocalHospital className="h-4 w-4 text-teal-500 flex-shrink-0" />
                <p className="text-xs font-medium text-gray-700 truncate">
                  {doctorData.clinicName || doctorData.hospitalName}
                </p>
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 text-center mb-4 bg-white rounded-xl p-4 border-2 border-blue-100 shadow-sm">
              <div className="p-2">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl w-fit mx-auto mb-2">
                  <FiActivity className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {Number(doctor.appointmentCount)}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Consults
                </p>
              </div>
              <div className="p-2">
                <div className="p-2 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl w-fit mx-auto mb-2">
                  <FiStar className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-emerald-600">
                  {successRate}%
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Success
                </p>
              </div>
              <div className="p-2">
                <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl w-fit mx-auto mb-2">
                  <FiClock className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-lg font-bold text-purple-600">
                  {doctorData?.experience || doctorData?.experienceYears || "N/A"}
                </p>
                <p className="text-xs text-gray-500 font-medium">Yrs Exp.</p>
              </div>
              <div className="p-2">
                <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl w-fit mx-auto mb-2">
                  <FiDatabase className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm font-bold text-green-600">
                  {doctorData?.consultationFee ? `₹${Number(doctorData.consultationFee).toLocaleString("en-IN")}` : "N/A"}
                </p>
                <p className="text-xs text-gray-500 font-medium">Fee</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-3">
                {doctorData?.email && (
                  <Button
                    variant="outline"
                    size="small"
                    className="border-2 border-blue-300 hover:bg-blue-50 shadow-sm"
                  >
                    <FiMail className="h-3 w-3" />
                  </Button>
                )}
                {doctorData?.phone && (
                  <Button
                    variant="outline"
                    size="small"
                    className="border-2 border-emerald-300 hover:bg-emerald-50 shadow-sm"
                  >
                    <FiPhone className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => onViewDetails(doctor)}
                  className="border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 shadow-md"
                >
                  <FiEye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {!isApproved && (
                  <Button
                    size="small"
                    onClick={() => onApprove(doctor.id)}
                    loading={loading}
                    disabled={loading}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg"
                  >
                    <FiCheck className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const AdminDoctorsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get("/admin/doctors");
        const allDoctors = data.data || data.doctors || [];
        setDoctors(allDoctors);
        setFilteredDoctors(allDoctors);
        setAdminData({ address: "admin" });
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast.error("Failed to load doctors data");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Filter and sort doctors
  useEffect(() => {
    let filtered = doctors;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((doctor) => {
        const searchLower = searchTerm.toLowerCase();
        const name = (doctor.fullName || doctor.name || '').toLowerCase();
        return (
          doctor.id.toString().includes(searchLower) ||
          name.includes(searchLower) ||
          (doctor.email || '').toLowerCase().includes(searchLower) ||
          (doctor.specialization || '').toLowerCase().includes(searchLower) ||
          (doctor.accountAddress || '').toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((doctor) => {
        switch (statusFilter) {
          case "approved":
            return doctor.status === "approved";
          case "pending":
            return doctor.status !== "approved";
          default:
            return true;
        }
      });
    }

    // Sort doctors
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.fullName || a.name || "").localeCompare(b.fullName || b.name || "");
        case "id":
          return Number(a.id) - Number(b.id);
        case "consultations":
          return Number(b.appointmentCount) - Number(a.appointmentCount);
        case "success_rate":
          const aRate =
            a.appointmentCount > 0
              ? Number(a.successfulTreatmentCount) / Number(a.appointmentCount)
              : 0;
          const bRate =
            b.appointmentCount > 0
              ? Number(b.successfulTreatmentCount) / Number(b.appointmentCount)
              : 0;
          return bRate - aRate;
        case "recent":
        default:
          return Number(b.id) - Number(a.id);
      }
    });

    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, statusFilter, sortBy]);

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setDetailsModal(true);
  };

  const handleApproveDoctor = async (doctorId) => {
    try {
      setActionLoading(true);
      await apiClient.put(`/admin/doctors/${doctorId}/verify`, { action: "approve" });

      // Update local state
      setDoctors((prev) =>
        prev.map((doc) =>
          doc.id === doctorId ? { ...doc, status: "approved" } : doc
        )
      );

      toast.success("Doctor approved successfully!");
    } catch (error) {
      console.error("Error approving doctor:", error);
      toast.error("Failed to approve doctor");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDoctor = async (doctorId, reason) => {
    try {
      setActionLoading(true);
      await apiClient.put(`/admin/doctors/${doctorId}/verify`, {
        action: "reject",
        reason: reason || "Does not meet requirements",
      });

      // Update local state
      setDoctors((prev) =>
        prev.map((doc) =>
          doc.id === doctorId ? { ...doc, status: "rejected" } : doc
        )
      );

      toast.success("Doctor rejected.");
    } catch (error) {
      console.error("Error rejecting doctor:", error);
      toast.error("Failed to reject doctor");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const { data } = await apiClient.get("/admin/doctors");
      const allDoctors = data.data || data.doctors || [];
      setDoctors(allDoctors);
      toast.success("Doctors list refreshed");
    } catch (error) {
      console.error("Error refreshing doctors:", error);
      toast.error("Failed to refresh doctors");
    } finally {
      setRefreshing(false);
    }
  };

  const exportDoctorsData = () => {
    const exportData = filteredDoctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      accountAddress: doctor.accountAddress,
      status: doctor.status === "approved" ? "Approved" : "Pending",
      appointmentCount: Number(doctor.appointmentCount),
      successfulTreatmentCount: Number(doctor.successfulTreatmentCount),
      successRate:
        doctor.appointmentCount > 0
          ? Math.round(
              (Number(doctor.successfulTreatmentCount) /
                Number(doctor.appointmentCount)) *
                100
            )
          : 0,
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `doctors-list-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Doctors data exported successfully!");
  };

  const pendingCount = doctors.filter((d) => d.status !== "approved").length;
  const approvedCount = doctors.filter((d) => d.status === "approved").length;
  const totalConsultations = doctors.reduce(
    (sum, d) => sum + Number(d.appointmentCount),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="p-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-2xl">
              <FaUserMd className="h-16 w-16 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-300 rounded-full animate-ping"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-300 rounded-full animate-ping animation-delay-1000"></div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-6 text-gray-700 font-bold text-lg">
            Loading Doctors Management...
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Accessing medical professionals database
          </p>
        </div>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 shadow-2xl">
          <div className="text-center py-12">
            <div className="relative mb-8">
              <div className="p-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full w-fit mx-auto shadow-2xl">
                <FaUserShield className="h-16 w-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <FiAlertCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <MdSecurity className="h-6 w-6 text-red-600" />
              Admin Access Required
            </h3>
            <p className="text-gray-600 leading-relaxed mb-8">
              You need administrator privileges to access the doctors management
              system. Only authorized admins can review and approve medical
              professionals.
            </p>
            <div className="space-y-4">
              <Button onClick={() => router.push("/admin/login")}>
                Go to Admin Login
              </Button>
              <div className="flex items-center justify-center space-x-2 text-sm text-red-600">
                <FiShield className="h-4 w-4" />
                <span>Secure Admin Authentication Required</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 relative">
      {/* Medical Background Elements */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <FaUserMd className="absolute top-20 right-20 h-32 w-32 text-indigo-600 animate-pulse" />
        <FaStethoscope className="absolute bottom-20 left-20 h-24 w-24 text-purple-600" />
        <MdVerifiedUser className="absolute top-1/2 left-1/4 h-28 w-28 text-blue-600 animate-pulse animation-delay-2000" />
      </div>

      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 rounded-2xl p-8 text-white shadow-2xl border-2 border-indigo-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-12 translate-y-12"></div>

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-6">
            <Button
              variant="outline"
              size="small"
              onClick={() => router.push("/admin/dashboard")}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-opacity-30 backdrop-blur-sm shadow-lg"
            >
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Button>
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm border border-white border-opacity-30 shadow-lg">
                <FaUserMd className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  Doctors Management
                  <MdHealthAndSafety className="h-8 w-8" />
                </h1>
                <p className="text-indigo-100 text-lg flex items-center gap-2">
                  <MdAdminPanelSettings className="h-4 w-4" />
                  Manage medical professional registrations and approvals
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              loading={refreshing}
              disabled={refreshing}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-opacity-30 backdrop-blur-sm shadow-lg"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={exportDoctorsData}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-opacity-30 backdrop-blur-sm shadow-lg"
            >
              <FiDownload className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Enhanced Admin Info */}
        <Card className="bg-white bg-opacity-10 border-white border-opacity-20 backdrop-blur-sm shadow-lg relative z-10">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-2xl shadow-lg">
                <MdAdminPanelSettings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <MdSecurity className="h-5 w-5" />
                  Admin Panel - Doctors Management
                </h3>
                <p className="text-purple-100 font-medium">
                  Logged in as Admin • Total Doctors: {doctors.length}
                </p>
              </div>
              <div className="ml-auto">
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none shadow-md">
                  <MdVerifiedUser className="w-4 h-4 mr-1" />
                  Admin Access
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-center p-8">
            <div className="p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl w-fit mx-auto mb-4 shadow-lg">
              <FaUserMd className="h-10 w-10 text-white" />
            </div>
            <p className="text-3xl font-bold text-teal-600 mb-2">
              {doctors.length}
            </p>
            <p className="text-sm text-gray-600 font-medium">Total Doctors</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-center p-8">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl w-fit mx-auto mb-4 shadow-lg">
              <MdVerifiedUser className="h-10 w-10 text-white" />
            </div>
            <p className="text-3xl font-bold text-emerald-600 mb-2">
              {approvedCount}
            </p>
            <p className="text-sm text-gray-600 font-medium">Approved</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-center p-8">
            <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl w-fit mx-auto mb-4 shadow-lg">
              <MdPendingActions className="h-10 w-10 text-white" />
            </div>
            <p className="text-3xl font-bold text-yellow-600 mb-2">
              {pendingCount}
            </p>
            <p className="text-sm text-gray-600 font-medium">
              Pending Approval
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="text-center p-8">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl w-fit mx-auto mb-4 shadow-lg">
              <FiActivity className="h-10 w-10 text-white" />
            </div>
            <p className="text-3xl font-bold text-purple-600 mb-2">
              {totalConsultations}
            </p>
            <p className="text-sm text-gray-600 font-medium">
              Total Consultations
            </p>
          </div>
        </Card>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
        <div className="p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
              <FiSearch className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Search & Filter Doctors
              </h2>
              <p className="text-gray-600">
                Find and manage medical professional registrations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FiSearch className="h-4 w-4" />
                Search Doctors
              </label>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by ID, name, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FiFilter className="h-4 w-4" />
                Filter by Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-md"
              >
                <option value="all">All Doctors</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Approval</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FiTrendingUp className="h-4 w-4" />
                Sort by
              </label>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-md"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="id">Doctor ID</option>
                <option value="consultations">Consultations</option>
                <option value="success_rate">Success Rate</option>
              </Select>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl p-4 border-2 border-blue-100 shadow-sm">
            <div className="flex items-center justify-between text-sm text-blue-700">
              <p className="flex items-center gap-2">
                <FaUserMd className="h-4 w-4" />
                <strong>Showing:</strong> {filteredDoctors.length} of{" "}
                {doctors.length} doctors
              </p>
              <div className="flex items-center space-x-6">
                <span className="flex items-center gap-2">
                  <FiClock className="h-4 w-4 text-yellow-600" />
                  <strong>Pending:</strong>{" "}
                  {
                    filteredDoctors.filter((d) => d.status !== "approved")
                      .length
                  }
                </span>
                <span className="flex items-center gap-2">
                  <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                  <strong>Approved:</strong>{" "}
                  {
                    filteredDoctors.filter((d) => d.status === "approved")
                      .length
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Doctors List */}
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onViewDetails={handleViewDetails}
              onApprove={handleApproveDoctor}
              onReject={handleRejectDoctor}
              loading={actionLoading}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200">
          <div className="p-6 bg-gradient-to-r from-gray-400 to-blue-400 rounded-full w-fit mx-auto mb-6 shadow-lg">
            <FaUserMd className="h-16 w-16 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {searchTerm || statusFilter !== "all"
              ? "No Doctors Found"
              : "No Doctors Registered"}
          </h3>
          <p className="text-gray-600 max-w-lg mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search criteria or filters to find the doctors you're looking for."
              : "There are currently no registered medical professionals in the system. Doctors will appear here once they register."}
          </p>
        </Card>
      )}

      {/* Enhanced Pending Approvals Alert */}
      {pendingCount > 0 && (
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-l-8 border-yellow-400 border-2 border-yellow-200 shadow-xl">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                <MdPendingActions className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">
                  Pending Doctor Approvals
                </h3>
                <p className="text-yellow-700 leading-relaxed">
                  You have {pendingCount} medical professional
                  {pendingCount > 1 ? "s" : ""} waiting for approval. Review
                  their credentials and approve qualified doctors to expand your
                  healthcare network.
                </p>
              </div>
              <Button
                size="small"
                onClick={() => setStatusFilter("pending")}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg"
              >
                <FiEye className="h-4 w-4 mr-2" />
                Review Pending
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Doctor Details Modal */}
      <DoctorDetailsModal
        isOpen={detailsModal}
        onClose={() => {
          setDetailsModal(false);
          setSelectedDoctor(null);
        }}
        doctor={selectedDoctor}
        onApprove={handleApproveDoctor}
        onReject={handleRejectDoctor}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminDoctorsManagement;

import { useState, useEffect } from "react";

import { useRouter } from "next/router";
import {
  FiActivity,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiStar,
  FiMapPin,
  FiClock,
  FiInfo,
  FiEye,
  FiUserCheck,
  FiAward,
  FiHeart,
  FiShield,
  FiPhone,
  FiMail,
  FiGlobe,
} from "react-icons/fi";
import {
  MdVerifiedUser,
  MdLocalHospital,
  MdMedicalServices,
  MdHealthAndSafety,
  MdBiotech,
  MdSecurity,
  MdPersonalInjury,
  MdEmergency,
  MdFavorite,
  MdStars,
  MdSchool,
  MdWorkHistory,
  MdContactPhone,
  MdEmail,
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
import { useHealthcareContract } from "../../hooks/useFabricAPI";
import { useAuth } from "../../context/AuthContext";
import ipfsService from "../../utils/ipfs";
import { formatDate, truncateAddress } from "../../utils/helpers";
import toast from "react-hot-toast";

const getSpecializationIconFn = (specialization) => {
  const spec = specialization?.toLowerCase() || "";
  const icons = {
    cardiology: FaHeartbeat,
    neurology: FaBrain,
    orthopedics: FaBone,
    pediatrics: FaHospitalUser,
    surgery: FaAmbulance,
    radiology: FaXRay,
    general: FaStethoscope,
    ophthalmology: FaEye,
    dentistry: FaTooth,
    pulmonology: FaLungs,
    psychiatry: FaBrain,
  };
  return icons[spec] || FaUserMd;
};

const DoctorCard = ({
  doctor,
  onViewProfile,
  onBookAppointment,
  isPatient,
}) => {
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If the doctor object already has inline profile data (from devDataStore),
    // use it directly without any IPFS fetch.
    if (doctor.name || doctor.fullName) {
      setDoctorData({
        name: doctor.fullName || doctor.name || '',
        specialization: doctor.specialization || '',
        experience: doctor.experienceYears ?? doctor.experience ?? null,
        qualification: doctor.degree || '',
        consultationFee: doctor.consultationFee ?? null,
        bio: doctor.bio || '',
        phone: doctor.phone || '',
        email: doctor.email || '',
        hospitalAffiliation: doctor.clinicName || '',
        languages: Array.isArray(doctor.languagesSpoken)
          ? doctor.languagesSpoken.join(', ')
          : (doctor.languagesSpoken || ''),
        availableHours: '9:00 AM – 5:00 PM',
      });
      return;
    }
    // Fall back to IPFS if URL is present
    const fetchDoctorData = async () => {
      if (doctor.IPFS_URL) {
        try {
          setLoading(true);
          const hash = doctor.IPFS_URL.replace(
            "https://gateway.pinata.cloud/ipfs/",
            ""
          );
          const data = await ipfsService.fetchFromIPFS(hash);
          setDoctorData(data);
        } catch (error) {
          console.error("Error fetching doctor data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDoctorData();
  }, [doctor.IPFS_URL, doctor.name, doctor.fullName]);

  const getSuccessRate = () => {
    if (!doctor.appointmentCount || doctor.appointmentCount === 0) return 0;
    return Math.round(
      (Number(doctor.successfulTreatmentCount) /
        Number(doctor.appointmentCount)) *
        100
    );
  };

  const getExperienceLevel = () => {
    const yr = Number(doctorData?.experience || doctorData?.experienceYears || 0);
    if (yr >= 15) return "Expert";
    if (yr >= 8) return "Experienced";
    if (yr >= 3) return "Intermediate";
    return "New";
  };

  const getExperienceColor = () => {
    const level = getExperienceLevel();
    switch (level) {
      case "Expert":
        return "text-purple-600 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200";
      case "Experienced":
        return "text-blue-600 bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-200";
      case "Intermediate":
        return "text-green-600 bg-gradient-to-r from-green-100 to-emerald-100 border-green-200";
      default:
        return "text-gray-600 bg-gradient-to-r from-gray-100 to-slate-100 border-gray-200";
    }
  };

  const SpecializationIcon = getSpecializationIconFn(doctorData?.specialization);

  if (loading) {
    return (
      <Card className="p-8 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200">
        <div className="flex flex-col items-center justify-center h-48">
          <div className="p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-lg mb-4">
            <FaUserMd className="h-8 w-8 text-white animate-pulse" />
          </div>
          <LoadingSpinner size="medium" />
          <p className="text-gray-600 mt-2">Loading doctor profile...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-teal-300 overflow-hidden transform hover:-translate-y-1 bg-gradient-to-br from-white to-teal-25">
      <div className="relative">
        {/* Enhanced Doctor Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white relative overflow-hidden">
          {/* Medical Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <FaStethoscope className="absolute top-2 right-4 h-12 w-12 animate-pulse" />
            <FaHeartbeat className="absolute bottom-2 left-4 h-8 w-8" />
          </div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-4 border-white border-opacity-30 shadow-lg">
                  {doctorData?.profileImage ? (
                    <img
                      src={ipfsService.getIPFSUrl(doctorData.profileImage)}
                      alt={`Dr. ${doctorData?.name || "Doctor"}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <FaUserMd className="h-10 w-10 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                  <MdVerifiedUser className="h-3 w-3 text-emerald-700" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">
                  Dr. {doctorData?.name || `Doctor #${doctor.id}`}
                </h3>
                {doctorData?.specialization && (
                  <div className="flex items-center space-x-2 mb-2">
                    <SpecializationIcon className="h-4 w-4 text-teal-200" />
                    <p className="text-teal-100 capitalize font-medium">
                      {doctorData.specialization} Specialist
                    </p>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  {doctor.isApproved ? (
                    <Badge className="text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none shadow-lg">
                      <MdVerifiedUser className="w-3 h-3 mr-1" />
                      Board Certified
                    </Badge>
                  ) : (
                    <Badge className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none shadow-lg">
                      <MdSecurity className="w-3 h-3 mr-1" />
                      Under Review
                    </Badge>
                  )}
                  <Badge className={`text-xs border ${getExperienceColor()}`}>
                    <MdStars className="w-3 h-3 mr-1" />
                    {getExperienceLevel()}
                  </Badge>
                </div>
              </div>
            </div>
            <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors transform hover:scale-110">
              <FiHeart className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Enhanced Doctor Info */}
        <div className="p-6">
          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg w-fit mx-auto mb-2">
                <FaStethoscope className="h-4 w-4 text-white" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {Number(doctor.appointmentCount)}
              </div>
              <div className="text-xs text-blue-800 font-medium">
                Consultations
              </div>
            </div>
            <div className="text-center bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg w-fit mx-auto mb-2">
                <FaHeartbeat className="h-4 w-4 text-white" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {getSuccessRate()}%
              </div>
              <div className="text-xs text-emerald-800 font-medium">
                Success Rate
              </div>
            </div>
            <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg w-fit mx-auto mb-2">
                <MdFavorite className="h-4 w-4 text-white" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {Number(doctor.successfulTreatmentCount)}
              </div>
              <div className="text-xs text-purple-800 font-medium">
                Treatments
              </div>
            </div>
          </div>

          {/* Enhanced Doctor Details */}
          <div className="space-y-3 mb-6">
            {doctorData?.experience && (
              <div className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg mr-3">
                  <MdWorkHistory className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-orange-800">
                    {doctorData.experience} years
                  </span>
                  <p className="text-xs text-orange-600">Medical Experience</p>
                </div>
              </div>
            )}

            {doctorData?.qualification && (
              <div className="flex items-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg mr-3">
                  <MdSchool className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-indigo-800">
                    {doctorData.qualification}
                  </span>
                  <p className="text-xs text-indigo-600">Medical Degree</p>
                </div>
              </div>
            )}

            {doctorData?.hospitalAffiliation && (
              <div className="flex items-center p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg mr-3">
                  <MdLocalHospital className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-teal-800">
                    {doctorData.hospitalAffiliation}
                  </span>
                  <p className="text-xs text-teal-600">Hospital Affiliation</p>
                </div>
              </div>
            )}

            {doctorData?.availableHours && (
              <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
                  <FiClock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-green-800">
                    {doctorData.availableHours}
                  </span>
                  <p className="text-xs text-green-600">Available Hours</p>
                </div>
              </div>
            )}

            {doctorData?.consultationFee && (
              <div className="flex items-center p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg mr-3">
                  <FiDollarSign className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-pink-800">
                    ₹{doctorData.consultationFee}
                  </span>
                  <p className="text-xs text-pink-600">Consultation Fee</p>
                </div>
              </div>
            )}

            <div className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
              <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg mr-3">
                <MdBiotech className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-800 font-mono">
                  {truncateAddress(doctor.accountAddress)}
                </span>
                <p className="text-xs text-gray-600">Blockchain Address</p>
              </div>
            </div>
          </div>

          {/* Enhanced About */}
          {doctorData?.about && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FaNotesMedical className="h-4 w-4 text-blue-600" />
                Medical Philosophy
              </h4>
              <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                {doctorData.about}
              </p>
            </div>
          )}

          {/* Enhanced Languages */}
          {doctorData?.languages && (
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FiGlobe className="h-4 w-4 text-teal-600" />
                Languages Spoken
              </h4>
              <div className="flex flex-wrap gap-2">
                {doctorData.languages.split(",").map((lang, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 rounded-full border border-teal-200 font-medium"
                  >
                    {lang.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="small"
              onClick={() => onViewProfile(doctor)}
              className="flex-1 border-2 border-teal-300 text-teal-700 hover:bg-teal-50 transition-all duration-200"
            >
              <FiEye className="h-4 w-4 mr-2" />
              View Profile
            </Button>
            {isPatient && doctor.isApproved && (
              <Button
                size="small"
                onClick={() => onBookAppointment(doctor)}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white transition-all duration-200 transform hover:scale-105"
              >
                <FiCalendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const DoctorProfileModal = ({ doctor, isOpen, onClose }) => {
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !doctor) return;

    // Prefer inline data (from devDataStore API)
    if (doctor.name || doctor.fullName) {
      setDoctorData({
        name: doctor.fullName || doctor.name || '',
        specialization: doctor.specialization || '',
        experience: doctor.experienceYears ?? doctor.experience ?? null,
        qualification: doctor.degree || '',
        consultationFee: doctor.consultationFee ?? null,
        bio: doctor.bio || '',
        phone: doctor.phone || '',
        email: doctor.email || '',
        hospitalAffiliation: doctor.clinicName || '',
        languages: Array.isArray(doctor.languagesSpoken)
          ? doctor.languagesSpoken.join(', ')
          : (doctor.languagesSpoken || ''),
        availableHours: '9:00 AM – 5:00 PM',
      });
      return;
    }

    // Fall back to IPFS
    const fetchDoctorData = async () => {
      if (doctor?.IPFS_URL) {
        try {
          setLoading(true);
          const hash = doctor.IPFS_URL.replace(
            "https://gateway.pinata.cloud/ipfs/",
            ""
          );
          const data = await ipfsService.fetchFromIPFS(hash);
          setDoctorData(data);
        } catch (error) {
          console.error("Error fetching doctor data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDoctorData();
  }, [doctor?.IPFS_URL, doctor?.name, doctor?.fullName, isOpen]);

  if (!doctor) return null;

  const SpecializationIcon = getSpecializationIconFn(doctorData?.specialization);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doctor Profile"
      size="large"
    >
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
              <FaUserMd className="h-12 w-12 text-white animate-pulse" />
            </div>
            <LoadingSpinner size="large" />
            <p className="text-gray-600 mt-4">Loading doctor profile...</p>
          </div>
        ) : (
          <>
            {/* Enhanced Doctor Header */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-200">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-28 h-28 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center border-4 border-teal-200 shadow-lg">
                    {doctorData?.profileImage ? (
                      <img
                        src={ipfsService.getIPFSUrl(doctorData.profileImage)}
                        alt={`Dr. ${doctorData?.name || "Doctor"}`}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <FaUserMd className="h-14 w-14 text-teal-600" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                    <MdVerifiedUser className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Dr. {doctorData?.name || `Doctor #${doctor.id}`}
                  </h2>
                  {doctorData?.specialization && (
                    <div className="flex items-center space-x-2 mb-3">
                      <SpecializationIcon className="h-5 w-5 text-teal-600" />
                      <p className="text-lg text-teal-700 capitalize font-medium">
                        {doctorData.specialization} Specialist
                      </p>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    {doctor.isApproved ? (
                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2">
                        <MdVerifiedUser className="w-4 h-4 mr-1" />
                        Board Certified Doctor
                      </Badge>
                    ) : (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2">
                        <MdSecurity className="w-4 h-4 mr-1" />
                        Under Medical Review
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
                  <FaStethoscope className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {Number(doctor.appointmentCount)}
                </div>
                <div className="text-sm text-blue-800 font-medium">
                  Total Consultations
                </div>
              </Card>
              <Card className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
                  <MdFavorite className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {Number(doctor.successfulTreatmentCount)}
                </div>
                <div className="text-sm text-emerald-800 font-medium">
                  Successful Treatments
                </div>
              </Card>
              <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
                  <MdStars className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {doctor.appointmentCount > 0
                    ? Math.round(
                        (Number(doctor.successfulTreatmentCount) /
                          Number(doctor.appointmentCount)) *
                          100
                      )
                    : 0}
                  %
                </div>
                <div className="text-sm text-purple-800 font-medium">
                  Success Rate
                </div>
              </Card>
              <Card className="text-center p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
                  <MdWorkHistory className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {doctorData?.experience || "N/A"}
                </div>
                <div className="text-sm text-orange-800 font-medium">
                  Years Experience
                </div>
              </Card>
            </div>

            {/* Enhanced Detailed Information */}
            {doctorData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MdMedicalServices className="h-5 w-5 text-indigo-600" />
                    Professional Credentials
                  </h3>
                  <div className="space-y-4">
                    {doctorData.qualification && (
                      <div>
                        <p className="text-sm font-bold text-teal-700 flex items-center gap-1 mb-1">
                          <MdSchool className="h-4 w-4" />
                          Medical Degree
                        </p>
                        <p className="text-gray-700 font-semibold">{doctorData.qualification}</p>
                      </div>
                    )}
                    {doctorData.experience != null && (
                      <div>
                        <p className="text-sm font-bold text-teal-700 flex items-center gap-1 mb-1">
                          <MdWorkHistory className="h-4 w-4" />
                          Experience
                        </p>
                        <p className="text-gray-700">{doctorData.experience} years of medical experience</p>
                      </div>
                    )}
                    {doctorData.consultationFee != null && (
                      <div>
                        <p className="text-sm font-bold text-teal-700 flex items-center gap-1 mb-1">
                          <FiDollarSign className="h-4 w-4" />
                          Consultation Fee
                        </p>
                        <p className="text-gray-700 font-semibold text-pink-700">₹{doctorData.consultationFee}</p>
                      </div>
                    )}
                    {doctorData.hospitalAffiliation && (
                      <div>
                        <p className="text-sm font-bold text-teal-700 flex items-center gap-1 mb-1">
                          <MdLocalHospital className="h-4 w-4" />
                          Hospital / Clinic
                        </p>
                        <p className="text-gray-700">{doctorData.hospitalAffiliation}</p>
                      </div>
                    )}
                    {doctorData.email && (
                      <div>
                        <p className="text-sm font-bold text-teal-700 flex items-center gap-1 mb-1">
                          <MdEmail className="h-4 w-4" />
                          Email Address
                        </p>
                        <p className="text-gray-700">{doctorData.email}</p>
                      </div>
                    )}
                    {doctorData.phone && (
                      <div>
                        <p className="text-sm font-bold text-teal-700 flex items-center gap-1 mb-1">
                          <FiPhone className="h-4 w-4" />
                          Phone Number
                        </p>
                        <p className="text-gray-700">{doctorData.phone}</p>
                      </div>
                    )}
                    {doctorData.availableHours && (
                      <div>
                        <p className="text-sm font-bold text-teal-700 flex items-center gap-1 mb-1">
                          <FiClock className="h-4 w-4" />
                          Available Hours
                        </p>
                        <p className="text-gray-700 font-medium">
                          {doctorData.availableHours}
                        </p>
                      </div>
                    )}
                    {doctorData.languages && (
                      <div>
                        <p className="text-sm font-bold text-teal-700 flex items-center gap-1 mb-2">
                          <FiGlobe className="h-4 w-4" />
                          Languages Spoken
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {doctorData.languages
                            .split(",")
                            .map((lang, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 text-xs bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 rounded-full border border-teal-200 font-medium"
                              >
                                {lang.trim()}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Enhanced About Section */}
            {doctorData?.about && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaNotesMedical className="h-5 w-5 text-blue-600" />
                  Medical Philosophy & Approach
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {doctorData.about}
                </p>
              </Card>
            )}

            {/* Enhanced Blockchain Information */}
            <Card className="border-t bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MdBiotech className="h-5 w-5 text-gray-600" />
                Blockchain Verification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-1 mb-1">
                    <MdSecurity className="h-4 w-4" />
                    Doctor ID
                  </p>
                  <p className="text-gray-600 text-lg font-mono">
                    #{doctor.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-1 mb-1">
                    <MdHealthAndSafety className="h-4 w-4" />
                    Blockchain Address
                  </p>
                  <p className="text-gray-600 font-mono text-sm break-all">
                    {truncateAddress(doctor.accountAddress, 10, 10)}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </Modal>
  );
};

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("approved");
  const [filterSpecialization, setFilterSpecialization] = useState("all");
  const [sortBy, setSortBy] = useState("experience");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userType, setUserType] = useState(null);

  const { user: fabricUser } = useAuth();
  const isConnected = !!fabricUser;
  const address = fabricUser?.userId || fabricUser?.email || '';
  const router = useRouter();
  const { getAllDoctors, getUserType } = useHealthcareContract();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch doctors
        const doctorsList = await getAllDoctors();
        setDoctors(doctorsList || []);
        setFilteredDoctors(doctorsList || []);

        // Get user type if connected
        if (isConnected && address) {
          const userInfo = await getUserType(address);
          setUserType(userInfo);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
        toast.error("Failed to load doctors");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isConnected, address]);

  useEffect(() => {
    let filtered = doctors;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doctor) =>
          doctor.id?.toString().toLowerCase().includes(term) ||
          doctor.accountAddress?.toLowerCase().includes(term) ||
          doctor.fullName?.toLowerCase().includes(term) ||
          doctor.name?.toLowerCase().includes(term) ||
          doctor.specialization?.toLowerCase().includes(term) ||
          doctor.degree?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      if (filterStatus === "approved") {
        filtered = filtered.filter((doctor) => doctor.isApproved);
      } else if (filterStatus === "pending") {
        filtered = filtered.filter((doctor) => !doctor.isApproved);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "experience":
          return Number(b.appointmentCount) - Number(a.appointmentCount);
        case "success-rate":
          const successRateA =
            Number(a.appointmentCount) > 0
              ? Number(a.successfulTreatmentCount) / Number(a.appointmentCount)
              : 0;
          const successRateB =
            Number(b.appointmentCount) > 0
              ? Number(b.successfulTreatmentCount) / Number(b.appointmentCount)
              : 0;
          return successRateB - successRateA;
        case "newest":
          return Number(b.id) - Number(a.id);
        case "oldest":
          return Number(a.id) - Number(b.id);
        default:
          return Number(b.appointmentCount) - Number(a.appointmentCount);
      }
    });

    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, filterStatus, filterSpecialization, sortBy]);

  const handleViewProfile = (doctor) => {
    setSelectedDoctor(doctor);
    setShowProfileModal(true);
  };

  const handleBookAppointment = (doctor) => {
    if (!isConnected) {
      toast.error("Please connect your wallet to book appointments");
      return;
    }

    if (!userType || userType.userType !== "patient") {
      toast.error("Only registered patients can book appointments");
      router.push("/patient/register");
      return;
    }

    // Navigate to appointment booking with doctor info
    router.push({
      pathname: "/patient/appointment",
      query: { doctorId: doctor.id },
    });
  };

  const isPatient = userType?.userType === "patient";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="p-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-2xl">
              <FaUserMd className="h-12 w-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-300 rounded-full animate-ping"></div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-medium">
            Loading medical professionals...
          </p>
          <p className="text-sm text-gray-500">
            Connecting to healthcare network
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 relative">
      {/* Medical Background Elements */}
      <div className="absolute inset-0 opacity-5 overflow-hidden">
        <FaUserMd className="absolute top-20 right-20 h-32 w-32 text-teal-600 animate-pulse" />
        <FaStethoscope className="absolute bottom-20 left-20 h-24 w-24 text-cyan-600" />
        <MdLocalHospital className="absolute top-1/2 left-1/4 h-28 w-28 text-emerald-600 animate-pulse animation-delay-2000" />
      </div>

      {/* Enhanced Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="p-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl shadow-2xl">
              <FaUserMd className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-teal-300 rounded-full border-4 border-white">
              <MdVerifiedUser className="h-4 w-4 text-teal-700 m-1" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          Medical Directory
          <MdMedicalServices className="h-8 w-8 text-teal-600" />
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Connect with qualified, verified healthcare professionals on our
          secure blockchain-powered medical platform
        </p>
        <div className="mt-4 flex items-center justify-center space-x-6 text-teal-600">
          <div className="flex items-center space-x-2">
            <MdHealthAndSafety className="h-5 w-5" />
            <span className="text-sm font-medium">Board Certified</span>
          </div>
          <div className="flex items-center space-x-2">
            <MdBiotech className="h-5 w-5" />
            <span className="text-sm font-medium">Blockchain Verified</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiShield className="h-5 w-5" />
            <span className="text-sm font-medium">Secure Platform</span>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <Card className="mb-8 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search by doctor ID, name, or wallet address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Doctors</option>
            <option value="approved">Verified Only</option>
            <option value="pending">Under Review</option>
          </Select>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="experience">Most Experienced</option>
            <option value="success-rate">Highest Success Rate</option>
            <option value="newest">Recently Joined</option>
            <option value="oldest">Longest Serving</option>
          </Select>
        </div>
      </Card>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card className="p-6 text-center bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 hover:shadow-lg transition-all">
          <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
            <FaUserMd className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-teal-600">{doctors.length}</h3>
          <p className="text-teal-800 font-medium">Medical Professionals</p>
        </Card>
        <Card className="p-6 text-center bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:shadow-lg transition-all">
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
            <MdVerifiedUser className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-emerald-600">
            {doctors.filter((d) => d.isApproved).length}
          </h3>
          <p className="text-emerald-800 font-medium">Board Certified</p>
        </Card>
        <Card className="p-6 text-center bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 hover:shadow-lg transition-all">
          <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
            <MdSecurity className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-yellow-600">
            {doctors.filter((d) => !d.isApproved).length}
          </h3>
          <p className="text-yellow-800 font-medium">Under Review</p>
        </Card>
        <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-lg transition-all">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
            <FaStethoscope className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-purple-600">
            {doctors.reduce((sum, d) => sum + Number(d.appointmentCount), 0)}
          </h3>
          <p className="text-purple-800 font-medium">Total Consultations</p>
        </Card>
      </div>

      {/* Enhanced User Status Alerts */}
      {!isConnected && (
        <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg">
              <MdSecurity className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                Connect Wallet for Medical Appointments
              </h3>
              <p className="text-yellow-800 leading-relaxed mb-4">
                Connect your Web3 wallet and register as a patient to book
                secure, blockchain-verified appointments with our medical
                professionals.
              </p>
              <div className="flex items-center space-x-4">
                <Button
                  size="small"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  Connect Wallet
                </Button>
                <div className="flex items-center space-x-1 text-sm text-yellow-700">
                  <FiShield className="h-4 w-4" />
                  <span>HIPAA Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {isConnected && !isPatient && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <FaHospitalUser className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                Patient Registration Required
                <MdHealthAndSafety className="h-5 w-5" />
              </h3>
              <p className="text-blue-800 leading-relaxed mb-4">
                Register as a patient on our healthcare platform to book
                appointments with verified medical professionals, access secure
                consultations, and manage your medical records.
              </p>
              <Button
                size="small"
                onClick={() => router.push("/patient/register")}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                <FaHospitalUser className="mr-2 h-4 w-4" />
                Register as Patient
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Enhanced Doctors Grid */}
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onViewProfile={handleViewProfile}
              onBookAppointment={handleBookAppointment}
              isPatient={isPatient}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200">
          <div className="p-6 bg-gradient-to-r from-gray-100 to-slate-100 rounded-full w-fit mx-auto mb-6">
            <FaUserMd className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            No doctors found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search criteria or filters to find medical professionals."
              : "No doctors are currently registered on our healthcare platform. Please check back later."}
          </p>
          {(searchTerm || filterStatus !== "all") && (
            <div className="mt-4 space-x-3">
              <Button
                variant="outline"
                size="small"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setSortBy("experience");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Enhanced Profile Modal */}
      <DoctorProfileModal
        doctor={selectedDoctor}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default DoctorsList;

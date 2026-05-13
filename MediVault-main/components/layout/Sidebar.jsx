import { useRouter } from "next/router";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiShoppingBag,
  FiActivity,
  FiFileText,
  FiMessageSquare,
  FiSettings,
  FiHeart,
  FiPlusCircle,
  FiList,
  FiUserPlus,
  FiX,
  FiShield,
  FiTrendingUp,
  FiClock,
  FiBell,
  FiUser,
  FiClipboard,
  FiCpu,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdAdminPanelSettings,
  MdMedicalServices,
  MdHealthAndSafety,
  MdMonitorHeart,
  MdLocalPharmacy,
  MdBiotech,
  MdVerifiedUser,
  MdEmergency,
  MdVaccines,
  MdPersonalInjury,
  MdBedroomParent,
  MdAnalytics,
  MdAnnouncement,
  MdAttachMoney,
} from "react-icons/md";
import {
  FaStethoscope,
  FaUserMd,
  FaHospitalUser,
  FaPrescriptionBottleAlt,
  FaHeartbeat,
  FaNotesMedical,
  FaAmbulance,
  FaSyringe,
  FaUserNurse,
  FaMicroscope,
} from "react-icons/fa";

const Sidebar = ({ isOpen, onClose, userType }) => {
  const router = useRouter();

  const getUserRole = () => {
    if (!userType) return "guest";
    const t = userType.userType?.toLowerCase() || "guest";
    if (t === "hospital_admin" || t === "hospital") return "hospital";
    return t;
  };

  const navigation = {
    guest: [
      { name: "Home", href: "/", icon: FiHome, color: "emerald" },
      {
        name: "View Medicines",
        href: "/medicines",
        icon: FaPrescriptionBottleAlt,
        color: "blue",
      },
      {
        name: "Find Doctors",
        href: "/doctors",
        icon: FaStethoscope,
        color: "indigo",
      },
    ],
    admin: [
      {
        name: "Dashboard",
        href: "/admin/dashboard",
        icon: MdMonitorHeart,
        color: "emerald",
      },
      {
        name: "AI-Vaidya",
        href: "/ai-vaidya",
        icon: FiCpu,
        color: "teal",
      },
      {
        name: "Analytics",
        href: "/admin/analytics",
        icon: MdAnalytics,
        color: "pink",
      },
      {
        name: "Hospitals",
        href: "/admin/hospitals",
        icon: MdLocalHospital,
        color: "teal",
      },
      {
        name: "Manage Doctors",
        href: "/admin/doctors",
        icon: FaUserMd,
        color: "cyan",
      },
      {
        name: "View Patients",
        href: "/admin/patients",
        icon: FaHospitalUser,
        color: "blue",
      },
      {
        name: "All Appointments",
        href: "/admin/appointments",
        icon: FaStethoscope,
        color: "purple",
      },
      {
        name: "Announcements",
        href: "/admin/announcements",
        icon: MdAnnouncement,
        color: "orange",
      },
      {
        name: "Configuration",
        href: "/admin/config",
        icon: FiSettings,
        color: "indigo",
      },
      {
        name: "Revenue",
        href: "/admin/revenue",
        icon: MdAttachMoney,
        color: "emerald",
      },
      {
        name: "Manage Medicines",
        href: "/admin/medicines/add",
        icon: MdLocalPharmacy,
        color: "gray",
      },
      {
        name: "Admin Team",
        href: "/admin/team",
        icon: FiShield,
        color: "purple",
      },
      {
        name: "Audit Logs",
        href: "/admin/audit-logs",
        icon: FiClipboard,
        color: "rose",
      },
      {
        name: "My Profile",
        href: "/admin/profile",
        icon: FiUser,
        color: "slate",
      },
      {
        name: "Messages",
        href: "/chat",
        icon: FiMessageSquare,
        color: "orange",
      },
    ],
    doctor: [
      {
        name: "Dashboard",
        href: "/doctor/dashboard",
        icon: MdMonitorHeart,
        color: "emerald",
      },
      {
        name: "AI-Vaidya",
        href: "/ai-vaidya",
        icon: FiCpu,
        color: "teal",
      },
      {
        name: "My Appointments",
        href: "/doctor/appointments",
        icon: FaStethoscope,
        color: "teal",
      },
      {
        name: "Patients List",
        href: "/doctor/patients",
        icon: FaHospitalUser,
        color: "cyan",
      },
      {
        name: "Prescribe Medicine",
        href: "/doctor/prescribe",
        icon: FaPrescriptionBottleAlt,
        color: "blue",
      },
      {
        name: "Medical Records",
        href: "/doctor/records",
        icon: FaNotesMedical,
        color: "indigo",
      },
      {
        name: "Lab Orders",
        href: "/doctor/lab-orders",
        icon: FaMicroscope,
        color: "purple",
      },
      {
        name: "Availability",
        href: "/doctor/availability",
        icon: FiCalendar,
        color: "pink",
      },
      {
        name: "Profile",
        href: "/doctor/profile",
        icon: FiSettings,
        color: "gray",
      },
    ],
    hospital: [
      {
        name: "Dashboard",
        href: "/hospital/dashboard",
        icon: MdMonitorHeart,
        color: "emerald",
      },
      {
        name: "AI-Vaidya",
        href: "/ai-vaidya",
        icon: FiCpu,
        color: "teal",
      },
      {
        name: "Doctors",
        href: "/hospital/doctors",
        icon: FaUserMd,
        color: "teal",
      },
      {
        name: "Departments",
        href: "/hospital/departments",
        icon: MdMedicalServices,
        color: "cyan",
      },
      {
        name: "Staff",
        href: "/hospital/staff",
        icon: FiUsers,
        color: "blue",
      },
      {
        name: "Lab",
        href: "/hospital/lab",
        icon: FaMicroscope,
        color: "indigo",
      },
      {
        name: "Beds",
        href: "/hospital/beds",
        icon: MdBedroomParent,
        color: "purple",
      },
      {
        name: "Billing",
        href: "/hospital/billing",
        icon: FiActivity,
        color: "orange",
      },
      {
        name: "Profile",
        href: "/hospital/profile",
        icon: FiSettings,
        color: "gray",
      },
      {
        name: "Register Hospital",
        href: "/hospital/register",
        icon: MdLocalHospital,
        color: "pink",
      },
    ],
    patient: [
      {
        name: "Dashboard",
        href: "/patient/dashboard",
        icon: MdMonitorHeart,
        color: "emerald",
      },
      {
        name: "AI-Vaidya",
        href: "/ai-vaidya",
        icon: FiCpu,
        color: "teal",
      },
      {
        name: "Book Appointment",
        href: "/patient/appointment",
        icon: FaStethoscope,
        color: "teal",
      },
      {
        name: "Buy Medicine",
        href: "/patient/medicines",
        icon: FaPrescriptionBottleAlt,
        color: "cyan",
      },
      {
        name: "Medical History",
        href: "/patient/history",
        icon: FaNotesMedical,
        color: "blue",
      },
      {
        name: "My Prescriptions",
        href: "/patient/prescriptions",
        icon: FaSyringe,
        color: "indigo",
      },
      {
        name: "Invoices & Bills",
        href: "/patient/invoices",
        icon: FiActivity,
        color: "orange",
      },
      {
        name: "Med Reminders",
        href: "/patient/medication-reminders",
        icon: FiClock,
        color: "teal",
      },
      {
        name: "Notifications",
        href: "/patient/notifications",
        icon: FiBell,
        color: "purple",
      },
      {
        name: "Profile",
        href: "/patient/profile",
        icon: FiSettings,
        color: "gray",
      },
    ],
  };

  const currentRole = getUserRole();
  const menuItems = navigation[currentRole] || navigation.guest;

  const handleNavigation = (href) => {
    router.push(href);
    onClose();
  };

  const isActivePath = (href) => {
    return router.pathname === href;
  };

  const getRoleDisplayName = () => {
    switch (currentRole) {
      case "admin":
        return "Administrator";
      case "doctor":
        return "Medical Doctor";
      case "patient":
        return "Patient";
      case "hospital":
        return "Hospital Admin";
      default:
        return "Guest User";
    }
  };

  const getRoleIcon = () => {
    switch (currentRole) {
      case "admin":
        return <MdAdminPanelSettings className="w-6 h-6" />;
      case "doctor":
        return <FaUserMd className="w-6 h-6" />;
      case "patient":
        return <FaHospitalUser className="w-6 h-6" />;
      case "hospital":
        return <MdLocalHospital className="w-6 h-6" />;
      default:
        return <FiUsers className="w-6 h-6" />;
    }
  };

  const getRoleColor = () => {
    switch (currentRole) {
      case "admin":
        return "from-red-500 to-pink-500";
      case "doctor":
        return "from-teal-500 to-cyan-500";
      case "patient":
        return "from-emerald-500 to-teal-500";
      case "hospital":
        return "from-blue-500 to-indigo-500";
      default:
        return "from-emerald-500 to-teal-500";
    }
  };

  const getColorClasses = (color, isActive = false) => {
    if (isActive) {
      const activeColors = {
        emerald:
          "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-r-4 border-emerald-500",
        teal: "bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 border-r-4 border-teal-500",
        cyan: "bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-700 border-r-4 border-cyan-500",
        blue: "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-r-4 border-blue-500",
        indigo:
          "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-r-4 border-indigo-500",
        purple:
          "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-r-4 border-purple-500",
        pink: "bg-gradient-to-r from-pink-50 to-pink-100 text-pink-700 border-r-4 border-pink-500",
        orange:
          "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-r-4 border-orange-500",
        gray: "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-r-4 border-gray-500",
        rose: "bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700 border-r-4 border-rose-500",
        slate: "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border-r-4 border-slate-500",
      };
      return activeColors[color] || activeColors.emerald;
    } else {
      return "text-gray-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-700";
    }
  };

  const getIconColor = (color, isActive = false) => {
    if (isActive) {
      const iconColors = {
        emerald: "text-emerald-600",
        teal: "text-teal-600",
        cyan: "text-cyan-600",
        blue: "text-blue-600",
        indigo: "text-indigo-600",
        purple: "text-purple-600",
        pink: "text-pink-600",
        orange: "text-orange-600",
        gray: "text-gray-600",
        rose: "text-rose-600",
        slate: "text-slate-600",
      };
      return iconColors[color] || iconColors.emerald;
    } else {
      return "text-gray-400 group-hover:text-emerald-500";
    }
  };

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform flex flex-col h-full ${
          isOpen ? "translate-x-0" : "-translate-x-full "
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-emerald-100`}
      >
        {/* Enhanced Sidebar header with medical theme */}
        <div
          className={`flex items-center justify-between h-20 px-6 bg-gradient-to-r ${getRoleColor()} relative overflow-hidden`}
        >
          {/* Medical background pattern */}
          <div className="absolute inset-0 opacity-10">
            <FaHeartbeat className="absolute top-2 right-4 h-8 w-8 text-white animate-pulse" />
            <FaStethoscope className="absolute bottom-2 left-4 h-6 w-6 text-white" />
          </div>

          <div className="flex items-center space-x-3 relative z-10">
            <div className="p-2 bg-white bg-opacity-25 rounded-xl backdrop-blur-sm border border-white border-opacity-30">
              <div className="relative">
                <MdLocalHospital className="h-8 w-8 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">MediVault</h2>
              <p className="text-xs text-white text-opacity-90 flex items-center gap-1">
                <MdBiotech className="h-3 w-3" />
                Medical DApp Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-20 lg:hidden transition-all duration-200 backdrop-blur-sm"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* User role indicator */}
        {userType && (
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-25 to-teal-25 border-b border-emerald-100">
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 bg-gradient-to-r ${getRoleColor()} rounded-xl shadow-lg relative`}
              >
                <div className="text-white">{getRoleIcon()}</div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white">
                  <MdVerifiedUser className="h-2 w-2 text-white m-0.5" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {getRoleDisplayName()}
                  <MdHealthAndSafety className="h-4 w-4 text-emerald-600" />
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-600 font-medium">
                    Verified Account
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Navigation with medical styling */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={`group w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-105 ${getColorClasses(
                item.color,
                isActivePath(item.href)
              )}`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white bg-opacity-50 mr-4 transition-all duration-200 group-hover:scale-110">
                <item.icon
                  className={`h-5 w-5 ${getIconColor(
                    item.color,
                    isActivePath(item.href)
                  )}`}
                />
              </div>
              <span className="flex-1 text-left">{item.name}</span>
              {isActivePath(item.href) && (
                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
              )}
            </button>
          ))}

          {/* Back to Home — shown for all logged-in roles */}
          {currentRole !== "guest" && (
            <div className="mt-4 pt-4 border-t border-emerald-100">
              <button
                onClick={() => handleNavigation("/")}
                className="group w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-105 text-gray-500 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-700"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white bg-opacity-50 mr-4 transition-all duration-200 group-hover:scale-110">
                  <FiHome className="h-5 w-5 text-gray-400 group-hover:text-emerald-500" />
                </div>
                <span className="flex-1 text-left">Back to Home</span>
              </button>
            </div>
          )}

          {/* Platform Sections — shown for guest users */}
          {currentRole === "guest" && (
            <div className="mt-5 pt-4 border-t border-emerald-100 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">
                I am a…
              </p>

              {/* Active — styled as solid gradient buttons */}
              <button
                onClick={() => handleNavigation("/register?role=patient")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                <FaHospitalUser className="h-4 w-4" />
                Patient
              </button>

              <button
                onClick={() => handleNavigation("/register?role=doctor")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                <FaUserMd className="h-4 w-4" />
                Doctor
              </button>

              <button
                onClick={() => handleNavigation("/hospital/register")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                <MdLocalHospital className="h-4 w-4" />
                Hospital
              </button>

              {/* Coming Soon — muted, non-clickable */}
              {[
                { name: "Researcher",       icon: FaMicroscope },
                { name: "Insurance Company",icon: FiShield },
                { name: "Government Agency",icon: MdVerifiedUser },
                { name: "Pharmacy",         icon: MdLocalPharmacy },
              ].map(({ name, icon: Icon }) => (
                <div
                  key={name}
                  className="flex items-center px-4 py-2.5 text-sm rounded-xl cursor-not-allowed opacity-40"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 mr-3 flex-shrink-0">
                    <Icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <span className="flex-1 text-gray-400">{name}</span>
                  <span className="text-xs bg-gray-200 text-gray-400 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                    Soon
                  </span>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Quick actions footer — only for logged-in roles */}
        <div className="px-4 py-4 border-t border-emerald-100 bg-gradient-to-r from-emerald-25 to-teal-25 flex-shrink-0">
          {currentRole === "admin" && (
            <button
              onClick={() => handleNavigation("/admin/medicines/add")}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <MdLocalPharmacy className="mr-2 h-5 w-5" />
              Add Medicine
              <FiPlusCircle className="ml-2 h-4 w-4" />
            </button>
          )}

          {currentRole === "doctor" && (
            <button
              onClick={() => handleNavigation("/doctor/prescribe")}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <FaPrescriptionBottleAlt className="mr-2 h-5 w-5" />
              Quick Prescribe
              <FaSyringe className="ml-2 h-4 w-4" />
            </button>
          )}

          {currentRole === "patient" && (
            <button
              onClick={() => handleNavigation("/patient/appointment")}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <FaStethoscope className="mr-2 h-5 w-5" />
              Book Appointment
              <FaAmbulance className="ml-2 h-4 w-4" />
            </button>
          )}
        </div>

        {/* Secure status footer */}
        <div className="px-4 py-3 border-t border-emerald-100 bg-gradient-to-r from-gray-50 to-emerald-25">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
              <MdHealthAndSafety className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium text-emerald-700">MediVault Secure</span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FiShield className="h-3 w-3" />
                Hyperledger Fabric Protected
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

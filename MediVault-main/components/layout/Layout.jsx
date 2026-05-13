// AUDIT FIX [Step 4]: AiVaidyaButton was missing from Layout — added so the
// floating AI assistant button appears on every authenticated portal page.
import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import { MdLocalHospital } from "react-icons/md";
import {
  FaStethoscope,
  FaHeartbeat,
  FaUserMd,
  FaHospitalUser,
} from "react-icons/fa";
import AiVaidyaButton from "../../ai_vaidya/ui/components/AiVaidyaButton";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Derive userType from live auth state — never from stale localStorage
  const userType = user ? { userType: user.userType } : null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-emerald-25 to-teal-25 relative overflow-hidden">
      {/* Subtle Medical Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20">
          <FaStethoscope className="h-16 w-16 text-emerald-600 animate-pulse" />
        </div>
        <div className="absolute bottom-20 right-20">
          <MdLocalHospital className="h-20 w-20 text-teal-600" />
        </div>
        <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
          <FaHeartbeat className="h-12 w-12 text-cyan-600 animate-pulse animation-delay-2000" />
        </div>
        <div className="absolute top-1/3 right-1/3">
          <FaUserMd className="h-14 w-14 text-emerald-600" />
        </div>
        <div className="absolute bottom-1/3 left-1/3">
          <FaHospitalUser className="h-10 w-10 text-teal-600 animate-pulse animation-delay-4000" />
        </div>
      </div>

      {/* Enhanced Sidebar */}
      <div className="relative z-10">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userType={userType}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Enhanced Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} userType={userType} />

        {/* Main content with enhanced medical styling */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/30 relative">
          {/* Content Background Effects */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-emerald-300 to-teal-300 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-r from-teal-300 to-cyan-300 rounded-full blur-3xl animate-pulse animation-delay-3000"></div>
          </div>

          {/* Enhanced Container */}
          <div className="container mx-auto px-4 py-6 max-w-7xl relative z-10">
            {/* Medical Header Pattern */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-20"></div>

            {/* Content Area with Medical Styling */}
            <div className="relative">
              {/* Medical Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-emerald-300 opacity-30"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-teal-300 opacity-30"></div>

              {children}
            </div>
          </div>

          {/* Medical Footer Pattern */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 opacity-20"></div>
        </main>
      </div>

      {/* Enhanced Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        >
          {/* Medical Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4">
              <FaStethoscope className="h-16 w-16 text-white animate-pulse" />
            </div>
            <div className="absolute bottom-1/4 right-1/4">
              <FaHeartbeat className="h-12 w-12 text-white animate-pulse animation-delay-2000" />
            </div>
          </div>
        </div>
      )}

      {/* AI-Vaidya floating button — renders via portal on document.body */}
      <AiVaidyaButton />

    </div>
  );
};

export default Layout;

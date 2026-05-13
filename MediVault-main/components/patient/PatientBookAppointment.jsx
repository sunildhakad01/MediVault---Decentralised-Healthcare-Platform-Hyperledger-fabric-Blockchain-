import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiCalendar,
  FiClock,
  FiCheck,
  FiArrowLeft,
  FiUser,
  FiAlertCircle,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";
import { MdVerifiedUser, MdHealthAndSafety, MdLocalHospital } from "react-icons/md";
import { FaUserMd, FaRupeeSign, FaGraduationCap, FaHospital, FaClinicMedical } from "react-icons/fa";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

const AVATAR_COLORS = [
  "from-cyan-400 to-teal-500",
  "from-purple-400 to-indigo-500",
  "from-orange-400 to-red-500",
  "from-green-400 to-emerald-500",
  "from-pink-400 to-rose-500",
  "from-yellow-400 to-amber-500",
];

// ─── Utility helpers ──────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function toDisplayDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function to12Hour(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period} IST`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingSpinner({ size = "md" }) {
  const s = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-6 w-6";
  return (
    <div
      className={`${s} animate-spin rounded-full border-2 border-cyan-500 border-t-transparent`}
    />
  );
}

function VerifiedBadge({ verifiedBy }) {
  if (!verifiedBy) return null;
  const isHospital = verifiedBy?.toLowerCase().includes("hospital");
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        isHospital
          ? "bg-blue-50 text-blue-700 border border-blue-200"
          : "bg-teal-50 text-teal-700 border border-teal-200"
      }`}
    >
      {isHospital ? (
        <MdHealthAndSafety className="h-3.5 w-3.5" />
      ) : (
        <MdVerifiedUser className="h-3.5 w-3.5" />
      )}
      {isHospital ? "Verified by Hospital" : "Verified by Platform"}
    </span>
  );
}

function DoctorAvatar({ name, photoUrl, size = "md" }) {
  const initials = getInitials(name);
  const gradient = avatarColor(name);
  const sizeClass = size === "lg" ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg";
  const iconSize = size === "lg" ? "h-9 w-9" : "h-6 w-6";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 border-2 border-gray-200`}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {initials || <FaUserMd className={iconSize} />}
    </div>
  );
}

function DoctorResultCard({ doctor, onBook }) {
  const displayName = doctor.name || doctor.fullName || "";
  const facilityName = doctor.clinicName || doctor.hospitalName || "";
  const isHospitalAffiliated = !!doctor.hospitalId && !!doctor.hospitalName;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <DoctorAvatar name={displayName} photoUrl={doctor.profilePhoto} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {displayName ? `Dr. ${displayName}` : "Doctor"}
            </h3>
            <VerifiedBadge verifiedBy={doctor.verifiedBy} />
          </div>

          {/* Specialization & Degree */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="text-sm text-cyan-600 font-medium">{doctor.specialization}</p>
            {doctor.degree && (
              <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                <FaGraduationCap className="h-3 w-3" />
                {doctor.degree}
              </span>
            )}
          </div>

          {/* Experience & Location */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
            {doctor.experience !== undefined && doctor.experience > 0 && (
              <span className="flex items-center gap-1">
                <FiUser className="h-3.5 w-3.5" />
                {doctor.experience} {doctor.experience === 1 ? "year" : "years"} exp.
              </span>
            )}
            {(doctor.clinicCity || doctor.city) && (
              <span className="flex items-center gap-1">
                <FiMapPin className="h-3.5 w-3.5" />
                {doctor.clinicCity || doctor.city}
              </span>
            )}
          </div>

          {/* Hospital / Clinic affiliation */}
          {facilityName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
              {isHospitalAffiliated ? (
                <MdLocalHospital className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
              ) : (
                <FaClinicMedical className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
              )}
              <span className="truncate font-medium">{facilityName}</span>
              {isHospitalAffiliated && (
                <span className="ml-1 text-blue-600 font-semibold">(MediVault Hospital)</span>
              )}
            </div>
          )}

          {/* Fee & Book button */}
          <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
            <span className="inline-flex items-center gap-1 text-sm font-bold text-gray-800">
              <FaRupeeSign className="h-3.5 w-3.5 text-green-600" />
              {Number(doctor.consultationFee || 0).toLocaleString("en-IN")}
              <span className="text-xs text-gray-400 font-normal ml-0.5">consultation</span>
            </span>
            <button
              onClick={() => onBook(doctor)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <FiCalendar className="h-4 w-4" />
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NearbyFacilitiesSection() {
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  useEffect(() => {
    async function fetchHospitals() {
      try {
        const res = await apiClient.get("/hospitals");
        const data = res.data;
        const list = data?.data || data?.hospitals || (Array.isArray(data) ? data : []);
        setHospitals(list.slice(0, 6));
      } catch {
        setHospitals([]);
      } finally {
        setLoadingHospitals(false);
      }
    }
    fetchHospitals();
  }, []);

  if (loadingHospitals) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <MdLocalHospital className="h-5 w-5 text-cyan-500" />
        Hospitals on MediVault Platform
      </h2>
      {hospitals.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <FaHospital className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hospitals registered on the platform yet.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {hospitals.map((h) => (
          <div key={h.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0 border border-teal-200">
              <FaHospital className="h-5 w-5 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-900 truncate">{h.name}</p>
                {h.isApproved ? (
                  <span className="inline-flex items-center gap-0.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">
                    <MdVerifiedUser className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full font-medium">
                    Pending
                  </span>
                )}
              </div>
              {h.hospitalType && (
                <p className="text-xs text-cyan-600 font-medium capitalize">{h.hospitalType}</p>
              )}
              {(h.city || h.state) && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <FiMapPin className="h-3 w-3" />
                  {[h.city, h.state].filter(Boolean).join(", ")}
                </p>
              )}
              {h.phone && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FiPhone className="h-3 w-3" />
                  {h.phone}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientBookAppointment() {
  const router = useRouter();

  // Screen state: "search" | "booking" | "confirmation"
  const [screen, setScreen] = useState("search");

  // Search
  const [filters, setFilters] = useState({ specialization: "", name: "", city: "" });
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Booking
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Confirmation
  const [confirmation, setConfirmation] = useState(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSearch(e) {
    e.preventDefault();
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (filters.specialization.trim()) params.set("specialization", filters.specialization.trim());
      if (filters.name.trim()) params.set("name", filters.name.trim());
      if (filters.city.trim()) params.set("city", filters.city.trim());

      const res = await apiClient.get(`/doctor/search/available?${params.toString()}`);
      const data = res.data;

      if (data?.success) {
        setSearchResults(data.doctors || data.data || []);
      } else if (Array.isArray(data)) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to search doctors. Please try again.";
      if (err?.response?.status === 404 && msg.toLowerCase().includes("profile")) {
        setSearchError("profile_missing");
      } else {
        setSearchError(msg);
      }
    } finally {
      setSearching(false);
    }
  }

  function handleSelectDoctor(doctor) {
    setSelectedDoctor(doctor);
    setAppointmentDate("");
    setSelectedSlot("");
    setReason("");
    setBookingError(null);
    setScreen("booking");
  }

  async function handleBooking(e) {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Please select a time slot.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please enter a reason for visit.");
      return;
    }

    setBooking(true);
    setBookingError(null);

    try {
      const payload = {
        doctorId: selectedDoctor._id || selectedDoctor.id,
        appointmentDate,
        slotStart: selectedSlot,
        slotEnd: addMinutes(selectedSlot, 30),
        reason: reason.trim(),
      };
      if (selectedDoctor.hospitalId) payload.hospitalId = selectedDoctor.hospitalId;

      const res = await apiClient.post("/patient/appointments", payload);
      const data = res.data;

      const appt = data?.appointment || data?.data || data;
      setConfirmation({
        appointmentId: appt?._id || appt?.id || "N/A",
        doctorName: selectedDoctor.name,
        consultationFee: selectedDoctor.consultationFee,
        appointmentDate,
        slotStart: selectedSlot,
      });
      setScreen("confirmation");
      toast.success("Appointment booked successfully!");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to book appointment. Please try again.";
      if (err?.response?.status === 404 && msg.toLowerCase().includes("profile")) {
        setBookingError("profile_missing");
      } else {
        setBookingError(msg);
      }
    } finally {
      setBooking(false);
    }
  }

  function handleBookAnother() {
    setScreen("search");
    setSelectedDoctor(null);
    setConfirmation(null);
    setSearchResults([]);
    setHasSearched(false);
    setFilters({ specialization: "", name: "", city: "" });
  }

  // ── Input class ─────────────────────────────────────────────────────────────
  const inputClass =
    "w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm";

  // ── Render ───────────────────────────────────────────────────────────────────

  // CONFIRMATION SCREEN
  if (screen === "confirmation" && confirmation) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Appointment Confirmed!</h2>
          <p className="text-sm text-gray-500 mb-6">Your appointment has been successfully booked.</p>

          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Appointment ID</span>
              <span className="text-gray-800 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                {confirmation.appointmentId}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Doctor</span>
              <span className="text-gray-800 font-semibold">Dr. {confirmation.doctorName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Consultation Fee</span>
              <span className="text-green-700 font-bold flex items-center gap-0.5">
                <FaRupeeSign className="h-3 w-3" />
                {Number(confirmation.consultationFee || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Date</span>
              <span className="text-gray-800">{toDisplayDate(confirmation.appointmentDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Time</span>
              <span className="text-gray-800">{to12Hour(confirmation.slotStart)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleBookAnother}
              className="flex-1 border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              Book Another
            </button>
            <Link
              href="/patient/dashboard"
              className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-medium px-4 py-2.5 rounded-xl transition-all text-sm text-center"
            >
              View Appointments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // BOOKING FORM SCREEN
  if (screen === "booking" && selectedDoctor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => setScreen("search")}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to search
        </button>

        {/* Doctor summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <div className="flex items-start gap-4">
            <DoctorAvatar name={selectedDoctor.name} photoUrl={selectedDoctor.profilePhoto} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base">Dr. {selectedDoctor.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-sm text-cyan-600 font-medium">{selectedDoctor.specialization}</p>
                {selectedDoctor.degree && (
                  <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                    <FaGraduationCap className="h-3 w-3" />
                    {selectedDoctor.degree}
                  </span>
                )}
              </div>
              {selectedDoctor.experience !== undefined && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <FiUser className="h-3 w-3" />
                  {selectedDoctor.experience} {selectedDoctor.experience === 1 ? "year" : "years"} experience
                </p>
              )}
              {selectedDoctor.clinicName && (
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  <FaClinicMedical className="h-3 w-3 text-teal-500" />
                  {selectedDoctor.clinicName}
                  {selectedDoctor.clinicCity && `, ${selectedDoctor.clinicCity}`}
                </p>
              )}
              <div className="flex items-center gap-1 text-sm font-bold text-gray-700 mt-2">
                <FaRupeeSign className="h-3 w-3 text-green-600" />
                {Number(selectedDoctor.consultationFee || 0).toLocaleString("en-IN")}
                <span className="text-xs text-gray-400 font-normal">consultation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {bookingError && (
          <div className="mb-5">
            {bookingError === "profile_missing" ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <FiAlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  Patient profile not found. Please complete your profile first.{" "}
                  <Link href="/patient/profile" className="font-semibold underline hover:no-underline">
                    Go to profile
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 flex-1">{bookingError}</p>
                <button
                  onClick={() => setBookingError(null)}
                  className="text-xs text-red-600 underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}

        {/* Booking form */}
        <form onSubmit={handleBooking} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FiCalendar className="h-5 w-5 text-cyan-500" />
            Book Appointment
          </h2>

          {/* Date picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={todayISO()}
              value={appointmentDate}
              onChange={(e) => {
                setAppointmentDate(e.target.value);
                setSelectedSlot("");
              }}
              required
              className={inputClass}
            />
            {appointmentDate && (
              <p className="mt-1 text-xs text-gray-400">{toDisplayDate(appointmentDate)}</p>
            )}
          </div>

          {/* Time slot selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Time Slot <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-medium transition-all ${
                    selectedSlot === slot
                      ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl shadow-sm"
                      : "bg-white border-2 border-cyan-200 text-cyan-700 rounded-xl hover:bg-cyan-50"
                  }`}
                >
                  <FiClock className="h-3.5 w-3.5 flex-shrink-0" />
                  {to12Hour(slot).replace(" IST", "")}
                </button>
              ))}
            </div>
            {selectedSlot && (
              <p className="mt-2 text-xs text-gray-400">
                Duration: {to12Hour(selectedSlot)} – {to12Hour(addMinutes(selectedSlot, 30))}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for Visit <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 200))}
              rows={3}
              required
              placeholder="Briefly describe your symptoms or reason for this appointment..."
              className={`${inputClass} resize-none`}
            />
            <p className="mt-1 text-xs text-right text-gray-400">{reason.length}/200</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={booking || !appointmentDate || !selectedSlot || !reason.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {booking ? (
              <>
                <LoadingSpinner size="sm" />
                Booking...
              </>
            ) : (
              <>
                <FiCheck className="h-5 w-5" />
                Confirm Appointment
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // SEARCH SCREEN (default)
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <FaUserMd className="h-6 w-6 text-cyan-500" />
          Find a Doctor
        </h1>
        <p className="text-sm text-gray-500">Search for available doctors and book an appointment instantly.</p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Specialization
            </label>
            <input
              type="text"
              name="specialization"
              value={filters.specialization}
              onChange={handleFilterChange}
              placeholder="e.g. Cardiology"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Doctor Name
            </label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="e.g. Dr. Sharma"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              City
            </label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="e.g. Mumbai"
              className={inputClass}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={searching}
          className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-all flex items-center gap-2 shadow-sm"
        >
          {searching ? (
            <>
              <LoadingSpinner size="sm" />
              Searching...
            </>
          ) : (
            <>
              <FiSearch className="h-4 w-4" />
              Search Doctors
            </>
          )}
        </button>
      </form>

      {/* Error states */}
      {searchError && (
        <div className="mb-6">
          {searchError === "profile_missing" ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
              <FiAlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Patient profile not found.</p>
                Please complete your profile first.{" "}
                <Link href="/patient/profile" className="font-semibold underline hover:no-underline">
                  Go to profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
              <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{searchError}</p>
              </div>
              <button
                onClick={(e) => { setSearchError(null); handleSearch(e); }}
                className="text-xs text-red-600 underline hover:no-underline flex-shrink-0"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {searching && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="h-14 w-14 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!searching && hasSearched && !searchError && (
        <div>
          {searchResults.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <FaUserMd className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No doctors found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search with different terms.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {searchResults.length} doctor{searchResults.length !== 1 ? "s" : ""} found
              </p>
              {searchResults.map((doctor) => (
                <DoctorResultCard
                  key={doctor._id || doctor.id}
                  doctor={doctor}
                  onBook={handleSelectDoctor}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial state (before first search) */}
      {!hasSearched && !searching && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <FiSearch className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Enter your search criteria above and click Search Doctors to find available doctors.</p>
        </div>
      )}

      {/* Nearby Hospitals & Clinics */}
      <NearbyFacilitiesSection />
    </div>
  );
}

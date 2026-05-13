import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiHash,
  FiUpload,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiBriefcase,
  FiSearch,
  FiMapPin,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdVerifiedUser,
  MdHealthAndSafety,
  MdMedicalServices,
} from "react-icons/md";
import { FaUserMd, FaHospital, FaStethoscope } from "react-icons/fa";
import toast from "react-hot-toast";
import apiClient from "../../utils/api";

// ─── Static data ────────────────────────────────────────────────────────────

const MEDICAL_COUNCILS = [
  "NMC (National Medical Commission)",
  "Andhra Pradesh Medical Council",
  "Arunachal Pradesh Medical Council",
  "Assam Medical Council",
  "Bihar Medical Council",
  "Chhattisgarh Medical Council",
  "Delhi Medical Council",
  "Goa Medical Council",
  "Gujarat Medical Council",
  "Haryana Medical Council",
  "Himachal Pradesh Medical Council",
  "Jharkhand Medical Council",
  "Karnataka Medical Council",
  "Kerala Medical Council",
  "Madhya Pradesh Medical Council",
  "Maharashtra Medical Council",
  "Manipur Medical Council",
  "Meghalaya Medical Council",
  "Mizoram Medical Council",
  "Nagaland Medical Council",
  "Odisha Medical Council",
  "Punjab Medical Council",
  "Rajasthan Medical Council",
  "Sikkim Medical Council",
  "Tamil Nadu Medical Council",
  "Telangana Medical Council",
  "Tripura Medical Council",
  "Uttar Pradesh Medical Council",
  "Uttarakhand Medical Council",
  "West Bengal Medical Council",
];

const DEGREES = [
  "MBBS",
  "MD",
  "MS",
  "BDS",
  "BAMS",
  "BHMS",
  "DNB",
  "DM",
  "MCh",
  "Other",
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

// ─── Shared input class ──────────────────────────────────────────────────────

const inputCls =
  "w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm";

const labelCls = "block text-sm font-medium text-gray-700 mb-1";

// ─── Small helpers ───────────────────────────────────────────────────────────

function Field({ label, required, children }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ label, required, icon: Icon, ...props }) {
  return (
    <Field label={label} required={required}>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        )}
        <input
          className={inputCls + (Icon ? " pl-10" : "")}
          required={required}
          {...props}
        />
      </div>
    </Field>
  );
}

function SelectInput({ label, required, children, ...props }) {
  return (
    <Field label={label} required={required}>
      <select className={inputCls} required={required} {...props}>
        {children}
      </select>
    </Field>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

const DoctorRegistration = () => {
  const router = useRouter();

  // ── Which top-level path?
  const [registrationPath, setRegistrationPath] = useState(""); // 'hospital' | 'individual'

  // ── Individual sub-type
  const [doctorType, setDoctorType] = useState("self_clinic"); // 'self_clinic' | 'freelancer'

  // ── Common fields
  const [common, setCommon] = useState({
    full_name: "",
    email: "",
    phone: "+91",
    medical_council_registration_number: "",
    medical_council: "",
    degree: "",
    specialization: "",
    experience_years: "",
    consultation_fee: "",
    languages: "",
    bio: "",
  });

  // ── Hospital path
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [hospitalResults, setHospitalResults] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [hospitalSearching, setHospitalSearching] = useState(false);
  const hospitalSearchTimer = useRef(null);
  const hospitalDropdownRef = useRef(null);

  // ── Self-clinic fields
  const [clinic, setClinic] = useState({
    clinic_name: "",
    clinic_address: "",
    clinic_city: "",
    clinic_state: "",
    clinic_pincode: "",
    clinic_phone: "+91",
    clinic_gst: "",
  });

  // ── Freelancer fields
  const [freelancer, setFreelancer] = useState({
    service_areas: "",
    available_for_home_visits: false,
  });

  // ── Documents
  const [docs, setDocs] = useState({
    degree_certificate: null,
    council_registration: null,
    id_proof: null,
    clinic_proof: null,
  });

  // ── UI state
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [doctorRefId, setDoctorRefId] = useState("");

  // ── Handlers
  const setCommonField = (e) =>
    setCommon((p) => ({ ...p, [e.target.name]: e.target.value }));

  const setClinicField = (e) =>
    setClinic((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleDocUpload = (key) => (e) => {
    const file = e.target.files?.[0];
    if (file) setDocs((p) => ({ ...p, [key]: file.name }));
  };

  // ── Hospital search (debounced, searches by name or registration number)
  const handleHospitalSearchChange = (e) => {
    const val = e.target.value;
    setHospitalSearch(val);
    setSelectedHospital(null);
    setHospitalId("");
    if (hospitalSearchTimer.current) clearTimeout(hospitalSearchTimer.current);
    if (!val.trim()) {
      setHospitalResults([]);
      setShowHospitalDropdown(false);
      return;
    }
    setHospitalSearching(true);
    hospitalSearchTimer.current = setTimeout(async () => {
      try {
        // Use relative URL so it always hits the Next.js server (same process as devDataStore),
        // regardless of NEXT_PUBLIC_API_URL pointing to an Express backend.
        const res = await fetch(`/api/hospitals/search?q=${encodeURIComponent(val.trim())}`);
        const json = await res.json();
        setHospitalResults(json.data || []);
        setShowHospitalDropdown(true);
      } catch (err) {
        console.error('[HospitalSearch] error:', err.message);
        setHospitalResults([]);
        setShowHospitalDropdown(true);
      } finally {
        setHospitalSearching(false);
      }
    }, 350);
  };

  const handleSelectHospital = (h) => {
    setSelectedHospital(h);
    setHospitalSearch(h.name);
    setHospitalId(h.id);
    setShowHospitalDropdown(false);
    setHospitalResults([]);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (hospitalDropdownRef.current && !hospitalDropdownRef.current.contains(e.target)) {
        setShowHospitalDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Validation
  const validate = () => {
    const c = common;
    if (!c.full_name.trim()) return "Full name is required.";
    if (!c.email.trim()) return "Email is required.";
    if (!c.phone.trim() || c.phone === "+91") return "Phone number is required.";
    if (!c.medical_council_registration_number.trim())
      return "Council registration number is required.";
    if (c.medical_council_registration_number.trim().length < 5)
      return "Council registration number must be at least 5 characters.";
    if (!c.medical_council) return "Medical council is required.";
    if (!c.degree) return "Degree is required.";
    if (!c.specialization.trim()) return "Specialization is required.";
    if (!c.consultation_fee) return "Consultation fee is required.";

    if (registrationPath === "hospital" && !selectedHospital) {
      return "Please select a hospital from the dropdown.";
    }

    if (registrationPath === "individual" && doctorType === "self_clinic") {
      if (!clinic.clinic_name.trim()) return "Clinic name is required.";
      if (!clinic.clinic_address.trim()) return "Clinic address is required.";
      if (!clinic.clinic_city.trim()) return "Clinic city is required.";
      if (!clinic.clinic_state) return "Clinic state is required.";
      if (!/^\d{6}$/.test(clinic.clinic_pincode))
        return "Clinic pincode must be 6 digits.";
      if (!clinic.clinic_phone.trim() || clinic.clinic_phone === "+91")
        return "Clinic phone is required.";
    }

    return null;
  };

  // ── Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const userId =
      (typeof window !== "undefined" && localStorage.getItem("mv_user_id")) ||
      "";

    const resolvedDoctorType =
      registrationPath === "hospital" ? "hospital" : doctorType;

    // Map frontend snake_case fields → backend camelCase fields
    const payload = {
      userId,
      doctorType: resolvedDoctorType,
      fullName: common.full_name,
      email: common.email,
      phone: common.phone,
      medicalCouncilRegNo: common.medical_council_registration_number,
      medicalCouncil: common.medical_council,
      degree: common.degree,
      specialization: common.specialization,
      experienceYears: common.experience_years,
      consultationFee: common.consultation_fee,
      languagesSpoken: common.languages
        ? common.languages.split(",").map((l) => l.trim()).filter(Boolean)
        : [],
      bio: common.bio,
      // Hospital path — use the selected hospital's actual ID
      ...(registrationPath === "hospital" && selectedHospital
        ? { hospitalId: selectedHospital.id, hospitalName: selectedHospital.name }
        : {}),
      // Self-clinic path
      ...(registrationPath === "individual" && doctorType === "self_clinic"
        ? {
            clinicName: clinic.clinic_name,
            clinicAddress: clinic.clinic_address,
            clinicCity: clinic.clinic_city,
            clinicState: clinic.clinic_state,
            clinicPincode: clinic.clinic_pincode,
            clinicPhone: clinic.clinic_phone,
            clinicGstin: clinic.clinic_gst,
          }
        : {}),
      // Freelancer path
      ...(registrationPath === "individual" && doctorType === "freelancer"
        ? {
            serviceAreas: freelancer.service_areas
              ? freelancer.service_areas.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            availableForHomeVisits: !!freelancer.available_for_home_visits,
          }
        : {}),
      // Documents as array of { type, fileName } entries
      documents: Object.entries(docs)
        .filter(([, v]) => v)
        .map(([type, fileName]) => ({ type, fileName })),
    };

    try {
      setLoading(true);
      const { data } = await apiClient.post("/doctor/register", payload);
      // Backend returns { success, data: { id, status } }
      const refId = data?.data?.id || data?.doctorId || data?.doctorID || data?.id || "PENDING";
      const doctorId = data?.data?.id || data?.doctorId || data?.doctorID;
      if (doctorId) {
        localStorage.setItem("mv_doctor_id", doctorId);
      }
      setDoctorRefId(refId);
      setSubmitted(true);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────────────────────────────────────

  if (submitted) {
    const isHospital = registrationPath === "hospital";
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
              <FiCheck className="h-10 w-10 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Submitted!
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            Your doctor registration has been received successfully.
          </p>

          {/* Status banner */}
          <div
            className={`rounded-xl px-4 py-3 mb-6 flex items-center gap-3 ${
              isHospital
                ? "bg-blue-50 border border-blue-200 text-blue-800"
                : "bg-amber-50 border border-amber-200 text-amber-800"
            }`}
          >
            <FiClock className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">
              {isHospital
                ? "Awaiting hospital verification — the affiliated hospital admin will review your application."
                : "Awaiting admin verification — our team will review and approve your profile."}
            </span>
          </div>

          {/* Ref ID */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-8 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Doctor Reference ID</p>
            <p className="text-lg font-bold text-cyan-700 tracking-wide font-mono">
              {doctorRefId}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Keep this for your records
            </p>
          </div>

          <Link href="/">
            <button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold py-3 rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all duration-200 shadow-md flex items-center justify-center gap-2">
              <FiArrowLeft className="h-4 w-4" />
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATH SELECTOR SCREEN
  // ─────────────────────────────────────────────────────────────────────────

  if (!registrationPath) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
                <FaUserMd className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Doctor Registration
            </h1>
            <p className="text-gray-500 text-sm">
              Choose how you practice medicine to get started
            </p>
          </div>

          <p className="text-sm font-semibold text-gray-700 mb-4 text-center">
            Select your registration type
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* Hospital-attached */}
            <button
              type="button"
              onClick={() => setRegistrationPath("hospital")}
              className="group flex flex-col items-center text-center p-6 border-2 border-gray-200 rounded-2xl hover:border-cyan-400 hover:bg-cyan-50 transition-all duration-200 hover:shadow-md"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                <FaHospital className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">
                Hospital-Attached
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                I work at or want to affiliate with a registered hospital on
                MediVault.
              </p>
            </button>

            {/* Individual */}
            <button
              type="button"
              onClick={() => setRegistrationPath("individual")}
              className="group flex flex-col items-center text-center p-6 border-2 border-gray-200 rounded-2xl hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 hover:shadow-md"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                <FaStethoscope className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">
                Individual Practice
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                I run my own clinic or practice independently as a freelancer.
              </p>
            </button>
          </div>

          <div className="text-center">
            <Link href="/">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto transition-colors"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN REGISTRATION FORM
  // ─────────────────────────────────────────────────────────────────────────

  const isHospitalPath = registrationPath === "hospital";
  const isSelfClinic =
    registrationPath === "individual" && doctorType === "self_clinic";
  const isFreelancer =
    registrationPath === "individual" && doctorType === "freelancer";

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-800 to-blue-900 py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl mx-auto p-8">
        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRegistrationPath("")}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center shadow">
              {isHospitalPath ? (
                <FaHospital className="h-4 w-4 text-white" />
              ) : (
                <FaStethoscope className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {isHospitalPath
                  ? "Hospital-Attached Doctor Registration"
                  : "Individual Doctor Registration"}
              </h1>
              <p className="text-xs text-gray-400">
                {isHospitalPath
                  ? "Affiliated with a hospital"
                  : doctorType === "self_clinic"
                  ? "Self Clinic"
                  : "Freelancer"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Individual sub-type selector ── */}
        {!isHospitalPath && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              I practice as:
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    doctorType === "self_clinic"
                      ? "border-cyan-500 bg-cyan-500"
                      : "border-gray-300 group-hover:border-cyan-400"
                  }`}
                >
                  {doctorType === "self_clinic" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <input
                  type="radio"
                  name="doctorType"
                  value="self_clinic"
                  className="sr-only"
                  checked={doctorType === "self_clinic"}
                  onChange={() => setDoctorType("self_clinic")}
                />
                <span className="text-sm text-gray-700 font-medium">
                  Self Clinic Owner
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    doctorType === "freelancer"
                      ? "border-teal-500 bg-teal-500"
                      : "border-gray-300 group-hover:border-teal-400"
                  }`}
                >
                  {doctorType === "freelancer" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <input
                  type="radio"
                  name="doctorType"
                  value="freelancer"
                  className="sr-only"
                  checked={doctorType === "freelancer"}
                  onChange={() => setDoctorType("freelancer")}
                />
                <span className="text-sm text-gray-700 font-medium">
                  Freelancer
                </span>
              </label>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ══════════════════════════════════════════════
              SECTION 1 — Personal Information
          ══════════════════════════════════════════════ */}
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
              <FiUser className="h-4 w-4 text-cyan-500" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <TextInput
                  label="Full Name"
                  required
                  name="full_name"
                  type="text"
                  value={common.full_name}
                  onChange={setCommonField}
                  placeholder="Dr. Priya Sharma"
                  icon={FiUser}
                />
              </div>
              <TextInput
                label="Email Address"
                required
                name="email"
                type="email"
                value={common.email}
                onChange={setCommonField}
                placeholder="doctor@example.com"
                icon={FiMail}
              />
              <TextInput
                label="Phone Number"
                required
                name="phone"
                type="tel"
                value={common.phone}
                onChange={setCommonField}
                placeholder="+91XXXXXXXXXX"
                icon={FiPhone}
              />
            </div>
          </section>

          {/* ══════════════════════════════════════════════
              SECTION 2 — Credentials
          ══════════════════════════════════════════════ */}
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
              <MdMedicalServices className="h-4 w-4 text-cyan-500" />
              Professional Credentials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Council Registration Number"
                required
                name="medical_council_registration_number"
                type="text"
                value={common.medical_council_registration_number}
                onChange={setCommonField}
                placeholder="MCI-XXXXXXXX"
                icon={FiHash}
              />
              <SelectInput
                label="Medical Council"
                required
                name="medical_council"
                value={common.medical_council}
                onChange={setCommonField}
              >
                <option value="">Select council…</option>
                {MEDICAL_COUNCILS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
              <SelectInput
                label="Degree / Qualification"
                required
                name="degree"
                value={common.degree}
                onChange={setCommonField}
              >
                <option value="">Select degree…</option>
                {DEGREES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </SelectInput>
              <TextInput
                label="Specialization"
                required
                name="specialization"
                type="text"
                value={common.specialization}
                onChange={setCommonField}
                placeholder="e.g. Cardiologist"
                icon={FaStethoscope}
              />
              <TextInput
                label="Years of Experience"
                name="experience_years"
                type="number"
                min="0"
                value={common.experience_years}
                onChange={setCommonField}
                placeholder="0"
                icon={FiBriefcase}
              />
              {/* Consultation fee with ₹ prefix */}
              <Field label="Consultation Fee (₹)" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                    ₹
                  </span>
                  <input
                    className={inputCls + " pl-8"}
                    type="number"
                    name="consultation_fee"
                    min="0"
                    value={common.consultation_fee}
                    onChange={setCommonField}
                    placeholder="500"
                    required
                  />
                </div>
              </Field>
              <div className="sm:col-span-2">
                <TextInput
                  label="Languages Spoken"
                  name="languages"
                  type="text"
                  value={common.languages}
                  onChange={setCommonField}
                  placeholder="English, Hindi, Marathi (comma-separated)"
                />
              </div>
              {/* Bio with counter */}
              <div className="sm:col-span-2">
                <Field label="Bio / Professional Summary">
                  <textarea
                    name="bio"
                    className={inputCls}
                    rows={4}
                    maxLength={500}
                    value={common.bio}
                    onChange={setCommonField}
                    placeholder="Briefly describe your background, expertise, and approach to patient care…"
                  />
                  <p className="text-xs text-right text-gray-400 mt-1">
                    {common.bio.length} / 500
                  </p>
                </Field>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════
              SECTION 3 — Hospital Path
          ══════════════════════════════════════════════ */}
          {isHospitalPath && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
                <MdLocalHospital className="h-4 w-4 text-cyan-500" />
                Hospital Affiliation
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Search and select hospital" required>
                  <div className="relative" ref={hospitalDropdownRef}>
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        className={inputCls + " pl-10 pr-10"}
                        type="text"
                        value={hospitalSearch}
                        onChange={handleHospitalSearchChange}
                        onFocus={() => hospitalResults.length > 0 && setShowHospitalDropdown(true)}
                        placeholder="Search by hospital name or registration number…"
                        autoComplete="off"
                      />
                      {hospitalSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {selectedHospital && !hospitalSearching && (
                        <FiCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                      )}
                    </div>

                    {/* Dropdown results */}
                    {showHospitalDropdown && hospitalResults.length > 0 && (
                      <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                        {hospitalResults.map((h) => (
                          <li
                            key={h.id}
                            onMouseDown={() => handleSelectHospital(h)}
                            className="px-4 py-3 cursor-pointer hover:bg-cyan-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-1.5 bg-cyan-100 rounded-lg mt-0.5 flex-shrink-0">
                                <MdLocalHospital className="h-4 w-4 text-cyan-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{h.name}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                  <span className="font-mono">{h.id}</span>
                                  {h.registrationNumber && <span>· Reg: {h.registrationNumber}</span>}
                                  {h.city && (
                                    <span className="flex items-center gap-0.5">
                                      <FiMapPin className="h-3 w-3" />{h.city}{h.state ? `, ${h.state}` : ''}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {showHospitalDropdown && !hospitalSearching && hospitalResults.length === 0 && hospitalSearch.trim() && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-500 text-center">
                        No registered hospitals found for "{hospitalSearch}"
                      </div>
                    )}
                  </div>

                  {selectedHospital ? (
                    <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                      <FiCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-700">{selectedHospital.name}</span>
                        <span className="text-emerald-600 ml-1">· ID: {selectedHospital.id}</span>
                        {selectedHospital.registrationNumber && (
                          <span className="text-emerald-600 ml-1">· Reg: {selectedHospital.registrationNumber}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3 flex-shrink-0" />
                      Select a hospital — your affiliation request will be sent to the hospital for approval.
                    </p>
                  )}
                </Field>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════
              SECTION 3 — Self-Clinic Path
          ══════════════════════════════════════════════ */}
          {isSelfClinic && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
                <MdLocalHospital className="h-4 w-4 text-cyan-500" />
                Clinic Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <TextInput
                    label="Clinic Name"
                    required
                    name="clinic_name"
                    type="text"
                    value={clinic.clinic_name}
                    onChange={setClinicField}
                    placeholder="Sharma Medical Centre"
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextInput
                    label="Clinic Address"
                    required
                    name="clinic_address"
                    type="text"
                    value={clinic.clinic_address}
                    onChange={setClinicField}
                    placeholder="Street / area / landmark"
                  />
                </div>
                <TextInput
                  label="City"
                  required
                  name="clinic_city"
                  type="text"
                  value={clinic.clinic_city}
                  onChange={setClinicField}
                  placeholder="Mumbai"
                />
                <SelectInput
                  label="State"
                  required
                  name="clinic_state"
                  value={clinic.clinic_state}
                  onChange={setClinicField}
                >
                  <option value="">Select state…</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </SelectInput>
                <TextInput
                  label="Pincode"
                  required
                  name="clinic_pincode"
                  type="text"
                  maxLength={6}
                  value={clinic.clinic_pincode}
                  onChange={setClinicField}
                  placeholder="400001"
                  icon={FiHash}
                />
                <TextInput
                  label="Clinic Phone"
                  required
                  name="clinic_phone"
                  type="tel"
                  value={clinic.clinic_phone}
                  onChange={setClinicField}
                  placeholder="+91XXXXXXXXXX"
                  icon={FiPhone}
                />
                <div className="sm:col-span-2">
                  <TextInput
                    label="GST Number (optional)"
                    name="clinic_gst"
                    type="text"
                    maxLength={15}
                    value={clinic.clinic_gst}
                    onChange={setClinicField}
                    placeholder="22AAAAA0000A1Z5"
                    icon={FiHash}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════
              SECTION 3 — Freelancer Path
          ══════════════════════════════════════════════ */}
          {isFreelancer && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
                <FiBriefcase className="h-4 w-4 text-cyan-500" />
                Freelancer Details
              </h2>
              <div className="space-y-4">
                <TextInput
                  label="Service Areas"
                  name="service_areas"
                  type="text"
                  value={freelancer.service_areas}
                  onChange={(e) =>
                    setFreelancer((p) => ({
                      ...p,
                      service_areas: e.target.value,
                    }))
                  }
                  placeholder="Delhi, Noida, Gurugram (comma-separated cities / states)"
                />
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      freelancer.available_for_home_visits
                        ? "border-cyan-500 bg-cyan-500"
                        : "border-gray-300 group-hover:border-cyan-400"
                    }`}
                    onClick={() =>
                      setFreelancer((p) => ({
                        ...p,
                        available_for_home_visits: !p.available_for_home_visits,
                      }))
                    }
                  >
                    {freelancer.available_for_home_visits && (
                      <FiCheck className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={freelancer.available_for_home_visits}
                    onChange={() =>
                      setFreelancer((p) => ({
                        ...p,
                        available_for_home_visits: !p.available_for_home_visits,
                      }))
                    }
                  />
                  <span className="text-sm text-gray-700">
                    Available for home visits
                  </span>
                </label>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════
              SECTION 4 — Document Upload
          ══════════════════════════════════════════════ */}
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wide mb-1 pb-2 border-b border-gray-100">
              <FiUpload className="h-4 w-4 text-cyan-500" />
              Document Upload
            </h2>
            <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
              <MdHealthAndSafety className="h-3.5 w-3.5 text-cyan-400" />
              Document upload will be processed via IPFS — files are
              cryptographically secured and decentralised.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: "degree_certificate",
                  label: "Degree Certificate",
                },
                {
                  key: "council_registration",
                  label: "Council Registration Certificate",
                },
                { key: "id_proof", label: "Government ID Proof" },
                ...(isSelfClinic
                  ? [{ key: "clinic_proof", label: "Clinic Proof / Registration" }]
                  : []),
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-cyan-300 hover:bg-cyan-50 transition-all duration-200 cursor-pointer group"
                >
                  <label className="cursor-pointer block">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          docs[key]
                            ? "bg-teal-100"
                            : "bg-gray-100 group-hover:bg-cyan-100"
                        }`}
                      >
                        {docs[key] ? (
                          <FiCheck className="h-4 w-4 text-teal-600" />
                        ) : (
                          <FiUpload className="h-4 w-4 text-gray-400 group-hover:text-cyan-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">
                          {label}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {docs[key] ? docs[key] : "Click to upload (PDF / JPG)"}
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="sr-only"
                      onChange={handleDocUpload(key)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════
              SUBMIT
          ══════════════════════════════════════════════ */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold py-3.5 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Submitting Registration…
                </>
              ) : (
                <>
                  <MdVerifiedUser className="h-5 w-5" />
                  Submit Doctor Registration
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              By submitting, you confirm that all provided information is
              accurate and you agree to MediVault's professional standards.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorRegistration;

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  FiUser,
  FiEdit3,
  FiSave,
  FiX,
  FiMail,
  FiPhone,
  FiMapPin,
  FiShield,
  FiCamera,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiLogOut,
  FiUpload,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdVerifiedUser,
  MdMedicalServices,
  MdSchool,
  MdHealthAndSafety,
  MdSecurity,
  MdBiotech,
} from "react-icons/md";
import {
  FaUserMd,
  FaStethoscope,
  FaCertificate,
  FaClinicMedical,
} from "react-icons/fa";
import { Card, Button, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";

// ─── Indian States ────────────────────────────────────────────────────────────
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

// ─── Shared input class ───────────────────────────────────────────────────────
const inputCls =
  "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all";
const inputDisabledCls =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed";

// ─── Verification status badge ────────────────────────────────────────────────
const VerificationBadge = ({ status, verifiedBy }) => {
  if (status === "approved") {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <FiCheckCircle className="h-4 w-4" />
          Approved
        </span>
        {verifiedBy === "hospital" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <MdLocalHospital className="h-3.5 w-3.5" />
            Verified by Hospital
          </span>
        )}
        {verifiedBy === "admin" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <MdVerifiedUser className="h-3.5 w-3.5" />
            Verified by Platform
          </span>
        )}
      </div>
    );
  }
  if (status === "pending_hospital" || status === "pending_admin") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <FiClock className="h-4 w-4" />
        {status === "pending_hospital" ? "Pending Hospital Verification" : "Pending Admin Verification"}
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-200">
        <FiX className="h-4 w-4" />
        Rejected
      </span>
    );
  }
  if (status === "suspended") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-200">
        <FiAlertCircle className="h-4 w-4" />
        Suspended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200">
      <FiClock className="h-4 w-4" />
      Pending
    </span>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, editKey, editSection, onEdit, onSave, onCancel, saving }) => {
  const isEditing = editSection === editKey;
  return (
    <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-teal-600" />}
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? <LoadingSpinner size="small" /> : <FiSave className="h-4 w-4" />}
                Save
              </button>
              <button
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="h-4 w-4" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => onEdit(editKey)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors"
            >
              <FiEdit3 className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DoctorProfile = () => {
  const router = useRouter();
  const sigInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editSection, setEditSection] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state mirrors profile fields
  const [form, setForm] = useState({});

  // ── Load profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const doctorId = localStorage.getItem("mv_doctor_id");
        const userId = localStorage.getItem("mv_user_id");

        let data = null;

        if (doctorId) {
          try {
            const res = await apiClient.get(`/doctor/${doctorId}`);
            data = res.data?.data ?? res.data ?? null;
          } catch {
            // fall through to userId lookup
          }
        }

        if (!data && userId) {
          try {
            const res = await apiClient.get(`/doctor/by-user/${userId}`);
            data = res.data?.data ?? res.data ?? null;
          } catch {
            // no profile found
          }
        }

        if (data) {
          setProfile(data);
          setForm(buildForm(data));
        }
      } catch (err) {
        console.error("Failed to load doctor profile:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const buildForm = (d) => ({
    // Personal
    fullName: d.fullName || d.name || "",
    email: d.email || "",
    phone: d.phone || "",
    profilePhotoUrl: d.profilePhotoUrl || d.photoUrl || "",
    // Professional
    specialization: d.specialization || d.specialty || "",
    experienceYears: d.experienceYears ?? d.experience ?? "",
    bio: d.bio || "",
    consultationFee: d.consultationFee ?? d.fee ?? "",
    languages: Array.isArray(d.languages) ? d.languages.join(", ") : (d.languages || ""),
    // Clinic
    clinicName: d.clinicName || d.clinic?.name || "",
    clinicAddress: d.clinicAddress || d.clinic?.address || "",
    clinicCity: d.clinicCity || d.clinic?.city || "",
    clinicState: d.clinicState || d.clinic?.state || "",
    clinicPincode: d.clinicPincode || d.clinic?.pincode || "",
    clinicPhone: d.clinicPhone || d.clinic?.phone || "",
    gstin: d.gstin || d.clinic?.gstin || "",
    // Signature
    digitalSignatureUrl: d.digitalSignatureUrl || "",
  });

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (key) => {
    setEditSection(key);
    // Reset form from current profile so edits start fresh
    if (profile) setForm(buildForm(profile));
  };

  const handleCancel = () => {
    setEditSection(null);
    if (profile) setForm(buildForm(profile));
  };

  const handleSave = async (section) => {
    try {
      setSaving(true);
      const doctorId =
        profile?._id || profile?.id || localStorage.getItem("mv_doctor_id");
      if (!doctorId) throw new Error("No doctor ID");

      const payload = buildPayload(section);
      const res = await apiClient.put(`/doctor/${doctorId}`, payload);
      const updated = res.data?.data ?? res.data ?? profile;
      setProfile({ ...profile, ...updated });
      setForm(buildForm({ ...profile, ...updated }));
      setEditSection(null);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(err?.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const buildPayload = (section) => {
    switch (section) {
      case "personal":
        return {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          profilePhotoUrl: form.profilePhotoUrl,
        };
      case "professional":
        return {
          specialization: form.specialization,
          experienceYears: Number(form.experienceYears) || 0,
          bio: form.bio,
          consultationFee: Number(form.consultationFee) || 0,
          languagesSpoken: form.languages
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean),
        };
      case "clinic":
        return {
          clinicName: form.clinicName,
          clinicAddress: form.clinicAddress,
          clinicCity: form.clinicCity,
          clinicState: form.clinicState,
          clinicPincode: form.clinicPincode,
          clinicPhone: form.clinicPhone,
          gstin: form.gstin,
        };
      case "signature":
        return { digitalSignatureUrl: form.digitalSignatureUrl };
      default:
        return {};
    }
  };

  // ── Signature upload (base64 placeholder) ────────────────────────────────
  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      handleFieldChange("digitalSignatureUrl", ev.target.result);
      toast.success("Signature loaded. Click Save to persist.");
    };
    reader.readAsDataURL(file);
  };

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    [
      "mv_token",
      "mv_refresh",
      "mv_user_id",
      "mv_user_type",
      "mv_doctor_id",
      "mv_doctor_data",
    ].forEach((key) => localStorage.removeItem(key));
    router.push("/login");
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="p-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-2xl w-fit mx-auto mb-4">
            <FaUserMd className="h-12 w-12 text-white animate-pulse" />
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-medium">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="text-center py-12 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200">
          <FaUserMd className="h-16 w-16 text-teal-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Profile Not Found</h3>
          <p className="text-gray-500 mb-6">
            No doctor profile is associated with your account.
          </p>
          <Button onClick={() => router.push("/doctor/register")} className="bg-teal-600 hover:bg-teal-700">
            Register as Doctor
          </Button>
        </Card>
      </div>
    );
  }

  const isClinicType =
    profile.doctorType === "self_clinic" || profile.doctorType === "freelancer";
  const verifiedBy = profile.verifiedByHospital
    ? "hospital"
    : profile.verifiedByAdmin || profile.verifiedBy === "admin"
    ? "admin"
    : null;

  const isEditing = (key) => editSection === key;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-2xl p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white bg-opacity-20 rounded-2xl border border-white border-opacity-30 shadow-lg">
              <FaUserMd className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Dr. {profile.fullName || profile.name || "—"}
              </h1>
              <p className="text-teal-100 text-sm mb-2">
                {profile.specialization || profile.specialty || ""}
              </p>
              <VerificationBadge
                status={profile.status}
                verifiedBy={verifiedBy}
              />
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl text-white font-medium text-sm transition-all border border-white border-opacity-30"
          >
            <FiLogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Personal Info ───────────────────────────────────────────────────── */}
      <Section
        title="Personal Information"
        icon={FiUser}
        editKey="personal"
        editSection={editSection}
        onEdit={handleEdit}
        onSave={() => handleSave("personal")}
        onCancel={handleCancel}
        saving={saving}
      >
        {/* Profile photo placeholder */}
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-teal-100 to-cyan-100 border-2 border-teal-200 flex items-center justify-center overflow-hidden shadow">
            {form.profilePhotoUrl ? (
              <img
                src={form.profilePhotoUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUserMd className="h-10 w-10 text-teal-500" />
            )}
          </div>
          {isEditing("personal") && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Profile Photo URL</p>
              <input
                type="text"
                value={form.profilePhotoUrl}
                onChange={(e) => handleFieldChange("profilePhotoUrl", e.target.value)}
                placeholder="https://..."
                className={inputCls + " max-w-xs"}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Full Name
            </label>
            {isEditing("personal") ? (
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleFieldChange("fullName", e.target.value)}
                className={inputCls}
              />
            ) : (
              <p className="text-gray-800 font-medium">{profile.fullName || profile.name || "—"}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            {isEditing("personal") ? (
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className={inputCls}
              />
            ) : (
              <p className="text-gray-800 font-medium flex items-center gap-1.5">
                <FiMail className="h-4 w-4 text-gray-400" />
                {profile.email || "—"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Phone
            </label>
            {isEditing("personal") ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium bg-gray-100 border border-gray-300 px-3 py-2.5 rounded-xl">+91</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  className={inputCls}
                  placeholder="10-digit number"
                />
              </div>
            ) : (
              <p className="text-gray-800 font-medium flex items-center gap-1.5">
                <FiPhone className="h-4 w-4 text-gray-400" />
                {profile.phone ? `+91 ${profile.phone}` : "—"}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ── Professional Info ───────────────────────────────────────────────── */}
      <Section
        title="Professional Information"
        icon={FaStethoscope}
        editKey="professional"
        editSection={editSection}
        onEdit={handleEdit}
        onSave={() => handleSave("professional")}
        onCancel={handleCancel}
        saving={saving}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Specialization
            </label>
            {isEditing("professional") ? (
              <input
                type="text"
                value={form.specialization}
                onChange={(e) => handleFieldChange("specialization", e.target.value)}
                className={inputCls}
              />
            ) : (
              <p className="text-gray-800 font-medium">{profile.specialization || profile.specialty || "—"}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Experience (Years)
            </label>
            {isEditing("professional") ? (
              <input
                type="number"
                min="0"
                value={form.experienceYears}
                onChange={(e) => handleFieldChange("experienceYears", e.target.value)}
                className={inputCls}
              />
            ) : (
              <p className="text-gray-800 font-medium">
                {profile.experienceYears ?? profile.experience ?? "—"} yrs
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Bio
            </label>
            {isEditing("professional") ? (
              <div>
                <textarea
                  value={form.bio}
                  maxLength={500}
                  onChange={(e) => handleFieldChange("bio", e.target.value)}
                  rows={4}
                  className={inputCls + " resize-none"}
                  placeholder="Describe your expertise (max 500 characters)…"
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  {form.bio.length}/500
                </p>
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed">{profile.bio || "—"}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Consultation Fee
            </label>
            {isEditing("professional") ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium bg-gray-100 border border-gray-300 px-3 py-2.5 rounded-xl">₹</span>
                <input
                  type="number"
                  min="0"
                  value={form.consultationFee}
                  onChange={(e) => handleFieldChange("consultationFee", e.target.value)}
                  className={inputCls}
                  placeholder="500"
                />
              </div>
            ) : (
              <p className="text-gray-800 font-medium">
                {profile.consultationFee != null ? `₹ ${profile.consultationFee}` : "—"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Languages Spoken
            </label>
            {isEditing("professional") ? (
              <input
                type="text"
                value={form.languages}
                onChange={(e) => handleFieldChange("languages", e.target.value)}
                className={inputCls}
                placeholder="English, Hindi, Tamil…"
              />
            ) : (
              <p className="text-gray-800 font-medium">
                {Array.isArray(profile.languages)
                  ? profile.languages.join(", ")
                  : profile.languages || "—"}
              </p>
            )}
          </div>

          {/* Read-only fields */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Medical Council
            </label>
            <p className={inputDisabledCls}>{profile.medicalCouncil || "—"}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Registration Number
            </label>
            <p className={inputDisabledCls}>{profile.registrationNumber || profile.regNumber || "—"}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Degree
            </label>
            <p className={inputDisabledCls}>{profile.degree || profile.qualification || "—"}</p>
          </div>
        </div>
      </Section>

      {/* ── Clinic Info (only for self_clinic / freelancer) ─────────────────── */}
      {isClinicType && (
        <Section
          title="Clinic Information"
          icon={FaClinicMedical}
          editKey="clinic"
          editSection={editSection}
          onEdit={handleEdit}
          onSave={() => handleSave("clinic")}
          onCancel={handleCancel}
          saving={saving}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Clinic Name
              </label>
              {isEditing("clinic") ? (
                <input
                  type="text"
                  value={form.clinicName}
                  onChange={(e) => handleFieldChange("clinicName", e.target.value)}
                  className={inputCls}
                />
              ) : (
                <p className="text-gray-800 font-medium">{profile.clinicName || profile.clinic?.name || "—"}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Address
              </label>
              {isEditing("clinic") ? (
                <input
                  type="text"
                  value={form.clinicAddress}
                  onChange={(e) => handleFieldChange("clinicAddress", e.target.value)}
                  className={inputCls}
                />
              ) : (
                <p className="text-gray-800 font-medium flex items-center gap-1.5">
                  <FiMapPin className="h-4 w-4 text-gray-400 shrink-0" />
                  {profile.clinicAddress || profile.clinic?.address || "—"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                City
              </label>
              {isEditing("clinic") ? (
                <input
                  type="text"
                  value={form.clinicCity}
                  onChange={(e) => handleFieldChange("clinicCity", e.target.value)}
                  className={inputCls}
                />
              ) : (
                <p className="text-gray-800 font-medium">{profile.clinicCity || profile.clinic?.city || "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                State
              </label>
              {isEditing("clinic") ? (
                <select
                  value={form.clinicState}
                  onChange={(e) => handleFieldChange("clinicState", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select state…</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-800 font-medium">{profile.clinicState || profile.clinic?.state || "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Pincode
              </label>
              {isEditing("clinic") ? (
                <input
                  type="text"
                  value={form.clinicPincode}
                  onChange={(e) => handleFieldChange("clinicPincode", e.target.value)}
                  className={inputCls}
                  maxLength={6}
                  placeholder="6-digit pincode"
                />
              ) : (
                <p className="text-gray-800 font-medium">{profile.clinicPincode || profile.clinic?.pincode || "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Clinic Phone
              </label>
              {isEditing("clinic") ? (
                <input
                  type="tel"
                  value={form.clinicPhone}
                  onChange={(e) => handleFieldChange("clinicPhone", e.target.value)}
                  className={inputCls}
                />
              ) : (
                <p className="text-gray-800 font-medium flex items-center gap-1.5">
                  <FiPhone className="h-4 w-4 text-gray-400" />
                  {profile.clinicPhone || profile.clinic?.phone || "—"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                GSTIN
              </label>
              {isEditing("clinic") ? (
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => handleFieldChange("gstin", e.target.value.toUpperCase())}
                  className={inputCls}
                  placeholder="15-char GSTIN"
                  maxLength={15}
                />
              ) : (
                <p className="text-gray-800 font-medium">{profile.gstin || profile.clinic?.gstin || "—"}</p>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ── Digital Signature ───────────────────────────────────────────────── */}
      <Section
        title="Digital Signature"
        icon={FaCertificate}
        editKey="signature"
        editSection={editSection}
        onEdit={handleEdit}
        onSave={() => handleSave("signature")}
        onCancel={handleCancel}
        saving={saving}
      >
        <div className="space-y-4">
          {(form.digitalSignatureUrl || profile.digitalSignatureUrl) ? (
            <div className="border-2 border-dashed border-teal-200 rounded-xl p-4 bg-teal-50 flex items-center justify-center">
              <img
                src={form.digitalSignatureUrl || profile.digitalSignatureUrl}
                alt="Digital Signature"
                className="max-h-24 object-contain"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
              <FaCertificate className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No signature uploaded</p>
            </div>
          )}

          {isEditing("signature") && (
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="file"
                accept="image/*"
                ref={sigInputRef}
                className="hidden"
                onChange={handleSignatureUpload}
              />
              <button
                type="button"
                onClick={() => sigInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-teal-300 text-teal-700 rounded-xl text-sm font-medium hover:bg-teal-50 transition-colors"
              >
                <FiUpload className="h-4 w-4" />
                Upload Signature Image
              </button>
              <span className="text-xs text-gray-400">or enter URL below</span>
              <input
                type="text"
                value={form.digitalSignatureUrl}
                onChange={(e) => handleFieldChange("digitalSignatureUrl", e.target.value)}
                placeholder="https://..."
                className={inputCls + " flex-1 min-w-[200px]"}
              />
            </div>
          )}
        </div>
      </Section>
    </div>
  );
};

export default DoctorProfile;

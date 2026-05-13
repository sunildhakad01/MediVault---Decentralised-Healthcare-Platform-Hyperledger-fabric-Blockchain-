import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import {
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiEdit2,
  FiSave,
  FiX,
  FiLogOut,
  FiAlertCircle,
  FiShield,
} from "react-icons/fi";
import { MdBloodtype, MdEmergency, MdHealthAndSafety } from "react-icons/md";
import apiClient from "../../utils/api";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

const RELATIONSHIPS = [
  "Father",
  "Mother",
  "Spouse",
  "Sibling",
  "Son",
  "Daughter",
  "Friend",
  "Guardian",
  "Other",
];

const PHONE_RE = /^\+91[2-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;

const inputCls =
  "w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm";

const disabledInputCls =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 text-sm cursor-not-allowed";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert backend camelCase patient object → frontend snake_case profile shape.
 * Handles both direct Patient model rows and wrapped { success, data: {...} } responses.
 */
function normalizeProfile(raw) {
  if (!raw) return null;
  // Unwrap { success, data: {...} } if needed
  const d = raw.data && typeof raw.data === "object" && !Array.isArray(raw.data) ? raw.data : raw;
  const ec = d.emergencyContact || d.emergency_contact || {};
  return {
    id:              d.id            || null,
    patient_id:      d.uniquePatientId || d.unique_patient_id || d.id || null,
    full_name:       d.fullName      || d.full_name      || "",
    dob:             d.dob           || "",
    gender:          d.gender        || "",
    blood_group:     d.bloodGroup    || d.blood_group    || "",
    phone:           d.phone         || "",
    alternate_phone: d.alternatePhone|| d.alternate_phone|| "",
    email:           d.email         || "",
    aadhaar_last4:   d.aadhaarLast4  || d.aadhaar_last4  || "",
    address:         d.address       || "",
    city:            d.city          || "",
    state:           d.state         || "",
    pincode:         d.pincode       || "",
    emergency_contact: {
      name:          ec.name          || "",
      relationship:  ec.relation      || ec.relationship  || "",
      phone:         ec.phone         || "",
      alternate_phone: ec.alternatePhone || ec.alternate_phone || "",
    },
  };
}

/**
 * Convert frontend snake_case profile shape → camelCase payload for PUT /patient/profile.
 */
function toApiPayload(p) {
  return {
    fullName:      p.full_name,
    dob:           p.dob,
    gender:        p.gender,
    bloodGroup:    p.blood_group,
    phone:         p.phone,
    alternatePhone:p.alternate_phone,
    email:         p.email,
    aadhaarLast4:  p.aadhaar_last4,
    address:       p.address,
    city:          p.city,
    state:         p.state,
    pincode:       p.pincode,
    emergencyContact: {
      name:          p.emergency_contact?.name,
      relation:      p.emergency_contact?.relationship,
      phone:         p.emergency_contact?.phone,
      alternatePhone:p.emergency_contact?.alternate_phone,
    },
  };
}

/** Convert YYYY-MM-DD → DD/MM/YYYY for display */
function toDisplay(iso) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/** Convert DD/MM/YYYY → YYYY-MM-DD for storage */
function toISO(display) {
  if (!display) return "";
  const parts = display.split("/");
  if (parts.length !== 3) return display;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function getInitials(name) {
  if (!name) return "P";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const emptyProfile = () => ({
  full_name: "",
  dob: "",
  gender: "",
  blood_group: "",
  phone: "",
  alternate_phone: "",
  email: "",
  aadhaar_last4: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  emergency_contact: {
    name: "",
    relationship: "",
    phone: "",
    alternate_phone: "",
  },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm font-medium">Loading your profile…</p>
      </div>
    </div>
  );
}

function EmergencyNumbers() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-4">
      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-1">
        <FiAlertCircle className="w-3.5 h-3.5" /> Emergency Numbers
      </p>
      <ul className="space-y-1.5 text-sm text-gray-700">
        <li>🚑 Ambulance: <span className="font-bold text-red-600">108</span></li>
        <li>🚔 Police: <span className="font-bold text-red-600">100</span></li>
        <li>📞 National Health Helpline: <span className="font-bold text-red-600">104</span></li>
        <li>🆘 Women Helpline: <span className="font-bold text-red-600">1091</span></li>
      </ul>
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconColor = "text-cyan-600", editing, onEdit, onSave, onCancel, saving, children }) {
  return (
    <div className="rounded-2xl shadow-sm border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={onCancel}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FiX className="w-3 h-3" /> Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <FiSave className="w-3 h-3" />
                )}
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors"
            >
              <FiEdit2 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Register Form ─────────────────────────────────────────────────────────────

function RegisterForm({ onRegistered }) {
  const [form, setForm] = useState(emptyProfile());
  const [dobDisplay, setDobDisplay] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      if (path.startsWith("emergency_contact.")) {
        const key = path.replace("emergency_contact.", "");
        next.emergency_contact = { ...prev.emergency_contact, [key]: value };
      } else {
        next[path] = value;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!form.emergency_contact.name.trim()) {
      toast.error("Emergency contact name is required");
      return;
    }
    if (!form.emergency_contact.phone) {
      toast.error("Emergency contact phone is required");
      return;
    }
    if (!PHONE_RE.test(form.emergency_contact.phone)) {
      toast.error("Emergency contact phone must be in +91XXXXXXXXXX format");
      return;
    }
    if (form.phone && !PHONE_RE.test(form.phone)) {
      toast.error("Phone must be in +91XXXXXXXXXX format");
      return;
    }
    if (form.alternate_phone && !PHONE_RE.test(form.alternate_phone)) {
      toast.error("Alternate phone must be in +91XXXXXXXXXX format");
      return;
    }
    if (form.pincode && !PINCODE_RE.test(form.pincode)) {
      toast.error("Pincode must be 6 digits");
      return;
    }
    if (form.aadhaar_last4 && !/^\d{4}$/.test(form.aadhaar_last4)) {
      toast.error("Aadhaar last 4 digits must be exactly 4 digits");
      return;
    }

    const formWithDob = { ...form, dob: dobDisplay ? toISO(dobDisplay) : "" };
    const payload = {
      fullName:      formWithDob.full_name,
      dob:           formWithDob.dob,
      gender:        formWithDob.gender,
      bloodGroup:    formWithDob.blood_group,
      phone:         formWithDob.phone,
      alternatePhone:formWithDob.alternate_phone,
      email:         formWithDob.email,
      aadhaarLast4:  formWithDob.aadhaar_last4,
      address:       formWithDob.address,
      city:          formWithDob.city,
      state:         formWithDob.state,
      pincode:       formWithDob.pincode,
      emergencyContact: {
        name:          formWithDob.emergency_contact.name,
        relation:      formWithDob.emergency_contact.relationship,
        phone:         formWithDob.emergency_contact.phone,
        alternatePhone:formWithDob.emergency_contact.alternate_phone,
      },
    };
    setSubmitting(true);
    try {
      const token = localStorage.getItem("mv_token");
      const res = await apiClient.post("/patient/register", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Profile created successfully!");
      onRegistered(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="rounded-2xl shadow-sm border border-gray-100 bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-5 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MdHealthAndSafety className="w-5 h-5" /> Complete Your Profile
          </h2>
          <p className="text-teal-100 text-sm mt-1">Fill in your details to get started</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Info */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Personal Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *">
                <input className={inputCls} type="text" required placeholder="Rahul Sharma" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </Field>
              <Field label="Date of Birth (DD/MM/YYYY)">
                <input className={inputCls} type="text" placeholder="01/01/1990" value={dobDisplay} onChange={(e) => setDobDisplay(e.target.value)} />
              </Field>
              <Field label="Gender">
                <select className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Blood Group">
                <select className={inputCls} value={form.blood_group} onChange={(e) => set("blood_group", e.target.value)}>
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Phone (+91 format)">
                <input className={inputCls} type="text" placeholder="+919876543210" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Alternate Phone (optional)">
                <input className={inputCls} type="text" placeholder="+919876543211" value={form.alternate_phone} onChange={(e) => set("alternate_phone", e.target.value)} />
              </Field>
              <Field label="Email (optional)">
                <input className={inputCls} type="email" placeholder="rahul@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Last 4 digits of Aadhaar (optional)">
                <input className={inputCls} type="text" maxLength={4} placeholder="1234" value={form.aadhaar_last4} onChange={(e) => set("aadhaar_last4", e.target.value.replace(/\D/g, ""))} />
              </Field>
            </div>
          </div>

          {/* Address */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Address">
                  <textarea className={inputCls} rows={2} placeholder="House/Flat No, Street, Area" value={form.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
              </div>
              <Field label="City">
                <input className={inputCls} type="text" placeholder="Mumbai" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="State">
                <select className={inputCls} value={form.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Select state / UT</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Pincode">
                <input className={inputCls} type="text" maxLength={6} placeholder="400001" value={form.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} />
              </Field>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Emergency Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact Name *">
                <input className={inputCls} type="text" required placeholder="Priya Sharma" value={form.emergency_contact.name} onChange={(e) => set("emergency_contact.name", e.target.value)} />
              </Field>
              <Field label="Relationship">
                <select className={inputCls} value={form.emergency_contact.relationship} onChange={(e) => set("emergency_contact.relationship", e.target.value)}>
                  <option value="">Select relationship</option>
                  {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Phone *">
                <input className={inputCls} type="text" required placeholder="+919876543212" value={form.emergency_contact.phone} onChange={(e) => set("emergency_contact.phone", e.target.value)} />
              </Field>
              <Field label="Alternate Phone (optional)">
                <input className={inputCls} type="text" placeholder="+919876543213" value={form.emergency_contact.alternate_phone} onChange={(e) => set("emergency_contact.alternate_phone", e.target.value)} />
              </Field>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? "Creating Profile…" : "Create Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const PatientProfile = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [profile, setProfile] = useState(null);
  const [patientId, setPatientId] = useState(null);

  // Per-section editing state
  const [editSection, setEditSection] = useState(null); // 'personal' | 'address' | 'emergency'
  const [sectionSaving, setSectionSaving] = useState(false);

  // Draft state (only active while editing a section)
  const [draft, setDraft] = useState(null);
  const [dobDisplay, setDobDisplay] = useState("");

  // ── Fetch profile ────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("mv_token");
      const res = await apiClient.get("/patient/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const normalized = normalizeProfile(res.data);
      setProfile(normalized);
      setPatientId(normalized?.patient_id || null);
      setProfileExists(true);
    } catch (err) {
      if (err?.response?.status === 404) {
        setProfileExists(false);
        setProfile(null);
      } else {
        toast.error("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Sign out ─────────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    ["mv_token", "mv_refresh", "mv_user_id", "mv_user_type"].forEach((k) =>
      localStorage.removeItem(k)
    );
    router.push("/login");
  };

  // ── Registration callback ────────────────────────────────────────────────────
  const handleRegistered = (data) => {
    const normalized = normalizeProfile(data);
    setProfile(normalized);
    setPatientId(normalized?.patient_id || null);
    setProfileExists(true);
  };

  // ── Section edit helpers ─────────────────────────────────────────────────────
  const startEdit = (section) => {
    setDraft({
      ...profile,
      emergency_contact: { ...(profile.emergency_contact || {}) },
    });
    setDobDisplay(profile.dob ? toDisplay(profile.dob) : "");
    setEditSection(section);
  };

  const cancelEdit = () => {
    setEditSection(null);
    setDraft(null);
  };

  const setDraftField = (path, value) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (path.startsWith("emergency_contact.")) {
        const key = path.replace("emergency_contact.", "");
        next.emergency_contact = { ...prev.emergency_contact, [key]: value };
      } else {
        next[path] = value;
      }
      return next;
    });
  };

  const saveSection = async (section) => {
    // Validation
    if (section === "personal") {
      if (!draft.full_name?.trim()) {
        toast.error("Full name is required");
        return;
      }
      if (draft.phone && !PHONE_RE.test(draft.phone)) {
        toast.error("Phone must be in +91XXXXXXXXXX format");
        return;
      }
      if (draft.alternate_phone && !PHONE_RE.test(draft.alternate_phone)) {
        toast.error("Alternate phone must be in +91XXXXXXXXXX format");
        return;
      }
      if (draft.aadhaar_last4 && !/^\d{4}$/.test(draft.aadhaar_last4)) {
        toast.error("Aadhaar last 4 digits must be exactly 4 digits");
        return;
      }
    }
    if (section === "address") {
      if (draft.pincode && !PINCODE_RE.test(draft.pincode)) {
        toast.error("Pincode must be 6 digits");
        return;
      }
    }
    if (section === "emergency") {
      if (!draft.emergency_contact?.name?.trim()) {
        toast.error("Emergency contact name is required");
        return;
      }
      if (!draft.emergency_contact?.phone) {
        toast.error("Emergency contact phone is required");
        return;
      }
      if (!PHONE_RE.test(draft.emergency_contact.phone)) {
        toast.error("Emergency contact phone must be in +91XXXXXXXXXX format");
        return;
      }
      if (draft.emergency_contact.alternate_phone && !PHONE_RE.test(draft.emergency_contact.alternate_phone)) {
        toast.error("Emergency alternate phone must be in +91XXXXXXXXXX format");
        return;
      }
    }

    const draftWithDob = {
      ...draft,
      dob: dobDisplay ? toISO(dobDisplay) : (draft.dob || ""),
    };

    setSectionSaving(true);
    try {
      const token = localStorage.getItem("mv_token");
      const res = await apiClient.put("/patient/profile", toApiPayload(draftWithDob), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const normalized = normalizeProfile(res.data);
      setProfile(normalized);
      setPatientId(normalized?.patient_id || null);
      setEditSection(null);
      setDraft(null);
      toast.success("Saved successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Failed to save");
    } finally {
      setSectionSaving(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────────
  const displayVal = (val) => val || <span className="text-gray-400 italic">—</span>;

  // ── States ────────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  if (!profileExists) {
    return <RegisterForm onRegistered={handleRegistered} />;
  }

  const isEditing = (section) => editSection === section;
  const d = editSection ? draft : profile;
  const ec = d?.emergency_contact || {};

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MdHealthAndSafety className="w-6 h-6 text-cyan-500" />
            Patient Profile
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your personal and medical information</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="space-y-4">
          {/* Avatar + patient ID */}
          <div className="rounded-2xl shadow-sm border border-gray-100 bg-white p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-md">
              <span className="text-2xl font-bold text-white">
                {getInitials(profile.full_name)}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">{profile.full_name || "Patient"}</p>
            {patientId && (
              <p className="text-xs text-cyan-600 font-semibold mt-1 flex items-center justify-center gap-1">
                <FiShield className="w-3 h-3" /> Patient ID: {patientId}
              </p>
            )}
            {profile.blood_group && (
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-200">
                <MdBloodtype className="w-3.5 h-3.5" /> {profile.blood_group}
              </span>
            )}

            <button
              onClick={handleSignOut}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              <FiLogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>

          {/* Emergency numbers */}
          <EmergencyNumbers />
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* ── Personal Info Section ── */}
          <SectionCard
            title="Personal Information"
            icon={FiUser}
            iconColor="text-cyan-600"
            editing={isEditing("personal")}
            onEdit={() => startEdit("personal")}
            onSave={() => saveSection("personal")}
            onCancel={cancelEdit}
            saving={sectionSaving && isEditing("personal")}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *">
                {isEditing("personal") ? (
                  <input className={inputCls} type="text" value={draft.full_name} onChange={(e) => setDraftField("full_name", e.target.value)} placeholder="Rahul Sharma" />
                ) : (
                  <p className="text-sm text-gray-800 py-2">{displayVal(profile.full_name)}</p>
                )}
              </Field>

              <Field label="Date of Birth">
                {isEditing("personal") ? (
                  <input className={inputCls} type="text" placeholder="DD/MM/YYYY" value={dobDisplay} onChange={(e) => setDobDisplay(e.target.value)} />
                ) : (
                  <p className="text-sm text-gray-800 py-2">{profile.dob ? toDisplay(profile.dob) : displayVal("")}</p>
                )}
              </Field>

              <Field label="Gender">
                {isEditing("personal") ? (
                  <select className={inputCls} value={draft.gender} onChange={(e) => setDraftField("gender", e.target.value)}>
                    <option value="">Select gender</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                ) : (
                  <p className="text-sm text-gray-800 py-2">{displayVal(profile.gender)}</p>
                )}
              </Field>

              <Field label="Blood Group">
                {isEditing("personal") ? (
                  <select className={inputCls} value={draft.blood_group} onChange={(e) => setDraftField("blood_group", e.target.value)}>
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                ) : (
                  <p className="text-sm text-gray-800 py-2">{displayVal(profile.blood_group)}</p>
                )}
              </Field>

              <Field label="Phone (+91)">
                {isEditing("personal") ? (
                  <input
                    className={profile.phone ? disabledInputCls : inputCls}
                    type="text"
                    value={draft.phone}
                    readOnly={!!profile.phone}
                    onChange={(e) => !profile.phone && setDraftField("phone", e.target.value)}
                    placeholder="+919876543210"
                  />
                ) : (
                  <p className="text-sm text-gray-800 py-2 flex items-center gap-1.5">
                    <FiPhone className="w-3.5 h-3.5 text-gray-400" />{displayVal(profile.phone)}
                  </p>
                )}
              </Field>

              <Field label="Alternate Phone (optional)">
                {isEditing("personal") ? (
                  <input className={inputCls} type="text" value={draft.alternate_phone} onChange={(e) => setDraftField("alternate_phone", e.target.value)} placeholder="+919876543211" />
                ) : (
                  <p className="text-sm text-gray-800 py-2 flex items-center gap-1.5">
                    <FiPhone className="w-3.5 h-3.5 text-gray-400" />{displayVal(profile.alternate_phone)}
                  </p>
                )}
              </Field>

              <Field label="Email (optional)">
                {isEditing("personal") ? (
                  <input className={inputCls} type="email" value={draft.email} onChange={(e) => setDraftField("email", e.target.value)} placeholder="rahul@email.com" />
                ) : (
                  <p className="text-sm text-gray-800 py-2 flex items-center gap-1.5">
                    <FiMail className="w-3.5 h-3.5 text-gray-400" />{displayVal(profile.email)}
                  </p>
                )}
              </Field>

              <Field label="Last 4 digits of Aadhaar (optional)">
                {isEditing("personal") ? (
                  <input className={inputCls} type="text" maxLength={4} value={draft.aadhaar_last4} onChange={(e) => setDraftField("aadhaar_last4", e.target.value.replace(/\D/g, ""))} placeholder="1234" />
                ) : (
                  <p className="text-sm text-gray-800 py-2">{displayVal(profile.aadhaar_last4)}</p>
                )}
              </Field>
            </div>
          </SectionCard>

          {/* ── Address Section ── */}
          <SectionCard
            title="Address"
            icon={FiMapPin}
            iconColor="text-cyan-600"
            editing={isEditing("address")}
            onEdit={() => startEdit("address")}
            onSave={() => saveSection("address")}
            onCancel={cancelEdit}
            saving={sectionSaving && isEditing("address")}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Address">
                  {isEditing("address") ? (
                    <textarea className={inputCls} rows={2} value={draft.address} onChange={(e) => setDraftField("address", e.target.value)} placeholder="House/Flat No, Street, Area" />
                  ) : (
                    <p className="text-sm text-gray-800 py-2">{displayVal(profile.address)}</p>
                  )}
                </Field>
              </div>

              <Field label="City">
                {isEditing("address") ? (
                  <input className={inputCls} type="text" value={draft.city} onChange={(e) => setDraftField("city", e.target.value)} placeholder="Mumbai" />
                ) : (
                  <p className="text-sm text-gray-800 py-2">{displayVal(profile.city)}</p>
                )}
              </Field>

              <Field label="State">
                {isEditing("address") ? (
                  <select className={inputCls} value={draft.state} onChange={(e) => setDraftField("state", e.target.value)}>
                    <option value="">Select state / UT</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <p className="text-sm text-gray-800 py-2">{displayVal(profile.state)}</p>
                )}
              </Field>

              <Field label="Pincode">
                {isEditing("address") ? (
                  <input className={inputCls} type="text" maxLength={6} value={draft.pincode} onChange={(e) => setDraftField("pincode", e.target.value.replace(/\D/g, ""))} placeholder="400001" />
                ) : (
                  <p className="text-sm text-gray-800 py-2">{displayVal(profile.pincode)}</p>
                )}
              </Field>
            </div>
          </SectionCard>

          {/* ── Emergency Contact Section ── */}
          <SectionCard
            title="Emergency Contact"
            icon={MdEmergency}
            iconColor="text-red-500"
            editing={isEditing("emergency")}
            onEdit={() => startEdit("emergency")}
            onSave={() => saveSection("emergency")}
            onCancel={cancelEdit}
            saving={sectionSaving && isEditing("emergency")}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact Name *">
                {isEditing("emergency") ? (
                  <input className={inputCls} type="text" value={draft.emergency_contact?.name || ""} onChange={(e) => setDraftField("emergency_contact.name", e.target.value)} placeholder="Priya Sharma" />
                ) : (
                  <p className="text-sm text-gray-800 py-2">{displayVal(ec.name)}</p>
                )}
              </Field>

              <Field label="Relationship">
                {isEditing("emergency") ? (
                  <select className={inputCls} value={draft.emergency_contact?.relationship || ""} onChange={(e) => setDraftField("emergency_contact.relationship", e.target.value)}>
                    <option value="">Select relationship</option>
                    {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <p className="text-sm text-gray-800 py-2">{displayVal(ec.relationship)}</p>
                )}
              </Field>

              <Field label="Phone * (+91)">
                {isEditing("emergency") ? (
                  <input className={inputCls} type="text" value={draft.emergency_contact?.phone || ""} onChange={(e) => setDraftField("emergency_contact.phone", e.target.value)} placeholder="+919876543212" />
                ) : (
                  <p className="text-sm text-gray-800 py-2 flex items-center gap-1.5">
                    <FiPhone className="w-3.5 h-3.5 text-gray-400" />{displayVal(ec.phone)}
                  </p>
                )}
              </Field>

              <Field label="Alternate Phone (optional)">
                {isEditing("emergency") ? (
                  <input className={inputCls} type="text" value={draft.emergency_contact?.alternate_phone || ""} onChange={(e) => setDraftField("emergency_contact.alternate_phone", e.target.value)} placeholder="+919876543213" />
                ) : (
                  <p className="text-sm text-gray-800 py-2 flex items-center gap-1.5">
                    <FiPhone className="w-3.5 h-3.5 text-gray-400" />{displayVal(ec.alternate_phone)}
                  </p>
                )}
              </Field>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;

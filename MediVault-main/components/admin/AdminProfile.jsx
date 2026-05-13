import { useState, useEffect } from "react";
import {
  FiUser, FiMail, FiPhone, FiLock, FiCamera,
  FiSave, FiEye, FiEyeOff, FiShield,
} from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";
import { Card, Button, Input } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  ops_admin: "Operations Admin",
  billing_admin: "Billing Admin",
};

const PHONE_RE = /^[6-9]\d{9}$/;

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [form, setForm] = useState({ firstName: "", lastName: "", mobile: "" });
  const [pwForm, setPwForm] = useState({ currentPin: "", newPin: "", confirmPin: "" });
  const [showPins, setShowPins] = useState({ current: false, new: false, confirm: false });
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Try JWT-based profile fetch first
        const { data } = await apiClient.get("/admin/profile");
        if (data.success) {
          const p = data.data;
          setProfile(p);
          setForm({
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            mobile: p.mobile || "",
          });
        }
      } catch (_) {
        // Fallback to localStorage admin session
        try {
          const session = JSON.parse(localStorage.getItem("mv_admin_session") || "{}");
          setProfile({ email: session.email, role: session.role, firstName: session.name });
          setForm({ firstName: session.name || "", lastName: "", mobile: "" });
        } catch (__) {}
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return toast.error("Only JPG or PNG accepted");
    }
    if (file.size > 2 * 1024 * 1024) return toast.error("Photo must be under 2 MB");
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "profile");
      const { data } = await apiClient.post("/user/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.url) {
        await apiClient.put("/admin/profile", { photoUrl: data.url });
        setProfile((p) => ({ ...p, metadata: { ...(p?.metadata || {}), photoUrl: data.url } }));
        toast.success("Profile photo updated");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Photo upload failed");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (form.mobile && !PHONE_RE.test(form.mobile)) {
      return toast.error("Enter a valid 10-digit Indian mobile number");
    }
    setSaving(true);
    try {
      await apiClient.put("/admin/profile", {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobile: form.mobile.trim(),
      });
      // Update localStorage session name
      try {
        const session = JSON.parse(localStorage.getItem("mv_admin_session") || "{}");
        session.name = `${form.firstName} ${form.lastName}`.trim() || session.name;
        localStorage.setItem("mv_admin_session", JSON.stringify(session));
      } catch (_) {}
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPin) return toast.error("Enter your current PIN");
    if (pwForm.newPin.length < 4) return toast.error("New PIN must be at least 4 digits");
    if (pwForm.newPin !== pwForm.confirmPin) return toast.error("PINs do not match");
    setPasswordSaving(true);
    try {
      await apiClient.put("/admin/profile/password", {
        currentPin: pwForm.currentPin,
        newPin: pwForm.newPin,
      });
      setPwForm({ currentPin: "", newPin: "", confirmPin: "" });
      toast.success("PIN updated successfully");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update PIN");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const photoUrl = profile?.metadata?.photoUrl;
  const displayName = `${form.firstName} ${form.lastName}`.trim() || profile?.email || "Administrator";

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
          <MdAdminPanelSettings className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">
            {ROLE_LABELS[profile?.role] || profile?.role || "Administrator"}
          </p>
        </div>
      </div>

      {/* Section A — Personal Info */}
      <Card className="border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50">
        <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FiUser className="h-5 w-5 text-indigo-600" />
            Personal Information
          </h2>

          {/* Photo */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-indigo-200 shadow-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="h-10 w-10 text-indigo-400" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                {photoUploading ? (
                  <svg className="w-3 h-3 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <FiCamera className="h-3 w-3 text-white" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={photoUploading}
                />
              </label>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{displayName}</p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <p className="text-xs text-gray-400 mt-1">JPG or PNG, max 2 MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-500 bg-gray-50 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mobile Number (+91)
            </label>
            <div className="flex">
              <span className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-xl bg-gray-50 text-gray-500 text-sm font-medium">
                +91
              </span>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                placeholder="10-digit mobile"
                className="w-full border border-gray-300 rounded-r-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <Button
            type="submit"
            loading={saving}
            disabled={saving}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <FiSave className="h-4 w-4" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </Card>

      {/* Section B — Change PIN */}
      <Card className="border-2 border-amber-100 bg-gradient-to-br from-white to-amber-50">
        <form onSubmit={handleChangePassword} className="p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FiLock className="h-5 w-5 text-amber-600" />
            Change PIN
          </h2>

          {[
            { key: "currentPin", label: "Current PIN", ph: "Enter current PIN" },
            { key: "newPin", label: "New PIN (min 4 digits)", ph: "Enter new PIN" },
            { key: "confirmPin", label: "Confirm New PIN", ph: "Re-enter new PIN" },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPins[key.replace("Pin", "").replace("confirm", "confirm")] ? "text" : "password"}
                  value={pwForm[key]}
                  onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                  placeholder={ph}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 tracking-widest text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  maxLength={6}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPins((s) => ({
                    ...s,
                    [key === "currentPin" ? "current" : key === "newPin" ? "new" : "confirm"]:
                      !s[key === "currentPin" ? "current" : key === "newPin" ? "new" : "confirm"],
                  }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPins[key === "currentPin" ? "current" : key === "newPin" ? "new" : "confirm"]
                    ? <FiEyeOff className="h-5 w-5" />
                    : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          ))}

          <Button
            type="submit"
            loading={passwordSaving}
            disabled={passwordSaving}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <FiShield className="h-4 w-4" />
            {passwordSaving ? "Updating…" : "Update PIN"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

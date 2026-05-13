import { useState, useEffect, useCallback } from "react";
import {
  FiUsers, FiPlus, FiEdit2, FiTrash2, FiRefreshCw,
  FiCheck, FiX, FiMail, FiPhone, FiShield,
} from "react-icons/fi";
import { MdAdminPanelSettings, MdSupervisedUserCircle } from "react-icons/md";
import { Card, Button, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import { formatDateDMY } from "../../utils/helpers";
import toast from "react-hot-toast";

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin", desc: "Full access to all features" },
  { value: "ops_admin", label: "Operations Admin", desc: "Verify hospitals and doctors, manage patients, send announcements" },
  { value: "billing_admin", label: "Billing Admin", desc: "View billing and revenue data only" },
];

const ROLE_BADGE = {
  super_admin: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs",
  ops_admin: "bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs",
  billing_admin: "bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs",
};

const PHONE_RE = /^[6-9]\d{9}$/;

// ── Add/Edit Modal ─────────────────────────────────────────────────────────────

const AdminFormModal = ({ isOpen, onClose, onSave, editAdmin }) => {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", mobile: "", role: "ops_admin" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editAdmin) {
        setForm({
          firstName: editAdmin.firstName || "",
          lastName: editAdmin.lastName || "",
          email: editAdmin.email || "",
          mobile: editAdmin.mobile || "",
          role: editAdmin.role || "ops_admin",
        });
      } else {
        setForm({ firstName: "", lastName: "", email: "", mobile: "", role: "ops_admin" });
      }
    }
  }, [isOpen, editAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) return toast.error("First name is required");
    if (!editAdmin && !form.email.trim()) return toast.error("Email is required");
    if (form.mobile && !PHONE_RE.test(form.mobile)) return toast.error("Enter a valid 10-digit mobile number");
    setSaving(true);
    try {
      await onSave(form, editAdmin?.userId);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full z-10 border-2 border-indigo-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MdAdminPanelSettings className="h-6 w-6 text-indigo-600" />
            {editAdmin ? "Edit Sub-Admin" : "Add Sub-Admin"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="First name"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Last name"
              />
            </div>
          </div>

          {!editAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FiMail className="inline h-4 w-4 mr-1" />Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="admin@medivault.com"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FiPhone className="inline h-4 w-4 mr-1" />Mobile (+91)
            </label>
            <div className="flex">
              <span className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-xl bg-gray-50 text-gray-500 text-sm">+91</span>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                className="w-full border border-gray-300 rounded-r-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="10-digit mobile"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FiShield className="inline h-4 w-4 mr-1" />Role *
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((r) => (
                <label key={r.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.role === r.value ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={() => setForm((f) => ({ ...f, role: r.value }))}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{r.label}</p>
                    <p className="text-xs text-gray-500">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {!editAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
              A temporary PIN will be generated and sent to the admin&apos;s email address. They must change it on first login.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              type="submit"
              loading={saving}
              disabled={saving}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5"
            >
              {editAdmin ? "Save Changes" : "Create Admin"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminTeam() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [deactivating, setDeactivating] = useState(null);

  const currentUserId = typeof window !== "undefined"
    ? (JSON.parse(localStorage.getItem("mv_admin_session") || "{}")).userId
    : null;

  const currentRole = typeof window !== "undefined"
    ? (JSON.parse(localStorage.getItem("mv_admin_session") || "{}")).role
    : null;

  const isSuperAdmin = currentRole === "super_admin" || !currentRole; // legacy sessions default to super_admin

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/team");
      if (data.success) setAdmins(data.data || []);
    } catch (err) {
      toast.error("Failed to load admin team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, []);

  const handleSave = async (form, id) => {
    try {
      if (id) {
        await apiClient.put(`/admin/team/${id}`, { role: form.role });
        toast.success("Sub-admin updated");
      } else {
        await apiClient.post("/admin/team", form);
        toast.success("Sub-admin created. Credentials sent to email.");
      }
      fetchAdmins();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Action failed");
      throw err;
    }
  };

  const handleDeactivate = async (admin) => {
    if (!window.confirm(`Deactivate ${admin.firstName || admin.email}? They will lose admin access.`)) return;
    setDeactivating(admin.userId);
    try {
      await apiClient.delete(`/admin/team/${admin.userId}`);
      toast.success("Sub-admin deactivated");
      fetchAdmins();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to deactivate");
    } finally {
      setDeactivating(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
            <MdSupervisedUserCircle className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Team</h1>
            <p className="text-sm text-gray-500">{admins.length} admin(s) registered</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAdmins} className="flex items-center gap-2">
            <FiRefreshCw className="h-4 w-4" /> Refresh
          </Button>
          {isSuperAdmin && (
            <Button
              onClick={() => { setEditAdmin(null); setModalOpen(true); }}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center gap-2"
            >
              <FiPlus className="h-4 w-4" /> Add Admin
            </Button>
          )}
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Only Super Admins can create or modify admin accounts.
        </div>
      )}

      {/* Table */}
      <Card className="border-2 border-indigo-100 overflow-hidden" padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="large" />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FiUsers className="h-10 w-10 mb-3" />
            <p className="font-medium">No admins found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-800">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-800">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-800">Mobile</th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-800">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-800">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-indigo-800">Last Login</th>
                  {isSuperAdmin && (
                    <th className="text-right px-4 py-3 font-semibold text-indigo-800">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((admin) => {
                  const isSelf = admin.userId === currentUserId;
                  return (
                    <tr key={admin.userId} className={`hover:bg-gray-50 transition-colors ${!admin.isActive ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">
                          {[admin.firstName, admin.lastName].filter(Boolean).join(" ") || "—"}
                          {isSelf && <span className="ml-2 text-xs text-indigo-500">(you)</span>}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {admin.mobile ? `+91 ${admin.mobile}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={ROLE_BADGE[admin.role] || "bg-gray-200 text-gray-700 text-xs"}>
                          {ROLE_OPTIONS.find((r) => r.value === admin.role)?.label || admin.role || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {admin.isActive ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                            <FiCheck className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                            <FiX className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDateDMY(admin.lastLoginAt) || "Never"}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditAdmin(admin); setModalOpen(true); }}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit role"
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            {!isSelf && admin.isActive && (
                              <button
                                onClick={() => handleDeactivate(admin)}
                                disabled={deactivating === admin.userId}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Deactivate"
                              >
                                {deactivating === admin.userId
                                  ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                  : <FiTrash2 className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AdminFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditAdmin(null); }}
        onSave={handleSave}
        editAdmin={editAdmin}
      />
    </div>
  );
}

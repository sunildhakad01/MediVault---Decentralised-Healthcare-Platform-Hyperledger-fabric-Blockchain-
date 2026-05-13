import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiX,
  FiCheck,
  FiSettings,
  FiMail,
  FiAlertTriangle,
  FiDollarSign,
  FiClock,
} from "react-icons/fi";
import {
  MdAdminPanelSettings,
  MdHealthAndSafety,
  MdSecurity,
  MdMedicalServices,
  MdLocalHospital,
  MdNotifications,
} from "react-icons/md";
import {
  FaUserMd,
  FaShieldAlt,
  FaBriefcaseMedical,
} from "react-icons/fa";

import { Card, Button, Badge, Input } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "specializations", label: "Specializations", icon: MdMedicalServices },
  { id: "insurance", label: "Insurance Providers", icon: FaShieldAlt },
  { id: "slots", label: "Slot Config", icon: FiSettings },
  { id: "templates", label: "Notification Templates", icon: MdNotifications },
];

// ─── Inline editable row ──────────────────────────────────────────────────────

const EditableRow = ({ item, fields, onSave, onDelete, saving }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => {
    const initial = {};
    fields.forEach((f) => { initial[f.key] = item[f.key] || ""; });
    return initial;
  });
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    await onSave(item.id, form);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${item[fields[0].key]}"?`)) return;
    setDeleting(true);
    await onDelete(item.id);
    setDeleting(false);
  };

  if (editing) {
    return (
      <tr className="bg-teal-50">
        {fields.map((f) => (
          <td key={f.key} className="px-4 py-3">
            <input
              type={f.type || "text"}
              value={form[f.key]}
              onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-teal-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
              placeholder={f.placeholder || f.label}
            />
          </td>
        ))}
        <td className="px-4 py-3">
          <div className="flex items-center space-x-2 justify-end">
            <Button
              size="small"
              onClick={handleSave}
              loading={saving}
              disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-green-500 shadow-sm"
            >
              <FiSave className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="border-gray-300"
            >
              <FiX className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-teal-50 transition-colors duration-150">
      {fields.map((f) => (
        <td key={f.key} className="px-4 py-3 text-sm text-gray-800 font-medium">
          {item[f.key] || "—"}
        </td>
      ))}
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2 justify-end">
          <Button
            variant="outline"
            size="small"
            onClick={() => setEditing(true)}
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          >
            <FiEdit2 className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="small"
            onClick={handleDelete}
            loading={deleting}
            disabled={deleting}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <FiTrash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
};

// ─── Add row form ─────────────────────────────────────────────────────────────

const AddRowForm = ({ fields, onAdd, adding }) => {
  const [form, setForm] = useState(() => {
    const initial = {};
    fields.forEach((f) => { initial[f.key] = ""; });
    return initial;
  });
  const [open, setOpen] = useState(false);

  const handleAdd = async () => {
    // Basic validation: first field must be non-empty
    if (!form[fields[0].key]?.trim()) {
      toast.error(`${fields[0].label} is required.`);
      return;
    }
    const ok = await onAdd(form);
    if (ok) {
      setForm(() => {
        const initial = {};
        fields.forEach((f) => { initial[f.key] = ""; });
        return initial;
      });
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <Button
        size="small"
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-md"
      >
        <FiPlus className="h-4 w-4 mr-1" />
        Add New
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3 bg-teal-50 border-2 border-teal-200 rounded-xl p-4 mt-4">
      {fields.map((f) => (
        <div key={f.key} className="flex-1 min-w-[140px]">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            {f.label} {f.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={f.type || "text"}
            value={form[f.key]}
            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
            placeholder={f.placeholder || f.label}
            className="w-full px-3 py-2 border-2 border-teal-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      ))}
      <div className="flex items-center space-x-2 pb-0.5">
        <Button
          size="small"
          onClick={handleAdd}
          loading={adding}
          disabled={adding}
          className="bg-gradient-to-r from-emerald-500 to-green-500 shadow-sm"
        >
          <FiCheck className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
        <Button
          variant="outline"
          size="small"
          onClick={() => setOpen(false)}
          disabled={adding}
          className="border-gray-300"
        >
          <FiX className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

// ─── Generic CRUD Table ───────────────────────────────────────────────────────

const CrudTable = ({ title, icon: TitleIcon, items, fields, loading, onAdd, onSave, onDelete }) => {
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAdd = async (form) => {
    setAdding(true);
    const ok = await onAdd(form);
    setAdding(false);
    return ok;
  };

  const handleSave = async (id, form) => {
    setSaving(true);
    await onSave(id, form);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await onDelete(id);
  };

  return (
    <Card className="bg-white border-2 border-gray-100 shadow-xl overflow-hidden" padding="none">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-teal-50 to-emerald-50">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg">
            <TitleIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{items.length} record{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <AddRowForm fields={fields} onAdd={handleAdd} adding={adding} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="medium" />
          <span className="ml-3 text-gray-500 text-sm">Loading...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <TitleIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No records yet. Add one above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {fields.map((f) => (
                  <th key={f.key} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {f.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <EditableRow
                  key={item.id}
                  item={item}
                  fields={fields}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  saving={saving}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

// ─── Tab: Specializations ─────────────────────────────────────────────────────

const SpecializationsTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/config/specializations");
      const list = data?.specializations || data?.data || data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load specializations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleAdd = async (form) => {
    try {
      const { data } = await apiClient.post("/config/specializations", form);
      const newItem = data?.specialization || data?.data || { ...form, id: Date.now() };
      setItems((prev) => [...prev, newItem]);
      toast.success("Specialization added.");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to add specialization.");
      return false;
    }
  };

  const handleSave = async (id, form) => {
    try {
      await apiClient.put(`/config/specializations/${id}`, form);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...form } : i)));
      toast.success("Specialization updated.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update specialization.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/config/specializations/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Specialization deleted.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to delete specialization.");
    }
  };

  const fields = [
    { key: "name", label: "Specialization Name", placeholder: "e.g. Cardiology", required: true },
  ];

  return (
    <CrudTable
      title="Medical Specializations"
      icon={MdMedicalServices}
      items={items}
      fields={fields}
      loading={loading}
      onAdd={handleAdd}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
};

// ─── Tab: Insurance Providers ─────────────────────────────────────────────────

const InsuranceTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/config/insurance-providers");
      const list = data?.providers || data?.data || data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load insurance providers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleAdd = async (form) => {
    try {
      const { data } = await apiClient.post("/config/insurance-providers", form);
      const newItem = data?.provider || data?.data || { ...form, id: Date.now() };
      setItems((prev) => [...prev, newItem]);
      toast.success("Insurance provider added.");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to add provider.");
      return false;
    }
  };

  const handleSave = async (id, form) => {
    try {
      await apiClient.put(`/config/insurance-providers/${id}`, form);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...form } : i)));
      toast.success("Insurance provider updated.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update provider.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/config/insurance-providers/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Insurance provider deleted.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to delete provider.");
    }
  };

  const fields = [
    { key: "name", label: "Provider Name", placeholder: "e.g. Star Health", required: true },
    { key: "contact", label: "Contact", placeholder: "+91 XXXXX XXXXX" },
    { key: "email", label: "Email", placeholder: "support@provider.com", type: "email" },
  ];

  return (
    <CrudTable
      title="Insurance Providers"
      icon={FaShieldAlt}
      items={items}
      fields={fields}
      loading={loading}
      onAdd={handleAdd}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
};

// ─── Tab: Slot Config ─────────────────────────────────────────────────────────

const SlotConfigTab = () => {
  const [slotDuration, setSlotDuration] = useState("30");
  const [platformFee, setPlatformFee] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState(false);
  const [savingFee, setSavingFee] = useState(false);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true);
        const [slotRes, feeRes] = await Promise.allSettled([
          apiClient.get("/config/system?key=slot_duration"),
          apiClient.get("/config/system?key=platform_fee"),
        ]);
        if (slotRes.status === "fulfilled") {
          const val = slotRes.value.data?.value ?? slotRes.value.data?.data?.value;
          if (val) setSlotDuration(String(val));
        }
        if (feeRes.status === "fulfilled") {
          const val = feeRes.value.data?.value ?? feeRes.value.data?.data?.value;
          if (val !== undefined) setPlatformFee(String(val));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  const handleSaveSlot = async () => {
    try {
      setSavingSlot(true);
      await apiClient.put("/config/system?key=slot_duration", { value: slotDuration });
      toast.success("Slot duration updated.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update slot duration.");
    } finally {
      setSavingSlot(false);
    }
  };

  const handleSaveFee = async () => {
    const fee = parseFloat(platformFee);
    if (isNaN(fee) || fee < 0) {
      toast.error("Enter a valid fee amount.");
      return;
    }
    try {
      setSavingFee(true);
      await apiClient.put("/config/system?key=platform_fee", { value: fee });
      toast.success("Platform fee updated.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update platform fee.");
    } finally {
      setSavingFee(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="medium" />
        <span className="ml-3 text-gray-500">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Slot Duration */}
      <Card className="bg-white border-2 border-gray-100 shadow-xl overflow-hidden" padding="none">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-emerald-50 flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg">
            <FiClock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Appointment Slot Duration</h3>
            <p className="text-xs text-gray-500">Time allocated per appointment slot</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            {["15", "20", "30"].map((mins) => (
              <label
                key={mins}
                className={`flex items-center space-x-3 cursor-pointer px-6 py-4 rounded-xl border-2 transition-all duration-200 flex-1 min-w-[100px] justify-center
                  ${slotDuration === mins
                    ? "border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50"
                  }`}
              >
                <input
                  type="radio"
                  name="slotDuration"
                  value={mins}
                  checked={slotDuration === mins}
                  onChange={() => setSlotDuration(mins)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 accent-teal-600"
                />
                <div className="text-center">
                  <span className={`text-2xl font-bold block ${slotDuration === mins ? "text-teal-700" : "text-gray-700"}`}>
                    {mins}
                  </span>
                  <span className={`text-xs font-medium ${slotDuration === mins ? "text-teal-600" : "text-gray-500"}`}>
                    minutes
                  </span>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSlot}
              loading={savingSlot}
              disabled={savingSlot}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-md"
            >
              <FiSave className="h-4 w-4 mr-2" />
              Save Slot Duration
            </Button>
          </div>
        </div>
      </Card>

      {/* Platform Fee */}
      <Card className="bg-white border-2 border-gray-100 shadow-xl overflow-hidden" padding="none">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg">
            <FiDollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Platform Fee</h3>
            <p className="text-xs text-gray-500">Fee charged per appointment (₹ INR)</p>
          </div>
        </div>
        <div className="p-6">
          <div className="max-w-xs mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Platform Fee (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-base">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                placeholder="e.g. 50"
                className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-300 rounded-xl shadow-sm text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>
            {platformFee && !isNaN(parseFloat(platformFee)) && (
              <p className="text-xs text-gray-500 mt-1">
                Patients will be charged ₹{parseFloat(platformFee).toFixed(2)} per booking.
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveFee}
              loading={savingFee}
              disabled={savingFee}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-md"
            >
              <FiSave className="h-4 w-4 mr-2" />
              Save Platform Fee
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── Tab: Notification Templates ──────────────────────────────────────────────

const TemplatesTab = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get("/config/templates");
        const list = data?.templates || data?.data || data || [];
        setTemplates(Array.isArray(list) ? list : []);
      } catch (err) {
        // Endpoint may not exist yet — show placeholder
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleEdit = (tpl) => {
    setEditingId(tpl.id);
    setEditBody(tpl.body || tpl.content || "");
  };

  const handleSave = async (id) => {
    try {
      setSaving(true);
      await apiClient.put(`/config/templates/${id}`, { body: editBody });
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, body: editBody, content: editBody } : t))
      );
      toast.success("Template updated.");
      setEditingId(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update template.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="medium" />
        <span className="ml-3 text-gray-500">Loading templates...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="bg-white border-2 border-gray-100 shadow-xl" padding="none">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg">
            <MdNotifications className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Notification Templates</h3>
        </div>
        <div className="text-center py-16">
          <div className="p-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full w-fit mx-auto mb-4">
            <MdNotifications className="h-10 w-10 text-indigo-400" />
          </div>
          <p className="text-lg font-bold text-gray-700 mb-2">No Templates Configured</p>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Notification templates will appear here once configured via the{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">/config/templates</code> API endpoint.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {templates.map((tpl) => (
        <Card key={tpl.id} className="bg-white border-2 border-gray-100 shadow-lg" padding="none">
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-md">
                <FiMail className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{tpl.name || tpl.type || `Template #${tpl.id}`}</h4>
                {tpl.event && (
                  <p className="text-xs text-gray-500">Event: {tpl.event}</p>
                )}
              </div>
            </div>
            {editingId !== tpl.id ? (
              <Button
                variant="outline"
                size="small"
                onClick={() => handleEdit(tpl)}
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <FiEdit2 className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  size="small"
                  onClick={() => handleSave(tpl.id)}
                  loading={saving}
                  disabled={saving}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 shadow-sm"
                >
                  <FiSave className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setEditingId(null)}
                  disabled={saving}
                  className="border-gray-300"
                >
                  <FiX className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          <div className="p-5">
            {editingId === tpl.id ? (
              <textarea
                rows={5}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
              />
            ) : (
              <pre className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap border border-gray-100 font-mono leading-relaxed">
                {tpl.body || tpl.content || "(empty template)"}
              </pre>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminConfig = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("specializations");

  const renderTab = () => {
    switch (activeTab) {
      case "specializations":
        return <SpecializationsTab />;
      case "insurance":
        return <InsuranceTab />;
      case "slots":
        return <SlotConfigTab />;
      case "templates":
        return <TemplatesTab />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 relative">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <FiSettings className="absolute top-20 right-20 h-32 w-32 text-teal-600 animate-pulse" />
        <FaBriefcaseMedical className="absolute bottom-20 left-20 h-24 w-24 text-emerald-600" />
      </div>

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 rounded-2xl p-8 text-white shadow-2xl border-2 border-teal-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-12 translate-y-12" />

        <div className="flex items-center justify-between mb-6 relative z-10 flex-wrap gap-4">
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
                <FiSettings className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
                  System Configuration
                  <MdHealthAndSafety className="h-7 w-7" />
                </h1>
                <p className="text-teal-100 text-base flex items-center gap-2">
                  <MdAdminPanelSettings className="h-4 w-4" />
                  Manage platform-wide settings and reference data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin badge */}
        <Card className="bg-white bg-opacity-10 border-white border-opacity-20 backdrop-blur-sm shadow-lg relative z-10" padding="none">
          <div className="p-5">
            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
              <div className="p-3 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl shadow-lg">
                <MdAdminPanelSettings className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-0.5 flex items-center gap-2">
                  <MdSecurity className="h-4 w-4" />
                  Admin Panel — System Configuration
                </h3>
                <p className="text-teal-100 font-medium text-sm">
                  Configure specializations, insurance, slot settings, and notification templates
                </p>
              </div>
              <div className="ml-auto">
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none shadow-md">
                  <FiSettings className="w-3.5 h-3.5 mr-1" />
                  Config Mode
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm border-2
              ${activeTab === id
                ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-transparent shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50"
              }`}
          >
            <TabIcon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div>{renderTab()}</div>
    </div>
  );
};

export default AdminConfig;

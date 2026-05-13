import { useState } from "react";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiPlus,
  FiX,
  FiCheckCircle,
  FiClock,
  FiList,
} from "react-icons/fi";
import { MdScience, MdAssignment } from "react-icons/md";
import LoadingSpinner from "../common/LoadingSpinner";

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMON_TESTS = [
  "CBC (Complete Blood Count)",
  "Blood Glucose Fasting",
  "HbA1c",
  "Lipid Profile",
  "Thyroid Function (TSH)",
  "Liver Function Tests (LFT)",
  "Kidney Function Tests (KFT)",
  "Urine Routine",
  "X-Ray Chest",
  "ECG",
  "Echocardiography",
  "CT Scan Head",
  "MRI Brain",
  "Ultrasound Abdomen",
  "Dengue NS1 Antigen",
  "Malaria Test",
  "COVID-19 RT-PCR",
];

const URGENCY_OPTIONS = [
  { value: "routine", label: "Routine", color: "text-gray-700" },
  { value: "urgent", label: "Urgent", color: "text-amber-700" },
  { value: "stat", label: "STAT", color: "text-red-700" },
];

const STATUS_BADGE = {
  ordered: "bg-gray-100 text-gray-700 border border-gray-300",
  sample_collected: "bg-amber-100 text-amber-700 border border-amber-300",
  processing: "bg-blue-100 text-blue-700 border border-blue-300",
  completed: "bg-green-100 text-green-700 border border-green-300",
  report_uploaded: "bg-emerald-100 text-emerald-700 border border-emerald-300",
};

const STATUS_LABELS = {
  ordered: "Ordered",
  sample_collected: "Sample Collected",
  processing: "Processing",
  completed: "Completed",
  report_uploaded: "Report Uploaded",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  "w-full border-2 border-teal-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-400 text-gray-900 bg-white text-sm transition-colors";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      STATUS_BADGE[status] || "bg-gray-100 text-gray-600 border border-gray-200"
    }`}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

// ─── Lab Order Card ───────────────────────────────────────────────────────────

const LabOrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border-2 border-teal-100 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow">
              <MdScience className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">
                Order #{order.id || order._id?.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(order.createdAt || order.orderedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={order.status} />
            {order.urgency && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  order.urgency === "stat"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : order.urgency === "urgent"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {order.urgency.toUpperCase()}
              </span>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
            >
              {expanded ? "Hide" : "Details"}
            </button>
          </div>
        </div>

        {/* Tests preview */}
        {order.tests && order.tests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {order.tests.slice(0, 3).map((t, i) => (
              <span
                key={i}
                className="bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full border border-teal-200"
              >
                {t}
              </span>
            ))}
            {order.tests.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-0.5">
                +{order.tests.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-teal-100 p-4 bg-gray-50 rounded-b-2xl space-y-3">
          {order.tests && order.tests.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">
                All Tests
              </p>
              <div className="flex flex-wrap gap-1.5">
                {order.tests.map((t, i) => (
                  <span
                    key={i}
                    className="bg-white text-teal-700 text-xs px-2.5 py-1 rounded-full border border-teal-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {order.clinicalNotes && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Clinical Notes
              </p>
              <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-xl p-3">
                {order.clinicalNotes}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {order.fastingRequired !== undefined && (
              <div className="bg-white border border-gray-200 rounded-xl p-2.5">
                <p className="text-xs text-gray-500">Fasting Required</p>
                <p className="font-semibold text-gray-900">
                  {order.fastingRequired ? "Yes" : "No"}
                </p>
              </div>
            )}
            {order.appointmentId && (
              <div className="bg-white border border-gray-200 rounded-xl p-2.5">
                <p className="text-xs text-gray-500">Appointment</p>
                <p className="font-semibold text-gray-900 truncate">
                  {order.appointmentId}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DoctorLabOrders = () => {
  // Search state
  const [searchPatientId, setSearchPatientId] = useState("");
  const [searching, setSearching] = useState(false);
  const [patientOrders, setPatientOrders] = useState(null);

  // New order form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    appointmentId: "",
    selectedTests: [],
    customTest: "",
    urgency: "routine",
    clinicalNotes: "",
    fastingRequired: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Search patient orders ────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchPatientId.trim()) {
      toast.error("Please enter a Patient ID");
      return;
    }
    try {
      setSearching(true);
      setPatientOrders(null);
      const { data } = await apiClient.get(
        `/lab-orders/patient/${searchPatientId.trim()}`
      );
      setPatientOrders(data?.data || data || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to fetch lab orders"
      );
      setPatientOrders([]);
    } finally {
      setSearching(false);
    }
  };

  // ── Form helpers ─────────────────────────────────────────────────────────────

  const toggleTest = (test) => {
    setForm((prev) => ({
      ...prev,
      selectedTests: prev.selectedTests.includes(test)
        ? prev.selectedTests.filter((t) => t !== test)
        : [...prev.selectedTests, test],
    }));
  };

  const addCustomTest = () => {
    const t = form.customTest.trim();
    if (!t) return;
    if (form.selectedTests.includes(t)) {
      toast.error("Test already added");
      return;
    }
    setForm((prev) => ({
      ...prev,
      selectedTests: [...prev.selectedTests, t],
      customTest: "",
    }));
  };

  const removeTest = (test) => {
    setForm((prev) => ({
      ...prev,
      selectedTests: prev.selectedTests.filter((t) => t !== test),
    }));
  };

  const resetForm = () => {
    setForm({
      patientId: "",
      appointmentId: "",
      selectedTests: [],
      customTest: "",
      urgency: "routine",
      clinicalNotes: "",
      fastingRequired: false,
    });
  };

  // ── Submit new order ─────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId.trim()) {
      toast.error("Patient ID is required");
      return;
    }
    if (form.selectedTests.length === 0) {
      toast.error("Please select at least one test");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/lab/orders", {
        patientId: form.patientId.trim(),
        appointmentId: form.appointmentId.trim() || undefined,
        tests: form.selectedTests,
        urgency: form.urgency,
        clinicalNotes: form.clinicalNotes.trim() || undefined,
        fastingRequired: form.fastingRequired,
      });
      toast.success("Lab order created successfully");
      resetForm();
      setShowForm(false);
      // If we were viewing this patient's orders, refresh them
      if (
        searchPatientId.trim() &&
        searchPatientId.trim() === form.patientId.trim()
      ) {
        handleSearch();
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to create lab order"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <MdScience className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Lab Orders</h1>
              <p className="text-teal-100 text-sm mt-1">
                Order and track diagnostic tests for patients
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm((v) => !v);
              if (!showForm) resetForm();
            }}
            className="flex items-center gap-2 bg-white text-teal-700 hover:bg-teal-50 font-semibold px-4 py-2.5 rounded-xl transition-colors shadow"
          >
            {showForm ? (
              <>
                <FiX className="h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <FiPlus className="h-4 w-4" /> New Lab Order
              </>
            )}
          </button>
        </div>
      </div>

      {/* New Lab Order Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-teal-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-teal-100 rounded-lg">
              <MdAssignment className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              New Lab Order
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Patient ID & Appointment ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Patient ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. PAT-00123"
                  value={form.patientId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, patientId: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Appointment ID{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. APT-00456"
                  value={form.appointmentId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      appointmentId: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Test selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Tests <span className="text-red-500">*</span>
              </label>

              {/* Selected tests chips */}
              {form.selectedTests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.selectedTests.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTest(t)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Common test checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto border-2 border-teal-100 rounded-xl p-3 bg-gray-50">
                {COMMON_TESTS.map((test) => (
                  <label
                    key={test}
                    className="flex items-center gap-2 cursor-pointer group py-1"
                  >
                    <input
                      type="checkbox"
                      checked={form.selectedTests.includes(test)}
                      onChange={() => toggleTest(test)}
                      className="w-4 h-4 accent-teal-500 rounded"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-teal-700 transition-colors">
                      {test}
                    </span>
                  </label>
                ))}
              </div>

              {/* Custom test input */}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Add custom test name…"
                  value={form.customTest}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      customTest: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomTest();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomTest}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <FiPlus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Urgency
              </label>
              <div className="flex gap-4">
                {URGENCY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={opt.value}
                      checked={form.urgency === opt.value}
                      onChange={() =>
                        setForm((prev) => ({ ...prev, urgency: opt.value }))
                      }
                      className="w-4 h-4 accent-teal-500"
                    />
                    <span
                      className={`text-sm font-semibold ${opt.color}`}
                    >
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clinical Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Clinical Notes{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Relevant clinical history, symptoms, suspected diagnosis…"
                value={form.clinicalNotes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    clinicalNotes: e.target.value,
                  }))
                }
              />
            </div>

            {/* Fasting required */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.fastingRequired}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    fastingRequired: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-teal-500 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">
                Fasting required before sample collection
              </span>
            </label>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="small" /> Submitting…
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="h-4 w-4" /> Create Lab Order
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Patient Orders */}
      <div className="bg-white rounded-2xl border-2 border-teal-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-lg">
            <FiList className="h-5 w-5 text-teal-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Patient Lab Orders
          </h2>
        </div>

        <div className="flex gap-3 mb-5">
          <input
            type="text"
            className={inputCls}
            placeholder="Enter Patient ID to search orders…"
            value={searchPatientId}
            onChange={(e) => setSearchPatientId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow"
          >
            {searching ? (
              <LoadingSpinner size="small" />
            ) : (
              <FiSearch className="h-4 w-4" />
            )}
            {searching ? "Searching…" : "Search"}
          </button>
        </div>

        {/* Results */}
        {patientOrders === null && !searching && (
          <div className="text-center py-10 text-gray-400">
            <FiSearch className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              Enter a Patient ID above to view their lab orders
            </p>
          </div>
        )}

        {searching && (
          <div className="flex items-center justify-center py-10">
            <LoadingSpinner size="large" />
          </div>
        )}

        {patientOrders !== null && !searching && (
          <>
            {patientOrders.length === 0 ? (
              <div className="text-center py-10">
                <div className="p-4 bg-teal-50 rounded-full w-fit mx-auto mb-3">
                  <MdScience className="h-8 w-8 text-teal-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  No lab orders found for this patient.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 font-medium">
                  {patientOrders.length} order
                  {patientOrders.length !== 1 ? "s" : ""} found
                </p>
                {patientOrders.map((order, i) => (
                  <LabOrderCard
                    key={order.id || order._id || i}
                    order={order}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorLabOrders;

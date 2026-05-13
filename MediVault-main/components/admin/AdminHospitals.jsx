import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiCheck,
  FiX,
  FiArrowLeft,
  FiRefreshCw,
  FiDownload,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiMapPin,
  FiFileText,
  FiAlertTriangle,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdVerifiedUser,
  MdPendingActions,
  MdAdminPanelSettings,
  MdHealthAndSafety,
  MdSecurity,
  MdBlock,
} from "react-icons/md";
import {
  FaHospital,
  FaHospitalUser,
  FaUserShield,
  FaIdCard,
} from "react-icons/fa";

import { Card, Button, Badge, Input, Select } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import { formatDateDMY } from "../../utils/helpers";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_TAB_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "approved":
      return "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none shadow-md";
    case "pending":
      return "bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-none shadow-md";
    case "rejected":
      return "bg-gradient-to-r from-red-500 to-rose-500 text-white border-none shadow-md";
    case "suspended":
      return "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-none shadow-md";
    default:
      return "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-none shadow-md";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "approved":
      return <MdVerifiedUser className="w-3 h-3 mr-1" />;
    case "pending":
      return <FiClock className="w-3 h-3 mr-1" />;
    case "rejected":
      return <FiX className="w-3 h-3 mr-1" />;
    case "suspended":
      return <MdBlock className="w-3 h-3 mr-1" />;
    default:
      return null;
  }
};

// ─── Confirmation Modal ───────────────────────────────────────────────────────

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel, confirmClass, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full z-10 border-2 border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-lg">
              <FiAlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              loading={loading}
              disabled={loading}
              className={confirmClass}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Reason Modal (Reject / Suspend) ─────────────────────────────────────────

const ReasonModal = ({ isOpen, onClose, onConfirm, title, confirmLabel, confirmClass, loading }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) { setReason(""); setError(""); }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }
    onConfirm(reason.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full z-10 border-2 border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl shadow-lg">
              <FiAlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(""); }}
              placeholder="Enter a detailed reason..."
              className={`w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 text-gray-900
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none
                ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300"}`}
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              loading={loading}
              disabled={loading}
              className={confirmClass}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Hospital Detail Modal ────────────────────────────────────────────────────

const HospitalDetailModal = ({
  isOpen,
  onClose,
  hospital,
  onApprove,
  onReject,
  onSuspend,
  onReinstate,
  actionLoading,
}) => {
  if (!isOpen || !hospital) return null;

  const { status } = hospital;
  const canApproveReject = status === "pending" || status === "rejected";
  const canSuspend = status === "approved";
  const canReinstate = status === "suspended";

  const docs = hospital.documents || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="inline-block align-bottom bg-gradient-to-br from-white to-teal-50 rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border-2 border-teal-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl shadow-lg">
                <MdLocalHospital className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Hospital Details
                  <MdHealthAndSafety className="h-6 w-6 text-teal-600" />
                </h3>
                <p className="text-gray-600">ID: #{hospital.id}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={onClose}
              className="border-2 border-gray-300 hover:bg-gray-50 shadow-md"
            >
              <FiX className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 shadow-xl" padding="none">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg">
                      <FaHospital className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Basic Information</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      ["Hospital Name", hospital.name],
                      ["Registration No.", hospital.registrationNumber],
                      ["License No.", hospital.licenseNumber],
                      ["GSTIN", hospital.gstin || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                        <span className="text-gray-600 font-medium text-sm">{label}:</span>
                        <span className="font-bold text-gray-900 text-sm">{value || "—"}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                      <span className="text-gray-600 font-medium text-sm">Status:</span>
                      <Badge className={getStatusBadgeClass(status)}>
                        {getStatusIcon(status)}
                        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Contact Info */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl" padding="none">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                      <FiMail className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Contact & Location</h4>
                  </div>
                  <div className="space-y-3">
                    {[
                      ["Email", hospital.email],
                      ["Phone", hospital.phone ? `+91 ${hospital.phone}` : "—"],
                      ["Working Hours", hospital.workingHours],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200 shadow-sm">
                        <span className="text-gray-600 font-medium text-sm">{label}:</span>
                        <span className="font-bold text-gray-900 text-sm">{value || "—"}</span>
                      </div>
                    ))}
                    <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-sm">
                      <p className="text-gray-600 font-medium text-sm mb-1">Address:</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {[hospital.address, hospital.city, hospital.state, hospital.pincode]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Status History */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl" padding="none">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                      <FiClock className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Status History</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium text-sm">Submitted:</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {formatDateDMY(hospital.createdAt || hospital.submittedAt)}
                        </span>
                      </div>
                    </div>
                    {hospital.reviewedAt && (
                      <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium text-sm">Reviewed:</span>
                          <span className="font-bold text-gray-900 text-sm">
                            {formatDateDMY(hospital.reviewedAt)}
                          </span>
                        </div>
                      </div>
                    )}
                    {hospital.rejectionReason && (
                      <div className="p-3 bg-red-50 rounded-xl border border-red-200 shadow-sm">
                        <p className="text-gray-600 font-medium text-sm mb-1">Rejection Reason:</p>
                        <p className="text-red-700 font-semibold text-sm">{hospital.rejectionReason}</p>
                      </div>
                    )}
                    {hospital.suspensionReason && (
                      <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 shadow-sm">
                        <p className="text-gray-600 font-medium text-sm mb-1">Suspension Reason:</p>
                        <p className="text-orange-700 font-semibold text-sm">{hospital.suspensionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Documents */}
              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-xl" padding="none">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                      <FiFileText className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">
                      Documents ({docs.length})
                    </h4>
                  </div>
                  {docs.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No documents uploaded.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {docs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-200 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <FiFileText className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-medium text-gray-700">
                              {doc.name || doc.type || `Document ${idx + 1}`}
                            </span>
                          </div>
                          {(doc.url || doc.path) && (
                            <a
                              href={doc.url || doc.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-teal-600 hover:text-teal-800 underline underline-offset-2"
                            >
                              View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-3 flex-wrap gap-y-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-2 border-gray-300 hover:bg-gray-50 shadow-md"
            >
              Close
            </Button>
            {canApproveReject && (
              <>
                <Button
                  onClick={() => onReject(hospital)}
                  loading={actionLoading}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-lg"
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => onApprove(hospital)}
                  loading={actionLoading}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg"
                >
                  <FiCheck className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            {canSuspend && (
              <Button
                onClick={() => onSuspend(hospital)}
                loading={actionLoading}
                disabled={actionLoading}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg"
              >
                <MdBlock className="h-4 w-4 mr-2" />
                Suspend
              </Button>
            )}
            {canReinstate && (
              <Button
                onClick={() => onReinstate(hospital)}
                loading={actionLoading}
                disabled={actionLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg"
              >
                <FiCheckCircle className="h-4 w-4 mr-2" />
                Reinstate
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminHospitals = () => {
  const router = useRouter();

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("all");

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Confirm approve / reinstate
  const [confirmModal, setConfirmModal] = useState({ open: false, hospital: null, type: "" });
  // Reason modal for reject / suspend
  const [reasonModal, setReasonModal] = useState({ open: false, hospital: null, type: "" });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchHospitals = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const { data } = await apiClient.get("/admin/hospitals");
      const list = data?.hospitals || data?.data || data || [];
      setHospitals(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching hospitals:", err);
      toast.error("Failed to load hospitals data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filteredHospitals = hospitals.filter((h) => {
    const matchStatus = statusTab === "all" || h.status === statusTab;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      (h.name || "").toLowerCase().includes(q) ||
      (h.registrationNumber || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const counts = {
    all: hospitals.length,
    pending: hospitals.filter((h) => h.status === "pending").length,
    approved: hospitals.filter((h) => h.status === "approved").length,
    rejected: hospitals.filter((h) => h.status === "rejected").length,
    suspended: hospitals.filter((h) => h.status === "suspended").length,
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleApproveConfirm = async () => {
    const hospital = confirmModal.hospital;
    try {
      setActionLoading(true);
      await apiClient.put(`/admin/hospitals/${hospital.id}/verify`, { action: "approve" });
      setHospitals((prev) =>
        prev.map((h) => (h.id === hospital.id ? { ...h, status: "approved" } : h))
      );
      toast.success(`${hospital.name} approved successfully!`);
      setConfirmModal({ open: false, hospital: null, type: "" });
      setDetailModalOpen(false);
    } catch (err) {
      console.error("Approve error:", err);
      toast.error(err?.response?.data?.error || "Failed to approve hospital.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason) => {
    const hospital = reasonModal.hospital;
    try {
      setActionLoading(true);
      await apiClient.put(`/admin/hospitals/${hospital.id}/verify`, {
        action: "reject",
        reason,
      });
      setHospitals((prev) =>
        prev.map((h) =>
          h.id === hospital.id ? { ...h, status: "rejected", rejectionReason: reason } : h
        )
      );
      toast.success(`${hospital.name} has been rejected.`);
      setReasonModal({ open: false, hospital: null, type: "" });
      setDetailModalOpen(false);
    } catch (err) {
      console.error("Reject error:", err);
      toast.error(err?.response?.data?.error || "Failed to reject hospital.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendConfirm = async (reason) => {
    const hospital = reasonModal.hospital;
    try {
      setActionLoading(true);
      await apiClient.put(`/admin/hospitals/${hospital.id}/verify`, {
        action: "suspend",
        reason,
      });
      setHospitals((prev) =>
        prev.map((h) =>
          h.id === hospital.id ? { ...h, status: "suspended", suspensionReason: reason } : h
        )
      );
      toast.success(`${hospital.name} has been suspended.`);
      setReasonModal({ open: false, hospital: null, type: "" });
      setDetailModalOpen(false);
    } catch (err) {
      console.error("Suspend error:", err);
      toast.error(err?.response?.data?.error || "Failed to suspend hospital.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReinstateConfirm = async () => {
    const hospital = confirmModal.hospital;
    try {
      setActionLoading(true);
      await apiClient.put(`/admin/hospitals/${hospital.id}/verify`, { action: "reinstate" });
      setHospitals((prev) =>
        prev.map((h) => (h.id === hospital.id ? { ...h, status: "approved", suspensionReason: null } : h))
      );
      toast.success(`${hospital.name} has been reinstated.`);
      setConfirmModal({ open: false, hospital: null, type: "" });
      setDetailModalOpen(false);
    } catch (err) {
      console.error("Reinstate error:", err);
      toast.error(err?.response?.data?.error || "Failed to reinstate hospital.");
    } finally {
      setActionLoading(false);
    }
  };

  // Dispatchers called from detail modal / row buttons
  const openApprove = (hospital) =>
    setConfirmModal({ open: true, hospital, type: "approve" });
  const openReject = (hospital) =>
    setReasonModal({ open: true, hospital, type: "reject" });
  const openSuspend = (hospital) =>
    setReasonModal({ open: true, hospital, type: "suspend" });
  const openReinstate = (hospital) =>
    setConfirmModal({ open: true, hospital, type: "reinstate" });

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="p-8 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-2xl">
              <MdLocalHospital className="h-16 w-16 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-teal-300 rounded-full animate-ping" />
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-6 text-gray-700 font-bold text-lg">Loading Hospitals Management...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching hospital verification queue</p>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 relative">
      {/* Decorative background icons */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <MdLocalHospital className="absolute top-20 right-20 h-32 w-32 text-teal-600 animate-pulse" />
        <FaHospital className="absolute bottom-20 left-20 h-24 w-24 text-emerald-600" />
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
                <MdLocalHospital className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
                  Hospital Verification
                  <MdHealthAndSafety className="h-7 w-7" />
                </h1>
                <p className="text-teal-100 text-base flex items-center gap-2">
                  <MdAdminPanelSettings className="h-4 w-4" />
                  Manage hospital registrations and approvals
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => fetchHospitals(true)}
              loading={refreshing}
              disabled={refreshing}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-opacity-30 backdrop-blur-sm shadow-lg"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary banner */}
        <Card className="bg-white bg-opacity-10 border-white border-opacity-20 backdrop-blur-sm shadow-lg relative z-10" padding="none">
          <div className="p-5">
            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
              <div className="p-3 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl shadow-lg">
                <MdAdminPanelSettings className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-0.5 flex items-center gap-2">
                  <MdSecurity className="h-4 w-4" />
                  Admin Panel — Hospital Management
                </h3>
                <p className="text-teal-100 font-medium text-sm">
                  Total Hospitals: {hospitals.length} &nbsp;|&nbsp; Pending: {counts.pending}
                </p>
              </div>
              <div className="ml-auto">
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none shadow-md">
                  <MdVerifiedUser className="w-4 h-4 mr-1" />
                  Admin Access
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { key: "all", label: "Total", icon: FaHospital, from: "teal-500", to: "cyan-500", text: "teal" },
          { key: "approved", label: "Approved", icon: MdVerifiedUser, from: "emerald-500", to: "green-500", text: "emerald" },
          { key: "pending", label: "Pending", icon: MdPendingActions, from: "yellow-400", to: "amber-500", text: "yellow" },
          { key: "rejected", label: "Rejected", icon: FiAlertCircle, from: "red-500", to: "rose-500", text: "red" },
          { key: "suspended", label: "Suspended", icon: MdBlock, from: "orange-500", to: "amber-600", text: "orange" },
        ].map(({ key, label, icon: Icon, from, to, text }) => (
          <Card
            key={key}
            className={`bg-gradient-to-br from-${text}-50 to-${text}-100 border-2 border-${text}-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${statusTab === key ? `ring-2 ring-${text}-400 ring-offset-2` : ""}`}
            padding="none"
            onClick={() => setStatusTab(key)}
          >
            <div className="text-center p-5">
              <div className={`p-3 bg-gradient-to-r from-${from} to-${to} rounded-2xl w-fit mx-auto mb-3 shadow-lg`}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <p className={`text-2xl font-bold text-${text}-600 mb-1`}>{counts[key]}</p>
              <p className="text-xs text-gray-600 font-medium">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Search & Filter ── */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl" padding="none">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-5">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
              <FiSearch className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Search & Filter</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Search Hospitals
              </label>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or registration number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-md"
                />
              </div>
            </div>
            {/* Status filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                <FiFilter className="h-4 w-4" /> Filter by Status
              </label>
              <Select
                value={statusTab}
                onChange={(e) => setStatusTab(e.target.value)}
                className="border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-md"
              >
                {STATUS_TAB_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Tab pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_TAB_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusTab(opt.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm border
                  ${statusTab === opt.value
                    ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-transparent shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:border-teal-400 hover:text-teal-700"
                  }`}
              >
                {opt.label} ({counts[opt.value] ?? 0})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Table ── */}
      <Card className="bg-white border-2 border-gray-100 shadow-xl overflow-hidden" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b-2 border-teal-100">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Hospital</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Docs</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHospitals.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="text-center py-16">
                      <div className="p-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full w-fit mx-auto mb-4 shadow-lg">
                        <FaHospital className="h-12 w-12 text-white" />
                      </div>
                      <p className="text-lg font-bold text-gray-700 mb-2">
                        {searchTerm || statusTab !== "all" ? "No Hospitals Found" : "No Hospitals Registered"}
                      </p>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        {searchTerm || statusTab !== "all"
                          ? "Try adjusting your search or filter criteria."
                          : "Hospitals will appear here once they register on the platform."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHospitals.map((hospital) => (
                  <tr
                    key={hospital.id}
                    className="hover:bg-teal-50 transition-colors duration-150"
                  >
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-xl flex-shrink-0">
                          <MdLocalHospital className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{hospital.name || "—"}</p>
                          <p className="text-xs text-gray-500 font-mono">{hospital.registrationNumber || "—"}</p>
                        </div>
                      </div>
                    </td>
                    {/* Location */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-gray-700 text-sm">
                        <FiMapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span>{[hospital.city, hospital.state].filter(Boolean).join(", ") || "—"}</span>
                      </div>
                    </td>
                    {/* Submitted */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {formatDateDMY(hospital.createdAt || hospital.submittedAt)}
                      </span>
                    </td>
                    {/* Documents */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <FiFileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">
                          {(hospital.documents || []).length}
                        </span>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge className={getStatusBadgeClass(hospital.status)}>
                        {getStatusIcon(hospital.status)}
                        {hospital.status
                          ? hospital.status.charAt(0).toUpperCase() + hospital.status.slice(1)
                          : "—"}
                      </Badge>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => {
                            setSelectedHospital(hospital);
                            setDetailModalOpen(true);
                          }}
                          className="border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 shadow-sm"
                        >
                          <FiEye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {(hospital.status === "pending" || hospital.status === "rejected") && (
                          <Button
                            size="small"
                            onClick={() => openApprove(hospital)}
                            disabled={actionLoading}
                            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-sm"
                          >
                            <FiCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {hospital.status === "approved" && (
                          <Button
                            size="small"
                            onClick={() => openSuspend(hospital)}
                            disabled={actionLoading}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm"
                          >
                            <MdBlock className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )}
                        {hospital.status === "suspended" && (
                          <Button
                            size="small"
                            onClick={() => openReinstate(hospital)}
                            disabled={actionLoading}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-sm"
                          >
                            <FiCheckCircle className="h-4 w-4 mr-1" />
                            Reinstate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Row count footer */}
        {filteredHospitals.length > 0 && (
          <div className="px-6 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-t border-teal-100 text-sm text-gray-600">
            Showing {filteredHospitals.length} of {hospitals.length} hospital{hospitals.length !== 1 ? "s" : ""}
          </div>
        )}
      </Card>

      {/* Pending alert banner */}
      {counts.pending > 0 && (
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-l-8 border-yellow-400 border-2 border-yellow-200 shadow-xl" padding="none">
          <div className="p-5">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl shadow-lg">
                <MdPendingActions className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-yellow-900 mb-1">
                  Pending Hospital Verifications
                </h3>
                <p className="text-yellow-700 text-sm leading-relaxed">
                  {counts.pending} hospital{counts.pending > 1 ? "s" : ""} awaiting verification. Review their documents and take action.
                </p>
              </div>
              <Button
                size="small"
                onClick={() => setStatusTab("pending")}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 shadow-lg flex-shrink-0"
              >
                <FiEye className="h-4 w-4 mr-2" />
                Review Pending
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Modals ── */}
      <HospitalDetailModal
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedHospital(null); }}
        hospital={selectedHospital}
        onApprove={openApprove}
        onReject={openReject}
        onSuspend={openSuspend}
        onReinstate={openReinstate}
        actionLoading={actionLoading}
      />

      <ConfirmModal
        isOpen={confirmModal.open && confirmModal.type === "approve"}
        onClose={() => setConfirmModal({ open: false, hospital: null, type: "" })}
        onConfirm={handleApproveConfirm}
        title="Approve Hospital"
        message={`Are you sure you want to approve "${confirmModal.hospital?.name}"? This will grant them access to the platform.`}
        confirmLabel="Approve"
        confirmClass="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={confirmModal.open && confirmModal.type === "reinstate"}
        onClose={() => setConfirmModal({ open: false, hospital: null, type: "" })}
        onConfirm={handleReinstateConfirm}
        title="Reinstate Hospital"
        message={`Are you sure you want to reinstate "${confirmModal.hospital?.name}"? They will regain full access to the platform.`}
        confirmLabel="Reinstate"
        confirmClass="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
        loading={actionLoading}
      />

      <ReasonModal
        isOpen={reasonModal.open && reasonModal.type === "reject"}
        onClose={() => setReasonModal({ open: false, hospital: null, type: "" })}
        onConfirm={handleRejectConfirm}
        title={`Reject — ${reasonModal.hospital?.name || "Hospital"}`}
        confirmLabel="Reject Hospital"
        confirmClass="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
        loading={actionLoading}
      />

      <ReasonModal
        isOpen={reasonModal.open && reasonModal.type === "suspend"}
        onClose={() => setReasonModal({ open: false, hospital: null, type: "" })}
        onConfirm={handleSuspendConfirm}
        title={`Suspend — ${reasonModal.hospital?.name || "Hospital"}`}
        confirmLabel="Suspend Hospital"
        confirmClass="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminHospitals;

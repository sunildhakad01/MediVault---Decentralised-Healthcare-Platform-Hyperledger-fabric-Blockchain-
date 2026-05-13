import { useState, useEffect, useCallback } from "react";
import {
  FiSearch, FiFilter, FiRefreshCw, FiDownload,
  FiChevronLeft, FiChevronRight, FiAlertCircle,
  FiClock, FiUser, FiTarget,
} from "react-icons/fi";
import { MdSecurity, MdAdminPanelSettings } from "react-icons/md";
import { Card, Button, Badge, Input, Select } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import { formatDateDMY } from "../../utils/helpers";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACTION_TYPES = [
  { value: "", label: "All Actions" },
  { value: "hospital_approve", label: "Hospital Approve" },
  { value: "hospital_reject", label: "Hospital Reject" },
  { value: "hospital_suspend", label: "Hospital Suspend" },
  { value: "hospital_reinstate", label: "Hospital Reinstate" },
  { value: "doctor_approve", label: "Doctor Approve" },
  { value: "doctor_reject", label: "Doctor Reject" },
  { value: "doctor_suspend", label: "Doctor Suspend" },
  { value: "doctor_force_suspend", label: "Doctor Force Suspend" },
  { value: "patient_status_change", label: "Patient Status Change" },
  { value: "patient_flagged", label: "Patient Flagged" },
  { value: "profile_updated", label: "Profile Updated" },
  { value: "password_changed", label: "Password Changed" },
  { value: "sub_admin_created", label: "Sub-Admin Created" },
  { value: "sub_admin_updated", label: "Sub-Admin Updated" },
  { value: "sub_admin_deactivated", label: "Sub-Admin Deactivated" },
  { value: "payment_retry", label: "Payment Retry" },
  { value: "announcement_sent", label: "Announcement Sent" },
];

const TARGET_TYPES = [
  { value: "", label: "All Types" },
  { value: "hospital", label: "Hospital" },
  { value: "doctor", label: "Doctor" },
  { value: "patient", label: "Patient" },
  { value: "admin", label: "Admin" },
  { value: "invoice", label: "Invoice" },
  { value: "config", label: "Config" },
];

const getActionBadgeClass = (action = "") => {
  if (action.includes("approve") || action.includes("reinstate")) {
    return "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none text-xs";
  }
  if (action.includes("reject") || action.includes("deactivat") || action.includes("suspend")) {
    return "bg-gradient-to-r from-red-500 to-rose-500 text-white border-none text-xs";
  }
  if (action.includes("flag") || action.includes("retry")) {
    return "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none text-xs";
  }
  return "bg-gradient-to-r from-slate-400 to-gray-500 text-white border-none text-xs";
};

const formatActionLabel = (action = "") =>
  action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatTimeIST = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
    timeZone: "Asia/Kolkata",
  }) + " IST";
};

// ── Log Detail Panel ──────────────────────────────────────────────────────────

const LogDetailPanel = ({ log, onClose }) => {
  if (!log) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full z-10 border-2 border-teal-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MdSecurity className="h-5 w-5 text-teal-600" />
            Audit Log Detail
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="space-y-3 text-sm">
          <Row label="Log ID" value={log.id} mono />
          <Row label="Admin ID" value={log.adminId} mono />
          <Row label="Action">
            <Badge className={getActionBadgeClass(log.action)}>{formatActionLabel(log.action)}</Badge>
          </Row>
          <Row label="Target Type" value={log.targetType || "—"} />
          <Row label="Target ID" value={log.targetId || "—"} mono />
          <Row label="IP Address" value={log.ipAddress || "—"} mono />
          <Row label="Date" value={`${formatDateDMY(log.createdAt)}  ${formatTimeIST(log.createdAt)}`} />
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-gray-500 font-medium mb-1">Metadata</p>
              <pre className="bg-gray-50 rounded-xl p-3 text-xs text-gray-800 overflow-auto max-h-48 border border-gray-200">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, children, mono }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-gray-500 font-medium shrink-0">{label}:</span>
    {children || (
      <span className={`text-gray-900 text-right break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    )}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const [filters, setFilters] = useState({
    action: "",
    targetType: "",
    adminId: "",
    from: "",
    to: "",
  });

  const LIMIT = 20;

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (filters.action) params.set("action", filters.action);
      if (filters.targetType) params.set("targetType", filters.targetType);
      if (filters.adminId) params.set("adminId", filters.adminId);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to + "T23:59:59");
      const { data } = await apiClient.get(`/admin/audit-logs?${params}`);
      if (data.success) {
        setLogs(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(p);
      }
    } catch (err) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLogs(1); }, []);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleExportCSV = () => {
    if (!logs.length) return toast.error("No logs to export");
    const headers = ["ID", "Admin ID", "Action", "Target Type", "Target ID", "IP Address", "Date"];
    const rows = logs.map((l) => [
      l.id, l.adminId, l.action, l.targetType || "", l.targetId || "",
      l.ipAddress || "", formatDateDMY(l.createdAt) + " " + formatTimeIST(l.createdAt),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl shadow-lg">
            <MdSecurity className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-500">{total.toLocaleString("en-IN")} total entries</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchLogs(page)} className="flex items-center gap-2">
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
            <FiDownload className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-2 border-teal-100">
        <form onSubmit={handleApplyFilters} className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
              className="text-sm"
            >
              {ACTION_TYPES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </Select>

            <Select
              value={filters.targetType}
              onChange={(e) => setFilters((f) => ({ ...f, targetType: e.target.value }))}
              className="text-sm"
            >
              {TARGET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>

            <input
              type="text"
              placeholder="Admin ID / email"
              value={filters.adminId}
              onChange={(e) => setFilters((f) => ({ ...f, adminId: e.target.value }))}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit" className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm px-4 py-2">
              <FiFilter className="h-4 w-4 mr-1" />
              Apply Filters
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-sm px-4 py-2"
              onClick={() => { setFilters({ action: "", targetType: "", adminId: "", from: "", to: "" }); setTimeout(() => fetchLogs(1), 0); }}
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card className="border-2 border-gray-100 overflow-hidden" padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="large" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FiAlertCircle className="h-10 w-10 mb-3" />
            <p className="font-medium">No audit logs found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-teal-800">
                    <div className="flex items-center gap-1"><FiClock className="h-3 w-3" /> Timestamp</div>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-teal-800">
                    <div className="flex items-center gap-1"><FiUser className="h-3 w-3" /> Admin</div>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-teal-800">Action</th>
                  <th className="text-left px-4 py-3 font-semibold text-teal-800">
                    <div className="flex items-center gap-1"><FiTarget className="h-3 w-3" /> Target</div>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-teal-800">IP</th>
                  <th className="text-right px-4 py-3 font-semibold text-teal-800">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{formatDateDMY(log.createdAt)}</p>
                      <p className="text-xs text-gray-500">{formatTimeIST(log.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-700 max-w-[120px] truncate">{log.adminId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getActionBadgeClass(log.action)}>
                        {formatActionLabel(log.action)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 capitalize">{log.targetType || "—"}</p>
                      {log.targetId && (
                        <p className="font-mono text-xs text-gray-400 max-w-[120px] truncate">{log.targetId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-500">{log.ipAddress || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-teal-600 hover:text-teal-800 text-xs underline font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total.toLocaleString("en-IN")} entries)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 text-sm"
            >
              <FiChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 text-sm"
            >
              Next <FiChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {selectedLog && (
        <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

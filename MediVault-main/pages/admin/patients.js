import { useEffect } from "react";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  FiSearch, FiRefreshCw, FiUser, FiCheck, FiX, FiFlag,
  FiChevronLeft, FiChevronRight, FiAlertCircle,
} from "react-icons/fi";
import { MdPersonalInjury } from "react-icons/md";
import { Card, Button, Badge } from "../../components/common";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import apiClient from "../../utils/api";
import { formatDateDMY } from "../../utils/helpers";
import toast from "react-hot-toast";

const STATUS_BADGE = {
  active: "bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs",
  inactive: "bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs",
  flagged: "bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs",
};

const STATUS_TABS = ["all", "active", "inactive", "flagged"];

export default function AdminPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const LIMIT = 25;

  useEffect(() => {
    const session = localStorage.getItem("mv_admin_session");
    if (!session) { router.replace("/admin/login"); return; }
  }, [router]);

  const fetchPatients = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (statusTab !== "all") params.set("status", statusTab);
      if (search.trim()) params.set("search", search.trim());
      const { data } = await apiClient.get(`/admin/patients?${params}`);
      if (data.success) {
        setPatients(data.data || []);
        setTotal(data.total || data.data?.length || 0);
        setPage(p);
      }
    } catch (err) {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(1); }, [statusTab]);

  const handleSearch = (e) => { e.preventDefault(); fetchPatients(1); };

  const handleStatusChange = async (patient, status) => {
    setActionLoading(patient.id + status);
    try {
      await apiClient.put(`/admin/patients/${patient.id}/status`, { status });
      setPatients((prev) => prev.map((p) => p.id === patient.id ? { ...p, status } : p));
      toast.success(`Patient ${status === "inactive" ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlag = async (patient) => {
    const reason = window.prompt("Enter flag reason:");
    if (!reason) return;
    setActionLoading(patient.id + "flag");
    try {
      await apiClient.put(`/admin/patients/${patient.id}/flag`, { flagReason: reason });
      setPatients((prev) => prev.map((p) => p.id === patient.id ? { ...p, status: "flagged" } : p));
      toast.success("Patient flagged for review");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to flag");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
            <MdPersonalInjury className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
            <p className="text-sm text-gray-500">{total.toLocaleString("en-IN")} total patients</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => fetchPatients(page)} className="flex items-center gap-2">
          <FiRefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusTab(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${statusTab === s ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Search */}
      <Card className="border-2 border-blue-100">
        <form onSubmit={handleSearch} className="p-4 flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email or Patient ID…"
              className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm px-4">
            Search
          </Button>
        </form>
      </Card>

      {/* Table */}
      <Card className="border-2 border-gray-100 overflow-hidden" padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16"><LoadingSpinner size="large" /></div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FiAlertCircle className="h-10 w-10 mb-3" />
            <p className="font-medium">No patients found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-blue-800">Patient ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-blue-800">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-blue-800">Gender</th>
                  <th className="text-left px-4 py-3 font-semibold text-blue-800">City / State</th>
                  <th className="text-left px-4 py-3 font-semibold text-blue-800">Registered</th>
                  <th className="text-left px-4 py-3 font-semibold text-blue-800">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-blue-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((pat) => (
                  <tr key={pat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{pat.uniquePatientId || pat.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <FiUser className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="font-semibold text-gray-900">{pat.fullName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{pat.gender || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {[pat.city, pat.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDateDMY(pat.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_BADGE[pat.status] || "bg-gray-200 text-gray-700 text-xs"}>
                        {pat.status || "unknown"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {pat.status !== "active" && (
                          <button
                            onClick={() => handleStatusChange(pat, "active")}
                            disabled={!!actionLoading}
                            title="Activate"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                          >
                            <FiCheck className="h-4 w-4" />
                          </button>
                        )}
                        {pat.status === "active" && (
                          <button
                            onClick={() => handleStatusChange(pat, "inactive")}
                            disabled={!!actionLoading}
                            title="Deactivate"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        )}
                        {pat.status !== "flagged" && (
                          <button
                            onClick={() => handleFlag(pat)}
                            disabled={!!actionLoading}
                            title="Flag"
                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50"
                          >
                            <FiFlag className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchPatients(page - 1)} disabled={page <= 1} className="flex items-center gap-1 text-sm">
              <FiChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" onClick={() => fetchPatients(page + 1)} disabled={page >= totalPages} className="flex items-center gap-1 text-sm">
              Next <FiChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

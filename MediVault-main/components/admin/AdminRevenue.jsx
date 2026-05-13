import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiArrowLeft,
  FiCheckCircle,
  FiFilter,
  FiPrinter,
  FiArrowRight,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdAttachMoney,
  MdPayment,
  MdErrorOutline,
} from "react-icons/md";
import { FaUserMd, FaHospital, FaStethoscope } from "react-icons/fa";
import { Card, Button, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";

// ─── Locale helpers ────────────────────────────────────────────────────────────

const fmtINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Parse DD/MM/YYYY → ISO yyyy-mm-dd for <input type="date">
const ddmmyyyyToIso = (str) => {
  if (!str) return "";
  const [dd, mm, yyyy] = str.split("/");
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy}-${mm}-${dd}`;
};

// ISO yyyy-mm-dd → DD/MM/YYYY display
const isoToDdmmyyyy = (str) => {
  if (!str) return "";
  const [yyyy, mm, dd] = str.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

// ─── Summary card ─────────────────────────────────────────────────────────────

const SummaryCard = ({ title, value, icon: Icon, color, sub, onClick }) => (
  <Card
    className={`bg-gradient-to-br from-${color}-50 to-${color}-100 border-2 border-${color}-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-default`}
    padding="none"
  >
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wider text-${color}-700 mb-1`}>
            {title}
          </p>
          <p className={`text-3xl font-bold text-${color}-600 truncate`}>{value}</p>
          {sub && (
            <div className="mt-2">
              {onClick ? (
                <button
                  onClick={onClick}
                  className={`text-xs font-semibold text-${color}-700 underline underline-offset-2 hover:text-${color}-900 transition-colors`}
                >
                  {sub}
                </button>
              ) : (
                <p className={`text-xs font-medium text-${color}-600`}>{sub}</p>
              )}
            </div>
          )}
        </div>
        <div
          className={`ml-4 p-4 rounded-2xl bg-gradient-to-br from-${color}-500 to-${color}-600 text-white shadow-lg flex-shrink-0`}
        >
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  </Card>
);

// ─── Section heading ──────────────────────────────────────────────────────────

const SectionHeading = ({ icon: Icon, title, color = "teal", badge }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className={`p-2 rounded-xl bg-${color}-100`}>
      <Icon className={`h-5 w-5 text-${color}-600`} />
    </div>
    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    {badge !== undefined && (
      <Badge variant="danger" size="small">
        {badge}
      </Badge>
    )}
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = ({ message }) => (
  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
    <FiCheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
    <p className="text-gray-500 font-medium">{message}</p>
  </div>
);

// ─── Table wrapper ─────────────────────────────────────────────────────────────

const ResponsiveTable = ({ headers, children, empty }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gradient-to-r from-teal-600 to-emerald-600">
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">{children}</tbody>
    </table>
    {empty}
  </div>
);

// ─── Quick-filter pill ────────────────────────────────────────────────────────

const QuickPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 ${
      active
        ? "bg-teal-600 text-white border-teal-600 shadow-md"
        : "bg-white text-teal-700 border-teal-300 hover:bg-teal-50"
    }`}
  >
    {label}
  </button>
);

// ─── CSV export helper ────────────────────────────────────────────────────────

function buildCSV(stats, hospitals, doctors, failedInvoices, dateRange) {
  const rows = [];

  rows.push(["MediVault Revenue Export"]);
  rows.push([`Generated`, new Date().toLocaleString("en-IN")]);
  if (dateRange.from || dateRange.to) {
    rows.push([`Date Range`, `${dateRange.from || "—"} to ${dateRange.to || "—"}`]);
  }
  rows.push([]);

  // Summary
  rows.push(["Summary"]);
  rows.push(["Period", "Revenue (INR)"]);
  rows.push(["Today", stats?.revenueToday ?? stats?.revenue?.today ?? 0]);
  rows.push(["This Week", stats?.revenueWeek ?? stats?.revenue?.thisWeek ?? 0]);
  rows.push(["This Month", stats?.revenueMonth ?? stats?.revenue?.thisMonth ?? 0]);
  rows.push([]);

  // Hospitals
  rows.push(["Hospital Revenue Breakdown"]);
  rows.push(["Hospital Name", "City", "Total Appointments", "Total Revenue (INR)", "Last Transaction"]);
  hospitals.forEach((h) => {
    rows.push([
      h.name ?? h.hospitalName ?? "—",
      h.city ?? "—",
      h.totalAppointments ?? 0,
      h.totalRevenue ?? h.revenue ?? 0,
      fmtDate(h.lastTransactionDate ?? h.lastTransaction),
    ]);
  });
  rows.push([]);

  // Doctors
  rows.push(["Individual Doctor Revenue Breakdown"]);
  rows.push(["Doctor Name", "Specialization", "Total Consultations", "Total Revenue (INR)"]);
  doctors.forEach((d) => {
    rows.push([
      d.name ?? d.doctorName ?? "—",
      d.specialization ?? d.specialty ?? "—",
      d.totalConsultations ?? d.consultations ?? 0,
      d.totalRevenue ?? d.revenue ?? 0,
    ]);
  });
  rows.push([]);

  // Failed
  rows.push(["Failed Payments"]);
  rows.push(["Invoice #", "Patient Name", "Amount (INR)", "Date", "Reason"]);
  failedInvoices.forEach((inv) => {
    rows.push([
      inv.invoiceNumber ?? inv.id ?? inv._id ?? "—",
      inv.patientName ?? inv.patient?.name ?? "—",
      inv.amount ?? inv.totalAmount ?? 0,
      fmtDate(inv.createdAt ?? inv.date),
      inv.failureReason ?? inv.reason ?? "Unknown",
    ]);
  });

  return rows
    .map((r) =>
      r
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AdminRevenue() {
  const router = useRouter();

  // Data state
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [failedInvoices, setFailedInvoices] = useState([]);
  const [retrying, setRetrying] = useState({});

  // Filter state
  const [quickFilter, setQuickFilter] = useState(""); // "week" | "month" | "quarter"
  const [dateFrom, setDateFrom] = useState(""); // yyyy-mm-dd (input native)
  const [dateTo, setDateTo] = useState("");

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    const from = dateFrom || null;
    const to = dateTo || null;
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString() ? `?${params}` : "";
  }, [dateFrom, dateTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const qs = buildQueryParams();
    try {
      const [statsRes, hospitalsRes, doctorsRes] = await Promise.allSettled([
        apiClient.get(`/admin/stats${qs}`),
        apiClient.get(`/admin/hospitals?status=approved&include=revenue${qs ? "&" + qs.slice(1) : ""}`),
        apiClient.get(`/admin/doctors?type=individual&include=revenue${qs ? "&" + qs.slice(1) : ""}`),
      ]);

      // Stats
      if (statsRes.status === "fulfilled") {
        const d = statsRes.value.data?.data ?? statsRes.value.data ?? {};
        setStats(d);

        // Extract failed invoices from stats if present
        const failed =
          d.failedInvoices ??
          d.failed_invoices ??
          d.revenue?.failedInvoices ??
          [];
        if (Array.isArray(failed) && failed.length > 0) {
          setFailedInvoices(failed);
        }
      }

      // Hospitals
      if (hospitalsRes.status === "fulfilled") {
        const raw = hospitalsRes.value.data;
        const list = raw?.data ?? raw?.hospitals ?? raw ?? [];
        setHospitals(Array.isArray(list) ? list : []);
      }

      // Doctors
      if (doctorsRes.status === "fulfilled") {
        const raw = doctorsRes.value.data;
        const list = raw?.data ?? raw?.doctors ?? raw ?? [];
        setDoctors(Array.isArray(list) ? list : []);
      }

      // Also try dedicated revenue endpoint for failed invoices
      try {
        const revRes = await apiClient.get(`/invoices/admin/revenue${qs}`);
        const revData = revRes.data?.data ?? revRes.data ?? {};
        const failed =
          revData.failedInvoices ??
          revData.failed ??
          revData.failedPayments ??
          [];
        if (Array.isArray(failed)) setFailedInvoices(failed);

        // Merge revenue figures into stats
        setStats((prev) => ({ ...prev, _revenue: revData }));
      } catch {
        // endpoint may not exist — silent fail
      }
    } catch (err) {
      console.error("Revenue fetch error:", err);
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Quick filter logic ─────────────────────────────────────────────────────

  const applyQuickFilter = (filter) => {
    const today = new Date();
    let from = new Date();

    if (filter === "week") {
      from.setDate(today.getDate() - 6);
    } else if (filter === "month") {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (filter === "quarter") {
      const qStartMonth = Math.floor(today.getMonth() / 3) * 3;
      from = new Date(today.getFullYear(), qStartMonth, 1);
    }

    const toStr = today.toISOString().split("T")[0];
    const fromStr = from.toISOString().split("T")[0];

    setQuickFilter(filter);
    setDateFrom(fromStr);
    setDateTo(toStr);
  };

  const clearFilters = () => {
    setQuickFilter("");
    setDateFrom("");
    setDateTo("");
  };

  // Apply date filters on change (after initial mount)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!mounted) { setMounted(true); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  // ── Retry payment ──────────────────────────────────────────────────────────

  const handleRetry = async (invoiceId) => {
    setRetrying((prev) => ({ ...prev, [invoiceId]: true }));
    try {
      await apiClient.post(`/invoices/${invoiceId}/retry-payment`);
      toast.success("Payment retry initiated");
      // Remove from failed list on success
      setFailedInvoices((prev) =>
        prev.filter((inv) => (inv.id ?? inv._id) !== invoiceId)
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Retry failed";
      toast.error(msg);
    } finally {
      setRetrying((prev) => ({ ...prev, [invoiceId]: false }));
    }
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const csv = buildCSV(stats, hospitals, doctors, failedInvoices, {
      from: dateFrom ? isoToDdmmyyyy(dateFrom) : "",
      to: dateTo ? isoToDdmmyyyy(dateTo) : "",
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medivault-revenue-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported with ₹ amounts");
  };

  // ── Export PDF ─────────────────────────────────────────────────────────────

  const handleExportPDF = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  // ── Derive display values ──────────────────────────────────────────────────

  const revenueToday =
    stats?.revenueToday ??
    stats?.revenue?.today ??
    stats?._revenue?.today ??
    stats?._revenue?.revenueToday ??
    0;

  const revenueWeek =
    stats?.revenueWeek ??
    stats?.revenue?.thisWeek ??
    stats?._revenue?.thisWeek ??
    stats?._revenue?.revenueWeek ??
    0;

  const revenueMonth =
    stats?.revenueMonth ??
    stats?.revenue?.thisMonth ??
    stats?._revenue?.thisMonth ??
    stats?._revenue?.revenueMonth ??
    0;

  const failedCount = failedInvoices.length;

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
        <div className="text-center">
          <div className="p-6 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-2xl inline-block mb-6">
            <MdAttachMoney className="h-12 w-12 text-white animate-pulse" />
          </div>
          <LoadingSpinner size="large" color="teal" />
          <p className="mt-4 text-gray-600 font-semibold">Loading revenue dashboard…</p>
          <p className="text-sm text-gray-400">Fetching financial data from MediVault</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 print:space-y-4">

      {/* ── Page Header ── */}
      <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full translate-x-20 -translate-y-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white opacity-10 rounded-full -translate-x-14 translate-y-14 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm border border-white border-opacity-30 shadow-lg">
              <MdAttachMoney className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Revenue Overview</h1>
              <p className="text-teal-100 text-sm">
                All amounts in <span className="font-bold">₹ (Indian Rupees)</span> &nbsp;·&nbsp; IST
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/dashboard")}
              className="border-white border-opacity-40 text-white hover:bg-white hover:bg-opacity-20"
            >
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={fetchData}
              className="border-white border-opacity-40 text-white hover:bg-white hover:bg-opacity-20"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="border-white border-opacity-40 text-white hover:bg-white hover:bg-opacity-20"
            >
              <FiDownload className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="border-white border-opacity-40 text-white hover:bg-white hover:bg-opacity-20"
            >
              <FiPrinter className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ── Date Range Filter ── */}
      <Card className="border-2 border-teal-100 print:hidden" padding="none">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="h-5 w-5 text-teal-600" />
            <h3 className="font-bold text-gray-800">Filter by Date Range</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
            {/* Quick pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Quick:</span>
              <QuickPill
                label="This Week"
                active={quickFilter === "week"}
                onClick={() => applyQuickFilter("week")}
              />
              <QuickPill
                label="This Month"
                active={quickFilter === "month"}
                onClick={() => applyQuickFilter("month")}
              />
              <QuickPill
                label="This Quarter"
                active={quickFilter === "quarter"}
                onClick={() => applyQuickFilter("quarter")}
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold border border-gray-300 text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Date pickers */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">From (DD/MM/YYYY)</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setQuickFilter("");
                    }}
                    max={dateTo || undefined}
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  {dateFrom && (
                    <p className="text-xs text-teal-600 font-medium mt-0.5">
                      {isoToDdmmyyyy(dateFrom)}
                    </p>
                  )}
                </div>
              </div>

              <FiArrowRight className="h-4 w-4 text-gray-400 mt-4 flex-shrink-0" />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">To (DD/MM/YYYY)</label>
                <div>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setQuickFilter("");
                    }}
                    min={dateFrom || undefined}
                    max={new Date().toISOString().split("T")[0]}
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  {dateTo && (
                    <p className="text-xs text-teal-600 font-medium mt-0.5">
                      {isoToDdmmyyyy(dateTo)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Summary Cards ── */}
      <div>
        <SectionHeading icon={FiTrendingUp} title="Revenue Summary" color="emerald" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <SummaryCard
            title="Revenue Today"
            value={fmtINR(revenueToday)}
            icon={FiDollarSign}
            color="emerald"
            sub="Live — refreshed now"
          />
          <SummaryCard
            title="Revenue This Week"
            value={fmtINR(revenueWeek)}
            icon={FiTrendingUp}
            color="teal"
            sub="Mon – today"
          />
          <SummaryCard
            title="Revenue This Month"
            value={fmtINR(revenueMonth)}
            icon={MdAttachMoney}
            color="cyan"
            sub="Calendar month to date"
          />
          <SummaryCard
            title="Failed Payments"
            value={failedCount}
            icon={FiAlertCircle}
            color={failedCount > 0 ? "red" : "gray"}
            sub={failedCount > 0 ? "Jump to failed payments ↓" : "All payments clear"}
            onClick={
              failedCount > 0
                ? () =>
                    document
                      .getElementById("failed-payments-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                : null
            }
          />
        </div>
      </div>

      {/* ── Hospital Breakdown ── */}
      <div>
        <SectionHeading icon={FaHospital} title="Per-Hospital Revenue Breakdown" color="blue" />
        <Card padding="none" className="border-2 border-blue-100">
          {hospitals.length === 0 ? (
            <div className="p-6">
              <EmptyState message="No hospital revenue data available for the selected period." />
            </div>
          ) : (
            <ResponsiveTable
              headers={[
                "Hospital Name",
                "City",
                "Total Appointments",
                "Total Revenue",
                "Last Transaction",
              ]}
            >
              {hospitals.map((h, idx) => (
                <tr
                  key={h._id ?? h.id ?? idx}
                  className="hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MdLocalHospital className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      {h.name ?? h.hospitalName ?? "—"}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                    {h.city ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-800 font-medium text-center">
                    {(h.totalAppointments ?? h.appointments ?? 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 font-bold text-emerald-700 whitespace-nowrap">
                    {fmtINR(h.totalRevenue ?? h.revenue ?? 0)}
                  </td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                    {fmtDate(h.lastTransactionDate ?? h.lastTransaction ?? h.updatedAt)}
                  </td>
                </tr>
              ))}
            </ResponsiveTable>
          )}
        </Card>
      </div>

      {/* ── Individual Doctor Breakdown ── */}
      <div>
        <SectionHeading icon={FaUserMd} title="Per-Doctor Revenue Breakdown" color="purple" />
        <Card padding="none" className="border-2 border-purple-100">
          {doctors.length === 0 ? (
            <div className="p-6">
              <EmptyState message="No individual doctor revenue data available for the selected period." />
            </div>
          ) : (
            <ResponsiveTable
              headers={[
                "Doctor Name",
                "Specialization",
                "Total Consultations",
                "Total Revenue",
              ]}
            >
              {doctors.map((d, idx) => (
                <tr
                  key={d._id ?? d.id ?? idx}
                  className="hover:bg-purple-50 transition-colors duration-150"
                >
                  <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FaStethoscope className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      {d.name ?? d.doctorName ?? d.fullName ?? "—"}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                    <Badge variant="teal" size="small">
                      {d.specialization ?? d.specialty ?? "General"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-gray-800 font-medium text-center">
                    {(d.totalConsultations ?? d.consultations ?? 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 font-bold text-emerald-700 whitespace-nowrap">
                    {fmtINR(d.totalRevenue ?? d.revenue ?? 0)}
                  </td>
                </tr>
              ))}
            </ResponsiveTable>
          )}
        </Card>
      </div>

      {/* ── Failed Payments ── */}
      <div id="failed-payments-section">
        <SectionHeading
          icon={MdErrorOutline}
          title="Failed Payments"
          color="red"
          badge={failedCount > 0 ? failedCount : undefined}
        />

        <Card
          className="border-2 border-red-100 bg-gradient-to-br from-red-50 to-rose-50"
          padding="none"
        >
          <div className="p-6">
            {failedCount === 0 ? (
              <EmptyState message="No failed payments — all transactions are clear." />
            ) : (
              <div className="space-y-3">
                {failedInvoices.map((inv) => {
                  const id = inv.id ?? inv._id;
                  return (
                    <div
                      key={id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border-2 border-red-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MdPayment className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <p className="font-bold text-gray-900 text-sm">
                            Invoice&nbsp;
                            <span className="font-mono">
                              #{inv.invoiceNumber ?? id ?? "—"}
                            </span>
                          </p>
                          <Badge variant="danger" size="small">
                            Failed
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Patient:</span>{" "}
                          {inv.patientName ?? inv.patient?.name ?? "—"}
                          &nbsp;&nbsp;
                          <span className="font-medium">Amount:</span>{" "}
                          <span className="font-bold text-red-600">
                            {fmtINR(inv.amount ?? inv.totalAmount)}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Date:</span>{" "}
                          {fmtDate(inv.createdAt ?? inv.date)}
                          &nbsp;&nbsp;
                          <span className="font-medium">Reason:</span>{" "}
                          {inv.failureReason ?? inv.reason ?? "Unknown"}
                        </p>
                      </div>

                      <Button
                        onClick={() => handleRetry(id)}
                        disabled={retrying[id]}
                        loading={retrying[id]}
                        variant="danger"
                        size="small"
                        className="flex-shrink-0"
                      >
                        {!retrying[id] && <FiRefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                        Retry Payment
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Export Actions ── (bottom, always visible) */}
      <Card className="border-2 border-teal-100 print:hidden" padding="none">
        <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-800">Export Revenue Report</p>
            <p className="text-sm text-gray-500">
              All amounts in ₹ (INR) &nbsp;·&nbsp; Includes hospitals, doctors &amp; failed payments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExportCSV}>
              <FiDownload className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="primary" onClick={handleExportPDF}>
              <FiPrinter className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

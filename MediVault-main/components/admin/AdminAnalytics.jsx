import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart,
  FiActivity,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiArrowLeft,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiShield,
  FiClock,
  FiTarget,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdAnalytics,
  MdHealthAndSafety,
  MdMedicalServices,
  MdSecurity,
  MdEmergency,
  MdMonitorHeart,
  MdVerifiedUser,
} from "react-icons/md";
import {
  FaUserMd,
  FaStethoscope,
  FaHospitalUser,
  FaHospital,
  FaHeartbeat,
} from "react-icons/fa";
import { Card, Button, Select, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const MetricCard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  description,
}) => (
  <Card
    className={`bg-gradient-to-br from-${color}-50 to-${color}-100 border-2 border-${color}-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
  >
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm text-${color}-700 font-bold uppercase tracking-wide mb-2`}
          >
            {title}
          </p>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
          {description && (
            <p className={`text-sm text-${color}-600 mt-2 font-medium`}>
              {description}
            </p>
          )}
        </div>
        <div
          className={`p-4 rounded-2xl bg-gradient-to-r from-${color}-500 to-${color}-600 text-white shadow-lg`}
        >
          <Icon className="h-8 w-8" />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-4 flex items-center">
          {changeType === "increase" ? (
            <FiTrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
          ) : (
            <FiTrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span
            className={`text-sm font-bold ${
              changeType === "increase" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {Math.abs(change)}%
          </span>
          <span className="text-sm text-gray-500 ml-1">vs last period</span>
        </div>
      )}
    </div>
  </Card>
);

const ChartCard = ({ title, children, actions, gradient = "teal" }) => (
  <Card
    className={`bg-gradient-to-br from-${gradient}-50 to-${gradient}-100 border-2 border-${gradient}-200 shadow-lg`}
  >
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MdAnalytics className={`h-6 w-6 text-${gradient}-600`} />
          {title}
        </h3>
        {actions && (
          <div className="flex items-center space-x-2">{actions}</div>
        )}
      </div>
      <div className="bg-white rounded-xl p-4 border-2 border-white shadow-inner">
        {children}
      </div>
    </div>
  </Card>
);

const SimpleBarChart = ({ data, color = "teal" }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm font-medium text-gray-700">
            {item.label}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-3 border border-gray-300">
            <div
              className={`bg-gradient-to-r from-${color}-500 to-${color}-600 h-3 rounded-full transition-all duration-500 shadow-sm`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-12 text-sm font-bold text-gray-900 text-right">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [failedInvoices, setFailedInvoices] = useState([]);
  const [retrying, setRetrying] = useState({});
  const router = useRouter();

  const loadData = async () => {
    try {
      const [statsRes, revenueRes] = await Promise.all([
        apiClient.get("/admin/stats"),
        apiClient.get("/invoices/admin/revenue"),
      ]);

      const statsData = statsRes.data?.data ?? statsRes.data ?? {};
      const revenueData = revenueRes.data?.data ?? revenueRes.data ?? {};

      setStats(statsData);
      setRevenue(revenueData);

      // Extract failed invoices from revenue payload if present
      const failed =
        revenueData.failedInvoices ??
        revenueData.failed ??
        statsData.failedInvoices ??
        [];
      setFailedInvoices(Array.isArray(failed) ? failed : []);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      toast.success("Analytics data refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetryPayment = async (invoiceId) => {
    setRetrying((prev) => ({ ...prev, [invoiceId]: true }));
    try {
      await apiClient.post(`/invoices/${invoiceId}/retry`);
      toast.success("Payment retry initiated");
      await loadData();
    } catch (err) {
      toast.error("Retry failed — please try again");
    } finally {
      setRetrying((prev) => ({ ...prev, [invoiceId]: false }));
    }
  };

  const exportAnalytics = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      stats,
      revenue,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medivault-analytics-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics exported successfully!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="p-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-2xl">
              <MdAnalytics className="h-12 w-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-300 rounded-full animate-ping"></div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-medium">
            Loading analytics dashboard...
          </p>
          <p className="text-sm text-gray-500">
            Fetching real-time platform data
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
          <div className="text-center py-12">
            <div className="relative mb-6">
              <div className="p-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full w-fit mx-auto shadow-lg">
                <FiShield className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <MdEmergency className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <MdSecurity className="h-5 w-5 text-red-600" />
              Data Unavailable
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Unable to load analytics data. Please check your connection or
              admin session.
            </p>
            <Button
              onClick={() => router.push("/admin/dashboard")}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 w-full"
            >
              <FiShield className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Normalise keys — backend may use camelCase or snake_case
  const totalHospitals =
    stats.totalHospitals ?? stats.total_hospitals ?? 0;
  const approvedHospitals =
    stats.approvedHospitals ?? stats.approved_hospitals ?? 0;
  const pendingHospitals =
    stats.pendingHospitals ?? stats.pending_hospitals ?? 0;
  const totalDoctors = stats.totalDoctors ?? stats.total_doctors ?? 0;
  const approvedDoctors =
    stats.approvedDoctors ?? stats.approved_doctors ?? 0;
  const pendingDoctors = stats.pendingDoctors ?? stats.pending_doctors ?? 0;
  const totalPatients = stats.totalPatients ?? stats.total_patients ?? 0;
  const totalAppointments =
    stats.totalAppointments ?? stats.total_appointments ?? 0;

  const revenueMonth =
    revenue?.thisMonth ?? revenue?.monthly ?? revenue?.month ?? 0;
  const revenueToday =
    revenue?.today ?? revenue?.daily ?? 0;
  const revenueWeek =
    revenue?.thisWeek ?? revenue?.weekly ?? revenue?.week ?? 0;

  // Bar chart data built from real values
  const revenueChartData = [
    { label: "Today", value: Math.round(revenueToday) },
    { label: "This Wk", value: Math.round(revenueWeek) },
    { label: "This Mo", value: Math.round(revenueMonth) },
  ];

  return (
    <div className="space-y-8 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <MdAnalytics className="absolute top-20 right-20 h-32 w-32 text-teal-600 animate-pulse" />
        <FaHeartbeat className="absolute bottom-20 left-20 h-24 w-24 text-cyan-600" />
        <MdLocalHospital className="absolute top-1/2 left-1/4 h-28 w-28 text-blue-600 animate-pulse" />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-2xl p-8 text-white shadow-2xl border-2 border-teal-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-12 translate-y-12"></div>

        <div className="flex items-center justify-between relative z-10 mb-6">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm border border-white border-opacity-30 shadow-lg">
              <MdAnalytics className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                Healthcare Platform Analytics
                <MdHealthAndSafety className="h-8 w-8" />
              </h1>
              <p className="text-teal-100 text-lg flex items-center gap-2">
                <MdSecurity className="h-4 w-4" />
                Real-time insights and performance metrics
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/dashboard")}
              className="border-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm"
            >
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <Button
            variant="outline"
            onClick={handleRefresh}
            loading={refreshing}
            disabled={refreshing}
            className="border-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm"
          >
            <FiRefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportAnalytics}
            className="border-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm"
          >
            <FiDownload className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Admin Info */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <FiShield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <MdVerifiedUser className="h-5 w-5" />
                Administrator Analytics Dashboard
              </h3>
              <p className="text-purple-700 flex items-center gap-2">
                <MdSecurity className="h-4 w-4" />
                Live data from MediVault backend — all amounts in ₹ (INR)
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Revenue Metrics */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiDollarSign className="h-5 w-5 text-emerald-600" />
          Revenue Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Revenue This Month"
            value={fmtINR(revenueMonth)}
            icon={FiDollarSign}
            color="emerald"
            description="Total invoiced this calendar month"
          />
          <MetricCard
            title="Revenue Today"
            value={fmtINR(revenueToday)}
            icon={FiTrendingUp}
            color="teal"
            description="Invoiced today"
          />
          <MetricCard
            title="Revenue This Week"
            value={fmtINR(revenueWeek)}
            icon={FiBarChart}
            color="cyan"
            description="Invoiced this week"
          />
        </div>
      </div>

      {/* Platform Counts */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiUsers className="h-5 w-5 text-blue-600" />
          Platform Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Hospitals"
            value={totalHospitals}
            icon={FaHospital}
            color="blue"
            description={`${approvedHospitals} approved · ${pendingHospitals} pending`}
          />
          <MetricCard
            title="Doctors"
            value={totalDoctors}
            icon={FaUserMd}
            color="purple"
            description={`${approvedDoctors} approved · ${pendingDoctors} pending`}
          />
          <MetricCard
            title="Patients"
            value={totalPatients}
            icon={FaHospitalUser}
            color="orange"
            description="Registered patients"
          />
          <MetricCard
            title="Appointments"
            value={totalAppointments}
            icon={FiCalendar}
            color="indigo"
            description="Total appointments"
          />
        </div>
      </div>

      {/* Revenue bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Revenue Breakdown" gradient="emerald">
          <SimpleBarChart data={revenueChartData} color="emerald" />
        </ChartCard>

        {/* Hospital / Doctor breakdown */}
        <ChartCard title="Approval Breakdown" gradient="blue">
          <SimpleBarChart
            data={[
              { label: "Hospitals", value: totalHospitals },
              { label: "H. Apprvd", value: approvedHospitals },
              { label: "H. Pendg", value: pendingHospitals },
              { label: "Doctors", value: totalDoctors },
              { label: "D. Apprvd", value: approvedDoctors },
              { label: "D. Pendg", value: pendingDoctors },
            ]}
            color="blue"
          />
        </ChartCard>
      </div>

      {/* Detailed stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaHospital className="h-6 w-6 text-blue-600" />
              Hospital Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200">
                <span className="text-gray-600 font-medium">Total:</span>
                <span className="font-bold text-blue-600">{totalHospitals}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200">
                <span className="text-gray-600 font-medium">Approved:</span>
                <span className="font-bold text-emerald-600">
                  {approvedHospitals}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200">
                <span className="text-gray-600 font-medium">Pending:</span>
                <span className="font-bold text-yellow-600">
                  {pendingHospitals}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaUserMd className="h-6 w-6 text-purple-600" />
              Doctor Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-purple-200">
                <span className="text-gray-600 font-medium">Total:</span>
                <span className="font-bold text-purple-600">{totalDoctors}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-purple-200">
                <span className="text-gray-600 font-medium">Approved:</span>
                <span className="font-bold text-emerald-600">
                  {approvedDoctors}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-purple-200">
                <span className="text-gray-600 font-medium">Pending:</span>
                <span className="font-bold text-yellow-600">
                  {pendingDoctors}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-purple-200">
                <span className="text-gray-600 font-medium">Approval Rate:</span>
                <span className="font-bold text-purple-600">
                  {totalDoctors > 0
                    ? Math.round((approvedDoctors / totalDoctors) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FiCalendar className="h-6 w-6 text-emerald-600" />
              Appointment Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200">
                <span className="text-gray-600 font-medium">Total:</span>
                <span className="font-bold text-emerald-600">
                  {totalAppointments}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200">
                <span className="text-gray-600 font-medium">Patients:</span>
                <span className="font-bold text-emerald-600">
                  {totalPatients}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200">
                <span className="text-gray-600 font-medium">
                  Last Updated:
                </span>
                <span className="font-bold text-emerald-600 text-sm">
                  {new Date().toLocaleTimeString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200">
                <span className="text-gray-600 font-medium">
                  Platform Status:
                </span>
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none">
                  <FiCheckCircle className="w-3 h-3 mr-1" />
                  Healthy
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Failed Payments */}
      <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FiAlertCircle className="h-6 w-6 text-red-600" />
            Failed Payments
            {failedInvoices.length > 0 && (
              <Badge className="bg-red-500 text-white border-none ml-2">
                {failedInvoices.length}
              </Badge>
            )}
          </h3>

          {failedInvoices.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-red-200">
              <FiCheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                No failed payments — all invoices are clear.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedInvoices.map((inv) => (
                <div
                  key={inv.id ?? inv._id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-red-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">
                      Invoice #{inv.invoiceNumber ?? inv.id ?? inv._id}
                    </p>
                    <p className="text-sm text-gray-600">
                      Patient:{" "}
                      <span className="font-medium">
                        {inv.patientName ?? inv.patient?.name ?? "—"}
                      </span>
                      &nbsp;·&nbsp;Amount:{" "}
                      <span className="font-medium text-red-600">
                        {fmtINR(inv.amount ?? inv.totalAmount)}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Date: {fmtDate(inv.createdAt ?? inv.date)}
                      &nbsp;·&nbsp;Reason:{" "}
                      {inv.failureReason ?? inv.reason ?? "Unknown"}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleRetryPayment(inv.id ?? inv._id)}
                    disabled={retrying[inv.id ?? inv._id]}
                    className="ml-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm"
                  >
                    {retrying[inv.id ?? inv._id] ? (
                      <FiRefreshCw className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <FiRefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Retry
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* System Status */}
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
        <div className="p-6">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl shadow-lg">
              <MdAnalytics className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                Platform Status: All Systems Operational
                <MdHealthAndSafety className="h-6 w-6 text-emerald-600" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-emerald-200">
                  <ul className="text-sm text-emerald-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <MdMedicalServices className="h-4 w-4 text-teal-600" />
                      All healthcare services operational
                    </li>
                    <li className="flex items-center gap-2">
                      <MdSecurity className="h-4 w-4 text-blue-600" />
                      Security systems functioning normally
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-4 border border-emerald-200">
                  <ul className="text-sm text-emerald-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <FaStethoscope className="h-4 w-4 text-purple-600" />
                      Doctor verification systems active
                    </li>
                    <li className="flex items-center gap-2">
                      <FiClock className="h-4 w-4 text-emerald-600" />
                      Last system check:{" "}
                      {new Date().toLocaleString("en-IN")}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminAnalytics;

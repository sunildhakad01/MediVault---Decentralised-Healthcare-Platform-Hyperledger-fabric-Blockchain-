import { useState, useEffect } from "react";
import {
  FiFile,
  FiCalendar,
  FiCheck,
  FiDownload,
  FiPrinter,
  FiExternalLink,
  FiActivity,
  FiAlertCircle,
} from "react-icons/fi";
import { MdMedicalServices, MdVerifiedUser } from "react-icons/md";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";
import { formatDateDMY } from "../../utils/helpers";

// ── Status badge config ───────────────────────────────────────────────────────

const CONSULTATION_STATUS = {
  completed: {
    label: "Completed",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: FiCheck,
  },
  scheduled: {
    label: "Scheduled",
    classes: "bg-cyan-100 text-cyan-700 border-cyan-200",
    icon: FiCalendar,
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-red-100 text-red-600 border-red-200",
    icon: FiAlertCircle,
  },
  no_show: {
    label: "No Show",
    classes: "bg-gray-100 text-gray-500 border-gray-200",
    icon: FiActivity,
  },
  in_progress: {
    label: "In Progress",
    classes: "bg-amber-100 text-amber-700 border-amber-200",
    icon: FiActivity,
  },
};

const LAB_STATUS = {
  report_uploaded: {
    label: "Report Uploaded",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: FiCheck,
  },
  ordered: {
    label: "Ordered",
    classes: "bg-amber-100 text-amber-700 border-amber-200",
    icon: FiActivity,
  },
  processing: {
    label: "Processing",
    classes: "bg-amber-100 text-amber-700 border-amber-200",
    icon: FiActivity,
  },
};

const StatusBadge = ({ status, config }) => {
  const cfg = config[status] || {
    label: status || "Unknown",
    classes: "bg-gray-100 text-gray-500 border-gray-200",
    icon: FiActivity,
  };
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.classes}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

// ── ConsultationCard ──────────────────────────────────────────────────────────

const ConsultationCard = ({ appt }) => {
  const date = formatDateDMY(appt.date || appt.appointmentDate || appt.createdAt);
  const doctorName = appt.doctor?.fullName || appt.doctor?.name || appt.doctorName || appt.doctorId || "—";
  const doctorSpec = appt.doctor?.specialization || "";
  const timeSlot = appt.from ? `${appt.from}${appt.to ? ` – ${appt.to}` : ''}` : null;
  const hospitalId = appt.hospitalId || appt.hospital || null;
  const status = (appt.status || "scheduled").toLowerCase().replace(/ /g, "_");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Icon + info */}
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
            <MdMedicalServices className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 flex items-center gap-1 mb-0.5">
              <MdVerifiedUser className="h-4 w-4 text-teal-500 flex-shrink-0" />
              Dr. {doctorName}
            </p>
            {doctorSpec && (
              <p className="text-xs text-teal-600 font-medium mb-1 capitalize">{doctorSpec}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              <span className="flex items-center gap-1 font-medium text-gray-800">
                <FiCalendar className="h-3.5 w-3.5 text-teal-500" />
                {date}
              </span>
              {timeSlot && (
                <span className="text-xs text-gray-500">{timeSlot}</span>
              )}
              {hospitalId && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  Hospital ID:{" "}
                  <span className="font-mono font-medium text-gray-700">
                    {hospitalId}
                  </span>
                </span>
              )}
            </div>
            {appt.reason && (
              <p className="mt-1.5 text-xs text-gray-500 italic line-clamp-2">
                {appt.reason}
              </p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          <StatusBadge status={status} config={CONSULTATION_STATUS} />
        </div>
      </div>
    </div>
  );
};

// ── LabReportCard ─────────────────────────────────────────────────────────────

const LabReportCard = ({ report }) => {
  const testName =
    report.testName || report.name || report.test || "Lab Report";
  const date = formatDateDMY(
    report.date || report.reportDate || report.createdAt
  );
  const status = (report.status || "ordered")
    .toLowerCase()
    .replace(/ /g, "_");
  const pinataUrl = report.pinataUrl || report.reportUrl || null;
  const cid = report.cid || report.ipfsCid || null;
  const fabricTxId = report.fabricTxId || report.txId || null;
  const viewUrl = pinataUrl || (cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Icon + info */}
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
            <FiFile className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{testName}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FiCalendar className="h-3 w-3 text-blue-400" />
                {date}
              </span>
              {fabricTxId && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <MdVerifiedUser className="h-3 w-3" />
                  Verified on-chain
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: status + view button */}
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
          <StatusBadge status={status} config={LAB_STATUS} />
          {viewUrl && (
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-colors shadow-sm"
            >
              <FiExternalLink className="h-3.5 w-3.5" />
              View Report
            </a>
          )}
          {!viewUrl && cid && (
            <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]">
              CID: {cid.slice(0, 10)}…
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Tab button ────────────────────────────────────────────────────────────────

const Tab = ({ id, label, icon: Icon, count, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none whitespace-nowrap ${
      active
        ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow"
        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
    }`}
  >
    <Icon className="h-4 w-4 flex-shrink-0" />
    {label}
    {count != null && (
      <span
        className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold leading-none ${
          active ? "bg-white/30 text-white" : "bg-gray-200 text-gray-600"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

// ── Spinner / empty / error helpers ──────────────────────────────────────────

const Spinner = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow animate-pulse">
      <MdMedicalServices className="h-6 w-6 text-white" />
    </div>
    <div className="flex gap-1">
      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
    </div>
    <p className="text-gray-500 text-sm">{label}</p>
  </div>
);

const EmptyState = ({ icon: Icon, title, body }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
    <div className="w-16 h-16 bg-teal-50 border-2 border-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
      <Icon className="h-8 w-8 text-teal-300" />
    </div>
    <h3 className="text-base font-bold text-gray-700 mb-1">{title}</h3>
    <p className="text-sm text-gray-400">{body}</p>
  </div>
);

const ErrorPanel = ({ message, onRetry }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-10 text-center">
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <FiAlertCircle className="h-6 w-6 text-red-500" />
    </div>
    <p className="text-sm text-gray-600 mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
    >
      Retry
    </button>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const PatientHistory = ({ defaultTab = "consultations" }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Consultations
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState(null);

  // Lab reports
  const [labReports, setLabReports] = useState([]);
  const [labLoading, setLabLoading] = useState(true);
  const [labError, setLabError] = useState(null);

  const loadAppointments = async () => {
    try {
      setApptLoading(true);
      setApptError(null);
      const { data } = await apiClient.get("/patient/appointments");
      const list = Array.isArray(data)
        ? data
        : data.appointments || data.data || [];
      // Sort newest first
      const sorted = [...list].sort((a, b) => {
        const da = new Date(a.date || a.appointmentDate || a.createdAt || 0);
        const db = new Date(b.date || b.appointmentDate || b.createdAt || 0);
        return db - da;
      });
      setAppointments(sorted);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to load consultations";
      setApptError(msg);
      toast.error(msg);
    } finally {
      setApptLoading(false);
    }
  };

  const loadLabReports = async () => {
    try {
      setLabLoading(true);
      setLabError(null);
      const { data } = await apiClient.get("/patient/lab-reports");
      const list = Array.isArray(data)
        ? data
        : data.labReports || data.reports || data.data || [];
      // Sort newest first
      const sorted = [...list].sort((a, b) => {
        const da = new Date(a.date || a.reportDate || a.createdAt || 0);
        const db = new Date(b.date || b.reportDate || b.createdAt || 0);
        return db - da;
      });
      setLabReports(sorted);
    } catch (err) {
      console.error("Error fetching lab reports:", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to load lab reports";
      setLabError(msg);
      toast.error(msg);
    } finally {
      setLabLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadLabReports();
  }, []);

  const overallLoading = apptLoading && labLoading;

  if (overallLoading) {
    return <Spinner label="Loading your medical history…" />;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-2xl px-7 py-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white opacity-10 rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-x-10 translate-y-10 pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 shadow">
            <FiActivity className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Medical History</h1>
            <p className="text-teal-100 text-sm mt-0.5">
              Your consultations and lab reports in one place
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-50 rounded-2xl p-2 border border-gray-200 flex gap-2 overflow-x-auto">
        <Tab
          id="consultations"
          label="Consultations"
          icon={MdMedicalServices}
          count={appointments.length}
          active={activeTab === "consultations"}
          onClick={setActiveTab}
        />
        <Tab
          id="lab-reports"
          label="Lab Reports"
          icon={FiFile}
          count={labReports.length}
          active={activeTab === "lab-reports"}
          onClick={setActiveTab}
        />
      </div>

      {/* ── Consultations tab ─────────────────────────────────────────────── */}
      {activeTab === "consultations" && (
        <div className="space-y-3">
          {apptLoading ? (
            <Spinner label="Loading consultations…" />
          ) : apptError ? (
            <ErrorPanel message={apptError} onRetry={loadAppointments} />
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={MdMedicalServices}
              title="No consultations yet"
              body="Your appointment history will appear here after you visit a doctor."
            />
          ) : (
            appointments.map((appt, idx) => (
              <ConsultationCard
                key={appt._id || appt.appointmentId || idx}
                appt={appt}
              />
            ))
          )}
        </div>
      )}

      {/* ── Lab Reports tab ───────────────────────────────────────────────── */}
      {activeTab === "lab-reports" && (
        <div className="space-y-3">
          {labLoading ? (
            <Spinner label="Loading lab reports…" />
          ) : labError ? (
            <ErrorPanel message={labError} onRetry={loadLabReports} />
          ) : labReports.length === 0 ? (
            <EmptyState
              icon={FiFile}
              title="No lab reports found"
              body="Lab test reports ordered by your doctor will appear here once uploaded."
            />
          ) : (
            labReports.map((report, idx) => (
              <LabReportCard
                key={report._id || report.reportId || idx}
                report={report}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PatientHistory;

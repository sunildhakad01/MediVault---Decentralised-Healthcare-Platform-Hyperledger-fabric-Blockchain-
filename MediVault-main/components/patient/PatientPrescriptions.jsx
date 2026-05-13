import { useState, useEffect } from "react";
import {
  FiFile, FiCalendar, FiCheck, FiPrinter, FiActivity,
  FiAlertCircle, FiDownload,
} from "react-icons/fi";
import { MdMedicalServices, MdVerifiedUser } from "react-icons/md";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";
import { formatDateDMY } from "../../utils/helpers";

const frequencyLabel = (code) => {
  const map = {
    OD: "Once Daily", BD: "Twice Daily", TDS: "Three times daily",
    QID: "Four times daily", SOS: "As needed",
  };
  return map[code] || code || "—";
};

const isActive = (followUpDate) => {
  if (!followUpDate) return false;
  return new Date(followUpDate) > new Date();
};

// ── PrescriptionCard ──────────────────────────────────────────────────────────
const PrescriptionCard = ({ rx }) => {
  const [expanded, setExpanded]     = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Fix: API returns field "id", not "prescriptionId" or "_id"
  const rxId      = rx.id || rx.prescriptionId || rx._id || null;
  const displayId = rxId || "RX---------";
  const date      = formatDateDMY(rx.createdAt || rx.date);
  const doctorId  = rx.doctorId  || "—";
  const doctorName = rx.doctorName || null;
  const medicines  = Array.isArray(rx.medicines) ? rx.medicines : [];
  const followUp   = rx.followUpDate || rx.followUp || null;
  const active     = isActive(followUp);
  const specialInstructions = rx.specialInstructions || rx.instructions || "";

  // Browser print
  const handlePrint = () => {
    const printContent = `
      <html>
      <head>
        <title>Prescription ${displayId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .meta { font-size: 13px; color: #555; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background: #f0fdfa; font-weight: 600; }
          .footer { margin-top: 24px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <h1>${displayId}</h1>
        <div class="meta">
          Date: ${date} &nbsp;|&nbsp;
          Doctor: ${doctorName ? `Dr. ${doctorName}` : doctorId} &nbsp;|&nbsp;
          Follow-up: ${formatDateDMY(followUp)}
        </div>
        <table>
          <thead>
            <tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr>
          </thead>
          <tbody>
            ${medicines.map((m) => `
              <tr>
                <td>${m.name || "—"}</td>
                <td>${m.dose || m.dosage || "—"}</td>
                <td>${frequencyLabel(m.frequency)}</td>
                <td>${m.duration || "—"}</td>
                <td>${m.instructions || "—"}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        ${specialInstructions ? `<p class="footer"><strong>Special instructions:</strong> ${specialInstructions}</p>` : ""}
        <p class="footer">Printed from MediVault on ${new Date().toLocaleDateString("en-IN")}</p>
      </body>
      </html>
    `;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Pop-up blocked. Please allow pop-ups for this site."); return; }
    w.document.write(printContent);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  // Server-side PDF download
  const handleDownloadPDF = async () => {
    if (!rxId) { toast.error("Prescription ID not found."); return; }
    try {
      setPdfLoading(true);
      const res = await apiClient.get(`/prescriptions/${rxId}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Prescription-${rxId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to download PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Card header */}
      <button
        className="w-full text-left p-5 flex items-center justify-between gap-4 focus:outline-none"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
            <MdMedicalServices className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 font-mono text-sm tracking-wide">{displayId}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FiCalendar className="h-3 w-3" /> {date}
              </span>
              <span className="flex items-center gap-1">
                <MdVerifiedUser className="h-3 w-3 text-teal-500" />
                {doctorName ? `Dr. ${doctorName}` : `Doctor ID: ${doctorId}`}
              </span>
              <span className="flex items-center gap-1">
                <FiFile className="h-3 w-3" />
                {medicines.length} {medicines.length === 1 ? "medicine" : "medicines"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {active ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <FiCheck className="h-3 w-3" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
              <FiActivity className="h-3 w-3" /> Completed
            </span>
          )}
          <span className={`transform transition-transform duration-200 text-gray-400 text-lg leading-none ${expanded ? "rotate-180" : ""}`}>
            ▾
          </span>
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-6 pt-4 space-y-5">
          {medicines.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-teal-50 text-teal-700 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Dose</th>
                    <th className="px-4 py-3 text-left font-semibold">Frequency</th>
                    <th className="px-4 py-3 text-left font-semibold">Duration</th>
                    <th className="px-4 py-3 text-left font-semibold">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {medicines.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{m.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{m.dose || m.dosage || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{frequencyLabel(m.frequency)}</td>
                      <td className="px-4 py-3 text-gray-600">{m.duration || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{m.instructions || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No medicine details recorded.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {specialInstructions && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Special Instructions</p>
                <p className="text-sm text-amber-900">{specialInstructions}</p>
              </div>
            )}
            {followUp && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <FiCalendar className="h-3 w-3" /> Follow-up Date
                </p>
                <p className="text-sm font-medium text-teal-900">{formatDateDMY(followUp)}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 border border-teal-400 text-teal-700 text-sm font-medium rounded-lg hover:bg-teal-50 transition-colors"
            >
              <FiPrinter className="h-4 w-4" /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading || !rxId}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pdfLoading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : <FiDownload className="h-4 w-4" />}
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await apiClient.get("/patient/prescriptions");
        // Response: { success, data: [...] }
        const list = Array.isArray(data) ? data : data?.data || data?.prescriptions || [];
        const sorted = [...list].sort((a, b) =>
          new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
        );
        setPrescriptions(sorted);
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to load prescriptions";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse">
          <MdMedicalServices className="h-7 w-7 text-white" />
        </div>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
        </div>
        <p className="text-gray-500 text-sm">Loading prescriptions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-10 text-center max-w-md mx-auto mt-8">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Could not load prescriptions</h3>
        <p className="text-sm text-gray-500 mb-5">{error}</p>
        <button onClick={() => window.location.reload()}
          className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
          Try again
        </button>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center max-w-md mx-auto mt-8">
        <div className="w-16 h-16 bg-teal-50 border-2 border-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiFile className="h-8 w-8 text-teal-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">No prescriptions found</h3>
        <p className="text-sm text-gray-500">
          Prescriptions issued by your doctors will appear here after your consultations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-2xl px-7 py-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white opacity-10 rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-x-10 translate-y-10 pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 shadow">
            <MdMedicalServices className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Prescriptions</h1>
            <p className="text-teal-100 text-sm mt-0.5">
              {prescriptions.length} {prescriptions.length === 1 ? "prescription" : "prescriptions"} found — click a card to view full details
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {prescriptions.map((rx, idx) => (
          <PrescriptionCard key={rx.id || rx.prescriptionId || idx} rx={rx} />
        ))}
      </div>
    </div>
  );
};

export default PatientPrescriptions;

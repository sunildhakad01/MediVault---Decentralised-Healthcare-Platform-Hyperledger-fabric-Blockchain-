import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  FiPlus, FiX, FiPrinter, FiCheck, FiUser, FiCalendar,
  FiEdit3, FiDownload, FiLock,
} from "react-icons/fi";
import { MdMedicalServices } from "react-icons/md";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";
import DoctorSignaturePad from "./DoctorSignaturePad";

// ── Constants ─────────────────────────────────────────────────────────────────
const COMMON_DRUGS = [
  "Paracetamol", "Amoxicillin", "Azithromycin", "Metformin", "Atorvastatin",
  "Amlodipine", "Omeprazole", "Pantoprazole", "Cetirizine", "Dolo 650",
  "Ibuprofen", "Aspirin", "Clopidogrel", "Losartan", "Metoprolol",
  "Atenolol", "Ramipril", "Lisinopril", "Glimepiride", "Insulin",
  "Levothyroxine", "Vitamin D3", "Vitamin B12", "Iron Folic Acid", "Calcium",
  "Rabeprazole", "Domperidone", "Ondansetron", "Loperamide", "ORS",
  "Albendazole", "Ivermectin", "Doxycycline", "Ciprofloxacin", "Metronidazole",
  "Fluconazole", "Prednisolone", "Dexamethasone", "Hydrocortisone",
  "Salbutamol", "Montelukast", "Theophylline",
];

const FREQUENCY_OPTIONS = ["OD", "BD", "TDS", "QID", "SOS", "As needed"];

const EMPTY_MEDICINE = () => ({
  id: Date.now() + Math.random(),
  name: "", dose: "", frequency: "OD", duration: "", instructions: "",
});

const inputCls =
  "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-sm";

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayFormatted() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ── MedicineRow ───────────────────────────────────────────────────────────────
function MedicineRow({ row, index, onChange, onRemove, showRemove }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleNameChange(val) {
    onChange(index, "name", val);
    if (val.trim().length > 0) {
      const filtered = COMMON_DRUGS.filter((d) => d.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered.slice(0, 8));
      setOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">
          Medicine {index + 1}
        </span>
        {showRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-400 hover:text-red-600 transition-colors rounded-full p-1 hover:bg-red-50"
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Medicine Name with autocomplete */}
        <div className="relative sm:col-span-2 lg:col-span-1" ref={wrapRef}>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Medicine Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Paracetamol"
            value={row.name}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
            autoComplete="off"
          />
          {open && suggestions.length > 0 && (
            <ul className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto text-sm">
              {suggestions.map((drug) => (
                <li
                  key={drug}
                  className="px-3 py-2 cursor-pointer hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                  onMouseDown={() => { onChange(index, "name", drug); setSuggestions([]); setOpen(false); }}
                >
                  {drug}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Dose</label>
          <input type="text" className={inputCls} placeholder="e.g. 500mg" value={row.dose}
            onChange={(e) => onChange(index, "dose", e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
          <select className={inputCls} value={row.frequency}
            onChange={(e) => onChange(index, "frequency", e.target.value)}>
            {FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
          <input type="text" className={inputCls} placeholder="e.g. 5 days" value={row.duration}
            onChange={(e) => onChange(index, "duration", e.target.value)} />
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
          <input type="text" className={inputCls} placeholder="e.g. after food" value={row.instructions}
            onChange={(e) => onChange(index, "instructions", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// ── Print helper ──────────────────────────────────────────────────────────────
function printPrescription({ doctor, patientId, patientName, patientAge, patientGender, patientBlood, appointmentId, medicines, specialInstructions, followUpDate, prescriptionId, signatureUrl }) {
  const medicineRows = medicines
    .filter((m) => m.name.trim())
    .map((m, i) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 12px;font-size:13px;">${i + 1}</td>
        <td style="padding:10px 12px;font-size:13px;font-weight:600;">${m.name}</td>
        <td style="padding:10px 12px;font-size:13px;">${m.dose || "—"}</td>
        <td style="padding:10px 12px;font-size:13px;">${m.frequency}</td>
        <td style="padding:10px 12px;font-size:13px;">${m.duration || "—"}</td>
        <td style="padding:10px 12px;font-size:13px;">${m.instructions || "—"}</td>
      </tr>`)
    .join("");

  const sigHtml = signatureUrl
    ? `<div style="margin-top:16px;">
         <img src="${signatureUrl}" alt="Signature" style="max-height:70px;object-fit:contain;border-bottom:1px solid #374151;padding-bottom:4px;" />
         <p style="font-size:11px;color:#6b7280;margin-top:4px;">Doctor's Signature</p>
       </div>`
    : `<div style="margin-top:16px;border-bottom:1px solid #374151;width:200px;padding-bottom:4px;"></div>
       <p style="font-size:11px;color:#6b7280;margin-top:4px;">Doctor's Signature</p>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>MediVault Prescription</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; padding: 32px; }
    .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #0891b2; padding-bottom:16px; margin-bottom:20px; }
    .logo-area h1 { font-size:26px; font-weight:800; color:#0891b2; }
    .logo-area p { font-size:12px; color:#6b7280; margin-top:2px; }
    .rx-symbol { font-size:48px; font-weight:900; color:#0e7490; opacity:0.15; }
    .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
    .meta-box { background:#f0fdfa; border:1px solid #a7f3d0; border-radius:10px; padding:12px 16px; }
    .meta-box h3 { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#0891b2; font-weight:700; margin-bottom:6px; }
    .meta-box p { font-size:13px; color:#111; font-weight:500; margin:2px 0; }
    .meta-box span { color:#6b7280; font-weight:400; }
    table { width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; margin-bottom:20px; }
    thead { background:linear-gradient(135deg,#0891b2,#0d9488); }
    thead th { padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; color:#fff; font-weight:700; }
    .section-title { font-size:13px; font-weight:700; color:#0891b2; margin-bottom:8px; text-transform:uppercase; }
    .info-box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px 16px; font-size:13px; margin-bottom:16px; }
    .followup { background:#fef3c7; border:1px solid #fcd34d; border-radius:10px; padding:12px 16px; font-size:13px; font-weight:600; color:#92400e; margin-bottom:16px; }
    .footer { border-top:1px solid #e5e7eb; padding-top:12px; font-size:11px; color:#9ca3af; text-align:center; }
    @media print { body { padding:16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <h1>MediVault</h1>
      <p>Digital Health Management Platform</p>
    </div>
    <div style="text-align:right;">
      <div class="rx-symbol">℞</div>
      ${prescriptionId ? `<p style="font-size:11px;color:#9ca3af;">Rx ID: ${prescriptionId}</p>` : ""}
      <p style="font-size:12px;color:#6b7280;">Date: ${todayFormatted()}</p>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h3>Doctor Details</h3>
      <p>${doctor.name || "Dr. —"}</p>
      <p><span>Reg. No:</span> ${doctor.registrationNo || "—"}</p>
      <p><span>Specialization:</span> ${doctor.specialization || "—"}</p>
    </div>
    <div class="meta-box">
      <h3>Patient Details</h3>
      ${patientName ? `<p style="font-weight:700;font-size:14px;">${patientName}</p>` : ""}
      <p><span>Patient ID:</span> ${patientId}</p>
      ${patientAge ? `<p><span>Age:</span> ${patientAge} years</p>` : ""}
      ${patientGender ? `<p><span>Gender:</span> ${patientGender}</p>` : ""}
      ${patientBlood ? `<p><span>Blood Group:</span> ${patientBlood}</p>` : ""}
      ${appointmentId ? `<p><span>Appointment ID:</span> ${appointmentId}</p>` : ""}
    </div>
  </div>

  <div class="section-title">Prescribed Medicines</div>
  <table>
    <thead>
      <tr><th>#</th><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr>
    </thead>
    <tbody>${medicineRows}</tbody>
  </table>

  ${specialInstructions ? `<div class="section-title">Special Instructions</div><div class="info-box">${specialInstructions}</div>` : ""}
  ${followUpDate ? `<div class="followup">Follow-up Date: ${followUpDate}</div>` : ""}

  ${sigHtml}

  <div class="footer">
    Generated by MediVault &nbsp;|&nbsp; This is a digitally generated prescription &nbsp;|&nbsp; ${todayFormatted()}
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (win) { win.document.write(html); win.document.close(); }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DoctorPrescribeMedicine() {
  const router = useRouter();

  // Doctor data
  const [doctor, setDoctor] = useState({ name: "", registrationNo: "", specialization: "", id: "" });
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mv_doctor_data");
      const fallbackId = localStorage.getItem("mv_doctor_id") || "";
      if (raw) {
        const data = JSON.parse(raw);
        setDoctor({
          name:           data.fullName || data.name || data.doctorName || "",
          registrationNo: data.medicalCouncilRegNo || data.registrationNo || data.regNo || "",
          specialization: data.specialization || data.specialty || "",
          id:             data.id || data.doctorId || fallbackId,
        });
        setSignatureUrl(data.digitalSignatureUrl || null);
      } else if (fallbackId) {
        setDoctor((prev) => ({ ...prev, id: fallbackId }));
      }
    } catch { /* ignore */ }
  }, []);

  // Form state
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [patientBlood, setPatientBlood] = useState("");
  const [prefilled, setPrefilled] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");

  // Pre-fill from URL query params when navigating from appointment card
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query;
    if (q.patientId) { setPatientId(q.patientId); setPrefilled(true); }
    if (q.appointmentId) setAppointmentId(q.appointmentId);
    if (q.patientName) setPatientName(q.patientName);
    if (q.patientAge) setPatientAge(q.patientAge);
    if (q.patientGender) setPatientGender(q.patientGender);
    if (q.patientBlood) setPatientBlood(q.patientBlood);
  }, [router.isReady, router.query]);
  const [medicines, setMedicines] = useState([EMPTY_MEDICINE()]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [lastSubmitData, setLastSubmitData] = useState(null);

  // Medicine helpers
  function handleMedicineChange(index, field, value) {
    setMedicines((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }
  function addMedicine() {
    if (medicines.length >= 11) { toast.error("Maximum 11 medicines per prescription."); return; }
    setMedicines((prev) => [...prev, EMPTY_MEDICINE()]);
  }
  function removeMedicine(index) {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  }

  function formatFollowUp(isoDate) {
    if (!isoDate) return "";
    const [yyyy, mm, dd] = isoDate.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }

  // Submit
  async function handleSubmit(e) {
    e.preventDefault();
    if (!patientId.trim()) { toast.error("Patient ID is required."); return; }
    const filledMedicines = medicines.filter((m) => m.name.trim());
    if (filledMedicines.length === 0) { toast.error("Add at least one medicine with a name."); return; }

    const payload = {
      patientId: patientId.trim(),
      patientName: patientName.trim() || undefined,
      patientAge: patientAge || undefined,
      patientGender: patientGender || undefined,
      patientBlood: patientBlood || undefined,
      appointmentId: appointmentId.trim() || undefined,
      medicines: filledMedicines.map(({ name, dose, frequency, duration, instructions }) => ({
        name, dose, frequency, duration, instructions,
      })),
      specialInstructions: specialInstructions.trim() || undefined,
      followUpDate: followUpDate ? formatFollowUp(followUpDate) : undefined,
    };

    try {
      setLoading(true);
      const res = await apiClient.post("/prescriptions", payload);
      // Response: { success, data: { id, ... } }
      const rxData = res?.data?.data || res?.data || {};
      const id = rxData.id || rxData.prescriptionId || null;
      setPrescriptionId(id);
      setLastSubmitData({ ...payload, doctor });
      toast.success(id ? `Prescription created! ID: ${id}` : "Prescription created successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to create prescription.");
    } finally {
      setLoading(false);
    }
  }

  // Reset
  function handleReset() {
    setPatientId(""); setPatientName(""); setPatientAge(""); setPatientGender(""); setPatientBlood("");
    setAppointmentId(""); setMedicines([EMPTY_MEDICINE()]);
    setSpecialInstructions(""); setFollowUpDate("");
    setPrescriptionId(null); setLastSubmitData(null); setPrefilled(false);
  }

  // Browser print
  function handlePrint() {
    if (!lastSubmitData) return;
    printPrescription({ ...lastSubmitData, prescriptionId, signatureUrl });
  }

  // Server PDF download
  async function handleDownloadPDF() {
    if (!prescriptionId) return;
    try {
      setPdfLoading(true);
      const res = await apiClient.get(`/prescriptions/${prescriptionId}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Prescription-${prescriptionId}.pdf`;
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
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-200">
            <MdMedicalServices className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Write Prescription</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create a digital prescription for your patient</p>
          </div>
        </div>

        {/* Signature pad modal */}
        {showSignaturePad && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <DoctorSignaturePad
              initialUrl={signatureUrl}
              doctorId={doctor.id}
              onSaved={(url) => {
                setSignatureUrl(url);
                setShowSignaturePad(false);
                // Persist into localStorage so next session picks it up
                try {
                  const raw = localStorage.getItem("mv_doctor_data");
                  if (raw) {
                    const d = JSON.parse(raw);
                    d.digitalSignatureUrl = url;
                    localStorage.setItem("mv_doctor_data", JSON.stringify(d));
                  }
                } catch { /* ignore */ }
              }}
              onClose={() => setShowSignaturePad(false)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* SECTION 1 – Doctor info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <FiUser className="text-cyan-500" />
              <h2 className="text-base font-semibold text-gray-800">Doctor Information</h2>
              <span className="ml-auto text-xs text-gray-400 italic">Auto-filled · read-only</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Doctor Name</label>
                <input type="text" className={`${inputCls} bg-gray-50 cursor-not-allowed`}
                  value={doctor.name || "Dr. —"} readOnly />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Registration No.</label>
                <input type="text" className={`${inputCls} bg-gray-50 cursor-not-allowed`}
                  value={doctor.registrationNo || "—"} readOnly />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                <input type="text" className={`${inputCls} bg-gray-50 cursor-not-allowed`}
                  value={todayFormatted()} readOnly />
              </div>
            </div>

            {/* Digital Signature */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <FiEdit3 size={12} />
                  Digital Signature
                </p>
                {signatureUrl && (signatureUrl.startsWith("data:image") || signatureUrl.startsWith("http")) ? (
                  <div className="h-14 border border-gray-200 rounded-xl bg-gray-50 flex items-center px-3">
                    <img src={signatureUrl} alt="Signature" className="max-h-10 object-contain" />
                  </div>
                ) : (
                  <div className="h-14 border border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                    <span className="text-xs text-gray-400">No signature saved</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSignaturePad(true)}
                disabled={!doctor.id}
                className="flex items-center gap-2 text-xs font-semibold text-cyan-600 border border-cyan-300 bg-cyan-50 hover:bg-cyan-100 px-4 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-5"
              >
                <FiEdit3 size={13} />
                {signatureUrl ? "Update Signature" : "Add Signature"}
              </button>
            </div>
          </div>

          {/* SECTION 2 – Patient info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiUser className="text-teal-500" />
                <h2 className="text-base font-semibold text-gray-800">Patient Information</h2>
              </div>
              {prefilled && (
                <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded-full font-medium">
                  <FiLock size={11} /> Auto-filled from appointment
                </span>
              )}
            </div>

            {/* Pre-filled patient summary banner */}
            {prefilled && (patientName || patientAge || patientGender || patientBlood) && (
              <div className="mb-4 bg-teal-50 border border-teal-200 rounded-xl p-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {patientName && (
                  <span className="text-gray-700">Name: <span className="font-semibold text-gray-900">{patientName}</span></span>
                )}
                {patientAge && (
                  <span className="text-gray-700">Age: <span className="font-semibold text-gray-900">{patientAge} yrs</span></span>
                )}
                {patientGender && (
                  <span className="text-gray-700">Gender: <span className="font-semibold text-gray-900 capitalize">{patientGender}</span></span>
                )}
                {patientBlood && (
                  <span className="text-gray-700">Blood Group: <span className="font-semibold text-red-600">{patientBlood}</span></span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Patient ID <span className="text-red-500">*</span>
                </label>
                <input type="text" className={`${inputCls} ${prefilled ? 'bg-teal-50 border-teal-300 font-medium' : ''}`}
                  placeholder="e.g. PAT-20240315-A1B2C"
                  value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
                {!prefilled && <p className="text-xs text-gray-400 mt-1">Format: PAT-YYYYMMDD-XXXXX</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Patient Name
                </label>
                <input type="text" className={`${inputCls} ${prefilled && patientName ? 'bg-teal-50 border-teal-300 font-medium' : ''}`}
                  placeholder="Patient full name"
                  value={patientName} onChange={(e) => setPatientName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Appointment ID <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="text" className={`${inputCls} ${prefilled && appointmentId ? 'bg-teal-50 border-teal-300 font-medium' : ''}`}
                  placeholder="e.g. APT-20240315-001"
                  value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} />
              </div>
            </div>
          </div>

          {/* SECTION 3 – Medicines */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MdMedicalServices className="text-cyan-500 text-lg" />
                <h2 className="text-base font-semibold text-gray-800">Medicines</h2>
                <span className="text-xs bg-cyan-100 text-cyan-700 font-semibold px-2 py-0.5 rounded-full">
                  {medicines.length} / 11
                </span>
              </div>
              <button
                type="button"
                onClick={addMedicine}
                disabled={medicines.length >= 11}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiPlus size={14} /> Add Medicine
              </button>
            </div>
            <div className="space-y-3">
              {medicines.map((row, index) => (
                <MedicineRow key={row.id} row={row} index={index}
                  onChange={handleMedicineChange} onRemove={removeMedicine}
                  showRemove={medicines.length > 1} />
              ))}
            </div>
          </div>

          {/* SECTION 4 – Additional details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FiCalendar className="text-teal-500" />
              <h2 className="text-base font-semibold text-gray-800">Additional Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Special Instructions <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea className={`${inputCls} resize-none h-24`}
                  placeholder="e.g. Avoid spicy food, drink plenty of water…"
                  maxLength={300} value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1 text-right">{specialInstructions.length} / 300</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Follow-up Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="date" className={inputCls} value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]} />
                {followUpDate && (
                  <p className="text-xs text-cyan-600 font-medium mt-1">{formatFollowUp(followUpDate)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Success banner */}
          {prescriptionId !== null && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-5 py-4 mb-5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <FiCheck className="text-white" size={16} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Prescription created successfully!</p>
                {prescriptionId && (
                  <p className="text-xs mt-0.5 text-emerald-600">
                    ID: <span className="font-mono font-bold">{prescriptionId}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                >
                  <FiPrinter size={14} /> Print
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
                >
                  {pdfLoading ? (
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : <FiDownload size={14} />}
                  PDF
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold py-3.5 px-8 rounded-xl shadow-md shadow-cyan-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating Prescription…
                </>
              ) : <><FiCheck size={16} /> Create Prescription</>}
            </button>

            {prescriptionId !== null && (
              <>
                <button type="button" onClick={handlePrint}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-6 rounded-xl transition-colors text-sm">
                  <FiPrinter size={15} /> Print Prescription
                </button>
                <button type="button" onClick={handleDownloadPDF} disabled={pdfLoading}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-6 rounded-xl transition-colors text-sm disabled:opacity-60">
                  <FiDownload size={15} /> Download PDF
                </button>
                <button type="button" onClick={handleReset}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 font-semibold py-3.5 px-6 rounded-xl transition-colors text-sm">
                  New Prescription
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

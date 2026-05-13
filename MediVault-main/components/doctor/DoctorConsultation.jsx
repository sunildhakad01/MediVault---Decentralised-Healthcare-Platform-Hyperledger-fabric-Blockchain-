import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FiUser,
  FiClipboard,
  FiFileText,
  FiCalendar,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiChevronRight,
  FiHeart,
  FiActivity,
  FiThermometer,
  FiEye,
  FiInfo,
  FiLoader,
} from "react-icons/fi";
import {
  MdMedicalServices,
  MdLocalHospital,
  MdBloodtype,
  MdHealthAndSafety,
  MdNotes,
} from "react-icons/md";
import { FaStethoscope, FaAllergies, FaPills, FaHistory } from "react-icons/fa";
import { Card, Button, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso; // return as-is if already formatted
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const isoToDdmmyyyy = (str) => {
  if (!str) return "";
  const [yyyy, mm, dd] = str.split("-");
  if (!yyyy || !mm || !dd) return str;
  return `${dd}/${mm}/${yyyy}`;
};

const inputCls =
  "w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-sm bg-white";

const textareaCls = `${inputCls} resize-none`;

// ─── Info row for left panel ──────────────────────────────────────────────────

const InfoRow = ({ label, value, valueClass = "" }) => (
  <div className="flex flex-col gap-0.5 py-2 border-b border-blue-100 last:border-b-0">
    <span className="text-xs font-bold uppercase tracking-wider text-blue-500">{label}</span>
    <span className={`text-sm font-medium text-gray-800 ${valueClass}`}>
      {value || <span className="text-gray-400 italic">Not available</span>}
    </span>
  </div>
);

// ─── Vital chip ───────────────────────────────────────────────────────────────

const VitalChip = ({ icon: Icon, label, value, unit }) => (
  <div className="flex flex-col items-center bg-white rounded-xl border border-blue-200 p-3 text-center shadow-sm">
    <Icon className="h-5 w-5 text-blue-500 mb-1" />
    <span className="text-xs font-bold text-gray-700">
      {value ?? "—"}
      {value && unit ? (
        <span className="text-gray-400 font-normal ml-0.5">{unit}</span>
      ) : null}
    </span>
    <span className="text-xs text-gray-400 mt-0.5">{label}</span>
  </div>
);

// ─── Section heading ──────────────────────────────────────────────────────────

const PanelHeading = ({ icon: Icon, title, color = "teal" }) => (
  <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-${color}-200`}>
    <div className={`p-1.5 rounded-lg bg-${color}-100`}>
      <Icon className={`h-4 w-4 text-${color}-600`} />
    </div>
    <h3 className={`text-sm font-bold uppercase tracking-wider text-${color}-800`}>{title}</h3>
  </div>
);

// ─── Form label ──────────────────────────────────────────────────────────────

const FormLabel = ({ htmlFor, children, required }) => (
  <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 mb-1.5">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function DoctorConsultation({ appointmentId }) {
  const router = useRouter();

  // Pre-consultation data (left panel)
  const [preConsult, setPreConsult] = useState(null);
  const [preLoading, setPreLoading] = useState(false);
  const [preError, setPreError] = useState(null);

  // Form state (right panel)
  const [form, setForm] = useState({
    chiefComplaint: "",
    findings: "",
    diagnosis: "",
    icd10Code: "",
    treatmentPlan: "",
    followUpDate: "",   // native input: yyyy-mm-dd; sent as DD/MM/YYYY
    referral: false,
    referralDepartment: "",
    referralDoctorName: "",
    referralNotes: "",
    notes: "",           // internal notes
  });

  // UI state
  const [saving, setSaving] = useState(false);    // "draft" | "complete" | false
  const [completing, setCompleting] = useState(false);
  const [goingToRx, setGoingToRx] = useState(false);

  // ── Fetch pre-consult data ─────────────────────────────────────────────────

  useEffect(() => {
    if (!appointmentId) return;

    const fetchPreConsult = async () => {
      setPreLoading(true);
      setPreError(null);
      try {
        const res = await apiClient.get(`/consultation/pre-consult/${appointmentId}`);
        const data = res.data?.data ?? res.data ?? {};
        setPreConsult(data);

        // Pre-fill chief complaint from booking if available
        const bookingComplaint =
          data.chiefComplaint ??
          data.complaint ??
          data.appointment?.chiefComplaint ??
          data.booking?.chiefComplaint ??
          "";
        if (bookingComplaint) {
          setForm((prev) => ({ ...prev, chiefComplaint: bookingComplaint }));
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message ?? err?.message ?? "Failed to load patient info";
        setPreError(msg);
        toast.error(msg);
      } finally {
        setPreLoading(false);
      }
    };

    fetchPreConsult();
  }, [appointmentId]);

  // ── Form handlers ──────────────────────────────────────────────────────────

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Build payload ──────────────────────────────────────────────────────────

  const buildPayload = (status) => ({
    appointmentId,
    chiefComplaint: form.chiefComplaint.trim(),
    findings: form.findings.trim(),
    diagnosis: form.diagnosis.trim(),
    icd10Code: form.icd10Code.trim() || undefined,
    treatmentPlan: form.treatmentPlan.trim(),
    followUpDate: form.followUpDate ? isoToDdmmyyyy(form.followUpDate) : undefined,
    referral: form.referral
      ? {
          department: form.referralDepartment.trim(),
          doctorName: form.referralDoctorName.trim(),
          notes: form.referralNotes.trim(),
        }
      : null,
    notes: form.notes.trim() || undefined,
    status,
  });

  // ── Save draft ─────────────────────────────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!appointmentId) {
      toast.error("No appointment ID — cannot save.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/consultation", buildPayload("draft"));
      toast.success("Draft saved successfully");
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to save draft";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Complete & save ────────────────────────────────────────────────────────

  const handleComplete = async () => {
    if (!appointmentId) {
      toast.error("No appointment ID — cannot complete.");
      return;
    }
    if (!form.chiefComplaint.trim()) {
      toast.error("Chief Complaint is required to complete consultation.");
      return;
    }
    if (!form.diagnosis.trim()) {
      toast.error("Diagnosis is required to complete consultation.");
      return;
    }

    setCompleting(true);
    try {
      // 1) Save consultation
      await apiClient.post("/consultation", buildPayload("completed"));

      // 2) Mark appointment as completed
      await apiClient.put(`/doctor/appointments/${appointmentId}/status`, {
        status: "completed",
      });

      toast.success("Consultation completed successfully!");
      setTimeout(() => router.push("/doctor/appointments"), 1200);
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to complete consultation";
      toast.error(msg);
    } finally {
      setCompleting(false);
    }
  };

  // ── Go to prescription ─────────────────────────────────────────────────────

  const handleGoToPrescription = async () => {
    if (!appointmentId) {
      router.push("/doctor/prescribe");
      return;
    }
    setGoingToRx(true);
    try {
      // Save draft first
      await apiClient.post("/consultation", buildPayload("draft"));
      router.push(`/doctor/prescribe?appointmentId=${appointmentId}`);
    } catch {
      // Even if save fails, still navigate
      router.push(`/doctor/prescribe?appointmentId=${appointmentId}`);
    } finally {
      setGoingToRx(false);
    }
  };

  // ── Derive display values from pre-consult ────────────────────────────────

  const patient = preConsult?.patient ?? preConsult ?? {};
  const vitals = preConsult?.vitals ?? patient?.vitals ?? {};
  const allergies =
    preConsult?.allergies ??
    patient?.allergies ??
    preConsult?.knownAllergies ??
    [];
  const activeMeds =
    preConsult?.activeMedications ??
    preConsult?.medications ??
    patient?.activeMedications ??
    [];
  const pastVisits =
    preConsult?.pastVisits ??
    preConsult?.visitHistory ??
    patient?.pastVisits ??
    [];

  const allergyList = Array.isArray(allergies)
    ? allergies
    : typeof allergies === "string"
    ? allergies.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const medicationList = Array.isArray(activeMeds) ? activeMeds : [];
  const visitList = Array.isArray(pastVisits) ? pastVisits.slice(0, 3) : [];

  // ── Departments ────────────────────────────────────────────────────────────

  const DEPARTMENTS = [
    "General Medicine",
    "Cardiology",
    "Neurology",
    "Orthopaedics",
    "Gynaecology",
    "Paediatrics",
    "Dermatology",
    "ENT",
    "Ophthalmology",
    "Psychiatry",
    "Oncology",
    "Nephrology",
    "Gastroenterology",
    "Pulmonology",
    "Endocrinology",
    "Urology",
    "Radiology",
    "Physiotherapy",
    "Emergency",
    "ICU / Critical Care",
  ];

  // ── No appointment guard ───────────────────────────────────────────────────

  if (!appointmentId) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200">
          <div className="text-center py-10">
            <FiAlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Appointment Selected</h3>
            <p className="text-gray-600 text-sm mb-6">
              Please navigate to this page via an appointment link.
            </p>
            <Button onClick={() => router.push("/doctor/appointments")} variant="primary">
              View Appointments
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 rounded-2xl p-7 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white opacity-10 rounded-full translate-x-18 -translate-y-18 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -translate-x-12 translate-y-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm border border-white border-opacity-30">
              <FaStethoscope className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-0.5">Consultation</h1>
              <p className="text-teal-100 text-sm flex items-center gap-2">
                <FiInfo className="h-3.5 w-3.5" />
                Appointment ID:{" "}
                <span className="font-mono font-bold">{appointmentId}</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/doctor/appointments")}
            className="border-white border-opacity-40 text-white hover:bg-white hover:bg-opacity-20 self-start sm:self-center"
          >
            Back to Appointments
          </Button>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ════ LEFT PANEL — Patient Info ════ */}
        <div className="lg:col-span-2">
          <Card
            className="bg-gradient-to-b from-blue-50 to-slate-50 border-2 border-blue-200 shadow-lg"
            padding="none"
          >
            <div className="p-6 space-y-5">

              {/* Header */}
              <div className="flex items-center gap-2 pb-3 border-b-2 border-blue-200">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <FiUser className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-blue-900">Patient Information</h2>
                  <p className="text-xs text-blue-500">Read-only · Pre-consultation data</p>
                </div>
              </div>

              {/* Loading / Error */}
              {preLoading && (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="medium" color="teal" />
                  <span className="ml-3 text-sm text-blue-600 font-medium">
                    Loading patient data…
                  </span>
                </div>
              )}

              {preError && !preLoading && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  <FiAlertCircle className="inline h-4 w-4 mr-1.5" />
                  {preError}
                </div>
              )}

              {!preLoading && !preError && (
                <>
                  {/* Basic info */}
                  <div>
                    <PanelHeading icon={FiUser} title="Patient Details" color="blue" />
                    <div className="space-y-0">
                      <InfoRow
                        label="Name"
                        value={
                          patient.name ??
                          patient.fullName ??
                          patient.patientName ??
                          preConsult?.patientName
                        }
                      />
                      <InfoRow
                        label="Age"
                        value={
                          patient.age
                            ? `${patient.age} years`
                            : patient.dateOfBirth
                            ? `DOB: ${fmtDate(patient.dateOfBirth)}`
                            : null
                        }
                      />
                      <InfoRow label="Gender" value={patient.gender ?? patient.sex} />
                      <InfoRow
                        label="Blood Group"
                        value={patient.bloodGroup ?? patient.blood_group}
                        valueClass="font-bold text-red-600"
                      />
                    </div>
                  </div>

                  {/* Chief complaint from booking */}
                  <div>
                    <PanelHeading icon={FiClipboard} title="Booking Complaint" color="blue" />
                    <p className="text-sm text-gray-700 bg-white rounded-xl border border-blue-200 p-3">
                      {preConsult?.bookingComplaint ??
                        preConsult?.complaint ??
                        preConsult?.appointment?.chiefComplaint ??
                        preConsult?.chiefComplaint ?? (
                          <span className="text-gray-400 italic">Not specified</span>
                        )}
                    </p>
                  </div>

                  {/* Vitals */}
                  <div>
                    <PanelHeading icon={FiActivity} title="Vitals" color="blue" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <VitalChip
                        icon={FiActivity}
                        label="Height"
                        value={vitals.height}
                        unit="cm"
                      />
                      <VitalChip
                        icon={FiActivity}
                        label="Weight"
                        value={vitals.weight}
                        unit="kg"
                      />
                      <VitalChip
                        icon={FiHeart}
                        label="BP"
                        value={vitals.bloodPressure ?? vitals.bp}
                        unit="mmHg"
                      />
                      <VitalChip
                        icon={FiThermometer}
                        label="Temp"
                        value={vitals.temperature ?? vitals.temp}
                        unit="°F"
                      />
                      <VitalChip
                        icon={FiEye}
                        label="SpO2"
                        value={vitals.spo2 ?? vitals.SpO2}
                        unit="%"
                      />
                      <VitalChip
                        icon={FiHeart}
                        label="Pulse"
                        value={vitals.pulse ?? vitals.heartRate}
                        unit="bpm"
                      />
                    </div>
                    {Object.keys(vitals).length === 0 && (
                      <p className="text-xs text-gray-400 italic mt-2 text-center">
                        No vitals recorded
                      </p>
                    )}
                  </div>

                  {/* Allergies */}
                  <div>
                    <PanelHeading icon={FaAllergies} title="Known Allergies" color="blue" />
                    {allergyList.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">None reported</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {allergyList.map((a, i) => (
                          <Badge key={i} variant="danger" size="small">
                            {typeof a === "string" ? a : a.name ?? JSON.stringify(a)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active medications */}
                  <div>
                    <PanelHeading icon={FaPills} title="Active Medications" color="blue" />
                    {medicationList.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">None on record</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {medicationList.map((med, i) => (
                          <li
                            key={i}
                            className="text-sm text-gray-700 bg-white rounded-lg border border-blue-100 px-3 py-1.5 flex items-start gap-2"
                          >
                            <FaPills className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                            {typeof med === "string"
                              ? med
                              : `${med.name ?? "—"}${med.dose ? ` · ${med.dose}` : ""}${med.frequency ? ` · ${med.frequency}` : ""}`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Past visits */}
                  <div>
                    <PanelHeading icon={FaHistory} title="Recent Visits (Last 3)" color="blue" />
                    {visitList.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No past visits at this facility</p>
                    ) : (
                      <ul className="space-y-2">
                        {visitList.map((v, i) => (
                          <li
                            key={i}
                            className="text-xs text-gray-700 bg-white rounded-lg border border-blue-100 px-3 py-2"
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-bold text-blue-600">
                                {fmtDate(v.date ?? v.visitDate ?? v.createdAt)}
                              </span>
                              {v.status && (
                                <Badge variant="primary" size="small">
                                  {v.status}
                                </Badge>
                              )}
                            </div>
                            {v.diagnosis && (
                              <p className="text-gray-600">
                                <span className="font-semibold">Dx:</span> {v.diagnosis}
                              </p>
                            )}
                            {v.doctor && (
                              <p className="text-gray-500">Dr. {v.doctor}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* ════ RIGHT PANEL — Consultation Form ════ */}
        <div className="lg:col-span-3">
          <Card className="border-2 border-teal-100 shadow-lg" padding="none">
            <div className="p-6 space-y-6">

              {/* Header */}
              <div className="flex items-center gap-3 pb-4 border-b-2 border-teal-100">
                <div className="p-2 bg-teal-600 rounded-xl">
                  <MdMedicalServices className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-teal-900 text-lg">Consultation Form</h2>
                  <p className="text-xs text-teal-500">
                    Complete all required fields before finalising
                  </p>
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <FormLabel htmlFor="chiefComplaint" required>
                  Chief Complaint
                </FormLabel>
                <textarea
                  id="chiefComplaint"
                  className={`${textareaCls} h-20`}
                  placeholder="Patient's primary complaint in their own words…"
                  value={form.chiefComplaint}
                  onChange={(e) => handleChange("chiefComplaint", e.target.value)}
                />
              </div>

              {/* Examination Findings */}
              <div>
                <FormLabel htmlFor="findings">Examination Findings</FormLabel>
                <textarea
                  id="findings"
                  className={`${textareaCls} h-24`}
                  placeholder="Physical examination findings, signs observed…"
                  value={form.findings}
                  onChange={(e) => handleChange("findings", e.target.value)}
                />
              </div>

              {/* Diagnosis + ICD-10 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-1">
                  <FormLabel htmlFor="diagnosis" required>
                    Diagnosis
                  </FormLabel>
                  <input
                    id="diagnosis"
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Acute Pharyngitis"
                    value={form.diagnosis}
                    onChange={(e) => handleChange("diagnosis", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1">
                  <FormLabel htmlFor="icd10Code">
                    ICD-10 Code{" "}
                    <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  </FormLabel>
                  <input
                    id="icd10Code"
                    type="text"
                    className={inputCls}
                    placeholder="e.g. J02.9"
                    value={form.icd10Code}
                    onChange={(e) => handleChange("icd10Code", e.target.value)}
                  />
                </div>
              </div>

              {/* Treatment Plan */}
              <div>
                <FormLabel htmlFor="treatmentPlan">Treatment Plan</FormLabel>
                <textarea
                  id="treatmentPlan"
                  className={`${textareaCls} h-24`}
                  placeholder="Planned treatment, procedures, diet, lifestyle advice…"
                  value={form.treatmentPlan}
                  onChange={(e) => handleChange("treatmentPlan", e.target.value)}
                />
              </div>

              {/* Follow-up Date */}
              <div>
                <FormLabel htmlFor="followUpDate">
                  Follow-up Date{" "}
                  <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </FormLabel>
                <input
                  id="followUpDate"
                  type="date"
                  className={inputCls}
                  value={form.followUpDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleChange("followUpDate", e.target.value)}
                />
                {form.followUpDate && (
                  <p className="text-xs text-teal-600 font-semibold mt-1">
                    <FiCalendar className="inline h-3.5 w-3.5 mr-1" />
                    {isoToDdmmyyyy(form.followUpDate)}
                  </p>
                )}
              </div>

              {/* Referral Section */}
              <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    checked={form.referral}
                    onChange={(e) => handleChange("referral", e.target.checked)}
                  />
                  <span className="font-semibold text-gray-800 flex items-center gap-2">
                    <MdLocalHospital className="h-4 w-4 text-amber-600" />
                    Refer to another doctor / department
                  </span>
                </label>

                {form.referral && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FormLabel htmlFor="referralDept">Department</FormLabel>
                      <select
                        id="referralDept"
                        className={inputCls}
                        value={form.referralDepartment}
                        onChange={(e) => handleChange("referralDepartment", e.target.value)}
                      >
                        <option value="">Select department…</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FormLabel htmlFor="referralDoc">Doctor Name</FormLabel>
                      <input
                        id="referralDoc"
                        type="text"
                        className={inputCls}
                        placeholder="Dr. Sharma (optional)"
                        value={form.referralDoctorName}
                        onChange={(e) => handleChange("referralDoctorName", e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FormLabel htmlFor="referralNotes">Referral Notes</FormLabel>
                      <textarea
                        id="referralNotes"
                        className={`${textareaCls} h-20`}
                        placeholder="Reason for referral, specific requests for referred doctor…"
                        value={form.referralNotes}
                        onChange={(e) => handleChange("referralNotes", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              <div>
                <FormLabel htmlFor="internalNotes">
                  Internal Notes{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    (not visible to patient)
                  </span>
                </FormLabel>
                <div className="relative">
                  <textarea
                    id="internalNotes"
                    className={`${textareaCls} h-20 pr-10`}
                    placeholder="Private observations, reminders for next visit…"
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                  />
                  <MdNotes className="absolute top-3 right-3 h-5 w-5 text-gray-300 pointer-events-none" />
                </div>
                <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
                  <FiInfo className="h-3.5 w-3.5" />
                  These notes are internal only and will not be shared with the patient.
                </p>
              </div>

              {/* ── Action Buttons ── */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t-2 border-gray-100">
                {/* Save Draft */}
                <Button
                  onClick={handleSaveDraft}
                  disabled={saving || completing || goingToRx}
                  loading={saving}
                  variant="outline"
                  className="flex-1 border-teal-400 text-teal-700 hover:bg-teal-50"
                >
                  {!saving && <FiSave className="h-4 w-4 mr-2" />}
                  Save Draft
                </Button>

                {/* Complete & Save */}
                <Button
                  onClick={handleComplete}
                  disabled={saving || completing || goingToRx}
                  loading={completing}
                  variant="success"
                  className="flex-1"
                >
                  {!completing && <FiCheckCircle className="h-4 w-4 mr-2" />}
                  Complete &amp; Save
                </Button>

                {/* Go to Prescription */}
                <Button
                  onClick={handleGoToPrescription}
                  disabled={saving || completing || goingToRx}
                  loading={goingToRx}
                  variant="primary"
                  className="flex-1"
                >
                  {!goingToRx && <FiArrowRight className="h-4 w-4 mr-2" />}
                  Go to Prescription
                </Button>
              </div>

              {/* Helper text */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 text-xs text-blue-700 space-y-1">
                <p className="flex items-start gap-1.5">
                  <FiInfo className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Save Draft</strong> — saves your progress without completing the
                    appointment.
                  </span>
                </p>
                <p className="flex items-start gap-1.5">
                  <FiCheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-emerald-600" />
                  <span>
                    <strong>Complete &amp; Save</strong> — marks the appointment as completed and
                    redirects to your appointments list.
                  </span>
                </p>
                <p className="flex items-start gap-1.5">
                  <FiChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-purple-600" />
                  <span>
                    <strong>Go to Prescription</strong> — saves a draft and opens the prescription
                    writer for this appointment.
                  </span>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

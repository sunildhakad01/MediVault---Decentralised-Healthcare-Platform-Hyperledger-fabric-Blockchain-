/**
 * PatientMedicationReminders.jsx
 *
 * Allows patients to:
 *   1. View all medication reminders for their active prescriptions
 *   2. Set / update reminder times for each medicine
 *   3. Toggle reminders on/off
 *   4. Request browser notification permission (shows native alerts when tab is open)
 *
 * API endpoints used:
 *   GET  /api/patient/medication-reminders
 *   GET  /api/patient/prescriptions
 *   POST /api/patient/medication-reminders
 *   PUT  /api/patient/medication-reminders/:id/toggle
 *   DELETE /api/patient/medication-reminders/:id
 */
import { useState, useEffect, useCallback } from "react";
import { GiPill } from "react-icons/gi";
import {
  FiBell, FiBellOff, FiPlus, FiTrash2, FiCheck, FiX,
  FiAlertCircle, FiClock,
} from "react-icons/fi";
import { MdNotifications, MdMedicalServices } from "react-icons/md";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";

// ── Default reminder times by frequency ──────────────────────────────────────
const DEFAULT_TIMES = {
  OD:        ["08:00"],
  BD:        ["08:00", "20:00"],
  TDS:       ["08:00", "14:00", "20:00"],
  QID:       ["07:00", "11:00", "15:00", "21:00"],
  SOS:       [],
  "As needed": [],
};

// ── Frequency pretty label ────────────────────────────────────────────────────
const freqLabel = (f) => {
  const map = {
    OD: "Once daily", BD: "Twice daily", TDS: "3× daily",
    QID: "4× daily", SOS: "As needed", "As needed": "As needed",
  };
  return map[f] || f;
};

// ── BrowserNotificationBanner ─────────────────────────────────────────────────
function BrowserNotificationBanner({ onGranted }) {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const request = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Browser notifications are not supported in this browser.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Browser notifications enabled!");
      onGranted?.();
    } else {
      toast.error("Notifications blocked. Enable them in browser settings.");
    }
  };

  if (permission === "granted") return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
      <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
        <MdNotifications className="h-6 w-6 text-amber-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-800">Enable browser notifications</p>
        <p className="text-xs text-amber-600 mt-0.5">
          Get real-time medicine alerts while MediVault is open in your browser.
        </p>
      </div>
      <button
        onClick={request}
        className="flex-shrink-0 flex items-center gap-1.5 bg-amber-500 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-amber-600 transition-colors"
      >
        <FiBell size={13} /> Enable
      </button>
    </div>
  );
}

// ── ReminderForm — modal to set times for a medicine ─────────────────────────
function ReminderForm({ medicine, prescriptionId, existingReminder, onSaved, onClose }) {
  const defaultTimes = existingReminder?.reminderTimes
    || DEFAULT_TIMES[medicine.frequency] || ["08:00"];

  const [times, setTimes] = useState(defaultTimes);
  const [note,  setNote]  = useState(existingReminder?.note || "");
  const [saving, setSaving] = useState(false);

  const addTime = () => setTimes((prev) => [...prev, "08:00"]);
  const removeTime = (i) => setTimes((prev) => prev.filter((_, idx) => idx !== i));
  const updateTime = (i, val) => setTimes((prev) => prev.map((t, idx) => (idx === i ? val : t)));

  const handleSave = async () => {
    const validTimes = times.filter((t) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(t));
    if (validTimes.length === 0) {
      toast.error("Add at least one valid reminder time.");
      return;
    }
    try {
      setSaving(true);
      await apiClient.post("/patient/medication-reminders", {
        prescriptionId,
        medicineName: medicine.name,
        frequency:    medicine.frequency,
        reminderTimes: validTimes,
        note: note.trim() || undefined,
      });
      toast.success(`Reminder set for ${medicine.name}`);
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to save reminder.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GiPill className="text-white text-lg" />
            <h3 className="font-bold text-white text-sm">{medicine.name}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">
              Frequency: <strong>{freqLabel(medicine.frequency)}</strong>
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">Reminder Times (24-h)</label>
              <button onClick={addTime} className="text-xs text-cyan-600 hover:text-cyan-800 flex items-center gap-1">
                <FiPlus size={12} /> Add time
              </button>
            </div>
            <div className="space-y-2">
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={t}
                    onChange={(e) => updateTime(i, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  {times.length > 1 && (
                    <button onClick={() => removeTime(i)} className="text-red-400 hover:text-red-600 transition-colors">
                      <FiTrash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">
              Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. take with food"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              maxLength={80}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold disabled:opacity-60">
              {saving ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : <FiCheck size={15} />}
              Save Reminder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ReminderCard ──────────────────────────────────────────────────────────────
function ReminderCard({ reminder, onToggle, onDelete, onEdit }) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    try {
      setToggling(true);
      await apiClient.put(`/patient/medication-reminders/${reminder.id}/toggle`);
      onToggle?.();
    } catch {
      toast.error("Failed to toggle reminder.");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await apiClient.delete(`/patient/medication-reminders/${reminder.id}`);
      toast.success("Reminder removed.");
      onDelete?.();
    } catch {
      toast.error("Failed to remove reminder.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border p-4 transition-all ${reminder.active ? "border-teal-200 shadow-sm" : "border-gray-100 opacity-60"}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${reminder.active ? "bg-teal-100" : "bg-gray-100"}`}>
          <GiPill className={`h-5 w-5 ${reminder.active ? "text-teal-600" : "text-gray-400"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{reminder.medicineName}</p>
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              {freqLabel(reminder.frequency)}
            </span>
            {!reminder.active && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Paused</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {(reminder.reminderTimes || []).map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-cyan-50 border border-cyan-200 text-cyan-700 px-2 py-0.5 rounded-lg font-mono">
                <FiClock size={10} /> {t}
              </span>
            ))}
          </div>

          {reminder.note && (
            <p className="text-xs text-gray-500 mt-1.5 italic">{reminder.note}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onEdit}
            className="text-xs text-cyan-600 hover:text-cyan-800 border border-cyan-200 hover:bg-cyan-50 px-2.5 py-1.5 rounded-lg transition-colors">
            Edit
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            title={reminder.active ? "Pause reminder" : "Resume reminder"}
            className={`p-1.5 rounded-lg transition-colors ${reminder.active ? "text-teal-600 hover:bg-teal-50" : "text-gray-400 hover:bg-gray-50"}`}
          >
            {toggling ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : reminder.active ? <FiBell size={16} /> : <FiBellOff size={16} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Remove reminder"
            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : <FiTrash2 size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PatientMedicationReminders() {
  const [reminders,      setReminders]      = useState([]);
  const [prescriptions,  setPrescriptions]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedMed,    setSelectedMed]    = useState(null); // { medicine, prescriptionId }
  const [editingReminder, setEditingReminder] = useState(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const [remRes, rxRes] = await Promise.all([
        apiClient.get("/patient/medication-reminders"),
        apiClient.get("/patient/prescriptions"),
      ]);
      setReminders(remRes.data?.data || []);
      const allRx = rxRes.data?.data || [];
      // Only show active prescriptions (follow-up in future OR no follow-up)
      const active = allRx.filter((rx) => {
        if (!rx.followUpDate) return true;
        return new Date(rx.followUpDate) > new Date();
      });
      setPrescriptions(active);
    } catch (err) {
      toast.error("Failed to load reminders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Build a lookup: prescriptionId + medicineName → reminder
  const reminderMap = {};
  reminders.forEach((r) => {
    reminderMap[`${r.prescriptionId}::${r.medicineName}`] = r;
  });

  // ── Browser notification pulse (check every minute while tab open) ──────────
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const check = () => {
      const now = new Date();
      const hh  = String(now.getHours()).padStart(2, "0");
      const mm  = String(now.getMinutes()).padStart(2, "0");
      const time = `${hh}:${mm}`;

      reminders.forEach((rem) => {
        if (!rem.active) return;
        if ((rem.reminderTimes || []).includes(time)) {
          new Notification(`💊 ${rem.medicineName}`, {
            body:    `Time to take ${rem.medicineName} (${freqLabel(rem.frequency)})${rem.note ? ` – ${rem.note}` : ""}`,
            icon:    "/favicon.ico",
            tag:     `medivault-reminder-${rem.id}-${time}`,
            silent:  false,
          });
        }
      });
    };

    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [reminders]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse">
          <GiPill className="h-7 w-7 text-white" />
        </div>
        <p className="text-gray-500 text-sm">Loading reminders…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-2xl px-7 py-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white opacity-10 rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl border border-white/30">
            <MdNotifications className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Medication Reminders</h1>
            <p className="text-teal-100 text-sm mt-0.5">
              {reminders.filter((r) => r.active).length} active reminder{reminders.filter((r) => r.active).length !== 1 ? "s" : ""} set
            </p>
          </div>
        </div>
      </div>

      {/* Browser notification banner */}
      <BrowserNotificationBanner onGranted={() => {}} />

      {/* Existing reminders */}
      {reminders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Reminders</h2>
          {reminders.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              onToggle={reload}
              onDelete={reload}
              onEdit={() => {
                // Find the medicine to pass into the form
                const rx = prescriptions.find((p) => p.id === r.prescriptionId);
                const med = rx?.medicines?.find((m) => m.name === r.medicineName)
                  || { name: r.medicineName, frequency: r.frequency };
                setSelectedMed({ medicine: med, prescriptionId: r.prescriptionId });
                setEditingReminder(r);
              }}
            />
          ))}
        </div>
      )}

      {/* Active prescriptions — set new reminders */}
      {prescriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Active Prescriptions</h2>
          {prescriptions.map((rx) => {
            const meds = Array.isArray(rx.medicines) ? rx.medicines : [];
            return (
              <div key={rx.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <MdMedicalServices className="h-4 w-4 text-teal-500" />
                  <span className="text-xs font-semibold text-gray-700 font-mono">{rx.id}</span>
                  {rx.doctorName && <span className="text-xs text-gray-400">— Dr. {rx.doctorName}</span>}
                </div>
                <div className="p-4 space-y-2">
                  {meds.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No medicines in this prescription.</p>
                  )}
                  {meds.map((med, i) => {
                    const key     = `${rx.id}::${med.name}`;
                    const hasReminder = !!reminderMap[key];
                    const active  = reminderMap[key]?.active;

                    return (
                      <div key={i} className="flex items-center gap-3">
                        <GiPill className={`h-4 w-4 flex-shrink-0 ${hasReminder && active ? "text-teal-500" : "text-gray-300"}`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900">{med.name || "—"}</span>
                          {med.dose && <span className="text-xs text-gray-400 ml-2">{med.dose}</span>}
                          <span className="text-xs text-gray-400 ml-2">{freqLabel(med.frequency)}</span>
                        </div>
                        {hasReminder && active ? (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FiBell size={10} /> Reminder set
                          </span>
                        ) : (
                          <button
                            onClick={() => { setSelectedMed({ medicine: med, prescriptionId: rx.id }); setEditingReminder(null); }}
                            className="text-xs text-cyan-600 hover:text-cyan-800 border border-cyan-200 hover:bg-cyan-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <FiPlus size={12} /> Set reminder
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {prescriptions.length === 0 && reminders.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-teal-50 border-2 border-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <GiPill className="h-8 w-8 text-teal-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No active prescriptions</h3>
          <p className="text-sm text-gray-500">
            Once a doctor prescribes medicines, you can set reminders here.
          </p>
        </div>
      )}

      {/* Reminder form modal */}
      {selectedMed && (
        <ReminderForm
          medicine={selectedMed.medicine}
          prescriptionId={selectedMed.prescriptionId}
          existingReminder={editingReminder}
          onSaved={() => { setSelectedMed(null); setEditingReminder(null); reload(); }}
          onClose={() => { setSelectedMed(null); setEditingReminder(null); }}
        />
      )}
    </div>
  );
}

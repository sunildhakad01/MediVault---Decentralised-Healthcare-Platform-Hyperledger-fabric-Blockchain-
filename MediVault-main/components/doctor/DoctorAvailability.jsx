import { useState, useEffect } from 'react';
import apiClient from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiCalendar,
  FiClock,
  FiCheck,
  FiX,
  FiSave,
  FiPlus,
} from 'react-icons/fi';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Display order: Monday first (index 1) … Saturday (6) … Sunday (0)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_SCHEDULE = DAY_ORDER.map((dayOfWeek) => {
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    return { dayOfWeek, isActive: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, maxPatients: 20 };
  }
  if (dayOfWeek === 6) {
    return { dayOfWeek, isActive: true, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30, maxPatients: 10 };
  }
  // Sunday
  return { dayOfWeek, isActive: false, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, maxPatients: 20 };
});

export default function DoctorAvailability() {
  const [doctorId, setDoctorId] = useState(null);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [leaves, setLeaves] = useState([]);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [addingLeave, setAddingLeave] = useState(false);

  // ── Bootstrap doctor ID from localStorage ──────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('mv_doctor_id');
      setDoctorId(id);
    }
  }, []);

  // ── Fetch existing schedule & leaves ───────────────────────────────────────
  useEffect(() => {
    if (!doctorId) return;
    const fetchData = async () => {
      setLoadingSchedule(true);
      try {
        const { data } = await apiClient.get(`/availability/${doctorId}`);
        if (data.success) {
          const { schedule: apiSchedule, leaves: apiLeaves } = data.data;
          if (apiSchedule && apiSchedule.length > 0) {
            // Merge with defaults to ensure all 7 days are represented
            const merged = DAY_ORDER.map((dow) => {
              const found = apiSchedule.find((s) => s.dayOfWeek === dow);
              return found
                ? {
                    dayOfWeek: found.dayOfWeek,
                    isActive: found.isActive,
                    startTime: found.startTime,
                    endTime: found.endTime,
                    slotDurationMinutes: found.slotDurationMinutes,
                    maxPatients: found.maxPatients,
                  }
                : DEFAULT_SCHEDULE.find((d) => d.dayOfWeek === dow);
            });
            setSchedule(merged);
          }
          setLeaves(apiLeaves || []);
        }
      } catch (err) {
        toast.error('Failed to load availability');
      } finally {
        setLoadingSchedule(false);
      }
    };
    fetchData();
  }, [doctorId]);

  // ── Schedule field updater ──────────────────────────────────────────────────
  const updateDay = (dayOfWeek, field, value) => {
    setSchedule((prev) =>
      prev.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, [field]: value } : row))
    );
  };

  // ── Save weekly schedule ────────────────────────────────────────────────────
  const handleSaveSchedule = async () => {
    if (!doctorId) return toast.error('Doctor ID not found');
    setSavingSchedule(true);
    try {
      const { data } = await apiClient.put(`/availability/${doctorId}`, { schedule });
      if (data.success) {
        toast.success('Schedule saved successfully');
      } else {
        toast.error(data.error || 'Failed to save schedule');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  // ── Add leave ───────────────────────────────────────────────────────────────
  const handleAddLeave = async () => {
    if (!leaveDate) return toast.error('Please select a date');
    if (!doctorId) return toast.error('Doctor ID not found');
    setAddingLeave(true);
    try {
      const { data } = await apiClient.post(`/availability/${doctorId}/leave`, {
        leaveDate,
        reason: leaveReason || undefined,
      });
      if (data.success) {
        setLeaves((prev) => [...prev, data.data].sort((a, b) => a.leaveDate.localeCompare(b.leaveDate)));
        setLeaveDate('');
        setLeaveReason('');
        toast.success('Leave date blocked');
      } else {
        toast.error(data.error || 'Failed to add leave');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add leave');
    } finally {
      setAddingLeave(false);
    }
  };

  // ── Remove leave ────────────────────────────────────────────────────────────
  const handleRemoveLeave = async (leaveId) => {
    if (!doctorId) return;
    try {
      const { data } = await apiClient.delete(`/availability/${doctorId}/leave/${leaveId}`);
      if (data.success) {
        setLeaves((prev) => prev.filter((l) => l.id !== leaveId));
        toast.success('Leave removed');
      }
    } catch (err) {
      toast.error('Failed to remove leave');
    }
  };

  // ── Format date for display ─────────────────────────────────────────────────
  const formatLeaveDate = (dateStr) => {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loadingSchedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-md">
            <FiClock className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Availability Settings</h1>
            <p className="text-sm text-gray-500">Manage your weekly schedule and blocked dates</p>
          </div>
        </div>

        {/* ── Weekly Schedule Builder ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-cyan-500 text-lg" />
              <h2 className="text-base font-semibold text-gray-800">Weekly Schedule</h2>
            </div>
            <button
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingSchedule ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSave className="text-sm" />
              )}
              {savingSchedule ? 'Saving…' : 'Save Schedule'}
            </button>
          </div>

          {/* Column Headers */}
          <div className="hidden sm:grid grid-cols-[160px_56px_1fr_1fr_120px_100px] gap-3 px-6 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Day</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Active</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Time</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">End Time</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Slot Duration</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Max Patients</span>
          </div>

          {/* Day Rows */}
          <div className="divide-y divide-gray-50">
            {schedule.map((row) => {
              const inactive = !row.isActive;
              return (
                <div
                  key={row.dayOfWeek}
                  className={`px-6 py-4 transition-colors ${inactive ? 'bg-gray-50' : 'bg-white'}`}
                >
                  {/* Mobile label */}
                  <div className="sm:hidden flex items-center justify-between mb-3">
                    <span className={`text-sm font-semibold ${inactive ? 'text-gray-400' : 'text-gray-800'}`}>
                      {DAY_NAMES[row.dayOfWeek]}
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={row.isActive}
                          onChange={(e) => updateDay(row.dayOfWeek, 'isActive', e.target.checked)}
                        />
                        <div
                          className={`w-10 h-5 rounded-full transition-colors ${
                            row.isActive ? 'bg-cyan-500' : 'bg-gray-200'
                          }`}
                        />
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            row.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </label>
                  </div>

                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-[160px_56px_1fr_1fr_120px_100px] gap-3 items-center">
                    {/* Day name */}
                    <span className={`text-sm font-medium ${inactive ? 'text-gray-400' : 'text-gray-800'}`}>
                      {DAY_NAMES[row.dayOfWeek]}
                    </span>

                    {/* Toggle */}
                    <div className="flex justify-center">
                      <label className="flex items-center cursor-pointer select-none">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={row.isActive}
                            onChange={(e) => updateDay(row.dayOfWeek, 'isActive', e.target.checked)}
                          />
                          <div
                            className={`w-10 h-5 rounded-full transition-colors ${
                              row.isActive ? 'bg-cyan-500' : 'bg-gray-200'
                            }`}
                          />
                          <div
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              row.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </label>
                    </div>

                    {/* Start Time */}
                    <input
                      type="time"
                      value={row.startTime}
                      disabled={inactive}
                      onChange={(e) => updateDay(row.dayOfWeek, 'startTime', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                        inactive
                          ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'bg-white border-gray-200 text-gray-800 hover:border-cyan-300'
                      }`}
                    />

                    {/* End Time */}
                    <input
                      type="time"
                      value={row.endTime}
                      disabled={inactive}
                      onChange={(e) => updateDay(row.dayOfWeek, 'endTime', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                        inactive
                          ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'bg-white border-gray-200 text-gray-800 hover:border-cyan-300'
                      }`}
                    />

                    {/* Slot Duration */}
                    <select
                      value={row.slotDurationMinutes}
                      disabled={inactive}
                      onChange={(e) => updateDay(row.dayOfWeek, 'slotDurationMinutes', Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                        inactive
                          ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'bg-white border-gray-200 text-gray-800 hover:border-cyan-300'
                      }`}
                    >
                      <option value={15}>15 min</option>
                      <option value={20}>20 min</option>
                      <option value={30}>30 min</option>
                    </select>

                    {/* Max Patients */}
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={row.maxPatients}
                      disabled={inactive}
                      onChange={(e) => updateDay(row.dayOfWeek, 'maxPatients', Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                        inactive
                          ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'bg-white border-gray-200 text-gray-800 hover:border-cyan-300'
                      }`}
                    />
                  </div>

                  {/* Mobile fields (shown when active) */}
                  {!inactive && (
                    <div className="sm:hidden grid grid-cols-2 gap-3 mt-1">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={row.startTime}
                          onChange={(e) => updateDay(row.dayOfWeek, 'startTime', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Time</label>
                        <input
                          type="time"
                          value={row.endTime}
                          onChange={(e) => updateDay(row.dayOfWeek, 'endTime', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Slot Duration</label>
                        <select
                          value={row.slotDurationMinutes}
                          onChange={(e) => updateDay(row.dayOfWeek, 'slotDurationMinutes', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        >
                          <option value={15}>15 min</option>
                          <option value={20}>20 min</option>
                          <option value={30}>30 min</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Max Patients</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={row.maxPatients}
                          onChange={(e) => updateDay(row.dayOfWeek, 'maxPatients', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>
                    </div>
                  )}
                  {inactive && (
                    <p className="sm:hidden text-xs text-gray-400 italic mt-1">Not available this day</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Toggle the switch to mark a day as available or unavailable. Changes take effect after saving.
            </p>
          </div>
        </div>

        {/* ── Leave Management ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <FiCalendar className="text-cyan-500 text-lg" />
            <h2 className="text-base font-semibold text-gray-800">Blocked / Leave Dates</h2>
          </div>

          {/* Add Leave Form */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <p className="text-sm text-gray-600 mb-4">
              Block a specific date — no appointments will be bookable on that day.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400 hover:border-cyan-300 transition-colors"
                />
              </div>
              <div className="flex-[2]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Conference, Personal leave…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400 hover:border-cyan-300 transition-colors"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddLeave}
                  disabled={addingLeave || !leaveDate}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {addingLeave ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiPlus className="text-sm" />
                  )}
                  {addingLeave ? 'Blocking…' : 'Block Date'}
                </button>
              </div>
            </div>
          </div>

          {/* Leave List */}
          <div className="px-6 py-4">
            {leaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <FiCheck className="text-gray-400 text-xl" />
                </div>
                <p className="text-sm text-gray-500">No dates blocked</p>
                <p className="text-xs text-gray-400">Block specific dates when you are unavailable</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 -mx-6">
                {leaves.map((leave) => (
                  <li
                    key={leave.id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <FiX className="text-red-400 text-sm" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{formatLeaveDate(leave.leaveDate)}</p>
                        {leave.reason && (
                          <p className="text-xs text-gray-400 mt-0.5">{leave.reason}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveLeave(leave.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                    >
                      <FiX className="text-xs" />
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Info Card ── */}
        <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-100 rounded-2xl px-6 py-4 flex gap-4 items-start">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <FiClock className="text-white text-sm" />
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-800 mb-1">How Slots Work</p>
            <p className="text-xs text-teal-700 leading-relaxed">
              Your weekly schedule defines the time range and slot duration for each day. Patients can book
              any open slot within those hours. Blocked dates override the weekly schedule — the doctor will
              appear unavailable regardless of the weekly settings.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

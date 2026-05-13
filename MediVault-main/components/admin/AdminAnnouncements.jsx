import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FiBell,
  FiSend,
  FiClock,
  FiCheckCircle,
  FiArrowLeft,
  FiRefreshCw,
  FiUsers,
  FiCalendar,
} from "react-icons/fi";
import {
  MdAnnouncement,
  MdAdminPanelSettings,
  MdSecurity,
} from "react-icons/md";
import { FaHospital, FaUserMd, FaHospitalUser } from "react-icons/fa";
import { Card, Button, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min} IST`;
};

const TARGET_OPTIONS = [
  { value: "all", label: "All Users", icon: FiUsers },
  { value: "hospitals", label: "Hospitals", icon: FaHospital },
  { value: "doctors", label: "Doctors", icon: FaUserMd },
  { value: "individual_doctors", label: "Individual Doctors", icon: FaUserMd },
  { value: "patients", label: "Patients", icon: FaHospitalUser },
];

const STATUS_STYLES = {
  sent: "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none",
  scheduled:
    "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-none",
  draft: "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-none",
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminAnnouncements = () => {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targets, setTargets] = useState([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // List state
  const [announcements, setAnnouncements] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const MAX_MSG = 1000;

  // ── Fetch past announcements ──────────────────────────────────────────────
  const loadAnnouncements = async () => {
    try {
      const res = await apiClient.get("/admin/announcements");
      const data = res.data?.data ?? res.data ?? [];
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load announcements");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
    toast.success("Announcements refreshed");
  };

  // ── Target checkbox toggle ────────────────────────────────────────────────
  const toggleTarget = (val) => {
    if (val === "all") {
      setTargets((prev) =>
        prev.includes("all") ? [] : TARGET_OPTIONS.map((o) => o.value)
      );
      return;
    }
    setTargets((prev) =>
      prev.includes(val) ? prev.filter((t) => t !== val) : [...prev.filter(t => t !== "all"), val]
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    if (!message.trim()) return toast.error("Message is required");
    if (targets.length === 0) return toast.error("Select at least one target audience");

    setSubmitting(true);
    try {
      await apiClient.post("/admin/announcements", {
        title: title.trim(),
        message: message.trim(),
        targets,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });

      const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
      toast.success(isScheduled ? "Announcement scheduled!" : "Announcement sent!");

      // Reset form
      setTitle("");
      setMessage("");
      setTargets([]);
      setScheduledAt("");

      await loadAnnouncements();
    } catch (err) {
      toast.error(
        err?.response?.data?.error ?? "Failed to send announcement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isScheduled =
    scheduledAt && new Date(scheduledAt) > new Date();

  return (
    <div className="space-y-8 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <MdAnnouncement className="absolute top-20 right-20 h-32 w-32 text-indigo-600 animate-pulse" />
        <FiBell className="absolute bottom-20 left-20 h-24 w-24 text-purple-600" />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl border-2 border-indigo-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-12 translate-y-12"></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm border border-white border-opacity-30 shadow-lg">
              <MdAnnouncement className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                Platform Announcements
                <FiBell className="h-7 w-7" />
              </h1>
              <p className="text-indigo-100 text-lg flex items-center gap-2">
                <MdSecurity className="h-4 w-4" />
                Broadcast messages to users across MediVault
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
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Compose Form */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-xl">
        <div className="p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
              <FiSend className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Compose Announcement
              </h2>
              <p className="text-gray-600">
                Fill in the details and choose your audience
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-indigo-700 uppercase tracking-wide mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title..."
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-gray-900 font-medium"
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-indigo-700 uppercase tracking-wide">
                  Message <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-sm font-medium ${
                    message.length > MAX_MSG * 0.9
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {message.length}/{MAX_MSG}
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value.slice(0, MAX_MSG))
                }
                placeholder="Write your announcement message here..."
                required
                rows={5}
                className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-gray-900 resize-vertical"
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-bold text-indigo-700 uppercase tracking-wide mb-3">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {TARGET_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                      targets.includes(value)
                        ? "border-indigo-500 bg-indigo-100 shadow-md"
                        : "border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={targets.includes(value)}
                      onChange={() => toggleTarget(value)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${
                        targets.includes(value)
                          ? "text-indigo-600"
                          : "text-gray-500"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        targets.includes(value)
                          ? "text-indigo-700"
                          : "text-gray-700"
                      }`}
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-bold text-indigo-700 uppercase tracking-wide mb-2">
                Schedule for Later{" "}
                <span className="text-gray-400 font-normal normal-case">
                  (optional — IST)
                </span>
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full md:w-72 px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-gray-900"
              />
              {scheduledAt && (
                <p className="text-sm text-indigo-600 mt-2 flex items-center gap-1">
                  <FiClock className="h-3 w-3" />
                  Will be sent at:{" "}
                  <span className="font-medium">{fmtDateTime(scheduledAt)}</span>
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                {submitting ? (
                  <FiRefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : isScheduled ? (
                  <FiClock className="h-5 w-5 mr-2" />
                ) : (
                  <FiSend className="h-5 w-5 mr-2" />
                )}
                {submitting
                  ? "Sending..."
                  : isScheduled
                  ? "Schedule Announcement"
                  : "Send Announcement"}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Past Announcements */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                <FiBell className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Past Announcements
                </h2>
                <p className="text-gray-600">
                  Recently sent and scheduled announcements
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <FiRefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {listLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-purple-200">
              <MdAnnouncement className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">
                No announcements yet
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Use the form above to send your first announcement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => {
                const displayedTargets = Array.isArray(ann.targets)
                  ? ann.targets
                      .map(
                        (t) =>
                          TARGET_OPTIONS.find((o) => o.value === t)?.label ?? t
                      )
                      .join(", ")
                  : "—";

                const displayAt =
                  ann.status === "scheduled"
                    ? fmtDateTime(ann.scheduledAt)
                    : fmtDateTime(ann.sentAt ?? ann.createdAt);

                return (
                  <div
                    key={ann.id}
                    className="p-5 bg-white rounded-xl border-2 border-purple-200 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {ann.title}
                          </h3>
                          <Badge
                            className={
                              STATUS_STYLES[ann.status] ??
                              STATUS_STYLES.draft
                            }
                          >
                            {ann.status === "scheduled" ? (
                              <FiClock className="w-3 h-3 mr-1" />
                            ) : (
                              <FiCheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {ann.status
                              ? ann.status.charAt(0).toUpperCase() +
                                ann.status.slice(1)
                              : "Sent"}
                          </Badge>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed mb-3 line-clamp-3">
                          {ann.message}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiUsers className="h-3 w-3 text-indigo-500" />
                            <span className="font-medium">Targets:</span>{" "}
                            {displayedTargets}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiCalendar className="h-3 w-3 text-purple-500" />
                            <span className="font-medium">
                              {ann.status === "scheduled"
                                ? "Scheduled for:"
                                : "Sent at:"}
                            </span>{" "}
                            {displayAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminAnnouncements;

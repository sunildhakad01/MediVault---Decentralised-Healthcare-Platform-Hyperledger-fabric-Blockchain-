import { useState, useEffect, useCallback } from "react";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiFileText,
  FiBell,
  FiShield,
  FiCheck,
} from "react-icons/fi";
import {
  MdNotifications,
  MdMarkEmailRead,
} from "react-icons/md";
import { GiPill } from "react-icons/gi";
import { BiRupee } from "react-icons/bi";
import { Card, Button } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  if (diff < 0) return "just now";
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs} second${secs !== 1 ? "s" : ""} ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? "s" : ""} ago`;
};

const formatAbsoluteIST = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${dd}/${mm}/${yyyy} ${hours}:${mins} ${ampm} IST`;
};

// ─── Notification type → icon ─────────────────────────────────────────────────

const NotificationIcon = ({ type }) => {
  const base = "h-5 w-5";
  const map = {
    appointment: {
      icon: <FiCalendar className={`${base} text-blue-600`} />,
      bg: "bg-blue-100",
    },
    report: {
      icon: <FiFileText className={`${base} text-indigo-600`} />,
      bg: "bg-indigo-100",
    },
    prescription: {
      icon: <GiPill className={`${base} text-purple-600`} />,
      bg: "bg-purple-100",
    },
    payment: {
      icon: <BiRupee className={`${base} text-emerald-600`} />,
      bg: "bg-emerald-100",
    },
    system: {
      icon: <FiBell className={`${base} text-gray-600`} />,
      bg: "bg-gray-100",
    },
    verification: {
      icon: <FiShield className={`${base} text-teal-600`} />,
      bg: "bg-teal-100",
    },
  };
  const resolved = map[type] || map.system;
  return (
    <div className={`p-2.5 rounded-xl ${resolved.bg} flex-shrink-0`}>
      {resolved.icon}
    </div>
  );
};

// ─── Single notification card ─────────────────────────────────────────────────

const NotificationCard = ({ notification }) => {
  const isUnread = !notification.read;
  const ts = notification.createdAt || notification.timestamp;

  return (
    <div
      className={`relative rounded-2xl p-4 transition-all duration-200 ${
        isUnread
          ? "bg-white border border-gray-200 shadow-sm border-l-4 border-l-blue-500"
          : "bg-gray-50 border border-gray-100"
      }`}
    >
      <div className="flex items-start gap-4">
        <NotificationIcon type={notification.type} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`font-semibold text-sm leading-snug ${
                isUnread ? "text-gray-900" : "text-gray-700"
              }`}
            >
              {notification.title}
            </p>
            {isUnread && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
            )}
          </div>

          <p
            className={`text-sm mt-1 leading-relaxed ${
              isUnread ? "text-gray-700" : "text-gray-500"
            }`}
          >
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-teal-600 font-medium">
              {formatRelativeTime(ts)}
            </span>
            {ts && (
              <>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">
                  {formatAbsoluteIST(ts)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const PatientNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/patient/notifications");
      const list = data?.data || data || [];
      // Sort newest first
      const sorted = [...list].sort(
        (a, b) =>
          new Date(b.createdAt || b.timestamp || 0) -
          new Date(a.createdAt || a.timestamp || 0)
      );
      setNotifications(sorted);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      setMarkingAll(true);
      await apiClient.put("/patient/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read.");
    } catch (err) {
      toast.error("Failed to mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-500 font-medium">
            Loading notifications…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl relative">
              <MdNotifications className="h-8 w-8" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-white bg-opacity-25 text-white text-sm font-semibold px-2.5 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
              <p className="text-teal-100 text-sm mt-1">
                Stay up to date with your health activities
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30 flex items-center gap-2 text-sm"
            >
              {markingAll ? (
                <LoadingSpinner size="small" />
              ) : (
                <FiCheck className="h-4 w-4" />
              )}
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200">
          <div className="text-center py-16">
            <div className="p-5 bg-teal-100 rounded-full w-fit mx-auto mb-5">
              <MdNotifications className="h-10 w-10 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-500 text-sm">
              You will see appointment reminders, prescription updates, and more
              here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Unread section */}
          {unreadCount > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                Unread
              </p>
              {notifications
                .filter((n) => !n.read)
                .map((n) => (
                  <NotificationCard key={n._id || n.id} notification={n} />
                ))}
            </div>
          )}

          {/* Read section */}
          {notifications.filter((n) => n.read).length > 0 && (
            <div className="space-y-3">
              {unreadCount > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 pt-2">
                  Earlier
                </p>
              )}
              {notifications
                .filter((n) => n.read)
                .map((n) => (
                  <NotificationCard key={n._id || n.id} notification={n} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Mark all read — floating footer if list is long */}
      {notifications.length > 5 && unreadCount > 0 && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 flex items-center gap-2"
          >
            <MdMarkEmailRead className="h-5 w-5" />
            Mark all as read
          </Button>
        </div>
      )}
    </div>
  );
};

export default PatientNotifications;

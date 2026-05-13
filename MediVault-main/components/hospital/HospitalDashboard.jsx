import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import HospitalBeds from './HospitalBeds';
import HospitalLab from './HospitalLab';
import HospitalBilling from './HospitalBilling';
import {
  MdLocalHospital,
  MdVerifiedUser,
  MdHealthAndSafety,
  MdAdminPanelSettings,
  MdAnalytics,
  MdNotifications,
  MdHotelClass,
} from 'react-icons/md';
import {
  FiHome,
  FiCalendar,
  FiUpload,
  FiSettings,
  FiActivity,
  FiCheck,
  FiX,
  FiClock,
  FiEye,
  FiMenu,
  FiLock,
  FiTrendingUp,
  FiAlertCircle,
  FiUsers,
  FiPlus,
  FiEdit2,
  FiPhone,
  FiMail,
  FiGlobe,
  FiToggleLeft,
  FiToggleRight,
  FiFilter,
  FiSave,
  FiLogOut,
  FiSearch,
  FiSend,
  FiRefreshCw,
  FiTrash2,
  FiUserPlus,
  FiFileText,
  FiDroplet,
} from 'react-icons/fi';
import apiClient from '../../utils/api';
import {
  FaUserMd,
  FaHospitalUser,
} from 'react-icons/fa';

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_HOSPITAL = {
  name: 'Apollo Hospitals',
  type: 'Private Hospital',
  city: 'New Delhi',
  verificationStatus: 'verified',
  registrationNumber: 'HOS/2024/08321',
};

const MOCK_STATS = [
  { label: 'Total Doctors',        value: 48,   icon: FaUserMd,      color: 'teal',   sub: '3 pending approval' },
  { label: 'Patients Treated',     value: 1240, icon: FaHospitalUser, color: 'emerald',sub: 'This month: 142' },
  { label: 'Pending Approvals',    value: 3,    icon: FiClock,        color: 'amber',  sub: 'Doctor affiliations' },
  { label: "Today's Appointments", value: 27,   icon: FiCalendar,     color: 'cyan',   sub: '8 completed' },
];

const MOCK_DOCTOR_REQUESTS = [
  { id: 1, name: 'Dr. Priya Sharma', specialisation: 'Cardiologist',  license: 'DL/2023/4521', submittedAt: '2026-03-18', status: 'pending' },
  { id: 2, name: 'Dr. Rahul Mehta',  specialisation: 'Neurologist',   license: 'DL/2022/8830', submittedAt: '2026-03-17', status: 'pending' },
  { id: 3, name: 'Dr. Anita Gupta',  specialisation: 'Orthopaedics',  license: 'DL/2021/3317', submittedAt: '2026-03-16', status: 'pending' },
];

const MOCK_RECENT_PATIENTS = [
  { id: 'PT-001', visitDate: '2026-03-19', department: 'Cardiology',   status: 'Active',     consentGiven: true },
  { id: 'PT-002', visitDate: '2026-03-19', department: 'Neurology',    status: 'Discharged', consentGiven: false },
  { id: 'PT-003', visitDate: '2026-03-18', department: 'Orthopaedics', status: 'Active',     consentGiven: true },
  { id: 'PT-004', visitDate: '2026-03-18', department: 'General',      status: 'Discharged', consentGiven: false },
];

const MOCK_NOTIFICATIONS = [
  { text: 'Dr. Priya Sharma requested affiliation',              time: '2 hours ago', type: 'doctor' },
  { text: 'Patient PT-001 granted consent for record access',    time: '3 hours ago', type: 'consent' },
  { text: 'Lab report uploaded for Patient PT-003',              time: 'Yesterday',   type: 'upload' },
  { text: 'New appointment booked for tomorrow 10:00 AM',        time: 'Yesterday',   type: 'appointment' },
];

// ── Sidebar Nav Items ──────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview',       label: 'Overview',              icon: FiHome },
  { id: 'doctors',        label: 'Doctor Management',     icon: FaUserMd },
  { id: 'departments',    label: 'Departments',           icon: FiActivity },
  { id: 'patients',       label: 'Patient Records',       icon: FaHospitalUser },
  { id: 'appointments',   label: 'Appointments',          icon: FiCalendar },
  { id: 'beds',           label: 'Beds & Admissions',     icon: MdHotelClass },
  { id: 'lab',            label: 'Lab',                   icon: FiDroplet },
  { id: 'billing',        label: 'Billing',               icon: FiFileText },
  { id: 'staff',          label: 'Staff Management',      icon: FiUsers },
  { id: 'notifications',  label: 'Notifications',         icon: MdNotifications },
  { id: 'profile',        label: 'Hospital Profile',      icon: FiEye },
  { id: 'analytics',      label: 'Analytics',             icon: MdAnalytics },
  { id: 'settings',       label: 'Settings',              icon: FiSettings },
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const MEDICAL_COUNCILS = [
  'National Medical Commission (NMC)',
  'Andhra Pradesh Medical Council','Arunachal Pradesh Medical Council','Assam Medical Council',
  'Bihar Medical Council','Chhattisgarh Medical Council','Delhi Medical Council',
  'Goa Medical Council','Gujarat Medical Council','Haryana Medical Council',
  'Himachal Pradesh Medical Council','Jharkhand Medical Council','Karnataka Medical Council',
  'Kerala Medical Council','Madhya Pradesh Medical Council','Maharashtra Medical Council',
  'Manipur Medical Council','Meghalaya Medical Council','Mizoram Medical Council',
  'Nagaland Medical Council','Odisha Medical Council','Punjab Medical Council',
  'Rajasthan Medical Council','Tamil Nadu Medical Council','Telangana State Medical Council',
  'Tripura Medical Council','Uttar Pradesh Medical Council','Uttarakhand Medical Council',
  'West Bengal Medical Council',
];

const DEGREES = ['MBBS','MD','MS','BDS','BAMS','BHMS','DNB','DM','MCh','Other'];
const DESIGNATIONS = ['Consultant','Senior Consultant','Head of Department','Resident','Fellow'];
const LANGUAGES = ['Hindi','English','Marathi','Bengali','Tamil','Telugu','Kannada','Malayalam','Gujarati','Punjabi','Other'];
const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 text-gray-800';

const COLOR_MAP = {
  teal:   'from-teal-500 to-teal-600',
  emerald:'from-emerald-500 to-emerald-600',
  amber:  'from-amber-400 to-orange-400',
  cyan:   'from-cyan-500 to-cyan-600',
};

// ── Inline Notifications Section ───────────────────────────────────────────────

const NOTIF_TYPE_META = {
  appointment: { cls: 'bg-cyan-100 text-cyan-700',    label: 'Appointment' },
  report:      { cls: 'bg-emerald-100 text-emerald-700', label: 'Lab Report' },
  prescription:{ cls: 'bg-purple-100 text-purple-700', label: 'Prescription' },
  payment:     { cls: 'bg-amber-100 text-amber-700',   label: 'Payment' },
  system:      { cls: 'bg-gray-100 text-gray-600',     label: 'System' },
  verification:{ cls: 'bg-blue-100 text-blue-700',     label: 'Verification' },
};

function HospitalNotificationsSection({ hospitalId, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ title: '', body: '', channels: ['in_app'], audience: 'all' });
  const [sending, setSending] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/hospital/${hospitalId}/notifications`);
      setNotifications(data.data || []);
      setUnread(data.unread || 0);
      onUnreadChange?.(data.unread || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [hospitalId, onUnreadChange]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await apiClient.put(`/hospital/${hospitalId}/notifications/read-all`);
      setNotifications(n => n.map(x => ({ ...x, read: true })));
      setUnread(0);
      onUnreadChange?.(0);
    } catch { toast.error('Failed to mark all as read'); }
  };

  const markRead = async (id) => {
    try {
      await apiClient.put(`/hospital/${hospitalId}/notifications/${id}/read`);
      setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
      setUnread(u => Math.max(0, u - 1));
      onUnreadChange?.(Math.max(0, unread - 1));
    } catch { /* ignore */ }
  };

  const handleSend = async () => {
    if (!sendForm.title.trim() || !sendForm.body.trim()) { toast.error('Title and message are required'); return; }
    setSending(true);
    try {
      const res = await apiClient.post(`/hospital/${hospitalId}/notifications/send`, sendForm);
      toast.success(res.data?.message || 'Notification sent');
      setShowSend(false);
      setSendForm({ title: '', body: '', channels: ['in_app'], audience: 'all' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send notification');
    } finally { setSending(false); }
  };

  const toggleChannel = (ch) => {
    setSendForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
    }));
  };

  const inputCls2 = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-800">Notifications</h2>
          {unread > 0 && (
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{unread} unread</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">
              Mark all read
            </button>
          )}
          <button
            onClick={() => setShowSend(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all"
          >
            <FiSend className="h-3.5 w-3.5" /> Send to Patients
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="px-5 py-12 text-center">
            <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading notifications…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-3">
              <MdNotifications className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">Hospital events will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(n => {
              const meta = NOTIF_TYPE_META[n.type] || NOTIF_TYPE_META.system;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`px-5 py-4 flex items-start gap-4 cursor-pointer transition-colors ${n.read ? '' : 'bg-cyan-50 hover:bg-cyan-100'}`}
                >
                  <div className={`flex-shrink-0 mt-0.5 w-2 h-2 rounded-full ${n.read ? 'bg-gray-200' : 'bg-cyan-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send to Patients Modal */}
      {showSend && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Send Notification to Patients</h3>
              <button onClick={() => setShowSend(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Audience</label>
                <select value={sendForm.audience} onChange={e => setSendForm(f => ({ ...f, audience: e.target.value }))} className={inputCls2}>
                  <option value="all">All Patients</option>
                  <option value="upcoming">Patients with Upcoming Appointments</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                <input value={sendForm.title} onChange={e => setSendForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title" className={inputCls2} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Message *</label>
                <textarea value={sendForm.body} onChange={e => setSendForm(f => ({ ...f, body: e.target.value }))} rows={3} placeholder="Notification message" className={inputCls2 + ' resize-none'} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Channels</label>
                <div className="flex items-center gap-3">
                  {[['in_app', 'In-App'], ['sms', 'SMS']].map(([val, lbl]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={sendForm.channels.includes(val)} onChange={() => toggleChannel(val)} className="rounded text-cyan-500" />
                      <span className="text-sm text-gray-700">{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowSend(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50"
              >
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSend className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

const HospitalDashboard = ({ defaultTab = 'overview' }) => {
  const router = useRouter();
  const [activeSection,  setActiveSection]  = useState(defaultTab);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [hospitalStatus, setHospitalStatus] = useState(null);
  const [hospitalData,   setHospitalData]   = useState(MOCK_HOSPITAL);
  const [rejectionReason,  setRejectionReason]  = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');

  // ── Doctors state ──
  const [doctors,          setDoctors]          = useState([]);
  const [doctorsLoading,   setDoctorsLoading]   = useState(false);
  const [doctorSearch,     setDoctorSearch]     = useState('');
  const [doctorStatusFilter, setDoctorStatusFilter] = useState('');
  const [showRegisterDoctor, setShowRegisterDoctor] = useState(false);
  const [showInviteDoctor,   setShowInviteDoctor]   = useState(false);
  const [regDoctorForm, setRegDoctorForm] = useState({
    fullName: '', email: '', phone: '+91', gender: 'Male',
    dateOfBirth: '', joiningDate: '',
    medicalCouncilRegNo: '', medicalCouncil: '', degree: 'MBBS',
    specialization: '', experienceYears: '', consultationFee: '',
    languagesSpoken: [], bio: '', department: '', designation: 'Consultant',
    _deptOther: '',
  });
  const [regDoctorSaving, setRegDoctorSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: '', email: '', phone: '+91', department: '',
    designation: 'Consultant', consultationFee: '', message: '',
  });
  const [inviteSaving, setInviteSaving] = useState(false);
  const [invites, setInvites] = useState([]);
  // Approve/Reject modal
  const [rejectModal, setRejectModal] = useState({ open: false, doctorId: null, name: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSaving, setRejectSaving] = useState(false);

  // ── Departments state ──
  const [departments,      setDepartments]      = useState([]);
  const [deptLoading,      setDeptLoading]      = useState(false);
  const [showAddDept,      setShowAddDept]      = useState(false);
  const [editDept,         setEditDept]         = useState(null);
  const [deptForm,         setDeptForm]         = useState({ name: '', description: '', dailyCapacity: 20, defaultSlotMinutes: 20 });
  const [deptSaving,       setDeptSaving]       = useState(false);

  // ── Notification bell state ──
  const [notifUnread, setNotifUnread] = useState(0);

  // ── Appointments state ──
  const [appointments, setAppointments]         = useState([]);
  const [apptLoading, setApptLoading]           = useState(false);
  const [apptStatusFilter, setApptStatusFilter] = useState('');
  const [showWalkInModal, setShowWalkInModal]   = useState(false);
  const [walkIn, setWalkIn] = useState({ patientSearch: '', patientId: '', patientName: '', doctorId: '', date: '', time: '' });
  const [walkInSaving, setWalkInSaving] = useState(false);
  const [walkInPatients, setWalkInPatients] = useState([]);
  const [walkInDoctors,  setWalkInDoctors]  = useState([]);
  const [apptStatusChanging, setApptStatusChanging] = useState(null);

  // ── Staff state ──
  const [staff, setStaff]                   = useState([]);
  const [staffLoading, setStaffLoading]     = useState(false);
  const [showAddStaff, setShowAddStaff]     = useState(false);
  const [staffForm, setStaffForm]           = useState({
    fullName: '', role: 'receptionist', phone: '+91', email: '',
    department: '', shiftStart: '09:00', shiftEnd: '17:00',
  });
  const [staffSaving, setStaffSaving]       = useState(false);

  // ── Profile state ──
  const [profileData, setProfileData]       = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm]       = useState({});
  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileTab, setProfileTab]         = useState('basic');
  const [profileWorkingHours, setProfileWorkingHours] = useState({});
  const [profileLogoUploading, setProfileLogoUploading] = useState(false);
  const [adminForm, setAdminForm]           = useState({ adminName:'', currentPassword:'', newPassword:'', confirmPassword:'' });
  const [adminSaving, setAdminSaving]       = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const profileLogoRef = useRef(null);

  // ── Fetch unread notification count on mount ──
  useEffect(() => {
    const hospitalId = localStorage.getItem('mv_hospital_id') || '';
    if (!hospitalId) return;
    apiClient.get(`/hospital/${hospitalId}/notifications`, { params: { limit: 1 } })
      .then(res => setNotifUnread(res.data?.unread || 0))
      .catch(() => {});
  }, []);

  // ── Fetch appointments when section becomes active ──
  useEffect(() => {
    if (activeSection !== 'appointments') return;
    const hospitalId = localStorage.getItem('mv_hospital_id') || '';
    if (!hospitalId) return;
    setApptLoading(true);
    const params = {};
    if (apptStatusFilter) params.status = apptStatusFilter;
    apiClient.get(`/hospital/${hospitalId}/appointments`, { params })
      .then(res => setAppointments(res.data?.data || []))
      .catch(() => setAppointments([]))
      .finally(() => setApptLoading(false));
  }, [activeSection, apptStatusFilter]);

  // ── Fetch staff when section becomes active ──
  useEffect(() => {
    if (activeSection !== 'staff') return;
    const hospitalId = localStorage.getItem('mv_hospital_id') || '';
    if (!hospitalId) return;
    setStaffLoading(true);
    apiClient.get(`/hospital/staff/${hospitalId}`)
      .then(res => setStaff(res.data?.data || []))
      .catch(() => setStaff([]))
      .finally(() => setStaffLoading(false));
  }, [activeSection]);

  // ── Fetch profile when section becomes active ──
  useEffect(() => {
    if (activeSection !== 'profile') return;
    const hospitalId = localStorage.getItem('mv_hospital_id') || '';
    if (!hospitalId) return;
    setProfileLoading(true);
    apiClient.get(`/hospital/${hospitalId}`)
      .then(res => {
        const h = res.data?.data || {};
        setProfileData(h);
        setProfileForm({
          name: h.name || '', hospitalType: h.hospitalType || '',
          addressLine1: h.addressLine1 || '', addressLine2: h.addressLine2 || '',
          city: h.city || '', state: h.state || '', pincode: h.pincode || '',
          phone: h.phone || '', altPhone: h.altPhone || '',
          emergencyPhone: h.emergencyPhone || '',
          email: h.email || '', website: h.website || '',
          gstin: h.gstin || '', emergencyAvailable: !!h.emergencyAvailable,
          yearEstablished: h.yearEstablished || '', numberOfBeds: h.numberOfBeds || '',
          landmark: h.landmark || '', googleMapsLink: h.googleMapsLink || '',
          specialisations: h.specialisations || '',
        });
        // Pre-fill working hours
        const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const defaultH = DAYS.reduce((a, d) => ({ ...a, [d]: { open: d !== 'Sun', start: '09:00', end: '17:00' } }), {});
        setProfileWorkingHours(h.workingHours && Object.keys(h.workingHours).length ? h.workingHours : defaultH);
        // Pre-fill admin form with stored admin name
        setAdminForm(prev => ({ ...prev, adminName: h.adminName || '' }));
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [activeSection]);

  const getHospitalId = () => localStorage.getItem('mv_hospital_id') || '';

  // ── Sign Out ──
  const handleSignOut = async () => {
    try { await apiClient.post('/auth/logout'); } catch (_) {}
    finally {
      ['mv_token','mv_refresh','mv_user_id','mv_user_type','mv_hospital_id'].forEach(k => localStorage.removeItem(k));
      window.location.href = '/login';
    }
  };

  // ── Staff handlers ──
  const handleAddStaff = () => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    if (!staffForm.fullName || !staffForm.phone) { toast.error('Name and phone are required'); return; }
    setStaffSaving(true);
    apiClient.post(`/hospital/staff/${hospitalId}`, staffForm)
      .then(res => {
        setStaff(prev => [...prev, res.data?.data || staffForm]);
        setShowAddStaff(false);
        toast.success('Staff member added');
        setStaffForm({ fullName: '', role: 'receptionist', phone: '+91', email: '', department: '', shiftStart: '09:00', shiftEnd: '17:00' });
      })
      .catch(err => toast.error(err.response?.data?.error || 'Failed to add staff'))
      .finally(() => setStaffSaving(false));
  };

  const handleToggleStaff = (staffId, current) => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    apiClient.put(`/hospital/staff/${hospitalId}/${staffId}`, { isActive: !current })
      .then(() => {
        setStaff(prev => prev.map(s => s.id === staffId ? { ...s, isActive: !current } : s));
        toast.success(current ? 'Staff deactivated' : 'Staff activated');
      })
      .catch(() => toast.error('Failed to update staff status'));
  };

  // ── Profile handler ──
  const handleSaveProfile = () => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    setProfileSaving(true);
    apiClient.put(`/hospital/${hospitalId}`, profileForm)
      .then(res => {
        setProfileData(res.data?.data || profileData);
        setProfileEditMode(false);
        toast.success('Profile saved');
      })
      .catch(() => toast.error('Failed to save profile'))
      .finally(() => setProfileSaving(false));
  };

  const handleSaveWorkingHours = () => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    setProfileSaving(true);
    apiClient.put(`/hospital/${hospitalId}`, { workingHours: profileWorkingHours })
      .then(() => {
        setProfileData(p => ({ ...p, workingHours: profileWorkingHours }));
        toast.success('Working hours saved');
      })
      .catch(() => toast.error('Failed to save working hours'))
      .finally(() => setProfileSaving(false));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo too large (max 2 MB)'); return; }
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    setProfileLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('docType', 'logo');
      const res = await apiClient.post('/hospital/document-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        await apiClient.put(`/hospital/${hospitalId}`, { logoUrl: res.data.url });
        setProfileData(p => ({ ...p, logoUrl: res.data.url }));
        toast.success('Logo updated');
      }
    } catch { toast.error('Logo upload failed'); }
    finally { setProfileLogoUploading(false); if (profileLogoRef.current) profileLogoRef.current.value = ''; }
  };

  const handleSaveAdminAccount = () => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    if (!adminForm.adminName.trim()) { toast.error('Admin name is required'); return; }
    setAdminSaving(true);
    apiClient.put(`/hospital/${hospitalId}`, { adminName: adminForm.adminName.trim() })
      .then(() => {
        setProfileData(p => ({ ...p, adminName: adminForm.adminName.trim() }));
        toast.success('Admin account updated');
      })
      .catch(() => toast.error('Failed to update admin account'))
      .finally(() => setAdminSaving(false));
  };

  const handleChangePassword = async () => {
    if (!adminForm.currentPassword) { toast.error('Current password is required'); return; }
    if (!adminForm.newPassword || adminForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (adminForm.newPassword !== adminForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPasswordSaving(true);
    try {
      await apiClient.put('/auth/change-pin', {
        currentPin: adminForm.currentPassword,
        newPin: adminForm.newPassword,
      });
      toast.success('Password changed successfully');
      setAdminForm(p => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally { setPasswordSaving(false); }
  };

  // ── Doctor handlers ──
  const fetchDoctors = useCallback(() => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    setDoctorsLoading(true);
    const params = {};
    if (doctorStatusFilter) params.status = doctorStatusFilter;
    if (doctorSearch) params.search = doctorSearch;
    apiClient.get(`/hospital/${hospitalId}/doctors`, { params })
      .then(res => setDoctors(res.data?.data || []))
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false));
  }, [doctorStatusFilter, doctorSearch]);

  useEffect(() => {
    if (activeSection === 'doctors') {
      fetchDoctors();
      const hospitalId = localStorage.getItem('mv_hospital_id') || '';
      if (hospitalId) {
        apiClient.get(`/hospital/${hospitalId}/invites`)
          .then(r => setInvites(r.data?.data || []))
          .catch(() => {});
      }
    }
  }, [activeSection, fetchDoctors]);

  const handleApproveDoctor = async (doctorId, doctorName) => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    try {
      await apiClient.put(`/hospital/${hospitalId}/doctors/${doctorId}/verify`, { action: 'approve' });
      toast.success(`Dr. ${doctorName} approved`);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve doctor');
    }
  };

  const handleRejectDoctor = async () => {
    const hospitalId = getHospitalId();
    if (!hospitalId || !rejectModal.doctorId) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      toast.error('Please provide a reason (min 10 characters)');
      return;
    }
    setRejectSaving(true);
    try {
      await apiClient.put(`/hospital/${hospitalId}/doctors/${rejectModal.doctorId}/verify`, { action: 'reject', reason: rejectReason.trim() });
      toast.success(`Dr. ${rejectModal.name} rejected`);
      setRejectModal({ open: false, doctorId: null, name: '' });
      setRejectReason('');
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject doctor');
    } finally {
      setRejectSaving(false);
    }
  };

  const handleRegisterDoctor = async () => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    const f = regDoctorForm;
    const resolvedDept = f.department === '__other__' ? (f._deptOther || '').trim() : f.department;
    if (!f.fullName || !f.email || !f.phone || !f.medicalCouncilRegNo || !f.medicalCouncil || !f.degree || !f.specialization || !f.consultationFee || !resolvedDept) {
      toast.error('Please fill all required fields');
      return;
    }
    setRegDoctorSaving(true);
    try {
      const payload = {
        ...f,
        department: resolvedDept,
        consultationFee: parseFloat(f.consultationFee),
        experienceYears: parseInt(f.experienceYears) || 0,
        dateOfBirth: f.dateOfBirth || null,
        joiningDate: f.joiningDate || null,
      };
      delete payload._deptOther;
      const res = await apiClient.post(`/hospital/${hospitalId}/doctors/register`, payload);
      toast.success(res.data.message || 'Doctor registered successfully');
      setShowRegisterDoctor(false);
      setRegDoctorForm({ fullName: '', email: '', phone: '+91', gender: 'Male', dateOfBirth: '', joiningDate: '', medicalCouncilRegNo: '', medicalCouncil: '', degree: 'MBBS', specialization: '', experienceYears: '', consultationFee: '', languagesSpoken: [], bio: '', department: '', designation: 'Consultant', _deptOther: '' });
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setRegDoctorSaving(false);
    }
  };

  const handleInviteDoctor = async () => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    const f = inviteForm;
    if (!f.fullName || !f.email || !f.phone || !f.department || !f.designation || !f.consultationFee) {
      toast.error('Please fill all required fields');
      return;
    }
    setInviteSaving(true);
    try {
      const res = await apiClient.post(`/hospital/${hospitalId}/invite-doctor`, f);
      toast.success(res.data.message || 'Invitation sent');
      setShowInviteDoctor(false);
      setInviteForm({ fullName: '', email: '', phone: '+91', department: '', designation: 'Consultant', consultationFee: '', message: '' });
      // Refresh invites list
      apiClient.get(`/hospital/${hospitalId}/invites`).then(r => setInvites(r.data?.data || [])).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviteSaving(false);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    try {
      await apiClient.delete(`/hospital/${hospitalId}/invites/${inviteId}`);
      setInvites(prev => prev.map(i => i.id === inviteId ? { ...i, status: 'cancelled' } : i));
      toast.success('Invite cancelled');
    } catch (_) { toast.error('Failed to cancel invite'); }
  };

  const handleResendInvite = async (inviteId) => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    try {
      await apiClient.post(`/hospital/${hospitalId}/invites/${inviteId}/resend`);
      toast.success('Invite resent');
      apiClient.get(`/hospital/${hospitalId}/invites`).then(r => setInvites(r.data?.data || [])).catch(() => {});
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to resend invite'); }
  };

  const handleToggleDoctorStatus = async (doctorId, currentStatus) => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    const goingActive = currentStatus !== 'approved';
    try {
      await apiClient.put(`/hospital/${hospitalId}/doctors/${doctorId}/status`, { isActive: goingActive });
      toast.success(`Doctor ${goingActive ? 'activated' : 'deactivated'}`);
      fetchDoctors();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update status'); }
  };

  // ── Department handlers ──
  const fetchDepartments = useCallback(() => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    setDeptLoading(true);
    apiClient.get(`/hospital/${hospitalId}/departments`)
      .then(res => setDepartments(res.data?.data || []))
      .catch(() => setDepartments([]))
      .finally(() => setDeptLoading(false));
  }, []);

  useEffect(() => {
    if (activeSection === 'departments') {
      fetchDepartments();
      if (doctors.length === 0) fetchDoctors();
    }
  }, [activeSection, fetchDepartments]);

  const handleSaveDept = async () => {
    const hospitalId = getHospitalId();
    if (!hospitalId || !deptForm.name.trim()) { toast.error('Department name is required'); return; }
    setDeptSaving(true);
    try {
      if (editDept) {
        await apiClient.put(`/hospital/${hospitalId}/departments/${editDept.id}`, deptForm);
        toast.success('Department updated');
      } else {
        await apiClient.post(`/hospital/${hospitalId}/departments`, deptForm);
        toast.success('Department created');
      }
      setShowAddDept(false);
      setEditDept(null);
      setDeptForm({ name: '', description: '', headDoctorId: '', dailyCapacity: 20, defaultSlotMinutes: 20 });
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save department');
    } finally {
      setDeptSaving(false);
    }
  };

  const handleDeleteDept = async (deptId) => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    try {
      await apiClient.delete(`/hospital/${hospitalId}/departments/${deptId}`);
      toast.success('Department removed');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove department');
    }
  };

  // ── Appointment status change handler ──
  const handleApptStatusChange = async (apptId, newStatus) => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    setApptStatusChanging(apptId);
    try {
      await apiClient.put(`/hospital/${hospitalId}/appointments/${apptId}/status`, { newStatus, changedBy: hospitalId });
      toast.success(`Appointment marked as ${newStatus.replace('_', ' ')}`);
      const params = {};
      if (apptStatusFilter) params.status = apptStatusFilter;
      apiClient.get(`/hospital/${hospitalId}/appointments`, { params })
        .then(res => setAppointments(res.data?.data || []));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally { setApptStatusChanging(null); }
  };

  // ── Walk-in appointment handler ──
  const handleWalkIn = async () => {
    const hospitalId = getHospitalId();
    if (!hospitalId) return;
    if (!walkIn.patientName || !walkIn.doctorId || !walkIn.date || !walkIn.time) {
      toast.error('Patient name, doctor, date and time are required');
      return;
    }
    setWalkInSaving(true);
    try {
      await apiClient.post(`/hospital/${hospitalId}/appointments/walk-in`, {
        patientName: walkIn.patientName,
        patientId: walkIn.patientId || undefined,
        doctorId: walkIn.doctorId,
        appointmentDate: walkIn.date,
        slotStart: walkIn.time,
        type: 'walk_in',
      });
      toast.success('Walk-in appointment created');
      setShowWalkInModal(false);
      setWalkIn({ patientSearch: '', patientId: '', patientName: '', doctorId: '', date: '', time: '' });
      // Reload appointments
      const params = {};
      if (apptStatusFilter) params.status = apptStatusFilter;
      apiClient.get(`/hospital/${hospitalId}/appointments`, { params })
        .then(res => setAppointments(res.data?.data || []));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create appointment');
    } finally {
      setWalkInSaving(false);
    }
  };

  const APPT_STATUS_COLORS = {
    scheduled:   'bg-cyan-100 text-cyan-700',
    confirmed:   'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed:   'bg-green-100 text-green-700',
    cancelled:   'bg-red-100 text-red-600',
    no_show:     'bg-gray-100 text-gray-500',
    walk_in:     'bg-purple-100 text-purple-700',
  };

  const DOCTOR_STATUS_COLORS = {
    approved:              'bg-emerald-100 text-emerald-700',
    inactive:              'bg-gray-100 text-gray-500',
    pending_hospital:      'bg-amber-100 text-amber-700',
    pending_hospital_approval: 'bg-amber-100 text-amber-700',
    pending_admin:         'bg-blue-100 text-blue-700',
    rejected:              'bg-red-100 text-red-600',
    suspended:             'bg-gray-200 text-gray-600',
    force_suspended:       'bg-gray-900 text-red-300',
  };

  const DOCTOR_STATUS_LABEL = {
    approved:              'Active',
    inactive:              'Inactive',
    pending_hospital:      'Pending',
    pending_hospital_approval: 'Pending',
    pending_admin:         'Pending Admin',
    rejected:              'Rejected',
    suspended:             'Suspended',
    force_suspended:       'Force Suspended',
  };

  const DOCTOR_SOURCE = {
    hospital_direct: { label: 'Registered by Hospital', cls: 'bg-teal-100 text-teal-700' },
    hospital_invite: { label: 'Accepted Invite',        cls: 'bg-cyan-100 text-cyan-700' },
    self_applied:    { label: 'Self-Applied',            cls: 'bg-purple-100 text-purple-700' },
  };

  const INVITE_STATUS_COLORS = {
    pending:   'bg-amber-100 text-amber-700',
    accepted:  'bg-emerald-100 text-emerald-700',
    expired:   'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-500',
  };

  const STAFF_ROLE_COLORS = {
    receptionist:   'bg-blue-100 text-blue-700',
    nurse:          'bg-purple-100 text-purple-700',
    lab_technician: 'bg-teal-100 text-teal-700',
    billing_staff:  'bg-amber-100 text-amber-700',
  };

  // AUDIT FIX [Step 9]: On mount, fetch hospital profile AND seed overview data (doctors + today's appointments).
  // MOCK_STATS was hardcoded (48 doctors, 1240 patients, etc.) — now computed from live API data.
  useEffect(() => {
    const hospitalId = localStorage.getItem('mv_hospital_id');
    if (!hospitalId) { setHospitalStatus('approved'); return; }

    // Fetch hospital profile
    apiClient.get(`/hospital/${hospitalId}`)
      .then(res => {
        const h = res.data?.data;
        if (h) {
          setHospitalData({ name: h.name, type: h.hospitalType, city: h.city, verificationStatus: h.status === 'approved' ? 'verified' : h.status, registrationNumber: h.registrationNumber });
          setHospitalStatus(h.status);
          setRejectionReason(h.rejectionReason || '');
          setSuspensionReason(h.suspensionReason || '');
        }
      })
      .catch(() => setHospitalStatus('approved'));

    // Pre-load doctors and today's appointments for overview stats
    apiClient.get(`/hospital/${hospitalId}/doctors`)
      .then(res => setDoctors(res.data?.data || []))
      .catch(() => {});

    const today = new Date().toISOString().slice(0, 10);
    apiClient.get(`/hospital/${hospitalId}/appointments`, { params: { date: today } })
      .then(res => setAppointments(res.data?.data || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 shadow-lg flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Header */}
        {/* AUDIT FIX [Step 9]: Was using MOCK_HOSPITAL — now uses hospitalData from API. */}
        <div className="flex items-center gap-3 px-5 py-5 bg-gradient-to-r from-cyan-600 to-teal-600 flex-shrink-0">
          <div className="p-2 bg-white bg-opacity-20 rounded-xl">
            <MdLocalHospital className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white leading-tight truncate">{hospitalData.name}</h2>
            <p className="text-xs text-cyan-100">{hospitalData.type}</p>
          </div>
        </div>

        {/* Verification Badge */}
        <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
          {hospitalData.verificationStatus === 'verified' ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <MdVerifiedUser className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-emerald-700">Verified Hospital</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <FiClock className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-amber-700">Verification Pending</span>
            </div>
          )}
        </div>

        {/* Nav — flex-1 so it fills remaining space and scrolls internally */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveSection(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === id
                  ? 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 border-r-4 border-cyan-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${activeSection === id ? 'text-cyan-600' : 'text-gray-400'}`} />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0 space-y-1">
          <button
            onClick={() => router.push('/')}
            className="w-full text-sm text-gray-400 hover:text-gray-600 flex items-center gap-2 px-2 py-2 transition-colors rounded-xl hover:bg-gray-50"
          >
            <FiHome className="h-4 w-4" />
            Back to Home
          </button>
          <button
            onClick={handleSignOut}
            className="w-full text-sm text-red-400 hover:text-red-600 flex items-center gap-2 px-2 py-2 transition-colors rounded-xl hover:bg-red-50"
          >
            <FiLogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {NAV_ITEMS.find((n) => n.id === activeSection)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-gray-400">{MOCK_HOSPITAL.city} · {MOCK_HOSPITAL.registrationNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('notifications')}
              className="relative p-1 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <MdNotifications className="h-6 w-6 text-gray-500 hover:text-cyan-600 transition-colors" />
              {notifUnread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-0.5">
                  {notifUnread > 99 ? '99+' : notifUnread}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 ml-2 bg-gray-50 rounded-xl px-3 py-1.5">
              <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg">
                <MdAdminPanelSettings className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">Hospital Admin</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">

          {/* Status banners for non-approved hospitals */}
          {hospitalStatus === 'pending' && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 flex gap-4 items-start mb-4">
              <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0"><FiClock className="h-6 w-6 text-amber-600" /></div>
              <div>
                <h3 className="font-bold text-amber-800 text-lg mb-1">Application Under Review</h3>
                <p className="text-amber-700 text-sm leading-relaxed">Your hospital registration is being reviewed by our admin team. This usually takes 2–3 business days. You will receive an email once the decision is made.</p>
              </div>
            </div>
          )}
          {hospitalStatus === 'rejected' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex gap-4 items-start mb-4">
              <div className="p-2 bg-red-100 rounded-xl flex-shrink-0"><FiX className="h-6 w-6 text-red-600" /></div>
              <div className="flex-1">
                <h3 className="font-bold text-red-800 text-lg mb-1">Application Rejected</h3>
                {rejectionReason && <p className="text-red-700 text-sm mb-2"><strong>Reason:</strong> {rejectionReason}</p>}
                <p className="text-red-600 text-sm mb-3">Please review the reason above and contact support to resubmit your application.</p>
                <button onClick={() => router.push('/hospital/register')} className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors">Re-apply</button>
              </div>
            </div>
          )}
          {hospitalStatus === 'suspended' && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 flex gap-4 items-start mb-4">
              <div className="p-2 bg-orange-100 rounded-xl flex-shrink-0"><FiAlertCircle className="h-6 w-6 text-orange-600" /></div>
              <div>
                <h3 className="font-bold text-orange-800 text-lg mb-1">Hospital Suspended</h3>
                {suspensionReason && <p className="text-orange-700 text-sm mb-2"><strong>Reason:</strong> {suspensionReason}</p>}
                <p className="text-orange-600 text-sm">Your hospital has been suspended. Please contact the platform admin at <a href="mailto:support@medivault.in" className="underline">support@medivault.in</a> to resolve this.</p>
              </div>
            </div>
          )}

          {/* ── Overview ── */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  {/* AUDIT FIX [Step 9]: Was MOCK_HOSPITAL — now uses hospitalData from API. */}
                  <h2 className="text-xl font-bold mb-1">Welcome back, {hospitalData.name}</h2>
                  <p className="text-cyan-100 text-sm">Here's what's happening at your hospital today.</p>
                </div>
                <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-xl px-4 py-2 backdrop-blur-sm flex-shrink-0">
                  <MdVerifiedUser className="h-5 w-5" />
                  <span className="text-sm font-semibold capitalize">{hospitalData.verificationStatus}</span>
                </div>
              </div>

              {/* AUDIT FIX [Step 9]: Was MOCK_STATS (hardcoded 48 doctors, 1240 patients).
                  Now computed from live doctors + appointments state loaded on mount. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                const totalDoctors = doctors.length;
                const pendingDoctors = doctors.filter(d => d.status === 'pending_hospital' || d.status === 'pending_hospital_approval').length;
                const todayAppts = appointments.length;
                const completedToday = appointments.filter(a => a.status === 'completed').length;
                const liveStats = [
                  { label: 'Total Doctors',        value: totalDoctors, icon: FaUserMd,      color: 'teal',   sub: pendingDoctors > 0 ? `${pendingDoctors} pending approval` : 'All approved' },
                  { label: 'Patients Treated',     value: '—',          icon: FaHospitalUser, color: 'emerald',sub: 'Full records in Patients tab' },
                  { label: 'Pending Approvals',    value: pendingDoctors, icon: FiClock,      color: 'amber',  sub: 'Doctor affiliations' },
                  { label: "Today's Appointments", value: todayAppts,   icon: FiCalendar,     color: 'cyan',   sub: `${completedToday} completed` },
                ];
                return liveStats.map(({ label, value, icon: Icon, color, sub }) => (
                  <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="mb-3">
                      <div className={`p-2.5 bg-gradient-to-br ${COLOR_MAP[color]} rounded-xl shadow-sm w-fit`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
                    <div className="text-sm font-medium text-gray-700">{label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                  </div>
                ));
              })()}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Doctor Requests */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Doctor Affiliation Requests</h3>
                    <button onClick={() => setActiveSection('doctors')} className="text-xs text-cyan-600 hover:underline font-medium">
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {doctors.filter(d => d.status === 'pending_hospital').slice(0, 3).map((doc) => (
                      <div key={doc.id} className="px-5 py-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-teal-100 rounded-xl flex-shrink-0">
                            <FaUserMd className="h-4 w-4 text-teal-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{doc.fullName}</p>
                            <p className="text-xs text-gray-500">{doc.specialization} · {doc.medicalCouncilRegNo}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => handleApproveDoctor(doc.id, doc.fullName)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors" title="Approve">
                            <FiCheck className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { setRejectModal({ open: true, doctorId: doc.id, name: doc.fullName }); setRejectReason(''); }} className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors" title="Reject">
                            <FiX className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {doctors.filter(d => d.status === 'pending_hospital').length === 0 && (
                      <div className="px-5 py-6 text-center text-sm text-gray-400">No pending affiliation requests</div>
                    )}
                  </div>
                </div>

                {/* Recent Patient Visits */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Recent Patient Visits</h3>
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
                      <FiLock className="h-3 w-3" /> Anonymised
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {MOCK_RECENT_PATIENTS.map((p) => (
                      <div key={p.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-emerald-100 rounded-xl flex-shrink-0">
                            <FaHospitalUser className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-700">{p.id}</p>
                            <p className="text-xs text-gray-400">{p.department} · {p.visitDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {p.consentGiven ? (
                            <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <FiCheck className="h-3 w-3" /> Consent
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1" title="Requires patient consent">
                              <FiLock className="h-3 w-3" /> No Consent
                            </span>
                          )}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.status === 'Active' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-3 border-t border-gray-50 bg-gray-50">
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <FiLock className="h-3 w-3" />
                      Patient identities are hidden. Full records visible only with patient consent.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {MOCK_NOTIFICATIONS.map((n, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${n.type === 'doctor' ? 'bg-teal-100' : n.type === 'consent' ? 'bg-emerald-100' : n.type === 'upload' ? 'bg-blue-100' : 'bg-cyan-100'}`}>
                        {n.type === 'doctor'      && <FaUserMd className="h-3.5 w-3.5 text-teal-600" />}
                        {n.type === 'consent'     && <FiCheck className="h-3.5 w-3.5 text-emerald-600" />}
                        {n.type === 'upload'      && <FiUpload className="h-3.5 w-3.5 text-blue-600" />}
                        {n.type === 'appointment' && <FiCalendar className="h-3.5 w-3.5 text-cyan-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700">{n.text}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Doctor Management ── */}
          {activeSection === 'doctors' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative flex-1 max-w-xs">
                    <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      value={doctorSearch}
                      onChange={e => setDoctorSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && fetchDoctors()}
                      placeholder="Search by name, specialization…"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    />
                  </div>
                  <select
                    value={doctorStatusFilter}
                    onChange={e => setDoctorStatusFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    <option value="">All Statuses</option>
                    <option value="approved">Active</option>
                    <option value="pending_hospital">Pending Approval</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <button onClick={fetchDoctors} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors" title="Refresh">
                    <FiRefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowInviteDoctor(true)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-cyan-300 text-cyan-700 text-sm font-semibold rounded-xl hover:bg-cyan-50 transition-all"
                  >
                    <FiSend className="h-4 w-4" /> Invite Doctor
                  </button>
                  <button
                    onClick={() => setShowRegisterDoctor(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
                  >
                    <FiUserPlus className="h-4 w-4" /> Register Doctor
                  </button>
                </div>
              </div>

              {/* Doctor list */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-900">Hospital Doctors</h3>
                  <p className="text-xs text-gray-400 mt-0.5">All doctors affiliated with your hospital</p>
                </div>
                {doctorsLoading ? (
                  <div className="px-5 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Loading doctors…</p>
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-3">
                      <FaUserMd className="h-7 w-7 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No doctors found</p>
                    <p className="text-xs text-gray-400 mt-1">Use "Register Doctor" to add the first doctor</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Doctor</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {doctors.map(doc => {
                          const src = DOCTOR_SOURCE[doc.accountCreatedBy] || DOCTOR_SOURCE.self_applied;
                          const isPending = doc.status === 'pending_hospital' || doc.status === 'pending_hospital_approval';
                          const isActive = doc.status === 'approved';
                          const isForceSuspended = doc.status === 'force_suspended';
                          return (
                            <tr key={doc.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/hospital/doctors/${doc.id}`)}>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-teal-100 rounded-xl flex-shrink-0">
                                    <FaUserMd className="h-4 w-4 text-teal-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{doc.fullName}</p>
                                    <p className="text-xs text-gray-400">{doc.specialization} · ₹{doc.consultationFee}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-gray-500 text-xs">{doc.department || '—'}</td>
                              <td className="px-5 py-4">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${src.cls}`}>{src.label}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${DOCTOR_STATUS_COLORS[doc.status] || 'bg-gray-100 text-gray-500'}`}>
                                  {DOCTOR_STATUS_LABEL[doc.status] || doc.status?.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => router.push(`/hospital/doctors/${doc.id}`)}
                                    className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors text-xs font-medium"
                                    title="View"
                                  >
                                    <FiEye className="h-3.5 w-3.5" />
                                  </button>
                                  {isPending && (
                                    <>
                                      <button onClick={() => handleApproveDoctor(doc.id, doc.fullName)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Approve">
                                        <FiCheck className="h-3.5 w-3.5" />
                                      </button>
                                      <button onClick={() => { setRejectModal({ open: true, doctorId: doc.id, name: doc.fullName }); setRejectReason(''); }} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="Reject">
                                        <FiX className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                  {!isPending && !isForceSuspended && (
                                    <button
                                      onClick={() => handleToggleDoctorStatus(doc.id, doc.status)}
                                      className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                      title={isActive ? 'Deactivate' : 'Activate'}
                                    >
                                      {isActive ? <FiToggleRight className="h-3.5 w-3.5" /> : <FiToggleLeft className="h-3.5 w-3.5" />}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Reject reason modal */}
              {rejectModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Doctor</h3>
                    <p className="text-sm text-gray-500 mb-4">Provide a reason for rejecting Dr. {rejectModal.name}</p>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection (min 10 characters, required)"
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                    />
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setRejectModal({ open: false, doctorId: null, name: '' })} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">Cancel</button>
                      <button onClick={handleRejectDoctor} disabled={rejectSaving || rejectReason.trim().length < 10} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50">
                        {rejectSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiX className="h-4 w-4" />}
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Register Doctor modal */}
              {showRegisterDoctor && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-gray-900">Register New Doctor</h3>
                      <button onClick={() => setShowRegisterDoctor(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100"><FiX className="h-5 w-5" /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: 'Full Name *', key: 'fullName', placeholder: 'Dr. Ramesh Sharma' },
                        { label: 'Email *', key: 'email', placeholder: 'doctor@email.com', type: 'email' },
                        { label: 'Phone (+91) *', key: 'phone', placeholder: '+91XXXXXXXXXX' },
                        { label: 'Council Reg. No. *', key: 'medicalCouncilRegNo', placeholder: 'MCI/2019/XXXXX' },
                        { label: 'Specialization *', key: 'specialization', placeholder: 'Cardiology' },
                        { label: 'Experience (years) *', key: 'experienceYears', placeholder: '5', type: 'number' },
                        { label: 'Consultation Fee ₹ *', key: 'consultationFee', placeholder: '500', type: 'number' },
                      ].map(({ label, key, placeholder, type }) => (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                          <input type={type || 'text'} value={regDoctorForm[key]} onChange={e => setRegDoctorForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className={inputCls} />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Degree *</label>
                        <select value={regDoctorForm.degree} onChange={e => setRegDoctorForm(f => ({ ...f, degree: e.target.value }))} className={inputCls}>
                          {DEGREES.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Medical Council *</label>
                        <select value={regDoctorForm.medicalCouncil} onChange={e => setRegDoctorForm(f => ({ ...f, medicalCouncil: e.target.value }))} className={inputCls}>
                          <option value="">Select council…</option>
                          {MEDICAL_COUNCILS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Gender *</label>
                        <select value={regDoctorForm.gender} onChange={e => setRegDoctorForm(f => ({ ...f, gender: e.target.value }))} className={inputCls}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
                        <input type="date" value={regDoctorForm.dateOfBirth} onChange={e => setRegDoctorForm(f => ({ ...f, dateOfBirth: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Department *</label>
                        <select value={regDoctorForm.department} onChange={e => setRegDoctorForm(f => ({ ...f, department: e.target.value }))} className={inputCls}>
                          <option value="">Select department…</option>
                          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                          <option value="__other__">Other (type below)</option>
                        </select>
                        {regDoctorForm.department === '__other__' && (
                          <input value={regDoctorForm._deptOther || ''} onChange={e => setRegDoctorForm(f => ({ ...f, _deptOther: e.target.value }))} placeholder="Enter department name" className={`${inputCls} mt-1.5`} />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Designation</label>
                        <select value={regDoctorForm.designation} onChange={e => setRegDoctorForm(f => ({ ...f, designation: e.target.value }))} className={inputCls}>
                          {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Joining Date</label>
                        <input type="date" value={regDoctorForm.joiningDate} onChange={e => setRegDoctorForm(f => ({ ...f, joiningDate: e.target.value }))} className={inputCls} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Languages Spoken</label>
                        <div className="flex flex-wrap gap-2">
                          {LANGUAGES.map(lang => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => setRegDoctorForm(f => ({
                                ...f,
                                languagesSpoken: f.languagesSpoken.includes(lang)
                                  ? f.languagesSpoken.filter(l => l !== lang)
                                  : [...f.languagesSpoken, lang],
                              }))}
                              className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all ${regDoctorForm.languagesSpoken.includes(lang) ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300'}`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Bio (optional)</label>
                        <textarea value={regDoctorForm.bio} onChange={e => setRegDoctorForm(f => ({ ...f, bio: e.target.value }))} placeholder="Short bio…" rows={2} maxLength={500} className={`${inputCls} resize-none`} />
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-xs text-amber-700">
                      A temporary 6-digit PIN will be generated and sent to the doctor via SMS and email. The doctor must change it on first login.
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setShowRegisterDoctor(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">Cancel</button>
                      <button onClick={handleRegisterDoctor} disabled={regDoctorSaving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50">
                        {regDoctorSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiUserPlus className="h-4 w-4" />}
                        Register Doctor
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Invites */}
              {invites.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h3 className="font-semibold text-gray-900">Pending Invites</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Doctors invited but not yet registered</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Doctor</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {invites.map(inv => (
                          <tr key={inv.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-gray-800">{inv.fullName}</p>
                              <p className="text-xs text-gray-400">{inv.email}</p>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500 text-xs">{inv.department || '—'}</td>
                            <td className="px-5 py-3.5 text-gray-400 text-xs">
                              {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${INVITE_STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-500'}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                {(inv.status === 'pending' || inv.status === 'expired') && (
                                  <button onClick={() => handleResendInvite(inv.id)} className="text-xs text-cyan-600 hover:underline font-medium flex items-center gap-1">
                                    <FiRefreshCw className="h-3 w-3" /> Resend
                                  </button>
                                )}
                                {inv.status === 'pending' && (
                                  <button onClick={() => handleCancelInvite(inv.id)} className="text-xs text-red-500 hover:underline font-medium flex items-center gap-1">
                                    <FiX className="h-3 w-3" /> Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Invite Doctor modal */}
              {showInviteDoctor && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-gray-900">Invite Doctor</h3>
                      <button onClick={() => setShowInviteDoctor(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100"><FiX className="h-5 w-5" /></button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Doctor Full Name *', key: 'fullName', placeholder: 'Dr. Priya Kapoor' },
                        { label: 'Email *', key: 'email', placeholder: 'doctor@email.com', type: 'email' },
                        { label: 'Phone (+91) *', key: 'phone', placeholder: '+91XXXXXXXXXX' },
                        { label: 'Department *', key: 'department', placeholder: 'e.g. Cardiology' },
                        { label: 'Consultation Fee ₹ *', key: 'consultationFee', placeholder: '500', type: 'number' },
                      ].map(({ label, key, placeholder, type }) => (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                          <input type={type || 'text'} value={inviteForm[key]} onChange={e => setInviteForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className={inputCls} />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Designation *</label>
                        <select value={inviteForm.designation} onChange={e => setInviteForm(f => ({ ...f, designation: e.target.value }))} className={inputCls}>
                          {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Message to doctor (optional)</label>
                        <textarea value={inviteForm.message} onChange={e => setInviteForm(f => ({ ...f, message: e.target.value }))} placeholder="We'd love to have you on our team…" rows={2} maxLength={300} className={`${inputCls} resize-none`} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">An invitation link (valid 48 hours) will be sent via SMS and email.</p>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setShowInviteDoctor(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">Cancel</button>
                      <button onClick={handleInviteDoctor} disabled={inviteSaving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50">
                        {inviteSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSend className="h-4 w-4" />}
                        Send Invite
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Department Management ── */}
          {activeSection === 'departments' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex justify-end">
                <button
                  onClick={() => { setEditDept(null); setDeptForm({ name: '', description: '', headDoctorId: '', dailyCapacity: 20, defaultSlotMinutes: 20 }); setShowAddDept(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
                >
                  <FiPlus className="h-4 w-4" /> Add Department
                </button>
              </div>

              {/* Departments list */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-900">Hospital Departments</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Manage clinical departments and their capacity</p>
                </div>

                {deptLoading ? (
                  <div className="px-5 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Loading departments…</p>
                  </div>
                ) : departments.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-3">
                      <FiActivity className="h-7 w-7 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No departments yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Department" to create the first one</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Daily Capacity</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Slot (min)</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {departments.map(dept => (
                          <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-gray-800">{dept.name}</td>
                            <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{dept.description || '—'}</td>
                            <td className="px-5 py-3.5 text-gray-700">{dept.dailyCapacity ?? '—'}</td>
                            <td className="px-5 py-3.5 text-gray-700">{dept.defaultSlotMinutes ?? '—'}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => { setEditDept(dept); setDeptForm({ name: dept.name, description: dept.description || '', headDoctorId: dept.headDoctorId || '', dailyCapacity: dept.dailyCapacity ?? 20, defaultSlotMinutes: dept.defaultSlotMinutes ?? 20 }); setShowAddDept(true); }}
                                  className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDept(dept.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add/Edit Department Modal */}
              {showAddDept && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-gray-900">{editDept ? 'Edit Department' : 'Add Department'}</h3>
                      <button onClick={() => { setShowAddDept(false); setEditDept(null); }} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Department Name *</label>
                        <input
                          value={deptForm.name}
                          onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="e.g. Cardiology"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                        <textarea
                          value={deptForm.description}
                          onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Brief description of the department…"
                          rows={2}
                          className={`${inputCls} resize-none`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Head of Department</label>
                        <select
                          value={deptForm.headDoctorId || ''}
                          onChange={e => setDeptForm(f => ({ ...f, headDoctorId: e.target.value || null }))}
                          className={inputCls}
                        >
                          <option value="">None</option>
                          {doctors.filter(d => d.status === 'approved').map(d => (
                            <option key={d.id} value={d.id}>{d.fullName} — {d.specialization}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Daily Capacity</label>
                          <input
                            type="number"
                            min={1}
                            value={deptForm.dailyCapacity}
                            onChange={e => setDeptForm(f => ({ ...f, dailyCapacity: parseInt(e.target.value) || 20 }))}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Slot Duration (min)</label>
                          <input
                            type="number"
                            min={5}
                            step={5}
                            value={deptForm.defaultSlotMinutes}
                            onChange={e => setDeptForm(f => ({ ...f, defaultSlotMinutes: parseInt(e.target.value) || 20 }))}
                            className={inputCls}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => { setShowAddDept(false); setEditDept(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDept}
                        disabled={deptSaving || !deptForm.name.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50"
                      >
                        {deptSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="h-4 w-4" />}
                        {editDept ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Patient Records ── */}
          {activeSection === 'patients' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3">
                <FiLock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-0.5">Patient Privacy Notice</p>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Patient identities and records are anonymised by default. Full record access requires explicit patient consent.
                    All data sharing is logged on the MediVault ledger.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-900">Patient Visits (Anonymised)</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {MOCK_RECENT_PATIENTS.map((p) => (
                    <div key={p.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                          <FaHospitalUser className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{p.id}</p>
                          <p className="text-sm text-gray-500">{p.department} · {p.visitDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {p.consentGiven ? (
                          <button className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors font-medium">
                            <FiCheck className="h-4 w-4" /> View Full Record
                          </button>
                        ) : (
                          <span className="flex items-center gap-1.5 text-sm text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl" title="Requires patient consent">
                            <FiLock className="h-4 w-4" /> Awaiting Consent
                          </span>
                        )}
                        <span className={`text-sm font-medium px-2.5 py-1 rounded-xl ${p.status === 'Active' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Analytics ── */}
          {activeSection === 'analytics' && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3">
                <FiAlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Analytics data is visible only to hospital admins and is never shared publicly.
                  All figures are aggregate — no individual patient data is exposed.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Patients Treated',   value: '1,240', icon: FaHospitalUser, color: 'from-emerald-500 to-teal-500' },
                  { label: 'Avg. Daily Appointments',  value: '27',    icon: FiCalendar,     color: 'from-cyan-500 to-blue-500' },
                  { label: 'Doctor Utilisation Rate',  value: '84%',   icon: FiTrendingUp,   color: 'from-teal-500 to-emerald-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className={`p-3 bg-gradient-to-br ${color} rounded-xl w-fit mb-3`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
                    <div className="text-sm text-gray-500">{label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Department-wise Patient Load</h3>
                <div className="space-y-3">
                  {[
                    { dept: 'Cardiology',       count: 320, pct: 26 },
                    { dept: 'Orthopaedics',     count: 210, pct: 17 },
                    { dept: 'Neurology',        count: 180, pct: 15 },
                    { dept: 'General Medicine', count: 290, pct: 23 },
                    { dept: 'Others',           count: 240, pct: 19 },
                  ].map(({ dept, count, pct }) => (
                    <div key={dept}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{dept}</span>
                        <span className="text-gray-500">{count} patients</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Appointments ── */}
          {activeSection === 'appointments' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FiFilter className="h-4 w-4 text-gray-400" />
                  <select
                    value={apptStatusFilter}
                    onChange={e => setApptStatusFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    <option value="">All Statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowWalkInModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
                >
                  <FiPlus className="h-4 w-4" /> Walk-in Appointment
                </button>
              </div>

              {/* Appointments list */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-900">Hospital Appointments</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Hospital-wide appointment schedule</p>
                </div>

                {apptLoading ? (
                  <div className="px-5 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Loading appointments…</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-3">
                      <FiCalendar className="h-7 w-7 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No appointments found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {apptStatusFilter ? `No appointments with status "${apptStatusFilter}"` : 'No appointments scheduled yet'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {appointments.map((appt) => (
                      <div key={appt.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-2.5 bg-cyan-100 rounded-xl flex-shrink-0">
                            <FiCalendar className="h-4 w-4 text-cyan-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-800">
                                {appt.appointmentDate || '—'}
                              </p>
                              {appt.slotStart && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <FiClock className="h-3 w-3" /> {appt.slotStart}
                                  {appt.slotEnd ? ` – ${appt.slotEnd}` : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Patient: <span className="font-medium">{appt.patientId || 'N/A'}</span>
                              {appt.doctorName || appt.doctorId ? (
                                <> · Doctor: <span className="font-medium">{appt.doctorName || appt.doctorId}</span></>
                              ) : null}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${APPT_STATUS_COLORS[appt.status] || 'bg-gray-100 text-gray-500'}`}>
                            {(appt.status || 'unknown').replace(/_/g, ' ')}
                          </span>
                          {!['completed','cancelled','no_show'].includes(appt.status) && (
                            <select
                              disabled={apptStatusChanging === appt.id}
                              onChange={e => { if (e.target.value) handleApptStatusChange(appt.id, e.target.value); }}
                              defaultValue=""
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
                            >
                              <option value="" disabled>Change…</option>
                              {appt.status !== 'confirmed'   && <option value="confirmed">Confirmed</option>}
                              {appt.status !== 'in_progress' && <option value="in_progress">In Progress</option>}
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="no_show">No Show</option>
                              <option value="rescheduled">Rescheduled</option>
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Walk-in Modal */}
              {showWalkInModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-gray-900">Walk-in Appointment</h3>
                      <button onClick={() => setShowWalkInModal(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Patient Name *</label>
                        <input
                          value={walkIn.patientName}
                          onChange={e => setWalkIn(w => ({ ...w, patientName: e.target.value }))}
                          placeholder="e.g. Ramesh Kumar"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Patient ID (optional)</label>
                        <input
                          value={walkIn.patientId}
                          onChange={e => setWalkIn(w => ({ ...w, patientId: e.target.value }))}
                          placeholder="PT-XXXX (if registered)"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Doctor *</label>
                        <select
                          value={walkIn.doctorId}
                          onChange={e => setWalkIn(w => ({ ...w, doctorId: e.target.value }))}
                          className={inputCls}
                        >
                          <option value="">Select a doctor…</option>
                          {doctors.filter(d => d.status === 'approved').map(d => (
                            <option key={d.id} value={d.id}>{d.fullName} — {d.specialization}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Date *</label>
                          <input
                            type="date"
                            value={walkIn.date}
                            onChange={e => setWalkIn(w => ({ ...w, date: e.target.value }))}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Time *</label>
                          <input
                            type="time"
                            value={walkIn.time}
                            onChange={e => setWalkIn(w => ({ ...w, time: e.target.value }))}
                            className={inputCls}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setShowWalkInModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={handleWalkIn}
                        disabled={walkInSaving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50"
                      >
                        {walkInSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiPlus className="h-4 w-4" />}
                        Book Walk-in
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Staff Management ── */}
          {activeSection === 'staff' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddStaff(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
                >
                  <FiPlus className="h-4 w-4" /> Add Staff
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-900">Hospital Staff</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Manage non-doctor staff members</p>
                </div>

                {staffLoading ? (
                  <div className="px-5 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Loading staff…</p>
                  </div>
                ) : staff.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-3">
                      <FiUsers className="h-7 w-7 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No staff members found</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Staff" to register the first staff member</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Shift</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {staff.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-gray-800">{s.fullName}</td>
                            <td className="px-5 py-3.5">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STAFF_ROLE_COLORS[s.role] || 'bg-gray-100 text-gray-500'}`}>
                                {(s.role || '').replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500">{s.phone || '—'}</td>
                            <td className="px-5 py-3.5 text-gray-500">{s.department || '—'}</td>
                            <td className="px-5 py-3.5 text-gray-500">
                              {s.shiftStart && s.shiftEnd ? `${s.shiftStart} – ${s.shiftEnd}` : '—'}
                            </td>
                            <td className="px-5 py-3.5">
                              <button
                                onClick={() => handleToggleStaff(s.id, s.isActive)}
                                className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                                  s.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                {s.isActive ? <FiToggleRight className="h-4 w-4" /> : <FiToggleLeft className="h-4 w-4" />}
                                {s.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Add Staff Modal */}
              {showAddStaff && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-gray-900">Add Staff Member</h3>
                      <button onClick={() => setShowAddStaff(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                        <input
                          value={staffForm.fullName}
                          onChange={e => setStaffForm(f => ({ ...f, fullName: e.target.value }))}
                          placeholder="e.g. Sunita Rao"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                        <select
                          value={staffForm.role}
                          onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        >
                          <option value="receptionist">Receptionist</option>
                          <option value="nurse">Nurse</option>
                          <option value="lab_technician">Lab Technician</option>
                          <option value="billing_staff">Billing Staff</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                        <input
                          value={staffForm.phone}
                          onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="+91XXXXXXXXXX"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                        <input
                          value={staffForm.email}
                          onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="staff@hospital.com"
                          type="email"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                        <input
                          value={staffForm.department}
                          onChange={e => setStaffForm(f => ({ ...f, department: e.target.value }))}
                          placeholder="e.g. Cardiology, OPD"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Shift Start</label>
                          <input
                            type="time"
                            value={staffForm.shiftStart}
                            onChange={e => setStaffForm(f => ({ ...f, shiftStart: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Shift End</label>
                          <input
                            type="time"
                            value={staffForm.shiftEnd}
                            onChange={e => setStaffForm(f => ({ ...f, shiftEnd: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setShowAddStaff(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={handleAddStaff}
                        disabled={staffSaving || !staffForm.fullName}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50"
                      >
                        {staffSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiPlus className="h-4 w-4" />}
                        Add Staff
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Hospital Profile (tabbed) ── */}
          {activeSection === 'profile' && (
            <div className="space-y-5">
              {profileLoading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading profile…</p>
                </div>
              ) : (
                <>
                  {/* Profile header card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                      {/* Logo */}
                      <div className="relative flex-shrink-0">
                        <div
                          onClick={() => profileLogoRef.current?.click()}
                          className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-md cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                          title="Click to change logo"
                        >
                          {profileLogoUploading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : profileData?.logoUrl ? (
                            <img src={profileData.logoUrl} alt="logo" className="w-full h-full object-cover" />
                          ) : (
                            <MdLocalHospital className="h-8 w-8 text-white" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-white cursor-pointer" onClick={() => profileLogoRef.current?.click()}>
                          <FiEdit2 className="h-2.5 w-2.5 text-white" />
                        </div>
                        <input ref={profileLogoRef} type="file" accept=".jpg,.jpeg,.png" className="sr-only" onChange={handleLogoUpload} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 truncate">{profileData?.name || '—'}</h2>
                        <p className="text-sm text-gray-500 capitalize">{profileData?.hospitalType || '—'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {profileData?.status === 'approved' ? (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <MdVerifiedUser className="h-3 w-3" /> Verified
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <FiClock className="h-3 w-3" /> {profileData?.status || 'Pending'}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{profileData?.registrationNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tab strip */}
                  {(() => {
                    const PROFILE_TABS = [
                      { id:'basic',    label:'Basic Info' },
                      { id:'contact',  label:'Contact' },
                      { id:'address',  label:'Address' },
                      { id:'hours',    label:'Working Hours' },
                      { id:'documents',label:'Documents' },
                      { id:'admin',    label:'Admin Account' },
                    ];
                    return (
                      <div className="flex gap-1 overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5">
                        {PROFILE_TABS.map(t => (
                          <button
                            key={t.id}
                            onClick={() => { setProfileTab(t.id); setProfileEditMode(false); }}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              profileTab === t.id
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Tab content */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                    {/* ── TAB: Basic Info ── */}
                    {profileTab === 'basic' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">Basic Information</h3>
                          <button
                            onClick={() => profileEditMode ? handleSaveProfile() : setProfileEditMode(true)}
                            disabled={profileSaving}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-xl transition-all ${
                              profileEditMode
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm'
                                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {profileSaving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : profileEditMode ? <FiSave className="h-3.5 w-3.5" /> : <FiEdit2 className="h-3.5 w-3.5" />}
                            {profileEditMode ? (profileSaving ? 'Saving…' : 'Save') : 'Edit'}
                          </button>
                        </div>

                        {[
                          { label:'Hospital Name',     key:'name',           editable:true },
                          { label:'Hospital Type',     key:'hospitalType',   editable:false },
                          { label:'Registration No.',  key:'registrationNumber', editable:false },
                          { label:'License Number',    key:'licenseNumber',  editable:true },
                          { label:'GSTIN',             key:'gstin',          editable:true },
                          { label:'Year Established',  key:'yearEstablished',editable:true, type:'number' },
                          { label:'Number of Beds',    key:'numberOfBeds',   editable:true, type:'number' },
                          { label:'Website',           key:'website',        editable:true },
                          { label:'Specialisations',   key:'specialisations',editable:true },
                        ].map(({ label, key, editable, type }) => (
                          <div key={key}>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                            {profileEditMode && editable ? (
                              <input
                                type={type || 'text'}
                                value={profileForm[key] || ''}
                                onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                              />
                            ) : (
                              <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                                {profileData?.[key] || <span className="text-gray-400">—</span>}
                              </p>
                            )}
                          </div>
                        ))}

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Emergency Services</label>
                          <button
                            onClick={() => profileEditMode && setProfileForm(f => ({ ...f, emergencyAvailable: !f.emergencyAvailable }))}
                            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
                              profileForm.emergencyAvailable
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            } ${profileEditMode ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                          >
                            {profileForm.emergencyAvailable
                              ? <><FiToggleRight className="h-5 w-5" /> 24×7 Emergency Available</>
                              : <><FiToggleLeft className="h-5 w-5" /> Emergency Not Available</>
                            }
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── TAB: Contact ── */}
                    {profileTab === 'contact' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">Contact Details</h3>
                          <button
                            onClick={() => profileEditMode ? handleSaveProfile() : setProfileEditMode(true)}
                            disabled={profileSaving}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-xl transition-all ${profileEditMode ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                          >
                            {profileSaving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : profileEditMode ? <FiSave className="h-3.5 w-3.5" /> : <FiEdit2 className="h-3.5 w-3.5" />}
                            {profileEditMode ? (profileSaving ? 'Saving…' : 'Save') : 'Edit'}
                          </button>
                        </div>
                        {[
                          { label:'Official Email',   key:'email',         icon:FiMail,  editable:true },
                          { label:'Official Phone',   key:'phone',         icon:FiPhone, editable:true },
                          { label:'Alternate Phone',  key:'altPhone',      icon:FiPhone, editable:true },
                          { label:'Emergency Phone',  key:'emergencyPhone',icon:FiPhone, editable:true },
                        ].map(({ label, key, icon: Icon, editable }) => (
                          <div key={key}>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                              <Icon className="h-3 w-3" /> {label}
                            </label>
                            {profileEditMode && editable ? (
                              <input
                                type="text"
                                value={profileForm[key] || ''}
                                onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                              />
                            ) : (
                              <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                                {profileData?.[key] || <span className="text-gray-400">—</span>}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── TAB: Address ── */}
                    {profileTab === 'address' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">Address</h3>
                          <button
                            onClick={() => profileEditMode ? handleSaveProfile() : setProfileEditMode(true)}
                            disabled={profileSaving}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-xl transition-all ${profileEditMode ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                          >
                            {profileSaving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : profileEditMode ? <FiSave className="h-3.5 w-3.5" /> : <FiEdit2 className="h-3.5 w-3.5" />}
                            {profileEditMode ? (profileSaving ? 'Saving…' : 'Save') : 'Edit'}
                          </button>
                        </div>
                        {[
                          { label:'Address Line 1', key:'addressLine1', editable:true },
                          { label:'Address Line 2', key:'addressLine2', editable:true },
                          { label:'City',           key:'city',         editable:true },
                          { label:'State',          key:'state',        editable:false },
                          { label:'Pincode',        key:'pincode',      editable:false },
                          { label:'Landmark',       key:'landmark',     editable:true },
                          { label:'Google Maps Link',key:'googleMapsLink',editable:true },
                        ].map(({ label, key, editable }) => (
                          <div key={key}>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                            {profileEditMode && editable ? (
                              <input
                                type="text"
                                value={profileForm[key] || ''}
                                onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                              />
                            ) : (
                              <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                                {profileData?.[key] || <span className="text-gray-400">—</span>}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── TAB: Working Hours ── */}
                    {profileTab === 'hours' && (() => {
                      const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
                      const DAY_LABELS = { Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday',Sun:'Sunday' };
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">Working Hours</h3>
                            <button
                              onClick={handleSaveWorkingHours}
                              disabled={profileSaving}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm hover:from-cyan-600 hover:to-teal-600 transition-all"
                            >
                              {profileSaving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="h-3.5 w-3.5" />}
                              Save Hours
                            </button>
                          </div>
                          {DAYS.map(day => (
                            <div key={day} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                              <span className="w-24 text-sm font-medium text-gray-700 flex-shrink-0">{DAY_LABELS[day]}</span>
                              <button
                                type="button"
                                onClick={() => setProfileWorkingHours(p => ({ ...p, [day]: { ...p[day], open: !p[day]?.open } }))}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                                  profileWorkingHours[day]?.open
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}
                              >
                                {profileWorkingHours[day]?.open ? <><FiCheck className="h-3 w-3" /> Open</> : <><FiX className="h-3 w-3" /> Closed</>}
                              </button>
                              {profileWorkingHours[day]?.open && (
                                <div className="flex items-center gap-2 flex-1">
                                  <input type="time" value={profileWorkingHours[day]?.start || '09:00'} onChange={e => setProfileWorkingHours(p => ({ ...p, [day]: { ...p[day], start: e.target.value } }))} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:ring-1 focus:ring-cyan-500 focus:outline-none" />
                                  <span className="text-gray-400 text-xs">to</span>
                                  <input type="time" value={profileWorkingHours[day]?.end || '17:00'}   onChange={e => setProfileWorkingHours(p => ({ ...p, [day]: { ...p[day], end:   e.target.value } }))} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:ring-1 focus:ring-cyan-500 focus:outline-none" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* ── TAB: Documents ── */}
                    {profileTab === 'documents' && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Uploaded Documents</h3>
                        {Array.isArray(profileData?.documents) && profileData.documents.length > 0 ? (
                          <div className="space-y-3">
                            {profileData.documents.map((doc, i) => (
                              <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                <div className="p-2 bg-cyan-100 rounded-lg flex-shrink-0">
                                  <FiFileText className="h-4 w-4 text-cyan-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800">{doc.label || doc.type}</p>
                                  <p className="text-xs text-gray-400 truncate">{doc.url}</p>
                                </div>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs px-3 py-1.5 bg-cyan-50 text-cyan-600 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors flex-shrink-0"
                                >
                                  View
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            No documents uploaded yet.
                          </div>
                        )}
                        <p className="text-xs text-gray-400 pt-2">
                          To update documents, use the resubmit flow or contact support.
                        </p>
                      </div>
                    )}

                    {/* ── TAB: Admin Account ── */}
                    {profileTab === 'admin' && (
                      <div className="space-y-6">
                        {/* Admin name */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Admin Details</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Admin Name</label>
                              <input
                                type="text"
                                value={adminForm.adminName}
                                onChange={e => setAdminForm(f => ({ ...f, adminName: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Admin Email (login)</label>
                              <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                                {profileData?.adminEmail || <span className="text-gray-400">—</span>}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Admin Phone</label>
                              <p className="text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                                {profileData?.adminPhone || <span className="text-gray-400">—</span>}
                              </p>
                            </div>
                            <button
                              onClick={handleSaveAdminAccount}
                              disabled={adminSaving}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
                            >
                              {adminSaving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="h-3.5 w-3.5" />}
                              {adminSaving ? 'Saving…' : 'Save Admin Details'}
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-gray-100" />

                        {/* Change password */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Change Password</h3>
                          <div className="space-y-3">
                            {[
                              { label:'Current Password',  key:'currentPassword' },
                              { label:'New Password',      key:'newPassword',    hint:'Min 8 characters' },
                              { label:'Confirm New Password', key:'confirmPassword' },
                            ].map(({ label, key, hint }) => (
                              <div key={key}>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                                <input
                                  type="password"
                                  value={adminForm[key]}
                                  onChange={e => setAdminForm(f => ({ ...f, [key]: e.target.value }))}
                                  placeholder={hint || ''}
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                                />
                              </div>
                            ))}
                            <button
                              onClick={handleChangePassword}
                              disabled={passwordSaving}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm"
                            >
                              {passwordSaving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiLock className="h-3.5 w-3.5" />}
                              {passwordSaving ? 'Changing…' : 'Change Password'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Beds & Admissions ── */}
          {activeSection === 'beds' && <HospitalBeds />}

          {/* ── Lab ── */}
          {activeSection === 'lab' && <HospitalLab />}

          {/* ── Billing ── */}
          {activeSection === 'billing' && <HospitalBilling />}

          {/* ── Notifications ── */}
          {activeSection === 'notifications' && (
            <HospitalNotificationsSection hospitalId={getHospitalId()} onUnreadChange={setNotifUnread} />
          )}

          {/* ── Generic placeholder (uploads, settings) ── */}
          {!['overview', 'doctors', 'departments', 'patients', 'analytics', 'appointments', 'staff', 'profile', 'beds', 'lab', 'billing', 'notifications'].includes(activeSection) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
              <div className="p-5 bg-gray-100 rounded-2xl w-fit mx-auto mb-4">
                {(() => {
                  const item = NAV_ITEMS.find((n) => n.id === activeSection);
                  const Icon = item?.icon || FiActivity;
                  return <Icon className="h-8 w-8 text-gray-400" />;
                })()}
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {NAV_ITEMS.find((n) => n.id === activeSection)?.label}
              </h3>
              <p className="text-gray-400 text-sm">This section will be fully implemented with backend integration.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HospitalDashboard;

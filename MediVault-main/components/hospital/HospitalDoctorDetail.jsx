import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiEdit2, FiSave, FiX, FiCheck,
  FiToggleLeft, FiToggleRight, FiRefreshCw, FiAlertCircle,
  FiUser, FiPhone, FiMail, FiCalendar, FiActivity,
} from 'react-icons/fi';
import { FaUserMd, FaStethoscope } from 'react-icons/fa';
import { MdVerifiedUser, MdBlock } from 'react-icons/md';
import apiClient from '../../utils/api';
import toast_ from 'react-hot-toast';

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 text-gray-800';
const DESIGNATIONS = ['Consultant', 'Senior Consultant', 'Head of Department', 'Resident', 'Fellow'];

const SOURCE_BADGE = {
  hospital_direct:  { label: 'Registered by Hospital', cls: 'bg-teal-100 text-teal-700' },
  hospital_invite:  { label: 'Accepted Invite',        cls: 'bg-cyan-100 text-cyan-700' },
  self_applied:     { label: 'Self-Applied',            cls: 'bg-purple-100 text-purple-700' },
};

const STATUS_BADGE = {
  approved:          { label: 'Active',           cls: 'bg-emerald-100 text-emerald-700' },
  inactive:          { label: 'Inactive',         cls: 'bg-gray-100 text-gray-500' },
  pending_hospital:  { label: 'Pending',          cls: 'bg-amber-100 text-amber-700' },
  pending_hospital_approval: { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
  rejected:          { label: 'Rejected',         cls: 'bg-red-100 text-red-600' },
  force_suspended:   { label: 'Force Suspended',  cls: 'bg-gray-900 text-red-300' },
};

export default function HospitalDoctorDetail() {
  const router = useRouter();
  const { id: doctorId } = router.query;

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState('');

  // Hospital-editable fields
  const [settingsForm, setSettingsForm] = useState({ department: '', designation: '', consultationFee: '' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);

  // Status toggle
  const [statusSaving, setStatusSaving] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Resend credentials
  const [resendSaving, setResendSaving] = useState(false);

  useEffect(() => {
    const hid = localStorage.getItem('mv_hospital_id') || '';
    setHospitalId(hid);
  }, []);

  useEffect(() => {
    if (!doctorId || !hospitalId) return;
    setLoading(true);
    apiClient.get(`/hospital/${hospitalId}/doctors/${doctorId}`)
      .then(res => {
        const d = res.data.data;
        setDoctor(d);
        setSettingsForm({
          department: d.department || '',
          designation: d.designation || 'Consultant',
          consultationFee: d.consultationFee || '',
        });
      })
      .catch(() => toast.error('Failed to load doctor'))
      .finally(() => setLoading(false));
  }, [doctorId, hospitalId]);

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await apiClient.put(`/hospital/${hospitalId}/doctors/${doctorId}/hospital-settings`, settingsForm);
      setDoctor(d => ({ ...d, ...settingsForm }));
      setEditingSettings(false);
      toast.success('Hospital settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (doctor?.status === 'force_suspended') return;
    const goingActive = doctor?.status !== 'approved' || doctor?.isActive === false;
    if (!goingActive) {
      setShowDeactivateModal(true);
      return;
    }
    // Activate
    setStatusSaving(true);
    try {
      await apiClient.put(`/hospital/${hospitalId}/doctors/${doctorId}/status`, { isActive: true });
      setDoctor(d => ({ ...d, isActive: true, status: 'approved' }));
      toast.success('Doctor activated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setStatusSaving(true);
    try {
      await apiClient.put(`/hospital/${hospitalId}/doctors/${doctorId}/status`, {
        isActive: false,
        reason: deactivateReason.trim() || undefined,
      });
      setDoctor(d => ({ ...d, isActive: false, status: 'inactive' }));
      setShowDeactivateModal(false);
      setDeactivateReason('');
      toast.success('Doctor deactivated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate doctor');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleResendCredentials = async () => {
    setResendSaving(true);
    try {
      const res = await apiClient.post(`/hospital/${hospitalId}/doctors/${doctorId}/resend-credentials`);
      toast.success(res.data.message || 'Credentials resent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend credentials');
    } finally {
      setResendSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Doctor not found.</p>
        <Link href="/hospital/doctors" className="text-cyan-600 text-sm hover:underline mt-2 inline-block">← Back to doctors</Link>
      </div>
    );
  }

  const isActive = doctor.isActive && doctor.status === 'approved';
  const isForceSuspended = doctor.status === 'force_suspended';
  const showResend = doctor.firstLoginCompleted === false || (doctor.metadata?.firstLoginCompleted === false);
  const sourceInfo = SOURCE_BADGE[doctor.accountCreatedBy] || SOURCE_BADGE.self_applied;
  const statusInfo = STATUS_BADGE[doctor.status] || { label: doctor.status, cls: 'bg-gray-100 text-gray-500' };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link href="/hospital/doctors" className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          <FiArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{doctor.fullName}</h1>
          <p className="text-sm text-gray-500">{doctor.specialization} · {doctor.degree}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sourceInfo.cls}`}>{sourceInfo.label}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.cls}`}>{statusInfo.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: Profile (read-only) ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Identity card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                {doctor.photoUrl
                  ? <img src={doctor.photoUrl} alt={doctor.fullName} className="w-full h-full object-cover rounded-2xl" />
                  : <FaUserMd className="h-7 w-7 text-white" />
                }
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{doctor.fullName}</h2>
                <p className="text-sm text-gray-500">{doctor.degree} · {doctor.specialization}</p>
                <p className="text-xs text-gray-400 mt-0.5">{doctor.experienceYears} yrs experience</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Email', value: doctor.email, icon: FiMail },
                { label: 'Phone', value: doctor.phone, icon: FiPhone },
                { label: 'Medical Council', value: doctor.medicalCouncil, icon: MdVerifiedUser },
                { label: 'Reg. No.', value: doctor.medicalCouncilRegNo, icon: FiActivity },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-gray-800 font-medium truncate">{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
            {doctor.bio && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-1">Bio</p>
                <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
              </div>
            )}
            {doctor.languagesSpoken?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1">Languages</p>
                <div className="flex flex-wrap gap-1.5">
                  {doctor.languagesSpoken.map(l => (
                    <span key={l} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Documents */}
          {doctor.documents?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Documents</h3>
              <div className="space-y-2">
                {doctor.documents.map((doc, i) => (
                  <a key={i} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                    <FiActivity className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 flex-1 truncate">{doc.name || doc.docType || `Document ${i + 1}`}</span>
                    <span className="text-xs text-cyan-600 group-hover:underline flex-shrink-0">View</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {doctor.stats && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Activity</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{doctor.stats.totalAppointments ?? '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{doctor.stats.appointmentsThisMonth ?? '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Hospital Control Panel ── */}
        <div className="space-y-4">
          {/* Hospital Settings (editable) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Hospital Settings</h3>
              {!editingSettings && (
                <button onClick={() => setEditingSettings(true)} className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors" title="Edit">
                  <FiEdit2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {editingSettings ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                  <input value={settingsForm.department} onChange={e => setSettingsForm(f => ({ ...f, department: e.target.value }))} className={inputCls} placeholder="e.g. Cardiology" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Designation</label>
                  <select value={settingsForm.designation} onChange={e => setSettingsForm(f => ({ ...f, designation: e.target.value }))} className={inputCls}>
                    {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Consultation Fee ₹</label>
                  <input type="number" value={settingsForm.consultationFee} onChange={e => setSettingsForm(f => ({ ...f, consultationFee: e.target.value }))} className={inputCls} placeholder="500" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditingSettings(false)} className="flex-1 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
                  >
                    {settingsSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="h-3.5 w-3.5" />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Department', value: doctor.department },
                  { label: 'Designation', value: doctor.designation },
                  { label: 'Consultation Fee', value: doctor.consultationFee ? `₹${doctor.consultationFee}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400 text-xs">{label}</span>
                    <span className="font-medium text-gray-800">{value || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Control */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Status Control</h3>

            {isForceSuspended ? (
              <div className="bg-gray-900 text-red-300 rounded-xl px-4 py-3 text-xs flex gap-2">
                <MdBlock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>This doctor has been suspended by Platform Admin. Only platform admin can reinstate them.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {isActive ? (
                  <button
                    onClick={handleToggleStatus}
                    disabled={statusSaving}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium border border-amber-300 text-amber-700 rounded-xl hover:bg-amber-50 transition-colors disabled:opacity-50"
                  >
                    <FiToggleLeft className="h-4 w-4" /> Deactivate Doctor
                  </button>
                ) : (
                  <button
                    onClick={handleToggleStatus}
                    disabled={statusSaving}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
                  >
                    <FiToggleRight className="h-4 w-4" /> Activate Doctor
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Resend Credentials */}
          {showResend && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-1">First Login Pending</h3>
              <p className="text-xs text-gray-400 mb-3">Doctor has not completed first login. Resend credentials if they lost access.</p>
              <button
                onClick={handleResendCredentials}
                disabled={resendSaving}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium border border-cyan-300 text-cyan-700 rounded-xl hover:bg-cyan-50 transition-colors disabled:opacity-50"
              >
                {resendSaving ? <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /> : <FiRefreshCw className="h-4 w-4" />}
                Resend Login Credentials
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Deactivate confirmation modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-xl">
                <FiAlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Deactivate Doctor</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {doctor.fullName} will be immediately removed from patient booking. Existing appointments will not be auto-cancelled.
            </p>
            <textarea
              value={deactivateReason}
              onChange={e => setDeactivateReason(e.target.value)}
              placeholder="Reason for deactivation (optional)"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDeactivateModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleDeactivate}
                disabled={statusSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50"
              >
                {statusSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiToggleLeft className="h-4 w-4" />}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

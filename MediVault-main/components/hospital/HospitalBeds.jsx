import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiRefreshCw, FiUser } from 'react-icons/fi';
import { MdHotelClass, MdLocalHospital } from 'react-icons/md';
import apiClient from '../../utils/api';

// ── Helpers ────────────────────────────────────────────────────────────────────

const WARD_TYPES = ['general', 'icu', 'semi_private', 'private', 'emergency'];
const WARD_TYPE_LABELS = { general: 'General', icu: 'ICU', semi_private: 'Semi-Private', private: 'Private', emergency: 'Emergency' };

const BED_STATUS_META = {
  available:   { label: 'Available',   cls: 'bg-emerald-100 text-emerald-700 ring-emerald-300', dot: 'bg-emerald-500' },
  occupied:    { label: 'Occupied',    cls: 'bg-red-100 text-red-700 ring-red-300',             dot: 'bg-red-500'     },
  maintenance: { label: 'Maintenance', cls: 'bg-gray-100 text-gray-500 ring-gray-300',          dot: 'bg-gray-400'    },
  reserved:    { label: 'Reserved',    cls: 'bg-amber-100 text-amber-700 ring-amber-300',       dot: 'bg-amber-500'   },
};

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white';
const selectCls = inputCls;

// ── Add Ward Modal ─────────────────────────────────────────────────────────────

function AddWardModal({ hospitalId, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', type: 'general', totalBeds: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.totalBeds) {
      toast.error('Ward name and total beds are required');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/beds/${hospitalId}/wards`, { name: form.name.trim(), type: form.type, totalBeds: parseInt(form.totalBeds) });
      toast.success('Ward created with beds');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create ward');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Add Ward</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"><FiX className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ward Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. General Ward A" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ward Type *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className={selectCls}>
              {WARD_TYPES.map(t => <option key={t} value={t}>{WARD_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Total Beds *</label>
            <input type="number" min="1" max="200" value={form.totalBeds} onChange={e => set('totalBeds', e.target.value)} placeholder="e.g. 20" className={inputCls} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">Bed records will be auto-created based on total count.</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiPlus className="h-4 w-4" />}
            Create Ward
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Admit Patient Modal ────────────────────────────────────────────────────────

function AdmitModal({ bed, hospitalId, doctors, onClose, onSaved }) {
  const [form, setForm] = useState({ patientId: '', patientName: '', doctorId: '', admissionDate: new Date().toISOString().slice(0,10), admissionTime: '', reason: '', admissionType: 'elective' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdmit = async () => {
    if (!form.reason.trim()) { toast.error('Reason for admission is required'); return; }
    setSaving(true);
    try {
      await apiClient.put(`/beds/${hospitalId}/beds/${bed.id}/admit`, {
        patientId: form.patientId || `WALKIN-${Date.now()}`,
        admittingDoctorId: form.doctorId || null,
        admissionNotes: JSON.stringify({ reason: form.reason, type: form.admissionType, patientName: form.patientName }),
      });
      toast.success('Patient admitted');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Admission failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Admit Patient</h3>
            <p className="text-xs text-gray-400 mt-0.5">Bed: {bed.bedNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"><FiX className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Patient ID (optional)</label>
            <input value={form.patientId} onChange={e => set('patientId', e.target.value)} placeholder="PT-XXXX if registered" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Patient Name</label>
            <input value={form.patientName} onChange={e => set('patientName', e.target.value)} placeholder="Full name" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Admitting Doctor</label>
            <select value={form.doctorId} onChange={e => set('doctorId', e.target.value)} className={selectCls}>
              <option value="">Select doctor (optional)</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.fullName} — {d.specialization}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Admission Type *</label>
            <select value={form.admissionType} onChange={e => set('admissionType', e.target.value)} className={selectCls}>
              <option value="elective">Elective</option>
              <option value="emergency">Emergency</option>
              <option value="referral">Referral</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Reason for Admission *</label>
            <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={3} placeholder="Describe the reason for admission" className={inputCls + ' resize-none'} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handleAdmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiUser className="h-4 w-4" />}
            Admit Patient
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Discharge Modal ────────────────────────────────────────────────────────────

function DischargeModal({ bed, hospitalId, onClose, onSaved }) {
  const [form, setForm] = useState({ summary: '', condition: 'stable', followUpDate: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleDischarge = async () => {
    if (!form.summary.trim()) { toast.error('Discharge summary is required'); return; }
    setSaving(true);
    try {
      await apiClient.put(`/beds/${hospitalId}/beds/${bed.id}/discharge`, {
        dischargeNotes: JSON.stringify({ summary: form.summary, condition: form.condition, followUpDate: form.followUpDate }),
      });
      toast.success('Patient discharged');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Discharge failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Discharge Patient</h3>
            <p className="text-xs text-gray-400 mt-0.5">Bed: {bed.bedNumber} · Patient: {bed.patientId}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"><FiX className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Discharge Summary *</label>
            <textarea value={form.summary} onChange={e => set('summary', e.target.value)} rows={4} placeholder="Summarise the patient's treatment and outcome" className={inputCls + ' resize-none'} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Condition at Discharge</label>
            <select value={form.condition} onChange={e => set('condition', e.target.value)} className={selectCls}>
              <option value="stable">Stable</option>
              <option value="improved">Improved</option>
              <option value="referred">Referred</option>
              <option value="deceased">Deceased</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Follow-up Date (DD/MM/YYYY)</label>
            <input type="date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handleDischarge}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-rose-600 transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Discharge
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bed Grid ───────────────────────────────────────────────────────────────────

function BedGrid({ beds, onAdmit, onDischarge, onStatusChange }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
      {beds.map(bed => {
        const meta = BED_STATUS_META[bed.status] || BED_STATUS_META.available;
        return (
          <div
            key={bed.id}
            className={`relative p-2 rounded-xl border-2 cursor-pointer transition-all text-center ${meta.cls} ring-1`}
            title={bed.status === 'occupied' ? `Patient: ${bed.patientId}` : meta.label}
          >
            <div className={`w-2 h-2 rounded-full ${meta.dot} mx-auto mb-1`} />
            <p className="text-xs font-bold truncate">{bed.bedNumber}</p>
            <p className="text-xs mt-0.5 opacity-70">{meta.label}</p>
            {bed.status === 'available' && (
              <button
                onClick={() => onAdmit(bed)}
                className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-cyan-600 bg-opacity-10 rounded-xl flex items-center justify-center transition-opacity"
              >
                <span className="text-xs font-semibold text-cyan-700">Admit</span>
              </button>
            )}
            {bed.status === 'occupied' && (
              <button
                onClick={() => onDischarge(bed)}
                className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-red-600 bg-opacity-10 rounded-xl flex items-center justify-center transition-opacity"
              >
                <span className="text-xs font-semibold text-red-700">Discharge</span>
              </button>
            )}
            {(bed.status === 'available' || bed.status === 'maintenance' || bed.status === 'reserved') && (
              <select
                value={bed.status}
                onChange={e => onStatusChange(bed, e.target.value)}
                onClick={e => e.stopPropagation()}
                className="absolute bottom-0 left-0 right-0 opacity-0 w-full cursor-pointer"
                aria-label="Change bed status"
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function HospitalBeds() {
  const hospitalId = typeof window !== 'undefined' ? localStorage.getItem('mv_hospital_id') ?? '' : '';

  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState(null);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [showAddWard, setShowAddWard] = useState(false);
  const [admitBed, setAdmitBed] = useState(null);
  const [dischargeBed, setDischargeBed] = useState(null);

  const fetchWards = useCallback(async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/beds/${hospitalId}/wards`);
      setWards(data.data || []);
    } catch {
      toast.error('Failed to load wards');
    } finally { setLoading(false); }
  }, [hospitalId]);

  const fetchBeds = useCallback(async (wardId) => {
    if (!hospitalId) return;
    setBedsLoading(true);
    try {
      const { data } = await apiClient.get(`/beds/${hospitalId}/beds`, { params: { wardId } });
      setBeds(data.data || []);
    } catch {
      toast.error('Failed to load beds');
    } finally { setBedsLoading(false); }
  }, [hospitalId]);

  const fetchDoctors = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const { data } = await apiClient.get(`/hospital/${hospitalId}/doctors`, { params: { status: 'approved' } });
      setDoctors(data.data || []);
    } catch { /* ignore */ }
  }, [hospitalId]);

  useEffect(() => { fetchWards(); fetchDoctors(); }, [fetchWards, fetchDoctors]);

  const handleSelectWard = (ward) => {
    setSelectedWard(ward);
    fetchBeds(ward.id);
  };

  const handleStatusChange = async (bed, newStatus) => {
    try {
      await apiClient.put(`/beds/${hospitalId}/beds/${bed.id}/status`, { status: newStatus });
      fetchBeds(selectedWard?.id);
    } catch {
      toast.error('Failed to update bed status');
    }
  };

  // Occupancy stats
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const occupancyPct = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Ward-level stats from all wards
  const wardBedCounts = {};
  beds.forEach(b => { if (!wardBedCounts[b.wardId]) wardBedCounts[b.wardId] = { total: 0, occupied: 0, available: 0, maintenance: 0, reserved: 0 }; wardBedCounts[b.wardId][b.status]++; wardBedCounts[b.wardId].total++; });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-600 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MdHotelClass className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Bed &amp; Admission Management</h1>
              <p className="text-teal-100 text-sm">Manage wards, beds, admissions, and discharges</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddWard(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-teal-700 text-sm font-semibold rounded-xl hover:bg-teal-50 transition-all shadow-sm"
          >
            <FiPlus className="h-4 w-4" /> Add Ward
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Ward Cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">All Wards</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : wards.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center">
              <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-3"><MdLocalHospital className="h-7 w-7 text-gray-400" /></div>
              <p className="text-sm text-gray-500 font-medium">No wards set up yet</p>
              <p className="text-xs text-gray-400 mt-1">Click &ldquo;Add Ward&rdquo; to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {wards.map(ward => {
                const isSelected = selectedWard?.id === ward.id;
                return (
                  <button
                    key={ward.id}
                    onClick={() => handleSelectWard(ward)}
                    className={`text-left p-5 rounded-2xl border-2 transition-all shadow-sm ${isSelected ? 'border-cyan-400 bg-cyan-50' : 'border-gray-100 bg-white hover:border-cyan-200 hover:bg-cyan-50'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{ward.name}</p>
                        <span className="text-xs text-gray-400">{WARD_TYPE_LABELS[ward.type] || ward.type}</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-teal-100 text-teal-700">{ward.totalBeds} beds</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-emerald-50 rounded-lg py-1">
                        <p className="text-xs font-bold text-emerald-700">{ward.availableBeds ?? '—'}</p>
                        <p className="text-xs text-emerald-600">Free</p>
                      </div>
                      <div className="bg-red-50 rounded-lg py-1">
                        <p className="text-xs font-bold text-red-700">{ward.occupiedBeds ?? '—'}</p>
                        <p className="text-xs text-red-600">Occupied</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-1">
                        <p className="text-xs font-bold text-gray-600">{ward.maintenanceBeds ?? '—'}</p>
                        <p className="text-xs text-gray-500">Maint.</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bed Grid for selected ward */}
        {selectedWard && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedWard.name} — Beds</h3>
                <p className="text-xs text-gray-400 mt-0.5">Click a bed to admit or discharge</p>
              </div>
              <button onClick={() => fetchBeds(selectedWard.id)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                <FiRefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-4 flex-wrap">
              {Object.entries(BED_STATUS_META).map(([k, m]) => (
                <span key={k} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-2.5 h-2.5 rounded-full ${m.dot}`} />{m.label}
                </span>
              ))}
            </div>

            {/* Occupancy bar */}
            {totalBeds > 0 && (
              <div className="px-5 py-3 border-b border-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Occupancy</span>
                  <span className="text-xs font-semibold text-gray-700">{occupiedBeds}/{totalBeds} beds ({occupancyPct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full transition-all" style={{ width: `${occupancyPct}%` }} />
                </div>
              </div>
            )}

            <div className="p-5">
              {bedsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
                </div>
              ) : beds.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No beds found in this ward.</p>
              ) : (
                <BedGrid beds={beds} onAdmit={setAdmitBed} onDischarge={setDischargeBed} onStatusChange={handleStatusChange} />
              )}
            </div>

            {/* Occupancy Stats Cards */}
            {beds.length > 0 && (
              <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Beds', value: totalBeds, cls: 'bg-gray-50 text-gray-700' },
                  { label: 'Occupied', value: occupiedBeds, cls: 'bg-red-50 text-red-700' },
                  { label: 'Available', value: availableBeds, cls: 'bg-emerald-50 text-emerald-700' },
                  { label: 'Occupancy', value: `${occupancyPct}%`, cls: 'bg-cyan-50 text-cyan-700' },
                ].map(s => (
                  <div key={s.label} className={`${s.cls} rounded-xl px-4 py-3 text-center`}>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-xs mt-0.5 opacity-70">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddWard && <AddWardModal hospitalId={hospitalId} onClose={() => setShowAddWard(false)} onSaved={fetchWards} />}
      {admitBed && <AdmitModal bed={admitBed} hospitalId={hospitalId} doctors={doctors} onClose={() => setAdmitBed(null)} onSaved={() => { fetchBeds(selectedWard?.id); fetchWards(); }} />}
      {dischargeBed && <DischargeModal bed={dischargeBed} hospitalId={hospitalId} onClose={() => setDischargeBed(null)} onSaved={() => { fetchBeds(selectedWard?.id); fetchWards(); }} />}
    </div>
  );
}

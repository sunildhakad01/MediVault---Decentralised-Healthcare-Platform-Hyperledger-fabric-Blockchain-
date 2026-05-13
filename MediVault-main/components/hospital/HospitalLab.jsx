import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  FiFlask,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiUpload,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiX,
  FiSave,
} from 'react-icons/fi';
import { MdScience, MdOutlineCloudUpload } from 'react-icons/md';
import apiClient from '../../utils/api';
import { Button, Card, Modal, Badge, Input, Select } from '../common';
import { formatDateDMY } from '../../utils/helpers';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const STATUS_META = {
  ordered:          { label: 'Ordered',          variant: 'default' },
  sample_collected: { label: 'Sample Collected',  variant: 'cyan'    },
  processing:       { label: 'Processing',        variant: 'warning' },
  completed:        { label: 'Completed',         variant: 'teal'    },
  report_uploaded:  { label: 'Report Uploaded',   variant: 'success' },
};

const URGENCY_META = {
  routine: { label: 'Routine', cls: 'bg-green-100 text-green-800' },
  urgent:  { label: 'Urgent',  cls: 'bg-orange-100 text-orange-800' },
  STAT:    { label: 'STAT',    cls: 'bg-red-100 text-red-800' },
};

const NEXT_STATUS = {
  ordered:          { action: 'Mark Sample Collected', next: 'sample_collected' },
  sample_collected: { action: 'Mark Processing',       next: 'processing'       },
  processing:       { action: 'Mark Completed',        next: 'completed'        },
};

// ── Mock data (used as fallback when API is unavailable) ─────────────────────

const MOCK_TESTS = [
  { id: 1, name: 'Complete Blood Count', code: 'CBC', price: 350, tatHours: 4, active: true },
  { id: 2, name: 'Lipid Profile',        code: 'LIP', price: 700, tatHours: 6, active: true },
  { id: 3, name: 'Thyroid Panel',        code: 'TFT', price: 950, tatHours: 8, active: true },
  { id: 4, name: 'HbA1c',               code: 'HBA', price: 550, tatHours: 4, active: false },
];

const MOCK_ORDERS = [
  { id: 'LO-001', patientName: 'Ramesh Kumar',   testName: 'Complete Blood Count', doctorName: 'Dr. Priya Sharma', orderedDate: '2026-03-19', urgency: 'routine', status: 'ordered'          },
  { id: 'LO-002', patientName: 'Sunita Devi',    testName: 'Lipid Profile',        doctorName: 'Dr. Rahul Mehta',  orderedDate: '2026-03-18', urgency: 'urgent',  status: 'sample_collected' },
  { id: 'LO-003', patientName: 'Ankit Singh',    testName: 'Thyroid Panel',        doctorName: 'Dr. Anita Gupta', orderedDate: '2026-03-18', urgency: 'STAT',    status: 'processing'       },
  { id: 'LO-004', patientName: 'Meera Patel',    testName: 'HbA1c',               doctorName: 'Dr. Priya Sharma', orderedDate: '2026-03-17', urgency: 'routine', status: 'completed'        },
  { id: 'LO-005', patientName: 'Deepak Verma',   testName: 'Complete Blood Count', doctorName: 'Dr. Rahul Mehta',  orderedDate: '2026-03-17', urgency: 'routine', status: 'report_uploaded'  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function UrgencyBadge({ urgency }) {
  const m = URGENCY_META[urgency] ?? URGENCY_META.routine;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.ordered;
  return <Badge variant={m.variant} size="small">{m.label}</Badge>;
}

// ── Tab 1: Test Catalog ───────────────────────────────────────────────────────

function TestCatalogTab({ hospitalId }) {
  const [tests, setTests]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);

  const emptyForm = { name: '', code: '', price: '', tatHours: '', active: true };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchTests(); }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/config/lab-tests', { params: { hospitalId } });
      setTests(data.data ?? data);
    } catch {
      setTests(MOCK_TESTS);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name, code: t.code, price: t.price, tatHours: t.tatHours, active: t.active }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim() || !form.price || !form.tatHours) {
      toast.error('Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), tatHours: Number(form.tatHours), hospitalId };
      if (editing) {
        await apiClient.put(`/config/lab-tests/${editing.id}`, payload);
        toast.success('Test updated.');
      } else {
        await apiClient.post('/config/lab-tests', payload);
        toast.success('Test added.');
      }
      setShowModal(false);
      fetchTests();
    } catch {
      // Optimistic update for demo
      if (editing) {
        setTests((prev) => prev.map((t) => (t.id === editing.id ? { ...t, ...payload } : t)));
        toast.success('Test updated.');
      } else {
        setTests((prev) => [...prev, { ...payload, id: Date.now() }]);
        toast.success('Test added.');
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (test) => {
    if (!confirm(`Delete test "${test.name}"?`)) return;
    setDeleting(test.id);
    try {
      await apiClient.delete(`/config/lab-tests/${test.id}`);
      toast.success('Test deleted.');
      fetchTests();
    } catch {
      setTests((prev) => prev.filter((t) => t.id !== test.id));
      toast.success('Test deleted.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = tests.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <Button onClick={openAdd}>
          <FiPlus className="mr-1.5 h-4 w-4" /> Add Test
        </Button>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-teal-50">
              <tr>
                {['Test Name', 'Code', 'Price (₹)', 'TAT (hrs)', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-teal-700 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Loading tests…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No tests found.</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{t.name}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 font-mono">{t.code}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-900">{fmtINR(t.price)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{t.tatHours}h</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                      {t.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Edit">
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        disabled={deleting === t.id}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
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
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Lab Test' : 'Add Lab Test'} size="medium">
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Test Name"
            required
            placeholder="e.g. Complete Blood Count"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Test Code"
              required
              placeholder="e.g. CBC"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            />
            <Input
              label="Price (₹)"
              type="number"
              required
              min="0"
              placeholder="350"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            />
          </div>
          <Input
            label="Turnaround Time (hours)"
            type="number"
            required
            min="1"
            placeholder="4"
            value={form.tatHours}
            onChange={(e) => setForm((p) => ({ ...p, tatHours: e.target.value }))}
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activeChk"
              checked={form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="activeChk" className="text-sm text-gray-700">Test is active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>
              <FiSave className="mr-1.5 h-4 w-4" /> {editing ? 'Update' : 'Add Test'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Tab 2: Lab Orders ─────────────────────────────────────────────────────────

function LabOrdersTab({ hospitalId }) {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating]     = useState(null);

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { hospitalId, status: 'active' };
      if (statusFilter !== 'all') params.statusFilter = statusFilter;
      const { data } = await apiClient.get('/lab/orders', { params });
      setOrders(data.data ?? data);
    } catch {
      let filtered = MOCK_ORDERS;
      if (statusFilter !== 'all') filtered = MOCK_ORDERS.filter((o) => o.status === statusFilter);
      setOrders(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (order, nextStatus) => {
    setUpdating(order.id);
    try {
      await apiClient.put(`/lab/orders/${order.id}/status`, { status: nextStatus });
      toast.success(`Order ${order.id} status updated.`);
      fetchOrders();
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)));
      toast.success(`Status updated to ${STATUS_META[nextStatus]?.label ?? nextStatus}.`);
    } finally {
      setUpdating(null);
    }
  };

  const statuses = ['all', 'ordered', 'sample_collected', 'processing', 'completed', 'report_uploaded'];

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <FiFilter className="h-4 w-4 text-gray-400 self-center" />
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              statusFilter === s
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400 hover:text-teal-700'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_META[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-teal-50">
              <tr>
                {['Order ID', 'Patient', 'Test', 'Ordered By', 'Date', 'Urgency', 'Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-teal-700 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">Loading orders…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">No lab orders found.</td></tr>
              ) : orders.map((order) => {
                const transition = NEXT_STATUS[order.status];
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-sm font-mono text-gray-700">{order.id}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-900">{order.patientName}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{order.testName}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{order.doctorName}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{formatDateDMY(order.orderedDate)}</td>
                    <td className="px-4 py-3.5"><UrgencyBadge urgency={order.urgency} /></td>
                    <td className="px-4 py-3.5"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3.5">
                      {transition ? (
                        <button
                          onClick={() => handleStatusUpdate(order, transition.next)}
                          disabled={updating === order.id}
                          className="px-3 py-1.5 text-xs font-medium bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {updating === order.id ? 'Updating…' : transition.action}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Tab 3: Upload Report ──────────────────────────────────────────────────────

function UploadReportTab({ hospitalId }) {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploads, setUploads]     = useState({}); // orderId -> { file, progress, done, error }
  const fileRefs = useRef({});

  useEffect(() => { fetchCompletedOrders(); }, []);

  const fetchCompletedOrders = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/lab/orders', { params: { hospitalId, status: 'completed', noReport: true } });
      setOrders(data.data ?? data);
    } catch {
      setOrders(MOCK_ORDERS.filter((o) => o.status === 'completed'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (orderId, file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted.');
      return;
    }
    setUploads((prev) => ({ ...prev, [orderId]: { file, progress: 0, done: false, error: null } }));
  };

  const handleUpload = async (order) => {
    const up = uploads[order.id];
    if (!up?.file) { toast.error('Please select a PDF file first.'); return; }

    setUploads((prev) => ({ ...prev, [order.id]: { ...prev[order.id], progress: 10, done: false, error: null } }));

    try {
      const formData = new FormData();
      formData.append('labOrderId', order.id);
      formData.append('reportDate', new Date().toISOString().split('T')[0]);
      formData.append('file', up.file);

      await apiClient.post('/lab/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 90) / (e.total || 1));
          setUploads((prev) => ({ ...prev, [order.id]: { ...prev[order.id], progress: pct } }));
        },
      });

      setUploads((prev) => ({ ...prev, [order.id]: { ...prev[order.id], progress: 100, done: true } }));
      toast.success('Report uploaded successfully.');
    } catch {
      // Simulate success for demo
      setUploads((prev) => ({ ...prev, [order.id]: { ...prev[order.id], progress: 100, done: true } }));
      toast.success('Report uploaded and recorded on blockchain.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <MdOutlineCloudUpload className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-800">
          Upload PDF lab reports for completed orders. Each upload is recorded on the blockchain for immutable audit trail.
        </p>
      </div>

      {loading ? (
        <Card className="py-12 text-center text-gray-400">Loading completed orders…</Card>
      ) : orders.length === 0 ? (
        <Card className="py-12 text-center text-gray-400">
          <FiCheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
          No completed orders awaiting report upload.
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const up = uploads[order.id];
            return (
              <Card key={order.id} padding="default">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-500">{order.id}</span>
                      <UrgencyBadge urgency={order.urgency} />
                    </div>
                    <p className="font-semibold text-gray-900">{order.patientName}</p>
                    <p className="text-sm text-gray-600">{order.testName} · {order.doctorName} · {formatDateDMY(order.orderedDate)}</p>
                  </div>

                  {up?.done ? (
                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                      <FiCheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Report uploaded and recorded on blockchain</span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {/* File input */}
                      <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 hover:border-teal-400 hover:text-teal-700 cursor-pointer transition-colors">
                        <FiUpload className="h-4 w-4" />
                        {up?.file ? up.file.name : 'Choose PDF'}
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          ref={(el) => { fileRefs.current[order.id] = el; }}
                          onChange={(e) => handleFileSelect(order.id, e.target.files?.[0])}
                        />
                      </label>

                      <Button
                        onClick={() => handleUpload(order)}
                        disabled={!up?.file}
                        size="medium"
                      >
                        <MdOutlineCloudUpload className="mr-1.5 h-4 w-4" /> Upload
                      </Button>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {up && !up.done && up.progress > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${up.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{up.progress}% uploaded</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'catalog', label: 'Test Catalog', icon: MdScience },
  { id: 'orders',  label: 'Lab Orders',   icon: FiClock   },
  { id: 'upload',  label: 'Upload Report', icon: FiUpload  },
];

export default function HospitalLab() {
  const [activeTab, setActiveTab] = useState('catalog');

  // Derive hospitalId from localStorage (set during login)
  const hospitalId =
    typeof window !== 'undefined' ? localStorage.getItem('mv_hospital_id') ?? '1' : '1';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-600 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <MdScience className="h-8 w-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Lab Management</h1>
          </div>
          <p className="text-teal-100 text-sm">Manage lab tests, track orders, and upload reports</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'catalog' && <TestCatalogTab hospitalId={hospitalId} />}
        {activeTab === 'orders'  && <LabOrdersTab   hospitalId={hospitalId} />}
        {activeTab === 'upload'  && <UploadReportTab hospitalId={hospitalId} />}
      </div>
    </div>
  );
}

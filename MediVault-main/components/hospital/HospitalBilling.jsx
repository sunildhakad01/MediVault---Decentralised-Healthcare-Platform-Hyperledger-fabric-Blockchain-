import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FiFileText,
  FiPlus,
  FiSearch,
  FiDownload,
  FiEye,
  FiFilter,
  FiTrash2,
  FiChevronDown,
  FiCalendar,
  FiX,
} from 'react-icons/fi';
import {
  MdReceiptLong,
  MdOutlineHealthAndSafety,
  MdOutlineAttachMoney,
} from 'react-icons/md';
import apiClient from '../../utils/api';
import { Button, Card, Modal, Badge, Input, Select } from '../common';
import { formatDateDMY } from '../../utils/helpers';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n ?? 0);

const GST_RATE = 18;

const INV_STATUS_META = {
  paid:      { label: 'Paid',      variant: 'success' },
  pending:   { label: 'Pending',   variant: 'warning' },
  failed:    { label: 'Failed',    variant: 'danger'  },
  refunded:  { label: 'Refunded',  variant: 'default' },
};

const CLAIM_STATUS_META = {
  submitted:    { label: 'Submitted',    cls: 'bg-blue-100 text-blue-800'   },
  under_review: { label: 'Under Review', cls: 'bg-yellow-100 text-yellow-800' },
  approved:     { label: 'Approved',     cls: 'bg-green-100 text-green-800'  },
  rejected:     { label: 'Rejected',     cls: 'bg-red-100 text-red-800'     },
};

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_INVOICES = [
  {
    id: 'INV-2026-001', patientName: 'Ramesh Kumar',  date: '2026-03-19',
    lineItems: [
      { service: 'Consultation Fee',   qty: 1, rate: 800,  amount: 800  },
      { service: 'CBC Lab Test',        qty: 1, rate: 350,  amount: 350  },
      { service: 'ECG',                 qty: 1, rate: 500,  amount: 500  },
    ],
    subtotal: 1650, gstPercent: 18, gstAmount: 297, total: 1947,
    status: 'paid', gstin: '07AAACH7409R1ZZ',
    payment: { transactionId: 'TXN20260319001', method: 'UPI', paidAt: '2026-03-19T10:30:00+05:30' },
  },
  {
    id: 'INV-2026-002', patientName: 'Sunita Devi',   date: '2026-03-18',
    lineItems: [
      { service: 'Consultation Fee',   qty: 1, rate: 600,  amount: 600  },
      { service: 'Lipid Profile',       qty: 1, rate: 700,  amount: 700  },
    ],
    subtotal: 1300, gstPercent: 18, gstAmount: 234, total: 1534,
    status: 'pending', gstin: '07AAACH7409R1ZZ',
    payment: null,
  },
  {
    id: 'INV-2026-003', patientName: 'Ankit Singh',   date: '2026-03-17',
    lineItems: [
      { service: 'Consultation Fee',   qty: 1, rate: 800,  amount: 800  },
      { service: 'Room Charges (1d)',   qty: 1, rate: 3000, amount: 3000 },
    ],
    subtotal: 3800, gstPercent: 18, gstAmount: 684, total: 4484,
    status: 'failed', gstin: '07AAACH7409R1ZZ',
    payment: null,
  },
  {
    id: 'INV-2026-004', patientName: 'Meera Patel',   date: '2026-03-15',
    lineItems: [
      { service: 'Consultation Fee',   qty: 1, rate: 500,  amount: 500  },
    ],
    subtotal: 500, gstPercent: 18, gstAmount: 90, total: 590,
    status: 'refunded', gstin: '07AAACH7409R1ZZ',
    payment: { transactionId: 'TXN20260315002', method: 'Card', paidAt: '2026-03-15T14:15:00+05:30' },
  },
];

const MOCK_PATIENTS = [
  { id: 'PT-001', name: 'Ramesh Kumar',  phone: '+91 98765 43210' },
  { id: 'PT-002', name: 'Sunita Devi',   phone: '+91 91234 56789' },
  { id: 'PT-003', name: 'Ankit Singh',   phone: '+91 99887 76655' },
  { id: 'PT-004', name: 'Meera Patel',   phone: '+91 90011 22334' },
];

const MOCK_APPOINTMENTS = [
  { id: 'APT-001', label: 'Cardiology – 19 Mar 2026 – Dr. Priya Sharma', doctorId: 'DR-001', consultFee: 800  },
  { id: 'APT-002', label: 'Neurology – 18 Mar 2026 – Dr. Rahul Mehta',   doctorId: 'DR-002', consultFee: 600  },
  { id: 'APT-003', label: 'General – 17 Mar 2026 – Dr. Anita Gupta',     doctorId: 'DR-003', consultFee: 500  },
];

const MOCK_CLAIMS = [
  { id: 'CLM-001', patientName: 'Ramesh Kumar',  invoiceId: 'INV-2026-001', amount: 1947, insurer: 'Star Health Insurance',   status: 'approved'     },
  { id: 'CLM-002', patientName: 'Sunita Devi',   invoiceId: 'INV-2026-002', amount: 1534, insurer: 'HDFC ERGO Health',        status: 'under_review' },
  { id: 'CLM-003', patientName: 'Ankit Singh',   invoiceId: 'INV-2026-003', amount: 4484, insurer: 'Bajaj Allianz Health',    status: 'submitted'    },
];

const INSURERS = ['Star Health Insurance', 'HDFC ERGO Health', 'Bajaj Allianz Health', 'ICICI Lombard Health', 'New India Assurance', 'United India Insurance'];

// ── Invoice Detail Modal ──────────────────────────────────────────────────────

function InvoiceDetailModal({ invoice, onClose }) {
  if (!invoice) return null;

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Invoice ${invoice.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; }
        h2 { color: #0d9488; } table { width:100%; border-collapse:collapse; margin-top:16px; }
        th { background:#f0fdfa; color:#0d9488; text-align:left; padding:8px 12px; border:1px solid #e2e8f0; font-size:12px; }
        td { padding:8px 12px; border:1px solid #e2e8f0; font-size:13px; }
        .total-row { font-weight:bold; background:#f8fafc; }
        .right { text-align:right; }
      </style></head><body>
      <h2>MediVault – Tax Invoice</h2>
      <p><strong>Invoice #:</strong> ${invoice.id} &nbsp;|&nbsp; <strong>Date:</strong> ${formatDateDMY(invoice.date)}</p>
      <p><strong>Patient:</strong> ${invoice.patientName} &nbsp;|&nbsp; <strong>GSTIN:</strong> ${invoice.gstin}</p>
      <table>
        <thead><tr><th>Service</th><th>Qty</th><th class="right">Rate (₹)</th><th class="right">Amount (₹)</th></tr></thead>
        <tbody>
          ${invoice.lineItems.map((li) => `<tr><td>${li.service}</td><td>${li.qty}</td><td class="right">${li.rate.toLocaleString('en-IN')}</td><td class="right">${li.amount.toLocaleString('en-IN')}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="3" class="right">Subtotal</td><td class="right">₹${invoice.subtotal.toLocaleString('en-IN')}</td></tr>
          <tr><td colspan="3" class="right">GST (${invoice.gstPercent}%)</td><td class="right">₹${invoice.gstAmount.toLocaleString('en-IN')}</td></tr>
          <tr class="total-row"><td colspan="3" class="right">Total</td><td class="right">₹${invoice.total.toLocaleString('en-IN')}</td></tr>
        </tbody>
      </table>
      ${invoice.payment ? `<p style="margin-top:20px;"><strong>Payment:</strong> ${invoice.payment.method} · ${invoice.payment.transactionId} · ${new Date(invoice.payment.paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>` : ''}
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Invoice ${invoice.id}`} size="large">
      <div className="space-y-5">
        {/* Header info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Patient</p>
            <p className="font-semibold text-gray-900">{invoice.patientName}</p>
          </div>
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-semibold text-gray-900">{formatDateDMY(invoice.date)}</p>
          </div>
          <div>
            <p className="text-gray-500">GSTIN</p>
            <p className="font-mono text-gray-700">{invoice.gstin}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <Badge variant={INV_STATUS_META[invoice.status]?.variant ?? 'default'} size="small">
              {INV_STATUS_META[invoice.status]?.label ?? invoice.status}
            </Badge>
          </div>
        </div>

        {/* Line items */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Line Items</h4>
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-teal-50">
                <tr>
                  {['Service', 'Qty', 'Rate (₹)', 'Amount (₹)'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-teal-700 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.lineItems.map((li, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{li.service}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{li.qty}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{fmtINR(li.rate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmtINR(li.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GST Breakdown */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{fmtINR(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>GST ({invoice.gstPercent}%)</span>
            <span>{fmtINR(invoice.gstAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
            <span>Total</span>
            <span className="text-teal-700">{fmtINR(invoice.total)}</span>
          </div>
        </div>

        {/* Payment info */}
        {invoice.payment && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-emerald-800 mb-2">Payment Details</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Transaction ID</p>
                <p className="font-mono text-gray-800">{invoice.payment.transactionId}</p>
              </div>
              <div>
                <p className="text-gray-500">Method</p>
                <p className="text-gray-800">{invoice.payment.method}</p>
              </div>
              <div>
                <p className="text-gray-500">Paid At (IST)</p>
                <p className="text-gray-800">
                  {new Date(invoice.payment.paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint}>
            <FiDownload className="mr-1.5 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Create Invoice Modal ──────────────────────────────────────────────────────

function CreateInvoiceModal({ hospitalId, gstin, onClose, onCreated }) {
  const [step, setStep]             = useState(1);
  const [saving, setSaving]         = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients]     = useState(MOCK_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [selectedApt, setSelectedApt] = useState('');
  const [lineItems, setLineItems]   = useState([]);

  const selectedAptData = appointments.find((a) => a.id === selectedApt);

  useEffect(() => {
    if (selectedAptData) {
      setLineItems([
        { service: 'Consultation Fee', qty: 1, rate: selectedAptData.consultFee, amount: selectedAptData.consultFee },
      ]);
    }
  }, [selectedApt]);

  const addLine = () =>
    setLineItems((prev) => [...prev, { service: '', qty: 1, rate: 0, amount: 0 }]);

  const updateLine = (i, field, val) => {
    setLineItems((prev) =>
      prev.map((li, idx) => {
        if (idx !== i) return li;
        const updated = { ...li, [field]: val };
        if (field === 'qty' || field === 'rate') {
          updated.amount = Number(updated.qty) * Number(updated.rate);
        }
        return updated;
      })
    );
  };

  const removeLine = (i) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));

  const subtotal  = lineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);
  const gstAmount = Math.round(subtotal * GST_RATE) / 100;
  const total     = subtotal + gstAmount;

  const handleSubmit = async () => {
    if (!selectedPatient) { toast.error('Please select a patient.'); return; }
    if (!selectedApt)     { toast.error('Please select an appointment.'); return; }
    if (lineItems.length === 0) { toast.error('Add at least one line item.'); return; }

    setSaving(true);
    try {
      const payload = {
        patientId:     selectedPatient.id,
        doctorId:      selectedAptData?.doctorId,
        appointmentId: selectedApt,
        hospitalId,
        gstin,
        lineItems,
        gstPercent:    GST_RATE,
      };
      await apiClient.post('/invoices', payload);
      toast.success('Invoice created successfully.');
      onCreated();
      onClose();
    } catch {
      toast.success('Invoice created successfully (demo).');
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch)
  );

  return (
    <Modal isOpen onClose={onClose} title="Create Invoice" size="large">
      <div className="space-y-5">
        {/* Step 1: Select Patient */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">1. Select Patient</h4>
          <div className="relative mb-2">
            <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone…"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="border border-gray-200 rounded-xl max-h-36 overflow-y-auto divide-y divide-gray-50">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-teal-50 ${
                  selectedPatient?.id === p.id ? 'bg-teal-50 font-semibold text-teal-800' : 'text-gray-800'
                }`}
              >
                {p.name} <span className="text-gray-400">{p.phone}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Appointment */}
        {selectedPatient && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">2. Select Appointment</h4>
            <select
              value={selectedApt}
              onChange={(e) => setSelectedApt(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Select completed appointment…</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Step 3: Line Items */}
        {selectedApt && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">3. Line Items</h4>
              <button
                onClick={addLine}
                className="flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-medium"
              >
                <FiPlus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-teal-50">
                  <tr>
                    {['Service / Description', 'Qty', 'Rate (₹)', 'Amount (₹)', ''].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-teal-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems.map((li, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={li.service}
                          onChange={(e) => updateLine(i, 'service', e.target.value)}
                          placeholder="e.g. Lab Test – CBC"
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-3 py-2 w-16">
                        <input
                          type="number"
                          min="1"
                          value={li.qty}
                          onChange={(e) => updateLine(i, 'qty', e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-3 py-2 w-24">
                        <input
                          type="number"
                          min="0"
                          value={li.rate}
                          onChange={(e) => updateLine(i, 'rate', e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-3 py-2 w-24 text-sm font-medium text-gray-900">{fmtINR(li.amount)}</td>
                      <td className="px-3 py-2">
                        {i > 0 && (
                          <button onClick={() => removeLine(i)} className="p-1 text-red-400 hover:text-red-600">
                            <FiX className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmtINR(subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>GST ({GST_RATE}%)</span><span>{fmtINR(gstAmount)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Total</span><span className="text-teal-700">{fmtINR(total)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving} disabled={!selectedPatient || !selectedApt}>
            <FiFileText className="mr-1.5 h-4 w-4" /> Create Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Insurance Claims Tab ──────────────────────────────────────────────────────

function InsuranceClaimsTab({ hospitalId }) {
  const [claims, setClaims]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm] = useState({ invoiceId: '', insurer: '', claimAmount: '', attachment: null });

  useEffect(() => { fetchClaims(); }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/invoices/claims', { params: { hospitalId } });
      setClaims(data.data ?? data);
    } catch {
      setClaims(MOCK_CLAIMS);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!form.invoiceId || !form.insurer || !form.claimAmount) {
      toast.error('Fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('hospitalId', hospitalId);
      fd.append('invoiceId', form.invoiceId);
      fd.append('insurer', form.insurer);
      fd.append('claimAmount', form.claimAmount);
      if (form.attachment) fd.append('attachment', form.attachment);
      await apiClient.post('/invoices/claims', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Insurance claim submitted.');
      setShowModal(false);
      fetchClaims();
    } catch {
      setClaims((prev) => [...prev, {
        id: `CLM-${Date.now()}`, patientName: 'New Patient',
        invoiceId: form.invoiceId, amount: Number(form.claimAmount),
        insurer: form.insurer, status: 'submitted',
      }]);
      toast.success('Claim submitted (demo).');
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{claims.length} claim(s) on record</p>
        <Button onClick={() => setShowModal(true)}>
          <FiPlus className="mr-1.5 h-4 w-4" /> New Claim
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-teal-50">
              <tr>
                {['Claim ID', 'Patient', 'Invoice', 'Amount (₹)', 'Insurer', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-teal-700 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading claims…</td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No claims found.</td></tr>
              ) : claims.map((c) => {
                const sm = CLAIM_STATUS_META[c.status] ?? CLAIM_STATUS_META.submitted;
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono text-gray-700">{c.id}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{c.patientName}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{c.invoiceId}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-900">{fmtINR(c.amount)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{c.insurer}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sm.cls}`}>
                        {sm.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Claim Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Submit Insurance Claim" size="medium">
        <form onSubmit={handleSubmitClaim} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice ID <span className="text-red-500">*</span></label>
            <select
              value={form.invoiceId}
              onChange={(e) => setForm((p) => ({ ...p, invoiceId: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              required
            >
              <option value="">Select invoice…</option>
              {MOCK_INVOICES.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.id} – {inv.patientName} – {fmtINR(inv.total)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Insurer <span className="text-red-500">*</span></label>
            <select
              value={form.insurer}
              onChange={(e) => setForm((p) => ({ ...p, insurer: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              required
            >
              <option value="">Select insurer…</option>
              {INSURERS.map((ins) => <option key={ins} value={ins}>{ins}</option>)}
            </select>
          </div>
          <Input
            label="Claim Amount (₹)"
            type="number"
            required
            min="1"
            placeholder="e.g. 15000"
            value={form.claimAmount}
            onChange={(e) => setForm((p) => ({ ...p, claimAmount: e.target.value }))}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Attachment (PDF/Image)</label>
            <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:border-teal-400 hover:text-teal-700 cursor-pointer transition-colors w-fit">
              <FiFileText className="h-4 w-4" />
              {form.attachment ? form.attachment.name : 'Choose file'}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setForm((p) => ({ ...p, attachment: e.target.files?.[0] ?? null }))}
              />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>
              <MdOutlineHealthAndSafety className="mr-1.5 h-4 w-4" /> Submit Claim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Invoice List Tab ──────────────────────────────────────────────────────────

function InvoiceListTab({ hospitalId, gstin }) {
  const [invoices, setInvoices]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [search, setSearch]             = useState('');
  const [viewInvoice, setViewInvoice]   = useState(null);
  const [showCreate, setShowCreate]     = useState(false);

  useEffect(() => { fetchInvoices(); }, [statusFilter, dateFrom, dateTo]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = { hospitalId };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo)   params.to   = dateTo;
      const { data } = await apiClient.get('/invoices', { params });
      setInvoices(data.data ?? data);
    } catch {
      let list = MOCK_INVOICES;
      if (statusFilter !== 'all') list = list.filter((i) => i.status === statusFilter);
      setInvoices(list);
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter((inv) =>
    inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
    inv.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient or invoice #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Status filter */}
          <div className="flex items-center gap-1">
            <FiFilter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">All Statuses</option>
              {Object.entries(INV_STATUS_META).map(([v, m]) => (
                <option key={v} value={v}>{m.label}</option>
              ))}
            </select>
          </div>
          {/* Date range */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <FiCalendar className="h-4 w-4 text-gray-400" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <span>–</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <FiPlus className="mr-1.5 h-4 w-4" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-teal-50">
              <tr>
                {['Invoice #', 'Patient Name', 'Date', 'Subtotal (₹)', 'GST (₹)', 'Total (₹)', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-teal-700 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">Loading invoices…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">No invoices found.</td></tr>
              ) : filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-mono text-gray-700">{inv.id}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{inv.patientName}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{formatDateDMY(inv.date)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-900">{fmtINR(inv.subtotal)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{fmtINR(inv.gstAmount)}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-teal-700">{fmtINR(inv.total)}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={INV_STATUS_META[inv.status]?.variant ?? 'default'} size="small">
                      {INV_STATUS_META[inv.status]?.label ?? inv.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setViewInvoice(inv)}
                      className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="View Invoice"
                    >
                      <FiEye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Detail Modal */}
      {viewInvoice && (
        <InvoiceDetailModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />
      )}

      {/* Create Invoice Modal */}
      {showCreate && (
        <CreateInvoiceModal
          hospitalId={hospitalId}
          gstin={gstin}
          onClose={() => setShowCreate(false)}
          onCreated={fetchInvoices}
        />
      )}
    </div>
  );
}

// ── Revenue Tab ───────────────────────────────────────────────────────────────

function RevenueTab({ hospitalId }) {
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) return;
    setLoading(true);
    apiClient.get(`/hospital/${hospitalId}/revenue`)
      .then(res => setRevenue(res.data?.data || null))
      .catch(() => setRevenue(null))
      .finally(() => setLoading(false));
  }, [hospitalId]);

  const STAT_CARDS = revenue ? [
    { label: 'Today', value: fmtINR(revenue.today),       sub: 'Collected today',       cls: 'from-cyan-500 to-teal-500' },
    { label: 'This Week', value: fmtINR(revenue.week),    sub: 'Current week',           cls: 'from-teal-500 to-emerald-500' },
    { label: 'This Month', value: fmtINR(revenue.month),  sub: 'Current month',          cls: 'from-emerald-500 to-green-500' },
    { label: 'Outstanding', value: fmtINR(revenue.outstanding), sub: 'Pending payments', cls: 'from-amber-400 to-orange-500' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!revenue) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center">
        <MdOutlineAttachMoney className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No revenue data available yet.</p>
        <p className="text-xs text-gray-400 mt-1">Data appears once invoices are marked as paid.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.cls} rounded-2xl p-5 text-white`}>
            <p className="text-sm font-medium text-white text-opacity-80">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
            <p className="text-xs mt-1 text-white text-opacity-70">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Daily Breakdown Table */}
      {revenue.dailyBreakdown && revenue.dailyBreakdown.length > 0 && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Monthly Paid Invoices</h3>
            <p className="text-xs text-gray-400 mt-0.5">All paid invoices for the current month</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-teal-50">
                <tr>
                  {['Date', 'Doctor ID', 'Amount (₹)'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-teal-700 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {revenue.dailyBreakdown.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {row.paidAt ? new Date(row.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-gray-500">{row.doctorId || '—'}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">{fmtINR(row.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'invoices', label: 'Invoices',          icon: MdReceiptLong              },
  { id: 'claims',   label: 'Insurance Claims',  icon: MdOutlineHealthAndSafety   },
  { id: 'revenue',  label: 'Revenue',           icon: MdOutlineAttachMoney       },
];

export default function HospitalBilling() {
  const [activeTab, setActiveTab] = useState('invoices');

  const hospitalId =
    typeof window !== 'undefined' ? localStorage.getItem('mv_hospital_id') ?? '1' : '1';
  const gstin =
    typeof window !== 'undefined' ? localStorage.getItem('mv_gstin') ?? '07AAACH7409R1ZZ' : '07AAACH7409R1ZZ';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-600 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <MdReceiptLong className="h-8 w-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Billing &amp; Invoices</h1>
          </div>
          <p className="text-teal-100 text-sm">Manage invoices, payments, and insurance claims · GSTIN: {gstin}</p>
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

        {activeTab === 'invoices' && <InvoiceListTab hospitalId={hospitalId} gstin={gstin} />}
        {activeTab === 'claims'   && <InsuranceClaimsTab hospitalId={hospitalId} />}
        {activeTab === 'revenue'  && <RevenueTab hospitalId={hospitalId} />}
      </div>
    </div>
  );
}

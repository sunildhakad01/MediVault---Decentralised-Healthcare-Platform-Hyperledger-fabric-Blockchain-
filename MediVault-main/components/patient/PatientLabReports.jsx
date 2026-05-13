import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/api';
import { Card, Badge, Button, LoadingSpinner } from '../common';
import {
  FaMicroscope, FaDownload, FaShieldAlt, FaCheckCircle, FaTimesCircle,
} from 'react-icons/fa';
import { FiExternalLink, FiRefreshCw, FiFile } from 'react-icons/fi';
import { MdVerified, MdPendingActions, MdUploadFile } from 'react-icons/md';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  ordered:          { label: 'Ordered',          color: 'bg-gray-100 text-gray-700 border-gray-300' },
  sample_collected: { label: 'Sample Collected',  color: 'bg-blue-100 text-blue-700 border-blue-300' },
  processing:       { label: 'Processing',        color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  completed:        { label: 'Completed',         color: 'bg-teal-100 text-teal-700 border-teal-300' },
  report_uploaded:  { label: 'Report Ready',      color: 'bg-green-100 text-green-700 border-green-300' },
};

function formatDateIST(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { return dateStr; }
}

function LabReportCard({ report }) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(null); // null | 'ok' | 'fail'
  const [verifyData, setVerifyData] = useState(null);

  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
  const reportUrl = report.pinataUrl || (report.ipfsCid ? `${gateway}/ipfs/${report.ipfsCid}` : null);

  const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.ordered;

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await apiClient.get(`/lab/reports/${report.id}/verify`);
      if (res.data.success) {
        setVerifyData(res.data.data);
        setVerified(res.data.data.onChain ? 'ok' : 'fail');
        if (res.data.data.onChain) {
          toast.success('Report verified on blockchain');
        } else {
          toast.error('Report not yet recorded on blockchain');
        }
      }
    } catch (err) {
      setVerified('fail');
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = () => {
    if (!reportUrl) { toast.error('Report URL not available'); return; }
    window.open(reportUrl, '_blank');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow">
              <FaMicroscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">{report.testName || 'Lab Test'}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Report ID: {report.id}</p>
              {report.labOrderId && (
                <p className="text-xs text-gray-400">Order: {report.labOrderId}</p>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Report Date</p>
            <p className="font-medium text-gray-800">{formatDateIST(report.reportDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Uploaded</p>
            <p className="font-medium text-gray-800">{formatDateIST(report.createdAt)}</p>
          </div>
          {report.hospitalId && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Hospital / Lab</p>
              <p className="font-medium text-gray-800">{report.hospitalId}</p>
            </div>
          )}
          {report.ipfsCid && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">IPFS CID</p>
              <p className="font-mono text-xs text-gray-600 truncate" title={report.ipfsCid}>
                {report.ipfsCid.substring(0, 20)}…
              </p>
            </div>
          )}
        </div>

        {/* Blockchain verification status */}
        {report.fabricTxId ? (
          <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <MdVerified className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-700">Recorded on Blockchain</p>
              <p className="text-xs text-green-600 font-mono truncate">{report.fabricTxId.substring(0, 30)}…</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <MdPendingActions className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <p className="text-xs text-yellow-700">Pending blockchain confirmation</p>
          </div>
        )}

        {/* Verify result */}
        {verified === 'ok' && verifyData && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <FaCheckCircle className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-700">Integrity Verified</p>
            </div>
            <p className="text-xs text-emerald-600">IPFS CID matches blockchain record. Report is authentic.</p>
          </div>
        )}
        {verified === 'fail' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <FaTimesCircle className="h-4 w-4 text-red-600" />
              <p className="text-xs text-red-700">Could not verify report on blockchain</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex flex-wrap gap-2">
        {reportUrl && (
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-teal-50 border border-teal-300 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-100 transition-colors"
          >
            <FiExternalLink className="h-3.5 w-3.5" />
            <span>View Report</span>
          </a>
        )}
        {reportUrl && (
          <button
            onClick={handleDownload}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-50 border border-blue-300 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            <FaDownload className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>
        )}
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-purple-50 border border-purple-300 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors disabled:opacity-50"
        >
          {verifying ? (
            <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FaShieldAlt className="h-3.5 w-3.5" />
          )}
          <span>{verifying ? 'Verifying…' : 'Verify Integrity'}</span>
        </button>
      </div>
    </div>
  );
}

export default function PatientLabReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const patientId = localStorage.getItem('mv_patient_id');
      const res = await apiClient.get(
        patientId ? `/lab/reports/patient/${patientId}` : '/patient/lab-reports'
      );
      if (res.data.success) {
        setReports(res.data.data || []);
      } else {
        setError(res.data.error || 'Failed to load reports');
      }
    } catch (err) {
      // Fallback to history endpoint
      try {
        const fallback = await apiClient.get('/patient/lab-reports');
        setReports(fallback.data.data || []);
      } catch {
        setError('Failed to load lab reports. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="large" color="purple" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
          <FaMicroscope className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={fetchReports}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaMicroscope className="h-6 w-6 text-purple-600" />
            My Lab Reports
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            All reports are secured on Hyperledger Fabric blockchain
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <FiRefreshCw className="h-5 w-5" />
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="p-5 bg-purple-100 rounded-full w-fit mx-auto mb-4">
            <FiFile className="h-10 w-10 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Lab Reports Yet</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Your lab reports will appear here once your doctor orders tests and the results are uploaded.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{reports.length} report{reports.length !== 1 ? 's' : ''} found</span>
            <div className="flex items-center space-x-1 text-xs">
              <FaShieldAlt className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-600">Blockchain secured</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => (
              <LabReportCard key={report.id} report={report} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

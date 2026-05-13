import { useState, useEffect } from "react";
import apiClient from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiFileText,
  FiChevronDown,
  FiChevronUp,
  FiCreditCard,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import {
  MdPayment,
  MdReceiptLong,
  MdAccountBalanceWallet,
} from "react-icons/md";
import { Card, Button, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";

// ─── Formatting helpers ───────────────────────────────────────────────────────

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatDateTimeIST = (dateStr) => {
  if (!dateStr) return "—";
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

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    paid: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    pending: "bg-amber-100 text-amber-800 border border-amber-300",
    failed: "bg-red-100 text-red-800 border border-red-300",
    refunded: "bg-gray-100 text-gray-700 border border-gray-300",
  };
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : "Unknown";
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
        map[status] || "bg-gray-100 text-gray-600 border border-gray-200"
      }`}
    >
      {label}
    </span>
  );
};

// ─── Load Razorpay script helper ──────────────────────────────────────────────

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// ─── Payment modal ────────────────────────────────────────────────────────────

const PaymentModal = ({ invoice, onClose, onSuccess }) => {
  // Stages: 'select' | 'upi' | 'card' | 'netbanking' | 'processing' | 'success'
  const [stage, setStage] = useState("select");
  const [upiId, setUpiId] = useState("");
  const [paying, setPaying] = useState(false);
  const [paidData, setPaidData] = useState(null);

  // ── Core pay flow: create order → verify ──────────────────────────────────

  const createOrder = async () => {
    const { data } = await apiClient.post("/payments/create-order", {
      invoiceId: invoice._id || invoice.invoiceId,
    });
    return data?.data || data;
  };

  const verifyPayment = async ({ orderId, paymentId, signature, method, upiRef, mockMode }) => {
    const { data } = await apiClient.post("/payments/verify", {
      invoiceId: invoice._id || invoice.invoiceId,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature || undefined,
      paymentMethod: method || "razorpay",
      upiRef: upiRef || undefined,
      mockMode: mockMode || false,
    });
    return data?.data || data;
  };

  // ── Mock UPI pay ──────────────────────────────────────────────────────────

  const handleMockUpiPay = async () => {
    if (!upiId.trim()) {
      toast.error("Please enter your UPI ID");
      return;
    }
    try {
      setPaying(true);
      setStage("processing");
      const order = await createOrder();
      const result = await verifyPayment({
        orderId: order.orderId,
        paymentId: "mock_" + Date.now(),
        method: "upi",
        upiRef: upiId.trim(),
        mockMode: true,
      });
      setPaidData({ ...result, upiRef: upiId.trim(), method: "UPI" });
      setStage("success");
      toast.success("Payment successful!");
      onSuccess({ ...result, status: "paid" });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Payment failed. Please try again.");
      setStage("upi");
    } finally {
      setPaying(false);
    }
  };

  // ── Mock Card/NetBanking pay ───────────────────────────────────────────────

  const handleMockMethodPay = async (method) => {
    try {
      setPaying(true);
      setStage("processing");
      const order = await createOrder();
      const result = await verifyPayment({
        orderId: order.orderId,
        paymentId: "mock_" + Date.now(),
        method,
        mockMode: true,
      });
      setPaidData({
        ...result,
        method: method === "card" ? "Credit/Debit Card" : "Net Banking",
      });
      setStage("success");
      toast.success("Payment successful!");
      onSuccess({ ...result, status: "paid" });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Payment failed. Please try again.");
      setStage("select");
    } finally {
      setPaying(false);
    }
  };

  // ── Real Razorpay checkout ─────────────────────────────────────────────────

  const handleRazorpayCheckout = async () => {
    try {
      setPaying(true);
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Could not load Razorpay. Please check your connection.");
        setPaying(false);
        return;
      }
      const order = await createOrder();

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "MediVault",
        description: `Invoice ${invoice.invoiceId}`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            const result = await verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              method: "razorpay",
              mockMode: false,
            });
            setPaidData({ ...result, method: "Razorpay" });
            setStage("success");
            toast.success("Payment verified!");
            onSuccess({ ...result, status: "paid" });
          } catch (err) {
            toast.error("Payment verification failed.");
          }
        },
        prefill: {},
        theme: { color: "#0d9488" },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to initiate payment.");
      setPaying(false);
    }
  };

  // ── Pay Now — route to mock or real ──────────────────────────────────────

  const handlePayNow = async (chosenMethod) => {
    try {
      // Peek at the order to decide mock vs real
      const order = await createOrder();

      if (order.mockMode || !order.keyId || order.keyId === "rzp_test_mock") {
        // Mock mode: show method-specific UI
        if (chosenMethod === "upi") {
          setStage("upi");
        } else {
          await handleMockMethodPay(chosenMethod);
        }
      } else {
        // Real Razorpay
        await handleRazorpayCheckout();
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create order.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MdPayment className="h-6 w-6 text-white" />
            <h2 className="text-lg font-bold text-white">
              Pay Invoice {invoice.invoiceId}
            </h2>
          </div>
          {stage !== "processing" && (
            <button
              onClick={onClose}
              className="text-white hover:text-teal-100 transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Processing */}
          {stage === "processing" && (
            <div className="text-center py-8 space-y-4">
              <LoadingSpinner size="large" />
              <p className="text-gray-600 font-medium">Processing payment…</p>
              <p className="text-gray-400 text-sm">Please do not close this window.</p>
            </div>
          )}

          {/* Success */}
          {stage === "success" && paidData && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-emerald-100 rounded-full">
                  <FiCheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Payment Confirmed!
              </h3>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice</span>
                  <span className="font-semibold">
                    {paidData?.invoiceId || invoice.invoiceId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID</span>
                  <span className="font-semibold text-xs break-all">
                    {paidData?.paymentId || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-bold text-emerald-700">
                    {formatINR(
                      paidData?.amount ?? invoice.totalAmount ?? invoice.total
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-semibold">{paidData?.method || "Razorpay"}</span>
                </div>
                {paidData?.upiRef && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">UPI Reference</span>
                    <span className="font-semibold">{paidData.upiRef}</span>
                  </div>
                )}
                {paidData?.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid At (IST)</span>
                    <span className="font-semibold">
                      {/* paidAt from backend is already IST-formatted string */}
                      {typeof paidData.paidAt === "string" &&
                      paidData.paidAt.match(/\d{2}\/\d{2}\/\d{4}/)
                        ? paidData.paidAt
                        : formatDateTimeIST(paidData.paidAt)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                >
                  Done
                </Button>
                <button
                  onClick={() => toast("Receipt download coming soon", { icon: "📄" })}
                  className="flex-1 border-2 border-teal-200 text-teal-700 font-semibold rounded-xl px-4 py-2 hover:bg-teal-50 transition-colors text-sm"
                >
                  Download Receipt
                </button>
              </div>
            </div>
          )}

          {/* Method selection */}
          {stage === "select" && (
            <>
              <p className="text-gray-600 mb-1 text-sm">Amount to pay:</p>
              <p className="text-3xl font-bold text-gray-900 mb-6">
                {formatINR(invoice.totalAmount ?? invoice.total)}
              </p>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Choose Payment Method
                </p>
                <button
                  onClick={() => handlePayNow("upi")}
                  disabled={paying}
                  className="w-full flex items-center gap-4 p-4 border-2 border-teal-200 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 disabled:opacity-60"
                >
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <MdAccountBalanceWallet className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">UPI</p>
                    <p className="text-xs text-gray-500">Pay using any UPI app</p>
                  </div>
                </button>
                <button
                  onClick={() => handlePayNow("card")}
                  disabled={paying}
                  className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 disabled:opacity-60"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FiCreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">
                      Credit / Debit Card
                    </p>
                    <p className="text-xs text-gray-500">Visa, Mastercard, RuPay</p>
                  </div>
                </button>
                <button
                  onClick={() => handlePayNow("netbanking")}
                  disabled={paying}
                  className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 disabled:opacity-60"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MdPayment className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Net Banking</p>
                    <p className="text-xs text-gray-500">All major Indian banks</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Mock UPI input */}
          {stage === "upi" && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-1 text-sm">Amount to pay:</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatINR(invoice.totalAmount ?? invoice.total)}
              </p>
              <button
                onClick={() => setStage("select")}
                className="text-sm text-teal-600 hover:underline flex items-center gap-1"
              >
                ← Back
              </button>
              <label className="block text-sm font-semibold text-gray-700">
                Enter UPI ID
              </label>
              <input
                type="text"
                placeholder="e.g. name@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleMockUpiPay()}
                className="w-full border-2 border-teal-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-400 text-gray-900"
              />
              <Button
                onClick={handleMockUpiPay}
                disabled={paying}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-60"
              >
                {paying ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="small" /> Processing…
                  </span>
                ) : (
                  `Pay ${formatINR(invoice.totalAmount ?? invoice.total)}`
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Invoice card ─────────────────────────────────────────────────────────────

const InvoiceCard = ({ invoice, onPaymentSuccess }) => {
  const [expanded, setExpanded] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [localInvoice, setLocalInvoice] = useState(invoice);

  const handlePaySuccess = (updated) => {
    setLocalInvoice((prev) => ({
      ...prev,
      ...updated,
      status: "paid",
    }));
    setShowPayModal(false);
    if (onPaymentSuccess) onPaymentSuccess(updated);
  };

  const inv = localInvoice;

  return (
    <>
      {showPayModal && (
        <PaymentModal
          invoice={inv}
          onClose={() => setShowPayModal(false)}
          onSuccess={handlePaySuccess}
        />
      )}

      <div className="bg-white rounded-2xl border-2 border-teal-100 shadow-sm hover:shadow-md transition-all duration-200">
        {/* Card header */}
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-md">
                <MdReceiptLong className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  {inv.invoiceId || `INV-${inv._id?.slice(-8).toUpperCase()}`}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(inv.date || inv.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-xl font-bold text-gray-900">
                {formatINR(inv.total)}
              </p>
              <StatusBadge status={inv.status} />
              {inv.status === "pending" && (
                <Button
                  onClick={() => setShowPayModal(true)}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-sm px-4 py-2"
                >
                  Pay Now
                </Button>
              )}
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800 font-medium transition-colors"
              >
                {expanded ? (
                  <>
                    Hide <FiChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    View Details <FiChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-teal-100 p-5 bg-gray-50 rounded-b-2xl space-y-5">
            {/* Line items table */}
            {inv.lineItems && inv.lineItems.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Line Items
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-teal-50 text-teal-800">
                        <th className="text-left px-4 py-2 rounded-l-lg font-semibold">
                          Description
                        </th>
                        <th className="text-right px-4 py-2 rounded-r-lg font-semibold">
                          Amount (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.lineItems.map((item, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="px-4 py-2 text-gray-700">
                            {item.description}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900">
                            {formatINR(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="bg-white border border-teal-100 rounded-xl p-4 space-y-2 text-sm">
              {inv.subtotal !== undefined && (
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>{formatINR(inv.subtotal)}</span>
                </div>
              )}
              {inv.gst !== undefined && (
                <div className="flex justify-between text-gray-700">
                  <span>
                    GST ({inv.gstRate !== undefined ? `${inv.gstRate}%` : ""})
                  </span>
                  <span>{formatINR(inv.gst)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
                <span>Total</span>
                <span>{formatINR(inv.total)}</span>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {inv.gstin && (
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">GSTIN</p>
                  <p className="font-semibold text-gray-900">{inv.gstin}</p>
                </div>
              )}
              {inv.status === "paid" && inv.paymentMethod && (
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">Payment Method</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {inv.paymentMethod}
                  </p>
                </div>
              )}
              {inv.status === "paid" && inv.paymentReference && (
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">
                    Payment Reference
                  </p>
                  <p className="font-semibold text-gray-900">
                    {inv.paymentReference}
                  </p>
                </div>
              )}
              {inv.status === "paid" && inv.paidAt && (
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-gray-500 text-xs mb-1">Paid At</p>
                  <p className="font-semibold text-gray-900">
                    {formatDateTimeIST(inv.paidAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const PatientInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get("/patient/invoices");
        setInvoices(data?.data || data || []);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        toast.error("Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const handlePaymentSuccess = (updated) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv._id === updated._id ? { ...inv, ...updated, status: "paid" } : inv
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-500 font-medium">Loading invoices…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white bg-opacity-20 rounded-xl">
            <FiFileText className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Invoices</h1>
            <p className="text-teal-100 text-sm mt-1">
              View and manage all your medical invoices
            </p>
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-3 mt-5">
          {["paid", "pending", "failed", "refunded"].map((s) => {
            const count = invoices.filter((inv) => inv.status === s).length;
            if (count === 0) return null;
            return (
              <span
                key={s}
                className="bg-white bg-opacity-20 text-white text-xs font-semibold px-3 py-1 rounded-full capitalize"
              >
                {count} {s}
              </span>
            );
          })}
        </div>
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200">
          <div className="text-center py-16">
            <div className="p-5 bg-teal-100 rounded-full w-fit mx-auto mb-5">
              <FiFileText className="h-10 w-10 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No invoices yet
            </h3>
            <p className="text-gray-500 text-sm">
              Your billing history will appear here after consultations or
              purchases.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => (
            <InvoiceCard
              key={inv._id || inv.invoiceId}
              invoice={inv}
              onPaymentSuccess={handlePaymentSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientInvoices;

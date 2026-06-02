import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDateTime, fmtDate } from "../utils/dateFormat";
import toast from "react-hot-toast";
import Modal from "./Modal";
import PaymentTracking from "./PaymentTracking";
import PaymentHistory from "./PaymentHistory";
import Loader from "./Loader";

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
    notes: "",
  });

  useEffect(() => {
    loadPurchaseDetails();
  }, [id]);

  const loadPurchaseDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/purchases/${id}`);
      setPurchase(res.data.purchase);
      setPayments(res.data.payments);
    } catch (err) {
      toast.error("Failed to load purchase details");
      navigate("/purchases");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amountPaid || Number(paymentForm.amountPaid) <= 0) {
      return toast.error("Enter valid amount");
    }

    setRecordingPayment(true);
    try {
      await api.post(`/purchases/${id}/payments`, {
        ...paymentForm,
        amountPaid: Number(paymentForm.amountPaid),
      });
      toast.success("Payment recorded!");
      setShowPaymentModal(false);
      setPaymentForm({
        amountPaid: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "cash",
        notes: "",
      });
      loadPurchaseDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error recording payment");
    } finally {
      setRecordingPayment(false);
    }
  };

  if (loading) return <Loader />;
  if (!purchase) return <div className="text-center p-4">Purchase not found</div>;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "badge-rose";
      case "Partial":
        return "badge-amber";
      case "Paid":
        return "badge-emerald";
      default:
        return "badge-slate";
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📋 Purchase Order Details</div>
          <div className="page-subtitle">{purchase.purchaseNo}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
          💰 Record Payment
        </button>
      </div>

      {/* Bill Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ padding: 20, borderTop: "4px solid var(--indigo-2)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Purchase No</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--indigo-2)" }}>
            {purchase.purchaseNo}
          </div>
        </div>
        <div className="card" style={{ padding: 20, borderTop: "4px solid var(--emerald-2)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Supplier</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--slate)" }}>{purchase.supplierName}</div>
        </div>
        <div className="card" style={{ padding: 20, borderTop: "4px solid var(--blue-2)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Purchase Date</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--slate)" }}>{fmtDate(purchase.purchaseDate)}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Itemized Bill */}
        <div className="card" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ padding: 20, borderBottom: "2px solid var(--slate-2)", background: "linear-gradient(135deg, #f8f9fb 0%, #f0f2f7 100%)" }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--slate)" }}>📋 Itemized Bill</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fb", borderBottom: "2px solid var(--slate-3)" }}>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 700, color: "var(--slate)", fontSize: 12, letterSpacing: "0.3px" }}>Item Name</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 700, color: "var(--slate)", fontSize: 12, letterSpacing: "0.3px" }}>Qty</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 700, color: "var(--slate)", fontSize: 12, letterSpacing: "0.3px" }}>Unit Price</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 700, color: "var(--slate)", fontSize: 12, letterSpacing: "0.3px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--slate-2)", transition: "background 0.2s" }} onMouseEnter={(e) => e.target.parentElement.style.background = "#f8f9fb"} onMouseLeave={(e) => e.target.parentElement.style.background = "transparent"}>
                    <td style={{ padding: 12, color: "var(--slate)" }}>{item.name}</td>
                    <td style={{ padding: 12, textAlign: "right", color: "var(--slate)" }}>{item.qty}</td>
                    <td style={{ padding: 12, textAlign: "right", color: "var(--slate)" }}>{fmtRs(item.purchasePrice)}</td>
                    <td style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "var(--indigo-2)" }}>
                      {fmtRs(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill Calculations */}
          <div style={{ padding: 20, background: "linear-gradient(135deg, #f8f9fb 0%, #f0f2f7 100%)", borderTop: "2px solid var(--slate-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, color: "var(--slate-2)" }}>
              <span style={{ fontWeight: 500 }}>Subtotal</span>
              <span style={{ fontWeight: 600, color: "var(--slate)" }}>{fmtRs(purchase.subtotal || purchase.total)}</span>
            </div>
            {purchase.discountRate > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                <span style={{ fontWeight: 500, color: "var(--slate-2)" }}>Discount ({purchase.discountRate}%)</span>
                <span style={{ fontWeight: 600, color: "var(--emerald-2)" }}>
                  -{fmtRs(purchase.discount || 0)}
                </span>
              </div>
            )}
            {purchase.taxRate > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                <span style={{ fontWeight: 500, color: "var(--slate-2)" }}>Tax ({purchase.taxRate}%)</span>
                <span style={{ fontWeight: 600, color: "var(--rose-2)" }}>
                  +{fmtRs(purchase.tax || 0)}
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "2px solid var(--indigo-2)",
                paddingTop: 14,
                fontSize: 20,
                fontWeight: 700,
                color: "var(--indigo-2)",
              }}
            >
              <span>Grand Total</span>
              <span>{fmtRs(purchase.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Tracking Panel */}
        <div style={{ height: "fit-content", position: "sticky", top: 20 }}>
          <PaymentTracking purchase={purchase} />
        </div>
      </div>

      {/* Payment History */}
      <PaymentHistory payments={payments} onPaymentUpdated={loadPurchaseDetails} purchaseId={id} />

      {/* Additional Information */}
      <div className="card" style={{ marginTop: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ padding: 20, borderBottom: "2px solid var(--slate-2)", background: "linear-gradient(135deg, #f8f9fb 0%, #f0f2f7 100%)" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--slate)" }}>📌 Additional Information</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Total Items</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--indigo-2)" }}>{purchase.totalItems}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Total Quantity</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--emerald-2)" }}>{purchase.totalQuantity}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Payment Method</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--slate)", textTransform: "capitalize" }}>
              {purchase.paymentMethod?.charAt(0).toUpperCase() + purchase.paymentMethod?.slice(1)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Added By</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--slate)" }}>{purchase.addedBy?.name || "System"}</div>
          </div>
        </div>
        {purchase.notes && (
          <div style={{ padding: "0 20px 20px 20px", borderTop: "1px solid var(--slate-3)" }}>
            <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Notes</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--slate)", padding: 12, background: "#f8f9fb", borderRadius: 6, borderLeft: "3px solid var(--amber-2)" }}>
              {purchase.notes}
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="💰 Record Payment">
        <form onSubmit={handleRecordPayment}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Amount Paid *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0"
              value={paymentForm.amountPaid}
              onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
              required
            />
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input
                type="date"
                className="form-input"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online</option>
                <option value="credit">Credit</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              placeholder="Enter payment notes..."
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={recordingPayment}>
              {recordingPayment ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

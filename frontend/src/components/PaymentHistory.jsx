import React, { useState } from "react";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDate } from "../utils/dateFormat";
import toast from "react-hot-toast";
import api from "../api";
import Modal from "./Modal";

export default function PaymentHistory({ payments, onPaymentUpdated, purchaseId }) {
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editForm, setEditForm] = useState({
    amountPaid: "",
    paymentDate: "",
    paymentMethod: "cash",
    notes: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);

  const handleEditPayment = (payment) => {
    setEditingPaymentId(payment._id);
    setEditForm({
      amountPaid: payment.amountPaid,
      paymentDate: payment.paymentDate.split("T")[0],
      paymentMethod: payment.paymentMethod,
      notes: payment.notes,
    });
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.patch(`/purchases/payments/${editingPaymentId}`, editForm);
      toast.success("Payment updated!");
      setEditingPaymentId(null);
      onPaymentUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating payment");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;

    setIsDeletingId(paymentId);
    try {
      await api.delete(`/purchases/payments/${paymentId}`);
      toast.success("Payment deleted!");
      onPaymentUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting payment");
    } finally {
      setIsDeletingId(null);
    }
  };

  if (!payments || payments.length === 0) {
    return (
      <div className="card" style={{ marginTop: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ padding: 20, borderBottom: "2px solid var(--slate-2)", background: "linear-gradient(135deg, #f8f9fb 0%, #f0f2f7 100%)" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--slate)" }}>💳 Payment History</h3>
        </div>
        <div
          style={{
            padding: 48,
            textAlign: "center",
            color: "var(--slate-2)",
            fontSize: 14,
          }}
        >
          No payments recorded yet
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card" style={{ marginTop: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ padding: 20, borderBottom: "2px solid var(--slate-2)", background: "linear-gradient(135deg, #f8f9fb 0%, #f0f2f7 100%)" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--slate)" }}>💳 Payment History</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "2px solid var(--slate-3)" }}>
                <th style={{ padding: 14, textAlign: "left", fontWeight: 700, color: "var(--slate)", fontSize: 12, letterSpacing: "0.3px" }}>Date</th>
                <th style={{ padding: 14, textAlign: "right", fontWeight: 700, color: "var(--slate)", fontSize: 12, letterSpacing: "0.3px" }}>Amount Paid</th>
                <th style={{ padding: 14, textAlign: "left", fontWeight: 700, color: "var(--slate)", fontSize: 12, letterSpacing: "0.3px" }}>Method</th>
                <th style={{ padding: 14, textAlign: "left", fontWeight: 700, color: "var(--slate)", fontSize: 12, letterSpacing: "0.3px" }}>Notes</th>
                <th style={{ padding: 14, textAlign: "left", fontWeight: 700, color: "var(--slate)", fontSize: 12, letterSpacing: "0.3px" }}>By</th>
                <th style={{ padding: 14, textAlign: "center", fontWeight: 700, color: "var(--slate)", fontSize: 12, letterSpacing: "0.3px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id} style={{ borderBottom: "1px solid var(--slate-2)", transition: "background 0.2s" }} onMouseEnter={(e) => e.target.parentElement.style.background = "#f8f9fb"} onMouseLeave={(e) => e.target.parentElement.style.background = "transparent"}>
                  <td style={{ padding: 14, color: "var(--slate)" }}>{fmtDate(payment.paymentDate)}</td>
                  <td style={{ padding: 14, textAlign: "right", fontWeight: 700, color: "var(--emerald-2)" }}>
                    {fmtRs(payment.amountPaid)}
                  </td>
                  <td style={{ padding: 14 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "5px 10px",
                        background: "var(--indigo-2)",
                        color: "white",
                        borderRadius: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {payment.paymentMethod}
                    </span>
                  </td>
                  <td style={{ padding: 14, fontSize: 12, color: "var(--slate-2)" }}>
                    {payment.notes || "-"}
                  </td>
                  <td style={{ padding: 14, fontSize: 12, fontWeight: 500, color: "var(--slate)" }}>{payment.addedBy?.name || "System"}</td>
                  <td style={{ padding: 14, textAlign: "center" }}>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleEditPayment(payment)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleDeletePayment(payment._id)}
                      disabled={isDeletingId === payment._id}
                      title="Delete"
                      style={{ marginLeft: 4, color: "var(--rose)" }}
                    >
                      {isDeletingId === payment._id ? "⏳" : "🗑️"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={!!editingPaymentId}
        onClose={() => setEditingPaymentId(null)}
        title="✏️ Edit Payment"
      >
        <form onSubmit={handleUpdatePayment}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Amount Paid *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0"
              value={editForm.amountPaid}
              onChange={(e) => setEditForm({ ...editForm, amountPaid: e.target.value })}
              required
            />
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input
                type="date"
                className="form-input"
                value={editForm.paymentDate}
                onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={editForm.paymentMethod}
                onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
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
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setEditingPaymentId(null)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Payment"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

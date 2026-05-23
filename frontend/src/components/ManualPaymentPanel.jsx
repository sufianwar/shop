import React, { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { manualPaymentService } from "../services/manualPaymentService";
import { fmtRs } from "../utils/currencyFormat";
import { useAuth } from "../context/AuthContext";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online" },
  { value: "credit", label: "Credit" },
  { value: "other", label: "Other" },
];

function StatusBadge({ status }) {
  const colors = {
    Paid: { bg: "#dcfce7", color: "#166534" },
    Partial: { bg: "#fef3c7", color: "#92400e" },
    Pending: { bg: "#fee2e2", color: "#991b1b" },
  };
  const c = colors[status] || colors.Pending;
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: c.bg,
        color: c.color,
      }}
    >
      {status}
    </span>
  );
}

const emptyForm = {
  customerId: "",
  customerName: "",
  saleId: "",
  invoiceNo: "",
  totalBillAmount: "",
  receivedAmount: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: "cash",
  notes: "",
};

export default function ManualPaymentPanel({
  customers = [],
  selectedCustomerId = "",
  pendingSales = [],
  onCollectDue,
  onPaymentSaved,
}) {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [pendingInvoices, setPendingInvoices] = useState([]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedCustomerId ? { customerId: selectedCustomerId } : {};
      const { data } = await manualPaymentService.getAll(params);
      setPayments(data);
    } catch {
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    const handler = () => fetchPayments();
    window.addEventListener("manual-payments-refresh", handler);
    return () => window.removeEventListener("manual-payments-refresh", handler);
  }, [fetchPayments]);

  useEffect(() => {
    if (!form.customerId) {
      setPendingInvoices([]);
      return;
    }
    manualPaymentService
      .getPendingInvoices(form.customerId)
      .then(({ data }) => setPendingInvoices(data))
      .catch(() => setPendingInvoices([]));
  }, [form.customerId]);

  const previewRemaining = useMemo(() => {
    const total = Number(form.totalBillAmount) || 0;
    const received = Number(form.receivedAmount) || 0;
    if (!total) return 0;
    if (editing) {
      const otherPaid =
        total - (Number(editing.remainingBalance) || 0) - (Number(editing.receivedAmount) || 0);
      return Math.max(0, total - otherPaid - received);
    }
    if (form.saleId && form._dueBefore !== undefined && form._dueBefore !== "") {
      return Math.max(0, Number(form._dueBefore) - received);
    }
    return Math.max(0, total - received);
  }, [form, editing]);

  const openCreate = () => {
    const customer = customers.find((c) => c._id === selectedCustomerId);
    setEditing(null);
    setForm({
      ...emptyForm,
      customerId: selectedCustomerId || "",
      customerName: customer?.name || "",
    });
    setShowModal(true);
  };

  const openEdit = (payment) => {
    setEditing(payment);
    setForm({
      customerId: payment.customer,
      customerName: payment.customerName,
      saleId: payment.sale || "",
      invoiceNo: payment.invoiceNo || "",
      totalBillAmount: String(payment.totalBillAmount),
      receivedAmount: String(payment.receivedAmount),
      paymentDate: payment.paymentDate
        ? new Date(payment.paymentDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      paymentMethod: payment.paymentMethod || "cash",
      notes: payment.notes || "",
    });
    setShowModal(true);
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find((c) => c._id === customerId);
    setForm((f) => ({
      ...f,
      customerId,
      customerName: customer?.name || "",
      saleId: "",
      invoiceNo: "",
      totalBillAmount: "",
      _dueBefore: 0,
    }));
  };

  const handleInvoiceLookup = async (invoiceNo) => {
    if (!form.customerId || !invoiceNo?.trim()) return;
    try {
      const { data } = await manualPaymentService.lookupInvoice(form.customerId, invoiceNo.trim());
      if (!data.found) {
        toast.error("Invoice not found for this customer");
        return;
      }
      setForm((f) => ({
        ...f,
        saleId: data.sale._id,
        invoiceNo: data.sale.invoiceNo,
        totalBillAmount: String(data.sale.totalBillAmount),
        customerName: data.sale.customerName || f.customerName,
        _dueBefore: data.sale.dueAmount,
      }));
    } catch {
      toast.error("Could not load invoice");
    }
  };

  const selectPendingInvoice = (inv) => {
    setForm((f) => ({
      ...f,
      saleId: inv._id,
      invoiceNo: inv.invoiceNo,
      totalBillAmount: String(inv.totalBillAmount),
      customerName: inv.customerName || f.customerName,
      _dueBefore: inv.dueAmount,
      receivedAmount: String(inv.dueAmount),
    }));
  };

  const handleSubmit = async () => {
    if (!form.customerId) return toast.error("Select a customer");
    if (!form.receivedAmount || Number(form.receivedAmount) <= 0) {
      return toast.error("Enter a valid received amount");
    }
    if (!form.totalBillAmount || Number(form.totalBillAmount) <= 0) {
      return toast.error("Enter total bill amount or select an invoice");
    }

    const payload = {
      customerId: form.customerId,
      saleId: form.saleId || undefined,
      invoiceNo: form.invoiceNo,
      totalBillAmount: Number(form.totalBillAmount),
      receivedAmount: Number(form.receivedAmount),
      paymentDate: form.paymentDate,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
    };

    try {
      if (editing) {
        await manualPaymentService.update(editing._id, payload);
        toast.success("Payment updated");
      } else {
        await manualPaymentService.create(payload);
        toast.success("Payment recorded");
      }
      setShowModal(false);
      fetchPayments();
      onPaymentSaved?.();
      window.dispatchEvent(new CustomEvent("manual-payments-refresh"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save payment");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payment entry? Customer balance will be adjusted.")) return;
    try {
      await manualPaymentService.remove(id);
      toast.success("Payment deleted");
      fetchPayments();
      onPaymentSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleMarkPaid = async (saleId, customerId) => {
    try {
      await manualPaymentService.markInvoicePaid({
        saleId,
        customerId: customerId || selectedCustomerId,
        paymentMethod: "cash",
        paymentDate: new Date().toISOString().slice(0, 10),
      });
      toast.success("Invoice marked as paid");
      fetchPayments();
      onPaymentSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as paid");
    }
  };

  return (
    <div
      className="mb-4 ledger-manual-payments"
      style={{
        borderTop: "2px solid var(--border)",
        paddingTop: 20,
        position: "relative",
        zIndex: 1,
      }}
    >
      {!selectedCustomerId && (
        <div
          className="mb-3"
          style={{
            padding: 12,
            background: "var(--indigo-3)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
          }}
        >
          Select a <strong>customer</strong> above to view pending dues and record manual payments.
        </div>
      )}

      {selectedCustomerId && (
        <div
          className="mb-4"
          style={{
            padding: 16,
            background: "var(--warning-bg)",
            border: "2px solid var(--amber)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text)",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "var(--text)" }}>
            ⚠️ Pending Dues Collection
          </h4>
          {pendingSales.length === 0 ? (
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              No pending invoice dues for this customer.
            </p>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {pendingSales.map((s) => (
                <div
                  key={s._id}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--amber)",
                    padding: "10px 14px",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 13 }}>Inv: {s.invoiceNo}</div>
                    <div style={{ fontSize: 12, color: "var(--danger)" }}>
                      Due: {fmtRs(s.due_amount)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => onCollectDue?.(s)}
                  >
                    Collect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="header mb-3" style={{ alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0 }}>💳 Manual Payments</h3>
          <p className="text-muted text-sm" style={{ margin: 0 }}>
            Record partial or full payments and track invoice status
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Manual Payment
        </button>
      </div>

      <div
        className="table-container"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Invoice</th>
              <th>Total Bill</th>
              <th>Received</th>
              <th>Remaining</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", color: "var(--muted)" }}>
                  Loading...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", color: "var(--muted)" }}>
                  No manual payments found
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p._id}>
                  <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{p.customerName}</td>
                  <td>{p.invoiceNo || "—"}</td>
                  <td>{fmtRs(p.totalBillAmount)}</td>
                  <td style={{ color: "var(--success)", fontWeight: 600 }}>{fmtRs(p.receivedAmount)}</td>
                  <td style={{ fontWeight: 600 }}>{fmtRs(p.remainingBalance)}</td>
                  <td style={{ textTransform: "capitalize" }}>{p.paymentMethod}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {p.sale && p.status !== "Paid" && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() =>
                            handleMarkPaid(p.sale?._id || p.sale, p.customer?._id || p.customer)
                          }
                        >
                          Mark Paid
                        </button>
                      )}
                      {canManage && (
                        <>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}>
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(p._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "✏️ Edit Manual Payment" : "💳 Record Manual Payment"}
        size="lg"
      >
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Customer Name *</label>
            <select
              className="form-select"
              value={form.customerId}
              disabled={!!editing}
              onChange={(e) => handleCustomerChange(e.target.value)}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Invoice / Receipt No</label>
            <input
              className="form-input"
              value={form.invoiceNo}
              disabled={!!editing}
              onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
              onBlur={(e) => handleInvoiceLookup(e.target.value)}
              placeholder="Enter invoice and tab out to load"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Total Bill Amount *</label>
            <input
              type="number"
              className="form-input"
              value={form.totalBillAmount}
              onChange={(e) => setForm({ ...form, totalBillAmount: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Received Amount *</label>
            <input
              type="number"
              className="form-input"
              value={form.receivedAmount}
              onChange={(e) => setForm({ ...form, receivedAmount: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Remaining Balance (auto)</label>
            <input
              className="form-input"
              value={fmtRs(previewRemaining)}
              readOnly
              style={{ background: "var(--bg)", fontWeight: 700 }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Date *</label>
            <input
              type="date"
              className="form-input"
              value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <select
              className="form-select"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Notes</label>
            <input
              className="form-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional note"
            />
          </div>
        </div>

        {!editing && pendingInvoices.length > 0 && (
          <div
            className="mt-3"
            style={{
              padding: 12,
              background: "var(--bg)",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <div className="form-label" style={{ marginBottom: 8 }}>
              Pending invoices (click to fill)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {pendingInvoices.map((inv) => (
                <button
                  key={inv._id}
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{ border: "1px solid var(--border)" }}
                  onClick={() => selectPendingInvoice(inv)}
                >
                  {inv.invoiceNo} — Due {fmtRs(inv.dueAmount)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2" style={{ justifyContent: "flex-end", marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editing ? "Update Payment" : "Save Payment"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

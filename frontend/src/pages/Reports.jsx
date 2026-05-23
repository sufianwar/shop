
import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import Receipt from "../components/Receipt";
import { salesService } from "../services/salesService";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDateTime } from "../utils/dateFormat";
import { exportSalesExcel } from "../utils/exportExcel";
import { exportSalesPDF } from "../utils/exportPDF";
import toast from "react-hot-toast";

export default function Reports() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", invoiceNo: "" });
  const [viewSale, setViewSale] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingSale, setPayingSale] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, sumRes] = await Promise.all([
        salesService.getAll({ ...filters, limit: 1000 }),
        salesService.getSummary(),
      ]);
      setSales(sRes.data);
      setSummary(sumRes.data);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    const reason = window.prompt("Are you sure you want to delete this receipt? Please provide a reason:");
    if (reason === null) return;
    if (!reason.trim()) return toast.error("Reason is required to delete a receipt");

    try {
      await salesService.delete(id, reason);
      toast.success("Receipt deleted successfully");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete receipt");
    }
  };

  const openPayModal = (sale) => {
    setPayingSale(sale);
    setPayAmount(sale.due_amount || (sale.total_amount - (sale.paid_amount || 0)));
    setShowPayModal(true);
  };

  const handlePayDue = async () => {
    if (!payingSale || !payAmount) return;
    try {
      await salesService.payDue(payingSale._id, Number(payAmount));
      toast.success("Payment recorded successfully!");
      setShowPayModal(false);
      setPayingSale(null);
      setPayAmount("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process payment");
    }
  };

  useEffect(() => { load(); }, [filters]);

  const totalRev = sales.reduce((s, x) => s + x.total, 0);
  const totalProfit = sales.reduce((s, x) => s + (x.profit || 0), 0);

  const columns = [
    { key: "invoiceNo", label: "Invoice", render: v => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--indigo-2)" }}>{v}</span> },
    { key: "customerName", label: "Customer" },
    { key: "items", label: "Items", render: v => `${v?.length || 0}` },
    { key: "total", label: "Total", render: v => <span style={{ fontWeight: 700, color: "var(--emerald)" }}>{fmtRs(v)}</span> },
    { key: "paid_amount", label: "Paid", render: v => fmtRs(v) },
    { key: "due_amount", label: "Due", render: v => fmtRs(v) },
    { key: "profit", label: "Profit", render: v => <span style={{ color: "var(--amber)" }}>{fmtRs(v)}</span> },
    { key: "paymentMethod", label: "Method", render: v => <span className="badge badge-muted" style={{ textTransform: "capitalize" }}>{v}</span> },
    { key: "cashierName", label: "Cashier" },
    { key: "createdAt", label: "Date", render: v => <span style={{ fontSize: 12 }}>{fmtDateTime(v)}</span> },
    { key: "payment_status", label: "Status", render: v => <span className={`badge ${v === "Paid" ? "badge-emerald" : v === "Partial" ? "badge-warning" : "badge-rose"}`}>{v}</span> },
    { key: "_id", label: "Actions", render: (_, r) => (
      <div style={{ display: "flex", gap: 5 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setViewSale(r)}>🧾</button>
        {(r.payment_status === "Pending" || r.payment_status === "Partial") && (
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--emerald)" }} title="Collect Payment" onClick={() => openPayModal(r)}>💰</button>
        )}
        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(r._id)}>🗑️</button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">📋 Sales Report</div><div className="page-subtitle">{sales.length} transactions</div></div>
        <div className="page-actions">
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search Invoice..." 
            style={{ width: 180 }}
            value={filters.invoiceNo} 
            onChange={e => setFilters(p => ({ ...p, invoiceNo: e.target.value }))} 
          />
          <input type="date" className="form-input" style={{ width: 160 }} value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
          <input type="date" className="form-input" style={{ width: 160 }} value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
          <button className="btn btn-ghost btn-sm" onClick={() => exportSalesExcel(sales)}>📊 Excel</button>
          <button className="btn btn-ghost btn-sm" onClick={() => exportSalesPDF(sales)}>📄 PDF</button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: "Filtered Revenue", value: fmtRs(totalRev), color: "var(--indigo)" },
          { label: "Filtered Profit", value: fmtRs(totalProfit), color: "var(--emerald)" },
          { label: "All-Time Revenue", value: fmtRs(summary?.total?.revenue), color: "var(--amber)" },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <Loader /> : <Table columns={columns} data={sales} emptyText="No sales found" />}
      </div>

      <Modal isOpen={!!viewSale} onClose={() => setViewSale(null)} title="🧾 Receipt" size="sm">
        {viewSale && <Receipt sale={viewSale} onClose={() => setViewSale(null)} />}
      </Modal>

      {/* Collect Due Payment Modal */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="💰 Collect Payment" size="sm">
        {payingSale && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--bg-2)", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "var(--muted)" }}>
                <span>Invoice</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--indigo-2)" }}>{payingSale.invoiceNo}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "var(--muted)" }}>
                <span>Customer</span>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>{payingSale.customerName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>Total</span>
                <span style={{ fontWeight: 700 }}>{fmtRs(payingSale.total)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>Already Paid</span>
                <span style={{ fontWeight: 600, color: "var(--emerald)" }}>{fmtRs(payingSale.paid_amount || 0)}</span>
              </div>
              <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "var(--rose)" }}>
                <span>Due</span>
                <span>{fmtRs(payingSale.due_amount)}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Amount (Rs)</label>
              <input type="number" className="form-input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Enter amount" style={{ fontSize: 16, fontWeight: 600 }} />
            </div>
            <div className="modal-footer" style={{ margin: 0 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handlePayDue} disabled={!payAmount || Number(payAmount) <= 0}>✅ Confirm Payment</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

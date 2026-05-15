
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
  const [filters, setFilters] = useState({ startDate: "", endDate: "" });
  const [viewSale, setViewSale] = useState(null);
  const [summary, setSummary] = useState(null);

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

  useEffect(() => { load(); }, [filters]);

  const totalRev = sales.reduce((s, x) => s + x.total, 0);
  const totalProfit = sales.reduce((s, x) => s + (x.profit || 0), 0);

  const columns = [
    { key: "invoiceNo", label: "Invoice", render: v => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--indigo-2)" }}>{v}</span> },
    { key: "customerName", label: "Customer" },
    { key: "items", label: "Items", render: v => `${v?.length || 0}` },
    { key: "total", label: "Total", render: v => <span style={{ fontWeight: 700, color: "var(--emerald)" }}>{fmtRs(v)}</span> },
    { key: "profit", label: "Profit", render: v => <span style={{ color: "var(--amber)" }}>{fmtRs(v)}</span> },
    { key: "paymentMethod", label: "Method", render: v => <span className="badge badge-muted" style={{ textTransform: "capitalize" }}>{v}</span> },
    { key: "cashierName", label: "Cashier" },
    { key: "createdAt", label: "Date", render: v => <span style={{ fontSize: 12 }}>{fmtDateTime(v)}</span> },
    { key: "status", label: "Status", render: v => <span className={`badge ${v === "completed" ? "badge-emerald" : "badge-rose"}`}>{v}</span> },
    { key: "_id", label: "View", render: (_, r) => <button className="btn btn-ghost btn-sm" onClick={() => setViewSale(r)}>🧾</button> },
  ];

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">📋 Sales Report</div><div className="page-subtitle">{sales.length} transactions</div></div>
        <div className="page-actions">
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
    </div>
  );
}

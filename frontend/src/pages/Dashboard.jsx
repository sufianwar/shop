
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyticsService } from "../services/analyticsService";
import { fmtRs, fmtNum } from "../utils/currencyFormat";
import { fmtDateTime } from "../utils/dateFormat";
import { SalesAreaChart } from "../components/Charts";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import { salesService } from "../services/salesService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../styles/dashboard.css";

const StatCardModern = ({ icon, label, value, trend, color }) => (
  <div className={`stat-card-modern ${color}`}>
    <div className="stat-header">
      <div className={`stat-icon-modern ${color}`}>{icon}</div>
      {trend && (
        <span className={`stat-trend ${trend.up ? "up" : "neutral"}`}>
          {trend.up ? "▲" : "—"} {trend.text}
        </span>
      )}
    </div>
    <div className="stat-value-modern">{value}</div>
    <div className="stat-label-modern">{label}</div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingSale, setPayingSale] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [txFilter, setTxFilter] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCashier = user?.role === "cashier";

  const load = () => {
    setLoading(true);
    analyticsService.getDashboard().then((dashRes) => {
      setStats(dashRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

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

  if (loading) return <Loader text="Loading dashboard..." />;

  const s = stats || {};
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  const pendingSales = s.recentSales?.filter(
    (sale) => sale.payment_status === "Pending" || sale.payment_status === "Partial"
  ) || [];

  const filteredRecentSales = (s.recentSales || []).filter((sale) => {
    if (!txFilter) return true;
    const term = txFilter.toLowerCase();
    return (
      sale.invoiceNo?.toLowerCase().includes(term) ||
      sale.customerName?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {/* Welcome Banner */}
      <div className="dashboard-welcome">
        <h2>{greeting}, {user?.name || "Admin"} 👋</h2>
        <p>Here's what's happening with your business today.</p>
      </div>

      {/* Stat Cards — Clean 4-column layout */}
      {!isCashier && (
        <div className="dashboard-grid">
          <StatCardModern
            icon="💰"
            label="Today's Revenue"
            value={fmtRs(s.today?.revenue)}
            trend={{ up: s.today?.count > 0, text: `${s.today?.count || 0} orders` }}
            color="indigo"
          />
          <StatCardModern
            icon="📈"
            label="Monthly Revenue"
            value={fmtRs(s.month?.revenue)}
            trend={{ up: s.month?.count > 0, text: `${s.month?.count || 0} orders` }}
            color="emerald"
          />
          <StatCardModern
            icon="💵"
            label="Monthly Profit"
            value={fmtRs(s.month?.profit)}
            trend={{ up: s.month?.profit > 0, text: `Exp: ${fmtRs(s.monthExpenses)}` }}
            color="amber"
          />
          <StatCardModern
            icon="📦"
            label="Active Products"
            value={fmtNum(s.totalProducts)}
            trend={s.lowStockProducts > 0 ? { up: false, text: `${s.lowStockProducts} low stock` } : undefined}
            color="cyan"
          />
        </div>
      )}

      {/* Pending Dues Banner */}
      {!isCashier && pendingSales.length > 0 && (
        <div className="pending-dues-banner">
          <div className="pending-dues-icon">⏳</div>
          <div className="pending-dues-info">
            <h4>{pendingSales.length} Pending Payment{pendingSales.length > 1 ? "s" : ""}</h4>
            <p>You have unpaid invoices that need attention. Use the "Collect" button below to mark them as paid.</p>
          </div>
        </div>
      )}

      {/* Main Panels: Chart + Top Products */}
      {!isCashier && (
        <div className="dashboard-panels">
          {/* Weekly Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">📊 Weekly Sales Trend</div>
                <div className="chart-subtitle">Revenue over the past 7 days</div>
              </div>
            </div>
            {s.weekChart?.length > 0 ? (
              <SalesAreaChart data={s.weekChart.map(d => ({ ...d, _id: d._id }))} />
            ) : (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: 50, fontSize: 13 }}>
                📭 No sales data for this week yet
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">🏆 Top Products</div>
                <div className="chart-subtitle">Best sellers this month</div>
              </div>
            </div>
            {s.topProducts?.length > 0 ? (
              <div>
                {s.topProducts.map((p, i) => (
                  <div key={i} className="top-product-item">
                    <div className={`top-product-rank ${i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "rank-default"}`}>
                      {i + 1}
                    </div>
                    <div className="top-product-info">
                      <div className="top-product-name">{p._id}</div>
                      <div className="top-product-bar-container">
                        <div
                          className="top-product-bar"
                          style={{ width: `${Math.min(100, (p.totalRev / (s.topProducts[0]?.totalRev || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="top-product-revenue">{fmtRs(p.totalRev)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: 50, fontSize: 13 }}>
                📭 No product data yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="recent-tx-card">
        <div className="recent-tx-header">
          <div className="recent-tx-title">
            🧾 Recent Transactions
            <span className="recent-tx-count">{s.recentSales?.length || 0}</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                style={{ padding: "6px 14px 6px 32px", fontSize: 13 }}
              />
            </div>
            {!isCashier && (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("/reports")}>
                View All →
              </button>
            )}
          </div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date & Time</th>
                <th>Method</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!filteredRecentSales?.length ? (
                <tr><td colSpan={7} className="table-empty">📭 No transactions found</td></tr>
              ) : filteredRecentSales.map((sale) => (
                <tr key={sale._id} className="recent-sales-row">
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--indigo-2)", fontWeight: 600 }}>
                      {sale.invoiceNo}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{sale.customerName}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDateTime(sale.createdAt)}</td>
                  <td>
                    <span className="badge badge-muted" style={{ textTransform: "capitalize" }}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--emerald)" }}>{fmtRs(sale.total)}</td>
                  <td>
                    <span className={`badge ${sale.payment_status === "Paid" ? "badge-emerald" : sale.payment_status === "Partial" ? "badge-amber" : "badge-rose"}`}>
                      {sale.payment_status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {(sale.payment_status === "Pending" || sale.payment_status === "Partial") && (
                        <button
                          className="quick-action-btn pay"
                          title="Collect Payment"
                          onClick={() => openPayModal(sale)}
                        >
                          💰 Collect
                        </button>
                      )}
                      <button
                        className="quick-action-btn delete"
                        title="Delete Receipt"
                        onClick={() => handleDelete(sale._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Due Modal */}
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
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "var(--muted)" }}>
                <span>Total Amount</span>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>{fmtRs(payingSale.total_amount || payingSale.total)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "var(--muted)" }}>
                <span>Already Paid</span>
                <span style={{ fontWeight: 600, color: "var(--emerald)" }}>{fmtRs(payingSale.paid_amount || 0)}</span>
              </div>
              <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "var(--rose)" }}>
                <span>Due Amount</span>
                <span>{fmtRs(payingSale.due_amount || (payingSale.total_amount - (payingSale.paid_amount || 0)))}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Amount (Rs)</label>
              <input
                type="number"
                className="form-input"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Enter amount"
                style={{ fontSize: 16, fontWeight: 600 }}
              />
            </div>
            <div className="modal-footer" style={{ margin: 0 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handlePayDue} disabled={!payAmount || Number(payAmount) <= 0}>
                ✅ Confirm Payment
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

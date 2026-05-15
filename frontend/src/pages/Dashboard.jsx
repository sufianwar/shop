
import React, { useEffect, useState } from "react";
import { analyticsService } from "../services/analyticsService";
import { fmtRs, fmtNum } from "../utils/currencyFormat";
import { fmtDateTime } from "../utils/dateFormat";
import { SalesAreaChart } from "../components/Charts";
import LowStockAlert from "../components/LowStockAlert";
import Loader from "../components/Loader";
import "../styles/dashboard.css";

const StatCard = ({ icon, label, value, sub, color, badge }) => (
  <div className={`stat-card ${color}`}>
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
    {badge && <div className={`stat-badge ${badge.up ? "up" : "down"}`}>{badge.up ? "▲" : "▼"} {badge.text}</div>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDashboard().then(({ data }) => {
      setStats(data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;

  const s = stats || {};

  return (
    <div>
      {/* Low Stock Alert */}
      {s.lowStockProducts > 0 && (
        <div style={{ marginBottom: 20 }}>
          <LowStockAlert products={Array(s.lowStockProducts).fill({ name: `${s.lowStockProducts} products` })} />
        </div>
      )}

      {/* Stat Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="💰" label="Today's Revenue" value={fmtRs(s.today?.revenue)} sub={`${s.today?.count || 0} orders today`} color="indigo" />
        <StatCard icon="📈" label="Month Revenue" value={fmtRs(s.month?.revenue)} sub={`${s.month?.count || 0} orders this month`} color="emerald" />
        <StatCard icon="💵" label="Month Profit" value={fmtRs(s.month?.profit)} sub={`Expenses: ${fmtRs(s.monthExpenses)}`} color="amber" />
        <StatCard icon="📦" label="Products" value={fmtNum(s.totalProducts)} sub={`${s.lowStockProducts || 0} low stock`} color="cyan" />
        <StatCard icon="👥" label="Customers" value={fmtNum(s.totalCustomers)} color="rose" />
        <StatCard icon="🏷️" label="Today's Profit" value={fmtRs(s.today?.profit)} color="indigo" />
        <StatCard icon="📊" label="Avg Order" value={s.today?.count ? fmtRs(s.today.revenue / s.today.count) : fmtRs(0)} color="emerald" />
        <StatCard icon="🔥" label="Top Sales" value={s.topProducts?.[0]?._id || "—"} sub={s.topProducts?.[0] ? fmtRs(s.topProducts[0].totalRev) : ""} color="amber" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Weekly Chart */}
        <div className="chart-card">
          <div className="chart-title">📊 Weekly Sales Chart</div>
          {s.weekChart?.length > 0 ? (
            <SalesAreaChart data={s.weekChart.map(d => ({ ...d, _id: d._id }))} />
          ) : (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: 40, fontSize: 13 }}>No sales data yet</div>
          )}
        </div>

        {/* Top Products */}
        <div className="chart-card">
          <div className="chart-title">🏆 Top Products (This Month)</div>
          {s.topProducts?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {s.topProducts.map((p, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "var(--text)" }}>{i + 1}. {p._id}</span>
                    <span style={{ fontWeight: 700, color: "var(--emerald)" }}>{fmtRs(p.totalRev)}</span>
                  </div>
                  <div className="top-product-bar" style={{ width: `${Math.min(100, (p.totalRev / (s.topProducts[0]?.totalRev || 1)) * 100)}%` }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: 40, fontSize: 13 }}>No product data yet</div>
          )}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>🧾 Recent Transactions</div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th><th>Customer</th><th>Date & Time</th><th>Method</th><th>Total</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!s.recentSales?.length ? (
                <tr><td colSpan={6} className="table-empty">📭 No transactions yet</td></tr>
              ) : s.recentSales.map((sale) => (
                <tr key={sale._id} className="recent-sales-row">
                  <td><span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--indigo-2)" }}>{sale.invoiceNo}</span></td>
                  <td>{sale.customerName}</td>
                  <td style={{ fontSize: 12 }}>{fmtDateTime(sale.createdAt)}</td>
                  <td><span className="badge badge-muted" style={{ textTransform: "capitalize" }}>{sale.paymentMethod}</span></td>
                  <td style={{ fontWeight: 700, color: "var(--emerald)" }}>{fmtRs(sale.total)}</td>
                  <td><span className={`badge ${sale.status === "completed" ? "badge-emerald" : "badge-rose"}`}>{sale.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

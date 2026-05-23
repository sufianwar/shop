
import React, { useState, useEffect } from "react";
import { SalesBarChart, SalesAreaChart, PaymentPieChart } from "../components/Charts";
import { analyticsService } from "../services/analyticsService";
import { fmtRs } from "../utils/currencyFormat";
import Loader from "../components/Loader";
import toast from "react-hot-toast";

const PERIODS = [{ label: "7 Days", value: "7" }, { label: "30 Days", value: "30" }, { label: "90 Days", value: "90" }];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Set default to last 30 days
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);
  
  const [dates, setDates] = useState({
    startDate: defaultStart.toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    setLoading(true);
    analyticsService.getSales(dates).then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, [dates]);

  if (loading) return <Loader text="Crunching numbers..." />;

  const exportCSV = () => {
    if (!data?.dailySales?.length) return toast.error("No data to export");
    const headers = ["Date", "Orders", "Revenue", "Profit"];
    const rows = data.dailySales.map(d => [d._id, d.orders, d.revenue, d.profit]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Analytics_${dates.startDate}_to_${dates.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalRevenue = data?.dailySales?.reduce((sum, d) => sum + d.revenue, 0) || 0;
  const totalProfit = data?.dailySales?.reduce((sum, d) => sum + d.profit, 0) || 0;
  const totalExpenses = data?.totalExpenses || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📈 Analytics</div>
          <div className="page-subtitle">Sales performance overview</div>
        </div>
        <div className="page-actions" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* Calendar Picker */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--bg-2)", border: "1px solid var(--border)",
            padding: "6px 16px", borderRadius: 24, boxShadow: "var(--shadow-sm)",
            transition: "var(--transition)"
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "var(--indigo-3)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <span style={{ fontSize: 14 }}>📅</span>
            <input 
              type="date" 
              value={dates.startDate} 
              onChange={(e) => setDates(p => ({ ...p, startDate: e.target.value }))}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "var(--text)", fontWeight: 600, width: 115, padding: 0 }}
            />
            <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, margin: "0 4px" }}>→</span>
            <input 
              type="date" 
              value={dates.endDate} 
              onChange={(e) => setDates(p => ({ ...p, endDate: e.target.value }))}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "var(--text)", fontWeight: 600, width: 115, padding: 0 }}
            />
          </div>
          
          {/* Export Button */}
          <button className="btn btn-outline" onClick={exportCSV} style={{ borderRadius: 24, padding: "6px 16px", fontSize: 13, fontWeight: 600 }}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Professional Summary Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card-modern indigo">
          <div className="stat-header">
            <div className="stat-icon-modern indigo">💰</div>
          </div>
          <div className="stat-value-modern">{fmtRs(totalRevenue)}</div>
          <div className="stat-label-modern">Total Revenue</div>
        </div>
        <div className="stat-card-modern emerald">
          <div className="stat-header">
            <div className="stat-icon-modern emerald">💵</div>
          </div>
          <div className="stat-value-modern">{fmtRs(totalProfit)}</div>
          <div className="stat-label-modern">Total Profit (Gross)</div>
        </div>
        <div className="stat-card-modern rose">
          <div className="stat-header">
            <div className="stat-icon-modern rose">💸</div>
          </div>
          <div className="stat-value-modern">{fmtRs(totalExpenses)}</div>
          <div className="stat-label-modern">Total Expenses</div>
        </div>
      </div>

      <div className="dashboard-panels">
        {/* Daily Revenue Chart */}
        <div className="chart-card" style={{ flex: 2 }}>
          <div className="chart-header">
            <div>
              <div className="chart-title">📊 Daily Revenue & Profit</div>
              <div className="chart-subtitle">Performance over selected period</div>
            </div>
          </div>
          <SalesBarChart data={data?.dailySales || []} />
        </div>

        {/* Payment Methods Pie Chart */}
        <div className="chart-card" style={{ flex: 1 }}>
          <div className="chart-header">
            <div>
              <div className="chart-title">💳 Payment Methods</div>
              <div className="chart-subtitle">Distribution by volume</div>
            </div>
          </div>
          {data?.paymentMethods?.length ? (
            <PaymentPieChart data={data.paymentMethods} />
          ) : <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>No data</div>}
        </div>
      </div>
    </div>
  );
}

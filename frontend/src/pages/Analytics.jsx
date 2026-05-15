
import React, { useState, useEffect } from "react";
import { SalesBarChart, SalesAreaChart, PaymentPieChart } from "../components/Charts";
import { analyticsService } from "../services/analyticsService";
import { fmtRs } from "../utils/currencyFormat";
import Loader from "../components/Loader";

const PERIODS = [{ label: "7 Days", value: "7" }, { label: "30 Days", value: "30" }, { label: "90 Days", value: "90" }];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsService.getSales({ period }).then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <Loader text="Crunching numbers..." />;

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">📈 Analytics</div><div className="page-subtitle">Sales performance overview</div></div>
        <div className="page-actions">
          {PERIODS.map(p => (
            <button key={p.value} className={`btn btn-sm ${period === p.value ? "btn-primary" : "btn-ghost"}`} onClick={() => setPeriod(p.value)}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>📊 Daily Revenue & Profit</div>
          <SalesBarChart data={data?.dailySales || []} />
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>📉 Revenue Trend</div>
          <SalesAreaChart data={data?.dailySales || []} />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>💳 Payment Methods</div>
          {data?.paymentMethods?.length ? (
            <PaymentPieChart data={data.paymentMethods} />
          ) : <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>No data</div>}
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>🏆 Top Products</div>
          {data?.topProducts?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.topProducts.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{i + 1}. {p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{p.totalQty} units sold</div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--emerald)", fontSize: 14 }}>{fmtRs(p.totalRevenue)}</div>
                </div>
              ))}
            </div>
          ) : <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>No data</div>}
        </div>
      </div>
    </div>
  );
}

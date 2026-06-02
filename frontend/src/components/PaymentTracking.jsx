import React from "react";
import { fmtRs } from "../utils/currencyFormat";

export default function PaymentTracking({ purchase }) {
  if (!purchase) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "var(--rose)";
      case "Partial":
        return "var(--amber)";
      case "Paid":
        return "var(--emerald)";
      default:
        return "var(--slate)";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "Pending":
        return "var(--rose-3)";
      case "Partial":
        return "var(--amber-3)";
      case "Paid":
        return "var(--emerald-3)";
      default:
        return "var(--slate-3)";
    }
  };

  const paymentPercentage = purchase.total > 0 ? (purchase.paidAmount / purchase.total) * 100 : 0;

  return (
    <div className="card" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <div style={{ padding: 20, borderBottom: "2px solid var(--slate-2)", background: "linear-gradient(135deg, #f8f9fb 0%, #f0f2f7 100%)" }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--slate)" }}>💳 Payment Summary</h3>
      </div>

      <div style={{ padding: 20 }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: "var(--slate)" }}>Payment Progress</span>
            <span style={{ fontWeight: 700, color: "var(--indigo-2)" }}>{Math.round(paymentPercentage)}%</span>
          </div>
          <div
            style={{
              width: "100%",
              height: 10,
              background: "var(--slate-2)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${paymentPercentage}%`,
                background: paymentPercentage >= 100 ? "var(--emerald-2)" : 
                           paymentPercentage > 0 ? "var(--amber-2)" : 
                           "var(--rose-2)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Bill Amount */}
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--slate-3)" }}>
          <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Total Bill Amount</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--indigo-2)" }}>
            {fmtRs(purchase.total)}
          </div>
        </div>

        {/* Paid Amount */}
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--slate-3)" }}>
          <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Amount Paid</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--emerald-2)" }}>
            {fmtRs(purchase.paidAmount)}
          </div>
        </div>

        {/* Due Amount */}
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--slate-3)" }}>
          <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Remaining Due</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: purchase.dueAmount > 0 ? "var(--rose-2)" : "var(--emerald-2)" }}>
            {fmtRs(purchase.dueAmount)}
          </div>
        </div>

        {/* Payment Status */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--slate-2)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Payment Status</div>
          <div
            style={{
              display: "inline-block",
              padding: "10px 18px",
              background: getStatusBgColor(purchase.paymentStatus),
              color: getStatusColor(purchase.paymentStatus),
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {purchase.paymentStatus}
          </div>
        </div>

        {/* Summary Box */}
        <div
          style={{
            marginTop: 20,
            padding: 14,
            background: "linear-gradient(135deg, #f8f9fb 0%, #f0f2f7 100%)",
            borderRadius: 8,
            borderLeft: "4px solid var(--indigo-2)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--slate-2)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.3px" }}>Summary</div>
          <div style={{ fontSize: 12, color: "var(--slate)", lineHeight: "1.8" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>Total Bill:</span>
              <span style={{ fontWeight: 600, color: "var(--indigo-2)" }}>{fmtRs(purchase.total)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>Paid:</span>
              <span style={{ fontWeight: 600, color: "var(--emerald-2)" }}>{fmtRs(purchase.paidAmount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Due:</span>
              <span style={{ fontWeight: 600, color: "var(--rose-2)" }}>{fmtRs(purchase.dueAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

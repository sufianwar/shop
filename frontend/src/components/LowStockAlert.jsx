
import React from "react";
import { useNavigate } from "react-router-dom";

export default function LowStockAlert({ products }) {
  const nav = useNavigate();
  if (!products || products.length === 0) return null;
  return (
    <div style={{
      background: "var(--amber-3)", border: "1px solid rgba(245,158,11,0.25)",
      borderRadius: "var(--radius)", padding: "14px 18px",
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, color: "var(--amber)", fontSize: 14 }}>
            {products.length} Low Stock Alert{products.length > 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
            {products.slice(0, 3).map(p => p.name).join(", ")}{products.length > 3 ? ` +${products.length - 3} more` : ""}
          </div>
        </div>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={() => nav("/products?lowStock=true")}>View All</button>
    </div>
  );
}


import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const TITLES = {
  "/": "Dashboard",
  "/sales": "Point of Sale",
  "/products": "Products",
  "/purchase": "Purchase",
  "/customers": "Customers",
  "/suppliers": "Suppliers",
  "/expenses": "Expenses",
  "/analytics": "Analytics",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function Navbar({ sidebarWidth }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = TITLES[pathname] || "POS";
  const now = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <header style={{
      position: "fixed", top: 0, right: 0,
      left: sidebarWidth,
      height: "var(--navbar-h)", zIndex: 99,
      background: "var(--glass)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center",
      padding: "0 24px", gap: 16,
      transition: "left 0.3s ease",
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>{title}</h1>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{now}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Quick Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 6,
          background: "var(--emerald-3)", border: "1px solid rgba(16,185,129,0.2)",
          padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, color: "var(--emerald)" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--emerald)", display: "inline-block" }} />
          Live
        </div>

        {/* User avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8,
          background: "var(--glass-2)", border: "1px solid var(--border)",
          padding: "6px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--indigo-3)", border: "2px solid var(--indigo)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "var(--indigo-2)",
          }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "capitalize" }}>{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

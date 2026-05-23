
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { path: "/", label: "Dashboard", icon: "📊", roles: ["admin", "manager", "cashier"] },
  { path: "/sales", label: "POS / Sales", icon: "🛒", roles: ["admin", "manager", "cashier"] },
  { path: "/products", label: "Products", icon: "📦", roles: ["admin", "manager"] },
  { path: "/categories", label: "Categories", icon: "📂", roles: ["admin", "manager"] },
  { path: "/customers", label: "Customers", icon: "👥", roles: ["admin", "manager", "cashier"] },
  { path: "/purchase", label: "Purchase", icon: "🏪", roles: ["admin", "manager"] },
  { path: "/suppliers", label: "Suppliers", icon: "🚚", roles: ["admin", "manager"] },
  { path: "/reports", label: "Reports", icon: "📋", roles: ["admin", "manager"] },
  { path: "/ledger", label: "Ledger", icon: "📓", roles: ["admin", "manager"] },
  { path: "/expenses", label: "Expenses", icon: "💸", roles: ["admin", "manager"] },
  { path: "/returns", label: "Returns", icon: "🔄", roles: ["admin", "manager", "cashier"] },
  { path: "/analytics", label: "Analytics", icon: "📈", roles: ["admin", "manager"] },
  { path: "/settings", label: "Settings", icon: "⚙️", roles: ["admin"] },
  { path: "/sales/deleted", label: "Deleted Receipts", icon: "🗑️", roles: ["admin"] },
];
export default function Sidebar({ collapsed, onToggle }) {
const { user, logout } = useAuth();
const visibleNav = NAV.filter(n => n.roles.includes(user?.role || "cashier"));

return (
  <aside style={{
    width: collapsed ? 72 : 260,
    background: "var(--bg-2)",
    borderRight: "1px solid var(--border)",
    height: "100vh",
    position: "fixed",
    top: 0, left: 0, zIndex: 100,
    display: "flex", flexDirection: "column",
    transition: "width 0.3s ease",
    overflow: "hidden",
  }}>
    {/* Brand */}
    <div style={{
      padding: collapsed ? "20px 0" : "20px 18px",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", gap: 12,
      justifyContent: collapsed ? "center" : "space-between",
      minHeight: 64,
    }}>
      {!collapsed && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: "var(--indigo)", lineHeight: 1.2 }}>MARHABA</div>
          <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>POS System</div>
        </div>
      )}
      {collapsed && <span style={{ fontSize: 22 }}>🏪</span>}
      <button onClick={onToggle} style={{
        width: 28, height: 28, borderRadius: 6, background: "var(--glass-2)",
        border: "1px solid var(--border)", color: "var(--muted)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, cursor: "pointer", flexShrink: 0,
      }}>
        {collapsed ? "▶" : "◀"}
      </button>
    </div>

    {/* User Info */}
    {!collapsed && (
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--indigo-3)", border: "2px solid var(--indigo)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "var(--indigo-2)",
          }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: "var(--indigo-2)", textTransform: "capitalize", fontWeight: 600 }}>{user?.role}</div>
          </div>
        </div>
      </div>
    )}

    {/* Navigation */}
    <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
      {visibleNav.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          style={({ isActive }) => ({
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : 12,
            padding: collapsed ? "12px 0" : "10px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: "var(--radius-sm)",
            marginBottom: 2,
            fontSize: 14, fontWeight: 500,
            color: isActive ? "var(--indigo-2)" : "var(--muted)",
            background: isActive ? "var(--indigo-3)" : "transparent",
            transition: "var(--transition)",
            textDecoration: "none",
          })}
          onMouseEnter={e => { if (!e.currentTarget.classList.contains("active")) e.currentTarget.style.background = "var(--glass-2)"; }}
          onMouseLeave={e => { if (!e.currentTarget.style.background?.includes("indigo")) e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      ))}
    </nav>

    {/* Logout */}
    <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
      <button
        onClick={logout}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          gap: collapsed ? 0 : 10, justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "10px 0" : "10px 12px",
          borderRadius: "var(--radius-sm)", background: "transparent",
          border: "none", color: "var(--muted)", fontSize: 14, cursor: "pointer",
          transition: "var(--transition)",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--rose-3)"; e.currentTarget.style.color = "var(--rose)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
      >
        <span style={{ fontSize: 18 }}>🚪</span>
        {!collapsed && <span style={{ fontWeight: 600 }}>Logout</span>}
      </button>
    </div>
  </aside>
);
}
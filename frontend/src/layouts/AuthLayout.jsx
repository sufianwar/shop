
import React from "react";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 60% 40%, rgba(99,102,241,0.12) 0%, var(--bg) 70%)",
      padding: 20,
    }}>
      <Outlet />
    </div>
  );
}

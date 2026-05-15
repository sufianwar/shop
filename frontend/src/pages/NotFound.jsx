
import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", textAlign: "center" }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>404</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>Page not found</p>
      <Link to="/" className="btn btn-primary">← Back to Dashboard</Link>
    </div>
  );
}

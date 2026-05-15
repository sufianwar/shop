
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "admin@pos.com", password: "admin123" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(form.email, form.password);
    if (res.success) {
      toast.success("Welcome back!");
      nav("/");
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: "var(--indigo-3)",
          border: "2px solid var(--indigo)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 30, margin: "0 auto 16px",
        }}>🏪</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: 0 }}>MARHABA POS</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>Professional Point of Sale System</p>
      </div>

      <div className="card" style={{ boxShadow: "var(--shadow-lg)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 22 }}>Sign In</h2>

        {error && (
          <div style={{
            background: "var(--rose-3)", border: "1px solid rgba(244,63,94,0.2)",
            borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--rose)", marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email" required className="form-input"
              placeholder="admin@pos.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password" required className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Signing in..." : "🔐 Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: "12px 14px", background: "var(--bg-2)", borderRadius: 8, fontSize: 12, color: "var(--muted)" }}>
          <div style={{ fontWeight: 700, color: "var(--text-2)", marginBottom: 4 }}>Default Credentials</div>
          <div>Email: admin@pos.com</div>
          <div>Password: admin123</div>
          <div style={{ marginTop: 4, fontSize: 11 }}>⚠️ Register a new admin account first if this is a fresh install</div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--muted)" }}>
        MARHABA PHOTOSTATE & COMPUTER — POS System v2.0
      </div>
    </div>
  );
}

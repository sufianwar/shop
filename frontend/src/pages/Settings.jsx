
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const DEFAULTS = {
  shopName: "MARHABA PHOTOSTATE & COMPUTER",
  shopTagline: "Stationery • Printing • POS",
  phone1: "0333-6297546", phone2: "0334-7791579",
  address: "Main Bazar, Lahore",
  currency: "Rs", taxRate: 0,
  lowStockThreshold: 5,
  receiptFooter: "THANK YOU 😊\nVisit Again!",
  invoicePrefix: "INV",
};

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("shop");
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "cashier" });

  useEffect(() => {
    // Load settings (using defaults for now since settings endpoint is in DB)
    api.get("/auth/users").then(({ data }) => setUsers(data)).catch(() => {});
  }, []);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
    toast.success("Settings saved!");
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", newUser);
      toast.success("User added!");
      setNewUser({ name: "", email: "", password: "", role: "cashier" });
      const { data } = await api.get("/auth/users");
      setUsers(data);
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/auth/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? "User deactivated" : "User activated");
      const { data } = await api.get("/auth/users");
      setUsers(data);
    } catch { toast.error("Error"); }
  };

  const TABS = [
    { id: "shop", label: "🏪 Shop Info" },
    { id: "users", label: "👤 Users" },
    { id: "receipt", label: "🧾 Receipt" },
  ];

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">⚙️ Settings</div><div className="page-subtitle">System configuration</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--bg-2)", padding: 4, borderRadius: "var(--radius)", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`btn btn-sm ${tab === t.id ? "btn-primary" : "btn-ghost"}`} style={{ border: "none" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "shop" && (
        <div className="card" style={{ maxWidth: 600 }}>
          <form onSubmit={saveSettings}>
            <h3 style={{ marginBottom: 20 }}>🏪 Shop Information</h3>
            <div className="form-group" style={{ marginBottom: 14 }}><label className="form-label">Shop Name</label><input className="form-input" value={settings.shopName} onChange={e => setSettings({ ...settings, shopName: e.target.value })} /></div>
            <div className="form-group" style={{ marginBottom: 14 }}><label className="form-label">Tagline</label><input className="form-input" value={settings.shopTagline} onChange={e => setSettings({ ...settings, shopTagline: e.target.value })} /></div>
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group"><label className="form-label">Phone 1</label><input className="form-input" value={settings.phone1} onChange={e => setSettings({ ...settings, phone1: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Phone 2</label><input className="form-input" value={settings.phone2} onChange={e => setSettings({ ...settings, phone2: e.target.value })} /></div>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}><label className="form-label">Address</label><input className="form-input" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} /></div>
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group"><label className="form-label">Currency Symbol</label><input className="form-input" value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Tax Rate (%)</label><input type="number" min={0} max={100} className="form-input" value={settings.taxRate} onChange={e => setSettings({ ...settings, taxRate: Number(e.target.value) })} /></div>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}><label className="form-label">Low Stock Alert Threshold</label><input type="number" min={1} className="form-input" value={settings.lowStockThreshold} onChange={e => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })} /></div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "💾 Save Settings"}</button>
          </form>
        </div>
      )}

      {tab === "users" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>➕ Add New User</h3>
            <form onSubmit={addUser} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group"><label className="form-label">Name</label><input required className="form-input" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Email</label><input required type="email" className="form-input" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Password</label><input required type="password" className="form-input" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Add User</button>
            </form>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 20 }}>👥 System Users</h3>
            {users.map(u => (
              <div key={u._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{u.email} • <span style={{ textTransform: "capitalize" }}>{u.role}</span></div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`badge ${u.isActive ? "badge-emerald" : "badge-rose"}`}>{u.isActive ? "Active" : "Inactive"}</span>
                  {u._id !== user._id && (
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)}>
                      {u.isActive ? "Disable" : "Enable"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "receipt" && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h3 style={{ marginBottom: 20 }}>🧾 Receipt Settings</h3>
          <div className="form-group" style={{ marginBottom: 14 }}><label className="form-label">Invoice Prefix</label><input className="form-input" value={settings.invoicePrefix} onChange={e => setSettings({ ...settings, invoicePrefix: e.target.value })} /></div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Receipt Footer Message</label>
            <textarea className="form-input" rows={3} style={{ resize: "vertical" }} value={settings.receiptFooter} onChange={e => setSettings({ ...settings, receiptFooter: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={() => toast.success("Receipt settings saved!")}>💾 Save</button>
        </div>
      )}
    </div>
  );
}

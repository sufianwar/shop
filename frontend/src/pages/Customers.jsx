
import React, { useState, useEffect, useCallback } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDateTime } from "../utils/dateFormat";
import toast from "react-hot-toast";
import api from "../api";

const EMPTY = { name: "", phone: "", email: "", address: "", notes: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [delItem, setDelItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/customers", { params: { search } });
      setCustomers(data);
    } catch { toast.error("Failed"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY); setEditItem(null); setShowModal(true); };
  const openEdit = (c) => { setForm({ ...c }); setEditItem(c); setShowModal(true); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editItem) { await api.put(`/customers/${editItem._id}`, form); toast.success("Updated"); }
      else { await api.post("/customers", form); toast.success("Customer added"); }
      setShowModal(false); load();
    } catch { toast.error("Error saving"); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/customers/${delItem._id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const columns = [
    { key: "name", label: "Name", render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email", render: v => v || "—" },
    { key: "totalPurchases", label: "Purchases", render: v => v || 0 },
    { key: "totalSpent", label: "Total Spent", render: v => <span style={{ color: "var(--emerald)", fontWeight: 700 }}>{fmtRs(v)}</span> },
    { key: "balance", label: "Balance", render: v => v > 0 ? <span className="badge badge-rose">{fmtRs(v)}</span> : <span className="badge badge-emerald">Clear</span> },
    { key: "_id", label: "Actions", render: (_, r) => (
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️</button>
        <button className="btn btn-danger btn-sm" onClick={() => setDelItem(r)}>🗑️</button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">👥 Customers</div><div className="page-subtitle">{customers.length} total</div></div>
        <div className="page-actions">
          <div className="search-box" style={{ width: 240 }}>
            <span className="search-icon">🔍</span>
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <Loader /> : <Table columns={columns} data={customers} emptyText="No customers yet" />}
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? "Edit Customer" : "Add Customer"}>
        <form onSubmit={save}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group"><label className="form-label">Name *</label><input required className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editItem ? "Update" : "Add"}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!delItem} onClose={() => setDelItem(null)} onConfirm={handleDelete} title="Delete Customer" message={`Delete "${delItem?.name}"?`} danger />
    </div>
  );
}

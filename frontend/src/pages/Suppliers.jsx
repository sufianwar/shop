
import React, { useState, useEffect, useCallback } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import { fmtRs } from "../utils/currencyFormat";
import toast from "react-hot-toast";
import api from "../api";

const EMPTY = { name: "", company: "", phone: "", email: "", address: "", notes: "" };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [delItem, setDelItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get("/suppliers"); setSuppliers(data); }
    catch { toast.error("Failed"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY); setEditItem(null); setShowModal(true); };
  const openEdit = (s) => { setForm({ ...s }); setEditItem(s); setShowModal(true); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editItem) { await api.put(`/suppliers/${editItem._id}`, form); toast.success("Updated"); }
      else { await api.post("/suppliers", form); toast.success("Supplier added"); }
      setShowModal(false); load();
    } catch { toast.error("Error"); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/suppliers/${delItem._id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const columns = [
    { key: "name", label: "Name", render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: "company", label: "Company", render: v => v || "—" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email", render: v => v || "—" },
    { key: "totalPurchased", label: "Total Purchased", render: v => <span style={{ color: "var(--emerald)", fontWeight: 700 }}>{fmtRs(v)}</span> },
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
        <div><div className="page-title">🚚 Suppliers</div><div className="page-subtitle">{suppliers.length} total</div></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Supplier</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <Loader /> : <Table columns={columns} data={suppliers} emptyText="No suppliers yet" />}
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? "Edit Supplier" : "Add Supplier"}>
        <form onSubmit={save}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group"><label className="form-label">Name *</label><input required className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editItem ? "Update" : "Add"}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!delItem} onClose={() => setDelItem(null)} onConfirm={handleDelete} title="Delete Supplier" message={`Delete "${delItem?.name}"?`} danger />
    </div>
  );
}

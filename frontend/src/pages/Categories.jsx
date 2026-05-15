import React, { useState, useEffect, useCallback } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import toast from "react-hot-toast";
import api from "../api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [delItem, setDelItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ name: "", description: "" }); setEditItem(null); setShowModal(true); };
  const openEdit = (c) => { setForm({ name: c.name, description: c.description || "" }); setEditItem(c); setShowModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/categories/${editItem._id}`, form);
        toast.success("Category updated");
      } else {
        await api.post("/categories", form);
        toast.success("Category added");
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${delItem._id}`);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDelItem(null);
    }
  };

  const columns = [
    { key: "name", label: "Category Name", render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: "description", label: "Description", render: v => v || "-" },
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
        <div>
          <div className="page-title">📁 Categories</div>
          <div className="page-subtitle">{categories.length} total categories</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}>+ Add Category</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <Table columns={columns} data={categories} loading={loading} emptyText="No categories found" />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? "✏️ Edit Category" : "➕ Add Category"}>
        <form onSubmit={save}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Category Name *</label>
            <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Description</label>
            <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editItem ? "Update" : "Add"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!delItem} onClose={() => setDelItem(null)} onConfirm={handleDelete}
        title="Delete Category" message={`Delete "${delItem?.name}"? This cannot be undone.`} danger
      />
    </div>
  );
}

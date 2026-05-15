
import React, { useState, useEffect, useCallback } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import { productService } from "../services/productService";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDateTime } from "../utils/dateFormat";
import toast from "react-hot-toast";
import { exportProductsPDF } from "../utils/exportPDF";
import { exportProductsExcel } from "../utils/exportExcel";
import api from "../api";

const EMPTY_FORM = { name: "", salePrice: 0, purchasePrice: 0, stock: 0, minStock: 5, categoryName: "General", barcode: "", unit: "pcs", description: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [delItem, setDelItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([productService.getAll({ search }), api.get("/categories")]);
      setProducts(pRes.data);
      setCategories(cRes.data);
    } catch { toast.error("Failed to load products"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditItem(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditItem(p); setShowModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) { await productService.update(editItem._id, form); toast.success("Product updated"); }
      else { await productService.add(form); toast.success("Product added"); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || "Error saving"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await productService.delete(delItem._id); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const filtered = products.filter(p => {
    const s = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    const c = catFilter === "All" || p.categoryName === catFilter;
    return s && c;
  });

  const allCats = ["All", ...new Set(products.map(p => p.categoryName).filter(Boolean))];

  const columns = [
    { key: "name", label: "Product", render: (v, r) => (
      <div>
        <div style={{ fontWeight: 600 }}>{v}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{r.barcode}</div>
      </div>
    )},
    { key: "categoryName", label: "Category", render: v => <span className="badge badge-indigo">{v}</span> },
    { key: "purchasePrice", label: "Buy Price", render: v => fmtRs(v) },
    { key: "salePrice", label: "Sale Price", render: v => <span style={{ fontWeight: 700, color: "var(--emerald)" }}>{fmtRs(v)}</span> },
    { key: "stock", label: "Stock", render: (v, r) => (
      <span className={`badge ${v <= r.minStock ? "badge-rose" : v <= 10 ? "badge-amber" : "badge-emerald"}`}>
        {v <= r.minStock && "⚠️ "}{v} {r.unit}
      </span>
    )},
    { key: "totalSold", label: "Sold", render: v => v || 0 },
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
          <div className="page-title">📦 Products</div>
          <div className="page-subtitle">{products.length} total products</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => exportProductsExcel(products)}>📊 Excel</button>
          <button className="btn btn-ghost btn-sm" onClick={() => exportProductsPDF(products)}>📄 PDF</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div className="search-box" style={{ flex: 1, minWidth: 220 }}>
            <span className="search-icon">🔍</span>
            <input placeholder="Search by name or barcode..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {allCats.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`btn btn-sm ${catFilter === c ? "btn-primary" : "btn-ghost"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <Table columns={columns} data={filtered} loading={loading} emptyText="No products found" />
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? "✏️ Edit Product" : "➕ Add Product"} size="lg">
        <form onSubmit={save}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.categoryName} onChange={e => setForm({ ...form, categoryName: e.target.value })}>
                <option>General</option>
                {categories.map(c => <option key={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Purchase Price (Rs)</label>
              <input type="number" min={0} className="form-input" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Sale Price (Rs) *</label>
              <input type="number" min={0} required className="form-input" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: Number(e.target.value) })} />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Stock Quantity</label>
              <input type="number" min={0} className="form-input" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Min Stock Alert</label>
              <input type="number" min={0} className="form-input" value={form.minStock} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Barcode (7-digit, auto-generated if empty)</label>
              <input className="form-input" style={{ fontFamily: "monospace" }} placeholder="1234567" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                <option value="pcs">pcs</option><option value="kg">kg</option>
                <option value="g">g</option><option value="ltr">ltr</option>
                <option value="box">box</option><option value="pack">pack</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Description</label>
            <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editItem ? "Update" : "Add Product"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!delItem} onClose={() => setDelItem(null)} onConfirm={handleDelete}
        title="Delete Product" message={`Delete "${delItem?.name}"? This cannot be undone.`} danger
      />
    </div>
  );
}

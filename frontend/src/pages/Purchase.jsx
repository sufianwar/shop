
import React, { useState, useEffect, useCallback } from "react";
import Modal from "../components/Modal";
import Table from "../components/Table";
import Loader from "../components/Loader";
import { purchaseService } from "../services/purchaseService";
import { productService } from "../services/productService";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDateTime } from "../utils/dateFormat";
import toast from "react-hot-toast";
import api from "../api";

export default function Purchase() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplierName: "", paymentMethod: "cash", notes: "", paidAmount: "" });
  const [pItems, setPItems] = useState([{ productId: "", name: "", qty: 1, purchasePrice: 0 }]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, prRes, sRes] = await Promise.all([
        purchaseService.getAll(), productService.getAll(), api.get("/suppliers"),
      ]);
      setPurchases(pRes.data);
      setProducts(prRes.data);
      setSuppliers(sRes.data);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addRow = () => setPItems(prev => [...prev, { productId: "", name: "", qty: 1, purchasePrice: 0 }]);
  const removeRow = (i) => setPItems(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i, key, val) => setPItems(prev => {
    const rows = [...prev];
    rows[i] = { ...rows[i], [key]: val };
    if (key === "productId") {
      const p = products.find(x => x._id === val);
      if (p) { rows[i].name = p.name; rows[i].purchasePrice = p.purchasePrice; }
    }
    return rows;
  });

  const total = pItems.reduce((s, i) => s + (i.qty * i.purchasePrice), 0);

  const save = async (e) => {
    e.preventDefault();
    if (!pItems.every(i => i.productId && i.qty > 0)) return toast.error("Fill all item rows");
    setSaving(true);
    try {
      await purchaseService.create({ ...form, items: pItems, paidAmount: form.paidAmount ? Number(form.paidAmount) : total });
      toast.success("Purchase added, stock updated!");
      setShowModal(false);
      setPItems([{ productId: "", name: "", qty: 1, purchasePrice: 0 }]);
      setForm({ supplierName: "", paymentMethod: "cash", notes: "", paidAmount: "" });
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: "purchaseNo", label: "Purchase No", render: v => <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--indigo-2)" }}>{v}</span> },
    { key: "supplierName", label: "Supplier" },
    { key: "items", label: "Items", render: v => `${v?.length || 0} items` },
    { key: "total", label: "Total", render: v => <span style={{ fontWeight: 700, color: "var(--emerald)" }}>{fmtRs(v)}</span> },
    { key: "paidAmount", label: "Paid", render: v => fmtRs(v) },
    { key: "paymentStatus", label: "Status", render: v => <span className={`badge ${v === "paid" ? "badge-emerald" : v === "partial" ? "badge-amber" : "badge-rose"}`}>{v}</span> },
    { key: "createdAt", label: "Date", render: v => <span style={{ fontSize: 12 }}>{fmtDateTime(v)}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">🏪 Purchase Orders</div><div className="page-subtitle">{purchases.length} purchases</div></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Purchase</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <Loader /> : <Table columns={columns} data={purchases} emptyText="No purchases yet" />}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="🏪 New Purchase" size="lg">
        <form onSubmit={save}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Supplier Name</label>
              <input className="form-input" placeholder="Supplier / Direct Purchase" value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="cash">Cash</option><option value="card">Card</option><option value="credit">Credit</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
              <span>Items</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addRow}>+ Add Row</button>
            </div>
            {pItems.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 28px", gap: 8, marginBottom: 8 }}>
                <select className="form-select" value={row.productId} onChange={e => updateRow(i, "productId", e.target.value)} required>
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input type="number" min={1} className="form-input" placeholder="Qty" value={row.qty} onChange={e => updateRow(i, "qty", Number(e.target.value))} />
                <input type="number" min={0} className="form-input" placeholder="Price" value={row.purchasePrice} onChange={e => updateRow(i, "purchasePrice", Number(e.target.value))} />
                <button type="button" onClick={() => removeRow(i)} style={{ background: "var(--rose-3)", border: "none", borderRadius: 6, color: "var(--rose)", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <div style={{ textAlign: "right", fontWeight: 700, color: "var(--emerald)", fontSize: 15 }}>Total: {fmtRs(total)}</div>
          </div>

          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Amount Paid (leave empty for full)</label>
              <input type="number" min={0} className="form-input" placeholder={total} value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Purchase"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

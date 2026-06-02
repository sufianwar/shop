
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import Table from "../components/Table";
import Loader from "../components/Loader";
import api from "../api";
import { productService } from "../services/productService";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDateTime, fmtDate } from "../utils/dateFormat";
import toast from "react-hot-toast";

export default function Purchase() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({
    supplierName: "",
    paymentMethod: "cash",
    notes: "",
    paidAmount: "",
    discount: "",
    discountRate: "",
    tax: "",
    taxRate: "",
  });
  const [pItems, setPItems] = useState([{ productId: "", name: "", qty: 1, purchasePrice: 0 }]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, prRes, sRes, statsRes] = await Promise.all([
        api.get("/purchases"),
        productService.getAll(),
        api.get("/suppliers"),
        api.get("/purchases/stats"),
      ]);
      setPurchases(pRes.data);
      setProducts(prRes.data);
      setSuppliers(sRes.data);
      setStats(statsRes.data);
    } catch { 
      toast.error("Failed to load"); 
    }
    finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    load(); 
  }, [load]);

  const addRow = () => setPItems(prev => [...prev, { productId: "", name: "", qty: 1, purchasePrice: 0 }]);
  const removeRow = (i) => setPItems(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i, key, val) => setPItems(prev => {
    const rows = [...prev];
    rows[i] = { ...rows[i], [key]: val };
    if (key === "productId") {
      const p = products.find(x => x._id === val);
      if (p) { 
        rows[i].name = p.name; 
        rows[i].purchasePrice = p.purchasePrice; 
      }
    }
    return rows;
  });

  const subtotal = pItems.reduce((s, i) => s + (i.qty * i.purchasePrice), 0);
  const discountAmount = form.discountRate ? (subtotal * form.discountRate) / 100 : Number(form.discount || 0);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = form.taxRate ? (afterDiscount * form.taxRate) / 100 : Number(form.tax || 0);
  const total = afterDiscount + taxAmount;

  const save = async (e) => {
    e.preventDefault();
    if (!pItems.every(i => i.productId && i.qty > 0)) return toast.error("Fill all item rows");
    setSaving(true);
    try {
      await api.post("/purchases", {
        ...form,
        items: pItems,
        paidAmount: form.paidAmount ? Number(form.paidAmount) : total,
        discount: discountAmount,
        discountRate: Number(form.discountRate || 0),
        tax: taxAmount,
        taxRate: Number(form.taxRate || 0),
      });
      toast.success("Purchase added successfully!");
      setShowModal(false);
      setPItems([{ productId: "", name: "", qty: 1, purchasePrice: 0 }]);
      setForm({
        supplierName: "",
        paymentMethod: "cash",
        notes: "",
        paidAmount: "",
        discount: "",
        discountRate: "",
        tax: "",
        taxRate: "",
      });
      load();
    } catch (err) { 
      toast.error(err.response?.data?.message || "Error"); 
    }
    finally { 
      setSaving(false); 
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "badge-rose";
      case "Partial":
        return "badge-amber";
      case "Paid":
        return "badge-emerald";
      default:
        return "badge-slate";
    }
  };

  const columns = [
    { 
      key: "purchaseNo", 
      label: "PO Number", 
      render: (v, row) => (
        <a 
          onClick={() => navigate(`/purchases/${row._id}`)}
          style={{ color: "var(--indigo-2)", cursor: "pointer", fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}
        >
          {v}
        </a>
      )
    },
    { key: "supplierName", label: "Supplier" },
    { key: "total", label: "Total Bill", render: v => <span style={{ fontWeight: 700, color: "var(--indigo-2)" }}>{fmtRs(v)}</span> },
    { key: "paidAmount", label: "Paid Amount", render: v => <span style={{ color: "var(--emerald)", fontWeight: 600 }}>{fmtRs(v)}</span> },
    { key: "dueAmount", label: "Due Amount", render: v => <span style={{ color: v > 0 ? "var(--rose)" : "var(--emerald)", fontWeight: 600 }}>{fmtRs(v)}</span> },
    { 
      key: "paymentStatus", 
      label: "Status", 
      render: v => <span className={`badge ${getStatusBadgeClass(v)}`}>{v}</span> 
    },
    { 
      key: "createdAt", 
      label: "Date", 
      render: v => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> 
    },
    {
      key: "_id",
      label: "Action",
      render: (v) => (
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => navigate(`/purchases/${v}`)}
        >
          View Details →
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📦 Purchase Orders</div>
          <div className="page-subtitle">{purchases.length} purchases</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Purchase</button>
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--slate-2)", marginBottom: 8 }}>Total POs</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.totalPurchaseOrders}</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--slate-2)", marginBottom: 8 }}>Total Amount</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--indigo-2)" }}>
              {fmtRs(stats.totalPurchaseAmount)}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--slate-2)", marginBottom: 8 }}>Total Paid</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--emerald)" }}>
              {fmtRs(stats.totalPaidAmount)}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--slate-2)", marginBottom: 8 }}>Outstanding Due</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--rose)" }}>
              {fmtRs(stats.totalOutstandingDue)}
            </div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--slate-2)", marginBottom: 8 }}>Pending Orders</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.totalPendingOrders}</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--slate-2)", marginBottom: 8 }}>Partial Orders</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--amber)" }}>{stats.totalPartialOrders}</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--slate-2)", marginBottom: 8 }}>Paid Orders</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--emerald)" }}>{stats.totalPaidOrders}</div>
          </div>
        </div>
      )}

      {/* Purchase List */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <Loader /> : <Table columns={columns} data={purchases} emptyText="No purchases yet" />}
      </div>

      {/* New Purchase Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="🏪 New Purchase Order" size="lg">
        <form onSubmit={save}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Supplier Name</label>
              <input 
                className="form-input" 
                placeholder="Supplier / Direct Purchase" 
                value={form.supplierName} 
                onChange={e => setForm({ ...form, supplierName: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select 
                className="form-select" 
                value={form.paymentMethod} 
                onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
                <option value="cheque">Cheque</option>
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
                <input type="number" min={0} step="0.01" className="form-input" placeholder="Price" value={row.purchasePrice} onChange={e => updateRow(i, "purchasePrice", Number(e.target.value))} />
                <button type="button" onClick={() => removeRow(i)} style={{ background: "var(--rose-3)", border: "none", borderRadius: 6, color: "var(--rose)", cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>

          {/* Bill Summary */}
          <div style={{ background: "var(--slate-1)", padding: 12, borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{fmtRs(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--emerald)" }}>
                <span>Discount</span>
                <span style={{ fontWeight: 600 }}>-{fmtRs(discountAmount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--rose)" }}>
                <span>Tax</span>
                <span style={{ fontWeight: 600 }}>+{fmtRs(taxAmount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--slate-2)", paddingTop: 8, fontWeight: 700, fontSize: 14 }}>
              <span>Total</span>
              <span style={{ color: "var(--indigo-2)" }}>{fmtRs(total)}</span>
            </div>
          </div>

          {/* Discount & Tax */}
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Discount %</label>
              <input type="number" min={0} max={100} step="0.01" className="form-input" placeholder="0" value={form.discountRate} onChange={e => setForm({ ...form, discountRate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">OR Discount Amount</label>
              <input type="number" min={0} step="0.01" className="form-input" placeholder="0" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tax %</label>
              <input type="number" min={0} max={100} step="0.01" className="form-input" placeholder="0" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">OR Tax Amount</label>
              <input type="number" min={0} step="0.01" className="form-input" placeholder="0" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} />
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Amount Paid (leave empty for full)</label>
              <input type="number" min={0} step="0.01" className="form-input" placeholder={fmtRs(total)} value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })} />
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

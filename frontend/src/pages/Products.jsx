
import React, { useState, useEffect, useCallback, useRef } from "react";
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

  // Barcode scanner states
  const [barcodeFocused, setBarcodeFocused] = useState(false);
  const [barcodeError, setBarcodeError] = useState("");
  const [barcodeChecking, setBarcodeChecking] = useState(false);
  const [barcodeValid, setBarcodeValid] = useState(false);
  const barcodeInputRef = useRef(null);
  const scanBufferRef = useRef("");
  const scanTimerRef = useRef(null);
  const checkTimerRef = useRef(null);

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

  // Reset barcode validation state when modal opens/closes
  useEffect(() => {
    if (!showModal) {
      setBarcodeError("");
      setBarcodeChecking(false);
      setBarcodeValid(false);
      scanBufferRef.current = "";
    }
  }, [showModal]);

  // Debounced barcode uniqueness check
  const validateBarcode = useCallback((barcode, excludeId) => {
    setBarcodeError("");
    setBarcodeValid(false);

    if (!barcode || barcode.trim() === "") {
      setBarcodeChecking(false);
      return;
    }

    clearTimeout(checkTimerRef.current);
    setBarcodeChecking(true);
    checkTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await productService.checkBarcode(barcode, excludeId);
        if (data.exists) {
          setBarcodeError(`⚠️ Barcode "${barcode}" is already assigned to "${data.product.name}"`);
          setBarcodeValid(false);
        } else {
          setBarcodeError("");
          setBarcodeValid(true);
        }
      } catch {
        // If check fails, allow save and let server-side validation handle it
        setBarcodeValid(true);
      }
      setBarcodeChecking(false);
    }, 400);
  }, []);

  // Handle barcode field keydown — detect scanner input (rapid sequential keystrokes)
  const handleBarcodeKeyDown = useCallback((e) => {
    // Scanner sends characters rapidly followed by Enter
    if (e.key === "Enter") {
      e.preventDefault();
      const scanned = scanBufferRef.current.trim();
      if (scanned.length >= 3) {
        // Apply scanned value
        setForm(prev => ({ ...prev, barcode: scanned }));
        validateBarcode(scanned, editItem?._id);
        toast.success(`📷 Barcode scanned: ${scanned}`, { duration: 2000, icon: "✅" });
      }
      scanBufferRef.current = "";
      clearTimeout(scanTimerRef.current);
      return;
    }

    // Build scan buffer — scanner input arrives within ~50ms between keystrokes
    if (e.key.length === 1) {
      scanBufferRef.current += e.key;
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = setTimeout(() => {
        // Reset buffer after pause (human typing speed)
        scanBufferRef.current = "";
      }, 100);
    }
  }, [editItem, validateBarcode]);

  // Handle manual barcode input changes
  const handleBarcodeChange = (e) => {
    const val = e.target.value;
    setForm({ ...form, barcode: val });
    validateBarcode(val, editItem?._id);
  };

  const openAdd = () => { setForm(EMPTY_FORM); setEditItem(null); setBarcodeError(""); setBarcodeValid(false); setShowModal(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditItem(p); setBarcodeError(""); setBarcodeValid(false); setShowModal(true); };

  const save = async (e) => {
    e.preventDefault();
    if (barcodeError) {
      toast.error("Please fix the barcode error before saving");
      barcodeInputRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      if (editItem) { await productService.update(editItem._id, form); toast.success("Product updated"); }
      else { await productService.add(form); toast.success("Product added"); }
      setShowModal(false); load();
    } catch (err) {
      const msg = err.response?.data?.message || "Error saving";
      if (err.response?.data?.duplicateBarcode) {
        setBarcodeError(`⚠️ ${msg}`);
        barcodeInputRef.current?.focus();
      }
      toast.error(msg);
    }
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

  // Barcode field border color based on validation state
  const barcodeBorderColor = barcodeError
    ? "var(--rose, #e11d48)"
    : barcodeValid && form.barcode
    ? "var(--emerald, #10b981)"
    : barcodeFocused
    ? "var(--primary, #6366f1)"
    : undefined;

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

          {/* Enhanced Barcode Field with Scanner Support */}
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>📊 Barcode</span>
                <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>
                  {editItem ? "" : "(auto-generated if empty)"}
                </span>
                {barcodeFocused && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "var(--primary, #6366f1)",
                    background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: 10,
                    animation: "pulse 2s infinite",
                  }}>
                    📷 Scanner Ready
                  </span>
                )}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  ref={barcodeInputRef}
                  id="barcode-input"
                  className="form-input"
                  style={{
                    fontFamily: "monospace",
                    fontSize: 15,
                    letterSpacing: 2,
                    paddingRight: 40,
                    borderColor: barcodeBorderColor,
                    borderWidth: barcodeError || (barcodeValid && form.barcode) ? 2 : undefined,
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: barcodeFocused ? `0 0 0 3px rgba(99,102,241,0.15)` : undefined,
                  }}
                  placeholder="Scan or type barcode..."
                  value={form.barcode}
                  onChange={handleBarcodeChange}
                  onKeyDown={handleBarcodeKeyDown}
                  onFocus={() => setBarcodeFocused(true)}
                  onBlur={() => setBarcodeFocused(false)}
                  autoComplete="off"
                />
                {/* Status indicator */}
                <span style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 16, pointerEvents: "none",
                }}>
                  {barcodeChecking ? "⏳" : barcodeError ? "❌" : barcodeValid && form.barcode ? "✅" : ""}
                </span>
              </div>
              {/* Error message */}
              {barcodeError && (
                <div style={{
                  marginTop: 6, fontSize: 12, color: "var(--rose, #e11d48)",
                  fontWeight: 500, display: "flex", alignItems: "center", gap: 4,
                  background: "rgba(225,29,72,0.06)", padding: "6px 10px", borderRadius: 6,
                }}>
                  {barcodeError}
                </div>
              )}
              {/* Success message */}
              {barcodeValid && form.barcode && !barcodeError && (
                <div style={{
                  marginTop: 6, fontSize: 11, color: "var(--emerald, #10b981)",
                  fontWeight: 500,
                }}>
                  ✅ Barcode is available
                </div>
              )}
              {/* Scanner hint */}
              <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted)" }}>
                💡 Click here and scan with USB scanner — value fills automatically
              </div>
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
            <button type="submit" className="btn btn-primary" disabled={saving || !!barcodeError || barcodeChecking}>
              {saving ? "Saving..." : editItem ? "Update" : "Add Product"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!delItem} onClose={() => setDelItem(null)} onConfirm={handleDelete}
        title="Delete Product" message={`Delete "${delItem?.name}"? This cannot be undone.`} danger
      />

      {/* Pulse animation for scanner indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

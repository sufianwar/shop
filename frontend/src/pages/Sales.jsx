
import React, { useState, useEffect } from "react";
import api from "../api";
import ProductCard from "../components/ProductCard";
import Cart from "../components/Cart";
import BarcodeScanner from "../components/BarcodeScanner";
import Modal from "../components/Modal";
import Receipt from "../components/Receipt";
import Loader from "../components/Loader";
import { useCart } from "../context/CartContext";
import { useProducts } from "../hooks/useProducts";
import { productService } from "../services/productService";
import { salesService } from "../services/salesService";
import toast from "react-hot-toast";
import "../styles/sales.css";
import { fmtRs } from "../utils/currencyFormat";

export default function Sales() {
  const { products, loading, reload } = useProducts();
  const { items, addItem, clearCart, total, discount } = useCart();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [payMethod, setPayMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [processing, setProcessing] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerName, setCustomerName] = useState("Walk-in Customer");

  useEffect(() => {
    api.get("/customers").then(({ data }) => setCustomers(data)).catch(() => { });
  }, []);

  const handleBarcode = async (code) => {
    try {
      const { data } = await productService.getByBarcode(code);
      addItem(data);
    } catch {
      toast.error(`Product not found: ${code}`);
    }
  };

  const cats = ["All", ...new Set(products.map(p => p.categoryName).filter(Boolean))];
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    const matchCat = catFilter === "All" || p.categoryName === catFilter;
    return matchSearch && matchCat;
  });

  const handleCheckout = async () => {
    if (!items.length) return;
    setProcessing(true);
    try {
      const paid = amountPaid ? Number(amountPaid) : total;
      const { data } = await salesService.create({
        items, discount,
        customer: selectedCustomer || undefined,
        customerName: selectedCustomer ? customers.find(c => c._id === selectedCustomer)?.name : customerName,
        paymentMethod: payMethod,
        amountPaid: paid,
      });
      setLastSale(data);
      clearCart();
      setShowCheckout(false);
      setShowReceipt(true);
      reload();
      toast.success(`Sale completed! Invoice: ${data.invoiceNo}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  const change = amountPaid ? Math.max(0, Number(amountPaid) - total) : 0;

  return (
    <div className="pos-layout">
      {/* Left: Products */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
        {/* Barcode + Search */}
        <div className="card" style={{ padding: 14 }}>
          <BarcodeScanner onResult={handleBarcode} />
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
              <span className="search-icon">🔍</span>
              <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ minWidth: 150 }}>
              <select 
                className="form-select" 
                value={catFilter} 
                onChange={(e) => setCatFilter(e.target.value)}
              >
                {cats.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? <Loader /> : (
          <div className="product-grid">
            {filtered.map(p => <ProductCard key={p._id} product={p} onClick={addItem} />)}
            {!filtered.length && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--muted)", padding: 40 }}>
                📭 No products found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <Cart onCheckout={() => setShowCheckout(true)} />

      {/* Checkout Modal */}
      <Modal isOpen={showCheckout} onClose={() => setShowCheckout(false)} title="💳 Checkout" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg-2)", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "var(--muted)" }}>
              <span>Items</span><span>{items.length}</span>
            </div>
            {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "var(--rose)" }}>
              <span>Discount</span><span>-{fmtRs(discount)}</span>
            </div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, color: "var(--emerald)" }}>
              <span>Total</span><span>{fmtRs(total)}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select className="form-select" value={selectedCustomer} onChange={e => {
              setSelectedCustomer(e.target.value);
              if (!e.target.value) setCustomerName("Walk-in Customer");
            }}>
              <option value="">Walk-in Customer</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>
          {!selectedCustomer && (
            <div className="form-group">
              <label className="form-label">Customer Name (Optional)</label>
              <input className="form-input" placeholder="Walk-in Customer" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
              <option value="cash">💵 Cash</option>
              <option value="card">💳 Card</option>
              <option value="online">📱 Online Transfer</option>
              <option value="credit">📋 Credit</option>
            </select>
          </div>
          {payMethod !== "credit" && (
            <div className="form-group">
              <label className="form-label">Amount Received (Rs)</label>
              <input type="number" className="form-input" placeholder={total} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
              {change > 0 && <div style={{ marginTop: 6, fontSize: 13, color: "var(--emerald)", fontWeight: 700 }}>💵 Change: {fmtRs(change)}</div>}
            </div>
          )}
          <div className="modal-footer">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowCheckout(false)}>Cancel</button>
            <button className="btn btn-success" onClick={handleCheckout} disabled={processing}>
              {processing ? "Processing..." : "✅ Confirm Sale"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} title="🧾 Receipt" size="sm">
        {lastSale && <Receipt sale={lastSale} onClose={() => setShowReceipt(false)} />}
      </Modal>
    </div>
  );
}

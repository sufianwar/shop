
import React from "react";
import { useCart } from "../context/CartContext";
import { fmtRs } from "../utils/currencyFormat";

export default function Cart({ onCheckout }) {
  const { items, removeItem, updateQty, updatePrice, subtotal, discount, setDiscount, total, itemCount, clearCart } = useCart();

  return (
    <div className="cart-panel">
      <div className="cart-header">
        <span>🛒 Cart {itemCount > 0 && <span className="badge badge-indigo" style={{ marginLeft: 8 }}>{itemCount}</span>}</span>
        {items.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearCart} style={{ fontSize: 12 }}>Clear</button>
        )}
      </div>

      <div className="cart-items">
        {items.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 20px", fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div>
            Scan or click a product to add it
          </div>
        ) : (
          items.map((item) => (
            <div key={item.productId} className="cart-item">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div className="cart-item-name" style={{ flex: 1, marginRight: 8, marginBottom: 0 }}>{item.name}</div>
                <button
                  onClick={() => removeItem(item.productId)}
                  style={{ color: "var(--rose)", background: "none", border: "none", fontSize: 14, cursor: "pointer", padding: "0 2px" }}
                >✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Qty</span>
                  <input type="number" min={1} className="form-input" style={{ padding: "2px 6px", height: 28, fontSize: 13 }} value={item.qty} onChange={(e) => updateQty(item.productId, Number(e.target.value))} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Price</span>
                  <input type="number" min={0} className="form-input" style={{ padding: "2px 6px", height: 28, fontSize: 13 }} value={item.salePrice} onChange={(e) => updatePrice(item.productId, Number(e.target.value))} />
                </div>
                <div className="cart-item-total" style={{ textAlign: "right" }}>{fmtRs(item.subtotal)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-footer">
        {/* Discount */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap" }}>Discount (Rs)</span>
          <input
            type="number" min={0} max={subtotal}
            className="form-input" style={{ fontSize: 13 }}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
          />
        </div>

        <div className="divider" style={{ margin: "4px 0" }} />
        <div className="cart-total-row"><span style={{ fontSize: 13, color: "var(--muted)" }}>Subtotal</span><span style={{ fontWeight: 700 }}>{fmtRs(subtotal)}</span></div>
        {discount > 0 && <div className="cart-total-row"><span style={{ fontSize: 13, color: "var(--rose)" }}>Discount</span><span style={{ color: "var(--rose)", fontWeight: 700 }}>-{fmtRs(discount)}</span></div>}
        <div className="cart-total-row">
          <span style={{ fontSize: 15, fontWeight: 700 }}>TOTAL</span>
          <span className="cart-grand-total">{fmtRs(total)}</span>
        </div>

        <button
          className="btn btn-success btn-lg w-full"
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          💳 Checkout
        </button>
      </div>
    </div>
  );
}

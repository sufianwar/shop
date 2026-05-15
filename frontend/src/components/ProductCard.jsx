
import React from "react";
import { useCart } from "../context/CartContext";
import { fmtRs } from "../utils/currencyFormat";

export default function ProductCard({ product, onClick }) {
  const { items } = useCart();
  const inCart = items.find((i) => i.productId === product._id);
  const isOut = product.stock < 1;

  return (
    <div
      className={`product-tile${isOut ? " out-of-stock" : ""}`}
      onClick={() => !isOut && onClick?.(product)}
      style={{ position: "relative" }}
    >
      {inCart && (
        <div style={{
          position: "absolute", top: 6, right: 6,
          background: "var(--indigo)", color: "#fff",
          borderRadius: 99, width: 20, height: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700,
        }}>
          {inCart.qty}
        </div>
      )}
      <div style={{ fontSize: 32 }}>
        {product.categoryName === "Stationery" ? "✏️" :
         product.categoryName === "Paper" ? "📄" :
         product.categoryName === "Electronics" ? "💻" : "📦"}
      </div>
      <div className="p-name">{product.name}</div>
      <div className="p-price">{fmtRs(product.salePrice)}</div>
      <div className="p-stock" style={{ color: product.stock <= 5 ? "var(--rose)" : "var(--muted)" }}>
        Stock: {product.stock} {product.unit}
      </div>
      {product.barcode && (
        <div style={{ fontSize: 10, color: "var(--muted-2)", marginTop: 4, fontFamily: "monospace" }}>
          {product.barcode}
        </div>
      )}
    </div>
  );
}

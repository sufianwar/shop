
import React, { createContext, useContext, useState, useCallback } from "react";
import toast from "react-hot-toast";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("Walk-in Customer");

  const addItem = useCallback((product) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.productId === product._id);
      if (exists) {
        if (exists.qty >= product.stock) {
          toast.error(`Max stock reached for ${product.name}`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === product._id ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.salePrice } : i
        );
      }
      if (product.stock < 1) { toast.error("Out of stock"); return prev; }
      toast.success(`${product.name} added`, { duration: 800 });
      return [...prev, {
        productId: product._id, name: product.name, barcode: product.barcode,
        salePrice: product.salePrice, purchasePrice: product.purchasePrice,
        qty: 1, subtotal: product.salePrice, maxStock: product.stock,
      }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty < 1) return removeItem(productId);
    setItems((prev) =>
      prev.map((i) => i.productId === productId ? { ...i, qty, subtotal: qty * i.salePrice } : i)
    );
  }, [removeItem]);

  const updatePrice = useCallback((productId, newPrice) => {
    setItems((prev) =>
      prev.map((i) => i.productId === productId ? { ...i, salePrice: newPrice, subtotal: i.qty * newPrice } : i)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]); setDiscount(0); setCustomerName("Walk-in Customer");
  }, []);

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, updatePrice, clearCart,
      discount, setDiscount, customerName, setCustomerName,
      subtotal, total, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

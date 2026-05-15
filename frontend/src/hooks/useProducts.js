
import { useState, useEffect, useCallback } from "react";
import api from "../api";
import toast from "react-hot-toast";

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const { data } = await api.get("/products", { params });
      setProducts(data);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { products, loading, reload: load };
};
